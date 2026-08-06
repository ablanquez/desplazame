# H1 · DOS ACERAS, DOS CALLES — la paridad en el buscador de direcciones

**Tanda 33 · 2026-08-06.** Reproducible con:

```
node src/medir-paridad.js --rutas     # A, B, C1–C4, D
node src/rutas-antonio.js             # el banco de las siete
node src/modelo-rutas.js              # los metros y los pasos publicados
node src/numeros-congelados.js        # los 21 congelados
```

> ⛔ Este documento **se añade**, no reescribe a los anteriores. Corrige el
> comportamiento que `docs/H1-ACERA-EQUIVOCADA.md` (tanda 32) midió y dejó sin
> tocar. Lo que aquella midió sigue siendo válido; lo que ha cambiado es la regla.

---

## 0 · La decisión, y el fallo de fondo en una frase

> **Antonio:** *«La acera par por un lado, la acera impar por otro. Si nos preguntan
> por un número par es de una acera, y si es impar es de otra. A efectos de
> entenderme, es COMO SI FUESEN DOS CALLES DIFERENTES QUE NO GUARDAN RELACIÓN —
> precisamente para evitar lo que ha pasado con Avenida Cataluña.»*

⭐ **LA CERCANÍA NUMÉRICA NO ES CERCANÍA FÍSICA.** Todo el fallo sale de tratarlas
como si fueran lo mismo: se pidió `Avenida Cataluña 78`, el 78 no existe, el
buscador cayó al **77** —la acera de enfrente— y el par más próximo estaba a
**258 m**.

### La regla, tal como ha quedado

| | |
|---|---|
| **1** | Si se pide un **par**, solo existe la acera par. Los impares **no son una alternativa**. Y al revés. |
| **2** | Si el número exacto no está, se busca **dentro de su misma paridad**. *78 → 76 u 80. **Nunca 77.*** |
| **3** | Si no hay ninguno de su paridad **razonablemente cerca** (⇒ §A2): **NO SE TIENE**, y se sugiere. La app no resuelve por su cuenta. |
| **4** | ⛔ **La sugerencia NUNCA incluye el de la acera de enfrente.** |

La regla vive en [`src/paridad.js`](../src/paridad.js). ⛔ **No está copiada dentro
del geocodificador**: `direccion.resolver()` la llama, y `medir-paridad.js` llama a
la misma función (ley 56). Las dos decisiones salen del mismo código, no de dos
redacciones de la misma idea.

### ⛔ El candado del alcance, declarado antes de escribir nada

La regla **solo se mete donde la paridad es el problema**: cuando la respuesta de
hoy cambia de acera. Si el más cercano en número ya era de la paridad pedida, la
respuesta es la de siempre.

⚠️ **No es una cautela decorativa.** Sin ese candado, la regla de la distancia se
habría llevado por delante el origen de la **ruta 3** —`Cantando Bajo la Lluvia 6`,
que no existe y cae en el 10, **los dos pares**—. Una ruta moviéndose sin que su
extremo cambie de acera es la señal de que el cambio se ha salido de su sitio.

⇒ está escrito como **invariante comprobado sobre las 151.026 consultas**, no como
propósito: *el conjunto de consultas que cambian de respuesta ⊆ el conjunto de
consultas cuya respuesta de hoy cambia de acera*. **Sale 0 excepciones.**

---

## A1 · Dónde la paridad **no** significa acera — y qué se hace con cada caso

| forma de numeración | casillas | % | qué hace la regla |
|---|---:|---:|---|
| `no-verificable` | 1.571 | 58,9 % | ⚠️ menos de 15 tríos: **no se puede medir**. Se aplica la paridad, y se dice. |
| `un-solo-lado` | 769 | 28,9 % | ⛔ no hay ni un portal de la otra paridad: no hay adónde ir. Respuesta de siempre. |
| `par-impar` | 317 | 11,9 % | ⭐ la regla **aplica**. |
| `correlativa` | 8 | 0,3 % | ⛔ los números van seguidos: la paridad no es acera. Respuesta de siempre. |

