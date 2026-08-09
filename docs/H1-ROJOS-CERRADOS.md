# H1 · CERRAR LOS ROJOS

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 2 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `21 congelados` | **26 congelados** | `docs/H1-REPUBLICACIONES.md §B` · 2026-08-09 |
> | `182` | **232** | `docs/auditoriafinal/B2-CONTRASTE-2026-08-07.md §B2·V3` · 2026-08-07 |
>
> <sub>cuántos números vigila `numeros-congelados.js` · las líneas decorativas — un ⛔ impreso que no para nada</sub>
<!-- SUPERADOS:FIN -->

*Tanda 31 · 2026-08-05 · Antonio decide cuatro de los cinco rojos vivos y pide el número del quinto
antes de decidirlo.*

> **Este documento se AÑADE, no reescribe nada.** Republica dos números que habían caducado
> (`docs/H1-NOMBRES-Y-PASOS.md` §0) y actualiza el reparto del mapa de `docs/H1-VERDE.md` §0, diciendo
> en cada caso a qué valor sustituye y por qué.

```
node src/asignar-bici.js                  # A1 · la regla estricta
node src/modelo.js                        # A2 · los 22 corridor
node src/donde-falta.js                   # A3 · la predicción fallada, escrita
node src/nombrar-aceras.js                # A4 · el listón que no se pasó, escrito
node src/nombre-prestado.js               # B  · ⛔ SOLO MIDE
node src/probar-hook.js                   # C  · el rojo y los tres verdes del hook
node src/probar-modelo-obligatorio.js     # D  · el guardián rehecho, §2 y §2b
node src/puertas-sin-calle.js             # E  · el número republicado
node src/numeros-congelados.js            # los 21 congelados
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ rojos vivos: de 5 a 1** | Cerrados A1, A2, A3 y A4. **Queda uno**, el quinto, que es el que Antonio decide con el número delante. |
| **⭐⭐⭐ y el quinto es EXACTAMENTE el nombre prestado** | El rojo de `modelo-rutas.js` dice: *«San Juan de la Peña no sale como carril en calzada: **los metros que se andan no tienen asignación propia**»*. Es la misma cosa medida en §B. |
| **⭐⭐ B · la cita al Ayuntamiento** | **458 aristas · 17,38 km** llevan un nombre prestado, y **las 458 se presentan como DECLARADAS**. Ni una lleva el aviso de deducida. |
| **⭐ pero en las siete rutas es 44 m de 10,96 km** | **0,4 %**, todo en la ruta 7. Cortar la herencia costaría **+2 pasos** que dicen «un tramo sin nombre» (19 → 21). |
| **⭐ y las 458 son TODAS de `municipal-bici`** | Ni una de OSM, portales o calle pegada — porque esas fuentes ya deciden por way. **El préstamo solo existe donde la asignación es por arista.** |
| **⚠️⚠️ el reparto del mapa se ha movido, y el guardián de la tanda 30 lo cazó** | 51.556 → **51.493**. Siete filas congeladas en rojo, todas por el mismo −63. **Funcionó exactamente como se diseñó.** |
| **⭐⭐ el hook: 7 de 7** | Su ROJO y sus tres VERDES, vistos. Y ya no escribe en el árbol. |
| **⭐⭐⭐ el guardián del nº105, rehecho y probado** | Con modelo la ruta sale en **1 paso**; con el modelo vacío, en **7**. Y se enseña que el testigo viejo **pasa igual** con el modelo vacío. |
| **⚠️⚠️ hay OTRA de la misma forma que el nº105** | `probar-visor-nombres.js` §C4: «NO está aplicado» sale en las 1.292 deducidas **y en las 2.575 sin votos**. No distingue lo que dice distinguir. |
| **⚠️⚠️ y OTRO número publicado caducado** | «las siete rutas: 110 → 82 pasos» — **hoy son 74**. Republicado y congelado. |
| **⛔ lo que sale mal (mío)** | nº123 (inventé una opción que no existe y el «antes» salió clavado al ahora), nº124 (leí el código de salida de `tail`), nº125 (conté cero avisos de bici buscando una palabra que el texto no usa). |

---

## A · LOS CUATRO ROJOS CERRADOS

### A1 · ⭐⭐ La asignación de carriles bici — se aplica la regla ESTRICTA

Un solo candidato ya **no** se asigna sin comprobar la compatibilidad de plataforma.

```
   regla                          metros   aristas   desplazada 2 km   razón aristas   acierto
   LAXA · tandas 19-30         212,43 km      3557    60,55 km  1930         ×1,8       69,0 %
   ⭐ ESTRICTA · la que manda   207,30 km      3472    34,14 km  1095         ×3,2       70,5 %

   aristas que PIERDEN la asignación     85  (2,4 %)
   ⚠️ aristas que la GANAN                0   ✅
