# H1 · Tanda de arreglo 9 — `adyacencia` deja de saber de modos

*2026-08-12 · base `e95e88a` · **se reabrió H1 por una rendija y se cierra en la misma tanda.***

> **Este documento se AÑADE. No reescribe ninguno anterior** — y eso incluye
> `docs/H2B-CIRCULACION-BICI.md`, cuyo §2 esta tanda **corrige** (§4).

```
   node tools/grafo/firma-adyacencia.js      # la contraprueba entera
```

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **H1 no se ha movido, y la prueba no admite interpretación** | Las 9 rutas que resuelven salen **idénticas en metros Y en la lista de índices de arista**: el sha de la línea entera es el mismo, `65a16a41…`. Grafo, componentes y los 26 congelados, iguales. **El artefacto de los 2.538: `e3a3a81a…`, 506.524 bytes, idéntico** |
| ⭐⭐⭐ **Y el código nuevo se ejecuta de verdad** | La llamada vieja **revienta**, y tres predicados dan tres resultados distintos: **94.570 · 98.774 · 0**. *Un idéntico no vale si la firma ignora su parámetro* |
| ⭐⭐ **El predicado es OBLIGATORIO: no hay valor por defecto** | Cualquier defecto decide por quien llama. Sin defecto, **olvidarlo revienta**; con defecto, devuelve rutas plausibles y equivocadas (§1.2) |
| ⭐ **Una sola llamada de producción** | `src/ruta.js:117`. Toda la superficie de compatibilidad del cambio |
| ⛔⛔ **Y SÍ se movió algo — pero no de H1: de mi propia tanda 2** | La ruta de ejemplo en bici pasa de **4.788,9 m · 155 aristas** a **4.651,3 m · 150**. **El apaño que declaré hacía que la bici heredara las prohibiciones del peatón** (§4). Bitácora nº201 |
| ⭐ **La bici, enchufada** | **49.972 aristas (50,6 %) · 4.870,8 km · 176 componentes**, la mayor con **37.912 de 39.142 nodos (96,9 %)** |
| ⛔ **T4 · `superados.js`: PARA** | El arreglo durable **no cabe en su recuento**: necesita un campo nuevo, porque «citado de un tercero» **no es** «le falta mi contexto» (§6) |

---

## §1 · T1 · LA FIRMA

### 1.1 · Qué cambia, exactamente

```
   antes   function adyacencia(nodos, aristas, soloAPie = true, sinCondicionales = false)
   ahora   function adyacencia(nodos, aristas, pasa,            sinCondicionales = false)
```

⭐ **No se ha inventado un diseño: se ha igualado una firma.** La forma correcta ya vivía en el
fichero de al lado — `src/portales.js:250`, `indexarAristas(aristas, filtro, celda)` — y se le pasa
un predicado desde `src/direccion.js:156`.

**Y el predicado de andar tiene un sitio, para que no se copie** (ley 56):

```js
   src/grafo.js   const PASA_A_PIE = (e) => e.pie;      // exportado
```

⚠️ **Lo que NO se ha fundido, aunque se parezca:** `sinCondicionales` sigue siendo un parámetro
aparte. `pasa` dice *por dónde circula este modo* y `sinCondicionales` dice *cuánto me fío de este
sitio*. **Son dos preguntas, y juntarlas volvería a esconder una dentro de la otra** — que es
exactamente el defecto que esta tanda viene a quitar.

### 1.2 · ⭐⭐ El valor por defecto: **no hay**, y el argumento

Las dos opciones posibles eran malas, y por motivos distintos:

| defecto | qué pasaría |
|---|---|
| **«solo a pie»** (el de antes) | **Esconde el modo otra vez.** Una llamada de bici que olvide el predicado devuelve la red peatonal y **da rutas plausibles y equivocadas** |
| **«todo el grafo»** | **Peor: rutaría por autovías sin ponerse roja.** Es la clase de fallo en verde que la tanda anterior existió para evitar |

⇒ **Sin defecto.** Si falta, `adyacencia` **lanza**, y el mensaje nombra el caso real —alguien que
actualiza una llamada vieja y se deja el `true`—:

```
   ⛔ adyacencia() exige un PREDICADO como tercer argumento, y ha recibido `true`.
      Desde la tanda de arreglo 9 el modo no es un booleano: para la red peatonal
      se pasa `G.PASA_A_PIE`.
```