**Cómo se detecta la numeración correlativa** (sin lista de nombres a mano): para
cada trío `(n, n+1, n+2)` se mide el ángulo entre `n→n+1` y `n→n+2`. En una calle
par/impar el `n+1` está enfrente y el `n+2` calle adelante ⇒ ángulo grande. En una
correlativa los dos van calle adelante ⇒ ángulo ~0°. Se declara correlativa con
**≥15 tríos y ≥90 % por debajo de 45°**.

### ⭐⭐ Los cuatro casos conocidos — el control, antes que ningún porcentaje

| vía | forma | tríos | frac<45° | lo que se sabía |
|---|---|---:|---:|---|
| POLÍGONO SAN VALERO | `correlativa` | 92 | 0,98 | ✅ tanda 4: correlativa |
| URB. TORRES DE SAN LAMBERTO | `par-impar` | 51 | 0,65 | ⛔ tanda 4: correlativa |
| AVENIDA CATALUÑA | `par-impar` | 28 | 0,43 | ✅ diana de Antonio |
| AVENIDA MADRID | `par-impar` | 44 | 0,32 | ✅ diana de Antonio |

⛔ **EL LÍMITE, DICHO: de los dos casos correlativos conocidos, el método caza uno.**
Torres de San Lamberto tiene la numeración mezclada de verdad —sus 51 tríos van de
1° a 180°— y la geometría no la separa. **NO CONSTA**: no se fuerza a mano.

⚠️ **Y el listón está alto a propósito, por la asimetría del daño:**

- declarar correlativa una vía que **no** lo es → se repite el fallo original, **sin
  cota** (258 m en Avenida Cataluña);
- declarar par/impar una correlativa → el error lo acota el listón de 50 m, o se
  convierte en sugerencia.

⇒ **ante la duda, paridad. Y la duda se declara.**

### Los otros tres casos que no encajan

| | |
|---|---|
| **números repetidos** | 563 de 2.665 vías (21,1 %) · 7.704 portales excedentes (16,7 %). ⇒ **la regla ni los ve**: un repetido es coincidencia EXACTA y se resuelve antes. Cuál de los hermanos se elige no lo toca esta tanda. |
| **letras, `bis`, rangos** | 2.626 (5,7 %), de ellos 1.523 rangos tipo `9-11`. El número de orden ya trae la paridad. ⛔ **26 rangos cruzan paridad** (`11-12`, `5-6`): se quedan con la del primer número, y no se puede hacer más — el dato dice que el portal es los dos a la vez. |
| **calles de un solo lado** | 769 casillas. Si no hay ni un portal de la paridad pedida, se cae a la respuesta de siempre **y el aviso lo dice**: *«esta vía solo tiene números pares»*. |

⚠️ **El 18,4 % que cita el encargo no es éste.** Medido aquí, «repite número dentro
de su propia vía» sale **21,1 % de vías / 16,7 % de portales**. El 18,4 % de la
tanda 32 era otra cosa: *de lo pedible, el 18,4 % existe* (§B3b). ⛔ No es una
corrección del encargo: son dos números distintos y conviene no cruzarlos.

⚠️ **Y un límite anterior a esta tanda, declarado:** 63 casillas del índice (2,4 %)
**mezclan más de una vía** — `CALLE SAN VALERO` y `POLÍGONO SAN VALERO` comparten
núcleo. En esas 63 la forma de numeración se mide sobre las dos juntas. No se
arregla aquí.

---

## A2 · Qué es «razonablemente cerca» — en **metros**, y de dónde sale

⛔ No se mide en números de portal: entre el 78 y el 80 puede haber diez metros o
doscientos, y **eso es exactamente lo que hizo fallar al buscador**.

⭐ El criterio, en una frase: *no se da por buena una respuesta cuyo error posible
sea mayor que la distancia típica entre dos portales seguidos de esa misma acera.*
**Como mucho, el portal de al lado.**

| separación entre portales consecutivos de la MISMA acera | n | p25 | med | p75 | **p90** | p95 |
|---|---:|---:|---:|---:|---:|---:|
| todas las vías | 33.885 | 9 | 16 | 28 | 71 | 137 |
| ⭐ solo vías urbanas | 30.283 | 9 | 14 | 24 | **52** | 91 |

