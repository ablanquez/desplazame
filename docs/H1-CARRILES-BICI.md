# H1 · ¿QUÉ SABE EL AYUNTAMIENTO DE SUS CARRILES BICI?

*Tanda 18 · 2026-08-04 · una descarga y un inventario, antes de diseñar nada.*

> ⛔⛔ **Esta tanda MIRA. No diseña el modelo de tres capas y no toca el motor.** Ni el planarizado,
> ni el enganche, ni D4, ni la salida de texto. La capa municipal **no entra en el grafo**: se lee,
> se compara y se cuenta.

> **Este documento se AÑADE, no reescribe nada.**

```
node src/bici-inventario.js      # todo lo de aquí
```

**Peticiones al WFS: 5 de 8 de presupuesto** — 3 `DescribeFeatureType` + 2 `GetFeature`. La búsqueda
de capas se hizo sobre el `GetCapabilities` **ya guardado**: cero peticiones.

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ SÍ distingue, y sin huecos** | `tipo_carri` está relleno en el **100 %** de las 733 features y **113,13 km (33,9 %) son «acera»** contra **82,94 km (24,9 %) «calzada»**. La pregunta que decidía la tanda tiene respuesta: **el papel por modo se puede rellenar con datos.** |
| **⭐⭐ Y trae el código de vía bueno** | `vias_codigo` en el **100 %** de las features, y **los 733 códigos existen en el callejero municipal** — el mismo `codigoVia` de los portales. Es el requisito de Antonio servido en bandeja. |
| **⚠️⚠️ Pero asignarlo a una arista NO es unívoco** | Sólo el **21,3 % de los metros** tiene **una sola** arista candidata a 15 m y en paralelo. En el **78,7 %** hay dos o más: acera de un lado, calzada, acera de enfrente. **Elegir ahí es inventar.** |
| **⚠️⚠️⚠️ Y el único caso con verdad sobre el terreno DISCREPA** | Del tramo de la ruta 7 que Antonio anduvo, el municipal dice **64 % «Unidireccional CALZADA»**. Antonio dijo *«carril bici a misma cota que acera pegado»*. La línea municipal y la de OSM son **la misma** (mediana 0,4 m): no es un fallo de emparejamiento. |
| **⛔ Y no hay segunda opinión** | La otra capa (`carril_bizi_20250127`) es **la misma geometría vértice a vértice** (mediana del cruce **0,00 m**). Descifra el código y da el sentido; **no es un testigo independiente del tipo.** |
| **⭐ OSM solo no puede** | El **90,6 %** de sus 1.503 ways `cycleway` no traen `segregated`, ni `foot`, ni `bicycle`. |
| **⚠️ Y el caso inverso existe** | **1,30 km** de carril bici *sobre acera* caen en un `footway` de OSM, y sólo **6 de 59 ways** llevan `bicycle=*`. |
| **⚠️ lo que sale mal (mío)** | Bitácora nº94: **medí el tramo de la ruta 7 sobre el `way` entero (3,02 km) en vez de sobre los 1.269 m que Antonio anduvo.** Cazado por ojo, leyendo dos números que no se parecían en la misma pantalla. |

---

## A · LOCALIZAR Y DESCARGAR

### A1–A2 · Las candidatas, y cuál se elige

Buscadas en `data/exploracion/2026-08-02_idezar-geoserver_wfs-getcapabilities.xml` (**cero
peticiones**) por CONTENIDO —*bici · ciclable · ciclista · ciclovía · bizi*— y no sólo por «bici».

⭐ **Con su positivo de control primero**, y no es un adorno: **la primera versión del buscador tenía
la barra mal escapada en la expresión regular y devolvía «0 candidatas» sobre un fichero que contiene
32 veces la palabra «bici»**. Un cero y un buscador roto son la misma pantalla.

```
   FeatureType en el fichero                                178
   ⭐ control POSITIVO · ¿encuentra MU1_jerarquia_viaria?    1  ✅
   ⭐ control NEGATIVO · una capa inventada                  0  ✅
```

Las **12 candidatas**:

