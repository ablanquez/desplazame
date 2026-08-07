# AUDITORÍA DE CIERRE DE H1 · BLOQUE C — LAS DECISIONES Y LOS EJES

**Fecha de ejecución:** 2026-08-07
**Alcance:** los cuatro documentos de diseño (**1.853 líneas**), las decisiones `D0`-`D5` y
`G1`-`G3`, §5 y §6 de `DESPLAZAME-ESTADO.md`, y los cinco ejes de verificación.
**Registro fechado. ⛔ No se reescribe.**

⛔⛔ **No se ha arreglado nada.** Las siete rutas, idénticas: `598,1 · 3.704,9 · 505,9 · 477,4 ·
520,2 · 2.528,9`, la nº1 en sugerencia.

⚠️ **Y lo primero es que este bloque tumba un hallazgo que yo mismo publiqué hace dos días.**

---

## 0 · ⛔⛔⛔ `B·V1` ESTABA MAL, Y ERA MÍO — la ley 91, cumplida contra mí

> **Ley 91** *(escrita ayer)*: *un verde falso lo caza el siguiente que mire; **un rojo falso
> publicado no lo caza nadie**, porque a un hallazgo nadie lo audita.*
> ⇒ **Este bloque es «el siguiente que mira», y lo primero que ha cazado es un rojo mío.**

**Qué publiqué** en `B-DOCUMENTACION-2026-08-07.md` como hallazgo **VIVO**:

> *«`DISEÑO-H1-GRAFO.md:545` §P4.1 dice **manda el código, SIEMPRE** y el motor engancha por
> distancia pura ⇒ el documento de diseño no describe lo que hace el motor.»*

**Qué es en realidad, con cinco pruebas independientes:**

| # | evidencia | dónde |
|---|---|---|
| 1 | *«**Estado:** propuesta para aprobar. **Nada de esto está construido.**»* | `DISEÑO-H1-GRAFO.md:3` — **su propia cabecera** |
| 2 | *«`DISEÑO-H1-GRAFO.md` (tanda 2) y sus dos anexos son **registro histórico**»* | `DISEÑO-H1-ADENDA.md:7` — **otro de los cuatro lo dice** |
| 3 | El documento es del **2/08**; el primer fichero de `src/` es del **3/08** | `git log --diff-filter=A` |
| 4 | La decisión que el código cita, `D0`, dice *«El enganche del portal: **por proximidad sobre la geometría OSM**»* | `DESPLAZAME-ESTADO.md` §5 |
| 5 | `src/` cita `D0`-`D5` y `G1`-`G3` **más de 90 veces** y **`§P4.x` CERO veces** | barrido sobre `src/*.js` |

⇒ ⭐⭐⭐ **§P4.1 no es una descripción falsa: es una propuesta de tanda 2 que no se adoptó, en un
documento que declara en su tercera línea que nada de él está construido.** El motor hace
exactamente lo que dice la decisión que cita. **`B·V1` baja de VIVO a NOTA.**

**Y por qué me equivoqué, que es lo que hay que aprender:** en el bloque B clasifiqué los cuatro
documentos de diseño como **VIVOS**, con argumento, y Antonio lo aprobó. **La clasificación era
mía y era falsa** — y para verlo bastaba leer el párrafo de apertura de uno de los cuatro. ⛔ **No
fui al documento a preguntarle qué era: fui a buscar en él lo que el encargo señalaba.**

> ⭐⭐ **Ley que sale de aquí: antes de auditar un documento hay que preguntarle QUÉ ES, y el
> documento suele decirlo en la primera página.** Clasificar por el contenido, teniendo la
> declaración de estado delante sin leerla, es exactamente el fallo que el bloque B denunció en
> otros.

⚠️ **Lo que queda provisional:** si Antonio mantiene la clasificación VIVO para los cuatro —hay un
argumento: el README los enlaza como «el diseño»— entonces `B·V1` vuelve a ser un VIVO y lo que
falta es la marca de estado en el README, no en el documento.

---

## 1 · ⭐⭐ C1 · EL DISEÑO CONTRA EL CÓDIGO

### 1.1 · La ley 35, respondida por escrito ANTES de mirar

Está fechada en la cabecera de `c1-diseno.js`, antes de la primera ejecución:

> *«**DESCRIBE — SÍ PUEDE [falsearse], Y MÁS.** En castellano una regla PROPUESTA se escribe en
> presente de indicativo —«se parte en toda intersección», «manda el código», «el enganche es por
> proximidad»— exactamente igual que una regla IMPLEMENTADA. ⇒ **predigo que DESCRIBE se va a
> llenar de propuestas y que el modo verbal NO separa las dos cosas.** Si la muestra lo confirma,
> el resultado de C1 no es el reparto: es que **el reparto no se puede hacer línea a línea.**»*

**La predicción se cumplió entera.** Va abajo.

### 1.2 · El reparto

```
   líneas de los cuatro documentos                1.853
   ⇒ líneas con una afirmación de comportamiento    573

   DESCRIBE      32    5,6 %      ⛔ y 0 tras leerlas — ver 1.3
   PROPONE       84   14,7 %
   ?            457   79,8 %
```

| documento | n | DESCRIBE | PROPONE | `?` |
|---|---:|---:|---:|---:|
| `DISEÑO-H1-GRAFO.md` | 315 | 25 | 59 | 231 |
| `DISEÑO-H1-ADENDA.md` | 53 | 2 | 4 | 47 |
| `DISEÑO-H1-ANEXO-NIVELES.md` | 102 | 3 | 8 | 91 |
| `DISEÑO-H1-ANEXO-NIVELES-2.md` | 103 | 2 | 13 | 88 |

⭐ **Control de semilla:** §P4.1 sale **DESCRIBE** ✅ y §P6.2 sale **`?`** ✅ — las dos vistas.
⚠️ **Y la v1 del instrumento no veía §P6.2**, porque exigía verbo conjugado y esa línea dice
*«Fichero versionado en el repositorio —`data/excepciones-grafo.json`—, **leído por el proceso en
cada regeneración**»*: **un sintagma nominal.** ⇒ **un diseño enuncia sus reglas sin conjugar
nada**, y eso ya es un dato del bloque.

### 1.3 · ⛔⛔ DESCRIBE se declara fallida: 32 según el criterio, **0** tras leer la muestra

Leídas 15 de las 32, una a una:

| línea | qué es de verdad |
|---|---|
| `GRAFO:7` | el **índice** del propio documento |
| `GRAFO:219` *«Intersección que ya cae sobre un extremo: no se parte, se funde»* | ⛔ **regla PROPUESTA en presente de indicativo** |
| `GRAFO:546` *«no se cambia de calle: se marca»* | ⛔ **regla PROPUESTA en presente de indicativo** |
| `GRAFO:225 · 288 · 353 · 519 · 581 · 843 · 847`, `ADENDA:48` | **mediciones del dato del 2 de agosto** |
| `GRAFO:697` | un **control de un plan de pruebas** ⇒ PROPONE |

**Ninguna de las 15 describe el sistema construido.** Y el reparto lo confirma:
**20 de las 32 «DESCRIBE» son mediciones** (`medido`, `NO MEDIDO`, `contados`).

### 1.4 · ⭐⭐⭐ Y el tercer testigo, independiente de los otros dos

```
   ficheros de src/ citados en los CUATRO documentos de diseño     0
   funciones o constantes del código citadas                       0
   ⭐ control positivo · docs/H1-CIERRE.md cita src/               8 veces
```

⇒ **Ninguna línea de los cuatro documentos PUEDE describir el código: no lo mencionan nunca.**

**Tres testigos independientes dicen lo mismo** (ley 60): la cabecera de los documentos, la fecha
del git, y la ausencia total de referencias al código.

> ⭐⭐⭐ **EL RESULTADO DE C1 NO ES EL REPARTO. Es que el reparto no se puede hacer línea a línea, y
> no hace falta hacerlo:** los cuatro documentos de diseño son **PROPUESTA y MEDICIÓN**, en la
> proporción que sea, y **DESCRIPCIÓN cero por construcción.** Contrastar sus ~1.700 líneas contra
> el código —lo que este bloque venía a hacer— **es contrastar un plan contra su resultado, no una
> documentación contra su implementación.** Son dos preguntas distintas y la segunda no aplica.

⚠️ **Lo que sí queda pendiente y es la pregunta buena:** de las **84 PROPONE**, ¿cuántas se
hicieron, cuántas siguen pendientes y cuántas se abandonaron? **No lo he mirado** — son 84 y no
caben. Ver §5.

### 1.5 · ✅ Las decisiones que el código SÍ cita — comprobadas una a una

