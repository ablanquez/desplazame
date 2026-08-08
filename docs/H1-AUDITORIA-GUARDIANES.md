# H1 · ¿QUÉ COMPROBACIÓN HA VISTO SU ROJO?

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 4 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `51.556` | **51.493** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `32.258` | **32.310** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `3.792` | **3.803** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `182` | **232** | `docs/auditoriafinal/B2-CONTRASTE-2026-08-07.md §B2·V3` · 2026-08-07 |
>
> <sub>las líneas CON nombre del mapa · las líneas rojas del mapa · las rojas explicadas por zona verde · las líneas decorativas — un ⛔ impreso que no para nada</sub>
<!-- SUPERADOS:FIN -->

*Tanda 29 · 2026-08-05 · auditoría de los instrumentos. ⛔ No arregla nada.*

> **Este documento se AÑADE, no reescribe nada.** ⛔ Y esta tanda **no toca ni un fichero de
> producción**: solo añade `src/auditoria-guardianes.js` y tres entradas de bitácora.

```
node src/auditoria-guardianes.js            # el censo (0,1 s)
node src/auditoria-guardianes.js --mutar    # + los rojos provocados (~9 min)
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **el censo** | **198 comprobaciones** en 28 ficheros, sobre 49 scripts ejecutables. Extractor con contador independiente ✅ |
| **⚠️⚠️ las decorativas** | **182 líneas imprimen un veredicto ✅/⛔ sin poder poner el proceso en rojo.** Es un techo, no un recuento de fallos — pero cada una es, objetivamente, un `⛔` que no para nada. |
| **⭐⭐ los rojos provocados** | **6 de 10 mutaciones provocaron su rojo. 4 no hicieron saltar NADA.** |
| **⚠️⚠️⚠️ la costura disparada** | **Una comprobación que sostiene un número PUBLICADO no se pone roja:** el reparto **51.556/32.258/3.792/11.168** sobrevive intacto a que se rompa la regla que lo produce. |
| **⭐⭐⭐ lo peor** | **El guardián del nº105 nunca pudo distinguir lo que dice distinguir.** Se vacía el modelo, la ruta se degrada de 1 paso a 7 — visible a ojo — y **pasa en verde**. |
| **⭐⭐ la séptima forma de mentir** | **La comprobación distingue los extremos y no el medio.** Vigila «está / no está» y se queda ciega ante «está pero vacío», que es el estado en el que el sistema **sigue dando respuestas**. |
| **⛔ el auditor también mintió** | Dos veces, y las dos cazadas por las leyes que salieron de las cinco tandas anteriores: bitácora **nº116** y **nº117**. |
| **el hook** | **Tres** falsos positivos, no uno. Y en los tres **escribe**. Propuesta en §D. |

---

## A · EL INVENTARIO

### A1 · El censo, con su contador independiente

```
   ficheros `.js` en src/                              62
      …que la batería EJECUTA como script              49
      …que son módulos y no se ejecutan solos          13

   ⭐⭐ POSITIVO DE CONTROL DEL EXTRACTOR
      el extractor encuentra        198
      `grep -o | wc -l` encuentra   198     ✅ cuadran
```

⛔ La lista de qué es módulo y qué es script **no se copia**: se lee de `probar-paradas.js`, que es
quien la declara (ley 56).

```
   fichero                              exige   fallo  imposible
   probar-visor-nombres.js                 14       3          0
   probar-visor-nombre-simple.js           12       3          0
   probar-modelo-obligatorio.js            13       0          0
   donde-falta.js                          12       0          0
   nombrar-aceras.js                       12       0          0
   bici-inventario.js                      11       0          0
   probar-visor-rutas.js                    9       3          0
   exportar-nombre-simple.js                9       0          0
   asignar-bici.js · calle-pegada.js · modelo.js       8 cada uno
   …y 19 ficheros más
   ⭐ TOTAL                                                   198
      ficheros CON alguna comprobación                        28
      ⚠️ ficheros ejecutables SIN NINGUNA                     22
