# Reconocimiento de fuentes en red — Ayuntamiento de Zaragoza

**Fecha del reconocimiento:** 2026-08-02
**Modo:** SOLO CONSULTA. Ninguna autenticación, ningún registro, ningún formulario, ninguna
condición aceptada. **21 peticiones HTTP** en total (presupuesto: ~25).
**Respuestas crudas:** guardadas en `data/exploracion/` **antes** de interpretarlas. Todo el
análisis de este informe se hizo sobre los ficheros en disco, no sobre la pantalla.
**Registro histórico fechado.** Este documento se añade, no se reescribe.

---

## VEREDICTO EN UNA LÍNEA

**SÍ HAY RED VIARIA DESCARGABLE CON GEOMETRÍA DE LÍNEA.** El bloqueo de las aristas se rompe: hay
**tres capas** distintas de viario vectorial en el WFS de IDEZar, públicas, sin registro, con
licencia que permite redistribuir. **Pero los tramos no comparten vértice en los cruces** — hay
geometría, no topología, y entre una cosa y la otra hay un paso de trabajo que hoy no estaba en la
cuenta de nadie.

---

## A · ⭐⭐ El GeoServer de IDEZar

### A1 · ¿Contesta?

**Sí.**

| | |
|---|---|
| **Petición** | `GET https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetCapabilities` |
| **Respuesta** | `HTTP 200` · `application/xml` · **199.612 bytes** |
| **Versión del servicio** | **WFS 2.0.0** |
| **¿ExceptionReport?** | No — comprobado explícitamente (0 coincidencias) |
| **Crudo** | `2026-08-02_idezar-geoserver_wfs-getcapabilities.xml` |

**Capas publicadas: 178.** Contadas por cierres `</FeatureType>`.

> ⚠️ **Nota sobre el contador.** El primer intento (`grep -c "<FeatureType>"`) devolvió **0** —
> falso cero: `grep -c` cuenta *líneas* con coincidencia y este XML viene en 5 líneas. El recuento
> bueno es `grep -o … | wc -l`. Lo anoto porque es exactamente el tipo de cero que parece una
> respuesta.

**Reparto por workspace:**

| Workspace | Capas | | Workspace | Capas |
|---|---:|---|---|---:|
| `movilidad` | **43** | | `ctsvg` | 9 |
| `idezar_base` | 40 | | `cp` | 2 |
| `medioambiente` | 39 | | `tn-ro`, `ps`, `au`, `ad`, `ef`, `elu`… | 1 c/u |
| `urbanismo` | **23** | | `mapa_del_ruido_2016` | 12 |

### A2 · ⭐ Capas candidatas a red viaria

Buscadas por **contenido**, no solo por la palabra "vía":

| Nombre técnico | Título | Pinta |
|---|---|---|
| **`tn-ro:RoadLink`** | **Red viaria tramos INSPIRE TN-RO** | ⭐ tramos INSPIRE |
| **`idezar_base:JERARQUIA_VIARIA`** | **Sentido de las vías** | ⭐ tramos + atributos de movilidad |
| **`urbanismo:Vias`** | Vías | ⭐ ejes por vía completa |
| `idezar_base:JERARQUIA_VIARIA_POINTS` | Límites de velocidad | puntos |
| `idezar_base:Aceras_PavimentoTF_2017` | Aceras pavimento | peatonal |
| `idezar_base:AcerasZonasVerdes_PavimentosTF_2017` | Aceras zonas verdes pavimentos | peatonal |
| `movilidad:MU1_jerarquia_viaria` | (mismo nombre) | viario |
| `movilidad:MU2_carriles_bici` · `MU1_CC_carriles_bici_todos_2025` | | bici |
| `movilidad:MU3_lineas_bus` · `MU3_lineas_tranvia` | | transporte |
| `movilidad:MU3_paradas_BUS` · `MU3_paradas_tranvia` · `MU3_paradas_taxi` | | transporte |
| `movilidad:MU1_estaciones_bici_ubicacion` | | ⭐ BiZi por WFS |
| `movilidad:MU2_aparcabicis` · `MU1_ZBE_Zona_Bajas_Emisiones` | | bici / ZBE |
| `idezar_base:Etiquetas_5000` · `Etiquetas_500` · `Calles_Tercer_Nivel_2014` | Calles 1º/2º/3er nivel | etiquetas |

### A3 · ¿Existe `urbanismo:Vias`?

**Sí.** Y las otras 22 capas de ese workspace son: `Alturas_Edificios`, `Areas_Referencia`,
`Clavos_Topograficos`, `Distritos_Municipales`, `Juntas_Municipales_Vecinales`, `Municipios`,
`IDEZar_Ordenacion_lineas`, `Lineas_Edificaciones`, `Manzanas`, `PLA_1_*` (3), `Parcelas`,
**`Portales`**, `suelos_vacantes`, `Textos_Edificaciones`, `IDEZar_Zona_Menor_Agua`,
`hoja_pgou_*` (4), `v_ambitos_desarrollo_etiquetas`.

⭐ **`urbanismo:Portales` también está ahí** — es decir, los 46.150 portales del reconocimiento
0.A y los ejes de calle salen **del mismo servidor y del mismo workspace**.

### A4 · ⭐ `DescribeFeatureType` — el dato que decide el proyecto

**`urbanismo:Vias`** → `HTTP 200`, `application/gml+xml`, 2.192 b

