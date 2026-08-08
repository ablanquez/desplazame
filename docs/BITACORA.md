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

## [2026-08-02] — Mi contraprueba de laxitud pasó 8 de 8 y no probaba nada: había inventado disparates

**Categoría:** instrumento / control
**Síntoma:** el emparejador de nombres municipal↔OSM pasó **las dos** contrapruebas que le puse:
las cuatro familias de excepción conocidas (5 de 6) y **ocho nombres inventados, rechazados 8 de 8**.
Con los dos verdes en la mano, el emparejador estaba listo. Después, en la **muestra al azar** —15
vías sacadas del universo real con semilla `20260802`— apareció esto:

```
PLAZA ESPAÑA ---GRP        ->  EXACTA  ->  "Avenida de España"      ⛔ ni el tipo ni el sitio
CAMINO DEL CASCAJO ---SJN  ->  EXACTA  ->  "Calle Cascajo"          ⛔ probablemente otra calle
CALLE BUENOS AIRES ---SGR  ->  EXACTA  ->  "Avenida Buenos Aires"   ⛔ idem
```

Y al mirar el callejero entero, la razón de fondo:

```
PLAZA ESPAÑA            (urbana)         41.65167, -0.88129
PLAZA ESPAÑA ---ALF     (Alfocea)        41.72415, -0.95196
PLAZA ESPAÑA ---CRT     (Cartuja)        41.60521, -0.82245
PLAZA ESPAÑA ---CST     (Casetas)        41.71936, -1.02680
PLAZA ESPAÑA ---GRP     (Garrapinillos)  41.68411, -1.02599
PLAZA ESPAÑA ---MNZ     (Monzalbarba)    41.70297, -0.96778
PLAZA ESPAÑA ---PÑF     (Peñaflor)       41.76118, -0.79655
PLAZA ESPAÑA ---SJN     (S.Juan Mozarrifar) 41.71729, -0.84139
```

**Ocho plazas distintas con el mismo nombre, repartidas en 20 km.** Ninguna comparación de nombres
puede distinguirlas, por buena que sea.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **una contraprueba negativa hecha de
imposibles.** Inventé `CALLE ZURRIBURRI DEL PAMPANO`, `AVENIDA DEL TRASGO MELIFLUO`, `PLAZA DE LOS
BATRACIOS SILENTES`… y las ocho fueron rechazadas. **Claro que fueron rechazadas: no se parecen a
nada.** Un control negativo de disparates mide si el emparejador rechaza lo absurdo, que es lo
único que no estaba en duda. **La laxitud no vive en los disparates: vive en los CASI-ACIERTOS** —
`Plaza España` contra `Avenida de España`, dos calles reales, ambas en el dato, a un tipo de vía de
distancia.
Y el segundo verde: **la contraprueba de las cuatro familias también pasó**, 5 de 6. Dos controles
distintos en verde, y el instrumento equivocándose en una tercera clase de error que ninguno de los
dos miraba.
**Causa raíz:** el normalizador **descarta el tipo de vía** (`CALLE`, `PLAZA`, `AVENIDA`) para poder
resolver la familia de los sufijos rurales, y al descartarlo pierde justo lo que separa
`Plaza España` de `Avenida de España`. Es un intercambio, no un descuido — pero estaba sin declarar
y sin medir.
**Cómo se cazó:** por la **muestra al azar**, que es la contraprueba que no elegí yo. De 15 vías,
tres emparejamientos sospechosos. Ninguna de mis dos contrapruebas los habría enseñado nunca.
**Arreglo aplicado:** el emparejador se corrige **antes de mirar ningún total** —y se declara que se
corrigió—: (1) si los tipos de vía difieren, el resultado baja a `DUDOSA`, no cuenta como
encontrada; (2) toda vía con sufijo rural `---XXX` **exige confirmación geométrica**, porque su
nombre es homónimo por diseño. Y la contraprueba de laxitud se rehace **con casi-aciertos reales
sacados del propio dato**, no con inventos.
⭐ **Consecuencia mayor para la tanda:** el barrido geométrico deja de ser "la otra comprobación" y
pasa a ser **la comprobación**. Con ocho `PLAZA ESPAÑA` en el término, el nombre no es un
identificador: es una etiqueta que se repite.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **un control negativo hecho de imposibles no mide nada.** Si los casos
que se plantan para que fallen son absurdos, sólo se comprueba que el instrumento no está roto del
todo. **El control negativo tiene que estar hecho de CASI-ACIERTOS**, y los casi-aciertos hay que
sacarlos del propio universo —dos registros reales que se parecen— porque son los únicos que
recorren la frontera donde el instrumento decide. Es la ley nº33 (*el control no lo elige quien
escribió el instrumento*) llevada un paso más allá: **tampoco lo inventa.**
**Traza:** `data/exploracion/2026-08-02_wfs_urbanismo-Vias_completa-4326.json` (3.359 vías con
`barrio_rural`), `2026-08-02_osm_overpass_zaragoza-termino_nombres.json` (19.897 ways con nombre)

## [2026-08-02] — El barrido geométrico daba 98,3 % de cobertura, y con el callejero movido 2 km daba 58 %

**Categoría:** medición / instrumento
**Síntoma:** para medir cuánta ciudad falta en OSM, el barrido geométrico muestrea cada eje del
callejero municipal cada 25 m y comprueba si hay algún segmento de OSM a menos de 20 m. Resultado:

```
vias con >=50 % de su eje cubierto:  3.283 de 3.341  =  98,3 %
mediana de cobertura por via      :  100 %
```

Un número redondo, tranquilizador, y **listo para cerrar la decisión D0 con un "OSM cubre el 98 %"**.
Antes de firmarlo, la contraprueba obligatoria: **desplazar el callejero entero y volver a medir.**

```
desplazamiento    vias con >=50 % cubierto (de 399)
sin desplazar               394
50 m al norte               330
200 m al norte              294
2 km al norte           ⛔  231   =  58 %
```

**Con el callejero municipal movido DOS KILÓMETROS al norte, el 58 % de las vías seguía saliendo
"cubierta".** El instrumento no medía correspondencia entre calles: medía **densidad urbana**. En
una ciudad, cualquier línea está a menos de 20 m de alguna calle, apunte a donde apunte.
**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la sensibilidad al umbral, que es
justo la comprobación que uno hace.** Se midió con 5, 10, 15, 20, 30 y 50 m:

```
5 m -> 96,0 %      10 m -> 97,4 %      15 m -> 97,9 %
20 m -> 98,3 %     30 m -> 98,8 %      50 m -> 99,3 %
```

**Estable en todo el rango.** Y la estabilidad se lee como robustez: *"da igual el umbral que
elija, sale lo mismo, luego el resultado no depende de un número arbitrario"*. Es exactamente al
revés — salía lo mismo **porque el umbral no era la variable que mandaba**. Un barrido de
sensibilidad recorre el parámetro que sospechas y **certifica el instrumento en el eje equivocado**.
**Causa raíz:** el criterio *"hay algo de OSM cerca"* no distingue **la misma calle** de **otra
calle que pasa cerca**. Sin exigir dirección, una perpendicular a 4 m cuenta igual que la propia
calle.
**Cómo se cazó:** por la contraprueba de desplazamiento, que estaba en el método de la tanda y no en
mi intuición. **No sospeché del número: apliqué el procedimiento.**
**Arreglo aplicado:** instrumento v2 con **dos** cambios: umbral estrecho (**5 m**) y **exigencia de
paralelismo** (rumbo dentro de ±30°). Con él, la línea base desplazada se hunde y aparece señal:

```
                  U=5 m    U=10 m   U=15 m   U=20 m
sin desplazar     92,2 %   95,2 %   96,2 %   97,0 %
2 km al norte      5,0 %   11,8 %   18,5 %   30,6 %
```

⭐ **A 5 m: señal 92,2 %, azar 5,0 %.** A 20 m el azar es 30,6 % y el instrumento vuelve a no valer.
**El umbral no se eligió por fino: se eligió por dónde la medición separa la señal del ruido.**
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **una cobertura sin línea base no es una medición.** Todo barrido que
responda *"¿hay X donde esperaba X?"* tiene que ir acompañado del mismo barrido **sobre datos
deliberadamente equivocados** —desplazados, barajados, invertidos—, y **publicar los dos números
juntos**. Un 98 % contra un azar del 58 % es un 98 % que no dice nada; un 92 % contra un azar del
5 % es una medición.
⚠️ Y la ley menor, que en este proyecto ya va tres veces: **un barrido de sensibilidad no es una
contraprueba.** Mover el parámetro que sospechas confirma que ese parámetro no manda; no dice nada
del que sí manda, porque ese no lo has movido.
**Traza:** `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_geometria.json` (55.452 ways,
34 MB, **no publicado por peso** — ver `docs/COBERTURA-OSM-VS-CALLEJERO.md` §E),
`2026-08-02_wfs_urbanismo-Vias_completa-4326.json` (3.359 vías)

---

## [2026-08-02] — El nombre no es un identificador, y lo volví a usar como tal: fusioné cinco Plaza de España de OSM en un solo objeto

**Categoría:** instrumento / identidad del objeto
**Síntoma:** el emparejador por nube de portales (tanda 4) asignaba **el mismo objeto OSM** a cinco
vías municipales distintas, separadas entre sí por kilómetros:

```
cod 10800  PLAZA ESPAÑA          (urbana)  -> EMPAREJADA  n= 8  cons 0,50  -> "Plaza de España"
cod 10840  PLAZA ESPAÑA ---CRT             -> EMPAREJADA  n=11  cons 0,55  -> "Plaza de España"
cod 10860  PLAZA ESPAÑA ---CST             -> EMPAREJADA  n= 6  cons 1,00  -> "Plaza de España"
cod 10880  PLAZA ESPAÑA ---GRP             -> EMPAREJADA  n=12  cons 0,83  -> "Plaza de España"
cod 10920  PLAZA ESPAÑA ---PÑF             -> EMPAREJADA  n= 6  cons 0,83  -> "Plaza de España"
```

**Causa raíz:** al construir los candidatos agrupé la geometría de OSM **por el valor de `name`**,
globalmente y sin mirar dónde está cada trozo. OSM tiene **cinco** Plaza de España en el término
—una por barrio rural—, y mi agrupador las cosió en un único objeto que se extiende 20 km. La nube
de portales **sí estaba distinguiendo bien**: cada una votaba a su plaza. Era el candidato el que
no existía como cosa separada. **Es la ley nº36 —*el nombre no es un identificador, es una etiqueta
que se repite*— aplicada por mí a OSM el día después de descubrirla en el callejero municipal.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la contraprueba de
desplazamiento entera**, que es la ley mayor de la tanda anterior y la que el método declaraba
obligatoria:

```
                                   EMPAREJADA
señal (portales reales)              86,1 %
portales +2 km al norte              21,3 %
nubes teletransportadas al azar       6,0 %
```

Se hunde limpiamente, 4× y 14×, y **firma un instrumento que tiene dentro una fusión de homónimos.**
Y la razón de que no lo vea es estructural, no mala suerte: **desplazar 2 km no acerca dos homónimos
que están a 20 km**. La contraprueba de desplazamiento comprueba que el instrumento sabe *dónde*
está la cosa; **no comprueba que sepa *cuántas* cosas hay**. Son dos preguntas distintas y yo tenía
verde solo en la primera.

**Cómo se cazó:** por el banco de pruebas que Antonio dejó puesto en el briefing —*"las ocho PLAZA
ESPAÑA: ¿la nube las distingue?"*—. **No lo cacé mirando el resultado global, que era bueno:** lo
cacé porque había un caso concreto y conocido al que estaba obligado a mirarle la cara. El total
(86,1 %) no habría delatado nunca a 5 vías de 2.731.

**Arreglo aplicado:** el candidato deja de ser un `name` y pasa a ser un **grupo de ways del mismo
nombre espacialmente encadenados** (unión por nodo compartido o por extremos a ≤150 m). Un nombre
puede dar varios candidatos; dos plazas homónimas a 20 km son dos objetos.
**Contraprueba del arreglo:** las tres pasadas se repiten enteras, y las ocho Plaza España tienen
que salir con ocho objetos OSM distintos.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **una contraprueba de posición no es una contraprueba de identidad.**
Que el instrumento falle con el dato movido demuestra que usa la geometría; **no demuestra que los
objetos con los que empareja sean objetos**. Hay que comprobar aparte, y con casos conocidos, que
dos cosas distintas del mundo no se han convertido en una sola dentro del instrumento.
⚠️ Y la de andar por casa, que ya va dos veces en dos días: **cada vez que agrupo algo por su
nombre, tengo que preguntarme cuántos homónimos tiene ese nombre.** En Zaragoza, ocho.
**Traza:** `t4_nube.py` §A6 (script desechable), `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_nombres.json`

---

## [2026-08-02] — El 90,4 % del lado de la calle llevaba dentro 120 ways que aciertan sin acertar nada

**Categoría:** instrumento / control
**Síntoma:** primera medición de si la paridad del número predice el lado de la calle, sobre 1.409
ways de OSM con ≥6 portales y ambas paridades presentes:

```
SEÑAL (paridad real)       media 0,975   >=0,90: 90,4 %   =1,00: 81,6 %
⭐ LÍNEA BASE (barajada)    media 0,706   >=0,90: 12,0 %   =1,00:  9,9 %
```

Un 90,4 % contra 12,0 %. **Número listo para reportar**, y con su línea base al lado, que es la ley
nº37 de ayer cumplida al pie de la letra.

**Causa raíz:** en un way donde **todos** los portales caen al mismo lado del eje, la regla *"a cada
paridad se le asigna su signo mayoritario"* acierta el 100 % **con cualquier asignación de
paridades**, incluida una barajada. No mide nada: la pregunta no se puede hacer ahí. Había **120
ways así** dentro del universo, inflando las dos columnas a la vez.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **la línea base barajada**, que es
justo el control que la ley de ayer declara obligatorio. Dio 12,0 % contra 90,4 % —una separación
enorme— **y llevaba dentro el mismo artefacto que estaba certificando**. Una línea base construida
sobre un universo contaminado hereda la contaminación: baraja el dato, no el universo.

**Cómo se cazó:** por la costura del briefing —*"si D2 sale muy bien, sospecha"*—, no por el
instrumento. Me obligué a preguntar *"¿de qué manera trivial se puede sacar un 1,00 aquí?"* y la
respuesta apareció en un minuto.

**Arreglo aplicado:** el universo pasa a exigir **ambas paridades Y ambos lados ocupados**: 1.289
ways de 2.086. Los 120 descartados se enseñan aparte como control del control:

```
universo válido (1.289 ways)  señal >=0,90: 89,5 %    ⭐ barajado >=0,90:  4,3 %
los 120 descartados           señal  media 1,000      ⭐ barajado  media 1,000   ← acierto sin mérito
```

La línea base cae de 12,0 % a **4,3 %**: dos tercios de la "línea base" original eran los propios
descartados. **El resultado real es más fuerte, no más débil, que el que iba a publicar.**
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **una línea base no limpia un universo mal definido.** Barajar el dato
comprueba que la señal está en el dato; **no comprueba que la pregunta se pueda hacer en todos los
casos del universo**. Antes de la línea base va otra pregunta: *¿en cuántos de estos casos la
respuesta correcta es trivial?* Esos casos salen fuera y se enseñan aparte.
**Traza:** `t8_lado.py` → `t9_lado2.py` (desechables)

---

## [2026-08-02] — Descarté el verificador de cruces con un argumento falso, y el veredicto salió bien por accidente

**Categoría:** razonamiento / suerte
**Síntoma:** yo había descartado la idea de sacar los cruces de los portales diciendo que *"no hay
puertas en un cruce"*. La medición sobre 11.562 cruces conocidos de OSM, en zona urbana, con control
de puntos que no son cruce:

```
                                      p25   MEDIANA   p75    p90
hueco en CRUCES conocidos            10,7    16,3    25,9   39,4
⭐ CONTROL: puntos que NO son cruce   11,2    21,4    33,8   45,7
```

**Los cruces tienen MENOS hueco de portales que el tramo medio.** Con umbral de 20 m, la señal avisa
en el 38,0 % de los cruces y en el 52,9 % de los no-cruces: **razón 0,72**, es decir, apunta en
dirección contraria.

**Causa raíz de mi error:** en un cruce confluyen **cuatro esquinas**, y las esquinas tienen portal.
En medio de un tramo hay dos fachadas; en un cruce, cuatro. **Hay más puertas cerca de un cruce que
en ningún otro sitio de la calle.** Mi premisa era exactamente lo contrario de la realidad.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el veredicto**. Dije "no sirve" y no
sirve. Ese argumento habría pasado por bueno indefinidamente **porque la conclusión era correcta** —
y nadie audita la premisa de una conclusión que le parece bien. **Es el fallo más difícil de ver de
esta bitácora: no deja síntoma.**

**Y hay un coste concreto, no teórico:** si mi premisa hubiera sido cierta, la primera medición
—hueco alrededor del punto— habría dado señal. Como era falsa, medí lo que no era y **estuve a punto
de cerrar el capítulo sin probar la versión que Antonio realmente describió**: el hueco **a lo largo
de una misma calle**, donde la numeración se interrumpe al pasar la boca de otra. Ésa sí tiene
señal, medida sobre 14.204 huecos:

```
hueco de 60-100 m -> cae sobre un cruce el 42,9 %    línea base 27,2 %    razón 1,58
```

**Real, y aun así insuficiente: 1,58× son 57 % de falsos avisos.** El veredicto final sigue siendo
"no sirve como guardián", pero ahora está sostenido por el número correcto y no por una premisa
inventada.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **acertar el veredicto con el argumento equivocado es peor que
equivocarse**, porque no deja rastro. Cuando descarte una idea, lo que hay que anotar y comprobar no
es la conclusión: **es la premisa**. Y si la premisa nunca se midió, el descarte es una opinión con
cara de resultado.
⚠️ Corolario operativo: **medir la versión de la idea que propuso quien la propuso**, no la que yo
entendí. Las dos versiones dieron resultados de signo opuesto.
**Traza:** `t10_cruces.py` → `t11_cruces2.py` → `t12_gap.py` (desechables)

---

## [2026-08-02] — Dije que unir los portales daría un zigzag inservible. Da 1,3 m de error

**Categoría:** predicción refutada
**Síntoma:** sostuve que generar el eje de una calle uniendo sus portales no podía funcionar —*"los
portales están en las puertas, no en la calzada; unirlos daría un zigzag de acera a acera y por
dentro de las manzanas en las curvas"*—. Barrido de 200 calles al azar (semilla `20260802`) contra
el eje real de OSM:

```
                              calles   error mediana    p90      máx    | error medio <10 m
E1  unir TODOS en orden         200         5,9 m     26,4 m   284,8 m  |      78 %
E2  promediar por paridad       168         1,3 m     17,1 m   126,9 m  |      88 %
```

**En calles urbanas normales, E2 da decímetros:** Arzobispo Apaolaza 0,2 m, Río Cinca 0,6 m,
Privilegio de la Unión 0,6 m.

**Causa raíz de mi error:** describí correctamente **E1** —el zigzag existe, p90 de 26 m y un máximo
de 285 m— y **usé esa objeción para descartar la idea entera**, sin considerar la variante obvia que
la anula: **separar los dos hilos por paridad y promediarlos**. Cada hilo va por su acera, y la media
de las dos aceras **es la calzada**. La objeción que puse era, literalmente, la descripción del
problema que la variante resuelve.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **nada, y ése es el problema.** No
había medición que refutar porque nunca hice ninguna: la afirmación llevaba desde el diseño sin un
número al lado, en un proyecto cuya primera regla es que toda afirmación va con su evidencia. Pasó
el filtro **por ser mía y sonar razonable**.

**Lo honesto, con el contador delante:** E2 solo se puede calcular en **168 de 200 calles (84 %)**,
y las 32 que quedan fuera **no son al azar** —son las de numeración correlativa o de un solo lado,
las difíciles—. El 1,3 m está medido sobre el subconjunto fácil.
**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐ **una objeción a una idea ajena tiene el mismo listón de evidencia que
una afirmación propia.** *"Esto no puede funcionar porque X"* es una afirmación sobre el mundo y hay
que medirla, sobre todo cuando ahorra trabajo creérsela.
⚠️ Y la específica: **antes de descartar una idea, construir su mejor versión, no la más literal.**
Descarté E1 y llamé a eso descartar E.
**Traza:** `t10_cruces.py`, `t11_cruces2.py`, `t12_gap.py` (desechables)

---

## [2026-08-02] — ⚠️ CORRIGE LA TANDA 4: los 12 portales de Calle Tomillo estaban a 25,6 m y mi radio era 25

**Categoría:** instrumento / umbral
**Síntoma:** en la tanda 4 publiqué que `CALLE TOMILLO` era una contradicción irreconciliable entre
dos métodos —la tanda 3 la daba **100 % cubierta** y sus 12 portales no tenían **nada** de OSM a
25 m— y la dejé como `CAUSA NO CONFIRMADA`. Resuelta contra el crudo:

```
Calle Tomillo SI existe en OSM        way 793247786, highway=residential
el eje municipal esta cubierto        27 de 27 puntos a <=5 m con rumbo compatible (100 %)
los 12 portales estan a               25,0 - 26,5 m de esa misma calle
mi radio de la tanda 4 era            25,0 m
```

**Nadie mentía. El falso positivo era mío, y por un metro.** Barrio SJN, San Juan de Mozarrifar:
chalets con jardín delantero, donde el portal está en la valla y no en la fachada.

**Alcance del daño, medido:** de las **10 vías** que publiqué en §B1 como *"con portales y nada de
OSM encima"*, **4 son falsas**:

```
CALLE TOMILLO             mediana portal->OSM  25,6 m   ⛔ falso positivo
CAMINO HUEGA                                   41,0 m   ⛔ falso positivo
CALLE EL CISTER                                44,8 m   ⛔ falso positivo
PLAZA TENIENTE POLANCO                         36,6 m   ⛔ falso positivo
─────────────────────────────────────────────────────────────────────
CALLE CIUDAD TRANSPORTE (A)                    70,0 m   hueco real
CAMINO DEL MONTON                             102,5 m   hueco real
CAMINO DEL PASO A SAN LAZARO                  108,0 m   hueco real
CAMINO TORRE ESCOLAPIOS                       103,2 m   hueco real
CALLE EL CUARTAL                               81,8 m   hueco real
CAMINO LA PURISIMA                            142,1 m   hueco real
```

Y de los **tres "huecos nuevos que la tanda 3 no vio"** que reporté con énfasis, **dos eran míos**:
Tomillo y Teniente Polanco. Solo `CAMINO DEL PASO A SAN LÁZARO` (108 m) es real.

**Causa raíz:** usé **el mismo radio** para dos preguntas que no son la misma:
- *"¿a qué calle pertenece este portal?"* — necesita un radio **corto**, o no discrimina.
- *"¿hay alguna calle aquí?"* — necesita el rango de **lo que físicamente existe**, o inventa huecos.

**⭐⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo: mi mejor argumento metodológico del
día.** El radio de 25 m salía del **p85 de la distancia de cada portal a su propio eje municipal**, y
lo defendí por escrito con estas palabras: *"una propiedad física del dato que no depende de OSM y
por tanto no se puede retocar para que el resultado quede bonito"*. **Es verdad, y aun así estaba
sesgado.** Un percentil deja fuera su complemento **por construcción** —un p85 descarta el 15 %— y en
un dato geográfico **ese 15 % no está repartido al azar por la ciudad: son barrios enteros**. Chalets
con jardín, urbanizaciones, retranqueos. El umbral era inatacable *como número* y sistemáticamente
injusto *con un tipo de barrio*.

Y dio verde, además, **la contraprueba de desplazamiento** (86,1 / 21,3 / 6,0 %), que ya van tres
veces que firma un instrumento roto.

**Cómo se cazó:** porque Antonio mandó **resolver el caso concreto antes que la auditoría general**.
Yo tenía Tomillo delante desde ayer, escrito en el informe como discrepancia, y lo archivé con un
`CAUSA NO CONFIRMADA` en vez de abrirlo. **`CAUSA NO CONFIRMADA` es una etiqueta honesta cuando no se
puede saber; es una manera de mirar hacia otro lado cuando sí se puede y no se ha intentado.**

**Arreglo aplicado:** separar los dos umbrales. Para **atribuir** se mantiene R = 25 m (es el que
mejor separa señal de ruido: con 50 m la contraprueba de desplazamiento sube del 21,3 % al 33,9 % y
el instrumento empieza a no valer). Para **negar la existencia** de geometría se usa un radio
generoso y se declara. Barrido, cada fila con su contraprueba entera:

```
   R      SEÑAL      ⭐ +2 km      vías "sin nada de OSM"
  25 m    86,1 %      21,3 %              10   ⬅ publicado ayer, 4 de ellas falsas
  30 m    87,4 %      24,1 %               8
  40 m    89,1 %      29,5 %               6
  50 m    89,9 %      33,9 %               4
```

**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **elegir un umbral con un percentil del propio dato lo hace neutral
respecto a la media y sesgado contra la cola** — y en datos geográficos la cola no es ruido, **son
barrios**. Que un umbral no se pueda ajustar al resultado no significa que sea justo con todo el
universo: hay que preguntarse **a quién deja fuera el complemento del percentil**, y mirar si esos
casos tienen algo en común.
⚠️ Y la operativa, que es la que más va a doler: ⭐⭐ **el umbral que sirve para atribuir no sirve
para negar.** Afirmar *"este portal es de esta calle"* y afirmar *"aquí no hay ninguna calle"* son
preguntas de signo contrario y **necesitan umbrales de signo contrario**. Usar el mismo produce
huecos inventados, que es la peor clase de hallazgo: parece un descubrimiento.
⚠️ Y la tercera: **un `CAUSA NO CONFIRMADA` con el dato en disco es deuda, no honestidad.**
**Traza:** `u1_tomillo.py`, `u2_magnitud.py` (desechables); corrige
`docs/PORTALES-COMO-TESTIGOS.md` §B1 y §B3

---

## [2026-08-02] — Mi métrica "honesta" daba el doble de hueco que la que criticaba, y el 70 % era ruido del instrumento

**Categoría:** métrica / falso hallazgo evitado
**Síntoma:** auditando el 4,11 % de la tanda 3 encontré una objeción que parecía definitiva. Aquel
número no cuenta *km sin cobertura*: cuenta **km de vías que están mayoritariamente sin cobertura**,
porque el criterio era *"≥50 % del eje cubierto"*. Es decir:

```
una vía de 1.000 m cubierta al 49 %  aporta 1.000 m al hueco  (y le sobran 490 cubiertos)
una vía de 1.000 m cubierta al 51 %  aporta     0 m al hueco  (y le faltan 490 sin cubrir)
```

Propuse la métrica que parecía obviamente mejor —**sumar `largo × (1 − cobertura)` vía a vía**— y
salió esto:

```
A) criterio de la tanda 3 (km de vías con <50 % cubierto) ....  81,9 km = 4,11 %
B) km efectivamente no cubiertos .............................. 166,5 km = 8,36 %
   de los cuales, dentro de calles que SÍ existen en OSM ...... 103,8 km = 62,4 %
```

**El doble.** Y con una explicación elegante: *"trozos sin mapear dentro de calles que sí están, que
el criterio del 50 % borra"*. **Estaba a punto de reportarlo como el hallazgo de la tanda**, y la
costura del briefing lo pedía explícitamente: *"si el número real resulta más del doble, párate y
avísame destacado"*. Era más del doble, exactamente 2,03×.

**Antes de avisar, clasifiqué esos metros en vez de contarlos.** Cada punto no cubierto, con tres
hipótesis distinguidas y un testigo independiente (¿hay portales ahí?):

```
H2  hay OSM al lado pero con OTRO RUMBO (glorieta, curva) .... 57,7 %
H1  está en un EXTREMO del eje municipal ..................... 14,6 %
H3b interior, sin OSM y SIN portales ......................... 20,2 %
⛔ H3 HUECO REAL (interior, sin OSM, CON portales) ...........  7,6 %
```

**El 72,3 % de mi "hallazgo" era ruido de mi propio instrumento.** El criterio de paralelismo ±30°
—el que salvó la medición de la tanda 3— falla justo donde el eje municipal va recto y el de OSM
curva: glorietas, chaflanes, rotondas. Y el eje municipal se prolonga más allá del de OSM en los
extremos, que es una diferencia de trazado, no un hueco de mapeado.

Aplicada la **misma** clasificación a los dos lados del umbral —barrido completo de las 255,
muestra de 500 de las 3.104— el recuento queda así:

```
km de eje sin OSM paralela, bruto ......................... 200,7 km = 10,07 %
   de ellos ARTEFACTO (otro rumbo o extremo) .............. 139,9 km =  7,02 %
   sin OSM de verdad ......................................  60,8 km =  3,05 %
      ... y con testigo de portales (hay ciudad ahí) ......  19,3 km =  0,97 %
```

**El 4,11 % publicado no era optimista: era ligeramente pesimista.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la crítica al instrumento
anterior, que era correcta.** El criterio del 50 % efectivamente descarta información y efectivamente
puede borrar tramos; todo lo que dije de él es cierto. **Tener razón sobre el defecto del método
ajeno me hizo no auditar el mío**, que compartía el instrumento y por tanto todos sus artefactos —
solo que sin el umbral del 50 %, que resulta que estaba **amortiguando** el ruido en vez de causarlo.
Un criterio grosero puede ser más robusto que uno fino construido sobre la misma medición sucia.

**Cómo se cazó:** por la costura. Antonio pedía parar y avisar si el número era el doble; parar para
avisar me obligó a mirar el número una vez más antes de decirlo en voz alta. **La costura no sirvió
para lo que estaba puesta —proteger de un hallazgo grave— sino para meter una pausa entre el
resultado y su publicación.** Ése resultó ser todo su valor, y no es poco.

**Commit:** (esta tanda)
**Ley que sale de aquí:** ⭐⭐ **una métrica más fina sobre la misma medición no es más exacta: es
más sensible al ruido de esa medición.** Antes de sustituir un criterio grosero por uno detallado
hay que preguntarse si el grosero estaba **absorbiendo** error en lugar de introducirlo. Refinar la
agregación sin refinar el instrumento amplifica sus defectos.
⚠️ Y la operativa: **un hallazgo que dobla un número publicado se clasifica antes de contarse.**
"Cuántos" sin "de qué tipo" es una cifra sin veredicto — y una cifra grande y sin veredicto es
justo la que uno tiene ganas de anunciar.
**Traza:** `u6_km.py`, `u7_verifica.py`, `u8_final.py` (desechables)

---

## [2026-08-02] — "Dos farmacias de guardia" es un suelo, no un total: el normalizador se queda con la primera URI y tira el resto

**Categoría:** instrumento ajeno / pérdida silenciosa
**Síntoma:** el conjunto heredado de farmacias trae la única señal de guardia de todo el fichero
dentro del campo `type`, y con la fecha incrustada en la propia URI:

```
188 x  http://www.zaragoza.es/sede/portal/skos/vocab/FarmaciaHorarioAmpliado
124 x  null
  2 x  http://www.zaragoza.es/sede/portal/skos/vocab/FarmaciaGuardia/2026-05-12
```

Dos farmacias de guardia el 12 de mayo. **El número es falso por abajo**, y la razón está en el
normalizador del proyecto de origen (`normalize-farmacia.ts`), cuyo propio comentario lo dice:

```ts
// type viene como Array<string> con URI SKOS; el normalizador lo absorbe
function normalizeType(raw: unknown): string | null {
  ...
  for (const v of raw) {
    if (typeof v === "string" && v.trim() !== "") { candidate = v; break; }   // ⬅ break
  }
```

**`break` en la primera.** Una farmacia clasificada a la vez como `FarmaciaHorarioAmpliado` y
`FarmaciaGuardia/2026-05-12` **conserva solo la primera de las dos**, y la marca de guardia
desaparece sin dejar rastro ni bandera. Las **2** que sobreviven son exactamente las que **no**
tenían ninguna otra clasificación. ⇒ **`NO CONSTA` cuántas farmacias estaban de guardia ese día.**
Solo se sabe que **fueron 2 o más**, y que las 188 con horario ampliado son candidatas a haber
perdido la marca. No se puede acotar sin volver a pedir el crudo, y esta tanda tiene prohibida la
red.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la procedencia del dato, que es
la más creíble que se ha visto en este proyecto.** No es un texto libre ni un campo suelto: es una
**URI de vocabulario controlado SKOS**, publicada por el Ayuntamiento, **con la fecha dentro del
propio identificador**. Todos los indicios de rigor a la vez. Y la ley nº5 de este proyecto ya
avisaba —*el aspecto de rigor dice cómo se diseñó, no si se rellenó bien*— pero aquí es peor y más
sutil: **el campo de origen estaba bien construido y era el CONSUMIDOR el que lo truncaba.** El
rigor del emisor no protege de un `break` en el receptor.

**Cómo se cazó:** contando valores distintos por campo antes de leer ninguno. `type` tenía **190**
valores no vacíos y `clasificacion` **188**. Dos de diferencia en dos campos que hablan del mismo
hecho — que es literalmente la ley nº6 (*cuando una fuente ofrece varios campos para el mismo
hecho, compáralos entre sí*). **Sin esa comparación, las dos únicas farmacias de guardia del
fichero habrían pasado por registros incompletos.** De hecho eso es justo lo que dice de ellas su
propia bandera de calidad: `qualityFlags: ["missing_schedule"]`.

**Arreglo aplicado:** ninguno — el fichero es de otro proyecto y **esta tanda es de solo lectura**.
Se documenta en `docs/RECONOCIMIENTO-FARMACIAS.md` y **se declara que 004 no debe consumir ese
campo**: si 004 quiere guardias, las pide al endpoint por fecha (§D del informe).
**Ley que sale de aquí:** ⭐⭐ **un normalizador que colapsa una lista a un valor único está tomando
una decisión de negocio disfrazada de limpieza de tipos.** `Array<string> -> string` no es una
conversión: es **elegir cuál de los hechos sobrevive**, y el que se pierde no deja hueco, deja un
valor perfectamente válido. ⚠️ Corolario: **cuando un campo de origen es multivalor, el recuento de
valores distintos del destino ya no puede compararse con el del origen** — y ése era el chequeo.
**Traza:** `farmacias-zaragoza.json` (314 registros, solo lectura),
`normalize-farmacia.ts` líneas de `normalizeType`

---

## [2026-08-02] — El campo de horario no contiene el horario: el 64 % de lo que trae solo habla del sábado

**Categoría:** dato ajeno / nombre que promete de más
**Síntoma:** el conjunto tiene `extendedHoursText`, relleno en **188 de 314**, con **16 redacciones
distintas**. Clasificado por lo que dice de verdad:

```
A. dice algo de entre semana ......................  67  (21,3 %)
B. SOLO habla del sábado (no dice el horario base)  121  (38,5 %)
C. sin nada .......................................  126  (40,1 %)
                                                    ────
                                                    314  ✅
```

El valor más repetido —**121 de 188, el 64 % de las que traen algo**— es:

```
"Sábados horario de mañanas de 9:30 a 13:30 h. (Junio,julio y agosto: 9:15 a 13:45 h.)"
```

**Eso no es el horario de la farmacia: es la excepción del sábado sobre un horario ordinario que la
fuente no publica en ninguna parte.** De lunes a viernes, en 121 farmacias, **no se sabe a qué hora
abren ni a qué hora cierran**. Y de las 67 que sí dicen algo de entre semana, el formato es texto
libre: **47 llevan etiquetas HTML** (`<p>`, `<ul>`, `<li>`), una lleva entidades (`&nbsp;`,
`&iacute;`), una está entera en mayúsculas y otra empieza *"TODOS LOS DIAS HASTA 21:30 H CIERRE
MEDIO DIA…"*.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el recuento de relleno, que es el
control estándar de este proyecto.** *188 de 314 lo traen, el 59,9 %* — un número decente, con su
denominador, calculado sobre el campo correcto. **Y no dice absolutamente nada sobre si el
contenido responde a la pregunta.** Contar cuántos registros traen un campo mide **presencia**;
para medir **utilidad** hay que leer los valores y clasificarlos, y eso no lo hace ningún contador.

⚠️ **Y el nombre del campo era honesto.** Se llama `extendedHoursText` —*texto de horas
extendidas*—, no `horario`. **Describe exactamente lo que contiene.** El error habría sido mío al
leer la lista de campos y traducir mentalmente "campo de horas" por "horario", que es justo lo que
el método de esta tanda prohibía: *no deduzcas del nombre del campo*. Aquí la trampa iba en la otra
dirección de lo esperado: **el nombre no prometía de más; era el lector el que iba a leer de más.**
**Ley que sale de aquí:** ⭐⭐ **un campo relleno al 60 % puede estar respondiendo a una pregunta
distinta de la que le haces.** Antes de contar cuántos lo traen, hay que clasificar **qué dicen** —
y publicar las dos cifras juntas, porque *"lo trae el 59,9 %"* y *"responde a mi pregunta el
21,3 %"* son ambas ciertas y solo una es la que importa.
**Traza:** `farmacias-zaragoza.json`, campo `extendedHoursText`, barrido completo n=314

---

## [2026-08-02] — `withExtendedHours: 188` no cuenta horarios ampliados: es `314 − missingSchedule` con otro nombre

**Categoría:** metadato / contador que se cuenta a sí mismo
**Síntoma:** el metadata del conjunto publica dos indicadores de calidad que parecen independientes:

```json
"missingSchedule": 126,
"withExtendedHours": 188
```

**126 + 188 = 314.** Son el mismo hecho contado dos veces, y se puede demostrar en el código que los
produce (`sync-farmacias-zaragoza.ts` + `normalize-farmacia.ts`):

```ts
const hasExtendedHours = clasificacion === "HorarioAmpliado" || horarioText !== null;
const scheduleSource   = horarioText !== null ? "official" : "missing";
if (scheduleSource === "missing") qualityFlags.push("missing_schedule");
...
if (f.qualityFlags.includes("missing_schedule")) missingSchedule++;
if (f.hasExtendedHours) withExtendedHours++;
```

`hasExtendedHours` es verdadero si hay texto de horario **o** si la clasificación es
`HorarioAmpliado`; y en este conjunto **esas dos condiciones coinciden exactamente en las mismas
188 farmacias** (`clasificacion` vale `HorarioAmpliado` en 188 y `null` en 126, la misma partición).
La disyunción nunca se activa por su segundo término. Resultado: **`withExtendedHours` es el
complemento de `missingSchedule`, siempre, por construcción.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **que los dos números sumaran el total
exacto.** 126 + 188 = 314, contador independiente cuadrando a la primera. En este proyecto eso es
una señal de salud —*los repartos suman el total o se declara la diferencia*—, y aquí **la suma
perfecta era el síntoma, no el certificado**: dos indicadores que particionan el universo sin
solaparse jamás no son dos medidas, **son una medida y su negación**. Es la ley nº16 con otra cara:
*un número que cuadra con su vecino no está verificado, está apuntalado* — solo que aquí no está ni
apuntalado, **está duplicado**.

**Consecuencia práctica:** un panel que enseñe *"188 farmacias con horario ampliado"* está diciendo
*"188 farmacias de las que sabemos algo del horario"*, que es una afirmación mucho más floja. Y
combinado con el fallo anterior, la afirmación verdadera es: **67 farmacias de 314 (21,3 %) dicen
algo de su horario entre semana.**
**Ley que sale de aquí:** ⭐ **dos contadores que suman el total exacto y nunca se solapan no son
dos mediciones: son una.** Al inventariar metadatos hay que buscar activamente las identidades
aritméticas entre indicadores —`a + b = n`, `a = n − b`— **antes** de citarlos como evidencias
separadas, porque presentados juntos dan una sensación de corroboración que no existe.
**Traza:** `farmacias-zaragoza.metadata.json`, `sync-farmacias-zaragoza.ts` líneas 126-135

---

## [2026-08-02] — ⚠️⚠️ "De guardia" no significa "abierta": 7 de las 15 de hoy cierran a las 21:30

**Categoría:** dato / promesa peligrosa
**Síntoma:** primera consulta real al endpoint de guardias del Ayuntamiento, hoy domingo 2 de agosto.
Devuelve **15 farmacias de guardia**. Un cliente ingenuo —y era exactamente el que yo tenía en la
cabeza al escribir el informe de la tanda 6— pinta esas 15 en el mapa y contesta *"la de guardia más
cercana está a 1,2 km"*. Al abrir el campo `guardia.horario` de cada una:

```
turno T-26   x8   "Abiertas de 9:15 h. a 9:15 h. del día siguiente"          ✅ 24 h
turno 25-B   x7   "Abiertas de 9:15 h. a 13:45 h. y de 17:00 h. a 21:30 h."  ⛔ cerrada a las 03:40
```

**De las 15 de guardia, solo 8 están abiertas de madrugada.** Las otras 7 son refuerzo de horario
partido: siguen figurando como *guardia* del día porque lo son —cubren tarde y noche temprana— pero
a las 03:40 están cerradas.

**Causa raíz:** *estar de guardia* y *estar abierta ahora* son dos hechos distintos, y el endpoint
los distingue correctamente **dentro de un campo de texto libre** (`horario`), no con una marca. La
única manera de saberlo es leer la frase. Un consumidor que filtre por `tipo=guardia` y no mire el
horario **acierta el 53 % de las veces a las tres de la mañana**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás.** El endpoint
respondió `200`, `application/json`, `totalCount: 15` cuadrando con `len(result)`, el parámetro
`fecha` demostradamente respetado, la `guardia.fecha` interna coincidiendo con la pedida, y los
cuatro campos del modelo (`fecha`, `turno`, `horario`, `sector`) rellenos en los 15 registros. **Un
dato impecable en todos los ejes que este proyecto sabe comprobar** — y la trampa estaba en el
contenido de una frase en castellano.

**Cómo se cazó:** por agrupar por `(turno, horario)` en vez de contar registros. Con `collections.
Counter` sobre la pareja aparecieron dos grupos donde el `totalCount` enseñaba uno solo. **Contar
cuántos hay no distingue clases; agrupar por el valor sí.** Es la ley nº29 —*clasificar antes de
contar*— aplicada a un dato que no era un error de medición sino dos cosas distintas con el mismo
nombre.

**Consecuencia para 004, por escrito:** la escena de las 03:40 **no puede filtrar por
`tipo=guardia`**. Tiene que filtrar por *"su horario cubre la hora actual"*, y eso obliga a
interpretar el texto libre de `guardia.horario`. Si el texto no se entiende, **la app se calla**:
mandar a alguien de madrugada a una farmacia de refuerzo cerrada es exactamente el daño que esta
escena tenía que evitar.
**Ley que sale de aquí:** ⭐⭐ **una categoría del dato de origen no es una promesa al usuario.**
*"De guardia"* es una clasificación administrativa —turnos, sectores, cuadrantes del Colegio— y
*"abierta ahora"* es una afirmación física sobre una puerta. Traducir la primera por la segunda es
la clase de error que no falla en ninguna prueba y falla en la calle.
**Traza:** `data/exploracion/2026-08-02_sede-zaragoza_farmacia-guardia_fecha-02-08-2026.json`
(⛔ no publicado: lleva nombres de titular y teléfonos)

---

## [2026-08-02] — La respuesta vacía no trae la clave `result`: 62 bytes que revientan al cliente descuidado

**Categoría:** API / forma de la respuesta
**Síntoma:** al pedir una fecha pasada (2 de julio), el endpoint contesta **`200 OK`**,
`Content-Type: application/json`, y **62 bytes enteros**:

```json
{"totalCount": 0, "start": 0, "rows": 500, "icon": "farmaciaguardia"}
```

**No hay clave `result`.** No es una lista vacía: **es que el campo no existe**. Un cliente que haga
`data.result.length` lanza `TypeError` sobre una respuesta con estado 200 y tipo correcto; uno que
haga `data.result.map(...)` lo mismo; y uno que use `?.length ?? 0` obtiene **0** y lo interpreta
como *"no hay farmacias de guardia el 2 de julio"* — que es **imposible en la realidad**: en
Zaragoza siempre hay guardia.

Y la fecha inválida (`99-99-9999`) contesta distinto otra vez: **`400 Bad Request`** con el error
interno del servidor filtrado en el mensaje:

```json
{"status":400, "mensaje":"could not execute query; nested exception is
 org.hibernate.exception.GenericJDBCException: could not execute query"}
```

⇒ **Tres formas de respuesta para tres situaciones**, y solo la última es un error HTTP:

| situación | HTTP | `result` | interpretación correcta |
|---|---|---|---|
| hay guardias | 200 | lista | dato |
| **fecha sin datos (pasada)** | **200** | **ausente** | ⛔ **indeterminado, NUNCA "no hay"** |
| fecha inválida | 400 | ausente | error de petición |

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el código de estado y el
`Content-Type`.** `200 OK` + `application/json;charset=UTF-8` es la firma de una respuesta sana, y
es lo que comprueba cualquier chequeo razonable —incluido el `if (!res.ok) return failed` del
proyecto de origen, que aquí **pasa de largo**—. La única razón por la que ese cliente no se rompe
es que además valida `Array.isArray(data.result)`: **acierta por una comprobación de forma que
estaba puesta para otra cosa.**

**Cómo se cazó:** porque el método de la tanda obligaba a **pedir hoy primero**. Sin la línea base
—15 registros con `result` presente— los 62 bytes del 2 de julio habrían sido indistinguibles de una
respuesta normal a un día tranquilo. **Es la ley nº31 aplicada a una API: una respuesta sin línea
base no es una medición.**
**Ley que sale de aquí:** ⭐⭐ **la ausencia de una clave no es un cero, y un `200` no es un
éxito.** Al consumir una API hay que enumerar **las formas de respuesta**, no solo los códigos de
estado: *lista con datos*, *lista vacía*, *clave ausente*, *error HTTP* y *error con cuerpo JSON*
son cinco casos distintos que exigen cinco tratamientos. Colapsarlos en "ok / no ok" es cómo se
llega a afirmar en pantalla algo que el servidor nunca dijo.
**Traza:** `2026-08-02_sede-zaragoza_farmacia-guardia_fecha-02-07-2026_VACIA-sin-result.json` (62 B),
`…_fecha-invalida_HTTP400.json` (142 B) — los dos sí publicados: no llevan dato personal

---

## [2026-08-02] — Mi contador de URIs devolvía 1 siempre por la rama `else`, y el resultado uniforme parecía una respuesta

**Categoría:** instrumento propio / constante disfrazada de medición
**Síntoma:** comprobando si el censo del proyecto `00 ZGZ RADAR` guardaba varias URIs por farmacia
—la pregunta que decide si perdió marcas de guardia como el otro—, escribí:

```python
collections.Counter(len(r['type']) if isinstance(r.get('type'), list) else 1 for r in d)
```

Salida: `Counter({1: 314})`. **Los 314 con un solo valor**, leído a bote pronto como *"aquí no hay
multivalor, este censo no pierde nada"*.

**Causa raíz:** en ese fichero `type` es un **`str`**, no una lista. La condición `isinstance(...,
list)` es falsa en los 314 registros, así que **la expresión entera devuelve la constante `1`
trescientas catorce veces**. No midió la longitud de nada: contó cuántos registros hay. El `1` no era
un resultado, era el literal que yo mismo había escrito dos caracteres antes.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la uniformidad del resultado**,
que es justo lo que uno busca en una comprobación de forma. `Counter({1: 314})` con el total exacto
del fichero **tiene todo el aspecto de un barrido completo que confirma una hipótesis**: un solo
valor, sin dispersión, cuadrando con el denominador. Y la ley nº25 de este proyecto ya avisaba de la
versión grande de esto —*la estabilidad se lee como robustez*—; aquí es la versión pequeña y más
tonta: **la estabilidad venía de que no había variable.**

**Cómo se cazó:** por la línea de arriba de la misma salida, que imprimía
`tipos: {'str': 192, 'NoneType': 122}`. **El diagnóstico estaba a dos renglones del error**, puesto
por mí, y solo lo vi al leer las dos líneas juntas. Si hubiera imprimido únicamente el contador que
me interesaba, la conclusión falsa se habría ido al informe.
**Arreglo aplicado:** ninguno en el código —era un script desechable— pero **el dato que se buscaba
sí se obtuvo por otra vía**: ese censo trae **7** marcas `FarmaciaGuardia` del 7 de mayo, y el
endpoint confirma hoy que un día laborable tiene exactamente **7**. Es **evidencia convergente** de
que el fichero del 12 de mayo, con **2**, perdió marcas — ⚠️ **no es una demostración**: no se puede
descartar que ese martes hubiera realmente menos.
**Ley que sale de aquí:** ⭐ **una expresión condicional cuya rama por defecto es una constante
devuelve esa constante, no una medida** — y un histograma de un solo valor es indistinguible de un
histograma de la constante que escribiste. ⚠️ Regla operativa: **si un contador sale uniforme,
comprobar primero que la variable existía**, antes de interpretar la uniformidad como hallazgo.
**Traza:** script desechable de la tanda 7; el dato correcto salió de contar `FarmaciaGuardia` en el
texto crudo, con positivo y negativo de control

---

## [2026-08-03] — La contraprueba obligatoria no podía ponerse roja: elegía entre 341 aristas que no parten nada

**Categoría:** contraprueba / diseño del test
**Síntoma:** primera ejecución de la contraprueba C4c[1] del briefing —*borra una unión a
propósito y comprueba que el contador de componentes lo detecta*—:

```
aristas de articulación del grafo: 361
se borra la arista 195 (way 24412443, residential, 17.9 m)
componentes antes: 18   después: 18
⇒ ⛔ NO LO DETECTA
```

**Causa raíz, y son dos capas:**
1. La arista elegida conectaba un nodo de **grado 1** con el resto. Al borrarla ese nodo no forma
   una componente nueva: **queda huérfano, sin ninguna arista**. Y de las 361 aristas de
   articulación, **341 eran así** — colgantes. Elegir al azar entre todas daba un 94 % de
   probabilidad de caer en una que **no puede partir la red por construcción**.
2. Y debajo, un fallo real del instrumento vigilado: mi `componentes()` **saltaba en silencio los
   nodos sin aristas** (`if (ady[s].length === 0) continue`). Había **86 nodos así en el grafo** y
   ninguno aparecía en ningún contador.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el propio Tarjan, que estaba
bien.** Las 361 aristas de articulación eran correctas: borrar cualquiera de ellas **sí** desconecta
algo. El algoritmo no mentía — mentía la **traducción de su salida a la pregunta que yo hacía**.
*"Aristas cuya eliminación desconecta el grafo"* y *"aristas cuya eliminación crea una componente
nueva contable"* son conjuntos distintos, y yo los usé como sinónimos.

**Cómo se cazó:** porque el briefing declaraba la contraprueba **obligatoria** y con costura: *"si
una de las tres NO se pone roja, PARA TODO"*. Se puso verde-por-fallo y hubo que pararse. **Si la
contraprueba hubiera sido opcional, el rojo falso habría pasado por un verde.**

**Arreglo aplicado:** dos cambios, y los dos declarados en el código.
- El test elige solo entre **articulaciones INTERNAS** (ambos extremos de grado ≥2): 117 de 458.
- El contador mide **dos cosas**: número de componentes **y tamaño de la mayor**. Un puente interno
  mueve la segunda siempre, aunque la primera no cambie.
- `componentes()` devuelve ahora `aislados` aparte, en vez de ignorarlos.

```
se borra la arista 3405 (way 672502466, secondary, 43.8 m)
componentes 20 -> 21     mayor 5016 -> 5014     ✅ ROJO
```

**Ley que sale de aquí:** ⭐⭐ **una contraprueba que puede pasar por construcción no es una
contraprueba.** Antes de plantar un fallo hay que preguntarse *"¿de cuántas maneras puede este test
salir verde sin que el instrumento funcione?"* — y si la respuesta no es cero, el test está mal
diseñado, no el instrumento.
⚠️ Corolario: **un contador que ignora casos en silencio es un contador que no puede ponerse rojo
por esos casos.** El `continue` que salta lo que no encaja es donde se esconden los ceros falsos.
**Traza:** `src/verificar.js` C4c[1], `src/grafo.js` `componentes()`

---

## [2026-08-03] — Dos crudos de OSM del mismo proyecto, dos formas distintas: `out geom` frente a `out body`

**Categoría:** dato propio / forma no verificada
**Síntoma:** el control positivo de C4b —*10 cruces conocidos sacados del crudo de la tanda 3*—
devolvió esto:

```
candidatos con >=3 ways en el crudo de la tanda 3: 95
⇒ 0 de 0 cruces conocidos están en el grafo
```

**95 candidatos y una lista vacía.** El filtro `coord.has(n)` los eliminaba a todos.

**Causa raíz:** el crudo de hoy se pidió con `out geom;` —cada way lleva su geometría embebida en
`way.geometry`— y el de la tanda 3 se pidió con `out body;`, donde los ways solo traen la **lista de
ids** en `way.nodes` y **las coordenadas viajan como elementos `node` sueltos** en el mismo array.
Medido en el fichero:

```
elementos: 1354   ways: 309 (con nodes: 309, con geometry: 0)   nodes sueltos: 1045
```

Mi lector buscaba `w.geometry[i]`, que en ese fichero **no existe en ningún way**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **que los dos ficheros son JSON de
Overpass del mismo servidor, del mismo proyecto y con el mismo aspecto por fuera.** Los dos abren
con `version`, `generator`, `osm3s` y `elements`; los dos parsean sin un aviso; los dos tienen ways
con `tags` y con `highway`. **La forma que cambia está tres niveles dentro y depende de una palabra
de la consulta que se escribió hace dos tandas y que no viaja con el fichero.**

**Cómo se cazó:** por el `0 de 0`, que es un cero de los sospechosos —**cero candidatos después de
haber contado 95**—. Si el filtro hubiera dejado pasar dos o tres, el número habría parecido un
resultado flojo en vez de un fallo.

**Arreglo aplicado:** leer las coordenadas de los elementos `node` cuando no hay `way.geometry`, con
el motivo escrito al lado del código.
**Ley que sale de aquí:** ⭐⭐ **el formato de un crudo no es su forma.** Dos respuestas del mismo
servicio, en el mismo formato y con las mismas claves de primer nivel, pueden colocar el dato en
sitios distintos según cómo se pidieran — y **la consulta no viaja dentro del fichero**. Al reusar
un crudo de otra tanda hay que **abrirlo y mirar dónde está el dato**, no asumir la forma del último
que se usó.
⚠️ Y la operativa: **guardar la consulta junto al crudo.** Hoy la sentencia `out` que produjo cada
fichero solo consta en el informe de su tanda, que es donde nadie la busca seis semanas después.
**Traza:** `data/exploracion/2026-08-02_osm_overpass_casco-highway.json`, `src/verificar.js` C4b

---

## [2026-08-03] — "La misma zona del casco" volvió a ser dos rectángulos distintos, y el control positivo dio 3 de 10

**Categoría:** encuadre / reincidencia
**Síntoma:** con el lector arreglado, el control positivo de los 10 cruces conocidos dio **3 de 10**,
y los siete fallos tenían todos la misma pinta: el nodo del grafo más cercano estaba a **33, 36, 42,
52, 60 y 96 metros**, con grado 1.

**Causa raíz:** el bbox que elegí para "el casco" y la ventana del crudo de la tanda 3 **no son la
misma zona**:

```
mi bbox del casco:  S 41.6480  O -0.8880   N 41.6600  E -0.8690
bbox del crudo T3:  S 41.65502 O -0.89354  N 41.66034 E -0.88177
```

El crudo de la tanda 3 se extiende **hasta -0.8935 por el oeste**, y mi zona empezaba en -0.888.
**Siete de los diez cruces de control caían fuera de mi zona**, así que el "3 de 10" no medía el
grafo: medía el solape de dos rectángulos. Corregido el encuadre, los mismos diez dan **10 de 10**.

⚠️ **Y no es un fallo nuevo: es el nº18 de esta bitácora, otra vez.** Aquella vez la frase *"la
misma zona del casco"* comparaba dos rectángulos que solapaban un 21 %; hoy he vuelto a escribir un
bbox "del casco" a ojo, sin comprobar que contuviera al anterior. **La ley estaba escrita, en este
mismo fichero, y no evitó nada.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **que el resultado era MALO.** Un
3 de 10 no se lee como un error de encuadre: se lee como *"el planarizado tiene un problema"*, y
manda a depurar el planarizado. **Un fallo que apunta a otro sitio es más caro que uno que no
aparece**, porque consume el tiempo en el sitio equivocado y encima da sensación de estar
trabajando. Lo que lo delató fue **la forma de los fallos** —todos a decenas de metros y con grado
1, que es el patrón de "no está en el dato" y no el de "está mal construido"—.

**Arreglo aplicado:** la zona pasa a `S 41.648 O -0.8945 N 41.6615 E -0.869` (3,24 km², antes 2,12),
elegida para **CONTENER** la ventana de la tanda 3, y con la contención **comprobada en tiempo de
ejecución** e impresa en el informe de contadores — no dada por buena al escribirla.
**Ley que sale de aquí:** ⭐⭐ **una ley escrita no protege sin un mecanismo que la ejecute.** La
nº18 llevaba escrita desde la tanda 2 y volvió a pasar lo mismo en la primera tanda de código; lo
que lo impide no es recordarla, es **una comprobación de contención dentro del programa**, que falla
sola. *Escribir la lección es documentación; ejecutarla es ingeniería.*
⚠️ Corolario práctico: **al comparar contra una medición anterior, la zona nueva tiene que CONTENER
la vieja, y hay que demostrarlo con una aserción, no con la memoria.**
**Traza:** `src/ruta.js` `ZONA_CASCO` / `ZONA_TANDA3` / `contiene()`, `src/informe.js` C1

---

## [2026-08-03] — El grafo decía "unido" y el dibujo enseñaba dos líneas separadas, en 20 nodos

**Categoría:** coherencia entre topología y geometría
**Síntoma:** al exportar el grafo para pintarlo, el cuadre obligatorio no cuadró — y falló al revés
de lo esperado:

```
aristas   exportado 7175   grafo 7175   ✅
nodos     exportado 5142   grafo 5121   ⛔  ← el exportado tiene MÁS
```

Si la causa fuera el redondeo de coordenadas, el exportado tendría **menos** (dos nodos distintos
cayendo en la misma casilla). Tener 21 de más significa lo contrario: **hay nodos del grafo que
aparecen en dos sitios**.

**Causa raíz:** D5 suelda las puntas sueltas reescribiendo la **identidad** del nodo
(`e.a = resolver(e.a)`) y **sin tocar la geometría** (`e.pts`). La arista sigue dibujada donde
estaba, hasta 2 m del nodo con el que ahora comparte identidad. Medido: **20 nodos con dos
coordenadas, la peor a 1,90 m**, y 22 soldaduras — cuadra.

```
nodo 1852: 2 coordenadas, separadas 1,90 m
nodo 1830: 2 coordenadas, separadas 1,58 m
```

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todos los contadores de la
tanda anterior, y son muchos.** 5.121 nodos, 7.175 aristas, 20 componentes, 10 de 10 cruces
conocidos, las tres contrapruebas en rojo, y las rutas de cordura con su rodeo correcto. **Ninguno
podía verlo, porque todos preguntan por la topología y el fallo estaba en la geometría.** El grafo
*funcionaba*: Dijkstra encontraba los caminos, las distancias eran correctas al metro, la
conectividad era real. Lo único que estaba mal era **dónde se dibujaba**, y eso no lo mide ningún
contador de red.

**Cómo se cazó:** por el cuadre que el briefing exigía **antes** de enseñarle el visor a nadie —
*"cuenta las aristas del exportado y compáralas con las 7.175"*. Y no lo cazó el número de aristas,
que cuadraba: lo cazó el de **nodos**, que era el que yo había dado por rutinario. ⚠️ Y estuve a
punto de despacharlo con una nota explicando que la diferencia era del redondeo — **una explicación
plausible, escrita antes de comprobarla**. El signo de la diferencia la desmintió.

**Arreglo aplicado:** al soldar se mueve también el extremo geométrico al nodo destino y **se
recalcula la longitud** de la arista. Comprobado que solo cambian longitudes: nodos, aristas,
componentes, cruces y contadores idénticos, y el cuadre pasa a **5.121 = 5.121**.

**Ley que sale de aquí:** ⭐⭐ **un grafo tiene dos verdades —quién se conecta con quién, y dónde
está cada cosa— y se pueden contradecir sin que nada falle.** Toda operación que cambie la identidad
de un nodo tiene que mover su geometría, o el dibujo dejará de ser el grafo. ⚠️ Y el corolario que
justifica esta tanda entera: **los contadores de topología son ciegos a los errores de geometría**,
así que un grafo verificado solo con contadores está verificado a medias.
**Traza:** `src/planarizar.js` (soldadura de D5), `src/exportar.js` (el cuadre)

---

## [2026-08-03] — El visor tenía un error de sintaxis y habría abierto en blanco

**Categoría:** instrumento / prueba que no se hizo
**Síntoma:** al ejecutar la comprobación del visor contra los datos reales:

```
C4 · ¿EJECUTA EL VISOR CON EL FICHERO REAL?
   ⛔ EL VISOR REVIENTA: Unexpected token '+'
```

En el control de capas había escrito una expresión como clave de objeto sin corchetes:

```js
'3 · unido-por-defecto (D2) — ' + G.porDefecto.length: capaDefecto,     // ⛔ error de sintaxis
```

**No es un fallo de lógica ni un caso raro: el fichero entero no parsea.** Abierto en un navegador
habría dado **una página en blanco**, o el mapa de fondo sin una sola línea del grafo encima.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **todo lo anterior de la tanda.** La
reproyección con 0,080 mm de error, el cuadre de las 7.175 aristas, el peso del fichero, los seis
`unido-por-defecto` localizados. **El instrumento que iba a mirar todo eso no arrancaba, y nada de
lo comprobado lo decía** — porque comprobaban el **dato** que el visor iba a pintar, no el visor.

Y hay una trampa fina detrás: **el fallo estaba en el código que construye la leyenda de capas**, es
decir, en lo más decorativo del fichero. Es exactamente lo que uno no revisa cuando ha escrito bien
la parte difícil.

**Cómo se cazó:** porque no tengo navegador aquí y no podía escribir *"abre el visor y funciona"*.
En vez de afirmarlo, monté un **Leaflet simulado** que no dibuja sino que **cuenta**, y ejecuté el
script del HTML en Node contra él. Reventó a la primera. ⭐ **La limitación —no tener navegador— fue
lo que produjo la comprobación**: con un navegador delante habría abierto, visto el blanco y
depurado a ojo, pero no me habría quedado un test repetible.

**Y el mismo montaje sirvió para lo que de verdad importaba:** demostrar que el visor **no filtra en
silencio**. Cuenta 14.401 polilíneas, exactamente `7.175 × 2 capas + 51 puntas`, y con una arista
falsa plantada sube a 14.403 y vuelve a 14.401 al quitarla.

**Ley que sale de aquí:** ⭐⭐ **un visor no probado es una promesa, y "lo he escrito con cuidado" no
es una prueba.** Cuando no se puede ejecutar el instrumento en su entorno real, **se simula el
entorno y se cuenta lo que produce** — que además deja un test repetible donde el ojo solo deja una
impresión.
⚠️ Corolario: **la parte decorativa de un fichero puede tumbarlo entero.** Un error de sintaxis en
la leyenda mata el mapa igual que uno en el algoritmo.
**Traza:** `src/probar-visor.js`, `tools/visor-grafo.html`

---

## [2026-08-03] — De las 19 componentes sueltas, la más grande —1.004 m— no era un hueco: era el borde del recorte

**Categoría:** artefacto de encuadre / clasificar antes de contar
**Síntoma:** el grafo del casco tiene 20 componentes: una con el 99,1 % y 19 islitas. Listadas una a
una para mirarlas, apareció ésta:

```
comp 6 · 2 nodos · 1 arista · 1.004 m · cycleway · "Camino de las Torres"
```

**Un kilómetro de carril bici desconectado del resto de la red.** Con la costura del briefing
—*"si alguna componente resulta ser grande o urbana, PÁRATE Y AVISA"*— eso es exactamente lo que hay
que reportar destacado.

**Causa raíz:** no es un hueco del grafo. El recorte a la zona **conserva el way entero si cualquier
vértice cae dentro**, así que un way largo que entra por un lado y sigue fuera tiene **sus dos
extremos fuera del bbox** — y por tanto no puede conectar con nada de dentro. Medida la distancia de
cada componente al borde:

```
comp  largo    dist. al borde
   6  1.004 m       5 m   ⬅ artefacto del recorte
   8    209 m       1 m   ⬅
   1    204 m       0 m   ⬅
   3    177 m       0 m   ⬅
   7     89 m       1 m   ⬅
  13    134 m     654 m       ← ésta sí es interior
```

**5 de las 19 tocan el borde**, y son justo las cinco más largas. Las 14 interiores suman poco: la
mayor es de 134 m.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el contador de componentes, que era
correcto.** Hay 20 componentes, de verdad, en el grafo tal como se construyó. El número no mentía:
mentía **leerlo como "20 trozos de ciudad incomunicados"**. Y era la lectura natural, porque es para
lo que se puso ese contador.

**Cómo se cazó:** por listar las 19 **una a una** en vez de contarlas — que es lo que el briefing
exigía y lo que este proyecto lleva por ley (*agrupar es borrar*, *clasificar antes de contar*). Con
"19 componentes pequeñas" en un informe, la de 1 km habría pasado como una más.

**Y lo que queda dicho, no arreglado:** el recorte por bbox **fabrica componentes falsas en el
borde**. Hoy no molesta —la zona es un banco de pruebas— pero **al planarizar la ciudad entera el
efecto desaparece por dentro y se traslada al límite del término**, donde las calles siguen y el
dato se acaba. Hay que volver a mirarlo entonces.
**Ley que sale de aquí:** ⭐⭐ **un recorte espacial no produce un trozo de la red: produce una red
distinta, con fronteras artificiales que se parecen a fallos.** Antes de interpretar cualquier
anomalía cerca del límite de una zona hay que medir su distancia al borde — y publicarla al lado del
número, porque el mismo grafo sobre una zona mayor daría otro resultado sin haber cambiado nada.
**Traza:** `src/osm.js` (`recortar`), listado de componentes en `docs/H1-INSPECCION-VISUAL.md`

---

## [2026-08-03] — El guardián se puso rojo, y al hacerlo contaminó el commit siguiente

**Categoría:** guardián / efecto colateral
**Síntoma:** el hook `commit-msg` rechazó, correctamente, un `fix:` que no llevaba entrada nueva en
la bitácora —yo había escrito la entrada nº53 pero **no la había incluido en ESE commit**—. Hasta
ahí, el guardián haciendo exactamente su trabajo, y por primera vez en el proyecto **sobre un fallo
real y no sobre una prueba provocada**.

Lo que pasó después:

```
git add src/planarizar.js src/geo.js && git commit -m "fix(motor): ..."
   -> RECHAZADO. El hook autogenera un esqueleto en la bitácora Y LO AÑADE AL STAGE.
git add src/exportar.js src/probar-visor.js && git commit -m "feat(tools): ..."
   -> ACEPTADO, con CINCO ficheros: los dos míos + planarizar.js + geo.js + BITACORA.md
```

**El commit siguiente se llevó todo lo que había quedado en el stage**, incluida la bitácora con un
esqueleto de `NO CONSTA` sin rellenar. Resultado: un commit que dice *"exportador y prueba del
visor"* y que contiene además **el arreglo de la soldadura de D5** — dos cosas distintas, que es
justo lo que la regla de commits atómicos existe para impedir.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el propio guardián, que
funcionó.** Rechazó lo que tenía que rechazar, avisó con su mensaje, y dejó preparado el esqueleto
para rellenarlo — todo correcto. **El daño no lo hizo fallando, lo hizo acertando**: el rechazo es
una operación que *modifica el índice de git*, y el índice es estado compartido con la operación
siguiente. Un guardián que solo dijera "no" habría sido inocuo.

**Causa raíz:** el hook hace `git add docs/BITACORA.md` como parte de su rechazo. Es una comodidad
razonable —deja el esqueleto listo— pero convierte un rechazo en una **mutación del stage**, y quien
viene detrás no sabe que el stage ya no está como lo dejó.

**Cómo se cazó:** por leer la salida de `git commit`, que decía `5 files changed` donde yo esperaba
2. ⚠️ **Estuve a punto de no mirarla**: el commit había salido bien y el mensaje era el que quería.
*Un resultado bueno despierta menos sospecha que uno malo*, otra vez.

**Arreglo aplicado:** ninguno en el hook —es de la tanda 1 y funciona—, pero **la historia NO se
reescribe**: la ley del proyecto prohíbe `reset`, `rebase` y `amend` sin pedirlo antes, y un
historial que enseña lo que pasó vale más que uno limpio. Se corrige hacia adelante: se borra el
esqueleto vacío, se escribe esta entrada, y **queda dicho que el commit `1571f01` no es atómico y
por qué**.

**Ley que sale de aquí:** ⭐⭐ **un guardián que modifica el estado que vigila estropea la operación
siguiente aunque acierte en la suya.** Es la ley nº9 —*la prueba que comparte estado con lo probado
no prueba nada*— vista desde el otro lado: aquí la prueba no se invalidó a sí misma, **invalidó lo
que venía después**.
⚠️ Regla operativa inmediata: **después de un commit rechazado, `git status` antes de volver a
añadir nada.** El rechazo no deja el mundo como estaba.
**Traza:** `.githooks/commit-msg`, commit `1571f01`

---

## [2026-08-03] — El crudo del "término municipal" traía calles de Costa Rica y de México

**Categoría:** homónimos en la consulta / evidencia que nadie había mirado entera
**Síntoma:** primera medida del crudo antes de planarizar la ciudad, el bbox del dato:

```
bbox del dato  S 10.018188  O -98.272155  N 41.981504  E -0.65456
ancho 18.012,4 km   alto -1.499,7 km
superficie del bbox 27.013.499,5 km2   (término real: 973,8 km2)
```

Un "término municipal" de **27 millones de km²** y con el alto **negativo**. Al listar los ways con
algún vértice fuera de una caja razonable alrededor de Zaragoza salieron **398**, con nombres que no
dejan lugar a dudas:

```
way 31806374  highway=primary  name=Carretera San Martín Texmelucan-Tlaxcala
way 31831535  highway=residential  name=Avenida Zahuapan
way 31831541  highway=residential  name=Calle Cuauhtémoc
```

**Causa raíz:** la consulta de la tanda 8 era

```
area["name"="Zaragoza"]["admin_level"="8"]["boundary"="administrative"]->.a;
way["highway"](area.a);
```

`area[...]->.a` **no devuelve un área: devuelve un conjunto de áreas**, y `(area.a)` busca en todas.
Hay al menos **cuatro municipios llamados Zaragoza con `admin_level=8`** en OSM. Agrupando por celda
de 1 grado:

```
 45.766 ways   41.650, -0.890    Zaragoza (España)
  2.047 ways   41.686, -1.039    Zaragoza (España, mitad oeste del término)
    299 ways   10.042, -84.436   Zaragoza (Costa Rica)
     99 ways   19.320, -98.262   Zaragoza de Puebla (México)
```

Es **el error nº38 otra vez** —los homónimos que fusionaron siete Plaza de España— pero un nivel más
arriba: no en mi agrupación de la respuesta, sino **en la pregunta**. Yo escribí la consulta creyendo
que nombraba un sitio, y nombraba una clase de sitios.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la tanda 8 entera, y su
verificación completa.** El primer grafo, los 10 cruces conocidos, las tres contrapruebas, el sello,
la instancia, la comprobación de que no era una réplica. Y sobre todo **el cabo que la tanda 8 dio
por cerrado**: *"0 ways sin highway, y 28 valores distintos"* — cierto, y calculado sobre un conjunto
que incluía 398 calles de otro continente. El casco no se enteró **porque el recorte por bbox las
tiraba**, así que el fallo estaba latente esperando exactamente a esta tanda: la primera que usa el
crudo entero.

⚠️ Y una segunda cosa dio verde: **`osm.recortar` funcionó perfectamente.** Ninguno de los 398 ways
está a caballo de la frontera, así que el recorte los elimina limpiamente. La función correcta tapó
el dato incorrecto.

**Cómo se cazó:** por medir el bbox del dato **antes** de usarlo, en vez de confiar en el nombre del
fichero. El número que lo delató no fue el de ways —48.211, perfectamente creíble— sino **la
superficie**, que salió con siete cifras de más. ⚠️ Y el signo otra vez: el alto **negativo** decía
que había latitudes por debajo del sur del término, no solo por encima.

**Arreglo aplicado:** el crudo **NO se toca** —es evidencia, y la evidencia no se edita—. Se define
`ZONA_TERMINO` como el bbox del cúmulo español y se recorta con él, con el censo de cúmulos impreso
al lado para que la exclusión sea **declarada, no silenciosa**. Quedan 47.813 ways.

**⛔ Lo que NO se arregla aquí:** `docs/H1-PRIMER-GRAFO.md` publica *"ways 48.211, todos con tags y
con geometría"*. Es registro histórico y **no se reescribe**: la corrección va en
`docs/H1-GRAFO-CIUDAD.md` diciendo qué corrige y por qué. Reportado hacia arriba.

**Ley que sale de aquí:** ⭐⭐ **un filtro por nombre no selecciona un sitio, selecciona todos los
que se llaman así — y en una consulta geográfica eso no da un error, da un dato más grande.** Toda
descarga por nombre se audita midiendo **la extensión de lo que llegó**, no su volumen: 398 ways de
más no se notan en 48.211, pero mueven el bbox 18.000 km.
⚠️ Corolario: **un recorte posterior puede ocultar un fallo de la descarga durante tandas enteras.**
El casco tapó esto desde el 3 de agosto por la mañana.
**Traza:** `src/ruta.js` (`ZONA_TERMINO`), `src/osm.js` (`clusters`), `docs/H1-PRIMER-GRAFO.md:43`

---

## [2026-08-03] — Un rodeo de 0,89: la ruta salía más corta que la línea recta

**Categoría:** el instrumento, no el grafo
**Síntoma:** en la prueba de puentes, entre los 32 cruces de río apareció éste:

```
✅ Ronda Hispanidad | Huerva    88 m  (recta 99 m, rodeo 0.89)
```

**Un rodeo menor que 1 es imposible.** El camino más corto por una red no puede ser más corto que
la línea recta entre sus dos extremos. Si eso pasa, o el grafo está roto o la medida lo está.

**Causa raíz:** la medida. Yo comparaba la ruta —que va de **nodo enganchado** a **nodo
enganchado**— contra la recta entre **los extremos del way del puente**. Son cuatro puntos
distintos: el nodo del grafo más cercano al extremo del puente puede estar 15 m más adentro, y
entonces la ruta recorre menos distancia que la recta con la que la comparo. **Dos magnitudes que
no empiezan ni acaban en el mismo sitio.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **la prueba de los ríos entera, que
es la comprobación más importante del proyecto.** 36 de 36 pares al azar cruzando el Ebro, el Huerva
y el Gállego, con su semilla, su positivo de control del detector de márgenes y sus rodeos de 1,1 a
1,4. Todo correcto. Y el mismo instrumento, dos líneas más abajo, imprimía un número imposible sin
inmutarse — **porque no tenía ninguna comprobación de que el rodeo fuera >= 1.** Un umbral que nadie
pone no salta.

**Cómo se cazó:** por leerlo. No había guardián: el aviso solo se disparaba con rodeo **alto**, el
caso que yo esperaba. **El extremo contrario no estaba vigilado porque no se me había ocurrido que
pudiera pasar**, que es exactamente cuándo pasan las cosas.

**Arreglo aplicado:** la recta se mide **entre los nodos enganchados**, que son los extremos reales
del camino; y se añade la comprobación explícita `rodeo < 0,999 ⇒ ⛔ IMPOSIBLE`. Con eso el caso
pasa a 1,00 y el guardián queda puesto para la próxima. Se aplica también a las rutas de cordura
(C5), donde ahora hay un contador de "rodeos imposibles" que hoy vale 0.

**Ley que sale de aquí:** ⭐⭐ **una comparación entre dos magnitudes exige que empiecen y acaben en
el mismo sitio, y "casi el mismo sitio" no es el mismo sitio.** Y el corolario operativo: **cuando
una magnitud tiene una cota física —un rodeo nunca baja de 1, una distancia nunca es negativa—,
esa cota se comprueba en el código**, porque es gratis y porque es el único aviso que llega cuando
el fallo está en el sitio donde no se mira.
**Traza:** `src/verificar-rios.js` (C1b y C5)

---

## [2026-08-03] — Mi "positivo de control" era una coordenada que me había inventado de memoria

**Categoría:** control inventado / rellenar con lo que parece razonable
**Síntoma:** al estrenar el detector de dentro/fuera del término municipal, siete controles y uno
en rojo:

```
✅ Plaza del Pilar (Zaragoza)                       dentro=true   esperado=true
✅ Villanueva de Gállego (OTRO municipio)           dentro=false  esperado=false
✅ Utebo (OTRO municipio)                           dentro=false  esperado=false
⛔ La Muela (OTRO municipio)                        dentro=true   esperado=false
   ⇒ 6 de 7  ⛔ ROTO
```

**Causa raíz:** el detector estaba bien. **Lo que estaba mal era mi coordenada.** Escribí
`-1.030, 41.580` como "La Muela" tirando de memoria, y ese punto cae dentro del término de
Zaragoza —por ahí está la plataforma logística—. El pueblo de La Muela está bastante más al oeste.
No comprobé la coordenada contra nada: **la puse porque me sonaba.**

Y eso es justo lo que las reglas de este proyecto prohíben en la primera línea: *si algo no se sabe,
se dice `NO CONSTA`; nunca se rellena con lo que parece razonable*. Lo prohibido no fue el error de
memoria: fue **presentar un dato recordado como si fuera un dato comprobado**, y encima usarlo para
juzgar un instrumento.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** los otros **seis** controles. Y ahí
está lo venenoso: un panel con 6 de 7 en verde **parece más creíble que uno con 7 de 7**, porque
tiene pinta de no estar amañado. Estuve a un paso de escribir "el detector falla en un caso" y
seguir — habría publicado una limitación falsa de un instrumento correcto, y habría desconfiado del
límite municipal el resto de la tanda.

**Cómo se cazó:** porque el rojo no encajaba. Los otros tres municipios daban `false` limpiamente,
y no había ninguna razón geométrica para que ese fallara. **La sospecha no vino del número sino de
su forma:** un detector de polígonos no falla en un punto suelto y acierta en los demás.

**Arreglo aplicado:** se sustituyen los controles por otros que **no dependen de lo que yo crea
recordar**:
· cuatro puntos a 5 km **por fuera del bbox del propio término** — están fuera por construcción;
· dos calles tomadas **del propio crudo por su nombre** (`Calle del Coso`, `Avenida de Navarra`) —
  están dentro por evidencia;
· y los municipios vecinos que sí eran correctos.
Resultado: **8 de 8**, en los dos sentidos.

**Ley que sale de aquí:** ⭐⭐ **un positivo de control no vale si el valor esperado sale de la
memoria de quien escribe la prueba.** Tiene que salir de otro fichero, de otra consulta o de la
propia geometría — porque si sale de la cabeza, la prueba no compara el instrumento con la realidad:
compara el instrumento con mi recuerdo, y cuando discrepan **el sospechoso por defecto es el
instrumento, que es el inocente.**
**Traza:** `src/limite.js`, controles de `dentro()`

---

## [2026-08-03] — Un clasificador que llamaba "trozo urbano" a pistas de campo sin nombre

**Categoría:** la etiqueta promete lo que la regla no mide
**Síntoma:** primera clasificación de las 168 componentes sueltas del grafo de la ciudad:

```
   83  hueco de mapeado (5-50 m del continente)
   45  ⚠️ TROZO URBANO GRANDE Y AISLADO — HAY QUE MIRARLO
   36  islote de mapeado (<200 m, lejos del continente)
```

**45 trozos urbanos aislados** dispara la costura del briefing —*"si aparece una componente grande y
urbana que no sea artefacto, PÁRATE Y AVÍSAME DESTACADO"*—. Pero al mirarlos uno a uno:

```
comp 55 · 24 nodos · 33.150 m · highway=track · nombre: SIN NOMBRE   41.81135, -1.10669
comp 84 · 17 nodos ·  9.234 m · highway=service,track · SIN NOMBRE   41.53086, -1.14985
```

Pistas de campo en mitad de la estepa.

**Causa raíz:** la regla que producía esa etiqueta era, literalmente,
`if (L >= 200 && dCont >= 50) return 'TROZO URBANO GRANDE Y AISLADO'`. **No mira la densidad, ni el
tipo de vía, ni si hay una sola calle con nombre.** Mide longitud y distancia, y la etiqueta dice
"urbano". La palabra hacía un trabajo que el código no hacía.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el número, que era exacto.** Había
45 componentes que cumplían esa condición, ni una más ni una menos, y el listado, las coordenadas y
los enlaces a OSM eran todos correctos. **Lo único falso era el nombre de la clase** — y el nombre
de la clase es lo único que se lee en un resumen. Es el mismo mecanismo del 8,36 % (nº43) y del
contador que devolvía una constante (nº49): el instrumento no se equivoca al medir, se equivoca al
decir qué ha medido.

**Cómo se cazó:** porque el briefing obligaba a listar las 20 mayores **una a una** (*agrupar es
borrar*), y a la tercera línea ya se veía `SIN NOMBRE · highway=track` bajo el epígrafe "urbano".
Con solo el recuento agregado —"45 trozos urbanos aislados"— habría parado la tanda y avisado en
rojo de algo que no existe.

**Arreglo aplicado:** "urbano" pasa a medirse: **calles `residential`/`living_street`/`pedestrian`
con nombre** y densidad de nodos alrededor, ambas impresas al lado de cada componente. Quedan
**3**, no 45.

**Ley que sale de aquí:** ⭐⭐ **el nombre de una categoría es una afirmación, y hay que
comprobarlo como cualquier otra.** Antes de publicar una clasificación hay que leer la regla y
preguntarse *¿mide esto lo que dice la etiqueta?* — porque el lector solo va a leer la etiqueta, y
un cero o un cuarenta y cinco mal nombrados producen exactamente la decisión equivocada.
**Traza:** `src/verificar-ciudad.js` (C2, `queEs`)

---

## [2026-08-03] — La regla del borde se tragó a Peñaflor entero: 294 nodos y 317 calles, clasificados como "artefacto"

**Categoría:** un solo eje mezcla qué es una cosa con por qué está así
**Síntoma:** arreglado el clasificador anterior, apareció esto en el listado:

```
comp 40 · 294 nodos · 327 aristas · 19.112 m
     41.76682, -0.88154
     al continente 57,2 m  ·  al LÍMITE MUNICIPAL 0,01 km  ·  dentro del término
     densidad máx 21 nodos/150 m  ·  calles con nombre 317
     highway=residential,path,service   nombre: Calle Entrada | Calle de Abril | Calle de Febrero
     ⇒ artefacto del límite municipal (<300 m del borde)
```

**Un pueblo entero del término, con 317 calles con nombre, etiquetado como "artefacto".** Y por
tanto **no contado** en el contador de componentes urbanas aisladas, que daba 0.

**Causa raíz:** mi clasificador tenía **un solo eje** y las reglas se evaluaban en orden. La primera
que casaba ganaba, y la de "pegado al límite municipal" iba antes que la de "tejido urbano". El
resultado: la **causa** de que esté suelto cancelaba **qué es** lo que está suelto.

Y la causa es real —a Peñaflor de Gállego se llega cruzando Villanueva de Gállego, que es otro
municipio, así que la carretera no está en la descarga—. **Pero que la causa esté explicada no hace
que el vecino de Peñaflor pueda llegar.** Explicar un agujero no es taparlo.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la costura del briefing, que
daba 0.** *"Aparece una componente grande y urbana que no sea artefacto del límite municipal →
PÁRATE Y AVÍSAME DESTACADO"* — y el contador decía `0 ✅ ninguna`. **La costura funcionaba; era su
definición la que se había comido el caso.** Es el fallo más peligroso de los cuatro de esta tanda,
porque el instrumento que tenía que gritar estaba diciendo que todo bien.

**Cómo se cazó:** otra vez por listar las 20 mayores **una a una** en vez de fiarme del recuento. La
línea "317 calles con nombre" bajo la etiqueta "artefacto" no se sostiene ni un segundo.

**Arreglo aplicado:** **dos ejes independientes, y los dos se imprimen**: `QUÉ ES` (tejido urbano ·
unas pocas calles · pistas sin nombre · islote de geometría) y `POR QUÉ ESTÁ SUELTA` (límite
municipal · hueco de mapeado · fuera del término · aislada de verdad). Y un tercer dato que hacía
falta para no confundir un barrio nuestro con el pueblo de al lado: **qué porcentaje de la
componente cae dentro del término** — con un booleano, la cola de un pueblo vecino que asoma 20 m
daba el mismo aviso que Peñaflor. Quedan **3** componentes de tejido urbano del término aisladas,
las tres por el límite municipal, y **se reportan**.

**Ley que sale de aquí:** ⭐⭐ **cuando una clasificación mezcla "qué es" con "por qué está así", la
explicación se come al hecho — y siempre en la misma dirección: hacia abajo, hacia el "no pasa
nada".** Los dos ejes van separados y los dos se publican. ⚠️ Corolario, que es la versión dura de
*agrupar es borrar*: **una clase llamada "artefacto" es una papelera, y todo lo que cae en una
papelera deja de mirarse.**
**Traza:** `src/verificar-ciudad.js` (C2, `queEs` y `porQue`), `src/limite.js`

---

## [2026-08-03] — El grafo deja andar por 13,8 km de calles que todavía no existen

**Categoría:** filtro incompleto / lo que el casco no podía enseñar
**Síntoma:** al clasificar los 114 `unido-por-defecto` de la ciudad, los 8 del grupo más exigente
—`RODADA × RODADA`, sin ninguna vía peatonal de por medio— resultaron ser esto:

```
41.66798,-0.84891   (sin nombre) [proposed]  x  (sin nombre) [proposed]
41.66741,-0.84842   (sin nombre) [proposed]  x  (sin nombre) [proposed]
41.66651,-0.84885   (sin nombre) [proposed]  x  (sin nombre) [proposed]
41.66546,-0.84672   Camino Valimaña [residential]  x  (sin nombre) [proposed]
```

Siete de los ocho son `highway=proposed`: **calles proyectadas, que no están construidas.**

**Causa raíz:** `transitableAPie()` excluye `motorway`/`trunk`, `foot=no` y `highway=construction`.
**No excluye `proposed`.** Y no por descuido de criterio sino porque **en el casco no había ni una**:

```
highway            ciudad: aristas / a pie / metros     casco
proposed              178 /   178 /  13.805 m           0 / 0
construction          693 /     0 /  49.981 m         117 / 0
```

`construction` sí se excluyó **porque en el casco había 117 y me las encontré de frente**. El
criterio que se escribió no fue "las vías que no existen no se andan", que es el general, sino "esta
vía que me ha salido no se anda", que es el caso particular disfrazado de regla.

**No es cosmético.** Medido sin tocar nada:

```
aristas proposed transitables a pie: 178
  de ellas, ARTICULACIONES (único paso): 23
  si se quitaran: mayor 65.933 -> 65.851  ⇒ 82 nodos se quedarían sin conexión
```

**23 de ellas son el único paso**, así que hoy el motor puede mandar a alguien por una calle que
no existe, y **82 nodos están conectados al resto de la ciudad solo a través de una calle
proyectada.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la tanda 8 entera y su
comparación con ésta.** El casco daba `construction 117 / 0 a pie` — el filtro funcionando
perfectamente y publicado como tal. Y en esta tanda dieron verde **los ríos (36 de 36), las tres
contrapruebas, los 10 cruces conocidos, las 15 rutas de cordura con rodeo entre 1,08 y 1,22 y las
0 componentes urbanas sin explicar.** Ninguna podía verlo: todas preguntan *¿se puede llegar?*, y
la respuesta era sí — **por una calle que no está.** Una ruta por una calle inexistente es
indistinguible de una ruta buena en todos los contadores de red.

**Cómo se cazó:** por clasificar los `unido-por-defecto` **por causa aparente antes de dar el
número** (ley 29), que es lo que el briefing exigía. El contador agregado decía "114, y por cada
1.000 aristas sube de 0,84 a 1,15 — no se dispara". Correcto y tranquilizador. **La clase
`RODADA × RODADA` tenía 8 casos y era la única que en el casco valía 0**: mirarla fue lo que sacó
la palabra `proposed`.

**⛔ NO ARREGLADO — a propósito.** El briefing de esta tanda lo prohíbe expresamente: *"NO cambies
las reglas D1–D5. Si crees que alguna falla a esta escala, PÁRATE Y DÍMELO — no la toques. Cambiar
la regla y la escala a la vez invalida la comparación."* Tocar `transitableAPie` cambiaría el grafo
y haría incomparable toda la tabla casco-vs-ciudad que es el producto de la tanda. **Queda medido,
localizado y reportado hacia arriba; lo decide Antonio.**

**Ley que sale de aquí:** ⭐⭐ **un filtro escrito enumerando los casos que aparecieron no es una
regla: es una lista, y las listas se quedan cortas en cuanto cambia la muestra.** `construction`
entró porque salió; `proposed` no entró porque no salió. ⚠️ Y el corolario que explica por qué
esta tanda existía: **una zona pequeña no solo tiene menos casos, tiene menos CLASES de caso — y
las clases que faltan no dejan hueco visible.** Un cero en el casco no significaba "aquí no pasa":
significaba "aquí no se ve".
**Traza:** `src/planarizar.js` (`transitableAPie`), `src/ciudad.js` (B2, clasificación)

---

## [2026-08-03] — Al arreglar `proposed` apareció algo mayor: 24 km con `access=no` por los que también se andaba

**Categoría:** el arreglo destapa lo que el diagnóstico no vio
**Síntoma:** sustituida la lista por la regla, el delta contra la tanda 10 no salió como esperaba.
Yo iba a por los 13,8 km de calles proyectadas del fallo nº62, y salió esto:

```
⭐ LOS 42,57 km QUE DEJAN DE SER ANDABLES, POR MOTIVO:
     23,95 km   access=no          ⬅ NO estaba en el diagnóstico
     13,91 km   no existe hoy      ⬅ esto era lo que iba a arreglar
      1,84 km   área de servicio de autovía
      1,73 km   circuito
      1,11 km   área de descanso de autovía
      0,03 km   calzada reservada a autobuses
```

**El motivo que yo perseguía era el segundo, no el primero.**

**Causa raíz:** la regla de la tanda 10 comprobaba `t.foot !== 'no'` **y solo eso**. En OSM,
`foot=no` prohíbe el paso a pie; `access=no` prohíbe el paso **a todo el mundo**, y es más general.
Un way con `access=no` y sin `foot=no` —que es la forma normal de etiquetar un recinto cerrado—
**pasaba el filtro entero**. Son 284 aristas y **134 nodos que estaban conectados a la ciudad a
través de ellas**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el informe de la tanda 10, que
contó los `access=private` uno a uno.** Aquel informe publica `ACCESO RESTRINGIDO · access=private
1.108` en su tabla B6, con su positivo de control y su control negativo. **Miré la familia `access`
entera para clasificar los pasos condicionales, y no se me ocurrió mirar si el enrutador la
respetaba.** Contar una cosa y usarla son dos operaciones distintas, y verificar la primera no dice
nada de la segunda. También dieron verde los ríos, los 32 puentes, las tres contrapruebas y los 10
cruces conocidos: todos preguntan *¿se puede llegar?*, y la respuesta seguía siendo sí — cruzando
un recinto cerrado.

**Cómo se cazó:** por **medir el delta por motivo en vez de en total** (§A4). El total, 506 aristas,
era perfectamente creíble para "quitar las proposed". Fue desglosarlo lo que enseñó que el motivo
mayoritario no era el que yo estaba arreglando. ⚠️ Y hay un detalle que salva la medida: los metros
y las aristas cuentan cosas distintas —188 aristas son 13,91 km y 284 son 23,95—, así que **mirar
solo el conteo de aristas habría dado 188 vs 284, mucho menos llamativo que 14 vs 24 km.**

**⭐ Y un contador independiente que cuadra entre tandas:** quitar solo `proposed` deja la
componente mayor en 65.851, **exactamente los −82 nodos que predijo la tanda 10** sin haber
escrito todavía la regla. Dos tandas, dos instrumentos distintos, el mismo número.

**Arreglo aplicado:** `access=no` entra en la puerta G3 junto a `foot=no`. Las dos son
prohibiciones inequívocas. ⛔ **`access=private` y `foot=use_sidepath` NO entran**, y tampoco por
gusto: aplicarlas crea **29 y 15 componentes nuevas** respectivamente. Una etiqueta que dice "usa la
acera de al lado" solo es aplicable si la acera de al lado está en el grafo, y que aparezcan islas
al aplicarla demuestra que en 15 sitios no está. Quedan medidas y reportadas.

**Ley que sale de aquí:** ⭐⭐ **haber contado una cosa no significa que el motor la respete.** Un
inventario y un filtro son dos usos del mismo dato, y verificar el inventario no verifica el filtro
— de hecho da la sensación contraria, porque uno se queda con que "esa familia de etiquetas ya está
mirada".
⚠️ Corolario de medida: **un delta se desglosa por motivo antes de darse por bueno**, y en la
unidad que hace visible la diferencia. En aristas el fallo real era 1,5 veces el buscado; en metros,
1,7 — y en el total, invisible.
**Traza:** `src/planarizar.js` (G3), `src/transitabilidad.js` (A4)

---

## [2026-08-03] — 179 de los "320 pasos condicionales" eran gasolineras y marquesinas: `covered` significa "tiene techo"

**Categoría:** una etiqueta que significa otra cosa / agrupar es borrar
**Síntoma:** al ampliar la búsqueda de pasos condicionales, probé a **propagar por nombre** desde
una etiqueta —si un tramo de "Pasaje X" está etiquetado, el pasaje entero lo es—. Parecía sólido.
Salieron **393 ways**, y entre ellos:

```
way 43017944    [primary]    Paseo de Sagasta
way 24577443    [secondary]  Puente del Tercer Milenio
way 15801528    [tertiary]   Avenida de César Augusto
```

El Paseo de Sagasta entero —con sus 60 aceras— clasificado como paso condicional.

**Causa raíz, y son dos.** La primera es la propagación: **compartir nombre con un pasaje no es ser
el pasaje**. Pero al buscar cuál era el way de Sagasta que disparaba la propagación, apareció la
segunda, que es peor:

```
way 301326885  {"covered":"yes","footway":"crossing","highway":"footway",
                "crossing":"traffic_signals","name":"Paseo de Sagasta", …}
```

**Un paso de peatones con marquesina.** Y de ahí sale el fallo de fondo: yo había metido
`covered=yes` en la lista de pasos condicionales, y **`covered` no significa "no siempre abierto":
significa "tiene techo"**. Mirados los 179:

```
por highway:  footway 95 · service 65 · steps 7 · pedestrian 3 · secondary 2 · …
```

Los 65 `service` son **surtidores de gasolinera y un McAuto**. Dos son el Puente del Tercer Milenio,
que tiene celosía. **Un paso de peatones cubierto no cierra por la noche.**

**⛔ Y corrige un número publicado.** `docs/H1-GRAFO-CIUDAD.md` §B6 da **320 pasos condicionales**
tras haberlos clasificado —y presumo de haberlos clasificado, porque separé los 1.226
`access=private` que sí eran otra cosa—. De aquellos 320, **179 son `covered=yes`**. El informe no
se reescribe: la corrección va en `docs/H1-PORTALES.md`.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la clasificación de la tanda
10, que es justo donde estaba el error.** Aquel §B6 lleva su positivo de control (`highway=footway`
→ 21.738 ✅), su control negativo (un tag inventado → 0 ✅) y una separación explícita entre "paso
condicional" y "acceso restringido" que era **correcta y que me dejó tranquilo**. Separé bien dos
familias y **no miré dentro de la que me quedé**. Haber acertado una distinción difícil fue lo que
hizo que no revisara la fácil.

**Cómo se cazó:** por un camino que no iba a esto. Estaba probando la propagación por nombre —que
resultó ser mala idea— y para entender por qué se llevaba el Paseo de Sagasta tuve que mirar **el
way concreto** que la disparaba. ⭐ **El fallo lo destapó la depuración de otro fallo**, y solo
porque fui a ver el caso individual en vez de descartar la propagación por el número.

**Arreglo aplicado:** la búsqueda distingue **FIRME** de **INDICIO**, y solo lo firme se excluye:
· FIRME: `tunnel=building_passage`, `indoor=yes`, `highway=corridor`, `opening_hours`,
  `highway=elevator` — todos implican **atravesar algo que tiene dueño y puerta**.
· INDICIO, se marca y se cuenta pero NO se excluye: `covered=yes`, el nombre, y la geometría.
Quedan **151 ways excluidos** (189 aristas, 44 de ellas articulación) y 361 marcados.

**Ley que sale de aquí:** ⭐⭐ **una etiqueta no significa lo que su nombre sugiere en tu idioma:
significa lo que su comunidad decidió que significara.** `covered` describe un techo, no un horario.
⚠️ Y el corolario que explica por qué se me pasó: **haber separado bien una familia de etiquetas da
la sensación de haber revisado todas**, y es justo al revés — el esfuerzo se gasta en la frontera
difícil y el interior de cada grupo se da por bueno.
**Traza:** `src/condicionales.js` (`porEtiqueta`, firme vs indicio), `docs/H1-GRAFO-CIUDAD.md` §B6

---

## [2026-08-03] — La vía geométrica tiene un 36 % de recall: sirve para señalar, no para cortar

**Categoría:** un instrumento con señal real que no es accionable
**Síntoma:** la tercera vía de búsqueda —tramos peatonales que atraviesan el polígono de un
edificio— encontró **173 candidatos que ninguna etiqueta declara**. Ese número, solo, invita a
excluirlos: son pasos que nadie ha etiquetado.

Pero antes de actuar lo validé contra los que sí están etiquetados, que es la única verdad conocida
que hay:

```
etiquetados building_passage, peatonales y en zona   73
⭐ los detecta la geometría                          26  (36 % de acierto)
no los detecta                                       47
   way 107996390   Pasaje del Comercio
   way 107996393   Pasaje de la Industria
   way 169448594   Pasaje Miraflores
```

**Se le escapan dos tercios**, y entre ellos tres galerías comerciales del centro que cualquiera
reconoce. Y mirando sus aciertos más profundos:

```
260 m dentro   pedestrian  (sin nombre)             41.65669,-0.90842
114 m dentro   pedestrian  Plaza Lagos Azules       41.65954,-0.93296
 78 m dentro   pedestrian  Plaza Albeta             41.64935,-0.85936
```

**260 metros "dentro de un edificio" no es un pasaje.** Son plazas y patios de manzana que OSM
tiene dibujados dentro del polígono del bloque.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **la línea base, que era buena.** La
vía geométrica marca el 1,20 % de los tramos peatonales del centro y acierta en el 36 % de los
etiquetados: **29,7 veces el azar**. Esa cifra es correcta y es una señal real — y **es exactamente
la clase de número con el que se justifica una decisión equivocada**. 29,7× el azar sobre una base
del 1,2 % sigue dejando la mayoría de los hallazgos sin confirmar.

**Cómo se cazó:** porque el positivo de control se calculó **antes** de usar el resultado, y en la
dirección incómoda: no *"¿cuántos encuentro?"* sino *"¿cuántos de los que sé que están se me
escapan?"*. La primera pregunta da 173 y anima; la segunda da 36 % y frena.

**Arreglo aplicado:** la vía geométrica **no excluye ninguna arista**. Marca, cuenta y se publica
con su recall al lado para que Antonio mire los 173. La salvaguarda mira, cuenta y avisa: no arregla.

**Ley que sale de aquí:** ⭐⭐ **un múltiplo sobre el azar mide que la señal existe, no que sirva
para decidir.** Con una base del 1 %, 30× el azar sigue siendo 30 % de acierto — y una regla que
acierta un tercio no puede cortar nada. Antes de actuar sobre un detector hay que preguntarle **qué
se le escapa**, no cuánto encuentra: el recall se mide contra lo que ya se sabe, y si no hay nada
conocido contra lo que medirlo, el detector no está validado.
**Traza:** `src/condicionales.js` (`atraviesaEdificio`, `decidir`)

---

## [2026-08-03] — Una línea base que no podía bajar la señal: barajar paridades no baraja nada

**Categoría:** el azar de control no era azar
**Síntoma:** al remedir el lado de la calle sobre el grafo planarizado, la línea base salió así:

```
LÍNEA BASE (paridades barajadas) >=0,95   30,5 %
la señal real >=0,95                      76,0 %
⇒ 2,5× el azar
```

**2,5× el azar** es un resultado tibio para una regla que la adenda había medido en **89,5 % contra
un 4,3 % de base**. Y el número que chirriaba no era la señal: era **la base**, siete veces más
alta de lo que debería.

**Causa raíz:** la línea base baraja **las paridades de los portales dentro de cada arista**. Sobre
ways enteros de OSM eso funciona, porque un way lleva portales de los dos lados. **Sobre una arista
planarizada, no.** Una arista es un tramo corto entre dos cruces, y sus 4 o 5 portales son
normalmente **todos pares o todos impares** — un solo lado de la calle. Barajar un conjunto
homogéneo deja el mismo conjunto: el acierto sigue siendo 1,00 hiciera lo que hiciera la baraja.

⇒ **Aquellos 30,5 % no medían el azar: medían cuántas aristas tienen los portales de un solo lado.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **el propio método de la adenda,
copiado al pie de la letra.** El §A2 dice "paridades barajadas" y da 4,3 %; yo hice exactamente eso.
Y ahí está lo fino: **la receta era correcta para la unidad en la que se escribió** —ways enteros— y
dejó de serlo al cambiar la unidad a aristas. La adenda incluso avisaba de que al partir *"la unidad
de medida cambia"*, y yo lo apliqué a la señal y **no a su control**.

**Cómo se cazó:** por comparar la base con la base anterior, no la señal con la señal. 4,3 % → 30,5 %
es un salto que ningún cambio de unidad justifica. ⭐ Y el diagnóstico salió de preguntarse **qué
tendría que romper la baraja para ser una baraja**: si el conjunto es homogéneo, no rompe nada.

**Arreglo aplicado:** la línea base sortea **el LADO de cada portal a cara o cruz**, que es lo que
de verdad destruye la correspondencia paridad↔lado. Resultado:

```
⛔ línea base MALA (paridades barajadas)   30,5 %   ⬅ no destruye la señal
⭐ LÍNEA BASE BUENA (lado a cara o cruz)    4,5 %
   la señal real >=0,95                    76,0 %
⇒ 16,9× el azar
```

⭐ **Y la corrección se confirma sola:** 4,5 % contra el **4,3 %** que midió la adenda por otro
camino y sobre otra unidad. Dos instrumentos distintos, el mismo azar.

**Ley que sale de aquí:** ⭐⭐ **una línea base es una contraprueba, y se le aplica la misma regla:
si no puede bajar la señal, no vale.** Antes de publicar un "×N el azar" hay que preguntarle al
control *¿qué destruye exactamente?* — y comprobar que lo que destruye es la relación que se está
midiendo, no otra cosa.
⚠️ Corolario: **al cambiar la unidad de medida hay que rehacer el control, no solo la medida.** Un
control heredado se hereda con su unidad pegada.
**Traza:** `src/informe-portales.js` (D4, línea base), `docs/DISEÑO-H1-ADENDA.md` §A2

---

## [2026-08-03] — Medí la exclusión de los pasos condicionales y no la apliqué. El mismo fallo que la nº63, en la misma tanda

**Categoría:** contar no es aplicar / el fallo repetido
**Síntoma:** al diagnosticar por qué la ruta 4 de Antonio daba 900 m para 351 m de línea recta, miré
a qué se enganchaba la estación de Delicias:

```
Delicias   a 31,1 m   way 437215854 "sin nombre"  [corridor]  comp 0
```

**Un `highway=corridor`.** Es decir, un pasillo interior — exactamente uno de los 151 ways que yo
mismo acababa de clasificar como **paso condicional firme** y del que había escrito, con su número
al lado, *"⭐ EXCLUIR LOS FIRMES: 189 aristas, 44 de ellas articulación, la mayor pierde 127
nodos"*. **Medido, publicado… y no conectado a nada.** El enrutador seguía usándolos.

**Causa raíz:** `src/informe-condicionales.js` calculaba el impacto de excluirlos construyendo una
adyacencia **suya, local, para el informe**. El grafo que usan las rutas se construye en
`src/ruta.js` y no sabía nada de aquello. Dos caminos que salen del mismo dato y solo uno llegaba al
motor.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el informe de la sección B
entero, y era correcto.** Las tres vías de búsqueda, el positivo de control del Pasaje Palafox, la
separación firme/indicio, el recall del 36 % de la vía geométrica, las 44 articulaciones. Todos los
números ciertos. **Un informe puede ser exacto y no haber cambiado nada.**

⚠️ Y lo peor: **es el mismo fallo que la nº63 de esta misma tanda**, donde `access=no` estaba
contado en la tabla B6 de la tanda 10 y el enrutador no lo respetaba. Escribí allí la ley *"haber
contado una cosa no significa que el motor la respete"* y **volví a hacerlo cuatro secciones más
abajo**. Saber enunciar una ley no es tenerla incorporada.

**Cómo se cazó:** por perseguir un rodeo raro hasta el final en vez de aceptarlo. La ruta 4 daba
2,57 de rodeo y podía haberlo despachado como "la estación es grande". Mirar **a qué arista concreta
se enganchaba** fue lo que sacó la palabra `corridor`.

**Arreglo aplicado:** el paso condicional pasa a ser **un CAMPO de la arista** (`e.condicional`),
como la precisión de D4 — no una exclusión del grafo. Sigue siendo terreno porque existe; lo que
hace `adyacencia(..., sinCondicionales)` es no dárselo al enrutador. Efecto medido: 189 aristas,
componentes 170 → 184, la mayor pierde 127 nodos.

⭐ **Y al aplicarlo cambió una respuesta:** la ruta 4 pasó de dar 900 m a decir **NO HAY CAMINO**,
porque el centro de la estación **solo es alcanzable por un pasillo interior**. Es la respuesta
correcta a la pregunta que se hizo, y es una respuesta que antes no aparecía.

**Ley que sale de aquí:** ⭐⭐ **un informe que mide el efecto de una decisión no implementa la
decisión, y los dos se parecen mucho por escrito.** Cuando una sección diga "⇒ se excluyen", el
cierre no es el número: es **ejecutar el motor y ver que el número aparece también ahí.**
⚠️ Y la observación incómoda: **enunciar la ley no vacuna contra el fallo.** Entre la nº63 y ésta
median cuatro secciones y una hora.
**Traza:** `src/planarizar.js` (`condicional`), `src/grafo.js` (`adyacencia`), `src/ruta.js`

---

## [2026-08-03] — Las siete rutas dieron 0 de 6 en banda, y tres de esas bandas son imposibles de cumplir

**Categoría:** el patrón del fallo es el hallazgo / comparar dos magnitudes distintas
**Síntoma:** primera ejecución del banco de pruebas de Antonio contra el motor:

```
dentro de la banda de Antonio    0 de 6
   ⚠️ nº2: 598 m frente a 350–450
   ⚠️ nº3: 3.731 m frente a 2.900–3.400
   ⚠️ nº5: 477 m frente a 350–450
   ⚠️ nº6: 523 m frente a 350–450
   ⚠️ nº7: 2.529 m frente a 1.800–2.100
```

**Cero de seis, y TODAS largas.** Eso no es ruido: un motor con error aleatorio se pasa unas veces y
se queda corto otras. Un sesgo sistemático apunta a una causa común.

**Causa raíz — y no está en el motor.** La comprobación que la encontró no usa el motor para nada:
**la línea recta es el mínimo físico absoluto**, y ninguna ruta puede medir menos.

```
   nº   recta   banda        ¿alcanzable?     km/h que exige la RECTA
   2     454   350-450      ⛔ IMPOSIBLE      5,4
   3    3000   2900-3400    ✅ sí             4,5
   4     351   350-450      ✅ sí             4,2
   5     348   350-450      ✅ sí             4,2
   6     484   350-450      ⛔ IMPOSIBLE      5,8
   7    2380   1800-2100    ⛔ IMPOSIBLE      5,7
```

**En tres de las seis la línea recta ya supera el tope de la banda.** Ningún motor —ni el mío ni
ninguno— puede entrar en esas bandas: son geométricamente inalcanzables.

Y la propia tabla explica por qué, en un aviso que escribió Antonio: *"LA DISTANCIA ESPERADA DE ESTA
TABLA ESTÁ DERIVADA DEL TIEMPO, NO ESTIMADA APARTE. Antonio dio los tiempos; las distancias salen de
convertirlos a ≈4,5–5 km/h."* ⇒ **La banda no es un dato independiente: es el tiempo multiplicado
por una velocidad supuesta.** Y la velocidad supuesta se queda corta.

⭐ **El número que lo fija es el nº7**, el único con tiempo real de repetición (25 min medidos):
solo la línea recta ya obliga a **5,71 km/h**, y por la calle son **6,07**. La banda se calculó
suponiendo 4,3–5,0.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** **todo el motor.** 7 de 7 direcciones
resueltas, 0 rodeos imposibles, rodeos de 1,06 a 1,37 —la mediana de las rutas de cordura de la
tanda 10 era 1,16—, el Puente de Piedra elegido correctamente en la nº1 y la esquina de la nº6 sin
engañar al enganche. **El instrumento funcionaba y el veredicto salía en rojo**, porque se comparaba
contra una regla que no medía lo mismo.

**Cómo se cazó:** ⭐ por preguntarse, antes de tocar nada, **si la banda era alcanzable en
absoluto**. Es la misma pregunta de la ley 35 —*¿puede esto pasar sin que nada funcione?*— vuelta
del revés: *¿puede esto fallar aunque todo funcione?* Y la respuesta se calcula con la línea recta,
que no depende del motor: **por eso el diagnóstico no es circular.**

**⛔ Lo que NO se ha hecho, a propósito:** no se ha tocado ningún umbral, ni el enganche, ni el
coste, para que las rutas entren en banda. Y **`RUTAS-CONOCIDAS.md` no se ha modificado** — ni para
anotar un resultado. La corrección, si la hay, es de la conversión tiempo→distancia, y esa tabla la
escribe Antonio.

**Ley que sale de aquí:** ⭐⭐ **antes de declarar que una prueba falla, hay que comprobar que la
prueba se puede aprobar.** Una banda derivada de otro dato por una constante supuesta no es una
diana: es la misma medición con una hipótesis pegada, y cuando el conjunto entero falla en la misma
dirección, **el sospechoso es la hipótesis, no el sujeto.**
⚠️ Corolario práctico: **un fallo unánime y con signo es información sobre el instrumento; un fallo
repartido lo es sobre el sujeto.**
**Traza:** `src/rutas-antonio.js`, `data/pruebas/RUTAS-CONOCIDAS.md` (⛔ sin tocar)

---

## [2026-08-03] — El comando con el que se interroga el motor contestaba con el grafo del casco. Un parámetro por defecto

**Categoría:** silencio falso / la decisión que nadie tomó
**Síntoma:** Antonio pide a mano una ruta de ciudad con el comando de siempre y le sale esto:

```
node src/ruta.js 41.6255 -0.8865 41.6516 -0.8797
   "encontrada": true,   "engancheOrigen": 512,   "rodeo": 0.9x
```

**Un enganche de 512 metros y un rodeo por debajo de 1 dentro de un JSON que dice `encontrada: true`.**
Ni una excepción, ni un aviso, ni un código de salida distinto de cero.

**Causa raíz — y no es "ruta.js estaba mal apuntado".** La firma era:

```js
function construir(zona = ZONA_CASCO, opciones = {}) {
```

y el CLI llamaba `construir()` a secas. **El grafo del casco antiguo son 3 km²; el término son
2.989.** Preguntar por Delicias contra el casco no produce un error: produce el nodo del casco más
cercano, que está medio kilómetro más allá, y a partir de ahí todo es coherente consigo mismo.
⇒ **La clase del fallo es que un parámetro por defecto es una decisión que nadie tomó y que nadie
ve.** Había **tres** llamadas apoyadas en ella (`ruta.js`, `informe.js`, `verificar.js`).

⭐⭐ **Y había una SEGUNDA causa, que arreglar la zona no habría tocado:** `resolver()` enganchaba al
**NODO** más cercano, no a la **ARISTA**. Medido sobre los 46.150 portales reales:

```
   a la ARISTA   mediana  5,3 m   p90  18,0 m   p99  65,2 m   MÁXIMO 303,1 m
   al NODO       mediana 24,4 m   p90  62,5 m   p99 197,3 m   MÁXIMO 566,6 m
```

⇒ **512 m cabía también en el grafo BUENO.** Si solo se hubiera corregido la zona, el síntoma habría
bajado de frecuencia y habría seguido vivo — que es la peor forma de arreglar algo.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo publicado, y con razón.**
Las siete rutas de la tanda 11 llamaban `construir(ZONA_TERMINO)` explícitamente; `informe.js` y
`verificar.js` querían el casco de verdad —la salida de `informe.js` es **idéntica byte a byte** antes
y después de escribir la zona—; el cuadre del visor, los ríos, el límite municipal, las tres
contrapruebas: todo correcto. **El único que miraba el grafo equivocado era el instrumento hecho para
depurar el motor**, y por eso no lo cazó ninguna verificación: ninguna lo usaba.

**Cómo se cazó:** ⭐ **una pregunta de curiosidad de Antonio, no una verificación.** Ejecutó el
comando a mano para ver los metros por tramo. Diecisiete tandas de contrapruebas no lo habían tocado
porque el fichero que fallaba no estaba en el camino de ninguna.

**Arreglo aplicado:** de clase, no del caso.
1. `construir()` **exige la zona** y lanza sin ella. No queda valor por defecto que decida por nadie.
2. **Todo grafo se DECLARA al construirse** por stderr —zona, bbox, sello, nodos, aristas, componentes,
   pasos condicionales dentro o fuera—, sin escotilla para callarlo. Por stderr para no ensuciar el JSON.
3. `src/auditoria-grafo.js`: guardián estático que recorre `src/` y **se pone rojo** si alguien
   obtiene un grafo sin zona a la vista.
4. El enganche pasa de nodo a **arista**, con `insertar`/`rutaEntre` subidos a `grafo.js`: había **dos
   motores** (el de `ruta.js` y el de `rutas-antonio.js`) y ahora hay uno.
5. Dos paradas nuevas: **rodeo físico < 1** y **enganche > 350 m**. Las dos con su rojo provocado en
   `src/probar-guardianes.js`.

**Ley que sale de aquí:** ⭐⭐ **un valor por defecto en un parámetro que elige el SUJETO de la medición
no es una comodidad: es una hipótesis silenciosa.** Los parámetros que eligen *cómo* se calcula pueden
tener defecto; los que eligen *sobre qué* se calcula, no.
⚠️ Y el corolario que más duele: **las herramientas de depuración no las verifica nadie**, porque son
las que verifican a las demás. `ruta.js` llevaba desde la tanda 8 sin que ninguna contraprueba pasara
por él.
**Traza:** `src/ruta.js` (`construir`, `declarar`, `resolver`, `engancharPunto`), `src/grafo.js`
(`insertar`, `rutaEntre`), `src/direccion.js` (`abrir`, `punto`), `src/auditoria-grafo.js`,
`src/probar-guardianes.js`, `src/informe.js`, `src/verificar.js`

---

## [2026-08-03] — El auditor se auditó a sí mismo y se denunció: 7 llamadas sospechosas donde había 3

**Categoría:** el instrumento se cuenta entre los sujetos
**Síntoma:** primera ejecución de `src/auditoria-grafo.js`, el guardián recién escrito para encontrar
quién construye el grafo sin declarar la zona:

```
   ⛔ llamadas SIN zona explícita              7
   auditoria-grafo.js   sí   ⛔ POR DEFECTO   construir()
   auditoria-grafo.js   sí   ⚠️ (fragmento de su propia concatenación de cadenas)
```

**Se acusaba a sí mismo cuatro veces**, y una de las acusaciones era un trozo de su propio código de
formato.

**Causa raíz:** el auditor busca el texto `construir(` en los ficheros de `src/`, y sus propias
expresiones regulares y sus mensajes **contienen literalmente ese texto**. Al listar el directorio se
incluía a sí mismo. Las llamadas reales sin zona eran **3**: `ruta.js`, `informe.js`, `verificar.js`.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el guardián se puso ROJO, que era
justo lo que se esperaba de él.** Salió con código 1 y una lista de culpables — y tres de los cuatro
primeros culpables eran él mismo. **Un rojo correcto por un motivo equivocado es indistinguible de un
rojo correcto** si solo se mira el código de salida.

**Cómo se cazó:** ojo humano, al leer la tabla antes de creerse el número. El nombre
`auditoria-grafo.js` en la columna de acusados no encaja con nada.

**Arreglo aplicado:** el auditor se excluye del listado (`f !== path.basename(__filename)`), con el
caso escrito en el comentario para que no vuelva a colarse. 7 → 3.

**Ley que sale de aquí:** ⭐ **un instrumento que se mide a sí mismo infla el numerador con su propio
cuerpo.** Todo contador que recorre un directorio tiene que declarar si se incluye — y casi siempre la
respuesta correcta es que no.
⚠️ Y la de segundo orden: **antes de creerse un rojo, hay que leer a quién señala.** El número de un
guardián no es su veredicto; su lista, sí.
**Traza:** `src/auditoria-grafo.js` (`YO`, `FICHEROS`)

---

## [2026-08-03] — El rojo del guardián del imposible físico saltó, pero por otro motivo

**Categoría:** el rojo correcto por la causa equivocada
**Síntoma:** `src/probar-guardianes.js`, la prueba que planta una arista de 1 m entre dos nodos
separados 2,7 km para comprobar que el motor **para** ante un rodeo por debajo de 1:

```
   positivo de control: la ruta real entre ellos     ⛔ no se resolvió
   rojo: la ruta mide menos que la línea recta       ✅   ⛔ FUERA DEL GRAFO · el origen (undefined, undefined)…
```

**El ✅ es falso.** El guardián que saltó fue el de A4 (*punto fuera del grafo*), no el de A3
(*imposible físico*). La prueba del teletransporte **nunca llegó a ejecutarse**.

**Causa raíz:** `aGrados(x, y)` devuelve **`[lon, lat]`**, un array, y yo lo leí como `{lat, lon}`. Las
dos coordenadas salían `undefined`, así que no había arista a menos de 350 m de "ninguna parte" y el
guardián de A4 hacía su trabajo perfectamente.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el propio rojo.** La línea decía
`✅` porque la prueba era *"¿lanza una excepción?"*, y lanzaba. **Comprobar que algo falla no es
comprobar que falla por lo que crees.**
⚠️ Lo que sí funcionó fue el **positivo de control**: la ruta sin sabotaje también salía en rojo, y eso
es imposible si el instrumento está sano. Sin esa línea, el fallo se habría publicado como un guardián
verificado.

**Cómo se cazó:** el positivo de control, que estaba puesto precisamente por la ley 2 (*todo cero se
demuestra con un positivo*). Aquí demostró un rojo, no un cero, pero el mecanismo es el mismo.

**Arreglo aplicado:** desestructurar `const [lon, lat] = aGrados(...)`. Y de paso, los dos nodos del
sabotaje se eligen ahora **dentro de la componente mayor**: si caen en componentes distintas no hay
ruta, y el positivo de control fallaría por falta de camino en vez de por el sabotaje.

**Ley que sale de aquí:** ⭐⭐ **un guardián se verifica con DOS pruebas, no con una: que se ponga rojo
con el fallo puesto, y que se ponga VERDE sin él.** La segunda es la que distingue un guardián de una
alarma estropeada, y es la que casi nunca se escribe.
**Traza:** `src/probar-guardianes.js` (G4), `src/geo.js` (`aGrados`)

---

## [2026-08-03] — El auditor volvió a contar texto, ahora el de otro fichero: 9 acusaciones donde había 0

**Categoría:** arreglé el caso en la tanda de arreglar la clase
**Síntoma:** con las tres llamadas sin zona ya corregidas, el auditor **seguía en rojo**:

```
   ⛔ llamadas SIN zona explícita              9
   probar-guardianes.js      sí   ⛔ POR DEFECTO   construir()
```

**Nueve.** Y el acusado era `src/probar-guardianes.js`, un fichero cuyo trabajo consiste precisamente
en **explicar y provocar** este fallo: menciona `construir()` en casi todos sus comentarios y en casi
todos sus mensajes de error.

**Causa raíz — y es la misma que la nº70.** El auditor busca el texto `construir(` en el fichero
entero, sin distinguir **código** de **comentario** ni de **literal de cadena**. Cuando se denunció a
sí mismo (nº70) lo arreglé **excluyéndose del listado**. Eso no era la causa: era el primer síntoma.

⭐⭐ **Y ahí está lo que duele: es la tanda cuyo encargo literal es "arregla la CLASE, no el caso", y
yo arreglé el caso.** Escribí en el comentario del propio fichero por qué había pasado, y aun así la
corrección fue local. **Saber enunciar la ley no basta; hay que aplicarla al arreglo que estás
escribiendo en ese momento.** Es la misma observación de la nº67, con otro sujeto.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la corrección anterior.** Tras
excluirse a sí mismo, el auditor dio `3` llamadas sin zona, y las tres eran ciertas y estaban bien
identificadas. **Un arreglo puede producir el número correcto y no haber tocado la causa** — y en ese
estado el instrumento parece sano hasta que llega un fichero nuevo.

**Cómo se cazó:** al ejecutarlo después de commitear `probar-guardianes.js`. Un fichero nuevo en `src/`
fue todo lo que hizo falta, que es exactamente lo que el arreglo local no cubría.

**Arreglo aplicado:** `soloCodigo()` — se borran comentarios y literales de cadena (dejando espacios
para no mover las posiciones) **antes** de buscar nada. Ahora el auditor mira solo lo que se ejecuta.
⛔ La salida fácil era una lista de ficheros exentos; eso es una lista, no una regla (ley 40).
Y para las llamadas sin zona que son **deliberadas** —la que provoca el rojo de G1— hay una regla, no
una excepción: se admite si la línea lleva la marca `PROVOCACIÓN`, y **todas las que la lleven salen
listadas aparte con su número de línea**, así que ninguna es invisible.

**Ley que sale de aquí:** ⭐⭐ **el primer síntoma de una clase se disfraza de caso particular, y la
señal de que lo has arreglado como caso es que la corrección menciona un nombre propio.** Si el
arreglo contiene el nombre del fichero, del campo o del valor que falló, casi seguro que es un parche.
**Traza:** `src/auditoria-grafo.js` (`soloCodigo`, `MARCA`)

---

## [2026-08-03] — El guardián tenía un agujero del tamaño de un prefijo: `R.construir()` era invisible

**Categoría:** el patrón que excluye de más
**Síntoma:** `src/probar-guardianes.js` llama a `R.construir()` **sin zona**, a propósito, para
provocar el rojo. El auditor no lo veía. Ni ése ni ningún otro:

```
   probar-guardianes.js   (no aparecía en la tabla)
```

**Causa raíz:** el patrón era `(?:^|[^.\w])construir\s*\(`. El `[^.\w]` estaba puesto para que
`G.reconstruir(` no se confundiera con `construir(` — y de paso dejaba fuera **cualquier llamada con
prefijo de módulo**. `require('./ruta').construir()`, `R.construir()`, `M.construir()`: todas
invisibles. Un guardián que se esquiva poniendo un punto delante.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el auditor entero, incluido su
rojo provocado en G2.** La prueba de G2 escribe un fichero de mentira con `construir()` **sin
prefijo** —porque así lo escribí yo— y el auditor lo cazaba. **El positivo de control cubría
exactamente la forma que el patrón sí veía**, que es la trampa clásica de un control escrito por el
autor del instrumento (ley 17).

**Cómo se cazó:** por preguntarme por qué `probar-guardianes.js` no salía en la tabla, si acababa de
escribirlo y llama sin zona. **La ausencia en una lista es más difícil de ver que un valor raro en
ella**, y aquí solo se notó porque yo sabía que ese fichero tenía que aparecer.

**Arreglo aplicado:** `(?<![\w$])(?:[A-Za-z_$][\w$]*\.)?construir\s*\(` — se admite el prefijo y se
excluye `reconstruir` por lo que es (una palabra distinta), no por lo que lleva delante.

**Ley que sale de aquí:** ⭐⭐ **un patrón que excluye para evitar un falso positivo tiene que declarar
qué más está excluyendo.** `[^.\w]` no decía "no es reconstruir": decía "no lleva punto delante", y eso
es muchísimo más.
⚠️ Y la operativa: **cuando escribas un detector, comprueba que encuentra el caso que acabas de
escribir tú.** Si tu propio fichero no sale en la lista, el detector está roto, no el fichero.
**Traza:** `src/auditoria-grafo.js` (`RE_CONSTRUIR`, `RE_PLANARIZAR`)

---

## [2026-08-03] — Las bandas estaban copiadas dentro del código y se quedaron viejas: dije "0 de 5" donde eran "3 de 5"

**Categoría:** dos copias del mismo dato / el veredicto contra una regla caducada
**Síntoma:** el informe de las siete rutas cerraba con esto:

```
   dentro de la banda de Antonio                0 de 5
      ⚠️ nº2: 598 m frente a 350–450
      ⚠️ nº6: 523 m frente a 350–450
      ⚠️ nº7: 2529 m frente a 1800–2100
```

Pero `data/pruebas/RUTAS-CONOCIDAS.md` ya estaba en **v2** (commit `e579da2`) y decía **450–550** y
**2.400–2.600**. Con las bandas buenas, esas tres **entran**: la cuenta real era **3 de 5**, y la nº7
—la única con distancia medida por GPS— clava 2.529 contra 2.600 medidos, un 2,7 % de diferencia.

**Causa raíz:** `src/rutas-antonio.js` tenía la tabla **transcrita a mano** en un array:

```js
{ n: 2, o: 'Calle Manifestación 6', d: 'Calle Don Jaime I 17', banda: [350, 450], min: 5, … }
```

Antonio corrigió el documento; el código no se enteró. **Dos copias del mismo dato divergen, y no es
una posibilidad teórica: divergieron en menos de un día.**

⭐⭐ **Y había algo peor que la banda vieja: el código no conocía la columna que MANDA en la v2.** La
v2 hizo del **rodeo** el criterio principal —*ruta ÷ recta no depende de lo rápido que ande nadie*— y
mi informe ni lo comparaba. Contra el tope de rodeo de Antonio, el resultado es **6 de 6 dentro**.
⇒ **El informe no solo daba un veredicto equivocado: daba el veredicto de otra pregunta.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **los siete cálculos, todos.** Las
distancias, los rodeos, los enganches, el Puente de Piedra en la nº1, la esquina de la nº6, las rutas
de cordura, cero rodeos imposibles. **El motor estaba bien y el veredicto salía en rojo**, porque la
diana estaba copiada de una versión anterior del documento. Es la tercera vez en este proyecto que el
sujeto está sano y el instrumento de juicio no: la nº60, la nº68 y ésta.

**Cómo se cazó:** Antonio, comparando el informe contra su propio documento. **Ningún contador podía
cazarlo**: los dos lados de la comparación estaban dentro del mismo proceso y eran coherentes entre sí.

**Arreglo aplicado:** `src/tabla-rutas.js` lee la tabla del Markdown y devuelve bandas, topes de rodeo,
rectas declaradas y minutos. El fichero de Antonio **no se toca**. Y como leer Markdown a mano es
frágil, el parser:
· **imprime lo que ha entendido**, fila a fila, para poder contrastarlo con el documento;
· deja en `NO CONSTA` lo que no entiende, **nunca lo rellena**;
· y **cuadra el número de filas leídas contra el que declara el propio fichero** (`Filas reales: 7`).
  Si no cuadra, para. Un parser que se come una fila en silencio es peor que no tener parser.

**Ley que sale de aquí:** ⭐⭐ **el criterio de aceptación no se transcribe: se lee de donde vive.** Si
un dato tiene dueño —y estas bandas lo tienen—, copiarlo al código convierte cada corrección del dueño
en una divergencia silenciosa.
⚠️ Y el corolario que casi se me escapa: **cuando el dueño cambia el criterio, no basta con releer los
números — hay que releer QUÉ COLUMNA MANDA.** Yo habría actualizado las bandas y habría seguido
ignorando el rodeo.
**Traza:** `src/tabla-rutas.js` (nuevo), `src/rutas-antonio.js`, `data/pruebas/RUTAS-CONOCIDAS.md` (⛔ sin tocar)

---

## [2026-08-03] — `verificar.js` llevaba una tanda entera contradiciendo al documento publicado, y nadie releyó esa línea

**Categoría:** el instrumento y el documento dejaron de decir lo mismo
**Síntoma:** al comparar la salida de `src/verificar.js` antes y después de meter los pasos
condicionales en el cálculo:

```
antes:   ⇒ soldar las puntas de D5 quitó 2 componentes
después: ⇒ soldar las puntas de D5 quitó 0 componentes
```

Y `docs/H1-PRIMER-GRAFO.md`, publicado en la tanda 8, dice literalmente:
**"⚠️ D5 no quitó ni una componente en esta zona."**

⇒ **El instrumento llevaba desde la tanda 11 contradiciendo al informe publicado**, y el número que
daba de más era precisamente el que sostendría el argumento contrario.

**Causa raíz:** los dos lados de la resta se construían con **políticas distintas**.
· la LÍNEA BASE la cuenta `contarComponentes()`, que solo mira `e.pie` — **incluye** los pasos condicionales;
· el "grafo de hoy" era `g.comp`, que venía de `adyacencia(..., sinCondicionales=true)` — los **excluía**.
La tanda 11 introdujo `e.condicional` y cambió uno de los dos lados. El otro se quedó como estaba.

⭐ Y hay un giro que lo hacía más difícil de ver: **quitar aristas BAJÓ el número de componentes**
(22 → 20), que es lo contrario de lo que uno espera. Un nodo que se queda sin ninguna arista deja de
contar como componente y pasa a `aislados` — la trampa de la nº50, que está escrita en `grafo.js` y
que aun así volvió a operar.

**Contador independiente, las cuatro combinaciones, para no discutirlo de memoria:**

```
   D5=0,0 m  condicionales dentro  ->  22 componentes
   D5=2,0 m  condicionales dentro  ->  22 componentes      ⇒ D5 quita 0
   D5=0,0 m  condicionales FUERA   ->  20 componentes
   D5=2,0 m  condicionales FUERA   ->  20 componentes      ⇒ D5 quita 0
```

⭐ **Con la misma política en los dos lados, la respuesta es 0 en las dos políticas.** El "2" no
medía D5: medía la diferencia entre las dos políticas.
⛔ **D5 no está en cuestión.** Lo que estaba mal era la resta.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la verificación entera de la tanda
11 y la de la 10.** `verificar.js` salía con código 0, todas sus contrapruebas en su sitio, y esta
línea impresa en medio del informe diciendo lo contrario que el documento. **Un número mal no rompe
nada si nadie lo compara con nada** — y una línea informativa dentro de un informe largo no la compara
ningún guardián.

**Cómo se cazó:** por hacer el diff de la salida antes y después de un cambio de decisión, que es una
costumbre de esta tanda y no una verificación programada. Sin ese diff seguiría ahí.

**Arreglo aplicado:** ninguno específico — **lo arregla la propia decisión de C**, al poner los pasos
condicionales dentro del cálculo, que es lo que vuelve a igualar los dos lados. Lo que sí queda es
saber que la igualdad era accidental en las dos direcciones.

**Ley que sale de aquí:** ⭐⭐ **una resta entre dos grafos exige que los dos se hayan construido con
la misma política, y la política no se ve en el número.** Cuando se añade un filtro nuevo al grafo
—`pie`, `condicional`, lo que venga— hay que ir a buscar TODAS las líneas base que se comparan contra
él, porque ninguna se entera sola.
⚠️ Y la operativa: **cuando un informe publicado y el instrumento vivo digan cosas distintas, gana la
pregunta, no el número.** Aquí la pregunta era *"¿cuántas componentes quita D5?"*, y ninguno de los dos
la estaba respondiendo.
**Traza:** `src/verificar.js` (C4a), `src/ruta.js` (`construir`), `docs/H1-PRIMER-GRAFO.md:155-161`

---

## [2026-08-03] — Una ruta de cordura PUBLICADA como correcta llevaba dos tandas rota, y cruzaba un centro comercial sin decirlo

**Categoría:** regresión silenciosa en algo ya publicado
**Síntoma:** la tercera de las tres rutas de cordura del casco, en `src/verificar.js`:

```
   Puerta del Carmen -> Magdalena   ⛔ componentes-distintas
```

Y `docs/H1-PRIMER-GRAFO.md` §C4d, de la tanda 8, la publica **resuelta y correcta**:

```
   Puerta del Carmen -> Magdalena  1.334,4 m  recta 1.088,5 m   rodeo ×1,226  ✅
```

**Una de las tres rutas de cordura publicadas dejó de existir en algún momento entre la tanda 8 y
hoy, y el informe siguió saliendo en verde.**

**Causa raíz:** la exclusión de los pasos condicionales de la tanda 11. Esa ruta **necesita** uno.
Al ponerlos dentro del cálculo vuelve a resolverse, y ahora se ve por dónde va:

```
   way  53856138  indoor=yes  ->  cruza el interior de «Centro Comercial Independencia El Caracol»
   way 197980340  indoor=yes  ->  cruza el interior de un edificio (sin nombre en OSM)
   way  53856142  indoor=yes  ->  cruza el interior de un edificio (sin nombre en OSM)
```

⭐⭐ **Y ahí está la historia entera de esta decisión en tres líneas.** En la tanda 8 el motor mandaba
a la gente **por dentro de un centro comercial sin decirlo**. En la tanda 11 dejó de mandarlas, pero
contestando **"no hay camino"**, que es falso. Desde hoy manda y **avisa de que cruza El Caracol**,
que es lo único de las tres que es verdad.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la propia línea de la ruta.**
`verificar.js` imprime `⛔ componentes-distintas` y **sigue adelante**: el bucle de las rutas de
cordura hace `continue`, no falla. El script terminaba con código 0 y la sección se titula *"ninguna
puede ser más corta que la línea recta"* — que era cierto, porque de tres rutas solo comprobaba dos.
**Un guardián que solo mira una condición no vigila las demás, y su verde parece completo.**

**Cómo se cazó:** por leer el diff de `verificar.js` al cambiar la política de pasos condicionales.
⚠️ **No lo cazó nadie durante dos tandas** porque nadie vuelve a leer la salida de un verificador que
sale en verde, y porque `⛔` dentro de una línea no es lo mismo que un código de salida distinto de 0.

**Arreglo aplicado:** lo repara la decisión de C. Y queda la lección de instrumento: **una ruta de
cordura que no se resuelve tiene que hacer FALLAR el verificador**, no imprimir un símbolo y seguir.
⚠️ **NO lo he cambiado en esta tanda** —tocar `verificar.js` mientras se comparan sus salidas es
cambiar dos cosas a la vez (ley 19)— y queda anotado como pendiente.

**Ley que sale de aquí:** ⭐⭐ **un resultado publicado no se queda quieto: cada regla nueva puede
romperlo, y el que lo rompe no se entera.** Lo publicado necesita una prueba que lo defienda, no una
frase en un documento.
⚠️ Corolario: **`continue` es la forma más barata de convertir un fallo en una línea de informe.**
**Traza:** `src/verificar.js` (C4d), `docs/H1-PRIMER-GRAFO.md:230-236`

---

## [2026-08-03] — El punto del perímetro más cerca de la calle está al otro lado del edificio: la ruta 3 empeoró 119 m al "arreglarla"

**Categoría:** minimicé la magnitud equivocada
**Síntoma:** al cambiar el centro del Hospital Clínico por *«el punto de su perímetro más próximo a
la red»*, que es lo que había que hacer, la ruta **se alargó**:

```
   [1] al CENTRO del edificio                 3731 m · recta 3000 m · rodeo 1.24
   [2] al perímetro más cerca de LA CALLE     3850 m · recta 2991 m · rodeo 1.29   ⬅ PEOR
```

**El arreglo dejó la ruta 119 m más larga y el rodeo peor que antes de arreglarlo.**

**Causa raíz:** ese punto está a **0,0 m** de una calle… **que está al otro lado del hospital**.
Minimizar la distancia de ENGANCHE no es minimizar lo que anda una persona. Son dos magnitudes
distintas, y solo una es la pregunta: *"¿cuánto tengo que andar para llegar?"*

⭐ **El signo del error fue la pista** (y por eso se mira antes de buscar la causa): un arreglo que
empeora el resultado en la dirección contraria a la esperada no suele estar mal implementado — suele
estar resolviendo otro problema.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la medida de la clase entera.**
Sobre los 11.857 edificios, el perímetro mejora la distancia al viario en **8,1 m de mediana** y hasta
114 m en el peor caso. Todos esos números son ciertos. **Un cambio puede mejorar el 100 % de una
métrica y empeorar el resultado**, si la métrica no es la que importa.
⚠️ Y se salvó solo porque el briefing exigía publicar el ANTES y el DESPUÉS (D3). Con solo el después,
3.850 m habría parecido perfectamente razonable.

**Cómo se cazó:** por la comparación antes/después de la ruta 3, que no era opcional.

**Arreglo aplicado:** una tercera regla, y sale de qué SIGNIFICA un destino-edificio: **llegar a un
edificio es tocar su perímetro por donde antes se llegue.** Se generan hasta 24 puntos de acceso
candidatos sobre el contorno, se insertan como nodos temporales y **manda el más barato POR RUTA**
—un solo Dijkstra con varios destinos, no cuesta más—, sumando lo que queda de andar desde la calle
hasta la fachada.

```
   [3] ⭐ al perímetro más barato POR RUTA     3705 m · recta 2998 m · rodeo 1.24
```

⛔ Y para que no sea "ajustar hasta que salga bonito", se publican **las tres lecturas** en todas las
rutas: la regla se elige por lo que significa el destino, no por el número que produce.

**Ley que sale de aquí:** ⭐⭐ **antes de minimizar algo, comprueba que es la magnitud de la pregunta.**
"El punto más cercano a la red" y "el punto al que antes se llega" se parecen tanto por escrito que
uno se cuela por el otro sin que salte nada.
**Traza:** `src/puerta.js` (`puertaDe`, `candidatos`, `rutaAEdificio`), `src/rutas-antonio.js`

---

## [2026-08-03] — Un POI que no cae dentro de ningún edificio se saltaba el tratamiento en silencio

**Categoría:** silencio falso
**Síntoma:** en la primera ejecución con puertas, la ruta 5 (C.C. Utrillas) **no imprimía nada** sobre
el centroide. Las rutas 3 y 4 sí. Parecía que el Utrillas no era un edificio — y lo es.

**Causa raíz:** el bloque que informa estaba dentro de `if (hayPuerta)`. Si ninguno de los dos
extremos conseguía puerta, no se imprimía **ni el intento ni el motivo**. Un caso no tratado se veía
exactamente igual que un caso que no aplica.

**Lo que pasaba de verdad, al mirarlo:** el nodo `shop=mall "Alcampo Utrillas"` **no cae dentro de
ningún polígono de edificio**. El más cercano tiene su centro a 110 m. ⇒ No es un fallo del
mecanismo: es que **ese centro comercial no está mapeado como edificio en el dato**, y la respuesta
correcta es quedarse en el punto y decirlo.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **las otras dos**. Delicias y el
Clínico imprimían su línea de puerta perfectamente, así que el mecanismo "funcionaba". El silencio
del tercero pasaba por "no aplica".

**Cómo se cazó:** contando las líneas. Cuatro POI en las siete rutas, tres líneas de puerta.

**Arreglo aplicado:** el motivo se imprime **siempre que el extremo sea un POI**, con o sin puerta:
`⚠️ SIN PUERTA, se queda en el punto: el-punto-no-cae-en-ningun-edificio`.

**Ley que sale de aquí:** ⭐ **un caso no tratado tiene que verse distinto de un caso que no aplica.**
Si el informe solo habla cuando el mecanismo acierta, su silencio es indistinguible de la ausencia
del problema.
**Traza:** `src/rutas-antonio.js`, `src/puerta.js` (`accesoA` → `motivo`)

---

## [2026-08-03] — La estación de Delicias NO necesitaba el pasillo interior: era el centroide. La premisa que justificó una decisión era un artefacto

**Categoría:** conclusión correcta en su literal, premisa equivocada en su uso
**Síntoma:** con el orden A→B→C→D completo, el contrafactual de las siete rutas sale así:

```
   nº1 … nº7   el mismo trayecto SIN pasos condicionales   ±0 m   ⇒ no le afectan
```

**Ninguna de las siete necesita ya un paso condicional.** Y la ruta 4, la de Delicias:

```
   [1] al CENTRO del edificio                 900 m   (y sin pasos condicionales: NO HAY CAMINO)
   [3] al perímetro más barato POR RUTA       506 m   (y sin pasos condicionales: 506 m, ±0)
```

⇒ **Lo que dejaba la estación sin acceso a pie no eran los pasos condicionales: era rutear a su
centro geométrico**, que está 60 m dentro del edificio y solo se alcanza por dentro.

**Por qué importa:** en la tanda 11 escribí —correctamente en su literal— *"el centro de la estación
solo es alcanzable por un pasillo interior, y ruteamos al centro de un edificio, no a su puerta"*. La
frase llevaba el aviso pegado. **Pero el argumento que viajó hacia arriba fue "la primera consecuencia
real medida de ignorar los pasos condicionales es que la Estación de Delicias queda sin acceso"**, y
esa parte era un artefacto del centroide.

⛔ **LA DECISIÓN DE ANTONIO SIGUE SIENDO CORRECTA, y por un caso real distinto:** la ruta de cordura
`Puerta del Carmen → Magdalena` del casco **sí** necesita un paso condicional —cruza el interior del
**Centro Comercial Independencia El Caracol**— y sin ellos no existe (bitácora nº76). Ahí no hay
ningún centroide de por medio: son dos coordenadas sueltas.
⇒ Lo que cambia no es la decisión: es **cuál es su prueba**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la propia medición de la tanda
11, entera y exacta.** 900 m con los pasos abiertos, `NO HAY CAMINO` sin ellos, el `highway=corridor`
identificado por su id de way. Todo cierto. **Lo que estaba mal no era ningún número: era de qué
creíamos que era prueba.**

**Cómo se cazó:** ⭐ **por el orden impuesto en el briefing.** *"Si se arregla el centroide antes que
los pasos condicionales, no se sabrá cuál de los dos hizo que Delicias funcione"* (ley 19). Se
arreglaron en el orden C→D y por eso se puede afirmar cuál operó: **C no lo arregló, D sí.**

**Arreglo aplicado:** ninguno de código. Se reporta hacia arriba y se publica el contrafactual de las
siete, que es el dato que faltaba.

**Ley que sale de aquí:** ⭐⭐ **un caso que sirve de prueba a una decisión tiene que sobrevivir a que
se arreglen sus otros defectos.** Delicias tenía dos: el pasillo y el centroide. Mientras el segundo
siguió vivo, el primero parecía la causa — y la parecía con números correctos.
⚠️ Operativa: **cuando un caso motive un cambio de regla, hay que preguntar qué MÁS le pasa a ese
caso** antes de dejar que decida.
**Traza:** `src/rutas-antonio.js` (contrafactual de las siete), `src/puerta.js`, `docs/H1-PORTALES.md`
(la conclusión que esto matiza)

---

## [2026-08-03] — El tercer testigo salió por debajo del azar, y el que estaba mal era yo: le hacía la pregunta equivocada

**Categoría:** la prueba no simulaba el problema
**Síntoma:** el testigo por herencia —*"una acera sin nombre pegada a la Calle Mayor es de la Calle
Mayor"*— medido contra 4.000 portales con nombre conocido:

```
   ⭐ acierta el vecino CON NOMBRE MÁS CERCANO   981 de 4000  (24.5 %)
   línea base (azar entre las vecinas)          1022 de 3930  (26.0 %)
   ⇒ señal / azar   0.94×
```

**Por debajo del azar.** Y sin embargo, en las cuatro direcciones de Antonio el mismo testigo acierta
**4 de 4**, a 0,0 · 5,2 · 4,6 y 2,7 metros.

**Causa raíz:** la prueba ocultaba el nombre **del way entero**, así que pedía *reconstruir un nombre
que ya no existe en la zona*. El caso real es el contrario: **la acera no tiene nombre, pero la
calzada de al lado SÍ lo tiene**. ⇒ La prueba era **más difícil que el problema**, no más fácil.

⭐⭐ Y ocultar solo la arista habría sido peor: sus hermanas del mismo way llevan el mismo nombre y
habrían cantado la respuesta — **la prueba habría pasado por construcción** (ley 35). Las dos
versiones obvias estaban mal, cada una por un lado.

⇒ **La pregunta que sí se puede responder no es "¿cómo se llama esta acera?" sino "¿está la calle que
dice el callejero entre las que hay alrededor del enganche?"** — una PRESENCIA, no una adivinanza. Y
el patrón de verdad ya existía sin fabricarlo: los enganches que la salvaguarda 1 ya marca como
`concuerda` (buenos) y `DISCORDA` (sospechosos).

```
   buenos conocidos        61,9 %          sospechosos   21,4 %
   una calle AL AZAR        0,1 %          ⇒ separa 40,5 puntos · 412× el azar
```

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las dos contrapruebas.** La de
desplazamiento derrumbaba el acierto de 24,5 % a 5,3 % y la de identidad a 0,1 %. **Las dos pasaron
perfectamente sobre un testigo que no servía para nada**, porque las contrapruebas comprueban que el
instrumento reacciona a la posición y a la identidad — no que la pregunta sea la correcta.

**Cómo se cazó:** por la incoherencia entre el 24,5 % agregado y el 4 de 4 de las direcciones de
Antonio. **Dos números del mismo instrumento que no pueden ser los dos ciertos.**

**Arreglo aplicado:** se conserva y se publica el testigo de adivinanza **con su fracaso**, porque el
fracaso también es un resultado, y se añade el de presencia, que es el que responde.

**Ley que sale de aquí:** ⭐⭐ **una contraprueba valida el instrumento, no la pregunta.** Que un
número se derrumbe al desplazar y al barajar solo demuestra que mide algo real; puede estar midiendo
algo real que no sirve.
⚠️ Y la práctica: **antes de medir, escribe el caso real y comprueba que tu simulación se le parece.**
La mía borraba un dato que en el caso real está presente.
**Traza:** `src/sin-vigilancia.js` (`heredar`, `presencia`, E3 / E3b / E4 / E5)

---

## [2026-08-03] — El testigo municipal medía cobertura de la descarga, no acierto del enganche

**Categoría:** el filtro que faltaba convertía un hueco en un error
**Síntoma:** primer uso de la geometría municipal (`MU1_jerarquia_viaria`) como cuarto testigo:
distancia del enganche al eje municipal **de su propia calle**:

```
   mediana 39,5 m · p90 1.031,5 m · p99 3.024,7 m
   ⭐ a ≤ 25 m del eje de su calle:  885 de 2461  (36,0 %)
```

**Un p99 de tres kilómetros.** Ningún enganche está a 3 km de su calle: el número era imposible.

**Causa raíz:** la muestra municipal de la tanda 0 se bajó **por zonas** (12 recuadros), no entera —
197 tramos de los 3.644 de la capa. Un portal de la Avenida X que esté fuera de esos recuadros está a
kilómetros del **trozo muestreado** de su avenida. ⇒ Se estaba midiendo **dónde llega la descarga**,
no dónde engancha el portal.

⭐ Lo que sí se comprobó ANTES de usarlo, y menos mal: que el `codigo` municipal **es el mismo código**
que el `codigoVia` del callejero — 197 de 197 existen en `vias-zaragoza.json`, y donde el tramo trae
nombre coincide en el 62 % (el resto son nombres nulos y variantes de la A-2). Si eso hubiera fallado,
todo lo demás habría sido ruido con decimales.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el positivo de control.** El mismo
test contra un código municipal AL AZAR daba 0,1 %, o sea que el instrumento **sí distinguía la calle
propia de otra cualquiera**. Un test puede discriminar perfectamente y estar respondiendo a otra
pregunta.

**Cómo se cazó:** por mirar el p99 antes que la mediana. **El signo y la escala del error son
información** y se miran antes de buscar la causa: un p99 de 3 km no es un enganche malo, es otra cosa.

**Arreglo aplicado:** se exige que el portal esté en **zona CUBIERTA** — que haya algún tramo
municipal, del código que sea, a menos de 60 m. Fuera de ahí no se ha mirado, y no se cuenta.
2.461 → 1.633 portales, mediana 39,5 → 23,1 m, y el resultado pasa a ser interpretable.

**Ley que sale de aquí:** ⭐⭐ **cuando el patrón de referencia es una muestra parcial, "lejos del
patrón" y "fuera de la muestra" son indistinguibles — y hay que separarlos con una condición de
cobertura, no con un umbral.** Subir el umbral habría escondido el problema y dado un número bonito.
**Traza:** `src/sin-vigilancia.js` (E2d, `CUBIERTO`), `data/exploracion/*_MU1jv.json` (⛔ solo lectura)

---

## [2026-08-03] — El consenso por id de way decía que los ciegos están peor, y lo decía por construcción

**Categoría:** contraprueba que no puede no fallar
**Síntoma:** el cuarto testigo —*¿cuelga este portal del mismo way de OSM que los demás portales de su
calle, o se ha ido él solo?*—, que tiene la virtud de **no necesitar nombres** y por tanto de poder
opinar justo donde los dos viejos se callan:

```
   buenos conocidos        3,1 % SOLOS
   sospechosos             9,4 % SOLOS
   ⭐⭐ donde nadie vigila  12,9 % SOLOS      ⇒ peor que los sospechosos
```

Parecía la respuesta de la tanda: **los ciegos están peor que los ya marcados como sospechosos.**

**Causa raíz — y es de bulto:** un portal está en el grupo "ciego" **precisamente porque enganchó a
una arista sin nombre**. Sus hermanos de la misma calle que engancharon a la calzada CON nombre están,
por definición, en otro way. ⇒ **Sale "solo" sin que nadie se haya equivocado.** La pertenencia al
grupo causa el resultado.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **los dos confusores que sí se me
ocurrieron**, y los dos quedaron descartados con datos:
· ¿es que son aceras? — dentro del mismo tipo de vía la diferencia seguía (6,8 % frente a 13,1 %);
· ¿es que la acera está más troceada? — 0,785 frente a 0,821 ways por portal, casi nada.
**Descartar dos confusores no descarta el tercero**, y el tercero era el que estaba metido en la
definición del grupo.

**Cómo se cazó:** por preguntar, como manda la ley 35 pero del revés: *¿puede esto FALLAR aunque todo
funcione?* La respuesta era sí, y de forma garantizada.

**Arreglo aplicado:** el testigo se **degrada** y no entra en el veredicto. Se publica con su motivo,
porque un testigo descartado con razón es información y borrarlo sería fingir que no se probó.

**Ley que sale de aquí:** ⭐⭐ **cuando el criterio que define un grupo y el criterio que lo mide
comparten una variable, el resultado está escrito antes de medirlo.** Aquí los dos eran «¿tiene nombre
el way al que engancha?».
⚠️ Operativa: antes de comparar dos grupos, escribe **cómo se decidió quién está en cada uno** y
compruébalo contra lo que vas a medir.
**Traza:** `src/sin-vigilancia.js` (E2b, `acompanado`, `tasaSolo`)

---

## [2026-08-03] — Los verificadores detectaban fallos, los imprimían y salían en 0. El `⛔` era texto

**Categoría:** el guardián que avisa y sigue
**Síntoma:** la deuda que dejó la tanda 12. `src/verificar.js`, en sus rutas de cordura:

```js
if (!r.encontrada) { log(`   ${nombre.padEnd(32)} ⛔ ${r.motivo}`); continue; }
```

**`continue`.** El bucle seguía, el script terminaba, **código de salida 0**. Y con eso la ruta
`Puerta del Carmen → Magdalena` —publicada en `H1-PRIMER-GRAFO.md` §C4d como correcta— estuvo
**dos tandas rota** con su `⛔` impreso en pantalla en cada ejecución.

**Causa raíz:** no había ningún mecanismo que ligara *"he detectado un fallo"* con *"el proceso no
puede terminar en verde"*. Cada script lo resolvía a mano, y a mano significa que **casi ninguno lo
resolvía**: de los 18 ejecutables, solo cuatro salían con código distinto de 0 en algún camino, y
`verificar.js` y `verificar-ciudad.js` **no tenían ni un `process.exit`**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el verificador entero, en verde,
en las tandas 10, 11 y 12.** Todas sus contrapruebas, los diez cruces, las componentes, el eje
escala. Y en medio, una línea diciendo que una de las tres rutas de cordura no existía. **El
instrumento ya lo había detectado: lo que faltaba no era detección, era consecuencia.**

**⚠️ Y la auditoría para encontrarlos tuvo su propia trampa.** Buscar el símbolo `⛔` en la salida da
**10 sospechosos** sobre 18 scripts. Al clasificar las líneas a mano —clasificar antes de contar—
**nueve eran prosa o contadores en cero**: `⛔ NO SE TOCA NADA`, `⛔ rodeos imposibles (<1) 0 ✅`,
`⛔ autovía · prohibido a pie`. **Solo una era un fallo de verdad**, en `rutas-antonio.js`. Un
contador de símbolos habría inflado el problema por diez.

**Arreglo aplicado:** `src/alarma.js`, con **dos clases que no se tratan igual**:
· **`imposible()`** — imposibilidad física (rodeo < 1, una suma que no cuadra): **lanza en el acto**.
  Seguir midiendo con un instrumento que acaba de decir un absurdo no tiene sentido.
· **`fallo()` / `exige()`** — fallo de expectativa (una ruta de cordura sin resolver, un rodeo fuera
  del tope de Antonio): **se anota y se sigue**, porque hay que ver TODOS los fallos y no solo el
  primero — pero **un gancho `process.on('exit')` deja el código en 1**.

⭐ Y eso último es lo que lo hace mecanismo y no disciplina (ley 37): **el gancho se instala solo, al
primer `fallo()`**. A partir de ahí ningún camino del código puede devolver 0, y no hay que acordarse
de nada al final.

Enganchado en `verificar.js`, `verificar-ciudad.js`, `verificar-rios.js` y `rutas-antonio.js` — 15
puntos de detección que antes solo imprimían.

**Contraprueba** (`src/probar-paradas.js`), con los dos tipos y **con positivo de control cada uno**:
· fallo de expectativa → código 1, **y el script sí llega al final**, y se ven los dos fallos;
· imposibilidad física → código 1 **y el script no sigue**;
· ⭐ **el caso real**: se le quitan los pasos condicionales al grafo del casco —que es lo que la rompió
  en la tanda 11— y `Puerta del Carmen → Magdalena` **sale en rojo**, código 1. Con ellos dentro,
  1.370,8 m y código 0.
· y el invariante sobre los 18 scripts: *si la salida declara un fallo, el código no puede ser 0*.

**⚠️ Lo que este arreglo NO cubre, dicho antes de que nadie lo suponga:** un script que detecte algo y
lo imprima **sin avisar a la alarma** sigue pudiendo salir en verde. Y la auditoría solo ve los fallos
**que alguien declaró como fallos con el símbolo `⛔`**: una comprobación que falle imprimiendo un
`⚠️`, o que directamente no exista, es invisible para todo esto.

**Ley que sale de aquí:** ⭐⭐ **un fallo detectado y no consecuente es peor que un fallo no detectado**,
porque produce la sensación de que hay una red. `continue` es la forma más barata de convertir un
fallo en una línea de informe.
**Traza:** `src/alarma.js` (nuevo), `src/probar-paradas.js` (nuevo), `src/auditoria-paradas.js`
(nuevo), `src/verificar.js`, `src/verificar-ciudad.js`, `src/verificar-rios.js`, `src/rutas-antonio.js`

---

## [2026-08-03] — El invariante nuevo cazó mi propio parche a los diez minutos de existir

**Categoría:** el guardián funcionando en la dirección contraria
**Síntoma:** primera ejecución del invariante sobre los 18 scripts, con la alarma recién enganchada:

```
   verificar-rios.js         código 1       sin fallos     ✅
```

**Código 1 sin declarar ningún fallo.** El invariante que yo había escrito era *"si declara un fallo,
el código no puede ser 0"*, así que técnicamente lo daba por bueno — pero **la combinación no tiene
sentido**: si sale en rojo, algo tendría que decir por qué.

**Causa raíz:** mi propio parche. El `require('./alarma')` no se aplicó porque busqué un ancla de
texto —`const { aMetros, dist, corteSegmentos } = require('./geo')`— que en ese fichero es
`const { aGrados, dist } = require('./geo')`. **La sustitución falló en silencio y las tres llamadas
`AL.exige(...)` quedaron sin importar nada.** `ReferenceError: AL is not defined`.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **las otras tres sustituciones del
mismo parche**, que sí se aplicaron y se ven en el `grep`. Comprobé que las llamadas estaban puestas
—`grep -n "AL\."` devolvió tres líneas— **y no comprobé que el módulo estuviera importado.** Ver que
el uso está no es ver que la definición está.

**Cómo se cazó:** la tabla del invariante, en la línea siguiente a haberlo escrito. ⭐ **El guardián
nuevo cazó al que lo estaba instalando**, que es la mejor prueba de que sirve para algo.

**Arreglo aplicado:** el import, con el ancla correcta. Y de paso: en ese fichero la alarma se llama
`AL` y no `A` **porque `A` ya es una variable local de geometría** — un choque de nombres que habría
sido un fallo mucho más difícil de ver que un `ReferenceError`.

**Ley que sale de aquí:** ⭐ **una sustitución de texto que no encuentra su ancla no falla: no hace
nada.** Es la misma familia que *"los ficheros de configuración se prueban, no se leen"*: un patrón
que no coincide con nada no da error, da silencio.
⚠️ Y el corolario operativo: **después de un parche automático, ejecuta el fichero.** El `grep` dice
que el texto está; solo ejecutar dice que funciona.
**Traza:** `src/verificar-rios.js` (`AL`)

---

## [2026-08-03] — Los "10 puntos peor" del punto ciego eran geografía: los portales ya estaban más lejos de su eje antes de enganchar

**Categoría:** confusor no medido / comparé dos grupos que no eran comparables
**Síntoma:** la tanda 12 cerró el E7 en `NO CONSTA` apoyándose en esto:

```
   a ≤ 25 m del eje municipal de SU calle
     donde OSM SÍ da nombre        55,6 %   (n = 1.419)
     ⭐⭐ DONDE NADIE VIGILA        44,9 %   (n =   214)
```

y en que **el confusor de la acera no lo explicaba** (53,5 % frente a 44,0 % dentro del mismo tipo de
vía). Con la capa municipal completa —3.644 tramos en vez de 197, y **7.245 portales ciegos
evaluables en vez de 214**— la diferencia no solo se mantiene: **crece a −14,4 puntos.**

**Causa raíz — y no está en el enganche.** Se midió la distancia al eje municipal **desde el portal
mismo**, antes de que exista ningún enganche:

```
   grupo                          d(PORTAL→eje)   d(ENGANCHE→eje)   lo que mueve el motor
   BUENOS conocidos                     23,8 m            21,8 m            -0,8 m
   SOSPECHOSOS conocidos                34,5 m            33,9 m            -0,6 m
   ⭐⭐ CIEGOS                            32,7 m            30,6 m            -0,7 m
```

⭐⭐ **Los ciegos ya estaban 8,9 m más lejos de su propio eje antes de que el motor tocara nada.**
La posición del portal la pone el Ayuntamiento, no el enganche. ⇒ La comparación en bruto estaba
midiendo **dónde vive esa gente**, no si el enganche acierta.

Emparejando por distancia previa, la diferencia desaparece:

```
   d(portal→eje)      BUENOS            CIEGOS       diferencia
   20–30 m       67,3 % (n=3659)   64,7 % (n=1311)    -2,6 pts
   30–50 m        4,7 % (n=4229)    6,8 % (n=1997)    +2,1 pts
```

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el confusor que sí busqué.**
En la tanda 12 comprobé si la diferencia era «que los ciegos son aceras», separé por tipo de vía y
la diferencia seguía. Escribí *"y no lo explica el confusor de la acera"* — cierto— **y de ahí salté
a "luego es real", que no se sigue.** Descartar UN confusor no descarta los demás, y el que faltaba
era el más gordo: **dónde está el portal.**
⚠️ Es la tercera vez en tres tandas que me pasa lo mismo con otra cara: la nº82 fue un testigo que
fallaba por construcción, la nº79 una premisa que era un artefacto, y ésta un confusor no medido.

**Cómo se cazó:** por hacerme la pregunta de B4 —*¿puede este testigo acertar o fallar por
construcción?*— **antes** de usarlo, en vez de después. El briefing la puso como paso obligatorio
precisamente porque la tanda 12 la había hecho tarde.

**Arreglo aplicado:** dos medidas nuevas, y el veredicto sale de ellas y no del porcentaje en bruto:
· **el techo geográfico** — qué parte de lo alcanzable conserva el enganche (106,7 % · 106,0 % ·
  112,1 %: el motor MEJORA la posición del portal en los tres grupos);
· ⭐⭐ **el discriminador sin umbral** — cuánto ALEJA el enganche a un portal de su propio eje:

```
   BUENOS conocidos        0,1 %  alejados >10 m
   SOSPECHOSOS conocidos  15,8 %                  ⇒ el testigo separa 251×
   ⭐⭐ CIEGOS               2,7 %                  ⇒ 83 % del camino hacia los BUENOS
```

⇒ **VEREDICTO: SÍ ACIERTA.** Donde nadie vigila el enganche se comporta como los buenos conocidos y
no como los sospechosos. Y quedan **198 portales** con la firma de un enganche malo, **con su
coordenada**, que son candidatos y no errores confirmados: en una avenida ancha con vías de servicio
la acera está legítimamente a 40 m del eje.

**Ley que sale de aquí:** ⭐⭐ **antes de comparar dos grupos, mide la variable de interés en un
momento en que el proceso que investigas TODAVÍA NO HA ACTUADO.** Si ya difieren antes, lo que
comparas después no es el proceso: es la diferencia previa con el proceso encima.
⚠️ Y la operativa que lo hace barato: **casi siempre existe ese "antes"**. Aquí era la coordenada del
portal tal como viene del Ayuntamiento, que estaba en el mismo fichero desde la tanda 11.
**Traza:** `src/municipal.js` (nuevo), `src/cerrar-punto-ciego.js` (nuevo, B4/B7),
`docs/H1-CIERRE.md` §E7 (el veredicto que esto sustituye)

---

## [2026-08-03] — «El 97 % de los edificios tiene la puerta entre los candidatos». Lo delató una mediana de 0,0 m

**Categoría:** comprobación que pasa por construcción (ley 35)
**Síntoma:** midiendo si el motor puede llegar a una entrada declarada de OSM:

```
   edificios con candidatos                          467
   ⭐ el MEJOR candidato está a    mediana 0.0 m · p90 0.0 m de una entrada declarada
   ⭐ hay un candidato a ≤ 5 m de una entrada         453 de 467  (97.0 %)
```

**97 %. Y una mediana de 0,0 metros.** Un resultado redondo justo donde llevo tres tandas encontrando
problemas.

**Causa raíz:** las entradas se emparejaron con su edificio **por ID DE NODO** —que es lo correcto,
identidad y no proximidad—, y eso significa que **una entrada declarada ES un vértice del polígono
del edificio**. Y `muestrearContorno()` mete **todos los vértices** entre los candidatos. ⇒ En
cualquier edificio cuyo contorno entero quepa en los 24 candidatos, **la entrada es candidata por
definición**, mida lo que mida el motor.

Medido: **282 de 467 (60,4 %)** tienen todo su contorno dentro de los 24 candidatos.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el emparejamiento por id de nodo,
que es la parte buena.** Es exacto, no usa tolerancias y resuelve el eje correspondencia como toca. El
fallo no estaba en cómo se emparejaba: estaba en que **lo que hacía correcto el emparejamiento —que la
entrada es un nodo del edificio— era justo lo que hacía trivial la pregunta siguiente.**

**Cómo se cazó:** ⭐ **la mediana de 0,0 m.** Un cero exacto en una medida de distancia entre dos cosas
calculadas por caminos distintos no es un buen resultado: es la firma de que los dos caminos son el
mismo. **El signo y la escala del error son información** — aquí lo era la ausencia de error.

**Arreglo aplicado:** la comprobación **se degrada** y no entra en el veredicto, con su motivo escrito
al lado. Se conserva impresa, porque un test descartado con razón es información y borrarlo sería
fingir que no se probó — igual que el cuarto testigo de la nº82.
⇒ Lo que sí queda en pie es la medición que **no** es tautológica: la puerta que el motor **ELIGE**
está a **5,4 m de mediana** de una entrada declarada, frente a **9,3 m** de un punto cualquiera del
contorno, y dentro de 5 m el **47,3 %** frente al **19,1 %** del azar. Ahí el motor elige UNO de los
24, y elegir puede fallar.

**Ley que sale de aquí:** ⭐⭐ **cuando emparejes dos cosas por identidad, comprueba qué preguntas
acabas de volver triviales.** Un emparejamiento exacto es una virtud para medir correspondencia y una
trampa para medir cualquier cosa que dependa de la distancia entre lo emparejado.
⚠️ Y la señal práctica, que ya va tres veces: **un resultado por encima del 95 %, o un error mediano
de 0,0, se audita antes de creérselo.** Es la tercera comprobación de este proyecto que pasaba por
construcción (nº82, nº85 y ésta).
**Traza:** `src/es-puerta.js` (D2), `src/puerta.js` (`muestrearContorno`, `candidatos`)

---

## [2026-08-03] — Medí los tres casos de la puerta con una regla que el motor no usa. El número sobrevivió por geometría, no por método

**Categoría:** medí una cosa y el motor usa otra (la forma del fallo nº68, otra vez)
**Síntoma:** la tanda 13 cerró D3 —los tres casos conocidos— con esto, y así lo publiqué:

```
   ⛔ Delicias: el motor rutea a 25,8 m de su entrance=main. NO es una puerta declarada.
```

Al meter `entrance=*` en el motor (tanda 14), la ruta nº4 de Antonio —Etopía → Delicias— sale
**exactamente igual antes y después: 506 m, y el punto de llegada se mueve 0,0 m**. Si el motor
ruteaba a 25,8 m de la puerta y ahora rutea a la puerta, algo tenía que moverse.

**Causa raíz:** el `25,8 m` se midió sobre `puertaDe()`, que es la regla **[2]** —«el punto del
perímetro más pegado a la calle»—. **El motor no usa [2]. Usa [3]**, el perímetro más barato POR
RUTA, que depende de por dónde venga el usuario. Son dos puntos distintos del mismo edificio, y el
informe de la tanda 13 lo decía **en su propia salida, dos pantallas más arriba**:

```
   ⚠️⚠️ Y AHORA LA PREGUNTA QUE DE VERDAD LE CORRESPONDE AL MOTOR:
      el motor no elige «el perímetro más cerca de la calle» — elige el más barato
      POR RUTA, y eso depende del origen.
```

Lo escribí, lo imprimí, y a continuación medí los tres casos con la regla que acababa de descartar.

**Medido ahora sobre la regla que manda, con 60 orígenes al azar por bandas (semilla declarada):**

```
   destino REAL del motor ([3]) → entrada declarada más cercana   mediana 25,8 m
   y caía justo ENCIMA de una (≤ 5 m)                             19 de 60   (31,7 %)
```

⇒ ⭐ **El 25,8 m era correcto como MEDIANA, y lo era por casualidad**: el trozo de fachada que [3]
elige suele ser la misma esquina que elige [2]. Pero *«el motor rutea a 25,8 m»* era falso como
afirmación absoluta — **en un tercio de los orígenes ya ruteaba a la puerta buena**, y desde Etopía
en concreto ruteaba exactamente a ella. La frase publicada describía un caso que no era el que se
había medido.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la advertencia correcta, escrita
por mí, impresa en pantalla y ejecutada.** El bloque que dice «el motor no elige [2]» no solo era
cierto: era el motivo por el que ese mismo informe degradó la comprobación del 97 % (nº86). Es
decir, **la misma tanda usó ese razonamiento para tumbar una comprobación y no lo aplicó a la de al
lado**. Un aviso que se imprime y no se obedece da tanto verde como no tenerlo.

**Cómo se cazó:** por calcular las siete rutas ANTES y DESPUÉS en vez de solo después. La nº4 salió
`+0 m · el punto se mueve 0,0 m` con nivel `principal`, y eso es una contradicción con lo publicado
que no se puede leer de otra manera. **Sin el "antes" habría sido una fila más de una tabla limpia.**

**Arreglo aplicado:** A3 ya no llama a `puertaDe()`. Mide sobre `rutaAEdificio()` con orígenes al
azar por bandas, y publica la mediana Y el porcentaje de orígenes en los que ya se acertaba.
⚠️ Y de paso se declara la otra mitad, antes de que nadie la celebre: el «ahora acierta el 100 %»
**es tautológico** —el destino nuevo ES la entrada— y no entra en ningún veredicto. La única línea
que informa es la del ANTES.

**Ley que sale de aquí:** ⭐⭐ **una advertencia impresa no protege de nada si el siguiente bloque
no la obedece.** Cuando escribas «esto mide la regla equivocada», lo que sigue no es publicar el
número con el aviso al lado: es no publicar ese número.
⚠️ Y la operativa, que ya va dos veces: **mide siempre ANTES y DESPUÉS.** Un «después» solo es una
tabla; la contradicción vive en la diferencia.
**Traza:** `src/entrar-por-la-puerta.js` (A3), `src/es-puerta.js` (D3, el que midió [2]),
`src/rutas-antonio.js` (A4, el antes-y-después que lo destapó)

---

## [2026-08-03] — Un guardián que aprueba por 0,1 puntos no es un guardián: es una casualidad

**Categoría:** umbral que elegí yo y que mi propio resultado rozó
**Síntoma:** el listón de «sitio urbano» de C4 lleva su positivo de control —aplicado a polígono y
campo tiene que suspenderlos casi enteros— y una parada que lo exige:

```js
A.exige(vc.length > 0 && 100 * pasan / vc.length < 35, 'el listón de urbanidad aprueba al …');
```

```
   ⭐ CONTROL · portales de PLAZA y Garrapinillos que lo pasan   579 de 1659  (34.9 %)
```

**34,9 % contra un tope de 35.** Verde. Por una décima.

**Causa raíz:** el 35 lo escribí yo, antes de medir —eso está bien— pero **a ojo**, y no salía de
ningún dato. Un umbral inventado que el resultado roza no distingue «el instrumento funciona» de
«he tenido suerte»: si el dato hubiera dado 35,1 habría parado el proceso, y si hubiera dado 20
habría aprobado igual de silenciosamente. **El guardián no estaba midiendo nada, estaba tirando una
moneda con un sesgo que yo no conocía.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **todo lo demás de C4.** El listón
sale del p10 de densidad de tres ventanas que `ciudad.js` dibujó en la tanda 9 para el eje densidad,
sin saber nada de este grupo — o sea que la ley 17 se cumplía de verdad y el número principal (565
portales urbanos) es bueno. **Lo que fallaba no era el listón: era el guardián que lo vigilaba.**

**Cómo se cazó:** por mirar el número en vez de mirar el ✅. Un 34,9 % debajo de una frase que dice
*«tiene que suspenderlos casi enteros»* no es un aprobado, lo diga el código lo que diga.

**Arreglo aplicado:** ⛔ **NO se movió el listón.** Mover el umbral hasta que el control salga bonito
es ajustar el instrumento al resultado, que es lo único que este proyecto no se permite. Se abrió el
control **por zona**, y ahí estaba la respuesta entera:

```
   polígono · PLAZA                     0 de  554   ( 0,0 %)
   rural · Garrapinillos              579 de 1130   (51,2 %)
```

⇒ El listón **no confunde polígono con ciudad**: aprueba **el casco de un pueblo**, que tiene
densidad de ciudad porque *es* un sitio donde vive gente. Para la pregunta que se está haciendo
—*¿alguien pediría una ruta aquí?*— eso es un SÍ. El control no estaba mal: estaba **agregado**, y
agrupar es borrar.

**Ley que sale de aquí:** ⭐⭐ **un umbral inventado convierte un control positivo en una moneda.**
Si el número de un control se acerca a su tope, la respuesta no es el tope: es **desagregar**, porque
un control que roza está escondiendo dos poblaciones con una media.
⚠️ Y la señal práctica: **mira el número, no el ✅.**
**Traza:** `src/sin-testigo.js` (C4)

---

## [2026-08-03] — La línea de conclusión decía «ninguno» debajo de una línea que enseñaba uno

**Categoría:** prosa fija debajo de un dato variable
**Síntoma:** B5 pregunta si alguno de los 198 candidatos cae en las siete rutas de Antonio. Salió:

```
   ⭐ de los 198 candidatos, en una arista de las siete      1
      41.65729,-0.90896     PLAZA EL PERIÓDICO DE ARAGÓN    rutas nº 4
        así que **no hay ninguno verificable contra su banco de pruebas**.
```

**Uno, listado con su coordenada, y debajo la frase «no hay ninguno».**

**Causa raíz:** un `if` de una línea sin llaves.

```js
if (!caen.length) log('      ⇒ ninguno. Los trayectos de Antonio no pasan por ningún candidato,');
log('        así que **no hay ninguno verificable contra su banco de pruebas**.');   // ⬅ SIEMPRE
```

La primera línea es condicional. La segunda —la que lleva la conclusión— se imprime siempre.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el cálculo, entero y correcto**,
incluido su positivo de control (108 portales cualesquiera enganchan a esas aristas ⇒ el cruce
encuentra cosas, así que un 0 habría sido un 0 de verdad). El dato nunca estuvo mal. **Lo que estaba
mal era la frase que lo interpretaba**, y la frase es lo único que se lee de un informe largo.

**Cómo se cazó:** leyendo la salida entera en vez de buscar el número. Es el único método que caza
esta clase, y por eso esta clase es cara.

**Arreglo aplicado:** el `else` explícito, y el caso positivo dice lo contrario de lo que decía —
porque un candidato en un trayecto de Antonio es **el más verificable de todos**: es un sitio por el
que él anda y del que ya declaró cuánto debería medir. De «no hay ninguno» a «éste es el mejor que
tenemos» hay dos llaves.

**Ley que sale de aquí:** ⭐ **una conclusión que no depende del dato no es una conclusión: es una
plantilla.** Si una línea empieza por «⇒» o «así que», tiene que estar dentro del mismo `if` que el
número del que habla.
⚠️ Y el eco de la ley 44: allí un `⛔` impreso no era un fallo porque era texto; aquí un texto era la
conclusión sin ser el dato. **Las dos veces el problema fue confundir lo que se imprime con lo que se
sabe.**
**Traza:** `src/candidatos-enganche.js` (B5)

---

## [2026-08-03] — Mi contraprueba del fallo correlacionado estaba rota, y la aritmética que yo mismo había escrito la delató

**Categoría:** el arnés de la contraprueba medía otra cosa que la que decía medir
**Síntoma:** la prueba clave de la tanda 15 —¿el detector de orden se traga un fallo que arrastra a
los vecinos?— salió así:

```
      desplazamiento            1 solo      3 juntos      5 juntos
      200 m                     93.0 %        44.0 %        39.7 %
```

**44 %.** Un número perfectamente publicable: *«lo caza en parte, la mitad que cuando se mueve uno
solo»*. Y falso.

**Causa raíz:** para elegir «el portal y sus vecinos» ordené los portales de la vía por número y
**adiviné el paso**: si el esquema era par/impar, salté de dos en dos sobre la lista mezclada.

```js
const paso = base.esquema === 'par/impar' ? 2 : 1;
for (let k = -1; k <= 1; k++) mover.add(orden[i + k * paso].id);   // ⬅ adivinando
```

Eso funciona **solo si la vía tiene las dos paridades completas y alternadas**. En una vía de números
1, 3, 5, 7 la lista ya está en impares, el paso de 2 se salta uno, y **lo que se desplaza no es el
trío: es el 1 y el 5 dejando el 3 quieto en medio**. O sea que la prueba del fallo correlacionado
**estaba desordenando la vía**, que es justo lo contrario de lo que quería probar. El 44 % era el
detector cazando **mi propio destrozo**.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la columna de al lado, y por eso
colaba.** El desplazamiento de UN portal salía 93 % y era correcto; las dos columnas juntas contaban
una historia coherente y creíble —«cuantos más se mueven juntos, menos lo ve»— con la pendiente en el
sentido esperado. **Un resultado equivocado que apunta en la dirección correcta es el más difícil de
cazar**, porque confirma lo que ya crees.

**Cómo se cazó:** ⭐⭐⭐ **por la teoría que yo mismo había escrito en la cabecera del módulo**, ocho
horas antes de medir:

> *«La intercalación B es invariante a trasladar el trío entero, porque las tres distancias se mueven
> igual.»*

Si eso es cierto —y es aritmética, no una opinión—, la columna de «3 juntos» **tiene que dar 0,0 %**,
no 44 %. **El número contradecía al álgebra, así que el número estaba mal.** Con el arnés arreglado:

```
      desplazamiento            1 solo      3 juntos      5 juntos
       25 m                      27.1 %         0.0 %         0.0 %
       50 m                      66.7 %         0.0 %         0.0 %
      200 m                      94.5 %         0.0 %         0.0 %
   y la vía ENTERA desplazada 200 m:   0 portales señalados de 300 vías
```

**Arreglo aplicado:** el bloque se toma **de la cadena que usa la evaluación**, no de una lista
ordenada por número con un paso adivinado. Es el mismo objeto en los dos sitios, así que no hay nada
que adivinar.
⇒ Y el resultado verdadero **es mucho peor y mucho más útil**: el testigo es **ciego por completo** al
fallo correlacionado, no «parcialmente ciego». Eso no lo invalida — lo **acota**, que es distinto.

**Ley que sale de aquí:** ⭐⭐ **cuando tengas una predicción algebraica de lo que debe salir,
compárala con lo que sale ANTES de publicar.** Un contraejemplo aritmético no necesita muestra: si la
fórmula dice invariante y el dato dice 44 %, no hay nada que discutir sobre el dato.
⚠️ Y la de andar por casa: **nunca adivines el paso de una secuencia cuando tienes la secuencia
delante.** El código que la construye ya existía y estaba exportado.
**Traza:** `src/orden-numeros.js` (`provocar`, A3b), `src/orden.js` (cabecera, la predicción)

---

## [2026-08-03] — Segunda vez en dos tandas: una parada con un umbral que me inventé casi decide sola

**Categoría:** umbral inventado (reincidencia de la nº88, dentro de la tanda siguiente)
**Síntoma:** la línea base de A3c —barajar los enganches dentro de cada vía— lleva su parada:

```js
A.exige(100 * ok / n > 40, 'con los enganches barajados el detector apenas señala: no mide orden');
```

```
      con los enganches barajados, señala     2113 de 5487  (38.5 %)
      ⛔ FALLO · con los enganches barajados el detector apenas señala: no mide orden
```

**38,5 % contra un 40 que puse a ojo.** Rojo por punto y medio. Y el detector **sí mide orden**: la
tasa real del callejero es del **1,0 %**, o sea que barajar la multiplica por **39**.

**Causa raíz:** el mismo error que la nº88, cometido **la tanda siguiente**, en el mismo proyecto y
por la misma mano. Escribí un **absoluto** donde el invariante que quería expresar era un
**cociente**. «Barajar tiene que derrumbar la discriminación» no dice nada sobre el 40 %: dice que la
tasa barajada tiene que ser muchísimo mayor que la real. Un absoluto exige que yo acierte una cifra a
ojo; un cociente, no.

**Y por qué el 38,5 % es bajo y aun así correcto:** barajar dentro de una vía deja todos los puntos
**en la misma calle**. En una vía corta, cambiar los portales de sitio los mueve pocos metros y la
intercalación aguanta. **Barajar no es lo mismo que descolocar** — y eso lo dice el dato, no yo.

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la propia parada**, que hizo
exactamente su trabajo: se puso roja y obligó a mirar. Lo que estaba mal no era que saltara: era **de
qué dependía que saltase**. Un guardián que se dispara por el motivo equivocado sigue siendo mejor
que ninguno, pero es el que más caro sale de creer.

**Cómo se cazó:** por la nº88, escrita **el día anterior**. Su ley decía *«un umbral inventado
convierte un control positivo en una moneda»*, y al ver el 38,5 contra el 40 la pregunta ya estaba
hecha.

**Arreglo aplicado:** la parada pasa a ser un **cociente ×10 contra la tasa real**, y el cambio va
declarado en el código con su motivo. ⛔ Y se comprueba que **no se ha cambiado para que pase**: con
×10, el 38,5 % actual pasa, pero un 45 % con una tasa real del 30 % **no pasaría** — que es justo lo
que se quiere vigilar y lo que el absoluto dejaba entrar.

**Ley que sale de aquí:** ⭐⭐ **la mayoría de los invariantes son cocientes disfrazados de
absolutos.** Si una parada compara un porcentaje con un número que has elegido tú, casi siempre lo
que querías decir era «mucho mayor que ESTE otro porcentaje del mismo experimento».
⚠️ Y el dato incómodo: **haber escrito la ley no impidió repetir el fallo.** Lo que lo cazó fue el
umbral rozando, no la memoria.
**Traza:** `src/orden-numeros.js` (A3c), `docs/BITACORA.md` nº88

---

## [2026-08-04] — «El mapa dice lo mismo que la terminal»: escribí dos veces la misma comprobación imposible de fallar

**Categoría:** comprobación que pasa por construcción (ley 35), dos veces seguidas en el mismo bloque
**Síntoma:** el visor de rutas y la terminal tienen que contar el tramo con la MISMA cadena. Escribí
la comprobación, salió verde, y decía esto:

```
   V4 · EL TEXTO DEL MAPA ES EL TEXTO DE LA TERMINAL
      tramos con frase del redactor único                  104 de 104
```

**104 de 104.** Lo que comprobaba era esto:

```js
const ok = typeof t.frase === 'string' && t.frase.length > 0;
```

O sea: **«la frase es una cadena y no está vacía»**. Eso lo pasa cualquier texto, incluida una frase
inventada por el visor. **No comprobaba nada de lo que decía el título.**

**Y el segundo intento fue peor**, porque parecía una comparación de verdad:

```js
const cuerpo = d2.tramos.map((t) => t.frase).join('\n');
for (const t of d2.tramos) if (cuerpo.includes(t.frase)) dentro++;
```

Eso busca cada frase **dentro de la concatenación de esas mismas frases**. Es un espejo: da 100 %
siempre, con cualquier contenido, aunque el visor redactara en chino. **Escribí un espejo y lo llamé
comparación.**

**⭐ Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás del fichero, que sí
valía.** El simulador de Leaflet estaba verificado con su guion de 8 polilíneas y 2 círculos (ley
52), el cuadre de metros comparaba contra el motor **recalculado en memoria** —no contra el propio
fichero— y la contraprueba del tramo falso funcionaba en los dos sentidos. **Cuatro comprobaciones
buenas alrededor de una vacía**, y la vacía era justo la del título del bloque.

**Cómo se cazó:** por releer la línea de código debajo del ✅ en vez de leer el ✅. La pregunta del
método —*«¿puede esto pasar sin que nada funcione?»*— la tenía escrita en la cabecera del propio
fichero, para V0, V1 y V2. **No la apliqué a V4.**

**Arreglo aplicado:** la comprobación de verdad, que sí puede fallar y en dos frentes:
· **(1)** las frases del fichero que va a leer el navegador contra las del motor **recalculado** —eso
  caza además un `rutas-visor.js` viejo, que es un fallo real y silencioso—;
· **(2)** se calcula la ruta nº2 desde el motor, se genera **el texto que vería la terminal**, y se
  busca dentro **cada frase del fichero del mapa**. 9 de 9.
· ⭐ y su **positivo de control**: una frase inventada tiene que dar negativo. Si `includes` diera
  positivo con `'Por Calle Que No Existe De Prueba'`, el 9 de 9 no valdría nada.

**Ley que sale de aquí:** ⭐⭐ **una comparación en la que los dos lados salen del mismo sitio es un
espejo, no una prueba.** Antes de escribir `A.includes(B)`, pregúntate de dónde viene cada uno: si
vienen del mismo fichero, del mismo objeto o de la misma función, la respuesta ya está decidida.
⚠️ Y la operativa: **la pregunta del método se hace por comprobación, no por fichero.** La tenía
contestada para V0, V1 y V2 en la cabecera, y eso me dio la sensación de tenerla contestada para
todas.
**Traza:** `src/probar-visor-rutas.js` (V4), `src/relato.js` (el redactor único que se estaba
comprobando)

---

## [2026-08-04] — Declaré un invariante de ×3 sin haber medido el mando del que dependía

**Categoría:** contraprueba con un umbral inventado dentro
**Síntoma:** el guardián de la contraprueba de barajado se puso rojo:

```
      el método, tal cual                3781 de 40168     76.7 %
      ⛔⛔ barajado LOCAL (celdas de 300 m)  903 de 40168     29.7 %
   ⛔ FALLO · el método acierta 76.7 % y con los nombres barajados en la propia celda 29.7 %: no separa
```

Escribí, antes de ejecutar, que barajar los nombres **dentro de la misma celda de 300 m** tenía que
derrumbar la discriminación al menos ×3. Salió **×2,58**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el otro barajado, el GLOBAL, salió
un 0,0 % perfecto** — 6 aristas nombradas de 40.168 y ni un acierto. Un control negativo redondo,
del tipo que da ganas de firmar. Y ese 0,0 % **no demuestra casi nada**: lo escribí en la propia
cabecera antes de correr nada (con 3.000 vías en el bombo, que dos de tres coincidan es ~0,1 % por
aritmética pura). Si me hubiera quedado con el control limpio, habría publicado *«el método lee
identidad, contraprueba superada»* con toda la cara.

**Causa raíz:** el ×3 no es el problema; el problema es que **la contraprueba tiene un mando —el
tamaño de la celda— y lo puse a ojo en 300 m sin medir cuánto manda.** Medido después:

```
      celda del barajado local           opina    ACIERTO    razón contra el método
      50 m                                2985      70.4 %                      ×1.1
      100 m                               1851      51.4 %                      ×1.5
      300 m                                903      29.7 %                      ×2.6
      1000 m                               386      12.4 %                      ×6.2
      3000 m                               197       2.5 %                     ×30.2
```

La razón va de ×1,1 a ×30,2 según un número que elegí yo. **El umbral de aprobado y el mando del
experimento eran la misma decisión, tomada dos veces y sin mirarse.** A 50 m barajar dentro de la
celda no baraja nada —una celda de 50 m es una calle— así que el «control» aprueba al método por
construcción; a 3 km es el barajado global con otro nombre.

**Cómo se cazó:** por el propio guardián, que era lo que tenía que pasar. Lo que NO estaba previsto
es que su rojo no distinguiera *«el método no separa»* de *«mi contraprueba está mal calibrada»*.

**Arreglo aplicado:** ⛔ **ninguno sobre el umbral.** Mover el ×3 hasta que pase es ajustar el
instrumento al resultado — es el nº88 y el nº91 por tercera vez, y esta vez no. El guardián se queda
en rojo, `src/nombrar-aceras.js` sale en código 1, y lo que se añade es **la curva entera del mando**
con su fecha: escrita DESPUÉS de ver el rojo, y marcada como post-hoc en el código y en el informe.
El ×2,6 se publica como **suelo** de la separación, no como su valor.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **una contraprueba también tiene parámetros, y un umbral de aprobado
puesto sobre un parámetro sin medir no juzga al método: juzga al parámetro.** Antes de declarar
«tiene que caer ×N», hay que barrer el mando y ver la curva — si el veredicto cambia de ×1,1 a ×30
moviendo un número que elegí yo, el veredicto es mío, no del dato.
⚠️ Y el corolario, que es lo que casi cuela: **el control negativo que sale redondo es sospechoso por
redondo.** Si su resultado se puede predecir con aritmética de servilleta antes de ejecutarlo, no
está midiendo el instrumento; está midiendo la aritmética.

**Traza:** `src/nombrar-aceras.js` (B2b), `src/heredar-nombre.js`

---

## [2026-08-04] — Medí «lo que dice el municipal del tramo de la ruta 7» sobre el way entero, no sobre lo que Antonio anduvo

**Categoría:** unidad de medida más grande que la afirmación
**Síntoma:** el encargo pedía qué dice la capa municipal del **tramo de 1.269 m** de la ruta nº7 —el
único sitio de todo el proyecto donde hay verdad sobre el terreno, porque Antonio lo ha andado—. Yo
lo identifiqué bien, por los dos ways de OSM (354344721 y 475881583), y luego medí sobre **los ways
enteros**, que en el grafo son 53 aristas y **3,02 km**. Salió esto:

```
   aristas del grafo con esos dos ways                      53  (3.02 km)
   ⭐ metros de capa municipal que caen sobre ese tramo      2.85 km
         2.02 km   Unidireccional calzada | AV | SAN JUAN DE LA PEÑA | 28220
           631 m   Bidireccional acera | AV | ACADEMIA GENERAL MILITAR | 12950
```

**Dos kilómetros y medio de conclusión sobre un tramo de 1,2 km.** Y el reparto cambia: sobre lo que
Antonio anduvo de verdad son 760 m de «Unidireccional calzada» y 252 m de «Bidireccional acera», no
2,02 km y 631 m.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás, y con nota.** El CRS
verificado contra el rango real de coordenadas (no por el nombre), el `numberMatched === numberReturned`,
los cero vértices de otras Zaragozas (ley 41), y sobre todo **la contraprueba de desplazamiento del
emparejamiento, que se hundió ×10,8 al mover la capa 2 km**. La contraprueba más cara de la tanda
funcionaba perfectamente… **sobre la geometría equivocada.** Una contraprueba correcta no dice nada
del recorte al que se aplica.

**Causa raíz:** identifiqué el tramo por su `way` porque era lo correcto —⛔ nada de coordenadas de
memoria— y me quedé ahí. **Un way de OSM no es un tramo de ruta:** una ruta usa el trozo de way que
va de un nodo a otro. Tenía el dato bueno a mano —`rutas-antonio.js --aristas` da las aristas exactas
de cada ruta, y lo usé en la tanda 17 para esto mismo— y no lo usé aquí.

**Cómo se cazó:** ojo humano, al leer «3,02 km» en la pantalla debajo de un título que decía «el tramo
de 1.269 m». **Los dos números estaban en la misma pantalla y no se parecían.**

**Arreglo aplicado:** las aristas salen de `rutas-antonio.js --aristas` y se cruzan con los dos ways
(16 aristas, 1,19 km). Y de paso se añade la medida **al revés** —para cada metro del tramo, la línea
municipal más cercana y paralela— porque la primera dirección estaba sesgada: una línea municipal que
encaje mejor con la calzada de al lado no aparecía aunque describa la misma avenida.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **identificar bien el objeto no es recortar bien el objeto.** Un `way`,
una `vía` o un `codigoVia` son el CONTENEDOR; la afirmación casi siempre es sobre un TROZO. Antes de
medir, la pregunta es *«¿el recorte que estoy midiendo es el mismo del que voy a hablar?»* — y si la
frase lleva un número (1.269 m), **ese número tiene que salir del propio recorte**, no del contenedor.
⚠️ Y el corolario, que es lo que casi cuela: una contraprueba impecable sobre el recorte equivocado
sale verde igual. **La contraprueba valida el método, no el recorte.**

**Traza:** `src/bici-inventario.js` (C4), `src/rutas-antonio.js --aristas` (sólo se lee)

---

## [2026-08-04] — Declaré una regla de asignación cuyo paso 1 contradecía su paso 2

**Categoría:** regla con un agujero lógico dentro, declarada antes de medir
**Síntoma:** la contraprueba de desplazamiento se puso roja en una de sus dos unidades:

```
   unidad                                            REAL       DESPLAZADA 2 km    razón
   metros municipales asignados        212.43 km (63.7 %)     60.55 km (18.1 %)     ×3.5
   ⭐ ARISTAS del grafo asignadas                     3557                  1930     ×1.8
   ⛔ FALLO · las aristas asignadas no se hunden al desplazar (3557 contra 1930)
```

La capa municipal movida 2 km —donde no describe nada— seguía llevándose **1.930 aristas de las
3.557**. Y el desglose dijo por qué: **5.180 de sus puntos entraban por `univoca`**.

La regla que yo mismo había escrito decía esto:

> 1 · un solo way → ASIGNADA · univoca
> 2 · varios → filtro por `tipo_carri`: si dice «acera», solo son candidatas las plataformas de
>     andar; si dice «calzada», las de rodar.

**El paso 2 dice que un carril sobre acera no puede colgar de una calzada. El paso 1 lo permite si
resulta que no hay nadie más cerca.** Los dos pasos en la misma pantalla, contradiciéndose.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las otras tres contrapruebas, y las
tres son buenas.** Duplicar cada línea municipal: asignación idéntica ✅. Partirla por la mitad:
idéntica ✅. Intercambiar `acera` por `calzada` en el `tipo_carri`: cambia el **53,9 %** de las
aristas ✅ —o sea, el filtro del paso 2 SÍ estaba haciendo su trabajo—. Y el patrón de verdad:
**97,0 % de acierto** sobre 2.841 puntos que de verdad se complicaban. **Cuatro verdes convincentes
alrededor de un agujero que solo se ve cuando no hay señal.**

**Causa raíz:** escribí el caso unívoco como un **atajo** («si solo hay uno, para qué comprobar
nada») en vez de como un caso más de la misma regla. Un solo candidato no es una razón para dejar de
preguntar si ese candidato tiene sentido.

**Cómo se cazó:** la contraprueba de desplazamiento, medida **en las dos unidades**. En metros se
hundía ×3,5 y habría pasado sin más; el rojo salió en la unidad del resultado —las aristas—, que es
la que la bitácora nº94 obligó a medir la tanda anterior. **Una ley de hace un día cazando el fallo
de hoy.**
⭐ Y luego lo confirmó una segunda medida independiente: sobre las aristas donde OSM SÍ tiene nombre,
`univoca` coincide con OSM el **34,4 %** frente al **75,3 %** de `tipo` y el **74,1 %** de `margen`.
**El caso «fácil» era el peor de los tres.**

**Arreglo aplicado:** ⛔ **ninguno.** La regla se queda como se declaró y `asignar-bici.js` sale en
rojo. Cambiarla después de ver la contraprueba es ajustar el instrumento al resultado, que es el nº88
y el nº91. Lo que sí se hace es **medir la alternativa entera** —exigir compatibilidad también en el
caso unívoco— con su propia contraprueba de desplazamiento repetida al completo:

```
   regla                              metros   aristas   desplazada: metros  aristas  razón
   DECLARADA (la que se aplica)    212.43 km      3557             60.55 km     1930   ×1.8
   ⭐ estricta (NO se aplica)       207.30 km      3472             34.14 km     1095   ×3.2
```

⭐ Y el dato que desactiva el drama: en el dato REAL las dos reglas dan casi lo mismo —**85 aristas de
diferencia, un 2,4 %**, y el acierto contra OSM sube del 69,0 % al 70,5 %—. El agujero solo se abre
donde no hay señal. Decide Antonio.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un atajo dentro de una regla es una segunda regla, y hay que
escribirla como tal.** «Si solo hay un candidato, asigna» parece un caso trivial y es una excepción a
todo lo que viene después. Antes de dar por buena una regla con pasos, hay que leerla al revés:
*¿puede el paso 1 dar un resultado que el paso 2 prohibiría?*
⚠️ Y el corolario operativo: **una contraprueba que pasa en una unidad y falla en otra no es
ambigua — es que las dos unidades miden cosas distintas**, y hay que publicar las dos.

**Traza:** `src/asignar-bici.js` (paso 1 de `asignar()`), `src/modelo.js` (el termómetro por estado)

---

## [2026-08-04] — Escribí al vuelo la regla que gobierna el número principal, y no estaba en el diseño aprobado

**Categoría:** decisión de última hora fuera del diseño, con efecto en la cifra que se publica
**Síntoma:** el modelo es **por ARISTA**, pero `Rel.tramos()` corta **por WAY**. Para poder imprimir
el texto hacía falta resolver cada way a una vía, y eso **no estaba en el diseño que Antonio aprobó**
—A2 hablaba de aristas—. Lo escribí sobre la marcha dentro de `rutas-antonio.js`, así:

```js
const cods = new Set(conVia.map((i) => M[i].via.codigoVia));
if (cods.size === 1) { …nombra… }     // si no, el way no se nombra
```

Y el resultado fue que **el tramo mejor documentado del proyecto se quedó sin nombre**: el way
475881583 lleva **794 m de Avenida de San Juan de la Peña y 15 m de Calle Valle de Broto**.
**Quince metros tumbaban setecientos noventa y cuatro.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el texto salía perfectamente
plausible.** La ruta 7 imprimía «Por el carril bici de AVENIDA ACADEMIA GENERAL MILITAR · 509 m»
seguido de «Por un tramo sin nombre · 760 m», y esa segunda línea **es exactamente lo que decía antes
de la tanda**: no se lee como un fallo, se lee como «aquí el dato no llega». Un fallo que se disfraza
del estado anterior no lo caza ninguna comparación antes/después.
⭐ Y todo lo demás en verde: las siete rutas idénticas al decimal, las rutas 1 a 5 con el texto byte a
byte igual, el hash del grafo sin moverse.

**Causa raíz:** la resolución arista→way es una **decisión de modelo**, no un detalle de impresión, y
la tomé donde se imprime. Al escribirla en el sitio equivocado, ni pasó por el diseño, ni llevaba
umbral declarado, ni tenía dónde comprobarse.

**Cómo se cazó:** por mirar el tramo de la ruta 7 a nivel de arista **antes** de creerse el texto. A
nivel de arista salían las dos vías con sus dos tipos —Academia General Militar «sobre acera» y San
Juan de la Peña «en calzada», que es literalmente lo que Antonio anduvo—; en el texto solo salía una.
**La discrepancia entre las dos lecturas fue la señal.**

**Arreglo aplicado:** la resolución se muda a `src/modelo.js` (`resolverPorWay`, fuente única) y el
listón **no me lo invento**: **2/3 de los metros con vía**, el mismo acuerdo que `heredar-nombre.js`
fijó en la tanda 17 para la pregunta idéntica —*¿cuándo un conjunto de votos nombra una línea?*—. Un
umbral heredado de otra pregunta no está elegido para que salga bien ésta (ley 17). Con eso, el way
se nombra con 794/809 = 98 % de apoyo.

⚠️ **Y el arreglo destapa lo siguiente, que se publica en vez de taparse:** los 760 m que Antonio
anduvo **no tienen asignación propia** —ahí la regla dice AMBIGUA, y hace bien: el carril y la
calzada de la misma avenida son dos candidatas compatibles y cercanas—. El way SÍ la tiene, pero **en
el trozo de al lado: los dos conjuntos de aristas son disjuntos.** ⇒ el texto **hereda** el nombre.
Por eso el número va con su descuento delante:

```
   TOTAL            1585 m nombrados      543 con asignación PROPIA      1042 heredados del way
```

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **si una decisión cambia el número que se publica, es diseño — aunque
la escribas en la función que imprime.** El sitio donde acaba el código no dice de qué clase es la
decisión; lo dice si el resultado se mueve al cambiarla.
⚠️ Y la segunda, que es la que casi cuela: **un fallo que produce exactamente la salida anterior es
invisible para un antes/después.** Aquí el texto correcto y el texto roto se diferenciaban en que uno
decía el nombre y el otro decía «sin nombre» — que es lo que decía ayer. La única forma de verlo fue
mirar el MISMO hecho por dos caminos distintos (arista y way) y notar que no coincidían.

**Traza:** `src/modelo.js` (`resolverPorWay`, `ACUERDO_WAY`), `src/rutas-antonio.js` (`--modelo`)

---

## [2026-08-04] — Comparé dos porcentajes con una razón cuyo TECHO no había calculado

**Categoría:** aviso falso (una medida que no puede detectar lo que se le pide)
**Síntoma:** B2 compara, dentro de cada `plataforma`, qué porcentaje de líneas lleva nombre con
portales y sin ellos. La medida que escribí fue la razón cruda `a/b`. Y salió esto:

```
   plataforma                aristas   con portal  sin portal    razón
   calzada                     29431       90.2 %      79.4 %    ×1.14   ⬅ "se aplana"
   plataforma-peatonal         17128       56.1 %      21.2 %    ×2.64
```

Leído tal cual, dice que **en la calzada la relación no existe** — y la calzada son 2.075 km, un
tercio de la red. Es falso: `a/b` está acotada por `1/b`. Con un 79,4 % de base, la razón **NO PUEDE
pasar de ×1,26** ni aunque el efecto fuera absoluto. El ×1,14 no es «casi nada»: es **el 52 % del
recorrido que la aritmética permite**. En momios sale ×2,38, el segundo efecto más fuerte de la
tabla.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás, y con cuadres
exactos.** Las cuatro celdas de A2 sumando 98.774 clavadas ✅. Los metros sumando 6.499,98 km ✅. La
contraprueba de autoconfirmación al **100,0 %** con su rojo visto ✅. La curva de radio monótona ✅.
El positivo de control del casco ✅. La cota dura de A1 ✅. **Un informe entero en verde alrededor de
una tabla que decía lo contrario de lo que pasaba.**
⭐ Y peor: la frase de veredicto que iba a escribir —*«la relación sobrevive en 6 de las 9
plataformas»*— **es plausible, es prudente, y está mal**. No se lee como un fallo; se lee como un
resultado matizado.

**Causa raíz:** elegí la medida por ser la más fácil de explicar («cuántas veces más a menudo») sin
calcular su rango. Un cociente de proporciones tiene un techo que depende del denominador, así que
**la misma medida es sensible en una fila e insensible en otra** — y la tabla las pone en la misma
columna, invitando a compararlas.

**Cómo se cazó:** por la predicción que había escrito en la cabecera ANTES de ejecutar: *«en `acera`
se aplana; en `calzada` aguanta»*. **Salió al revés en las dos.** Eso obligó a mirar por qué, y el
porqué era el techo. ⭐ Sin la predicción escrita, el ×1,14 de `calzada` habría pasado por un
resultado y no por una pregunta.

**Arreglo aplicado:** la razón cruda **se queda** —no se sustituye, que sería ajustar el instrumento
al resultado (nº88, nº91)— y se le añaden **dos columnas declaradas como POST-HOC**: el techo `1/b`
y la razón de momios, que no tiene tope. Con eso el veredicto cambia de «6 de 9» a **«8 de 9»**, y la
que sigue plana —`paso-de-peatones`, ×0,95— lo está de verdad. ⭐ Y las dos predicciones fallidas
ponen el script en ROJO (`A.exige`), el mismo trato que `forma.js` se dio en la tanda 19.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **antes de publicar una medida, calcula su RANGO en cada fila donde la
vas a publicar.** Una medida acotada por el denominador no compara filas: las castiga por tener la
base alta. Si dos filas de la misma columna no pueden alcanzar el mismo valor máximo, esa columna no
es un ranking.
⚠️ Y la segunda, que es la que salvó la tanda: **una predicción escrita antes de ejecutar no vale
solo cuando acierta.** Ésta falló en las dos celdas y por eso se miró el instrumento. El valor de
predecir no es acertar: es que el desacuerdo obligue a mirar.

**Traza:** `src/donde-falta.js` (B2 · columnas `techo` y `momios`, y las dos `A.exige`)

---

## [2026-08-04] — El contador independiente del visor acusó al visor, y el que contaba mal era él

**Categoría:** aviso falso
**Síntoma:** `src/probar-visor-nombres.js` monta DOS contadores a propósito —el que el visor
publica de sí mismo (`CUENTA`) y uno del arnés, que apunta cada objeto que se mete en una capa sin
pasar por el visor—. En la primera ejecución los dos discreparon en las cinco capas:

```
   capa                               visor     arnés      dato
   con-nombre                         41930     45797     41930   ⛔
   sin-nombre-con-portales             3867      7734      3867   ⛔
   zonas                                  8      3875         8   ⛔
```

Leído tal cual: *«el visor pinta más de lo que dice»*. Falso. `45797 − 41930 = 3867`, y `3875 − 8 =
3867`: **la misma constante en las cinco filas**, que es el número de la capa que estaba encendida
al arrancar. El arnés contaba una pintada de más en todas.

**Causa raíz:** el helper `medir()` ponía el contador a cero y DESPUÉS llamaba a `V.setZona(0)`.
`setZona()` no solo fija la zona: **repinta las capas activas**. Así que el cero del arnés se comía
esa pintada y la sumaba a la que sí se quería medir. El visor no tenía nada que ver.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la contraprueba de la línea falsa
pasó a medias y se leyó bien**: al meter una línea inventada el arnés subió de 7.734 a 7.736 —**+2**,
no +1— y el script lo cantó como «la línea falsa no aparece». Es decir, **el rojo correcto por el
motivo equivocado**. Y a su lado, tres comprobaciones en verde legítimo: el recorte por zona cuadraba
(193 = 193), el globo del nombre deducido llevaba su aviso, y las tres categorías sumaban 98.774
clavadas. ⭐ El cuadre del recorte por zona estaba verde **porque ahí sí ponía el cero en el sitio
bueno** — el mismo fichero, con las dos disciplinas a la vez.

**Cómo se cazó:** por la aritmética de la diferencia, no por el veredicto. Las cinco filas fallaban
por la MISMA cantidad, y esa cantidad era un número conocido. Un fallo real del visor no habría
tenido por qué ser constante (ley 51: cuando el número contradice a la aritmética, el número está
mal).

**Arreglo aplicado:** el cero del arnés se mueve a **justo antes de la única pintada que se quiere
medir**, después de `setZona()`. Y el porqué queda escrito en el propio helper, porque el orden de
esas dos líneas no se ve que importe leyéndolas.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un contador independiente necesita su propia disciplina de puesta a
cero, y esa disciplina es parte del instrumento.** Poner un segundo testigo no reparte la
responsabilidad: la duplica. Aquí el segundo testigo fue el primero en mentir.
⚠️ Y la operativa: **cuando varias filas fallan por la MISMA cantidad, el fallo es del que mide.**
Un error real casi nunca es constante.

**Traza:** `src/probar-visor-nombres.js` (`medir()`)

---

## [2026-08-04] — En una ruta A PIE, el texto contaba el papel EN BICI

**Categoría:** aviso falso
**Síntoma:** la ruta nº7 —a pie, andada por Antonio— imprimía esto:

```
   2. ◦ Por el carril bici de AVENIDA ACADEMIA GENERAL MILITAR   509 m
   3. ◦ Por el carril bici de AVENIDA SAN JUAN DE LA PEÑA        760 m
```

Lo cazó Antonio de un vistazo: *«si vamos andando NO PODEMOS IR POR UN CARRIL BICI. Tendrás que
decir POR ACERA.»*

⚠️ Y lo grave no es la frase: es **dónde estaba el fallo**. La tanda 19 se hizo entera para separar
`vía · forma · papel`, con el papel **por modo**, sobre la idea de Antonio —*«una acera que comparte
carril bici es una acera en el contexto de caminar y es un carril bici en el contexto de ir en
bici»*—. El modelo la implementaba bien: `F.papel(forma, 'pie')` existía, funcionaba y devolvía lo
correcto. **Y el redactor no lo usaba.** Tenía su propia tabla, `SUSTANTIVO`, con una entrada
`'carril-bici': 'el carril bici de'` que no distingue modo ninguno.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la tanda entera, y con nota.** Las
siete rutas idénticas al decimal y contra lo publicado en la tanda 16 ✅. Los textos 1 a 5 byte a
byte iguales ✅. El hash del grafo sin moverse ✅. El guardián D1 en verde en sus tres
comprobaciones ✅.
⭐⭐ Y peor que verde: **esa frase se publicó como el LOGRO de la tanda.** El informe la enseñaba en
un antes/después —*«ANTES: Por un tramo sin nombre, 1,27 km · DESPUÉS: Por el carril bici de AVENIDA
ACADEMIA GENERAL MILITAR, 509 m»*— y la mejora era real: el tramo pasó de anónimo a nombrado. **El
fallo viajaba dentro de la mejora**, y una comparación antes/después no puede cazar eso: las dos
líneas son mejores que la anterior.

**Causa raíz:** `relato.js` tradujo `plataforma` a castellano en vez de preguntar por el PAPEL A PIE.
La plataforma dice *qué es la línea*; el papel dice *qué es para quien la usa*, y **son dos preguntas
distintas — que es exactamente la distinción que la tanda 19 introdujo**. Escribí la tabla de
traducción en el mismo commit en el que se aprobaba el modelo de tres capas, y la escribí de una
capa.

**Cómo se cazó:** usuario. ⛔ Ningún test lo cogía, y no por descuido: **todos los guardianes de la
tanda 19 comprueban que la RUTA no se mueva** —metros, aristas, nodos, rodeo—, y ninguno comprueba
que el TEXTO diga algo cierto. Un texto falso con la ruta correcta les sale verde por diseño.

**Arreglo aplicado:** `SUSTANTIVO` pierde la entrada `carril-bici` —⛔ andando no se va «por el
carril bici»— y entra `comoSeAnda(forma)`, que devuelve sustantivo y aviso según lo que **el
Ayuntamiento declara** en `tipo_carri`:

```
   carril bici SOBRE LA ACERA   →  «Por la acera de X»  + se anda por ella, compartida con bicis
   carril bici EN LA CALZADA    →  «Por X»              + el municipal lo sitúa en la calzada
   senda ciclable               →  «Por X»              + se comparte con bicicletas
   sin dato municipal           →  «Por X»              + no consta si va sobre acera o en calzada
```

⭐ Y de paso resuelve el segundo defecto que la tanda 19 declaró y no tocó: **el texto ya distingue
sobre acera de en calzada**, que es justo la información que resolvió la discrepancia de la tanda 18.
⛔ Lo que NO se arregla son las MAYÚSCULAS: medido sobre dos fuentes municipales y ocho campos de
nombre, **ninguno trae el nombre con mayúsculas y minúsculas**. Reconstruirlo a mano es escribirlo.

**Commit:** (este commit) — el que lo introdujo fue `e39e98a`

**Ley que sale de aquí:** ⭐⭐ **si el modelo tiene modos, el texto tiene que PEDIR el modo, no
traducir el campo.** Un redactor que traduce `plataforma` a castellano está eligiendo un modo sin
saber que lo elige — y elegirá siempre el mismo.
⚠️ Y la que más duele: **un fallo puede viajar dentro de una mejora.** El antes/después enseñaba dos
líneas mejores que la anterior y las dos estaban mal. Comparar con el pasado dice si has avanzado; no
dice si has llegado.
⚠️ Y la tercera, operativa: **los guardianes de esta tanda comprobaban que la ruta no se moviera y
ninguno comprobaba que el texto fuera cierto.** Una comprobación de invariancia no es una
comprobación de verdad.

**Traza:** `src/relato.js` (`SUSTANTIVO`, `comoSeAnda`, `tramo`)

---

## [2026-08-04] — El aviso del carril bici se hereda del way igual que el nombre, y un aviso afirma más que un nombre

**Categoría:** aviso falso
**Síntoma:** el arreglo del texto de esta tanda hace que la ruta nº7 imprima esto:

```
   4. ◦ Por AVENIDA SAN JUAN DE LA PEÑA (eje de calzada)   760 m
       ⚠️  el Ayuntamiento sitúa este carril bici EN LA CALZADA, no sobre la acera
```

⚠️ **Esos 760 m son justo los que NO tienen asignación municipal propia.** Es el rojo declarado de
la tanda 19 (bitácora nº96): el way 475881583 tiene 794 m asignados a San Juan de la Peña **en un
trozo disjunto**, y la resolución a way extiende el dato al way entero. Hasta hoy eso solo extendía
un NOMBRE. Desde hoy extiende también **una afirmación sobre la infraestructura**, y no son lo mismo:

· heredar el nombre dice *«esta línea es de esa avenida»* — plausible, y con su descuento publicado;
· heredar el aviso dice *«el Ayuntamiento sitúa AQUÍ el carril en la calzada»* — **cita a una fuente
  sobre unos metros concretos en los que esa fuente no ha dicho nada de esos metros.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el arreglo funcionó exactamente como
se diseñó, y sus tres comprobaciones pasaron.** Las siete rutas idénticas al decimal ✅; los textos 1
a 5 byte a byte ✅; la salida sin `--modelo` idéntica a la capturada antes de tocar nada ✅. Y el
guardián `modelo-rutas.js` siguió en su rojo de siempre —el de nº96— **sin enterarse de que ese mismo
rojo acababa de encarecerse**: mide que la ruta no se mueva y que el tramo salga bien a nivel de
arista, no qué afirma el texto.
⭐ Y la frase se lee mejor que la de ayer: ayer decía «Por el carril bici de…», que era falso para un
peatón. Hoy dice algo cierto sobre el way y no comprobado sobre el tramo. **Mejoró y se volvió más
específica al mismo tiempo, y ser más específico es lo que la hace más arriesgada.**

**Causa raíz:** `relato.js` corta por `way` —solo recibe `p.way`, no los índices de arista— así que
todo lo que imprima de un tramo tiene que salir de una resolución a way. Cuando el modelo solo
aportaba el nombre, esa limitación tenía un coste conocido y medido (543 m propios contra 1.042
heredados). Al añadir el aviso, **la misma limitación empezó a transportar un tipo de afirmación más
fuerte sin que nadie volviera a mirar el coste**.

**Cómo se cazó:** al leer la salida nueva contra lo que la tanda 19 había medido. El número de nº96
—«los 760 m no tienen asignación propia»— estaba escrito, y la frase nueva hablaba justo de esos
760 m.

**Arreglo aplicado:** ⛔ **NINGUNO, y es deliberado.** Arreglarlo exige que el redactor distinga
arista de way, o un umbral de cobertura para el aviso: **las dos cosas son decisiones de modelo, y la
bitácora nº96 dice literalmente que una decisión que cambia lo que se publica es diseño aunque se
escriba en la función que imprime.** Escribirla al vuelo hoy sería repetir nº96 con el mismo fichero
delante. ⇒ se declara, se reporta hacia arriba y decide Antonio.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **cuando un canal empieza a transportar afirmaciones más fuertes, hay
que volver a medir su coste — aunque el canal no haya cambiado.** El way heredaba nombres con un
descuento publicado; el mismo way heredando avisos necesita otro descuento, y nadie lo pide porque
el mecanismo es el de siempre.
⚠️ Y el corolario: **un texto que cita a una fuente («lo dice el Ayuntamiento») asume una deuda que
un texto descriptivo no asume.** Nombrar mal es equivocarse; citar mal es atribuir.

**Traza:** `src/relato.js` (`comoSeAnda`), `src/modelo.js` (`resolverPorWay`)

---

## [2026-08-04] — Enseñé el núcleo normalizado como si fuera el nombre que saldría

**Categoría:** aviso falso
**Síntoma:** el globo del visor, al pinchar una línea sin nombre, contestaba a *«¿qué nombre saldría
si se dedujera?»* con esto:

```
   ⚠️ SI se dedujera, saldría:
      torre sierras
      (5 de 6 portales de acuerdo)
```

**`torre sierras` no es un nombre de calle.** Es lo que devuelve `heredar-nombre.js`, y devuelve eso
a propósito: un **NÚCLEO NORMALIZADO** —sin acentos, en minúsculas, sin tipo de vía y sin artículos—
porque se diseñó en la tanda 17 para **comparar identidad**, no para imprimir. La calle se llama
`CAMINO TORRE SIERRAS`.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la comprobación del globo, que
existe justo para eso, y pasó.** `src/probar-visor-nombres.js` §C4 exige tres cosas del globo del
nombre deducido: que lleve el aviso «NO está aplicado» ✅, que **enseñe el nombre que saldría** ✅, y
que diga cuántos portales lo apoyan ✅. La segunda comprobaba `gD.includes(el texto exportado)` —o
sea, **que el globo enseñara lo que el exportador le hubiera metido**, fuera lo que fuera. Un
guardián que verifica el transporte y no el contenido.
⭐ Y alrededor, todo lo demás en verde legítimo: los dos contadores del visor cuadrando en las cinco
capas, la línea falsa apareciendo y desapareciendo, el recorte por zona sin esconder el denominador.

**Causa raíz:** di por hecho que la salida del método era un nombre porque el campo se llama
`nombre`. Lo es dentro de su módulo —ahí «nombre» significa «el núcleo que identifica a la vía»— y
deja de serlo en cuanto sale de él. **El nombre del campo viajó mejor que su significado.**

**Cómo se cazó:** ojo humano, al leer la salida de la propia comprobación C4, que imprime el valor:
`⭐ …y lleva el nombre que saldría   ✅ «torre sierras»`. **El guardián lo dio por bueno y a la vez lo
enseñó.** Imprimir el valor al lado del ✅ es lo único que lo salvó.

**Arreglo aplicado:** el exportador devuelve el núcleo al callejero buscándolo entre **las vías de
sus propios portales**, que ya viajan al visor con su nombre municipal entero: **1.292 de 1.292 lo
encuentran**. ⭐ Y si alguno no se encontrara, se enseña el núcleo **con el aviso pegado** — no se
maquilla.
⚠️ Y lo que esto destapa va a la recomendación del informe: **aplicar el método de portales necesita
un paso que no existía.** Sin él se habrían escrito núcleos en el texto de las rutas.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un campo llamado `nombre` dentro de un módulo no es un nombre fuera
de él.** El significado de un valor lo fija su productor, no su etiqueta; al cruzar la frontera del
módulo hay que preguntarse qué es, no cómo se llama.
⚠️ Y la operativa, que es la que lo cazó: **una comprobación que verifica el transporte
(«¿llega lo que se mandó?») no verifica el contenido («¿es correcto lo que se mandó?»).** Imprimir el
valor junto al ✅ convierte a un guardián ciego en, al menos, un testigo.

**Traza:** `src/exportar-nombres.js` (el bloque `d.estado === 'NOMBRADA'`)

---

## [2026-08-04] — Restringí una regla usando una decisión escrita para OTRA pregunta

**Categoría:** aviso falso (una regla que descarta aciertos buenos)
**Síntoma:** el reconocedor de nombres largos (`«María Zambrano» ⊂ «Poeta María Zambrano»`) se
escribió aceptando el recorte en cualquier posición. Al probarlo salió esto:

```
   🔗 UNE   «mayor»  vs  «mayor grp»
```

Y `src/direccion.js` lleva escrito desde la tanda 6, en un comentario, exactamente lo contrario:
*«"Calle Mayor" y "Calle Mayor GRP" NO caen en la misma casilla, y eso es correcto: son dos
calles»*. ⇒ restringí la regla a que el recorte fuera un **sufijo** —el título va delante en
castellano: «**Poeta** María Zambrano»— y lo que se añade por detrás lo declaré distintivo.

**Y era falso.** La clasificación de lo que la restricción tiraba lo dijo sola:

```
   3368  la cola es un CÓDIGO DE BARRIO RURAL de 3 letras   ← MVR, MNZ, GRP, SJN, CST, SIS, MNT…
    102  la cola es «10»
     47  la cola es «caballero»
```

**`MAYOR MVR` es la Calle Mayor de Movera.** Es la misma calle que OSM llama «Calle Mayor»: el
código está ahí porque hay siete Calles Mayores en el término, no porque sean otra calle.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la restricción pasó los cinco
positivos publicados en la tanda 17** —`león felipe`, `gabriel celaya`, `juan josé rivas`,
`garcía arista`, `lozano monzón`: los cinco son sufijo—, pasó el control negativo de 20.000 parejas
al azar con **0 uniones**, y ⛔ **le añadí un `A.exige` que la protegía**
(`A.exige(!mismaVia('mayor','mayor grp'), …)`). **Escribí un guardián que defendía el error.** Y la
tabla de resultados salía en verde y con menos casos, que es como se ve una regla «prudente».
⭐ El único número que chirriaba era el bulto: el acierto del método bajaba de 89,7 % a 80,2 % y la
concordancia del enganche de 87,8 % a 77,1 %. **Una regla más estricta que pierde diez puntos no es
prudente: es que está tirando aciertos.**

**Causa raíz:** apliqué la ley 17 —*un umbral heredado de otra pregunta no está elegido para que
salga bien ésta*— **sin comprobar que la pregunta fuera la misma**. Y no lo era:

· el GEOCODIFICADOR pregunta *«¿qué calle quiere decir este texto?»* — y ahí «Calle Mayor» a secas es
  **ambigua**: hay siete. Unirlas sería elegir por el usuario.
· este RECONOCEDOR pregunta *«estos dos nombres, pegados a la MISMA geometría, ¿son la misma
  calle?»* — y ahí no hay nada que elegir: el portal está a 5 m de esa línea concreta.

**Cómo se cazó:** por clasificar antes de contar (ley 29). El número «3.644 emparejamientos de
diferencia» no decía nada; agrupar las 196 parejas por **qué palabra sobraba** lo dijo en una línea.

**Arreglo aplicado:** la regla vuelve a ser ancha, la variante de sufijo **se mide entera y se
publica al lado** con esa clasificación, el `A.exige` que defendía el error se retira, y queda
escrito en la cabecera del módulo ⛔⛔ **que este reconocedor NUNCA resuelve un texto a una calle**:
solo compara dos nombres que la geometría ya ha puesto en el mismo sitio. `direccion.js` no se toca.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **heredar una decisión de otra parte del proyecto exige comprobar que
la PREGUNTA es la misma, no solo que el dato lo sea.** La ley 17 protege de elegir un umbral a
medida; no autoriza a importar una decisión porque hable de las mismas palabras. Dos módulos pueden
tener razón a la vez y decir lo contrario.
⚠️ Y la que más escuece: **escribí un `A.exige` que defendía el error.** Un guardián puesto en el
mismo momento que la regla no la vigila: la repite. Los guardianes que valen son los que vienen de
fuera —los cinco positivos de la tanda 17 sí eran de fuera, y por eso no cazaron nada: la regla mala
también los pasaba—.

**Traza:** `src/nombre-largo.js` (`recorteDe`, `sufijoDe`, B3)

---

## [2026-08-04] — La expectativa del guardián estaba escrita a mano, y caducó en silencio

**Categoría:** aviso falso
**Síntoma:** al aplicar el método de los portales, `src/modelo-rutas.js` se puso rojo:

```
   ⭐ rutas cuyo texto cambia   1, 5, 6, 7   (esperado: 6 y 7)
   ⛔ FALLO · cambian las rutas 1,5,6,7 y solo debían cambiar la 6 y la 7
```

**Y no había fallado nada.** Las rutas 1 y 5 cambian de texto porque ganan un nombre nuevo, que es
justo lo que la tanda venía a hacer. Lo que había caducado era el guardián:
`A.exige(JSON.stringify(cambian) === JSON.stringify([6, 7]), …)` — **una lista que escribí yo en la
tanda 19 con el resultado de la tanda 19 delante.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **las otras dos comprobaciones de D1,
que son las que de verdad protegen**: las siete rutas con los mismos metros al decimal entre las dos
ejecuciones, la misma lista de aristas, y los mismos metros que la tanda 16 publicó. Todo ✅. Y en la
tanda 19 y en la 20 esa lista estuvo verde las dos veces, porque las dos veces cambiaban exactamente
la 6 y la 7. **Un guardián que ha estado verde dos tandas parece probado; solo estaba de acuerdo.**

**Causa raíz:** la expectativa era **una lista, no una regla**. Una lista de resultados no dice qué
tiene que pasar: dice qué pasó el día que se escribió. En cuanto el sistema mejora, un guardián así
se pone rojo por la mejora.
⚠️ Y el arreglo obvio —cambiar `[6,7]` por `[1,5,6,7]`— **habría sido ajustar el instrumento al
resultado**, que es el nº88 y el nº91. Y habría vuelto a caducar en la tanda siguiente.

**Cómo se cazó:** el propio rojo, leído en vez de obedecido. La pregunta que lo resolvió fue *«¿esto
es un fallo o es lo que pedí que pasara?»*, y para contestarla hacía falta mirar QUÉ rutas ganan
nombre — que es exactamente el dato que la expectativa debería haber usado desde el principio.

**Arreglo aplicado:** la expectativa **se deriva del modelo**, no se escribe:

```js
   const deben = con.aristas.filter((r) => r.aristas.some((i) =>
     !g.nombres.get(g.aristas[i].way) && mod.deWay.get(g.aristas[i].way)?.via?.nombre)).map(r => r.n);
   A.exige(cambian === deben, …)
```

⭐ Y ahora sí puede fallar en las dos direcciones: una ruta que gana vía y **no** cambia de texto
significa que el modelo se monta y no llega al redactor; una que cambia **sin** ganarla, que
`relato.js` se ha movido por otra razón. **Antes solo podía quejarse de que el proyecto avanzara.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **una expectativa escrita como LISTA caduca; escrita como REGLA, no.**
Si un guardián enumera resultados en vez de derivarlos, cada mejora del sistema lo pone rojo y cada
vez habrá que editarlo — y editar un guardián con el resultado nuevo delante es exactamente lo que un
guardián existe para impedir.
⚠️ Y el corolario incómodo: **estar verde varias tandas no prueba que un guardián vigile.** Éste
llevaba dos y solo estaba coincidiendo.

**Traza:** `src/modelo-rutas.js` (D1 · comprobación 3)

---

## [2026-08-04] — Excluí de la absorción justo el ejemplo que Antonio había puesto, y la racha se comía a su propio cierre

**Categoría:** carencia · rompe
**Síntoma:** dos fallos encadenados en la misma regla, la de absorber cruces cortos (§C2).

**(1)** Escribí que un paso de peatones es un EVENTO y no se absorbe nunca. Resultado en la ruta nº3,
que es andar por una avenida recta:

```
   14. ◦ Por Avenida del Alcalde Gómez Laguna    26 m
   15.   Cruzas por un paso de peatones           3 m
   16.   Por un tramo sin nombre                 14 m
   17.   Cruzas por un paso de peatones           8 m
   18.   Por un tramo sin nombre                  4 m
   19.   Cruzas por un paso de peatones           4 m
   20. ◦ Por Avenida del Alcalde Gómez Laguna  1,56 km
```

**Siete pasos para no moverse de Gómez Laguna** — literalmente lo que Antonio pidió que se quitara, y
con su ejemplo: *«si se hace un cruce como es con Calle Juslibol para pasar de acera, estás en San
Juan de la Peña igual, así que eso me sobra»*. **Leí «cruce» como «trozo corto de otra calle» y él
estaba hablando del cruce.**

**(2)** Al arreglarlo —absorber la RACHA entera, no una sola pieza— apareció el segundo: la racha
crecía mientras las piezas fueran absorbibles, **incluida la pieza que tenía que cerrarla**. En la
ruta nº7: `San Juan de la Peña · Peña Oroel 6 m · San Juan de la Peña 11 m · Oliván Bayle`. Como los
11 m de San Juan de la Peña también son «cortos», la racha se los tragaba, seguía hasta Oliván Bayle
—otra calle— y **no absorbía nada**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el resultado global, y con buena
cara.** El total bajaba de 110 a 86 pasos (−22 %), el cuadre de metros salía exacto en las siete, la
ruta nº3 pasaba de 31 a 21 pasos y la nº7 de 19 a 16. **Un −22 % es difícil de mirar con
desconfianza.** Y el `A.exige` de monotonía que yo mismo había puesto **también estaba verde**: lo
había escrito sobre el TOTAL (109 ≥ 86 ✅).

**Cómo se cazó:** ⭐⭐ **por la curva de sensibilidad, no por el resultado.** Al publicar los pasos a
0 · 7,4 · 9,0 · 13,3 · 20 · 30 · 50 m, la ruta nº7 daba **12 pasos con el umbral a 9,0 m y 16 con el
umbral a 13,3 m**. Absorber interrupciones MÁS LARGAS no puede producir MÁS pasos: es aritmética
(ley 51). ⚠️ Y el TOTAL sí era monótono mientras la nº7 no lo era — **un agregado tapa un signo**.

**Arreglo aplicado:** (1) el paso de peatones **sí** se absorbe; ⛔ las **escaleras** y los tramos
**condicionales** no, y la línea es física y no de longitud: *cruzar se atraviesa; subir unas
escaleras o encontrarse una puerta cerrada, no*. (2) la racha **se para en cuanto aparece la misma
vía**: esa pieza cierra, no interrumpe. Y el `A.exige` de monotonía se rehace **ruta por ruta**.
⇒ 110 → **82 pasos (−25 %)**, la nº7 de 19 a 12 y la nº3 de 31 a 21.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **cuando alguien te da un ejemplo, el ejemplo ES la especificación.**
Antonio escribió «un cruce como es con Calle Juslibol» y yo codifiqué una regla que dejaba fuera los
cruces. Si la regla que escribes no resuelve el caso que te contaron, la regla está mal por mucho que
el número global mejore.
⚠️ Y la segunda, que es la que lo cazó: **una curva de sensibilidad no está para justificar el
umbral: está para cazar el algoritmo.** Aquí no dijo nada del percentil —el resultado no cuelga de
él— y sí dijo que el código estaba roto.
⚠️ Y la tercera: **un invariante sobre el agregado no vale.** La monotonía se cumplía en la suma
mientras se rompía en una ruta. Los signos se cancelan; hay que comprobar donde no pueden.

**Traza:** `src/relato.js` (`tramos`, la absorción de rachas), `src/pasos.js` (la monotonía por ruta)

---

## [2026-08-04] — El modelo no se cargaba en `ruta.js`, avisaba, y seguía sin él

**Categoría:** silencio falso
**Síntoma:** lo encontró Antonio. `node src/ruta.js "Salvador Minguijón 2" "Salvador Minguijón 40"`:

```
   ⚠️  sin modelo de vía·forma·papel: The "path" argument must be of type string
       or an instance of Buffer or URL. Received undefined

   1.   Por un tramo sin nombre (acera)                    63 m
   ...
   código de salida 0
```

**Devolvía la ruta.** Con las aceras como «un tramo sin nombre», como si el método de la tanda 21 no
existiera. Con el modelo puesto, esa misma ruta empieza por **«Por Calle Salvador Minguijón, 450 m»**
y tiene **5 pasos en vez de 7**.

**Causa raíz:** **dependencia circular**. `src/modelo.js` hace `require('./ruta')` para coger `CRUDO`
y `ZONA_TERMINO`. Cuando `ruta.js` se ejecuta **como programa**, su bloque `if (require.main ===
module)` corría **antes** de la línea `module.exports = {…}`, que estaba al final del fichero. Desde
ese bloque se pedía `./modelo`; modelo.js pedía `./ruta` de vuelta y **recibía un objeto vacío**.
`CRUDO` salía `undefined` y `osm.cargar(undefined)` lanzaba un error de `path` **que no menciona el
ciclo por ningún lado**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo**, y esto es lo grave.
`probar-paradas.js --todo` pasó las tandas 21 y 22 enteras: `ruta.js` sale en **código 2** (una ruta
de prueba sin camino) y el invariante solo exige que un fallo DECLARADO no salga en 0 — éste no
estaba declarado, era un `console.error`. El guardián de las siete rutas, verde. El mapa de dos
colores, verde y **correcto**. `probar-visor-rutas.js`, verde.
⭐⭐ **Y Node lo estaba diciendo a gritos, en la última línea de la salida, las dos tandas:**
`Warning: Accessing non-existent property 'ZONA_TERMINO' of module exports inside circular
dependency`. **Nadie la leyó** — iba después del resultado, que es donde se deja de mirar.
⭐ Y el `try/catch` que lo tapaba **lo escribí yo en la tanda 21**, pensando en un caso benigno —«si
no hay portales, no se monta el modelo, y se dice»— y me tragué uno que no lo era.

**Cómo se cazó:** usuario. Antonio leyó el aviso y preguntó por qué seguía.

**Arreglo aplicado:** tres cosas, y las tres hacen falta:
1. **La causa**: `module.exports` de `ruta.js` sube **por encima** del bloque `require.main`. Quien
   entre por el ciclo encuentra el objeto ya completo.
2. **La consecuencia**: fuera el `try/catch`. Si el modelo no carga, **`ruta.js` sale en 1 y no
   imprime ninguna ruta**. Un resultado calculado sin modelo no es un resultado degradado: **es otro
   resultado, y tiene el mismo aspecto.**
3. **El portero**: `construirModelo()` comprueba lo que recibe y, si `CRUDO` no es una ruta, lanza un
   error **que nombra el ciclo y dice dónde mirar**. Un error que no nombra su causa se despacha con
   un `try/catch`, que es exactamente lo que pasó.

⭐ Y `src/probar-modelo-obligatorio.js` guarda las tres: el ORDEN de los exports, que con el modelo
roto a propósito el comando PARA, y un barrido que mide **qué scripts pasaban por el ciclo**.

⭐⭐ **A quién más le pasaba: A NADIE.** Medido, no razonado — la sonda apunta `process.mainModule`
en el momento en que modelo.js pide `./ruta`:

```
   ruta.js                     ¿pasaba por el ciclo?  SÍ
   rutas-antonio.js · modelo.js · modelo-rutas.js · donde-falta.js
   exportar-nombres.js · exportar-nombre-simple.js                    no
```

⇒ **El mapa de dos colores estaba bien.** Y con un segundo testigo independiente: sus 44.842 azules
solo salen CON modelo; sin él serían 40.420.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un aviso al lado de un resultado es un resultado sin aviso.** Nadie
lee lo que hay debajo de la respuesta que fue a buscar. Si algo hace que la respuesta sea OTRA
respuesta, no se avisa: **se para**.
⚠️ Y la segunda: **los avisos del propio Node son evidencia, no ruido.** «Accessing non-existent
property … inside circular dependency» describía el fallo con precisión y llevaba dos tandas
imprimiéndose.
⚠️ Y la tercera, sobre mí: **un `try/catch` escrito pensando en un caso benigno se traga todos los
demás.** Si se captura, hay que decir QUÉ se captura — y volver a lanzar el resto.

**Traza:** `src/ruta.js` (orden de `module.exports`, el `try/catch` retirado), `src/modelo.js`
(`construirModelo`), `src/probar-modelo-obligatorio.js`

---

## [2026-08-04] — La contraprueba del arreglo estaba verde sin haber probado nada: `NODE_OPTIONS` se come las barras

**Categoría:** aviso falso (una prueba que aprueba sin ejecutar lo que dice)
**Síntoma:** `src/probar-modelo-obligatorio.js` §3 rompe el modelo desde fuera con
`NODE_OPTIONS=--require "<fichero>"` y exige que `ruta.js` pare. Salió esto:

```
   código de salida con el modelo roto     1  ✅ PARA
   ⭐ y NO imprime ninguna ruta                ✅
   el motivo, en el mensaje                   ⚠️ no se ve el motivo
```

**Verde.** Y falso: **el precargado no llegaba a cargarse nunca.** `NODE_OPTIONS` interpreta la barra
invertida como escape dentro de las comillas, así que la ruta del fichero llegaba a Node sin sus
separadores y el proceso moría con `MODULE_NOT_FOUND` **antes de arrancar** —código 1 y ninguna ruta
impresa—: **exactamente los dos síntomas que la contraprueba buscaba.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ las dos comprobaciones de §3, y la
tercera —la única que podía cazarlo— salió **⚠️ y no ⛔**: «el motivo, en el mensaje: no se ve el
motivo». **La escribí como aviso en vez de como exigencia**, y era la que estaba diciendo la verdad.
⭐ Y §1, §2 y §4 seguían siendo válidas, así que el informe entero se leía sólido.

**Causa raíz:** tres fallos de la misma clase en el mismo fichero, y cada uno destapó al siguiente:
· `NODE_OPTIONS` y las barras invertidas de Windows;
· en un precargado, **`require.main` es `undefined` para siempre** —se captura al envolver el módulo,
  y ahí el módulo principal aún no existe—, así que la columna «¿pasaba por el ciclo?» decía **«no»
  en las siete filas**, incluida la que sí. Otra vez **la respuesta cómoda**;
· y `process.stdout.write` seguido de `process.exit()` pierde la salida cuando stdout es una tubería:
  la primera sonda no reportaba nada y eso se leía como «no carga el modelo».
**Las tres son la misma raíz: di por hecho que un mecanismo estaba vivo sin comprobarlo.**

**Cómo se cazó:** por el reloj. El barrido de siete scripts que tardan 20–60 s cada uno terminaba en
**14 segundos**. Un total que no puede ser (ley 51: cuando el número contradice a la aritmética, el
número está mal).

**Arreglo aplicado:** la ruta del precargado va con barras normales (`path.sep` → `/`), la sonda usa
`process.mainModule` —que sí es vivo— y escribe su veredicto en un **fichero**, no en stdout. Y
⭐⭐ **la prueba se prueba a sí misma antes de usarse**: `precargadoVivo()` arranca un `node -e` que
comprueba que el precargado ha puesto su bandera. Si no está vivo, **la contraprueba se declara falsa
y sale en rojo**. Además el «⚠️ no se ve el motivo» pasa a ser un `A.exige`: **si `ruta.js` muere,
tiene que morir por NUESTRA razón y no por otra.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **una contraprueba tiene que demostrar que su palanca está conectada.**
Romper algo desde fuera solo prueba lo que dice si la rotura llegó a ocurrir; si el mecanismo de
romper falla, el fallo del mecanismo se disfraza del resultado esperado — **y se disfraza siempre de
verde**, porque «murió y no imprimió nada» es justo lo que se estaba buscando.
⚠️ Y la que se repite por tercera vez en tres tandas (nº98, nº101, ésta): **el arnés es un
instrumento y miente.** Aquí mintió tres veces en el mismo fichero, y las tres en la dirección
tranquilizadora.
⚠️ Y la operativa que lo cazó: **mirar el reloj.** Siete procesos de medio minuto no caben en catorce
segundos.

**Traza:** `src/probar-modelo-obligatorio.js` (`precargar`, `precargadoVivo`, la sonda de §5)

---

## [2026-08-04] — El mapa contaba el nombre por ARISTA y el motor lo cuenta por WAY

**Categoría:** datos
**Síntoma:** lo vio Antonio. En el mapa de dos colores, **Calle Salvador Minguijón sale roja**, y el
motor dice de esa misma calle `1. ◦ Por Calle Salvador Minguijón · 450 m · 4 tramos de OSM`.

⚠️ **Y el síntoma que lo destapó era una falsa alarma.** Trazado línea a línea:

```
   el EJE de la calle (29 aristas con nombre en OSM)   azules 29 de 29   ✅
   las 12 ACERAS con portales de esa calle            ROJAS, y el motor tampoco las nombra
      método de portales: MUDA — 1 o 2 votos, y hacen falta 3 (umbral de la tanda 6)
```

**El mapa tenía razón sobre Salvador Minguijón.** Lo que Antonio ve rojo son las doce aceras, y el
motor dice de ellas exactamente lo mismo. Lo que crea la ilusión de contradicción es **el dibujo**:
en la tanda 22 puse el rojo a `weight 2.2 / opacity 0.9` y el azul a `1.4 / 0.55` a propósito —*«que
canten»*—, así que **doce aceras rojas gruesas tapan un eje azul fino y translúcido**: la calle se lee
roja aunque su eje sea azul.

⭐⭐ **Pero al ir a buscarlo apareció una divergencia real, y no era ésa:**

```
   nombre por ARISTA  (lo que pintaba el mapa)          44.842
   nombre por WAY a secas (`deWay`)                     45.252
   ⭐ lo que dice EL REDACTOR (lo que se pinta ahora)    45.593
   ⛔ tenían nombre para el motor y salían ROJAS   774  (25,32 km)
   ⚠️ salían azules y el motor no las nombra        23  ( 2,43 km)
```

Las **774 son todas de fuente `municipal-bici`**, que es la única que se asigna **arista a arista**:
un way con la mitad de sus aristas asignadas lo nombraba el motor entero —porque `relato.js` corta
por way— y el mapa pintaba la otra mitad de rojo.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **los tres contadores del visor.**
`probar-visor-nombre-simple.js` comparaba «visor / arnés / dato» y los tres decían **44.842**, con la
línea falsa entrando y saliendo en su color. Todo correcto **y todo leyendo la misma fuente**.
⭐ *Tres contadores de la misma fuente no son tres testigos.* La comprobación que faltaba no era una
cuarta cuenta: era **preguntarle al motor**.

**Causa raíz:** dos caminos de código desde el mismo dato. El exportador decidió el color con
`M[i].via` —el modelo por arista— y el redactor lo decide con `Rel.tramo()`, que mira **primero el
nombre de OSM del way y luego el modelo por way**. Nadie los obligó a coincidir.
⚠️ Y el primer arreglo —usar `deWay` en el exportador— **seguía divergiendo en 341 líneas**: un way
que OSM SÍ nombra puede no llegar a 2/3 en `resolverPorWay` y quedarse sin entrada, y el redactor lo
nombra igual porque mira OSM primero. **Copiar la regla no vale: hay que llamar a la función.**

**Cómo se cazó:** usuario, y por una calle que resultó estar bien. **El síntoma era falso y el fallo
era real** — pero en otro sitio y de otro tamaño.

**Arreglo aplicado:** el exportador **no decide el color: lo pregunta**. Llama a `Rel.tramo()`, la
misma función que escribe el texto de las rutas. ⭐ Y la comprobación nueva compara, **línea a línea
sobre las 98.774**, el color contra lo que dice el redactor — **con su rojo visto**: se le da la regla
vieja (el nombre por arista) y saca **797 discrepancias**. *Habría cazado esto el día que se escribió.*

⭐ **Y el mismo fallo estaba en el visor de RUTAS** (`exportar-rutas.js`, tanda 16), que llamaba a
`Rel.tramos(res, ctx.nombreDeWay)` **sin el modelo**: el mapa de las siete rutas enseñaba el texto de
antes de la tanda 21 —«Por un tramo sin nombre, 1.269 m» donde la terminal dice «Por la acera de
AVENIDA ACADEMIA GENERAL MILITAR» + «Por Avenida de San Juan de la Peña»—. Arreglado igual, y su
prueba también: `probar-visor-rutas.js` comparaba el texto del mapa con el de la terminal **y montaba
la terminal sin modelo**, así que comparaba dos textos igual de incompletos y salía verde.

⚠️ **Lo que NO se arregla, y va con su número:** `exportar-nombres.js` y `donde-falta.js` (tanda 20)
cuentan por arista Y sin el método de portales. Cambiarlos reescribiría una medición publicada, así
que se declara: **3.705 líneas (266,20 km) cambiarían de categoría**, y «las que duelen» pasarían de
**3.867 a 2.158**. Decide Antonio.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **si dos sitios tienen que decir lo mismo, uno de los dos tiene que
PREGUNTARLE al otro.** Copiar la regla —aunque se copie bien— crea un segundo camino que diverge en
cuanto uno cambia. Aquí ni siquiera hizo falta que cambiara: nacieron distintos.
⚠️ Y la segunda, que es la que dejó pasar esto dos tandas: **varios contadores sobre la misma fuente
no son varios testigos.** Un cuadre solo vale contra algo que se calcula por otro camino — y el otro
camino que importa es **el producto**, no otro fichero.
⚠️ Y la tercera, de dibujo: **el grosor y la opacidad son una afirmación.** Pintar una categoría más
gorda que otra hace que una calle con doce aceras rojas y un eje azul **se lea roja**. No es un fallo
del dato; es que el mapa está diciendo algo que no midió.

**Traza:** `src/exportar-nombre-simple.js` (`tramoDe`), `src/probar-visor-nombre-simple.js` (contra el
motor), `src/exportar-rutas.js`, `src/probar-visor-rutas.js`

---

## [2026-08-04] — El segundo testigo le quitó el nombre a 176 líneas que lo tenían, y no por discrepar

**Categoría:** agregación
**Síntoma:** al aplicar la calle pegada, el contador de §E dijo **«⚠️ lo PIERDEN 239»**. Yo lo
etiqueté como *«los dos testigos discrepan y se calla»*, que es la regla que acababa de escribir y
que sí quita nombres a propósito. **La etiqueta era mía y era falsa: solo 63 eran eso.**

```
   176  ⛔ el way SIGUE nombrado, pero `resolverPorWay` ya no lo resuelve
    63  los dos testigos DISCREPAN  (previsto y correcto)
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo, y esta vez todo con razón.**
Las siete rutas idénticas al milímetro y contra la tanda 16. El guardián `modelo-rutas.js` verde con
su expectativa DERIVADA. El mapa cuadrando con el redactor línea a línea, **0 discrepancias**, con su
rojo visto (686). `probar-visor-rutas.js`, verde. La batería entera, verde.
⭐ Y el número estaba impreso en mi propio informe, en su fila, con su flecha. **Lo que mentía no era
el instrumento: era el rótulo que le puse.** Un contador con la causa equivocada al lado es peor que
no tenerlo, porque se lee como explicado.

**Cómo se cazó:** por un `undefined` en una sonda de detalle. Fui a listar «las 239 que discrepan» con
sus dos nombres —`portales dicen X · la paralela dice Y`— y salieron cinco filas seguidas de
`undefined`. **Si no llego a imprimir los nombres, el 239 se publica como si fuera la regla nueva
funcionando.**

**Causa raíz:** dos defectos de `resolverPorWay()`, los dos de la misma familia —*agrupar es borrar*—
y los dos anteriores a esta tanda; el segundo testigo solo los hizo frecuentes.

1. **Agrupaba por cadena, no por vía.** La clave era `codigoVia || nombre`, así que
   `Calle del Valle de Broto` (deducida, sin código) y `CALLE VALLE DE BROTO` (municipal, con código)
   contaban como **dos vías distintas** y se partían el voto: 20 m contra 15 m, ninguno llegaba a los
   2/3, y el way **se quedaba mudo siendo una sola calle**. Es exactamente el problema del nombre
   largo que la tanda 21 resolvió en el relato y que aquí nadie aplicó.
2. **Una vía DEDUCIDA diluía a una DECLARADA.** El way 49290755 tenía 10 m declarados
   «POLÍGONO MIGUEL SERVET» y 9 m deducidos «Avenida Compromiso de Caspe»: ninguno llegaba a 2/3 y el
   way perdía **un nombre que alguien declara**. ⛔ D0 dice que manda lo declarado, y ahí no se
   aplicaba.

**Arreglo aplicado:** los dos, en `resolverPorWay`:
· si alguna arista del way tiene vía **declarada**, solo votan las declaradas (D0 manda también aquí);
· y los votos se agrupan **por VÍA** —`nombre-largo.js`, el mismo criterio que usa el itinerario—, no
  por cadena.
⭐ Resultado: **176 → 0**. Quedan las 63 que pierden el nombre porque los dos testigos discrepan, que
es lo que la regla nueva quiere que pase.

⚠️ Y de paso sube el «antes» de la comparación: sin el segundo testigo, con solo este arreglo, el
grafo pasa de **45.593 a 45.597** líneas con nombre. Cuatro. El defecto llevaba desde la tanda 19
puesto y casi no se notaba porque hacían falta dos fuentes distintas sobre el mismo way.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **el rótulo de un contador es una afirmación, y hay que comprobarla
como cualquier otra.** «Pierden el nombre: 239» era cierto; «porque discrepan» me lo inventé yo, y
encajaba tan bien con lo que acababa de escribir que no lo miré. **Cuando un número confirma
exactamente la regla que acabas de meter, ésa es la señal, no el premio.**
⚠️ Y la segunda: **una fuente nueva no solo añade — también vota.** Meter un tercer testigo en un
sitio donde ya había un recuento por mayoría le cambia el denominador a todo el mundo. Aquí el
segundo testigo, sin equivocarse ni una vez, tumbó 176 nombres correctos solo por aparecer.

**Traza:** `src/modelo.js` (`resolverPorWay`)

---

## [2026-08-04] — Escribí `module.exports` al final otra vez, en el fichero que cierra el ciclo

**Categoría:** silencio falso (evitado)
**Síntoma:** ninguno, y por eso va aquí. `src/calle-pegada.js` nació con sus `module.exports` al
final del fichero y con un bloque `if (require.main === module)` que pide `./modelo` — y `modelo.js`
pide `./calle-pegada` de vuelta. **Es el ciclo del fallo nº105, montado desde cero y en la misma
tanda en la que presumo de haberlo arreglado.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** nada: se cazó antes de ejecutarlo. ⚠️ Lo
que sí hay que anotar es qué habría pasado — `CP.decidirTodos` habría salido `undefined` y el error
habría dicho *«CP.decidirTodos is not a function»*, **sin mencionar el ciclo por ningún lado**, que
es la propiedad exacta que hizo que el nº105 durase dos tandas.

**Cómo se cazó:** por relectura, al ir a ejecutar. La regla de la tanda 23 estaba escrita en
`src/ruta.js` con dos ⛔ y aun así la volví a romper en el fichero siguiente. **Una ley escrita en el
fichero donde ocurrió no protege al fichero de al lado.**

**Arreglo aplicado:** los exports suben por encima del bloque de línea de órdenes, con el motivo al
lado. ⭐ Y lo que convierte esto en mecanismo: `calle-pegada.js` entra en la lista de
`src/probar-modelo-obligatorio.js` §5, el barrido que mide qué scripts pasan por el ciclo y con qué
`CRUDO`. Ahora son ocho filas y las ocho verdes.

**Commit:** (este commit)

**Ley que sale de aquí:** ⚠️ **una ley aprendida se documenta donde se rompió, y se rompe otra vez en
el fichero siguiente.** Lo único que no se olvida es una lista que alguien ejecuta. ⇒ cuando un
módulo nuevo pueda entrar en un ciclo, se añade al barrido el mismo día, no cuando falle.

**Traza:** `src/calle-pegada.js` (orden de `module.exports`),
`src/probar-modelo-obligatorio.js` (§5, la lista de consumidores)

---

## [2026-08-05] — El hook escribió en la bitácora y yo lo commiteé sin leerlo

**Categoría:** proceso
**Síntoma:** al contar las entradas salieron **112** y tenían que ser 111. La de más, entre la nº109
y la nº110, era ésta —reproducida entera, que es todo lo que decía—:

```
   ## [2026-08-04] — D0 manda al resolver el way, y los votos se agrupan por via
   **Categoría:** NO CONSTA
   **Síntoma:** NO CONSTA
   … (los nueve campos en NO CONSTA)
```

**Un esqueleto vacío con el asunto de mi propio commit**, dentro del commit `3114547` de la tanda 25,
duplicando el fallo nº108 que estaba tres párrafos más arriba escrito entero.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el hook**, que es el guardián que
existe justo para esto. Y el `git status`, que enseñaba `docs/BITACORA.md` como modificado — porque
YO lo había modificado— así que la línea de más no destacaba en ningún sitio.

**Cómo se cazó:** contando. `grep -c '^## \['` daba 112 y la cuenta de la tanda anterior más las dos
de hoy daba 111. **Aritmética otra vez** (ley 51).

**Causa raíz:** dos, encadenadas.
1. ⚠️ **El hook tiene un falso positivo con `git commit --amend`.** Comprueba que haya líneas nuevas
   en `docs/BITACORA.md` con `git diff --cached -- docs/BITACORA.md`, que en un `--amend` compara
   contra el commit que se está enmendando — **y ése ya lleva la entrada dentro**. ⇒ no ve ninguna
   nueva, aunque esté. ⛔ **No se toca**: es un guardián y arreglarlo es una decisión de Antonio.
2. ⭐⭐ **Y la mía, que es la que cuenta:** cuando el hook no encuentra entrada, **escribe el
   esqueleto al final del fichero y lo mete en el stage él solo** —está documentado en su cabecera:
   *«cumplir tiene que ser fácil, no solo incumplir difícil»*—. Rechazó mi primer `--amend`, dejó el
   esqueleto puesto, y el segundo `--amend` se lo llevó. **Yo no volví a mirar el fichero.**

⇒ En el repositorio cuya ley más cara es *«se lee `git status` y se añade lo que se quiere añadir,
mirándolo»*, commiteé el contenido de un fichero que **otro proceso había cambiado detrás de mí**.
Las rutas eran explícitas; el contenido, no.

**Arreglo aplicado:** se retira el esqueleto. ⛔ No se «fusiona» ni se «suaviza» ninguna entrada: el
fallo que ese esqueleto decía no describir es el nº108, que sigue entero y sin tocar. Lo que se quita
no es el registro de un fallo — es un hueco con forma de entrada.
⚠️ Y el falso positivo del hook se reporta hacia arriba, sin tocarlo.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **«rutas explícitas» protege de añadir el fichero equivocado, no de
añadir el contenido equivocado.** Un hook que escribe es una segunda mano sobre el árbol de trabajo:
después de que un hook rechace algo, **el fichero que tocó ya no es el que yo dejé**, y hay que
volver a leerlo antes de reintentar.
⚠️ Y la operativa: **cuando algo se cuenta, se cuenta antes y después.** Las entradas de la bitácora
tienen un número; si no llego a mirarlo, esto se publica y queda para siempre.

**Traza:** `docs/BITACORA.md` (el esqueleto retirado), `.githooks/commit-msg` (el falso positivo, ⛔ no tocado)

---

## [2026-08-05] — El testigo de la calle pegada le puso nombre a 3.786 pasos de cebra, y el informe lo publicó sin verlo

**Categoría:** semántica
**Síntoma:** lo vio Antonio, y de una frase: *«si un paso de cebra es un paso de cebra y no tiene
nombre, no lo tendrá que tener ninguno, digo yo»*. Medido:

```
   aristas `paso-de-peatones`                              10494  (46,55 km)
   ⭐ con nombre que trae OSM (dato ajeno)                  1101  (10,5 %)
   ⛔ con nombre puesto POR NOSOTROS                        3786  (36,1 %)
        pegada           3753        portales+pegada  33
```

**Uno de cada tres pasos de cebra llevaba un nombre de calle que le habíamos puesto nosotros**, y
3.753 de los 3.786 los puso el testigo de la calle pegada — el que metí en la tanda 25, el día antes.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el informe de la tanda 25 imprimió
el número y yo lo leí como un logro.** En `docs/H1-CALLE-PEGADA.md` §E, la tabla «de qué son las
11.330 que ganan nombre» dice, en su primera fila por precisión D4:

```
   paso-de-peatones   3786   18,36 km
```

Estaba ahí, el primero de la lista, y lo publiqué como cobertura ganada. ⭐ Y todo lo demás cuadraba:
93,4 % de acierto contra el patrón de verdad, 0 discrepancias entre el mapa y el motor, las siete
rutas idénticas al milímetro, la batería entera en verde. **Ninguna de esas comprobaciones podía
cazar esto, porque todas preguntan «¿es correcto el nombre?» y la pregunta buena era «¿tiene sentido
que tenga uno?».**
⚠️ Y el número también engordaba el titular: de las **11.330 líneas que ganaban nombre, 3.786 eran
pasos** — un tercio del resultado de la tanda no debía existir.

**Cómo se cazó:** usuario, y no mirando datos: pensando en qué es un paso de cebra.

**Causa raíz:** dos, y la segunda es la que importa.
1. **Mecánica:** un paso de cebra es la línea más corta del grafo (mediana 3,9 m), así que sus cinco
   puntos de muestreo caen casi encima y **cualquier calle a menos de 11 m gana en los cinco**. Esto
   estaba escrito y medido en la tanda 25 §D4 —*«en una línea CORTA los cinco puntos caen casi
   encima»*, 85,8 % de acierto entre 25 y 50 m contra 99,7 % entre 100 y 250— y **no se me ocurrió
   preguntar cuáles eran las líneas más cortas del grafo**.
2. ⭐⭐ **Conceptual, y es la de verdad:** el modelo solo tenía dos estados, *con nombre* y *sin
   nombre*, y faltaba el tercero: **«no tiene nombre»**. Un paso de cebra no es de ninguna calle: es
   del cruce. El que va de Rodrigo Rebolledo a Salvador Minguijón está entre las dos y no pertenece a
   ninguna — **ponerle una es elegir, y elegir es inventar**. Sin ese tercer estado, el método no
   tenía forma de callarse: o nombraba o dejaba un hueco que parecía un problema.

**Arreglo aplicado:** el tercer estado, declarado **una sola vez** en `planarizar.js` al lado de
`precision()` —que es donde vive D4— y leído desde ahí por el modelo y por el redactor, sin copiarlo
(ley 56). El modelo no le pone nombre deducido a un `paso-de-peatones`; el redactor devuelve
`noAplica`; el mapa lo pinta **gris**.
⛔ **Lo que trae OSM no se toca**: los 1.101 con `name` lo conservan en el dato y en el texto. Lo que
cambia es el color, porque la pregunta *«¿le falta el nombre?»* no aplica ahí lo lleve o no.

```
                    antes      ahora
   AZULES           56864      51977
   ROJAS            41910      36303      ⭐ 5.607 rojas eran pasos: el mapa exageraba un 13,4 %
   GRISES               —      10494
```

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un hueco en el dato tiene dos causas y no son la misma: «no lo
sabemos» y «no existe».** Un instrumento que solo sabe decir *sí* y *no* convierte la segunda en la
primera, y entonces mide un problema que no existe **y encima intenta arreglarlo**. Aquí el método no
se equivocó: contestó una pregunta que nadie debió hacerle.
⚠️ Y la segunda, sobre cómo se leen los propios informes: **la tabla de composición de un resultado
no es decoración, es la comprobación.** Publiqué «footway 9.263, el 82 %, son aceras: justo el caso
que Antonio señaló» y no miré la fila de al lado, que decía que 3.786 eran pasos. **Cuando se desglosa
un resultado, hay que leer las filas que NO se esperaban, no las que confirman el titular.**

**Traza:** `src/planarizar.js` (`SIN_NOMBRE_POR_DEFINICION`), `src/modelo.js` (`aplicar`),
`src/relato.js` (`tramo`), `src/exportar-nombre-simple.js` (`CATEGORIA`),
`tools/visor-nombre-simple.html`, `src/paso-de-cebra.js`

---

## [2026-08-05] — Escribí un cuadre que pasaba por construcción y publicó un número falso con un ✅ al lado

**Categoría:** aviso falso
**Síntoma:** al meter el gris, añadí al exportador un bloque titulado «EL ÁLGEBRA DEL GRIS, ESCRITA
ANTES DE EJECUTAR». Imprimió esto:

```
   ⭐ AZULES antes / ahora    53078 → 51977
   ⭐ ROJAS  antes / ahora    45696 → 36303
   ⭐ cuadre                  98774 = 98774   ✅
```

**Las dos primeras filas son falsas.** Los azules de antes eran **56.864** y las rojas **41.910** —los
números que la tanda 25 publicó dos días antes—. Y el ✅ de abajo era verdad y no valía nada.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el propio cuadre**, y por eso está
aquí. `azules + rojas + grises` suman el total del grafo **haga lo que haga el reparto**: es una
identidad, no una comprobación. Un ✅ que no puede salir ⛔ no es un ✅.

**Cómo se cazó:** por aritmética, y en el sitio de siempre (ley 51): el número no cuadraba con uno
publicado. 53.078 no podía ser el «antes» de 51.977 si la tanda 25 había cerrado en 56.864, y la
diferencia —4.887— es exactamente los pasos que tenían nombre. **El número contradecía a la
aritmética, así que el número estaba mal.**

**Causa raíz:** reconstruí el «antes» leyendo `deWay`, **que es el modelo YA ARREGLADO**. Como el
arreglo consiste precisamente en no ponerles nombre a los pasos, el «antes» que salía de ahí ya no
tenía los 3.786 deducidos: solo veía los 1.101 de OSM. ⇒ **pregunté por el pasado a un testigo que ya
vivía en el presente.**

**Arreglo aplicado:** dos cosas.
· El «antes» se **calcula**: `construirModelo(g, portales, { pasosConNombre: true })` monta el modelo
  con la regla vieja en el mismo proceso, y se le pregunta **al mismo redactor** las dos veces. Vive
  en `src/paso-de-cebra.js`, no en el exportador.
· En el exportador queda lo que el exportador **sí puede comprobar solo**, y en las dos direcciones:
  *todos los pasos son grises* **y** *todos los grises son pasos*. Con una sola de las dos, el gris
  podría estar llevándose media ciudad sin que se viera.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un «antes» que sale del código de «ahora» no es un antes.** Si la
comparación mide el efecto de un cambio, la rama vieja tiene que EJECUTARSE, no reconstruirse de
memoria a partir de la nueva — y eso vale igual para un fichero guardado (que puede ser de otro día)
que para una estructura del proceso actual (que ya lleva el arreglo dentro).
⚠️ Y la que se repite: **antes de escribir un cuadre, hay que contestar si puede salir ⛔.** Éste no
podía. La pregunta está escrita en el método de todas las tandas y aun así la salté, porque el bloque
llevaba la palabra «álgebra» en el título y eso ya sonaba a rigor.

**Traza:** `src/exportar-nombre-simple.js` (el bloque retirado), `src/modelo.js`
(`aplicar`, `op.pasosConNombre`), `src/paso-de-cebra.js` (§A4)

---

## [2026-08-05] — Casi publico como «inventado por nosotros» lo que declara el Ayuntamiento

**Categoría:** semántica
**Síntoma:** §C4 del informe de parques imprimió esto:

```
   MUNICIPAL · líneas dentro con nombre DEDUCIDO por nosotros   544  (22,64 km)
      por testigo: municipal-bici=307 · pegada=229 · portales=5 · portales+pegada=3
```

**El titular era «544 líneas dentro de parques llevan un nombre que les hemos puesto
nosotros».** Y es falso: **307 de esas 544 —el 56 %— llevan un nombre que DECLARA el
Ayuntamiento** en su capa de carriles bici. El número real es **237**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ el filtro, que era correcto y
por eso engañaba: `if (nombreDeWay(e.way)) continue` descarta lo que nombra OSM, y todo lo
que queda se etiquetó como «nuestro». Pero *«no lo nombra OSM»* y *«lo inventamos
nosotros»* no son lo mismo — en medio está el **callejero municipal**, que es una fuente
declarada desde la tanda 19 y que el propio modelo marca con `declarada: true`.

**Cómo se cazó:** ⭐⭐ **por leer la fila que no esperaba**, que es la ley que salió ayer del
fallo nº110. El desglose por testigo estaba impreso al lado del total y decía
`municipal-bici=307` en primer lugar. Ayer publiqué un desglose sin mirar la fila rara y me
costó una tanda; hoy lo miré.

**Causa raíz:** dos fuentes, un solo cajón. El modelo tiene tres orígenes de nombre —OSM,
municipal y deducido— y yo partí el mundo en dos: «OSM» y «lo demás». **La distinción que
importa no es de dónde viene el fichero: es si alguien lo DECLARA o lo deducimos.** El
campo que lo dice ya existía (`via.declarada`) y no lo usé.

**Arreglo aplicado:** se separan las dos filas y se dice qué es cada una. El texto que
acompaña al número explica que los 307 son carriles bici que atraviesan el parque con
`vias_codigo` municipal, y que ésos no los inventamos.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **«no lo dice OSM» no significa «nos lo hemos inventado».**
Cuando se mide cuánto inventa un método, el complemento hay que definirlo por la
PROPIEDAD que importa —¿lo declara alguien?— y no por descarte de una fuente. Aquí el
descarte metía una fuente declarada en el saco de lo inventado e inflaba el titular un
56 %.
⚠️ Y la operativa, que hoy funcionó: **el desglose se lee antes que el total.** Si el total
tiene una fila que no encaja con lo que el título afirma, el título está mal.

**Traza:** `src/parques.js` (§C4)

---

## [2026-08-05] — Dos peticiones gastadas contra un Overpass que devolvía 504

**Categoría:** proceso
**Síntoma:** el encargo daba **un máximo de 6 peticiones para toda la tanda**. Las dos
primeras se fueron en errores del servidor sin traer un solo byte de dato:

```
   1 · overpass-api.de       consulta amplia (leisure+landuse+natural, término entero)   HTTP 504
   2 · overpass.kumi.systems consulta media  (bbox recortado, sin `natural`)             HTTP 502
   3 · idezar-sig            ZonasVerdesPrincipales                                      200  ✅
   4 · idezar-sig            ZonasVerdesSecundarias                                      200  ✅
   5 · overpass-api.de       consulta mínima (4 etiquetas, `nwr`, timeout 120)           200  ✅
```

⇒ **5 de 6 gastadas, y el segundo testigo entró por los pelos.** Si la quinta hubiera
fallado, la tanda se quedaba con un solo testigo.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** nada — pero sí hay algo que
avisaba y no miré: **`data/fuentes/` ya tenía cuatro ficheros `*_ERROR-HTTP504-*.html` de
la tanda 3**, y `data/exploracion/` otros tres de la tanda 0. **Overpass ya había dado 504
en este proyecto siete veces**, siempre con consultas amplias, y aun así empecé por la
consulta más amplia posible.

**Cómo se cazó:** el propio 504.

**Causa raíz:** ordené las peticiones de más ambiciosa a menos, que es justo al revés de lo
que conviene cuando hay presupuesto. La consulta 1 pedía cinco familias de etiquetas sobre
los 2.989 km² del término, incluida `natural=wood`, que en el término de Zaragoza son los
sotos del Ebro enteros.

**Arreglo aplicado:** ninguno en el código — es operativa. Queda escrito: **cuando haya
presupuesto de peticiones, la primera es la mínima que sirve**, y se amplía solo si sobra.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐ **con presupuesto contado, se empieza por la petición más
pequeña que conteste la pregunta.** Una petición que falla cuesta lo mismo que una que
acierta, y el historial del propio repositorio decía que ésa iba a fallar: **siete 504
guardados en disco son un dato, no un archivo muerto.**
⚠️ Y la segunda: **el dato que ya está descargado se mira ANTES de pedir nada.** Aquí
funcionó —el `GetCapabilities` en disco dio las capas sin gastar petición— y es lo único
que salvó el presupuesto.

**Traza:** `data/fuentes/2026-08-05_overpass_zaragoza-zonas-verdes*`,
`data/fuentes/2026-08-05_wfs_idezar-ZonasVerdes*`

---

## [2026-08-05] — Elegí la fuente del verde por la fila que confirmaba el titular, y el control la tumbó

**Categoría:** semántica
**Síntoma:** al decidir **qué capa manda** para pintar el verde, medí las cuatro opciones y me
convencí de la INTERSECCIÓN —lo que dicen las dos capas— en cuanto vi esta fila:

```
   de qué son las verdes (listón ≥ 1 ha)
   MUNICIPAL       peatonal=2704 · eje-de-calzada=443 · acera=273 · escaleras=129
   UNIÓN           peatonal=4416 · eje-de-calzada=638 · acera=373 · escaleras=190
   ⭐ INTERSECCIÓN  peatonal=1557 · eje-de-calzada=93  · acera=14  · escaleras=60
```

**14 aceras contra 273.** El 90 % `peatonal`. Y además encaja con la doctrina del proyecto —dos
testigos coincidiendo, ley 60—, así que la escribí ya como recomendación.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todas las medidas de calidad, y
todas apuntaban al mismo sitio.** La intersección salía la mejor en las tres que había mirado: menos
`acera` (0,8 % contra 7,7 %), menos líneas pegadas al borde (7,0 % contra 12,3 %) y menos
`eje-de-calzada`. **Tres indicadores independientes, los tres favorables, y los tres midiendo lo
mismo: la PUREZA de lo que entra. Ninguno miraba lo que se quedaba fuera.**

**Cómo se cazó:** ⭐⭐ **por el positivo de control**, que escribí porque el método lo exige y no
porque esperara nada de él:

```
   parque                          rojas   MUNICIPAL         OSM     INTERSECCIÓN
   Parque Grande                     553   439 (79,4 %)   553 (100 %)   439 (79,4 %)
   ⛔ Parque del Agua Luis Buñuel     493     0 (0,0 %)   493 (100 %)     0 (0,0 %)
   Anillo Verde Oliver                19     0 (0,0 %)    19 (100 %)     0 (0,0 %)
```

**La intersección deja fuera el Parque del Agua ENTERO: 0 de 493.** El recinto de la Expo, 125 ha, el
sitio más rojo del mapa y uno de los que Antonio nombró. ⇒ **la intersección estaba limpia porque no
cogía casi nada donde importa.**

**Causa raíz:** medí la **precisión** del criterio y no su **cobertura**, y elegí con las tres
métricas que tenía. La causa material es que la capa municipal es `carto1000` de **2012** y no cubre
el Parque del Agua: ⚠️ y no es que le falte del todo —tiene 6 polígonos y 46,7 ha solapando su
bbox—, es que **ninguno contiene ni uno de los 493 senderos**. Dibuja láminas de agua y parterres,
no el recinto. Una intersección hereda **todos** los agujeros de la capa más pobre.

**Arreglo aplicado:** manda **OSM**, con listón de 1 ha. Recoge el 100 % de los cuatro parques de
control, es la única capa con nombre (199 polígonos nombrados contra 0) y por tanto la única
auditable. ⚠️ Se pierde el segundo testigo, y va declarado — pesa poco porque **esto no cambia ningún
nombre**: el verde es una variante del rojo y una línea con nombre sigue azul pase lo que pase.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un criterio no se elige por lo limpio que sale, sino por lo que
recoge de lo que tenía que recoger.** La pureza y la cobertura se mueven en direcciones contrarias, y
tres indicadores de pureza no son tres testigos: son el mismo testigo tres veces. **El positivo de
control —"¿aparece lo que sé que tiene que aparecer?"— es la única de las cuatro que mira al otro
lado**, y aquí fue la que decidió.
⚠️ Y la que se repite por tercera tanda seguida (nº110, nº113, ésta): **la fila que confirma el
titular no es la que hay que leer.** Hoy las tres filas confirmaban, y la que faltaba no estaba en la
tabla: había que ir a buscarla.

**Traza:** `src/parques.js` (`FUENTE_DEL_MAPA`, `MIN_AREA`, `indiceDelMapa`)

---

## [2026-08-05] — El auditor de guardianes traía una comprobación DECORATIVA, en la tanda que viene a cazarlas

**Categoría:** aviso falso
**Síntoma:** el clasificador del «rojo visto» lleva un control negativo —*una comprobación sin
ninguna marca alrededor NO debe salir marcada*—. Salió esto:

```
   ⇒ y el NEGATIVO: una comprobación sin ninguna marca alrededor NO debe salir marcada.
      la de este mismo fichero (sin contraprueba)     ⛔ la marca y no debería

   ⇒ ✅ AUDITORÍA DE GUARDIANES: sin fallos. (código de salida 0)
```

**Un `⛔` impreso y el proceso en verde.** Es la ley 44 exacta, dentro del fichero escrito para
auditar precisamente eso.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el cierre del propio script.**
`A.cierre()` dijo «sin fallos» con el control negativo en rojo tres líneas más arriba, porque el rojo
era una cadena impresa y no una llamada a la alarma. Y los tres positivos de control **sí** estaban
bien, así que el bloque se leía sólido: tres ✅ y un ⛔ que no contaba.

**Cómo se cazó:** leyendo la salida entera antes de publicarla. ⚠️ Que es exactamente lo que la ley
44 dice que nadie hace.

**Causa raíz:** escribí el positivo de control con `A.exige` y el negativo con `log`. No hay motivo:
fue descuido al teclear. ⭐ Pero el descuido tiene una forma reconocible —**el positivo se siente
como «la prueba» y el negativo como «un comentario»**— y es la misma que produjo el nº106, donde la
única comprobación capaz de cazar el fallo estaba escrita como `⚠️` en vez de como `⛔`.

**Arreglo aplicado:** el control negativo pasa a ser `A.exige`. ⇒ **el script sale en rojo**, y se
queda así: el clasificador textual **no vale** y ajustarlo hasta que pase sería ajustar el
instrumento al resultado. Se hizo **una** corrección principiada —no contar la cabecera del fichero,
que habla del fichero entero y no de una comprobación concreta— y **siguió fallando**, así que se
declara no válido y no se toca más.

⭐ Y el porqué del fallo es en sí un hallazgo: la comprobación que se le da como negativo **sí tiene
un «positivo de control» catorce líneas más abajo… pero es el de OTRA cosa**. ⇒ **la proximidad no
implica que la marca hable de ESA comprobación.** Una heurística de cercanía no distingue «tiene
contraprueba» de «vive en un barrio donde las hay».

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **el control NEGATIVO se escribe con la misma tinta que el positivo.**
El positivo se siente como la prueba y el negativo como una nota al margen — y el negativo es el que
dice si el instrumento distingue algo. Van dos veces (nº106 y ésta) que la única comprobación capaz
de cazar el fallo estaba escrita como aviso.
⚠️ Y la segunda: **una heurística de proximidad no puede certificar una atribución.** Si la evidencia
no está ligada a lo que certifica, lo único que mide es el vecindario.

**Traza:** `src/auditoria-guardianes.js` (§A2, `evidenciaCerca`, el control negativo)

---

## [2026-08-05] — Cinco de mis diez mutaciones no llegaron a ocurrir, y salían como «no salta nada»

**Categoría:** aviso falso
**Síntoma:** la primera ronda de §B mutaba los módulos parcheando **el objeto que devuelve
`require`**. Resultado:

```
   mutación            objetivo                       parches   veredicto
   paralela-muda       calle-pegada.js                      0   ⛔⛔ LA MUTACIÓN NO OCURRIÓ
   sin-noaplica        paso-de-cebra.js                     0   ⛔⛔ LA MUTACIÓN NO OCURRIÓ
   sin-noaplica        exportar-nombre-simple.js            0   ⛔⛔ LA MUTACIÓN NO OCURRIÓ
   resolver-vacio      probar-modelo-obligatorio.js         0   ⛔⛔ LA MUTACIÓN NO OCURRIÓ
   hash-constante      modelo.js                            0   ⛔⛔ LA MUTACIÓN NO OCURRIÓ
```

**Cinco de diez.** Y sin el contador de parches, las cinco se habrían publicado como
**«⛔ NO SALTA NADA»** — o sea, como cinco guardianes muertos. **Un instrumento roto que produce
hallazgos falsos, y hallazgos que confirman exactamente la tesis de la tanda.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la palanca (§B0).** `precargadoVivo`
—heredado del nº106— dijo ✅: el precargado se cargaba. Y era verdad. ⚠️ **Pero «el preload se carga»
y «la mutación ocurre» son dos cosas distintas, y yo tenía comprobada la primera creyendo que
cubría la segunda.** El nº106 me enseñó a comprobar que la palanca está conectada; no me enseñó a
comprobar que la palanca mueve algo.

**Cómo se cazó:** por el contador de parches, que escribí porque el método de la tanda lo exigía
—*«¿la palanca está conectada?»*— y no porque esperara que fallara. **Sin esa columna, la tanda
publica cinco guardianes muertos que no lo están.**

**Causa raíz:** un módulo llama a sus propias funciones **por nombre**, no a través de su objeto
exportado. `planarizar.js` usa `sinNombrePorDefinicion(t)`; `modelo.js` usa `hashGrafo(g)`;
`calle-pegada.js` usa `escanear(...)`. Cambiar `exports.X` no cambia el uso interno **de ninguno**.
⇒ mutar los exports solo alcanza a los consumidores de FUERA, y las comprobaciones interesantes
viven dentro.

**Arreglo aplicado:** la mutación se hace sobre el **fuente**: se intercepta
`Module._extensions['.js']` y se reescribe el código antes de compilarlo. ⭐ Y la marca se pone **al
compilar**, no al invocar, que es lo que separa «el parche se instaló» de «el parche se ejecutó».
⭐ Además el mutador distingue ahora un tercer estado: **`⛔⛔ EL PATRÓN A MUTAR YA NO EXISTE`** — si
alguien renombra la función, el mutador queda caduco y lo dice, en vez de decir «no salta nada».
⭐ Y antes de gastar veinte minutos, los siete patrones se prueban en aislado: los siete mutan.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **«el instrumento arranca» no es «el instrumento mide».** El nº106 dejó
la ley de comprobar que la palanca está conectada; faltaba la otra mitad: **comprobar que la palanca
mueve algo.** Un mutador que no muta, un cepo que no se arma, un desplazamiento que no desplaza —
todos arrancan perfectamente.
⚠️ Y la que hace esto peligroso de verdad: **un instrumento roto en una auditoría no da un resultado
vacío, da HALLAZGOS FALSOS.** Aquí habría publicado cinco guardianes muertos, y encima confirmando
la tesis que la tanda venía a demostrar. **Cuando el instrumento nuevo confirma lo que esperabas
encontrar, es cuando más hay que mirarlo.**

**Traza:** `src/auditoria-guardianes.js` (`mutar`, la transformación de fuente y el testigo)

---

## [2026-08-05] — El guardián del nº105 nunca pudo distinguir lo que dice distinguir

**Categoría:** aviso falso
**Síntoma:** encontrado por mutación en la auditoría de hoy. `src/probar-modelo-obligatorio.js` §2 se
titula *«EL MODELO SÍ ENTRA — el positivo de control»* y dice de sí mismo:

> *«se exige que el TEXTO lleve un nombre que **solo** puede venir del modelo»*

Se vacía el modelo desde fuera —`resolverPorWay` devuelve un `Map` vacío— y el guardián **pasa en
verde**. El texto de su ruta de control, con el modelo destruido:

```
   1.   Por un tramo sin nombre (acera)                63 m
   2.   Cruzas por un paso de peatones                  8 m
   3. ◦ Por Calle Salvador Minguijón (eje de calzada) 378 m   · 2 tramos de OSM   ← lo encuentra AQUÍ
   5.   Por un tramo sin nombre (acera)                11 m
   7.   Por un tramo sin nombre (acera)                33 m
```

**Siete pasos donde con el modelo hay UNO** («Por Calle Salvador Minguijón, 503 m, 12 tramos»). La
degradación se ve a simple vista. **El guardián no la ve**, porque busca la subcadena
`Por Calle Salvador Minguijón` y **el EJE de la calle la aporta por su cuenta: lo nombra OSM.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el guardián entero, sus cinco
secciones, y desde el día que se escribió.** Y no está solo: §3 —romper el modelo desde fuera y
exigir que `ruta.js` PARE— sí funciona y se le vio el rojo. ⇒ el fichero se lee sólido porque **cuatro
de sus cinco secciones son buenas**, y la que no lo es es justo la que dice ser el positivo de control.

**Cómo se cazó:** por mutación, no por lectura. Ninguna relectura del código lo habría delatado: la
afirmación *«un nombre que solo puede venir del modelo»* es plausible y está escrita con seguridad.
**Solo se ve rompiendo el modelo y mirando si el texto cambia.**

**Causa raíz:** la tanda 23 cubrió el fallo que había ocurrido —el modelo **no carga**, excepción,
`CRUDO` undefined— y eligió el testigo mirando ese caso. ⚠️ Pero hay un estado intermedio que nadie
consideró: **el modelo carga y no dice nada.** No revienta, no avisa, devuelve estructuras vacías y
el sistema sigue produciendo un resultado **plausible y degradado**. El guardián solo distingue los
extremos.

**Arreglo aplicado:** ⛔ **NINGUNO.** Esta tanda audita y no arregla; el arreglo se decide con
Antonio. Queda anotado qué haría falta: un testigo que **no pueda venir de OSM** — por ejemplo exigir
que la ruta salga en **UN solo paso** (que es lo que aporta el modelo al fundir el eje con sus doce
aceras), o una calle cuyo nombre no exista en OSM.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un positivo de control tiene que fallar cuando se rompe lo que
vigila, y eso se COMPRUEBA rompiéndolo — no se argumenta.** Escribí «un nombre que solo puede venir
del modelo» y era mentira; la frase sonaba a razonamiento y por eso nadie la puso a prueba. **Una
comprobación cuya validez descansa en una frase, y no en un rojo visto, es una opinión con formato de
guardián.**
⚠️ Y la séptima forma de mentir, que sale de aquí: **la comprobación distingue los extremos y no el
medio.** Vigila «está / no está» y se queda ciega ante «está pero vacío», que es justo el estado en
el que el sistema **sigue dando respuestas**. Un fallo que revienta se caza solo; el que degrada, no.

**Traza:** `src/probar-modelo-obligatorio.js` (§2), `src/auditoria-guardianes.js` (la mutación
`resolver-vacio`)

---

## [2026-08-05] — El guardián nuevo dio cuatro rojos en su primer arranque y los cuatro eran suyos

**Categoría:** aviso falso
**Síntoma:** primera ejecución de `src/numeros-congelados.js`, el fichero escrito precisamente para
que un número publicado no pueda moverse en silencio:

```
   grafo.nodos            68.649        68.787   ⛔   (+138)
   mapa.azulesConPasos    56.864        51.556   ⛔   (-5308)
   ⛔ FALLO · 17 filas congeladas no se ponen rojas al cambiarles el valor: no vigilan nada
   ⛔ FALLO · la comparación saca rojos con los valores sin tocar: se los inventa
```

**Cuatro rojos, y ni uno del proyecto.** Los dos primeros son dos medidas apuntando a la cantidad
equivocada (entradas siguientes); los dos últimos son el control de §A3 contaminado por los dos
primeros: contaba como «fila ciega» cualquier fila que se moviera **mientras otra fila estaba roja
por su cuenta**, así que en cuanto hubo una deriva de verdad, las diecisiete salieron ciegas.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la comprobación anti-vacío.** «17
congelados / 17 medidos / 0 huérfanos ✅» salió perfecta con dos de las diecisiete midiendo otra cosa.
Y tenía que salir: cuenta **cuántas** filas hay a cada lado, no **qué** miden. ⚠️ Una comprobación de
cardinalidad no dice nada del contenido, y se lee como si lo dijera.

**Cómo se cazó:** por el rojo mismo, y porque los números publicados están en `docs/` y se pueden
mirar. **Los cuatro fallos eran FALSOS POSITIVOS, y por eso se cazaron solos: un rojo obliga a
mirar.** ⚠️ Los cuatro rojos que la tanda 29 encontró eran lo contrario —verdes falsos— y llevaban
tandas ahí.

**Causa raíz:** un instrumento nuevo mide *algo parecido* a lo publicado y se supone que es *lo
mismo*. Y el control de la propia herramienta se escribió contra la medida de hoy, que es una entrada
sucia.

**Arreglo aplicado:** las dos medidas, en sus entradas. El control de §A3 pasa a correr contra una
base **sintética** —los propios valores congelados— en vez de contra la medida de hoy: así prueba **el
comparador**, que es lo que tiene que probar, y no puede contaminarse con derivas reales. Que la
MEDIDA sea de verdad lo prueba `--contraprueba`, que es otra cosa y va aparte.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **el control de un instrumento se corre contra una entrada limpia, no
contra el dato real.** Mezclar las dos cosas hace que el instrumento se declare roto en cuanto el dato
tenga algo que decir — justo el día que importa.
⚠️ Y la segunda, que es la que se lee mal: **una comprobación de CARDINALIDAD no dice nada del
CONTENIDO.** «17 congelados y 17 medidos ✅» convive tan campante con dos filas midiendo otra cosa.

**Traza:** `src/numeros-congelados.js` (§A3, la base sintética)

---

## [2026-08-05] — Congelé «68.649 nodos» y lo medí de un sitio que dice 68.787

**Categoría:** medida mal apuntada
**Síntoma:** `grafo.nodos: se publicó 68.649 y ahora sale 68.787  (+138)`. Leído tal cual, es
justo lo que este guardián viene a encontrar: **un número publicado que se ha movido.** Y no lo era.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **todo lo demás de la misma tabla**,
que se mide del mismo objeto `g` y clava los siete valores: aristas 98.774 ✅, componentes 170 ✅,
a-pie 94.570 ✅, vértices 378.222 ✅, km 6.499,98 ✅. ⚠️ **Que seis medidas del mismo objeto sean
exactas no dice nada de la séptima**, y sin embargo es exactamente la sensación que producen.

**Cómo se cazó:** preguntándole al código de dónde sale el número publicado en vez de dar por hecho
que salía de donde yo lo estaba leyendo:

```
   tras construir: nodos.length 68787   contadores.nodos 68649
   tras D.abrir  : nodos.length 68787   contadores.nodos 68649
```

⚠️ Y de paso murió la hipótesis cómoda —«los añade el enganche»—: los 138 ya están ahí desde el
primer instante.

**Causa raíz:** son dos cantidades distintas y las dos se llaman «nodos». `planarizar.js:493` hace
`cont.nodos = new Set(aristas.flatMap(...)).size`, o sea **los nodos que toca alguna arista**; el
array `g.nodos` lleva además 138 que no tocan ninguna. Lo publicado en la línea ⚑ de `ruta.js` —y en
`H1-CIERRE.md` y `H1-GRAFO-CIUDAD.md`— es el contador. Yo medí el array.

**Arreglo aplicado:** se mide `g.contadores.nodos`, que es literalmente el campo que imprime la línea
publicada. ⛔ **Los 138 no se tocan**: no son un fallo, son la definición del contador. Se enseñan en
la sección «medido y NO congelado» para que nadie los descubra otra vez desde cero.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un número congelado se mide del MISMO sitio del que salió el número
publicado, y eso se comprueba leyendo el código que lo imprimió** — no eligiendo el campo que suena
igual. Si no, el guardián no vigila el número: vigila un primo suyo, y el día que discrepen dirá que
el proyecto se ha movido cuando el que se movió es él.

**Traza:** `src/numeros-congelados.js` (`medir`, `grafo.nodos`), `src/planarizar.js:493`

---

## [2026-08-05] — El «antes» de la tanda 26 me salió idéntico al «ahora», y eso era imposible

**Categoría:** medida mal apuntada
**Síntoma:** `mapa.azulesConPasos: se publicó 56.864 y ahora sale 51.556  (-5308)`. Y el 51.556 no es
un número cualquiera: **es exactamente el «ahora»**. O sea, montar el modelo con la regla vieja
(`pasosConNombre: true`) no cambiaba absolutamente nada.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las otras dos medidas del MISMO
bloque, que salen del MISMO modelo «antes» y clavan lo publicado**: `pasos.deOsm` 1.153 ✅ y
`pasos.deducidos` 4.155 ✅. ⇒ el modelo viejo estaba bien construido y respondía bien; lo que estaba
mal era **la pregunta que le hacía la tercera línea**. Dos aciertos consecutivos con el mismo objeto
son una invitación a no mirar el tercero.

**Cómo se cazó:** ⭐ **por el álgebra, no por el rojo.** Un rojo dice «no coincide»; que el «antes»
salga *clavado al ahora* dice **qué** pasa: la rama que tenía que separarlos no se está ejecutando.
⚠️ Si el fallo hubiera dado 56.121 en vez de 51.556 me habría costado mucho más.

**Causa raíz:** pregunté con `CATEGORIA()`, que es de **tres** categorías —y devuelve `2` (gris) para
todo paso de cebra, mire el modelo que mire, porque el gris lo decide `e.nombreNoAplica`, que es un
campo de la arista—. Pero el «antes» de la tanda 26 es de **DOS** categorías: el gris no existía. La
pregunta correcta es `.nombre`, que es la que hace `paso-de-cebra.js` y por eso allí sale 56.864.
⇒ **usé el clasificador de hoy para medir el mundo de ayer.**

**Arreglo aplicado:** `trA(e).nombre` en vez de `CATEGORIA(trA(e)) === 1`. ⛔ Y sigue sin copiarse
ninguna regla (ley 56): quien contesta si hay nombre es el redactor.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **para medir un «antes» no basta con montar el estado de antes: hay
que hacerle la PREGUNTA de antes.** El estado viejo respondido por el clasificador nuevo no es el
antes — es el antes filtrado por lo que hemos aprendido después, y sale sospechosamente parecido al
ahora. Es primo del nº111 («un antes que sale del código de ahora no es un antes»), pero por el otro
lado: allí el estado era el de hoy, aquí el estado es el bueno y **la que es de hoy es la pregunta.**

**Traza:** `src/numeros-congelados.js` (`medir`, el bloque del «antes»), `src/paso-de-cebra.js` (§A4,
que sí la hacía bien)

---

## [2026-08-05] — Di la batería por corrida cuando no había barrido ni un fichero

**Categoría:** aviso falso
**Síntoma:** lancé `node src/probar-paradas.js` para cerrar la tanda y salió esto, en **código 0**:

```
   ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.
```

Treinta líneas de salida, cuatro secciones con sus ✅, código 0. **Y no había ejecutado ni uno de los
47 scripts de `src/`**: el barrido va detrás de `--todo`.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las tres secciones que sí corrieron
—P1, P2 y P3— y son buenas de verdad**, incluido el caso real de `Puerta del Carmen → Magdalena` con
su positivo de control. Un bloque sólido, verde y **completamente ajeno a lo que yo creía estar
comprobando**. ⚠️ La forma exacta del nº118: cuatro secciones buenas hacen que el fichero se lea
sólido y nadie mire la que falta.

**Cómo se cazó:** ⭐ **por el reloj.** La batería tarda media hora larga —`auditoria-guardianes.js`
sola son 517 s— y aquello acabó en dos minutos. **Y sólo después de mirar por el reloj leí que el
propio script lo dice por escrito**, en su sección P4:

```
   P4 · ⚠️ el invariante sobre todo `src/` NO se ha ejecutado (falta `--todo`).
      ⛔ y eso NO significa que pase: significa que no se ha mirado.
```

⇒ **el aviso estaba impreso, en su sitio, bien redactado, y no me sirvió de nada.** Es la ley 44 por
tercera vez: un `⛔` impreso es texto.

**Causa raíz:** el comando de la batería lo tenía en la cabeza sin la bandera, y el script **sale en
0** cuando no barre —correctamente, porque lo que sí corrió pasó—. ⇒ el código de salida no puede
distinguir «todo bien» de «casi nada mirado», y yo estaba leyendo el código de salida.

**Arreglo aplicado:** ninguno en el código —⛔ esta tanda no arregla instrumentos, y además el script
no miente: avisa—. Se corrió con `--todo`, que es lo que había que hacer.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **el reloj es el primer testigo de que una comprobación ha ocurrido, y
va antes de leer su veredicto.** Van tres: el nº106 (siete scripts de 20-60 s acabando en 14), la
segunda ronda de mutaciones de la tanda 29 (0,1 s por script) y ésta. **Un instrumento que no llega a
mirar es más rápido que uno que mira, siempre, y ésa es la única señal que da.**

**Traza:** `src/probar-paradas.js` (§P4 y la bandera `--todo`)

---

## [2026-08-05] — Inventé una opción que `construirModelo` no tiene, y el «antes» salió clavado al ahora

**Categoría:** medida mal apuntada
**Síntoma:** para atribuir el movimiento del reparto del mapa —51.556 → 51.493 al aplicar la regla
estricta de bicis— monté el «antes» así:

```js
const antes = Mo.construirModelo(g, portales, { asignacion: asigL.tabla });
```

```
azules con asignacion LAXA: 51493   con ESTRICTA: 51493   delta 0
aristas que cambian de categoria: 0
fuente del nombre que PIERDEN: []
```

**Delta cero, y las dos columnas dando el número de HOY.** `construirModelo` no tiene ninguna opción
`asignacion`: monta la asignación por su cuenta, ignora lo que le pases y devuelve el modelo actual
dos veces.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el script entero**. No lanzó, no
avisó, imprimió sus tres líneas con formato y un `delta 0` perfectamente legible. ⚠️ **Una opción que
no existe no es un error en JavaScript: es una propiedad más de un objeto que nadie mira.** El
lenguaje no tiene forma de quejarse, así que el instrumento arranca, corre veinte segundos y no mide
nada.

**Cómo se cazó:** ⭐⭐ **porque el «antes» salió CLAVADO al ahora**, que es el mismo síntoma del nº121
—donde el «antes» de la tanda 26 salía idéntico al ahora por hacerle la pregunta de hoy—. Van tres
veces (nº117, nº121 y ésta) que lo que delata a la palanca desconectada es **que los dos lados del
experimento dan lo mismo**. ⛔ Y no lo delató ningún ⛔: lo delató mirar el número esperando que
fuera distinto.

**Causa raíz:** di por hecho que la opción existía porque el fichero YA tiene tres opciones de ese
estilo (`pasosConNombre`, `sinParalela`, `sinPortales`). ⚠️ Que un módulo tenga opciones de una
familia no significa que tenga la que hace falta, y **el parecido con lo que sí existe es justo lo
que evita que lo compruebes**.

**Arreglo aplicado:** se añade `op.asignacionLaxa` a `construirModelo`, que sí llega hasta
`AB.asignar({ laxo })`, y **se comprueba que la palanca mueve algo antes de usarla**: se imprime
`aristas asignadas laxa/estricta` (3.557 / 3.472) y solo entonces se lee el resultado. Con la palanca
conectada: azules 51.556 → 51.493, y **las 63 que pierden el nombre son todas de `municipal-bici`**.
⭐ Y el «antes» reproduce **51.556 clavado**, que es el número congelado de la tanda 30: ése es el
positivo de control que dice que la reconstrucción es de verdad.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **una opción que no existe se pasa igual de bien que una que sí.** En un
objeto de opciones no hay nada que falle cuando te inventas una clave: el experimento corre entero y
devuelve el estado que querías cambiar. ⇒ **antes de leer el resultado de una palanca, se enseña que
la palanca movió algo** — y con un número que no sea el resultado, porque si usas el resultado estás
comprobando la conclusión con la conclusión.

**Traza:** `src/modelo.js` (`construirModelo`, `op.asignacionLaxa`), `src/puertas-sin-calle.js`

---

## [2026-08-05] — Leí el código de salida de `tail` y di por verde un script que salía en rojo

**Categoría:** aviso falso
**Síntoma:** cerrando la medición de las puertas sin calle:

```
node src/puertas-sin-calle.js 2>&1 | tail -45; echo "codigo=$?"
   …
   ⇒ ⛔ LAS PUERTAS SIN CALLE: 1 FALLO(S). El proceso saldrá en rojo.
codigo=0
```

**El script declara un fallo, la alarma dice que saldrá en rojo, y la línea de abajo dice `codigo=0`.**
Las dos cosas en la misma pantalla, y las dos ciertas: `$?` era el código de `tail`, no el de `node`.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la costumbre.** Llevo toda la tanda
cerrando comandos con `; echo "codigo=$?"` y las veces anteriores no había tubería, así que el número
era el bueno. **Un patrón que ha funcionado diez veces se deja de leer.**

**Cómo se cazó:** por la contradicción, no por el código: el texto del propio script decía «saldrá en
rojo» tres líneas más arriba. ⚠️ Si el script hubiera sido menos hablador, me lo trago.

**Causa raíz:** en una tubería, `$?` es el código del ÚLTIMO mandato, y `tail` casi siempre sale en 0.
⇒ **el instrumento con el que compruebo si algo salió bien es el que no estaba mirando.**

**Arreglo aplicado:** el código se toma sin tubería —`node … > fichero 2>&1; echo $?`— y se lee del
fichero lo que haga falta. ⛔ No se arregla nada del proyecto: el fallo era de cómo lo estaba
mirando, y el script hacía exactamente lo que debía.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **el código de salida no sobrevive a una tubería.** Y la general, que es
la que importa: **el instrumento con el que se comprueba también es un instrumento.** Van dos en dos
tandas —el nº122 fue dar por corrida una batería que no barrió nada— y las dos veces el error no
estaba en lo medido sino en cómo lo estaba leyendo.

**Traza:** (ninguna en el repositorio: es un fallo de método)

---

## [2026-08-05] — Conté cero avisos de bici buscando una palabra que el texto no usa

**Categoría:** cero sin positivo de control
**Síntoma:** comprobando si el titular «el aviso de bicis sale en 5 de los 82 pasos» seguía vigente,
mi contador dijo:

```
menciones de bici en el texto: 0
```

**Cero.** Y el número publicado era 5, así que a punto estuve de publicar «otro número caducado: de 5
a 0», que habría sido un hallazgo inventado sobre un texto que no ha cambiado.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la otra mitad del mismo comando**, que
contaba los pasos de las siete rutas y dio 74 —correcto, y además destapó un caducado de verdad—. ⚠️
**Un comando que acierta en una columna se lee como si acertara en las dos.**

**Cómo se cazó:** ⭐ **por la regla del proyecto**: todo cero se demuestra con un positivo de control.
Se buscó `bici` a secas y salieron **5**, con su frase: *«bicis: conviene ir atento»*. ⇒ el texto dice
**«bicis»**, y yo estaba buscando `bicicleta` y `carril bici`.

**Causa raíz:** escribí el patrón desde lo que yo diría, no desde lo que dice el redactor. ⛔ Y el
redactor está en el repositorio: mirarlo costaba un `grep`.

**Arreglo aplicado:** ninguno en el código —no hay nada roto—. El número se confirma: **5 avisos, los
mismos**, y lo que cambia es el denominador (5 de 74, no 5 de 82).

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un cero de un buscador es un resultado sobre el buscador hasta que se
demuestra lo contrario.** La regla del proyecto ya lo decía; lo que añade este caso es **cuándo pica**:
cuando el cero CONFIRMA algo interesante. «De 5 a 0» era un titular, y un titular baja las ganas de
comprobar el instrumento que lo produjo.

**Traza:** (ninguna en el repositorio: es un fallo de método)

---

## [2026-08-05] — 950 m de pasillos de edificio se escribían como «eje de calzada»

**Categoría:** clasificación mal hecha
**Síntoma:** el invariante `plataforma ⇄ precision` de `modelo.js` llevaba desde la tanda 19 sacando
una familia de choque **no predicha**:

```
   familia del choque                                          aristas      metros
   plataforma-peatonal ⇄ eje-de-calzada   (highway=corridor)        22       950 m
```

Un `highway=corridor` es el pasillo interior de un edificio. `precision()` no lo conocía, así que
caía al valor por defecto del final de la función: **`eje-de-calzada`**. ⇒ 22 aristas y 950 m de
pasillo se contaban en la tabla D4 —y se escribían en el texto de las rutas— como el eje de una
calzada.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás que el proyecto sabe
de un `corridor`, que es bastante y es correcto.** `forma.js:81` le da `plataforma-peatonal`, y
`condicionales.js:54` lo trata como **paso condicional FIRME** —«atravesar algo que tiene dueño y
puerta»— y el texto ya avisa de él desde la tanda 12. ⚠️ **Estaba bien clasificado en dos sitios de
tres, y eso es justo lo que hizo que nadie mirara el tercero.**

**Cómo se cazó:** ⭐ **lo cazó el invariante, y desde el primer día.** No es que no hubiera guardián:
lo había, decía la verdad, salía en rojo cada ejecución, y estuvo doce tandas esperando a que alguien
decidiera. ⇒ el fallo no fue de detección: fue de **cola**.

**Causa raíz:** `precision()` termina en `return 'eje-de-calzada'` sin cajón de «otros». Cualquier
`highway` que no esté en sus cinco listas **se convierte en calzada en silencio**. ⛔ No hay ninguna
señal de que se haya caído al defecto: un valor por defecto es indistinguible de una decisión.

**Arreglo aplicado:** `corridor` entra en la lista de `peatonal`, que es donde ya están `footway`,
`pedestrian`, `path` y `living_street`. ⛔ No hace falta categoría nueva ni tocar la transitabilidad:
la precisión no entra en el coste ni en `transitableAPie()` —comprobado, sus únicos consumidores son
el hash del grafo, la fusión de pasos del relato y los informes—, y **las siete rutas salen idénticas
al milímetro**.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un `return` por defecto al final de un clasificador convierte «no lo
conozco» en una afirmación**, y no deja rastro de que se ha caído ahí. La forma que sí avisa es la de
`plataforma()`, que tiene nueve valores y **ninguno es «otros»**.
⚠️ Y la segunda, que es de proceso: **un rojo que lleva doce tandas abierto ya no es un aviso, es
mobiliario.** Éste decía exactamente lo que pasaba, con su familia y sus metros, todos los días.

**Traza:** `src/planarizar.js` (`precision`), `src/modelo.js` (el invariante INV)

---

## [2026-08-05] — El hook rechazaba la práctica que el propio repositorio exige, y escribía en lo que vigila

**Categoría:** aviso falso
**Síntoma:** `.githooks/commit-msg` rechaza un `fix:` sin entrada de bitácora. Tenía **tres falsos
positivos**, encontrados en la auditoría de la tanda 29 y nunca anotados aquí:

```
   ⛔ git commit --amend                         rechaza  Y ESCRIBE
   ⛔ git commit --amend --no-edit               rechaza  Y ESCRIBE
   ⛔ fix: con la entrada en el commit ANTERIOR  rechaza  Y ESCRIBE
```

⚠️⚠️ **Y el tercero es el que manda: `CLAUDE.md` exige commits ATÓMICOS.** Una entrada de bitácora y
un arreglo son dos cosas. **El guardián castigaba exactamente la ley que venía a defender**, y la
salida fácil —meterlo todo en un commit— es dejar que el guardián escriba la historia.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **su único caso, que funciona
perfectamente**: `fix:` con la entrada en el mismo commit se acepta, y sin entrada se rechaza. El hook
hacía bien lo que se le probó. **Nadie le había probado nunca un verde que no fuera el suyo**, que es
la diferencia entre «se le ha visto el rojo» y «se le ha visto todo».

**Cómo se cazó:** por mutación, en la tanda 29. ⚠️ Ninguna relectura lo habría dado: el código es
correcto para la pregunta que se hace —«¿el diff en stage añade una cabecera?»—. Lo que estaba mal era
**la pregunta**, no la respuesta.

**Causa raíz:** los tres casos son el mismo: **la entrada existe, pero no en el diff en stage.** Y el
efecto lateral —escribir el esqueleto en `docs/BITACORA.md` y añadirlo al stage— es la ley 39: un
guardián que modifica el estado que vigila. En la tanda 26 eso coló una entrada entera de NO CONSTA
dentro de un commit (nº112).

**Arreglo aplicado:** una sola regla nueva cierra los tres: se acepta también si la entrada entró en
**HEAD y no en HEAD~**. ⛔ No se detecta `--amend`, que desde `commit-msg` no se puede hacer
limpiamente. Y el esqueleto va a `$GIT_DIR/BITACORA-ESQUELETO.md`, **fuera del árbol y sin `git add`**.
⚠️ **Efecto lateral declarado: es más laxo** —una entrada puede cubrir dos `fix:` seguidos si van en
el mismo commit—, y se acepta a cambio de cero falsos positivos.
⭐ Y nace con `src/probar-hook.js`: su rojo, sus tres verdes, el límite de la laxitud (dos commits
después ya se rechaza) y que el árbol quede intacto — **7 de 7, en un repositorio de usar y tirar**,
con la palanca comprobada antes (un hook que rechaza todo tiene que rechazar).

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **a un guardián hay que verle los VERDES, no solo el rojo.** La ley del
proyecto decía «no está hecho hasta que se ha visto su rojo», y este hook lo cumplía: se le había
visto. Le faltaba lo otro —**qué rechaza que no debería**—, y ése es el fallo que hace que un guardián
se desactive, que es peor que no tenerlo.
⚠️ Y la segunda: **cuando un guardián y una ley del proyecto chocan, mira el guardián primero.** Aquí
la ley era buena y el guardián estaba mal, pero la salida cómoda era al revés.

**Traza:** `.githooks/commit-msg`, `src/probar-hook.js`

---

## [2026-08-06] — Escribí la prueba de aceptación sobre MI hipótesis, no sobre lo que dijo Antonio

**Categoría:** aviso falso
**Síntoma:** el encargo pone las dos avenidas de Antonio como control: *«el método TIENE que cazarlas;
si no las caza, el método no vale»*. Escribí eso como `A.exige` sobre §B2 —«portales enganchados a la
acera contraria»— y el script salió en rojo:

```
   AVENIDA CATALUÑA   0 enfrente de 66 decidibles   ⛔ NO LA CAZA
   AVENIDA MADRID     0 enfrente de 94 decidibles   ⛔ NO LA CAZA
   ⛔ FALLO · el método no caza 2 de las 2 dianas de Antonio: el instrumento no vale
```

**Y el veredicto era falso.** El método funciona; lo que no ocurre en esas dos avenidas es el fallo
que yo había supuesto.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el desfase entre hilos, en la misma
tabla y dos líneas más arriba**: Cataluña **166 m** de mediana, Madrid **574 m**. O sea, el
instrumento estaba cazando exactamente lo que Antonio describió —*«ni de coña coincide una acera con
la de enfrente»*— y **al lado ponía «NO LA CAZA»**, porque yo estaba preguntando otra cosa.

**Cómo se cazó:** midiendo por qué salían cero en vez de aceptar el rojo. En las dos avenidas,
**0 de 35 y 0 de 48 aristas de acera llevan las dos paridades**: cada acera lleva solo la suya, así
que el enganche **no puede** estar enfrente ahí. El cero no era ceguera del método: era el dato
diciendo que ese fallo no está en esas calles.

**Causa raíz:** Antonio dijo **dos cosas** —«lo marca en la acera contraria» y «ni de coña coincide
una acera con la de enfrente»— y yo las traté como una sola. Al escribir la prueba, la colgué de mi
explicación del mecanismo en vez de colgarla de la afirmación observable. ⇒ **una prueba de
aceptación que depende de que mi diagnóstico sea correcto no es una prueba de aceptación: es el
diagnóstico otra vez.**

**Arreglo aplicado:** se comprueban **las dos afirmaciones por separado**, y el `A.exige` va sobre la
literal y medible (el desfase). La otra **se reporta con su explicación medida**, que es un hallazgo
por sí sola: en las dianas de Antonio el enganche está bien. ⛔ Y no se ha aflojado nada: la
comprobación de §B2 sigue ahí, con su línea base de barajado al lado.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una prueba de aceptación se escribe contra lo que se OBSERVÓ, no
contra lo que uno cree que lo causa.** Si se cuelga de la hipótesis, cuando la hipótesis falla la
prueba dice «el instrumento no vale» y el instrumento estaba bien — y la salida cómoda es aflojarla,
que es cómo se ajusta un instrumento al resultado sin darse cuenta.
⚠️ Y la segunda: **cuando el usuario dice dos cosas en la misma frase, son dos.**

**Traza:** `src/acera-equivocada.js` (§C, las dos preguntas)

---

## [2026-08-06] — Publiqué «mediana 126 m, máximo 18.633 m» y las doce peores filas eran la misma carretera

**Categoría:** medida sin clasificar
**Síntoma:** el desplazamiento por hueco de numeración salió así:

```
   números que NO existen y caen en la OTRA paridad           66973
   desplazamiento              mediana 126   p90 171   máx 18633

   ⭐ LOS 12 PEORES SALTOS
   CARRETERA AUTOVÍA DE LOGROÑO   138  →157  (el suyo 242)   18633 m
   CARRETERA AUTOVÍA DE LOGROÑO   140  →157  (el suyo 242)   18633 m
   … y diez filas más, todas la misma carretera
```

**Un máximo de 18,6 km en una tanda que va de aceras**, y una tabla de «los doce peores» que era
**una sola vía repetida doce veces**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la aritmética, que era correcta.**
Los 66.973 huecos existen, el 18.633 es real, y la mediana está bien calculada. ⚠️ **No había ningún
error que encontrar: había una pregunta mal hecha.** Eso es lo que hace que este tipo de número pase:
no se puede depurar, porque no está roto.

**Cómo se cazó:** ⭐⭐ **por la costura que el propio encargo puso**: *«si el número sale grande,
sospecha del instrumento antes de celebrarlo»*. Sin esa frase delante, un 126 de mediana era
publicable y confirmaba la tesis de la tanda.

**Causa raíz:** conté en una sola bolsa calles urbanas y carreteras de acceso. Una carretera numerada
cada kilómetro **no tiene «la acera de enfrente»**, así que sus huecos no son el fenómeno que se está
midiendo — pero sí son el 81 % de la bolsa y se llevan la mediana y el máximo.

**Arreglo aplicado:** se parte por el `tipoVia` **del propio callejero**, no por una clasificación
mía, y se publican las tres filas: TODOS, urbanas y el resto. El titular pasa a ser **12.610 huecos
urbanos, mediana 51 m, p90 252 m**. ⭐ Y se añade el denominador que faltaba —cuántos números se
pueden pedir— para que el número tenga unidad.
⚠️ La tabla de los peores pasa a ser **uno por vía**: doce filas de la misma calle no son doce casos.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **clasificar antes de contar no es una preferencia de presentación: es lo
que decide si el número significa algo** (ley 29, y van varias). Aquí la bolsa sin partir daba un
titular 2,5 veces mayor y un máximo de otro planeta, **con toda la aritmética correcta**.
⚠️ Y la que hace falta recordar: **una tabla de «los N peores» sin agrupar por su unidad natural
enseña el peor caso N veces, no los N peores casos.**

**Traza:** `src/acera-equivocada.js` (§B3b, la partición por `tipoVia`)

---

## [2026-08-06] — Cero vías urbanas: mi filtro comparaba palabras contra códigos de dos letras

**Categoría:** cero sin positivo de control
**Síntoma:** al partir los huecos por tipo de vía, la fila que iba a ser el titular salió vacía:

```
   TODOS                                        66973   mediana 126
   ⭐ solo vías URBANAS (calle/avenida/paseo…)       0         —
   ⚠️ carreteras, caminos, diseminados…         66973   mediana 126
```

**Cero vías urbanas en Zaragoza.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la partición cuadraba perfectamente**:
0 + 66.973 = 66.973. ⚠️ Una suma que cuadra no dice nada de si el criterio separa: **con un filtro que
no casa nunca, todo se va a un lado y el total sigue siendo el total.**

**Cómo se cazó:** ⭐⭐ **porque el caso que abre la tanda tenía que estar dentro.** Avenida Cataluña es
una avenida y su hueco —el 78— es literalmente el motivo de esta tanda. Un cero que incluye el caso
conocido es imposible por definición, y eso se ve sin depurar nada.
⇒ Positivo de control: `tipoVia` tiene **códigos de dos letras** —`CL` 2.443, `CN` 252, `PL` 202,
`AV` 81…—, y yo comparaba contra `'CALLE'`, `'AVENIDA'`. Avenida Cataluña es `AV`.

**Causa raíz:** supuse el formato de un campo en vez de mirarlo. El campo se llama `tipoVia` y el
callejero lo publica como código.

**Arreglo aplicado:** el conjunto pasa a ser `CL AV PS PL GL RD TR CJ PJ AN VI`, con el criterio
escrito —trama de calle con dos aceras y numeración alternando— y **con un `A.exige` que impide que
vuelva a salir cero**: *«CERO huecos en vías urbanas: imposible — Avenida Cataluña es urbana y su
hueco abre esta tanda»*. ⭐ Es el caso conocido convertido en guardián.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **si tienes un caso conocido, conviértelo en el positivo de control del
filtro que lo debería contener.** No hace falta pensar en qué podría fallar: basta con exigir que el
sitio donde empezó todo siga apareciendo.
⚠️ Y la de siempre, que van tres tandas seguidas (nº125, nº128 y ésta): **un cero es un resultado
sobre el buscador hasta que se demuestra lo contrario** — y pica más cuando el cero es cómodo.

**Traza:** `src/acera-equivocada.js` (§B3b, `URBANAS`)

---

## [2026-08-06] — Registré el fichero nuevo en la lista equivocada y me inventé un rojo

**Categoría:** aviso falso
**Síntoma:** al cerrar la tanda, la batería sacó un rojo que antes no estaba:

```
   probar-modelo-obligatorio.js   código 1   DECLARA FALLO
   acera-equivocada.js   (no carga el modelo)   no   ⚠️
   ⛔ FALLO · acera-equivocada.js no llega a cargar el modelo: la sonda no puede opinar
```

**Y el mensaje era cierto**: `acera-equivocada.js` **no carga `./modelo`**, y no tiene por qué —pide
`./direccion`, `./portales`, `./ruta`, `./grafo` y `./tabla-rutas`, que es el enganche y el callejero,
no los nombres deducidos—. El que estaba mal era yo, que lo metí en una lista a la que no pertenece.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo demás del fichero nuevo**:
`acera-equivocada.js` salió en **código 0, sin fallos**, con sus secciones A–E y sus siete `A.exige`.
El script estaba perfecto; lo que fallaba era **una línea de registro en otro fichero**. ⚠️ Y la
batería siguió dando su ✅ global, porque el invariante que vigila —«declarar un fallo y salir en
0»— se cumplía: el rojo era falso pero estaba bien señalizado.

**Cómo se cazó:** por comparación con la tanda anterior. `probar-modelo-obligatorio.js` salía en 0 en
la 31 y ahora en 1, y lo único que había cambiado ahí era mi línea.

**Causa raíz:** apliqué la ley del nº109 —*«regístralo el mismo día que nace, no cuando falle»*— sin
comprobar la CONDICIÓN de la lista. `CONSUMIDORES` no es «los ficheros nuevos»: es **los que cargan el
modelo**, porque la sonda mide si les muerde la dependencia circular con `ruta.js`. Un fichero que no
carga el modelo no puede pasar por ese ciclo, así que la sonda no tiene nada que decir de él.

**Arreglo aplicado:** se saca de la lista, y se deja escrito **por qué no está** — si no, el siguiente
lo vuelve a añadir «por si acaso» y el rojo vuelve.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **registrar no es comprobar** — es la regla 1 del proyecto («configurar
no es comprobar») aplicada a una lista. Añadir un nombre a un sitio se siente como cumplir; lo que
cumple es **leer qué exige ese sitio**.
⚠️ Y la segunda, que es la que hace daño a largo plazo: **un rojo falso bien señalizado sigue siendo
ruido.** Éste decía la verdad, salía en rojo como debe y no significaba nada — que es exactamente lo
que la tanda 31 se dedicó a quitar.

**Traza:** `src/probar-modelo-obligatorio.js` (`CONSUMIDORES`), `src/acera-equivocada.js`

---

## [2026-08-06] — El detector de numeración correlativa pasó los cuatro casos conocidos y se llevó por delante Avenida Pablo Gargallo

**Categoría:** aviso falso
**Síntoma:** para saber dónde la paridad NO significa acera hice falta un detector de vías con
numeración correlativa, y lo monté midiendo el ángulo entre `n→n+1` y `n→n+2`: en una calle par/impar
el `n+1` está enfrente y el `n+2` calle adelante, así que el ángulo tiene que ser grande. Calibré el
listón contra los cuatro casos que ya se sabían:

```
   POLÍGONO SAN VALERO                   mediana   0°   correlativa   ✅  (tanda 4)
   URB. TORRES DE SAN LAMBERTO           mediana  35°   correlativa   ✅  (tanda 4)
   AVENIDA CATALUÑA                      mediana 167°   par/impar     ✅  (diana de Antonio)
   AVENIDA MADRID                        mediana 178°   par/impar     ✅  (diana de Antonio)
```

**Cuatro de cuatro.** Y con ese listón, `Avenida Pablo Gargallo 16` salía así:

```
   Avenida Pablo Gargallo 16   numero-aproximado   nº15   sin-paridad
      «en esta vía los números van seguidos, no por aceras · el 16 no existe y te dejo en el 15»
```

**Pablo Gargallo es una avenida normal de dos aceras**, y el 15 es exactamente la acera de enfrente
que esta tanda existe para no dar.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **los cuatro casos de control, los
cuatro en verde.** Dos vías correlativas conocidas dentro y las dos dianas de Antonio fuera. Un
listón calibrado contra verdad conocida, que es lo que se supone que hay que hacer — y aun así estaba
mal. ⚠️ Y no había forma de verlo en esa tabla: **el instrumento acertaba en todo lo que se le
preguntaba.**

**Cómo se cazó:** ⭐ pasándole las catorce direcciones de las siete rutas. Pablo Gargallo 16 es el
destino de la ruta 1 y salió etiquetado como vía de numeración seguida, que es falso a simple vista.

**Causa raíz:** ⭐⭐ **los ángulos son BIMODALES incluso en las avenidas normales.** Avenida Cataluña
tiene 12 tríos por debajo de 20° y 16 por encima de 87°; Madrid, 14 y 30. En una vía con las dos
aceras desfasadas, el `n+1` de enfrente cae unas veces adelante y otras atrás. ⇒ **la mediana de una
distribución bimodal no dice de qué lado está la vía: dice cuál de los dos montones es más gordo.**
Pablo Gargallo tenía 9 tríos, 5 de ellos pequeños, y la mediana se fue a 13°.

**Arreglo aplicado:** se deja de mirar la mediana y se mira **la FRACCIÓN de tríos que van calle
adelante**, que es lo que se quería medir desde el principio; los tríos mínimos suben de 5 a **15**, y
la fracción exigida es **0,90**. ⭐ Y el corte va alto **a propósito, por la asimetría del daño**:
declarar correlativa una vía que no lo es repite el fallo original sin cota (258 m en Avenida
Cataluña), mientras que declarar par/impar una correlativa lo acota el listón de 50 m o se convierte
en sugerencia. ⇒ ante la duda, paridad, y la duda se declara (`no-verificable`, 58,9 % de las vías).
⛔ Y el precio va escrito: con 0,90 el método caza Polígono San Valero (0,98) y **NO caza Torres de
San Lamberto (0,65)**, que era uno de los dos casos conocidos. Sus 51 tríos van de 1° a 180°: la
numeración está mezclada de verdad. **NO CONSTA** — no se fuerza a mano.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un listón calibrado contra N casos conocidos acierta en los N casos
conocidos.** Eso no es una comprobación: es la definición de calibrar. La comprobación es el caso
N+1, y hay que ir a buscarlo — aquí lo trajo el banco de rutas, que es dato de fuera.
⚠️ Y la segunda: **antes de resumir una distribución por su mediana, mírala.** Una bimodal resumida
por su centro describe un sitio donde no hay nada.

**Traza:** `src/paridad.js` (`formaDeVia`, `MIN_TRIOS`, `FRAC_CORRELATIVA`)

---

## [2026-08-06] — Metí en la misma fila el error de las respuestas que doy y el de las que rechazo

**Categoría:** medida sin clasificar
**Síntoma:** la tabla de «cuánto acerca» salió así:

```
   lo que te alejaba la acera de enfrente (tanda 32)    66877   med 126   p90 171
   ⭐ EL ERROR QUE QUEDA: el hueco donde puede caer     36963   med  85   p90 248
```

**Un error residual de 85 m con un listón declarado de 50 m.** Aritméticamente imposible de leer: si
solo se contesta cuando el hueco mide 50 m o menos, ¿de dónde sale una mediana de 85?

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el `A.exige` del cuadre, que estaba
puesto y pasó.** La fila de arriba reproducía la tanda 32 clavada —126 m todas, 54 m urbanas frente a
51— y eso daba por bueno el barrido entero. ⚠️ Un cuadre correcto en la fila de al lado no dice
absolutamente nada de esta fila.

**Cómo se cazó:** ⭐ por el listón. 85 > 50 es un absurdo aritmético contra un número declarado en el
propio fichero, y se ve sin depurar nada. **Los listones declarados sirven para esto, no solo para
decidir.**

**Causa raíz:** metí en el mismo array las consultas que SÍ se contestan —cuyo error está acotado por
el listón, ≤ 50 m por construcción— y las que se RECHAZAN por hueco grande —cuyo hueco es
precisamente > 50 m—. **Son dos poblaciones con significados opuestos**: una es «lo que sigue sin
saberse aun contestando bien» y la otra es «lo que me niego a contestar». Sumadas no son nada.

**Arreglo aplicado:** dos filas separadas, con su nombre: *el error que queda en las que SÍ se
contestan* (4.562 · mediana 22 m · máx 50) y *el hueco de las que se RECHAZAN* (32.401 · mediana
85 m). ⭐ Y de paso aparece el número que de verdad hacía falta: el error residual real es de 22 m,
no de 85.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **si una fila puede contener dos poblaciones separadas por una decisión
del propio código, ya son dos filas.** Aquí la decisión era literalmente `if (cota <= LISTON)`: el
código ya las había partido y el informe volvió a juntarlas.
⚠️ Y la que se repite desde el nº129: **clasificar antes de contar** — con la variante de hoy, que es
que el criterio de clasificación estaba escrito tres líneas más arriba.

**Traza:** `src/medir-paridad.js` (§C2, `G.resp` y `G.neg`)

---

## [2026-08-06] — Copié la sugerencia campo a campo y se quedó un campo por el camino

**Categoría:** datos
**Síntoma:** el informe imprimía la sugerencia con un `undefined` pegado:

```
   ⭐ sugerencia  nº74    acera de los pares    175 m undefined
   ⭐ sugerencia  nº36    acera de los pares    NO CONSTA la distancia: undefined
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la comprobación que de verdad
importaba de esa sección**: *«ninguna sugerencia puede ser de la acera de enfrente»* — 5 sugerencias,
0 de enfrente, ✅. El contenido que decide estaba bien; lo que faltaba era el que explica.

**Cómo se cazó:** ojo humano, leyendo la salida. Nada lo habría cazado solo: un `undefined` impreso no
rompe nada ni cambia ningún número.

**Causa raíz:** `paridad.js` construye la sugerencia con cuatro campos —`n`, `acera`, `metros` y
`motivo`— y `direccion.js` la volvía a montar campo a campo para no exponer el portal crudo. Se me
quedó `motivo` fuera. ⇒ **re-mapear un objeto campo a campo pierde en silencio todo lo que se añada
después**, y el sitio donde se pierde no es el sitio donde se nota.

**Arreglo aplicado:** se añade `motivo` al mapeo. ⛔ NO se cambia a un `{...s}`: el `portal` crudo se
expone a propósito y controladamente —lo necesita el cálculo de la ruta con la sugerencia aceptada—,
y un `spread` metería ahí dentro lo que haya en cada momento.

**Commit:** (este commit)

**Ley que sale de aquí:** ⚠️ **un `undefined` impreso es el mismo animal que un `⛔` impreso** (ley 44):
no falla, no cuenta, no sale en ningún código de salida. Se caza leyendo, y por eso hay que leer la
salida entera al menos una vez — no solo las líneas que uno fue a buscar.

**Traza:** `src/direccion.js` (`resolver`, el mapeo de `sugerencias`)

---

## [2026-08-06] — Cambié el contrato de `resolver()` y reventé un script que llevaba un día escrito

**Categoría:** rompe
**Síntoma:** la regla de la paridad hace que `direccion.resolver()` pueda devolver `portal: null`
—«no se tiene, solo sugerencia»—, y eso antes no pasaba nunca cuando la calle existía.
`src/acera-equivocada.js`, el instrumento de la tanda 32, empieza así:

```js
const res = D.resolver('Avenida Cataluña 78', ctx.indice);
const o = res.portal;
di('⭐⭐ lo que devuelve el geocodificador', `el portal nº${o.n}   …`);
```

```
TypeError: Cannot read properties of null (reading 'n')
    at Object.<anonymous> (src\acera-equivocada.js:170:65)
```

**Y hay una segunda víctima en el mismo fichero:** §D2 medía la ruta 1 pidiendo `Avenida Cataluña 78`
y `Avenida Pablo Gargallo 16` —los textos que devolvían el 77 y el 15—, así que su cuadre contra los
3.086,9 m publicados también se quedaba sin portales.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la batería entera.**
`node src/probar-paradas.js --todo` ejecutó los 56 scripts de `src/`, uno de ellos se estrelló, y la
batería terminó con **`⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.` y código 0.**
⚠️ Y no solo eso: en su propia tabla, la fila del script muerto pone **`código 1  sin fallos  ✅`**.

**Cómo se cazó:** ⭐ leyendo la tabla de la batería fila por fila en vez de mirar el veredicto final.
`acera-equivocada.js` salía en código 1 y el día anterior salía en 0. Nada me avisó: hubo que
comparar con lo que uno recordaba.

**Causa raíz:** amplié lo que puede devolver una función —`portal` pasa a poder ser `null`— y busqué
los consumidores con `grep` de `D.punto` y `.resolver(`. **Los encontré todos**, incluido éste. Lo
que no hice fue **ejecutarlos**: miré si el `null` estaba tratado en `ruta.js` y `rutas-antonio.js`,
que eran los que me preocupaban, y di por hecho que un script de auditoría de ayer se defendería
solo. ⇒ **encontrar al consumidor no es comprobar al consumidor.**

**Arreglo aplicado:** `acera-equivocada.js` mide ahora **las dos cosas y las separa**: qué contesta
HOY el buscador (`sin-numero-cerca` + sugerencias nº74 / nº84) y, al lado, el nº77 **pedido de forma
explícita**, que es lo que devolvía cuando se hizo aquella medición.
⭐ Y el cuadre de §D2 mejora al arreglarse: pasa a pedir `Avenida Cataluña 77` y
`Avenida Pablo Gargallo 15` en vez de depender de qué conteste el buscador. ⇒ **deja de guardar la
regla del buscador y pasa a guardar lo que tiene que guardar: el grafo y el enganche.** Los 3.086,9 y
los 523,4 vuelven a salir clavados, y seguirán saliendo aunque la paridad cambie otra vez.
⛔ No se ha borrado ni suavizado nada de la tanda 32: los 258 m, el enganche de 1,82 m y los
−254,8 m siguen imprimiéndose igual.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **ampliar lo que una función puede devolver es romper su contrato,
aunque no cambie ni una firma ni un nombre.** «Ahora esto puede ser null» es un cambio incompatible,
y la lista de consumidores es el principio del trabajo, no el final: **hay que ejecutarlos.**
⚠️ Y la segunda, que es la que se lleva la tanda: **un instrumento de auditoría es código de
producción.** Mide una verdad histórica y tiene que seguir midiéndola; cuando el mundo se mueve
debajo, el arreglo es **medir las dos cosas y decir cuál es cuál**, no actualizarlo al presente y
perder el punto de comparación.

**Traza:** `src/acera-equivocada.js` (§A, §D, §D2), `src/direccion.js` (`resolver`)

---

## [2026-08-06] — La batería recorre los 56 scripts, uno se estrella, y sale en verde

**Categoría:** silencio falso
**Síntoma:** con `acera-equivocada.js` muerto de un `TypeError`, la batería completa dio esto:

```
   acera-equivocada.js       código 1       sin fallos     ✅
   …
   ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.
```

**Código de salida 0.** Un script que ni siquiera llegó a la mitad de su informe, marcado con un ✅.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **P1, P2 y P3 —los tres casos que la
batería provoca a propósito— pasaron los tres**, incluido el caso real de la ruta del casco que
estuvo rota dos tandas. La parte de la batería que se diseñó con cuidado funciona; el agujero está en
la que barre.

**Cómo se cazó:** por la fila de al lado. El código 1 de un script que ayer salía en 0 llamaba la
atención; el `✅` de esa misma fila, más.

**Causa raíz:** ⭐⭐ **el invariante está escrito en UNA sola dirección**:

```js
const ok = !declara || r.status !== 0;      // «un fallo declarado no puede salir en 0»
```

Es exactamente lo que dice hacer, y está bien. Pero **un script que se estrella no declara nada**:
`declara` es `false`, la condición se cumple sola y el `✅` no significa «ha ido bien», significa «no
ha dicho que fuera mal». ⇒ **la batería no comprueba que los scripts terminen: comprueba que los que
se quejan no salgan en verde.** Son dos cosas distintas y llevaban treinta y tres tandas pareciendo
la misma.

**Arreglo aplicado:** se añade la marca de morirse. Node imprime su epílogo (`Node.js vXX`) tras una
excepción no capturada, y eso es específico de «se ha muerto», no de «ha salido en 1» —que puede ser
legítimo: `ruta.js` sin argumentos sale en 2 a propósito—.
⚠️ Y solo cuenta si el script **no declara nada**: `A.imposible()` también revienta, pero ésa es la
forma correcta de morirse y deja su marca escrita. ⇒ `mudoYMuerto = revienta && !declara`.
⭐ Su rojo se ha visto antes de arreglar nada, con los tres casos al lado:

```
   acera-equivocada.js       codigo 1    ESTRELLA  ⛔ SE ESTRELLA SIN DECIR NADA
   auditoria-guardianes.js   codigo 1    DECLARA   ✅      (declara fallo a propósito)
   paridad.js                codigo 0    sin fallo ✅
```

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **«no ha dicho que vaya mal» no es «va bien».** Un barrido cuyo criterio
es una implicación —*si se queja, que no salga en 0*— da por bueno todo lo que se calla, y morirse es
la forma más completa de callarse.
⚠️ Y la de la casa, otra vez y en su forma más limpia: **un guardián no está hecho hasta que se ha
visto su rojo.** El de la batería se había visto para P1, P2 y P3 —los tres provocados— y **nunca
para P4**, que es el que barre 56 ficheros. P4 nació en `e264d90` (2026-08-03, *«un fallo detectado
ya no puede terminar en verde»*) y **su rojo no se había provocado ni una vez** desde entonces:
`git log -S"EL INVARIANTE SOBRE TODO" -- src/probar-paradas.js` devuelve ese único commit.

**Traza:** `src/probar-paradas.js` (P4, `revienta` / `mudoYMuerto`)

---

## [2026-08-06] — Escribí la ley ayer, y hoy volví a perder un campo en el mismo mapeo

**Categoría:** datos
**Síntoma:** la tanda 34 añade a la sugerencia el campo `enfrente`, que es lo que dice si hay que
cruzar la calle. Al probarla:

```
   Avenida Pablo Gargallo 16
      sug nº17   su acera   94 m
      sug nº15   su acera   114 m
```

**El 17 y el 15 son impares y el número pedido es par.** Son las dos de la acera de enfrente y
salían marcadas como si fueran de la suya — o sea, justo lo que el aviso tiene que decir y no decía.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la ley que lo describe, escrita
ayer por mí en la entrada nº134**: *«re-mapear un objeto campo a campo pierde en silencio todo lo que
se añada después, y el sitio donde se pierde no es el sitio donde se nota»*. Estaba escrita, era
correcta, y **la causa exacta de este fallo**. ⚠️ Escribir la ley no es aplicarla.

**Cómo se cazó:** ojo humano otra vez, mirando la salida de prueba. Ningún `A.exige` lo cazaba,
porque los que había miraban el número y la distancia, no la marca.

**Causa raíz:** la misma línea de `direccion.js` que en el nº134. Y peor: ayer decidí **a propósito**
no cambiarla a un `{...s}`, con el argumento de que un `spread` metería ahí dentro lo que hubiera en
cada momento. ⇒ **defendí el mapeo explícito el mismo día que me costó un campo, y al día siguiente
me costó otro.** El argumento era falso: la sugerencia la construye entera `paridad.js` y no tiene
ningún campo que haya que esconder — `portal` se expone a propósito.

**Arreglo aplicado:** `sugerencias: d.sugerencias.map((s) => ({ ...s }))`, con la marcha atrás
escrita en el propio fichero. ⭐ Y lo que hacía falta de verdad: **la comprobación que faltaba**, que
ahora barre el callejero entero y exige tres cosas —que toda sugerencia de la otra paridad lleve la
marca, que ninguna pase de 150 m, y que ninguna propia vaya detrás de una de enfrente— más un
positivo de control para que los tres ceros no pasen por vacío.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una ley escrita en la bitácora no protege de nada: lo que protege es
el mecanismo** (ley 37, y van unas cuantas). El nº134 terminó con una ley y sin guardián, y a las
veinticuatro horas el mismo sitio volvió a fallar del mismo modo.
⚠️ Y la segunda: **cuando uno defiende por escrito la decisión que acaba de costarle un fallo,
conviene releer el argumento.** El mío decía «para no exponer el portal crudo», y el portal crudo ya
se exponía en la línea de al lado.

**Traza:** `src/direccion.js` (`resolver`, `sugerencias`), `src/medir-paridad.js` (§A3+B)

---

## [2026-08-06] — El 66,2 % del universo «pedible» de tres tandas era un centinela

**Categoría:** datos
**Síntoma:** al medir a qué distancia queda el portal de enfrente que se ofrece, el reparto salió
así:

```
   distancia al portal de enfrente ofrecido    n=35767   med 126   p75 126   p90 126   máx 150
```

**Mediana, p75 y p90 idénticos.** Un reparto de 35.767 valores no se comporta así.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **DOS cuadres entre tandas, los dos
perfectos.** El primero: este barrido reproduce el universo de la tanda 32 —150.947 · 27.815 ·
123.132 · 66.973— con menos del 0,1 % de diferencia. El segundo: el dial que publicó la tanda 33
predijo **31.411** consultas contestadas con el listón a 100 m, y salen **31.411 clavadas**.
⚠️⚠️ Los dos cuadres son ciertos y los dos están calculados **sobre el mismo artefacto**. ⇒ **dos
medidas de acuerdo no son dos medidas correctas**: si las dos comparten el defecto, concuerdan por
él.

**Cómo se cazó:** ⭐ por lo redondo del número, que es la costura que el propio encargo pone —*«y si
sale redondo, ésa es la señal»*—. Al abrir el reparto por vías, **una sola aportaba 25.012 de las
35.767 sugerencias (70 %)**: `GRUPO M. ANDREA CASAMAYOR Y DE LA COMA`. Es la forma exacta del nº129,
donde las doce peores filas eran la misma carretera doce veces.

**Causa raíz:** 117 portales del callejero traen `sortNumber = 99999`. Su número crudo es `"BL0"`,
`"BL1"`, `"BL2"`… — **son bloques sin número de portal**, y 99999 es el centinela con el que el
callejero dice «no tiene». El universo «lo que se puede pedir» se construye del número mínimo al
máximo de cada vía, así que en esa vía **iba de 1 a 99999**: 99.998 consultas inventadas, el
**66,2 %** de las 151.026 que las tandas 32, 33 y 34 han usado de denominador.
⇒ Ningún CASO medido era falso —los huecos reales siguen siendo reales— pero **todo porcentaje cuyo
denominador fuera «lo pedible» estaba inflado**, y el reparto de distancias de esta tanda era, en un
70 %, una sola vía.

**Arreglo aplicado:** se mide **en los dos universos a la vez** y se publican los dos: el de las
tandas 32 y 33 —centinela dentro, para que el cuadre entre informes siga valiendo y se vea de dónde
venía— y el LIMPIO. El limpio son **51.028 pedibles, 23.171 huecos y 16.969 que cambian de acera**.
⛔ El centinela **NO se quita del buscador**: qué hacer con 117 portales que no tienen número es una
decisión de Antonio, no un arreglo mío. Queda con su tamaño en el informe.
⚠️ Y la corrección va en documento NUEVO (`docs/H1-LISTONES.md`), no reescribiendo los anteriores.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **antes de usar el máximo de un campo como límite de un rango, hay que
mirar si ese campo tiene centinelas.** Un 99999, un −1 o un 0 no fallan: se comportan como un valor,
y el rango que abren se llena de casos que no existen.
⚠️ Y la grande: **la reproducibilidad entre tandas no es corrección.** Un cuadre perfecto entre dos
informes solo demuestra que los dos hacen lo mismo — incluido el error. Aquí hicieron falta dos
cuadres verdes y una mediana sospechosamente redonda para verlo.

**Traza:** `src/medir-paridad.js` (`CENTINELA`, los universos `G` y `GL`), `src/medir-listones.js`

---

## [2026-08-06] — La sugerencia de enfrente llegaba marcada y el sitio donde se lee no la marcaba

**Categoría:** visual
**Síntoma:** el encargo pide, con estrella, que *«la sugerencia de enfrente TIENE QUE DECIR QUE LO
ES»* — cruzar cuesta un semáforo y un rodeo hasta el paso—. En el banco de las siete rutas salía así:

```
   ⭐ sugerencia nº36 · acera de los pares
   ⭐ sugerencia nº17 · acera de los impares · el hueco mide 94 m
   ⭐ sugerencia nº15 · acera de los impares · el hueco mide 114 m
```

**Las cinco iguales.** Y las dos últimas son de la acera de enfrente. Peor: llama *«el hueco mide»*
a los 94 m, que no son un hueco — **son la distancia hasta el portal de la otra acera**, otra
magnitud con otro significado.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la comprobación nueva de
`medir-paridad.js`, que barre el callejero entero y exige que toda sugerencia de la otra paridad
lleve la marca `enfrente`.** Salía 0 sin marca sobre 76.880 sugerencias, y era cierto: **el dato
llevaba la marca**. Lo que no la usaba era quien la imprime.

**Cómo se cazó:** ejecutando `rutas-antonio.js` y leyendo la ruta 1, que es la que tiene los dos
extremos en sugerencia. ⭐ Es la ley del nº135 aplicada a tiempo: *ejecuta a los consumidores, no los
busques con `grep`*.

**Causa raíz:** añadí el campo a `paridad.js`, lo comprobé en el barrido y lo enseñé en
`medir-listones.js` — y **no toqué el único sitio que lo pinta para un humano**. El barrido comprueba
el DATO; el requisito de Antonio es sobre el TEXTO. Son dos cosas, y una comprobación verde sobre la
primera no dice nada de la segunda.

**Arreglo aplicado:** la línea distingue `⛔ ENFRENTE` de `⭐ su acera`, y en la de enfrente dice la
distancia con sus dos componentes —cuánto es calle y cuánto es calle abajo— en vez de llamarlo hueco.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un requisito sobre lo que lee una persona no se comprueba mirando el
dato.** «El campo está» y «se ve» son dos afirmaciones distintas, y el barrido más completo del mundo
sobre la primera deja la segunda sin tocar.
⚠️ Y la de siempre, que hoy sí funcionó: **ejecutar al consumidor.** No hizo falta nada más.

**Traza:** `src/rutas-antonio.js` (la impresión de sugerencias)

---

## [2026-08-06] — El detector de centinelas miraba una población distinta de la que vigila

**Categoría:** aviso falso
**Síntoma:** para que el 99999 no se repita con otro valor escribí un detector: *«las cinco vías con
el rango más grande, y rojo si alguna pasa de 30 números pedibles por portal»*. Saltó a la primera:

```
   ⚠️ vías con más de 30 números pedibles por portal   3
      ⇒ DISEMINADO PEÑAFLOR · CARRETERA AUTOVÍA DE MADRID · CARRETERA CASTELLÓN
   ⛔ FALLO · 3 vías tienen más de 30 números pedibles por portal
```

**Y dos de las tres no entran en el universo que el detector vigila.** El universo cuenta solo las
vías con DOS HILOS (≥5 portales de cada paridad); las dos carreteras no llegan, así que no aportan ni
una consulta al número que se está protegiendo.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el rojo, que era cierto.** Las tres
vías tienen de verdad esos ratios. ⚠️ Un guardián que dice una verdad sobre algo que no vigila no es
un guardián: es ruido con razón — y es el mismo animal que el nº131, donde registré un fichero en una
lista sin mirar qué exigía esa lista.

**Cómo se cazó:** abriendo la lista en vez de creerme el recuento. `CARRETERA CASTELLÓN` no pintaba
nada en una tabla de vías con dos aceras.

**Causa raíz:** el detector barría `indice.values()` entero y el universo barre `indice.values()`
**filtrado por dos hilos**. Escribí el bucle nuevo mirando el dato, no mirando el bucle de al lado que
define lo que hay que proteger.

**Arreglo aplicado:** el detector barre exactamente la misma población que el universo. Con eso queda
**una** vía —`DISEMINADO PEÑAFLOR`, 63,8 números por portal, 702 pedibles, el 1,4 %—, y **no es un
centinela: es numeración rural dispersa de verdad**. ⇒ se separa en dos comprobaciones:
· por VALOR: ningún número del universo puede llegar al centinela declarado;
· por FORMA: ninguna vía puede pasar de **500** números por portal — con los dos anclajes escritos,
  el peor caso real (63,8) y el artefacto que hubo que cazar (99.999/47 ≈ **2.128**).
Y la numeración dispersa real se declara con su peso, que es lo que faltó con el centinela.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un guardián tiene que barrer exactamente la población que protege.**
Si mira más, señala cosas que no importan y se aprende a ignorarlo; si mira menos, calla donde hace
falta. Y las dos cosas se ven comparando el bucle del guardián con el bucle del número, no leyendo el
resultado.

**Traza:** `src/medir-paridad.js` (el detector de centinelas)

---

## [2026-08-06] — El dial no podía explorar más allá del tope que acababa de aplicar

**Categoría:** silencio falso
**Síntoma:** el dial que enseña qué pasaría con otros listones salió así, con el tope de 20 m ya
puesto:

```
   tope de «calle abajo»    sugerencias    ancho  desfase  % desfase
   ≤ 10 m                          1603     1498      105      6.6 %
   ≤ 20 m                          2986     2142      844     28.3 %
   ≤ 40 m                          2986     2142      844     28.3 %
   sin tope (hoy)                  2986     2142      844     28.3 %
```

**Tres filas idénticas.** «≤40 m» y «sin tope» dan exactamente lo mismo que «≤20 m».

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la fila que importaba era correcta.**
El ≤20 m aplicado da 2.986 · 28,3 %, y eso cuadra con todo lo demás del informe. La tabla era
consistente consigo misma y con la regla; lo único que no hacía era **explorar**.

**Cómo se cazó:** ⭐ por las filas que no esperaba. Tres iguales seguidas no es un resultado: es un
tope invisible. Es la costura del encargo —*«si sale redondo, ésa es la señal»*— aplicada a una tabla
en vez de a una mediana.

**Causa raíz:** el dial FILTRABA la salida de `Par.decidir()`, y `decidir()` **ya trae el tope
aplicado**. Filtrar por «≤40 m» un conjunto que ya está podado a 20 no puede devolver nada nuevo. ⇒
**un dial que se construye filtrando el resultado solo puede mirar hacia dentro del listón vigente,
nunca hacia fuera.**

**Arreglo aplicado:** se guarda el PUNTO DE PARTIDA de cada consulta —la vía, el número y el portal de
referencia— y el dial vuelve a llamar a `Par.deEnfrente()` **con los listones que se le piden**. Ahora
«sin tope» da 10.777 y el dial explora de verdad.
⭐ Y con ello se puede añadir la comprobación que faltaba: que el recálculo con los listones de HOY
reproduzca exactamente lo que devuelve el buscador (2.986 = 2.986). Si no lo hiciera, el dial estaría
midiendo otra regla que la aplicada.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un dial que filtra el resultado solo mira hacia dentro.** Para
enseñar qué pasaría con otro listón hay que volver a calcular con ese listón, y eso obliga a guardar
la entrada, no la salida. ⚠️ Y el síntoma es siempre el mismo: **filas repetidas al final de la
tabla** — justo donde uno deja de leer.

**Traza:** `src/medir-listones.js` (§B3, `conListones`)

---

## [2026-08-06] — Escribí «2.982 de los 3.340 buenos» y el encargo de hoy me lo repitió como decisión

**Categoría:** datos
**Síntoma:** el informe de la tanda 34 recomendó el tope de 20 m con esta frase: *«el desfase cae del
68,9 % al 28,3 % conservando 2.982 de los 3.340 buenos»*. El encargo de la tanda 35 la recoge tal
cual, y de ahí sale la previsión de **358 perdidas**.

**Está mal.** Los 2.982 eran el TOTAL de sugerencias que quedaban a ≤20 m —ancho **y** desfase—, no
las buenas. En la misma tabla, una columna a la derecha, ponía que las «ancho» eran **2.138**.

```
   tope de «calle abajo»   sugerencias    ancho  desfase
   ≤ 20 m                         2982     2138      844      ← 2.982 no son los buenos
```

Medido hoy: se pierden **1.206 «ancho»** de 3.348, no 358. Y de las que caben en el ancho real de su
propia calle, **719**.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la tabla, que era correcta.** Los
2.982, los 2.138 y los 844 estaban bien calculados y bien impresos. El fallo no está en el dato: está
en **la frase que lo resume**, escrita a mano dos párrafos más abajo leyendo la columna equivocada.
⚠️ Y no hay ningún mecanismo en este proyecto que compare la prosa de un informe con su propia tabla.

**Cómo se cazó:** al medir lo que se pierde de verdad tras aplicar el tope. Salió 1.206 donde la
previsión decía 358, y la costura del encargo —*«si se pierden muchas más de las previstas, dilo»*—
obligaba a mirar por qué. La diferencia no era del cálculo: era mía.

**Causa raíz:** resumir a mano una tabla de cinco columnas cogiendo el número de la fila correcta y la
columna equivocada. ⇒ **el número que llega a la decisión no es el que está en la tabla: es el que
alguien escribe debajo.**

**Arreglo aplicado:** ⛔ El informe de la tanda 34 **no se reescribe** —es registro histórico—: la
corrección va en `docs/H1-TOPE-ADELANTO.md` §A3, diciendo qué corrige y por qué. Y el medidor imprime
ahora la comparación *sin tope / con tope / se pierden* **en columnas, calculada**, para que la frase
de resumen no tenga que existir.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **la cifra que entra en una decisión es la del texto, no la de la
tabla.** Una tabla correcta con un resumen mal leído decide igual de mal que un cálculo roto, y no
hay guardián que lo cace: lo único que lo evita es **que el informe imprima la resta hecha** en vez de
dejar que alguien la haga al escribir.
⚠️ Y la segunda: cuando el encargo siguiente te devuelve tu propio número, **compruébalo antes de
construir encima**. Éste llegó de vuelta convertido en la base de una decisión.

**Traza:** `docs/H1-LISTONES.md` §B3 (la frase), `src/medir-listones.js` (§A3, la resta impresa)

---

## [2026-08-06] — Un refactor por script se comió una sección entera del medidor

**Categoría:** rompe
**Síntoma:** para que `numeros-congelados.js` midiera con la misma función que `medir-paridad.js` —y
no con una segunda copia— extraje el barrido a una función de módulo con un script de sustitución por
índices de texto. El resultado:

```
    // una casilla del índice puede llevar DOS vías distintas
   const { G, sinNumeroEnIndice, viasSinNumeros } = barrer(indice, tipoDe);
  {

    A.exige(conEnf > 0, 'CERO sugerencias de enfrente en todo el callejero…');
```

**Entre esas dos líneas faltaban unas sesenta**: el recuento de casillas mezcladas, la sección
`A3 + B` entera —los ocho casos de ejemplo— y el barrido que comprueba la marca, el radio y el orden
de las sugerencias.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⚠️ **NO CONSTA — nada llegó a estar en
verde.** `node -c` cantó a la primera con `Identifier 'G' has already been declared`. ⛔ Y eso es
suerte, no diseño: la sustitución dejó el fichero sintácticamente roto **por accidente**. Si el trozo
comido hubiera empezado y acabado en fronteras de bloque, el fichero habría compilado, el script
habría salido en verde y **la sección habría desaparecido en silencio**.

**Cómo se cazó:** el compilador, y luego `git show HEAD:fichero` para recuperar el trozo textual.

**Causa raíz:** hice DOS sustituciones por índices sobre el mismo fichero, y la primera movió todas
las posiciones. La segunda cortó desde una marca que ya no estaba donde yo creía. ⇒ **una edición por
posición de texto es correcta exactamente una vez**; a la segunda ya está operando sobre otro
fichero.

**Arreglo aplicado:** el trozo se recuperó de `git show HEAD:` —no de memoria— y se volvió a insertar
comprobando que las cinco secciones del fichero siguen ahí (`A1`, `A2`, `A3 + B`, `C1–C3`, `D`) y que
el balance de llaves cierra en 0.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un fichero que se edita por script se comprueba por CONTENIDO, no por
que compile.** Compilar solo dice que las llaves cuadran; que no falte una sección hay que
preguntárselo. ⚠️ Y la operativa: **una sustitución por índices por ejecución**, o los índices
mienten. Si hacen falta dos, se hace dos veces releyendo el fichero.

**Traza:** `src/medir-paridad.js` (`barrer`)

---

## [2026-08-06] — La procedencia del listón escrita en el código nunca fue la publicada

**Categoría:** datos
**Síntoma:** al devolver `RAZONABLE_M` a 50 m volví a leer el comentario que justifica de dónde sale
ese número, en `src/paridad.js`, para copiarlo al informe:

```
 *   ACERA en vías urbanas — 30.239 pares medidos: mediana 14 m, p75 23 m,
 *   **p90 48 m**, p95 82 m. Se redondea a 50.
```

Y el medidor, hoy, dice otra cosa: **30.283 pares · 14 · 24 · 52 · 91**. Fui a `docs/H1-PARIDAD.md`
§A2 a ver cuál de los dos había envejecido, y **el informe publicaba 30.283 · 14 · 24 · 52 · 91 desde
el primer día**. ⇒ no ha envejecido nada: **el comentario nunca coincidió con lo que se publicó.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **absolutamente todo, tres tandas
seguidas.** La batería de 57 scripts, los 26 números congelados, y —lo que más duele— **el guardián
que vigila precisamente este listón**: exige que `RAZONABLE_M` caiga dentro del reparto, y lo compara
con el reparto **MEDIDO**, no con el escrito. Los 50 m caen dentro de los dos repartos, así que la
comprobación estaba en verde y seguía siendo cierta. ⚠️ Y el número tampoco estaba en la tabla de
congelados: **no había ni un sitio en el proyecto donde ese p90 se comparase con nada.**

**Cómo se cazó:** ojo humano, al copiar el dato a mano de un fichero a otro. ⛔ Es el peor camino
posible para cazar algo, porque depende de que alguien vuelva a mirar ese comentario — y en tres
tandas nadie lo hizo, ni siquiera cuando la tanda 34 reescribió el bloque de al lado.

**Causa raíz:** ⚠️ **NO CONSTA de dónde salieron esos cuatro números, y eso es lo peor del caso.**
Los dos —el comentario y la tabla del informe— entraron en el MISMO commit (`42b6501`), con el mismo
código de medida que sigue hoy; el bucle que mide la separación no ha cambiado ni una línea. Probé
las tres variantes que podrían explicar una población de 30.239:

```
   hoy (como está)                                  n 30283 · p75 24 · p90 52 · p95 91
   sin el filtro de portales repetidos              n 36196 · p75 23 · p90 51 · p95 93
   con el centinela 99999 dentro                    n 30283 · p75 24 · p90 52 · p95 91
   sin filtro y con centinela                       n 36196 · p75 23 · p90 51 · p95 93
```

**Ninguna da 30.239 · 23 · 48 · 82.** ⇒ esos números **no los produce ninguna versión del código que
esté en el repositorio**: salieron de un borrador que nunca se commiteó y se quedaron escritos en
prosa. Lo que sí se puede afirmar: **un número copiado a un comentario no está publicado, está
escondido.** El informe de `docs/` tenía el dato bueno, pero quien abre el código para entender por
qué el listón vale 50 **lee el comentario**, no el informe.

**Arreglo aplicado:**
· se corrige el comentario y se deja escrito en él que estaba mal y desde cuándo;
· ⭐⭐ y —que es lo único que sirve— **el reparto entero pasa a estar exigido**: `medir-paridad.js`
  §A2 compara `n · p75 · p90 · p95` contra lo que publicó la tanda 33 y se pone rojo si se mueve
  cualquiera de los cuatro. ⛔ El guardián viejo no podía cazarlo: comparaba el listón con el reparto,
  y si el reparto se movía entero el listón seguía cayendo dentro — *la comprobación distingue los
  extremos y no el medio* (ley 61), otra vez.
· ⛔ `docs/H1-PARIDAD.md` **no se toca**: su tabla era la correcta.
· Y su rojo se ha provocado antes de dejarlo puesto (regla 3 de CLAUDE.md).

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un número que solo vive en un comentario no tiene guardián posible,
y por eso no envejece: se pudre.** Es el nº142 —*la cifra que entra en una decisión es la del texto,
no la de la tabla*— con el texto dentro del código, y el arreglo es el mismo los dos días: no
corregir la frase, sino **obligar al número a pasar por una comparación**. ⚠️ Y el corolario
operativo: cuando un comentario cita una medida, o la mide el propio fichero, o la exige alguien, o
no se escribe.

**Traza:** `src/paridad.js` (`RAZONABLE_M`), `src/medir-paridad.js` (§A2, el reparto exigido)

---

## [2026-08-07] — El censo de la auditoría llamó «afirmación» a la mitad de los números del proyecto

**Categoría:** aviso falso
**Síntoma:** el primer instrumento del bloque B clasificaba cada número de `docs/` para saber cuántas
afirmaciones hay que contrastar. Salió esto:

```
   tokens numéricos encontrados 19906
   AFIRMACION            10192   51.2 %
   SUELTO                 6073   30.5 %
```

**10.192 afirmaciones numéricas** en 44 documentos. Es el denominador con el que iba a declarar la
cobertura del bloque entero.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **las otras siete clases.**
`CITA-AJENA`, `REFERENCIA`, `FECHA-SELLO`, `COORDENADA-ID`, `SUELO-DECLARADO` e `ILUSTRACION`
estaban bien clasificadas y sumaban lo que tenían que sumar. El clasificador funcionaba en todo
menos en la clase que importaba — porque `AFIRMACION` **no era una clase: era el residuo**, lo que
quedaba cuando ninguna otra casaba.

**Cómo se cazó:** ⭐ una muestra sistemática de 32 filas, una de cada 340. Casi todas eran celdas de
tablas de resultado (`| 18 | CAMINO PEÑAFLOR A VILLAMAYOR | 2,33 km | 3 | 5 |`), y varias eran
basura pura: un `05` de una fecha, un `4` de un índice de tabla, un `5` de «2-5 m».

**Causa raíz:** definir la clase que importa **por descarte**. Las seis primeras clases se
comprobaban con un criterio positivo; la séptima se llevaba todo lo demás. ⇒ **una clase-residuo
crece con lo que el clasificador no entiende, y su tamaño mide la ignorancia del instrumento, no
el fenómeno.**

**Arreglo aplicado:** el censo v2 no pregunta «¿es una afirmación?», pregunta **«¿lo marca el
documento como afirmación?»** — negrita, cita `>` o línea de conclusión `⇒`. Es una definición
estrecha, se declara como tal en el informe, y da **2.062**. ⛔ El 10.192 no se publica como
cobertura: se publica como el error que fue.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **una clase definida por descarte no es una medida: es el resto de una
división.** Si el número que va a ser el denominador de una cobertura sale de «lo que no encajó en
ninguna otra parte», ese número mide al clasificador. ⚠️ Y el síntoma es barato: **la clase-residuo
era la más grande de las ocho.**

**Traza:** instrumento desechable `b1-censo.js` → `b1-titulares.js` (fuera de `src/`)

---

## [2026-08-07] — Cinco hallazgos falsos porque `toLocaleString` no agrupa los números de cuatro cifras

**Categoría:** aviso falso
**Síntoma:** el cruce entre los 26 números congelados y los documentos que los publican dio **seis
filas donde «el documento NO contiene el valor congelado»**:

```
   ⛔ SIN localizar en ninguno de sus documentos   6
      grafo.km  mapa.verdes  verde.sinListon  verde.municipalNombrados
      verde.municipalPolis  buscador.contestadas
```

Seis números publicados que sus propios informes no dirían. Iba a ser el hallazgo gordo del bloque.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las otras veinte filas.** El
instrumento localizaba correctamente `68.649`, `98.774`, `378.222`, `51.493`, `56.801`… — todos de
**cinco y seis cifras**. Y el control de lectura del fichero estaba puesto y en verde. Un
instrumento que acierta veinte de veintiséis parece un instrumento que funciona.

**Cómo se cazó:** abriendo los seis. `H1-LISTON-50.md` dice **«4.562»** en su tercera tabla, a la
vista. ⇒ el que no lo encontraba era yo.

**Causa raíz:** `(4562).toLocaleString('es-ES')` devuelve **`'4562'`**, sin punto: Intl **no agrupa
los números de cuatro cifras**. La prosa del proyecto sí los agrupa. ⇒ el instrumento buscaba una
forma que ningún documento escribe. Cinco de los seis eran exactamente eso —4.562, 3.803, 4.424,
1.235 y 6.499,98—; el sexto (`verde.municipalNombrados = 0`) lo tiraba otro filtro mío, el que salta
las formas de un solo carácter.

**Arreglo aplicado:** la agrupación se hace a mano (`replace(/\B(?=(\d{3})+(?!\d))/g, '.')`) además
de con `Intl`, y se buscan **todas** las formas. Con eso: **26 de 26 localizados**. ⛔ Y el `0` del
municipal sigue sin poder buscarse por ser de un carácter: **va declarado como límite del
instrumento en el informe**, no como hallazgo.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un formateador de la plataforma no es el formateador del proyecto.**
`toLocaleString` implementa una convención tipográfica —«no agrupes cuatro cifras»— que la prosa de
este repositorio no sigue. ⚠️ Y la forma general: **cuando se busca un dato «como se escribe», hay
que buscarlo como lo escribe QUIEN LO ESCRIBIÓ**, no como lo escribiría la librería.

**Traza:** instrumento desechable `b2-cruce.js` / `b2b4.js` (fuera de `src/`)

---

## [2026-08-07] — La contraprueba iba a firmar un «26 de 26» con el rojo del método nunca visto

**Categoría:** silencio falso
**Síntoma:** con el cruce ya arreglado, el bloque B tenía su resultado: **26 de 26 números
congelados aparecen en su documento vigente y el motor reproduce los 26**. Un pleno. La costura del
encargo dice que un resultado redondo es la señal, así que antes de publicarlo se corrió la
contraprueba — romper una afirmación cierta en una copia y exigir que el método la cace:

```
   ⭐⭐ ROJO · se rompe UNA A UNA cada afirmación cierta
      dato.sello         H1-CIERRE.md          ⛔ NO la caza
      grafo.nodos        H1-GRAFO-CIUDAD.md    ⛔ NO la caza
      grafo.aristas      H1-GRAFO-CIUDAD.md    ⛔ NO la caza
      grafo.componentes  H1-CIERRE.md          ⛔ NO la caza
      grafo.aristasAPie  H1-CIERRE.md          ✅ cazada
      grafo.vertices     H1-GRAFO-CIUDAD.md    ⛔ NO la caza
   ⇒ rojos vistos 1 de 6
```

**Uno de seis.** El método con el que iba a publicar un pleno no cazaba cinco roturas de seis.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la columna VERDE de la propia
contraprueba, y el resultado entero del apartado.** «26 de 26 localizados · 0 marcados · ✅ no grita
con todo» — impecable. **El instrumento acertaba en todo lo que se le pedía acertar y fallaba en lo
único que se le pedía fallar.** Es la séptima forma de mentir: *la comprobación distingue los
extremos y no el medio.*

**Cómo se cazó:** porque la contraprueba estaba escrita **antes** de mirar el resultado bonito, y
porque el encargo la exigía con las dos columnas. Sin la columna del rojo, «26 de 26» se habría
publicado tal cual.

**Causa raíz:** la rotura sustituía **la primera aparición** del número. En estos informes **el
mismo dato sale varias veces** —en la tabla, en el resumen y en la cita—, así que `buscar()` lo
encontraba más abajo y el método parecía ciego cuando lo ciego era la rotura. ⇒ **una mutación que
no destruye TODAS las instancias de lo que quiere destruir no prueba nada**, y su resultado se lee
al revés: parece que el detector falla cuando el que falla es el mutador.

**Arreglo aplicado:** se rompen todas las formas y todas las apariciones (`replace` global sobre
cada forma). Con eso: **6 rojos de 6, 0 contagios**, y el «26 de 26» pasa a poder publicarse. ⭐ Se
publica **con la contraprueba al lado**, no solo.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una contraprueba que falla puede estar acusando al detector cuando
la culpable es la rotura.** Antes de concluir «mi método no caza», hay que comprobar que la rotura
ocurrió **del todo** — es el nº117 (*cinco de diez mutaciones no llegaron a ocurrir*) con una vuelta
de tuerca: aquí la mutación ocurrió, pero **incompleta**, que es peor porque deja marca de haber
ocurrido.
⚠️ Y la segunda, para este proyecto: **cuando un resultado sale redondo, lo que hay que auditar
primero no es el dato: es el instrumento que lo produjo.**

**Traza:** instrumento desechable `b2b4.js --rojo` (fuera de `src/`)

---

## [2026-08-07] — La cosecha de productores se tragó los números que las contrapruebas rompen a propósito

**Categoría:** dato envenenado
**Síntoma:** para saber qué números **produce hoy** el repositorio se ejecutaron los 66 scripts de
`src/` y se guardó su salida. `numeros-congelados.js` imprime esto en su parte B:

```
   ⛔ mapa.azules: se publicó 51.493 y ahora sale 56.801  (+5308)
   ⛔ mapa.grises: se publicó 11.168 y ahora sale 0       (-11.168)
   ⛔ mapa.rojas:  se publicó 32.310 y ahora sale 38.145  (+5835)
   …
   ⇒ ✅ LA CONTRAPRUEBA: sin fallos. (código de salida 0)
```

Son valores **rotos a propósito** por la mutación. Y estaban entrando en el diccionario con el que
se decide si una cifra publicada tiene productor.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **el productor más fiable del
proyecto, diciendo que estaba sano.** Tres líneas más abajo de los números envenenados,
`numeros-congelados.js` firma *«NÚMEROS CONGELADOS: sin fallos»*, *«roturas CAZADAS 2 de 2 ✅»* y
**código de salida 0**. Y los contadores de la cosecha —66 ejecutados, 47 con salida, repositorio
sin tocar— también en verde. **Nada de lo que había que mirar estaba en rojo.**

**Cómo se cazó:** leyendo la salida de `numeros-congelados.js` **antes** de usarla, porque era el
productor del que dependía el control de semilla del mapa.

**Causa raíz:** en este proyecto **la mitad de los instrumentos terminan rompiendo algo a propósito
y publicando el número roto** — es la ley 62 hecha código. Un cosechador que lee «lo que imprime un
instrumento» y no distingue *lo que mide* de *lo que rompe para enseñar el rojo* recoge las dos
cosas. ⇒ **La salida de un instrumento con contraprueba no es un dato: es un dato y su negación,
mezclados en el mismo flujo.**

**Arreglo aplicado:** filtro por línea sobre las que anuncian una rotura (`se publicó … y ahora
sale`, `al plantarla`, `2 km al este`, `mutado`, `desplazado`). Daño real medido: **1 afirmación**.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **la salida de un instrumento honesto contiene, por diseño, números
que son falsos.** Cuanto mejor es la contraprueba, más basura publica el script — y el código 0 no
distingue. ⚠️ En un proyecto que exige el rojo visto, **cosechar salidas es cosechar rojos
provocados**.

**Traza:** instrumento desechable `b2-cosecha.js` → `b2-mapa.js` (fuera de `src/`)

---

## [2026-08-07] — El arreglo del veneno hizo cien veces más daño que el veneno, y el daño iba a publicarse como hallazgo

**Categoría:** hallazgo falso
**Síntoma:** con el corte puesto, el daño del envenenamiento anterior salió medido así:

```
   R con el diccionario envenenado   452
   R con el diccionario cortado      344
   ⇒ desaparecen                     108      ← el 24 % de la clase
```

**108 afirmaciones que solo tenían productor gracias a una rotura deliberada.** Iba al informe con
ese número y con esa frase.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el corte hizo exactamente lo que
se le pidió y lo dijo:** *«salidas cortadas por anunciar una rotura: 20 · líneas tiradas 2.449»*, con
la lista de las veinte. **El instrumento declaraba su propio efecto y el efecto parecía razonable.**
Y la dirección era la conservadora —el corte solo puede encoger `R`—, que es justo el argumento con
el que uno se autoriza a no mirar.

**Cómo se cazó:** ⭐ **por la muestra de las 108**, no por el número. Al leerlas aparecieron `3.644
tramos`, `6.500 km`, `493 polígonos`, `21,3 %` — cifras que no tienen nada que ver con una rotura.
Y al mirar dónde cortaba: `src/donde-falta.js:1`, `src/modelo-rutas.js:1`, `src/asignar-bici.js:1`.

**Causa raíz:** el corte era «desde que la salida anuncia una contraprueba **hasta el final**», y en
**este** proyecto **la contraprueba va DELANTE**: `donde-falta.js` titula la suya *«A0 · ⛔⛔ LA
CONTRAPRUEBA QUE VA ANTES QUE NINGÚN NÚMERO»*. El corte empezaba en la línea 1 y **se llevaba la
salida entera de tres productores**. Rehecho por línea, el veneno cuesta **1 afirmación**; las otras
**107 las produjo el parche**.

**Arreglo aplicado:** filtro por línea en vez de corte por sección.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **la medida del daño de un fallo se toma con el arreglo puesto, y el
arreglo es un instrumento nuevo que nadie ha verificado.** Un «esto costaba 108» calculado con un
parche recién escrito **mide el parche**. ⚠️ Y la forma concreta: **importar la convención de otro
sitio** —«las contrapruebas van al final»— cuando este repositorio hace lo contrario **y lo dice en
el título**.

**Traza:** instrumento desechable `b2-mapa.js` / `b2-veneno.js` (fuera de `src/`)

---

## [2026-08-07] — «Cita de fuente ajena» acertaba 5 de 14: en este proyecto OSM es el objeto de la medida, no la fuente

**Categoría:** aviso falso
**Síntoma:** el mapa clasificaba **86 cifras** como PROSA con el criterio *«la línea menciona una
fuente ajena cerca del número»* (OSM, WFS, Overpass, IDEZar, Ayuntamiento). Era la clase P más
grande con diferencia.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el orden de las clases estaba bien
puesto y demostrado.** `R` se evalúa **antes** que `P`, así que ninguna cifra con productor podía
caer en P — y eso se comprobó y era cierto. La defensa estaba construida contra el error que **no**
ocurrió.

**Cómo se cazó:** ⭐ muestra sistemática de 14 filas, una de cada 6. Nueve estaban mal: *«`univoca`
coincide con OSM el **34,4 %**»*, *«**6,27 km** SOLO EN OSM»*, *«de las **313 líneas** de andar con
carril bici municipal encima»*. **Todas son medidas NUESTRAS sobre datos de OSM.**

**Causa raíz:** el criterio medía **el vocabulario de la frase**, no la naturaleza del número. En un
proyecto cuyo grafo *es* OSM, mencionar OSM no dice nada de quién produjo la cifra. ⇒ Es el censo v1
otra vez, en pequeño: una clase que crece con lo que el clasificador no entiende.

**Arreglo aplicado:** el criterio **se retira entero**. Las 86 vuelven a `?`, que es lo honesto: no
sé si tienen productor. ⛔ No se sustituye por otro más fino — no supe escribirlo.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un criterio que mira las palabras de alrededor mide el estilo de
quien escribe, no la cosa que quiere clasificar.** ⚠️ Y el síntoma barato, otra vez: **era la clase
más grande de las que llevaban criterio.**

**Traza:** instrumento desechable `b2-mapa.js` (fuera de `src/`)

---

## [2026-08-07] — La clase FOTO suspendió tres muestras seguidas y se declaró fallida, no arreglada

**Categoría:** aviso falso
**Síntoma:** el mapa tenía que separar las afirmaciones cuyo dato **ya no existe** (mediciones de
una tanda intermedia) de las demás. Tres versiones, tres muestras sistemáticas, tres suspensos:

```
   v1 · la marca en cualquier parte de la línea      3 mal de 12
   v2 · la marca pegada al número (±44 caracteres)   7 mal de 12
   v3 · solo marcas explícitas (caducado, pasó de)   9 mal de 10
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **el tamaño de la clase parecía
sensato en las tres versiones** —103, 68 y 10 sobre 2.062—, y bajaba al apretar el criterio, que es
lo que uno espera ver cuando va por buen camino. **La curva era la correcta y el contenido no.**

**Cómo se cazó:** leyendo las diez de la v3 una a una. *«paso de peatones»* casa con «pasó de».
*«Caduca 05/10/2026»* mete el `05` y el `10` como afirmaciones caducadas. De diez, **una** era una
foto de verdad.

**Causa raíz:** en castellano `antes` es espacial (*«además está mucho antes»*, calle arriba) y
metodológico (*«antes de leer ninguno»*) además de temporal; `era` casa en *«el grafo decía
unido»*, donde el pasado es del grafo y no del número; y `anterior` casa en
*«`H1-PRIMER-GRAFO.md:43`»*, que es una **línea**. ⇒ **la marca temporal de una frase no dice de qué
parte de la frase es.**

**Arreglo aplicado:** ⛔ **ninguno.** La clase se publica con tamaño **1** —el único caso verificado
a mano— y se declara que **no supe construir el criterio**. Todo lo demás que pudiera ser foto está
en `?`.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una clase que no pasa su propia muestra se declara fallida, no se
afina hasta que salga bonita.** Tres intentos y tres suspensos son el resultado; el cuarto intento
solo habría sido el primero que no se muestreó. ⚠️ Y el aviso de método: **`?` con su tamaño dicho
vale más que una clase con nombre y sin sustancia** — porque `?` se puede volver a mirar y una clase
falsa ya está contada.

**Traza:** instrumento desechable `b2-mapa.js` / `b2-valida-mapa.js` (fuera de `src/`)

---

## [2026-08-07] — Publiqué como hallazgo VIVO que un documento mentía, y el documento decía en su tercera línea que era una propuesta

**Categoría:** hallazgo falso
**Síntoma:** el bloque B cerró con este vivo, el primero de los tres, en negrita y con evidencia:

```
   BV1 · DISEÑO-H1-GRAFO.md §P4.1 dice «manda el código, SIEMPRE» y el motor
         engancha por distancia pura ⇒ el documento de diseño no describe lo que
         hace el motor.
```

Y entró en el registro, en el commit y en el informe a Antonio.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **todo lo comprobable de la
afirmación era cierto, y lo comprobé bien.** `engancharUno` **sí** elige por distancia pura
(`portales.js:181`); la función de nombre **sí** sirve solo de testigo del empate; §P4.1 **sí** dice
lo que dice. Fui al código, no lo razoné. ⭐ Y hasta encontré el matiz fino —que la ADENDA dice
*«sin cambios»*, luego P4.1 nunca describió el motor—. **Cada pieza del hallazgo era verdad. La
conclusión era falsa.**

**Cómo se cazó:** el bloque C empezó leyendo los cuatro documentos **desde la línea 1**, que es lo
que el bloque B no hizo. `DISEÑO-H1-GRAFO.md:3`:

> **Estado:** propuesta para aprobar. **Nada de esto está construido.**

Y `DISEÑO-H1-ADENDA.md:7`: *«`DISEÑO-H1-GRAFO.md` (tanda 2) y sus dos anexos son **registro
histórico**»*. ⇒ §P4.1 no es una descripción falsa: es **una propuesta que no se adoptó**, en un
documento que declara que nada de él existe. Y `git log` lo confirma: el diseño es del 2/08, el
primer fichero de `src/` del 3/08.

**Causa raíz:** en el bloque B clasifiqué los cuatro documentos de diseño como **VIVOS**, con
argumento, y el argumento lo construí **sobre su contenido**. ⛔ **No fui al documento a preguntarle
qué era: fui a buscar en él lo que el encargo me señalaba.** La declaración de estado estaba en la
primera página de los dos ficheros implicados y no la leí ninguna de las dos veces.

**Arreglo aplicado:** ninguno en el repositorio —la auditoría no arregla—. `B·V1` baja de VIVO a
NOTA en el registro del bloque C, con las cinco pruebas, y se declara qué queda provisional si
Antonio mantiene la clasificación anterior.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **antes de auditar un documento hay que preguntarle QUÉ ES, y el
documento suele decirlo en la primera página.** Un hallazgo puede tener todas sus piezas
verificadas y ser falso porque **la pregunta no aplicaba al objeto**.
⚠️ Y la segunda, que es la ley 91 cumpliéndose contra su autor: **un rojo falso publicado no lo
caza nadie**, porque a un hallazgo nadie lo audita. Éste lo cazó el bloque siguiente **por
casualidad de que hubiera bloque siguiente**. Si B hubiera sido el último, seguiría en pie.

**Traza:** `docs/auditoriafinal/B-DOCUMENTACION-2026-08-07.md` §BV1 → `C-DECISIONES-2026-08-07.md` §0

---

## [2026-08-07] — El clasificador del diseño exigía verbo conjugado, y un diseño enuncia sus reglas sin conjugar nada

**Categoría:** silencio falso
**Síntoma:** el instrumento que reparte las 1.853 líneas del diseño en DESCRIBE / PROPONE / `?`
llevaba puesto su control de semilla —§P4.1 y §P6.2, los dos hallazgos ya conocidos— y salió esto:

```
   §P4.1 «manda el código»                 DESCRIBE (GRAFO.md:545)
   §P6.2 `data/excepciones-grafo.json`     ⛔ NO LA VE — el clasificador está roto
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **la mitad del control de semilla, y
el reparto entero.** 417 afirmaciones repartidas en tres clases con porcentajes creíbles
—5 % / 13 % / 82 %— y la semilla más citada del encargo, §P4.1, localizada y clasificada. **Un
control que acierta la mitad se lee como un control que funciona**, y el 82 % de `?` daba una
sensación de honestidad que tapaba el agujero.

**Cómo se cazó:** por el propio control, que estaba escrito con **las dos** semillas. Con una sola
—la que salió bien— habría pasado.

**Causa raíz:** el filtro previo exigía un **verbo conjugado** para considerar que una línea afirma
algo. §P6.2 dice *«Fichero versionado en el repositorio —`data/excepciones-grafo.json`—, **leído por
el proceso en cada regeneración**»*: **un sintagma nominal con un participio.** ⇒ **un documento de
diseño enuncia sus reglas sin conjugar nada**, y filtrar por verbo tira justo las líneas más
normativas. Al aceptar el participio: 417 → **573** afirmaciones, un 37 % más.

**Arreglo aplicado:** se acepta también el participio, con el porqué escrito al lado.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un control de semilla con dos casos vale el doble que con uno, y no
por cubrir más: porque uno solo no puede fallar a medias.** ⚠️ Y la de fondo: **el filtro que decide
qué entra en un censo es el sitio donde se pierde lo que nunca se contará** — no deja rastro, no
sale en ninguna clase, y el reparto de abajo sigue sumando 100 %.

**Traza:** instrumento desechable `c1-diseno.js` (fuera de `src/`)

---

## [2026-08-07] — El centinela se apagó sobre una copia, y cuatro tandas midieron el triple de universo

**Categoría:** dato envenenado
**Síntoma:** la tanda 35 apagó el centinela `99999` en `direccion.construirIndice`. Esa función
trabaja **sobre una copia**: `cargarPortales()` seguía devolviendo 117 portales con `n = 99999`.
`acera-equivocada.js` los lee en crudo y hace `o.n % 2` —99999 es impar—, así que publicaba:

```
   números que se pueden pedir      150947        con el centinela dentro
   …que son HUECO                   123132
   ⭐ …los que CAMBIAN DE ACERA       66973        desplazamiento mediano 126 m
```

Limpio: **50.986 · 23.172 · 16.993 · 73 m.** El 66 % del denominador no existía.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la batería entera, en cada
`--todo`, ejecutando este mismo fichero.** Salida `✅ código 0`, y los **13 `A.exige`** del propio
`acera-equivocada.js` también: son estructurales —`conDos > 0`, `dianaCv.size === 2`,
`decidibles > 0`— y **ninguno mira un valor**. ⭐ Y `direccion.js` llevaba escrito *«EL CENTINELA SE
APAGA AQUÍ, y solo aquí»*, que es verdad y por eso engaña: apagarlo en un sitio no es apagarlo.

**Cómo se cazó:** la auditoría del bloque A, ejecutando `cargarPortales()` e interceptándola —no
leyéndola—. El fallo no se ve en el código: **se ve en lo que devuelve.**

**Causa raíz:** ⭐⭐ **la limpieza se aplicó en el CONSUMIDOR y no en el PRODUCTOR.**
`construirIndice` hace `{ ...o, n: null }` — una copia. Todo el que no pase por el índice recibe el
dato sucio. Y los que pasan por él (`medir-paridad`, `medir-listones`, `numeros-congelados`)
estaban limpios, lo cual **hacía el fallo invisible desde el lado más mirado del proyecto**.

**Arreglo aplicado:** `cargarPortales()` marca en origen —`n: null`, `sinNumero: true`,
`numeroCrudo`—, que es **la forma exacta que `direccion.js:36` ya definía**. ⛔ Se MARCA, no se
excluye: dos vías enteras (`URBANIZACIÓN ALAMEDA`, `PARQUE ROMA`) son solo portales así y
excluirlas las borraría del buscador. Y en `acera-equivocada.js` queda el guardián que lo para,
**preguntándole la regla a `P.numeroPedible`** en vez de copiarla (ley 56), con su positivo de
control al lado: 46.150 portales y 117 marcados.

⭐⭐ **Rojo visto antes de arreglar:** `⛔ cargarPortales() devuelve 117 portales con el centinela SIN
apagar (el primero, nº99999)`. Y verde después, con el resto de la batería sin moverse.

⭐⭐⭐ **Y la confirmación que vale más que el arreglo:** el bloque A, el 6 de agosto y con otro
método, **predijo que `informe-portales.js` pasaría de `16,9×` a `21,3× el azar`**. Hoy, con el
centinela apagado, da **21,3×** exacto.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una limpieza aplicada sobre una copia no es una limpieza: es una
segunda versión del dato.** Y el síntoma es traicionero — **el camino más vigilado del proyecto es
justo el que va por la copia limpia**, así que cuanto más se mira, menos se ve.

**Traza:** `src/portales.js` · `src/acera-equivocada.js` · registro `A-CODIGO-2026-08-06.md` §V1

---

## [2026-08-07] — La constante se llamaba `CENTINELA` y valía 9999; el centinela vale 99999

**Categoría:** silencio falso
**Síntoma:** `portales.js` declaraba `const CENTINELA = 9999` y `numeroPedible` filtraba con
`n < CENTINELA`. **El centinela del callejero es `99999`.** 9999 no es el centinela: es el **techo
por debajo del cual un número se considera pedible**. Dos conceptos, un nombre. Y el guardián de
`medir-paridad.js:488` comparaba contra el equivocado, con un mensaje que llegaba a imprimir:

```
   «hay un portal con número X y el centinela declarado es 9999»
```

—una frase sencillamente falsa, impresa por un guardián.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el guardián mismo, en todas las
tandas desde la 35, y con razón: `maxN < 9999` es CIERTO.** El filtro funciona, el universo sale
bien, el número publicado es correcto. **Nada de lo que se podía comprobar estaba mal.** Lo único
falso era el nombre — y un nombre no sale rojo. ⭐ Y el bloque A lo clasificó como *latente* `L2`
precisamente por eso: *«hoy no muerde»*.

**Cómo se cazó:** el bloque A, leyendo la constante al lado de su uso. **Medido hoy con control
positivo:** el único valor crudo ≥ 9999 en los 46.150 portales es **99999**, y hay **0 portales en
la franja `[9999, 99999)`** (control: 46.033 por debajo del techo).

**Causa raíz:** el techo se eligió *para* atrapar el centinela, y heredó su nombre. ⇒ ⭐ **una
constante que se llama por el problema que resuelve, y no por lo que es, miente en cuanto alguien
la lee sin el contexto.** El daño latente: el día que el callejero estrene un portal `12345`, este
techo lo tira **en silencio** y el guardián no puede verlo, porque compara contra 9999.

**Arreglo aplicado:** se separan en dos —`TECHO_PEDIBLE = 9999` y `CENTINELA_CALLEJERO = 99999`,
este último **observado, no supuesto**— y el guardián pasa a ser dos: uno por el techo y ⭐ **uno
nuevo sobre la franja**, que es el que no existía.

⭐⭐ **Rojo visto, y hay que decir cómo: PROVOCADO.** El guardián de la franja está en 0 con el dato
real, así que se bajó el techo a 100 en una rotura temporal y se leyó su rojo —*«hay 3553 portales
con número entre el techo (100) y el centinela (99999): son números REALES y el techo los está
tirando en silencio»*— antes de restaurarlo. ⛔ **No es un rojo natural y va dicho.**

**Y un segundo fallo, mío, que salió de ahí:** ⚠️ **el positivo de control saltó junto al guardián**
al provocar el rojo. Contaba «los portales por debajo del techo», que depende de lo que se está
poniendo a prueba. ⇒ **un control que se rompe con la rotura no controla nada.** Reescrito para
contar el fichero, no el filtro.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un positivo de control no puede depender de la variable que el
guardián vigila.** Si la rotura los tumba a los dos, el control no distingue «el fichero no se
leyó» de «el guardián tenía razón» — y es en la rotura, justo cuando hace falta, cuando deja de
servir.

**Traza:** `src/portales.js` · `src/medir-paridad.js` · registro `A-CODIGO-2026-08-06.md` §L2

---

## [2026-08-07] — Un veredicto recitaba «400× el azar» tres líneas después de medir 412,7×

**Categoría:** dato envenenado
**Síntoma:** `sin-vigilancia.js` mide y publica la razón sobre el azar, y luego la vuelve a decir
en su frase de cierre. Las dos líneas, en la misma ejecución:

```
   :79    ⇒ ¿y está por encima del azar?                     412.7×      ← lo MEDIDO
   :192      …(65,5 % frente a 61,9 %, 400× el azar), pero el            ← lo RECITADO
```

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el propio documento que lo cita.**
`docs/H1-CIERRE.md` §E7 publica **412×** — el bueno. Quien leyera el informe y quien leyera la
salida del script verían números distintos, y **el que estaba bien era el documento**. ⭐ Y el
script sale en **código 0**: no tiene ni un `A.exige` en sus 600 líneas, así que no había nada que
pudiera ponerse rojo.

**Cómo se cazó:** el bloque B.2 de la auditoría, comparando cada cifra publicada contra la salida
de su productor. Salió como «candidata a divergencia» **al revés de lo esperado**: el documento
decía una cosa y el script otra, y el equivocado era el script.

**Causa raíz:** ⭐⭐ **el número vive en una cadena que se IMPRIME.** Es el nº144 —*un número que solo
vive en un comentario se pudre*— con una vuelta de tuerca que lo hace peor: **un comentario se lee
como un comentario; una cadena impresa se lee como un resultado.** Nadie sospecha de la línea de
salida de un instrumento.

**Arreglo aplicado:** la frase interpola `tCiegos.pctv`, `tBuenos.pctv` y `tBuenos/tAzar`.
⛔ **NO se cambió 400 por 412,7**: eso es el mismo fallo con otro número, y volvería a pudrirse.

⭐⭐ **Rojo visto antes de arreglar** —`⛔ el veredicto recita un número escrito a mano y lo medido es
412.7×`— y verde después, con **una sola línea de diferencia** en toda la salida del script.

**Y un fallo mío dentro, que estuve a punto de commitear:** ⛔ escribí como guardián permanente un
`A.exige(FRASE.includes(razon))` **sobre la frase que yo mismo acababa de construir con esa razón**.
Pasa siempre. Es el nº63 exacto — *una comprobación que no puede distinguir lo que dice
distinguir*—, y encima habría quedado como prueba de que la línea está vigilada. Se tiró, y en su
sitio queda escrito por qué no hay guardián: **lo que protege esa línea es que ya no queda ningún
número que escribir a mano.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un número escrito a mano dentro de una cadena que se imprime es peor
que en un comentario, porque hereda la credibilidad del instrumento.** ⚠️ Y la segunda, sobre el
arreglo: **cuando la solución es interpolar, el guardián que verifica la interpolación pasa por
construcción.** No se pone: se dice que no se pone y por qué.

**Traza:** `src/sin-vigilancia.js` · registro `B2-CONTRASTE-2026-08-07.md` §B2·V2

---

## [2026-08-07] — Estuve a punto de declarar fallada la predicción por dos líneas que solo habían cambiado de sitio

**Categoría:** aviso falso
**Síntoma:** con el arreglo del centinela puesto, la comprobación de qué se había movido dio esto:

```
   medir-paridad            líneas distintas: 0
   medir-listones           líneas distintas: 4      ⬅ predije que NO cambiaba
   informe-portales         líneas distintas: 24
```

La predicción de T1·1a decía **explícitamente** que `medir-listones.js` no se movía, porque todos
sus `.n` vienen del índice, que ya estaba limpio. Y la costura del encargo es tajante: *«lo que se
mueve no coincide con la predicción → PARA Y AVISA»*. Iba a pararla.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el mismo instrumento, sobre los
otros dos ficheros, dando la respuesta correcta las dos veces.** `medir-paridad` salió en 0 —que es
lo predicho— e `informe-portales` en 24 —que también—. **Dos aciertos de tres hacen que el tercero
parezca un hallazgo**, no un fallo del comparador.

**Cómo se cazó:** por mirar el diff entero en vez de su recuento. Las cuatro líneas eran **dos**,
y las dos eran el banner del grafo:

```
   > ⚑ GRAFO · zona=termino …          (aparece en la línea 11)
   < ⚑ GRAFO · zona=termino …          (aparecía en la línea 140)
```

**Causa raíz:** el banner se imprime por **stderr** y el resto por **stdout**. Al capturar con
`2>&1`, el orden en que se entrelazan **depende del buffering**, no del programa. ⇒ dos ejecuciones
idénticas del mismo código dan ficheros distintos, y un `diff` los cuenta como cambios. **Ningún
número se movió.**

**Arreglo aplicado:** la comparación filtra las líneas `⚑` antes de contar. ⛔ Y no basta con
filtrar el tiempo: hay más de una fuente de ruido en una salida capturada.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **la ley 90 aplicada al comparador: el instrumento que mide el efecto
de un arreglo también es código nuevo sin auditar.** ⚠️ Y la forma concreta, que es barata de
evitar: **una salida capturada con `2>&1` no es determinista**, y comparar dos de ellas mide
también el planificador del sistema operativo.

**Traza:** comparación `prod/` (cosecha del bloque B.2) contra `post1/`, fuera de `src/`

---
## [2026-08-07] — Interpolar una cifra a medias metió una contradicción DENTRO del mismo veredicto

**Categoría:** aviso falso
**Síntoma:** al arreglar los tres hermanos del veredicto de `sin-vigilancia.js` interpolé también,
de paso, la diferencia entre los dos porcentajes del testigo 2. La salida quedó así:

```
   línea 185   con nombre 55.6 %  ·  donde nadie vigila 44.9 %   ⇒ ~11 puntos PEOR
   línea 603   …lo pone ~10 puntos por debajo sobre 214 casos, y 214 casos no deciden nada.
```

**El mismo veredicto diciendo 11 arriba y 10 abajo.** Y las dos frases hablan de lo mismo.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo, y con razón.** El script
salió en **código 0**, el diff contra la línea base dio **exactamente las tres líneas esperadas**, y
`55,6 − 44,9 = 10,7`, así que **`~11` es MÁS correcto que `~10`**. El arreglo era aritméticamente
mejor que lo que sustituía. ⭐ Lo único que estaba mal era **lo que no toqué**: la línea 603 quedaba
fuera del alcance declarado de la tanda, así que el veredicto se quedaba a dos voces.

**Cómo se cazó:** leyendo el diff entero en vez de contar sus líneas — que es lo que la entrada 157
me acababa de enseñar a hacer, ayer mismo.

**Causa raíz:** el alcance eran **tres cifras** (`55,6 %`, `44,9 %`, `5,4 %`) y la diferencia entre
dos de ellas es **una cuarta**, que además tiene un gemelo veinte líneas más abajo. ⇒ ⭐⭐ **un
número derivado de dos que sí están en el alcance NO está en el alcance**: arrastra a todos los
sitios donde se repite.

**Arreglo aplicado:** se devuelve el `~10` escrito a mano, **con el porqué al lado**, y se anota
como hermano pendiente **junto con su pareja de la línea 603**. Los dos, o ninguno.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **arreglar de más dentro de un alcance estrecho puede ser peor que no
arreglar.** Un párrafo con dos números incoherentes le cuesta más al lector que uno con dos números
viejos coherentes — porque el viejo es una foto y el incoherente es una duda.
⚠️ Y la regla práctica: **antes de interpolar una cifra, buscar si se repite en otro sitio del
mismo texto.** Si se repite y ese sitio no está en el alcance, no se toca.

**Traza:** `src/sin-vigilancia.js` §E7

---

## [2026-08-07] — Mi detector de hermanos exigía `%` o `×`, y en el fichero que estaba arreglando se dejó dos

**Categoría:** silencio falso
**Síntoma:** en T1·4 barrí `src/` buscando *«un valor escrito a mano donde debería ir uno
calculado»* y publiqué **43 hermanos**, tres de ellos en `sin-vigilancia.js`. Al arreglar ese
fichero y volver a mirarlo de cerca aparecieron **dos más que mi barrido no había visto**:

```
   :603   …lo pone ~10 puntos por debajo sobre 214 casos, y 214 casos no deciden nada.
   :611   el testigo 2 pasaría de 214 casos a decenas de miles…
```

`214` es `ciegosCub.length` y `~10` es la resta de dos porcentajes medidos. **Los dos son
resultados del propio script, escritos a mano, dentro de algo que se imprime** — la definición
exacta de hermano.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el control de semilla del propio
barrido.** T1·4 comprobaba que `sin-vigilancia.js:564` —el «400×», el hermano conocido— saliera en
la lista, y salía. **Una semilla que se encuentra a sí misma no dice nada de lo que no se buscó.**

**Cómo se cazó:** por la pregunta de cierre del encargo —*«¿queda alguna cifra escrita a mano en el
fichero?»*—, que me obligó a barrer **el mismo fichero con un criterio ancho** en vez de con el mío.

**Causa raíz:** para bajar de 570 candidatas a 63 legibles, mi criterio exigía que la cifra llevara
**`%` o `×`**. Es un filtro de FORMATO, no de naturaleza: **`214 casos` y `~10 puntos` son
resultados igual de medidos y no llevan ninguno de los dos símbolos.** ⇒ el 43 no es un recuento:
es **un suelo**, y no lo dije al publicarlo.

**Arreglo aplicado:** ⛔ ninguno en el código — los dos quedan anotados, no tocados (fuera de
alcance). **Lo que se corrige es el número: 43 pasa a declararse como SUELO, no como total.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un filtro de formato produce un suelo, no un recuento — y si no se
declara como suelo, se lee como total.** ⚠️ Y sobre los controles: **una semilla comprueba que el
detector encuentra lo que ya sabías; no comprueba nada sobre lo que no sabías.** Para eso hace
falta barrer una parcela pequeña con criterio ancho y contar la diferencia.

**Traza:** instrumento desechable `t1-hermanos.js` (fuera de `src/`) · `src/sin-vigilancia.js`

---

## [2026-08-07] — Medí la dependencia del disco `E:` y creí haber medido el agujero del clon

**Categoría:** medida corta
**Síntoma:** el bloque B de la auditoría publicó *«49 de los 70 ficheros de `src/` (70 %) no pueden
correr en un clon»*, con los 21 restantes clasificados como *«librerías que reciben la ruta por
parámetro»*. El número salía de seguir la cadena de `require` hasta `portales.js:38-39`, las dos
rutas absolutas a `E:/PROYECTOS WEB/01 ZGZ RADAR REACT/…`.

**El número era correcto y la conclusión era corta.** Un clon no se queda sin dos ficheros: se
queda **sin ninguno**. `data/fuentes/` está gitignoreada entera —37 MB de OSM, 12 MB de edificios,
la jerarquía viaria, las zonas verdes—, así que los 21 «que sí podrían» tampoco tienen de dónde
leer. Medido hoy con `git ls-files data`: **0 de los 34 ficheros de `data/fuentes/` viajan.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **absolutamente todo, durante 36
tandas.** `probar-paradas.js --todo` recorriendo los 57 scripts con el invariante cumplido; los
**26 números congelados** cuadrando uno a uno con su rojo visto; **las siete rutas al decimal**; los
cuatro visores. Nada de eso puede detectar el fallo, y no por descuido: **todos se ejecutan en la
máquina donde el dato está.** Un guardián que solo corre donde el fallo no ocurre es un guardián que
nunca lo verá.

**Cómo se cazó:** por una pregunta del encargo que no era la mía —*«¿qué le falta a alguien que
acaba de clonar?»*— en vez de la que yo me hice, que era *«¿qué rutas absolutas hay?»*.

**Causa raíz:** ⭐⭐ **busqué por el mecanismo que ya conocía.** Tenía las dos rutas absolutas
señaladas por el bloque A y medí su alcance. Nadie mide el alcance de lo que no ha señalado, y
`data/fuentes/` no estaba señalada porque **no es un fallo: es una decisión correcta** (dato de
producción, se refresca, versionarlo lo pudre). ⇒ **un agujero puede estar hecho de dos piezas y
que solo una sea un error.** La pieza correcta me hizo invisible el tamaño real del hueco.

**Arreglo aplicado:** las dos rutas pasan a `path.join(__dirname, '..', 'data', 'fuentes', …)` y los
dos ficheros del callejero se copian ahí con su procedencia escrita —⚠️ **la genera OTRO PROYECTO**,
y eso tampoco estaba escrito en ningún sitio—. `data/fuentes/` sigue gitignoreada: **el arreglo no
hace que un clon funcione; hace que pueda funcionar en cuanto tenga el dato, y que sepa cuál.** El
guardián nuevo es `auditoria-grafo.js` §A2, con su rojo visto (2 rutas, `portales.js:38-39`) y sus
dos controles: un cebo que sí caza y las trampas conocidas (`https://`, una ruta dentro de un
comentario) que no marca.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una batería que solo se ejecuta donde el fallo no ocurre no es una
red: es una costumbre.** ⚠️ Y la práctica: **medir el alcance de lo señalado no es medir el
agujero.** Antes de publicar un «X de N no pueden», hay que preguntarse qué tendrían que tener los
que sí pueden.

**Traza:** `src/portales.js:38-39` · `src/auditoria-grafo.js` §A2 ·
`data/fuentes/2026-05-13_zgzradar_callejero_procedencia.txt`

---

## [2026-08-07] — Escribí doce huellas SHA-256 y diez eran inventadas: las trunqué a 16 y rellené el resto

**Categoría:** dato inventado
**Síntoma:** al escribir `src/verificar-datos.js` puse las doce huellas esperadas copiándolas de una
medición anterior que había impreso **solo los 16 primeros caracteres** (`sha256sum | cut -c1-16`).
Los 48 restantes los completé con hexadecimal escrito a mano:

```
   sha: '5516878f35b69d4e2e1f0e34d3e4a2f9a9b09c6d38a4f5e5a09f0e2a3b1c4d5e'   ← inventada
   sha: '5516878f35b69d4e0fa4d96f3a1faf88e653fe064564d7ecc240be4705050d57'   ← la real
```

⛔ **Diez de las doce.** Las dos correctas —las del callejero— lo eran de casualidad: las había
medido enteras diez minutos antes para otra cosa.

**Qué habría pasado:** el verificador habría dicho **`OTRO` sobre datos perfectamente correctos**, y
en §D habría listado, con nombre y con aire de autoridad, qué números «dejan de estar
garantizados». **Un rojo falso publicado dentro del script cuyo trabajo es decir la verdad sobre el
dato.** Ley 91: un verde falso lo caza el siguiente que mire; un rojo falso no lo caza nadie.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **`--probar`, las tres pruebas del
comparador — y con toda la razón.** El comparador estaba bien: distinguía `EL MISMO` / `OTRO` /
`NO ESTÁ` sobre un fichero sintético, incluso con un byte cambiado y el mismo tamaño. **Probé el
mecanismo y no la tabla**, y el fallo estaba entero en la tabla. ⚠️ Y las dos huellas buenas
habrían servido de coartada: `EL MISMO ×2` en una salida con diez `OTRO` se lee como «el detector
funciona».

**Cómo se cazó:** al releer lo que acababa de escribir antes de ejecutarlo, viendo que los 16
primeros caracteres eran los únicos que reconocía. Se confirmó con una comprobación que lee cada
literal del fichero y lo compara con `sha256sum` del disco: **12 comprobadas, 0 mal** después de
sustituirlas.

**Causa raíz:** ⭐⭐ **usé como fuente una salida que había recortado yo mismo para que cupiera.**
El `cut -c1-16` era una comodidad de lectura de hacía media hora; media hora después esa salida ya
no se leía como «un resumen», sino como «el dato». ⇒ **un dato truncado para mirarlo no vuelve a
distinguirse del entero**, y completar lo que falta se siente como formatear, no como inventar.

**Arreglo aplicado:** las doce huellas medidas enteras y sustituidas; la comprobación literal contra
el disco ejecutada. Y en la cabecera del propio fichero queda escrito cómo nació, porque **un
verificador que ya mintió una vez tiene que llevar esa historia encima.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **probar el mecanismo no prueba la tabla.** Un comparador
impecable sobre una lista inventada da rojos impecables. ⚠️ Y la regla práctica: **nunca se
rellena un identificador por su prefijo.** Si la fuente está truncada, la fuente no sirve: se
vuelve a medir.

**Traza:** `src/verificar-datos.js` (la cabecera lo cuenta) · `data/fuentes/`

---

## [2026-08-07] — Los cuatro visores pintaban teselas de OSM acreditando «© OpenStreetMap» a secas

**Categoría:** obligación incumplida
**Síntoma:** los cuatro visores cargan el mapa de fondo de `tile.openstreetmap.org` y lo acreditan
así:

```
   attribution: '© OpenStreetMap'
```

**Sin `contributors` y sin enlace a las condiciones.** La ODbL pide crédito a los **colaboradores**
—no a un proyecto— y que desde donde se ve el dato se pueda llegar a la licencia. Y no es un
detalle formal aquí: el grafo entero de este repositorio es una base de datos derivada de OSM, así
que la atribución es **la única contrapartida** de todo lo que el proyecto usa.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **los cuatro probadores de visor,
que son de los instrumentos más duros del repositorio.** `probar-visor-rutas.js` simula Leaflet,
cuenta polilíneas y marcas, compara metro a metro lo que el visor pinta contra lo que el motor
calcula, mete un tramo falso para comprobar que no se filtra en silencio y lo borra para comprobar
que desaparece. **Ninguno mira la licencia ni una sola vez** — y no por descuido: comprueban que el
mapa diga la verdad sobre el DATO, y la atribución es una verdad sobre la PROCEDENCIA del dato.
⚠️ Y los cuatro reciben la cadena: pasa por su `tileLayer` simulado, entra por el parámetro, y allí
nadie le pregunta nada.

**Cómo se cazó:** por el reconocimiento de cierre, buscando qué le falta al repositorio de cara
afuera. No lo cazó ningún guardián, y a día de hoy sigue sin haber uno.

**Causa raíz:** ⭐ **la atribución no es una afirmación sobre el mundo, y todo lo que este proyecto
vigila lo es.** Un contador se compara con un recuento; una ruta, con otra ruta; un nombre, con la
fuente. Un crédito de licencia no se contrasta con nada medible, así que no hay dónde engancharle
un `A.exige` de los que aquí se escriben. ⇒ **la clase de afirmación que este proyecto sabe
vigilar dejó fuera una obligación entera.**

**Arreglo aplicado:** una cadena por visor, las cuatro, con `colaboradores de OpenStreetMap` y
enlace a `openstreetmap.org/copyright`. Los cuatro probadores, en verde después. ⛔ **Y no se pone
guardián**, porque el que se me ocurría —comprobar que la cadena contiene «OpenStreetMap»— es un
guardián sobre el texto que acabo de escribir, que es el nº63. Queda anotado como descubierto sin
red: lo caza quien mire, y hoy nadie mira.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un repositorio vigila las afirmaciones de la clase que sabe
comprobar, y las demás no es que fallen: es que no están.** ⚠️ Antes de decir «esto está
verificado», hay que preguntar de qué CLASE son las obligaciones que tiene encima, no solo cuántas
comprobaciones hay.

**Traza:** `tools/visor-grafo.html` · `tools/visor-nombre-simple.html` · `tools/visor-nombres.html` ·
`tools/visor-rutas.html` — la línea del `tileLayer` de cada uno

---

## [2026-08-07] — Escribí a mano una lista que el código sabe calcular, y ya nació con un error

**Categoría:** dato escrito a mano
**Síntoma:** `src/verificar-datos.js` llevaba, para cada uno de los doce ficheros de datos, un campo
`quien:` con sus consumidores escrito a mano. Se commiteó así (`8e54555`). Al comprobarlo contra el
código:

```
   escrito   MU1_jerarquia_viaria → municipal.js · cerrar-punto-ciego.js · asignar-bici.js · sin-vigilancia.js
   medido    MU1_jerarquia_viaria → municipal.js · cerrar-punto-ciego.js
```

`asignar-bici.js` lee la capa de **carriles bici** (MU2), no la jerarquía viaria; y `sin-vigilancia.js`
lee las **zonas de `data/exploracion/`**, que es otra cosa. Dos de cuatro, mal.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **las tres pruebas del comparador,
otra vez, y otra vez con razón.** `--probar` da los tres veredictos correctos; el informe salía en
código 0 con los doce `EL MISMO`. **Nada de lo que este fichero comprueba toca el campo `quien`**:
es texto descriptivo, y el texto descriptivo no tiene guardián. ⚠️ Y el detalle que lo hacía
creíble: los otros diez estaban bien, así que la lista se leía como derivada del código.

**Cómo se cazó:** al ir a citar la lista en el informe de la tanda me fié de ella y la contrasté por
costumbre —`grep -l "require('./municipal')"`— y no cuadraba.

**Causa raíz:** ⭐⭐ **es exactamente el hermano que esta misma tanda persigue, escrito por mí, en el
fichero nuevo.** Un dato que el código puede contestar (`¿quién nombra este fichero?`) puesto a mano
porque en el momento de escribirlo lo tenía delante. La bitácora 159 dice que una cifra a mano se
pudre; una LISTA a mano ni siquiera necesita pudrirse: **nace mal y nadie la vuelve a mirar.**

**Arreglo aplicado:** el campo `quien` desaparece. Los consumidores se calculan al vuelo leyendo
`src/` y siguiendo los `require`, y se publica además **cuántos ficheros alcanzan cada dato** —que
resulta ser el número del bloque B visto desde el otro lado: el callejero lo alcanzan **49 de 70**.
⚠️ Y el auditor **se excluye a sí mismo**: este fichero NOMBRA los doce, así que sin excluirlo
saldría como consumidor directo de todos. Es el nº70, en el que ya cayó `auditoria-grafo.js`.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **si el código puede contestar la pregunta, la respuesta no se
escribe.** Ni aunque se tenga delante, ni aunque sea texto y no un número: una lista descriptiva no
tiene quien la vigile, y por eso es peor que una cifra. ⚠️ Y el aviso: **diez elementos correctos
de doce hacen creíble una lista inventada** — la proporción no es evidencia de método.

**Traza:** `src/verificar-datos.js` (`consumidores()`, y el campo `quien` que ya no existe)

---

## [2026-08-07] — `B·V2` era falso: confundí `movilidad:MU1_jerarquia_viaria` con `idezar_base:JERARQUIA_VIARIA`

**Categoría:** hallazgo falso · rojo publicado
**Síntoma:** el bloque B de la auditoría publicó `B·V2` contra el README, diciendo que atribuía a
`MU1_jerarquia_viaria` unos 3.644 tramos con código de vía que en realidad eran de `tn-ro:RoadLink`
—que *«no trae ninguno de los tres atributos»*—, que *«la capa nombrada tiene 3.453 y tampoco trae
código»*, y que *«el código solo está en `urbanismo:Vias` (3.359)»*.

**Contrastado con los cuatro crudos archivados en `data/exploracion/`, sin descargar nada:**

```
   capa                             numberMatched   ¿codigo?  ¿doble_sent+limite_vel+plataforma?
   movilidad:MU1_jerarquia_viaria           3.644      ✅ SI        ✅ SI
   tn-ro:RoadLink                           3.644      ⛔ NO        ⛔ NO
   idezar_base:JERARQUIA_VIARIA             3.453      ⛔ NO        ✅ SI
   urbanismo:Vias                           3.359      ✅ SI        ⛔ NO
```

**Son DOS capas distintas con el mismo nombre humano y distinto espacio de nombres.** El README
nombra `movilidad:MU1_jerarquia_viaria`, que tiene los 3.644 **y** el código **y** los tres
atributos. `B·V2` la identificó con `idezar_base:JERARQUIA_VIARIA`, que es la de 3.453 y no trae
código. ⇒ **la conclusión de `B·V2` —«el código solo está en `urbanismo:Vias`»— es falsa, y el
README tenía razón.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **cada pieza de `B·V2` por
separado era cierta.** `RoadLink` tiene 3.644: cierto. `RoadLink` no trae ninguno de los tres:
cierto, medido. `JERARQUIA_VIARIA` tiene 3.453 sin código: cierto. `urbanismo:Vias` tiene el código:
cierto. **Cuatro afirmaciones verdaderas y una conclusión falsa**, porque la que las unía —*«la capa
nombrada es ésa»*— no la comprobé contra nada. ⚠️ Y la coincidencia que lo hizo creíble: **MU1 y
RoadLink tienen EXACTAMENTE el mismo `numberMatched`**, 3.644, porque `RoadLink` es la publicación
INSPIRE de MU1. Ver el número repetido en dos capas y concluir «entonces es la otra» fue el salto.

**Y el segundo fallo, que es peor:** al escribir el README de hoy **retiré `B·V2` en el cuerpo de un
mensaje de commit** y no lo publiqué en el informe. ⇒ **una corrección silenciosa.** El número de la
portada cambió de «3.644 con código» a «3.644, 3.623 con código» sin que nadie leyera que un
hallazgo publicado se caía. **Eso es exactamente lo que este proyecto persigue, hecho por mí, en la
tanda cuyo encargo era publicar lo que cambia.**

**Cómo se cazó:** Antonio lo vio al leer el README nuevo contra el hallazgo viejo y lo mandó
decidir con el dato delante.

**Causa raíz:** ⭐⭐ **emparejé por el nombre en vez de ir al objeto.** Es `B·V1` otra vez, cuatro
tandas después: allí leí los documentos de diseño buscando lo que el encargo me señalaba en vez de
preguntarles qué eran; aquí leí «jerarquía viaria» y cogí la capa que se llamaba así, sin mirar el
espacio de nombres. **Dos rojos falsos de la auditoría, y los dos por lo mismo.**

**Arreglo aplicado:** ⛔ ninguno en el README — era correcto. Lo que se corrige es el hallazgo:
**`B·V2` se retira, declarado, con las cuatro pruebas.** Lo único impreciso del README original era
«3.644 tramos con código»: son 3.644 tramos, **3.623** con código, y eso ya está afinado.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una retirada que solo vive en un mensaje de commit no está
publicada.** Si un hallazgo se cae, se cae donde se leyó. ⚠️ Y sobre el hallazgo: **piezas
verdaderas no hacen una conclusión verdadera si la que las une no se comprobó** — y la que las une
suele ser la identificación del sujeto, que es la que nunca se mide.

**Traza:** `data/exploracion/2026-08-02_wfs_describe_movilidad-MU1_jerarquia_viaria.xml` ·
`2026-08-02_idezar-geoserver_describe-JERARQUIA_VIARIA.xml` ·
`2026-08-02_idezar-geoserver_getfeature-RoadLink-count3.json` ·
`2026-08-02_wfs_zona-casco_MU1jv.json` frente a `2026-08-02_wfs_zona-casco_IDEZARjv.json` (19 y 14)

---

## [2026-08-07] — Publiqué «~120 MB» en la portada que promete que no hay números a mano

**Categoría:** dato sin medir
**Síntoma:** el README nuevo dice, sobre por qué el dato no viaja: *«Son ~120 MB, con un fichero de
37 MB.»* **Las dos cifras están mal**, y en una tabla que empieza diciendo *«Cada cifra sale de un
script que se puede volver a ejecutar. Ninguna está escrita a mano aquí.»*

```
   du -sb data/fuentes   →   135.113.257 bytes = 135,1 MB   (no ~120)
   el fichero mayor      →   ZonasVerdesSecundarias, 62,4 MB   (no el OSM de 37,4)
```

⭐ Y al medirlo sale algo que no sabía: **el fichero más grande de la carpeta no lo lee nadie.**
`ZonasVerdesSecundarias` (62,4 MB) no aparece en los doce necesarios — `parques.js` solo nombra la
capa en una línea de informe. ⇒ lo que un clon tiene que conseguir de verdad son **72,7 MB en 12
ficheros**, y ahí sí el mayor es el OSM de 37,4 MB.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐ **la tabla de números de la propia
portada, entera.** Los nueve valores con su comando al lado son correctos, los comprobé uno a uno.
**La cifra mala estaba en la PROSA**, tres párrafos más abajo, donde la promesa no se leía como
aplicable. ⚠️ Y el «~» la protegía: una cifra con tilde de aproximación no invita a comprobarla.

**Cómo se cazó:** Antonio la contrastó con un listado del 6/08 que daba `ZonasVerdesSecundarias` en
59,5 MB.

**Causa raíz:** ⭐⭐ **puse el orden de magnitud que recordaba del encargo, no el que da `du`.** El
encargo decía «~117 MB con un fichero de 59,5 MB»; escribí «~120 MB con un fichero de 37 MB»
mezclando su total con el fichero que yo tenía en la cabeza por ser el del grafo. ⇒ **una cifra
recordada se escribe igual de fácil que una medida, y con el `~` delante ni siquiera parece una
afirmación.**

**Arreglo aplicado:** la frase pasa a decir lo medido, y lo que le importa a quien clona: los **12
ficheros necesarios, 72,7 MB**, el mayor de 37,4 MB. Con el comando al lado.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **la promesa de «ninguna cifra a mano» alcanza a la prosa, no solo a
la tabla.** Un documento que declara su método se compromete en cada línea. ⚠️ Y el aviso concreto:
**un `~` no es una licencia para no medir** — es una precisión declarada sobre un número que
igualmente hay que tener.

**Traza:** `README.md`, sección *Cómo ejecutarlo* · `du -sb data/fuentes`

---

## [2026-08-07] — Publiqué en la portada un comando de ejemplo que no había ejecutado, y no funciona

**Categoría:** dato sin medir
**Síntoma:** el README nuevo abre la sección *«Después, el motor»* con esto:

```
   node src/ruta.js "Calle Don Jaime I 1" "Plaza del Pilar"    # una ruta
```

Ejecutado:

```
   ⛔ no se puede resolver la dirección "Plaza del Pilar"
   exit=0
```

**El primer comando que un extraño copia de la portada no funciona.** El buscador resuelve
**portales del callejero** —vía + número— y una lista corta de sitios con nombre; «Plaza del Pilar»
es un topónimo suelto y no está.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la portada entera, y con su
propio método puesto.** Audité las 30 cifras del README una a una contra su fuente y corregí cuatro.
**Ninguna de esas 30 comprobaciones es un comando**: comprobé los números y di por buenos los
`bash` que los rodean. ⚠️ Y el comando iba en un bloque con otros tres que **sí** funcionan, así que
el bloque se leía como verificado en conjunto.

**Cómo se cazó:** preguntándome qué le impide a un extraño usar esto —la última pregunta del
encargo— y ejecutando lo primero que ese extraño ejecutaría.

**Causa raíz:** ⭐⭐ **escribí el ejemplo por lo que hace bonito, no por lo que resuelve.** «Calle
Don Jaime I 1 → Plaza del Pilar» es el trayecto turístico obvio de Zaragoza y suena a demostración;
las direcciones que el motor resuelve son las siete de Antonio, que suenan a banco de pruebas. ⇒
**elegí el ejemplo con criterio de escaparate dentro de un documento cuyo método es no fiarse de lo
que parece razonable.**

**Y un fallo de otro que sale de paso, anotado y NO tocado:** `ruta.js` imprime `⛔ no se puede
resolver la dirección` **y termina en código 0**. Un `⛔` impreso no es un fallo, es texto — es la
ley 44, y es exactamente el caso para el que se escribió `src/alarma.js`. Fuera del alcance de esta
tanda.

**Arreglo aplicado:** el ejemplo pasa a `"Calle Manifestación 6" → "Calle Don Jaime I 17"`,
**ejecutado antes de escribirlo**: da 598 m, que es la ruta nº2 congelada al decimal. Y se añade la
línea que faltaba: qué clase de dirección entiende el buscador, y que un fallo de resolución sale en
verde.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un comando publicado es una afirmación, y se ejecuta antes de
publicarlo.** La portada prometía «cada cifra con su comando» y yo verifiqué las cifras y no los
comandos: **la mitad de la promesa que no se lee como promesa es la que no se comprueba.**

**Traza:** `README.md`, sección *Cómo ejecutarlo* · `src/ruta.js` (el código 0 sobre una dirección
no resuelta, anotado)

---

## [2026-08-07] — La portada prometía «con qué consulta se pidió cada uno», y para seis de los doce no consta

**Categoría:** promesa incumplida
**Síntoma:** el README, presentando `verificar-datos.js`, decía:

> *«Te dice, fichero a fichero, qué necesita el motor, **con qué consulta se pidió cada uno**…»*

Y el propio instrumento contesta, para seis de los doce:

```
   2026-08-03_overpass_zaragoza-rios_geom-y-tags.json
      consulta NO CONSTA la consulta exacta … Sello del dato: timestamp_osm_base 2026-08-03T10:37:31Z.
```

**Cinco POST a Overpass —límite, ríos, edificios, entrance, zonas verdes— y las
`ZonasVerdesPrincipales` guardaron la RESPUESTA y no la PETICIÓN.** ⇒ **el repositorio no sabe cómo
se pidió la mitad de su dato**, y la portada afirmaba que sí.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **el propio `NO CONSTA`, que
funciona perfectamente.** El instrumento hace exactamente lo correcto: para cada fichero sin consulta
archivada dice `NO CONSTA` **con su motivo**, y conserva el sello que sí está dentro del crudo. **La
honestidad estaba entera en el instrumento y se perdió al resumirlo en la portada.** ⚠️ Y lo que lo
hacía invisible: la frase es cierta *de los seis que sí constan*, así que leyéndola con un ejemplo
bueno delante no chirría.

**Cómo se cazó:** Antonio cruzó la frase de la portada con lo que yo mismo había medido y publicado
—«de los 12 necesarios, seis son `NO CONSTA`»— dos apartados más abajo del mismo informe.

**Causa raíz:** ⭐⭐ **resumí el instrumento por lo que hace cuando le sale bien.** Al describir una
herramienta se cuenta su caso feliz, porque es el que explica para qué sirve; el caso «no lo sé» se
queda dentro, donde nadie lo lee salvo ejecutándola. ⇒ **un resumen tiende a prometer el mejor de
los comportamientos de lo que resume**, y eso convierte una herramienta honesta en una portada que
miente. Es, además, **la clase exacta de fallo que esta tanda vino a arreglar, cometida en la frase
que lo arregla.**

**Arreglo aplicado:** la frase pasa a decir lo que el instrumento entrega, y el `NO CONSTA` se
publica **como hallazgo, no como matiz**: cuántas constan, cuántas no, por qué, y qué se conserva en
su lugar. ⚠️ Comprobado **antes** de reescribir: se provocó el rojo escondiendo dos de los seis y se
verificó que el verificador dice `NO CONSTA` con su motivo — la portada se ajusta al instrumento, no
al revés.

**Y uno de otro, anotado y NO tocado:** ese texto dice *«NO CONSTA la consulta exacta, **por lo mismo
que la anterior**»*, y «la anterior» solo existe si el fichero de arriba también falta. Provocado en
solitario, la referencia queda huérfana. Es un texto que depende del orden de impresión.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un resumen promete el mejor comportamiento de lo que resume, salvo
que se le obligue a contar el peor.** Al describir un instrumento en un documento de cara afuera hay
que escribir primero lo que NO sabe hacer. ⚠️ Y el aviso: **una frase que es cierta para la mayoría
de los casos se lee como cierta para todos** — la proporción no es cuantificador.

**Traza:** `README.md`, sección *Cómo ejecutarlo* · `src/verificar-datos.js`, campo `consulta`

---

## [2026-08-07] — Comprobé las 30 cifras del README y los comandos, y no miré cómo se VE

**Categoría:** publicado sin comprobar
**Síntoma:** al añadir el aviso sobre qué direcciones entiende el buscador dejé una valla de código
de más. `README.md` quedó con **nueve** ```` ``` ````, impar: **todo lo que va debajo del bloque de
comandos se renderizaba como código**, incluidas las cuatro secciones finales y la licencia.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la auditoría completa de la
portada, hecha esta misma tarde.** Las 30 cifras contrastadas una a una contra su fuente; el comando
de ejemplo ejecutado antes de escribirlo; la promesa de las consultas ajustada al instrumento tras
provocarle el rojo. **Tres pasadas de verificación sobre el mismo fichero, y ninguna lo miró
RENDERIZADO.** ⚠️ Y en texto plano no se ve: las vallas están a 45 líneas de distancia y cada una,
por separado, parece correcta.

**Cómo se cazó:** por el aviso del editor al releer el fichero entero, no por ninguna comprobación
mía.

**Causa raíz:** ⭐⭐ **verifiqué el CONTENIDO de un documento y no su FORMA, porque las herramientas
que tengo miden contenido.** Puedo contar cifras, ejecutar comandos y comparar salidas; «se ve bien»
no tiene comando en este repositorio. ⇒ **una propiedad sin instrumento no es que salga mal: es que
no se mira**, y es la misma forma del fallo de la atribución de OSM (entrada anterior) — el
repositorio vigila la clase de afirmación que sabe comprobar.

**Arreglo aplicado:** quitada la valla huérfana. El comando que lo caza —y que no existía— es
`grep -c '^```' README.md`: **tiene que dar un número par.**

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐ **un documento de cara afuera se verifica también por su forma, y la
forma tiene comando.** Contar delimitadores es tan barato como contar cifras, y nadie lo hacía
porque «se ve bien» suena a impresión y no a medida.

**Traza:** `README.md`

---

## [2026-08-08] — La batería decidía con un booleano: un fallo y siete imprimían la misma línea

**Categoría:** silencio falso
**Síntoma:** `src/probar-paradas.js:129` decidía el veredicto de cada script así:

```js
   const declara = salida.includes(A.MARCA_FALLO) || salida.includes(A.MARCA_IMPOSIBLE);
   const ok = (!declara || r.status !== 0) && !mudoYMuerto;
```

`.includes()` contesta **sí o no** sobre algo que tiene una **cantidad**. ⇒ un script que declara
UN fallo y uno que declara SIETE imprimen exactamente `DECLARA FALLO ✅`, y los dos salen en 1, así
que el código de salida tampoco los separa.

**Consecuencia medida: cinco rojos permanentes son cinco vendas.** Una de ellas tapa
`modelo-rutas.js` —el control de las siete rutas, el eje del que más cuelga el proyecto— que **no
tenía ningún canal automático para decir que le había salido un segundo fallo.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la propia batería, 36 tandas
seguidas, y es el peor caso posible: el instrumento que da el verde era el enfermo.** Y no es
teoría — llevaba dos días tapando dos muertos: `donde-falta.js §A6` y `pasos.js` publican
`NO CONSTA` en vez de medir desde el 6 de agosto, y la batería los daba `DECLARA FALLO ✅` en cada
pasada. ⚠️ Y lo que hacía imposible verlo: **la salida era byte a byte idéntica pasada tras
pasada**, que es lo que un humano lee como «no ha cambiado nada».

**Cómo se cazó:** por la pregunta de cierre de la tanda 2 —*¿qué es lo primero que le va a morder a
quien llegue?*—, que obligó a mirar el instrumento en vez de sus resultados.

**Causa raíz:** ⭐⭐ **la condición se escribió para contestar la pregunta de la tanda 12, y la
pregunta cambió sin que nadie reescribiera la condición.** Entonces se preguntaba *«¿hay algún
fallo que salga en verde?»* —y ahí un booleano es exacto—. Desde que existen rojos permanentes
declarados, la pregunta es otra: *«¿ha cambiado lo que declara?»*, y para eso un booleano no tiene
resolución. ⇒ **una comprobación no envejece porque se equivoque: envejece porque la pregunta se
mueve debajo de ella.**

**Arreglo aplicado:** el veredicto sale a `juzgar(real, esperado)` —para poder enseñarle casos sin
ejecutar los 58 scripts, que es media hora— y compara **recuento y código de salida** contra una
tabla de rojos DECLARADOS, con **mundo cerrado**: lo que no está en la tabla debe declarar 0. Cada
fila lleva **recuento · texto · desde cuándo · CLASE**, y la clase es la que hace el trabajo: sin
ella la tabla no distingue un rojo que debe seguir rojo de uno que se pudrió.
⛔ Y los que salen en rojo **sin declarar nada** no entran en la tabla: salen como **HALLAZGO**
—hoy `ruta.js`, código 2— porque aceptarlos como esperado sería aceptar un guardián callado.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **un booleano donde hay una cantidad no es una simplificación: es
una venda.** Contesta bien mientras solo importe «¿hay?», y deja de contestar el día que empiece a
importar «¿cuántos?» — sin avisar, y sin cambiar una línea de su salida.
⚠️ Y la práctica: **cuando algo se declara permanentemente rojo, hay que preguntarse qué deja de
vigilar el canal que ya estaba ocupado.**

**Traza:** `src/probar-paradas.js` (`juzgar()`, `DECLARADOS`, P5)

---

## [2026-08-08] — `donde-falta.js §A6` y `pasos.js` exigían siete rutas y el proyecto había decidido que fueran seis

**Categoría:** expectativa caducada
**Síntoma:** las dos leen las rutas de `rutas-antonio.js --aristas`, que emite **solo las que
resuelven**, y las dos exigían:

```js
   A.exige(rutas && rutas.length === 7, 'no se han podido leer las siete rutas')
```

El **6 de agosto** (`c6f7f41`) el proyecto decidió que la ruta nº1 **no debe resolverse** —sus dos
extremos caen en un hueco de su propia acera— y desde entonces `--aristas` emite **seis**. ⇒ las dos
comprobaciones fallan siempre, y **§A6 lleva desde entonces imprimiendo `NO CONSTA` en lugar de la
tabla que es su razón de existir.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐⭐ **la batería, en cada pasada, y
por partida doble.** Los daba `donde-falta.js código 1 DECLARA FALLO ✅` — porque su regla solo
miraba si declaraban *algo*— y además **la salida de la batería salía byte a byte idéntica**, que es
lo que cualquiera lee como «no ha cambiado nada». ⚠️ Y el tercer verde, el más fino:
`nombrar-aceras.js` hace lo mismo con `sieteRaw.length > 0` y **sobrevivió al cambio sin enterarse
de nada**, así que el patrón sano ya estaba escrito en el repositorio, a nueve ficheros de
distancia.

**Cómo se cazó:** midiendo el propio instrumento en vez de sus resultados, al preguntarse qué es lo
primero que le muerde a quien llega.

**Causa raíz:** ⭐⭐ **dos ficheros duplicaron una vigilancia que ya tenía dueño.** Cuántas rutas
deben resolverse lo vigila `modelo-rutas.js`, que compara las seis contra `PUBLICADOS` y comprueba
que la nº1 sigue en sugerencia. `donde-falta.js` y `pasos.js` no necesitaban ese número para nada
—solo necesitaban *tener algo que medir*— y aun así escribieron su propia copia. ⇒ **la copia no
se enteró de la decisión, y como estaba dentro de un `A.exige`, su ignorancia salió por el mismo
canal que un fallo de verdad.** Es la ley 56 con una vuelta más: copiar la regla no solo duplica el
mantenimiento — **convierte un dato desactualizado en un rojo indistinguible.**

**Arreglo aplicado:** el universo se le **pregunta al banco de pruebas** (`tabla-rutas.leer()`, que
lee el documento de Antonio y cuadra contra su propia cabecera), y cada script exige solo lo suyo:
tener alguna ruta. Las que faltan se **nombran** —«NO se resuelve: 1 — expectativa declarada, no un
hueco»— y se dice por escrito quién vigila ese número. ⛔ No es «bajar a 6»: no queda ningún literal
que pudrir.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una vigilancia duplicada no envejece igual que su original: el
original se actualiza con la decisión y la copia se queda dando un rojo que parece un hallazgo.**
⚠️ Y la regla práctica: antes de escribir un `A.exige` sobre una cantidad, preguntar **quién es el
dueño de ese número**. Si no eres tú, exige lo tuyo y NOMBRA al dueño.

**Traza:** `src/donde-falta.js` §A6 · `src/pasos.js` §C5 · el patrón sano ya estaba en
`src/nombrar-aceras.js:1073`

---

## [2026-08-08] — ⭐ HALLAZGO ATADO: la ruta 6 pasó de 412 a 438 m sin nombre y su contradictor llevaba dos días muerto

**Categoría:** número viejo publicado
**Síntoma:** al volver a medir §A6 —muerto desde el 6/08— **cinco de las seis rutas cuadran al
metro con lo publicado y la sexta no.**

```
   ruta 6   publicado en docs/H1-DONDE-FALTA-EL-NOMBRE.md §A6   412 m · 188 m con portales · 10 portales
            medido el 2026-08-08                                438 m · 207 m con portales · 11 portales
```

⭐ **Y está triangulado con un instrumento vivo:** `modelo-rutas.js` §D4 —que corre en cada
batería— publica hoy **438 m sin nombre para la ruta 6**. ⚠️ Y las dos cifras miden **lo mismo**: se
comprobó que las dos usan `new Set(['paso-de-peatones','escaleras'])`, el mismo filtro
`!nombre && !NO.has(precision)` y la misma suma de `largo`. No es una diferencia de definición.

**¿El 412 fue cierto alguna vez? SÍ, y consta.** `docs/H1-MODELO-VIA-FORMA-PAPEL.md` §D4, publicado
el **2026-08-04 a las 15:15:16**, da para la ruta 6 exactamente **412 m sin nombre**. Los dos
instrumentos coincidían aquel día. ⇒ **no nació desmentido: envejeció.**

```
   2026-08-04 15:15:15   nace §D4 en modelo-rutas.js          (e39e98a)
   2026-08-04 15:15:16   se publica §D4 con «6 → 412»         (db563e4)
   2026-08-04 15:45:13   nace §A6 en donde-falta.js           (68ce4ec)
   2026-08-04 16:07:22   se publica §A6 con «6 → 412»         (c8d43ba)
   2026-08-06            la ruta nº1 deja de resolverse       (c6f7f41)  ⇒ §A6 MUERE
   2026-08-08            §A6 revive y dice 438
```

⚠️ **Y hay una segunda diferencia en la misma fila, que la tanda 3 va a necesitar:** aquel día la
ruta 6 ganaba `221 m` de vía municipal (53,6 %, **0 con asignación propia**); hoy `modelo-rutas.js`
§D4 le da `438 m` (100,0 %). ⇒ lo que se movió no es solo el reparto de «sin nombre».

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo, y no había otra:** el único
instrumento que compara §A6 con la realidad **es §A6**, y estaba muerto. `modelo-rutas.js` seguía
dando 438 en cada batería sin que nadie comparase ese 438 con el 412 impreso en otro documento —
porque **comparar dos documentos entre sí no lo hace ningún script.**

**Arreglo aplicado:** ⛔ **NINGUNO, y es deliberado.** Republicar `docs/` es la tanda 3. Aquí queda
**atado** para que esa tanda pueda hacerlo sin volver a medir: los tres números publicados, los tres
medidos, la triangulación con `modelo-rutas.js §D4`, la prueba de que el 412 fue cierto, y la fecha
exacta desde la que §A6 dejó de poder contradecirlo.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **ley 110 con su primer caso confirmado: lo que mentía no era un
número — era un `✅` que seguía ahí.** El 412 no era falso cuando se escribió y nadie lo tocó nunca:
se quedó viejo mientras el único que podía desmentirlo llevaba dos días imprimiendo `NO CONSTA` con
la batería dándolo por bueno.
⚠️ Y lo que esto añade: **un documento no puede envejecer solo. Envejece cuando muere su
contradictor**, y por eso lo que hay que vigilar no es el número publicado, sino que su instrumento
siga vivo.

**Traza:** `docs/H1-DONDE-FALTA-EL-NOMBRE.md` §A6 (no tocado) ·
`docs/H1-MODELO-VIA-FORMA-PAPEL.md` §D4 (no tocado) · `src/modelo-rutas.js` §D4

---

## [2026-08-08] — El puntero iba a marcar «182 → 232» al lado de un listón de 182 m

**Categoría:** identidad falsa
**Síntoma:** la primera versión de `src/superados.js` buscaba cada valor superado como CIFRA
—`(?<![\d.,])182(?![\d.,])`— y daba por suya toda aparición. El guardián dio su rojo, `41`
apariciones sin puntero, y el generador estaba listo para escribir la cabecera. Miré las líneas
antes de escribir, y dos de esas 41 son **otro número**:

```
   ⛔ H1-ACERA-EQUIVOCADA.md:324    ⭐ listón (p99 de la propia distribución)   182 m
   ⛔ H1-DONDE-FALTA-EL-NOMBRE.md:201  | rural · Movera | 57 | 8,15 km | 182 | 41,3 % |
```

Y con el `412` lo mismo: tres apariciones son la ruta 6 (`H1-DONDE-FALTA` §A6,
`H1-MODELO-VIA-FORMA-PAPEL` §D4, `H1-NOMBRAR-ACERAS`), y **tres no lo son** — `412× el azar` dos
veces en `H1-CIERRE.md` y un `412 (97,2 %)` en `H1-ULTIMOS-CABOS.md`.

⇒ **Una cifra desnuda no es una identidad.** Y aquí eso no es un falso positivo cualquiera: el
instrumento estaba a punto de **escribir una afirmación falsa dentro de un registro histórico**,
que es exactamente lo que la ley de esta tanda —*marcar no es corregir*— existe para impedir.

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **todo lo que el fichero comprueba
de sí mismo.** D1 encontró sus 41 · D2 dio 0 · la ley 109 dio 0 vallas impares · la contraprueba de
idempotencia estaba escrita · y el control del buscador de cifras —«3182» no cuenta, «-0.89182» no
cuenta— **daba ✅ y era cierto**. El buscador funcionaba perfectamente. Lo que fallaba no era
encontrar el número: era **suponer que encontrar el número es encontrar el dato**.
⚠️ Y una tercera cosa verde: el positivo de control del cruce (`98.774` sale, un inventado no sale).
Un control de que el buscador LEE no dice nada de si lo que lee es lo mismo.

**Arreglo aplicado:** cada par lleva ahora un `contexto` —la marca que la línea tiene que llevar
ADEMÁS de la cifra— y un `ajenos` declarado: **cuántas apariciones de esa misma cifra son otro
número**. Si mañana ese recuento se mueve, el guardián lo dice y alguien mira. ⛔ Las ajenas **no se
marcan y no se tocan**: se nombran.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una cifra no identifica un dato: lo identifica la cifra MÁS su
contexto.** Un barrido que solo casa el número tiene una precisión que nadie ha medido, y en un
instrumento que sólo LEE eso es ruido — pero en uno que ESCRIBE es una mentira nueva, publicada,
con formato de corrección.
⚠️ Corolario, y es el que me importa: **el riesgo de un instrumento no está en lo que mide, está en
lo que hace con lo medido.** El mismo barrido, con la misma precisión, es aceptable auditando e
inaceptable marcando.

**Traza:** `src/superados.js` · `docs/H1-ACERA-EQUIVOCADA.md:324` (no tocado) ·
`docs/H1-CIERRE.md:367` (no tocado)

---

## [2026-08-08] — El buscador de valores superados no encontraba dos de nueve: llevaban una coma detrás

**Categoría:** silencio falso
**Síntoma:** `src/superados.js` busca cada valor superado con guardas a los dos lados para no
casar dentro de otra cifra:

```js
   new RegExp('(?<![\d.,])' + valor + '(?![\d.,])');
```

La tanda 4 metió el primer par que **no es un número pelado**: `6 km/h → 5,0 km/h`. Y con la
guarda de cola puesta siempre, la expresión pide que detrás de la `h` **no** haya coma —
así que estas dos líneas, que dicen exactamente lo que se busca, **no salían**:

```
   ⛔ H1-NOMBRES-Y-PASOS.md:365   ⚠️ el tiempo es una estimación a 6 km/h, la velocidad de Antonio…
   ⛔ H1-VER-RUTAS.md:92          ⚠️ el tiempo es una estimación a 6 km/h, la velocidad de Antonio…
```

⇒ el barrido daba **7 apariciones en 5 documentos**. Son **9 en SEIS**. Y la tanda decía
«los seis documentos»: **el número de Antonio era el correcto y el de mi instrumento no.**

**Qué se probó y DIO VERDE mientras el fallo estaba vivo:** ⭐⭐ **el control del buscador de
cifras, y era cierto.** `«3182»` no cuenta ✅ · `«-0.89182»` no cuenta ✅ · `«182 líneas»` sí
✅. Las guardas hacían exactamente lo que se probó que hacían. Y el recuento cerrado (D3)
también daba ✅, porque yo declaré `propias: 7` **después** de leer lo que el propio barrido
me enseñó: **el mundo cerrado confirma el barrido contra sí mismo**, no contra el documento.
⚠️ Y una tercera: D1 dio su rojo con 5 documentos y parecía completo.

**Arreglo aplicado:** las guardas pasan a ser **condicionales** — la de cabeza solo si el
valor empieza por dígito, la de cola solo si termina en dígito. Fuera de eso estorban.

**Commit:** (este commit)

**Ley que sale de aquí:** ⭐⭐⭐ **una guarda que protege de un falso positivo compra el falso
negativo del otro lado, y el falso negativo no se ve.** La guarda de cola existía para que
`182` no casara dentro de `182,5`; el precio fue que `6 km/h,` dejara de casar, y ese precio
**no lo paga nadie que mire la salida** — sale un número más pequeño y parece limpio.
⚠️ Y el corolario, que es el que me importa: **un recuento cerrado declarado a partir de lo
que midió el propio barrido no es un guardián: es un eco.** Solo empieza a valer cuando el
número viene de fuera — aquí vino de Antonio, y por eso se vio.

**Traza:** `src/superados.js` · `docs/H1-NOMBRES-Y-PASOS.md:365` (no tocado) ·
`docs/H1-VER-RUTAS.md:92` (no tocado)
