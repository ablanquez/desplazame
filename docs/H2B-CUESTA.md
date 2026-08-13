# H2b · TANDA 6 — LA CUESTA

**Qué contesta:** si hay dato de elevación para Zaragoza y de qué calidad, cuánta
cuesta hay de verdad en la red de bici, cómo la modelan los tres motores de
referencia, y **cuánto se movería lo ya publicado si la pendiente entrara.**

⛔ **Esta tanda MIDE. No aplica la pendiente al motor, no recalcula nada
publicado, no toca `src/` y no hace el grafo dirigido.**

Reproducir:

```
node tools/grafo/mdt.js --bajar     # 332 teselas del MDT05, ~407 MB, ~50 s
node tools/grafo/mdt.js             # la resolución medida y el segundo testigo
node tools/grafo/cuesta.js          # la medición
```

---

## 1 · ⭐⭐⭐ ¿HAY DATO DE ELEVACIÓN? SÍ — Y NO ES EL MUNICIPAL

### 1.1 · Lo que NO sirve, mirado antes de descartarlo

| fuente | qué tiene | por qué no vale |
|---|---|---|
| **OSM** (el crudo del proyecto, 48.211 elementos) | **0** ways con tag `ele` | no hay ninguna cota que leer |
| **OSM** `incline` | 501 ways de 48.211 (**1,0 %**) | de esos, **476 solo dicen `up`/`down`**: dirección, no magnitud. Los 25 con número son un muestrario: `"15"`, `"10°"`, `"5º"`, `"-100%"`, `"200%"`, `"up/down"` |
| **callejero municipal** (46.150 portales) | `coordLat`, `coordLon` | ninguna altitud |
| **IDEZar WFS**, las 178 capas | ninguna capa de elevación | ⭐ con su positivo de control: el mismo barrido encuentra las tres capas de aceras |
| ⚠️ **`urbanismo:IDEZar_Ordenacion_lineas`** | **57.804 líneas** con `COMMENT` = «curvas de nivel» y «curvas de nivel directoras», de 219.089 | **es DIBUJO, no dato**: sus atributos son `LEVEL`, `RED`, `GREEN`, `BLUE`, `LEVEL_NAME`. Geometría **2D**. ⛔ **Una curva de nivel sin su valor es una línea** |

⚠️ **Y la trampa que tiene esa última, dicha en voz alta:** el atributo se llama
`LEVEL_NAME` y vale `"Nivel 5"`. Un lector que busque «curvas de nivel» lo lee
como una cota. **Es el número de pluma del CAD** — la misma feature trae
`RED: 120, GREEN: 0, BLUE: 0`, que es el color con el que se pinta. El aviso del
encargo —*«puede ser cartografía de dibujo, no un modelo de elevación
consultable»*— era exacto, y no se ha resuelto suponiendo: se ha pedido la capa.

### 1.2 · Lo que sí sirve

**Servicio:** WCS INSPIRE de elevación del IGN — `https://servicios.idee.es/wcs-inspire/mdt`

Su propio `ows:Abstract`: *«Modelos Digitales del Terreno de paso de malla de
1000, 500, 200, 25 y 5m procedentes de sensores LiDAR aerotransportados del
proyecto PNOA-LiDAR del Sistema Cartográfico Nacional»*.

| | |
|---|---|
| cobertura usada | `Elevacion25830_5` |
| paso de malla | **5 m** — su `DescribeCoverage` da `offsetVector 5.000000 0` y `0 -5.000000` |
| sistema | **EPSG:25830** (ETRS89 / UTM 30N) |
| formato | `application/asc` — ArcGrid ASCII, se lee sin una sola dependencia |
| qué modela | el **TERRENO** (MDT), no la superficie |

⭐ **Y la coincidencia que ahorra un paso entero y sus errores:** el `.prj` que
devuelve el servicio dice `SPHEROID["GRS_1980",6378137,298.257222101]`,
`central_meridian −3`, `scale_factor 0.9996`, `false_easting 500000`. Es
**exactamente** lo que implementa `src/geo.js:14-21`. El grafo ya vive en esas
coordenadas: ⛔ **no se reproyecta nada.**

### 1.3 · ⭐⭐⭐ La resolución que decide, y no es la horizontal

El encargo preguntaba si el dato tiene la resolución que hace falta. La respuesta
**no es el paso de malla**: es la resolución **vertical**, y se cuenta.