```

⭐ **Las dos medidas que pedían el cambio eran independientes** y las dos se quedan en el código: la
contraprueba de desplazamiento (`asignar-bici.js` §B4a) y el acierto por estado (`modelo.js` §B5,
`univoca` acertaba menos que `tipo` y `margen`).

⭐⭐ **Y el rojo del guardián se ve en cada ejecución**, no se cuenta: se sigue calculando la regla
laxa y se exige que **falle** el listón de ×3. Si algún día lo pasara, este guardián no distinguiría
las dos reglas y el cambio de hoy no significaría nada. ⛔ El listón **no se ha tocado**: es el mismo
×3 declarado en la tanda 19, antes de mirar ningún resultado. Lo que cambió fue la regla.

⭐ Y un invariante que se declaró antes de ejecutar y se comprueba: **la estricta es un subconjunto de
la laxa.** 0 aristas ganan asignación al ser más estrictos. Si alguna la ganara, no sería un filtro.

### A2 · Los 22 `highway=corridor`

**Qué son a efectos del modelo: ya estaban clasificados dos veces, y bien.**

```
   forma.js:81          → plataforma `plataforma-peatonal`
   condicionales.js:54  → paso condicional **FIRME** («atravesar algo que tiene dueño y puerta»)
```

⛔ **El único sitio que no los conocía era `precision()`**, y como no los conocía caían al valor por
defecto del final: **`eje-de-calzada`**. O sea, **22 aristas y 950 m de pasillo de edificio contados
—y escritos en el texto— como el eje de una calzada.**

⇒ Entran en `peatonal`, que es donde ya estaban sus hermanos (`footway`, `pedestrian`, `path`,
`living_street`). ⭐ **No hace falta una categoría nueva ni tocar la transitabilidad**: un pasillo es
una plataforma por la que se anda, y como paso condicional **ya se avisa de él en el texto desde la
tanda 12**.

⚠️ **La precisión no entra en el coste ni en `transitableAPie()`** — comprobado, no supuesto: los
únicos consumidores de `.precision` son el hash del grafo, la fusión de pasos del relato y los
informes. **Las siete rutas salen idénticas al milímetro.**

⭐ Lo cazó el invariante `plataforma ⇄ precision` de `modelo.js` como familia de choque **no
predicha**, que es exactamente para lo que está.

#### ⚠️ Y el segundo rojo de `modelo.js`, que el encargo no nombraba

`modelo.js` tenía **dos**. El otro:

```
   ⛔ alguna `footway=sidewalk` no es `acera` para mi lectura física   (1 de 16.858, 6 m)
   way 1314200369 · footway=sidewalk · highway=steps · step_count=6 · handrail=no · ramp=no