⚠️ **Y aquí el resultado sale limpio, así que primero la sospecha:** son seis comprobaciones sobre
seis constantes, hechas por lectura del código. **No he ejecutado nada que las ponga a prueba**, y
un `grep` que encuentra una constante no dice que la constante se use en la rama que importa.
**Léase como «existe y dice lo que debe», no como «rige».**

| decisión | qué manda | en el código | ✅ |
|---|---|---|---|
| **D0** | enganche del portal **por proximidad** | `portales.js:181` · `if (!mejor \|\| s.d < mejor.d)` | ✅ |
| **D1** | regla de nivel v3, precedencia del **nodo compartido** | `planarizar.js:191` y `:322` | ✅ |
| **D2** | el contador `unido-por-defecto` | `g.contadores.unidoPorDefecto`, exportado y publicado | ✅ |
| **D3** | discordancia **se marca y se cuenta, no se corrige** | `cerrar-punto-ciego.js:9` y `entradas.js:45` lo declaran y no corrigen | ✅ |
| **D4** | precisión como **campo por tramo** | `modelo.js` · `e.precision`, y `precision()` en `planarizar.js` | ✅ |
| **D5** | tolerancia **2,0 m**, techo **5 m** | `planarizar.js:25-26` · `TOLERANCIA_PUNTA = 2.0` · `TECHO_PUNTA = 5.0` | ✅ |

⇒ **Las seis decisiones que el código cita como su autoridad están implementadas y con el valor
que dice el estado.** Es el resultado más tranquilizador de los cuatro bloques, y por eso va con
la advertencia de arriba.

---

## 2 · ⚠️ HALLAZGOS

### `C·N1` · ⚠️ DEUDA · `D1`-`D4` significan **dos cosas** en este repositorio

**Dónde:** `bici-inventario.js:819` (*«D1 · las etiquetas secundarias»*), `acera-equivocada.js:559`
(*«D2 · ¿cuántos metros cambiaría?»*), `calle-pegada.js:579` (*«D3 · EL SESGO, DECLARADO»*),
`bici-inventario.js:858` (*«D4 · EL CASO INVERSO»*) — **etiquetas de sección del informe de cada
script**. Y `planarizar.js`, `verificar.js`, `ciudad.js`, `geo.js`, `forma.js` usan `D1`-`D5` como
**las decisiones de diseño**.

**Qué se apoya en ello:** nada se rompe. Pero **un `grep D2` devuelve las dos cosas mezcladas**, y
`D0`-`D5` son la autoridad que el código invoca. Me pasó a mí en esta misma tanda.

⛔ **Propuesta (sin aplicar):** que las secciones de informe usen otra letra. ⚠️ Toca 4 ficheros y
mueve cadenas que la batería compara — **es más caro de lo que parece.**

### `C·N2` · ⚠️ DEUDA · `orden-numeros.js` — el cuarto testigo **descartado**, y la batería lo ejecuta

**Dónde:** `src/orden-numeros.js`. **No lo requiere nadie**; solo lo cita `DESPLAZAME-ESTADO.md`.
**No está en la lista `MODULOS` de `probar-paradas.js:122`** ⇒ **la batería lo ejecuta como
script.**

Lleva **6 `A.exige`** dentro, y **dos congelan cifras del experimento descartado**:

```
   :498  «los imputables salen X y no 23: la definición ha divergido de la tanda 14»
   :622  «los de la firma salen X y no 198»
```

**Qué se apoya en ello:** ⚠️ **si esos números se mueven, la batería del proyecto se pone roja por
una idea que Antonio descartó**, y alguien tendrá que entender por qué.

⭐ **He rozado la costura** *(«un guardián vigilando una regla que ya no rige → PARA Y AVISA»)*
**y juzgo que no aplica, y lo declaro:** estos guardianes **no imponen la regla descartada al
motor** — el motor no llama a este fichero. Vigilan que **la medición que descartó la idea** siga
dando lo mismo, que es coherente con la cultura del repositorio (*«las mediciones no se borran»*).
⛔ **Lo que queda provisional si Antonio lo lee de otra manera:** si esto se considera un guardián
de una regla muerta, la propuesta es meterlo en `MODULOS` — **no borrarlo.**

### `C·N3` · NOTA · El resto de las decisiones deshechas **no ha dejado código vivo**

