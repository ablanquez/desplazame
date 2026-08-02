# Auditoría del 4,11 %

**Fecha:** 2026-08-02 · **Tanda 5** · Documento de auditoría.

## Qué corrige este documento y por qué

Corrige **dos afirmaciones publicadas** en `docs/PORTALES-COMO-TESTIGOS.md` (tanda 4) y **precisa
—sin corregir— qué mide** el 4,11 % de `docs/COBERTURA-OSM-VS-CALLEJERO.md` (tanda 3).

Ninguno de esos dos informes se reescribe: son registro histórico. Documentan lo que se supo en una
fecha, y lo que se supo estaba mal en dos puntos concretos que se enumeran en §5.

**Motivo de la auditoría:** en la tanda 4 se descubrió que el emparejador por nube agrupaba la
geometría de OSM **por el valor de `name`**, fusionando en un solo objeto las siete *Plaza de España*
del término. La pregunta obligada era si el instrumento que produjo el 4,11 % tenía el mismo sesgo.

**Cero peticiones de red.** Todo sale de crudos ya en disco, sello `2026-08-02T14:36:18Z`.

---

## 1 · El veredicto, primero

> **El 4,11 % era correcto y ligeramente PESIMISTA: mide lo que dice medir —km de vías cuyo eje está
> mayoritariamente sin equivalente en OSM—, es inmune al sesgo de homónimos porque su cálculo no
> toca los nombres, y una métrica alternativa que cuenta metros en vez de vías da 3,05 % una vez
> descontados los artefactos de rumbo y de trazado.**

Y el número que más importa para D0, que no se había medido nunca:

```
km del callejero municipal sin OSM equivalente Y CON PORTALES ....  19,3 km  =  0,97 %
```

Es decir: **menos del 1 % del callejero está sin mapear en sitio donde el padrón municipal dice que
hay puertas.** El resto del hueco está en descampado, polígono o suelo sin edificar.

---

## 2 · ¿Tenía el 4,11 % el sesgo de homónimos? No, y se demuestra

### 2.1 · Por el código real, no por memoria

Los tres scripts que produjeron el número siguen en disco y se han leído:

```
q3_geometrico.py  ->  q5_paralelo.py  ->  q6_final.py
```

`q3` construye el índice espacial así:

```python
for a,b in zip(pts,pts[1:]): SEG.append((a,b))
```

Una **lista plana de pares de coordenadas**. No hay `name`, no hay `id`, no hay agrupación de
ninguna clase. `q5` añade el filtro de rumbo, que es geometría pura. **La cadena entera se calcula
sobre coordenadas y ángulos: el nombre de OSM no interviene en ningún punto.**

El que sí agrupa por nombre es `q2_barrido.py` —`OSM.setdefault(" ".join(cuerpo), set())`— y ése
produce la columna *ENCONTRADA / DUDOSA / NO ENCONTRADA*, **no el 4,11 %**.

### 2.2 · Por reproducción

El barrido se ha vuelto a ejecutar entero con los mismos parámetros (U = 5 m, tolerancia ±30°,
paso 25 m, criterio ≥50 %):

```
vías "NO existe en OSM" ....  255      (informe publicado: 255)   ✅
km sin equivalente .........  81,9 km  (informe publicado: 81,9)  ✅
porcentaje .................  4,11 %   (informe publicado: 4,11)  ✅
```

**Reproducción exacta.** Barajar los nombres de OSM no puede mover este número porque el número no
los lee.

### 2.3 · El inventario de homónimos, que sí afecta a otra cosa

```
nombres distintos en OSM ...................................  4.384
de ellos REPETIDOS en objetos separados ....................    344  (7,8 %)
Calle Mayor 13 · Miguel Servet 9 · Francisco de Goya 7 · Ramón y Cajal 7
Plaza de España 7 · Moncayo 6 · Zaragoza 6 · Huesca 6 · San Jorge 6 · Tenor Fleta 6
```

**A cuántas vías municipales afectó** (esto sí está tocado, y es la columna del *nombre*):

```
vías con cubo ENCONTRADA por texto ..........................  2.595
⛔ de ellas, el nombre OSM asignado corresponde a >1 objeto ...    163  (6,3 %)
```

En esas **163 vías el emparejador de texto acertó el nombre y no dice cuál de los objetos es**:
`CALLE DOS DE MAYO`, `CALLE SEGOVIA`, `CALLE ALCALÁ`, `CALLE HERNÁN CORTÉS`, `CALLE MARIE CURIE`…
No es un error de cobertura; es una **ambigüedad de identidad** que hay que resolver antes de usar
esa columna para enganchar nada.