```

### A1b · ⚠️⚠️ Las decorativas — 182 líneas que dicen ⛔ y no paran nada

Ley 44: *un `⛔` impreso no es un fallo, es texto.*

```
   líneas que imprimen un veredicto ✅/⛔ sin ningún `A.exige` a menos de 4 líneas   182
      14  orden-numeros.js       13  rutas-antonio.js       9  probar-visor.js
       7  auditoria-grafo.js      7  exportar.js            7  probar-guardianes.js
       7  sin-vigilancia.js       7  verificar-rios.js      6  candidatos-enganche.js …
```

⚠️ **Esto es un TECHO, no un recuento de fallos**, y se dice antes de que nadie lo lea como tal:
muchas son informativas («⭐ suman 98.774 ✅») y **una expresión regular no sabe distinguirlas**. Lo
que sí es objetivo: **cada una de esas 182 no puede poner el proceso en rojo.**

### A2 · ⛔ El clasificador textual del «rojo visto» — **NO VALE, y se deja roto**

Escribí un clasificador que busca marcas de contraprueba cerca de cada comprobación. Da 76 con marca
y 123 sin. **Y su control negativo falla**: marca como «rojo visto» una comprobación que no lo tiene.

Se hizo **una sola** corrección, y principiada —no contar la cabecera del fichero, que habla del
fichero entero y no de una comprobación concreta—. **Siguió fallando.** ⛔ Y ahí se queda: ajustarlo
hasta que pase sería ajustar el instrumento al resultado.

⭐ **Y el porqué es el hallazgo:** la comprobación que se le da como negativo **sí tiene un «positivo
de control» catorce líneas más abajo… pero es el de OTRA cosa.** ⇒ **la proximidad no implica que la
marca hable de ESA comprobación.** Una heurística de cercanía no distingue «tiene contraprueba» de
«vive en un barrio donde las hay».

⇒ **La tabla de §A2 se queda como lista de sospechosas a mutar, no como clasificación.** Lo que
clasifica de verdad es §B. *(Bitácora nº116: y además estaba escrita como línea impresa, así que el
⛔ salía con el proceso en verde — la ley 44 dentro del fichero que viene a cazarla.)*

---

## B · ⭐⭐⭐ LOS ROJOS PROVOCADOS

Se rompe a propósito lo que cada comprobación vigila, **desde fuera**, reescribiendo el código fuente
del módulo antes de compilarlo. ⛔ No se toca una línea de producción.

### B0 · Las cuatro trampas, comprobadas antes de fiarse de ningún rojo

| trampa | cómo se comprueba | de dónde viene |
|---|---|---|
| ¿la palanca está conectada? | un `node -e` que mira la bandera del precargado | nº106 |
| ¿la mutación **ocurrió**? | el preload escribe un fichero-testigo **al compilar** | nº117 (hoy) |
| ¿el proceso llegó a ejecutar lo que se prueba? | **el reloj**: se compara con el tiempo de la ejecución base | nº106 |
| ¿el rojo es el SUYO? | se exige el mensaje concreto, no «salió en rojo» | nº101 |
| ¿había línea base? | cada objetivo se ejecuta **primero sin mutar** | ley del proyecto |

⭐⭐ **Y las cuatro hicieron falta**: la segunda ronda de mutaciones dio **0,1 s por script** contra
15–60 s de base. El preload tenía un error de sintaxis y **todos los procesos morían al arrancar** —
el nº106 exacto, repetido. **Lo cazaron la palanca y el reloj a la vez.**

### B1 · La línea base — los ROJOS VIVOS

```
   calle-pegada.js                código 0    25,8 s   ✅ limpio
   paso-de-cebra.js               código 0    18,2 s   ✅ limpio
   exportar-nombre-simple.js      código 0    15,7 s   ✅ limpio
   probar-modelo-obligatorio.js   código 0    56,9 s   ✅ limpio
   modelo-rutas.js                código 1    69,0 s   ⛔ 1 rojo vivo
      · San Juan de la Peña no sale como «carril en calzada» sobre lo que pisa la ruta 7
   modelo.js                      código 1    17,4 s   ⛔ 2 rojos vivos
      · el invariante saca 1 familia de choque NO predicha
      · alguna `footway=sidewalk` no es `acera` para mi lectura física