```

**Una acera escalonada de seis peldaños.** El modelo dice `escaleras` y acierta —«unas escaleras son
escaleras aunque además sean otra cosa», regla 1 de `forma.js` desde el primer día—. **La predicción
fallada es mía**, de la tanda 19: no contemplé que una acera pudiera tener peldaños.

⇒ Se le aplica **la doctrina de A3**, que es la que Antonio fija en esta tanda: el rojo se apaga y la
predicción se queda escrita con su valor y su fecha. ⚠️ **Extiendo una decisión que se tomó para otro
fichero, y por eso lo digo aquí destacado.** ⭐ Lo que SÍ protege el texto —que toda `footway=sidewalk`
tenga precisión `acera`— sigue exigido en rojo de verdad. Y donde había un «cero» se pone un listón de
magnitud, declarado: **más del 0,1 % de las aceras ya no sería «alguna con peldaños», sería que
`plataforma()` ha cambiado de criterio.**

### A3 · Las predicciones falladas de la tanda 20

```
   ⭐ VEREDICTO DE LA PREDICCIÓN (tanda 20) — se deja escrita, acertara o no:
      · `acera`   predije «se aplana o se invierte» ⇒ ⛔ ME EQUIVOQUÉ: aguanta a ×1.50
      · `calzada` predije «aguanta»                 ⇒ ⛔ ME EQUIVOQUÉ: sale plana a ×1.14,
                                                       y el techo (×1.26) explica por qué
```

**Las dos fallaron, y las dos por lo mismo: no miré el techo aritmético antes de predecir.** Queda
impreso en cada ejecución, dos veces (en la tabla y en el veredicto).

⭐⭐ **Y el rojo no se queda vacío.** Apagar un `A.exige` y dejar un `log` en su sitio es la ley 44 —el
⛔ impreso que no para nada, y es como nació el nº116—. En su lugar va lo que **sí** sería un fallo del
proyecto y no una predicción mía: *si la relación portal↔nombre no sobreviviera en NINGUNA plataforma,
todo este análisis estaría midiendo ruido.* Sobrevive en **6 de 9**.

### A4 · La contraprueba del método de nombres — ×2,58 contra un listón de ×3

```
   razón real / barajado local                      ×2.59
   ⛔ listón declarado en la tanda 20                ×3.00   ⛔ NO PASA — y se queda escrito así
   ⭐ listón que se exige desde la tanda 31          ×2.00   ✅ pasa
```

⛔⛔ **El ×3 NO se ha bajado.** Sigue impreso, en rojo, el primero, con su valor y su fecha. Bajarlo
hasta que pasara habría sido ajustar el instrumento al resultado.

⭐ Lo que se acepta es **otra cosa**: el método, con su límite declarado, porque está medido por otros
tres caminos que sí pasan —acierto 93,4 % del cruce de dos testigos, línea base del azar 23,2 %, el
patrón de verdad de la tanda 25— y porque **el ×3 era una predicción, no una medición**.

⚠️ **Y el ×2 no es el ×3 rebajado: vigila otra cosa.** Es el punto en el que el método dejaría de
acertar el doble que el azar local y ya no podría defenderse por ningún camino. Se declara sabiendo
que hoy da ×2,59, y eso también va escrito.

---

## B · ⭐⭐⭐ EL NOMBRE PRESTADO — ⛔ MEDIDO, NO DECIDIDO

> *«Nombrar mal es equivocarse; citar mal es atribuir.»*

### B1 · Cuánto es

```
   aristas cuyo nombre SE IMPRIME                          52.646  (3.052,31 km)
   ⭐ …con nombre PRESTADO (la arista no tiene vía propia)    458  (17,38 km)   0,9 %
   ⚠️ …con vía propia DISTINTA de la del way                  144  (11,32 km)   0,3 %

   fuente del way        aristas    metros    ¿es un préstamo de verdad?
   municipal-bici            458  17,38 km    ⭐⭐ SÍ — se asigna ARISTA A ARISTA
