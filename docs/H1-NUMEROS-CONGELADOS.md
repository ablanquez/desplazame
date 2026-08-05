# H1 · LOS NÚMEROS CONGELADOS

*Tanda 30 · 2026-08-05 · sale del agujero que encontró la auditoría de la tanda 29: el reparto
publicado del mapa no estaba protegido por nada.*

> **Este documento se AÑADE, no reescribe nada.** No corrige ningún número: los congela.

```
node src/numeros-congelados.js                 # la tabla + la contraprueba  (~95 s)
node src/numeros-congelados.js --contraprueba  # solo §B
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ 20 números publicados congelados** | Y una comprobación que **para en rojo diciendo qué esperaba y qué salió**. Los 20 reproducen hoy: **20 de 20 ✅**. |
| **⛔⛔ antes de hoy había UNO** | `PUBLICADOS` en `src/modelo-rutas.js:49` — los metros de las siete rutas. **Uno, en todo el repositorio.** Todo lo demás se recalculaba y se imprimía. |
| **⭐⭐ la contraprueba: 2 roturas de 2 cazadas** | Se rompe `sinNombrePorDefinicion()` de dos maneras distintas y el guardián salta las dos veces, con la mutación comprobada, el reloj comprobado y el rojo nombrando la fila que toca. |
| **⭐⭐⭐ y la rotura pequeña es la que importa** | Quitar `traffic_island` mueve **674 aristas de 98.774 — un 0,7 %** — y deja el mapa en **51.977 / 32.507 / 10.494**, que es *literalmente el reparto que estuvo publicado el día antes* (`H1-PASOS-DE-CEBRA.md`). Antes de hoy eso no lo veía nadie. |
| **⚠️⚠️ y sí, hay otro número publicado ya caducado** | Los **3.166 portales** colgando de una línea sin nombre (tanda 21) hoy son **2.667**. Cuatro tandas de nombres han pasado por encima y **nadie se enteró**. ⛔ No se congela: se reporta. |
| **⭐ un cero congelado, con su positivo al lado** | «la capa municipal tiene **0** polígonos con nombre» va congelado junto a «OSM tiene **199**» — la misma pregunta, dos capas. Un cero solo no prueba nada. |
| **⛔ lo que sale mal (mío)** | Cuatro entradas: nº119 (**el guardián nuevo dio cuatro rojos en su primer arranque y los cuatro eran suyos**), nº120 (medí «nodos» de un sitio que dice 68.787), nº121 (medí el «antes» con la pregunta de hoy y salió clavado al ahora) y nº122 (**di la batería por corrida cuando no había barrido ni un fichero**). |

---

## POR QUÉ — el agujero, tal como se vio

La tanda 29 rompió `sinNombrePorDefinicion()` desde fuera. `exportar-nombre-simple.js` terminó en
**código 0 con sus nueve cuadres en ✅**:

```
   AZULES 56.864 ✅   ROJAS 38.093 ✅   VERDES 3.817 ✅   GRISES 0 ✅   suman 98.774 ✅
```

**Cero grises, y todo verde.** El reparto publicado —51.556 / 32.258 / 3.792 / 11.168— cambiaba
entero sin que saltara nada.

⭐ **Y el motivo no es un descuido.** Los cuadres de allí comprueban **coherencia**, no **valor**: «el
exportado coincide con lo que dice el redactor» es cierto se muevan como se muevan los cuatro
números, porque **el color LO DECIDE el redactor**. Eso es la garantía, y el fichero lo dice de sí
mismo. Lo que faltaba era otra cosa: **un testigo que sepa cuánto valían ayer.**

⇒ Es la **séptima forma de mentir** que salió de aquella tanda: *la comprobación distingue los
extremos y no el medio*. Un exportador que revienta se caza solo; uno que sigue exportando un reparto
distinto, no.

---

## A · QUÉ SE CONGELA

### A1 · La tabla — 20 números, y los 20 reproducen

```
   número                       publicado           hoy
   dato.sello              2026-08-03T08:19:51Z  2026-08-03T08:19:51Z   ✅

   grafo.nodos                     68.649        68.649   ✅
   grafo.aristas                   98.774        98.774   ✅
   grafo.componentes                  170           170   ✅
   grafo.aristasAPie               94.570        94.570   ✅
   grafo.vertices                 378.222       378.222   ✅
   grafo.km                       6499,98       6499,98   ✅

   ⭐ mapa.azules                   51.556        51.556   ✅
   ⭐ mapa.rojas                    32.258        32.258   ✅
   ⭐ mapa.verdes                     3792          3792   ✅
   ⭐ mapa.grises                   11.168        11.168   ✅
   mapa.rojasMotor                 36.050        36.050   ✅

   verde.sinListon                   4405          4405   ✅
   mapa.verdesKm                   145,34        145,34   ✅
   verde.osmNombrados                 199           199   ✅
   verde.municipalNombrados             0             0   ✅
   verde.municipalPolis              1235          1235   ✅

   pasos.deOsm                       1153          1153   ✅
   pasos.deducidos                   4155          4155   ✅
   mapa.azulesConPasos             56.864        56.864   ✅
