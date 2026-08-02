# Inventario exhaustivo de fuentes — Zaragoza

**Fecha:** 2026-08-02
**Modo:** SOLO CONSULTA. Sin autenticación, sin registro, sin aceptar condiciones, sin formularios.
**Peticiones HTTP:** **75** de un presupuesto de 150, todas espaciadas ≥1,2 s.
**Crudos:** guardados en `data/exploracion/` **antes** de interpretarlos. Todo el análisis se hizo
sobre los ficheros en disco.
**Registro histórico fechado.** Se añade, no se reescribe.

---

## RESUMEN EN CINCO LÍNEAS

1. ⭐⭐ **Existe una capa que la tanda 0.C no llegó a abrir y que cambia la recomendación:**
   `movilidad:MU1_jerarquia_viaria` — 3.644 tramos con geometría, **código de vía**, sentido,
   velocidad, longitud y peatonalidad. Tiene las dos mitades que la 0.C creía repartidas.
2. ⭐⭐ **"Las líneas no se tocan" era mirar solo los extremos.** Los tramos **sí se cruzan**:
   87 pares y 106 puntos de intersección sobre 160 tramos. La topología está en la geometría.
3. ⭐⭐ **NO hay red peatonal municipal publicada** — confirmado con control positivo. Pero
   **sí existe y es de acceso restringido**: `4063 Rebajes pasos de peatones`,
   `5580 Escaleras urbanas`, `4065 Inventario de puentes`, todos en intranet.
4. ⭐ **OSM tiene lo que falta**: en la misma zona del casco, 115 aceras como línea, 43 pasos de
   peatones y 26 escaleras, **nodalizado por diseño**. El municipal: cero.
5. ⚠️ **HUECO 4 resuelto:** las 276 estaciones BiZi son 276 reales (FASE I 108 + FASE II 168),
   sin duplicados ni fantasmas, con **5.520 anclajes** totales.

---

# A · EL CATÁLOGO COMPLETO DEL WFS

## A1-A2 · Las 178 capas y el reparto por workspace

Parseado con `xml.etree.ElementTree` sobre el `GetCapabilities` ya guardado en la 0.C
(199.612 b, verificado íntegro: cierra en `</wfs:WFS_Capabilities>`, UTF-8 válido, sin
`ExceptionReport`). **Cero peticiones.**

**Contadores independientes:**

| Método | Resultado |
|---|---:|
| `ElementTree` → `FeatureType` | **178** |
| regex `</FeatureType>` | **178** ✓ |
| regex `<FeatureType>` | 0 ← el elemento lleva atributos (`<FeatureType xmlns:…>`) |

| Workspace | Capas | | Workspace | Capas |
|---|---:|---|---|---:|
| `movilidad` | 43 | | `ctsvg` | 9 |
| `idezar_base` | 40 | | `cp` | 2 |
| `medioambiente` | 39 | | **`tn-ro`** | **2** |
| `urbanismo` | 23 | | `ad`,`ef`,`ps`,`au`,`elu`,`infraestructuras`,`indicadores`,`infraestructuraverde` | 1 c/u |
| `mapa_del_ruido_2016` | 12 | | **TOTAL** | **178** |

### ⚠️ NO cuadra con la tanda 0.C — y es un hallazgo

La 0.C publicó un reparto que sumaba **176**, no 178. Causa: su regex
`<Name>[a-zA-Z0-9_]*:` no incluye el guion, así que descartaba **en silencio** el workspace
`tn-ro`. Reproducido: el regex viejo da 176, el corregido da 178. **Diferencia exacta: 2.**

Las dos capas perdidas eran `tn-ro:RoadLink` (que sí se analizó, por otra vía) y
**`tn-ro:Road`, que no aparece en ningún punto del informe 0.C.** Está en la bitácora.

## A3 · Clasificación de las 178

| Clase | Capas |
|---|---:|
| **[RED]** — arista o nodo del grafo | **19** |
| **[VALIDADOR]** — permite comprobar el grafo | **22** |
| **[DESTINO]** — origen/destino de ruta | **20** |
| **[FUERA]** | **117** |
| | **178** ✓ |

### [RED] — 19 capas

| Capa | Qué aporta |
|---|---|
| **`movilidad:MU1_jerarquia_viaria`** | ⭐ 3.644 tramos: geometría + `codigo` + sentido + velocidad + peatonalidad |
| `idezar_base:JERARQUIA_VIARIA` | 3.453 tramos: geometría + sentido + velocidad (**sin** código de vía) |
| **`urbanismo:Vias`** | 3.359 ejes de vía completa con `codigo` = puente exacto con los 46.150 portales |
| `tn-ro:RoadLink` | 3.644 tramos INSPIRE (⚠️ no admite `bbox`) |
| `idezar_base:Carreteras_cartoOSM_2019_{Interiores,Exteriores,Principales}` | viario con `ONEWAY` y **`BRIDGE`** (único proxy de nivel) ⚠️ ver licencia |
| `idezar_base:Ferrocarriles_cartoOSM_2019` | red ferroviaria: barrera y cruces |
| `movilidad:MU2_carriles_bici` · `idezar_base:carril_bizi_20250127` | red ciclable como línea, con `vias_codigo` |
| `movilidad:MU1_CC_carriles_bici_todos_{2024,2025}` | red ciclable por año |
| **`urbanismo:Portales`** | los 46.150 portales, en el mismo servidor |
| **`movilidad:MU3_paradas_bus_unicas`** (944) · `MU3_paradas_BUS` · `MU3_paradas_tranvia` | ⭐ traen **`stop_code`** = puente directo con el GTFS |
| `movilidad:MU1_estaciones_bici_ubicacion` | 276 estaciones BiZi con **anclajes totales** |
| `movilidad:MU3_lineas_bus` · `MU3_lineas_tranvia` | trazado (redundante con `shapes.txt` del GTFS) |

### [VALIDADOR] — 22 capas