| Campo | Tipo |
|---|---|
| **`geom`** | **`gml:MultiCurvePropertyType`** ⭐ **GEOMETRÍA DE LÍNEA** |
| `codigo` | `xsd:int` ⭐ |
| `tipo_via`, `nombre`, `nombre_completo`, `nombre_reducido`, `nombre_publico`, `barrio_rural` | `xsd:string` |
| `codigo_via_entrada`, `codigo_via_salida` | `xsd:int` |
| `fecha_acuerdo`, `fecha_baja`, `fecha_propuesta` | `xsd:date` |

**`idezar_base:JERARQUIA_VIARIA`** → `HTTP 200`, 2.822 b

| Campo | Tipo | Para qué sirve |
|---|---|---|
| **`the_geom`** | **`gml:MultiCurvePropertyType`** | ⭐ geometría de línea |
| `CALLE` / `TRAMO` | string | nombre y tramo ("DE X A Y") |
| **`DOBLE_SENT`** | string | ⭐ **sentido de circulación** |
| **`LIMITE_VEL`** | int | ⭐ velocidad |
| **`PLATAFORMA`** | string | plataforma única (peatonalidad) |
| `PACIFICADA`, `CALLE_Z30`, `RESIDENCIA` | string | calmado de tráfico |
| `CARRIL_BUS`, `CARRIL_VH` | int / string | carriles reservados |
| **`LONGITUD`** | double | ⭐ **longitud ya calculada** |
| `TIPO`, `CAPACIDAD`, `MALLA_BASI`, `MUNICIPAL`, `PMA12,5_18`, `PMA_18`, `OBSERVACIO` | | clasificación |

**`tn-ro:RoadLink`** → `HTTP 200`, 728 b — **pero sin campos**: es un esquema INSPIRE conforme que
solo hace `<xsd:include schemaLocation="https://inspire.ec.europa.eu/schemas/tn-ro/4.0/RoadTransportNetwork.xsd"/>`.
No es un error; los campos hay que verlos en una feature real (A6).

### A5 · ⭐ ¿Aparece `codigoVia`?

**SÍ, con el nombre exacto `codigo`** (`xsd:int`) en `urbanismo:Vias`.

Y funciona: la feature de muestra trae `"codigo": 80` y `"nombre_publico": "CAMINO ABEJAR"`. En el
dataset heredado, las vías tienen `codigoVia: "81"`, `"1170"`, `"40102"` — **el mismo espacio de
identificadores**. El enganche portal ↔ eje de calle es un **JOIN por identificador exacto**, no
un emparejamiento por nombre y cercanía. Es justo el mecanismo que falló en el 29,6 % del
enriquecimiento OSM (bitácora 0.A nº2), evitado aquí de raíz.

`JERARQUIA_VIARIA` **no** tiene `codigo`: solo `CALLE` como texto. Su enganche al callejero sería
por nombre — con todo lo que eso arrastra.

### A6 · Muestra real (≤5 features)

**`urbanismo:Vias`**, `count=3`, `srsName=EPSG:4326`:

```
numberMatched: 3359          <-- las MISMAS 3.359 vías del dataset heredado
feature id: Vias.8704
  geometry.type: MultiLineString | partes: 12 | puntos: 114
  PRIMER punto: [-0.97514752, 41.68721697]
  ULTIMO punto: [-0.98949267, 41.67604269]
  props: {"codigo": 80, "tipo_via": "CN", "nombre": "ABEJAR",
          "nombre_publico": "CAMINO ABEJAR", "barrio_rural": null,
          "codigo_via_entrada": 16980, "codigo_via_salida": 20040,
          "fecha_acuerdo": "2010-12-23", "fecha_baja": null}
```

⭐ **`numberMatched: 3359` es la prueba definitiva** de que `urbanismo:Vias` es exactamente el pozo
del que salió `vias-zaragoza.json` (3.359 registros, 8 campos, cero coordenadas). **La capa
siempre tuvo la geometría; el descargador de 2026 la tiró.** La sospecha nº1 de la tanda 0.A queda
confirmada contra el servidor.

**`idezar_base:JERARQUIA_VIARIA`**, `count=3`:

```
numberMatched: 3453
JERARQUIA_VIARIA.1 | CALLE BOTERON | TRAMO: "DE CALLE SEPULCRO A ECHEGARAY"
  MultiLineString | 2 puntos | LONGITUD: 66.94625 | DOBLE_SENT: NO | LIMITE_VEL: 30
  TIPO: "04_Urbana No Restringida" | PACIFICADA: SI | PLATAFORMA: NO
```

**`tn-ro:RoadLink`**, `count=3`:

```
numberMatched: 3644
ES.AYZ.TN.RL.1 | LineString | 8 puntos
  inspireId: {localId: "1", namespace: "ES.AYZ.TN"}
  geographicalName: "DE ASALTO A AZNAR MOLINA"
  fictitious: false | validFrom: "2024-01-01T00:00:00Z"
```

**CRS declarado en las tres:** `urn:ogc:def:crs:EPSG::4326` en la respuesta cuando se pide;
`EPSG::25830` por defecto (ver A7).

### A7 · CRS soportados

| Capa | `DefaultCRS` | `OtherCRS` declarados |
|---|---|---:|
| `urbanismo:Vias` | `urn:ogc:def:crs:EPSG::25830` | **0** |
| `idezar_base:JERARQUIA_VIARIA` | `urn:ogc:def:crs:EPSG::25830` | **0** |
| `tn-ro:RoadLink` | `urn:ogc:def:crs:EPSG::25830` | **0** |

**El servidor no declara soportar EPSG:4326 — pero lo reproyecta si se le pide.** Comprobado
pidiendo la misma feature dos veces:

| Petición | Primer punto de `Vias.8704` | Sistema |
|---|---|---|
| **sin** `srsName` | `[668516.28662123, 4617030.03515345]` | **metros** (UTM 30N) |
| **con** `srsName=EPSG:4326` | `[-0.97514752, 41.68721697]` | **grados** (WGS84) |

Mismo fichero `.json`, mismo `"type": "FeatureCollection"`, coordenadas incompatibles. El bloque
`crs` del GeoJSON lo declara honestamente, pero ese bloque está deprecado en la especificación y
la mayoría de librerías lo ignora. **Regla para 004: `srsName=EPSG:4326` explícito siempre, y
validar el rango del resultado.** Está en la bitácora.

> **Cabo no comprobado:** con `srsName=EPSG:4326` el orden salió `[lon, lat]`, que es lo correcto.
> No he probado la forma `urn:ogc:def:crs:EPSG::4326`, que en WFS 2.0 puede invertir los ejes a
> `[lat, lon]`. Antes de una descarga masiva conviene verificarlo.

### A8 · ⚠️ VEREDICTO EXPLÍCITO

> # SÍ. HAY RED VIARIA DESCARGABLE CON GEOMETRÍA DE LÍNEA.

Tres capas, por WFS 2.0, en GeoJSON, sin registro, reproyectables a WGS84, con licencia que
permite redistribuir. Los matices —que son serios— van debajo.

---

## ⚠️ EL MATIZ QUE CAMBIA EL PLAN: geometría sí, topología no

Antes de firmar "desbloqueado", la costura obligaba a preguntar si **los tramos se tocan**. Se
pidieron 5 tramos vecinos de una bbox de 250 m en el casco (`numberMatched: 7` en esa bbox):

| Feature | Calle | Tramo | Puntos | Longitud |
|---|---|---|---:|---:|
| 1553 | PASEO ECHEGARAY Y CABALLERO | DE PLAZA EUROPA A GLORIETA PUERTA DEL SOL | 34 | 1.764,10 m |
| 2053 | CALLEJON SACRAMENTO | DE CASTA ALVAREZ A CALLE PREDICADORES | 2 | 31,76 m |
| 2191 | CALLE POSTIGO DEL EBRO | DE ECHEGARAY Y CABALLERO A PREDICADORES | 2 | 65,68 m |
| 2192 | CALLE PREDICADORES | DE POSTIGO DEL EBRO A PLAZA SANTO DOMINGO | 3 | 173,25 m |
| 2306 | CALLE AGUADORES | DE PREDICADORES A CALLE LAS ARMAS | 3 | 69,16 m |

**Coincidencias exactas de extremos entre los 5: CERO.**

Y no es que no conecten — sus propios nombres de tramo dicen que sí. Medida la separación real:

```
POSTIGO DEL EBRO (fin) -> PREDICADORES (inicio) :  5,08 m
PREDICADORES (inicio)  -> AGUADORES (inicio)    : 13,87 m
POSTIGO (fin)          -> AGUADORES (inicio)    : 18,37 m
```

Esto es cartografía de representación, no un grafo. **Un montón de líneas que no se tocan no es
una red**, y a la escala a la que se dibuja un mapa, 5 metros son menos de un píxel: pintado se ve
como el callejero perfecto de Zaragoza.

**Consecuencia:** entre el dato y el grafo hay un paso obligatorio de **noding** (unificar extremos
por proximidad, tolerancia del orden de 5-10 m) y una verificación posterior de conectividad. Es
trabajo conocido y acotado, pero es trabajo. Entrada nº1 de la bitácora de esta tanda.

### Comparativa de las tres capas para construir el grafo

| | `urbanismo:Vias` | `idezar_base:JERARQUIA_VIARIA` | `tn-ro:RoadLink` |
|---|---|---|---|
| Features | 3.359 | **3.453** | **3.644** |
| Unidad | vía completa | **tramo** | **tramo** |
| Geometría | MultiLineString (114 pts en la muestra) | MultiLineString (2-34 pts) | LineString (8 pts) |
| ⭐ `codigoVia` | **SÍ (`codigo`)** | no (solo `CALLE` texto) | no (`inspireId`) |
| Sentido | no | **`DOBLE_SENT`** | no |
| Velocidad | no | **`LIMITE_VEL`** | no |
| Longitud | no | **`LONGITUD`** | no |
| Peatonalidad | no | **`PLATAFORMA`**, `PACIFICADA`, `CALLE_Z30` | no |
| Fecha de validez | `fecha_acuerdo` / `fecha_baja` | no | `validFrom: 2024-01-01` |
| **Consulta por bbox** | no probada | ✅ **funciona** | ❌ **rompe** (ver abajo) |

**Ninguna gana sola.** `Vias` tiene el puente de identidad con los portales; `JERARQUIA_VIARIA`
tiene los atributos que un motor de rutas necesita y es la única con bbox verificado;
`RoadLink` tiene más tramos y geometría más detallada pero ningún atributo útil y está rota para
consultas espaciales.

### ⚠️ `tn-ro:RoadLink` revienta con filtro espacial

```
GET …&typeNames=tn-ro:RoadLink&bbox=675900,4613900,676150,4614150,urn:ogc:def:crs:EPSG::25830
→ HTTP 400 · <ows:ExceptionReport>
  org.postgresql.util.PSQLException: ERROR: invalid input syntax for type integer: "2_3_1_2_3"
```

**Control:** la **misma bbox, misma sintaxis**, contra `JERARQUIA_VIARIA` → `HTTP 200` con 5
features. El fallo es de la capa, no de la petición. `RoadLink` no sirve para descarga troceada ni
consulta por zonas: o se pide entera o no se pide. En la bitácora.