```

### B2 · Las mutaciones

```
   mutación            objetivo                       parches    seg   veredicto
   geo-escalado        calle-pegada.js                      1   21,8   ✅ ROJO PROVOCADO
   nucleo-constante    calle-pegada.js                      1   29,9   ✅ ROJO PROVOCADO
   paralela-muda       calle-pegada.js                      1   16,7   ✅ ROJO PROVOCADO
   sin-noaplica        paso-de-cebra.js                     1   18,1   ✅ ROJO PROVOCADO
   hash-constante      modelo.js                            1   17,6   ✅ ROJO PROVOCADO
   exports-al-final    probar-modelo-obligatorio.js         3   57,3   ✅ ROJO PROVOCADO
   ⛔ sin-noaplica      exportar-nombre-simple.js            1   16,6   ⛔ NO SALTA NADA
   ⛔ sin-liston        exportar-nombre-simple.js            1   17,5   ⛔ NO SALTA NADA
   ⛔ resolver-vacio    modelo-rutas.js                      2   57,7   ⛔ NO SALTA NADA
   ⛔ resolver-vacio    probar-modelo-obligatorio.js         2   60,2   ⛔ NO SALTA NADA
```

⭐ **Y hay filas que no esperaba, en las dos direcciones:**

- `geo-escalado` hizo saltar **además** *«la reimplementación del criterio de la tanda 14 da 175/21 y
  lo publicado es 198/23»*. ⇒ **el positivo de control de los 198/23 está vivo** y se le acaba de ver
  el rojo por primera vez.
- `nucleo-constante` hizo saltar **también** *«la paralela repite el error de portales que sabemos mal
  enganchados»*. ⇒ **el «0 de 198» de la tanda 25 §C3 SÍ puede ponerse rojo.** Era la comprobación de
  la que más dudaba (un cero redondo, forma nº98) y **resiste**.
- `exports-al-final` hizo saltar **tres** cosas. El guardián del nº105 está bien vivo… en su §1 y §3.

---

## ⚠️⚠️⚠️ LAS CUATRO QUE NO SALTAN — y lo que sostenían

### 1 · ⚠️⚠️⚠️ EL REPARTO PUBLICADO DEL MAPA NO ESTÁ PROTEGIDO POR NADA

**La costura del encargo, disparada.** Se rompe `sinNombrePorDefinicion()` —la regla que decide qué
es gris— y el exportador **sale en código 0 con todos sus cuadres en ✅**:

```
   AZULES · con nombre — exportado / modelo     56864 / 56864   ✅
   ROJAS  · le falta                            38093 / 38093   ✅
   ⭐ VERDES                                      3817 / 3817    ✅
   GRISES · no aplica                                0 / 0      ✅
   ⭐ suman                                      98774 de 98774  ✅ ninguna fuera
```

**Cero grises, y todo verde.** El reparto real —51.556 / 32.258 / 3.792 / 11.168, publicado en
`H1-VERDE.md`— cambia entero y **ninguna de las nueve comprobaciones del exportador se entera**.

⭐ **El porqué está escrito en el propio fichero y es correcto**: *«ese cuadre PASA POR CONSTRUCCIÓN:
el color lo decide el redactor, así que no puede discrepar de él»*. Y la comprobación «contra el
motor» de `probar-visor-nombre-simple.js` **tampoco lo caza, por lo mismo**: pregunta al mismo
redactor. ⇒ **caza divergencias de REGLA (dos caminos de código, que es el nº107) y no de DATO.**

⛔ **Lo que falta, anotado y NO hecho:** las siete rutas tienen un ancla —*«publicado tanda 16:
3086,9 ✅»*— y el reparto del mapa no tiene ninguna. Un número congelado en el código lo cerraría.

### 2 · ⭐⭐⭐ EL GUARDIÁN DEL nº105 NUNCA PUDO DISTINGUIR LO QUE DICE DISTINGUIR

`probar-modelo-obligatorio.js` §2 se titula *«EL MODELO SÍ ENTRA — el positivo de control»* y afirma
de sí mismo: *«se exige que el TEXTO lleve un nombre que **solo** puede venir del modelo»*.

Se vacía el modelo y **pasa en verde**. El texto de su ruta de control, con el modelo destruido:

```
   1.   Por un tramo sin nombre (acera)                 63 m
   2.   Cruzas por un paso de peatones                   8 m
   3. ◦ Por Calle Salvador Minguijón (eje de calzada)  378 m  · 2 tramos   ← lo encuentra AQUÍ
   5.   Por un tramo sin nombre (acera)                 11 m
   7.   Por un tramo sin nombre (acera)                 33 m