⇒ **`RAZONABLE_M = 50 m`**, del p90 urbano redondeado.

⚠️ Y cae en la misma magnitud que el listón de 50 m que la tanda 32 usó por otro
camino (*«6.380 huecos urbanos desplazan más de 50 m»*). ⛔ Eso no es una
comprobación: es que dos medidas independientes no se contradicen.

### ⭐⭐ Cómo se acota el error sin interpolar

El número pedido **no existe, así que no tiene sitio**. Lo único honesto es decir
dentro de qué tramo caería y cuánto mide ese tramo:

| situación | cota |
|---|---|
| entre dos portales de su acera | lo que miden esos dos |
| **un solo paso** fuera del extremo | lo que mide el hueco de al lado |
| más de un paso fuera | ⛔ **no se puede acotar sin interpolar**, y hoy no se interpola |

---

## A3 + B · Qué contesta ahora `Avenida Cataluña 78`

```
   estado       sin-numero-cerca   [vía par-impar]
   respuesta    ⛔ NO SE TIENE — solo sugerencia

   aviso   «el 78 no existe · en su acera, la de los pares, los más cercanos
            son el 74 y el 84, y entre ellos hay 175 m»

   ⭐ sugerencia  nº74   acera de los pares   175 m   un extremo del hueco
   ⭐ sugerencia  nº84   acera de los pares   175 m   un extremo del hueco
```

**El aviso de antes decía la verdad de una cosa y el lector entendía otra:** *«el
más cercano es el 77»* — donde *cercano* era **en número** y se lee **como en la
calle**. El de ahora dice **dónde está y cuánto se aleja**, y ⛔ no cuenta cómo
funciona el dato por dentro.

⚠️ **La distancia de la sugerencia es entre las dos sugerencias, y se dice.** No hay
ninguna distancia «hasta el 78» que medir, porque el 78 no está en ningún sitio. Lo
que sí se puede medir es el tamaño del hueco en el que caería. Cuando solo hay una
sugerencia —el número queda fuera del tramo numerado— `metros` viene a **null**:
NO CONSTA, no un cero.

### Los otros avisos, tal cual los vería alguien

```
Avenida Pablo Gargallo 16   ⛔ NO SE TIENE
   «el 16 no existe · en esta vía los pares empiezan en el 36, 10 números más adelante»
   ⭐ sugerencia nº36 · acera de los pares

Calle Matadero 1            nº3
   «el 1 no existe · te dejo en el 3, en su acera, la de los impares
     · el 1 caería como mucho a 23 m»

Cantando Bajo la Lluvia 6   nº10        (vía de un solo lado · respuesta de siempre)
   «el 6 no existe · te dejo en el 10, el más cercano de su misma acera»
```

⛔ **Comprobado sobre todas las sugerencias emitidas: ninguna es de la acera de
enfrente.** Es la regla 4, escrita como `A.exige`.

---

## C1 · Cuántas consultas cambian de respuesta

El universo es el de la tanda 32: para cada vía con dos hilos, todos los números
del mínimo al máximo.

```
   números que se pueden pedir                        151.026
      …que EXISTEN                                     27.882   18,5 %
      …que son HUECO                                  123.144   81,5 %
   ⭐ de los huecos, los que HOY te cambian de acera    66.961   54,4 %
```

⚠️ La tanda 32 publicó 150.947 · 27.815 · 123.132 · 66.973. La diferencia —menos del
0,1 %— es que aquella agrupó por `codigoVia` sobre los portales **enganchados** y
ésta agrupa por **casilla de búsqueda** sobre los 46.150. ⭐ Y agrupa así a
propósito: **la casilla es la unidad que mira el buscador**.

| qué le pasa a cada hueco | cuántos | % de los huecos |
|---|---:|---:|
| la respuesta de hoy ya era de su acera ⇒ **no se toca** | 56.183 | 45,6 % |
| ⭐ pasa a un portal de **su** acera | 4.562 | 3,7 % |
| ⛔ pasa a **no tener** respuesta (solo sugerencia) | 62.315 | 50,6 % |
| ⚠️ la paridad no manda en esa vía ⇒ respuesta de siempre | 84 | 0,1 % |
| **⇒ CONSULTAS QUE CAMBIAN DE RESPUESTA** | **66.877** | **44,3 % de lo pedible** |

