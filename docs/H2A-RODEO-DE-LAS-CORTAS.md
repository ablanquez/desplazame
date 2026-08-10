# ¿Está contaminado el rodeo de las rutas cortas?

**Fecha:** 10/08/2026 · **Hito:** H2a · tanda corta, de una sola pregunta
**⭐⭐⭐ VEREDICTO: SOBREVIVE ENTERO. Ninguna de las nueve rutas resueltas tiene las dos puntas en la
misma arista. El 2,17 de la nº4 es la ciudad, no el defecto del grafo.**

⛔ **Esta tanda no arregla nada.** `src/grafo.js` no se toca: el arreglo mueve el grafo, los 26
congelados, las diez rutas y la batería entera, y esa decisión es de Antonio.

---

## §1 · La pregunta, y por qué ahora

La tanda 6 encontró que `insertar` (`src/grafo.js:202-215`) enlaza cada nodo temporal **solo con
los dos extremos de su arista, nunca entre sí** (`:211-213`). ⇒ **Si las dos puntas caen en la
misma arista, el camino más corto que el motor sabe encontrar sale a la esquina y vuelve.** Medido
sobre pares de paradas: 16 de 2.266, inflación p50 +49,0 m, factor máximo 26,4×.

**La consecuencia que no se cruzó, y que no es de H2a sino de H1:** el argumento que sostiene el
diseño entero —*«el rodeo es peor en los trayectos cortos, que son los del transbordo»*— sale de
los rodeos de `data/pruebas/RUTAS-CONOCIDAS.md`. **La nº4 recorre 506 m para salvar 233 m en
recta.** Y 233 metros en recta caben de sobra dentro de un tramo de calle.

⇒ **Si alguna de las cortas tuviera las dos puntas en la misma arista, su rodeo lo inflaría el
motor, no la ciudad** — y la cifra que demuestra que el grafo peatonal es mejor que un radio sería
un defecto del grafo peatonal.

---

## §2 · Sobre qué grafo se mide, y cómo se demuestra que es ése (ley 148)

**El instrumento:** [`tools/grafo/misma-arista.js`](../tools/grafo/misma-arista.js).

```
   R.construir(R.ZONA_TERMINO)          ⇐ la MISMA llamada de src/rutas-antonio.js:103
   sello .............. 2026-08-03T08:19:51Z
   aristas ............ 98.774        a-pie 94.570
   componentes ........ 170           (mayor 65.707)
   portales enganchados 46.026
   pasos condicionales  DENTRO del cálculo, como en el motor
```

⚠️ **Pero eso es una promesa, no una prueba.** Ayer las componentes salieron bien sobre un grafo
que el motor no usa, y el resultado fue idéntico: ninguna salida podía delatarlo (bitácora nº181).
**Aquí la prueba es el cuadre, y el script no arranca sin él:** se le exige reproducir, ruta a
ruta, **los metros Y la lista entera de índices de arista** que publica el propio motor con
`node src/rutas-antonio.js --aristas`.

```
   nº    metros aquí  metros motor   lista de aristas   aristas[0]=enganche  aristas[-1]=enganche
   2           598.1         598.1   ✅ idénticas             ✅                    ✅
   3          3704.9        3704.9   ✅ idénticas             ✅                    ✅
   4           505.9         505.9   ✅ idénticas             ✅                    ✅
   5           477.4         477.4   ✅ idénticas             ✅                    ✅
   6           520.2         520.2   ✅ idénticas             ✅                    ✅
   7          2528.9        2528.9   ✅ idénticas             ✅                    ✅
   8          6366.1        6366.1   ✅ idénticas             ✅                    ✅
   9          2883.0        2883.0   ✅ idénticas             ✅                    ✅
   10         4044.2        4044.2   ✅ idénticas             ✅                    ✅
   ⇒ 9 de 9
```

⭐ **Y las dos últimas columnas no son decoración: son el modelo del camino puesto a prueba.**
`insertar` etiqueta los dos enlaces del nodo temporal con `e: p.arista` (`src/grafo.js:211`), así
que la primera entrada de `res.aristas` **tiene que ser** la arista de enganche del origen y la
última la del destino. Si no lo fueran, todo el veredicto de abajo estaría leyendo otra cosa.