```

**Siete pasos donde con el modelo hay UNO** (*«Por Calle Salvador Minguijón, 503 m, 12 tramos»*). La
degradación se ve a simple vista; **el guardián no la ve**, porque busca una subcadena que **el eje de
la calle aporta por su cuenta: lo nombra OSM.**

⚠️ Y no es que se estropeara: **nunca pudo.** La frase *«un nombre que solo puede venir del modelo»*
era un razonamiento, no un rojo visto. *(Bitácora nº118.)*

### 3 · La decisión «listón 1 ha» (tanda 28) no tiene guardián

Se quita el filtro de superficie y **no salta nada**. Era esperable —la decisión es de producto— pero
queda dicho: **el listón se puede cambiar por accidente y nadie se entera.**

### 4 · El guardián D1 de las siete rutas no caza que el modelo se vacíe entero

`modelo-rutas.js` D1 deriva la expectativa: *«el texto cambia si y solo si algún way gana vía por el
modelo»*. Con el modelo vacío, **`cambian` y `deben` salen los dos vacíos** ⇒ `[] === []` ⇒ verde.

⚠️ **Matiz honesto:** las otras comprobaciones de ese fichero —los metros de las siete rutas contra
la tanda 16— **sí siguen protegidas**, porque comparan contra números congelados. Lo que no está
protegido es la afirmación sobre el TEXTO.

---

## C · LAS FORMAS DE MENTIR

### C1 · El reparto — ⚠️ con su cobertura declarada

```
   forma                                          casos medidos      dónde
   3 · pasa por construcción: no puede fallar               2        el reparto del mapa · D1 de rutas
   ⭐ 7 · distingue los extremos y no el medio               1        el guardián del nº105 §2
   (sin guardián: no hay comprobación que mutar)            1        el listón de 1 ha
   ─────────────────────────────────────────────────────────
   provocaron su rojo sin problema                          6
```

⚠️⚠️ **Y aquí va la cobertura, que es lo que hace honesto el reparto:** se han mutado **10 de 198
comprobaciones — el 5,1 %**. ⛔ **Del 94,9 % restante, `NO CONSTA`**: no *«no hay problemas»*, sino
*«no se ha medido»*. Mutar las 198 son unas veinte horas de ejecución y no cabe en una tanda.

⭐ Lo único que se puede afirmar del resto sin mutarlo: **las 182 decorativas no pueden poner el
proceso en rojo**, por construcción y por definición.

### C2 · ⭐⭐ LA SÉPTIMA FORMA

> **7 · La comprobación distingue los extremos y no el medio.**
>
> Vigila **«está / no está»** y se queda ciega ante **«está pero vacío»** — el estado en el que el
> sistema no revienta, no avisa, y **sigue dando respuestas plausibles y degradadas**.

Es distinta de las seis conocidas y por eso se declara:

- **no** es «no llega a ejecutarse» (1): se ejecuta entera;
- **no** es «el espejo» (2): compara con algo externo;
- **no** es «pasa por construcción» (3): **funcionaba de verdad para el caso que la motivó**;
- **no** es «la magnitud equivocada» (4) ni «otra unidad» (5): mide lo que dice;
- **no** es «el mismo testigo repetido» (6): hay un solo testigo y es pertinente.

⭐ **Su forma exacta:** la comprobación nace mirando un fallo concreto —aquí, *el modelo no carga y
lanza*— y hereda su binariedad. El modo **degradado** —*el modelo carga y no dice nada*— cae justo en
medio, produce salida creíble, y **ninguna comprobación mira ahí**.

⚠️ Y es la más peligrosa de las siete por un motivo simple: **un fallo que revienta se caza solo. El
que degrada, no.** El proyecto lleva dos casos del mismo patrón —el nº105 (avisaba y seguía) y éste—
y en los dos el sistema seguía entregando un resultado.

---

## D · EL GUARDIÁN QUE ESCRIBE SOLO

⛔ **Probado en un repositorio de juguete, nunca en el real.**

### D1 · El comportamiento declarado funciona… y hay **tres** falsos positivos, no uno

```
   caso                                              código   entradas   ¿escribió?
   chore: sin entrada (no aplica)                         0    0 → 0     no
   ⭐ fix: SIN entrada  (debe rechazar)                    1    0 → 1     ⛔ escribió (correcto)
   ⭐ fix: CON entrada  (debe pasar)                       0    1 → 1     no
   ─────────────────────────────────────────────────────────────────────────────
   ⛔ git commit --amend (solo el mensaje)                 1    1 → 2     ⛔ ESCRIBIÓ
   ⛔ git commit --amend --no-edit                         1    1 → 2     ⛔ ESCRIBIÓ
   ⛔ fix: con la entrada en el commit ANTERIOR            1    2 → 3     ⛔ ESCRIBIÓ
   · Revert "fix: …"  (no aplica)                         0    2 → 2     no
