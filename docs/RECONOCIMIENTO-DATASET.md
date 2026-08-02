# Reconocimiento del dataset heredado — DESPLÁZAME (004)

**Fecha del reconocimiento:** 2026-08-02
**Carpeta reconocida:** `01 ZGZ RADAR REACT` — una carpeta local de otro proyecto, fuera de este
repositorio.
**Modo:** SOLO LECTURA. No se ha creado, modificado, movido ni copiado ningún fichero en `E:\`.
**Registro histórico fechado.** Este documento se añade, no se reescribe.

> **Veredicto en una línea:** el dataset es una **nube de 46.150 puntos sin una sola arista**.
> No hay topología, no hay GTFS, no hay paradas, no hay tranvía y no hay BiZi. Lo que sí hay
> —callejero municipal completo y bien construido en WGS84— sirve como **origen y destino** de
> una ruta, no como el terreno por el que se camina.

---

## 0 · Qué es realmente esa carpeta

No es un "dataset preparado". Es un **proyecto Next.js 16 completo y en marcha**: 46 ficheros
TypeScript en `src/`, 34 documentos en `docs/`, historial git propio con último commit el
**2026-05-15** (`4deb8ae docs: actualiza internal datos bibliotecas riesgos post-HITO-0045`).
Los datos son una parte pequeña de él.

Su propósito era un **buscador de direcciones y servicios** de Zaragoza ("Radar ZGZ"), no un
calculador de rutas. Esa diferencia explica todo lo que falta: para geocodificar "calle X
número Y" basta un punto por portal. Las aristas no le hacían falta a nadie.

---

## 1 · ⭐ ¿HAY TOPOLOGÍA O SOLO PUNTOS?

### **SOLO PUNTOS.** Cero geometría de línea en toda la carpeta.

**Evidencia — barrido sobre todo el proyecto** (excluyendo `node_modules`, `.git`, `.next`):

```
grep -rl -E "LineString|MultiLineString|FeatureCollection|\"geometry\"|\"coordinates\":\s*\[\["
   → 0 ficheros