```

⭐⭐ **Las 458 son de `municipal-bici`, y ni una de las otras tres fuentes.** No es casualidad y estaba
predicho antes de contar: OSM, los portales y la calle pegada **deciden por WAY**, así que para ellas
el way entero es su unidad y no hay préstamo. **El préstamo solo existe donde la asignación es por
arista**, y eso solo lo hace el carril bici municipal.

⭐ Y cuadra por un camino independiente: `exportar-nombre-simple.js` imprime **458 (17,38 km)** como
«tenían nombre para el MOTOR y salían ROJAS». Es el mismo conjunto visto desde el mapa.

### B2 · ¿Cuántas veces acierta?

**El experimento:** a cada arista que **sí** tiene vía propia se le tapa, se recalcula el nombre de su
way sin su voto, y se compara.

```
   …a las que el préstamo les habría puesto SU nombre         99,6 %
   ⚠️ …a las que les habría puesto OTRO                          170
```

⚠️ **El sesgo va declarado, y no es pequeño:** las que tienen vía propia **no son una muestra de las
prestadas**. Miden lo mismo —¿el way es homogéneo?— sobre la parte del way que sí está cubierta. Si el
préstamo pasara justo donde el way cambia de calle, esto lo sobreestimaría. **No sé cuánto.**

⭐ Y una comprobación que se puso a propósito: **si el préstamo acertara el 100 %, el experimento no
distinguiría nada** y habría que sospechar, no celebrar. Falla en 170. Distingue.

### B3 · ⭐⭐⭐ La cita — el número que decide

```
   aristas con nombre PRESTADO de una fuente del Ayuntamiento     458  (17,38 km)
   ⭐⭐ …y además la vía va como DECLARADA (sin aviso de deducida)   458  (17,38 km)
```

⇒ **458 aristas, 17,38 km, se presentan como nombre declarado por el Ayuntamiento sobre metros que no
tienen asignación propia.** Las 458. Ninguna lleva el aviso «lo deducen los portales» que las
convertiría en una deducción confesada.

### B1b · Y en las siete rutas — donde lo lee una persona

```
    ruta    metros   nombrados   PRESTADOS    con CITA    % prestado
       1   3,09 km     3,07 km         0 m         0 m         0,0 %
       2     598 m       634 m         0 m         0 m         0,0 %
       3   3,70 km     3,38 km         0 m         0 m         0,0 %
       4     506 m       184 m         0 m         0 m         0,0 %
       5     477 m       555 m         0 m         0 m         0,0 %
       6     523 m       635 m         0 m         0 m         0,0 %
       7   2,53 km     2,50 km        44 m        44 m         1,8 %
   ───────────────────────────────────────────────────────────────────
   TOTAL              10,96 km        44 m        44 m         0,4 %
```

⚠️ «nombrados» puede pasarse de «metros»: la ruta usa **trozos** de la primera y la última arista (el
enganche) y aquí se suman enteras. La columna que vale es la razón.

⭐ La tanda 21 midió que de 1.585 m nombrados solo 543 tenían asignación propia. **Hoy es 44 m de
10.960.** Lo que cambió no es el mecanismo: es que la calle pegada (tanda 25) y los portales dieron
nombre propio a casi todo, y el préstamo se quedó donde solo hay carril bici municipal.

### B4 · Las tres opciones, con su coste

**(a) Cortar la herencia**

```
   pasos en las siete rutas — ahora / cortando                80 / 83
   ⭐⭐ pasos que dicen «un tramo sin nombre» — ahora / cortando   19 / 21   (+2)
```

⚠️ Cota **inferior**: el redactor funde además por way y precisión, así que los pasos reales son
menos. La dirección y el orden de magnitud sí valen.

**(b) Marcarla en el texto**, redactado para poder leerlo en voz alta:

```
   1. ◦ Por lo que parece, Calle Salvador Minguijón          503 m
      el nombre es el del tramo de al lado: a estos metros no les
      corresponde ninguno por su cuenta