⭐ **Es más ruidoso y más seguro**, y lo digo: *un fallo que revienta se caza solo; el que degrada,
no* (ley 61). **El precio son dos argumentos escritos en dos llamadas.**

### 1.3 · TODAS las llamadas — no solo las que toqué

```
   $ grep -rn "adyacencia(" src/ tools/ --include=*.js
```

| dónde | qué es | ¿tocada? |
|---|---|---|
| `src/grafo.js:18` | la definición | ✅ |
| **`src/ruta.js:117`** | **la ÚNICA llamada de producción** | ✅ `true` → `G.PASA_A_PIE` |
| `tools/grafo/circulacion-bici.js` | mi instrumento de H2b·2 | ✅ y **se le cae el apaño** (§4) |
| `tools/grafo/firma-adyacencia.js` | la contraprueba de esta tanda | nueva |

Los demás aciertos del `grep` son **comentarios**, no llamadas.

---

## §2 · ⭐⭐⭐ QUE EL CÓDIGO NUEVO SE EJECUTA — antes de creerse ningún idéntico

⛔ **Una firma que ignorase su parámetro daría exactamente los mismos idénticos**, y el verde de esta
tanda no valdría nada. Dos pruebas, en la misma pasada:

```
   (1) la llamada vieja `adyacencia(…, true, …)`    ✅ REVIENTA

   (2) usadas con `G.PASA_A_PIE`     94570
       usadas con `() => true`       98774   ⇒ 4204 más
       usadas con `() => false`          0
       ⇒ ✅ el parámetro se HONRA: tres predicados, tres resultados distintos.
```

---

## §3 · ⭐⭐⭐ LA CONTRAPRUEBA DE QUE H1 NO SE HA MOVIDO

### 3.1 · El grafo

```
   medida                     ahora     antes   ¿igual?
   nodos (contadores)         68649     68649   ✅
   aristas                    98774     98774   ✅
   componentes                  170       170   ✅
   aristas usadas (a pie)     94570     94570   ✅
```

### 3.2 · ⭐⭐⭐ Las rutas de cordura — metros **y** los índices de arista

⛔ Se ejecuta `src/rutas-antonio.js --aristas` **en un proceso aparte**, que es como lo hace
`src/modelo-rutas.js`: se compara contra el MOTOR, no contra una copia de su regla (ley 55).

```
     ruta      metros   aristas   sha256 de los índices
        2       598.1        23   55b994b94745151e95b91b17ec5bb0f8
        3      3704.9        94   6422e0e14b0c5008e16d4d4c16c55ebc
        4       505.9        26   de885e5ffa8f8aa1412457377e08b8f5
        5       477.4        20   7ce8674cd0ca2a304d04c02033d3c8cf
        6       520.2        19   6296c9c8b841d3264ffa7fb2201398b6
        7      2528.9        69   0f73ef7468068a410781b042ccad4c01
        8      6366.1       193   bda7007e862ef3f254626b76b351ef91
        9      2883.0        80   76548ee6befdcf283413767799431f49
       10      4044.2       154   08f09191f00586726f19318c6c92dfbd

   rutas que resuelven   9   (antes 9 — la nº1 sigue en sugerencia, como está publicado)
   sha de la línea entera · ahora   65a16a414dbe27f4d25f2662cebfd75ebd7899b2c31f5fd0cf36cd9fe71ca871
                          · antes   65a16a414dbe27f4d25f2662cebfd75ebd7899b2c31f5fd0cf36cd9fe71ca871
   ⇒ ✅ IDÉNTICO — ni un decimal, ni un índice
```

### 3.3 · Los 26 congelados y el artefacto de los 2.538

```
   node src/numeros-congelados.js     exit 0   ⇒ ✅ LA CONTRAPRUEBA: sin fallos
   node tools/gtfs/enlaces.js         sha del artefacto SIN la marca
                                      e3a3a81a3b4c5617341183814c5af2a1000191990a039d243c25d9444d17a559
                                      506.524 bytes   ✅ el mismo que la tanda 8
```

⭐ **Y el artefacto es la prueba más exigente de las tres**: los 2.538 enlaces se calculan **sobre
este mismo grafo**, así que cualquier cambio de comportamiento en `adyacencia` habría movido metros.