```

**Positivo de control del mismo grep** (obligatorio: un grep mal escrito devuelve cero y parece
buena noticia):

```
grep -rl "portalId"   → 8 ficheros
```

El instrumento funciona. Lo que no hay, no hay.

**Búsqueda por formato** — no existe ningún `.geojson`, `.shp`, `.osm`, `.pbf`, `.kml`, `.gpkg`
ni `.zip` en toda la carpeta. Los únicos formatos de datos son `.json`.

### La trampa concreta: `vias-zaragoza.json` NO contiene vías

Es el fichero que por nombre y por tamaño (1,0 MB) parecía la topología. **Es un catálogo de
nombres.** Sus 8 campos, verificados abriéndolo:

```json
{
  "id": "81",
  "codigoVia": "81",
  "nombre": "ANDADOR ABOGACíA TURNO DE OFICIO",
  "nombreCompleto": "AN ANDADOR ABOGACíA TURNO DE OFICIO",
  "nombrePublico": "ANDADOR ABOGACíA TURNO DE OFICIO",
  "nombrePublicoNorm": "andador abogacia turno de oficio",
  "tipoVia": "AN",
  "numPortales": 0
}
```

Ni una coordenada. 3.359 registros, 2 variantes de esquema (628 de ellos añaden `barrioRural` y
`barrioRuralLabel`).

Lo que refuerza el engaño: el `callejero-zaragoza.metadata.json` declara
`"sourceLayers": ["urbanismo:Vias", "urbanismo:Portales"]` sobre un **GeoServer WFS de
urbanismo**. La capa se llama `Vias` y viene de un servidor geográfico — pero el descargador
pidió solo los atributos alfanuméricos, y el metadata **no registra en ningún campo** que la
geometría se descartara. Está en la bitácora como caso nº1.

### Consecuencia directa para el motor

Sin aristas, un motor de rutas solo puede unir puntos con líneas rectas. Una recta entre dos
portales de Zaragoza atraviesa manzanas, las vías del tren y el Ebro. **La topología hay que
traerla de fuera.** Qué fuente y cómo es decisión de estrategia, no de esta tanda.

---

## 2 · ⭐ ¿QUÉ SISTEMA DE COORDENADAS?

### **WGS84 / EPSG:4326 (grados) en los tres datasets con coordenadas.** Sin excepciones.

Juzgado por los **valores**, no por el nombre de la columna:

| Dataset | 3 valores reales | Conclusión |
|---|---|---|
| **Portales** (`coordLat`/`coordLon`) | `41.639490, -0.869305`<br>`41.639528, -0.869189`<br>`41.639587, -0.869384` | Grados. Latitud ~41,6 y longitud ~-0,87 es Zaragoza en WGS84. En UTM 30N serían ~676.000 / ~4.610.000 m. |
| **Farmacias** (`lat`/`lon`) | `41.644929, -0.896366`<br>(bounds 41.605457→41.717045)<br>(bounds -1.025735→-0.780016) | Grados. Mismo orden de magnitud. |
| **Desfibriladores** (`coordinates.lat`/`.lon`) | `41.5833, -0.8172`<br>(bounds lat 41.5025→41.7624)<br>(bounds lon -1.0655→-0.7692) | Grados. Menos decimales (4 frente a 6): precisión ~11 m, coherente con haber salido de un PDF. |

**Confirmación cruzada:** el metadata del callejero declara `"crs": "EPSG:4326"` y un `bounds`
de `minLat 41.501989 / maxLat 41.774764 / minLon -1.160933 / maxLon -0.768544`. Recalculado
sobre los 46.150 registros: **coincide dígito a dígito**. Declaración y dato dicen lo mismo.

Ese bounds cubre el término municipal completo (incluidos los 16 barrios rurales), no solo la
ciudad — de ahí que llegue a 41,77 N.

**Ningún fichero mezcla sistemas.** Comprobado: 0 registros con coordenada no numérica en
portales, 3 farmacias sin coordenadas (declaradas en su metadata como `missingCoordinates: 3`).

---

## 3 · ⭐ ¿HAY GTFS?

### **NO. No existe GTFS de ningún tipo.**

No está `stop_times.txt`. No está `trips.txt`. No está `routes.txt`. No está `calendar.txt`.
No está `shapes.txt`. No hay ningún `.txt`, ningún `.zip` y ninguna carpeta de transporte en
toda la estructura.

**Evidencia:** el barrido por extensión sobre la carpeta completa devuelve **18 ficheros de
datos, todos `.json`** (listados en el árbol del punto 10). Y `grep -ril "gtfs|stop_times"`
sobre todo el proyecto: **0 coincidencias en datos**; solo aparece mencionado en documentos de
planificación (`docs/decisions/ADR-0005-estrategia-inicial-de-datos.md` y roadmaps), como algo
que se pensaba hacer.

`shapes.txt` merece mención aparte porque es justo lo que resolvería el punto 1: en un GTFS
municipal, `shapes.txt` **es** el trazado real de las líneas. No está.

**Rango de fechas de `calendar.txt`:** `NO CONSTA` — no existe el fichero.

---

## 4 · PORTALES

**46.150 registros.** Fichero: `portales-zaragoza.json` (10.835.605 bytes).

**Conteo y contador de control independiente:**

| Medida | Comando | Resultado |
|---|---|---|
| Registros parseados | `node -e "require(...).length"` | **46.150** |
| Declarado en metadata | `totalPortales` | **46.150** ✓ |
| Suma de `numPortales` en vías | `vias.reduce(...)` | **46.150** ✓ |
| Líneas del fichero | `wc -l` | **470.746** |
| Líneas esperadas según esquemas | ver desglose | **470.746** ✓ |
| `portalId` únicos | `new Set(...).size` | **46.150 de 46.150** (sin duplicados) |

El cuadre de líneas es el contador de control fuerte: sumando cada variante de esquema por su
número de campos (38.197×10 + 401×11 + 1.232×12 + 898×11 + 5.363×11 + 2×12 + 57×12 = 470.744)
más `[` y `]` = **470.746**. Coincide exacto con `wc -l`. Los dos números independientes valen.

**Nombre EXACTO de cada columna** (esquema base, 38.197 registros = 82,8 %):

`portalId` · `codigoVia` · `numero` · `displayNumber` · `sortNumber` · `coordLat` · `coordLon` · `numeroPolicia`

**El esquema NO es uniforme: hay 7 variantes.** Tres campos aparecen solo a veces:

| Registros | Campos adicionales |
|---:|---|
| 38.197 | (ninguno — esquema base) |
| 5.363 | `bloqueEscalera` |
| 1.232 | `calificacion`, `bloqueEscalera` |
| 898 | `letra` |
| 401 | `calificacion` |
| 57 | `letra`, `bloqueEscalera` |
| 2 | `letra`, `calificacion` |

Cualquier lectura tipada tiene que tratar `letra`, `calificacion` y `bloqueEscalera` como
opcionales.

**Tres filas de muestra (reales, sin retocar):**

```json
{ "portalId": "Portales.96724", "codigoVia": "40", "numero": "3",
  "displayNumber": "3", "sortNumber": 3,
  "coordLat": 41.63949, "coordLon": -0.869305, "numeroPolicia": "3" }