```

⭐⭐ **El tercero es nuevo y no estaba en el encargo, y choca con una ley del propio proyecto:**
`docs/BITACORA.md` en un commit y el `fix:` en el siguiente es **commits atómicos**, que es lo que
manda `CLAUDE.md`. **El hook castiga exactamente la práctica que el repositorio exige.**

**Causa común de los tres:** `git diff --cached -- docs/BITACORA.md` mira **el commit que se va a
crear contra HEAD**. En un `--amend`, HEAD *es* el commit que se reescribe y ya lleva la entrada
dentro; con la entrada en el commit anterior, ya está en HEAD. En los dos casos el diff no añade
nada y el hook concluye que falta.

### D2 · El problema de fondo es peor que el falso positivo

> **Un guardián que modifica el estado que vigila estropea la operación siguiente aunque acierte en
> la suya** (ley 39).

Tras cada rechazo queda esto, **sin que nadie lo haya pedido**:

```
   git status --porcelain docs/BITACORA.md
   M  docs/BITACORA.md          ← modificado Y EN EL STAGE

   git diff --cached:
   + ## [2026-08-05] — a ver
   + **Categoría:** NO CONSTA
```

Y así se coló el nº112: el segundo intento de `--amend` se llevó el esqueleto que el primero había
dejado puesto. **Con tres formas de dispararse en falso, tres formas de que vuelva a pasar.**

### D3 · ⛔ LA PROPUESTA — no aplicada, decide Antonio

**(a) El imprescindible: que NO escriba en el árbol.** El esqueleto va a
`$GIT_DIR/BITACORA-ESQUELETO.md` y el mensaje dice dónde está para copiarlo. Sigue siendo fácil
cumplir —que es el motivo por el que se escribió así— y **deja de tocar el estado que vigila**.
⭐ Esto resuelve el nº112 entero **sin tocar la lógica de detección**, y es reversible.

**(b) El opcional: el falso positivo.** Aceptar también si la cabecera nueva ya está **en HEAD y no
en HEAD~** — es decir, comprobar *«el commit resultante añade una entrada»* de las dos formas
posibles, sin necesidad de saber si es un amend. ⚠️ **Con su efecto lateral dicho:** un `fix:` normal
justo después de un commit que añadió entrada también pasaría. ⇒ **más laxo a cambio de cero falsos
positivos**, y esa balanza la decide Antonio.

⚠️ **Lo que NO se puede hacer limpiamente:** detectar un `--amend` desde `commit-msg`. Git no deja
marca. Cualquier intento sería una heurística, y hoy ya sobran.

---

## E · EL VEREDICTO

### E1 · ¿Cuántas han visto su rojo?

```
   comprobaciones censadas                                    198
   ⭐ con su rojo PROVOCADO Y VISTO en esta tanda               6 mutaciones → 9 mensajes distintos
   ⛔ que NO saltan al romper lo que vigilan                    4 casos
   ROJO VIVO (declarados, en rojo ahora mismo)                  3 mensajes en 2 ficheros
   ⛔ NO CONSTA — no medidas                                  188   (94,9 %)
   ⚠️ …de ésas, decorativas (no pueden poner el proceso en rojo)  182 líneas
