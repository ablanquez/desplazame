# H2a · EL ENGANCHE DE LAS PARADAS — la medición que podía tumbar D4

**Fecha: 10/08/2026** · H2a · tanda 5 · `004_DESPLÁZAME`
**Qué es:** el registro de cuatro medidas. ⛔ **No es un diseño: el diseño es
`docs/DISENO-H2A-RED.md`, y esta tanda venía a ver si aguanta.**

---

## §0 · LA RESPUESTA, PRIMERO

> ⭐⭐⭐ **SÍ. EL RADIO DE 300 m SOBREVIVE, Y CON MUCHO MARGEN.**
> Las paradas enganchan al grafo **mucho mejor que los portales**: mediana **2,2 m**, p99 **11,5 m**,
> máximo **23,7 m**. **Ninguna de las 984 pasa del aviso de 65 m de H1.** El error que el enganche
> mete en un par es **4,4 m típicos — el 1,5 % del radio**, y **47,4 m en el peor caso imaginable**.
> ⇒ **La aritmética de D4 no se rehace.**

⚠️ **Pero hay dos resultados que el diseño sí tiene que absorber**, y ninguno estaba previsto:

- ⛔ **456 de 984 paradas (46,3 %) enganchan a EJE DE CALZADA**, no a acera. Un enlace que salga de
  ahí **empieza en el centro de la calle**.
- ⭐ **3 paradas caen fuera de la componente mayor del grafo** — las tres de la Ctra. Castellón. ⇒
  **Habrá `SIN CAMINO`, y el cero que temía §4.4 del diseño no se da.**

---

## §1 · T1 · EL PUENTE DE IDENTIDAD, CON SU ROJO VISTO

**Implementado en `tools/gtfs/identidad.js`, exactamente como lo escribió §1.3 del diseño**
(ley 145: anclada, `\d{5}` exacto, `n<=0` fuera, y **NO TIENE ≠ error**).

### 1.1 · ⛔ EL ROJO — con la fórmula que 003 publica

```
   node tools/gtfs/probar-identidad.js --formula=003        ⇒  código de salida 1

   P1 · LAS 50 DEL TRANVÍA NO PUEDEN TENER NÚMERO DE POSTE
      con poste (deberían ser 0) ............... 50
         poste  1 ×24   "0101" Avenida de la Academia · "0201" Parque Goya · "0301" Juslibol …
         poste  2 ×22   "0102" Avenida de la Academia · "0202" Parque Goya · "0302" Juslibol …
         poste 22 ×2    "2322" La ventana indiscreta · "2422" Un americano en París
   P3 · DOS PARADAS NO PUEDEN COMPARTIR POSTE
      choques .................................. 47
   P4 · POSITIVO DE CONTROL
      6 de 12 casos fallan
   ⛔ 3 FALLO(S) DETECTADO(S) — el proceso NO puede terminar en verde.
```

⭐ **Y el rojo enseñó algo que la propuesta no había previsto:** la fórmula de 003 **tampoco recorta
espacios**. `" PA00669 "` le da `null` en vez de `669`. ⇒ Al escribir el caso de control esperando
que fuera trivial, **salió un séptimo defecto de la fórmula publicada** que nadie había nombrado.

### 1.2 · ✅ EL VERDE — con `/^PA(\d{5})$/`

```
   node tools/gtfs/probar-identidad.js                       ⇒  código de salida 0

   P1 · tranvía con poste ....... 0        P2 · bus con poste ....... 934 de 934
   P3 · choques ................. 0        P4 · los 12 casos ........ ✅
```

⭐ **Qué resultado haría fallar esta comprobación** (ley 147), que es lo que la convierte en una:
que una parada de tranvía reciba número, que el recuento deje de ser 934/50, o que dos paradas
compartan poste. **Las tres se han visto ocurrir**, no se prometen.

### 1.3 · La valla, y qué la sostiene

```
   grep -rn  "PA[0-9]" src/ | wc -l                       0
   grep -rln "PA[0-9]" tools/ --include=*.js              tools/gtfs/identidad.js
                                                          tools/gtfs/probar-identidad.js
   ⭐ POSITIVO DE CONTROL — el mismo grep donde el prefijo SÍ está:
   grep -rn "PA0" docs/RECONOCIMIENTO-H2-CABOS.md | wc -l      19
```