{ "portalId": "Portales.124518", "codigoVia": "40", "numero": "4",
  "displayNumber": "4", "sortNumber": 4,
  "coordLat": 41.639528, "coordLon": -0.869189, "numeroPolicia": "4" }

{ "portalId": "Portales.96698", "codigoVia": "40", "numero": "8",
  "displayNumber": "8", "sortNumber": 8,
  "coordLat": 41.639587, "coordLon": -0.869384, "numeroPolicia": "8" }
```

**Calidad geométrica:** 46.147 coordenadas únicas de 46.150 → solo **3 pares de portales
comparten punto exacto**. Para enganchar portales a un grafo, esto es una base limpia.

**Avisos que el propio dataset registra** (en su metadata, honestamente):
`"WFS devolvio features duplicadas en portales (descartadas: 239)"` y `"huerfanosReales=29"`.

### Ficheros derivados del callejero

- **`portales-zaragoza.by-street.json`** (12,9 MB): objeto con **2.731 claves** (`codigoVia`),
  cada una con `{codigoVia, portales:[...]}`. Es el mismo dato reindexado por calle. 2.731 =
  3.359 vías − 628 sin portales ✓ (cuadra con `totalStreetsWithPortales`).
- **`vias-zaragoza.search-index.json`** (860 KB): array de **3.359**, con `label`, `tokens[]`
  ya normalizados sin tildes, `tipoVia`, `numPortales`. Índice de búsqueda listo para usar.

---

## 5 · PARADAS DE BUS

### **NO HAY. Cero paradas de autobús en el dataset.**

No hay `stop_code`, no hay número de poste, no hay fichero de paradas.

**Evidencia:** el único rastro de "autobús" en `data/` son **21 registros de desfibriladores
cuyo titular es la empresa operadora**, no paradas:

```
HIT: Avanza Zaragoza || C/ Miguel Servet 199 || Zaragoza
HIT: Avanza Zaragoza || Pº Independencia 24-26 || Zaragoza
HIT: Avanza Zaragoza || Ctra Huesca Km 7,5. Pol. Ciudad Del Transporte C/p-a
```

Son desfibriladores instalados en cocheras y oficinas de Avanza. Nada más.

**Consecuencia:** el **puente de identidad de ZetaBus NO se hereda desde aquí**. No hay nada a
lo que puentear. Si Desplázame quiere paradas, las trae de otro sitio — probablemente del mismo
origen que usó 003.

> ⚠️ **Nota metodológica sobre este punto.** El primer intento de extraer el contexto de estos
> hits (`grep -o -E ".{45}(bizi|tranv|...).{45}"`) devolvió **cero resultados** aunque
> `grep -l` sí marcaba los ficheros: el patrón exigía 45 caracteres por delante y los matches
> caían más cerca del inicio de línea. Un silencio falso del instrumento, no una ausencia de
> dato. Se repitió con un parseo JSON real. Queda anotado porque es exactamente el fallo contra
> el que avisa el método: **el cero se comprueba, no se cree**.

---

## 6 · TRANVÍA y BiZi

### **NO ESTÁN. Ninguno de los dos. Cero registros, cero campos.**

- **Tranvía:** 3 coincidencias de la cadena `tranv` en todo `data/`, todas dentro de
  descripciones de ubicación de desfibriladores. Ningún dataset de paradas ni de trazado.
- **BiZi:** **0 coincidencias** de la cadena `bizi` en todo `data/`. Ni una.

### Lo que sí hay, y conviene no confundir: una maqueta sin datos detrás

`src/app/moverme/page.tsx` (9.151 bytes) es una página de navegación con tarjetas:

```
slug: "autobus"  → "Líneas, paradas y próximas llegadas"
slug: "tranvia"  → "Paradas, recorrido y tiempos de paso"
slug: "bizi"     → "Estaciones, bicis y anclajes disponibles"
slug: "taxi"     → "Paradas de taxi y disponibilidad cercana"
```

`find ./src/app/moverme -type f` devuelve **un único fichero**: ese `page.tsx`. No existen las
subrutas, no existen los datos, no existe ningún pipeline de sincronización para ellos
(`src/services/sync/` solo tiene farmacias, desfibriladores y callejero).

**Es maquetación de una intención, no una implementación.** Quien vea la carpeta por encima —o
lea los documentos de planificación, que hablan largo de movilidad— puede concluir que el
transporte está resuelto. No lo está: son cuatro tarjetas y cuatro descripciones.

---

## 7 · PUNTOS DE INTERÉS

**Dos datasets de servicios, con esquemas COMPLETAMENTE distintos.** Cada uno va por libre.

### Farmacias — 314 registros

`farmacias-zaragoza.json` (219 KB), **1 solo esquema**, 26 campos:

`id` · `source` · `sourceId` · `name` · `addressLabel` · `type` · `clasificacion` · `servicios[]` ·
`lat` · `lon` · `hasCoordinates` · `coordinatesSource` · `coordinatesConfidence` ·
`coordinatesLocked` · `phones[]` · `email` · `description` · `url` · `hasExtendedHours` ·
`extendedHoursText` · `scheduleSource` · `scheduleLocked` · `isPublicVisible` · `hiddenReason` ·
`qualityFlags[]` · `rawUpdatedAt`

Contadores del propio metadata, todos coherentes con lo recontado: 314 normalizadas, 311
publicables, 3 sin coordenadas, 126 sin horario, 188 con horario ampliado.

### Desfibriladores (DESA) — 781 registros

`desfibriladores-zaragoza.json` (1,1 MB), **1 solo esquema**, 23 campos:

`id` · `holder` · `holderDisplay` · `defibrillatorCount` · `locationDescriptionOriginal` ·
`locationText` · `scheduleText` · `phoneNumbers[]` · `postcode` · `address` · `addressDisplay` ·
`province` · `municipality` · `municipalityDisplay` · `coordinates{lat,lon}` · `source` ·
`postcodeCatalog` · `isVehicle` · `vehicleInfo` · `isTwentyFourHours` · `hasEmbeddedPhone` ·
`quality` · `searchText`

781 registros de 792 en el origen (11 descartados), 795 unidades totales, **76 son vehículos**
—y su metadata avisa de que en esos casos la dirección es la de la cochera, no la del DESA en
ruta—. También declara `exactCoordinateGroups: 29` (grupos que comparten coordenada exacta).

### Códigos postales — 33 registros

`codigos-postales-zaragoza.json` (6 KB), campos `postcode` · `label` · `areas[]` · `type`.
Es un catálogo operativo, y su propio fichero lo dice sin rodeos:
`"officialBoundary": false` y `"Este JSON no define límites geográficos oficiales."`

### ¿Comparten esquema? **No.**

Coordenadas: farmacias usa `lat`/`lon` planos; desfibriladores usa un objeto anidado
`coordinates{lat,lon}`; portales usa `coordLat`/`coordLon`. **Tres convenciones distintas para
el mismo concepto en el mismo proyecto.** Cualquier lectura unificada necesita adaptadores.

---

## 8 · PROCEDENCIA Y EDAD

Todo el dataset se generó en **3 días de mayo de 2026** y no se ha tocado desde entonces.
A fecha de hoy (2026-08-02) tiene **~2,5 meses**.

| Dataset | Origen (declarado) | Generado | Política declarada | Edad hoy |
|---|---|---|---|---|
| Callejero (vías + portales) | Ayuntamiento de Zaragoza — **IDEZar GeoServer WFS Urbanismo**, capas `urbanismo:Vias` y `urbanismo:Portales` | **2026-05-13** 07:11 UTC | `mensual` | **~2,5 meses — 2 refrescos vencidos** |
| Enriquecimiento territorial | **OpenStreetMap Nominatim** (reverse), ODbL 1.0 | **2026-05-14** 19:59 UTC | (no declara) | ~2,5 meses |
| Farmacias | Sede Electrónica Ayto. Zaragoza (`farmacia.json?tipo=all&rows=1000`) | **2026-05-12** 13:32 UTC | `semanal` | **~11 semanas — ~11 refrescos vencidos** |
| Desfibriladores | Gobierno de Aragón / Aragón Open Data, desde el PDF **`ZA_mapa_desas.pdf`**, CC BY 4.0 | **2026-05-12** 17:10 UTC | dataset fijo, sin endpoint | referencia interna: **febrero 2026** (~6 meses) |
| Códigos postales | Elaboración propia ("listado operativo refinado por el usuario") | (sin fecha en el fichero) | — | **NO CONSTA** — el JSON no lleva campo de fecha; el `mtime` del fichero es 2026-05-12 18:46, pero eso data la escritura, no el contenido |

**Licencias, todas declaradas y limpias:** el callejero bajo Ley 37/2007 (reutilización de
información del sector público) con el texto de atribución ya redactado; el enriquecimiento bajo
ODbL 1.0 con `© OpenStreetMap contributors`; los desfibriladores bajo CC BY 4.0. Este proyecto
hizo bien los deberes legales.

**Dos observaciones sobre la edad:**

1. Las políticas de refresco (`mensual`, `semanal`) están **declaradas pero no ejecutadas**: no
   hay automatismo, son scripts manuales en `package.json` (`callejero:sync`, `farmacias:sync`).
   Un campo `refreshPolicy` no refresca nada.
2. Los desfibriladores salen de **un PDF**, con fecha de referencia interna de febrero de 2026 y
   sin fuente de actualización. Su propio metadata lo advierte.

---

## 9 · SENSIBILIDAD

### No hay credenciales. Sí hay rutas personales y datos personales.

**Contraprueba del barrido — positivo de control primero.** Antes de afirmar ningún cero:

```
grep -ril "nominatim"  → 20 ficheros       ← el grep recursivo FUNCIONA
find ... -iname "*.env*" -o -iname "*secret*" -o -iname "*.pem" -o -iname "*.key" -o -iname "id_rsa*"
                       → 0 ficheros        ← este cero es fiable