⚠️ **Lo que sí es una copia, declarado:** el ORDEN en que se llaman `puntoDe`, `Pu.accesoA` y
`Pu.rutaAEdificio` está copiado de `src/rutas-antonio.js:186-217`. Las funciones son las mismas —no
hay segunda implementación del cálculo—, pero la orquestación sí está duplicada. **Lo que la
legitima es el cuadre de arriba:** si divergiera en un metro o en un índice, el script para.

---

## §3 · ⭐ Ley 147 — qué resultado habría hecho fallar esta comprobación

Escrito en el código, antes de que se ejecutara una línea de medida:

1. **Si alguna ruta LARGA sale «misma arista»** → el control ha fallado. Una arista con dos puntas
   a kilómetros no es un tramo de calle: es el instrumento roto, y todo lo demás es ruido.
2. **Si mis metros o mi lista de aristas no reproducen los del motor** → mido sobre otro grafo.
3. **Si `aristas[0]` no es la arista de enganche del origen** → mi modelo del camino es falso.
4. **Si ninguna sale «misma arista»**, el cero solo vale con un positivo de control delante (§5).

---

## §4 · La tabla de las diez

⚠️ **Nueve, no diez: la nº1 no se resuelve** — `Avenida Cataluña 78` no existe (los pares más
cercanos son el 74 y el 84, con 175 m de hueco) y `Avenida Pablo Gargallo 16` tampoco (los pares
empiezan en el 36). **No es del grafo: es la regla de paridad, y el estado ya lo declara**
(`DESPLAZAME-ESTADO.md:369-371`). Aquí solo se hace constar que **la nº1 no entra en ninguna cuenta
de esta tanda** — y que por eso las largas de hoy son cinco y no las seis que esperaba el encargo.

| nº | origen → destino | arista origen | arista destino | ¿MISMA? | recta | ruta | rodeo | clase |
|---|---|---:|---:|---|---:|---:|---:|---|
| 1 | Av. Cataluña 78 → Av. Pablo Gargallo 16 | — | — | ⛔ no se resuelve | — | — | — | — |
| 2 | Manifestación 6 → Don Jaime I 17 | 28896 | 14886 | ✅ no | 454 m | 598 m | 1,32 | CORTA |
| 3 | Cantando Bajo la Lluvia 6 → Clínico | 40962 | 63012 | ✅ no | 2.998 m | 3.705 m | 1,24 | LARGA |
| 4 | Etopía → Estación Delicias | 95104 | 85026 | ✅ no | 233 m | 506 m | **2,17** | CORTA |
| 5 | Principado de Morea 14 → C.C. Utrillas | 59924 | 5949 | ✅ no | 348 m | 477 m | 1,37 | CORTA |
| 6 | Francisco de Quevedo 1 → Matadero 1 | 52337 | 52169 | ✅ no | 475 m | 520 m | 1,10 | CORTA |
| 7 | El Coloso 2 → Valle de Zuriza 48 | 7931 | 56494 | ✅ no | 2.380 m | 2.529 m | 1,06 | LARGA |
| 8 | El Coloso 2 → Padre Arrupe 1 | 7931 | 5451 | ✅ no | 5.857 m | 6.366 m | 1,09 | LARGA |
| 9 | El Coloso 2 → María Montessori 2 | 7931 | 37087 | ✅ no | 2.304 m | 2.883 m | 1,25 | LARGA |
| 10 | Calle del Carmen 19 → Camino del Pilón 61 | 59701 | 72236 | ✅ no | 3.510 m | 4.044 m | 1,15 | LARGA |

⭐ **La nº6 es la que más cerca estuvo:** `52337` y `52169`. Dos índices distintos, y por eso está
limpia — pero es el recordatorio de que la pregunta no era retórica.

### 4.1 · El umbral CORTA / LARGA, declarado antes de medir

`recta < 1.000 m ⇒ CORTA`. Las rectas reales caen en dos grupos que no se tocan: **233–475 m** y
**2.304–5.857 m**. Ningún trayecto está cerca de la frontera, así que la clasificación no depende
de dónde se ponga el umbral dentro de ese hueco.

