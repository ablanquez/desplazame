# H1 · CRUZAR ES DE LADO — el tope de adelanto, y el centinela apagado

**Tanda 35 · 2026-08-06.** Reproducible con:

```
node src/medir-listones.js            # A2 el reparto · A3 lo que se pierde · B3 los diales
node src/medir-paridad.js --rutas     # B el centinela · A4 · C2 las siete rutas
node src/numeros-congelados.js        # los 26 congelados (21 + los 5 republicados)
node src/rutas-antonio.js             # el banco de las siete
```

> ⛔ Este documento **se añade**, no reescribe a los anteriores. Corrige dos cosas
> publicadas: el universo de las tandas 32-34 (§B) y una frase mía de la tanda 34
> que llegó a ser la base de una decisión (§A3).

---

## ⭐⭐ A · El tope de adelanto: **20 m**

> **Antonio:** *«CRUZAR TE MUEVE DE LADO, NO HACIA DELANTE.»*

Un portal a 100 m calle abajo no es tu vecino aunque esté en la otra acera. El
radio de 150 m y el listón de 100 m de su propia acera **se quedan como estaban**;
lo que se añade es un tope a la componente **longitudinal**.

### A2 · El reparto después, con la misma vara de ayer

| | antes (sin tope) | **con ≤20 m** |
|---|---:|---:|
| ⭐ ANCHO — está cruzando | 3.348 · 31,1 % | **2.142 · 71,7 %** |
| ⛔ DESFASE — está calle abajo | 7.429 · 68,9 % | **844 · 28,3 %** |

**Se da la vuelta.** Y no depende del corte —el mismo 45° sin calibrar de ayer—:

| corte | ancho | desfase | % desfase |
|---:|---:|---:|---:|
| 30° | 2.746 | 240 | 8,0 % |
| **45°** ⭐ el aplicado | 2.142 | 844 | **28,3 %** |
| 60° | 1.599 | 1.387 | 46,5 % |

⭐ **A cualquier corte, el ancho es mayoría.** Ayer no lo era a ninguno.

**El desfase que queda está acotado por construcción:** mediana 15 m, máximo 20.
Ya no es «te mando calle abajo»; es «el portal de enfrente está un poco corrido».

### A3 · ⚠️ Qué se pierde — y una corrección a lo que yo mismo escribí

| | sin tope | con ≤20 m | **se pierden** |
|---|---:|---:|---:|
| sugerencias de enfrente | 10.777 | 2.986 | 7.791 |
| ⭐ de ellas, ANCHO | 3.348 | 2.142 | **1.206** |
| ⛔ de ellas, DESFASE | 7.429 | 844 | 6.585 |
| ⭐⭐ las que **caben** en el ancho de su calle | 2.626 | 1.907 | **719** |

> ### ⛔⛔ La previsión de «358 perdidas» era mía y estaba mal.
> El informe de la tanda 34 dijo *«conservando 2.982 de los 3.340 buenos»*. **Los
> 2.982 eran el TOTAL de sugerencias a ≤20 m, no las buenas**: las «ancho» eran
> **2.138**, una columna a la derecha en mi propia tabla. ⇒ se pierden **1.206
> ancho**, no 358. El encargo de hoy repite mi frase, así que la decisión se tomó
> sobre ese número.

⚠️ **Va destacado porque la costura decía que cambiaría la decisión.** Lo que no
cambia es el sentido: lo que queda es mucho más limpio.

> ### ⭐⭐ El apriete, que es la comprobación dura: **1.907 de 2.986 = 63,9 %** son
> de verdad cruzar esa calle. Ayer era el **24,4 %**.

```
   casos «ancho» con anchura de su vía medida         2.142
   ⭐ el cruce CABE en el ancho de su calle (≤×2)      1.907    89,0 %   (ayer 78,5 %)
   ⚠️ entre ×2 y ×3                                     123     5,7 %
   ⛔ más de ×3                                         112     5,2 %
   veces el ancho de su vía (med · p75 · p90)      1,0 · 1,3 · 2,2
```

### A4 · `Pablo Gargallo 16`, que era el caso de demostración

```
   ANTES   ⛔ ENFRENTE nº17  a 94 m   (79 m de calle · 52 m calle abajo)
           ⛔ ENFRENTE nº15  a 114 m  (103 m de calle · 47 m calle abajo)
           …en una calle de 37 m de ancho

   AHORA   ⭐ su acera nº36   —   y NADA de enfrente
```

**Las dos se caen por el tope** (52 y 47 m calle abajo, con el tope en 20). Era el
ejemplo de que la etiqueta «cruzando» tapaba otra cosa, y el tope lo cierra.