```

⭐ **Cada fila lleva su documento y la afirmación que sostiene**, en el propio código. Sin esas dos
columnas un número congelado es una constante mágica, y la siguiente persona que la vea roja no sabrá
si toca arreglarla o entenderla.

⚠️ **Que salgan los 20 no es una sorpresa: esta tanda no toca un solo fichero de producción.** Lo que
prueba es que las medidas apuntan a lo que apuntaba el informe — que es justo lo que fallaba en dos
de ellas cuando arrancó (nº120 y nº121).

### A2 · ⭐⭐ Las tres parejas que hacen que esto vigile una DECISIÓN y no solo un número

```
   3.792 con listón   ·   4.405 sin listón       ⇒ el listón de 1 ha (tanda 28)
   199 con nombre     ·   0 con nombre           ⇒ «OSM es la única capa con nombre»
   51.556 ahora       ·   56.864 antes           ⇒ «un paso de cebra no tiene nombre» (tanda 26)
```

⭐ Un número suelto se puede mover con la excusa de que «el dato cambió». **Una pareja no**: para que
la pareja siga cuadrando hay que mover las dos, y eso ya no pasa por descuido.

⭐⭐ Y el `0` de la capa municipal es un **cero publicado**, que en este proyecto exige positivo de
control (regla 2 de `CLAUDE.md`). El positivo va congelado en la fila de encima: **es la misma
pregunta —`.nombre`— sobre las dos capas**. Si el lector de la municipal se rompiera y dejara de
traer nombres, el cero seguiría saliendo y no probaría nada; con el 199 y los 1.235 polígonos al
lado, no puede degenerar en silencio.

### A3 · ⭐⭐⭐ Cada fila ha visto su rojo — hoy, en esta ejecución

La tanda 29 censó **198 comprobaciones** y solo diez habían visto su rojo alguna vez. Aquí no hace
falta esperar a una auditoría: en cada ejecución se le mueve el número a **cada fila, una a una**, y
se exige que se ponga roja.

```
   filas que NO se ponen rojas al moverles el número      0   ✅ las 20, una a una
   ⚠️ filas que arrastran a OTRA al moverlas (no separan)  0   ✅
   ⚠️ rojos que no dicen qué esperaban y qué salió         0   ✅
   ⭐ y el control NEGATIVO: sin mover nada, ¿inventa rojos?    ✅ ninguno
```

⚠️ **Ese control corre contra una base sintética —los valores congelados— y no contra la medida de
hoy**, y no es un detalle: la primera versión usaba la medida real y **declaró ciegas las diecisiete
filas** en cuanto hubo dos derivas de verdad (nº119). Un control de instrumento se corre con entrada
limpia. Que la MEDIDA sea de verdad lo prueba §B, que es otra cosa.

⭐ Y el control **negativo** está escrito con `A.exige`, igual que el positivo — nº116, que se cazó
justo por lo contrario.

### A4 · Que esto no pueda pasar por vacío

```
   números congelados en la TABLA                        20   ✅
   números que `medir()` devuelve                        20
   ⛔ medidos que NADIE congela (se perderían en silencio) 0   ✅
