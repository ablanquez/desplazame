# H1 · EL ORDEN DE LOS NÚMEROS COMO CUARTO TESTIGO

*Tanda 15 · 2026-08-03 · idea de Antonio: «si tengo Paseo Pamplona 5, sé que estará entre el 3 y el 7».*

> ⛔⛔ **Este trabajo DETECTA. NO MUEVE NADA.** Decisión de Antonio. Las contrapruebas desplazan
> portales en copias que mueren dentro de la función que las crea; ningún dato de producción se toca.
> Mover cambiaría D0, que dice que el dato de contraste **verifica, no decide**.

> **Este documento se AÑADE, no reescribe nada.** Donde corrige un número publicado lo dice con el
> documento y el apartado que corrige.

```
node src/orden-numeros.js      # todo lo de aquí
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⛔⛔ el límite estructural** | **El 18,4 % de los portales comparte número con otro de su vía.** La Avenida de la Ilustración tiene **22 números para 1.469 portales** — el «31» son **147**. Ahí la pregunta de Antonio no se puede ni formular. |
| **⛔ el fallo correlacionado** | **Se lo traga entero.** Un portal desplazado 200 m se caza el 95 % de las veces; el mismo desplazamiento con sus dos vecinos, **0,0 %**. Una vía entera movida 200 m: **0 de 300**. Es aritmética, no un umbral mal puesto. |
| **⛔ la separación** | ×2,0 en bruto, y **×1,0 al igualar lo torcida que ya viene la calle**. El testigo municipal de la tanda 13 separaba ×251. |
| **⭐ lo que sí aporta** | Es el **único de los cuatro testigos que dice DÓNDE debería estar** un portal, y el único que **no depende de nombres**. |
| **⚠️ lo que sale mal** | Dos fallos míos (nº90, nº91). El gordo: **mi propia contraprueba del fallo correlacionado estaba rota y decía 44 % donde la verdad es 0 %.** |

---

## A · EL DETECTOR

### A2 · El método, escrito antes de ejecutarlo

**El test es LOCAL, no global.** La idea de Antonio no dice «los portales están ordenados a lo largo
de la calle»: dice «el 5 está ENTRE el 3 y el 7». Eso es una **intercalación**:

```
    B(a, p, b) = ( |a→p| + |p→b| ) / |a→b|
```

Si p está entre a y b, **B ≈ 1**. Si p se ha ido a otro sitio, B crece sin tope.

⭐ **Por qué así y no proyectando sobre un eje principal:** una vía real se parte en decenas de
aristas al planarizar, tuerce, y a veces es una L. La Avenida de la Ilustración engancha a **161
aristas** y **95 ways** distintos. Un PCA se rompe en la primera curva; la intercalación local no,
porque solo mira tres portales seguidos. **De paso, resuelve el caso «vía partida en varias aristas»
sin tratarlo.**

⭐⭐ **Se mide DOS VECES, y ahí está todo el valor:**

- `Bportal` — sobre las coordenadas del **Ayuntamiento**
- `Benganche` — sobre los puntos donde **el motor** engancha

La primera dice cuánto de desordenada viene ya la calle; la segunda, lo que hace el motor. Es la
**ley 48** —medir la variable antes de que el proceso investigado actúe— pero **gratis**, porque las
dos coordenadas están en el mismo fichero desde la tanda 11.

**⛔ El umbral NO sale de los enganches.** Sale del **p99 de `Bportal`**: *«el enganche está fuera de
orden si está más desordenado que el 99 % de los portales reales»*. **UMBRAL = 2,329.**
⚠️ Si saliera del grupo BUENOS, su tasa de falsa alarma sería del **1 % por construcción** y no
mediría nada.
⚠️ Y su sesgo, declarado: el esquema de cada vía se elige minimizando `Bportal`, así que el p99 sale
bajo y el detector queda **más sensible de la cuenta, no menos**.

**El esquema de numeración** —par/impar o correlativo— **se decide con las coordenadas del
Ayuntamiento, nunca con los enganches**. 1.514 vías par/impar (83,4 %) · 302 correlativas (16,6 %).
Los correlativos existen y están medidos desde la tanda 4 (Torres de San Lamberto, Polígono San
Valero). ⛔ Esa elección no puede sesgar el detector porque no toca `q` ni una vez.

### A1 · Los datos de partida, y dónde se pierden

| con al menos | vías | portales | % | …con NÚMEROS ÚNICOS | % |
|---|---:|---:|---:|---|---:|
| 2 portales | 2.508 | 45.807 | 99,5 % | 2.475 vías · 44.693 | 97,1 % |
| 3 portales | 2.301 | 45.393 | 98,6 % | 2.253 vías · 43.864 | 95,3 % |
| **5 portales** ⭐ | 1.937 | 44.130 | 95,9 % | 1.861 vías · 42.214 | 91,7 % |
| 20 portales | 720 | 31.538 | 68,5 % | 627 vías · 26.112 | 56,7 % |

**El mínimo son 5 números ÚNICOS por cadena**, y de dónde sale: con 5 hay 3 tríos, el mínimo para que
la mediana de una vía signifique algo. Con 2 portales no hay trío; con 3 hay uno solo y una sola
medida no distingue señal de accidente.

⇒ **Cobertura real: 27.926 portales (60,7 % del callejero).** La columna de la derecha es un techo,
no la cobertura: la cadena se parte por paridad y cada mitad necesita sus 5.

### ⛔⛔ A1b · EL LÍMITE ESTRUCTURAL DE LA IDEA

```
   ⛔ portales que COMPARTEN número con otro de su vía      8.467   (18,4 %)
      vías que se quedan mudas SOLO por eso                    59
   tríos descartados por |a→b| < 10 m                         555