Semáforos (`MU2_semaforos_1`, `_2`, `MU1_CC_reguladores`) — *un semáforo es evidencia de que dos
ejes se encuentran ahí*. Láminas de agua (`Rios_carto1000_2010`, `IDEZar_Zona_Menor_Agua`,
`Ebro_carto`, `EXPO_Canal`) — *un eje que cruza agua sin puente es un error*.
`Puentes_carto1000_n23_2009` (13 puentes) — *dónde SÍ se cruza*. `Manzanas`, `Plazas` — *un eje que
atraviesa una manzana es un error*. Aceras y medianas en polígono (4 capas) — *superficie
caminable*. `infraestructuras:escaleras` — *barrera de accesibilidad*. Etiquetas de calle (3) —
*contraste de rotulación*. `ad:Address` — *contraste del geocodificador*.
`JERARQUIA_VIARIA_POINTS`, `MU1_ZBE`.

### [DESTINO] — 20 capas

`MU1_parking`, `MU2_aparcabicis`, `MU3_paradas_taxi`, `MU1_puntos_recarga`; divisiones
administrativas (`Distritos_Municipales`, `Juntas_Municipales_Vecinales`, `Barrios`, `Barriadas`);
zonas verdes (5); referencia territorial INSPIRE (`cp:`, `ps:`, `au:`, `elu:`, `ef:`).

### [FUERA] — 117 capas, con su motivo

| N | Motivo |
|---:|---|
| 51 | dato ambiental (ruido, aire, islas de calor): no afecta al cálculo de una ruta |
| 16 | planeamiento urbanístico y catastro: no describe por dónde se circula |
| 15 | estadística de tráfico y equipamiento de control: mide el uso, no la red |
| 9 | serie temática ajena al cálculo de rutas (`ctsvg`) |
| 8 | gestión de la vía pública (aparcamiento, terrazas, reservas, badenes) |
| 6 | capas de etiquetas obsoletas (`_old`, `_mal`) o de rotulación de mapa |
| 4 | **mobiliario vegetal (árboles, arbustos): decorativo para un motor de rutas** |
| 3 | recinto EXPO 2008: cartografía histórica de un evento |
| 2 | **señalización horizontal y vertical: INACCESIBLE por la ñ del nombre → `NO CONSTA`** |
| 1 | `tn-ro:Road`: 3.318 features **sin geometría** (entidad lógica INSPIRE) |
| 1 | límite o malla cartográfica · 1 indicador estadístico agregado |

## A4 · Las 43 capas de `movilidad`, una a una

Era el hueco nº2 declarado por la 0.C. Las 43 están listadas en
`data/exploracion/2026-08-02_ANALISIS_178-capas-wfs.json`. Verificadas con
`DescribeFeatureType` las 11 clasificadas [RED] o [VALIDADOR]:

| Capa | Geometría | Campos destacados |
|---|---|---|
| **`MU1_jerarquia_viaria`** | **MULTILÍNEA** | 22 attr: `codigo`, `tipo_via`, `direccion`, `tramo`, `doble_sent`, `limite_vel`, `plataforma`, `pacificada`, `calle_z30`, `carril_bus`, `longitud`, `calle_2024` |
| `MU2_carriles_bici` | **MULTILÍNEA** | `vias_codigo`, `tipo_carri`, `fecha`, `longitud_total` |
| `MU3_lineas_bus` | **MULTILÍNEA** | `rt_shrt_nm`, `rt_long_nm`, `direction_`, `shape_leng` |
| `MU3_paradas_bus_unicas` | PUNTO | ⭐ `stop_code` (`PA00010`), `stop_name` |
| `MU1_estaciones_bici_ubicacion` | PUNTO | ⭐ `anclajes_bicicletas`, `numero`, `fase`, `tipologia`, `pavimento` |
| `MU2_semaforos_1` / `_2` | MULTIPOLÍGONO | ⚠️ campos de AutoCAD (`layer`, `paperspace`, `entityhand`): es un volcado DXF, no un inventario |
| `MU2_señalizacion_horizontal` / `_vertical` | — | ❌ **inaccesible** (ver A5) |

## A5 · Búsqueda dirigida por problema

Sobre las 178, **con control positivo** (`jerarquia`→3 capas, `portales`→1, `vias`→1):

| Categoría | Resultado |
|---|---|
| **Pasos de peatones / cebras** | ❌ **NO HAY** (0 capas) |
| **Túneles / pasos subterráneos** | ❌ **NO HAY** (0 capas) |
| Itinerarios peatonales / accesibles | ❌ solo las 3 de acera en polígono |
| **Aceras como línea** | ❌ las 3 que hay son `MultiSurface` (**polígonos**) |
| Escaleras / rampas / ascensores | ⚠️ 1: `infraestructuras:escaleras` — **geometría PUNTO**, inventario de accesibilidad (46 campos: pendientes, pasamanos, huella, contrahuella, `cumplimien`, `gravedad_i`) |
| Puentes | ⚠️ 1: `Puentes_carto1000_n23_2009` — **MultiSurface**, solo **13 puentes**, sin nombre |
| Carril bici / red ciclable | ✅ 12 capas |
| Zonas peatonales | ✅ **como atributo**, no como capa (ver C) |
| Semáforos [VALIDADOR] | ✅ 3 capas |
| Ríos y cauces [VALIDADOR] | ✅ 7 capas |

### ⚠️ Dos capas publicadas e inaccesibles

`movilidad:MU2_señalizacion_horizontal` y `_vertical` aparecen en el `GetCapabilities` pero
**ninguna petición sobre ellas funciona**:

```
typeNames=movilidad:MU2_señalizacion_horizontal      (UTF-8, %C3%B1)  -> HTTP 400
typeNames=movilidad:MU2_se%F1alizacion_horizontal    (latin-1, %F1)   -> HTTP 400
  InvalidParameterValue: Could not find type: {https://zaragoza.es/movilidad/}MU2_se?alizacion_horizontal
```

Dos intentos, dos fallos → se registra y se pasa. **Duele:** la señalización horizontal es la
pintura del suelo, es decir **donde vivirían los pasos de cebra**. No puedo afirmar que los
contenga ni que no. `NO CONSTA` con motivo. En la bitácora.

---

# B · LAS CANDIDATAS A RED, EN PROFUNDIDAD

## B5 · Tabla comparativa