```

⚠️ **Y una comprobación de cardinalidad no dice nada del contenido**, dicho aquí porque me pilló:
«20 congelados y 20 medidos ✅» convive tan tranquila con dos filas midiendo otra cosa. Eso lo cierra
§B, no esto.

---

## B · ⭐⭐⭐ LA CONTRAPRUEBA — se rompe el motor y se mira si canta

⛔ Sin esto, §A es una tabla bonita. *«El instrumento arranca» no es «el instrumento mide»* — la ley
que salió del nº117, donde cinco de diez mutaciones no llegaron a ocurrir y salían publicadas como
guardianes muertos.

**Dos roturas distintas, no una**, porque una comprobación que caza un fallo concreto puede ser ciega
a los demás. Las dos sobre `sinNombrePorDefinicion()`, desde fuera, reescribiendo el **fuente** antes
de compilarlo — ⛔ no se toca una línea de producción.

```
   B0 · ¿ESTÁ CONECTADA LA PALANCA?                       ✅ sí
   B1 · LA LÍNEA BASE, sin mutar                          código 0   22,2 s   ✅ verde
        ⭐ el hijo NO repite la contraprueba (corte `CONG_HIJO`)      ✅
```

### R1 · EL COLAPSO — `sinNombrePorDefinicion()` → `return false`

*La rotura exacta de la tanda 29: la que salió en código 0 con nueve ✅ y cero grises.*

```
   1 · ¿la mutación OCURRIÓ? (parches sobre el fuente)     1   ✅ sí
   2 · ¿el reloj es el normal? (base 22,2 s)          22,4 s   ✅
   3 · ¿el guardián SALTA?                     código 1 · 9 rojos   ✅ SÍ
   4 · ¿es SU rojo? (nombra mapa.grises, mapa.azules)  2 de 2   ✅
```

### R2 · LA DERIVA — se quita `traffic_island` de la lista

*674 aristas de 98.774: un 0,7 %. **Ésta es la que importa**, porque una deriva pequeña es lo que un
cuadre por construcción no puede ver jamás.*

```
   1 · ¿la mutación OCURRIÓ? (parches sobre el fuente)     1   ✅ sí
   2 · ¿el reloj es el normal? (base 22,2 s)          22,7 s   ✅
   3 · ¿el guardián SALTA?                     código 1 · 9 rojos   ✅ SÍ
   4 · ¿es SU rojo? (nombra mapa.grises)               1 de 1   ✅

   ⭐⭐ roturas CAZADAS                                 2 de 2   ✅
```

⚠️ **Y una costura que se comprobó porque casi muerde:** este script imprime los rojos de sus hijos y
**termina en 0** —tiene que hacerlo, ha salido bien—. `probar-paradas.js` da por roto cualquier script
cuya salida lleve la marca `⛔ FALLO ·` **y termine en 0**. Se comprobó que la salida no la lleva
(`grep -c` → **0**) y queda dicho en el código, porque imprimir el rojo del hijo tal cual pondría roja
**la batería entera** por una comprobación que funciona bien.

### ⭐⭐ El texto del rojo, tal como lo vería quien se lo encuentre

```
   ⛔ mapa.grises: se publicó 11.168 y ahora sale 0  (-11.168)
      ⇒ docs/H1-VERDE.md §0 y §5 · sostiene: ⭐ el reparto publicado del mapa —
        las que no tienen nombre NI DEBEN

   ⛔ mapa.grises: se publicó 11.168 y ahora sale 10.494  (-674)
      ⇒ docs/H1-VERDE.md §0 y §5 · sostiene: ⭐ el reparto publicado del mapa —
        las que no tienen nombre NI DEBEN
```

⭐ **Qué esperaba, qué salió, cuánto se movió, dónde está publicado y qué se cae si es verdad.** Un
«falló» a secas obliga a reconstruir a mano lo que el guardián ya sabía.

### ⭐⭐⭐ Y lo que de verdad enseña la rotura pequeña

El colapso deja el mapa en **56.864 / 38.093 / 3.817 / 0** — números absurdos, que cualquiera vería.
La deriva lo deja en:

```
   51.977 azules · 32.507 rojas · 10.494 grises