Sobre la misma tesela de 2 × 2 km:

| malla | celdas | valores enteros | valores distintos |
|---|---|---|---|
| **25 m** | 6.400 | **100,0 %** | 147 |
| **5 m** | 160.000 | 41,8 % | 205 en solo 400 celdas de muestra |

⇒ ⛔ **La malla de 25 m viene cuantizada a metros enteros.** Sobre una arista de
25 m eso son escalones de pendiente del **4 %**: no distingue una calle en cuesta
suave de una llana, por muy fina que parezca la malla. La de 5 m trae decimales
de centímetro (`210.532`, `210.740`, `210.959`).

⇒ **Se usa la de 5 m.** 332 teselas de 2 km sobre las que hay nodos del grafo,
407 MB, 50 s de descarga, 0 fallos.

### 1.4 · ⭐⭐ El instrumento contra un testigo independiente

⛔ Un modelo de elevación que nadie ha contrastado es una opinión con decimales.

**Segundo testigo:** `urbanismo:Clavos_Topograficos` del WFS municipal —
**4.308 clavos topográficos**, de los que **4.278 traen `altitud`** numérica
(los 30 restantes, `NO CONSTA`). Son señales clavadas en el suelo y medidas por
el Ayuntamiento: **no comparten con el MDT ni sensor, ni organismo, ni método.**

| MDT − clavo | p01 | p10 | p50 | p90 | p99 |
|---|---|---|---|---|---|
| m | −2,63 | −0,48 | **−0,09** | +0,27 | +0,53 |

| \|MDT − clavo\| | p50 | p90 | p99 | max |
|---|---|---|---|---|
| m | **0,21** | 0,51 | 2,82 | 143,85 |

⇒ Sobre 4.278 puntos, la mediana del desacuerdo entre dos fuentes independientes
es de **21 cm**, con un sesgo medio de −0,19 m. **El instrumento mide alturas.**
## 2 · CUÁNTA CUESTA HAY, DE VERDAD

### 2.1 · ⭐⭐ El positivo de control, y no lo elige quien mide

⛔ Antes de que ningún número de pendiente signifique nada, el instrumento tiene
que encontrar una cuesta que ya se sabe que existe. **Las eligió el
Ayuntamiento hace décadas: son calles cuyo NOMBRE dice que son una cuesta.**

| calle | clase | aristas | metros | \|p\| media | \|p\| max | |
|---|---|---|---|---|---|---|
| Cuesta del Reloj | positivo | 1 | 275 | **9,53 %** | 9,5 % | ✅ sale cuesta |
| Subida La Cadena | positivo | 9 | 971 | **10,23 %** | 15,9 % | ✅ sale cuesta |
| Camino Alto del Molino | ⭐ **NEGATIVO** | 5 | 1.046 | **0,50 %** | 2,3 % | ✅ sale llano |

⭐ **El negativo es lo que convierte esto en un control.** «Camino **Alto** del
Molino» suena a altura y no es una cuesta: si el instrumento respondiera «cuesta»
a cualquier nombre sugerente, los dos positivos no probarían nada.

### 2.2 · ⭐ Y un control que no depende de ningún nombre: un río no sube

Muestreando el MDT sobre el cauce del Ebro (33 ways de OSM, 1.111 puntos), en
franjas de 2 km de oeste a este:

```
   652000  213,82      664000  202,00      676000  190,00
   654000  210,99      666000  200,00      678000  186,88
   656000  210,00      668000  198,00      680000  184,96
   658000  207,00      670000  195,20      682000  181,00
   660000  206,00      672000  192,00      684000  179,00
   662000  205,32      674000  192,40      686000  176,00
```

⇒ **cae 37,8 m en 34 km** (0,11 %), y **1 de 17 franjas sube**, esa una por 0,4 m.
**El perfil de un río sale de un modelo que no sabe qué es un río.**

⚠️ Y el fallo que este control se comió por el camino: el filtro decía
`name === 'Ebro'` y en OSM se llama **«Río Ebro»**. Devolvió **cero ways sin
quejarse**. Bitácora nº206.

### 2.3 · ⚠️ El suelo de ruido, ANTES de la distribución

⛔ Sin esto no se sabe qué parte de la cola es cuesta y qué parte es el MDT: una
arista de 4 m mide su desnivel sobre menos de una celda de la malla.