### `Avenida Cataluña 78` — sin cambios, y el 77 sigue fuera

```
   ⛔ NO SE TIENE — solo sugerencia
   «el 78 no existe · en su acera, la de los pares, los más cercanos
     son el 74 y el 84, y entre ellos hay 175 m»
   ⭐ su acera  nº74  175 m      ⭐ su acera  nº84  175 m
```

⛔⛔ **¿Entra el 77?** No: está a 258 m del 74. Con su `A.exige` puesto desde ayer.

### ⭐ Y el mecanismo, no la ley

El nº137 fue perder la marca `enfrente` **con la ley del nº134 ya escrita y
describiendo exactamente eso**. ⇒ ahora **toda** sugerencia nace en una sola
función, `sugerencia()`, que **deduce** la marca de la paridad pedida y la escribe
*después* del resto de campos: quien la llame no puede pisarla ni olvidarla. Las
de su propia acera también pasan por ahí, para que no haya puerta de atrás.

⛔ Y una sugerencia de enfrente **sin eje medible ya no se ofrece**: antes salía con
`clase: 'NO CONSTA'` — y un `NO CONSTA` que se ofrece es un sí disfrazado.

---

## ⛔ B · El centinela 99999, apagado

**117 portales** traían `sortNumber = 99999`. Su número crudo es `BL0`, `BL1`,
`A1`, `C3`, `LL`… — **bloques y letras, sin número de portal**.

### B1 · Qué se hace con esos 117

Pierden **el número con el que se les podía pedir, y nada más**:

- ✅ siguen en el grafo y en el enganche — `ctx.enganche.portales` no se toca;
- ✅ siguen en el índice del buscador: una consulta **sin número** los encuentra;
- ⛔ no compiten en ninguna búsqueda por número, no definen el rango de su vía y
  no cuentan como paridad.

⚠️ **Y esto no era opcional:** dos vías son **solo** portales así —
`URBANIZACIÓN ALAMEDA` (38 accesos) y `URBANIZACIÓN PARQUE ROMA` (43)—. Borrarlos
las habría sacado del buscador. Ahora contestan:

```
   Urbanización Parque Roma 5  →  via-sin-numeros   (portal E2)
   «esta vía no va por números de portal: sus accesos son bloques o letras
     (A1, A2, A3…) · te dejo en uno de ellos»
```

⭐ La definición vive en **un solo sitio** (`portales.js`: `CENTINELA`,
`numeroPedible`) y se aplica en **un solo sitio** (`direccion.construirIndice`).
Los medidores ya no tienen su propia copia: si la tuvieran, podrían limpiar cosas
distintas que el buscador.

### B2 · Los números republicados

| universo | pedibles | existen | huecos | cambian de acera |
|---|---:|---:|---:|---:|
| ⛔ el que publicaron las tandas 32 y 33 | 150.947 | 27.815 | 123.132 | 66.973 · 54,4 % |
| ⭐ **EL BUENO** | **51.065** | 27.881 | **23.184** | **16.981 · 73,2 %** |

**Sobraban 99.882 consultas: el 66,2 % de lo publicado.**

⚠️ **Y no son las 51.028 que la tanda 34 llamó «limpio»:** aquella excluía la vía
entera, y el Grupo Casamayor tiene **26 portales bien numerados** que ahora vuelven
a contar. *Apagar el centinela y quitar la vía no son lo mismo* — el bueno es
éste, el que ve el buscador.

⭐ **Congelados**, que para eso está el mecanismo. La tabla pasa de 21 a **26**:

| id | valor | qué sostiene |
|---|---:|---|
| `buscador.sinNumero` | **117** | ⭐⭐ el **positivo de control** del centinela: si el filtro dejara de filtrar sería 0 y los otros cuatro se inflarían |
| `buscador.pedibles` | 51.065 | el denominador de todo lo que se publica del buscador |
| `buscador.huecos` | 23.184 | los números que se pueden pedir y no existen |
| `buscador.cambianAcera` | 16.981 | el tamaño del fallo que encontró Antonio |
| `buscador.contestadas` | 6.421 | lo que contesta el listón de 100 m |

⛔ El congelador **no mide por su cuenta**: llama a `medir-paridad.barrer()`, la
misma función que imprime el informe. Dos caminos desde el mismo dato es la forma
de los fallos nº63, nº67 y nº107 — y esta tanda acaba de enseñar lo caro que sale
que dos medidas se den la razón.

### B3 · ⭐⭐⭐ ¿Hay más cuadres de acuerdo sobre lo mismo? **Sí. Había uno más, y era el que decidió.**

