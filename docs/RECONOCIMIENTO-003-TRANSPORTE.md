# Reconocimiento de 003_ZETABUS — los datos de transporte

**Fecha del reconocimiento:** 2026-08-02
**Carpeta reconocida:** la carpeta local de `003_ZETABUS`, fuera de este repositorio.
**Modo:** SOLO LECTURA. No se ha escrito, movido, borrado ni ejecutado nada dentro de 003. Ningún
`npm`, ningún build, ningún script, ninguna petición de red. Los únicos comandos de git usados
fueron `status --porcelain`, `log`, `describe`, `ls-files` y `check-ignore`.
**Registro histórico fechado.** Este documento se añade, no se reescribe.

> **Veredicto en una línea:** el transporte de Zaragoza está aquí y está **completo** —bus,
> **tranvía incluido**, y con `shapes.txt`, que es la primera geometría de línea localizada en
> los dos reconocimientos—. Pero **nada de eso viaja en el repositorio**: las cuatro piezas de
> valor están gitignoreadas, y la buena es el ZIP crudo, no el artefacto cocinado.

---

## 0 · Estado de 003 antes de tocar nada

Primera costura de la tanda, ejecutada antes que cualquier otra cosa:

```
git -C <ruta local de 003> status --porcelain
   → (salida vacía)      exit 0
```

**Limpio.** Nada sin commitear. No hay trabajo de Antonio en riesgo y no se ha tocado nada.

```
git describe --tags   →  v1.0.0-113-gebfd1b2
git log --oneline -1  →  ebfd1b2 docs(bitacora): Fase 55 - la verificacion externa al README raiz
```

Observación menor, sin consecuencia para esta tanda: HEAD está **113 commits por delante del tag
`v1.0.0`**. Son fases de documentación y bitácora posteriores al cierre (fases 53-55, verificación
externa). El proyecto está cerrado y sigue recibiendo documentación, que es coherente con su
método.

---

## A · ⭐ ¿Está el GTFS crudo en disco?

### **SÍ, está. Y está GITIGNOREADO.**

| | |
|---|---|
| **Ruta exacta** | `data/gtfs/zaragoza-gtfs.zip` |
| **Peso** | **6.883.311 b (6,88 MB)** comprimido · **51.402.822 b (51,4 MB)** descomprimido |
| **Formato** | `.zip` sin descomprimir en disco |
| **Fecha del fichero** | **2026-08-01** (ayer — lo refrescó el último build) |
| **¿Versionado?** | ❌ **NO. GITIGNOREADO.** |

**Evidencia del estado de versionado** (las dos comprobaciones, no una):

```
git ls-files --error-unmatch data/gtfs/zaragoza-gtfs.zip
   → error: pathspec ... did not match any file(s) known to git    (exit 1)

git check-ignore -v data/gtfs/zaragoza-gtfs.zip
   → .gitignore:115:/data/gtfs/*    data/gtfs/zaragoza-gtfs.zip    (exit 0)
```

### Y no es un descuido: es una decisión argumentada

`data/gtfs/README.md` lo razona en detalle. Resumido, con sus palabras:

> *"La licencia lo permitiría. […] **No es un problema legal.** El motivo es de frescura, y es más
> serio: **Caduca** […] Un ZIP versionado no caduca: se queda ahí, pareciendo válido, mientras
> alguien construye contra él. **Cambia.** Avanza lo republica cada pocos meses. **Pesa 6,6 MB**
> de binario. Git guarda **todas** las versiones, para siempre."*

El `.gitignore` de 003 (9.318 b) está comentado línea por línea y distingue datos curados de
derivados. Es de lo mejor del proyecto — pero para 004 el efecto práctico es el mismo:
**clonar ZetaBus no trae el GTFS.**

### Cómo se obtiene, leído del código (NO ejecutado)

`scripts/fetch-gtfs.ts:51` construye la URL:

```
https://nap.transportes.gob.es/api/Fichero/download/${FILE_ID}
```