| capa | qué es |
|---|---|
| `movilidad:MU1_CC_aforos_bici_y_vmp` | aforo |
| `movilidad:MU1_CC_bici_comparativa_2023_2024` · `..._2024_2025` | aforo |
| `movilidad:MU1_CC_carriles_bici_todos_2023` · `_2024` · `_2025` | ⚠️ **aforo**, pese al nombre: `num_est`, `nodo_d`, `nodo_h`, `iml` |
| `movilidad:MU1_CC_reparto_modal_bicis_y_VMP_2024` · `..._2025` | aforo |
| `movilidad:MU1_estaciones_bici_ubicacion` | PUNTOS (estaciones BiZi) |
| `movilidad:MU2_aparcabicis` | PUNTOS |
| **`movilidad:MU2_carriles_bici`** | ⭐ **RED, con tipo Y código de vía** |
| `idezar_base:carril_bizi_20250127` | RED, sólo `TIPO_DIREC` y `TIPO_CARRI` |

⇒ **Se elige `movilidad:MU2_carriles_bici`**, y el motivo es concreto: **es la única que trae a la vez
el TIPO de carril y el CÓDIGO DE VÍA.** Las tres `MU1_CC_carriles_bici_todos_*` engañan por el
nombre: abiertas, son aforos.

⭐ Y `carril_bizi_20250127` **se descarga igual**, para contrastar el vocabulario (ley 5: el aspecto
de rigor no es calidad).

### A4 · La descarga, verificada ANTES de usarla

```
   ── movilidad:MU2_carriles_bici  (la elegida) ──────────────────────────────
   features                                                 733
   numberMatched / numberReturned                           733 / 733
   sello (timeStamp del servidor)                           2026-08-04T11:52:40.217Z
   CRS declarado                                            urn:ogc:def:crs:EPSG::4326
   vértices                                                 20814
   extensión real                    lon -1.0377 … -0.7727   lat 41.5994 … 41.7234
   ⭐ ¿son GRADOS de verdad, no metros disfrazados?          ✅ sí
   ⚠️ vértices FUERA del término (ley 41, otras Zaragozas)  0  ✅ ninguno
   ⭐ longitud MEDIDA sobre la geometría                     333.72 km
```

⭐ **El CRS no se cree por el nombre**: se comprueba contra el rango real de las coordenadas. Y
`numberMatched === numberReturned` porque, si el servidor hubiera paginado, el inventario contaría un
trozo y no lo diría.

---

## B · EL INVENTARIO

### B1 · Los campos, uno a uno

«Relleno» = ni `null`, ni cadena vacía, ni sólo espacios.

```
   campo                   tipo               relleno  valores distintos
   fid                     number       733 (100.0 %)                733
   fecha                   string        424 (57.8 %)                 87
   tipo_carri              string       733 (100.0 %)                  9
   vias_codigo             number       733 (100.0 %)                255
   vias_tipo_via           string       733 (100.0 %)                 17
   vias_nombre_reducido    string        713 (97.3 %)                254
   observaciones           string        343 (46.8 %)                177
   longitud_total          number       733 (100.0 %)                439
```

### B2 · ⭐⭐⭐ La pregunta que lo decide todo: ¿distingue acera de calzada?

**Sí.** Los valores literales, con el reparto **en metros** (una feature es una unidad arbitraria:
hay una de 448 m junto a otras de 30):

```
   tipo_carri (valor literal del dato)           líneas      metros   % metros
   Bidireccional acera                              775    89.84 km     26.9 %
   Senda ciclable                                    69    84.51 km     25.3 %
   Calmado                                          123    49.69 km     14.9 %
   Bidireccional calzada                            509    48.74 km     14.6 %
   Unidireccional calzada                           504    34.20 km     10.2 %
   Unidireccional acera                             112    23.30 km      7.0 %
   En Construcción                                   17     2.08 km      0.6 %
   No Municipal                                      10     1.35 km      0.4 %
   Senda Ciclable                                     1        28 m      0.0 %
```

Agrupado por lo que el texto dice del sitio físico *(la agrupación es mía; los valores literales
están arriba para poder rebatirla)*:

| | metros | % |
|---|---:|---:|
| **SOBRE LA ACERA** | **113,13 km** | **33,9 %** |
| SENDA CICLABLE (vía propia) | 84,53 km | 25,3 % |
| **EN CALZADA** | **82,94 km** | **24,9 %** |
| CALLE CALMADA (compartida con el tráfico) | 49,69 km | 14,9 % |
| EN OBRAS | 2,08 km | 0,6 % |
| NO MUNICIPAL | 1,35 km | 0,4 % |