```

⭐ **Deja de atribuir sin quitar el nombre.** El nombre sigue sirviendo para orientarse; la cita se
retira, que es lo que no era nuestro. Coste: una línea más en los pasos afectados.

**(c) Dejarlo como está — lo que se asume**

1. Que un way de OSM no cambia de calle a mitad. ⭐ Casi siempre cierto: **99,6 %** sobre las
   comprobables.
2. Que cuando el Ayuntamiento asigna un carril a la mitad de un way, esa asignación vale para el way
   entero. ⛔ **Eso no lo dice el Ayuntamiento: lo decimos nosotros.**

### ⛔ Mi recomendación — y es la (b)

**El tamaño no justifica cortar.** 458 aristas de 52.646 (0,9 %) y **44 m de 10,96 km en las siete
rutas**. Cortar cuesta pasos que dicen «un tramo sin nombre» en un itinerario que llevamos cuatro
tandas mejorando, y a cambio quita un nombre que acierta el 99,6 % de las veces que se puede
comprobar.

**Pero el problema no era el nombre: era la cita.** Y la (b) resuelve exactamente eso —retira la
atribución, conserva la orientación— por el precio de una línea. ⭐ Y encima **el mecanismo ya existe**:
`relato.js` sabe imprimir un aviso por debajo del paso, es lo que hace con los nombres deducidos desde
la tanda 21. No hay que inventar nada.

⚠️ **Lo que me haría cambiar de opinión:** si al redactarlo de verdad el aviso saliera en muchos más
pasos de los 1 ó 2 que predice esta medida —porque el redactor funde distinto de como cuento yo—,
entonces (b) empieza a costar lo que cuesta (a) y sin su beneficio. **Eso no lo he medido: la cuenta
de pasos de §B4a es una cota inferior, y va dicho.**

⛔⛔ **No decido. El número está.**

---

## C · ⭐⭐ EL HOOK — 7 de 7

**Un solo cambio de regla cierra los tres falsos positivos**, porque los tres son el mismo caso: *la
entrada existe, pero no en el diff en stage*. Se acepta también si entró en **HEAD y no en HEAD~**. ⛔
No hace falta detectar `--amend`, que desde `commit-msg` no se puede hacer limpiamente.

Y el esqueleto ya **no se escribe en el árbol**: va a `$GIT_DIR/BITACORA-ESQUELETO.md` y **no** se
añade al stage. Ley 39, y el caso real es el nº112.

```
   ⭐⭐ LA PALANCA: un hook que rechaza TODO, ¿rechaza?            ✅ sí — el hook se ejecuta

   caso                                                    espera     sale   árbol
   ROJO · `fix:` sin entrada en ningún sitio              rechazo  rechazo   ✅ intacta
   VERDE · `fix:` CON la entrada en el mismo commit        acepta   acepta   ✅ intacta
   VERDE · `git commit --amend`            (falso pos. 1)  acepta   acepta   ✅ intacta
   VERDE · `git commit --amend --no-edit`  (falso pos. 2)  acepta   acepta   ✅ intacta
   ⭐⭐ VERDE · la entrada en el commit ANTERIOR (f.p. 3)   acepta   acepta   ✅ intacta
   ⛔ ROJO · `fix:` DOS commits después de la entrada     rechazo  rechazo   ✅ intacta
   VERDE · un commit que NO es `fix:`                      acepta   acepta   ✅ intacta

   ⭐⭐ casos correctos                                      7 de 7
```

⚠️⚠️ **El efecto lateral, declarado:** es **más laxo**. Con un commit que lleve la entrada Y un `fix:`
juntos, el siguiente `fix:` también pasa. Se acepta a cambio de cero falsos positivos: **un guardián
que grita cuando no debe se desactiva, y entonces no guarda nada.** ⭐ Y el límite está comprobado, no
prometido: **dos commits después ya se rechaza.** La ventana es un commit, no «alguna vez».

⭐ Todo ocurre en un repositorio de usar y tirar en el temporal. ⛔ **No se toca este repositorio ni una
vez**: probar un hook de commits haciendo commits en el sitio que se audita sería la ley 39 cometida
por quien viene a arreglarla.

---

## D · ⭐⭐⭐ EL GUARDIÁN DEL nº105, REHECHO

**El testigo nuevo: cuántos PASOS tiene la ruta.** Con el modelo entero la ruta de control sale en
**uno** —el modelo le da el mismo nombre al eje y a sus doce aceras y el redactor los funde—. Eso OSM
no lo puede aportar.

```
   §2  ⭐⭐ pasos de la ruta de control CON el modelo        1   ✅ uno
       ⚠️ testigo VIEJO: «Por Calle Salvador Minguijón» → sale.  ⛔ NO vale: lo aporta OSM

   §2b ⭐ ¿el precargado se carga?                          ✅ sí
       ⭐ ¿la mutación OCURRIÓ? (parches sobre el fuente)    1   ✅ sí
       ⭐⭐ pasos de la MISMA ruta con el modelo VACÍO        7
          ⇒ ¿el testigo nuevo los distingue?               ✅ SÍ — 1 con modelo, 7 sin él
       ⭐⭐⭐ y el testigo VIEJO con el modelo vacío           ⛔ PASA IGUAL — por eso nunca valió