| largo | aristas | km | p50 | p90 | p99 | max |
|---|---|---|---|---|---|---|
| 0–5 m | 3.672 | 12,9 | 0,21 | 6,55 | 15,96 | 58,3 |
| 5–10 m | 6.827 | 50,2 | 0,14 | 5,86 | 13,66 | 60,7 |
| 10–25 m | 11.411 | 188,4 | 0,34 | 5,16 | 13,80 | 60,9 |
| 25–50 m | 8.989 | 326,3 | 0,94 | 4,25 | 14,12 | 40,9 |
| 50–100 m | 8.437 | 602,2 | 1,14 | 4,12 | 13,52 | 46,0 |
| 100–250 m | 6.423 | 987,7 | 0,89 | 4,58 | 13,70 | 30,6 |
| ≥ 250 m | 4.180 | 2.703,0 | 0,94 | 4,72 | 11,19 | 19,6 |

⇒ Las cortas tienen **colas más gordas** (p90 de 6,55 % contra 4,72 %) pero
**mediana más baja**. Eso es ruido, no cuesta: el MDT es localmente suave, así que
dos muestras a 5 m están muy correlacionadas y el error diferencial es mucho menor
que el error absoluto. **Y el efecto sobre el reparto es despreciable**, que es lo
que hay que enseñar y no afirmar (§2.4).

### 2.4 · La distribución, ⛔ no una media

**Pesada por metros**, sobre 4.870,8 km y 49.939 aristas medidas (las 33 restantes
miden menos de 0,5 m: ahí la pendiente no significa nada):

| \|pendiente\| | km | % km | aristas | qué es | **solo ≥ 25 m** |
|---|---|---|---|---|---|
| 0–1 % | 2.372,3 | **48,7 %** | 27.785 | llano | 48,0 % |
| 1–2 % | 929,3 | 19,1 % | 7.447 | imperceptible en bici | 19,6 % |
| 2–3 % | 594,9 | 12,2 % | 4.700 | se nota | 12,5 % |
| 3–5 % | 572,6 | 11,8 % | 5.142 | ⚠️ se acusa | 11,7 % |
| 5–8 % | 260,7 | 5,4 % | 3.075 | ⛔ cuesta de verdad | 5,3 % |
| 8–10 % | 63,9 | 1,3 % | 795 | ⛔ dura | 1,3 % |
| ≥ 10 % | 77,0 | 1,6 % | 995 | ⛔⛔ Valhalla ya la penaliza ×4,5 o más | 1,6 % |

⇒ **67,8 % de los km por debajo del 2 %** (3.301,6 km). ⇒ **8,2 % por encima del
5 %, que son 401,6 km.**

⭐ Y la columna de la derecha es la que contesta al §2.3: **tirando el 55,8 % de
las aristas —las de menos de 25 m— el reparto se mueve siete décimas.** El ruido
existe y **no mueve la respuesta**.

### 2.5 · El Actur arriba, el Ebro abajo — ⭐ con su cifra

⛔ *«Zaragoza tiene cuestas»* no es un dato: un adjetivo no tiene denominador.

| sitio | puntos | z p10 | z p50 | z p90 |
|---|---|---|---|---|
| **Actur** (Ranillas · Margarita Xirgu · Antón García Abril · Ilustración) | 414 | 252,0 | **256,0** | 266,0 |
| **Torrero** (Vía Ibérica · Cuéllar) | 237 | 234,0 | 241,0 | 254,4 |
| **Casco** (Alfonso I · Coso · Independencia) | 706 | 198,2 | 204,0 | 209,0 |
| **Ribera del Ebro** (Echegaray · Puente de Piedra) | 833 | 196,0 | **198,5** | 200,0 |

⇒ ⭐ **El Actur está 57,5 m por encima de la ribera del Ebro.** Y los clavos
topográficos, que son el otro testigo, van de **187,9 a 388,4 m** en el término.

### 2.6 · ⚠️ Dónde el MDT no puede acertar, y cuántos son

Un MDT es el modelo del **terreno**. Un puente y un túnel **no son terreno**: en el
puente devuelve la cota del suelo de debajo y en el túnel la del cerro de encima.
⛔ Declararlo no es medirlo, así que va con su cifra.