**⛔⛔ El invariante: 0 consultas cambian sin que su respuesta de hoy cambiara de
acera.** Es la costura del encargo escrita como comprobación, y corrida sobre las
151.026 consultas en vez de sobre las catorce de las rutas.

---

## C2 · Cuánto acerca — ⛔ y por qué el titular fácil sería una trampa

| | n | med | p75 | p90 | máx |
|---|---:|---:|---:|---:|---:|
| lo que te alejaba la acera de enfrente (tanda 32) · todas | 66.877 | **126** | 171 | 171 | 18.633 |
| …urbanas | 12.845 | **54** | 131 | 289 | 17.254 |
| ⭐ el error que **queda** en las que SÍ se contestan · todas | 4.562 | **22** | 35 | 43 | 50 |
| …urbanas | 4.445 | 22 | 34 | 43 | 50 |
| ⛔ el hueco de las que se **rechazan** · todas | 32.401 | 85 | 85 | 289 | 19.170 |
| …urbanas | 4.531 | **151** | 307 | 848 | 19.170 |

⭐⭐ **El cuadre:** la primera fila reproduce la tanda 32 —126 m todas, 54 frente a
51 urbanas—. Si no lo hiciera, este barrido estaría midiendo otra cosa. Va como
`A.exige`.

⛔⛔ **Y aquí está la trampa, dicha antes que el número:** la primera fila **no baja
a cero «porque la regla funcione»**. La tanda 32 midió el error viejo como *la
distancia entre lo que te daba el buscador y el portal de tu paridad más cercano en
número* — y la regla nueva devuelve **exactamente ese portal**. Es la misma vara.
Publicar ese cero como logro sería mentir con aritmética correcta.

⇒ **El número que vale es el de en medio: 22 m de mediana.** Eso es lo que sigue sin
saberse aun contestando bien, y no es cero: el número pedido no existe, así que
sigue pudiendo caer en cualquier punto de su hueco. Lo que ha cambiado es que ahora
**el hueco es de su acera**.

---

## C3 · ⚠️⚠️⚠️ El coste — cuántas consultas se quedan **sin respuesta**

```
   ⛔ sin respuesta (solo sugerencia)         62.315   41,3 % de lo pedible
                                                       50,6 % de los huecos
                                                       93,1 % de los que hoy cambian de acera
      …en vías urbanas                         8.400   65,0 % de los urbanos que cambian de acera
      ⭐ por hueco demasiado grande (>50 m)    32.401   52,0 %
      ⚠️ por caer FUERA del tramo numerado     29.914   48,0 %
```

⛔⛔ **ES MUCHÍSIMO, Y VA DICHO ASÍ: la mitad de los números que no existen dejan de
tener respuesta automática.** Antes **todos** tenían una — la de la acera de
enfrente, que es la que puso a Antonio a 258 m de donde iba.

⭐ Lo que **no** se pierde: de esas consultas se sigue sabiendo el número, la acera y
el tamaño del hueco. Lo que se quita es que **la app decida sola**.

### ⭐⭐ El dial, para que se pueda mover con datos

| listón | contestadas | sin respuesta |
|---:|---:|---:|
| 25 m | 2.604 | 64.273 |
| **50 m** | **4.562** | **62.315** ⭐ el aplicado |
| 100 m | 31.411 | 35.466 |
| 200 m | 32.985 | 33.892 |
| 400 m | 34.456 | 32.421 |

⚠️⚠️ **El listón cae justo en el acantilado.** Entre 50 y 100 m las contestadas se
multiplican por **siete**. ⇒ la elección del listón domina el resultado, y por eso
va el dial entero y no solo la fila elegida. **Moverlo es una decisión de Antonio,
no mía.**

⛔ Las 29.914 que caen fuera del tramo **no se arreglan subiendo el listón**: no hay
hueco que medir.

---

## C4 · ⭐⭐⭐ Las siete rutas, una a una