```

⭐⭐ **El rojo y el verde en la misma ejecución, todos los días**, y con la mutación comprobada. ⛔ El
testigo viejo no se borra: se queda degradado a informativo con su verdad al lado. Borrarlo dejaría el
fichero pareciendo que siempre tuvo un control bueno.

### D2 · ⚠️⚠️ Y no era la única

Se buscó la forma a propósito: **`A.exige` cuyo testigo es una subcadena**, que es donde otra fuente
puede aportarla sola. **7 de las 210 comprobaciones del repositorio.** Una era el nº105. Una
—`probar-visor-rutas.js`— ya tenía su control negativo. Y cuatro estaban en el mismo bloque:

```
   frase del globo             deducidas   sin votos   con nombre
   «NO está aplicado»          1292/1292   2575/2575      0/41930     ⛔⛔ no separa
   ⭐ «NO se podría deducir»       0/1292   2575/2575          —       ✅ separa
```

⛔ **`«NO está aplicado»` no separa «deducida» de «sin votos»: lo lleva cualquier arista sin nombre.**
La comprobación se lee como si probara que el globo distingue el nombre deducido, y lo único que
prueba es que distingue «tiene nombre» de «no lo tiene».

⇒ Se deja la línea vieja —es cierta— y se añade **la pareja que sí separa**, medida sobre las familias
enteras y no sobre una arista de muestra. ⭐ Y la comprobación de que ninguna familia esté vacía, que
es como esto pasaría por vacío.

⚠️ **Las otras 203 comprobaciones no son de esta forma, pero eso no las hace buenas.** La séptima
forma —distinguir los extremos y no el medio— no necesita una subcadena para darse.

---

## E · ⚠️ LOS NÚMEROS CADUCADOS, REPUBLICADOS

### E1 · Las puertas sin calle: 3.166 → **2.669**

```
   A · puertas que cuelgan de una línea SIN NOMBRE, hoy       2669  (5,8 % de 46.026)
       publicado en la tanda 21                               3166
       ⇒ se ha movido en                                      −497   ⚠️ en cuatro tandas
```

**⭐⭐ El positivo de control va ANTES del reparto**, y por eso vale: deshaciendo las tres tandas con
palancas de verdad (`sinParalela`, `pasosConNombre`, `asignacionLaxa`) tiene que volver el 3.166.

```
   B · con la 25, la 26+27 y la 31 deshechas                  3162
       ⭐ contra el publicado en la tanda 21                   3166   ⛔ NO CLAVA — difieren en 4
       ⚠️ mi predicción era CLAVADO y falla por                  4   (0,1 %)
       ⭐ ¿la palanca MUEVE algo?                              ✅ sí — 2.669 contra 3.162