```

**«El 5 está entre el 3 y el 7» exige que el 5 sea un sitio.** En la Avenida de la Ilustración hay
**1.469 portales y 22 números**: el «31» son **147 portales**. Ahí el número no localiza nada, y
**ningún umbral lo arregla**.

⛔ La primera versión de este código se quedaba con «el primero que encontrara» de los 147. **Eso no
es colapsar un duplicado: es tirar una moneda y llamarla medición.** Corregido: un número repetido no
puede ser nodo de la cadena.

---

## ⭐⭐⭐ A3 · LAS CONTRAPRUEBAS, ANTES QUE NINGÚN RESULTADO

Banco de pruebas: **1.626 vías** donde hoy el detector no señala nada.

### (a) ¿Puede ponerse rojo? — se desplaza UN portal

| desplazamiento | casos | lo caza |
|---|---:|---:|
| 10 m | 291 | 1 (0,3 %) |
| 25 m | 291 | 85 (29,2 %) |
| **50 m** | 291 | **206 (70,8 %)** |
| 100 m | 291 | 261 (89,7 %) |
| 200 m | 291 | 277 (95,2 %) |

⇒ **Sí puede.** Y con su curva: por debajo de **~25 m no ve nada**, y necesita **~50 m** para pasar
de la mitad. No es un detector fino: es un detector de bultos.

### ⚠️⚠️⚠️ (b) EL FALLO CORRELACIONADO — el portal **Y SUS VECINOS**

| desplazamiento | 1 solo | 3 juntos | 5 juntos |
|---|---:|---:|---:|
| 10 m | 0,3 % | **0,0 %** | **0,0 %** |
| 25 m | 29,2 % | **0,0 %** | **0,0 %** |
| 50 m | 70,8 % | **0,0 %** | **0,0 %** |
| 100 m | 89,7 % | **0,0 %** | **0,0 %** |
| 200 m | 95,2 % | **0,0 %** | **0,0 %** |

> ⛔⛔ **SE LO TRAGA ENTERO.**

Y **no es una sorpresa: es aritmética.** La intercalación B es invariante a trasladar el trío entero,
porque las tres distancias se mueven igual. **Un fallo que arrastra a los vecinos es invisible para
este testigo por construcción**, no por un umbral mal puesto.

⭐ El par (a)/(b) **se controla solo**: mismo objetivo, mismo desplazamiento, mismo umbral; la única
diferencia es cuántos se mueven juntos. Si las dos columnas salieran iguales, el arnés no
distinguiría nada y no habría que creerse ninguna de las dos.

#### ⭐⭐ Pero el bloque tiene BORDES

| desplazamiento | al objetivo (3 juntos) | a alguien de la vía |
|---|---:|---:|
| 10 m | 0,0 % | 0,7 % |
| 25 m | 0,0 % | 8,0 % |
| **50 m** | 0,0 % | **11,8 %** |
| 100 m | 0,0 % | 9,7 % |
| 200 m | 0,0 % | 3,8 % |

Un bloque desplazado es **invisible en su centro y visible en su borde** — y el borde se ve mejor a
50 m que a 200, porque a 200 m el trío del borde también se aplana. ⇒ **El detector tiene una
ventana**, no una sensibilidad creciente.

### ⛔⛔ (b2) El caso extremo — la VÍA ENTERA desplazada 200 m

No es una hipótesis: es lo que pasa cuando una calle engancha entera a la paralela.

```
   vías desplazadas enteras                300
   ⛔ portales señalados en total             0
   ⛔ vías en las que señala a alguien        0 de 300  (0,0 %)
