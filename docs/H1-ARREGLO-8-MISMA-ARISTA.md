# H1 · Tanda de arreglo 8 — `insertar` y la misma arista

**Fecha:** 12/08/2026 · **Base:** `c276ecb` · ⚠️ **Se reabre H1 por una rendija y se cierra en la
misma tanda.**
**⭐⭐⭐ VEREDICTO: ARREGLADO. Y nada de lo publicado se ha movido — las diez rutas idénticas, los 26
congelados idénticos, el grafo del mismo tamaño, y la batería con una sola fila nueva: la de este
guardián.**

---

## §1 · Qué estaba mal

`insertar` (`src/grafo.js`) mete cada punto de enganche como **nodo temporal** y lo enlaza **solo
con los dos extremos de su arista**. Nunca con otro punto temporal de la misma arista. ⇒ **Si las
dos puntas de una consulta caían en la misma arista, el camino más corto que el grafo sabía
encontrar era salir a la esquina y volver.**

```
   CALLE ALFONSO I 12 × 17         el motor    32,5 m   la verdad  11,9 m     2,7×
   AVENIDA SAN JUAN BOSCO 5 × 3    el motor    41,4 m   la verdad  17,3 m     2,4×
   AVENIDA MONTAÑANA 736 × 797     el motor 1.145,2 m   la verdad   4,5 m   256,4×
```

⛔ **El universo, medido:** **233.767 pares de direcciones reales comparten arista**, sobre 7.192
aristas. No es un caso de laboratorio ni de las afueras: `ALFONSO I` es el eje peatonal del centro.

### 1.1 · ⛔ Por qué se arregló en vez de declararse

Era la otra opción y se descartó con motivo. **El veredicto por acera se declara porque el grafo no
tiene el dato** —las dos aceras no están dibujadas—. **Aquí el dato SÍ está:** los dos puntos tienen
su posición conocida sobre la misma arista y la distancia entre ellos **es una resta**. ⇒ *Decir «no
sé andar entre ellas» habría sido mentir sobre lo que se sabe.*

### 1.2 · ⭐ Y por qué se pudo abrir H1 sin miedo

**El radio de explosión se midió ANTES** (`docs/H2A-RODEO-DE-LAS-CORTAS.md`): ninguna de las nueve
rutas resueltas de Antonio comparte arista entre sus dos puntas. ⇒ **Un tratamiento que solo actúa
en ese caso no puede tocar nada de lo publicado** — y eso se comprueba en cada ejecución con
`tools/grafo/misma-arista.js`, no se promete.

---

## §2 · ⭐⭐⭐ La prueba nació roja, y se vio roja

`src/probar-misma-arista.js`, ejecutada **antes de tocar `src/grafo.js`**:

```
   caso                                arista    el motor  la verdad     infla   factor
   CALLE ALFONSO I 12 × 17                223      32.5 m     11.9 m   +20.6 m     2.7×   ⛔
   AVENIDA SAN JUAN BOSCO 5 × 3            53      41.4 m     17.3 m   +24.1 m     2.4×   ⛔
   AVENIDA MONTAÑANA 736 × 797           5897    1145.2 m      4.5 m +1140.7 m   256.4×   ⛔

   T2 · tres puntos en la arista 223       1→2  22.4 / 11.2   1→3  35.5 / 24.3   2→3  28.0 / 13.1   ⛔

   ⇒ ⛔ 6 FALLO(S). código de salida 1
```

Y **después del arreglo**, la misma prueba sin tocar una línea de ella:

```
   CALLE ALFONSO I 12 × 17                223      11.9 m     11.9 m    +0.0 m     1.0×   ✅
   AVENIDA SAN JUAN BOSCO 5 × 3            53      17.3 m     17.3 m    -0.0 m     1.0×   ✅
   AVENIDA MONTAÑANA 736 × 797           5897       4.5 m      4.5 m    +0.0 m     1.0×   ✅

   T2 · tres puntos                        1→2  11.2 / 11.2   1→3  24.3 / 24.3   2→3  13.1 / 13.1   ✅

   ⇒ ✅ sin fallos. código de salida 0
```