⚠️ **Y un detalle que delata cómo se mantiene la capa:** «Senda ciclable» y «Senda Ciclable» conviven
como valores distintos (84,5 km contra 28 m). **El vocabulario no está controlado por el servidor: es
texto escrito a mano.** Que sea legible no significa que sea un enumerado (ley 5).

### B2b · ⭐⭐ El contraste con la otra capa — y lo que descubre

`carril_bizi_20250127` trae el mismo hecho como **código sin leyenda**: el WFS no publica el
diccionario que dice qué es un «3». ⇒ `NO CONSTA`… salvo que se cruce geométricamente.

```
   metros de MU2 con una línea de la otra capa a menos de 5 m   317.70 km  (95.2 %)
   distancia del cruce · mediana · p90                          0.00 m · 0.00 m

   tipo_carri (MU2)  ⇄  TIPO_CARRI (carril_bizi)             metros        %
   Bidireccional acera ⇄ 3                                 84.58 km   26.6 %
   Senda ciclable ⇄ 5                                      84.51 km   26.6 %
   Calmado ⇄ 4                                             49.62 km   15.6 %
   Bidireccional calzada ⇄ 2                               40.88 km   12.9 %
   Unidireccional calzada ⇄ 6                              32.94 km   10.4 %
   Unidireccional acera ⇄ 8                                22.32 km    7.0 %
   ── y a partir de aquí, ruido: ninguna pareja pasa de 521 m ──
```

⭐ **El código queda descifrado por correspondencia** —3=Bidireccional acera, 5=Senda ciclable,
4=Calmado, 2=Bidireccional calzada, 6=Unidireccional calzada, 8=Unidireccional acera— y los seis
pares se llevan el **99,1 %** de los metros.

⛔⛔ **PERO OJO A LA DISTANCIA DEL CRUCE: mediana 0,00 m y p90 0,00 m.** Eso no es «las dos capas
coinciden»: es que **son la misma geometría, vértice a vértice**. Una sale de la otra.

⇒ ⚠️ **`carril_bizi_20250127` NO es un testigo independiente.** Sirve para descifrar el código y para
el sentido, y para nada más. **El campo `tipo_carri` no tiene una segunda opinión en ninguna fuente
municipal.**

### B3 · ⭐ El nombre de vía — el requisito nuevo de Antonio

```
   features con `vias_codigo`                               733  (100.0 %)
   features con `vias_nombre_reducido`                      713  (97.3 %)

   ⭐ códigos que EXISTEN en el callejero municipal (3.359 vías)   733  (100.0 %)
      códigos que no están en el callejero                          0
      ⭐ ¿el nombre de la capa coincide con el del callejero?  671 sí · 42 no  (94.1 %)
```

⭐⭐ **Es el mismo `codigoVia` que ya usan los portales.** No hay que emparejar por nombre: hay clave.

Y las 42 discordancias son **la familia de excepción ya conocida** —el tipo de vía dentro del nombre:

```
   17620   callejero: CARRETERA AUTOVÍA DE MADRID      capa bici: AUTOVÍA DE MADRID
    5680   callejero: CARRERA DE LA CAMISERA           capa bici: DE LA CAMISERA
    7585   callejero: ROTONDA CIUDAD DE TOULOUSE       capa bici: CIUDAD DE TOULOUSE
   32120   callejero: CAMINO CAMINO DE LAS TORRES      capa bici: CAMINO DE LAS TORRES
```

⚠️ **Y no importan**, porque el código manda: el nombre se puede tomar del callejero.

### B4 · Sentido, longitud, estado y fecha

- **Sentido**: `MU2_carriles_bici` **NO lo trae**. Lo trae la otra capa (`TIPO_DIREC`: bidireccional ·
  unidireccional · senda ciclable · calmado). ⇒ **para el sentido harían falta las dos.**
- **Fecha**: sólo el **57,8 %** la trae. Rango **2004-12-01 … 2026-06-01**; el pico es 2020 (108). ⚠️ El
  42,2 % sin fecha significa que **no se puede saber si un carril sigue existiendo**.
- **Estado**: no hay campo de estado. Lo más parecido son dos valores de `tipo_carri`: `En Construcción`
  (2,08 km) y `No Municipal` (1,35 km).
- **`longitud_total` declarado contra la geometría medida** (contador independiente):

```
   suma DECLARADA / suma MEDIDA        307.11 km / 333.72 km   (dif 8.7 %)
   dif por feature · mediana · p10 · p90        0.1 m · -0.4 m · 35.6 m
```

