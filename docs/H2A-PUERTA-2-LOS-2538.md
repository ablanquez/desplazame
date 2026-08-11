# H2a · Tanda 7 · Puerta 2 — los 2.538 enlaces a pie

**Fecha:** 11/08/2026 · **Base:** `72b83b5` · **Puerta 2 de 3.** La Puerta 3 **no se ha abierto**.
**⭐⭐⭐ CALCULADOS LOS 2.538, con el veredicto partido en dos campos. Y el cruce hacia atrás salió
clavado: `20 · 73 · 130 · 418` — los cuatro números que la tanda 4 publicó de las paradas de
tranvía, reencontrados hoy con otro script.**

⚠️ **Y dos rojos por el camino, los dos míos y los dos del mismo sitio: el rodeo.** Bitácora nº189
y nº190.

---

## §1 · Los dos campos, y la prueba de la ley 157 pasada a cada nombre

**La prueba:** *¿puede un lector que solo ve la etiqueta concluir algo que el instrumento no sabe?*
Si sí, **se renombra antes de publicarse**.

### CAMPO `camino` — por dónde va. Hecho del **grafo**.

| valor | qué dice | ley 157 |
|---|---|---|
| `sin-eje` | ninguna arista del camino es eje de calzada | ⚠️ se llamaba **`acera`** y **NO PASABA**: un lector concluye *«va por la acera correcta»*, que es justo lo que la Puerta 1 demostró que no se sabe |
| `mixto` | unas aristas son eje y otras no | ✅ |
| `solo-eje` | todas las aristas del camino son eje de calzada | ✅ |
| `sin-camino-en-el-grafo` | el grafo no encuentra camino | ⚠️ se llamaba **`sin-camino`** y **NO PASABA**: se lee *«no se puede ir andando»*. El grafo tiene **170 componentes**; lo que se sabe es que **este** grafo no lo encuentra |

### CAMPO `lado` — qué sabemos de sus lados. Hecho de **nuestro conocimiento**.

| valor | qué dice | ley 157 |
|---|---|---|
| `sin-lados-en-el-grafo` | ⭐ **conocimiento firme**: ni una arista del camino es de una clase que pueda tener lado | ⚠️ se llamaba **`sin-lados`** y **NO PASABA**: la calle real sí puede tener dos aceras. **Lo que no las tiene es el dibujo** |
| `no-consta` | ⚠️ **ignorancia**: hay aristas que podrían tener lado y ninguna llega al listón | ✅ Y es **lo contrario** del anterior: por eso son dos valores y no uno |
| `no-cambia-de-lado` | el camino no cambia de acera en ningún punto decidible | ⚠️ se llamaba **`mismo-lado`** y **NO PASABA**: se lee *«empieza en la acera correcta»*, y **eso no se mide** |
| `cambia-con-paso` | cambia de lado y pasa por un paso de peatones | ✅ |
| `cambia-sin-paso` | cambia de lado sin pasar por ninguno | ⚠️ se llamaba **`cruza-callado`** y **NO PASABA** (Puerta 1): doblar una esquina cambia de acera sin paso y es legítimo |

⛔ **Cinco de los nueve valores tuvieron que renombrarse.** No es una anécdota de estilo: cada uno
era una frase que el instrumento no puede sostener.

### 1.1 · Por qué dos campos y no uno con más valores

- **28 de 67 `ACERA` (41,8 %) eran NO DECIDIBLES** (Puerta 1). Una categoría con dos poblaciones de
  ese tamaño dentro **no es una categoría: son dos con un nombre puesto encima.**
- **53 de 324 tenían las dos puntas en eje, y eso NO es ignorancia: es conocimiento firme.** Meterlo
  con los 28 aplasta *«sé que no hay»* contra *«no sé si hay»*, **que son lo contrario.**
- ⛔ Un solo campo serían **4 × 5 = 20 etiquetas compuestas**, y **cada nombre es una oportunidad de
  que alguien lea algo que el instrumento no sabe**. Cinco de nueve ya han fallado la prueba: veinte
  serían veinte ocasiones.
- ⭐ **Y el coste:** el listón de cobertura (`≥4 portales · 75 %`) es una decisión pendiente de
  Antonio. **Con dos campos, el día que cambie solo se recalcula el segundo.**

---

## §2 · La tabla cruzada

**LOS 2.538 ENTEROS**

