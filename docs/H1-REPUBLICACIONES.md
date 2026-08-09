# H1 · LAS REPUBLICACIONES

*Tanda 5 · 2026-08-09 · los números superados, publicados de hoy, con su puntero puesto.*

> **Este documento se AÑADE, no reescribe nada.** Ningún registro histórico se ha tocado:
> lo que dicen era verdad el día que se escribió. Aquí se dice lo que vale HOY y de qué
> comando sale.

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ cuántos son de verdad** | **22 pares** superado → vigente, en **103 líneas** de **17 documentos**. El «23» de los encargos venía de dos bloques distintos y **nadie los había contado juntos**: el bloque B listaba 13 filas por documento, B.2 tres divergencias, y las tandas 3 y 4 añadieron cuatro más. |
| **⭐ cuántos quedaban sin republicar al empezar** | **2** — la ruta 6 y `A·V3`. Los otros ya tenían dónde apuntar y solo les faltaba el puntero, que puso la tanda 3. |
| **⭐ cuántos ha encontrado esta tanda** | **3 nuevos**, que ninguna tabla tenía: `36.050`, y los `21 congelados` en dos redacciones. |
| **⛔ cuántos NO se han republicado** | **3 valores**, y no por descuido: **no son afirmaciones, son transcripciones**. §D. |
| **⛔ qué NO se ha tocado** | Ni un párrafo de ningún registro histórico, ni `data/pruebas/RUTAS-CONOCIDAS.md`, que es de Antonio. |

---

## A · LOS DOS QUE ESTABAN PENDIENTES

### A1 · ⭐⭐⭐ La ruta nº6: `412 m` → **`438 m`** sin nombre

**Dónde está publicado el viejo:** `docs/H1-DONDE-FALTA-EL-NOMBRE.md` §A6 ·
`docs/H1-MODELO-VIA-FORMA-PAPEL.md` §D4 · `docs/H1-NOMBRAR-ACERAS.md`.

**De qué instrumento sale el nuevo, y su comando:**

```
node src/donde-falta.js      # §A6 · la fila de la ruta 6
node src/modelo-rutas.js     # §D4 · la misma fila, resuelta por WAY
node src/latido.js           # los dos a la vez, contra lo publicado
```

⛔ **No se ha vuelto a medir para escribir esto.** El dato se ató el **8 de agosto**
(bitácora 171) y hoy, **9 de agosto**, el latido lo ha vuelto a leer solo y dice **438** por
los dos productores. **No se ha movido.**

⚠️ **Y NO ES UN NÚMERO QUE MINTIERA: es un número viejo cuyo contradictor llevaba dos días
muerto.** El 6 de agosto (`c6f7f41`) el proyecto decidió que la ruta nº1 no debe resolverse;
§A6 exigía siete rutas, dejó de poder medir e imprimió `NO CONSTA` hasta el 8. El 412 **fue
cierto** cuando se publicó: `docs/H1-MODELO-VIA-FORMA-PAPEL.md` §D4 lo publicó el 4 de
agosto a las 15:15:16 (`db563e4`) y ese día el motor daba 412.

⭐⭐ **La segunda diferencia, que es la que hay que leer y no el titular.** El mismo día, esa
ruta ganaba **221 m** de vía municipal —el 53,6 %— y **0 con asignación propia**. Hoy `§D4`
le da **438 m**, el **100 %**:

```
   4 de agosto     412 m sin nombre  ·  221 m ganan vía municipal (53,6 %)  ·  0 propios
   9 de agosto     438 m sin nombre  ·  438 m ganan vía municipal (100 %)
```

⇒ **Lo que se movió no es solo el reparto: es la proporción entera.** ⛔ Y esto se publica
como lo que es —una diferencia medida— **no como una explicación**: por qué pasó del 53,6 %
al 100 % no se ha investigado en esta tanda y **NO CONSTA**.

### A2 · `A·V3`: el método de portales, `16,9×` → **`21,3×` el azar**

**Dónde está publicado el viejo:** `docs/H1-PORTALES.md:323` — *«⇒ 16,9× el azar»*.