### 2.1 · El tercer caso, y cómo se eligió

⭐⭐ Los dos primeros vienen de la **muestra ciega** de `tools/grafo/misma-arista.js` —los primeros
pares por índice de arista, con el criterio fijado antes de mirar ninguno—. **El tercero se eligió
mirando el resultado, y se dice en vez de disimularlo:** es **el par de los 233.767 con MAYOR
inflación**, buscado a propósito. No es una muestra: **es el techo del universo.** Si el arreglo
resuelve el peor caso que existe, los de en medio no pueden salir peor.

⚠️ **Y su forma explica el 256×:** `AVENIDA MONTAÑANA` es un eje de calzada de **1.164,6 m sin
partir**, y los dos portales caen a **4,5 m** uno del otro cerca de su punto medio. Salir a la
esquina y volver era **recorrer la avenida entera**.

### 2.2 · ⭐ El tercer camino de la verdad (ley 149)

La verdad la calcula la prueba **por su cuenta** —no se la pide a `grafo.js`, que es el acusado
(ley 96)—. Y encima se contrasta con una aritmética distinta: **si los dos enganches caen en el
mismo segmento de la polilínea, la distancia por la arista y la recta entre sus dos proyecciones
son la misma cosa**, porque un segmento es recto.

```
   ALFONSO I 12 × 17          por la arista 11,9 m   ·   recta entre proyecciones 11,87 m   ✅
   SAN JUAN BOSCO 5 × 3       por la arista 17,3 m   ·   recta entre proyecciones 17,33 m   ✅
   MONTAÑANA 736 × 797        por la arista  4,5 m   ·   recta entre proyecciones  4,47 m   ✅
```

### 2.3 · `A→B` contra `B→A`

El grafo **no es dirigido** (`src/grafo.js:25-26`), así que el arreglo no puede depender del orden
de inserción. Es simétrico por construcción —`Math.abs`— y se comprueba en los tres casos:

```
   ALFONSO I         A→B 11.9 m  ·  B→A 11.9 m   ✅ idénticos
   SAN JUAN BOSCO    A→B 17.3 m  ·  B→A 17.3 m   ✅ idénticos
   MONTAÑANA         A→B  4.5 m  ·  B→A  4.5 m   ✅ idénticos
```

---

## §3 · El arreglo

En `src/grafo.js` y en ningún sitio más. Dos piezas:

1. **`alLargoDeLaArista(e, p)`** — la aritmética del `antes` sale de dentro de `insertar` a una
   función propia. ⛔ **No es un «ya que estoy»:** el arreglo la necesita en dos sitios, y dejarla
   duplicada sería tener dos copias de la misma cuenta — la forma exacta del fallo nº68.
2. **El enlace entre puntos temporales de la misma arista**, con peso `|antes_A − antes_B|`.

```js
  for (let i = id - 1; i >= 0 && nodos[i].temporal; i--) {
    if (nodos[i].arista !== p.arista) continue;
    enlaza(i, Math.abs(antes - nodos[i].antes));
  }
```

⭐⭐ **Va en `insertar` y no en `rutaEntre`, y ésa es la decisión de diseño de la tanda.**
`rutaEntre` mete **dos** puntos; pero `src/puerta.js:242-243` (`rutaAEdificio`) mete **hasta 25** en
la misma consulta. **Un arreglo en `rutaEntre` habría dejado ese camino sin él, y nadie lo habría
notado** — porque las diez rutas de cordura no lo miran.

⚠️ **Coste:** el bucle es `O(nodos temporales)`, no `O(nodos)`. En una ruta normal son **dos
vueltas**; en `rutaAEdificio`, veinticinco. Los nodos temporales siempre se apilan al final y son
contiguos (`id = nodos.length`), y los permanentes no llevan `temporal`, así que el bucle se para
solo.

---

## §4 · ⭐⭐⭐ La contraprueba — H1 no se ha movido

**Es la condición con la que se aprobó reabrir H1, así que va entera.**