---

## 3 · El eje que sí le faltaba al instrumento: la calle vecina

La tanda 3 probó su instrumento desplazando el callejero **50 m, 200 m y 2 km**. Nunca **15-20 m**,
que es lo que separa dos calles paralelas de una misma manzana. Un desplazamiento grande saca el eje
de la ciudad, que es fácil de detectar; **uno pequeño lo pone encima de la calle de al lado**, que
es el error que produciría falsas coberturas en manzana cerrada.

Muestra de 800 vías (semilla `20260802`), instrumento v2 exacto, **en las cuatro direcciones** —
porque la tanda 4 dejó declarado como cabo abierto que solo se había probado el norte:

```
 despl.      NORTE      SUR     ESTE    OESTE    media
 sin mover   93,2 %       -        -        -    93,2 %
 10 m        43,6 %   46,6 %   44,8 %   45,7 %   45,2 %
 15 m        28,0 %   29,3 %   29,3 %   29,1 %   28,9 %
 20 m        20,4 %   21,4 %   20,0 %   20,9 %   20,7 %
 30 m        15,1 %   16,0 %   15,4 %   16,2 %   15,7 %
 50 m        13,2 %   13,2 %   14,5 %   15,0 %   14,0 %
 200 m        9,1 %   11,3 %   11,3 %   10,8 %   10,6 %
 2 km         5,2 %    6,4 %    4,4 %    6,7 %    5,7 %
```

**El instrumento pasa el eje corto: 93,2 % contra 20,7 % a 20 metros.** Y las cuatro direcciones
caen dentro de ±1,5 puntos entre sí, así que **no hay sesgo direccional** — cabo cerrado.

---

## 4 · El número rehecho, y por qué el susto no era un hallazgo

### 4.1 · La objeción que parecía definitiva

El 4,11 % no cuenta *km sin cobertura*: cuenta **km de vías mayoritariamente sin cobertura**.

```
una vía de 1.000 m cubierta al 49 %  aporta 1.000 m al hueco
una vía de 1.000 m cubierta al 51 %  aporta     0 m
```

Sumando `largo × (1 − cobertura)` vía a vía salía **166,5 km = 8,36 %**, el doble, con el 62,4 %
repartido *dentro* de calles que sí existen en OSM.

### 4.2 · Clasificar antes de contar

Cada punto no cubierto, con tres hipótesis distinguidas y un **testigo independiente de OSM** (¿hay
portales ahí?). Barrido completo de las 255, muestra de 500 de las 3.104 (semilla `20260802`):

| | las 255 "no existe" | las 3.104 "sí existe" |
|---|---:|---:|
| cubierto | 19,3 km (23,5 %) | 1.771,7 km (92,8 %) |
| **H2** hay OSM al lado con **otro rumbo** | 26,5 km (32,3 %) | 80,2 km (4,2 %) |
| **H1** en un **extremo** del eje municipal | 10,6 km (12,9 %) | 22,6 km (1,2 %) |
| **H3b** interior, sin OSM, **sin portales** | 16,7 km (20,3 %) | 24,8 km (1,3 %) |
| ⛔ **H3** interior, sin OSM, **con portales** | 8,9 km (10,9 %) | 10,4 km (0,5 %) |

**El 72,3 % del "hallazgo" era ruido de mi propio instrumento.** El criterio de paralelismo ±30 % —el
que salvó la medición de la tanda 3— falla justo donde el eje municipal va recto y el de OSM curva:
glorietas, chaflanes, rotondas. Y el eje municipal se prolonga más allá que el de OSM en los
extremos, que es una diferencia de trazado, no un hueco de mapeado.

### 4.3 · El recuento global

```
callejero municipal ....................................... 1.991,7 km

km de eje sin OSM paralela (bruto) ........................   200,7 km = 10,07 %
   ARTEFACTO (otro rumbo, o extremo del trazado) ..........   139,9 km =  7,02 %
   sin OSM de verdad ......................................    60,8 km =  3,05 %
      ... y CON testigo de portales .......................    19,3 km =  0,97 %

PUBLICADO tanda 3 (km de vías con <50 % de su eje cubierto)    81,9 km =  4,11 %
```

**El 4,11 % sobreestima el hueco en aproximadamente un punto**, porque cuenta entera una vía que
está por debajo del 50 % —incluidos los 19,3 km de esas vías que **sí** están cubiertos—.

⭐ **Y una lección sobre el criterio grosero:** el umbral del 50 % no era el problema, era el
amortiguador. Refinar la agregación sin refinar la medición amplifica los defectos de la medición.

### 4.4 · Los tres grupos, sin cambios

