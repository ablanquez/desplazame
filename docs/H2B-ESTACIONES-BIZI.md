# H2b · Tanda 4 — LAS 276 ESTACIONES BiZi

*2026-08-12 · base `8ac7003` · **la última pieza barata de H2b.***

> ⛔⛔ **NO SE HA TOCADO NI UNA LÍNEA DE `src/`.** El instrumento vive en
> `tools/grafo/estaciones-bizi.js`: **no combina con el bus, no calcula ni un minuto, y no hace el
> grafo dirigido.**

> **Este documento se AÑADE. No reescribe ninguno anterior.**

```
   node tools/grafo/estaciones-bizi.js      # todo lo de aquí
```

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **Una estación BiZi engancha como un POSTE, no como un portal — y mejor** | **p99 9,3 m · máx 11,2 m** contra postes de bus (11,1 · 23,7) y portales (65,2 · 303,1). **No heredar el listón era lo correcto** |
| ⭐⭐⭐ **Nadie se queda fuera, y esta vez son ceros limpios** | **0 estaciones sin arista peatonal · 0 sin arista de bici · 0 que no alcancen la red de bici andando.** *En portales fueron 179* |
| ⛔ **`ENFRENTADA` NO es el problema de los andenes, y está medido** | La estación no-LINEAL **más cercana a otra está a 164,6 m**. Si fuera «dos mitades a los dos lados de la calle» habría pares a metros |
| ⛔ **Qué significa `tipologia`: `NO CONSTA`** | El esquema del WFS la declara `xsd:string` **sin documentación, sin anotación y sin enumerado** |
| ⚠️ **Las dos fuentes coinciden en el RECUENTO y en la IDENTIDAD, y NO en la POSICIÓN** | 276 · 5.520 recontados ✅ · 50 de 50 números existen ✅ · **la misma estación difiere hasta 41,0 m entre fuentes** |
| ⛔⛔ **Y el resultado que importa no es un número: en METROS la BiZi no puede ganar** | 4.733,6 m en BiZi contra 4.697,0 andando. **Rodar no acorta: acorta el tiempo.** ⇒ *la pregunta «¿la cogería para 400 m?» no se puede formular sin la unidad de tiempo* |

---

## §1 · T1 · EL ENGANCHE DE LAS 276

### 1.1 · ⭐⭐ El positivo de control, primero

```
   PORTALES → red PEATONAL   2308   0.2   5.3   8.5   17.4   27.7   65.4   195.8
   p99 medido · publicado · desvío            65.4 m · 65.4 m · 0.0 m
   ⭐ provocado: la muestra inflada un 50 %    ✅ lo cazaría (p99 98.0)
```

⭐ **Desvío 0,0 m**, con la misma muestra determinista de 2.308 que usó H2·5, y con su provocación.

### 1.2 · ⭐⭐⭐ La distribución — ⛔ sin heredar ningún listón

```
   población                             n     mín     p50     p75     p90     p95     p99      máx
   ⭐ ESTACIONES → red PEATONAL        276     0.0     2.9     4.1     6.3     7.5     9.3     11.2
   ⭐ ESTACIONES → red de BICI         276     0.0     4.8     7.7    11.2    14.2    26.9    166.3
   ──────────────────────────────────────────────────────────────────────────────────────────────
   (publicado) PORTALES → peatonal   46150     0.0     5.3     8.8    18.0    27.0    65.2    303.1
   (publicado) POSTES de bus → peat.   934     0.0     2.2     5.0     7.3     8.3    11.1     23.7
```

⭐⭐⭐ **Y la respuesta a la pregunta que el encargo mandaba medir y no suponer: una estación BiZi se
parece al POSTE, no al portal — y engancha MEJOR que el poste.** p99 **9,3 m** contra 11,1; máximo
**11,2 m** contra 23,7.

⚠️ **Y tiene causa física, que es lo que lo hace creíble:** una estación BiZi es **una plataforma de
obra en la vía pública**, más grande que un poste y colocada donde cabe. **Un portal es una puerta en
una fachada, con acera, jardín o aparcamiento por medio.** *No era una intuición: el máximo de las
276 (11,2 m) es menor que el p90 de los portales.*

### 1.3 · Cuántas quedan lejos — y son ceros limpios