Y las diez aristas más empinadas de ≥ 25 m, **miradas una a una en vez de
escondidas en un percentil**, dicen lo mismo por otro lado: son `path` y `track`
del escarpe y del vertedero —«Arista del Vertedero», «La Virgen Recta», «Senda de
los Elefantes»— y **dos túneles a `layer=-1`**, que es exactamente el caso en el
que la cifra no es la de la calzada.
## 3 · CÓMO MODELAN LA PENDIENTE LOS TRES — fichero a fichero

⛔ **No se busca una constante: se busca una FUNCIÓN.** La pendiente no da un
número, da una penalización que depende del grado.

### 3.1 · Valhalla — la modela entera, y para los dos modos

`src/sif/bicyclecost.cc:129-149` — comentario propio: *«Speed adjustment factors
based on weighted grade… using a base speed of 18 MPH on flat roads»*

```cpp
constexpr float kGradeBasedSpeedFactor[] = {
    2.2f,  // -10%  - 39.6        0.95f, //  1.5% - 17
    2.0f,  // -8%   - 36          0.85f, //  3%   - 15
    1.9f,  // -6.5% - 34.2        0.75f, //  5%   - 13.5
    1.7f,  // -5%   - 30.6        0.65f, //  6.5% - 12
    1.4f,  // -3%   - 25          0.55f, //  8%   - 10
    1.2f,  // -1.5% - 21.6        0.5f,  // 10%   - 9
    1.0f,  // 0%    - 18          0.45f, // 11.5% - 8
                                  0.4f,  // 13%   - 7
                                  0.3f   // 15%   - 5.5
};
```

y se usa en `bicyclecost.cc:712-717`:
`bike_speed = speed_ * surface_speed_factor_[…] * kGradeBasedSpeedFactor[edge->weighted_grade()]`

⇒ **16 cubos, de −10 % a +15 %, multiplicando VELOCIDAD.** Al +10 % la mitad; al
−10 %, 2,2 veces. **Asimétrico por diseño.**

Y encima, una penalización de peso aparte, `kAvoidHillsStrength[]` (L175-192),
que va de `0.0` en el −1,5 % a `12.0` en el +15 %, modulada por
`use_hills` (`kDefaultUseHills = 0.25f`, L168).

`src/sif/pedestriancost.cc:201-218` — y aquí está la trampa:

```cpp
constexpr float kGradeBasedSpeedFactor[] = {
    1.33f, // -10.0% - 0.67       1.10f, //   1.5% - 1.06
    1.22f, //  -8.0% - 0.73       1.20f, //   3.0% - 1.13
    1.08f, //  -6.5% - 0.77       1.33f, //   5.0% - 1.22
    0.97f, //  -5.0% - 0.82       1.43f, //   6.5% - 1.30
    0.88f, //  -3.0% - 0.89       1.57f, //   8.0% - 1.38
    0.92f, //  -1.5% - 0.94       1.83f, //  10.0% - 1.49
    1.00f, //   0.0% - 1.00       2.03f, //  11.5% - 1.58
                                  2.23f, //  13.0% - 1.68
                                  2.50f  //  15.0% - 1.82
};
```

y se usa en `pedestriancost.cc:748-750`:
`sec = edge->length() * speedfactor_ * kSacScaleSpeedFactor[…] * kGradeBasedSpeedFactor[…]`

⭐⭐⭐ **SE LLAMAN IGUAL Y NO SIGNIFICAN LO MISMO.** En la bici multiplica
**velocidad**; en el peatón multiplica **TIEMPO**. Un `1.83` al +10 % es **83 %
más de tiempo**, no un 83 % más de velocidad. ⇒ **Leer la tabla del peatón con la
convención de la bici diría que uno anda casi el doble de rápido cuesta arriba.**

⚠️ Y el peatón **también paga bajando**: solo la banda de −1,5 % a −5 % baja de
1,00. El propio fichero lo explica (L191-198): sigue **DIN 33466** para las
bajadas, corregido con una **función de Tobler modificada** porque el original
*«contradice el sentido común para quien anda por la ciudad»*.

### 3.2 · openrouteservice — la modela, en dos sitios distintos, y ninguno es una tabla de velocidad