| | `MU1_jerarquia_viaria` | `JERARQUIA_VIARIA` | `urbanismo:Vias` | `tn-ro:RoadLink` | `Carreteras_cartoOSM` |
|---|---|---|---|---|---|
| **Features** | **3.644** | 3.453 | 3.359 | 3.644 | 1.552 (Interiores) |
| **Unidad** | tramo | tramo | vía entera | tramo | tramo |
| **Geometría** | MultiLineString | MultiLineString | MultiLineString | LineString | MultiLineString |
| **⭐ id de vía** | **`codigo`** ✅ | ❌ | **`codigo`** ✅ | ❌ (`inspireId`) | ❌ (`OSM_ID`) |
| **Sentido** | **`doble_sent`** ✅ | `DOBLE_SENT` ✅ | ❌ | ❌ | `ONEWAY` ✅ |
| **Velocidad** | `limite_vel` ✅ | `LIMITE_VEL` ✅ | ❌ | ❌ | `MAXSPEED` (="0") |
| **Longitud** | `longitud` ✅ | `LONGITUD` ✅ | ❌ | ❌ | ❌ |
| **Peatonalidad** | `tipo`,`plataforma`,`pacificada` ✅ | idem ✅ | ❌ | ❌ | ❌ |
| **⚠️ Nivel/puente** | ❌ | ❌ | ❌ | ❌ | **`BRIDGE`** ✅ |
| **Validez** | `calle_2024` | ❌ | `fecha_acuerdo`/`fecha_baja` | `validFrom` | ❌ |
| **`bbox` funciona** | ✅ | ✅ | no probado | ❌ **HTTP 400** | no probado |
| **CRS** | 25830 nativo, 4326 a petición | idem | idem | idem | idem |

**`MU1_jerarquia_viaria` gana en todo menos en el nivel.** Y su relación con `tn-ro:RoadLink` es
de identidad: mismo `numberMatched` (3.644), mismos nombres de tramo (`DE ASALTO A AZNAR MOLINA`),
mismas coordenadas de inicio (`-0,8714816 / 41,6490715`). **`RoadLink` es la publicación INSPIRE de
`MU1_jerarquia_viaria`**, con menos atributos y rota para `bbox`.

## B3 · `bbox`, reverificado

`tn-ro:RoadLink` sigue devolviendo `HTTP 400` con `PSQLException: invalid input syntax for type
integer: "2_3_1_2_3"`. **Reproducible** — ya lo documentó la 0.C. La misma bbox contra
`MU1_jerarquia_viaria` y `JERARQUIA_VIARIA` → 200.

---

# C · ⭐⭐ LA MEDICIÓN DE CONECTIVIDAD

## C1 · Once zonas, con su motivo

Definidas **a partir de los datos**, no de memoria: primero se pidieron las capas de Puentes (13)
y Ríos (44) para localizar los cauces reales, y las ventanas se colocaron sobre ellos.

| Zona | bbox 25830 (400×400 m) | Motivo | Tramos |
|---|---|---|---:|
| casco | 675850,4613850 | trama irregular; **la misma zona que midió la 0.C** | 19 |
| ensanche | 676600,4613400 | trama regular | 50 |
| ebro_pte1 | 675450,4614150 | puente real sobre el **EBRO** (675652,4614326) | 17 |
| ebro_pte2 | 674200,4614750 | segundo puente sobre el **EBRO** | 6 |
| huerva | 676100,4612200 | cauce real del **HUERVA** | 27 |
| gallego_sur | 679400,4614300 | desembocadura del **GÁLLEGO** | 4 |
| gallego_urb | 680150,4615700 | **GÁLLEGO** en zona urbana | 16 |
| actur | 675300,4616300 | barrio periférico al norte del Ebro | 19 |
| industrial | 679800,4617300 | polígono industrial noreste | 4 |
| sur | 672300,4608400 | Valdespartera — **test de cobertura** | 6 |
| nudo | 676750,4613850 | nudo/glorieta grande | 30 |
| *(gallego)* | 681050,4621450 | centroide del Gállego — **0 features**: fuera de la ciudad | 0 |

**C7 · Cobertura:** Valdespartera (periferia sur, a 6 km del centro) devuelve features. **La capa
cubre el municipio, no solo el casco.**

## C2 · Resultados por zona

⚠️ **Estas cifras son por ventana y sin deduplicar entre ventanas.** Los agregados globales sí
están deduplicados (ver más abajo).

| Zona | Tramos | % extremos exactos | NN mediana | Tramos peatonales |
|---|---:|---:|---:|---|
| casco antiguo | 19 | 16 % | 7,8 m | 2 (11 %) |
| ensanche | 50 | 16 % | 10,5 m | **25 (50 %)** |
| puente EBRO 1 | 17 | 35 % | 14,8 m | 1 (6 %) |
| puente EBRO 2 | 6 | 33 % | 7,3 m | 0 |
| río HUERVA | 27 | 11 % | 16,5 m | 0 |
| GÁLLEGO sur | 4 | 50 % | 2,9 m | 0 |
| GÁLLEGO urbano | 16 | 12 % | 14,7 m | 0 |
| Actur | 19 | 21 % | 15,1 m | 2 (11 %) |
| pol. industrial | 4 | 0 % | 17,0 m | 0 |
| Valdespartera | 6 | 0 % | 15,1 m | 0 |
| nudo/glorieta | 30 | 10 % | 15,3 m | 5 (17 %) |

## ⚠️ Corrección de mi propia medición

El primer agregado dio **33 pares exactos** y 16,7 %. Era falso: un filtro `bbox` devuelve toda
feature **que intersecte** la ventana, y esta capa mezcla tramos de 13 m con features de **19,4 km**
(`HISPANIDAD`, la ronda entera como una sola entidad). Cuatro de esas vías gigantes atraviesan
**8 de mis 11 ventanas** y sus extremos se contaban una vez por ventana:

```
features sumando zonas : 198        tramos UNICOS por fid : 160
duplicacion            :  38        tramos en >1 zona     :  12  (4 de ellos en 8 zonas)
```

Todo lo que sigue está deduplicado. En la bitácora.

## C3 · ⭐ El número que se buscaba

**Sobre 160 tramos únicos, 320 extremos, 50.880 pares evaluados:**