`FILE_ID` = **1176**, «Transporte urbano de Zaragoza» en el Punto de Acceso Nacional. Requiere
cabecera `ApiKey` con la variable `NAP_API_KEY` (`fetch-gtfs.ts:123,163`). El script **falla
cerrado**: sin clave no descarga y no continúa (`fetch-gtfs.ts:26` — *"⚠️ FALTA `NAP_API_KEY` →
MUERE SIEMPRE, aunque el zip esté"*).

**Consecuencia para 004:** para tener el feed hay dos caminos, y ninguno es clonar 003. O bien
004 se registra en el NAP y descarga el fichero 1176 con su propia clave, o bien se copia el ZIP
desde esta máquina — sabiendo que se copia un dato que caduca el 05/10/2026.

---

## B · ⭐ Contenido completo del feed

`unzip -l data/gtfs/zaragoza-gtfs.zip` — **8 ficheros**, listados sin extraer nada:

| Fichero | Peso | Fecha interna | Filas de datos |
|---|---:|---|---:|
| `agency.txt` | 429 b | 2026-06-23 | 2 |
| `calendar_dates.txt` | 729.890 b | 2026-06-30 | **27.161** |
| `feed_info.txt` | 244 b | 2026-06-23 | 1 |
| `routes.txt` | 3.430 b | **2025-09-23** | **52** |
| `shapes.txt` | 1.408.077 b | 2026-06-23 | **27.603** |
| `stops.txt` | 99.309 b | 2026-06-23 | **984** |
| `stop_times.txt` | 47.049.063 b | 2026-06-30 | **870.717** |
| `trips.txt` | 2.112.380 b | 2026-06-30 | **34.427** |

### Presencia expresa de los ficheros que pedía la tanda

| Fichero | ¿Está? |
|---|---|
| `stops.txt` | ✅ **SÍ** |
| `routes.txt` | ✅ **SÍ** |
| `trips.txt` | ✅ **SÍ** |
| `stop_times.txt` | ✅ **SÍ** |
| `shapes.txt` | ✅ **SÍ** ⭐ |
| `calendar_dates.txt` | ✅ **SÍ** |
| **`calendar.txt`** | ❌ **NO EXISTE** |
| `frequencies.txt` | ❌ NO |
| `transfers.txt` | ❌ NO |

**`calendar.txt` no está.** Todo el calendario se define por excepciones en `calendar_dates.txt`,
y las 27.161 filas son **todas de `exception_type=1`** (añadir servicio); ni una de tipo 2. Es un
patrón válido en GTFS —servicios definidos día a día— pero significa que no hay patrón semanal
que leer: hay 457 fechas y 1.458 `service_id`.

**Contadores de control cruzados, los tres cuadran:**

- `trips.txt` → 34.427 viajes · `stop_times.txt` → **34.427 `trip_id` distintos** ✓
- `shapes.txt` → 89 `shape_id` definidos · `trips.txt` → **89 `shape_id` distintos usados** ✓
- `shapes.txt` → 27.603 filas de datos · `wc -l` → **27.604** (= datos + cabecera) ✓

**Curiosidad sin consecuencia práctica:** `routes.txt` lleva fecha interna **2025-09-23**, nueve
meses anterior al resto del feed. El catálogo de líneas no se ha regenerado desde entonces;
horarios y viajes sí. No es un fallo —las líneas cambian poco— pero conviene saber que el fichero
de rutas es notablemente más viejo que el feed que lo contiene.

### ⭐ El feed incluye TRANVÍA

`agency.txt` trae **dos agencias**, y esto no lo esperaba el encargo:

```
1,Avanza Zaragoza S.A.U.,http://zaragoza.avanzagrupo.com/,Europe/Madrid,es,...
11,Tranvías Urbanos de Zaragoza S.L.,https://www.tranviasdezaragoza.es,Europe/Madrid,es,...
```

Y el `feed_version` lo dice en el nombre: **`20260623_AUZSA_Y_TRANVIA`**.

Desglose real por agencia y tipo de ruta:

| agency_id | route_type | Rutas |
|---|---|---:|
| 1 (Avanza) | 704 (bus local) | **52** |
| 11 (Tranvías) | 900 (tram) | **1** |

La ruta de tranvía es `210 · TRA · Tranvía L1 Valdespartera - Actur - Parque Goya`, con **5.107
viajes** y **2 shapes** (`210_I` ida, `210_V` vuelta). El tranvía de Zaragoza está completo en
este feed: paradas, horarios y trazado.

---

## C · ⭐⭐ `shapes.txt` — SÍ EXISTE, y está sano

| Medida | Valor | Comando |
|---|---:|---|
| `shape_id` distintos | **89** | `awk` sobre col. 1 |
| Puntos totales | **27.603** | `awk NR>1` |
| Control de líneas | 27.604 (= 27.603 + cabecera) | `wc -l` |
| Shape con más puntos | `Route_66` → **1.176** | |
| Shape con menos puntos | `Route_302` → **66** | |

### ¿Los referencia `trips.txt` de verdad? **Sí, al 100 %, y sin huérfanos.**

```
trips: 34.427
  con shape_id: 34.427      sin shape_id: 0
  shape_id distintos usados: 89
```

**89 definidos = 89 usados.** Ni un shape huérfano, ni un viaje sin trazado. Muestra real:

```
shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled
Route_1,41.6380326942548,-0.898728536609159,1,
Route_1,41.6380525486537,-0.898710122712937,2,
```

Coordenadas en **WGS84 / EPSG:4326** — mismo sistema que los 46.150 portales del reconocimiento
anterior. Encajan sin reproyectar.

### ⚠️ Lo que `shapes.txt` NO trae: la distancia

`shape_dist_traveled` está **vacío en 27.603 de 27.603 filas** (0 con valor). Lo mismo en
`stop_times.txt`. La columna existe en la cabecera y el cuerpo no la rellena. Si 004 quiere el
coste en metros de un tramo, lo calcula él desde las coordenadas. Está en la bitácora.

### ⚠️⚠️ El artefacto horneado NO lleva esta geometría

`src/generated/gtfs.json` tiene 74 `directions`, y sus campos son
`lineId, directionId, headsign, official, current`. `official.stops` es una **lista de `stop_id`**.
Contado: **0 de 74 directions con geometría de trazado.**

No es un descuido de 003: `ZETABUS-ESTADO.md:466` lo registra como cabo abierto deliberado —
*"Dibujar el trazado teórico con la línea desviada sería una mentira nueva. **No dibujar nada no
engaña a nadie.**"* 003 sufre desvíos por obras que el GTFS no refleja, y prefirió no pintar.

**Para 004 la conclusión es operativa: el candidato al trasplante es el ZIP, no el artefacto.**
Tomar `gtfs.json` porque "ya está cocinado" costaría la única geometría de línea encontrada en
los dos reconocimientos. Está en la bitácora.

### Otras fuentes de trazado en el repo

Existen KML cacheados del recorrido real de Avanza, pero **son caché efímera, no dato estable**:
viven en `.cache/recorrido/` (dentro de un `.cache/` con 1.899 ficheros), y
`THIRD-PARTY-NOTICES.md:90` los clasifica en el bloque *"⛔ Servicios internos de Avanza —
CONSUMIDOS, NUNCA REDISTRIBUIDOS"*. **No son trasplantables**, ni técnica ni legalmente.

---

## D · ⭐ Caducidad real

### **5 de octubre de 2026.** Confirmada contra el fichero, por dos vías independientes.

`feed_info.txt` completo (244 b, es una sola fila de datos):

```
feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,feed_end_date,feed_version,feed_contact_email
Avanza Zaragoza S.A.U,http://zaragoza.avanzagrupo.com/,es,20260623,20261005,20260623_AUZSA_Y_TRANVIA,...
```

→ `feed_start_date: 20260623` · **`feed_end_date: 20261005`**

Y el artefacto de 003, generado independientemente:

```json
"validity": {"startDate":"2026-06-23","endDate":"2026-10-05","version":"20260623_AUZSA_Y_TRANVIA"}
```

### Contraste con lo que afirma ZETABUS-ESTADO.md

`ZETABUS-ESTADO.md:478` afirma **"Caduca el 05/10/2026"**. Y `:2539` afirma
**"`44 líneas · 934 paradas` · feed `20260623_AUZSA_Y_TRANVIA` vigente (23/06→05/10)"**.

**Coincide exactamente con el fichero.** Ninguna discrepancia.

### Pero `calendar_dates.txt` no termina ahí

| Medida | Valor |
|---|---:|
| Filas de datos | 27.161 |
| Fechas distintas | 457 |
| `service_id` distintos | 1.458 |
| **Fecha mínima** | **20250916** |
| **Fecha máxima** | **20261231** |

El calendario se extiende **casi tres meses más allá del `feed_end_date`**. Ahora bien, medido el
volumen, la caducidad declarada es real en la práctica:

| Corte | Filas |
|---|---:|
| Anteriores a hoy (20260802) | 10.101 |
| Desde hoy en adelante | **17.060** |
| **Posteriores al 05/10/2026** | **72** (0,26 %) |

Las 72 filas residuales son **una por fecha**, salteadas hasta el 31/12 (20261006, 20261007, …,
20261231). Servicios especiales sueltos. **El feed no se degrada poco a poco: se vacía el 5 de
octubre.**

### Estado a día de hoy

**VIGENTE.** Hoy es 2026-08-02: quedan **64 días**. No hay que parar por caducidad presente.

⚠️ Pero el aviso del encargo se confirma con números: si Desplázame se construye en
agosto-septiembre contra este ZIP y no se refresca, **el 5 de octubre se queda sin horarios** —
justo cuando se mira un portfolio después del verano. El feed hay que volver a descargarlo, no
copiarlo y olvidarlo.

---

## E · `stops.txt` y el puente de identidad

### **984 paradas.** No 934.

| Medida | Valor | Comando |
|---|---:|---|
| Líneas totales | **985** | `wc -l` |
| Registros (contador independiente) | **984** | `awk END{print NR-1}` |

**Columnas exactas (11):**

`stop_id` · `stop_code` · `stop_name` · `stop_desc` · `stop_lat` · `stop_lon` · `zone_id` ·
`stop_url` · `location_type` · `parent_station` · `stop_timezone`

**Tres filas reales:**

```
16487,PA00002,"Agustín Príncipe N. º 2",,41.6531939858244,-0.92360279869157,,,,,Europe/Madrid
16488,PA00004,"Alfred Nobel / Monasterio",,41.6519129304332,-0.921246958013683,,,,,Europe/Madrid
16492,PA00006,"Alfred Nobel / Vía Hispanidad",,41.651746584933,-0.92020616070687,,,,,Europe/Madrid
```

**Sí trae `stop_code`**, y es la columna 2.

### ⭐ El puente `poste = int(stop_code[2:])`, verificado contra el fichero

```
total: 984
cumplen ^PA[0-9]+$ : 934
NO cumplen:          50
```

**Las 934 del estado son correctas — y son 934 de 984.** Las 50 restantes son las del tranvía, y
su `stop_code` es numérico de cuatro dígitos:

```
NO CUMPLE: 0101 | Avenida de la Academia
NO CUMPLE: 0201 | Parque Goya
NO CUMPLE: 0301 | Juslibol
NO CUMPLE: 1101 | Plaza del Pilar - Murallas
```

**El puente aplicado al tranvía no falla: miente.** `int("0101"[2:])` = `int("01")` = **1**, un
número plausible y falso. Y `0101` → 1 colisiona con `1101` → 1.

**Esto NO es un fallo de 003.** `ZETABUS-ESTADO.md:487` afirma *"934/934, verificado en cada
build"* y es literalmente cierto: el artefacto de 003 carga 934 paradas y todas cumplen. Además
`:467` declara explícitamente *"Tranvía / multimodal → **Es el 004**"*. 003 sabía dónde estaba su
frontera y la escribió.

**Sería un fallo de 004** si heredara la regla sin su guarda. Está en la bitácora, y la condición
de trasplante es: la regla se toma **solo** para `stop_code` que casen `^PA[0-9]+$`.

### Encoding

UTF-8 correcto, sin caracteres rotos. Nombres reales con tilde y eñe:

```
"Agustín Príncipe N. º 2"    "Alfred Nobel / Vía Hispanidad"
"León Moyano / Alhama De Aragón"    "Andrés Vicente N.º 25"
```

⚠️ Pero el **dato de origen** trae defectos de capitalización: `"Miguel ángel Blanco N.º 53"`
(`á` minúscula donde toca `Á`) y `"Alhama De Aragón"`. Es el mismo patrón que
`ANDADOR ABOGACíA TURNO DE OFICIO` del callejero municipal, en otra fuente independiente. En la
bitácora.

---

## F · Artefactos horneados por el build

**Leído de `package.json` y del código. No se ha ejecutado nada.**

La cadena de build es:

```
build = version:build → gtfs:fetch → nombres:ensure → data:build → correspondencias:ensure → next build
```

| Artefacto | Peso | Lo genera | Versionado |
|---|---:|---|---|
| `src/generated/gtfs.json` | 1.943.013 b | `scripts/build-data.ts` (`data:build`) | ❌ **GITIGNOREADO** `.gitignore:69` |
| `src/generated/nombres.json` | 35.688 b | `scripts/build-nombres.ts` / `ensure-nombres.ts` | ❌ **GITIGNOREADO** `.gitignore:69` |
| `data/generated/correspondencias.json` | 95.310 b | `scripts/build-correspondencias.ts` | ❌ **GITIGNOREADO** `.gitignore:73` |
| `data/generated/correspondencias.json.bak` | 95.310 b | copia de seguridad (2026-07-25) | ❌ GITIGNOREADO |
| `data/flota-avanza-zaragoza.json` | 537.694 b | `scripts/build-flota.ts` | ✅ **VERSIONADO** (excepción `.gitignore:85`) |

El `.gitignore:66-68` explica por qué `src/generated/` no se versiona:

> *"⛔ `src/generated/` es ARTEFACTO DE BUILD: sale del GTFS, que no se versiona. Versionarlo
> sería subir el GTFS por la puerta de atrás, y encima cocinado."*

### Esquema de `src/generated/gtfs.json`

```
generatedAt   : "2026-08-01T09:54:11.986Z"
modes         : ["bus"]                       ← UN SOLO MODO
validity      : {startDate, endDate, version, publisher}
stops         : array n=934
lines         : array n=44
directions    : array n=74                    ← 0 con geometría
posteByStopId : objeto, 934 claves
nombresControl: {comparables: 918, distintos: 725}
flota         : objeto, 403 claves
```

Un `stop` real, con su procedencia dentro (esto está muy bien hecho):

```json
{"id":"16487","code":"PA00002","name":"Agustín Príncipe n. º 2",
 "nombreProc":{"fuente":"avanza-web","fecha":"2026-08-01T09:51:51.126Z"},
 "position":{"lat":41.6531939858244,"lon":-0.92360279869157},
 "modes":["bus"],
 "provenance":{"source":"gtfs-nap","observedAt":"2026-08-01T09:54:11.986Z",
               "sourceUpdatedAt":"2026-06-23","url":"https://nap.transportes.gob.es",
               "confidence":"oficial"}}
```

### ⚠️ El artefacto es 100 % bus — el tranvía se descarta al cocinar

Verificado limpiamente:

```
modos distintos en lines:        ['bus']
lines con shortName 'TRA':       0
lines con id 210:                0
stops con code no-PA:            0
total lines: 44   |   stops: 934
```

El feed trae 52 rutas de bus + 1 de tranvía; el artefacto trae 44 lines, todas bus. Se pierden el
tranvía **y** 8 rutas de bus (previsiblemente sin servicio activo — no lo he verificado).

**Es la diferencia que decide el trasplante:** ZIP crudo = bus + tranvía + trazado. Artefacto =
bus, sin trazado.

---

## G · ⭐ La capa de nombres

| | |
|---|---|
| **Fichero** | `src/generated/nombres.json` |
| **Peso** | 35.688 b |
| **Formato** | JSON: `{generatedAt, fuente, url, porPoste, discrepancias, contadores}` |
| **Nombres contenidos** | **927** (en `porPoste`, mapa `poste → nombre`) |
| **¿Lleva fecha dentro?** | ✅ **Sí:** `generatedAt: "2026-08-01T09:51:51.126Z"` |
| **Versionado** | ❌ **GITIGNOREADO** `.gitignore:69` |
| **¿Estático o contra red?** | ⚠️ **Se regenera contra la red** |

**Fuente declarada dentro del propio fichero:**

```
fuente: "avanza-web"
url:    "https://zaragoza.avanzagrupo.com/wp-admin/admin-ajax.php?action=get_stops_list"
```

**Contadores internos:** `{esperadas: 74, respondidas: 74, fallidas: 0, postesConNombre: 927,
vacios: 0}` — son 74 peticiones paginadas al endpoint de Avanza. El `generatedAt` de ayer confirma
que se rehace en cada build (`nombres:ensure` va dentro de `npm run build`).

**Cómo marca lo no confirmado:** el campo `discrepancias` es un **array vacío** en la copia
actual. El marcado de "⚠ nombre sin confirmar" no vive en este fichero, sino que se deriva al
hornear: `gtfs.json` guarda `nombresControl: {comparables: 918, distintos: 725}`, y cada `stop`
lleva su `nombreProc` con fuente y fecha. Según `ZETABUS-ESTADO.md:65,1267`, el aviso *"nombre sin
confirmar"* **baja de 934 paradas a 16** cuando la tabla está presente. Los 927 nombres cubren 927
de los 934 postes de bus: **7 sin nombre propio**.

### Por qué es la pieza más valiosa… y la más difícil de trasplantar

**725 de 918 nombres comparables (79 %) difieren** entre el GTFS y lo que el operador publica en
su web. No es un retoque cosmético: es que cuatro de cada cinco rótulos del feed oficial no son
los que el operador usa de cara al público.

Pero arrastra tres cosas a la vez:

1. **Es un derivado de red, no un dato estable.** Se regenera raspando `get_stops_list` de Avanza.
2. **Está gitignoreado**: no existe en un clon.
3. **`THIRD-PARTY-NOTICES.md:90` clasifica `zaragoza.avanzagrupo.com/wp-admin/admin-ajax.php` en
   el bloque "⛔ Servicios internos de Avanza — CONSUMIDOS, NUNCA REDISTRIBUIDOS".** El fichero
   `nombres.json` es producto directo de ese servicio.

Ese punto 3 es el que manda, y por eso la recomendación del punto J no es "tomar".

---

## H · Tranvía y BiZi en 003

**Positivo de control primero**, antes de afirmar ninguna ausencia:

```
grep -ril "tranv"  (excl. node_modules/.git/.next/.cache/.tmp)  → 34 ficheros   ← el grep FUNCIONA
```

| | Resultado |
|---|---|
| **Tranvía** | ✅ **SÍ hay, y más de lo esperado.** En el **GTFS crudo**: agencia 11 (Tranvías Urbanos de Zaragoza S.L.), ruta `210 TRA` tipo 900, **50 paradas**, **5.107 viajes**, **2 shapes** con trazado completo. En el **producto de 003**: nada — el artefacto es `modes: ["bus"]`. `ZETABUS-ESTADO.md:467` lo declara: *"Tranvía / multimodal → Es el 004"*. Incluso hay un test (`tranvia-sin-tocar-el-nucleo`, `:1888`) que prohíbe la palabra en el núcleo. |
| **BiZi** | ❌ **CERO.** `grep -ril "\bbizi\b\|bicicleta\|bike.?sharing"` → **0 ficheros**, con el instrumento ya validado por el control de arriba. Ni dato, ni mención, ni maqueta. |

**Para 004:** el tranvía viene gratis dentro del mismo ZIP que el bus. **BiZi hay que buscarlo
fuera; en los dos reconocimientos hechos no ha aparecido ni una vez.**

---

## I · Refresco y licencias

### Qué se refresca, y cómo

Hay que separar dos mecanismos que es fácil confundir:

**1 · El GTFS se redescarga en CADA BUILD**, no por cron. `npm run build` ejecuta `gtfs:fetch`
antes que nada, que pide el fichero 1176 al NAP con `NAP_API_KEY`. Sin clave, muere.

**2 · El cron nocturno regenera OTRA cosa: el índice de correspondencias.** Leído de
`README.md:354-377` y `src/app/api/regenerar/route.ts` (sin ejecutar):

- Hostinger **no tiene SSH**, así que el cron solo puede pedir una URL: `POST /api/regenerar`.
- Lanza **74 peticiones** contra Avanza para saber qué líneas pasan de verdad por cada poste,
  desvíos incluidos.
- Responde `202` al instante y trabaja de fondo (~2 min).
- Protegido con `ZETABUS_REGEN_TOKEN`: **falla cerrado** (sin token → 503, no ejecuta nada),
  responde **401 y no 404** deliberadamente, y exige **POST, no GET**. El comentario del fichero
  razona las cuatro decisiones — es de lo más cuidado del proyecto.

### Licencias — lo que 004 heredaría

**GTFS del NAP** (`THIRD-PARTY-NOTICES.md:8-28`):

| | |
|---|---|
| Titular | Avanza Zaragoza S.A.U. (publicador) |
| Canal | Punto de Acceso Nacional · MITMS · fichero **1176** |
| Licencia | Licencia de datos abiertos del MITMS |
| ¿Redistribuir? | ✅ **Sí**, expresamente: *"Compartir (copiar, distribuir) los datos […] obtenidos del MITRAMS"*, incluyendo *"modificación, adaptación, extracción, reordenación y combinación"* |
| **Atribución exigida** | *«Powered by MITRAMS»* con enlace a `https://www.transportes.gob.es/`, **cita del MITMS como fuente**, e **indicación de si el dato es bruto o procesado**. Debe conservarse sin alterar la metainformación sobre fecha de actualización y condiciones de reutilización |

Texto exacto tal y como 003 lo publica:

> *Datos de transporte procesados a partir del GTFS publicado por Avanza Zaragoza S.A.U. en el
> Punto de Acceso Nacional. **Powered by [MITRAMS](https://www.transportes.gob.es/).***

**⛔ Servicios internos de Avanza** (`THIRD-PARTY-NOTICES.md:90-110`): `gps.avanzabus.com` y
`zaragoza.avanzagrupo.com/wp-admin/admin-ajax.php`, **más los KML de trazado**, están declarados
*"CONSUMIDOS, NUNCA REDISTRIBUIDOS"*, con compromiso escrito de dejar de consultarlos si Avanza o
el Ayuntamiento lo piden. **`nombres.json` y `correspondencias.json` salen de aquí.**

**OpenStreetMap** (`:136`): ODbL 1.0, atribución literal *«© **colaboradores** de OpenStreetMap»*
— y 003 anota que la palabra "colaboradores" no es opcional y que su ausencia **fue un
incumplimiento real**. Relevante si 004 usa teselas.

**Código de 003:** Apache 2.0 (`NOTICE`, `LICENSE`). Cubre el código fuente, no los datos.

**Resumen para 004:** redistribuir datos derivados del GTFS es **legal y está permitido
expresamente**, a cambio de tres obligaciones concretas (Powered by MITRAMS + cita del MITMS +
bruto/procesado). Redistribuir cualquier cosa que venga de los servicios internos de Avanza, **no**.

---

## J · ⭐⭐ Lista de candidatos al trasplante

**Es una PROPUESTA. No se ha copiado nada. Decide Antonio.**

Ordenada por valor para 004. Clasificación según la ley del trasplante: **DATO** (copiable) ·
**MAQUINARIA** (no copiable, 004 escribe la suya) · **DECISIÓN** (gratis).

| # | Pieza | Peso | Versionado en 003 | Qué aporta a 004 | ⚠️ Qué arrastra | Clase | Recomendación |
|---|---|---:|---|---|---|---|---|
| **1** | `data/gtfs/zaragoza-gtfs.zip` | 6,88 MB | ❌ ignorado | **Todo el transporte de un golpe**: 984 paradas (bus + tranvía), 52+1 líneas, 34.427 viajes, 870.717 horarios y —lo decisivo— **`shapes.txt` con 89 trazados reales y 27.603 puntos en WGS84** | **Caduca el 05/10/2026** (64 días). Obliga a `NAP_API_KEY` propia si se redescarga. Atribución MITMS obligatoria. `shape_dist_traveled` vacío: las distancias las calcula 004. Sin `calendar.txt` | **DATO** | ⚠️ **TOMAR — pero descargándolo, no copiándolo.** Es la pieza que desbloquea el modo transporte. Copiar el ZIP de esta máquina funciona hoy y crea un dato huérfano que se pudre en octubre. 004 debe registrarse en el NAP y pedir el fichero 1176 él mismo: es el mismo dato, con fecha propia y sin depender de 003 |
| **2** | La regla del puente `poste = int(stop_code[2:])` | — | (es código) | Traduce `stop_code` GTFS → número de poste de Avanza. Es el puente de identidad completo | **Solo vale para `^PA[0-9]+$`.** En las 50 paradas de tranvía devuelve números falsos y colisionantes, sin lanzar error | **DECISIÓN** | ✅ **TOMAR, con la guarda escrita.** Gratis, probada en 934 casos. Pero se copia la regla **y su dominio**: se aplica al bus, y el tranvía se identifica de otra forma |
| **3** | Las **decisiones y leyes** de 003 | — | ✅ versionado | El `.gitignore` comentado línea a línea, la separación dato curado / derivado, `provenance` dentro de cada registro, el fail-safe ruidoso ("un mapa vacío que no se queja es peor que un error"), el patrón de metadata con fuente + fecha + confianza | Nada. No caducan y no crean acoplamiento | **DECISIÓN** | ✅ **TOMAR TODO.** Es lo más barato y lo más valioso de esta lista |
| **4** | Los **textos de atribución** de `THIRD-PARTY-NOTICES.md` | 13.212 b | ✅ versionado | Redacción ya verificada de MITMS/MITRAMS y OSM, con la nota de que *«colaboradores»* no es opcional (fue incumplimiento real) | Hay que reescribirlos para 004 (cambia si el dato es bruto o procesado) | **DECISIÓN** | ✅ **TOMAR como plantilla.** Ahorra un incumplimiento ya cometido y ya pagado una vez |
| **5** | `src/generated/nombres.json` | 35.688 b | ❌ ignorado | 927 nombres de parada corregidos contra el operador. **725 de 918 (79 %) difieren del GTFS.** Arregla cosas como `"Miguel ángel Blanco"` → `"Miguel Ángel Blanco"` | ⛔ **Producto de un servicio interno de Avanza declarado "NUNCA REDISTRIBUIDO"** por el propio 003. Se regenera raspando 74 peticiones. Fecha dentro (2026-08-01) que envejece en silencio. No existe en un clon | **MAQUINARIA disfrazada de DATO** | ⚠️ **DEPENDE — y me inclino a NO TOMAR el fichero.** Es la pieza más tentadora y la más contaminada: parece un JSON estático y es la salida de un raspado con compromiso escrito de no redistribuir. Lo que sí se toma gratis es **la decisión**: "los nombres del GTFS están mal en un 79 % y hace falta una capa de presentación". Si 004 quiere la capa, que la construya contra una fuente que pueda publicar |
| **6** | `src/generated/gtfs.json` | 1,94 MB | ❌ ignorado | GTFS ya cocinado: 934 stops con `provenance`, 44 lines con color, `posteByStopId` | **Es bus y solo bus** (`modes:["bus"]`): pierde el tranvía y las 8 rutas restantes. **Cero geometría** en sus 74 directions. Lleva los nombres de Avanza dentro (mismo problema que #5). Congela decisiones de 003 | **MAQUINARIA** | ❌ **NO TOMAR.** Es el atajo que sale caro: ahorra un parseo de GTFS y cuesta el tranvía y el trazado, que es justo lo que 004 necesita. El ZIP crudo lo contiene todo y pesa 3,5× menos |
| **7** | `data/generated/correspondencias.json` | 95.310 b | ❌ ignorado | Qué líneas pasan de verdad por cada poste hoy, desvíos por obras incluidos. 927 postes | ⛔ Producto del barrido nocturno a Avanza — mismo bloque "nunca redistribuido". **Es dato de HOY**: caduca en un día, no en meses | **MAQUINARIA** | ❌ **NO TOMAR.** Un dato que envejece en 24 h no se trasplanta: se genera o no se tiene |
| **8** | `scripts/fetch-gtfs.ts` y demás pipelines | — | ✅ versionado | Descarga del NAP con fail-safe, mensajes de error redactados, manejo de 401/timeout | Acoplamiento a la estructura de 003. Si 003 cambia, 004 tendría una copia congelada sin saberlo | **MAQUINARIA** | ❌ **NO TOMAR el código. LEERLO, sí.** Lo que vale es cómo maneja los fallos: eso es DECISIÓN y se copia gratis |
| **9** | `data/flota-avanza-zaragoza.json` | 537.694 b | ✅ **versionado** | 574 vehículos: modelo, longitud, combustible | Nada relevante. Irrelevante para calcular rutas | **DATO** | ❌ **NO TOMAR.** Es de otro producto. Único candidato que sí viaja en un clon, y es el que menos falta hace |
| **10** | `.cache/` (KML de recorrido, fixtures) | 1.899 fich. | ❌ ignorado | Trazado real con desvíos | ⛔ Caché efímera + KML en el bloque "nunca redistribuidos" | **MAQUINARIA** | ❌ **NO TOMAR.** Ni técnica ni legalmente trasplantable |

### El resumen de la propuesta, en tres frases

**Lo que 004 necesita de verdad es un solo fichero: el GTFS 1176 del NAP** — y la recomendación es
descargarlo, no copiarlo, porque copiarlo funciona hoy y caduca el 5 de octubre sin avisar.

**Todo lo cocinado se rechaza**, no por desconfianza en 003 sino porque su cocina responde a
preguntas que 004 no tiene: le quitó el tranvía y le quitó el trazado, que es exactamente lo que
aquí hace falta.

**Y todo lo que son decisiones se toma entero y gratis**, incluida la que más va a doler
descubrir por cuenta propia: que cuatro de cada cinco nombres de parada del feed oficial no son
los que el operador usa en público.

---

## K · Qué NO he mirado (y por qué)

- **`ZETABUS-ESTADO.md` completo** (248.648 b, ~3.084 líneas). He hecho búsquedas dirigidas sobre
  shapes, caducidad, el 934 y el tranvía, y he leído los pasajes que salieron. **No lo he leído
  entero.** Puede afirmar cosas que no he contrastado.
- **Los 34 documentos de `docs/`**, incluida `docs/auditoriafinal/` completa. Solo he abierto lo
  imprescindible (`A-codigo-verificacion.md` y `E-operacion.md` aparecieron en un grep, no los he
  leído).
- **El código de los pipelines línea a línea.** De `fetch-gtfs.ts` he leído la URL, la clave y el
  manejo de errores; de `build-data.ts`, `build-nombres.ts` y `build-correspondencias.ts` **no he
  leído nada**. Ahí está la causa exacta de por qué el artefacto descarta el tranvía y por qué
  `discrepancias` está vacío. No he entrado porque el encargo pedía inventariar, no auditar 003.
- **`stop_times.txt` en detalle** (47 MB). Lo he recorrido por streaming para contar filas y
  `trip_id` distintos. **No he validado horarios, ni secuencias, ni buscado solapes.**
- **Las 8 rutas de bus que están en `routes.txt` y no en el artefacto.** Las he detectado (52 vs
  44) y no he averiguado por qué. Probablemente sin servicio activo; **es una suposición, no un
  dato**.
- **La geometría de los shapes por dentro.** Sé que hay 89 shapes y 27.603 puntos y que las
  coordenadas son WGS84 con el rango correcto. **No he verificado que los trazados sean continuos,
  ni que no salten, ni que cubran las 984 paradas.** Antes de construir sobre `shapes.txt` habría
  que comprobarlo.
- **Si el fichero 1176 del NAP tiene hoy una versión más nueva.** Requiere red y estaba prohibido.
- **`.tmp/` y `capturas/`.** Material de trabajo y evidencia visual de auditoría; irrelevante para
  transporte.

---

## Sobre la costura "si todo cuadra, sospecha"

El encargo avisaba de que la coincidencia perfecta entre un documento de 3.084 líneas y el disco
es más rara que la discrepancia. **No he encontrado ninguna afirmación falsa en
`ZETABUS-ESTADO.md`.** Para que eso se pueda juzgar, esto es exactamente lo que comprobé:

| Afirmación del estado | Verificación contra el fichero | Resultado |
|---|---|---|
| `:478` "GTFS del NAP (fichero 1176)" | `fetch-gtfs.ts:51` + `data/gtfs/README.md` | ✅ Correcto |
| `:478` "Caduca el 05/10/2026" | `feed_info.txt` → `feed_end_date: 20261005` | ✅ Exacto |
| `:487` "`poste = int(stop_code[2:])`. 934/934" | `awk` sobre las 984 filas de `stops.txt` → 934 cumplen | ✅ Cierto **en su universo** (934 = el bus); el feed tiene 984 |
| `:2539` "44 líneas · 934 paradas" | `gtfs.json` → `lines` 44, `stops` 934 | ✅ Exacto |
| `:2539` "feed `20260623_AUZSA_Y_TRANVIA` vigente (23/06→05/10)" | `feed_info.txt` → `feed_version` idéntico | ✅ Exacto |
| `:466` "el trazado en la vista de línea: cabo abierto, no dibujar nada" | `gtfs.json` → 0 de 74 directions con geometría | ✅ Coherente |
| `:467` "Tranvía / multimodal → Es el 004" | artefacto `modes: ["bus"]`, 0 lines de tranvía | ✅ Coherente |
| `:65,:1267` "el aviso baja de 934 a 16" | **NO VERIFICADO** — requiere ejecutar el build | ⬜ Citado como afirmación, no como hecho |
| `:351` "927 nombres" | `nombres.json` → `porPoste` con 927 claves | ✅ Exacto |
| `:158,:351` "918/934" | `gtfs.json` → `nombresControl.comparables: 918` | ✅ Exacto |

Nueve verificadas, nueve correctas; una no verificable sin ejecutar y marcada como tal.

Mi lectura de por qué cuadra, que es una opinión y no un dato: ese documento no es una
retrospectiva. Se escribió en caliente durante un mes, y los números que cita —927, 918/934,
44 líneas, 05/10— son los que sus propios artefactos guardan dentro. No está recordando: está
copiando de un fichero que se regenera en cada build.

**Lo que sí aparece, y no es una mentira del estado sino una trampa de la herencia, es el
`934/934`.** Correcto en 003 y engañoso leído desde 004, porque el denominador cambia al cambiar
de proyecto. Eso es la primera entrada de bitácora de esta tanda.

---

*Reconocimiento ejecutado el 2026-08-02 en modo lectura pura. `git status --porcelain` de 003
estaba limpio antes de empezar y no se ha ejecutado ningún comando de escritura, ningún script,
ningún build y ninguna petición de red. No se ha copiado ningún fichero de 003 a 004. 004 sigue
sin repositorio.*

> **Nota:** antes de publicar el repositorio se generalizaron **2 rutas locales de disco** en este
> documento. No se ha alterado ningún dato, número ni conclusión. Fecha de la redacción:
> 2026-08-02.