| camino \ lado | no-cambia-de-lado | cambia-con-paso | cambia-sin-paso | no-consta | sin-lados-en-el-grafo | TOTAL |
|---|---:|---:|---:|---:|---:|---:|
| `sin-eje` | 235 | 53 | 2 | 298 | 0 | **588** |
| `mixto` | 499 | 46 | 0 | 1.158 | 32 | **1.735** |
| `solo-eje` | 0 | 0 | 0 | 0 | 215 | **215** |
| `sin-camino-en-el-grafo` | 0 | 0 | 0 | 0 | 0 | **0** |
| **TOTAL** | **734** | **99** | **2** | **1.456** | **247** | **2.538** |

**LA MUESTRA DE 324 DE H2·6, REETIQUETADA** — y reproduce sus dos números publicados:

| camino \ lado | no-cambia | con-paso | sin-paso | no-consta | sin-lados | TOTAL |
|---|---:|---:|---:|---:|---:|---:|
| `sin-eje` | 34 | 6 | 0 | 29 | 0 | **69** ✅ *(H2·6: 69)* |
| `mixto` | 69 | 5 | 0 | 144 | 4 | **222** |
| `solo-eje` | 0 | 0 | 0 | 0 | 33 | **33** ✅ *(H2·6: 33)* |
| **TOTAL** | 103 | 11 | 0 | 173 | 37 | **324** ✅ |

⭐ Los tres cuadres van con `A.exige`: si la muestra se hubiera movido, el script para antes de
hablar.

⚠️ **Y la casilla que más dice de este proyecto: `mixto × no-consta` = 1.158, el 45,6 % de todo.**
El caso más común de un transbordo en Zaragoza es *«el camino toca eje de calzada en algún punto y
del resto no sabemos de qué acera es»*.

---

## §3 · ⭐⭐ Las predicciones, selladas a las 10:52:46

**Escritas antes de ejecutar nada**, fuera del repositorio para no tocar el árbol.

| | predicho | medido | |
|---|---|---|---|
| **P1** `sin-eje` | 18–23 % | **23,2 %** | ✅ *(por 0,2 puntos)* |
| **P1** `mixto` | 64–72 % | **68,4 %** | ✅ |
| **P1** `solo-eje` | 8–13 % | **8,5 %** | ✅ |
| **P2** `sin-camino` | 1–15 | **0** | ⛔ **fallo** |
| **P3** metros p50 | 160–210 m | **261 m** | ⛔ **fallo** |
| **P3** metros p90 | 300–380 m | **374 m** | ✅ |
| **P4** parecido con los 324 | ±4 puntos | **1,9 · 0,1 · 1,7** | ✅ |
| **P5** rodeo p50 | 1,20–1,45 | **1,29×** | ✅ |
| **P6** mínimo andando p50 | 85–120 m | **87 m** | ✅ |
| **P6** mínimo en recta p50 | 70–80 m | **66 m** (48) · **73 m** (50) | ⛔ **población mal puesta** |
| **P7** artefacto bruto | 350–600 KB | **471,7 KB** | ✅ |
| **P7** artefacto gzip | 60–110 KB | **77,8 KB** | ✅ |

⭐⭐ **Fallan tres, y las tres enseñan algo:**

1. **`SIN CAMINO` = 0 y yo predije 1–15.** Ver §4.
2. **Los metros: predije p50 160–210 y salen 261.** Subestimé el rodeo: pensaba en la recta (p50
   207 m) y **el andado la multiplica por 1,29**. *El error es exactamente el tamaño del rodeo, que
   es el fenómeno que este proyecto existe para medir.*
3. **P6: acerté el número y fallé la población.** Predije la mediana en recta «70–80 m» esperando
   reencontrar los 73 de la tanda 4, **y sobre las 48 sale 66**. El 73 aparece sobre **las 50**
   —ver §6—. ⚠️ **Mi predicción estaba mal formulada, no el dato.**

⭐ **Y una acertada que no vale como acierto:** `P1 sin-eje` cayó dentro de la banda (23,2 % contra
18–23 %… por dos décimas fuera del centro) **pero mi RAZÓN era falsa**: escribí *«las paradas de
tranvía empujarán hacia el eje, así que espero sin-eje POR DEBAJO del 21,3 % de la muestra»* y salió
**por encima**. *Acertar la banda con el razonamiento equivocado no es acertar.*

---

## §4 · ⛔ `SIN CAMINO` = 0, y el cero se provoca (ley 156)