```
  [ 0.00 -  0.01) m :   21  #####################
  [ 0.01 -  0.50) m :    2  ##
  [ 0.50 -  1.00) m :    3  ###
  [ 1.00 -  1.50) m :    5  #####
  [ 1.50 -  2.00) m :    4  ####
  [ 2.00 -  3.00) m :   10  ##########
  [ 3.00 -  4.00) m :   10  ##########
  [ 4.00 -  5.00) m :   12  ############
  [ 5.00 -  6.00) m :   11  ###########
  [ 6.00 -  8.00) m :   14  ##############
  [ 8.00 - 10.00) m :   14  ##############
  [10.00 - 12.00) m :    9  #########
  [12.00 - 15.00) m :   16  ################
  [15.00 - 20.00) m :   39  #######################################
  [20.00 - 30.00) m :   83  ############################################################
```

| Percentil NN | Valor |
|---|---:|
| min / p10 | 0,00 m |
| p25 | 3,15 m |
| **mediana** | **15,00 m** |
| p75 | 44,06 m |
| max | 495,52 m |

### ⚠️⚠️ NO EXISTE UNA TOLERANCIA LIMPIA

Hay un **pico en 0** (21 pares ya soldados), un **valle estrecho entre 0,01 y 2 m** (14 pares) y
a partir de 2 m **crecimiento monótono sin valle**. No hay ningún umbral que separe "deben unirse"
de "no deben unirse".

Y hay un techo duro: en el casco las calles miden 8-15 m de ancho, y la **mediana de NN es 15 m**
— del orden del ancho de calle. Cualquier tolerancia ≥10 m uniría esquinas de manzanas distintas.

**Tolerancia segura recomendada: ≈2 m.** Con ella se recupera poco. Es el aviso que pedía la
costura: la tolerancia no resuelve el problema.

## ⭐⭐ Pero la tolerancia NO era la pregunta correcta

Antes de firmar eso, comprobé lo que la 0.C daba por sabido: **si las geometrías se cruzan**.

```
extremos que coinciden exactamente (<0,01 m) : 21 pares
pares de tramos que SE CRUZAN geometricamente : 87 pares   (106 puntos de cruce)
```

**La información topológica está en el dato.** No está en los extremos: está en las
intersecciones. Dos calles que se cruzan en X no comparten extremos — se cortan por el medio.

**El paso que 004 debe construir no es "adivinar una tolerancia grande", sino planarizar**
(partir cada tramo en sus intersecciones) y usar la tolerancia pequeña (≈2 m) solo para las puntas
sueltas. Está en la bitácora.

### Naturaleza de los 21 pares exactos

| | N |
|---|---:|
| **fin de uno = inicio de otro (nodo real)** | **16** |
| geometría idéntica (tramo duplicado) | 4 |
| ini/ini o fin/fin | 1 |

Ejemplo de nodo real, con los nombres encajando:
`PREDICADORES "DE CESAR AUGUSTO A MOSEN PEDRO DOSSET"` **(fin)** = `PREDICADORES "DE MOSEN PEDRO
DOSSET A POSTIGO DEL EBRO"` **(inicio)**.

## C4 · ⚠️ NO hay campo de nivel — y esto es serio

Búsqueda de `nivel|cota|altur|elev|level|bridge|tunel|layer` en las 16 capas verificadas, con el
extractor de campos **corregido** (el primero asumía que `name` es el primer atributo del elemento
y estaba ciego; lo delató un control con `BRIDGE`, que yo había visto a ojo):

| Capa | Campo |
|---|---|
| `idezar_base:Carreteras_cartoOSM_2019_*` | **`BRIDGE`** ← único proxy de nivel |
| `infraestructuras:escaleras` | `altura_lib` (altura libre, accesibilidad) |
| `movilidad:MU2_semaforos_1` | `layer` (capa CAD, no nivel) |
| **`movilidad:MU1_jerarquia_viaria`** | **NINGUNO** (24 elementos, ninguno de nivel) |

**Con 106 cruces geométricos y sin campo de nivel, planarizar fusionaría los pasos elevados con
las calles de debajo.** Uno de los cruces detectados es `GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE`,
con la intersección **en medio de ambos tramos** — la forma exacta de una autovía pasando por
encima. El único desambiguador municipal está en las capas derivadas de OSM. En la bitácora.

## C5 · ✅ La geometría SÍ está orientada

Entre tramos de la misma calle (mismo `codigo`):

```
FIN de A = INI de B :  9     <- orientacion COHERENTE
INI de A = INI de B :  0
FIN de A = FIN de B :  0
```

Resultado limpio: **un tramo "DE A A B" empieza en A**. `doble_sent` se puede combinar con el
orden de puntos sin reconstruir el sentido.

## C6 · Duplicados

**2 pares de geometría exactamente idéntica** sobre 160 tramos (1,25 %): `SAN BRUNO "DE CALLE
MUNDIR I A PLAZA SAN BRUNO"` y `ARIÑO "DE DON JAIME I A CALLE SAN FELIX"`, cada uno repetido con
los mismos atributos. Además **4 grupos con el mismo `(codigo, tramo)`** — probables parejas
ida/vuelta, que es correcto.

**Un dato bueno:** el campo `longitud` coincide con la geometría medida (diferencia mediana
**0,00 m**, máxima 0,06 m). Es fiable.

⚠️ **Pero la unidad no es homogénea:** mediana 210 m, p75 559 m, **12 tramos de más de 5 km** y un
máximo de **19.414 m**. Una arista de 19 km por la que no se puede entrar ni salir por el medio no
sirve como arista. **Esto refuerza que hay que planarizar, no solo nodalizar.**

---

# D · EL CATÁLOGO DE DATOS ABIERTOS

## D1 · 709 conjuntos

`GET https://www.zaragoza.es/sede/servicio/catalogo.json?rows=50&start=N` × 15 →
**709 registros, 709 ids únicos** (control: 14×50 + 9 = 709 ✓).

## D2 · Cruce con el WFS

| | |
|---|---:|
| Conjuntos del catálogo | 709 |
| Conjuntos que declaran formato **WFS** | **245** |
| Conjuntos **sin ningún formato** declarado | 202 |
| Capas en el `GetCapabilities` público | **178** |
| **Conjuntos con endpoint en `infraestructuras-lan` (intranet)** | **115** |