```

**Resultado por categoría:**

| Categoría | Resultado |
|---|---|
| `.env` / `.env.local` | **No existe ninguno.** |
| Claves, tokens, API keys, `sk-…`, `ghp_…` | **Ninguno.** El barrido de `api[_-]?key\|secret\|token\|password\|bearer\|authorization` produce **solo falsos positivos**: la palabra `SECRETARIA` en ubicaciones de desfibriladores y la tienda `Women'secret` en el enriquecimiento de OSM. |
| Certificados / claves privadas | **Ninguno.** |
| Endpoints | Todos públicos y sin autenticación (IDEZar WFS, sede del Ayuntamiento, Nominatim). |

**⚠️ Rutas personales expuestas** (no transcribo valores completos):

1. **`data/generated/territorio/callejero/ayuntamiento-zaragoza/portales-zaragoza.territorial-enrichment.full.metadata.json`, campo `cacheFileUsed`** — ruta absoluta a una carpeta del disco `E:` local, **fuera del proyecto**. Este fichero **sí está versionado** (no lo cubre el `.gitignore`). Además implica que el fichero de 78 MB se generó al 100 % desde una caché que no está en el repositorio: `totalCacheHits: 46150`, `totalFetched: 0`. Es irreproducible sin esa carpeta. En la bitácora como caso nº4.
2. **`.claude/settings.local.json`, ~40 líneas** — decenas de rutas absolutas de la máquina de Antonio en comandos autorizados. **Riesgo controlado:** el `.gitignore` incluye `.claude/`, así que no está versionado.