```

⛔ **El número honesto es el último.** *«No consta»* no es *«están bien»*.

### E2 · ⭐⭐⭐ QUÉ DÁBAMOS POR COMPROBADO Y NO LO ESTABA

| # | lo que creíamos | la verdad |
|---|---|---|
| 1 | ⚠️⚠️⚠️ **«el reparto del mapa cuadra contra el motor»** — 51.556/32.258/3.792/11.168, publicado en `H1-VERDE.md` | **Ninguna comprobación lo protege.** Se rompe la regla que lo produce y el exportador sale en 0 con todos sus ✅. Caza divergencias de regla, no de dato |
| 2 | ⭐⭐⭐ **«el modelo SÍ entra en el redactor»** (guardián de la tanda 23 §2) | **Nunca pudo distinguirlo.** El testigo elegido lo aporta OSM por su cuenta |
| 3 | **«el texto de las rutas cambia si y solo si el modelo aporta vía»** (D1) | No caza que el modelo se vacíe entero: `[] === []` |
| 4 | **«el listón de 1 ha»** (decisión de la tanda 28) | Sin guardián. Se puede cambiar por accidente |
| 5 | **el clasificador de «rojo visto»** de esta misma tanda | No vale: su control negativo falla. Declarado y dejado en rojo |

⭐ **Y lo que sí resistió, que también es resultado:** el `0 de 198` de la circularidad (tanda 25
§C3) —del que más dudaba, por ser un cero redondo— **se pone rojo cuando se le rompe el testigo**. El
positivo de control **198/23** de la tanda 14, igual. El hash del grafo, igual. La causa raíz del
nº105 (§1 y §3), igual.

### E3 · Lo que queda sin poder verificar

- **188 comprobaciones sin mutar.** Veinte horas de ejecución. `NO CONSTA`.
- **Si las 182 decorativas afirman algo o solo informan.** Una expresión regular no lo distingue y
  leerlas una a una no cabía en esta tanda.
- **Los `.githooks` más allá de `commit-msg`**: solo hay uno.
- **`tools/`**: los tres visores no tienen comprobaciones propias; las suyas viven en los
  `probar-visor-*.js`, que sí están censados.

---

## LAS SIETE RUTAS

**Idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 · 2528,9) y contra la
tanda 16. ⭐ Y tenían que serlo: **esta tanda no toca ni un fichero de producción.**

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que el censo estuviera incompleto** — **no**: 198 contra 198 de un contador independiente.
- **Que el «0 de 198» de la circularidad fuera un cero vacío** — **no**: se pone rojo al romperlo.
- **Que alguna mutación no llegara a aplicarse** — **sí, cinco de diez la primera vez** (nº117), y
  por eso la tabla lleva la columna «parches».
- **Que hubiera más de un hook** — **no**: solo `commit-msg`.

## LO QUE NO SE HA COMPROBADO

- **Las 188 comprobaciones no mutadas.**
- **Que las seis que sí saltaron salten por la razón correcta** en todos los casos: se exige el
  mensaje, no la causa.
- **Que el mutador no tenga efectos laterales** que hagan saltar cosas por otro motivo. ⚠️ Se ve en
  `paralela-muda`, que además del suyo hizo saltar el RADIO con un `NaN`.

## ⛔ LO QUE SE ANOTÓ Y NO SE TOCÓ

| # | qué | por qué no |
|---|---|---|
| 1 | Anclar el reparto del mapa a un número congelado | es un arreglo, y esta tanda audita |
| 2 | Cambiar el testigo del guardián de la tanda 23 | ídem — y lo decide Antonio |
| 3 | Un guardián para el listón de 1 ha | ídem |
| 4 | Que el hook no escriba en el árbol | ⛔ es un guardián: se propone, no se toca |
| 5 | Los cinco rojos vivos | se deciden en la tanda siguiente |
