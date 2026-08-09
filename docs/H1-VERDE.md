# H1 · EL VERDE EN EL MAPA

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 5 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `51.556` | **51.493** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `32.258` | **32.310** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `3.792` | **3.803** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `145,34` | **145,94** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
> | `36.050` | **36.113** | `docs/H1-ROJOS-CERRADOS.md §0` · 2026-08-05 |
>
> <sub>las líneas CON nombre del mapa · las líneas rojas del mapa · las rojas explicadas por zona verde · los km de rojo explicados por zona verde · las líneas a las que el motor les ve falta de nombre</sub>
<!-- SUPERADOS:FIN -->

*Tanda 28 · 2026-08-05 · Antonio acepta la recomendación de la tanda 27: no se toca el modelo ni el
texto, solo el mapa.*

> **Este documento se AÑADE, no reescribe nada.** Actualiza el reparto publicado en
> `docs/H1-PARQUES.md` (§A) y aplica lo que allí se propuso y no se aplicó.

```
node src/exportar-nombre-simple.js && node src/probar-visor-nombre-simple.js
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐ el reparto** | **51.556 azules · 32.258 rojas · 3.792 verdes · 11.168 grises = 98.774** ✅ |
| **⭐⭐ qué capa manda** | **OSM**, con listón de 1 ha. ⛔ **Y no es la que yo iba a recomendar.** |
| **⛔ lo que tumbó la intersección** | El positivo de control: **deja fuera el Parque del Agua entero, 0 de 493 rojas.** Estaba limpia porque no cogía casi nada donde importa. |
| **⭐ el Anillo Verde Oliver entra** | 19 rojas y **148 metros**. ⚠️ Y ya no es el problema que era: sus **131 líneas con nombre siguen azules**, porque el verde es una variante del rojo y **no le quita el nombre a nadie**. |
| **⭐ por qué esto no puede romper nada** | `CATEGORIA()` es lo que dice el motor; el verde solo puede **convertir un 0 en un 3**. Nunca toca un azul ni un gris. |
| **⭐ el rojo que queda** | De las 36.050 líneas a las que les falta el nombre, **3.792 (10,5 %) quedan explicadas** y **32.258 siguen sin explicación**. |
| **⛔ lo que sale mal (mío)** | Bitácora nº115: elegí la fuente por las tres filas que confirmaban el titular. Las tres medían pureza; ninguna, cobertura. |

---

## LO QUE DICE EL MAPA AHORA

```
   AZUL   #1f5fd0   1,8 / 0,75    tiene nombre de calle
   ROJO   #e01b00   1,8 / 0,75    LE FALTA el nombre — y es un problema
   ⭐ VERDE #1f8a4c   1,8 / 0,75    le falta igual, pero está DENTRO DE UNA ZONA VERDE:
                                   por eso es roja
   GRIS   #9aa0a6   1,0 / 0,35    no tiene nombre ni debe: paso de peatones o isleta
```

⭐ **El verde va con el MISMO grosor y la MISMA opacidad que el rojo, y eso es la ley 57 aplicada, no
saltada.** El verde **no es una categoría hermana del rojo: es una variante del rojo**. A esas líneas
les falta el nombre igual que a las rojas; lo único que añade el color es **por qué**. Hacerlo más
gordo diría que es más importante —no lo es, es una explicación—; más fino, que importa menos.

⭐ Y el **orden de pintado** también afirma: gris, verde, rojo, azul. Primero lo que menos urge; el
rojo que queda, encima, porque es lo que se viene a mirar.

---

## 1 · ⭐⭐ QUÉ CAPA MANDA — y no es la que iba a recomendar

### Las cuatro opciones, medidas sobre las 36.050 rojas

```
   listón          MUNICIPAL              OSM        UNIÓN (cualquiera)   INTERSECCIÓN (las dos)
   sin filtro   4055 · 142,05 km   4405 · 160,72 km   6449 · 236,46 km      2011 · 66,31 km
   ≥ 2.000 m²   4001 · 141,36 km   4335 · 159,31 km   6347 · 234,70 km      1989 · 65,97 km
   ⭐ ≥ 1 ha     3549 · 129,30 km   3792 · 145,34 km   5617 · 215,75 km      1724 · 58,89 km
   ≥ 5 ha       2215 ·  89,48 km   2408 · 101,83 km   3715 · 156,54 km       908 · 34,77 km
```

### ⛔ Iba a recomendar la INTERSECCIÓN, y estaba mal

Tres indicadores, los tres favorables (listón ≥ 1 ha):

```
   de qué son las verdes
   MUNICIPAL       peatonal=2704 · eje-de-calzada=443 · acera=273 · escaleras=129
   UNIÓN           peatonal=4416 · eje-de-calzada=638 · acera=373 · escaleras=190
   ⭐ INTERSECCIÓN  peatonal=1557 · eje-de-calzada=93  · acera=14  · escaleras=60

   rojas verdes pegadas al borde (≤5 m, posible acera perimetral)
   MUNICIPAL 313 de 3549 (8,8 %)      INTERSECCIÓN 120 de 1724 (7,0 %)