**245 declaran WFS y solo 178 capas se sirven en el WFS público.** La diferencia vive en
servidores de intranet.

### Acceso declarado de los 709

| Acceso | N | % |
|---|---:|---:|
| (sin declarar) | 289 | 40,8 % |
| Público (todas las variantes) | 179 | 25,2 % |
| **Restringido / no público / confidencial** | **240** | **33,8 %** |

## D3-D4 · ⭐ La calibración del catálogo, y lo que reveló

La pregunta era: *si publican farolas y no publican pasos de peatones, es una conclusión fuerte*.
**Publican farolas** — y con mucho detalle:

| id | Conjunto |
|---|---|
| 4069-4072 | **Alumbrado Público** — Centros de Mando, Arquetas, **Soportes**, Tramos |
| 5940 | **Arbolado en vía Pública** · 1922 Especies de árboles y arbustos |
| 4002, 4003, 5499 | **Semáforos 1**, **Semáforos 2**, Reguladores semafóricos |

**Y también publican —catalogan— los pasos de peatones. Pero restringidos:**

| id | Conjunto | `accessRights` | Endpoint |
|---|---|---|---|
| **4063** | **Rebajes pasos de peatones** | *"Restringido. Técnicos del Servicio de Conservación de Infraestructuras y de las empresas Adjudicatarias…"* | **ninguno publicado** |
| **5580** | **Escaleras urbanas (gestión interna)** | *"No público"* | `geoserver/infraestructuras-lan/wms` (**intranet**) |
| **4065** | **Inventario de puentes y estructuras similares** | *"Restringido… claves de acceso al Visor de Infraestructuras"* | **intranet** |
| 4066, 4067 | Inspección / Deterioros en puentes | restringido | intranet |

**No es que el Ayuntamiento no tenga red peatonal fina: es que no la publica.** Las tres fichas
devuelven **404** en la ruta pública `/catalogo/<id>.json` mientras el conjunto 279 sí responde.

⚠️ **No he intentado acceder a ninguno de estos endpoints, ni registrarme, ni pedir claves.** La
vía legítima —una solicitud formal de reutilización al amparo de la Ley 37/2007— es decisión de
Antonio, no mía.

---

# E · BIZI — HUECO 4 RESUELTO

## E1-E2 · Qué son las 276

Descargadas **las 276 completas** por paginación (6 peticiones, 50+50+50+50+50+26 = 276 ✓):

| Comprobación | Resultado |
|---|---|
| `numero` | 1 … 276, **276 únicos, 0 duplicados** |
| Coordenadas | **276 únicas**, 0 repetidas, **0 sin geometría** |
| **Pares a menos de 25 m** | **0** ← no hay duplicados encubiertos |
| Fases | **FASE I: 108 · FASE II: 168** |
| Tipología | LINEAL 239 · ENFRENTADA 27 · DOBLE 10 |
| Pavimento | CALZADA 122 · ACERA 122 · ZONA VERDE 28 · MEDIANA 4 |
| **Anclajes totales** | **5.520** (mín 15, máx 41 por estación) |

**Explicación del "276 vs ~130":** las cifras públicas de ~130 corresponden a la **red original
(FASE I = 108)**. La FASE II añadió 168 estaciones más. **No hay estaciones fantasma ni bajas
ocultas.**

⚠️ **Matiz honesto:** la capa WFS es un **inventario de ubicaciones** y **no tiene campo de
estado ni de baja**. Que una ubicación esté inventariada no garantiza que la estación esté
operativa hoy. El estado sólo está en el servicio en vivo, que es dato fuera de la v1.

## E3 · ✅ El cabo de los anclajes queda cerrado

La 0.C anotó que *"el nº TOTAL de anclajes no viene, solo los disponibles"*. **Sí viene** — en la
capa WFS, campo **`anclajes_bicicletas`**. La 0.C solo había mirado el `.geojson` de la sede.

## E4 · Las dos fuentes son consistentes

| Comprobación | Resultado |
|---|---|
| Nº de registros | **276 en ambas** |
| Cruce por número (muestra de 50 del geojson) | **50 de 50 encontradas** en el WFS |
| Distancia entre las dos posiciones | **ninguna a más de 50 m** |
| Puente de identidad | `numero` (WFS) = prefijo numérico de `title` (geojson) |

Y confirmado con muestra ampliada (N=50, antes N=5): **`estadoEstacion` dice `no-operativa` en
50 de 50** mientras `estado` dice `IN_SERVICE`. El bug de la 0.C se sostiene.

---

# F · OPENSTREETMAP COMO CONTRASTE

Una sola consulta Overpass acotada a la **misma zona del casco** (41,6555/-0,8925 a
41,6595/-0,8865, ~500×440 m): `way["highway"]` → 309 ways, 1.045 nodos.

## F1-F2 · Lo que al dato municipal le falta

| `highway=*` | N | | `footway=*` | N |
|---|---:|---|---|---:|
| **footway** | **191** | | **sidewalk** | **115** |
| residential | 26 | | **crossing** | **43** |
| **steps** | **26** | | traffic_island | 6 |
| **pedestrian** | 20 | | (sin subtipo) | 27 |
| primary | 14 | | | |
| service | 10 | | **PEATONALES** | **255** |
| path | 8 | | **CALZADA** | **54** |
| living_street | 6 | | | |
| tertiary | 4 · cycleway 4 | | | |

**En la misma zona: OSM tiene 115 aceras como línea, 43 pasos de peatones y 26 escaleras. El dato
municipal tiene CERO de las tres cosas.**

Y en densidad de calzada: **54 ways de calzada en OSM frente a 19 tramos municipales** en una
ventana equivalente. OSM está más subdividido.

## F3 · ✅ OSM SÍ está nodalizado (comprobado, no asumido)

| | |
|---|---:|
| Nodos referenciados por los ways | 1.045 |
| **Nodos compartidos por ≥2 ways** | **411 (39,3 %)** |
| Nodos compartidos por ≥3 ways | 95 |
| Máximo de ways en un nodo | 4 |

Y con **el mismo criterio** que apliqué al municipal: **319 pares de extremos que son el mismo
nodo**, sobre 618 extremos — frente a **21 pares sobre 320 extremos** en el municipal.