> **DOS MEDIDAS DE ACUERDO NO SON DOS MEDIDAS CORRECTAS.**

El primero ya se conocía: el barrido reproducía el universo de la tanda 32 con
<0,1 % de diferencia. **El segundo es peor**, porque es el que sostuvo una
decisión:

| listón | dial de la tanda 33 | limpio (hoy) | |
|---:|---:|---:|---|
| 50 m | 4.562 | **4.562** | ⭐ idénticos |
| 100 m | **31.411** | **6.421** | ⇒ ×4,9 |

La tanda 34 celebró que el dial predijera «31.411 clavadas». Era cierto —**porque
el dial también se midió sobre el universo inflado**.

> ### ⇒ ⚠️⚠️ El «acantilado ×7» entre 50 y 100 m que llevó a subir el listón **era el
> centinela.** Limpio, el salto es **×1,4**. Los 4.562 de 50 m son idénticos en los
> dos, porque toda la contaminación estaba en esa banda.

⛔ No se revierte nada: los 100 m son decisión de Antonio y se quedan —siguen
recuperando 1.859 consultas—. Lo que se hace es decir **sobre qué número se
decidieron**.

#### Los demás cuadres del repositorio, auditados

| cuadre | testigo | ¿podía estar de acuerdo sobre un artefacto? |
|---|---|---|
| universo de la tanda 32 | mismo código, re-ejecutado | ⛔ **SÍ, y lo estaba** |
| dial de la tanda 33 | mismo código, re-ejecutado | ⛔ **SÍ, y lo estaba** |
| `modelo-rutas.js` · metros y pasos | ejecuta `rutas-antonio.js` y compara | ⚠️ **sí en principio** — es el mismo cálculo. No se movió con este artefacto |
| `orden-numeros.js` · «23 imputables» | recalcula con la definición del propio fichero | ⚠️ **sí en principio** |
| `numeros-congelados.js` · las 26 filas | mismo código, por diseño | ⚠️ **sí, y va declarado en su cabecera**: es un freno de deriva, no una validación |
| `puertas-sin-calle.js` · 3.166 de la tanda 21 | **reconstruye** desacoplando tres tandas | ⭐ menos vulnerable — y ya declara que falla por 4 |
| `nombre-largo.js` · 5 casos de la tanda 17 | **lista observada por una persona**, comprobada por otra función | ⭐⭐ **el único independiente de verdad** |

> ⭐⭐ **La conclusión que se lleva la tanda:** casi todos los «cuadres contra lo
> publicado» de este repositorio son **frenos de deriva, no validaciones**.
> Comparan el código contra un número que produjo ese mismo código. Sirven para que
> nada se mueva en silencio —y para eso son buenos—, pero **no pueden descubrir un
> error que ya estaba el día que se congeló**. Congelar preserva los errores con la
> misma fidelidad que las verdades.

#### ⭐ Y el mecanismo contra la clase, no contra el caso

Apagar el 99999 arregla **este** centinela. El siguiente —un 9999, un 0, un 8888—
volvería a inflar el universo igual. ⇒ el informe imprime **siempre** las cinco
vías con más números pedibles por portal, y hay dos guardianes:

- **por valor:** ningún número del universo puede llegar al centinela declarado;
- **por forma:** ninguna vía puede pasar de **500** números por portal — con los
  dos anclajes escritos: el peor caso real de Zaragoza es `DISEMINADO PEÑAFLOR`
  con **63,8**, y el artefacto que hubo que cazar daba **≈2.128**.

⚠️ Y lo que sí hay y es real, con su peso dicho: **1 vía de numeración dispersa**
(diseminado rural), que aporta 702 pedibles — el **1,4 %**. No se quita: existe.

---

## C · Qué cambia

### C2 · ⭐⭐⭐ Las siete rutas — **ninguna se mueve**

| ruta | | tanda 16 | ahora |
|---:|---|---:|---:|
| 1 | ⛔ sigue en sugerencia por los dos extremos | 3.086,9 | — |
| 2 | ✅ exactos | 598,1 | 598,1 |
| 3 | ✅ vía de un solo lado | 3.704,9 | 3.704,9 |
| 4 | ✅ dos edificios | 505,9 | 505,9 |
| 5 | ✅ exacto | 477,4 | 477,4 |
| 6 | `Matadero 1` → nº3 | 523,4 | 520,2 |
| **7** | ⭐⭐ **exactos los dos — INTACTA** | 2.528,9 | **2.528,9** |

