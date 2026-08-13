# H2b · Tanda 5 — LA VELOCIDAD DE `empuja`, Y EL TRAYECTO ENTERO

*2026-08-13 · base `044366c` · **la unidad que hace que el modo exista.***

> ⛔⛔ **NO SE HA TOCADO NI UNA LÍNEA DE `src/`.** El instrumento vive en
> `tools/grafo/trayecto-bici.js`: **no se combina con el bus, no se hace el grafo dirigido, y no se
> ha ajustado ninguna constante para que el resultado salga mejor.**

> **Este documento se AÑADE. No reescribe ninguno anterior** — y eso incluye
> `docs/H2B-CIRCULACION-BICI.md`, cuya cita de la velocidad de acera esta tanda **precisa** (§1.3).

```
   node tools/grafo/trayecto-bici.js      # todo lo de aquí
```

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **`empuja` = 4,0 km/h, y no es una votación** | **ORS `PUSHING_SECTION_SPEED = 4`** *(«you need to get off your bike and push it»)* y **OSRM `walking_speed = 4`** usada por su `bike_push_handler()`. **Valhalla no modela el empujar: `NO CONSTA`** |
| ⛔ **Y lo que cité en la tanda 2 era otra cosa** | Cité `setHighwaySpeed("footway", 6)`: **eso es una bici RODANDO despacio por una acera.** `empuja` es **una persona andando con la bici en la mano**, y es 4 |
| ⭐⭐⭐ **Con la unidad de tiempo, la BiZi GANA — y el umbral está medido** | **≈1.000 m en recta sin el coste de cambio · ≈1.500 m con los 240 s.** *En metros no ganaba nunca* |
| ⭐⭐ **Y cambiar la unidad cambió el CAMINO, no solo su etiqueta** | El mismo par de puntos da **5.527 m** minimizando tiempo y **4.734 m** minimizando metros: **el motor acepta rodar más para andar menos** |
| ⛔⛔ **Mi predicción sellada acertó la banda con la razón equivocada** | Predije el umbral en 1.500–2.500 m **y escribí una aritmética que decía lo contrario**, con un error de unidades de 6×. **No cuenta como acierto** (§4) |
| ⛔ **Y una fila de la tabla se calculaba restando** | El total era correcto las dos veces (28,6 min) **y la estación de entrada que publicaba era falsa.** Bitácora nº204 |

---

## §1 · T1 · LA CONSTANTE DE `empuja`

### 1.1 · Las tres fuentes, fichero a fichero *(consultadas el 13/08/2026)*