```

⚠️ **Falla por 4, y no se tapa.** El motivo es que **no todo cambio de nombrado tiene interruptor**:
entre la tanda 21 y hoy hay al menos uno más que no lo tiene, el arreglo del nº108 dentro de
`resolverPorWay`. ⛔ **Qué parte de esas 4 es del nº108 y qué de otra cosa: NO CONSTA.** No se ha
medido, y decir «serán del nº108» sería atribuir por parecido — que es justo lo que §B viene a no
hacer.

```
   C · se deshace                                 puertas sin calle   lo que aportó
       tanda 25 · la calle pegada                              3164          −495
       tandas 26+27 · pasos e isletas sin nombre                2653          +16
       tanda 31 · la regla estricta de bici                     2667           +2
       ────────────────────────────────────────────────────────────────────────────
       suma de los efectos marginales                                        −477
       movimiento REAL                                                       −497
       ⚠️ interacción                                                          −20
```

⭐ **La 25 es prácticamente todo el movimiento.** Y las otras dos van **al revés**: deshacerlas *baja*
el número, o sea que la 26+27 y la 31 **añadieron** puertas sin calle (16 y 2). Es coherente: quitarle
el nombre a pasos e isletas y quitar 85 asignaciones de bici deja puertas colgando de líneas mudas.

⚠️ Los marginales no suman el total, y eso no es un error de cuenta: hay puertas que ganaron calle por
dos caminos y cada tanda se apunta la misma. **«Quién lo hizo» no tiene respuesta única.**

### E2 · Y ahora sí, congelado

`puertas.sinCalle = 2669` entra en `src/numeros-congelados.js`. ⭐ Es el mismo número que la tanda 30
midió y dejó **fuera a propósito**, escrito como *«medido y NO congelado, porque el publicado había
caducado»*. **El bucle se cierra como estaba diseñado: publicar primero, congelar después.**

### E3 · ⚠️⚠️ Y hay otro: «110 → 82 pasos» — hoy son **74**

Segundo titular de `docs/H1-NOMBRES-Y-PASOS.md` §0 que había caducado sin que nadie se enterara.

```
   pasos por ruta:  1:18 · 2:9 · 3:22 · 4:7 · 5:4 · 6:3 · 7:11
   TOTAL 74     (publicado en la tanda 21: 82)
```

⇒ Se republica aquí y **se congela en `src/modelo-rutas.js`**, que es donde ya se ejecutan las siete
rutas: congelarlo en otro fichero obligaría a correrlas dos veces.

⭐ **El titular hermano SÍ aguanta:** «el aviso de bicis sale en 5 de los 82 pasos». Los **5 siguen**
—comprobado con positivo de control, porque mi primer contador dijo 0 y era el buscador roto
(nº125)—. Lo que cambia es el denominador: **5 de 74**.

### ⭐ Y el reparto del mapa, que también se mueve — pero éste sí saltó

```
   mapa.azules       51.556 → 51.493   (−63)
   mapa.rojas        32.258 → 32.310   (+52)
   mapa.verdes        3.792 →  3.803   (+11)
   mapa.rojasMotor   36.050 → 36.113   (+63)
   verde.sinListon    4.405 →  4.424   (+19)
   mapa.verdesKm     145,34 → 145,94
   azulesConPasos    56.864 → 56.801   (−63)
   mapa.grises       11.168 → 11.168   ✅ sin mover
```

⭐⭐ **Siete filas congeladas en rojo, cada una diciendo qué esperaba y qué salió, y todas explicadas
por el mismo −63.** Álgebra: −63 azules = +52 rojas +11 verdes. **Ésta es la diferencia entre este
número y los dos caducados de arriba: éste avisó el mismo día.**

**La causa, medida con la palanca comprobada:** las **63** aristas que pierden el nombre al aplicar la
regla estricta son **todas de `municipal-bici`**, y el modelo con la regla laxa reproduce **51.556
clavado** — el número congelado de la tanda 30. ⛔ El `corridor` de A2 **no mueve el mapa**: la
precisión no entra en el color, y los grises se quedan en 11.168.

---

## LAS SIETE RUTAS

**Idénticas al milímetro**, con y sin modelo y contra lo publicado en la tanda 16:

```
   1: 3086.9 · 2: 598.1 · 3: 3704.9 · 4: 505.9 · 5: 477.4 · 6: 523.4 · 7: 2528.9   ✅