⚠️⚠️ **La mediana es 0,1 m y la suma se va un 8,7 %: eso no es ruido repartido.** Unas pocas features
cargan con toda la diferencia, y la causa es que **`longitud_total` describe UNA línea y la feature
puede traer varias** (733 features → 2.120 líneas). ⛔ Para citar kilómetros se usa la **geometría
medida (333,72 km)**, que es la que se puede recalcular.

### B5 · Lo demás que trae

- `observaciones` en el **46,8 %**, texto libre y útil: *«Rotonda»*, *«Andador»*, *«Anillo Verde»*,
  *«Parque Oliver»*, *«Enlace Gómez Laguna con Anillo Verde»*.
- `vias_tipo_via`: `CL:248 AV:212 PS:60 VI:52 CT:47 CN:30 RD:25 PQ:18 PL:18 …` — 17 valores.

---

## C · EL SOLAPE CON EL GRAFO

### C1 · Los kilómetros de cada lado

```
   capa municipal `MU2_carriles_bici` (medido)              333.72 km
   capa `carril_bizi_20250127` (medido)                     322.39 km
   aristas `highway=cycleway` del grafo                     4675  (191.47 km)
```

⚠️ **Y no son comparables tal cual**: un carril bidireccional sobre acera es UNA línea municipal y
puede ser DOS ways de OSM (la acera y el carril), o ninguno.

### C2 · ⭐⭐ El emparejamiento, con su contraprueba de desplazamiento DELANTE

La pregunta antes del número: **esto puede medir densidad urbana en vez de correspondencia.** En el
casco hay una arista cada 15 m; cualquier línea cae cerca de alguna. ⇒ **la capa entera se mueve 2 km
al este y tiene que hundirse.** Y el radio es un mando mío, así que —escarmentado del nº93— va la
curva entera con su desplazada al lado:

```
   radio         metros emparejados  % de la capa   ·      DESPLAZADA 2 km    razón
   5 m                    323.33 km        96.9 %   ·     8.9 % (29.80 km)    ×10.8
   10 m                   330.58 km        99.1 %   ·    16.4 % (54.69 km)     ×6.0
   15 m                   332.20 km        99.5 %   ·    23.4 % (78.01 km)     ×4.3
   20 m                   332.86 km        99.7 %   ·    29.7 % (99.20 km)     ×3.4
   30 m                   333.16 km        99.8 %   ·   41.3 % (137.85 km)     ×2.4
```

✅ **Se hunde.** A 5 m son ×10,8 y a 15 m ×4,3: mide correspondencia, no densidad.

### C2b · ⚠️⚠️ Ese 99,5 % NO significa lo que parece

Sale demasiado redondo para dejarlo. **El grafo tiene una línea encima de cada calle de Zaragoza: que
un carril bici caiga «sobre alguna arista» es casi trivial.** La pregunta útil no es SI cae, es SOBRE
CUÁL — y si hay una candidata o tres.

**Ways distintos que compiten dentro de 15 m y con el mismo rumbo:**

```
   candidatos                  metros        %
   1  ⭐ unívoco              70.73 km     21.3 %
   2                         75.57 km     22.7 %
   3                         78.42 km     23.6 %
   4                         48.29 km     14.5 %
   5 o más  ⛔               59.18 km     17.8 %
```

⇒ ⚠️⚠️ **Sólo el 21,3 % de los metros se puede asignar sin decidir nada. En el 78,7 % hay dos o más
candidatas** —la acera de un lado, la calzada, la acera de enfrente— **y elegir ahí es inventar.**
**Éste es el número que condiciona el diseño de la tanda siguiente**, no el 99,5 %.

### C3 · Los tres grupos, en metros

| grupo | metros | |
|---|---:|---|
| **EN LOS DOS** | 332,20 km | 99,5 % de la capa |
| **SOLO EN EL MUNICIPAL** | **1,53 km** | 0,5 % |
| **SOLO EN OSM** | **6,27 km** | 3,3 % del `cycleway` |

Lo que **sólo tiene el municipal** (1,53 km), clasificado antes de contarlo: `Senda ciclable` 903 m
(59 %), `No Municipal` 458 m (30 %), y migajas del resto.
⇒ ⭐ **El grafo NO se está perdiendo red ciclable.** La costura que pedía parada por «mucho carril
municipal que OSM no tiene» **no se dispara**: son 1,5 km de 333.