| ruta | extremo | antes | ahora | qué pasa |
|---:|---|---|---|---|
| 1 | O `Avenida Cataluña 78` | nº**77** ⛔ enfrente | — | ⛔ **PASA A SUGERENCIA**: nº74 / nº84 (hueco 175 m) |
| 1 | D `Avenida Pablo Gargallo 16` | nº**15** ⛔ enfrente | — | ⛔ **PASA A SUGERENCIA**: nº36 |
| 2 | O/D | nº6 · nº17 | igual | ✅ exactos |
| 3 | O `Cantando Bajo la Lluvia 6` | nº10 | nº10 | ✅ vía de un solo lado — la respuesta no se toca |
| 4 | O/D | POI · POI | igual | ✅ edificios: sin portal ni paridad |
| 5 | O `Principado de Morea 14` | nº14 | igual | ✅ exacto |
| 6 | D `Calle Matadero 1` | nº**2** ⛔ enfrente | nº**3** | ⭐ misma acera, a un paso de 23 m |
| 7 | O/D | nº2 · nº48 | igual | ✅ **exactos los dos** |

### Los metros

| ruta | publicado | ahora | |
|---:|---:|---:|---|
| 1 | 3.086,9 | ⛔ **SUGERENCIA** | aceptando la 1ª sugerencia (nº74 → nº36): **2.832,1 m** (−254,8 m, −8,3 %) |
| 2 | 598,1 | 598,1 | ✅ idéntica |
| 3 | 3.704,9 | 3.704,9 | ✅ idéntica |
| 4 | 505,9 | 505,9 | ✅ idéntica |
| 5 | 477,4 | 477,4 | ✅ idéntica |
| 6 | 523,4 | **520,2** | ⭐ se mueve −3,2 m |
| 7 | 2.528,9 | **2.528,9** | ⭐⭐ **idéntica — la calibración de los ~6 km/h NO está en cuestión** |

⭐ **Los −254,8 m de la ruta 1 son exactamente los que la tanda 32 predijo** midiendo
la misma sustitución por otro camino. Dos cálculos independientes, el mismo número.

⛔ **Los 3.086,9 m publicados de la ruta 1 estaban medidos entre el 77 y el 15** —la
acera de enfrente en los dos extremos—, que es justo el fallo que Antonio encontró.
**No se sustituyen por otro número**: aceptando las sugerencias salen 2.832,1 m,
pero eso ya no es «la ruta nº1», es otra consulta. ⚠️ Y era la única de las siete
**sin banda declarada** (`NO CONSTA`), así que no había nada que pudiera cazarlo.

### El banco de pruebas, antes y después

| | antes | ahora |
|---|---|---|
| rutas resueltas | 7 de 7 | **6 de 7** |
| dentro del rodeo aceptable | 6 de 7 | 5 de 6 |
| dentro de la banda de distancia | 4 de 6 | 4 de 6 |
| rojo | ⛔ ruta nº4, rodeo 2.17 > 1.6 | ⛔ **el mismo** |

⭐ El único rojo del banco es **el de antes, idéntico**. Ninguna ruta ha empezado a
fallar por esto.

### ⛔ Y los guardianes se han rehecho para que el rojo pueda volver a saltar

`src/modelo-rutas.js` guardaba los metros publicados de las siete y **74 pasos**. Con
la ruta 1 fuera, eso pasa a **seis rutas y 56 pasos** (`2:9 · 3:22 · 4:7 · 5:4 ·
6:3 · 7:11`). ⚠️ Actualizarlo **no es un trámite**: queda escrito en el propio
fichero por qué se mueve cada número.

⭐⭐ Y se añade el guardián del lado contrario, que es el que faltaba: **la ruta 1 NO
debe resolverse**. Sin él, revertir la paridad en silencio dejaría el guardián en
verde — que es la forma exacta del fallo nº105.

⛔ `data/pruebas/RUTAS-CONOCIDAS.md` **no se toca**: es de Antonio.

---

## C5 · Los números congelados

**Los 21 siguen intactos.** `numeros-congelados.js` sale en código 0 sin mutar, y las
dos roturas de la tanda 30 —el colapso de `sinNombrePorDefinicion()` y la deriva de
`traffic_island`— se siguen cazando **2 de 2**.