⭐ **Era lo previsto y se comprueba, no se anuncia:** esta tanda solo **quita**
sugerencias de enfrente —que nunca fueron respuestas— y apaga un centinela que
vivía en un `GRUPO` por el que no pasa ninguna ruta. `modelo-rutas.js`: **6 rutas
clavadas · 56/56 pasos · la nº1 sigue en sugerencia.**

### C3 · Los números congelados

Los **21 de antes, intactos**; y **5 nuevos** (§B2). `numeros-congelados.js` sale
en código 0 sin mutar y las dos roturas de la tanda 30 se siguen cazando **2 de 2**.

⚠️ Un número congelado **sí se ha movido a propósito**, y no está en la tabla: el
`A.exige` de `medir-paridad.js` que exigía reproducir los **126 m** de la tanda 32
se puso rojo al apagar el centinela. Era uno de los dos cuadres de §B3. Se
republica en **75 m** (todas) y **54 m** (urbanas) como **freno de deriva**, dicho
con esas palabras: no valida el número, solo impide que se mueva sin que nadie se
entere.

⭐ **La fila urbana no se movió** (54 frente a 51): el centinela vivía en un
`GRUPO`, no en una vía urbana. ⇒ **los números urbanos de las tandas 32 a 34 nunca
estuvieron contaminados**, y eso también hay que decirlo.

---

## D · Qué busqué y no encontré · qué NO he comprobado

**Busqué y no encontré:**

- **Otro centinela.** El máximo número de portal del universo es **1.801**
  (Diseminado Peñaflor), y ninguna vía pasa de 500 números por portal.
- **Una ruta movida.** Ninguna de las siete, y la 7 con su guardián en verde.
- **Un cuadre independiente más.** De los siete auditados, **uno solo**
  (`nombre-largo.js`) tiene por testigo una observación humana y no el propio
  código. Buscarlo era la pregunta de B3 y la respuesta es incómoda.

**NO he comprobado:**

- **Si cruzar esos 17 m es realmente poco camino.** Sigue midiéndose la línea
  recta entre portales, no el recorrido hasta el paso de peatones y vuelta. El
  motor sabría calcularlo y **no se ha hecho**. **NO CONSTA.**
- **Si el portal está físicamente en la acera que dice el callejero.** Igual que
  en las tandas 32-34. **NO CONSTA.**
- **Qué direcciones pide la gente.** El universo ya es el bueno, pero sigue siendo
  «lo pedible», no «lo pedido». **NO CONSTA.**
- **Si los otros cuadres del repositorio esconden su propio artefacto.** Se ha
  auditado su FORMA (¿el testigo es el mismo código?), no se ha ido a buscar el
  artefacto de cada uno. Eso es otra tanda, y §B3 dice por dónde empezar.

---

## E · Verificación

```
node src/probar-paradas.js --todo
   P4 · 57 scripts · invariante cumplido en los 57 · código 0
   ninguno se estrella · rojos DECLARADOS: los mismos cinco de antes
```

| | |
|---|---|
| los 26 congelados | ✅ código 0 sin mutar · 2 de 2 roturas cazadas |
| el banco de las siete | 6 de 7 · único rojo el de la nº4, **idéntico** |
| `modelo-rutas.js` | 6 rutas clavadas · 56/56 pasos · nº1 en sugerencia |
| el eje (§B0 de ayer) | mediana 1° frente a los 45° del azar |
| el 77 de Cataluña | ✅ fuera |
| el recálculo del dial | ✅ 2.986 = 2.986 contra el buscador |

---

## F · Mis fallos de esta tanda

| nº | qué |
|---:|---|
| **140** | El detector de centinelas **barría una población distinta de la que vigila** y señaló dos carreteras que no entran en el universo. El rojo era cierto y no significaba nada. |
| **141** | El dial **filtraba la salida** de una regla que ya trae el tope puesto ⇒ «≤40 m» y «sin tope» salían idénticas a «≤20 m». Un dial que solo mira hacia dentro. Lo cazó ver tres filas iguales. |
| **142** | ⭐ **«2.982 de los 3.340 buenos» lo escribí yo y era la columna equivocada.** Se pierden 1.206, no 358 — y el encargo de hoy me lo devolvió convertido en la base de la decisión. |
| **143** | Un refactor por script **se comió una sección entera** de `medir-paridad.js`. Solo lo cazó una llave descuadrada; si el corte hubiera caído en frontera de bloque, habría desaparecido en silencio. |

⭐ **La ley que se lleva la tanda:** *la cifra que entra en una decisión es la del
texto, no la de la tabla.* Una tabla correcta con un resumen mal leído decide igual
de mal que un cálculo roto — y no hay guardián que lo cace: lo único que lo evita
es que el informe **imprima la resta hecha**.