**Por qué se movió:** el centinela `99999` del callejero inflaba el universo. Con el
centinela apagado, la línea base buena pasa de 4,5 % a 3,6 % y el titular de 16,9× a 21,3×.
Medido por el bloque A de la auditoría (`docs/auditoriafinal/A-CODIGO-2026-08-06.md` §V3).

```
                                        hoy      limpio
   línea base buena (lado a cara o cruz)   4,5 %      3,6 %
   ⇒ el número publicado                  16,9×      21,3× el azar
```

⭐ **La dirección es conservadora: el método sale MEJOR limpio, no peor.** Y aun así el
número publicado no era el que salía del dato. ⚠️ La tanda 35 republicó el universo del
buscador y **no cubrió éste**: mismo centinela, otro consumidor.

---

## B · LOS `21 CONGELADOS` → **`26`**, y por qué son el superado más caro

Tres documentos —`H1-LISTONES.md:23`, `H1-PARIDAD.md:23`, `H1-ROJOS-CERRADOS.md:30`—
imprimen esto en su lista de comandos:

```
node src/numeros-congelados.js        # los 21 congelados
```

⛔⛔ **Eso no es una cifra en una tabla de resultados: es la anotación de un comando, escrita
en presente.** Quien la lea hoy ejecuta y ve **26**. Los demás superados hay que creérselos;
**éste el lector lo desmiente él solo en tres segundos.**

**El comando que da el número de hoy:**

```
node src/numeros-congelados.js       # 26 filas · exit 0 · 2 de 2 roturas cazadas
```

---

## C · EL INVENTARIO COMPLETO — los 22 pares

⛔ Esta tabla **no está escrita a mano**: sale de `src/superados.js`, que es donde vive la
tabla, y la columna «líneas» es **medida**, no declarada (ley 105).

| dice | hoy vale | líneas | qué mide | dónde se republica |
|---|---|---:|---|---|
| `51.556` | **51.493** | 8 | las líneas CON nombre del mapa | `docs/H1-ROJOS-CERRADOS.md §0` |
| `32.258` | **32.310** | 7 | las líneas rojas del mapa | `docs/H1-ROJOS-CERRADOS.md §0` |
| `3.792` | **3.803** | 10 | las rojas explicadas por zona verde | `docs/H1-ROJOS-CERRADOS.md §0` |
| `4.405` | **4.424** | 4 | las verdes SIN el listón de 1 ha | `docs/H1-ROJOS-CERRADOS.md §0` |
| `145,34` | **145,94** | 4 | los km de rojo explicados por zona verde | `docs/H1-ROJOS-CERRADOS.md §0` |
| `56.864` | **56.801** | 5 | las azules ANTES de la tanda 26 | `docs/H1-ROJOS-CERRADOS.md §0` |
| `53.078` | **56.801** | 0 | las azules antes de la tanda 26 — la versión falsa (nº111) | `docs/H1-ROJOS-CERRADOS.md §0` |
| `36.050` | **36.113** | 4 | las líneas a las que el motor les ve falta de nombre | `docs/H1-ROJOS-CERRADOS.md §0` |
| `21 congelados` | **26 congelados** | 4 | cuántos números vigila `numeros-congelados.js` | `docs/H1-REPUBLICACIONES.md §B` |
| `21 números congelados` | **26 números congelados** | 2 | cuántos números vigila `numeros-congelados.js` | `docs/H1-REPUBLICACIONES.md §B` |
| `11.742` | **2.669** | 10 | las puertas que cuelgan de una línea sin nombre | `docs/H1-ROJOS-CERRADOS.md §E1` |
| `3.166` | **2.669** | 10 | las puertas que cuelgan de una línea sin nombre | `docs/H1-ROJOS-CERRADOS.md §E1` |
| `150.947` | **51.065** | 1 | las direcciones pedibles del buscador | `docs/H1-TOPE-ADELANTO.md §B2` |
| `123.132` | **23.184** | 1 | los huecos del buscador | `docs/H1-TOPE-ADELANTO.md §B2` |
| `66.973` | **16.981** | 1 | las consultas que cambian de acera | `docs/H1-TOPE-ADELANTO.md §B2` |
| `31.411` | **4.562** | 6 | las consultas contestadas — con el dial inflado | `docs/H1-TOPE-ADELANTO.md §B2` |
| `6.421` | **4.562** | 2 | las consultas contestadas — con el listón de 100 m | `docs/H1-LISTON-50.md §D` |
| `2.982` | **2.138** | 2 | las sugerencias BUENAS a ≤ 20 m (nº142) | `docs/H1-TOPE-ADELANTO.md §A3` |
| `16,9` | **21,3** | 1 | las veces el azar de los portales como testigos | `docs/H1-REPUBLICACIONES.md §A2` |
| `182` | **232** | 9 | las líneas decorativas — un ⛔ impreso que no para nada | `docs/auditoriafinal/B2-CONTRASTE-2026-08-07.md §B2·V3` |
| `6 km/h` | **5,0 km/h** | 9 | la velocidad con la que se calculan los tiempos — era la de UNA persona | `docs/H1-VELOCIDAD-ESTANDAR.md §0` |
| `412` | **438** | 3 | los metros sin nombre de la ruta nº6 (§A6) | `docs/H1-REPUBLICACIONES.md §A1` |