```
1. existe y nombre resuelto      2.514  (74,8 %)   1.500,7 km  (75,3 %)
2. existe, nombre NO resuelto      590  (17,6 %)     409,1 km  (20,5 %)
3. NO existe en OSM                255  ( 7,6 %)      81,9 km  ( 4,1 %)
──────────────────────────────────────────────────────────────────────
TOTAL                            3.359   ✅          1.991,7 km
```

Distribución de las 255, que explica por qué el umbral no es arbitrario:

```
cobertura 0,0 : 137 vías     (135 con cobertura EXACTAMENTE 0,00)
cobertura 0,1 :  14          cobertura 0,2 :  26
cobertura 0,3 :  25          cobertura 0,4 :  42     ← 39 se quedan fuera por poco
```

---

## 5 · ⛔ Lo que hay que corregir, y dónde

### 5.1 · `docs/PORTALES-COMO-TESTIGOS.md` (tanda 4) — **dos afirmaciones falsas mías**

**§B1, línea del bloque de las 10 vías.** Publiqué 10 vías *"con ≥3 portales y nada de OSM encima"*.
**Cuatro son falsas**: mi radio era 25 m y OSM estaba justo detrás.

```
CALLE TOMILLO             portales a  25,6 m de OSM   ⛔ falso positivo
PLAZA TENIENTE POLANCO                36,6 m          ⛔ falso positivo
CAMINO HUEGA                          41,0 m          ⛔ falso positivo
CALLE EL CISTER                       44,8 m          ⛔ falso positivo
────────────────────────────────────────────────────────────────────
CALLE CIUDAD TRANSPORTE (A)           70,0 m          hueco real
CALLE EL CUARTAL                      81,8 m          hueco real
CAMINO DEL MONTÓN                    102,5 m          hueco real
CAMINO TORRE ESCOLAPIOS              103,2 m          hueco real
CAMINO DEL PASO A SAN LÁZARO         108,0 m          hueco real
CAMINO LA PURÍSIMA                   142,1 m          hueco real
```

**El número correcto de §B1 es 6, no 10.**

**§B3, "tres huecos nuevos que la tanda 3 no vio".** **Dos de los tres eran míos.** Solo
`CAMINO DEL PASO A SAN LÁZARO` (108 m) es un hueco real. Y `CALLE TOMILLO`, que publiqué como
*"contradicción irreconciliable entre los dos métodos"* con un `CAUSA NO CONFIRMADA`, está resuelta:

```
Calle Tomillo SÍ existe en OSM ......... way 793247786, highway=residential
el eje municipal está cubierto ......... 27 de 27 puntos a ≤5 m (100 %)
los 12 portales están a ................ 25,0 – 26,5 m de esa misma calle
mi radio era ........................... 25,0 m
```

Nadie mentía, y el falso positivo era mío **por un metro**. Barrio SJN, San Juan de Mozarrifar:
chalets con jardín delantero, el portal está en la valla y no en la fachada.

### 5.2 · `docs/COBERTURA-OSM-VS-CALLEJERO.md` (tanda 3) — **nada falso, una precisión**

Líneas **19**, **215** y **265**. El 4,11 % **no es inexacto**: es **ambiguo sin su definición al
lado**. Dice *"81,9 km (4,11 %)"* de *"SIN equivalente en OSM"*, y lo que mide es
**km de vías cuyo eje está cubierto en menos del 50 %**, no km de eje sin cubrir.

**No propongo tocarlo.** Propongo que quien lo cite lo cite con su definición.

### 5.3 · `DESPLAZAME-ESTADO.md` — **no contiene el número**

Comprobado: el estado no menciona el 4,11 %, ni el 1,68 %, ni las 48. Su línea 501 sigue diciendo
*"(siguiente: medir la cobertura de OSM contra las 3.359 vías municipales)"*. **El alcance de la
corrección es menor de lo que la tanda suponía: el número solo está publicado en un sitio.**
⛔ No se toca. Lo escribe la conversación de estrategia.

### 5.4 · `README.md` — no menciona cobertura. Sin cambios.

---

## 6 · ¿Cambia D0?

> **No. D0 se refuerza: el hueco de cobertura en sitio donde hay ciudad —donde el padrón municipal
> pone portales— es de 19,3 km, el 0,97 % del callejero, la mitad de la mitad de lo que su coste
> declarado sugería.**

Y las **48 del hueco duro aguantan**, ahora con el control positivo que faltaba:

```
de las 48, sin ningún portal ...................................... 23  (47,9 %)
tasa de "sin portales" en el callejero entero ..................... 628 de 3.359 (18,7 %)
⇒ razón 2,6×  — no es casualidad, es una concentración medida

de esas 23, con cobertura EXACTAMENTE 0,00 ........................ 20 de 23
   CALLE GABRIEL F. CISNEROS LABORDA  961 m   cobertura 0,00
   CALLE DOCTOR ENRIQUE PELAYO LAHUERTA 567 m cobertura 0,00
   CALLE GREGORIO PECES BARBA         496 m   cobertura 0,00
   CALLE MANUEL FRAGA IRIBARNE        418 m   cobertura 0,00
   CAMINO VALDESPARTERA               287 m   cobertura 0,00
   BULEVAR DEL CIUDADANO              284 m   cobertura 0,00
```

**Ni un punto de su eje tiene una línea de OSM paralela a 5 m, y no tienen portales asignados.** Dos
fuentes independientes que no se han consultado dicen lo mismo. Valdespartera, Arcosur, Parque
Venecia: **ahí todavía no hay ciudad**.

---

## 7 · Los ejes que un instrumento puede fallar, y cuáles están comprobados

Esta es la lista que la tanda 4 pedía enumerar aunque no se pudiera medir toda hoy.

| eje | pregunta | tanda 3 | tanda 4 |
|---|---|:--:|:--:|
| **posición** | ¿se hunde con el dato movido lejos? | ✅ 2 km | ✅ 2 km |
| **vecindad** | ¿distingue una calle de la de al lado? | ✅ **hoy**, 20 m | ⬜ no medido |
| **dirección** | ¿da igual hacia dónde se mueva? | ✅ **hoy**, 4 rumbos | ⬜ no medido |
| **identidad** | ¿sabe cuántas cosas hay? | ✅ inmune (no usa nombres) | ⛔ **falló** (nº38) |
| **correspondencia** | ¿es LA MISMA cosa, o una parecida? | ⚠️ **no lo pregunta** | ✅ es su función |
| **umbral / cola** | ¿a quién deja fuera el percentil? | ⬜ no medido | ⛔ **falló** (nº42) |
| **escala** | ¿funciona igual en una vía de 50 m que de 3 km? | ⬜ **no medido** | ⬜ **no medido** |
| **densidad** | ¿funciona igual en el casco que en el campo? | ⬜ parcial | ⚠️ solo declarado |
| **agregación** | ¿el criterio de resumen absorbe o amplifica ruido? | ✅ **hoy**: absorbe | ⬜ n/a |

⚠️ **El eje ESCALA no está medido en ninguna de las dos tandas**, y hay razón para sospecharlo: una
vía de 50 m tiene **2 puntos** muestreados a paso 25 m, y con 2 puntos el criterio del 50 % es una
moneda. **Queda como cabo abierto declarado.**

---

## 8 · Qué no se ha mirado, y por qué

- ⛔ **El `highway` de 35.555 ways de 55.452.** El crudo de nombres solo trae los que tienen `name`.
  **Pide red, y esta tanda tiene cero.** Cabo abierto a propósito hasta H1.
- **El eje ESCALA** (§7): sospechado, no medido.
- **Las 163 vías con nombre ambiguo** no se han resuelto una a una; solo se han contado.
- **Los 24,8 + 16,7 km de H3b** (sin OSM y sin portales) no se han clasificado: pueden ser caminos
  agrícolas reales sin mapear o trazados municipales sobre suelo sin abrir. `NO CONSTA`.
- **La muestra de 500 del lado B** se extrapola por km con factor 5,46. Es una extrapolación, no un
  barrido: el ±0,3 % de esa cifra no está acotado formalmente.
- **Nada de tiempo real**, fuera de la v1 por decisión previa.

---

## 9 · Trazas

Todo procede de crudos ya en disco, **sin ninguna petición de red**:

| dato | fichero | publicado |
|---|---|---|
| geometría OSM (55.452 ways) | `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_geometria.json` | **NO** (34 MB) |
| tags OSM (19.897 con nombre) | `data/exploracion/2026-08-02_osm_overpass_zaragoza-termino_nombres.json` | sí |
| callejero (3.359 vías) | `data/exploracion/2026-08-02_wfs_urbanismo-Vias_completa-4326.json` | sí |
| 46.150 portales | dataset heredado, solo lectura | **NO** |

Scripts auditados (siguen en disco, fuera del repositorio): `q2_barrido.py`, `q3_geometrico.py`,
`q5_paralelo.py`, `q6_final.py`. Scripts de esta tanda: `u1`…`u8`, desechables.
Semilla de todo muestreo: `20260802`. Proyección equirectangular local en 41,65° N, **en metros**.