1. **La velocidad máxima de bajada.** `CommonBikeFlagEncoder.java:123` recibe
   `boolean considerElevation`, y en L183-185: `if (considerElevation) maxPossibleSpeed = (int) getDownhillMaxSpeed();`.
   `RegularBikeFlagEncoder.java:95-97` lo implementa: `return 50;` — de 30 a
   **50 km/h**. Su propia documentación: *«each bike profile has a different
   value set for the maximum downhill speed which is calculated when
   `consider_elevation=true` is set in the ors-config.json»*.
   ⚠️ `NO CONSTA` la fórmula por arista: `applyWayTags` está **vacío** en
   `AbstractFlagEncoder.java:238-239` del fork que ORS usa, y no aparece en
   `BikeCommonFlagEncoder`. Lo verificado es el interruptor y el techo, no la curva.

2. **El índice de cuesta, para EVITARLA.** `HillIndexCalculator.java:33`:
   `public byte getHillIndex(PointList points, boolean reverse)` — suma el
   desnivel POSITIVO en pies, lo divide por la distancia en millas
   (`hillIndex = 100 * totalVerticalClimb / (5280 * totalDistance)`, L53) y lo
   corta en 35. Su comentario cita la fuente: `roberts-1.com/bikehudson/r/m/hilliness/#grade`.
   `AvoidHillsWeighting.java:33` lo convierte en peso con 16 escalones:
   `{1.0, 1.0, 1.1, 1.5, 1.7, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.2, 3.5, 3.7, 3.9, 4.2}`.

⛔ **Para el peatón, ORS no la modela:** su documentación dice que los perfiles a
pie usan 5 km/h uniformes con una única excepción por dificultad del sendero.

⚠️ **Y el falso amigo que casi me lleva:** `CommonBikeFlagEncoder.java:187-191`
dice `setTrackTypeSpeed("grade1", 18)`, `"grade2", 12`, `"grade3", 8`… **Eso NO
es pendiente:** es el `tracktype` de OSM, que mide **el firme**. Buscar `grade`
en ORS aterriza ahí. ⭐ **Tener la fuente correcta no garantiza tener el valor
correcto: la cita se verifica contra la PREGUNTA.**

### 3.3 · OSRM — no la modela. Y el cero va con su uno

```
grep -c -iE "grade|slope|incline|hill|elevation|ascent|descent" profiles/bicycle.lua  → 0
grep -c -iE "grade|slope|incline|hill|elevation|ascent|descent" profiles/foot.lua     → 0
```

⭐ **Positivo de control, para que ese cero signifique algo:** el mismo `grep`
sobre los mismos ficheros encuentra `walking_speed` en `bicycle.lua:17,34,148,149`
y en `foot.lua:11,26,86`. **El buscador funciona; lo que no está es la pendiente.**

### 3.4 · ⛔⛔ LA ASIMETRÍA — y aquí es donde esto se para

**Los dos que la modelan la guardan POR SENTIDO, y lo dicen en su firma:**

- Valhalla: `edge->weighted_grade()` es un atributo de la **arista dirigida**.
- ORS: `getHillIndex(points, **reverse**)`, y `AvoidHillsWeighting.calcEdgeWeight(edgeState, **reverse**)`
  lee `reverse ? edgeState.getReverse(hillIndexEnc) : edgeState.get(hillIndexEnc)`
  — **dos valores almacenados por arista, uno por sentido.**

**¿Es representable hoy en este proyecto?** La respuesta honesta tiene dos capas:

1. ⭐ **Los dos sentidos YA EXISTEN en la adyacencia.** `src/grafo.js` empuja cada
   arista **dos veces**, `ady[e.a].push({n: e.b, w: e.largo, e: i})` y
   `ady[e.b].push({n: e.a, w: e.largo, e: i})`. ⇒ **Esto NO es «hacer el grafo
   dirigido».** Lo que falta no es la segunda dirección: es que **el peso sepa en
   cuál de las dos está**.
2. ⛔ **Pero el peso de hoy son METROS**, y con pendiente los metros dejan de
   poder convertirse en minutos arista a arista: 100 m cuesta arriba y 100 m
   cuesta abajo tienen los mismos metros y distinto tiempo.

⇒ **PARA Y AVISA.** Cambiar `w` para que dependa del sentido es tocar
`src/grafo.js`, que es **H1**, y además obliga a que el peso deje de ser metros.
**Lo decide Antonio.**
## 4 · ⭐⭐⭐ CUÁNTO SE MOVERÍA LO YA PUBLICADO