Barrido sobre las 26 filas de §6 del estado. Lo que quedaba, y está bien:

| decisión deshecha | qué queda | veredicto |
|---|---|---|
| *«`estadoEstacion` es el campo bueno de BiZi»* | dos comentarios en `bici-inventario.js` **citando la ley que salió de ahí** | ✅ correcto |
| *«no unir por defecto ante un cruce dudoso»* | **nada** | ✅ |
| *«la jerarquía sirve de señal de nivel»* | `planarizar.js:11` · *«La jerarquía NO vota»* | ✅ declarado |
| *«son 2.006 portales sin testigo»* | `cerrar-punto-ciego.js:381` lo imprime **como «la tanda 12 los estimó»** | ✅ correcto |
| *«las bandas de las siete rutas sirven»* | `RUTAS-CONOCIDAS.md` **v2**, recalculadas, con `⚠️ derivadas` escrito | ✅ |

⚠️ **Sale demasiado limpio y lo digo:** he buscado por el nombre de cada creencia deshecha, no por
la forma que tendría su implementación. **Una constante superviviente con otro nombre no la
encontraría este método.** El bloque A censó el código muerto y concluyó que *«ninguno está MUERTO
en el sentido de bórralo»*; me apoyo en eso y no lo he rehecho.

---

## 3 · ⭐⭐⭐ C3 · LOS EJES — de qué se fía este proyecto

| eje | a · ¿rojo visto? | b · qué testigo | c · cuánto cuelga |
|---|---|---|---|
| **las 7 rutas** | ✅ **sí, y real**: tanda 33, la nº6 se movió `523,4 → 520,2` y la nº1 pasó a sugerencia. Se explicó y se publicó | ⚠️ **el mismo motor reejecutado** (dos veces, con modelo y sin él) · **salvo la nº7** | ⭐⭐ **la costura de parada de las tandas 16 a 36**. 6 documentos publican *«idénticas al milímetro»* |
| **los 26 congelados** | ✅ **sí, dos veces**: `--contraprueba` caza 2 de 2 roturas, y hubo un rojo de verdad (`4.562 → 6.421 → 4.562`) | ⛔ **el mismo código reejecutado.** Es un **freno de deriva** | ⭐⭐ el reparto del mapa, el verde, los pasos, las puertas y el universo del buscador. **Y B2 midió que solo cubren 13 de las 26 afirmaciones destacadas** |
| **la batería de 57** | ⭐⭐⭐ **sí, y primero fue un VERDE FALSO**: recorrió los 56 scripts **con uno estrellado dentro y salió en ✅ código 0** (nº136). El invariante era de una sola dirección | el propio repositorio · ejecución | **todo.** Es la puerta. ⚠️ **Y el bloque A midió que 37 scripts no se pueden leer por su código de salida** |
| **los dos testigos del nombrado** | ✅ **sí**: `calle-pegada.js:768` — *«la paralela repite el error de portales que sabemos mal enganchados: los dos testigos no son independientes»* | ⭐ **dos caminos distintos** sobre el mismo dato (código municipal · nube/paralelas) | el nombrado de aceras, y el 89,5 % que abrió el nivel 2 |
| **los controles ±** | ⚠️ **parcial**: el bloque A encontró que **7 de 210 comprobaciones pasaban por construcción** (nº63) | variable | transversal |

### 3.1 · ⚠️⚠️ LA RUTA Nº7 — apartado propio

**Lo que hay, textual** (`data/pruebas/RUTAS-CONOCIDAS.md:55-70`):

```
   Trayecto     nº7 · El Coloso 2 → Valle de Zuriza 48
   Distancia    2,6 km · medidos con GPS de pulsera
   Tiempo       ~25 min, de repetición
   Velocidad    ~6 km/h
   ⚠️ Toda la calibración cuelga de UN trayecto. Si esos 25 minutos fueran 22, todo se mueve.
```

**Y en el código:** `relato.js:55` · `const VELOCIDAD_KMH = 6;` — con el aviso escrito al lado
(`relato.js:46`: *«Si esos 25 minutos fueran 22, todos los tiempos se mueven un 14 %»*).

**⭐⭐ QUÉ SE CAERÍA si ese 2,7 % no fuera lo que creemos — medido, no razonado:**