```

⇒ **CERO. NO VE NADA.** Una vía entera mal enganchada no tiene bordes, y sin bordes no hay nada que
ver. La intercalación mide **forma**, y trasladar no cambia la forma.

### (c) Línea base — enganches barajados dentro de cada vía

```
   con los enganches barajados, señala     1.971 de 5.432   (36,3 %)
   frente a la tasa REAL del callejero                        1,0 %
   ⭐ multiplicador                                             ×38
```

⚠️ **Y por qué no sale más alto:** barajar dentro de una vía deja todos los puntos **en la misma
calle**. En una vía corta, cambiarlos de sitio mueve pocos metros. **Barajar no es lo mismo que
descolocar.**

---

## A4 · Los confusores

**Confusor 1 · la separación entre vecinos** (el que anticipó Antonio):

| \|a→b\| | n | señala |
|---|---:|---:|
| 10–25 m | 10.391 | 1,3 % |
| 50–100 m | 5.325 | 0,8 % |
| 300–∞ m | 888 | 0,5 % |

⇒ Existe pero es suave: en huecos grandes un enganche puede desviarse mucho sin salirse del cociente.

**⭐⭐ Confusor 3 · lo desordenada que viene YA la calle — y éste es demoledor:**

| `Bportal` | n | señala |
|---|---:|---:|
| 1–1,01 | 23.928 | **0,0 %** |
| 1,01–1,1 | 2.653 | 0,1 % |
| 1,1–1,5 | 1.580 | 1,8 % |
| ≥1,5 | 733 | **34,1 %** |

⇒ **El detector no señala prácticamente nada donde la calle viene recta** (el 83 % de los casos), y
dispara donde ya venía torcida. Eso obliga a comprobar todo lo demás **a igual `Bportal`**, y es lo
que se hace abajo.

---

## B · CONTRA LOS PATRONES DE VERDAD

⛔ BUENOS y SOSPECHOSOS los marcó la tanda 9 con `codigoVia` y la nube, **instrumentos que no saben
nada de números de portal** (ley 17).

```
   B1 · FALSA ALARMA   · señala sobre los BUENOS         107 de 17.256   (0,6 %)
   B2 · SENSIBILIDAD   · señala sobre los SOSPECHOSOS     60 de  4.943   (1,2 %)
   ⭐ PODER DE SEPARACIÓN                                          ×2,0
```

### ⭐⭐ Y a IGUAL desorden previo

| `Bportal` | BUENOS | SOSPECHOSOS | separación |
|---|---:|---:|---:|
| 1–1,01 | 0,0 % (n=15.267) | 0,0 % (n=3.669) | — |
| 1,01–1,1 | 0,0 % (n=1.139) | 0,3 % (n=673) | ×297 *(2 casos)* |
| 1,1–1,5 | 0,9 % (n=528) | 2,8 % (n=465) | ×3,0 |
| **≥1,5** | **31,9 %** (n=320) | **33,1 %** (n=136) | **×1,0** |

⇒ ⛔ **En la banda que lleva toda la señal, la separación es ×1,0.** El ×2,0 en bruto era el
confusor: los sospechosos viven en calles que ya vienen torcidas. **Es la ley 48 otra vez, y esta vez
se lleva por delante al testigo.**

### B2b · El barrido completo — ¿existe ALGÚN corte que separe?

Para que la conclusión no cuelgue de mi umbral, se barre el margen entero de `Benganche − Bportal`:

| empeora más de | BUENOS | SOSPECHOSOS | separación |
|---|---:|---:|---:|
| +0,05 | 1,61 % | 7,22 % | ×4,5 |
| +0,5 | 0,20 % | 1,19 % | ×5,9 |
| **+2** | 0,02 % | 0,47 % | **×20,1** |
| +5 | 0,00 % | 0,10 % | — |

**La mejor separación de todo el barrido es ×20,1**, con 3 buenos y 23 sospechosos detrás. ⇒ La vara
de medir la puso la tanda 13: **el testigo municipal separaba ×251**.

### B3 · Contra los 23 imputables de la tanda 14 — el patrón más limpio que hay

```
   imputables recalculados aquí            23   (la tanda 14 publicó 23 ✅ cuadre)
      de ellos, evaluables por el orden     7 de 23
   ⭐ los caza el orden de los números       0 de 7   (0,0 %)