**⚠️ Datos personales (de fuente pública, pero personales):**

- **Farmacias:** **267 de 314** llevan nombre de persona física en el campo `name` (patrón
  "Farmacia Apellido Apellido, Nombre" — el farmacéutico titular). Además **311 con teléfono** y
  **31 con email**.
- **Desfibriladores:** **34 registros con teléfono** embebido.

Son datos publicados por el Ayuntamiento y la DGA en abierto, y en su mayoría son de contacto
profesional, no domiciliario. No es una fuga. Pero si Desplázame reutiliza estos ficheros, está
republicando nombres y teléfonos de personas identificables, y eso es una decisión consciente,
no un detalle de implementación.

**Un detalle revelador del `.gitignore`:** contiene la regla `*.bak-mojibake`. Ese proyecto ya
tuvo —y arrastró lo bastante como para dejar regla escrita— un problema de codificación.

---

## 10 · ÁRBOL DE LA CARPETA (3 niveles, con peso)

Excluidos `node_modules/`, `.git/` y `.next/`.

```
01 ZGZ RADAR REACT/
├── .claude/
│   ├── settings.json                                            77 B
│   └── settings.local.json                                    7,4 KB   ⚠️ rutas locales (gitignored)
├── .gitignore                                                   557 B
├── AGENTS.md                                                    327 B
├── CLAUDE.md                                                     11 B
├── README.md                                                   1,4 KB   (el de create-next-app, sin tocar)
├── package.json                                                1,4 KB
├── package-lock.json                                           301 KB
├── next.config.ts / postcss.config.mjs / eslint.config.mjs     < 1 KB
├── tsconfig.json                                                670 B
├── tsconfig.tsbuildinfo                                        103 KB
├── data/
│   ├── generated/
│   │   ├── servicios/
│   │   │   ├── desfibriladores/dga/
│   │   │   │   ├── desfibriladores-zaragoza.json               1,12 MB   781 reg.
│   │   │   │   └── desfibriladores-zaragoza.metadata.json      2,1 KB
│   │   │   └── farmacias/ayuntamiento-zaragoza/
│   │   │       ├── farmacias-zaragoza.json                      219 KB   314 reg.
│   │   │       └── farmacias-zaragoza.metadata.json             496 B
│   │   └── territorio/callejero/ayuntamiento-zaragoza/
│   │       ├── callejero-zaragoza.metadata.json                3,3 KB
│   │       ├── portales-zaragoza.json                         10,84 MB   46.150 reg. ⭐
│   │       ├── portales-zaragoza.by-street.json               12,91 MB   2.731 claves
│   │       ├── portales-zaragoza.territorial-enrichment
│   │       │   .full.json                                     78,46 MB   46.150 reg. ⚠️
│   │       ├── …enrichment.full.metadata.json                  1,3 KB    ⚠️ ruta local
│   │       ├── vias-zaragoza.json                              1,03 MB   3.359 reg. (SIN geometría)
│   │       └── vias-zaragoza.search-index.json                  861 KB   3.359 reg.
│   └── sources/
│       ├── servicios/desfibriladores/dga/
│       │   └── desfibriladores-zaragoza-dga.raw.json           1,50 MB   792 reg. (crudo)
│       └── territorio/codigos-postales/operativo-zaragoza/
│           └── codigos-postales-zaragoza.json                  6,2 KB    33 reg.
├── docs/                                                     ~1,05 MB   34 documentos .md
│   ├── 00_BLUEPRINT_MAESTRO_…md                                 189 KB
│   ├── 00_HISTORIAL_VERSIONES_…md                                57 KB
│   ├── 01_DEFINICION_PRODUCTO_…md                                39 KB
│   ├── 02_RESULTADO_INICIALIZACION_TECNICA_…md                  6,4 KB
│   ├── decisions/            ADR-0001 … ADR-0006              ~117 KB   6 ficheros
│   ├── internal/             00 … 16                          ~502 KB  17 ficheros
│   ├── roadmap/              00 … 04                          ~251 KB   7 ficheros
│   ├── territorio/callejero/ 00_PROCEDIMIENTO_ENRIQUECIMIENTO   11 KB
│   └── visual/               00_IDENTIDAD_VISUAL                25 KB
├── public/
│   ├── skyline.svg                                              799 KB
│   └── file/globe/next/vercel/window .svg                      < 2 KB c/u
├── src/
│   ├── app/            page.tsx (13,6 KB) · layout · globals.css · favicon
│   │   ├── _components/ · agenda/ · aparcar/ · ciudad/ · servicios/
│   │   ├── internal/    9 subrutas (documentación interna navegable)
│   │   ├── moverme/     page.tsx  9,2 KB    ⚠️ SOLO maqueta, sin datos
│   │   └── salud/       desfibriladores/ · farmacias/
│   └── services/       36 ficheros .ts
│       ├── queries/     17 ficheros (lectura de los generated)
│       ├── search/       3 ficheros (normalización, abreviaturas)
│       └── sync/        16 ficheros (pipelines de descarga)
└── tools/
    ├── audits/audit-desfibriladores-territorial.ts              27,9 KB
    ├── dev/commit-command.ts + README                            6,5 KB
    └── internal-audit/check-internal-consistency.ts              9,7 KB
```