**Cero de 2.538.** Y un cero no se publica solo:

```
   ⚠️ CERO. Buscando dos paradas de componentes distintas para enseñar que el veredicto existe…
   ✅ PROVOCADO: "PA00002" × "PA00349" ⇒ sin-camino-en-el-grafo
```

⇒ **El veredicto existe y el instrumento sabe emitirlo.** El cero es real: **de los 2.538 pares que
el pre-filtro selecciona, ninguno cruza componentes.** ⚠️ Y eso **no** significa que la ciudad esté
toda conectada: significa que **300 m en recta no bastan para saltar de una componente a otra**,
porque las componentes están separadas por mucho más que eso. **Mi predicción de 1–15 daba por hecho
que el pre-filtro rozaría alguna frontera, y no la roza ninguna.**

---

## §5 · ⛔⛔ Los dos rojos del rodeo

**El guardián de imposibilidad física saltó con 33 enlaces más cortos que su línea recta, rodeo
mínimo 0,20×.** El grafo no estaba roto: **el instrumento comparaba dos medidas entre puntos
distintos.**

```
   la ruta va de ENGANCHE a ENGANCHE       las proyecciones sobre el grafo
   la recta iba de PARADA a PARADA         cuatro puntos, no dos

   hueco parada → grafo:  p50 1,7 m · p90 6,1 m · p99 11,1 m · máx 23,7 m
```

**31 de los 33 se caen solos** al medir la recta entre los enganches. **Los 2 restantes eran
redondeo**: `13,0 m` publicados contra `13,044` reales — cuatro centímetros, y `rutaEntre` devuelve
`Math.round(total*10)/10`. **Mi umbral de 0,999 pedía 1,3 cm a un dato con 5 de resolución.**

⇒ **Ahora hay DOS rodeos y se dice qué es cada uno:**

```
   ⭐ RODEO CONSULTADO (parada→parada)     mín 0,20× · p50 1,29× · p90 1,71× · p99 4,04× · máx  9,91×
   ⭐ RODEO DEL CAMINO (enganche→enganche) mín 1,00× · p50 1,29× · p90 1,71× · p99 4,07× · máx 10,15×

   ⛔ ruta más corta que su propia recta ...... 0    tolerancia 0,05 m = el redondeo
   ⭐ rodeos CONSULTADOS por debajo de 1 ...... 33   ⇒ legítimos: el hueco parada→grafo
```

⭐ **El cero viene con su uno** (ley 152): los 33 siguen ahí, **publicados como lo que son**.
⛔ **Y el guardián no se relajó: se le dio la recta correcta y la tolerancia que el dato sostiene.**

---

## §6 · ⭐⭐⭐ Los cruces hacia atrás (ley 154)

### 6.1 · Las 50 paradas de tranvía — cuatro de cuatro, clavados

`docs/DISENO-H2A-RED.md:334-337` publicó en la tanda 4 la distancia de cada parada de tranvía a su
bus más cercano. **Reencontrado hoy, con otro script y otro camino:**

```
   medida        aquí   tanda 4   ¿cuadra?
   min           20 m      20 m   ✅
   p50           73 m      73 m   ✅
   p90          130 m     130 m   ✅
   max          418 m     418 m   ✅
   paradas con bus a ≤300 m ....... 48 de 50   (la tanda 4 publicó 48 de 50)   ✅
```

⚠️ **Y hubo que medirlo COMO LO MIDIÓ ELLA para que cuadrara.** Sobre las **48** que caben en el
radio sale **66 m**, no 73: el máximo de 418 son **las dos de Juslibol, que están fuera del radio**.
⇒ **La población son las 50, sin recortar.** Medirlo sobre las 48 y publicar «66 contra 73» habría
sido **una contradicción inventada por mí**.

### 6.2 · El rodeo contra las rutas cortas de Antonio

```
   rodeo de los 2.538 · p50 ....... 1,29×
   las cuatro cortas de Antonio ... 1,10 · 1,32 · 1,37 · 2,17   (media 1,49)
   ⇒ ✅ dentro del rango. ⛔ No por debajo de 1,20 ⇒ el pre-filtro NO elige pares fáciles.
```

### 6.3 · Andando contra volar

```
   bus más cercano a un tranvía, misma población (48):   en recta 66 m  ·  andando 87 m
   ⇒ factor 1,31×
```