Lo que **sólo tiene OSM** (6,27 km, 961 aristas): 3,54 km sin nombre, 2,56 km con nombre, 166 m con
`foot=no`. Los nombres con más metros: *Calle Zaragoza* (252 m), *Avenida de Tenor Fleta* (160 m),
*Calle E* (130 m), *Avenida de Casablanca* (110 m). ⚠️ **Son trozos sueltos, no una red paralela.**

### C4 · ⭐⭐ El caso que motiva todo esto — el tramo de la ruta 7

⛔ Se identifica **por su `way` de OSM**, no por coordenadas de memoria: ways `354344721` y
`475881583`, el corredor del Actur. Y ⛔ **no se mide sobre los ways enteros** —miden 3,02 km y
Antonio anduvo 1.269 m—: las aristas salen de `rutas-antonio.js --aristas` (bitácora nº94).

```
   aristas de esos ways en el grafo (el way ENTERO)         53  (3.02 km)
   ⭐ …de ellas, LAS QUE PISA LA RUTA Nº7                    16  (1.19 km)
      way 354344721 · OSM dice: highway=cycleway
      way 475881583 · OSM dice: highway=cycleway · oneway=yes
```

**Para cada metro del tramo que Antonio anduvo, la línea municipal más cercana y paralela:**

```
   tipo_carri · vía                                            metros        %
   Unidireccional calzada  ·  SAN JUAN DE LA PEÑA               760 m   64.0 %
   Bidireccional acera  ·  ACADEMIA GENERAL MILITAR             252 m   21.3 %
   Bidireccional calzada  ·  ACADEMIA GENERAL MILITAR           175 m   14.7 %

   distancia a la línea municipal · mediana · p90        0.4 m · 1.2 m
```

**Tres cosas, y la tercera es un problema:**

1. ⭐ **La capa municipal SÍ lo tiene**, entero: 100 % del tramo con una línea a menos de 30 m, y con
   mediana de **0,4 m** — la línea municipal y la de OSM son prácticamente la misma.
2. ⭐⭐ **Y lo llama AVENIDA DE SAN JUAN DE LA PEÑA, código 28220.** Es exactamente el nombre que la
   tanda 17 dedujo de los portales (`san juan pena`, 37 votos de 44). **Dos caminos independientes
   llegan al mismo nombre**, y eso cierra el cabo nº2 de aquella tanda: **el método acertaba la vía.**
3. ⚠️⚠️⚠️ **PERO EL TIPO NO CUADRA CON LO QUE ANTONIO ANDUVO.** Él dijo *«carril bici a misma cota
   que acera pegado»*; el municipal dice **64 % «Unidireccional CALZADA»** y sólo **21,3 %
   «Bidireccional acera»**.

⛔ **Y no es un fallo de emparejamiento**: con mediana 0,4 m no hay margen para haber cogido la línea
de al lado. Las lecturas posibles, sin elegir ninguna:

- el `tipo_carri` de ese tramo está mal o es grueso;
- o «calzada» en el vocabulario municipal significa *«va por el corredor de la calzada»* y no *«a
  cota de calzada»*, que es lo que Antonio describía;
- o el tramo cambia de cota a lo largo de sus 760 m y ninguna etiqueta única lo describe.

⇒ **La discrepancia es el hallazgo, y se reporta hacia arriba.** El único sitio del proyecto donde
hay verdad sobre el terreno es el único donde el campo que iba a rellenar el modelo no coincide — y
**no hay segunda opinión municipal** (§B2b).

---

## D · Y QUÉ DICE OSM POR SU CUENTA

### D1 · Las etiquetas secundarias de los 1.503 ways `cycleway`

⭐ **Positivo de control primero**: los 1.503 ways son vistos como `highway=cycleway` por el mismo
buscador que va a contar los ceros. ✅

```
   etiqueta                   ways que la traen        %   valores
   name                                     816   54.3 %   (154 distintos)
   segregated                                39    2.6 %   yes:39
   foot                                      82    5.5 %   no:49  use_sidepath:16  yes:10  designated:7
   bicycle                                   87    5.8 %   designated:67  yes:17  permissive:3
   surface                                 1016   67.6 %   asphalt:622  concrete:306  paving_stones:49
   oneway                                   536   35.7 %   yes:396  no:140
   width                                     94    6.3 %   1.5:31  2:18  2.5:14  1:8
   cycleway                                 294   19.6 %   crossing:258  traffic_island:26  link:5
   cycleway:right                             0    0.0 %
   cycleway:left                              0    0.0 %
   lit                                      555   36.9 %   yes:544  no:11
   traffic_sign                               0    0.0 %
```