### 4.1 · Las diez rutas de Antonio, antes y después

| nº | metros ANTES | metros DESPUÉS | Δ | aristas antes/después | lista idéntica |
|---|---:|---:|---:|---|---|
| 1 | *no se resuelve* | *no se resuelve* | — | — | — |
| 2 | 598,1 | 598,1 | **0,0** | 23 / 23 | ✅ |
| 3 | 3.704,9 | 3.704,9 | **0,0** | 94 / 94 | ✅ |
| 4 | 505,9 | 505,9 | **0,0** | 26 / 26 | ✅ |
| 5 | 477,4 | 477,4 | **0,0** | 20 / 20 | ✅ |
| 6 | 520,2 | 520,2 | **0,0** | 19 / 19 | ✅ |
| 7 | 2.528,9 | 2.528,9 | **0,0** | 69 / 69 | ✅ |
| 8 | 6.366,1 | 6.366,1 | **0,0** | 193 / 193 | ✅ |
| 9 | 2.883,0 | 2.883,0 | **0,0** | 80 / 80 | ✅ |
| 10 | 4.044,2 | 4.044,2 | **0,0** | 154 / 154 | ✅ |

⭐ **Y no es solo la tabla: la salida entera de `src/rutas-antonio.js --aristas` es idéntica byte a
byte**, con una sola diferencia en 656 líneas — **el cronómetro** (`18,4 s` → `18,6 s`).

⚠️ **La precisión disponible es 0,1 m**, no un centímetro: `res.metros` sale de
`Math.round(total*10)/10`. Se dice en vez de escribir «al centímetro» y que suene mejor. **Pero la
comparación de la LISTA DE ARISTAS es más estrecha que cualquier tolerancia**: 678 índices en total,
todos iguales.

### 4.2 · Los 26 congelados y el tamaño del grafo

```
   grafo.nodos          68.649  =  68.649   ✅
   grafo.aristas        98.774  =  98.774   ✅
   grafo.aristasAPie    94.570  =  94.570   ✅
   grafo.vertices      378.222  = 378.222   ✅
   … los 26, diff vacío quitando las 5 líneas de cronómetro
```

⇒ **El arreglo es del CAMINO, no de la estructura.** Ni un nodo ni una arista de más.

### 4.3 · `tools/grafo/misma-arista.js`

**Sigue dando 9 de 9 «no»**, y las nueve rutas cuadran con el motor. ⭐⭐ **Lo único que cambia en
todo el informe son las seis parejas del positivo de control** — y eso es exactamente lo que tenía
que cambiar:

```
   AVENIDA SAN JUAN BOSCO 5 × 3      41.4 → 17.3     2.4× → 1.0×
   CALLE ALFONSO I 12 × 17           32.5 → 11.9     2.7× → 1.0×
   CALLE ALFONSO I 12 × 14           33.9 → 20.2     1.7× → 1.0×
   CALLE ALFONSO I 12 × 19           30.1 → 23.9     1.3× → 1.0×
   CALLE ALFONSO I 17 × 14           22.0 →  8.3     2.7× → 1.0×
   CALLE ALFONSO I 17 × 19           18.2 → 12.1     1.5× → 1.0×
```

### 4.4 · La batería

```
   ANTES    08:57:12 → 09:14:16   exit 0   112 líneas   (idéntica a la del 11/08)
   DESPUÉS  09:28:33 → 09:45:30   exit 0   113 líneas
   las dos con el árbol quieto
```

**Una sola línea de diferencia, y se explica exactamente:**

```
   67a68
   >    probar-misma-arista.js    código 0       0 de 0  sin fallo  ✅
```

⇒ **Es la fila del guardián nuevo.** `src/probar-paradas.js:217` lee todos los `.js` de `src/`, así
que un fichero nuevo añade su fila. ⛔ **Ninguna de las 112 filas anteriores cambia**: ni un código
de salida, ni un recuento, ni un veredicto.

---

## §5 · ⭐⭐ Lo que SÍ se ha movido (ley 152)

