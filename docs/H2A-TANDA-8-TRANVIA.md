# H2a · Tanda 8 — el tranvía, y el examen del modelo

**Fecha:** 11/08/2026 · **Base:** `d8d055f` · **La última de H2a.**

**⭐⭐⭐ VEREDICTO EN UNA LÍNEA: el modelo aguantó estructuralmente —CERO `if (esTranvia)`, el modo
pasó a ser un parámetro— pero produce una LECTURA FALSA para el tranvía, y la causa es `D1`. Se
reporta y no se arregla: agrupar andenes es decisión de Antonio.**

---

## §1 · ⭐⭐⭐ EL COSTE MEDIDO — «casi gratis» como número

```
   ficheros tocados ......... 2 de código  (tools/gtfs/red-bus.js · tools/gtfs/enlaces.js) + .gitignore
   líneas en red-bus.js ..... +68 −22, de las cuales 35 son COMENTARIO ⇒ 33 de código
   campos nuevos en el modelo  0
   ⛔ `if` por modo nuevos ... 0
```

**El único `grep` que acierta con `esTranvia` en todo el repositorio es mi propio comentario diciendo
que no hay ninguno** (`tools/gtfs/red-bus.js:36`).

⚠️ **Y el único `if` por modo que existe en el proyecto ya estaba, y es de una línea:**
`tools/gtfs/feed.js:126` — `modo.set(s.stop_id, tipo === '900' ? 'tranvia' : 'bus')`. **No se ha
tocado.**

### 1.1 · Cómo entró: el modo es un parámetro, y lo que sabe cada modo es DATO

`const TIPO_BUS = '704'` incrustado pasa a una **tabla `MODOS`** con lo que cada modo sabe de sí
mismo (sus zombis, sus terminales condicionales). ⛔ **Una rama por modo se multiplica con cada modo
nuevo; una fila de tabla, no.**

### 1.2 · ⭐ El bus no se movió: el sha del artefacto es el mismo

```
   sha256 del artefacto de bus, antes y después ... d883310a3fce0e16cea5b7c3c0695c12   ✅ idéntico
```

Solo cambian **dos líneas de TEXTO**, y las dos a propósito: el relleno de puntos del rótulo, y el
mensaje de las zombis —que decía *«las mismas ocho»* y **con el tranvía afirmaba ocho donde hay
cero**—.

### 1.3 · ⚠️ La deuda que se acepta: el fichero sigue llamándose `red-bus.js`

Renombrarlo **falsificaría las rutas citadas en `docs/H2A-RED-DE-BUS-Y-VEREDICTO.md` y en
`docs/H2A-PUERTA-3-LOS-LIMITES.md`**, que son registro histórico y no se reescriben. *Una ruta de
fichero es una afirmación (ley 140), también hacia atrás.*

---

## §2 · La red del tranvía

```
   rutas de route_type 900 .................. 1
   zombis ................................... 0   (y se exige que siga en cero)
   sentidos ................................. 2
   viajes que los sostienen ................. 5.107
   paradas usadas ........................... 50
   paradas con poste ........................ 0     ⭐ y es CORRECTO: D1 funcionando
   artefacto ................................ 9,3 KB · gzip 2,2 KB
```

⭐ **Las 0 paradas con poste son el modelo acertando**, no fallando: `identidad.js` sabe que el
`stop_code` de Avanza es `PA` + cinco cifras, y el tranvía usa cuatro. **Le dice «no tiene poste» y
eso es la verdad.**

---

## §3 · ⛔⛔⛔ EL HALLAZGO — el «terminal variable» del tranvía no existe

El sentido `dir=1` salió así:

```
   terminal mayoritario  0102  cuota 0,477     ⬅ el «mayoritario» NO llega al 50 %
   segundo               0101  cuota 0,425
   los dos se llaman ..... "Avenida de la Academia"
   distancia entre ellos . 2,1 METROS
```

**No son dos terminales: son los dos andenes del mismo final de línea.** Y es sistemático:

```
   TRANVÍA   50 paradas · 33 nombres · 17 pares homónimos · 15 a MENOS de 15 m
             distancia entre homónimas: mín 2,1 · p50 8,3 · máx 66,4 m
   BUS      934 paradas · 911 nombres · 26 pares homónimos · 1 a menos de 15 m
             distancia entre homónimas: mín 13,7 · p50 59,5 m   ⇒ son dos ACERAS, sitios distintos
   parent_station relleno ... 0 de 984   ⛔ EN NINGUNA
```

⇒ **En el tranvía, 30 de 50 paradas son 15 parejas de andenes del mismo sitio. En el bus es 1 caso
de 934.** No es una diferencia de grado: es de estructura.

### 3.1 · Dónde muerde, medido

**170 de los 272 enlaces bus↔tranvía (62,5 %) tienen como punta de tranvía un andén con gemelo a
menos de 15 m.** ⇒ Quien esté junto a una parada de tranvía **ve el enlace duplicado**: dos entradas
para el mismo sitio.

### 3.2 · ⛔ Y esto es una decisión de diseño, no un arreglo

`D1` dice **la identidad es el `stop_id`**. El feed **no trae `parent_station` en ninguna de las 984
paradas**, así que no hay forma declarada de saber que `0101` y `0102` son el mismo sitio. Agruparlos
significaría **inventar una regla de agrupación por proximidad y nombre**, y eso:

- cambia qué es «una parada» para todo H2a;
- puede fusionar dos paradas de bus enfrentadas que **sí** son sitios distintos;
- y **movería los 272 enlaces**.

⇒ **PARA Y AVISA.** No se toca. Las tres salidas posibles —dejarlo, agrupar por proximidad+nombre, o
declarar el duplicado como marca— **las decide Antonio**.

---

## §4 · Las dos de Juslibol, que tenían que salir y salen

```
   sinEnlaces .......... 172 paradas, cada una con code, nombre, modo y motivo
   ¿están las dos de Juslibol? ..... "0301" y "0302", modo tranvia   ✅ SÍ
```

⭐ **No desaparecen: salen declaradas.** Están a **418 m** del bus más cercano, fuera del radio de
300 m, y el artefacto lo dice con su motivo. ⛔ **`tranvía × tranvía` no se calcula y también se
dice**: una sola línea no transborda consigo misma.

---

## §5 · ⭐⭐ Los seis límites, releídos DEL FICHERO

La Puerta 3 los dejó probados **sobre el objeto en memoria**. `JSON.stringify` se come `undefined`,
las funciones, los `Map` y los `Set` **sin decir ni pío**. ⇒ Se reescriben y **se releen del disco**:

```
   L1  sinEnlaces con las 172, cada una con code y motivo              ✅ sí
   L2  la leyenda cubre todo valor emitido, y separa saber de ignorar  ✅ sí
   L3  cobertura: periodo, aviso, PA00617 y las 8 líneas fuera         ✅ sí
   L4  NO vive aquí — vive en el artefacto de la red                   ✅ sí
   L5  feed con version, fin, atribución y la marca de PROCESADO       ✅ sí
   L6  ni una promesa en el texto del fichero escrito                  ✅ sí
   ⇒ 6 de 6                      ⭐ provocado: se quita feed.procesado ⇒ ✅ lo caza
```

⭐ **Y el bloque `vigencia` entra**, con la regla y **sin hornear el estado** (ley 165).

### 5.1 · ⛔ Lo que NO sobrevivió fue la MEDIDA DEL TAMAÑO

```
   tamaño en disco · en memoria     494,7 KB · 491,4 KB   ⚠️ NO coinciden
```

**`enlaces.js` medía con `json.length` —caracteres UTF-16— y lo llamaba KB.** Cada tilde y cada `⛔`
del artefacto cuesta más bytes que caracteres, **y el artefacto lleva mucho texto de avisos desde la
Puerta 3**. ⇒ **Los 471,7 KB de la Puerta 2 y los 491,1 de la Puerta 3 están en caracteres.**
`red-bus.js` lo hacía bien desde H2·6 con `Buffer.byteLength`, **y las dos cifras se sumaron en el
mismo informe**. Bitácora nº195.

---

## §6 · El tamaño real, en bytes y en disco