```

**14 aceras contra 273. El 90 % `peatonal`.** Y encima es la doctrina del proyecto: dos testigos
coincidiendo.

### ⭐⭐ Y el positivo de control la tumbó

```
   parque                          rojas   MUNICIPAL         OSM     INTERSECCIÓN
   Parque Grande J. A. Labordeta     553   439 (79,4 %)   553 (100 %)   439 (79,4 %)
   ⛔ Parque del Agua Luis Buñuel     493     0 (0,0 %)   493 (100 %)     0 (0,0 %)
   Parque del Tío Jorge               79    75 (94,9 %)    79 (100 %)     75
   Anillo Verde Oliver                19     0 (0,0 %)    19 (100 %)      0
```

⛔⛔ **La intersección deja fuera el Parque del Agua entero.** 125 ha, el recinto de la Expo 2008, el
sitio más rojo del mapa y uno de los que Antonio nombró. ⇒ **estaba limpia porque no cogía casi nada
donde importa.**

⚠️ **Y el porqué, comprobado y no supuesto:** la capa municipal es `carto1000` de **2012**, y no es
que le falte el Parque del Agua del todo — **tiene 6 polígonos y 46,7 ha solapando su bbox**—, es que
**ninguno contiene ni uno de los 493 senderos**. Dibuja láminas de agua y parterres, no el recinto.
Y una intersección **hereda todos los agujeros de la capa más pobre**.

*(Positivo de control del propio test de solape: 1.235 polígonos municipales en total, 202 solapan un
bbox del centro. El test encuentra cosas.)*

### ⇒ Manda **OSM**

1. ⭐ **Recoge el 100 % de los cuatro parques de control.** Ninguna otra opción lo hace.
2. ⭐ **Es la única capa con nombre**: 199 polígonos nombrados contra **0** de la municipal. Un verde
   que se puede auditar preguntándole *«¿qué parque eres?»*.
3. ⚠️ **Se pierde el segundo testigo, y va dicho.** Pesa poco aquí porque **esto no cambia ningún
   nombre**: una línea con nombre sigue azul pase lo que pase.
4. ⛔ **La unión se descarta**: añade 1.825 líneas que solo ve una capa anónima de 2012, y sube las
   `acera` de 114 a 373.

---

## 2 · ⭐ EL LISTÓN DE TAMAÑO — 1 ha

Medido en la tanda 27 §C3: los jardincillos de menos de 2.000 m² aportan **56 líneas y 772 metros**
—nada— y el 97 % de los metros está en parques de 1 ha para arriba.

⚠️ **La elección del corte es mía**, y por eso va la curva entera arriba. Lo que hace medible:

```
   con OSM:   sin filtro 4405 · 160,72 km   →   ⭐ ≥ 1 ha 3792 · 145,34 km   (−14 %)
   rojas pegadas al borde:  12,3 %  →  8,8 %
```

⇒ Se pierde un 14 % de cobertura y se baja el riesgo de borde en tres puntos y medio. Y sobre todo:
**un jardín entre dos bloques es justo donde la acera que lo cruza SÍ puede ser de la calle.**

---

## 3 · ⚠️ EL CRITERIO DE «DENTRO» — los cinco puntos

Los **mismos cinco puntos** de `calle-pegada.js` (10 · 30 · 50 · 70 · 90 % de la longitud) y **los
cinco dentro**. ⛔ Heredado de otra pregunta (ley 17), no elegido para que salga bien ésta.

```
   con OSM, listón ≥ 1 ha
   1 de 5 puntos dentro   →  (entrarían todas las que ROZAN el parque)
   ⭐ los 5 puntos dentro  →  3792 · 145,34 km