**Un cero de contraprueba es indistinguible de un arreglo que no se aplicó.** Así que el cero de §4
viaja con su uno, del mismo instrumento y en la misma ejecución
(`tools/grafo/efecto-arreglo.js`).

### 5.1 · ⭐ El «antes» está reconstruido, y lo demuestra

`insertarViejo()` reproduce aquí el `insertar` anterior. Es una segunda copia del código de
producción, así que **no se cree por decreto**:

```
   caso                            el ANTES reconstruido   lo que se vio en rojo   ¿cuadra?
   CALLE ALFONSO I 12 × 17                       32.5 m                  32.5 m      ✅
   AVENIDA SAN JUAN BOSCO 5 × 3                  41.4 m                  41.4 m      ✅
   AVENIDA MONTAÑANA 736 × 797                 1145.2 m                1145.2 m      ✅
```

### 5.2 · La inflación, antes y después

Muestra determinista de **401 pares** (1 de cada 584 sobre los 233.767, por orden, no elegidos):

```
   ANTES    inflación   mín -0,0 m · p50  51,8 m · p90 153,1 m · p99 439,9 m · máx 850,2 m
   DESPUÉS  inflación   mín -0,0 m · p50  -0,0 m · p90   0,0 m · p99   0,0 m · máx   0,0 m

   factor motor÷verdad ANTES   mín 1,0× · p50 2,5× · p90 9,6× · p99 56,0× · máx 1.936,6×

   pares que se mueven ................ 393 de 401   (98,0 %)
   pares que ahora dan la verdad exacta  401 de 401  (100,0 %)
```

⚠️ **Los 8 que no se mueven no son un fallo: son los pares con una punta en el extremo de la
arista.** Ahí salir a la esquina ya era el camino bueno, así que antes y después coinciden.

### 5.3 · ⭐ Los 16 pares de paradas de bus de la tanda 6

El instrumento **recupera los números publicados** antes de moverlos —**2.266 pares candidatos y
16 con la misma arista**— y eso es el positivo de control de que mide el mismo universo.

```
   Camino De Los Molinos N.º 54 × …          78,9 m  →   3,0 m    −75,9 m
   Av. De Madrid N.º 29 / Aljafería × …      86,1 m  →  16,8 m    −69,3 m
   Av. De Madrid N.º 36 × N.º 38             80,1 m  →  10,9 m    −69,2 m
   Hernán Cortés N.º 6 × N.º 10              97,8 m  →  34,6 m    −63,2 m
   … los 16, todos a la verdad exacta

   metros que se quitan de encima:  mín 1,2 · p50 49,0 · p90 69,3 · máx 75,9 m
```

⭐⭐ **El p50 de 49,0 m es clavado al `+49,0` que publicó la tanda 6 de H2a como inflación mediana.**
Es el mismo número visto desde el otro lado: **lo que aquel informe midió como daño es exactamente
lo que este arreglo devuelve.**

⛔ **Y no se recalcula nada de H2a**: los 2.538 transbordos, la red y el veredicto por enlace siguen
como estaban. **Lo que cambia es que, cuando H2·7 los calcule, esos 16 ya no mentirán.**

---

## §6 · ⭐⭐⭐ Ley 151 — qué clase de trayecto NO hay entre las diez

La pregunta que audita una costura no es *«¿pasan las diez?»* sino **«¿qué clase de trayecto no hay
entre las diez?»**. Y aquí tiene respuesta concreta y medible: **la clase de los 25 puntos
insertados a la vez.**

`rutaAEdificio` muestrea el contorno del edificio cada 5 m y engancha hasta 24 candidatas; **muchas
caen sobre la misma arista.** Con el arreglo quedan enlazadas entre sí ⇒ el coste hasta cada una
puede bajar ⇒ **puede cambiar qué puerta gana, y con ella la ruta publicada.** De las diez rutas
solo tres tocan un edificio, y **que tres no se muevan no dice nada de las demás.**

**Medido sobre 60 edificios (1 de cada 197, determinista) con origen fijo en `CALLE EL COLOSO 2`:**