```
   ⛔ estaciones SIN arista peatonal a 350 m ....... 0
   ⛔ estaciones SIN arista de BICI a 350 m ........ 0
   ⛔ que NO alcanzan la red de bici ANDANDO ....... 0   (0,0 %)
```

⇒ ⭐ **Las 276 entran, todas.** *En portales fueron 179 los que no alcanzaban la red andando (0,4 %);
aquí no hay ninguno.*

### 1.4 · El tramo empujando, con el criterio de la tanda 3 sin cambiarlo

```
   ⭐ EMPUJANDO, andado de verdad      276     0.0     5.2     8.6    12.9    16.5    69.6    139.4
      (comparar) en línea recta       276     0.0     4.8     7.7    11.2    14.2    26.9    166.3

   ⭐ estaciones cuya arista PEATONAL ya es de bici ....... 115   (41,7 %)
```

⚠️ **41,7 % contra el 63,9 % de los portales**, y es coherente: **122 de las 276 están sobre la
ACERA**, y una acera no es una arista por la que se ruede. ⭐ Para esas 115 el tramo empujando es
**cero**.

**Y el reparto por `pavimento` confirma la sospecha que la tanda 1 dejó apuntada:**

```
   pavimento          n   p50 a la bici       p90       máx
   CALZADA          122           3.9 m     6.3 m    12.7 m
   MEDIANA            4           4.8 m     7.8 m     7.8 m
   ACERA            122           6.2 m    12.4 m    45.9 m
   ZONA VERDE        28           7.6 m    18.1 m   166.3 m
```

⇒ **Una estación en CALZADA engancha al doble de bien que una en ZONA VERDE**, y el máximo de 166,3 m
—el peor de las 276— **es una de zona verde**. *La variable que se sospechaba era la buena.*

---

## §2 · T2 · LAS DOS FUENTES, RECONTADAS

```
   WFS · 6 ficheros de paginación
   WFS · estaciones · anclajes        276 · 5520      (publicado 276 · 5520)   ✅
   API de la sede · totalCount        276                                       ✅
```

⚠️⚠️ **Pero «las dos fuentes son consistentes» dice menos de lo que parece, y hay que acotarlo:**

```
   ⚠️ API · estaciones EN DISCO      50 de 276   ⇒ el contraste uno a uno solo alcanza a 50
```

⇒ **De la API solo se descargaron 50 estaciones.** Lo que está comprobado es: **el recuento (276 =
276)** y, **para 50 de ellas**, la identidad y la posición. ⛔ **Las otras 226 no se han contrastado
con nada**, y decirlo es parte del resultado.

### 2.1 · ⭐ La clave, y no es la proximidad

El `title` de la API empieza por el `numero` del WFS ⇒ **hay identificador**. Emparejar por distancia
habría sido inventarlo.

```
   API con `numero` en el título ............. 50 de 50
   ⭐ …y cuyo número EXISTE en el WFS ......... 50 de 50
```

### 2.2 · ⚠️ Y las dos fuentes NO ponen la estación en el mismo sitio

```
   LA MISMA estación, WFS ↔ API    50   1.6   3.7   4.4   12.4   17.1   41.0   41.0
   a más de 10 m: 6 de 50
```

⛔ **Hasta 41,0 m de diferencia para la misma estación** —#192 «Olivar: Quirón», que existe en las
dos—. ⚠️ **Y eso importa justo aquí**, porque **el enganche que se mide en §1 tiene p99 de 9,3 m**:
**la discrepancia entre fuentes es cuatro veces mayor que el enganche que se está midiendo.**

⇒ ⭐ **Se usa el WFS**, que es el que trae `anclajes_bicicletas`, `tipologia` y `pavimento`. **Y queda
declarado que cambiar de fuente movería el enganche más que cualquier decisión de listón.**

### 2.3 · ⛔ `tipologia`: qué significa, `NO CONSTA`

```
   <xsd:element maxOccurs="1" minOccurs="0" name="tipologia" nillable="true" type="xsd:string"/>
   ¿trae documentación, anotación o enumerado?     ⛔ NO — `xsd:string` y nada más
```

**No hay leyenda publicada, y deducirla del nombre sería inventar el dato.** ⇒ `NO CONSTA`.