```

⭐ **El listón no es un detalle: es la separación entre el sendero interior y la acera del contorno.**
Con «basta rozar» entraría el paseo perimetral entero.

---

## 4 · ⚠️ EL ANILLO VERDE DE OLIVER — el contraejemplo, y qué pasa con él

En la tanda 27 lo señalé como el caso peligroso: **19 rojas contra 131 con nombre**, un polígono que
no es un parque sino una franja que envuelve calles del barrio.

**Con mi criterio ENTRA**, y hay que decirlo: OSM lo mete al 100 % (4,44 ha, por encima del listón).

⭐ **Pero ya no es el problema que era, y el porqué es la forma de esta tanda:** el verde es una
**variante del rojo**. Sus **131 líneas con nombre siguen azules** — a ninguna se le quita nada. Lo
único que se pinta de verde son sus **19 rojas, 148 metros**, y de ésas lo peor que puede pasar es
que el mapa diga «está en zona verde» de una acera que sí debería llevar el nombre del barrio.

⇒ **Es un error de explicación sobre 148 metros, no un error de dato sobre 131 calles.** Eso es
exactamente lo que se ganó al no pintarlas de gris.

---

## 5 · EL CUADRE — contra el motor, no contra el fichero

```
                            visor     arnés      dato
   AZULES · con nombre      51556     51556     51556   ✅
   ROJAS  · le falta        32258     32258     32258   ✅
   ⭐ VERDES · en zona verde  3792      3792      3792   ✅
   GRISES · no aplica       11168     11168     11168   ✅
   ⭐ suman                                     98774 de 98774   ✅
```

⚠️ Esos tres contadores **leen la misma fuente**, así que no son tres testigos (ley 55). El que vale
es el de abajo.

### ⭐⭐ La comprobación que hace que el verde no pueda esconder nada

**El verde se colapsa a rojo antes de comparar con el motor.** Para el motor el verde no existe —esas
líneas siguen sin nombre—, así que si el mapa pintara de verde algo que el motor llama azul o gris,
saltaría aquí.

```
   líneas donde el color y el redactor NO coinciden        0   ✅

   ⭐⭐ y su ROJO, VISTO — tres veces:
      (a) el nombre por ARISTA (antes de la tanda 24)  11674   ✅ la caza
      (b) DOS categorías, con los pasos en el rojo      11168   ✅ la caza
      ⭐ (c) SIN colapsar el verde                       3792   ✅ hay verdes y se distinguen
             …y coincide exactamente con los verdes del dato: 3792 / 3792  ✅
```

⭐ La (c) es nueva y contesta a *«¿puede esto pasar sin que nada funcione?»*: si no hubiera ni un
verde, la comparación de arriba saldría verde **por vacío**. Al exigir que sin colapsar discrepe
**exactamente en los 3.792**, la comprobación deja de poder pasar por vacío.

Y en el exportador, la exigencia que protege la separación:

```
   sinNombre + enVerde === las que el MOTOR llama rojas    ✅
   ⇒ el verde SOLO puede salir de una roja. Si se comiera un azul o un gris, rojo.
```

### La contraprueba, con las cuatro

```
   dato                                azules     rojas    verdes    grises
   real                                 51556     32258      3792     11168
   real + 1 línea ROJA inventada        51556     32259      3792     11168
   real otra vez (la falsa quitada)     51556     32258      3792     11168

   ⭐ una falsa CON nombre → azul                 ✅ +1 en su montón, los otros tres igual
   ⭐ una falsa de PASO DE PEATONES → gris        ✅ +1 en su montón, los otros tres igual
   ⭐ una falsa DENTRO DE ZONA VERDE → verde      ✅ +1 en su montón, los otros tres igual
```

---

## LAS SIETE RUTAS

**Idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 · 2528,9) y contra lo
publicado en la tanda 16. ⭐ **Y tenían que serlo**: esto es solo color. El modelo, el texto y
`sinNombrePorDefinicion()` salen de esta tanda byte a byte como entraron.

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que la intersección de las dos capas fuera la buena** — **no**: 0 de 493 en el Parque del Agua.
- **Que el verde se comiera algún azul o algún gris** — **0**, exigido en el exportador.
- **Que la comprobación contra el motor pasara por vacío** — **no**: sin colapsar el verde discrepa
  en exactamente 3.792.
- **Que alguna ruta se moviera** — **no**: las siete al milímetro.

## LO QUE NO SE HA COMPROBADO

- **Que los polígonos de OSM estén bien dibujados.** Es un testigo, no dos, y va declarado.
- **Que el verde se vea bien** junto al rojo y sobre el fondo de OSM. Eso lo dice un ojo delante del
  navegador, y no lo tengo.
- **Cuántas de las 3.792 verdes son de verdad senderos** y cuántas aceras del contorno. La señal de
  borde acota (8,8 % a menos de 5 m); no lo resuelve.
- **Miralbueno y Parque Venecia**: siguen sin polígono nombrado en ninguna fuente.

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **El 8,8 % de verdes a menos de 5 m del borde** | acotado, no resuelto |
| 2 | **La capa municipal no cubre el Parque del Agua** | medido; ⛔ no se usa, y se dice por qué |
| 3 | **Las 29 escaleras que unen dos calles distintas** (tanda 26) | sigue abierto |
| 4 | **365 `cycleway` con el nombre de la avenida paralela** (tanda 17) | sigue abierto |
| 5 | **El falso positivo del hook con `--amend`** (tanda 26) | reportado, sin tocar |
