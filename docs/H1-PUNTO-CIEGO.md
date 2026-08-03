# H1 · EL PUNTO CIEGO — cerrado, y con lo que queda dicho

> **Tanda 13** · 3 de agosto de 2026
> Datos: OSM `2026-08-03T08:19:51Z` · viario municipal `MU1_jerarquia_viaria` `2026-08-03T14:58:49Z`
> · entradas OSM `2026-08-03T15:08:51Z`
> Registro histórico: **se añade, no se reescribe.** Lo que corrija a un informe anterior lo dice con
> su número al lado.

---

## A · El guardián que avisaba y seguía

### A1 · Qué scripts detectan un fallo y continúan

`node src/auditoria-paradas.js` — **auditoría en ejecución, no estática**, y no por gusto: el símbolo
`⛔` se usa en este código tanto para declarar un fallo como para escribir prosa. Lo único que separa
las dos cosas es **qué código de salida las acompaña**.

```
   scripts ejecutados                       18
   ⚠️ con ⛔ en la salida y código 0         10
```

⭐ **Y al clasificarlas a mano —clasificar antes de contar—, nueve eran prosa o contadores en cero:**

| línea | qué era |
|---|---|
| `⛔ llamadas SIN zona explícita  0` | un contador **en cero**, o sea el resultado bueno |
| `⛔ rodeos imposibles (<1)  0  ✅` | ídem |
| `⛔ NO SE TOCA NADA. Se decide en H3` | prosa |
| `⛔ autovía · prohibido a pie` | etiqueta de clasificación |
| `⛔ pasan coches: NO es un pasaje` | resultado esperado de un clasificador |
| … | … |
| **`⭐ RODEO 2.17  tope ≤ 1.60  ⛔ FUERA`** | **⬅ el único fallo de verdad** |

⇒ **Un contador de símbolos habría inflado el problema por diez.** El caso real era uno, en
`rutas-antonio.js`. Y la clase seguía viva en los tres verificadores: `verificar.js` y
`verificar-ciudad.js` **no tenían ni un `process.exit`**.

### A2 · El mecanismo — `src/alarma.js`

Dos clases de fallo, **y no se tratan igual**:

| | qué es | qué hace |
|---|---|---|
| `imposible()` | rodeo < 1, suma que no cuadra | **lanza en el acto** — seguir midiendo con un instrumento que acaba de decir un absurdo no tiene sentido |
| `fallo()` / `exige()` | ruta de cordura sin resolver, rodeo fuera del tope | **se anota y se sigue** —hay que ver TODOS los fallos, no solo el primero— pero un gancho `process.on('exit')` deja el código en **1** |

⭐ **El gancho se instala solo, al primer `fallo()`.** A partir de ahí ningún camino del código puede
devolver 0, y no hay que acordarse de nada al final. Eso es la ley 37: mecanismo, no disciplina.

Enganchado en `verificar.js`, `verificar-ciudad.js`, `verificar-rios.js` y `rutas-antonio.js` — **15
puntos de detección** que antes solo imprimían.

### A3 · Los rojos, provocados — con positivo de control cada uno

`node src/probar-paradas.js`

| prueba | rojo | verde sin el fallo |
|---|---|---|
| fallo de expectativa | ✅ código 1, **y el script llega al final**, y se ven los dos fallos | ✅ sin fallos, código 0 |
| imposibilidad física | ✅ código 1 **y el script no sigue** | ✅ |
| ⭐ **el caso real**: al grafo del casco se le quitan los pasos condicionales | ✅ `⛔ FALLO · ruta de cordura SIN RESOLVER: Puerta del Carmen -> Magdalena (componentes-distintas)`, código 1 | ✅ con ellos dentro: 1.370,8 m, código 0 |

### A4 · ⭐ Qué saltó al hacerlos parar

`node src/probar-paradas.js --todo` — los 18 scripts, con el invariante *«si la salida declara un
fallo, el código no puede ser 0»*:

```
   rutas-antonio.js          código 1       DECLARA FALLO  ✅
   los otros 17              código 0/2     sin fallos     ✅
```

⇒ **Salta UNA cosa, y ya estaba declarada**: la ruta nº4 de Antonio (Etopía → Delicias), rodeo 2,17
frente al tope de 1,60, publicada como tal en `H1-CIERRE.md`. **No apareció nada escondido.**