### 3.4 · ⭐⭐ La provocación — que el instrumento SABE ver un cambio (ley 152)

```
   con 0,1 m de más en UNA ruta          ✅ lo caza
   con UN índice de arista cambiado      ✅ lo caza
```

⭐ **Y las dos importan por separado: una ruta puede medir lo mismo yendo por otro sitio.**

---

## §4 · ⛔⛔ LO QUE SÍ SE MOVIÓ — y corrige a `docs/H2B-CIRCULACION-BICI.md` §2

**No es H1.** Es un número que publiqué **ayer**, en mi propio informe de H2b·2:

```
   con el apaño (tanda 2, publicado)   4.788,9 m · 155 aristas
   con el predicado de verdad          4.651,3 m · 150 aristas
```

El apaño construía la red de bici pasándole a `adyacencia` una **copia** de las aristas con `pie`
redefinido, y `adyacencia` seguía filtrando por `e.pie`. ⇒ **la condición real era `circula` Y `pie`.**

```
   aristas «circula» ................................ 49972
   ⛔ …de ellas con e.pie = false .................... 613     ⇐ el apaño las tiraba TODAS
      por motivo: foot=no: 613
      por clase:  cycleway 180 · secondary 145 · primary 124 · residential 92 · tertiary 30 …
```

⭐⭐⭐ **Y las 180 peores son carril bici con el peatón prohibido: lo más «solo bicis» que existe en
OSM.** El apaño le prohibía a la bici justamente los sitios reservados para ella.

⚠️ **Qué de la tanda 2 se mueve y qué no, con precisión:**

| | |
|---|---|
| ⛔ **se mueve** | **solo la ruta de ejemplo**: 4.788,9 → **4.651,3 m**, 155 → **150** aristas, y su reparto por clase |
| ✅ **NO se mueve** | el veredicto `circula` (**49.972**), el 4,7 % del fallo predicho, las componentes, el enganche, el `oneway`. **Ninguno pasa por `adyacencia`** |

⛔ **El informe de la tanda 2 NO se reescribe** —es registro histórico—: esta es su corrección, con
qué corrige y por qué. Bitácora **nº201**, cuya ley es la que duele: ⭐⭐⭐ ***declarar un apaño no es
medirlo, y declararlo es lo que hace que dejes de mirarlo.***

---

## §5 · T3 · EL PREDICADO DE BICI, ENCHUFADO — ⛔ solo enchufado

```
   aristas que entran en la red de bici   49972   (50,6 % del grafo)
   kilómetros                             4870,8 km
   componentes                            176
   la mayor, en nodos                     37912 de 39142   (96,9 %)
```

⚠️ **176 y no 178**, y no es una discrepancia: la tanda 2 publicó **178** para la variante de
**clase sola**; aquí el predicado aplica además el filtro del dato (`bicycle=no`, `access=no`), que
quita 287 aristas — y con ellas **dos componentes enteras**. *Ya estaba medido así en su §1.4.*

⭐ **Y esto es lo único que demuestra: que se puede construir la red de un modo que no es el peatón
sin tocar el grafo y sin copiar una arista.** ⛔ No hay enganche de bici, ni tiempos, ni rutas de
producto.

---

## §6 · ⛔ T4 · `superados.js` — **PARA**, y el diseño mínimo propuesto

La limitación es la que dejé escrita ayer: **no distingue una cifra propia superada de la misma cifra
citada de un tercero.** Fui a arreglarlo y **no cabe en su recuento**:

```
   src/superados.js:82    contexto  ⭐⭐⭐ lo que la línea tiene que llevar ADEMÁS de la cifra.
   src/superados.js:346   (p.contexto && !p.contexto.test(l) ? ajenas : propias).push(…)
```

⇒ **`contexto` identifica lo PROPIO**, y una línea es ajena **cuando NO casa**. Para excluir las
citas de terceros con ese mecanismo habría que escribir un patrón que case **exactamente** las nueve
líneas propias del par — y son nueve frases heterogéneas de siete documentos distintos.
⛔⛔ **Y el modo de fallo es el peor posible: un patrón que se deje una fuera la reclasifica como
ajena y el guardián DEJA DE MARCAR un superado de verdad, en silencio.**