```

⇒ **Cero de siete.** Y solo 7 de 23 son siquiera evaluables.

### B4 · ¿Acierta donde los otros callan?

```
   portales evaluables donde OSM no da nombre (ciegos)   5.636   señala 102  (1,8 %)
   sobre los que sí tienen nombre en OSM                22.290   señala 167  (0,7 %)
```

⭐ **Éste es el valor real del testigo**: opina donde los otros tres están callados **por definición**,
porque no depende de nombres — solo de que los portales estén numerados.
⚠️ Pero el 1,8 % contra el 0,7 % es un ×2,6 que arrastra el mismo confusor de arriba.

---

## C · APLICARLO DONDE DUELE

### ⛔⛔ C1 · La Avenida de la Ilustración — **MUDO**

```
   portales enganchados                       1.469
   aristas distintas a las que enganchan        161
   ways de OSM distintos                         95
   ⛔⛔ números de portal DISTINTOS               22   para 1.469 portales
      el número más repetido        nº 31 — 147 portales lo comparten
      portales con número ÚNICO en la vía         6
```

⚠️⚠️ **Y esto NO es «la avenida está bien».** La pregunta de Antonio —«el 5 está entre el 3 y el 7»—
**no se puede formular** cuando hay 147 portales que se llaman 31. Los 4 tríos que sobreviven salen
de **6 portales de 1.469 (0,3 %)** repartidos a lo largo de 2 km: eso no mide el orden de nada.

⇒ **Justo la calle donde más falta hacía —267 portales sin ningún testigo— es donde el cuarto testigo
tampoco puede hablar.**

### ⛔ C3 · Plaza El Periódico de Aragón — **MUDO**

El caso de la ruta nº4, el más verificable que había: **la vía tiene 2 portales.** Sin cadena no hay
orden. **No es un aprobado ni un suspenso: es un mudo**, y hay que decirlo con esas palabras.

### C2 · Los 198 con firma y los 175 sin culpable

```
   evaluables por el orden                 66 de 198   (33,3 %)
   ⭐ señalados por el orden                 7 de 66    (10,6 %)   ⇒ ×17 sobre la falsa alarma
```

**⛔⛔ Y el ×17 no sobrevive al confusor:**

```
   de los 198, con Bportal ≥ 1,1 (calle ya torcida)   40,9 %
      lo mismo en los BUENOS                            4,9 %
   a IGUAL calle (Bportal ≥ 1,1) · BUENOS              12,6 % (n=848)
   a IGUAL calle (Bportal ≥ 1,1) · los 198             25,9 % (n=27)
```

⇒ **El ×17 se cae a ×2,1**, y con 27 casos y 7 sucesos —3,4 esperados contra 7 observados— **eso no
decide nada**. Se publica como lo que es.

⚠️ **Reporte hacia arriba: esto NO rehabilita a los 198.** El detector no dice que estén bien: dice
que **no puede opinar** sobre dos tercios de ellos, y sobre el tercio que sí, no distingue. El
veredicto de la tanda 14 —«no son inocentes»— se apoyaba en la vecindad OSM, y eso no se toca.

### ⭐⭐ C4 · La lista para Antonio — POR CALLE, no por punto

**19 vías con 3 o más portales señalados.** ⛔ Sin número de portal en la lista: van los extremos del
tramo, que es lo que hace falta para ir a verlo.

| vía | señalados | de | tramo de números | el peor |
|---|---:|---:|---|---|
| CAMINO BÁRBOLES | 6 | 127 | 43–452 | 41.65752,-0.95730 (nº 91) |
| CALLE NOBLEZA BATURRA | 6 | 8 | 3–13 | 41.65420,-0.85699 (nº 13) |
| CALLE RÍO | 6 | 6 | 7–12 | 41.65285,-0.87027 (nº 10) |
| CALLE MARÍN BAGÜÉS | 5 | 6 | 3–7 | 41.63296,-0.87959 (nº 4) |
| AVENIDA MONTAÑANA | 5 | 326 | 895–949 | 41.70710,-0.81522 (nº 899) |
| CALLE MAR DE LAS ANTILLAS | 4 | 6 | 2–7 | 41.64512,-0.91858 (nº 6) |
| CALLE ARIZA | 4 | 4 | 2–5 | 41.64667,-0.93209 (nº 5) |
| CALLE BRAZATO | 4 | 5 | 3–7 | 41.62722,-0.91207 (nº 7) |
| CALLE VIOLANTE DE HUNGRÍA | 4 | 6 | 5–8 | 41.63937,-0.90116 (nº 6) |
| AVENIDA PUENTE DE LOS SUSPIROS | 4 | 5 | 6–9 | 41.61784,-0.87435 (nº 6) |

⚠️ **Y una lectura que no hay que perderse:** en seis de las diez, los señalados son **casi todos los
portales de la vía** (6 de 6, 6 de 8, 5 de 6, 4 de 4…). Eso no es «un portal descolocado»: o la vía
entera está rara, o `Bportal` ya venía alto. **Son las que hay que mirar primero, y también las que
menos se parecen al caso que la idea quería cazar.**

### C5 · ¿Es una lista revisable?

```
   portales señalados          269   (0,6 % del callejero entero)
   vías con al menos uno       164
   vías con 3 o más             19
   ⇒ ✅ es una lista revisable