⚠️ Y el guardián nuevo **cazó mi propio parche a los diez minutos**: `verificar-rios.js` salía con
código 1 **sin declarar ningún fallo**, porque la sustitución del `require` había fallado en silencio
al no encontrar su ancla de texto (bitácora nº84).

⚠️ **Lo que esto NO cubre, dicho antes de que nadie lo suponga:** un script que detecte algo y lo
imprima sin avisar a la alarma sigue pudiendo salir en verde. Y la auditoría solo ve los fallos **que
alguien declaró como fallos con `⛔`**: una comprobación que falle imprimiendo `⚠️`, o que
directamente no exista, es invisible para todo esto.

---

## B · La capa municipal completa — y el punto ciego cerrado

### B1/B2 · La descarga, verificada antes de medir con ella

Una sola petición. `srsName=EPSG:4326` **explícito**: sin él este servidor devuelve **metros** dentro
de un GeoJSON, que es un fichero perfectamente válido y perfectamente equivocado.

```
   features · numberMatched     3644 · 3644      (la tanda 0 declaró 3.644)   ✅
   CRS declarado                urn:ogc:def:crs:EPSG::4326
   ⭐ tamaño real del bbox       24,5 × 20,9 km
      ⇒ ¿homónimos de otras Zaragozas? (ley 41)  ✅ NO — todo cabe en una ciudad
```

⚠️ **Y la capa NO cubre el término entero**, que no es un fallo de la descarga: es viario municipal
urbano. **Fuera de su alcance, un "no cuadra" significaría "aquí no llega la capa"**, no "el enganche
está mal" — y sin esa condición la medición de la tanda 12 daba una mediana de 39,5 m y **un p99 de
3 km**.

| zona | portales | cubiertos | |
|---|---:|---:|---:|
| casco histórico | 3.948 | 3.885 | 98,4 % |
| ensanche | 2.649 | 2.530 | 95,5 % |
| Actur-Rey Fernando | 2.433 | 2.267 | 93,2 % |
| Valdespartera | 695 | 636 | 91,5 % |
| rural · Movera | 747 | 450 | 60,2 % |
| polígono · Malpica | 1.469 | 631 | 43,0 % |
| polígono · PLAZA | 554 | 9 | **1,6 %** |
| rural · Garrapinillos | 1.130 | 0 | **0,0 %** |

**7.245 portales ciegos evaluables, frente a los 214 de la tanda 12.** Eso es lo que cambia hoy.

### B4 · ⭐⭐ ¿Puede este testigo acertar o fallar por construcción?

La pregunta que tumbó al cuarto testigo de la tanda 12, hecha **antes** esta vez. Y menos mal:

```
   grupo                          d(PORTAL→eje)   d(ENGANCHE→eje)   lo que mueve el motor
   BUENOS conocidos                     23,8 m            21,8 m            -0,8 m
   SOSPECHOSOS conocidos                34,5 m            33,9 m            -0,6 m
   ⭐⭐ CIEGOS                            32,7 m            30,6 m            -0,7 m
```

⭐⭐ **Los ciegos ya estaban 8,9 m más lejos de su propio eje antes de que el motor tocara nada.** La
posición del portal la pone el Ayuntamiento, no el enganche. ⇒ **Cualquier comparación en bruto está
midiendo dónde vive esa gente, no si el enganche acierta.**

Emparejando por distancia previa, la diferencia desaparece:

| d(portal→eje) | BUENOS | CIEGOS | dif. |
|---|---:|---:|---:|
| 0–10 m | 100,0 % (n=2.872) | 100,0 % (n=566) | +0,0 |
| 10–20 m | 100,0 % (n=5.145) | 99,7 % (n=1.442) | −0,3 |
| **20–30 m** | **67,3 %** (n=3.659) | **64,7 %** (n=1.311) | **−2,6** |
| 30–50 m | 4,7 % (n=4.229) | 6,8 % (n=1.997) | +2,1 |
| 50–100 m | 0,6 % (n=2.634) | 1,7 % (n=1.494) | +1,1 |

⚠️ **Y su límite:** por debajo de 20 m el acierto es del 100 % **por aritmética** —el enganche mueve
menos de 1 m y el umbral son 25—, y por encima de 30 es del 0 %. **La única banda que informa es la
de 20–30 m.** Por eso hace falta lo siguiente.