### 4.2 · ⛔ El tercer camino, leído SOLO del artefacto del motor (ley 149)

Reproducir el cálculo con mi propio script el mismo día no es verificar. Así que el veredicto se
saca **una segunda vez sin usar mi enganche ni mi grafo**, solo la lista que publica el motor: si
las dos puntas comparten arista, la primera y la última entrada de esa lista tienen que ser el
mismo índice.

```
   nº   aristas[0]   aristas[-1]   nº de aristas   veredicto solo del motor   ¿coincide?
    2       28896         14886         23         ✅ aristas distintas           ✅
    3       40962         63012         94         ✅ aristas distintas           ✅
    4       95104         85026         26         ✅ aristas distintas           ✅
    5       59924          5949         20         ✅ aristas distintas           ✅
    6       52337         52169         19         ✅ aristas distintas           ✅
    7        7931         56494         69         ✅ aristas distintas           ✅
    8        7931          5451        193         ✅ aristas distintas           ✅
    9        7931         37087         80         ✅ aristas distintas           ✅
   10       59701         72236        154         ✅ aristas distintas           ✅
```

**Nueve de nueve de acuerdo.** ⭐ Y hay un detalle que lo refuerza solo: una ruta contaminada tiene
**dos** aristas en su lista —salir a la esquina y volver—. Aquí la más corta tiene **19**.

---

## §5 · ⭐⭐⭐ El positivo de control — ley 4

`P3` es un control **negativo**: enseña que la etiqueta no se pega donde no debe. **No enseña que
se pegue donde sí.** Un `iA === iB` que nunca ha dado `true` sobre datos reales es una promesa, no
un instrumento (ley 3 de los guardianes: *un guardián no está hecho hasta que se ha visto su
rojo*).

Así que se busca en el **callejero real** —los mismos 46.150 portales de los que salen los
orígenes y destinos de las diez— y se pasan por el mismo camino de código:

```
   aristas con 2 o más portales ..................... 7.192
   ⭐ PARES DE DIRECCIONES QUE COMPARTEN ARISTA ..... 233.767
   separación real entre ellos, por la arista:
      p50 34,8 m · p90 131,7 m · p99 433,2 m · máx 1.315,8 m
```

**La muestra: los 6 primeros por índice de arista.** Determinista, no elegida.

```
   arista   dirección A                dirección B                motor   verdad  factor  ¿lo ve?
       53   AVENIDA SAN JUAN BOSCO 5   AVENIDA SAN JUAN BOSCO 3   41,4 m  17,3 m   2,4×    ⛔ SÍ
      223   CALLE ALFONSO I 12         CALLE ALFONSO I 17         32,5 m  11,9 m   2,7×    ⛔ SÍ
      223   CALLE ALFONSO I 12         CALLE ALFONSO I 14         33,9 m  20,2 m   1,7×    ⛔ SÍ
      223   CALLE ALFONSO I 12         CALLE ALFONSO I 19         30,1 m  23,9 m   1,3×    ⛔ SÍ
      223   CALLE ALFONSO I 17         CALLE ALFONSO I 14         22,0 m   8,3 m   2,7×    ⛔ SÍ
      223   CALLE ALFONSO I 17         CALLE ALFONSO I 19         18,2 m  12,1 m   1,5×    ⛔ SÍ

   ⇒ el instrumento ve el SÍ ......... 6 de 6   ✅ SABE DECIR QUE SÍ
```

⭐⭐ **`CALLE ALFONSO I 12 → 17` son doce metros de acera y el motor cobra treinta y dos.** El
defecto no es teórico y no vive en las afueras: vive en el eje peatonal del centro de Zaragoza.

⇒ **El cero del §4 vale**, porque las tres piezas están: el negativo (ninguna larga lo dispara), el
cuadre (mido sobre el grafo del motor) y **el positivo (el instrumento sabe decir que sí)**.

### 5.1 · ⛔ ¿Suerte, o rango? — y aquí se cae una explicación mía de ayer