La diferencia no es de grado, es de naturaleza: **en OSM la conectividad es por identidad de nodo**
(dos ways comparten el objeto nodo), no por coincidencia de coordenadas. No hace falta noding.

## F4 · ⚠️ Licencia ODbL y su efecto contagio

OSM se publica bajo **ODbL 1.0**, que exige tres cosas: **atribución** (`© colaboradores de
OpenStreetMap`), **share-alike sobre bases de datos derivadas** y **mantener abierto** el acceso.

El punto que importa: si 004 **combina** la red municipal con geometría de OSM para producir un
grafo, ese grafo es con toda probabilidad una *base de datos derivada* y quedaría sujeto a la
ODbL — con lo que habría que publicarlo bajo ODbL. Usar OSM sólo para *contrastar* (medir, validar,
comparar) no produce derivado; **integrarlo sí**.

> ⚠️ Esto es un resumen de las obligaciones de la licencia, no asesoramiento legal. Si 004 va a
> combinar ambas fuentes, la decisión de licencia del repositorio hay que tomarla a conciencia.

### ⚠️⚠️ Y hay una trampa: el Ayuntamiento ya publica dato de OSM como suyo

`idezar_base:Carreteras_cartoOSM_2019_*` y `Ferrocarriles_cartoOSM_2019` traen campo **`OSM_ID`**
con identificadores reales (`153226366`, `149219582`…), tags de OSM (`ONEWAY`, `BRIDGE`,
`MAXSPEED`) y el mojibake típico de una importación (`"Gran VÃ­a"`). Sin embargo:

```
busqueda de "openstreetmap|odbl|open street" en los 709 conjuntos -> 0
CONTROL: conjuntos que mencionan "Ayuntamiento"                   -> 691
conjunto 3 "Cartografia Base" (que las agrupa): licencia municipal, sin mencionar OSM
```

**Quien tome esas capas fiándose de la ficha del catálogo creerá que usa dato municipal y estará
usando dato ODbL sin atribución.** Y son precisamente las únicas capas municipales con `BRIDGE`.
En la bitácora.

## F5 · ⭐ Veredicto honesto: ¿municipal, OSM o los dos?

**Los dos, y con reparto de papeles claro** — es lo que dicen los números, no una preferencia:

- **Municipal (`MU1_jerarquia_viaria`) para la red rodada y el puente de identidad.** Es lo único
  que tiene `codigo` de vía, y con él el JOIN exacto con los 46.150 portales. Sin eso hay que
  emparejar por nombre y cercanía, que es el mecanismo que ya falló en el 29,6 % del
  enriquecimiento OSM (bitácora 0.A nº2). También aporta `doble_sent`, `limite_vel`, `plataforma`
  y los **410 tramos peatonales**, que OSM no clasifica igual.
- **OSM para la red peatonal fina.** Aceras, pasos de peatones y escaleras **no existen en el dato
  municipal público**, y OSM las tiene como líneas y ya nodalizadas. No hay alternativa municipal
  medida hoy.

**Si hubiera que elegir UNA sola:** OSM, porque un motor peatonal sin aceras ni pasos de peatones
promete lo que no puede cumplir. Pero se perdería el puente exacto con los portales, y eso degrada
justo la mitad "de X a Y" que ya estaba resuelta.

---

# G · LICENCIAS

## G1 · Fuente municipal

**Licencia:** condiciones generales de reutilización del Ayuntamiento de Zaragoza (Ley 37/2007),
en `https://www.zaragoza.es/sede/portal/aviso-legal#condiciones`.

**¿Permite redistribuir derivados?** **Sí, expresamente**, para fines comerciales y no
comerciales, incluyendo *"copia, difusión, modificación, adaptación, extracción, reordenación y
combinación"*, con cesión *"gratuita y no exclusiva… para todo el mundo"*.

**Las cinco obligaciones** (texto exacto en el informe de la 0.C §F): no desnaturalizar · citar
**«Origen de los datos: Ayuntamiento de Zaragoza»** · mencionar la fecha de última actualización ·
no sugerir patrocinio · **conservar los metadatos de fecha y condiciones**.

## G2 · ⭐ Requisito técnico, no nota legal

Las obligaciones 3 y 5 se cumplen **dentro del fichero**, no en un README. Todo artefacto que
004 genere a partir de estas capas debe llevar en su propio contenido:

- la fecha de descarga y la fecha de última actualización declarada por la fuente,
- el texto de las condiciones de reutilización aplicables,
- la atribución.

Esto es exactamente lo que 003 hacía bien con su bloque `provenance` por registro
(`source`, `observedAt`, `sourceUpdatedAt`, `url`, `confidence`) — **una decisión trasplantable
gratis** según la ley del trasplante.

## G3 · Si se combinan las dos fuentes

| Combinación | Licencia resultante |
|---|---|
| Solo municipal | Municipal (Ley 37/2007) + las 5 obligaciones |
| Solo OSM | **ODbL 1.0** (atribución + share-alike + keep open) |
| **Municipal + OSM integrados** | **ODbL 1.0 con alta probabilidad**, por el share-alike sobre bases derivadas, **más** las obligaciones municipales, que son compatibles (ambas exigen atribución y ninguna prohíbe la otra) |
| Municipal + OSM solo como contraste | Municipal (OSM no entra en el producto) |

Las dos licencias son **compatibles en la práctica**: ninguna prohíbe lo que la otra exige. Lo que
cambia es que la ODbL **obliga a liberar el derivado**, y eso es una decisión de proyecto.

---

# H · ENTREGABLES

## H2 · Tabla de piezas del grafo — actualizada