**El comando que la produce y la vigila en las dos direcciones:**

```
node src/superados.js            # el guardián: D1, D2 y las vallas ```
node src/superados.js --censar    # las 103 líneas, una a una
node src/superados.js --marcar    # regenera las cabeceras de los 17 documentos
```

---

## D · ⛔ LOS QUE NO SE HAN REPUBLICADO, Y NO ES UN OLVIDO

**Tres valores que un barrido por cifra saca y que NO son superados:**

| valor | dónde | por qué NO se republica |
|---|---|---|
| `56 scripts` | `H1-PARIDAD.md` 435 · 450 · 467 | **Es una transcripción, no una afirmación.** «La batería recorrió los 56 scripts y salió en verde» es un hecho sobre una ejecución del 6 de agosto, y **sigue siendo cierto**. Marcarlo diría que aquella ejecución fue otra. |
| `4.055` | `H1-PARQUES.md` 34 · 185 · 258 · 288 | **Es otra magnitud**, no una versión vieja: las rojas de parque contadas con la capa municipal, frente a las 4.405 con OSM. El par vivo es `4.405 → 4.424`. |
| `45.597` | `H1-CALLE-PEGADA.md` 36 · 373 | **Es el «antes» de una transición narrada** —«45.597 → 56.864 azules»— y el propio documento discute de dónde sale. Un «antes» citado como antes no está superado: está contado. |

⭐⭐ **Y lo que esto enseña del mecanismo, que es lo que hay que llevarse:** `superados.js`
**no sabe distinguir una afirmación de una transcripción**. Encuentra la cifra; el juicio de
si el documento la está *afirmando hoy* o *narrando lo que pasó aquel día* **lo pone una
persona**, y por eso cada par lleva su recuento cerrado — para que ese juicio se haya
emitido una vez y quede grabado.

⛔ **Ninguno de los tres se ha marcado a mano ni se ha forzado.** Si el mecanismo no llega a
un caso, el caso se nombra; no se apaña.

---

## E · ⚠️ LO QUE ESTE DOCUMENTO NO PUEDE PROMETER

- **Que la lista esté completa.** Sale de juntar dos bloques de auditoría y cuatro tandas de
  arreglo. **Nadie ha barrido todo `docs/` buscando números que hayan envejecido sin que
  nadie lo notara** — para eso haría falta un censo, y el censo de este proyecto está
  declarado ciego a la mitad de lo congelado y a todos los ceros
  (`docs/H1-CENSO-DECLARADO.md`).
- **Que los valores de hoy sigan siendo los de mañana.** Para eso está `src/latido.js`, y
  vigila **4 números**, no 22.
- **Por qué la ruta 6 pasó del 53,6 % al 100 %** de vía municipal. **NO CONSTA**, y va
  escrito arriba en vez de rellenarse con lo que parezca.