⛔ **Y la regla, corregida por la medida: son DOS ficheros, no uno.** Este documento decía
«`identidad.js` y solo ése» **antes de pasar el `grep`** — y es falso: `probar-identidad.js` lleva
`"PA00002"`, `"PA01183"` y ocho casos más en su tabla de control.

⭐ **Que es como tiene que ser, y por eso la regla se enuncia bien en vez de forzar el código:**
*el prefijo puede aparecer en el fichero que lo define y en el que lo prueba, y en ningún otro
sitio.* **Una prueba de un formato tiene que contener ejemplos del formato**; obligarla a
esconderlos la dejaría probando algo que no se ve. Lo que se vigila es que **no aparezca en `src/`
ni en el resto de `tools/`**, y ahí sí es 0. (Bitácora 183.)

⚠️ **Y la fórmula mala vive dentro de `identidad.js`, exportada a propósito**, porque
`probar-identidad.js` la necesita para demostrar que sabe ponerse roja. **Un guardián cuyo rojo
nadie ha provocado es una promesa, no una red.**

---

## §2 · T2 · EL ENGANCHE DE LAS 984 — la distribución, no la media

### 2.1 · ⭐⭐ El positivo de control, primero. Sin él nada de esto vale

`tools/grafo/enganche-paradas.js` mide **también** una muestra de portales **con el mismo
instrumento**, porque H1 tiene publicado su p99 y es el único contraste posible.

```
   portales del callejero ....... 46.150     muestra determinista (1 de cada 20) ... 2.308
   p99 medido ................... 65,4 m
   publicado por H1 (src/ruta.js:151) ...... 65 m        desvío 0,4 m     ✅
```

⇒ **El instrumento reproduce una medida conocida que no ha visto.** ⛔ Y si no la reprodujera, el
script **para en rojo**: la tolerancia son 10 m y está en `A.exige`, no en un comentario.

⚠️ **La muestra es 1 de cada 20 y determinista, no aleatoria.** Una medición que cambia de valor
entre ejecuciones no se puede comparar con la de mañana.

### 2.2 · Las cuatro distribuciones

```
   población                      n      mín      p50      p75      p90      p95      p99       máx
   ────────────────────────────────────────────────────────────────────────────────────────────────
   PORTALES (control)          2308      0.2      5.3      8.5     17.4     27.7     65.4     195.8
   PARADAS · bus                934      0.0      2.2      5.0      7.3      8.3     11.1      23.7
   PARADAS · tranvía             50      0.0      2.6      5.5      9.6     12.4     16.2      16.2
   PARADAS · las 984            984      0.0      2.2      5.1      7.4      8.5     11.5      23.7
```

⭐⭐⭐ **Las paradas enganchan un orden de magnitud mejor que los portales.** p99 de **11,5 m**
contra **65,4 m**; máximo **23,7 m** contra **195,8 m**.

⚠️ **Y tiene explicación física, que es lo que hace creíble el número:** un portal es una **puerta
en una fachada**, y entre la fachada y el eje de la calle hay acera, jardín o aparcamiento. **Un
poste está EN la vía pública, muchas veces sobre la propia línea que el grafo dibuja.** Que la
mediana sea de 2,2 m no es sospechoso: es que el poste está prácticamente encima de la arista.

⭐ **Bus y tranvía son dos poblaciones y se parecen más de lo que esperaba:** el tranvía engancha
algo peor (p99 16,2 m contra 11,1 m), coherente con que su plataforma va por el centro de la
avenida y no por el borde. **Ninguna de las dos tiene cola.**

```
   ⚠️ LAS QUE PASAN DE 65 m (el aviso de H1) .......... 0 de 984   (0,0 %)
```

⭐ **Un cero, y con su positivo de control al lado** (ley 4): el mismo instrumento **sí** encuentra
valores por encima de 65 m — 24 de los 2.308 portales de la muestra, hasta 195,8 m. **El cero es
del terreno, no del buscador.**

### 2.3 · ⭐⭐⭐ ¿Sobrevive el radio de 300 m?

```
   error típico de un par (2 × p50) ......... 4,4 m    ⇒  1,5 % del radio
   error del 1 % peor (2 × p99) ............ 23,0 m    ⇒  7,7 % del radio
   peor caso posible (2 × máx) ............. 47,4 m    ⇒ 15,8 % del radio
```