**Total de ficheros de datos: 18, todos `.json`. Peso de `data/`: ~107 MB**, de los cuales 78 MB
(73 %) son el enriquecimiento de Nominatim.

---

## 11 · TABLA FINAL: qué hay / qué falta para construir un grafo

Un grafo de rutas necesita **nodos**, **aristas**, **coste** por arista y **conexiones entre
modos**. Estado real:

| Pieza del grafo | ¿Está? | Qué hay exactamente | Qué falta |
|---|:--:|---|---|
| **Nodos: orígenes y destinos** | ✅ | 46.150 portales con coordenada WGS84, 46.147 puntos únicos, `portalId` sin duplicados | Nada. Esta pieza está completa y limpia. |
| **Aristas: ejes de calle** | ❌ | **Nada.** `vias-zaragoza.json` son nombres, no geometría | **Todo.** Sin esto no hay motor. Es el bloqueo nº1. |
| **Atributos de vía (sentido, tipo, peatonal)** | ❌ | Solo `tipoVia` como código de 2-3 letras (`CL`, `AV`, `PS`, `AN`…), que es la clase del topónimo, no la clasificación funcional de la vía | Sentido de circulación, restricción peatonal, jerarquía viaria |
| **Conectividad / intersecciones** | ❌ | Nada. No se puede derivar de puntos sueltos | Grafo de cruces |
| **Coste peatonal (distancia real)** | ❌ | Solo se puede calcular distancia en línea recta entre portales | Longitud sobre eje real; pendiente si se quiere afinar |
| **Paradas de autobús** | ❌ | Nada. Ni un `stop_code`, ni un número de poste | Dataset completo de paradas |
| **Líneas y trazado de autobús** | ❌ | Nada | Recorridos (idealmente `shapes.txt` de un GTFS) |
| **Horarios / frecuencias** | ❌ | Nada. No hay GTFS, luego no hay `stop_times` ni `calendar` | Todo, **si** se decide que entren horarios |
| **Tranvía (paradas y trazado)** | ❌ | Nada. Una tarjeta en una maqueta | Dataset completo |
| **BiZi (estaciones)** | ❌ | Nada. Cero coincidencias de la cadena | Dataset completo |
| **Transbordos entre modos** | ❌ | No aplica todavía: no hay dos modos que conectar | Se deriva una vez existan paradas y aristas |
| **Geocodificación "de X a Y"** | ✅ | Índice de búsqueda con 3.359 vías tokenizadas y sin tildes, `by-street` con 2.731 calles, normalizador de abreviaturas ya escrito | Nada relevante. Es reutilizable tal cual. |
| **Contexto territorial (barrio, distrito, CP)** | ⚠️ | Enriquecimiento OSM al 100 % de cobertura: `postcode` en 46.150, `district` en 43.080, `neighborhood` en 41.737 | Utilizable para etiquetar zonas. **Su `houseNumber` NO es fiable: 29,6 % erróneo** (bitácora nº2) |