**openrouteservice** — [`CommonBikeFlagEncoder.java`](https://raw.githubusercontent.com/GIScience/openrouteservice/main/ors-engine/src/main/java/org/heigit/ors/routing/graphhopper/extensions/flagencoders/bike/CommonBikeFlagEncoder.java)

```java
   protected static final int PUSHING_SECTION_SPEED = 4;
   // Pushing section highways are parts where you need to get off your bike and push it
   setHighwaySpeed(KEY_STEPS, PUSHING_SECTION_SPEED / 2);      // ⇒ 2 en escaleras
```

⭐ El comentario del propio fichero define el concepto, y el código alemán lo llama *«Schiebestrecke»*
—tramo de empuje—. **No hay que interpretar el nombre: está explicado dentro.**

**OSRM** — [`profiles/bicycle.lua`](https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/bicycle.lua)

```lua
   local walking_speed = 4              -- línea 13
   -- usada por bike_push_handler():
   push_forward_speed  = profile.walking_speed
   push_backward_speed = profile.walking_speed
   -- y por el tag  bicycle = "dismount"
```

**Valhalla** — [Route API reference](https://valhalla.github.io/valhalla/api/route/api-reference/)

⛔ **NO MODELA EL EMPUJAR.** Su costing de bici no tiene ninguna opción de andar ni de bajarse, y su
documentación **no lo menciona en ningún sitio**. ⇒ `NO CONSTA`.

### 1.2 · ⭐⭐ La elección: **4,0 km/h** — y es el mismo argumento que el del 18

```
   openrouteservice   4 km/h   `PUSHING_SECTION_SPEED`, con su comentario explicando qué es
   OSRM               4 km/h   `walking_speed`, usada por `bike_push_handler()`
   Valhalla           —        ⛔ no modela el empujar
```

⛔ **No se promedia y no se vota.** **Las dos que modelan el empujar dan exactamente lo mismo, y la
tercera no habla de ello** — *que es literalmente el argumento con el que se eligió el 18, donde dos
distinguían tipo de bicicleta y la tercera no.*

### 1.3 · ⚠️ Qué se está citando exactamente, y qué precisa de la tanda 2

**Se cita la velocidad de EMPUJAR una bici, no la de una bici rodando por una acera.**

| | |
|---|---|
| `setHighwaySpeed("footway", 6)` | una **bici rodando despacio** por una acera |
| `PUSHING_SECTION_SPEED = 4` | **una persona andando con la bici en la mano** |

⛔ **`docs/H2B-CIRCULACION-BICI.md` citó la primera para justificar el nivel `empuja`, y la que
corresponde es la segunda.** El informe de aquella tanda **no se reescribe**; ésta es su precisión.
⭐ *Y encaja con el modelo: `empuja` (4,0) es **más lento que andar** (5,0), que es lo que uno espera
de llevar un estorbo al lado. El 6 habría dicho que empujar una bici es más rápido que andar.*

### 1.4 · ⚠️ Adoptar una cifra es adoptar la mitad del modelo — con su coste

ORS parte el empujar en **dos** (4 en general, **2 en escaleras**) y aquí se adopta **una**:

```
   metros por los que se EMPUJA en todo el grafo    1079,3 km
      …de ellos, escaleras                             8,3 km   (0,8 %)
```

⇒ **La simplificación afecta al 0,8 % de lo empujable.** ⛔ **No es cero, y por eso se dice**: el error
máximo que introduce es contar esas escaleras al doble de su velocidad.

---

## §2 · T2 · EL TRAYECTO PASA A SER UN OBJETO

**Antes eran dos cosas** —la ruta (4.651,3 m) y el empuje (344,7 m) *«al lado»*— **y solo una se
calculaba.** Ahora es una lista de tramos, cada uno con su régimen, y su suma:

```
   ⭐⭐⭐ EL TRAYECTO EN BiZi, TRAMO A TRAMO
   estación de entrada · de salida    #236 Navarra: H. Rguez. Miñón → #40 Alierta: Burriel

   tramo                          régimen     metros   km/h   minutos
   1 · del origen a la estación     andar      416,4    5,0       5,0
   2 · empujar hasta la calzada   empujar        0,0    4,0       0,0
   3 · rodando                      rodar     4348,3   18,0      14,5   ⚠️ fila DESPEJADA (§3)
   4 · empujar desde la calzada   empujar        0,0    4,0       0,0
   5 · de la estación al destino     andar      762,7    5,0       9,2
   ──────────────────────────────────────────────────────────────────
   TOTAL sin cambio de modo                   5527,4             28,6
   + coger y devolver (2 × 120 s)                                  4,0
   ⭐ TOTAL EN BiZi                                               32,6

   ANDANDO ENTERO                   andar     4743,4    5,0      56,9
```

⭐ **El coste se sigue guardando en METROS + el modo del tramo**, como decidió la tanda 0: **la
conversión vive en la comparación.** Lo único que cambia es que **el Dijkstra sobre la red de bici va
en minutos**, porque es la única forma de que un camino mínimo compare tramos de regímenes distintos.

⚠️ **ALCANCE, pegado al número: esto es UN caso y sus dos puntas son EDIFICIOS grandes** —una estación
de tren y un centro comercial—, no portales. **No es una muestra.** El umbral se mide en §4 sobre 13
destinos.

### 2.1 · ⭐⭐ Y cambiar la unidad cambió el CAMINO, no solo su etiqueta

```
   minimizando METROS (tanda 4)     4.733,6 m
   minimizando TIEMPO  (hoy)        5.527,4 m
```

**El mismo par de puntos, 794 m más de recorrido.** ⇒ **El motor acepta rodar más para andar menos**,
que es exactamente lo que hace una persona. *No es que el número mejore: es que la pregunta era otra.*

---

## §3 · ⛔ LA FILA QUE SE DESPEJA — y lo que escondió

El tramo 3 **no se mide: se despeja** (`total − tramos fijos`). La primera versión de esta tabla
publicaba **la estación de entrada equivocada** —cogía «la más barata de alcanzar» en vez de la que
el camino usa— y **la tabla cuadraba igual**, porque los 148 m que le sobraban al tramo 1 se los comía
el tramo 3 al céntimo.

```
   ANTES (mal)   tramo 1: 268,6 m · tramo 3: 4.865,7 m · TOTAL 28,6 min
   AHORA (bien)  tramo 1: 416,4 m · tramo 3: 4.348,3 m · TOTAL 28,6 min
```

⇒ ⭐⭐⭐ **El total era correcto las dos veces. El error estaba en la historia pegada al número.**
Bitácora nº204, con su ley: ***una fila calculada por diferencia hace que la tabla cuadre siempre y
esconde el error en la única fila que nadie comprueba.*** ⚠️ **Y su corolario: un total correcto no
valida su desglose.**

⭐ **Lo cazó la costura del encargo** —*«si la BiZi gana a la primera y por mucho, sospecha»*—, no un
guardián. **Ningún cuadre podía verlo.**

---

## §4 · T3 · ⭐⭐⭐ ¿GANA LA BiZi? ¿DESDE CUÁNDO?

### 4.1 · La predicción sellada — **14:49:07 del 13/08**, antes de abrir ninguna fuente

| | predije | salió | veredicto |
|---|---|---|---|
| **P1 · la constante** | *«~4 km/h, y va a haber una constante que se LLAME empujar»*, con el mecanismo *«empujar es más lento que andar»* | **4,0 · `PUSHING_SECTION_SPEED`** · y 4,0 < 5,0 | ⭐ **acierto, y por el mecanismo correcto** |
| **P2 · el umbral** | **1.500–2.500 m**… y a continuación una aritmética que decía *«por encima de 5 km, y la BiZi PERDERÁ en el caso de los POI»* | **1.500 m con cambio** · y **la BiZi GANA por 24,3 min** | ⛔ **NO cuenta como acierto** |
| **P3 · los 240 s** | *«que muevan el umbral bastante»* | **de ≈1.000 a ≈1.500 m** | ⚠️ cierto, y *«bastante»* era un adjetivo sin denominador |

⛔⛔ **Por qué P2 no cuenta, aunque la banda contenga el resultado:** mi aritmética escribía *«rodar
ahorra ≈0,144 min por cada 100 m»*. **Son 0,867 min por 100 m.** El 0,144 es
`(1/5 − 1/18)` en **horas por kilómetro**, y lo leí como minutos: **un error de unidades de 6×**, de
la misma familia que los dos que este proyecto ya lleva anotados. De ahí concluí que harían falta
6,2 km y que **la BiZi perdería**. ⇒ *Acerté la banda por el borde y con el razonamiento invertido, y
eso no es acertar.*

⭐⭐ **Y lo que salva la disciplina: escribir el mecanismo es lo único que permitió saber que el
acierto era suerte.** Con la banda sola habría anotado un ✅.

### 4.2 · El umbral, medido sobre una escalera de destinos

⛔ Ni el origen ni los destinos se eligen a ojo: **origen = el primer portal del callejero**, y cada
destino = **el portal cuya distancia en recta más se acerca a cada peldaño.** Determinista.

```
      recta   andando     min  |    BiZi m     min  con cambio  ⇒ ¿gana la BiZi?
      250,1     337,7     4,1  |     444,0     5,4         9,4   ⛔ no
      500,0     491,1     5,9  |     511,2     6,2        10,2   ⛔ no
      750,2    1045,8    12,5  |    1456,3    12,7        16,7   ⛔ no
     1000,0    1356,4    16,3  |    1815,7    13,4        17,4   ⚠️ solo sin cambio
     1500,1    1896,1    22,8  |    2666,3    16,5        20,5   ⭐ SÍ
     2000,0    2489,3    29,9  |    2947,7    17,3        21,3   ⭐ SÍ
     2999,9    3517,4    42,2  |    4169,7    22,1        26,1   ⭐ SÍ
     4000,0    4791,9    57,5  |    5214,9    26,9        30,9   ⭐ SÍ
     5999,9    7177,6    86,1  |    7687,9    32,5        36,5   ⭐ SÍ
     8001,1    9635,1   115,6  |    9938,9    41,0        45,0   ⭐ SÍ
    11999,6   14503,2   174,0  |   15094,3   119,0       123,0   ⭐ SÍ
```

```
   ⭐ umbral SIN el coste de cambio    ≈ 1.000 m en recta
   ⭐ umbral CON los 240 s             ≈ 1.500 m en recta
```

⇒ ⭐⭐⭐ **La BiZi gana en tiempo a partir de ~1,5 km en recta, y a partir de ahí no vuelve a
perder.** ⚠️ **Y por debajo pierde siempre**, que es exactamente lo que el coste de cambio de modo
existía para garantizar: **a 250 m la BiZi tarda 9,4 min contra 4,1 andando.**

### 4.3 · El efecto de los 240 s, con y sin

**Mueve el umbral de ≈1.000 a ≈1.500 m** y **cambia el veredicto de una fila entera** (la de 1.000 m,
que sin el coste ganaría y con él no). ⭐ *Es el único parámetro de esta tanda que decide algo, y por
eso se enseña con y sin.*

---

## §5 · T4 · LOS LÍMITES, DECLARADOS

- ⛔ **Un tiempo con constante adoptada NO es una predicción.** La forma en que se publica lleva la
  constante pegada: **`«14,5 min a 18 km/h»`** ✅ · `«unos 15 minutos»` ⛔.
- ⛔ **NO se sabe si hay bicis.** H2 es sin reloj: lo máximo que se puede decir es *«esta estación
  existe y está aquí»*.
- ⛔ **La red de bici sigue NO DIRIGIDA:** `oneway=yes` en **23.499 de 49.972 (47,0 %)** ⇒ los tramos
  rodados **pueden llevar contramanos dentro** y no se ha mirado.
- ⛔ **No se suma con el bus.** El bus **no tiene duración por decisión de Antonio**, así que un
  trayecto con bus no se puede comparar con éste. **Es otra tanda y otra decisión.**
- ⚠️ **La velocidad de andar no se copia: se lee de `src/relato.js`**, y hay un `A.exige` que revienta
  si el motor y este instrumento divergen.

---

## §6 · ⚠️ QUÉ CLASE DE TRAYECTO NO HE PROBADO

- **Ninguno con cuesta.** Ni una de las tres constantes mira la pendiente, y **Zaragoza tiene el
  Actur arriba y el Ebro abajo.** ⭐ *Las tres fuentes SÍ modelan la pendiente (`use_hills`,
  `consider_elevation`) y aquí no entra.* **Es la simplificación más grande de esta tanda.**
- **Ninguno en el que la estación de salida esté llena ni la de entrada vacía.** Sin reloj no existe.
- **Ninguno de menos de 250 m ni entre dos portales de la misma calle.**
- **Ningún origen que no sea el primer portal del callejero.** La escalera del §4.2 tiene **UN
  origen**: es una escalera, no una muestra. *El umbral de ~1,5 km es de ese origen.*
- **Ninguno mirado sobre un mapa.** Ni uno.
- ⚠️ **Y el caso del §2 son dos EDIFICIOS**, con 762,7 m de caminata final: **su ventaja de 24,3 min
  no se lee como propiedad de los trayectos en BiZi.**

---

## §7 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **`empuja` = 4,0 km/h**, citada fichero a fichero: **ORS `PUSHING_SECTION_SPEED` con su
   comentario explicando el concepto, y OSRM `walking_speed` usada por `bike_push_handler()`.
   Valhalla no lo modela.** Mismo argumento que el del 18.
2. ⛔ **La cita de la tanda 2 era del nivel equivocado**: `setHighwaySpeed("footway", 6)` describe una
   bici **rodando** por una acera; **empujar es 4,0**. *Y encaja: empujar es más lento que andar.*
3. ⭐⭐⭐ **Con la unidad de tiempo la BiZi GANA a partir de ≈1,5 km en recta** (≈1,0 km sin el coste de
   cambio), **y por debajo pierde siempre**. *En metros no ganaba nunca.*
4. ⭐⭐ **Cambiar la unidad cambió el CAMINO:** 5.527 m minimizando tiempo contra 4.734 minimizando
   metros. **El motor acepta rodar más para andar menos.**
5. ⛔⛔ **Mi predicción sellada acertó la banda con la razón equivocada** — un error de unidades de 6×
   (horas leídas como minutos) que me llevó a escribir que la BiZi perdería. **No cuenta como
   acierto**, y **escribir el mecanismo es lo único que permitió saberlo.**
6. ⛔ **Una fila del desglose se calculaba restando** y hacía cuadrar la tabla con una estación de
   entrada falsa (bitácora nº204). ⇒ ***un total correcto no valida su desglose.***
7. ⚠️ **La simplificación más grande de la tanda no es una constante: es la PENDIENTE.** Las tres
   fuentes la modelan y aquí no entra, con el Actur arriba y el Ebro abajo.
8. ⭐ **Adoptar una cifra en vez de las dos de ORS afecta al 0,8 % de lo empujable** (8,3 km de
   escaleras sobre 1.079,3 km).

---

## §8 · LAS DOS BATERÍAS

```
   base    14:48:43 → 15:10:38   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

---

**Instrumento:** [`tools/grafo/trayecto-bici.js`](../tools/grafo/trayecto-bici.js) ·
**Citados:** [`src/relato.js`](../src/relato.js) · [`src/grafo.js`](../src/grafo.js) ·
**Bitácora:** nº204.