```

⚠️ **Eso no es un número absurdo: es el reparto que estuvo PUBLICADO el día antes**, en
`docs/H1-PASOS-DE-CEBRA.md` §0 —51.977 / 36.303 / 10.494—, antes de que la tanda 27 metiera las
isletas. ⇒ **la rotura pequeña no inventa un estado imposible: devuelve el proyecto a un estado
anterior real, y hasta hoy nada lo habría dicho.** Ése es el modo de fallo que este guardián existe
para cazar.

---

## C · ⚠️ UN NÚMERO CONGELADO ENVEJECE — y actualizarlo es una DECISIÓN

El día que algo cambie **a propósito**, esto se pondrá rojo. **Eso no es un defecto: es el objetivo.**
Que nadie pueda cambiar un número publicado sin enterarse.

⛔ **El orden, y no otro** (está escrito también en la cabecera del fichero, que es donde lo va a leer
quien se encuentre el rojo):

1. ⭐ **Entender por qué se movió.** Si no se sabe, no se toca: un rojo que no se entiende es un
   hallazgo, no una molestia.
2. **Publicar el número nuevo** en un documento de `docs/` que diga a qué valor sustituye y por qué.
   Los informes de este proyecto **se añaden, no se reescriben**.
3. **Y ENTONCES** cambiar el `valor` en la tabla, y apuntar en `fuente` el documento **nuevo**.

⛔ Cambiar el `valor` sin el paso 2 es borrar la historia y dejar el guardián apuntando a un documento
que ya no dice eso. **Es peor que no tenerlo: parece que vigila.**

---

## D · ⚠️⚠️ QUÉ MÁS ESTÁ DESNUDO — lo que se vino a buscar

### D1 · ⛔⛔ Antes de hoy, el repositorio tenía UN número congelado

```
   grep de los números publicados dentro de src/
   → src/modelo-rutas.js:49   const PUBLICADOS = { 1: 3086.9, 2: 598.1, … }
   (el resto de coincidencias son `1048576`, o sea bytes a MB)
```

**Uno.** Los metros de las siete rutas, y encima con la nota de que salen de la tanda 16 «escritos
antes de que esta tanda existiera» (ley 17). Todo lo demás —el reparto del mapa, el tamaño del grafo,
las coberturas— se recalculaba, se imprimía y **no se comparaba con nada**.

### D2 · ⚠️⚠️ Un número publicado que YA había caducado, y nadie se enteró

```
   portales colgando de una línea SIN nombre
   publicado (tanda 21, docs/H1-NOMBRES-Y-PASOS.md §0)     3.166
   ⚠️ hoy                                                   2.667
```

La tanda 21 publicó «**8.576 puertas ganan calle**: de 11.742 a 3.166». Después llegaron la 25 (la
calle pegada, +511 puertas), la 26 y la 27. **El titular sigue escrito con el 3.166 y hoy son 2.667.**

⛔ **No se congela el 3.166**: sería clavar un guardián en rojo permanente contra un número que ya
caducó, y el rojo dejaría de significar nada en dos días. Lo que toca es **publicar el número nuevo**,
y eso lo decide Antonio. ⇒ queda como cabo, medido.

### D3 · Lo que se deja fuera, y por qué

| número | por qué NO se congela |
|---|---|
| **las siete rutas** (3086,9 · 598,1 · …) | **Ya estaban congeladas** en `modelo-rutas.js:49`. Duplicarlas aquí sería un segundo camino desde el mismo dato. |
| **el RADIO de 11 m** de `calle-pegada.js` | Ya está comparado **contra el dato** dentro de su propio script, y la tanda 29 le vio el rojo (mutación `geo-escalado`). Está protegido de verdad. |
| **99,4 % · 86,9 % · 93,4 % · 100 %** (acierto de los dos testigos, tanda 25) | ⚠️ **Sus guardianes vigilan el MECANISMO, no el VALOR**: las mutaciones de la tanda 29 los ponen rojos porque el método deja de producir ambiguas, no porque el porcentaje cambie. **Siguen desnudos como números.** ⇒ cabo abierto, y no es pequeño. |
| **8.576 puertas ganan calle** | Depende del 3.166 caducado (D2). No se congela un número apoyado en otro que hay que republicar. |
| **4.304 NOMBRADA · 161 AMBIGUA · 3.821 MUDA** (tanda 21) | No medidos aquí. Cabo. |
| **los metros por categoría** (3.052,13 km azules, 3.397,75 km rojas) | **Redundantes**: se mueven con los contadores, y `mapa.azules` salta antes. Se congela un solo par de metros, el del verde, porque es el que sostiene el listón. |
| **11.168 como «aristas etiquetadas»** (además de como «líneas grises») | Es el mismo número dos veces: `exportar-nombre-simple.js` ya exige la identidad **en las dos direcciones**. Congelarlo dos veces no añade un testigo. |
| **124 / 3.402 polígonos verdes de OSM** | ⛔ **No están publicados en ningún informe.** No hay nada que congelar: lo que sostiene la decisión del listón es la pareja 3.792 / 4.405, y ésa sí está. |

⭐ **Y una que se comprobó en vez de suponerse:** `H1-PARQUES.md` dice «1.175 filas» de la capa
municipal y `H1-VERDE.md` dice «1.235 polígonos». Parecía una contradicción. **No lo es**: son
`features` del GeoJSON contra polígonos después de desmontar los multipolígonos. Se congela el 1.235,
que es el que sostiene una afirmación.

---

## LAS SIETE RUTAS

**Idénticas al milímetro**, con y sin modelo, y contra lo publicado en la tanda 16:

```
   ruta   sin modelo   con modelo   aristas   idénticas   publicado tanda 16
      1       3086.9       3086.9       107      ✅          3086.9  ✅
      2        598.1        598.1        23      ✅           598.1  ✅
      3       3704.9       3704.9        94      ✅          3704.9  ✅
      4        505.9        505.9        26      ✅           505.9  ✅
      5        477.4        477.4        20      ✅           477.4  ✅
      6        523.4        523.4        19      ✅           523.4  ✅
      7       2528.9       2528.9        69      ✅          2528.9  ✅