**Sí, sobrevive.** El pre-filtro de D4 mide entre **coordenadas de parada**; el enlace se andará
entre **puntos de enganche**. La diferencia entre esos dos puntos es lo que se acaba de medir, y
**en el caso típico es el 1,5 % del radio**.

⚠️ **Lo que esto NO dice, para que no se lea de más:** que el error del enganche sea pequeño **no
hace que la distancia recta se parezca a la andada**. Eso lo gobierna el rodeo, que en trayectos
cortos va de **1,10 a 2,17** (§4.3 del diseño). ⇒ **El radio sigue siendo un pre-filtro y nada más.
Lo que esta medida descarta es una segunda fuente de error, no la primera.**

### 2.4 · ⚠️ M2 · Casi la mitad engancha al eje de la calzada

```
   acera                        457   46,4 %
   eje-de-calzada               405   41,2 %       ⎫
   eje-con-acera-declarada       51    5,2 %       ⎬ 456 · 46,3 %
   peatonal                      69    7,0 %
   paso-de-peatones               2    0,2 %
```

⛔ **456 de 984 paradas enganchan a una arista que representa el CENTRO DE LA CALZADA**, porque ahí
OSM no tiene la acera dibujada. Un enlace peatonal que salga de esa parada **empieza en mitad de la
calle**.

⚠️ **No es un fallo del enganche: es el mapeado, y H1 ya lo tenía medido** — el 47,2 % del término
es eje de calzada. **La coincidencia es casi exacta (46,3 % contra 47,2 %)**, lo que dice que **las
paradas están repartidas por la ciudad como está repartido el mapeado**, sin sesgo propio.

⇒ **Consecuencia para el diseño, y es de D5, no de D4:** el aviso de H1 —*«ahí no tengo la acera
dibujada, así que los metros pueden bailar»*— **no es un caso raro en H2a: le toca a la mitad de
los enlaces.** No se calla por estar en otro hito.

### 2.5 · ⭐ M3 · Tres paradas fuera de la componente mayor

```
   componente 52   "PA00349"  Ctra. Castellón / Cementerio
   componente 52   "PA00353"  Ctra. Castellón Fte. Cementerio
   componente 50   "PA00354"  Carretera Castellón / Gasolinera
```

⇒ **El `SIN CAMINO` de §4.4 del diseño va a existir**, y ya tiene nombre. Dos de las tres están en
la **misma** componente (52), así que **entre ellas sí hay camino**; con el resto de la ciudad, no.

⭐ **Y esto contesta la sospecha que el propio diseño se planteó:** *«si el cocinado saliera con
cero `SIN CAMINO`, sería sospechoso»*. **No sale cero. Sale tres.**

---

## §3 · T3 · ¿ES DIRIGIDO EL GRAFO DE H1?

> ⭐ **NO. Y la simetría de un enlace queda garantizada POR CONSTRUCCIÓN, no por medición.**

**Dónde se mira** — `src/grafo.js:25-26`, la construcción de la lista de adyacencia:

```
   ady[e.a].push({ n: e.b, w: e.largo, e: i });
   ady[e.b].push({ n: e.a, w: e.largo, e: i });
```

Cada arista se empuja **en los dos sentidos con el mismo peso**. Y el nodo temporal del enganche
hace lo mismo (`src/grafo.js:211`): `enlaza` empuja las dos direcciones.

⭐ **Positivo de control de la búsqueda**, porque un «no hay» necesita demostrar que el buscador ve:

```
   grep -rn "oneway|sentido_unico|dirigid" src/*.js
      1 acierto: src/bici-inventario.js:828   ⇐ una lista de etiquetas de OSM que se COPIAN
                                                 al inventario de bici. NO toca el grafo a pie.
   ⭐ el mismo grep sobre otra etiqueta de OSM ("highway") encuentra 5 ficheros ⇒ funciona.
```

⇒ **Dos de las cuatro preguntas abiertas del diseño (§8) se cierran de un tiro:**

1. **«¿Un enlace es simétrico?»** — Sí, y no hace falta medirlo: A→B y B→A recorren el mismo
   conjunto de aristas con los mismos pesos. ⛔ **Deja de ser la suposición más cara del documento.**