**Lo que sí se puede medir**, que es la sospecha que el encargo mandaba comprobar —*«una ENFRENTADA
podría tener dos anclajes a los dos lados de la calle»*—:

```
   tipología          n    vecina más cercana (mín · p50)    anclajes (mín · p50 · máx)
   DOBLE             10                 164.6 m · 254.4 m                  18 · 18 · 18
   ENFRENTADA        27                 181.8 m · 232.9 m                  19 · 19 · 41
   LINEAL           239                  95.1 m · 265.9 m                  15 · 19 · 39
```

⇒ ⭐⭐ **NO es el problema de los andenes gemelos, y no hace falta parar.** Si `ENFRENTADA` fuera «dos
mitades enfrentadas», habría **pares de estaciones a metros una de otra**; la no-LINEAL más cercana a
cualquier otra está a **164,6 m**. **Cada una es UNA feature, con UN número y UN recuento de
anclajes.**

⚠️ **Lo único que insinúa el dato**: las 10 `DOBLE` tienen **exactamente 18 anclajes** las diez (mín =
p50 = máx). ⛔ **Y eso es una observación, no un significado.**

---

## §3 · T3 · ⭐⭐⭐ EL TRAYECTO EN BiZi — y el resultado no es el número

```
   ⛔ EL ATAJO DE ESTE BLOQUE, MEDIDO — «declarar un apaño no es medirlo»:
      andando, de NODO a NODO (lo que se usa aquí)             4697,0 m
      andando, CON EL MOTOR (R.engancharPunto + G.rutaEntre)   4743,4 m   ⇐ la tanda 3 publicó 4.743,4
      ⇒ lo que cuesta no insertar el punto en la arista          46,4 m   (1,0 %)

   ⭐ trayecto en BiZi, total en METROS         4733,6 m
      andando entero (la MISMA aproximación)   4697,0 m
      ⇒ diferencia                               36,6 m   (⛔ la BiZi es MÁS LARGA)
```

⭐ **El atajo lleva su cifra** —*declarar un apaño no es medirlo*— y **las dos ramas comparadas lo
llevan igual**, así que la comparación vale; ⛔ **los metros absolutos no son los del motor.**

⚠️⚠️ **Y aquí hubo un hallazgo que costó un rojo:** la primera versión de este párrafo citaba esa ley
**por su número**, y `superados.js` se puso rojo. **El número de esa ley coincide con una de las
cifras que el guardián vigila.** ⇒ **Citar una ley por su número puede disparar el guardián**, y por
eso aquí se cita **por su frase** — que además es lo que el método del proyecto ya pedía.
⛔ **Y va a repetirse: hay 187 leyes y 24 cifras vigiladas**, así que las colisiones están
garantizadas y crecen con cada tanda.

### 3.1 · ⛔⛔ T3b · ¿Elegiría la BiZi para 400 metros? — la pregunta no se puede formular

El encargo pedía comprobar que el motor **no** coge una BiZi para 400 m. **La respuesta medida es más
fuerte y más incómoda:**

> **En METROS la BiZi no gana nunca, ni a 400 m ni a 4 km.** Rodar **no acorta la distancia**: acorta
> el tiempo. Y encima **suma** los dos tramos andando hasta las estaciones. ⇒ **un motor que minimiza
> metros nunca elegiría la BiZi**, y la pregunta *«¿la cogería para 400 m?»* **no se puede ni formular
> sin la unidad de tiempo.**

⭐ **Y eso NO es un fallo del coste de cambio de modo.** Los 240 s de Valhalla que la tanda 0 adoptó
son la salvaguarda para cuando exista la unidad; **hoy ni siquiera hacen falta, porque la BiZi ya
pierde por construcción.**

⇒ ⚠️ **El único trayecto en el que la BiZi puede ganar es aquel en el que la red de bici ofrece un
atajo que la peatonal no tiene** —los 613 tramos con el peatón prohibido—. **Aquí no ocurre: la BiZi
sale 36,6 m más larga.**

---

## §4 · T4 · LOS LÍMITES, DECLARADOS