⛔ **No se recalcula nada.** Los 32,6 min y el umbral de ~1,5 km de
`docs/H2B-TRAYECTO-BICI.md` **siguen siendo los que son**. Lo que se hace es
medirles el error **sobre el mismo camino**.

⚠️ **Y el alcance va pegado al número, no en un apartado del final: esto es una
COTA INFERIOR.** Con la pendiente dentro, el camino óptimo también cambiaría —en
la tanda 5, cambiar de metros a minutos ya movió el camino de 4.734 a 5.527 m— y
un motor que pudiera esquivar la cuesta perdería menos de lo que aquí sale.

### 4.1 · La predicción sellada, ANTES de calcular

Sellada el **2026-08-13 a las 16:22:23**, antes de ejecutar nada del §4.

| | predije | salió | veredicto |
|---|---|---|---|
| **P1** · el tiempo en bici del trayecto | «menos de ±10 %, **y hacia abajo**» | **+1,5 %** | ⚠️ **magnitud sí, dirección NO** |
| **P2** · andando | «**+2 % a +6 %**» | **+1,2 %** | ⛔ **fuera de banda** |
| **P3** · el umbral | «menos de 250 m, **y baja**» | **baja 500 m** | ⚠️ **dirección sí, magnitud NO** |

⭐ **Y la evaluación por el MECANISMO, que es lo que importa (ley: acertar la
banda con la razón equivocada no es acertar):**

- El mecanismo que escribí para P1 era: *«la tabla de la bici multiplica velocidad
  y es generosa bajando, así que una ondulación simétrica sale a favor de la
  bici»*. **Eso es exactamente lo que pasó — en el tramo de rodar, que bajó de
  14,5 a 14,2 min.** ⛔ **Y aun así fallé la dirección del total**, porque el
  trayecto tiene **dos tramos andando dentro** y el peatón paga en las dos
  direcciones. ⇒ **razoné sobre un tramo y predije sobre el objeto entero.** Es el
  mismo error de encuadre que la tanda 5 arregló en la tabla de tramos, cometido
  otra vez y en el otro sentido.
- P2 falló por sobreestimar la ondulación: el camino andando entero **sube 24,4 m
  y baja 25,4 m en 4,7 km**. Es genuinamente llano, y yo no lo medí antes de
  predecir aunque **ya tenía medida la distribución de toda la red**.

### 4.2 · El trayecto publicado, tramo a tramo

⭐ **Control primero: ¿es EL MISMO trayecto?** Si no, no se le puede medir el error
a nada.

| tramo | reconstruido | publicado | |
|---|---|---|---|
| 3 · rodando | 4.348,3 | 4.348,3 | ✅ |
| 1 · andar al origen | 416,4 | 416,4 | ✅ |
| 5 · andar al destino | 762,7 | 762,7 | ✅ |
| entrada · salida | #236 Navarra: H. Rguez. Miñón → #40 Alierta: Burriel | #236 → #40 | ✅ |

| tramo | metros | sube | baja | llano | con cuesta | dif |
|---|---|---|---|---|---|---|
| 1 · andar | 416,4 | 4,5 | 2,5 | 5,0 | 5,3 | **+0,3** |
| 3 · rodar | 4.348,3 | 23,0 | 22,0 | 14,5 | **14,2** | **−0,2** |
| 5 · andar | 762,7 | 5,1 | 1,0 | 9,2 | 9,5 | **+0,4** |
| **⇒ TOTAL EN BiZi** | | | | **32,6** | **33,1** | **+0,5 · 1,5 %** |
| **⇒ ANDANDO ENTERO** | 4.725,6 | 24,4 | 25,4 | **56,7** | **57,4** | **+0,7 · 1,2 %** |

⇒ La BiZi ganaba por **24,1 min** y ganaría por **24,3 min**. ⭐ **La pendiente no
le quita la ventaja: se la ensancha dos décimas.**

⚠️ **Y el andando entero de esta tabla NO es el publicado, aunque se le parezca:**
4.725,6 m / 56,7 min aquí contra **4.743,4 m / 56,9 min** en la tanda 5. **No es
una corrección**: son dos enganches distintos —`P.engancharUno(…, 350)` aquí,
`R.engancharPunto` + `G.rutaEntre` allí— y la diferencia son **17,8 m, el 0,4 %**.
Se reporta en §7.