2. **«¿Cuánto ocupa el artefacto?»** — El enlace **se guarda una vez, no dos**. Los 2.538 candidatos
   son 2.538 registros, no 5.076.

⚠️ **Lo que esto NO garantiza, dicho para que nadie lo estire:** la simetría es del **coste**, no
del **mundo**. Una escalera que solo se puede bajar, un torno de metro, una rampa con sentido —
**el grafo de H1 no los modela**, así que no puede ser asimétrico aunque el terreno lo sea. ⇒ La
simetría es cierta **dentro del modelo**, y eso es lo que se afirma.

---

## §4 · T4 · LOS INSTRUMENTOS DEJAN DE SER DE USAR Y TIRAR

**Cuatro ficheros entran al repositorio**, todos en `tools/` y ninguno en `src/`:

```
   tools/gtfs/feed.js               lee el ZIP y parte los CSV. No interpreta nada.
   tools/gtfs/identidad.js          ⭐ el ÚNICO fichero que sabe cómo se escribe un código de Avanza
   tools/gtfs/probar-identidad.js   la prueba, con su rojo provocable por bandera
   tools/gtfs/pares-candidatos.js   la aritmética del 483.636 → 3.231 → 2.538
   tools/grafo/enganche-paradas.js  la medición de §2, con su positivo de control
```

⚠️ **Por qué `tools/` y no `src/`**, que era la pregunta del encargo: `src/` es el universo de la
batería, y **estos cinco necesitan un ZIP de exploración en el disco**. Un invariante del proyecto
no puede depender de un artefacto que se puede borrar. ⛔ **Y el precio se paga hoy mismo: la
batería no los ejecuta, y por eso un `⛔` sin alarma pudo salir en verde en uno de ellos** — la
entrada de bitácora *«Escribí en mi propio script un `⛔` que no alarmaba»*. **Es el cabo de
`tools/` dejando de ser teórico.**

⚠️ **Y esa referencia va por su TÍTULO y no por su número a propósito, porque el número hizo saltar
un guardián.** Ver §7.2.

### 4.1 · ⭐ El 2.538, reproducido con el instrumento ya versionado

```
   node tools/gtfs/pares-candidatos.js

   pares totales             483636   publicado   483636   ✅
   pares ≤ 300 m               3231   publicado     3231   ✅
   pares candidatos            2538   publicado     2538   ✅
```

**Las tres cifras, exactas.** ⭐ **Y no es una comparación decorativa: va con `A.exige`**, así que
el día que el feed cambie o alguien toque el criterio, **el script sale en rojo y dice cuánto ha
variado**. ⇒ El número del diseño ha dejado de ser huérfano.

⚠️ **Lo que el reproducirlo demuestra y lo que no:** demuestra que el script nuevo hace lo mismo
que el desechado. **No demuestra que ninguno de los dos tenga razón** — los dos los escribí yo, el
mismo día, con la misma idea en la cabeza. **El control de verdad sería un tercer camino**, y no lo
hay.

---

## §5 · ⚠️ QUÉ COMPROBACIÓN NO SE ME OCURRIÓ

El encargo pide decirlo si todo sale bien. Salió bien, y son tres:

1. ⛔⛔ **No he comprobado que el enganche caiga al LADO CORRECTO de la calle.** He medido la
   **distancia** a la arista, no de qué lado queda. **H1 tiene un instrumento que se llama
   `src/acera-equivocada.js` justo para esto** y no lo he usado. Una parada a 2,2 m de la arista
   puede estar a 2,2 m **de la acera de enfrente**, y el enlace mandaría a cruzar sin decirlo.
   **Es la comprobación que más falta hace y no está.**
2. **No he comprobado si dos paradas distintas enganchan al MISMO punto.** Con medianas de 2,2 m y
   pares a 20 m, es plausible que un par de andenes enfrentados colapsen al mismo nodo temporal, y
   entonces su enlace mediría **cero metros** — que es una respuesta falsa con pinta perfecta.
3. **No he medido el enganche de las 11 paradas del WFS que no están en el GTFS.** Si algún día
   entran, no sé si enganchan igual.

---

## §6 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ **`DESPLAZAME-ESTADO.md` no se toca.**