⭐ Y es esperable, no una casualidad: los 21 miden el **grafo, el mapa y el modelo**,
y esta tanda solo toca **el buscador de direcciones**. Que ninguno se moviera es una
comprobación del alcance, no un alivio.

Los dos números publicados que **sí** se han movido son los del banco de rutas, y
están arriba: **523,4 → 520,2 m** y **74 → 56 pasos**.

---

## D · Lo que esto **no** arregla

**D1 · El 78 sigue sin existir.** Llevarte al 74 es la acera correcta, **pero no el
portal que pediste**. Ninguna regla de paridad puede inventar un portal.

**D2 · ⭐ Lo honesto sería interpolar** sobre el hilo de su paridad: si el 74 y el 84
están, el 78 va entre medias. ⛔ **No se hace hoy — es otra tanda.** Su tamaño:

```
   consultas que hoy se quedan sin respuesta por hueco grande     32.401
   ⛔ …y las que caen fuera del tramo: la interpolación NO las salva  29.914
   consultas respondidas cuyo error sigue por encima de 25 m       1.958
```

⇒ **la interpolación es la única que puede bajar el error de esas 32.401 de «un hueco
entero» a «unos metros».** Es el trabajo pendiente más grande que deja esta tanda, y
tiene su número.

**D3 · ⚠️ Los 76 portales enganchados a la acera contraria siguen ahí.** Se decidió en
la tanda 32: **marcarlos, no moverlos** —59 no tienen adónde ir y los 17 que sí
quedarían veinte veces más lejos—. ⛔ Esta tanda **no toca el enganche**.

---

## E · Qué busqué y no encontré · qué NO he comprobado

**Busqué y no encontré:**

- **Un detector de numeración correlativa que separe de verdad.** El ángulo entre
  tríos solo distingue los casos extremos: caza Polígono San Valero (0,98) y **no**
  caza Torres de San Lamberto (0,65). Entre 0,4 y 0,7 la geometría no dice nada, y
  ahí está la mitad de las urbanizaciones. **NO CONSTA.**
- **Una ruta que se moviera sin que su extremo cambiara de paridad.** Se buscó a
  propósito sobre las 151.026 consultas, no sobre las catorce. **Cero.**

**NO he comprobado:**

- **Si el portal está físicamente en la acera que dice el callejero.** Todo esto
  compara contra la **paridad del dato**, no contra el terreno. Sigue igual que en
  la tanda 32: **NO CONSTA**.
- **Qué direcciones pide la gente de verdad.** Sin eso, el 41,3 % «de lo pedible»
  no se traduce en daño real: nadie pide los 151.026 números con la misma
  frecuencia. ⚠️ Es el dato que convertiría el coste de §C3 en algo que se pueda
  sopesar, y **no lo tengo**.
- **Si `RAZONABLE_M = 50 m` es el listón que Antonio quiere.** Va el dial entero
  (§C3) precisamente porque **la elección domina el resultado** y no es mía.

---

## F · Mis fallos de esta tanda

Los tres están en `docs/BITACORA.md` con su ⭐ capturado en caliente.

| nº | qué |
|---:|---|
| **132** | El detector de correlativas, calibrado contra cuatro casos conocidos, **pasó los cuatro** y clasificó **Avenida Pablo Gargallo como correlativa**. Lo cazó el banco de rutas. Causa: los ángulos son **bimodales incluso en avenidas normales**, y la mediana de una bimodal dice cuál montón es más gordo, no de qué lado está la vía. |
| **133** | Metí en la misma fila el error de las respuestas que doy y el hueco de las que rechazo — y publiqué «error residual 85 m» con un listón declarado de 50. Lo cazó el absurdo aritmético contra un listón del propio fichero. |
| **134** | Copié la sugerencia campo a campo y se quedó `motivo` por el camino: `«175 m undefined»`. Lo cazó leer la salida. |

⭐ **La ley de la 132, que es la que se lleva la tanda:** *un listón calibrado contra
N casos conocidos acierta en los N casos conocidos. Eso no es una comprobación: es
la definición de calibrar. La comprobación es el caso N+1, y hay que ir a
buscarlo.*