⚠️ Y el apaño de este cálculo, con su cifra: **59,7 m de los tramos andados son
ENGANCHE** —del punto a su arista—, que no son ninguna arista del grafo y se
cuentan como llanos por falta de dato. Son el **5,1 %** de lo andado.

### 4.3 · ⭐⭐⭐ El umbral

| recta | andar llano | andar cuesta | BiZi llano | BiZi cuesta | gana llano | gana cuesta |
|---|---|---|---|---|---|---|
| 250,1 | 4,1 | 4,0 | 9,4 | 9,5 | ⛔ | ⛔ |
| 500,0 | 5,9 | 6,1 | 10,2 | 10,1 | ⛔ | ⛔ |
| 750,2 | 12,6 | 13,8 | 16,7 | 16,8 | ⛔ | ⛔ |
| **1000,0** | 16,3 | **18,9** | 17,4 | **18,0** | ⛔ | **⭐ SÍ** |
| **1500,1** | 22,8 | 27,1 | **20,5** | 22,1 | **⭐ SÍ** | ⭐ SÍ |
| 2000,0 | 29,9 | 33,7 | 21,3 | 22,6 | ⭐ SÍ | ⭐ SÍ |
| 4000,0 | 57,6 | 58,5 | 30,9 | 31,2 | ⭐ SÍ | ⭐ SÍ |
| 11999,6 | 174,0 | 177,8 | 123,0 | 125,3 | ⭐ SÍ | ⭐ SÍ |

⇒ **El umbral pasa de ~1.500 m a ~1.000 m: con la pendiente dentro, la BiZi gana
ANTES.**

⛔⛔ **Y la honestidad que le falta a ese «500 m»:** los peldaños de la escalera
son 250 · 500 · 750 · 1000 · 1500 · 2000…, así que **entre 1.000 y 1.500 no hay
nada medido.** El umbral se ha movido **un peldaño**, y ese peldaño mide 500 m.
**Este instrumento no distingue 1.001 m de 1.499 m.** El número honesto es
*«baja, y baja al menos un peldaño»*, no *«baja 500 m»*.

⚠️ Y el alcance de siempre, que la tanda 5 ya declaró: **la escalera tiene UN solo
origen** —el primer portal del callejero—. No es una muestra de la ciudad.

⚠️ Un peldaño se sale de la curva y se dice en voz alta: a 9.997 m la BiZi tarda
**98,5 min** cuando a 8.001 m tardaba 45,0. No se ha investigado en esta tanda.
## 5 · EL VEREDICTO, EN UNA LÍNEA

⭐⭐⭐ **CABO, no corrección urgente: la pendiente mueve los tiempos publicados un
1,2–1,5 % y NO cambia ninguna conclusión — pero el umbral se mueve un peldaño
entero, y ése es el número que hay que dejar de recitar.**

Desglosado, porque una línea no tiene denominador:

| lo publicado | ¿lo desmiente la pendiente? |
|---|---|
| «la BiZi gana en tiempo» | ⭐ **No: lo refuerza.** Gana por 24,3 min en vez de 24,1 |
| los 32,6 min del trayecto | ⚠️ **Casi**: 33,1 min. Error del **1,5 %** |
| los 56,9 min andando | ⚠️ **Casi**: 57,4. Error del **1,2 %** |
| «desde ≈1.500 m» | ⛔ **Sí lo desmiente**: sale ya en el peldaño de 1.000 m |
| «por debajo pierde siempre» | ⭐ **No**: a 250 y 500 m sigue perdiendo con cuesta |

⇒ **Lo que NO merece la pena** es construir un modelo de pendiente para arreglar
un error del 1,5 % en los tiempos.
⇒ **Lo que SÍ merece la pena, y es lo que esta tanda deja escrito**: que el umbral
publicado es **el límite superior** de un intervalo que la pendiente empuja hacia
abajo, y que **cualquier tanda que se apoye en el ~1,5 km está apoyándose en un
número que ya se sabe alto.**

⚠️ **Y por qué el efecto sale pequeño, dicho con su cifra y no como excusa:**
porque **Zaragoza, por donde pasa la red de bici, es llana**: el 67,8 % de los
km por debajo del 2 %. La cuesta está donde está —**el Actur, 57,5 m por encima
de la ribera**— y estos trayectos no la cruzan. ⛔ **Eso no es una propiedad de
Zaragoza: es una propiedad de los dos trayectos medidos.**

---

## 6 · QUÉ CLASE DE CUESTA NO SE HA PROBADO