1. ⭐⭐⭐ **EL RADIO DE 300 m DE D4 SOBREVIVE.** Paradas: mediana **2,2 m**, p99 **11,5 m**, máx
   **23,7 m**, **0 de 984 por encima de 65 m**. El error que el enganche mete en un par es el
   **1,5 %** del radio en el caso típico y el **15,8 %** en el peor imaginable.
2. ⭐⭐⭐ **Las paradas enganchan un orden de magnitud mejor que los portales** (p99 11,5 m contra
   65,4 m), y tiene causa física: **el portal está en una fachada y el poste en la vía pública.**
   ⇒ **El `AVISO_ENGANCHE_M = 65` de H1 es de otra población y no se hereda: para paradas sobra.**
3. ⭐⭐ **El instrumento reprodujo el p99 de 65 m de H1 con 0,4 m de desvío**, sin haberlo visto.
   Es el control que hace creíble todo lo anterior, y **para en rojo si se sale de 10 m**.
4. ⛔ **456 de 984 paradas (46,3 %) enganchan a EJE DE CALZADA.** Casi calcado al 47,2 % del término
   que H1 ya publicaba ⇒ **las paradas no tienen sesgo propio de mapeado**. Pero el aviso de *«ahí
   no tengo la acera dibujada»* **le toca a la mitad de los enlaces de H2a**, no es un caso raro.
5. ⭐⭐ **Tres paradas fuera de la componente mayor** (`PA00349`, `PA00353`, `PA00354`, Ctra.
   Castellón). ⇒ **El `SIN CAMINO` existirá, y el cero que el diseño temía no se da.**
6. ⭐⭐ **EL GRAFO NO ES DIRIGIDO** (`src/grafo.js:25-26`) ⇒ **la simetría del enlace está
   garantizada por construcción y el enlace se guarda UNA vez.** Cierra dos de las cuatro preguntas
   abiertas del diseño. ⚠️ Con su límite: es simétrico **dentro del modelo**, que no modela
   escaleras de un solo sentido.
7. ⭐⭐ **El puente de identidad tiene su prueba, y se ha visto roja**: con la fórmula que 003
   publica salen **50 paradas de tranvía con poste, 47 choques y 6 de 12 casos de control mal**.
   ⭐ **Y el rojo destapó un séptimo defecto que nadie había nombrado: esa fórmula tampoco recorta
   espacios.**
8. ⭐ **El 2.538 se reproduce con el instrumento ya versionado**, y la comparación contra lo
   publicado va con `A.exige`. ⚠️ **Pero los dos scripts los escribí yo el mismo día: reproducir no
   es verificar.**
9. ⛔⛔ **EL CABO DE `tools/` HA DEJADO DE SER TEÓRICO.** Un `⛔` impreso sin alarmar salió en verde
   en un fichero de `tools/`, **que es exactamente el fallo que fundó `src/alarma.js`**, porque la
   batería solo recorre `src/`. **Candidato firme a instrumento: extender el universo de la
   batería.**
10. ⚠️ **Y lo que falta y es lo que más falta:** nadie ha comprobado que el enganche caiga **al lado
    correcto de la calle**. `src/acera-equivocada.js` existe para eso y esta tanda no lo usó.

---

## §7 · LÍNEAS BASE DE LA BATERÍA — ⛔ Y LA DE ARRANQUE SALIÓ EN ROJO

```
   ANTES    ARRANQUE 2026-08-10T15:47:51+02:00  →  FIN 16:04:38   ⛔ exit=1
   DESPUÉS  (ver §7.3)
```

### 7.1 · ⛔⛔ Qué fila, y la culpa es del método, no del código

```
   superados.js   código 1   1 de 0   declara   ⛔ DECLARA 1 Y SE ESPERABAN 0
```

**El puntero salió en rojo.** Y no por nada de `src/` —esta tanda no ha tocado ni un fichero de
`src/`— sino **porque la batería estaba leyendo `docs/` MIENTRAS yo escribía este documento**.

⛔ **Ahí está el precio del atajo, y no era teórico.** En las tandas 2, 3 y 4 el encargo exigía que
la línea base terminase **antes** del primer fichero escrito, y se esperaba. El de hoy no lo exigía
y no esperé: **arranqué a las 15:47:51 y empecé a escribir a los pocos minutos.** El resultado no es
una línea base más débil — **es una línea base que mide un estado que no existió nunca**, mitad de
antes y mitad de después.