---

## B · El conjunto 279 "Vías" del catálogo de datos abiertos

**Petición:** `GET https://www.zaragoza.es/sede/servicio/catalogo/279.json` → `HTTP 200`,
`application/json`, 6.755 b.
*(La ficha HTML se pinta por JavaScript, como avisaba el encargo; la ruta `.json` la devuelve
servida.)*

### B1 · Formatos y endpoint

| Formato | `accessURL` |
|---|---|
| **WFS** | `https://idezar-sig.zaragoza.es/servicios/geoserver/urbanismo/wfs?service=WFS&version=2.0.0&request=GetCapabilities` |
| **WMS** | `https://idezar-sig.zaragoza.es/servicios/geoserver/urbanismo/wms` |

Es **el mismo GeoServer** del punto A, en su ruta de workspace. El `landingPage` del conjunto es
`https://idezar-sig.zaragoza.es/servicios/visorCallejero/`.

### B2 · ⭐ ¿Trae geometría?

**SÍ.** Y el propio catálogo lo declara en su bloque `datastructure` ("Estructura generada desde
WFS DescribeFeatureType", actualizada 2026-06-17):

```
attributes[0]: title "geom" | type "Geometry" | subtype "MultiLineString"
attributes[1]: title "codigo" | type "Integer"
attributes[2]: title "tipo_via" | type "String"  …
```

Y la descripción oficial del conjunto es explícita:

> *"Conjunto de datos geográficos que representa **los ejes de las vías públicas** del municipio
> de Zaragoza **como entidades lineales unitarias**."*

**La sospecha fundada del encargo queda refutada, y eso es el resultado que más cambia el
proyecto:** el pozo del que salió `vias-zaragoza.json` **sí tenía geometría**. Quien bebió de él
en mayo de 2026 pidió solo los atributos alfanuméricos y descartó la línea, y su metadata no
registró en ningún campo que lo había hecho.

### B3 · Registros y esquema

**3.359 registros** (`numberMatched` del WFS). Esquema: los 13 campos de A4.

Metadatos del catálogo: `issued`/`modified` **2024-02-24**, `lastUpdated` **2026-05-19**,
`accessRights` **"Público"**, `status` "Finalizado", `spatialRepresentationTypeCode` **"vector"**,
`spatialResolution` "1/1, 1/5000", editor **"Ayuntamiento de Zaragoza. Oficina de Transparencia y
Gobierno Abierto"**.

> Dos rarezas menores, sin consecuencia práctica: `accrualPeriodicity` vale **`P0DT1S`** (una
> periodicidad de actualización de *un segundo* para un callejero, que es un valor basura), y
> `materiaInspire` clasifica esta capa de viales bajo el tema **"Direcciones"** en vez de
> "Redes de transporte".

---

## C · BiZi — estaciones

**Peticiones:** el endpoint `.geojson` de la sede, dos veces.

### C1 · ⭐ Las dos proyecciones: son IDÉNTICAS

| Petición | Resultado |
|---|---|
| `…/estacion-bicicleta.geojson?rows=5` | `HTTP 200` · `application/geo+json` · **4.997 b** |
| `…/estacion-bicicleta.geojson?rows=5&srsname=wgs84` | `HTTP 200` · `application/geo+json` · **4.997 b** |

```
cmp  → IDENTICAS byte a byte
sha256 (ambas) = c67b62277315e6807bd5648150c9ff44f6835339f0fc6787dbfc842a5038384a
```

**El endpoint `.geojson` ignora `srsname` y devuelve siempre WGS84.** Y lo declara bien:
`crs: {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}` — CRS84 es WGS84 con orden `[lon, lat]`.

**Tres valores reales:** `[-0.911215893796391, 41.63149540266168]`,
`[-0.9107841716732368, 41.65951733457972]`, `[-0.8640994330671391, 41.64758556666017]`.
**Grados**, sin discusión: en UTM 30N serían del orden de 676.000 / 4.610.000 m.

Así que **la trampa que avisaba el encargo no se materializa en esta ruta** — pero conviene no
generalizar: el aviso venía de la API de POIs genérica, que es otro endpoint y no lo he probado.

### C2 · Estaciones y esquema

**276 estaciones** (`totalCount` de `…/estacion-bicicleta.json?rows=1`).

**13 campos:** `id` · `about` · `title` · `estado` · `estadoEstacion` · `address` ·
`tipoEquipamiento` · `bicisDisponibles` · `anclajesDisponibles` · `lastUpdated` · `description` ·
`descripcion` · `icon`

**Tres registros reales:**

```
[-0.911215893796391, 41.63149540266168]  id 279  "193- Pza. La Ermita"        bicis 3   anclajes 16
[-0.9107841716732368, 41.65951733457972] id 278  "270- Delicias Autobuses"    bicis 16  anclajes 2
[-0.8640994330671391, 41.64758556666017] id 277  "150- Mrio. Siresa: Dr. Iranzo" bicis 11 anclajes 7
```

⚠️ **`title` y `address` son el mismo texto** en los tres. No hay dirección postal real: el
"nombre" lleva el número de estación delante (`193- Pza. La Ermita`). Si 004 quiere geocodificar la
estación contra el callejero, tendrá que trabajarse ese texto.

### C3 · ⭐ Campos ESTABLES vs VIVOS

| **ESTABLES — utilizables en la v1** | **VIVOS — fuera de la v1** |
|---|---|
| `id` (279, 278, 277…) | `bicisDisponibles` |
| `title` (nombre de la estación) | `anclajesDisponibles` |
| `address` (= `title` hoy) | `estado` (`IN_SERVICE`) |
| **geometría** `[lon, lat]` | `estadoEstacion` (⚠️ roto, ver abajo) |
| `about` (URL de detalle) | `lastUpdated` (⚠️ zona horaria mal) |
| `tipoEquipamiento` (URI de vocabulario) | `description` (HTML con estado y cifras) |
| `descripcion` (texto fijo) | |
| `icon` | |

⚠️ **Nota importante:** el **número de anclajes totales de la estación NO viene**. Solo llegan los
*disponibles*, que es un dato vivo. La capacidad de la estación —que sí sería un dato estable— no
está en esta respuesta.

⚠️ **Y `anclajesDisponibles` es la trampa de nomenclatura:** parece capacidad y es ocupación.
Cualquiera que lo tome por "tamaño de la estación" construye sobre un dato que cambia cada minuto.

⚠️ **`estadoEstacion` está roto:** dice `.../no-operativa` en **5 de 5** estaciones mientras
`estado` dice `IN_SERVICE` y `description` dice "Estado: Operativa". Es el campo que *parece* el
bueno (vocabulario controlado publicado) y es el que miente. En la bitácora.

### C4 · Cabeceras de caché

| Cabecera | Valor |
|---|---|
| `ETag` | **NO CONSTA** — el servidor no la envía |
| `Last-Modified` | `Sun, 02 Aug 2026 11:30:07 CEST` |
| `Cache-Control` / `Expires` | **NO CONSTA** — no aparecen en la respuesta |
| `Date` (reloj del servidor) | `Sun, 02 Aug 2026 09:30:21 GMT` |

**Frecuencia de actualización declarada:** ninguna en la respuesta. El campo `lastUpdated` marcaba
**14 segundos antes** de mi petición, lo que sugiere refresco casi continuo, pero **es una
inferencia de una sola muestra, no un dato declarado**.

⚠️ Y ese `lastUpdated` vale `"2026-08-02T11:30:07Z"` — hora local con sufijo `Z` (UTC): **dos horas
de error**, contrastado contra la cabecera `Date` de la misma respuesta. En la bitácora.

---

## D · Los visores

### D1 · `visorComoMoverse` — no determinable por análisis estático

| Petición | Resultado |
|---|---|
| `GET https://idezar-sig.zaragoza.es/servicios/visorComoMoverse/` | `HTTP 200` · `text/html` · 63.242 b |
| `GET …/visorComoMoverse/main.08b2ee4c3d38b878.js` | `HTTP 200` · `text/javascript` · **2.001.004 b** |

El HTML es un contenedor Angular: **cero endpoints y cero nombres de capa**, solo tres bundles
(`main`, `polyfills`, `runtime`). Analizado el bundle de 2 MB:

```
capas workspace:Capa citadas   : 1  (urbanismo:orto_zar_res_0_25, la ortofoto de fondo)
nombres MU1_/MU2_/MU3_         : 0
GetFeature / wfs / GetCapabilities : 0 / 0 / 0
wms: 18   WMTS: 6   GetMap: 2   geoserver: 2
URLs distintas en el bundle    : 115  (entre ellas https://idezar-sig.zaragoza.es/servicios/visorGenerico/
                                       y el WMS del IGN como capa base)
```

**`NO CONSTA` qué capas de red carga el `visorComoMoverse`.** Motivo: la configuración de capas no
está en el bundle estático; la app la resuelve en tiempo de ejecución (probablemente delegando en
`visorGenerico`). Determinarlo exigiría **ejecutar la aplicación en un navegador y observar su
tráfico**, que no es análisis estático y no lo he hecho.

**Lo que sí se puede afirmar del bundle:** consume **WMS/WMTS y no WFS** (`wfs: 0`,
`GetFeature: 0`). Coherente con lo que es un visor: pinta imágenes.

### D2 · Los otros tres visores

**No consultados.** Con el `visorComoMoverse` —el prioritario— resultando no analizable
estáticamente, gastar tres peticiones más en visores construidos igual habría dado el mismo
`NO CONSTA` tres veces. Preferí invertir el presupuesto en la comparación WMS↔WFS del punto D3,
que responde la pregunta de fondo mucho mejor que cualquier visor. Queda declarado como hueco
en el punto H.

*(Dato colateral: el catálogo 279 declara `visorCallejero` como su `landingPage`, lo que confirma
que ese visor consume la capa `urbanismo:Vias`.)*

### D3 · ⚠️ ¿Hay capas que se ven en WMS y no se descargan por WFS?

Ésta era la pregunta importante, y la respuesta es tranquilizadora **para lo que nos interesa**.

| Petición | Resultado |
|---|---|
| `GET …/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities` | `HTTP 200` · `text/xml` · ⚠️ **cortado a 6.000.000 b** |

> ⚠️ **Aviso, como pedía la costura:** el `GetCapabilities` del WMS **supera los 6 MB** y `curl` lo
> truncó (`error 63`). El análisis se hizo sobre la parte descargada, así que **la lista WMS puede
> estar incompleta** y los recuentos de abajo son un mínimo, no un total.

```
capas con workspace en WMS (parte descargada): 3.695
capas con workspace en WFS (completo):           176
en WMS y no en WFS:                            3.594
```

Pero ese 3.594 no es lo que parece. Desglosado por workspace:

| Workspace de las "solo WMS" | Capas | Qué son |
|---|---:|---|
| `S3_LST` | **3.466** | ráster Sentinel-3 (temperatura de superficie) |
| `Islas_Calor` | 52 | ráster de islas de calor |
| `idezar_base` | 28 | mezcla |
| `historicos` | 23 | cartografía histórica (ráster) |
| `movilidad` | 10 | mezcla |
| `urbanismo` | 8 | planos (`Plano_Clasificacion`, `Plano_Estructura`) |

**El 97,8 % son rásteres, donde WFS no aplica por definición.** Un ráster no tiene geometría
vectorial que servir.

**Control sobre las capas que importan:**

| Capa | WMS | WFS |
|---|---|---|
| `urbanismo:Vias` | *(no aparece — ver nota)* | ✅ **SÍ** |
| `idezar_base:JERARQUIA_VIARIA` | ✅ | ✅ **SÍ** |
| `tn-ro:RoadLink` | ✅ | ✅ **SÍ** |
| `idezar_base:Aceras_PavimentoTF_2017` | ✅ | ✅ **SÍ** |
| `movilidad:MU1_jerarquia_viaria` | ✅ | ✅ **SÍ** |
| `movilidad:MU2_carriles_bici` | ✅ | ✅ **SÍ** |
| `movilidad:MU1_estaciones_bici_ubicacion` | ✅ | ✅ **SÍ** |
| `movilidad:MU3_lineas_bus` · `MU3_lineas_tranvia` | ✅ | ✅ **SÍ** |

> *Nota sobre `urbanismo:Vias` en WMS:* no aparece en la porción descargada, pero **el catálogo
> oficial 279 declara explícitamente un `accessURL` WMS para esa capa**. Lo atribuyo al
> truncamiento del fichero, no a su ausencia. No lo he verificado.

**Ninguna capa de red viaria está solo en WMS.** De las 3.594 "solo WMS", 16 tienen relación con
movilidad o viario:

```
idezar_base:IDEZar_sentido_calles          movilidad:MU1_CC_carriles_bici_todos
idezar_base:IDEZar_base_Aceras             movilidad:MU2_aparcabicis_V2
idezar_base:IDEZar_base_AcerasZonasVerdes  movilidad:MU2_estilo_carriles_bici
idezar_base:IDEZar_base_Calles_5000_et     movilidad:MU3_lineas_tranvia_policia   (…y 8 más)
```

Mi valoración —y la marco como **valoración razonada, no verificada capa a capa**— es que son
**capas de publicación y estilo** sobre las mismas tablas que sí están en WFS: los prefijos
`IDEZar_base_*`, `MU2_estilo_*` y los sufijos `_et` / `_policia` son nomenclatura de capa
estilizada, y el caso más claro es `IDEZar_sentido_calles`, cuyo dato equivalente está en WFS como
`idezar_base:JERARQUIA_VIARIA` (cuyo título es, literalmente, *"Sentido de las vías"*).

---

## E · El nodo INSPIRE

| Petición | Resultado |
|---|---|
| `GET http://idezar.zaragoza.es/inspire-node/services/wfs?Service=WFS&version=2.0.0&Request=GetCapabilities` | `HTTP 200` · `text/xml` · 26.045 b · WFS 2.0.0 |

**4 FeatureTypes, todos del tema Direcciones:**

```
ad:Address · ad:AddressAreaName · ad:PostalDescriptor · ad:ThoroughfareName
```

**⭐ Transport Networks: CERO.** Búsqueda de `transport|roadlink|tn-ro|tn:` → 0 coincidencias.
**Positivo de control:** búsqueda de `address|direccion` → 12 coincidencias. El instrumento
funciona; el tema TN no está.

**Confirma la documentación de 2023: este nodo solo publica direcciones.** Pero el matiz importa:
**INSPIRE TN sí existe en Zaragoza — está en el GeoServer principal como `tn-ro:RoadLink`, no en
este nodo.** Quien busque la red viaria INSPIRE aquí y se rinda, se la pierde por 200 metros.

---

## F · Licencias y condiciones de reutilización

**Petición:** `GET https://www.zaragoza.es/sede/portal/aviso-legal` → `HTTP 200`, 78.149 b.

**Licencia:** *Condiciones generales para la reutilización de los documentos del Ayuntamiento de
Zaragoza*, al amparo de la **Ley 37/2007**. La declara el catálogo 279 en su campo `licencia`:
`https://www.zaragoza.es/sede/portal/aviso-legal#condiciones`.

### ¿Permite redistribuir datos derivados? **Sí, y de forma explícita.**

> *"Las presentes condiciones generales permiten la reutilización de los documentos sometidos a
> ellas **para fines comerciales y no comerciales**. […] la reutilización autorizada incluye
> actividades como la **copia, difusión, modificación, adaptación, extracción, reordenación y
> combinación** de la información."*
>
> *"La reutilización conlleva la **cesión gratuita y no exclusiva** de los derechos de propiedad
> intelectual […] en cualquier modalidad y bajo cualquier formato, **para todo el mundo** y por el
> plazo máximo permitido por la Ley."*

Publicar en un repositorio público artefactos derivados —un grafo construido a partir de estas
capas— **está cubierto**.

### Las cinco obligaciones, con el texto exacto

1. *"Está prohibido **desnaturalizar el sentido** de la información."*
2. *"Debe **citarse la fuente** de los documentos objeto de la reutilización. Esta cita podrá
   realizarse de la siguiente manera: **«Origen de los datos: Ayuntamiento de Zaragoza»**"*
3. *"Debe **mencionarse la fecha de la última actualización** de los documentos objeto de la
   reutilización, siempre cuando estuviera incluida en el documento original."*
4. *"**No se podrá indicar, insinuar o sugerir que el Ayuntamiento de Zaragoza participa,
   patrocina o apoya** la reutilización."*
5. *"Deben **conservarse, no alterarse ni suprimirse los metadatos** sobre la fecha de
   actualización y las condiciones de reutilización."*

⭐ La obligación 3 y la 5 **tienen consecuencia técnica directa**: cada artefacto que 004 genere
debe llevar dentro la fecha de la descarga y las condiciones. No es un `README`: es un campo del
fichero.

**¿Exige registrarse?** **No.** Ninguno de los servicios consultados pidió clave, registro ni
aceptación de términos. No me he registrado en nada ni he aceptado nada.

**Coherencia con lo ya conocido:** el metadata del dataset heredado (tanda 0.A) declaraba
exactamente esta licencia y este texto de atribución. Cuadra.

---

## G · ⭐⭐ VEREDICTO: ¿se desbloquea el proyecto?

# SÍ, con una condición que hay que trabajar.

Se puede construir un grafo peatonal de Zaragoza con datos municipales públicos. **Lo que no se
puede es descargarlo y usarlo tal cual**, porque lo que se publica son líneas dibujadas, no una
red conectada. El paso de *noding* es obligatorio y no es opcional ni cosmético: sin él, el motor
devolverá "no hay ruta" entre calles que se cruzan.

### Tabla de piezas del grafo — actualizada respecto a la tanda 0.A

| Pieza | 0.A | **Hoy** | De dónde |
|---|:---:|:---:|---|
| **Nodos (orígenes/destinos)** | ✅ | ✅ | 46.150 portales; también en WFS (`urbanismo:Portales`) |
| **Aristas: ejes de calle** | ❌ | ✅ **RESUELTO** | `urbanismo:Vias` (3.359) · `JERARQUIA_VIARIA` (3.453) · `tn-ro:RoadLink` (3.644) |
| **Puente eje ↔ portal** | ❌ | ✅ **RESUELTO** | `codigo` en `urbanismo:Vias` = `codigoVia` de los portales. **JOIN exacto** |
| **Sentido de circulación** | ❌ | ✅ **RESUELTO** | `DOBLE_SENT` en `JERARQUIA_VIARIA` |
| **Velocidad / jerarquía** | ❌ | ✅ | `LIMITE_VEL`, `TIPO`, `MALLA_BASI` |
| **Peatonalidad** | ❌ | ⚠️ **PARCIAL** | `PLATAFORMA`, `PACIFICADA`, `CALLE_Z30` son *atributos de la calzada*, no una red peatonal |
| **Coste por arista (longitud)** | ❌ | ✅ | `LONGITUD` ya calculada en `JERARQUIA_VIARIA` |
| **⭐ Conectividad / topología** | ❌ | ❌ **SIGUE ABIERTO** | los tramos no comparten vértice: 5,08 m / 13,87 m / 18,37 m en el cruce medido |
| **Aceras como red** | ❌ | ❌ | `Aceras_*` es `MultiSurface` (**polígonos**), no ejes peatonales |
| **Paradas y líneas de bus/tranvía** | ✅ (0.B) | ✅✅ | GTFS 1176 + *además* `MU3_paradas_BUS`, `MU3_lineas_bus`, `MU3_lineas_tranvia` en WFS |
| **Horarios** | ✅ (0.B) | ✅ | GTFS, caduca 05/10/2026 |
| **BiZi estaciones** | ❌ | ✅ **RESUELTO** | 276 estaciones WGS84 + capa WFS `MU1_estaciones_bici_ubicacion` |
| **Carriles bici** | ❌ | ✅ **NUEVO** | `MU2_carriles_bici`, `MU1_CC_carriles_bici_todos_2025` |
| **Transbordos** | ❌ | ⬜ | se deriva cuando existan las redes |

**De 14 piezas: 9 resueltas, 2 parciales, 2 abiertas, 1 derivada.** En la tanda 0.A eran 2 de 13.

### Lo que sigue abierto, y es lo único serio

1. **La topología.** Ninguna de las tres capas es un grafo conectado. Hay que construirlo.
2. **La red peatonal propiamente dicha no existe.** Hay ejes de *calzada* con atributos que dicen
   si esa calle es peatonal o pacificada, y hay *polígonos* de acera. No hay ejes de acera ni
   pasos de peatones como entidades lineales. Para "andar de un portal a una parada", el camino
   realista es usar los ejes de calzada como aproximación —que es lo que hace casi todo el mundo—
   y no prometer precisión de acera.

### Si hubiera que elegir hoy (no se decide aquí)

La combinación con más sentido a la vista de los datos sería **`urbanismo:Vias` para el puente de
identidad con los portales** + **`JERARQUIA_VIARIA` para la geometría y los atributos de
circulación**, con OpenStreetMap como **contraste**, no como sustituto: OSM sí trae topología de
red y aceras, pero no trae `codigoVia`, que es lo único que evita repetir el emparejamiento
aproximado que ya falló en el 29,6 % de los casos.

**Esto es una observación de reconocimiento, no una propuesta de arquitectura.** La decisión es de
Antonio.

---

## H · Qué NO he mirado, y conteo de peticiones

### Conteo: **21 peticiones HTTP** (presupuesto ~25)

| # | Servicio | Petición | Resultado |
|---:|---|---|---|
| 1 | GeoServer WFS | GetCapabilities | 200 · 199.612 b |
| 2-4 | GeoServer WFS | DescribeFeatureType ×3 (`RoadLink`, `Vias`, `JERARQUIA_VIARIA`) | 200 ×3 |
| 5-6 | GeoServer WFS | GetFeature `Vias` count=3, sin/con `srsName` | 200 ×2 |
| 7-8 | GeoServer WFS | GetFeature `JERARQUIA_VIARIA` / `RoadLink` count=3 | 200 ×2 |
| 9 | GeoServer WFS | GetFeature `RoadLink` + bbox | **400 · ExceptionReport** |
| 10 | GeoServer WFS | GetFeature `JERARQUIA_VIARIA` + bbox (**control**) | 200 · 5 features |
| 11-12 | Sede | BiZi `.geojson` sin/con `srsname` | 200 ×2 · idénticas |
| 13 | Sede | BiZi sin extensión | 200 pero **`text/html`** (no era JSON) |
| 14 | GeoServer WFS | DescribeFeatureType `Aceras` | 200 |
| 15 | Sede | BiZi `.json?rows=1` (totalCount) | 200 |
| 16 | Sede | catálogo `279.json` | 200 |
| 17 | IDEZar | `visorComoMoverse/` HTML | 200 |
| 18 | INSPIRE | nodo WFS GetCapabilities | 200 |
| 19 | IDEZar | bundle `main.js` del visor | 200 · 2.001.004 b |
| 20 | GeoServer WMS | GetCapabilities | 200 · **truncado a 6 MB** |
| 21 | Sede | aviso legal | 200 |

Todas espaciadas ≥1 s. **Ningún reintento en bucle**: la única petición fallida (nº9) no se
repitió — se lanzó el **control** nº10 contra otra capa, que es una petición distinta con otro
propósito. Máximo de features pedidas en una sola petición: **5**. Nada descargado por encima de
6 MB, y ese caso se cortó y se avisó.

### Lo que NO he mirado

- **Los otros tres visores** (`visorCallejero`, `visor3D`, `cartografia-planeamiento`).
  Deliberado: ver D2.
- **Qué capas carga realmente el `visorComoMoverse`.** Requiere ejecutar la app en un navegador y
  observar su tráfico. `NO CONSTA`.
- **La lista completa de capas WMS.** El `GetCapabilities` pasa de 6 MB y se truncó. Los recuentos
  de D3 son un mínimo.
- **Las 16 capas "solo WMS" de movilidad, una a una.** Que sean capas de estilo sobre tablas ya
  publicadas en WFS es mi valoración razonada, **no una verificación**.
- **⭐ Si los tramos se tocan en el resto de la ciudad.** He medido **un cruce, con 5 tramos, en
  una bbox de 250 m del casco**. La conclusión "no hay topología" se apoya en esa muestra. No sé
  si la separación es sistemática, ni si su magnitud es siempre de ~5 m, ni si hay zonas mejor
  digitalizadas. **Antes de elegir capa habría que medirlo sobre unos cientos de cruces.**
- **Si la red cubre toda la ciudad o solo el casco.** Los `numberMatched` (3.359 / 3.453 / 3.644)
  son coherentes con un municipio entero, y el bbox declarado de `urbanismo:Vias` abarca hasta los
  barrios rurales. Pero **no he comprobado la cobertura real** pidiendo muestras en la periferia.
- **La relación entre las tres capas de viario.** `JERARQUIA_VIARIA` (3.453) y `RoadLink` (3.644)
  usan la misma convención de nombres de tramo ("DE X A Y"), lo que sugiere que una deriva de la
  otra. **Es una sospecha, no un dato.**
- **`movilidad:MU1_jerarquia_viaria`**, que puede ser un duplicado de `idezar_base:JERARQUIA_VIARIA`
  o una versión distinta. No la he consultado.
- **Las capas de transporte del WFS** (`MU3_paradas_BUS`, `MU3_lineas_bus`, `MU3_lineas_tranvia`).
  Existen y están en WFS; **no he mirado su esquema ni su calidad**. El GTFS ya cubre ese terreno,
  pero podrían ser un contraste útil.
- **El orden de ejes con `urn:ogc:def:crs:EPSG::4326`.** Ver el cabo de A7.
- **OpenStreetMap.** Es la alternativa obvia para topología y aceras y no estaba en el alcance de
  hoy, que era el Ayuntamiento.

---

## Sobre la costura "si todo sale limpio, sospecha del instrumento"

Esta vez el instrumento falló **tres veces**, y las tres quedaron cazadas:

1. **`grep -c "<FeatureType>"` devolvió 0** sobre un fichero con 178 capas, porque el XML viene en
   5 líneas y `-c` cuenta líneas. Un cero que parecía "no hay capas".
2. **Los títulos salían como `V�as` y `L�mite`** y estuve a punto de anotar que el servidor sirve
   latin-1 declarando UTF-8. **Era mi terminal (cp1252).** El fichero es UTF-8 válido —verificado
   con `iconv`, con `bytes.decode` y contando bytes—. Entrada de bitácora propia: es el reverso
   exacto del caso `ABOGACíA` de la tanda 0.A.
3. **El primer 400 de `RoadLink`** parecía culpa de mi sintaxis de bbox. El control contra otra
   capa demostró que era de la capa.

Y el hallazgo principal —que las líneas no se tocan— **solo apareció porque la costura obligaba a
buscarlo**. Con siete comprobaciones en verde (geometría declarada, geometría real, CRS,
atributos, recuentos, licencia, reproyección), el veredicto natural era "desbloqueado y limpio".
Lo está, pero no como parecía.

---

*Reconocimiento ejecutado el 2026-08-02. 21 peticiones de solo lectura a servicios públicos, todas
las respuestas guardadas crudas en `data/exploracion/` antes de interpretarlas. Sin autenticación,
sin registro, sin descargar ninguna capa completa. No se ha tocado `E:\` ni `003_ZETABUS`. 004
sigue sin repositorio.*