**Y el concepto no encaja, ni siquiera bien escrito:** una frase puede decir *«tal router usa esa
cifra como velocidad»* — **lleva el contexto propio y sigue sin ser nuestro dato.** ⇒ *«citado de un
tercero» no es «le falta mi contexto»: son dos ejes.*

**El diseño mínimo, para que lo decida Antonio:** un campo nuevo por par —**`ajeno`**, un patrón que
marca la línea como de otro **por sí solo**, independiente de `contexto`— más su recuento. ⭐ Y su
primer caso positivo **existiría el mismo día**: bastaría nombrar a los tres routers. ⛔ Pero es un
cambio en el MODELO del instrumento, no en su recuento, y la costura de esta tanda dice que eso se
saca a tanda propia.

---

## §7 · ⚠️ QUÉ LLAMADA **NO** HE PROBADO

- **`adyacencia` con `sinCondicionales = true`.** La única llamada de producción la pasa desde
  `opciones.sinCondicionales`, y **ninguna ruta de las nueve la activa**. ⇒ *la rama que combina
  predicado + condicionales no se ha ejercitado en esta tanda.* **Y no es teórica: son 196 aristas.**
- **`adyacencia` desde un `require` externo**, es decir, alguien que la use sin pasar por
  `src/ruta.js`. Hoy no hay nadie, pero **la firma es pública** y el `throw` es lo único que lo
  protege.
- **Ninguna ruta de bici de producto**: la del §4 es de un instrumento de medición, con dos POI y un
  enganche que **no es el que tendrá el modo bici**.
- **Nada con `oneway`.** Sigue medido y sin aplicar: la red de bici del §5 **es no dirigida**.

---

## §8 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **H1 no se ha movido, con la prueba más dura que se ha hecho hasta hoy:** las nueve rutas
   idénticas **en metros y en índices de arista** (un solo sha), grafo, congelados y **el artefacto
   de los 2.538 byte a byte**.
2. ⭐⭐⭐ **`adyacencia` acepta un predicado y el modo deja de ser un booleano.** Una sola llamada de
   producción. **Sin valor por defecto: olvidarlo revienta.**
3. ⭐⭐ **Y se demostró que el código nuevo se ejecuta** —la llamada vieja revienta, tres predicados
   dan tres resultados— **antes de creerse el idéntico.**
4. ⛔⛔ **Se corrige un número publicado ayer:** la ruta de ejemplo en bici era **4.788,9 m** y es
   **4.651,3 m**. El apaño de la tanda 2 hacía que **la bici heredara las prohibiciones del
   peatón**: 613 aristas con `foot=no`, **180 de ellas carril bici.**
5. ⭐⭐⭐ **Ley nueva (nº201):** *declarar un apaño no es medirlo — y declararlo es lo que hace que
   dejes de mirarlo.* ⇒ **todo apaño declarado necesita una cifra al lado: qué hace de más o de menos
   frente a lo que sustituye.**
6. ⭐ **La red de bici, enchufada: 49.972 aristas · 4.870,8 km · 176 componentes**, la mayor con el
   **96,9 %** de los nodos.
7. ⛔ **T4 parado con motivo:** el arreglo de `superados.js` necesita **un campo nuevo**, porque
   *«citado de un tercero» no es «le falta mi contexto»*. **Y el modo de fallo del atajo es que el
   guardián deje de marcar en silencio.**
8. ⚠️ **La rama `predicado + sinCondicionales` no se ha ejercitado.** 196 aristas condicionales.

---

## §9 · LAS DOS BATERÍAS

```
   base    15:42:06 → 16:03:47   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

⚠️ Esta tanda **sí toca `src/`** —`grafo.js` y `ruta.js`—, así que la batería es la prueba de que no
se ha roto nada que ella vigile. Los instrumentos nuevos viven en `tools/grafo/`, **fuera del runner**
(`src/probar-paradas.js:217`), así que **no deberían añadir ni una fila.**

---

**Instrumento:** [`tools/grafo/firma-adyacencia.js`](../tools/grafo/firma-adyacencia.js) ·
**Tocados:** [`src/grafo.js`](../src/grafo.js) · [`src/ruta.js`](../src/ruta.js) ·
[`tools/grafo/circulacion-bici.js`](../tools/grafo/circulacion-bici.js) · **Bitácora:** nº201.