```
   la red de bus ............ 200,9 KB  ·  gzip 42,0 KB
   la red de tranvía .........  9,3 KB  ·  gzip  2,2 KB
   los enlaces (en disco) ... 494,7 KB  ·  gzip 82,4 KB
   ─────────────────────────────────────────────────────
   TOTAL .................... 704,9 KB  ·  gzip 126,6 KB
   ⭐ sin dibujar los enlaces  477,3 KB  ·  gzip  70,1 KB
```

⚠️ **Y este número NO decide el stack.** El motor necesita el **grafo peatonal de 68.649 nodos en
ejecución** para el primer y el último tramo, y ése es el que manda. 126 KB de red no dicen nada
sobre si hace falta Node.

---

## §7 · El cierre de H2a — qué queda abierto

| | qué | dónde salió |
|---|---|---|
| ⛔⛔ | **Los andenes gemelos del tranvía**: 15 parejas a <15 m, 170 de 272 enlaces afectados. **Decisión de Antonio** | esta tanda §3 |
| ⛔ | **193 de 324 enlaces sin examinar** el lado — hace falta otro testigo | Puerta 1 |
| ⚠️ | **El listón de cobertura** `≥4 portales · 75 %`: mueve 1.456 `no-consta`. **Decisión de Antonio** | Puerta 1 |
| ⚠️ | **Los 2 `cambia-sin-paso`** sin mirar sobre el mapa | Puerta 2 |
| ⚠️ | **L2 sin guardián de valores**, solo de leyenda | Puerta 3 |
| ⚠️ | **El descargador y el lector de ZIP sin control** hasta que haya un segundo feed | Tanda 9 |
| ⚠️ | **El listón de 30 días de `se-acaba`**: decidido, no medido | Tanda 9 |
| ⚠️ | **`red-bus.js` con nombre caducado**, y no se renombra por ley 140 | esta tanda §1.3 |
| ⏳ | **El feed caduca el 05/10/2026** — quedan 55 días | Tanda 9 |

---

## §8 · ⚠️ Qué clase de fallo NO podría haber cazado esta tanda

- **Nada sobre los horarios.** El tranvía entra sin reloj, como el bus: `stop_times` solo da
  secuencias. Si las horas del tranvía fueran absurdas, aquí no se vería.
- **Nada sobre si la secuencia de 25 paradas es la correcta sobre el terreno.** Se deriva del viaje
  mayoritario y **nadie la ha mirado en un mapa** — y con el 47,7 % de «mayoritario», esa secuencia
  cubre menos de la mitad de los viajes.
- **Nada sobre el trazado.** `shapes.txt` no entra en esta tanda.
- **Nada que solo se vea con un segundo feed**: la estabilidad de los `stop_id`, la fecha congelada
  de `routes.txt`.

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **El modelo aguantó: 0 `if` por modo, 0 campos nuevos, 33 líneas de código.** El bus salió
   con el sha idéntico. **«Casi gratis» era cierto — estructuralmente.**
2. ⛔⛔⛔ **Y aun así produce una lectura falsa: el «terminal variable» del tranvía al 42,5 % son dos
   andenes a 2,1 m.** 15 parejas de 17, **170 de 272 enlaces afectados**, y `parent_station` vacío en
   las 984 paradas. **Decisión de Antonio.**
3. ⛔ **Escribí «cero medido» del tranvía antes de medir** (bitácora nº194). Ley nueva: *un guardián
   que recorre una lista declarada vigila la lista, no el caso que falta en ella.*
4. ⛔ **El tamaño del artefacto estaba en caracteres, no en bytes** (bitácora nº195). Ley nueva: *una
   cifra que va a decidir algo se mide sobre el artefacto ESCRITO.*
5. ⭐⭐ **Los seis límites sobreviven al disco, 6 de 6**, releídos del fichero y con provocación.
6. ⭐ **Total en disco: 704,9 KB · 126,6 KB gzip** (477,3 / 70,1 sin las listas de aristas).

---

**Instrumentos:** [`tools/gtfs/red-bus.js`](../tools/gtfs/red-bus.js) ·
[`tools/gtfs/enlaces.js`](../tools/gtfs/enlaces.js) · **Bitácora:** nº194 y nº195.