```

⭐ **Y tenían que serlo**: esta tanda no toca ni un fichero de producción. El único cambio fuera del
fichero nuevo es una línea en `probar-modelo-obligatorio.js` para meter `numeros-congelados.js` en el
barrido del ciclo — **el mismo día que nace, no cuando falle** (la ley del nº109).

⚠️ `modelo-rutas.js` sigue saliendo en rojo por el **rojo vivo declarado** de San Juan de la Peña,
que es de la tanda 29 y **no se toca**: los cinco rojos vivos se deciden con Antonio.

## LA BATERÍA

`node src/probar-paradas.js --todo` — **48 scripts, invariante cumplido en los 48**, y
`numeros-congelados.js` entre ellos en código 0. Los siete que declaran fallo salen en código 1, que
es lo correcto: son los rojos vivos ya declarados.

⚠️ **Y la primera vez la corrí sin `--todo`**, salió verde en dos minutos **sin haber ejecutado ni un
script**, y lo cazó el reloj —no el ✅— aunque el propio programa lo dice por escrito en su P4
(bitácora nº122). Tercera vez que el reloj es el que avisa de que una comprobación no ha ocurrido.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que alguno de los 20 números publicados hubiera derivado** — **no**: los 20 reproducen. Los dos
  rojos del primer arranque eran míos, no del proyecto.
- **Que la contraprueba no saltara con alguna de las dos roturas** — **no**: 2 de 2, con la mutación
  comprobada y el reloj comprobado.
- **Que `H1-PARQUES` y `H1-VERDE` se contradijeran** en el número de polígonos municipales — **no**:
  son dos cosas distintas y las dos son ciertas.
- **Otro número congelado en el repositorio, además de las siete rutas** — **no hay ninguno.**

## LO QUE NO SE HA COMPROBADO

- **Que la tabla cubra los números que importan.** Cubre 20. Cuántos números publicados quedan sin
  congelar en los 33 documentos de `docs/` **NO CONSTA**: haría falta un censo de afirmaciones
  numéricas, y esta tanda no lo ha hecho. Lo que sí consta está en D3.
- **Que los 20 valores publicados fueran correctos el día que se publicaron.** Esto congela lo que
  dice el repositorio, no lo que dice Zaragoza. Si un número se publicó mal, se congela mal.
- **Que `medir()` no lea la `TABLA`.** No se puede comprobar desde dentro; se garantiza por
  construcción y **por §B**, que rompe el motor de verdad. Por eso §B corre en la ejecución normal y
  no detrás de una bandera.

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **Los 3.166 portales caducados** (hoy 2.667) | ⚠️ medido; hay que republicarlo, decide Antonio |
| 2 | **Los porcentajes de acierto de los dos testigos** siguen desnudos como valores | señalado en D3 |
| 3 | **El mecanismo de mutación, duplicado** con `auditoria-guardianes.js` | declarado; unificarlo obliga a tocar aquel fichero |
| 4 | **Los cinco rojos vivos de la tanda 29** | ⛔ intactos, se deciden uno a uno |
| 5 | **El guardián del nº105 §2**, que nunca pudo distinguir lo que dice | ⛔ intacto |
| 6 | **Las 182 líneas decorativas** del censo de la tanda 29 | ⛔ intactas, van aparte |
| 7 | **El hook y sus tres falsos positivos** | ⛔ propuesto, sin tocar |
| 8 | **365 `cycleway`** (tanda 17) · **29 escaleras** (tanda 26) | siguen abiertos |