⚠️ **Y el 45,7 % de los `cycleway` no tiene ni nombre** — que es el requisito nuevo de Antonio,
incumplido justo donde la capa municipal sí lo tiene.

### D2 · ¿Puede OSM distinguir por sí solo los tres casos?

```
   ways `cycleway` con `segregated`                    39  ( 2.6 %)
      con `foot`/`bicycle` pero sin `segregated`      102  ( 6.8 %)
   ⛔ sin ninguna de las tres                        1362  (90.6 %)
```

⇒ **No.** En el **90,6 %** de los ways, OSM no dice si el carril va segregado, sobre acera o
compartido.

### D3 · ⭐⭐ ¿Cuál de las dos fuentes distingue mejor?

| | dice el tipo | dice la vía | independiente |
|---|---|---|---|
| **municipal `MU2_carriles_bici`** | **100 % de los metros** | **100 % con `codigoVia`** | ⚠️ sin segunda opinión |
| **OSM** | 9,4 % de los ways | 54,3 % con `name` | ✅ otra comunidad |

⇒ **Para el TIPO, el municipal gana por goleada y OSM casi no aporta. Para la GEOMETRÍA, hacen falta
las dos**: OSM tiene 6,27 km de `cycleway` que el municipal no reconoce y el municipal tiene 1,53 km
que OSM no tiene. **Y para el sentido hace falta la tercera** (`carril_bizi.TIPO_DIREC`).

### D4 · ⚠️⚠️ El caso inverso: aceras que llevan bici y OSM llama sólo `footway`

A qué `highway` de OSM cae encima cada metro de carril bici municipal:

```
   highway de OSM              metros        %   tipo municipal dominante
   cycleway                 184.87 km   55.7 %   Bidireccional acera (45.0 %)
   track                     52.41 km   15.8 %   Senda ciclable (97.4 %)
   tertiary                  20.83 km    6.3 %   Calmado (88.4 %)
   footway                   20.04 km    6.0 %   Senda ciclable (77.0 %)
   secondary                 14.70 km    4.4 %   Calmado (96.2 %)
   residential               13.95 km    4.2 %   Calmado (80.4 %)
   path                      12.56 km    3.8 %   Senda ciclable (92.2 %)
   primary                    3.71 km    1.1 %   Calmado (97.8 %)
```

⭐⭐ **Esta tabla es el modelo de tres capas dibujado sin querer**: el mismo hecho municipal
—*«aquí hay carril bici»*— cae sobre ocho `highway` distintos de OSM. **Una línea de `tertiary` con
`Calmado` encima es una calle para el coche Y una vía ciclable a la vez**, y hoy el grafo sólo puede
guardar una de las dos cosas.

Y el caso que pedía la costura:

```
   ⭐⭐ metros de carril bici SOBRE ACERA que caen en un `footway` de OSM   1.30 km
      ways `footway` implicados                                            59
      …de ellos, con `bicycle=*` en OSM                             6  (10.2 %)
```

⇒ ⚠️ **53 ways de acera llevan bici y OSM no lo dice.** Son sólo 1,3 km, pero es exactamente el caso
que el modelo nuevo tiene que poder representar y el motor de hoy no puede.

---

## E · EL VEREDICTO Y LA PARADA

### E1 · ⭐⭐ En una frase

> **SE PUEDE RELLENAR CON DATOS, y con datos buenos —el municipal declara el tipo en el 100 % de sus
> 333,72 km y trae el `codigoVia` bueno en el 100 % de sus features—, PERO LLEVARLO A UNA ARISTA
> CONCRETA NO ES UN PROBLEMA DE DATOS SINO DE ASIGNACIÓN: sólo el 21,3 % de los metros tiene una
> única arista candidata, y en el único tramo con verdad sobre el terreno el tipo que declara el
> municipal no coincide con lo que Antonio anduvo.**

### E2 · Qué condiciona el diseño de la tanda siguiente — **anotado, no diseñado**