```

⇒ No dispara la costura del briefing (miles de portales): son 269, y agrupados en 19 vías.

---

## ⭐⭐⭐ D1 · EL VEREDICTO, EN UNA FRASE

> **SOLO EN CIERTAS CONDICIONES, Y NO SE DAN DONDE HACÍA FALTA** — el orden de los números detecta un
> portal descolocado más de 50 m **cuando está solo** (70,8 %) y es el único testigo que dice **dónde**
> debería ir, pero es **ciego por aritmética** al fallo que arrastra vecinos (0,0 %), su separación
> entre buenos y sospechosos **se cae a ×1,0** al igualar lo torcida que viene la calle, y en las dos
> direcciones que motivaron la tanda —la Avenida de la Ilustración y Plaza El Periódico de Aragón—
> **está mudo**.

### Las condiciones, con su porcentaje

| condición | se da en |
|---|---|
| 1 · la vía tiene ≥5 números **únicos** por cadena | **60,7 %** del callejero |
| 2 · el fallo es **aislado**, no arrastra vecinos | ⚠️ **no medible**: no se sabe cuántos lo son |
| 3 · el desplazamiento pasa de **~50 m** | 70,8 % de detección ahí; a 25 m, 29,2 % |
| ⚠️ y donde hay señal (`Bportal` ≥ 1,1) | **7,8 %** de lo evaluable |

⚠️ **La condición 2 es la que decide y es la que no se puede medir.** Si los enganches malos de
Zaragoza son sobre todo «una calle entera enganchada a la paralela» —que es la forma que tenían los
sospechosos de la tanda 9—, este testigo es inútil. Si son portales sueltos, sirve. **Con el dato de
hoy no se puede saber cuál de las dos.**

### D2 · ¿Serviría para COLOCAR? — con el número delante, y sin hacerlo

```
   predicción disponible para los señalados                 269
   distancia del enganche actual a la predicción   mediana 58 m · p90 172 m