```
   edificios con candidatas COMPARTIENDO arista ....... 58 de 60
   edificios evaluados con ruta ....................... 57
   ⭐ donde CAMBIA la puerta elegida ................... 0 de 57
   ⭐ donde CAMBIAN los metros ......................... 0 de 57
```

⇒ **El mecanismo está presente en 58 de 60 edificios y aun así no mueve ninguno.** El motivo, dicho
como hipótesis y no como hecho: desde un origen lejano el coste lo domina la aproximación, y los
atajos de unos metros dentro del racimo de puertas no cambian el orden.
⚠️ **`CAUSA NO CONFIRMADA`**, y con ella el límite de esta medida: **está hecha con el origen
LEJOS.** Un origen que compartiera arista con una candidata es otro caso y **no está probado** (§8).

---

## §7 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca. Se reporta hacia arriba.

1. ⭐⭐⭐ **El instrumento nº134 está ARREGLADO y la corrección no mueve nada de lo publicado.** Las
   diez rutas idénticas byte a byte, los 26 congelados idénticos, el grafo del mismo tamaño, y la
   batería con **una sola fila nueva** — la del propio guardián.
2. ⭐⭐ **El peor caso del callejero era 256×: `AVENIDA MONTAÑANA 736 × 797`, 1.145,2 m publicados
   por 4,5 m reales.** Sobre muestra de 401 pares: factor **p50 2,5×** y **máx 1.936,6×**. ⇒ El
   defecto era mucho mayor de lo que sugería el 2,79× mediano de las paradas de bus.
3. ⭐⭐ **Los 16 pares de paradas de la tanda 6 quedan corregidos, y el p50 de lo que se les quita
   —49,0 m— es clavado al +49,0 que aquel informe publicó como inflación.** Los otros 2.250 pares
   candidatos, intactos. ⛔ **No se ha recalculado nada de H2a.**
4. ⭐ **La batería gana un guardián: `src/probar-misma-arista.js`**, con tres casos reales, el caso
   de tres puntos, el control de aristas distintas y la comprobación `A→B` = `B→A`. **Y su rojo se
   ha visto**, que es lo que lo convierte en red y no en promesa.
5. ⚠️ **`src/grafo.js` exporta una función nueva, `alLargoDeLaArista`.** La aritmética salió de
   dentro de `insertar` para no quedar duplicada. **El resultado es idéntico**, y lo demuestran los
   26 congelados y las diez rutas, no el comentario.
6. ⚠️ **58 de 60 edificios tienen puertas candidatas sobre la misma arista** — el mecanismo del
   arreglo está presente en casi todos—, **y aun así ninguno cambia de puerta ni de metros.** Con el
   límite del §6: medido con el origen lejos.

---

## §8 · ⚠️ Lo que NO se ha probado

- **Un origen que comparta arista con una puerta candidata de su destino.** §6 mide con el origen
  lejos. Es el caso donde el arreglo sí podría cambiar la puerta elegida, y **no está probado**.
- **El coste en tiempo con muchos puntos temporales**: el bucle es cuadrático en número de temporales
  (25 → 300 comprobaciones). No se ha medido su efecto en una consulta con 25 candidatas, más allá
  de que `rutas-antonio.js` pasó de 18,4 s a 18,6 s **con el ruido del reloj dentro**.
- **El lado de la acera**, que sigue sin mirarse por cuarta tanda seguida.
- **Nada de H2a se ha recalculado**: ni la red, ni el veredicto por enlace, ni los 2.538.
- **Los otros 233.751 pares** del universo no se han medido uno a uno: se ha medido una muestra
  declarada de 401 y el techo (el peor par).

---

**Instrumentos:** [`src/probar-misma-arista.js`](../src/probar-misma-arista.js) ·
[`tools/grafo/efecto-arreglo.js`](../tools/grafo/efecto-arreglo.js) ·
[`tools/grafo/misma-arista.js`](../tools/grafo/misma-arista.js)
**Bitácora:** entrada nº187.