| qué | ¿se cae? |
|---|---|
| **Los 19 tiempos `~N min` publicados en 8 documentos** | ⛔ **SÍ, todos**, y proporcionalmente. Salen de `Rel.minutos()` = `metros / (6 · 1000/60)` |
| **Los minutos del visor** | ⛔ **SÍ** — `exportar-rutas.js:96` los escribe con la misma función |
| **Las bandas de distancia de `RUTAS-CONOCIDAS.md`** *(450–550 m, 3,8–4,2 km)* | ⛔ **SÍ**, y de la peor manera: **se derivaron DE los 6 km/h**. ⇒ ⭐⭐ **una ruta comparada con su banda NO PUEDE fallar por una calibración mala: banda y ruta se mueven juntas.** El documento marca las bandas como *«derivadas, salvo la del nº7»*; **lo que no está escrito en ninguna parte es esta consecuencia.** |
| ⭐ **La columna RODEO** *(«la columna que manda es el RODEO»)* | ✅ **NO.** Es `ruta / recta`: **adimensional**. Una velocidad mala no la mueve |
| **Los metros de las siete rutas** | ✅ **NO.** El motor mide en metros; la velocidad solo los convierte a minutos |
| **El grafo, el mapa, el nombrado, el buscador** | ✅ **NO.** Nada de eso pasa por `relato.minutos()` |

⇒ ⭐ **La exposición real es más pequeña de lo que parecía, y el proyecto se protegió sin decirlo:
la columna que decide es adimensional.** Lo que cuelga del GPS de Antonio son **19 tiempos
publicados y 3 bandas**, no la verificación del motor.

⚠️ **Pero hay un agujero, y es el que importa: NO HAY NI UN GUARDIÁN SOBRE EL TIEMPO.**
`grep exige` sobre `tabla-rutas.js` y `modelo-rutas.js` da **cero**. Los metros están congelados
siete veces; **los minutos, ninguna.**

**⛔ Qué haría falta para un segundo testigo — propuesta, sin hacer:**
1. **Un segundo trayecto medido por Antonio** con la misma pulsera, preferiblemente **en
   cuadrícula** (el nº7 va en diagonal, y el propio documento dice que un rodeo de 1,09 solo es
   plausible en diagonal). Basta uno.
2. ⭐ **Y uno que sale gratis y no exige andar:** los **~25 min son «de repetición»** — si hay más
   de una repetición apuntada, la **dispersión entre ellas** ya es un segundo dato sobre el mismo
   trayecto. ⛔ No sé si existe: **`NO CONSTA`.**
3. ⛔ **Lo que NO vale:** cualquier velocidad de tabla o de literatura. Sería sustituir un testigo
   humano flojo por ninguno, y el proyecto entero está construido contra eso.

### 3.2 · ⭐ La pregunta de cierre, contestada

> **¿Cuál es el eje del que más cuelga y menos se ha verificado?**

⛔ **No es la ruta nº7.** Cuelga poco —19 tiempos y 3 bandas— y **está declarada**: el documento
avisa, el código avisa en el comentario de al lado, y la columna que decide es inmune. **Un eje que
grita lo que le pasa no es el peligroso.**

⭐⭐⭐ **Es LA BATERÍA DE 57 SCRIPTS.**

- **Cuelga todo de ella.** Es la única puerta por la que pasa cada tanda antes de commitear.
- **Su único rojo documentado fue un VERDE FALSO** (nº136): recorrió 56 scripts con uno estrellado
  dentro y terminó en código 0. Se arregló, y ese arreglo **no ha vuelto a ponerse a prueba**.
- **El bloque A midió que 37 de sus scripts no se pueden leer por su código de salida**, porque
  imprimen `⛔` y terminan en 0 o al revés. ⇒ **la batería vigila 57 scripts de los que solo puede
  interpretar 20 con seguridad.**
- Y su testigo es **el propio repositorio ejecutándose**: ninguna observación externa.

⇒ **Máxima carga, testigo más débil, y su único fallo conocido fue no ver nada.**

---

## 4 · ⭐⭐ C4 · LA COBERTURA DE LA AUDITORÍA ENTERA — qué queda sin mirar en H1

⛔ **Sin arreglarlo y sin minimizarlo.** Reunido de los cuatro registros.