### ⭐⭐ El discriminador sin umbral

No *«¿acierta?»*, sino **«¿cuánto ALEJA el enganche a un portal de su propio eje?»**. No depende de
dónde ponga yo el corte, y un enganche a la calle equivocada tiene que verse como una cola larga:

| grupo | mediana | p90 | p99 | **aleja > 10 m** | aleja > 25 m |
|---|---:|---:|---:|---:|---:|
| BUENOS conocidos | −0,8 m | −0,2 m | +1,1 m | **0,1 %** | 0,0 % |
| SOSPECHOSOS conocidos | −0,6 m | +14,9 m | +34,6 m | **15,8 %** | 3,5 % |
| ⭐⭐ **CIEGOS** | −0,7 m | +2,1 m | +17,9 m | **2,7 %** | 0,4 % |

**El testigo separa lo bueno conocido de lo sospechoso conocido por un factor de 251.** Y los ciegos
caen al lado de los buenos.

### B5 · Las dos contrapruebas, y la línea base

```
   línea base · contra un código municipal AL AZAR     0,0 %   ✅ se derrumba
   (a) desplazamiento 200 m · acierta                  1,6 %   frente al 41,6 % real
   (b) identidad barajada · acierta                    0,3 %
```

⭐ Las dos se derrumban **y por motivos distintos**: la primera dice que el testigo mira la
**posición**; la segunda, que mira **quién es**. Ley 24.

### B6 · El límite del testigo — no es un oráculo

```
   portales que el testigo NO puede evaluar        16.708  (36,3 %)
      porque la capa no llega a su zona            14.913  (32,4 %)
      porque su codigoVia no está en la capa        1.795  (3,9 %)
```

La capa son 3.644 tramos de **jerarquía viaria** para 3.359 vías del callejero: no es un mapa de todas
las calles. Un portal en un andador o en un camino puede no tener tramo, **y eso no dice nada de su
enganche**.

### B7 · ⭐⭐⭐ El veredicto, en una frase

> **SÍ ACIERTA** — donde nadie vigila, el enganche se comporta **como los buenos conocidos y no como
> los sospechosos**: aleja al portal de su propio eje más de 10 m en el **2,7 %** de los casos, frente
> al **0,1 %** de los enganches buenos y el **15,8 %** de los sospechosos; y al emparejar por
> distancia previa, los **−14,4 puntos** en bruto **se disuelven en ±2,6**.

⛔ **El `NO CONSTA` de la tanda 12 queda sustituido**, y lo que lo sostenía —*«el único testigo
independiente de OSM lo pone 10 puntos por debajo»*— resultó ser **geografía y no enganche**.

⚠️ **Con dos cabos, y no son pequeños:**

1. **198 portales ciegos llevan la firma de un enganche malo** (2,7 % de los evaluables). ⛔ **No son
   errores confirmados**: en una avenida ancha con vías de servicio la acera está legítimamente a 40 m
   del eje. Son **candidatos**, y van con su coordenada.
   Concentrados en `footway` (67,2 %) y `service` (18,2 %); por zona, 124 fuera de las ocho medidas y
   **49 en el Actur**. Los peores: **Avenida Santa Isabel** (+48 m), **Camino Épila** (+43 m),
   **Calle Lago de Barbarisa** (+42 m).
2. **El testigo no llega al 36,3 % de los portales, y no al azar**: Garrapinillos 0 %, PLAZA 1,6 %.
   **Lo medido vale para la ciudad urbana, no para el término entero.**

---

## C · Los portales sin ningún testigo

⭐ La tanda 12 los estimó en **2.006** extrapolando de una muestra de 4.000. **Contados enteros: 1.879**
(4,1 %). La extrapolación se pasaba un 6,8 %.

```
   CIEGOS sin ninguna calle con nombre a 80 m           1.879   (4,1 % del total)
   ⭐ de ellos, que la capa municipal SÍ alcanza           287   (15,3 %)
      y de esos, con el enganche sobre su eje              33 de 287  (11,5 %)
   ⛔ SIGUEN SIN NINGÚN TESTIGO                           1.592   (3,5 % del total)
```

**Dónde están los 1.592:** 1.414 **fuera de las ocho zonas medidas**; el resto repartido —Garrapinillos
54, PLAZA 46, Movera 43, Malpica 20, ensanche 10, Actur 3, casco 2.

### ¿Importan?