```

⛔ **Y su límite, que no es pequeño:** la predicción interpola entre los **enganches** de los dos
vecinos. **Si ellos también están mal, la predicción está mal** — y el detector es ciego precisamente
a ese caso. ⇒ Colocar con esto **arreglaría el portal aislado y movería el resto hacia el error de
sus vecinos**.

⇒ **NO se hace.** Es decisión de Antonio, y ahora tiene el número delante.

### D3 · Dónde NO funciona, declarado

1. **Vías donde el número se repite** — 18,4 % de los portales. No es un fallo del detector: es que
   ahí la numeración no localiza.
2. **Fallos correlacionados** — 0,0 % de detección. Por aritmética.
3. **Vías enteras desplazadas** — 0 de 300. El caso más común de enganche malo, y el más invisible.
4. **Desplazamientos por debajo de 25 m** — 0,3 % de detección.
5. **Calles que ya vienen rectas** (`Bportal` < 1,01, el 83 % de los casos) — 0,0 % de detección.
   Puede ser que ahí el motor no falle, o que el detector no lo vea. **Con esto no se distingue.**
6. **Vías con menos de 5 números únicos por cadena** — 39,3 % del callejero.

---

## MÉTODO

### «¿Puede esto pasar o fallar sin que nada funcione?» — respondido antes de medir

| verificación | podía | cómo se tapó |
|---|---|---|
| A2 · el umbral | **sí**: sacarlo de los BUENOS daría 1 % de falsa alarma por definición | sale del p99 de `Bportal`, que produce el Ayuntamiento |
| A3a · «puede ponerse rojo» | **sí**, si el desplazamiento fuera tan bestia que lo cazara cualquier cosa | se barre una curva de 10 a 100 m, no un valor |
| A3b · el fallo correlacionado | **sí**, si el arnés moviera los portales equivocados | ⛔ **y pasó**: bitácora nº90 |
| A3c · la línea base | **sí**, con un umbral absoluto inventado | ⛔ **y pasó**: bitácora nº91. Ahora es un cociente |
| B1/B2 · falsa alarma y sensibilidad | **sí**, si los grupos difirieran en algo que no es el enganche | se mide a igual `Bportal` ⇒ **se cae a ×1,0** |
| C1 · «la Ilustración está bien» | **sí**, con 267 portales en una arista recta | se cuentan las aristas (161) y los números únicos (6 de 1.469) ⇒ **mudo** |
| C2 · el ×17 de los 198 | **sí**, mismo confusor | se mide a igual `Bportal` ⇒ **se cae a ×2,1 con 27 casos** |

### Los diez ejes

| eje | tocado | cómo |
|---|---|---|
| posición | ✅ | la intercalación entera, en metros |
| vecindad | ✅✅ | ⭐ **el detector ES un test de vecindad**: cada portal contra sus dos vecinos por número |
| dirección | ⛔ | **no tocado** — el motor de H1 es simétrico |
| identidad | ✅ | el número de portal como identificador de posición; ahí muere la idea (18,4 % repetidos) |
| correspondencia | ✅ | portal ↔ vía del callejero, portal ↔ su enganche |
| umbral/cola | ✅✅ | el barrido completo de B2b: no depende de un corte mío |
| escala | ✅✅ | la curva de detección por metros de desplazamiento, 10 → 200 m |
| densidad | ✅ | portales por vía, separación \|a→b\| entre vecinos |
| agregación | ✅ | la lista por VÍA, no por punto (C4) |
| semántica | ⚠️ parcial | `sortNumber` colapsa «22A» y «22B»; no se ha mirado si eso pierde orden real |

### Lo que se buscó a propósito y NO se encontró

- **Un corte que separe buenos de sospechosos como el testigo municipal.** El barrido entero da ×20
  como máximo, contra ×251. **No existe.**
- **Que la Avenida de la Ilustración estuviera descolocada.** No es que esté bien: es que no se puede
  preguntar.
- **Que cazara alguno de los 23 imputables.** 0 de 7.
- **Que el ×17 de los 198 sobreviviera al confusor.** No sobrevive.

### Lo que NO se ha comprobado

- **Si los enganches malos reales son aislados o correlacionados.** Es la condición que decide si este
  testigo sirve, y **no se ha medido** — no se sabe cómo, con el dato de hoy.
- **Si el 0,0 % de detección en calles rectas es «el motor no falla ahí» o «el detector no lo ve».**
- **Si `sortNumber` pierde orden real** al colapsar 22A y 22B. Son 2.626 portales con número no
  puramente numérico.
- **Ninguna de las 19 vías señaladas se ha ido a mirar.**

---

## Reportes hacia arriba

1. ⚠️ **La idea de Antonio choca con un hecho del callejero que no estaba escrito en ninguna parte:**
   **el 18,4 % de los portales comparte número con otro de su vía**, y en los grandes desarrollos
   —Avenida de la Ilustración— eso llega a 147 portales con el mismo número. Cualquier cosa que se
   quiera hacer con «el número» tiene que contar con esto.
2. ⚠️ **Esto no rehabilita a los 198** (tanda 14). El detector no puede opinar sobre dos tercios de
   ellos y sobre el resto no distingue. El veredicto «no son inocentes» sigue como estaba.
3. ⭐ **La única propiedad que ningún otro testigo tiene** —decir dónde debería estar el portal— está
   disponible para los 269 señalados, con mediana de 58 m. **Usarla es otra decisión.**

---

*Ejecutado el 2026-08-03. Sello del grafo `2026-08-03T08:19:51Z`. Callejero municipal: 46.026 portales
enganchados, 2.727 vías. Bitácora nº90 y nº91.*