⛔ Ninguna que **cruce el escalón del Actur**. Los dos casos medidos —el trayecto
de la tanda 5 y la escalera de umbral— viven en la margen derecha. **El caso que
más movería el resultado es exactamente el que no está.**
⛔ Ninguna **subiendo contra bajando**: al no ser el grafo dirigido por peso, cada
trayecto se ha medido en **un solo sentido**. La vuelta de Utrillas a Delicias no
se ha calculado, y con la tabla de Valhalla **no cuesta lo mismo**.
⛔ Ningún trayecto **empujando en cuesta**: ninguna de las tres fuentes modela el
empujar con pendiente, así que los tramos 2 y 4 se quedan llanos **por falta de
dato, no por decisión**.
⛔ Nada por debajo de 250 m ni entre 1.000 y 1.500 m, que es justo donde está el
umbral nuevo.
⚠️ La cota de puentes y túneles —**723 aristas, 36,2 km, el 0,7 % de la red**— es
la del terreno y no la de la calzada, y no se ha corregido.
⚠️ Y no se ha mirado nada sobre un mapa.

---

## 7 · LO QUE ESTA TANDA REPORTA HACIA ARRIBA

1. ⛔⛔ **La asimetría obliga a tocar H1.** Los dos sentidos ya existen en
   `src/grafo.js`; lo que no existe es que el peso sepa en cuál está — y el peso
   de hoy son metros, que con pendiente dejan de convertirse en minutos arista a
   arista. **Lo decide Antonio.** (§3.4)
2. ⚠️ **El umbral de ~1,5 km es un límite superior**, no un valor. (§4.3)
3. ⚠️ **Dos procedimientos de enganche conviven y dan dos «andando entero»
   distintos.** La tanda 5 publicó **4.743,4 m** con `R.engancharPunto` +
   `G.rutaEntre` —el motor—, y aquí salen **4.725,6 m** reconstruyendo el árbol
   de Dijkstra con `P.engancharUno(…, 350)`, que es el mismo enganche que la
   tanda 5 usa para los tramos 1 y 5. **17,8 m, el 0,4 %.**
   ⛔ **Ninguno de los dos está mal: son dos instrumentos.** Pero el trayecto de
   la tanda 5 compara la BiZi —medida con uno— contra el andando —medido con el
   otro—, y eso no se había dicho. **No se corrige aquí: se reporta.**
4. ⚠️ **La verificación de este proyecto depende del intérprete de órdenes desde
   el que se lanza.** (§8)

---

## 8 · ⚠️ LAS BATERÍAS, Y LO QUE COSTÓ QUE SALIERAN

**Base:** `node src/probar-paradas.js --todo` · 16:46:22 → 17:05:27 · **exit 0** ·
**114 líneas**.

⛔⛔ **Pero antes de ésa hubo dos en rojo, y la causa no era el repositorio.**

Lanzada desde **PowerShell**, la misma batería, sobre el mismo commit y con el
árbol limpio, sale en **exit 1** con
`auditoria-guardianes.js · 2 de 1 · ⛔ DECLARA 2 Y SE ESPERABAN 1`. La repetí
entera con la máquina parada y el `diff` contra la primera salió **vacío**:
perfectamente reproducible, y perfectamente distinta de la de la víspera.

La causa: `src/auditoria-guardianes.js:169-181` valida su censo contra un
contador independiente lanzando `spawnSync('bash', …)`. Desde Git Bash cuenta
**328 contra 328** ✅; desde PowerShell **no hay `bash`**, el contador da **0**, y
el guardián declara —**correctamente**— que no ha podido verificar su censo.

⇒ ⭐⭐⭐ **El veredicto de la verificación no es una propiedad del repositorio: es
una propiedad del repositorio Y del entorno desde el que se lanza.** *«La batería
sale en verde»* es una frase incompleta mientras no diga **desde dónde**.

⚠️ Y un detalle que ata el nudo: la redirección de PowerShell escribe un **BOM**
al principio del fichero, así que **un `diff` entre una captura de PowerShell y
una de Bash no puede salir vacío nunca**, ni aunque el contenido sea idéntico. La
disciplina de comparar con `diff` exige capturar las dos desde el mismo sitio.

⛔ **No se ha arreglado nada**: esta tanda no toca `src/`. Se reporta.
Bitácora nº207.