```
   portales vecinos en 300 m · mediana de TODOS         111
      de los CIEGOS                                      80
      ⭐ de los que SIGUEN SIN TESTIGO                     25
   de los sin testigo, en sitios con ≤5 portales alrededor   317  (19,9 %)
```

⇒ **Están donde vive menos gente, pero no en descampados: la mediana es 25 vecinos, no 0.**

⚠️ **Y no todos son rurales.** En la muestra al azar de 20 (semilla 20260853, reproducible) aparecen
**Avenida de la Ilustración** (tres veces), **Avenida José Anselmo Clavé** y **Vía Hispanidad** — sitios
urbanos donde alguien pide una ruta — junto a **Camino Puente Clavería**, **Camino Las Casicas** y
**Polígono La Unión I**.

| lat, lon | vía del callejero | engancha a | a |
|---|---|---|---:|
| 41.64883, −0.89279 | AVENIDA JOSÉ ANSELMO CLAVÉ | `footway` | 3,6 m |
| 41.62781, −0.93052 | AVENIDA DE LA ILUSTRACIÓN | `living_street` | 4,1 m |
| 41.64319, −0.91678 | VÍA HISPANIDAD | `service` | 7,8 m |
| 41.69726, −1.07109 | CAMINO PUENTE CLAVERÍA | `track` | 6,4 m |
| 41.62237, −0.84746 | POLÍGONO LA UNIÓN I | `unclassified` | 12,1 m |

*(la muestra completa de 20, en la salida de `node src/cerrar-punto-ciego.js`)*

---

## D · ¿La puerta es una puerta?

### D1 · `entrance=*` SÍ existe

⭐ La tanda 12 lo dejó en `NO CONSTA` **y era correcto con su dato**: sus tres descargas eran de
**ways**, y `entrance` es una etiqueta de **nodo**. El cero significaba *«no se ha descargado»*,
exactamente como se declaró. **Faltaba pedirlo.**

```
   ⭐ nodos con entrance=* en el término                 2.085
   ⭐ POSITIVO DE CONTROL · farmacias en la misma consulta  350   ✅ el buscador funciona
```

Clasificados antes de contarlos: `yes` 1.707 · **`main` 295** · `service` 24 · `garage` 22 ·
`emergency` 16 · `exit` 11 · `shop` 4 · `gate` 2 · `staircase` 2 · `secondary` 1 · **`no` 1**.

### D2 · ¿Coincide el punto al que ruteamos con una entrada declarada?

⭐ Emparejadas con su edificio **por ID DE NODO**, no por proximidad: es identidad, no parecido.

```
   edificios en la ventana                              11.857
   ⭐ con al menos una entrada declarada                    467   (3,9 %)
```

⚠️ **Para el 96,1 % la pregunta sigue sin poder contestarse.** Lo que sigue vale para los 467, y no
se extrapola.

| distancia a la entrada declarada más cercana | mediana | p90 | ≤ 5 m | ≤ 15 m |
|---|---:|---:|---:|---:|
| ⭐ desde la **puerta que elige el motor** | **5,4 m** | 19,6 m | **47,3 %** | 85,2 % |
| línea base: un punto **cualquiera** del contorno | 9,3 m | 28,6 m | 19,1 % | 68,5 % |
| solo contra entradas `entrance=main` | 13,4 m | 50,8 m | 34,2 % | 50,7 % |

⇒ **El mecanismo apunta a las entradas 2,5 veces mejor que el azar** — pero está lejos de acertarlas.
Y contra la entrada **principal** es notablemente peor: suele dar con una secundaria.

⛔ **Una comprobación se degradó por pasar por construcción.** «El 97 % de los edificios tiene la
puerta entre los 24 candidatos» era trivial: las entradas **son vértices del polígono** y el muestreo
mete todos los vértices — **el 60,4 % de los edificios tiene su contorno entero dentro de los
candidatos**. La delató una **mediana de 0,0 m**. Se publica con su motivo; no entra en el veredicto.

### D3 · Los tres casos conocidos

| caso | edificio | entradas declaradas | veredicto |
|---|---|---|---|
| **Estación Delicias** | way 23735099 | **9** (`main`, `yes`) | ⛔ el motor rutea a **25,8 m** de la `entrance=main` más cercana — **NO es una puerta declarada** |
| **Hospital Clínico** | way 24582429 | **ninguna** | `NO CONSTA` — no hay con qué comprobarlo |
| **C.C. Utrillas** | — | — | el punto no cae dentro de ningún polígono: no hay puerta que comprobar |