⇒ ⭐ **La línea base de esta tanda NO SIRVE como línea base.** Se publica igualmente, porque
esconderla sería peor, y porque lo que destapó es real.

### 7.2 · ⭐⭐ Lo que destapó: una colisión de homónimos en el puntero

El fallo concreto es **D3**, el recuento cerrado de líneas por par. El par afectado es el de un
valor de tres cifras retirado hace tandas, y la línea que lo movió es de este documento:

```
   valor ⟨…⟩     propias 9 de 9     ajenas 3 de 2   ⛔ SE HA MOVIDO
      · H1-ACERA-EQUIVOCADA.md:337        (un listón, p99 de otra distribución)
      · H1-DONDE-FALTA-EL-NOMBRE.md:213   (una celda de una tabla de barrios)
      · H2A-ENGANCHE-DE-LAS-PARADAS.md    ⇐ LA NUEVA, y era una referencia de BITÁCORA
```

⭐ **La línea nueva no publicaba el dato superado: publicaba el NÚMERO DE UNA ENTRADA DE BITÁCORA.**
Ese valor es a la vez una cifra retirada del proyecto y el ordinal de una entrada de hoy. **El
puntero compara cadenas y no puede distinguirlas.**

⇒ **Qué se hizo, y por qué esto y no lo otro:** la referencia se reescribe **por su título** en vez
de por su número. ⛔ **No se toca el recuento del puntero.** Subir un `ajenas` de 2 a 3 es una
decisión sobre el instrumento, y el instrumento tiene un solo dueño: **se reporta, no se ajusta.**

### 7.2.1 · ⛔⛔ Y describir el choque volvió a provocarlo — cuatro veces

Al escribir esta misma sección **enumeré los valores superados que colisionan**, con sus cifras. El
puntero volvió a salir en rojo, y ahora con **cuatro pares movidos en vez de uno**.

⇒ ⭐⭐⭐ **No se puede documentar una colisión de valores superados citando los valores.** El acto de
explicar el problema **es** el problema. Por eso las cifras de arriba van como `⟨…⟩`: **es el mismo
convenio que ya se usó en `H1-QUE-QUEDA-ABIERTO.md` §B6**, y por la misma razón — que el documento
no quede marcado por hablar de la marca.

⚠️ **Y el cabo estructural sigue vivo, dicho sin cifras:** la bitácora va por **183 entradas** y
sigue creciendo; varios valores retirados que el puntero vigila **están dentro del rango de
ordinales que la bitácora ya ha alcanzado o alcanzará**. **Cada entrada nueva es un candidato a
chocar**, y el choque no es un error de nadie: es que **dos numeraciones distintas comparten el
mismo espacio de dígitos** y el puntero solo ve dígitos.

### 7.3 · La comparación — contra la última batería LIMPIA, que no es la de hoy

⛔ **La de arranque de hoy no sirve** (§7.1). La referencia válida es **la batería de cierre de la
tanda 4**, tomada con el árbol quieto cuatro horas antes de empezar ésta.

```
   referencia   tanda 4 · cierre    15:17:57 → 15:34:32   exit=0     ⇐ árbol quieto
   DESPUÉS      tanda 5 · cierre    16:18:06 → 16:34:18   exit=0     ⇐ árbol quieto

   diff (sin ARRANQUE/FIN/exit)      112 líneas vs 112 líneas   ⇒  salida VACÍA: IDÉNTICAS
```

✅ **Ni una fila movida.** Los tres rojos declarados siguen en 1 y el amarillo de `ruta.js` —código
2 sin declarar nada, previo a todo esto— sigue igual.

⭐ **Y era lo que tenía que salir, por un motivo que conviene decir en voz alta:** los cinco
ficheros nuevos están en `tools/`, y **la batería recorre `__dirname`, que es `src/`**
(`src/probar-paradas.js:217`). ⇒ **Que esta comparación salga idéntica no demuestra que los cinco
ficheros nuevos estén bien: demuestra que la batería no los ha mirado.** Es la misma frase que en
§4, y hoy tiene su primera víctima documentada.