### Lectura de la tabla

De las 13 piezas, **2 están completas** (los nodos y la geocodificación), **1 es parcialmente
aprovechable con reservas** (el contexto territorial) y **10 faltan enteras**.

Lo que hay es exactamente **la mitad de los extremos de una ruta y nada del medio**: sé decir
dónde está "Calle Delicias 42" con precisión de portal, y no tengo forma de saber cómo se llega
desde allí a ningún sitio.

---

## 12 · Qué NO he mirado (y por qué)

Exigido por el punto 7 del encargo: antes de firmar "todo revisado", declarar los huecos.

- **El interior de los 34 documentos `.md`** (~1,05 MB). Los he barrido por búsqueda de términos
  y he leído los metadatos y ADRs relevantes, pero no los he leído enteros. Es documentación de
  producto de otro proyecto, fuera del alcance de un reconocimiento de datos. **Puede contener
  decisiones sobre movilidad que contradigan o maticen algo de este informe.**
- **Los 36 ficheros `.ts` de `src/services/`.** He verificado qué pipelines existen (por nombre y
  por los scripts de `package.json`) y he confirmado que no hay ninguno de transporte, pero no he
  auditado su lógica. `enrich-portales-territorial-osm.ts` (29,7 KB) es donde estaría la causa
  exacta del desajuste de `houseNumber`; no he entrado.