| qué | clase | de qué bloque |
|---|---|---|
| **2.024 de las 2.062 afirmaciones marcadas** | *no lo he mirado* | B · B2 |
| **1.508 sin clasificar (`?`)** de esas 2.062 | *no lo he sabido* | B2 |
| **17.844 cifras no marcadas** | `NO CONSTA` estructural · **cerrado por Antonio** | B |
| **Las 84 PROPONE del diseño: ¿hechas, pendientes o abandonadas?** | *no lo he mirado* | **C** |
| **Las 457 `?` del diseño** | *no lo he sabido* | **C** |
| **297 líneas `⛔` impresas: cuáles son un fallo vivo** | *no lo he mirado* | A |
| **328 de las 330 cifras de comentario** | `NO CONSTA` estructural | A |
| **Si las duplicaciones que hoy coinciden coincidieron siempre** | `NO CONSTA` | A |
| **`BITACORA.md` — 7.252 líneas, 151 entradas** | *no lo he mirado* | B |
| **Los `RECONOCIMIENTO-*` contra sus fuentes** | ⛔ **exige RED — parado** | B · B2 · C |
| **Cuándo empezó a mentir cada SUPERADO** | `CAUSA NO CONFIRMADA` | B |
| **Las 39 afirmaciones que sostiene `acera-equivocada.js`** | **MEDIDO CON INSTRUMENTO TOCADO** | B2 |
| **Las constantes de las 19 librerías sin salida** (`RAZONABLE_M`, `MIN_TRIOS`…) | *no lo he mirado* — el mapa no las ve | B2 |
| ⛔⛔ **Si el motor calcula la ruta CORRECTA** | **ningún bloque lo audita** | A, y sigue abierto |

### 4.1 · ⭐⭐⭐ Lo que hay que decir el día que se cierre H1

**La auditoría ha mirado si el código está sano (A), si lo escrito coincide con el dato (B, B2) y
si las decisiones se cumplen (C). Ninguno de los cuatro bloques ha comprobado que la ruta que
sale sea la ruta correcta.**

Eso lo sostienen **las siete rutas de Antonio** y `RUTAS-CONOCIDAS.md`, y §3 acaba de medir de qué
se fían: **del mismo motor reejecutado**, salvo **una** observación humana. **Es el hueco más
grande de H1 y no lo abre esta auditoría: lo hereda.**

---

## 5 · ⚠️ LO QUE NO SE HA PODIDO AUDITAR EN ESTE BLOQUE

| qué | por qué |
|---|---|
| **Las 84 PROPONE** — cuáles se hicieron | **no lo he mirado.** Son 84 y cada una exige ir al código. Es la pregunta buena de C1 y no cabe |
| **Las 457 `?` del diseño** | **no lo he sabido clasificar.** Y §1.3 explica por qué el criterio no puede existir línea a línea |
| **Si las seis decisiones `D0`-`D5` RIGEN, no solo existen** | **parcial.** Las he leído en el código, no las he puesto a prueba rompiéndolas. Un `grep` que encuentra `TOLERANCIA_PUNTA = 2.0` no dice que esa rama se ejecute |
| **`G1`/`G2`/`G3`** | **no los he contrastado** contra su definición: no he encontrado dónde se definen canónicamente. `NO CONSTA` |
| **Si queda código de una decisión deshecha con OTRO nombre** | **no lo he mirado.** Busqué por el nombre de cada creencia — ver el aviso de `C·N3` |
| **Si el `~25 min` del nº7 tiene más de una repetición apuntada** | `NO CONSTA`: no está en `RUTAS-CONOCIDAS.md` y no hay más fuente en disco |
| **Los `RECONOCIMIENTO-*`** | ⛔ **exige RED. Parado, como en B y B2** |

---

## 6 · ⭐ PARA LA CONVERSACIÓN DE ESTRATEGIA — `DESPLAZAME-ESTADO.md`

⛔ **No se ha tocado.** Escritor único. **Nada nuevo que reportar como falso.**

⚠️ Lo único, y es una consecuencia de §0: **§6 «Decisiones que se DESHICIERON» y §5 «Decisiones
tomadas» son hoy la fuente canónica de `D0`-`D5`** —el código las cita a ellas, no al diseño—.
**Ese papel no está declarado en ninguna parte**, y los cuatro documentos de diseño siguen
enlazados como si lo fueran. ⛔ Decide Antonio.

---

## 7 · ⚠️ MI CRITERIO — el orden de los arreglos, con todo delante