- ⛔⛔ **NO SE SABE SI HAY BICIS.** La API trae `bicisDisponibles` y `anclajesDisponibles` y **no se
  usan**: son una foto de un instante y H2 es sin reloj. **Lo máximo que este dato puede decir es
  «esta estación existe y está aquí».**
  ⭐ *Y hay una prueba de que la foto es foto:* en 12 de 49 estaciones contrastadas,
  `bicis + anclajes libres` **no llega** a los anclajes declarados. **No es una contradicción: es una
  bici en tránsito o un anclaje averiado.** Por eso no sirve ni para verificar la capacidad.
- ⚠️ **Sigue sin duración**: falta la velocidad de `empuja`, y ahora el trayecto tiene **cuatro**
  tramos con **tres** regímenes —andar · empujar · rodar · empujar · andar—.
- ⛔ **La red de bici sigue NO DIRIGIDA**: `oneway=yes` en **23.499 de 49.972 (47,0 %)**.

---

## §5 · ⚠️ QUÉ CLASE DE ESTACIÓN NO HE PROBADO

- **Las 226 que solo están en el WFS.** El contraste entre fuentes alcanza a **50 de 276**. *No sé si
  las otras difieren 3 m o 41.*
- **Ninguna estación mirada sobre el mapa.** Ni una. Todo sale de dos columnas y un grafo.
- **Ninguna `FASE I` contra `FASE II` por separado** (108 y 168): no he mirado si las viejas enganchan
  distinto que las nuevas, y **es una partición que el dato regala.**
- **Ninguna estación fuera de servicio.** La API trae `estado`, **y el WFS no**: si alguna de las 276
  está retirada, aquí entra como buena.
- ⚠️ **Y el trayecto del §3 es UN caso, con dos EDIFICIOS de origen y destino.** *Después de la
  bitácora nº202 esto va aquí y también arriba:* **no es una muestra**, y su «36,6 m más larga» **no
  se lee como propiedad de los trayectos en BiZi.**

---

## §6 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **Una estación BiZi engancha como un poste y mejor: p99 9,3 m · máx 11,2 m**, contra 11,1 /
   23,7 de los postes y 65,2 / 303,1 de los portales. **No heredar el listón era lo correcto.**
2. ⭐⭐⭐ **Las 276 entran todas: 0 sin arista peatonal, 0 sin arista de bici, 0 que no alcancen la red
   andando.** *En portales fueron 179.*
3. ⛔ **`ENFRENTADA` no es el problema de los andenes gemelos**: la no-LINEAL más cercana a otra está
   a **164,6 m**. **No hace falta parar.**
4. ⛔ **Qué significa `tipologia`: `NO CONSTA`** — `xsd:string` sin documentación ni enumerado.
5. ⚠️⚠️ **Las dos fuentes coinciden en recuento e identidad y NO en posición: hasta 41,0 m para la
   misma estación**, y **el contraste solo alcanza a 50 de 276** porque las otras 226 no se
   descargaron. **La discrepancia entre fuentes es 4× el enganche que se está midiendo.**
6. ⛔⛔ **En metros la BiZi no puede ganar, ni a 400 m ni a 4 km.** ⇒ **la pregunta de si el motor la
   elegiría no se puede formular sin la unidad de tiempo**, y el coste de cambio de modo **hoy ni
   siquiera hace falta**.
7. ⭐ **El `pavimento` es la variable que manda en el enganche**: CALZADA p50 3,9 m contra ZONA VERDE
   7,6 m, y el peor de las 276 (166,3 m) es de zona verde.
8. ⭐⭐ **Ley nueva (bitácora nº203):** *un guardián que compara tu aproximación con otra aproximación
   tuya mide tu consistencia, no tu exactitud — y sale verde igual.* ⚠️ Y su corolario: **llamar a la
   función del proyecto no la convierte en patrón externo si le pasas datos fabricados.**

---

## §7 · LAS DOS BATERÍAS

```
   base    18:08:45 → 18:29:55   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

⚠️ El instrumento vive en `tools/grafo/`, **fuera del runner**, y **no se ha tocado `src/`** ⇒ la
batería no debería moverse ni una fila.

---

**Instrumento:** [`tools/grafo/estaciones-bizi.js`](../tools/grafo/estaciones-bizi.js) ·
**Citados:** [`tools/grafo/enganche-bici.js`](../tools/grafo/enganche-bici.js) ·
[`src/portales.js`](../src/portales.js) · **Bitácora:** nº203.