Si el defecto solo viviera por debajo de, digamos, 100 m, las cuatro cortas (233–475 m de recta)
estarían fuera de su alcance por construcción y el «no» sería estructural. **Medido: no es así.**

```
   nº   recta de la corta    pares REALES que comparten arista y están AL MENOS igual de separados
    4        233 m              8.811 de 233.767   (3,8 %)
    5        348 m              4.048 de 233.767   (1,7 %)
    2        454 m              2.090 de 233.767   (0,9 %)
    6        475 m              1.878 de 233.767   (0,8 %)
```

⛔ **Ninguna es cero.** Existen 8.811 pares de direcciones reales de Zaragoza separadas por 233 m o
más **que comparten arista**. ⇒ **Las cuatro cortas no se salvaron «por ser largas para el
defecto»: el defecto llega hasta su rango y no las tocó.**

⚠️ **`NO CONSTA` la probabilidad.** Para decir *«una de cada N»* haría falta el denominador —todos
los pares de portales a esa distancia—, y no se ha medido en esta tanda. Lo que consta es que **el
rango alcanza**, que es lo que hacía falta para refutar la explicación.

---

## §6 · La tabla de rodeos recalculada

**No se mueve ni una fila.** Se publica entera igual, porque un «no cambia nada» sin la tabla
delante es una afirmación sin evidencia.

| nº | clase | recta | rodeo publicado | rodeo real | ¿se mueve? | tope de Antonio |
|---|---|---:|---:|---:|---|---|
| 2 | CORTA | 454 m | 1,32 | 1,32 | ✅ clavado | ≤ 1,45 |
| 3 | LARGA | 2.998 m | 1,24 | 1,24 | ✅ clavado | ≤ 1,40 |
| 4 | CORTA | 233 m | **2,17** | **2,17** | ✅ clavado | ≤ 1,60 ⚠️ FUERA, como ya estaba |
| 5 | CORTA | 348 m | 1,37 | 1,37 | ✅ clavado | ≤ 1,45 |
| 6 | CORTA | 475 m | 1,10 | 1,10 | ✅ clavado | ≤ 1,45 |
| 7 | LARGA | 2.380 m | 1,06 | 1,06 | ✅ clavado | ≤ 1,20 |
| 8 | LARGA | 5.857 m | 1,09 | 1,09 | ✅ clavado | ≤ 1,60 |
| 9 | LARGA | 2.304 m | 1,25 | 1,25 | ✅ clavado | ≤ 1,45 |
| 10 | LARGA | 3.510 m | 1,15 | 1,15 | ✅ clavado | ≤ 1,45 |

```
   rodeo medio CORTAS  ...  1,49        (publicado → real: 1,49 → 1,49)
   rodeo medio LARGAS  ...  1,16        (publicado → real: 1,16 → 1,16)
   máximo cortas · largas   2,17 · 1,25
```

---

## §7 · ⭐ El 2,17 de la nº4, con un tercer camino encima (ley 149)

La cifra que más peso carga en el argumento es la que más merece un segundo instrumento. Además
del veredicto por arista y del artefacto del motor, **el desglose de la propia ruta explica los 506
metros uno a uno**, y explicarlos es incompatible con un ida-y-vuelta a la esquina:

```
   21 tramos de OSM, 26 aristas, y los metros repartidos así:
      2 tramos de ESCALERAS ....................  30 m
      un tramo peatonal sin nombre .............. 284 m   (56 % del total)
      Calle de la Rioja ......................... 94 m
      el resto (18 tramos) ...................... 98 m
      ────────────────────────────────────────────────
      TOTAL                                       506 m
```

⭐ **Dos tramos de escaleras y 284 metros de paso peatonal**: eso es la plataforma elevada de
Delicias, que es exactamente el caso extremo que Antonio puso a esta ruta. ⇒ **El 2,17 tiene una
explicación física, itemizada y ajena al defecto del grafo.**

⚠️ Y de paso queda dicho lo que ya publicaba el motor: **el rodeo de la nº4 no depende de los pasos
condicionales** —sin ellos son los mismos 506 m— ni del centroide, porque las dos puntas son
puertas a **0,0 m** de la calle.

---

## §8 · ⛔ Lo que esta tanda refuta de mi propio informe de ayer