**Hallazgos vivos acumulados:** `A·V1`-`A·V4` + `A·D5` ascendido · `B·V2` · `B·V3` · `B2·V1`-`B2·V3`.
⛔ **`B·V1` sale de la lista** por §0.

### 7.1 · El orden que yo seguiría, y por qué

| # | qué | por qué ahí |
|---|---|---|
| **1** | **`A·V1` · `acera-equivocada.js` mide sobre el universo inflado** | ⭐⭐ **Es el que estorba a todos los demás.** Sostiene 39 afirmaciones que B2 tuvo que dejar sin medir. Mientras no se arregle, cualquier recuento que lo toque nace marcado |
| **2** | **`A·D5`→VIVO · el clon no puede ejecutar nada** (49 de 70) | Es lo único que un extraño encuentra en diez minutos, y esto es un portafolio. **No estorba a nadie**: se puede hacer en paralelo |
| **3** | **`B2·V2` · el «400× el azar» de `sin-vigilancia.js`** | Tres caracteres. Se hace mientras se piensa el resto |
| **4** | **`B·V2` · la atribución del README** (3.644 a la capa que tiene 3.453) | Misma familia que el 2 y **hay que tocarlo a la vez**: son las dos cosas que lee quien no es Antonio |
| **5** | ⭐⭐ **El puntero hacia delante** — los 23 superados de B y B2 | ⛔ **El mecanismo, no los 23 casos.** Arreglarlos a mano garantiza que el 24 vuelva a pasar |
| **6** | **`B2·V1` · declarar qué mide el censo v2** | Depende del 5: si hay mecanismo de puntero, esto es una línea |
| **7** | **`B2·V3` · el 182 → 232** | ⭐ **Se arregla solo si el 6 se hace bien**: que el número lo interpole el instrumento |
| **8** | **`C·N1` · las dos `D2`** y **`C·N2` · `orden-numeros.js` en la batería** | Los más baratos y los que menos duelen si se quedan |

### 7.2 · ⭐⭐ Cuáles se estorban entre sí

- **1 bloquea a todo lo que sea recontar.** Si se arregla `acera-equivocada.js` **después** de
  republicar números, hay que republicarlos otra vez. **Va primero o se paga dos veces.**
- **5, 6 y 7 son el mismo arreglo** visto desde tres sitios: *un número publicado tiene que saber
  quién lo produce y quién lo sustituyó*. Hacerlos por separado son tres parches; juntos son un
  mecanismo. ⚠️ **Es el más caro y el que más se va a querer trocear.**
- **2 y 4 se estorban si se hacen en orden distinto**: arreglar el README sin arreglar el clon deja
  una portada que promete comandos que siguen sin correr.
- ⛔ **Y uno que NO se estorba con nada y por eso se olvidará: el segundo testigo del nº7.** No es
  código, es una caminata. **Se puede pedir hoy y tenerlo antes que cualquiera de los ocho.**

### 7.3 · Lo que yo NO arreglaría

**Los 23 superados uno a uno** (eran verdad), **`H1-PARIDAD.md:132`** (fue verdad, falso y verdad
otra vez sin que nadie lo tocara: es la mejor prueba del proyecto de que la verdad de un documento
es una foto), y **los cuatro documentos de diseño**. ⭐ **Lo que sí haría con éstos, y es una
línea:** que el README diga que son **el diseño en papel del 2 de agosto**, no *el diseño*. §0 ha
demostrado que sin esa línea **un auditor con el encargo delante los lee como vigentes** — porque
lo hice yo.

---

## Z · LOS INSTRUMENTOS DE ESTA TANDA

⭐ Desechables, fuera de `src/`, ⛔ **no entran en la batería.**

| instrumento | qué hace | ¿mintió? |
|---|---|---|
| `c1-diseno.js` | el reparto DESCRIBE / PROPONE / `?` | ⚠️ **v1 sí** — no veía §P6.2 por exigir verbo conjugado (§1.2). Corregido y declarado |
| barridos con `grep` y `git log` | fechas, citas de `D0`-`D5`, restos de decisiones deshechas | no · con control positivo donde tocaba |

⛔ **Cero descargas.** Nada exigió red salvo los `RECONOCIMIENTO-*`, y ahí se paró.
⛔ **No se ha ejecutado `acera-equivocada.js`** (`A·V1`) ni ningún `exportar-*.js`.
✅ Único script de producción ejecutado: `modelo-rutas.js`, para la costura de las siete rutas.