| Pieza | 0.C | **Hoy** | Qué cambia |
|---|:---:|:---:|---|
| Nodos (portales) | ✅ | ✅ | también en WFS (`urbanismo:Portales`) |
| Aristas: ejes de calle | ✅ | ✅ | **mejor capa**: `MU1_jerarquia_viaria`, 3.644 tramos |
| **Puente eje ↔ portal** | ✅ | ✅✅ | ahora en la **misma capa** que los tramos (`codigo`) |
| Sentido de circulación | ✅ | ✅ | `doble_sent`, 34,7 % doble sentido |
| Velocidad / jerarquía | ✅ | ✅ | + `tipo` en 6 clases |
| Coste (longitud) | ✅ | ✅ | `longitud` **verificada** contra la geometría (±0,06 m) |
| **Peatonalidad** | ⚠️ | ⚠️→✅ | **410 tramos `06_Peatonal`** y **769 con plataforma única** sobre 3.644 |
| **⭐ Topología** | ❌ | ⚠️ **PARCIAL** | 21 extremos soldados **pero 87 pares se cruzan**: hay que **planarizar**, no adivinar tolerancia |
| **⚠️ Nivel (pasos elevados)** | (no evaluado) | ❌ **NUEVO HUECO** | sin campo de nivel; único proxy = `BRIDGE` de las capas OSM |
| **Red peatonal (aceras/pasos)** | ❌ | ❌ **municipal** / ✅ **OSM** | existe restringida en el Ayuntamiento; pública solo en OSM |
| Paradas bus/tranvía | ✅ | ✅✅ | + `MU3_paradas_bus_unicas` (944) con **`stop_code`** |
| Horarios | ✅ | ✅ | GTFS, caduca 05/10/2026 |
| **BiZi estaciones** | ✅ | ✅✅ | 276 **verificadas**, + **5.520 anclajes** totales |
| Carriles bici | ✅ | ✅ | 3 capas con `vias_codigo` |
| Transbordos | ⬜ | ⬜ | se deriva cuando existan las redes |

**De 15 piezas: 11 resueltas, 2 parciales, 1 abierta municipal (peatonal), 1 hueco nuevo (nivel).**

## H3 · Ficha de conectividad

| | |
|---|---|
| **Muestra** | **N = 160 tramos únicos** (deduplicados), 320 extremos, 50.880 pares, **11 zonas** |
| Extremos con vecino exacto | **13,1 %** |
| NN mediana | **15,00 m** |
| Pares exactos | **21** (16 nodos reales, 4 duplicados, 1 otro) |
| **Pares que se cruzan** | **87** (106 puntos de intersección) |
| **Tolerancia recomendada** | **≈2 m** |
| **Argumento** | único valle del histograma (0,01-2 m: 14 pares). Por encima de 2 m la densidad crece de forma monótona y no hay separación |
| **Riesgo de falso positivo** | **alto por encima de 5 m**: la NN mediana (15 m) es del orden del ancho de calle del casco (8-15 m). Una tolerancia de 10 m uniría esquinas de manzanas distintas |
| ⚠️ **Advertencia** | la tolerancia **no resuelve** el problema: recupera poco. Lo que lo resuelve es **planarizar** por intersección, y para eso hace falta el nivel, que no existe |

## H4 · ⭐ VEREDICTO SOBRE EL HUECO PEATONAL

> ## NO existe red peatonal municipal publicada. Sí existe, y es de acceso restringido.

**Lo que hay en abierto:**

- ❌ Aceras como eje: **no**. Las 3 capas de acera son `MultiSurface` (polígonos de pavimento).
- ❌ Pasos de peatones: **no** en el WFS (confirmado con control positivo).
- ❌ Túneles / pasos subterráneos: **no**.
- ⚠️ Escaleras: **como punto**, en un inventario de accesibilidad (46 campos de auditoría).
- ⚠️ Puentes: **como polígono**, y solo **13**.
- ✅ **Calles peatonales como atributo del viario**: **410 tramos `06_Peatonal`** y **769 con
  `plataforma` única**. Esto es más de lo que la 0.C sabía y es aprovechable.

**Lo que existe pero no se publica:** `4063 Rebajes pasos de peatones`, `5580 Escaleras urbanas`,
`4065 Inventario de puentes` — restringidos a técnicos municipales y contratas, servidos desde
`infraestructuras-lan`.

**La mejor alternativa REAL, medida hoy: OpenStreetMap.** En 500×440 m del casco aporta 115
aceras, 43 pasos de peatones y 26 escaleras como líneas, ya nodalizadas. Es la única fuente
pública medida que cubre el hueco.

## H5 · Fuentes recomendadas — PROPUESTA (decide Antonio)

| # | Fuente | Qué aporta | ⚠️ Qué arrastra | Recomendación |
|---|---|---|---|---|
| **1** | **`movilidad:MU1_jerarquia_viaria`** | La columna vertebral: 3.644 tramos, geometría, **`codigo` de vía**, sentido, velocidad, longitud verificada, 410 tramos peatonales | Sin campo de nivel · unidad no homogénea (hasta 19 km) · 1,25 % duplicados · hay que planarizar | ✅ **TOMAR** — es la mejor capa del catálogo y no tiene rival |
| **2** | **GTFS 1176 del NAP** | Bus + tranvía + `shapes.txt` + horarios | **Caduca 05/10/2026** · atribución MITMS · descargar, no copiar de 003 | ✅ **TOMAR** (ya decidido en 0.B) |
| **3** | **`urbanismo:Portales`** | Los 46.150 nodos de origen/destino, en el mismo servidor | Nada nuevo | ✅ **TOMAR** — y ahora por WFS, sin depender del disco E: |
| **4** | **OpenStreetMap (zona Zaragoza)** | **La red peatonal completa**: aceras, pasos, escaleras. Y ya nodalizada | ⚠️ **ODbL con share-alike**: el grafo derivado quedaría bajo ODbL · sin `codigoVia` | ⚠️ **DEPENDE** — es la única forma de tener red peatonal, pero condiciona la licencia del proyecto. **Es la decisión de fondo de la siguiente tanda** |
| **5** | `movilidad:MU3_paradas_bus_unicas` | 944 paradas con **`stop_code`** = puente con el GTFS | Redundante con el GTFS; útil como **contraste** (944 vs 934 del GTFS: **10 de diferencia sin explicar**) | ⚠️ **TOMAR solo como validador** |
| **6** | `movilidad:MU1_estaciones_bici_ubicacion` | 276 estaciones + **anclajes totales** (5.520) | Sin campo de estado: es inventario, no disponibilidad | ✅ **TOMAR** — mejor que el `.geojson` para la v1 (que no usa datos vivos) |
| **7** | `movilidad:MU2_carriles_bici` + `carril_bizi` | Red ciclable como línea, con `vias_codigo` | Tres capas solapadas por año: hay que elegir una | ✅ **TOMAR una**, la más reciente |
| **8** | Semáforos, ríos, puentes, manzanas | **[VALIDADOR]** del noding | Nada: no entran en el producto | ✅ **TOMAR como test**, no como dato |
| **9** | `idezar_base:Carreteras_cartoOSM_2019_*` | Único `BRIDGE` municipal | ⚠️ **Es OSM sin declarar**: usarlo arrastra ODbL sin que la ficha lo diga · mojibake en `NAME` | ❌ **NO TOMAR** — si se necesita `BRIDGE`, mejor ir a OSM directamente y con la licencia clara |
| **10** | `tn-ro:RoadLink` / `tn-ro:Road` | — | `RoadLink` es `MU1_jerarquia_viaria` con menos campos y roto para `bbox`; `Road` no tiene geometría | ❌ **NO TOMAR** |