La bitácora nº185 (10/08/2026, *«Una parada contra sí misma mide 15,70 metros»*) publicó esta
explicación:

> **Y no podía cazarlo ninguna de ellas, porque las diez rutas van de un portal a otro DISTANTE.**

**La conclusión es cierta y la causa es falsa.** Ninguna de las diez lo caza —§4 lo mide—, pero
**no por la distancia**: §5.1 enseña 8.811 pares de direcciones reales igual de separadas o más que
comparten arista. La causa real es otra —las diez cambian de calle, doblan esquinas, cruzan— y **no
está medida en esta tanda**: se dice `NO CONSTA` en vez de sustituir una explicación inventada por
otra. Entrada nueva en la bitácora.

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca. Esto se reporta hacia arriba y decide Antonio.

1. ⭐⭐⭐ **El argumento del rodeo corto SOBREVIVE ENTERO.** Ninguna de las nueve rutas resueltas
   comparte arista entre sus dos puntas, verificado por tres caminos (mi enganche, el artefacto del
   motor, y el desglose de la nº4). **Los rodeos publicados no se mueven ni una centésima.**
2. ⭐⭐ **Las largas son CINCO, no cuatro.** El estado (`:2959`) lista *«largas (2,5–6,4 km) 1,06 ·
   1,09 · 1,24 · 1,25»* y **falta la nº10**, que mide 4.044 m —dentro de esa misma banda— con rodeo
   **1,15**. La lista completa es **1,06 · 1,09 · 1,15 · 1,24 · 1,25**, media **1,16**, contra
   **1,49** de media en las cortas. ⇒ **El argumento no se debilita: se refuerza**, porque la que
   faltaba cae dentro del grupo compacto.
3. ⭐⭐ **233.767 pares de direcciones reales de Zaragoza comparten arista**, sobre 7.192 aristas.
   Separación p50 34,8 m, p99 433,2 m. **`CALLE ALFONSO I 12 → 17`: doce metros de acera, y el
   motor cobra treinta y dos.** ⇒ El defecto de `insertar` no es un caso de laboratorio ni de las
   afueras: **está en el centro y afecta al callejero, no solo a las paradas de bus.**
4. ⛔ **La explicación publicada ayer en la bitácora nº185 es falsa** (§8). La conclusión aguanta;
   la causa que le puse, no. La causa verdadera queda `NO CONSTA`.
5. ⚠️ **Las largas serían SEIS si la nº1 resolviera** — y el encargo de esta tanda las contaba así.
   La nº1 dio **3.087 m y rodeo 1,17** en la tanda 13, y **desde la regla de paridad ya no devuelve
   metros** porque el 78 de Avenida Cataluña no existe; el estado ya lo declara (`:369-371`). ⇒ **De
   las diez filas de Antonio, hoy se resuelven nueve: cinco largas y cuatro cortas.** El 1,17
   histórico cae dentro del grupo compacto de las largas, pero **no se usa en ninguna cuenta de esta
   tanda**: es de otra fecha y de otro estado del buscador.

---

## §10 · ⚠️ Lo que esta tanda NO ha comprobado

- **La causa real de por qué las nueve esquivan el defecto.** Se ha refutado la que había; no se ha
  puesto otra. `NO CONSTA`.
- **La probabilidad de tropezar con el defecto** en un trayecto corto cualquiera: falta el
  denominador (§5.1).
- **Nada de H2a se ha recalculado**: ni la red, ni el veredicto por enlace, ni los 2.538. Los 16
  pares contaminados de la tanda 6 siguen siendo 16.
- **El lado de la acera**, que sigue sin mirarse por tercera tanda seguida.
- **Y no se ha tocado `insertar`.** El defecto sigue vivo, medido y sin arreglar, y arreglarlo es
  una decisión de Antonio porque mueve el grafo, los 26 congelados, las diez rutas y la batería.

---

**Instrumento:** [`tools/grafo/misma-arista.js`](../tools/grafo/misma-arista.js) ·
`node src/rutas-antonio.js --aristas` → artefacto → `node tools/grafo/misma-arista.js --motor <f>`