- **El contenido completo del fichero de 78 MB.** Lo he parseado entero para los contadores
  (registros, `houseNumber` vs `numero`, campos nulos), pero no he inspeccionado los `rawAddress`
  registro a registro. Puede haber más campos aprovechables.
- **`desfibriladores-zaragoza-dga.raw.json`** (1,5 MB, crudo). Solo he verificado su estructura
  raíz (`metadata` + `items`); el normalizado ya lo cubre.
- **Si IDEZar ofrece la capa de geometría de viales.** Es la pregunta que resolvería el punto 1,
  y es una consulta a un servidor externo: fuera del alcance de un reconocimiento de solo lectura
  sobre una carpeta local. **Queda como la primera pregunta a responder en estrategia.**
- **`docs/territorio/callejero/00_PROCEDIMIENTO_ENRIQUECIMIENTO_TERRITORIAL_PORTALES.md`** (11 KB).
  Podría documentar la limitación del `houseNumber` que he encontrado por mi cuenta; no lo he
  leído.

---

## 13 · Resumen de hallazgos anómalos

Los cinco están desarrollados como entradas en [`docs/BITACORA.md`](BITACORA.md), escritas en
caliente durante este reconocimiento.

| # | Hallazgo | Categoría | Gravedad para 004 |
|---|---|---|---|
| 1 | `vias-zaragoza.json` no contiene vías: cero geometría en todo el dataset | carencia | **Bloqueante** |
| 2 | El enriquecimiento declara 100 % de cobertura y trae el 29,6 % de los números de portal mal | datos | Alta si se usa `houseNumber` |
| 3 | Los `sha256` y `bytes` del metadata no validan ninguno de los 4 ficheros (CRLF vs LF) | silencio falso | Baja — pero invalida la verificación |
| 4 | El metadata apunta a una caché en una carpeta local fuera del proyecto; irreproducible | datos | Media (reproducibilidad) |
| 5 | `ANDADOR ABOGACíA TURNO DE OFICIO`: minúscula en el dato de origen, 1 de 3.359 | datos | Muy baja (cosmética) |

**No, el dataset no estaba impecable.** Lo que sí está es **bien construido para lo que se
construyó**: procedencia documentada, licencias declaradas, contadores de control en los
metadatos, avisos honestos sobre sus propias limitaciones. Los cinco hallazgos son de un
proyecto cuidadoso al que nadie le pidió nunca lo que Desplázame necesita.

---

*Reconocimiento ejecutado el 2026-08-02 en modo solo lectura. Ni un fichero de `E:\` fue
modificado, creado ni copiado. No se ha inicializado repositorio, no se han instalado
dependencias, no se ha elegido stack.*

> **Nota:** antes de publicar el repositorio se generalizó **1 ruta local de disco** en este
> documento. No se ha alterado ningún dato, número ni conclusión. Fecha de la redacción:
> 2026-08-02.