1. ⭐⭐ **La capa NO trae la asignación, hay que construirla.** El 78,7 % de los metros tiene 2+
   aristas candidatas. Ahí hará falta una regla —y una regla es una decisión de Antonio, no mía.
   *Pista medida: el `tipo_carri` ya dice de qué lado va («acera» contra «calzada»), así que el propio
   campo puede desempatar. **No lo he implementado.***
2. ⭐⭐ **El nombre de vía viene con clave, no con texto.** `vias_codigo` → callejero. Nada de
   emparejar por nombre; el 94,1 % que coincide es información, no el mecanismo.
3. ⚠️ **Harían falta DOS capas municipales, no una**: el sentido está sólo en `carril_bizi_20250127`.
4. ⚠️ **El tipo no tiene testigo independiente**, y el único contraste sobre el terreno discrepa. Lo
   que se guarde tendrá que poder decir *de dónde sale* y *con qué confianza*.
5. ⭐ **La tabla de D4 es el argumento del modelo**: ocho `highway` de OSM bajo el mismo hecho
   municipal. Un solo valor de precisión por arista no puede representarlo.
6. ⚠️ **El 42,2 % de la capa no tiene fecha** ⇒ no se puede saber si un carril de 2004 sigue ahí.

### E3 · Lo que la capa NO resuelve

- **No dice la cota.** «Acera»/«calzada» es dónde va pintado, no si está al mismo nivel. Es
  justamente lo que Antonio describió y lo que no cuadra.
- **No dice si se puede andar por él.** Es una capa de bicis; el peatón no aparece.
- **No trae sentido** (está en la otra capa).
- **No tiene estado de servicio**: `En Construcción` son 2,08 km de 2026, y nada dice si ya se abrió.
- **No cubre los 6,27 km de `cycleway` que sólo tiene OSM.**

### E4 · ⛔ PARADA

El modelo de tres capas se diseña con Antonio delante. Aquí no se ha implementado nada de él.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que el WFS sirviera metros dentro de un GeoJSON** (el fallo de la tanda 0) — **no**: son grados,
  comprobado contra el rango, no contra el nombre del CRS.
- **Homónimos de otras Zaragozas** (ley 41) — **0 vértices** fuera del término, en las dos capas.
- **Que el servidor hubiera paginado** — **no**: `numberMatched === numberReturned` en las dos.
- **Que el emparejamiento midiera densidad urbana** (el fallo de la tanda 3) — **no**: se hunde ×10,8
  al desplazar la capa 2 km.
- **Mucho carril municipal que OSM no tenga** (la costura de parada) — **no**: 1,53 km de 333.
- **Un campo de estado o de cota** — **no existe** en ninguna de las dos capas.

## LO QUE NO SE HA COMPROBADO

- **Que el `tipo_carri` sea correcto en ningún sitio.** El único contraste con el terreno es el tramo
  de la ruta 7, y **discrepa**. Los otros 332 km no los ha andado nadie.
- **Qué significan exactamente «acera» y «calzada» en el vocabulario del Ayuntamiento.** No hay
  leyenda publicada; lo que hay es el literal del campo.
- **Las tres capas `MU1_CC_carriles_bici_todos_*` no se han abierto en detalle**: se descartaron por
  su `DescribeFeatureType` (son aforos). ⚠️ Es una decisión sobre el esquema, no sobre su contenido.
- **`MU2_aparcabicis` y `MU1_estaciones_bici_ubicacion` no se han tocado**: son puntos y quedan fuera
  del alcance.
- **Nada de esto se ha metido en el grafo**, ni se ha probado que se pueda meter.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| posición | ⭐ sí — el emparejamiento por proximidad y su desplazamiento |
| vecindad | ⭐⭐ sí — cuántas aristas compiten a 15 m (§C2b), que es el hallazgo |
| dirección | ⭐ sí — el paralelismo (≤30°) es condición del emparejamiento |
| identidad | ⭐ sí — `vias_codigo` contra el callejero, 733 de 733 |
| correspondencia | ⭐⭐ sí — municipal ⇄ OSM y municipal ⇄ municipal |
| umbral/cola | ⭐ sí — la curva de radios con su desplazada al lado |
| escala | ⭐ sí — metros contra features contra líneas (733 → 2.120) |
| densidad | ⛔ **no** — no se ha mirado el reparto por zona |
| agregación | ⭐ sí — `longitud_total` por feature contra geometría por línea |
| semántica | ⭐⭐ sí — es la tanda entera: qué significa `tipo_carri` |