**El motor rutea a:** `41.65753, −0.90885` · **la `main` declarada está en:** `41.65776, −0.90888`.

### D4 · El cabo, dicho como es

- `entrance=*` **existe**: 2.085 nodos. Eso ya no es `NO CONSTA`.
- Pero solo el **3,9 %** de los edificios lo trae. Para el resto, si la puerta a la que ruteamos es una
  puerta **sigue siendo `NO CONSTA`** — y no por falta de método: por falta de dato.
- ⛔ **No se usa para corregir nada.** D0: verifica, no decide. Y meterlo en el motor tendría su propio
  riesgo: una entrada `service` o `garage` **no es por donde entra una persona**, y hay 46 de ésas.

---

## Los diez ejes

| eje | ¿tocado? | dónde |
|---|:--:|---|
| **posición** | ✅ | d(portal→eje) frente a d(enganche→eje) · desplazamiento 200 m |
| **vecindad** | ✅ | el recuento completo de los que no tienen calle con nombre a 80 m |
| **dirección** | ⛔ | **no tocado.** A pie el sentido no opera; entra con el coche, que está aparcado |
| **identidad** | ✅ | entradas emparejadas **por id de nodo** · contraprueba de identidad barajada · «¿es el mismo código?» |
| **correspondencia** | ✅ | **el eje central**: B entero |
| **umbral / cola** | ✅ | el discriminador **sin umbral** nació de dudar del corte de 25 m · la cola de 198 |
| **escala** | ✅ | 214 → 7.245 casos · 197 → 3.644 tramos |
| **densidad** | ✅ | portales vecinos en 300 m de los que no tienen testigo |
| **agregación** | ✅ | clasificar las líneas `⛔`: 10 sospechosos → 1 real |
| **semántica** | ✅ | qué significa `entrance=service` · qué significa «no cuadra» fuera de la cobertura |

---

## Qué he buscado a propósito y NO he encontrado

- **Más scripts que detecten y sigan**: de 18, el veredicto automático marcó 10 y **solo uno era real**.
- **Algo escondido que saltara al hacer parar a los guardianes**: **nada**. Salta la ruta nº4, que ya
  estaba declarada en `H1-CIERRE.md`.
- **Homónimos de otras Zaragozas en la capa municipal** (ley 41): ninguno — el bbox mide 24 × 21 km.
- **Cobertura municipal en Garrapinillos**: **0 tramos**. Y en PLAZA, 1,6 %.
- **Entradas declaradas en el Hospital Clínico**: ninguna.

## Qué NO he comprobado

- ⚠️ **Si los 198 candidatos son errores de verdad.** Llevan la firma, pero una acera de avenida ancha
  la produce sin que nadie se equivoque. Hace falta mirarlos — van con coordenada.
- ⚠️ **Si los 1.592 sin testigo están bien enganchados.** No hay con qué: ni OSM les da nombre, ni la
  capa municipal llega.
- ⚠️ **Si el 36,3 % que el testigo no alcanza se comporta como el 63,7 % que sí.** No es una muestra
  al azar: es exactamente la periferia y los polígonos.
- ⚠️ **Si el punto al que ruteamos en el 96,1 % de los edificios es una puerta.** `NO CONSTA`.
- ⚠️ **Que la alarma cubra los fallos que nadie declaró como fallos.** Solo ve lo marcado con `⛔`.

## Lo que se reporta hacia arriba

1. ⭐ **El veredicto de `H1-CIERRE.md` §E7 queda sustituido**: era `NO CONSTA` y ahora es **SÍ
   ACIERTA**. El documento no se toca; queda corregido aquí, con sus números.
2. ⚠️ **Delicias rutea a 25,8 m de su entrada principal declarada.** Usar `entrance=*` en el motor es
   una decisión nueva, con su propio riesgo, **y no está tomada**.
3. ⚠️ **La cobertura municipal es urbana.** Cerrar el punto ciego en Garrapinillos, Movera y PLAZA
   necesitaría otra fuente, y hoy no se sabe cuál.

---

**Bitácora de esta tanda:** nº83 a nº86. **Diecinueve tandas, diecinueve con algo torcido.**