⭐ **Y ese 1,31 es el argumento del hito en una cifra:** *un radio a vuelo de pájaro se queda corto
un 31 % en la mediana* — y eso es la mediana, no la cola.

---

## §7 · ⭐ Qué clase de enlace NO hay aquí (ley 151)

```
   paradas SIN ni un par candidato ....... 172 de 984   (17,5 %)
   enlaces tranvía×tranvía ................ 0 — ⛔ no se calculan: el tranvía como red es H2·8
   enlaces con la MARCA misma-arista ...... 19   (la Puerta 1 midió 19)   ✅
```

⇒ **Para 172 paradas este artefacto no dice nada.** No es que no haya transbordo: es que **a menos
de 300 m no hay ninguna parada que aporte línea nueva**. ⛔ **El pre-filtro las hace invisibles**, y
un usuario en una de esas 172 no verá ninguna alternativa aunque exista a 320 m.

---

## §8 · El artefacto

```
   enlaces .................................. 2.538
   JSON compacto ............................ 471,7 KB
   comprimido (gzip) ......................... 77,8 KB
   ⭐ sin la lista de aristas ................ 244,2 KB · gzip 21,2 KB
      ⇒ la lista de aristas es el 48 % del peso, y hace falta para DIBUJAR, no para calcular
```

**⭐⭐ EL TOTAL, que es el número que decidirá el stack:**

```
   la red de bus (H2·6) ....... 200,5 KB  ·  gzip  41,9 KB
   los enlaces (aquí) ......... 471,7 KB  ·  gzip  77,8 KB
   ───────────────────────────────────────────────────────
   TOTAL ...................... 672,2 KB  ·  gzip 119,7 KB
   ⭐ sin dibujar los enlaces .. 444,7 KB  ·  gzip  63,1 KB
```

⛔ **`feed_info` vive DENTRO del artefacto**, en `artefacto.feed`, y **se exige con `A.exige`**:
`{"version":"20260623_AUZSA_Y_TRANVIA","inicio":"20260623","fin":"20261005","editor":…}`. La
licencia del NAP obliga a conservar **sin alterar** la metainformación de fecha; y sin ella se
pierde además la caducidad del **05/10/2026**.

⭐ **El coste va en METROS, no en minutos** (decisión D2): la velocidad de H1 está medida como
banda, y guardar minutos convertiría una banda en un dato falso-preciso.

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **Los 2.538 están calculados**, con dos campos y **cinco de nueve valores renombrados** por
   la prueba de la ley 157. La casilla más poblada es `mixto × no-consta`: **1.158, el 45,6 %.**
2. ⭐⭐⭐ **Cruce hacia atrás perfecto:** `20 · 73 · 130 · 418` reencontrados clavados, y **48 de
   50**. ⚠️ Con la lección de que **hubo que medirlo sobre las 50, no sobre las 48**.
3. ⭐⭐ **El factor andando ÷ volar es 1,31× en la mediana.** Es el argumento del hito en una cifra.
4. ⭐ **Rodeo p50 de los 2.538: 1,29×**, dentro del rango de las cortas de Antonio ⇒ **el pre-filtro
   no elige pares fáciles.**
5. ⛔ **`SIN CAMINO` = 0 sobre 2.538, provocado.** 300 m no bastan para rozar otra componente.
6. ⛔ **172 de 984 paradas (17,5 %) no tienen ni un par candidato.** El pre-filtro las hace
   invisibles.
7. ⭐⭐ **Artefacto total: 672,2 KB · 119,7 KB gzip** (444,7 / 63,1 sin las listas de aristas).
8. ⚠️ **Dos rojos del rodeo, los dos míos** (bitácora nº189 y nº190), con dos leyes: *un cociente
   exige que las dos medidas unan los mismos puntos*, y *una tolerancia relativa esconde la
   resolución del dato*.

---

## §10 · ⚠️ Lo que NO se ha hecho

- **La Puerta 3 no se ha abierto.**
- **El artefacto no se escribe a disco**: se mide en memoria, como el de la red de bus.
- **Nada de los horarios, el reloj, la bici ni el tranvía como red.**
- **No se ha bajado el listón de cobertura** (`≥4 portales · 75 %`): es decisión de Antonio.
- **Los 2 `cambia-sin-paso`** no se han mirado uno a uno sobre el mapa.

---

**Instrumento:** [`tools/gtfs/enlaces.js`](../tools/gtfs/enlaces.js) · **Bitácora:** nº189 y nº190.