## H6 · ⭐ Preguntas que NO he podido responder

| Pregunta | Qué haría falta |
|---|---|
| **¿Contiene `MU2_señalizacion_horizontal` los pasos de cebra?** | Que el servidor resuelva su nombre con `ñ`. Dos codificaciones probadas, ambas 400. Alternativa: pedirlo por WMS `GetFeatureInfo`, o preguntar al Ayuntamiento |
| **¿Cuántos de los 106 cruces son a distinto nivel?** | Un campo de nivel que no existe. Se podría estimar cruzando con `BRIDGE` de las capas OSM, o con OSM directamente |
| **¿La tolerancia de 2 m se sostiene en toda la ciudad?** | Medir sobre cientos de cruces, no 160 tramos. Requiere descarga masiva (otra tanda) |
| **¿Por qué 944 paradas en el WFS y 934 en el GTFS?** | Comparar los 944 `stop_code` con los del GTFS. No lo he hecho: habría que descargar las 944 |
| **¿Los `4063/5580/4065` restringidos se pueden solicitar?** | Una solicitud formal de reutilización (Ley 37/2007). **Decisión de Antonio, no mía** |
| **¿Cubre OSM toda Zaragoza con esa densidad peatonal?** | He medido **una** zona del casco (500×440 m). El casco suele ser lo mejor mapeado; la periferia puede estar mucho peor |
| **¿Qué capas carga el `visorComoMoverse`?** | Ejecutar la app en navegador y observar su tráfico (declarado ya como `NO CONSTA` en la 0.C) |

## H7 · Conteo de peticiones — **75**

| Bloque | N |
|---|---:|
| `DescribeFeatureType` (WFS IDEZar) | 16 |
| `GetFeature` muestras (WFS IDEZar) | 12 |
| `GetFeature` por zona — conectividad | 13 |
| `resultType=hits` — conteos por atributo | 9 |
| Paginación BiZi (WFS) | 6 |
| Catálogo datos abiertos — índice paginado | 15 |
| Fichas de catálogo (279 previo, 3, 4063, 5580, 4065) | 4 |
| Overpass (OSM) | 1 |
| **TOTAL** | **75** / 150 |

**Fallos registrados:** 3 (los dos intentos de la `ñ`, y `RoadLink` con `bbox`). Ninguno
reintentado más de una vez. **Nada descargado por encima de 5 MB.** Ningún servicio dio 429 ni 5xx.

## H8 · Qué NO he mirado

- **Los otros tres visores** — sigue igual que en la 0.C.
- **Las 117 capas [FUERA] no se abrieron una a una.** Se clasificaron por nombre, título y
  palabras clave. **Es clasificación documental, no verificación** — y contradice parcialmente la
  ley de "no deduzcas del nombre". Lo declaro: si alguna de las 117 escondiera algo útil, no me
  habría enterado. Abrí las 41 clasificadas [RED]/[VALIDADOR]/[DESTINO] que tenían plausibilidad,
  y de ellas verifiqué **16 con `DescribeFeatureType`**.
- **`MU1_CC_carriles_bici_todos_2023/2024/2025`**: no comparadas entre sí.
- **`movilidad:MU3_paradas_BUS` y `MU3_paradas_tranvia`**: existen y son [RED]; no verificadas.
- **La cobertura peatonal de OSM fuera del casco.**
- **El WMS**: no reconsultado (su `GetCapabilities` pasa de 6 MB).
- **Las 3 capas `Carreteras_cartoOSM`**: solo verificada `Interiores`.

---

## Sobre la costura "si sale limpio, sospecha del instrumento"

Van cuatro tandas y en las cuatro había algo torcido. Hoy, **el instrumento falló cinco veces** y
las cinco quedaron cazadas y documentadas:

1. El regex de workspaces de la 0.C **descartaba `tn-ro` por el guion** — 2 capas invisibles.
2. Mi barrido de campos **asumía que `name` es el primer atributo** del `<xsd:element>` y estaba
   ciego a todos los campos; lo delató un control con `BRIDGE`.
3. Mi muestreo por zonas **contaba los mismos tramos hasta 8 veces** (33 pares → 21 reales).
4. La conclusión de la 0.C **medía la magnitud equivocada**: extremos en vez de intersecciones.
5. El `grep -c` sobre XML en una línea — ya conocido, evitado con parser y doble contador.

Y lo que **no** he podido comprobar de mi propia conclusión, que es lo que toca escribir aunque
no se pueda cerrar: **he clasificado 117 capas sin abrirlas**, y **he medido la conectividad sobre
160 tramos de una ciudad que tiene 3.644**. Los dos números que más pesan en este informe —"no hay
red peatonal" y "tolerancia ≈2 m"— se apoyan, el primero en una búsqueda documental con control, y
el segundo en el 4,4 % de la red. Ninguno está cerrado del todo.

---

*Reconocimiento ejecutado el 2026-08-02. 75 peticiones de solo lectura, todas las respuestas
guardadas crudas en `data/exploracion/` antes de interpretarlas. Sin autenticación, sin registro,
sin acceder a ningún endpoint restringido, sin descargar ninguna capa completa. No se ha tocado
`E:\` ni `003_ZETABUS`. 004 sigue sin repositorio.*