```

⚠️ Y era una costura declarada del encargo: **A1 y A2 tocan el modelo, no el cálculo.** La asignación
de bicis alimenta `forma.ciclista` y el nombre; la precisión alimenta el texto y el mapa. **Ninguna de
las dos entra en el coste ni en `transitableAPie()`.**

---

## LA BATERÍA

`node src/probar-paradas.js --todo` — **51 scripts, invariante cumplido en los 51.** De los **siete**
que declaraban fallo antes de esta tanda quedan **tres**, y los cuatro que se han ido son exactamente
los de §A: `asignar-bici.js`, `modelo.js`, `donde-falta.js` y `nombrar-aceras.js`.

---

## ⭐ CUÁNTOS ROJOS VIVOS QUEDAN

```
   ⛔ QUEDA 1
   modelo-rutas.js · «sobre las aristas que PISA la ruta 7, San Juan de la Peña no sale
                      como carril en calzada: los metros que se andan no tienen
                      asignación propia»
```

⭐⭐ **Y es exactamente §B.** El way 475881583 tiene 783 m asignados a San Juan de la Peña **y no son
los que pisa la ruta**. El rojo lleva desde la tanda 19 diciendo la verdad y nadie lo había leído como
lo que es: **el nombre prestado, visto desde una ruta concreta.** ⇒ se cierra con la decisión de §B.

⚠️ `auditoria-guardianes.js` sigue saliendo en rojo **a propósito**: su clasificador textual está
declarado NO VÁLIDO desde la tanda 29 y ahí se queda. No cuenta como rojo vivo del proyecto.
⚠️ `rutas-antonio.js` sale en rojo por el **rodeo de la nº4, declarado fuera de banda** desde la tanda
16. Tampoco es un hallazgo nuevo.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que A1 o A2 movieran alguna ruta** — **no**: las siete al milímetro, con y sin modelo.
- **Que la regla estricta ganara asignaciones** (sería un filtro que no filtra) — **0**.
- **Que el préstamo viniera también de OSM, portales o calle pegada** — **no**: las 458 son de
  `municipal-bici`, y estaba predicho antes de contar.
- **Que el `corridor` moviera el reparto del mapa** — **no**: los grises se quedan en 11.168 y el −63
  se explica entero por A1.
- **Más comprobaciones con la forma del nº105** — ⚠️ **sí, una**: `probar-visor-nombres.js` §C4.
- **Más números publicados caducados** — ⚠️ **sí, uno**: los 82 pasos.

## LO QUE NO SE HA COMPROBADO

- **Si el nombre prestado es correcto en los casos que importan.** §B2 mide sobre las que tienen vía
  propia, que por definición no son las prestadas. **NO CONSTA** cómo construir un patrón de verdad
  para las prestadas sin salir a la calle.
- **Cuántos pasos añadiría de verdad la opción (b).** La cuenta de §B4a es una cota inferior porque el
  redactor funde además por way y precisión.
- **Qué parte de las 4 puertas de diferencia es del nº108.** No medido.
- **Las otras 203 comprobaciones del repositorio.** El censo de §D2 buscó UNA forma —el testigo por
  subcadena—, no todas.
- **Que el texto del rechazo del hook se entienda.** Eso lo dice quien se lo come.

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **El nombre prestado** — 458 aristas, 458 con cita | ⭐ medido, decide Antonio |
| 2 | **Las 144 aristas con vía propia DISTINTA de la del way** | medido, no tocado |
| 3 | **365 `cycleway`** (tanda 17) · **29 escaleras** (tanda 26) · **los parques** | ⛔ decisiones pendientes |
| 4 | **Las 182 líneas decorativas** del censo de la tanda 29 | ⛔ intactas, van aparte |
| 5 | **El mecanismo de mutación, duplicado** en tres ficheros | declarado; unificarlo toca la auditoría |
| 6 | **El clasificador textual de `auditoria-guardianes.js`** | declarado NO VÁLIDO, en rojo a propósito |
