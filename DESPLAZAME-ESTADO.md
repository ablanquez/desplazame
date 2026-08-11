# DESPLÁZAME — Documento de estado del proyecto

> **Proyecto 004.** Buscador de rutas urbanas multimodales en Zaragoza, con motor de cálculo
> propio. Cuarto y último del portfolio, tras Linaje (001), Turnia (002) y ZetaBus (003).
>
> Este documento es la **memoria del proyecto**. Tiene **un solo escritor**: la conversación de
> estrategia. El ejecutor escribe únicamente `docs/BITACORA.md`; lo que descubra que contradiga
> este documento, **lo reporta hacia arriba**.
>
> ⚠️ **Regla propia de 004, aprendida de 003:** el bloque de "estado actual" se **sustituye**, no
> se acumula. Lo que caduca baja al mapa de tandas (§9). El estado de ZetaBus llegó a tener 360
> líneas de sedimento fechado encima de la sección 1, y había que leerlas todas para saber qué
> era el proyecto.

---

## ESTADO ACTUAL — 9 de agosto de 2026

**H1 ESTÁ CERRADO.** El terreno construido, la auditoría de cierre hecha entera en cuatro bloques, y
las siete tandas de arreglo cerradas. **Lo siguiente es H2: la red de transporte.**

**Lo que existe y funciona:**

- ⭐⭐ **El grafo peatonal de Zaragoza entera**, planarizado y verificado: **68.649 nodos, 98.774
  aristas**, 6,5 s de proceso. **Los ríos no lo parten** y los tres barrios rurales incomunicados
  lo están de verdad, contados y publicados.
- ⭐⭐ **El motor va de DIRECCIÓN a DIRECCIÓN**: 46.026 de 46.150 portales enganchados, 2.661 vías
  en el índice, itinerario agrupado por vía y explicado paso a paso.
- ⭐⭐ **El buscador respeta la paridad** (tandas 32-36): *la acera par y la impar son como dos
  calles distintas que no guardan relación*. Si no hay número de tu paridad cerca, **no se
  contesta: se sugiere**. Tres listones: **su acera 50 m · la de enfrente 150 m · tope de adelanto
  20 m**.
- ⭐ **El mapa dice cuatro cosas** (azul · rojo · gris · verde) y las líneas con nombre se pusieron
  con **dos testigos independientes** (§4).
- ⭐⭐ **EL BANCO DE RUTAS: diez trayectos, CUATRO con distancia medida por GPS** (§4 y
  `data/pruebas/RUTAS-CONOCIDAS.md`, que **es de Antonio** y entró al repositorio en la tanda 7).
  Las siete primeras las verificó Antonio **con los ojos sobre el mapa** en la tanda 16.
  ⚠️ **La nº1 ya no devuelve metros: desde la paridad va en sugerencia** (§7·99).
  ⭐ **DECIDIDO el 10/08 (Antonio): la nº9 y la nº10 SON costura de parada**, como las demás.
  *Motivo: de las diez rutas solo cuatro tienen GPS, y tres de esas cuatro sostienen la velocidad
  urbana medida. Dejarlas fuera sería tener el mejor dato del proyecto **sin contradictor*** (ley
  111). ⚠️ **Coste declarado: dos costuras más que pueden ponerse rojas — y la nº10 rompe el origen
  común de El Coloso 2, así que fallará por motivos distintos que las demás. Eso es la ventaja, no
  el coste: una costura que solo se rompe como las otras no añade cobertura.**
- ⭐⭐ **La velocidad es la ESTÁNDAR, no la de nadie: `VELOCIDAD_KMH = 5,0`** — la de
  OSRM/Valhalla/openrouteservice, elegida para que los tiempos sean **comparables** con los suyos.
  ⇒ **La nº7 ya NO calibra nada** (tanda de arreglo 4, §10).
- **26 números publicados congelados**, y ya han avisado en caliente más de una vez.
- ⭐ **MEDIDO el 10/08: `src/` son 74 ficheros · 27.097 líneas · 235 commits** *(contra los
  74 · 24.931 · 166 que este bloque publicaba del 6/08)*. ⭐⭐ **Y el 74 quieto no era sospechoso:
  es la firma de una auditoría** — las siete tandas de arreglo **no crearon un solo fichero** y
  engordaron los que había en **2.166 líneas**. Se toca lo que hay en vez de construir al lado.
  ⚠️ **Son líneas de FICHERO, no de código:** incluyen blancos y comentarios. Los dos patrones
  (`src/*.js` y `src/**/*.js`) dan idéntico ⇒ **`src/` es plana**, y el recuento es completo.

**LA AUDITORÍA DE CIERRE DE H1 — hecha entera, cuatro bloques.**

| | | |
|---|---|---|
| **A · El código** | ✅ | `A-CODIGO-2026-08-06.md` — 4 vivos + `D5` ascendido por Antonio |
| **B · La documentación** | ✅ | `B-DOCUMENTACION-2026-08-07.md` — 3 vivos · 13 superados · 5 deudas |
| **B.2 · El contraste** | ✅ | `B2-CONTRASTE-2026-08-07.md` — **el mapa de las 2.062, entero**; 3 vivos · 10 superados · la cosecha. ⛔ **Contrastadas 38 (1,8 %)**: recorrer no se puede, contrastar `R` es circular |
| **C · Las decisiones y los ejes** | ✅ | `C-DECISIONES-2026-08-07.md` — ⛔⛔ **retiró `B·V1`, un rojo falso publicado** · el reparto del diseño · **la tabla de los ejes** · la cobertura de toda la auditoría |

⭐⭐⭐ **De once hallazgos publicados, DOS resultaron FALSOS** (`B·V1` y `B·V2`) — **y ninguno lo cazó
el bloque que lo publicó** (§10). ⛔ **La auditoría no arregló nada:** la lista se decidió entera al
final de los cuatro bloques.

**LAS SIETE TANDAS DE ARREGLO — todas cerradas (7 al 9 de agosto).**

| | | |
|---|---|---|
| **1 · el instrumento** | ✅ | `A·V1` el centinela · `L2` el techo mal llamado · `B2·V2` el 400× · **+ los 3 hermanos**. ⭐⭐ **La predicción acertó 6 de 6** · **1·bis** los hermanos |
| **2 · el clon y la portada** | ✅ | Rutas relativas · `verificar-datos.js` · el README entero · ODbL + Ley 37/2007 · `N4`. ⭐⭐ **El clon con datos corre 58 de 58**, y `B·V2` resultó FALSO |
| ⭐⭐ **2·bis · la batería** | ✅ | Ya cuenta, y **cazó los arreglos de su propia tanda con la tabla sin tocar**. ⚠️ **Sigue sin ver «¿de qué?» ni un silencio bien formado** |
| **3 · el puntero y el latido** | ✅ | `superados.js` marca **37 pares en 16 documentos** · `B2·V1` declarado. ⭐⭐ **El latido habría cazado el 412 el 6 de agosto: demostrado** |
| **4 · la velocidad estándar** | ✅ | `VELOCIDAD_KMH = 5,0`. ⭐⭐ **Disuelve el eje de la nº7** — ya no calibra nada |
| **5 · las republicaciones** | ✅ | `H1-REPUBLICACIONES.md` · **22 pares en 103 líneas de 17 documentos** · `H1-QUE-QUEDA-ABIERTO.md`. ⛔⛔ **El latido NO pasó a verde solo** ⇒ abre la 6 |
| **6 · el latido lee, y entra la nº8** | ✅ | El latido **lee del documento con ancla declarada** y pasa a verde solo. ⭐⭐⭐ **Y Antonio salió a andar**: la nº8, 6,60 km |
| **7 · la portada y las rutas nº9 y nº10** | ✅ | El README cuenta la auditoría **incluidos los dos falsos** · seis cifras al día · **cuatro distancias medidas** ⇒ de cinco bandas, cuatro son medidas |

⭐ **Y las cuatro frases que resumen lo que dijeron los bloques:**
> **La clase de fallo dominante aquí no es el código roto: es la medida que se corrigió en el
> informe y no en el instrumento.** *(A)*
> **La cadena de documentos es navegable solo en la dirección en la que nadie la lee.** *(B)*
> ⭐⭐⭐ **Ninguno de los cuatro bloques ha comprobado que la ruta que sale sea la ruta correcta.**
> *(C — y no lo abre esta auditoría: lo hereda)*
> ⭐⭐⭐ **Un sistema puede alcanzar una consistencia impecable alrededor de un error que nadie fue a
> buscar fuera.** *(el cierre, §8·128)*

**LO QUE QUEDA ABIERTO — nada bloquea H2.** Inventario entero en `docs/H1-QUE-QUEDA-ABIERTO.md`.

- ⭐⭐ **Una medición CORTA, bajo 1 km.** Es la única banda que sigue derivada, y es donde peor
  cubierto está el banco: **cuatro trayectos de ~500 m sin ninguna medición**, y ahí 30 m de
  enganche pesan el 6 %. ⛔ **No es código: es una caminata.**
- **La coordenada de la puerta de Consultas Externas** — sin ella la nº8 valida el rodeo y **no los
  metros** (ley 131).
- **El centroide de los edificios grandes**: el complejo del Miguel Servet engancha a **70,8 m**,
  por encima del `AVISO_ENGANCHE_M = 65` que es el p99 del callejero.
- **`ruta.js` sale en código 2 sin declarar nada**, y quedan cinco scripts mudos más con
  `process.exit(1)` sin `alarma`.
- **`A·V2`**: dos medidas del mismo universo divergen en **79** (50.986 contra 51.065). ⛔ **Decisión
  de Antonio, no arreglo.**
- **~40 hermanos** y **464 veredictos** clasificados como SUELO, sin tocar.

**Falta decidir:** el stack · el alcance v1 del buscador · la lista de **candidatos aparcados**
(§10) · la frase del proyecto (§12, cuya condición ya se cumplió).

**Lo siguiente: H2, la red de transporte.**
⚠️ **Y un plazo real: el GTFS caduca el 05/10/2026, y H2 depende de él.**

⭐ **Saneamiento del 9/08:** este bloque se ha sustituido entero y **diez afirmaciones caducadas se
han corregido en el cuerpo del documento** — ver §10 · *«El estado también mentía»*.

*(Cómo se llegó hasta aquí: §4 el terreno · §5 las decisiones · §9 el diario de las tandas ·
§10 la auditoría y los arreglos.)*

---

## 1 · Identidad

**Nombre: Desplázame.**

El nombre lo trae del plan de portfolio original y describe la acción, no la tecnología. Sin
"Zaragoza" y sin "rutas" en la marca — a diferencia de ZetaBus, que metió "bus" y "Zaragoza"
dentro y tuvo que defender el código de heredarlo con un test.

**Repositorio:** `github.com/ablanquez/desplazame` — **público desde el commit 1**.

⚠️ **Y esa decisión tiene un porqué que va más allá del respaldo**, dicho por Antonio:
*"es mi carta de presentación de que no solo sé hacer cosas, sino que sé estructurar un proyecto
desde cero."* El historial de este repositorio empieza con cuatro informes de reconocimiento y
una bitácora, y el código llega después. **Eso se ve en `git log` y no se puede falsificar a
posteriori.** Es parte del producto, no infraestructura.

**Identidad de commits:** `ablanquez <278133158+ablanquez@users.noreply.github.com>`, verificada
**contra el último commit de 003**, no contra `git config`. Cero coautoría.

**Licencia:** código **Apache 2.0**. Datos: **ODbL** (el grafo entero es derivado de OpenStreetMap)
y **Ley 37/2007** para el dato municipal — **las dos declaradas en el README desde la tanda de
arreglo 2 (7/08)**, y ciertas ya.
⚠️ **Corregido el 9/08:** aquí seguía escrito *«la licencia se declarará cuando se integre alguno —
hoy el repositorio no contiene ningún dato integrado»*. **Son dos de las cinco frases que la tanda 2
retiró del README por falsas** (`A·V4`), con 46.150 portales dentro. *Se arreglaron en la portada y
sobrevivieron aquí seis días.*

---

## 2 · Qué es

Un buscador de *"quiero ir de X a Y"* en Zaragoza, combinando **a pie, autobús, tranvía y BiZi**.

**Origen y destino** pueden ser una dirección (portal), la ubicación del usuario vía geolocalización
del navegador, o un punto de interés (farmacias, centros cívicos y demás equipamientos
geolocalizados).

**El resultado** es doble: el recorrido dibujado sobre el mapa (OpenStreetMap) y una lista de
pasos legible —*camina 259 m hasta el poste 744 · coge el 29 dirección X · bájate en la parada 31 ·
camina 300 m hasta el destino*.

**El buscador es configurable**: qué transportes acepto (autobús, tranvía, BiZi) y qué se
minimiza (tiempo, o número de transbordos). Con una regla de producto ya propuesta por Antonio:
**si algo está a menos de ~400 m, no se propone un salto de transporte.**

### ⭐ La hora de salida es UN CAMPO, no dos modos

Vacío o *"salir ahora"* → calcula desde este instante. Escribes `07:30 del martes` → calcula desde
ahí. **Un solo motor, un solo parámetro.**

⚠️ **Dos botones serían dos caminos de código, y dos caminos divergen.** Un día el mismo origen y
destino darían dos rutas distintas en la misma pantalla sin que ninguna estuviera mal. Ley de la
fuente única.

⚠️ **Y ese botón NO se llama "tiempo real".** Lo que hace es calcular *ahora* según el **horario
publicado**. El tiempo real sería saber que el 29 viene con seis minutos de retraso, y eso está
fuera de la v1. Llamarlo así sería la única promesa falsa de la aplicación. Se llama
**"salir ahora"**.

### ⭐ Lo que hace que no sea ZetaBus 2

**En 003 el motor era ajeno** (APIs de Avanza, GTFS de terceros) y el mérito era consumirlo con
honestidad. **Aquí el motor es propio.** Grafo, coste, búsqueda, transbordo, y el resultado
explicado paso a paso. Es algoritmia y diseño de datos: justo lo que un proyecto de framework no
puede enseñar.

Corolario directo: **nada de OSRM, Valhalla ni GraphHopper.** Meter una librería de routing
devolvería el proyecto al terreno de 003.

### ⛔ Fuera de alcance — CON SU MOTIVO

| Fuera | Por qué |
|---|---|
| ⭐ **El TIEMPO REAL** (posición de vehículos, llegadas en vivo, bicis disponibles) | **Es lo que ya demuestra ZetaBus.** Repetirlo no suma al portfolio: suma una segunda copia de la misma prueba. Y es vistoso — en una demo de cinco minutos se come la atención que debe llevarse el motor. Además, el dato en vivo **solo es verdad en el primer tramo**: el autobús del segundo transbordo consultado *ahora* describe un vehículo que ya no estará cuando el usuario llegue |
| **Disponibilidad de bicis en la estación BiZi** | Mismo motivo. Y se resuelve en la copia: no *"coge una BiZi en la 42"* sino *"si hay bici disponible en la 42"*. Una palabra, y la promesa deja de ser falsa |
| **Precisión de nivel 3** (anchura de acera, rebajes de bordillo, obras de hoy) | **No existe en abierto para nadie.** Está catalogado por el Ayuntamiento y es de acceso restringido a técnicos municipales |
| **Copiar artefactos cocinados de 003** | Ley del trasplante (§5). Su cocina responde a preguntas que 004 no tiene: le quitó el tranvía y le quitó el trazado, que es justo lo que aquí hace falta |

---

## 3 · Las fuentes, y qué miente cada una

| Capa | Fuente | Estado |
|---|---|---|
| ⭐ **Red viaria (aristas)** | `movilidad:MU1_jerarquia_viaria` — GeoServer IDEZar, WFS | ✅ 3.644 tramos con geometría, `codigo` de vía, `doble_sent`, `limite_vel`, `plataforma`, `pacificada`, `calle_z30`, `longitud`. ⚠️ **Sin topología** y **sin campo de nivel** |
| ⭐ **Nodos (origen/destino)** | 46.150 portales WGS84 con `codigoVia` | ✅ Limpios. 46.147 coordenadas únicas de 46.150 |
| **Geocodificador** | Heredado del dataset previo | ✅ 3.359 vías tokenizadas sin tildes, `by-street` con 2.731 calles, normalizador de abreviaturas. **Reutilizable tal cual** |
| ⭐ **Red peatonal fina** | **OpenStreetMap** (Overpass) | ✅ **INTEGRADA — es la geometría base del grafo (D0)**: 68.649 nodos y 98.774 aristas. Aceras, pasos de peatones y escaleras **como líneas** y **ya nodalizadas por diseño**. ⚠️ **ODbL con efecto share-alike, declarada en el README** (tanda 2). *Corregido el 9/08: esta fila decía «decidida, no integrada» con el grafo entero construido encima.* |
| ⭐ **Transporte** | **GTFS 1176 del NAP** (bus + tranvía) | ✅ **DESCARGADO el 10/08 con código propio de 004** (`tools/bajar-gtfs.js`) — ⛔ **NO se copió de 003**. `feed_version 20260623_AUZSA_Y_TRANVIA` · 6.883.311 B · sha256 `5c96992c…f3a82`. **984 paradas · 53 rutas · 34.427 viajes · 870.717 horarios · 89 trazados sin huérfanos**, remedidos. ⚠️ **CADUCA EL 05/10/2026, Y EN DOS TIEMPOS: el bus respeta sus fechas al día, el tranvía se sale 87 días.** ⛔ **NO trae transbordo de ninguna forma** (§4·H2). *Hasta el 10/08 esta fila decía «decidido, no descargado»* |
| **BiZi** | `MU1_estaciones_bici_ubicacion` (WFS) + API de la sede | ✅ 276 estaciones, 5.520 anclajes. Las dos fuentes consistentes |
| **Destinos (POI)** | Farmacias, centros cívicos, equipamientos | ✅ Baratos de añadir: **no tocan el motor**, son nodos enganchados al grafo |
| **Validadores** | Semáforos, puentes, manzanas, ríos | ⬜ No son dato del grafo: **sirven para comprobarlo** |

### ⭐ LA ASIMETRÍA QUE GOBIERNA EL TERRENO

> **La cartografía municipal es de REPRESENTACIÓN, no de ANÁLISIS.**
>
> Está hecha para pintar mapas y gestionar la vía pública, no para calcular rutas. Y la
> diferencia es **invisible exactamente en el medio donde todo el mundo la valida: mirándola.**
> Cinco metros de separación entre dos tramos contiguos son **menos de un píxel** dibujado.

### ⚠️ Lo que miente cada fuente, en una línea

- **El callejero municipal**: enriquecimiento OSM con `coveragePercent: 100` y el **29,6 %** de
  los `houseNumber` mal.
- **`MU1_jerarquia_viaria`**: no tiene ningún campo de nivel. Con **89** cruces geométricos
  *(⚠️ 9/08: decía **106**, cifra que §7·17 desmintió — un cruce sobre un vértice lo contaban los
  dos segmentos que lo comparten)*,
  planarizar **fusionaría pasos elevados con las calles de debajo** (caso real detectado:
  `GRACIA, LUCIANO` × `MADRID, AUTOVÍA DE`).
- **El GTFS**: no trae `calendar.txt`; su calendario se extiende **tres meses más allá de su
  propia caducidad** (solo 72 filas de 27.161 son posteriores al 05/10). Y escribe
  `"Miguel ángel Blanco"`.
- **La API de BiZi**: `estadoEstacion` dice *no-operativa* en 50 de 50 mientras `estado` dice
  `IN_SERVICE`. Y `lastUpdated` lleva sufijo `Z` con hora local: **dos horas en el futuro**.
- **El WFS**: sirve **metros (EPSG:25830) por defecto**, incluido en `.geojson`, que tiene fama
  de ser siempre WGS84.
- **El catálogo municipal**: publica `Carreteras_cartoOSM_2019_*` —con `OSM_ID` y `BRIDGE`
  dentro— bajo licencia propia, **sin nombrar a OSM ni la ODbL en ninguna de sus 709 fichas**.

---

## 4 · El terreno: qué hay y qué falta

De 14 piezas del grafo: **11 resueltas, 2 parciales, 1 abierta**, más un hueco nuevo.

**Resuelto:** aristas · nodos · puente eje↔portal · sentido · velocidad · longitud · paradas ·
trazados de línea · BiZi · carriles bici · geocodificación.

**Lo que queda, y es el trabajo del proyecto:**

1. ⭐ **PLANARIZAR.** Los tramos no comparten extremos (21 pares de 50.880) pero **se cruzan
   geométricamente** (87 pares, **89** puntos — ⚠️ *9/08: decía 106; el 87 SÍ era correcto, y por
   eso colaba: §7·17*). La información topológica **está en el dato**: hay
   que partir cada tramo en sus intersecciones y usar una tolerancia pequeña (~2 m) solo para las
   puntas sueltas. Nadie publica esto: la topología no existe en el catálogo de ninguna ciudad, y
   construirla **es** la parte interesante.
2. ⚠️ **EL NIVEL.** Sin campo de cota, planarizar inventa cruces. Es el mayor riesgo de
   corrección del proyecto y no está resuelto. La pista está en OSM (`bridge`, `layer`).
3. **INTEGRAR OSM** para el pie, con su ODbL declarada.

### ⭐⭐ El grafo de la ciudad (tanda 10) — y lo que dice el eje DENSIDAD

```
                    CASCO (3,24 km²)      CIUDAD (973,8 km²)
nodos                      5.121                 68.649    ×13,4
aristas                    7.175                 98.774    ×13,8   · 6,5 s · 871 MB
```

| Contador | Casco | Ciudad | Lectura |
|---|---|---|---|
| `unido-por-defecto` | 0,84 ‰ | **1,15 ‰** | ✅ **D1 aguanta. No hay cuarta revisión** |
| Puntas 2-5 m sin soldar | sin pico | **15 % donde el azar daría 17 %** | ✅ **D5 no se queda corta** |
| `eje-de-calzada` | 22,6 % | **47,2 %** | ⚠️ ver abajo |

⭐⭐ **EL EJE DENSIDAD, medido por primera vez, y explica el 47,2 %:**

```
casco 22 % · ensanche 28 % · Actur 33 % · Valdespartera 51 %
Garrapinillos 74 % · Movera 80 % · Malpica 82 % · PLAZA 90 %
```

**Monótono, sin sorpresas. El planarizado se comporta igual en todas partes: lo que cambia es el
mapeado de OSM.** En PLAZA hay **0,0 % de acera en 33,7 km²** — y verificado sobre el visor por
Antonio: **es correcto.** Es un polígono logístico, viales de camiones entre naves. **No hay aceras
porque no hay peatones.**

⇒ ⭐ **DECISIÓN: D4 se queda como está, NO se invierte el aviso.** El 47,2 % del término no
significa *"D4 avisará en media ciudad"*: significa que **media ciudad no es ciudad**. El
porcentaje que hay que vigilar es el de las zonas donde la gente anda —casco 22 %, ensanche 28 %,
Actur 33 %—, y ahí el aviso aparece en uno de cada tres o cuatro tramos. **Un aviso que suena en
PLAZA no molesta a nadie.**

### ⭐⭐ Las cuatro puntas sin soldar — verificadas a mano por Antonio

D5 deja sin soldar las puntas de 2 a 5 m y las cuenta. **Las cuatro mayores, una a una:**

| Dónde | Qué era |
|---|---|
| `41.65121,-0.88324` | ⭐ **Pasaje Palafox** — galería comercial interior: **paso condicional** |
| `41.63662,-0.87441` | Mediana ajardinada de Tenor Fieta / rampa de garaje |
| `41.63544,-0.86487` | **Sendas de un solar** junto al Príncipe Felipe (caminos de tierra informales) |
| `41.64598,-0.92139` | **Vial interno de recinto cerrado** (IES Ramón Pignatelli) |

⇒ **Cuatro de cuatro, y NINGUNA era una calle cortada por error.**
⭐ **D5 acierta por el motivo correcto**, no por casualidad: a esa distancia lo que hay son **bordes
reales** —una verja, un bordillo, una puerta que cierra—. **Si se subiera a 5 m, el grafo empezaría
a atravesar vallas.** Cabo cerrado.

⚠️ **Y un hallazgo lateral: el Pasaje Palafox NO está entre los 96 `building_passage`.** ⇒ **el
contador de pasos condicionales se queda corto**: hay pasos que OSM no etiqueta como tales y se
cuelan en el grafo sin marcar. La búsqueda no puede ser solo por etiqueta — también por nombre
(*pasaje*, *galería*, *pasadizo*) y por geometría que atraviesa un edificio.

### ⚠️ Los tres barrios rurales incomunicados — y NO se conectan

**Peñaflor de Gállego** (294 nodos, 317 calles con nombre) y otros dos:
`41.76682,-0.88154` · `41.74134,-1.07744` · `41.57802,-0.95339`

⇒ ⭐ **DECISIÓN: no se amplía la descarga para conectarlos.** Están incomunicados **de verdad**:
Peñaflor está a 15 km y se llega por carretera. Ampliar añadiría kilómetros de vía interurbana por
la que nadie anda, y **el grafo diría que se puede ir andando a Peñaflor — una mentira más grande
que el hueco.** *(Antonio, preguntado si iría andando: "ni loco". Es el argumento del candidato
"modo coche" en §10.)*
**Se cuentan y se publican.** Que los barrios rurales del término no estén conectados a pie es
cierto, y hay que decirlo.

### ⛔ `proposed` — lo medido y NO arreglado, a propósito

**178 aristas · 13,8 km de calles que todavía no existen, y el grafo deja andar por ellas.**
**23 son articulaciones**: 82 nodos cuyo único paso es una calle sin construir. En el casco había 0.

⇒ **DECISIÓN: se excluyen.** El coste del error es asimétrico —excluirlas pierde un atajo futuro;
incluirlas manda a alguien a un descampado— y ya hay precedente con `construction`.
⚠️ **Pero NO se añade `proposed` a la lista: se cambia la lista por una REGLA** (ley 40).
⭐ **Y hay confirmación desde el otro lado:** Antonio verifica que en Arcosur y Parque Venecia
*"OSM va incluso por delante"*. Es el mismo hecho visto desde fuera — y encaja con las 23 vías del
hueco duro sin ni un portal: **el callejero ya bautizó calles a las que aún no hay que asignar
números.**

### ⚠️ Los caminos que existen pero por los que nadie va — pendiente de contar

Categoría distinta de todas las anteriores: no es de **existencia** (no está construida, hay una
verja) sino de **cualidad**. *Un camino de tierra entre campos a las once de la noche es
técnicamente una ruta y prácticamente un despropósito.*

El dato ya lo permite distinguir: `highway=track` / `path`, `surface=dirt`/`gravel`, `lit`.
⇒ ⭐ **La forma correcta es PENALIZAR, no excluir** — el camino existe y de día puede ser
razonable, y **en Movera o Garrapinillos el camino ES la calle**. La geometría dice qué hay; el
coste dice qué conviene.
⚠️ **Y el coste podría depender de la hora**, pero eso es H3.
⚠️ **Hoy no se puede medir bien**: no hay coste ni rutas. **Se inventaría ahora** (cuántas aristas y
dónde) y se decide cuando el motor calcule — donde `RUTAS-CONOCIDAS.md` lo delatará en un minuto.

### ⭐⭐ EL MOTOR, Y LAS SIETE RUTAS DE ANTONIO (tandas 11-13)

**El grafo va de DIRECCIÓN a DIRECCIÓN.** 46.026 portales enganchados de 46.150 · 2.661 vías en el
índice de direcciones.

| # | trayecto | calculado | ⭐ rodeo | tope | |
|---|---|---:|---:|---:|---|
| 1 | Cataluña 78 → Pablo Gargallo 16 | 3.087 m | 1,17 | ≤1,45 | ✅ **cruza por el Puente de Piedra**, como Antonio |
| 2 | Manifestación 6 → Don Jaime I 17 | 598 m | 1,32 | ≤1,45 | ✅ |
| 3 | Cantando Bajo la Lluvia 6 → Clínico | 3.705 m | 1,24 | ≤1,40 | ✅ |
| 4 | Etopía → Delicias | 506 m | **2,17** | ≤1,60 | ⛔ *la plataforma elevada obliga a rodear — el 2,17 es real* |
| 5 | Principado de Morea 14 → Utrillas | 477 m | 1,37 | ≤1,45 | ✅ |
| 6 | Quevedo 1 → Matadero 1 | 523 m | 1,08 | ≤1,45 | ✅ **la esquina no engañó al enganche** |
| 7 | El Coloso 2 → Valle de Zuriza 48 | 2.529 m | 1,06 | ≤1,20 | ✅ ⭐⭐ **2.529 contra los 2.600 del GPS: 2,7 %** |

**7 de 7 resueltas · 6 de 7 en rodeo · 0 imposibles** — *tal como se midió en las tandas 11-13.*

⚠️ **9/08 · LO QUE HA CAMBIADO DESDE ENTONCES, y esta tabla no lo decía:**
- ⛔ **La nº1 ya NO devuelve metros**: desde la regla de paridad **va en sugerencia**, porque el 78
  de Avenida Cataluña no existe (§7·71 y §7·99). ⇒ **El «7 de 7» es de la tanda 13, no de hoy.**
- ⚠️ **La nº6 pasó de `523,4` a `520,2`** en la tanda 33.
- ⭐ **Los TIEMPOS de esta tabla ya no son éstos**: la tanda de arreglo 4 puso `VELOCIDAD_KMH = 5,0`
  y recalculó los 19 publicados. **Los METROS no se movieron ni un decimal.**
- ⭐⭐ **Y el banco ya no tiene siete filas: tiene DIEZ** — nº8, nº9 y nº10 entraron el 9/08 con
  distancia medida por GPS (§10 · tandas 6 y 7).

### ⭐⭐ EL PUNTO CIEGO — cerrado (tanda 13)

**El 25,9 % de los portales engancha a una calle sin nombre en OSM**: ahí el `codigoVia` no puede
comparar y la nube no opina. **Ninguna salvaguarda mira.** Era el sitio por donde entraría un fallo
sistemático sin que nada avisara.

**Se resolvió descargando `MU1_jerarquia_viaria` completa** —la capa municipal, **el testigo
independiente de OSM**, que es exactamente para lo que D0 dice que sirve— y midiendo **cuánto ALEJA
el enganche al portal de su propio eje**:

```
                        d(PORTAL→eje)   d(ENGANCHE→eje)   aleja >10 m
   BUENOS conocidos           23,8 m            21,8 m        0,1 %
   SOSPECHOSOS conocidos      34,5 m            33,9 m       15,8 %   ⇒ el testigo separa 251×
   ⭐⭐ CIEGOS                  32,7 m            30,6 m        2,7 %
```

⇒ ⭐⭐ **VEREDICTO: SÍ ACIERTA.** Donde nadie vigila, el enganche **se comporta como los buenos
conocidos y no como los sospechosos.** 7.245 casos evaluables frente a los 214 de la tanda 12.
Línea base 0,0 % · contraprueba de desplazamiento 1,6 % · de identidad 0,3 %.

⭐⭐ **Y el hallazgo que impide la conclusión falsa fácil: el −14,4 en bruto era GEOGRAFÍA.** Los
ciegos ya estaban **8,9 m más lejos de su eje antes de que el motor tocara nada** — la posición del
portal la pone el Ayuntamiento. Emparejando por distancia previa: **±2,6 puntos.**

⚠️ **Y su límite, declarado:** el testigo **no alcanza al 36,3 %, y no al azar** — Garrapinillos
0 %, PLAZA 1,6 %. **El veredicto vale para la ciudad urbana, no para el término.**

### ⭐ LAS PUERTAS — `entrance=*` existe, y se va a usar

`entrance=*` **SÍ está en OSM**: 2.085 nodos, 295 de ellos `main`. *(La tanda 12 dijo `NO CONSTA` y
era correcto con su dato: pedía ways y esto son nodos. Faltaba pedirlo.)*
Solo el **3,9 %** de los edificios lo trae — pero **donde está, es la puerta de verdad**.
⛔ **Delicias: el motor rutea a 25,8 m de su `entrance=main`.** No es una puerta declarada.

⇒ **DECISIÓN DE ANTONIO: si el dato dice dónde se entra, se entra por ahí.**
**Orden de preferencia:** entrada **principal** → entrada **cualquiera** *(avisando de que no es la
principal: una `yes` puede ser puerta de servicio o salida de emergencia)* → punto de perímetro más
cercano → ⛔ **nunca el centroide**.

### ⭐⭐ EL MODELO: VÍA · FORMA · PAPEL (tanda 19)

**Idea de Antonio, y corrige una suposición escondida del modelo:**
> *«Una acera que comparte carril bici es una acera en el contexto de caminar y es un carril bici
> en el contexto de ir en bici.»*

⇒ **El papel depende del MODO, no de la línea.** Hoy la precisión (D4) era **un solo valor por
arista**, y eso era falso. **Tres cosas separadas, no una:**

| | | |
|---|---|---|
| **LA VÍA** | *Avenida de San Juan de la Peña* | **La misma sea cual sea el modo.** Es el requisito estructural |
| **LA FORMA** | `plataforma` (9 valores, de OSM) + `ciclista` (6, del municipal) | ⭐ **Dos campos, no uno** — *«acera con carril bici» no es hermano de «acera»: es acera MÁS algo encima* |
| **EL PAPEL** | *acera* andando · *carril bici* en bici | ⛔ **Se DEDUCE, no se guarda.** Guardar un valor por modo obliga a mantener N coherentes, y divergen |

⭐ **La capa municipal de carriles bici** (`MU2_carriles_bici`, 733 tramos, 333,72 km) declara el
tipo en el **100 %** y trae `vias_codigo` —**el mismo `codigoVia` de los portales**— también en el
100 %. **El nombre no hay que adivinarlo: viene con clave.**

⭐⭐ **Y una discrepancia se resolvió SIN TOCAR EL DATO.** El municipal decía *«64 % unidireccional
CALZADA»* del tramo de la ruta 7 y Antonio había dicho *«a misma cota que acera»*. Preguntado:
> *«En San Juan de la Peña no está a la misma cota. En Avenida de la Academia General Militar sí.»*

**El tramo pasa por DOS vías con tipos distintos, y él describió una.** ⇒ **El `tipo_carri` es
fiable en el único sitio con verdad sobre el terreno, y en sus dos valores.** *El dato era correcto
y la lectura era incompleta.*

⚠️ **Y una contradicción declarada y NO resuelta:** el papel a pie de un carril segregado dirá
*«esto es para bicis»*, pero **el motor lo sigue usando para andar** porque Antonio confirmó que ahí
se anda. **Resolverla movería rutas.**

### ⭐⭐ LOS NOMBRES: DOS TESTIGOS INDEPENDIENTES (tandas 21 y 25)

> **«Tenemos una línea que no tiene nombre de vía, pero por proximidad tiene varios portales con
> nombre de vía. ¿Conclusión? Tenemos un nombre de vía para esa línea.»** — Antonio
>
> **«¿No puede comprobar que tiene otra línea en paralelo a nada de distancia que tiene el nombre,
> y compararlo contra los portales? Si por varios puntos de esa lat-lon se llevan 2-3 metros, será
> la misma calle.»** — Antonio

⭐ **La clave de la segunda idea: NO es heredar, es COMPARAR DOS TESTIGOS.** *Heredar de la línea
vecina es peligroso —una acera puede estar entre dos calles—. Cruzar dos fuentes independientes, no.*

```
   CONCUERDAN · ≥3 portales + calle pegada        802   100,0 %   ⭐
   ⭐ calle pegada + 1-2 portales que CONFIRMAN    677    99,4 %
   calle pegada SOLA · ningún portal             5090    91,7 %
   SOLO PORTALES · ≥3 votos                      2264    86,9 %
   ⛔ pegada con la mayoría de portales EN CONTRA   87    86,2 %   ⇒ NO se nombra
```

⇒ ⭐⭐ **Un portal con respaldo paralelo (99,4 %) es más fiable que TRES portales solos (86,9 %).**
Y **cuando opinan los dos, concuerdan el 94,7 %**; las 29 que discrepan **no se nombran**.

⭐ **Y son independientes de verdad, demostrado:** contra los 198 portales ya conocidos como mal
enganchados, **la paralela no repitió el error ni una vez** — y habló en 67 de ellos.

⚠️ **Lo que NO funcionó como se esperaba, y es informativo:** *la distancia sola no distingue*. Tu
calle está a 5,61 m de mediana y **la de al lado a 6,85 m**: se solapan. **Lo que decide es ir
pegada en TODOS los puntos** — que es literalmente lo que dijo Antonio. Y así **no hizo falta hablar
de ángulos ni de paralelismo: sale solo.**

```
   líneas con nombre     40.420 (solo OSM)  →  56.864     ⭐ +16.444
   líneas sin nombre                        →  41.910
```

### ⭐ EL ITINERARIO, SIMPLIFICADO (tanda 21)

> **«Si estoy en Avenida San Juan de la Peña, ¿por qué lo repites 300 veces? Se pone una con todos
> los metros y punto. Si se hace un cruce como es con Calle Juslibol, estás en San Juan de la Peña
> igual, así que eso me sobra.»** — Antonio

**Se agrupaba por *nombre + tipo + avisos*, así que un cambio de aviso partía la avenida en tres.**
⇒ **Ahí se había colado un criterio nuestro en una decisión que es del usuario.**

· **Se agrupa por VÍA.** 1,53 km de San Juan de la Peña = **un paso**, con 11 tramos de OSM dentro.
· **Los cruces cortos que interrumpen la misma calle desaparecen** (umbral: el p99 de la longitud de
  un paso de peatones en Zaragoza, **13,3 m** — lo que mide cruzar una calle aquí).
· **Los avisos no se pierden: van DENTRO del paso.**
⇒ **La ruta 7 pasó de 20 pasos a 12.** Total de las siete: 110 → 82.

⛔ **Y fuera del texto la clasificación administrativa del carril** (*«el Ayuntamiento lo sitúa EN LA
CALZADA»*): **al que va andando le da igual.** *El dato se queda en el modelo para H2.*
⭐ **Y no se le dice «carril bici» a un peatón: se le dice ACERA.** *Es el papel del modo equivocado
—el mismo error, otra piel.*
✅ **El aviso de que se comparte con bicis SÍ se queda**: sale en **5 de 82 pasos (6,1 %)**, y la
condición de Antonio era que se mantuviera *«siempre que sea verdad que en muy pocas calles pasa»*.

### ⭐⭐ EL MAPA DICE CUATRO COSAS (tandas 26 · 27 · 28)

| color | significa | cuántas |
|---|---|---:|
| **AZUL** | tiene nombre | 51.493 |
| **ROJO** | **le falta**, y es un problema | 32.310 |
| ⭐ **VERDE** | le falta, **pero está dentro de una zona verde: por eso** | 3.803 |
| ⭐ **GRIS** | **no tiene nombre NI DEBE TENERLO** | 11.168 |

**GRIS — idea de Antonio:**
> *«Si un paso de cebra es un paso de cebra y no tiene nombre, no lo tendrá que tener ninguno, digo
> yo.»*

⭐⭐ **Y la distinción que abre es la importante:** *una acera sin nombre* → **falta información**;
*un paso de cebra sin nombre* → **no falta nada**. **Meterlos en el mismo rojo hacía que el mapa
exagerara el problema.**
⛔ **Y 3.786 pasos (uno de cada tres) llevaban un nombre que les habíamos puesto nosotros.** Se
retiran. *El de OSM se respeta: es dato ajeno.* Las **369 isletas** —el trocito que queda en medio
del paso— entran igual, por decisión de Antonio.

**VERDE — teoría de Antonio:**
> *«Hay muchas manchas rojas en la ciudad que son parques o zonas verdes grandes.»*

**Correcta, y con tamaño: 3.803 líneas y ~145 km** están dentro de una zona verde.
⛔ **Pero NO se pintan de gris, y el motivo es fino:** *un paso se reconoce por su ETIQUETA; un
sendero, por DÓNDE ESTÁ* — y ese «dónde» sale de una capa de 2012, sin nombres, que coincide con
OSM en el 22 %. **Colgar una regla de definición de una fuente de calidad desconocida, no.**
⇒ ⭐ **El verde es una variante del rojo: para el motor esas líneas siguen siendo rojas.** No dice
*«no debe tener nombre»*, dice *«está en un parque, por eso es roja»*. **Reversible, y no puede
romper una calle.**
⚠️ **Manda OSM, no la municipal** — y la elección la tumbó un positivo de control: **cruzar las dos
capas dejaba fuera el Parque del Agua entero, 0 de 493 senderos.** *Estaba limpia porque no cogía
casi nada donde importa.*
⚠️ **Y el contraejemplo, medido:** el **Anillo Verde de Oliver** no es un parque sino una franja
que envuelve calles del barrio — **pero sus 131 calles con nombre siguen azules**: solo se pintan de
verde sus 19 rojas. **Un error de explicación sobre 148 m, no de dato sobre 131 calles.** *Eso es
exactamente lo que se ganó al no pintarlos de gris.*

### ⭐⭐ EL BUSCADOR POR PARIDAD — dos aceras, dos calles (tandas 32-36)

**Lo destapó Antonio mirando el mapa**, no un contador: pidió la ruta 1 y vio que arrancaba a
~200 m del portal.

```
   se pide      Avenida Cataluña 78
   ⛔ el 78 NO EXISTE en el callejero
   el buscador caía al nº77          ⬅ la acera de ENFRENTE
   el par más próximo, el nº74       ⬅ a 258 m
```

⛔⛔ **Y ninguna salvaguarda podía verlo: las dos aceras tienen el MISMO nombre y el MISMO
`codigoVia`.** El código dice *«correcto»*, la nube dice *«correcto»*, la calle pegada dice
*«correcto»*. **Los tres miran la CALLE; ninguno mira el LADO.**
⇒ ⭐⭐ **Todos los porcentajes publicados —99,6 % · 97,0 % · 93,4 %— miden identidad de calle, no
de acera.**
⭐ **Y el enganche NO era el culpable**: el 77 cuelga a 1,82 m de su propia acera. **El fallo era
del buscador.** *(Portales enganchados a la acera contraria: 76, el 0,2 %, y desvían 3,7 m. Se
marcan, no se mueven: 59 no tienen adónde ir.)*

**DECISIÓN DE ANTONIO:**
> *«La acera par por un lado, la impar por otro. A efectos de entenderme, es **como si fuesen dos
> calles diferentes que no guardan relación** — precisamente para evitar lo que ha pasado con
> Avenida Cataluña.»*

· **Si se pide un PAR, solo existe la acera par.** Los impares **no son una alternativa**.
· **Si el número exacto no está, se busca en SU MISMA PARIDAD.** *78 → 76 u 80. Nunca 77.*
· ⭐ **Si no hay ninguno cerca: NO SE CONTESTA, SE SUGIERE.** *«Luego, con un botón, le daremos esa
  sugerencia para que la cliquee.»* ⇒ **La app no decide por ti: te ofrece.**

**Los tres listones, y cada uno con su historia:**

| | valor | por qué |
|---|---:|---|
| **su acera** | **50 m** | ⚠️ Se subió a 100 por un *«acantilado ×7»* entre 50 y 100 — **y el acantilado era el centinela 99999. Limpio, el salto es ×1,4.** Se bajó al limpiarlo |
| **la de enfrente** | **150 m** | *«Se puede comunicar con la acera de enfrente si está en un radio, que eso por su lat-lon se puede saber»* — **y hasta 150 porque hay avenidas muy anchas** |
| ⭐ **tope de adelanto** | **20 m** | ⛔ **A 150 m sin tope, el 75 % era DESFASE, no ancho.** ⇒ **CRUZAR TE MUEVE DE LADO, NO HACIA DELANTE.** Con el tope: **71,7 % ancho** |

⭐ **Y el dial limpio no tiene ningún codo:** cada duplicación del listón compra unos diez puntos y
cada una menos que la anterior. **Ningún valor se defiende solo: el listón es una decisión sobre
cuánto error se acepta.**

⚠️ **Lo que esto NO arregla, apuntado:** *el 78 sigue sin existir*. **Lo honesto sería interpolar
sobre el hilo de su paridad** — si el 74 y el 84 están, el 78 va entre medias. **32.401 consultas
lo esperarían.** No se ha hecho.

### ⭐ EL NOMBRE PRESTADO — decidido: se marca en el DATO, no en el texto

**458 aristas (0,9 %, 17,38 km) llevan el nombre del tramo de al lado del mismo way**, y **las 458
se presentaban como declaradas**. En las siete rutas: **44 m de 11 km (0,4 %)**.
⭐ **Todas de `municipal-bici`** — la única fuente que asigna por arista; las otras tres deciden por
way y para ellas no hay préstamo.

⇒ **DECISIÓN DE ANTONIO: no se dice nada en el texto.**
> *«Aquí nos pasa como con ZetaBus: a la gente le importa tres pimientos quién lo declara.»*

⭐⭐ **Y es la TERCERA vez que se corrige el mismo patrón** —contarle al usuario cómo funciona el
dato por dentro—: primero *«carril bici»* a un peatón, después *«el Ayuntamiento lo sitúa en la
calzada»*, y ahora *«el nombre es el del tramo de al lado»*.
**El nombre acierta el 99,6 %**, es la misma calle y la misma línea de OSM. ⭐ Y **la cita al
Ayuntamiento —que era lo que de verdad chirriaba— ya no existe**, porque se retiraron los avisos de
clasificación del carril.
⇒ **Se marca en el DATO**, para nosotros: si algún día una de esas 458 sale mal, se sabrá que era
prestada.

### ⛔ EL CUARTO TESTIGO — el orden de los números: probado y DESCARTADO

**Idea de Antonio (tanda 15):** *«Si tengo Paseo Pamplona 5, sé que estará entre el 3 y el 7.»*
Atacaba justo lo que el ejecutor había declarado imposible: *"solo sé que NO están donde deberían,
no DÓNDE deberían estar"*. **Con los vecinos, sí se sabe.**

**Y la idea es correcta:** detecta el **70,8 %** de los portales descolocados más de 50 m **cuando
están solos**, y es **el único testigo que dice dónde debería ir** el portal.

⛔⛔ **Pero falla por dos motivos, y ninguno es de calibración:**

**1 · ES CIEGO POR ARITMÉTICA AL FALLO QUE ARRASTRA VECINOS.**

```
   desplazamiento     1 solo    3 juntos    5 juntos
   25 m               29,2 %       0,0 %       0,0 %
   50 m               70,8 %       0,0 %       0,0 %
   200 m              95,2 %       0,0 %       0,0 %
   vía ENTERA a 200 m:  0 portales de 300 vías
```

*Si mueves el 3, el 5 y el 7 juntos, **el 5 sigue estando entre el 3 y el 7**.* Y el error real
suele ser *"toda esta calle se fue a la paralela"*, no *"este portal se despistó"*.
⭐ Lo único que ve es **el borde del bloque** (11,8 % a 50 m) — **y una vía entera mal enganchada no
tiene bordes.**

**2 · EL NÚMERO DE PORTAL NO IDENTIFICA.** La **Avenida de la Ilustración** —el caso estrella, 267
portales sin testigo— resultó **MUDA**, y no porque esté bien:

```
   portales enganchados          1.469
   números DISTINTOS                22
   el nº 31 lo comparten           147 portales
   portales con número único         6
```

⇒ **El 18,4 % del callejero comparte número dentro de su propia vía.** *(Tercera forma del mismo
problema: el nombre de calle, el nombre de ciudad, y ahora el número de portal.)*

⭐ **Y de paso explicó los 267 sin testigo de la Ilustración:** 1.469 portales con 22 números es un
**complejo residencial con viales internos que OSM no nombra** — no falta mapeado: **ahí dentro no
hay calles con nombre porque son de la comunidad.**

**Veredicto:** *sirve solo en ciertas condiciones, y no se dan donde hacía falta.* Separación máxima
**×20** frente a los **×251** del tercer testigo; **0 de 7** de los imputables; solo el **60,7 %**
del callejero es evaluable. ⛔ **Y no rehabilita a los 198.**

⚠️ **La pregunta que queda abierta y que decide todo:** ¿los enganches malos de Zaragoza son
**calles enteras a la paralela** o **portales sueltos**? De eso depende que este testigo sirva —
**y con el dato de hoy no se puede saber.**

⚠️ **Y por eso NO se usa para colocar** (D2): la predicción existe (mediana 58 m), pero **interpola
entre los enganches de los vecinos, y el detector es ciego justo a que los vecinos estén mal.**
Colocaría bien el aislado y **movería el resto hacia el error de sus vecinos.**

### ⭐⭐ Los portales no son solo destinos: son TESTIGOS

*(Idea de Antonio, tanda 4. Yo los había tratado todo el proyecto como puntos que se enganchan a
un grafo que viene de otro sitio. Descarté la idea demasiado rápido y hubo que insistir.)*

| Uso | Veredicto | Números |
|---|---|---|
| **Emparejar calles sin mirar el nombre** | ✅ **complementario**, no sustituto | Nube 59,0 % · texto 77,3 % · **juntos 85,6 %**. Rescata 279 vías que el texto no toca — erratas de OSM y homónimos. ⚠️ No opina sobre las 1.056 vías con <3 portales |
| **Medir cobertura sin depender de nombres** | ✅ | Ver el 0,97 % de §5·D0 |
| **Verificar los cruces** *(el hueco como señal)* | ⛔ **descartado** | 42,9 % contra 27,2 % de azar = **1,58×**, con 57 % de falsos avisos. *Un detector que grita por nada es uno al que se deja de hacer caso* |
| ⭐⭐ **Decir de qué LADO de la calle está el portal** | ✅ **y el diseño lo daba por imposible** | **89,5 %** de ways con paridad consistente contra **línea base 4,3 %**. Umbral 0,95: cubre el 83,2 % de los ways. ⚠️ En el 16,8 % restante **la app se calla**: decir la acera equivocada es peor que no decirla |
| ⭐⭐ **GENERAR el eje uniendo portales** | ✅ **y yo dije que no** | Uniendo todos: 5,9 m de error mediano (zigzag, mi objeción era correcta **para esa versión**). **Promediando por paridad: 1,3 m** — decímetros en calles normales. ⚠️ Solo calculable en 168 de 200, **y las 32 que faltan no son al azar**: son las correlativas y las de un solo lado |

⭐ **El caso que lo justifica todo:** `CAMINO LAS MONJAS`. El emparejador de texto eligió
*Camino de Las Monjas*, **a 278 m** de sus 12 portales. La nube eligió *Barrio Clavería*, **a 5 m**.

⚠️ **Y dos números que sostienen conclusiones y NO están cerrados**, declarados por el propio
ejecutor: la conectividad se midió sobre **160 tramos de 3.644 (4,4 %)**, y **117 de las 178
capas se clasificaron sin abrirlas** (clasificación documental, no verificación).

---

## 5 · Decisiones tomadas, con su porqué

| Decisión | Porqué |
|---|---|
| ⭐ **Motor propio** | Es el diferencial frente a 003. Consumir un motor ajeno devuelve el proyecto al terreno anterior |
| ⭐ **Nivel 2 de precisión peatonal** (acera y paso de peatones) | Nivel 1 —eje de calzada— acierta la calle y no el lado: no sabe que hay que cruzar. Y el nivel 2 **es lo que hace la demo**: una ruta que te manda al paso de cebra se entiende en veinte segundos |
| ⭐ **Entra OSM, con su coste** | Es la única forma de tener el nivel 2. Se paga la ODbL sobre la base derivada. **El código sigue siendo Apache 2.0** |
| ⭐⭐ **LOS HORARIOS ENTRAN** | Sin ellos la app **no sabe qué hora es**: a las 23:40 recomienda un 29 que dejó de pasar a las 22:15. La ruta no está mal — simplemente ignora que existe la noche. Con ellos aparece la escena que define el proyecto: *"el 29 ya no pasa; tienes el búho N4."* ⭐ Y los búhos son **el caso extremo sembrado en la demo**: sin horarios ni siquiera existen, y lo que no está en la demo solo lo sujeta un test |
| **Lo que cuesta, aceptado con los ojos abiertos** | El nodo deja de ser *un sitio* y pasa a ser *un sitio a una hora*. Aparecen los calendarios —laborable, sábado, domingo, festivo y sus excepciones—, que es donde se esconden los fallos **que el mapa no enseña**. Y sin `calendar.txt`, hay que leer `calendar_dates` fecha a fecha, que no es como lo hace la mayoría |
| ⭐ **El motor se REPARTE: grafo peatonal en el navegador, horarios en el servidor** | Son dos problemas distintos y no tienen por qué vivir en el mismo sitio. El grafo peatonal es minúsculo (3.644 tramos), es propio, y **es donde está el trabajo que se quiere enseñar**: se puede ver funcionando paso a paso. Las 870.717 filas de horarios no viajan a un navegador: son una tabla que solo se consulta (*dame las salidas del poste 744 después de las 09:41*) |
| ⚠️ **Y la ley *"el cliente no calcula nada"* se relee, no se aplica en automático** | Nació en 002/003 de que **dos motores divergen**. Aquí no hay dos motores del mismo cálculo: hay un motor de caminos y una consulta de horarios. Aplica su razón, no su letra |
| **El GTFS se DESCARGA, no se copia de 003** | Copiar el ZIP funciona hoy y crea un dato huérfano que se pudre el 5 de octubre sin avisar |
| ⭐ **La descarga propia del GTFS entra en el DISEÑO, no como remate** | El feed muere el **05/10/2026**, justo cuando se mira un portfolio después del verano. Con horarios dentro, la app no envejece mal: **se queda muda**. Un portfolio con un proyecto caído es peor que uno con tres |
| ⭐ **Ley del trasplante** | 004 es independiente. **Se copian DATOS** (ficheros estáticos, que al entrar dejan de ser de 003) y **DECISIONES** (gratis, sin límite). **Nunca MAQUINARIA**: scripts, pipelines, cachés. Copiar maquinaria *parece* independencia y no lo es — el día que 003 cambie, 004 tendrá una copia congelada de algo que ya no es cierto y no lo sabrá |
| **Repositorio público desde el commit 1** | El historial es parte del producto (§1) |
| **`data/exploracion/` fuera de git, con 17 excepciones a mano** | Son evidencia de un momento, no fuente; git guarda todas las versiones para siempre. Entran solo los crudos que sostienen las afirmaciones más fuertes — eso convierte *"confía en mi informe"* en *"compruébalo"* |
| **Este documento vive DENTRO del repositorio** | Se versiona, viaja con el proyecto y **es material de portfolio**. Condición: el entorno local (rutas, puertos, claves) **no vive aquí** — a fichero aparte gitignoreado, para que el estado no contenga nada sensible *por construcción*, no por acordarse |

### ⭐⭐ Las decisiones del diseño de H1 (tandas 2 · 2.B · 2.C)

**D0 · ⭐⭐ EL GRAFO SE CONSTRUYE SOBRE OSM. El dato municipal VERIFICA, no decide.**

> **Geometría:** OpenStreetMap. Nodalizada por diseño, con aceras, pasos de peatones, escaleras,
> `bridge`, `layer` y `tunnel`.
> **Atributos:** municipales cuando se puedan transportar, de OSM cuando no — y **declarado de
> dónde viene cada uno**.
> **El enganche del portal:** por proximidad sobre la geometría OSM. El `codigoVia` municipal dice
> si ese enganche es **coherente**. Discordancia ⇒ **se marca y se cuenta**.

⭐ **El porqué:** el problema del nivel estaba resuelto para OSM y abierto para el municipal —toda
la solidez de D1 viene del nodo compartido, y la capa municipal no tiene ni uno—. Construyendo
sobre OSM, ese problema **desaparece**: no hay que inferir nada sobre una capa que no se planariza.
Y el código es **universal**: el mismo motor valdría para otra ciudad.

⚠️ **Lo que se paga, dicho entero:**
1. **El puente exacto con los portales deja de decidir.** Se cambia un identificador por una
   proximidad. *(Cuatro familias de excepción ya medidas en los nombres: `CALLE UNCETA` ≠
   *Marcelino Unceta*, `NTRA.SRA.DE BONARIA`, sufijos rurales `---CST`/`---SGR`.)*
2. **Los atributos** —sentido, velocidad, peatonalidad— hay que transportarlos por ese mismo
   emparejamiento. Lo que no case se queda sin ellos o tira de los de OSM, con cobertura irregular.
3. **La cobertura.** El municipal es el callejero oficial: si una calle existe, está. **Lo que
   falte en OSM no existe para la app**, y solo lo hemos medido en el barrio mejor mapeado de la
   ciudad.
4. **La ODbL se lo come todo.** Con geometría municipal quedaba una puerta entreabierta; con esta
   decisión el grafo entero es derivado de OSM.

⭐⭐ **LA SALVAGUARDA NO HACE LA CONVERSIÓN MÁS PRECISA: HACE QUE SEPAS CUÁNDO HA FALLADO.** El
enganche va a fallar en algunos portales con salvaguarda o sin ella. Lo que cambia es tener un
número y una lista ordenada por gravedad, en vez de un fichero que parece correcto.
⛔ **Y la salvaguarda MIRA, CUENTA Y AVISA. No arregla.** Si "corrige" el fallo en vez de marcarlo,
es la corrección por cercanía que ya falló en el 29,6 %, con otro nombre.

⚠️ **Cabo abierto que nace con esta decisión:** cuántas vías del callejero municipal (3.359) **no
existen** en OSM. Es el número que dice cuánta ciudad se pierde, y **no está medido**. Barrido
completo, no muestra.

### ⭐ EL CICLO DE PULIDO (decidido por Antonio)

**Dejar fallar → contar → ordenar por gravedad → mirar los peores a mano → lo que sea patrón se
convierte en REGLA → lo que no, en excepción versionada que se reaplica sola.**

Primero se deja fallar y después se pule. Anticipar cada excepción antes de ver el fallo acaba en
reglas para casos imaginarios y ninguna para los reales.

⚠️ **Con una ley encima, de Linaje: AGRUPAR ES BORRAR.** Al pulir, la tentación será *"esto son 400
casos del mismo tipo, los trato juntos"* — y dentro de esos 400 habrá tres que no lo son. **Acotar
sí; agrupar SOLO lo idéntico.** Los parecidos van juntos para MIRARLOS, nunca para TRATARLOS.

**D1 · La regla de nivel — reescrita dos veces, y las dos por una medición.**

> **UNIR POR DEFECTO. No unir SOLO con evidencia positiva.**
> **C1 · Precedencia del nodo:** si dos vías **comparten nodo**, se conectan, y ninguna señal lo
> contradice.
> **C2 ·** No unir si hay `bridge` / `layer` / `tunnel` de OSM, **o** salto de `limite_vel` ≥50
> **entre dos vías RODADAS**.
> **La jerarquía NO vota.** Queda como marca informativa.

Cómo se llegó aquí, porque el camino es la lección:
- **v1 (propuesta):** *no unir cuando una de las dos vías es rápida.* Elegía el error ruidoso
  frente al silencioso, y era coherente.
- ⛔ **La medición la tumbó.** En Carretera de Huesca —la zona que Antonio eligió como *control
  positivo*, "donde la regla debería acertar sola"— dio **4 falsos positivos y 0 desniveles
  cazados**. ⭐ **El error conceptual: la jerarquía asume que vía rápida ⇒ cruza por encima. Una
  travesía es exactamente lo contrario: una vía rápida que cruza A NIVEL.**
- ⛔ **v2 tampoco valía**, y la parada saltó donde debía: aplicada a 7.114 cruces de 4 km²,
  **habría cortado 634 uniones REALES para evitar 2 errores** — incluida la plataforma elevada de
  Delicias **por dentro**, dejando la estación en el aire.
- ✅ **v3 (la de arriba) corta 0 y caza 113 de 115 desniveles.**

⭐ **Y el porqué de C1 es una ley, no un parche:** *la regla se pensó para la capa municipal, que
no tiene nodos compartidos. Aplicada a OSM —donde el nodo ES la topología— se vuelve un
destructor.* Una regla trasplantada de un mundo a otro sin comprobar si el terreno la sostiene.
⚠️ **Y el porqué de C2:** `06_Peatonal` lleva `limite_vel = 0`, así que una calle peatonal
cruzando una de 50 da un salto de exactamente 50. **En los 89 cruces de la muestra municipal no
había ni un par (0,50)**: el fallo estaba ahí y el dato no lo enseñó. Es el 4,4 % cobrándose su
precio.

**D2 · El error aceptado tiene que ser CONTABLE.** Todo cruce unido **sin evidencia positiva** se
marca `unido-por-defecto`. Aceptar un error silencioso "a sabiendas" sin contarlo es un cheque en
blanco: a los tres meses es una frase que nadie relee. El conteo da un número vigilable y una
lista comprobable sobre el terreno.

**D3 · En los portales manda el `codigoVia`, siempre.** La discordancia (3,5 % medido) **se marca,
no se corrige**. Corregir por cercanía es reintroducir el emparejamiento aproximado que ya falló
en el 29,6 %. Coste aceptado: un `codigoVia` mal en origen queda mal para siempre — se heredan
errores del callejero, no se inventan propios.
*Matiz: la intersección **sí** afina en qué TRAMO cae el portal (entre qué dos cruces), aunque no
puede decidir de qué CALLE es.*

**D4 · El aviso de precisión va POR TRAMO**, no al pie de página. ⇒ la precisión es un **campo**
que nace en el planarizado, sobrevive al motor y llega a la interfaz. Meterlo después sería
cirugía. ⚠️ Si resulta que la mayor parte de la ciudad cae en el caso malo, el aviso se vuelve
ruido —*el detector que grita ocho veces por nada*— y entonces **se invierte**: destacar lo bueno
en vez de advertir lo malo. Se decide con el porcentaje real delante.

**D5 · Tolerancia 2,0 m** para soldar puntas sueltas. Techo duro 5 m (la mediana extremo→línea es
5,10 m: media calle).

### ⭐⭐ PRINCIPIO DEL PROYECTO: BACKTESTING A SACO

Elevado por Antonio tras aparecerle en tres de las cuatro decisiones seguidas.

- **Barrido COMPLETO, no muestra.** Los 46.150 portales, los 3.644 tramos, todos los cruces. Nada
  de *"medí 160 y extrapolo"* — ya ha mordido dos veces.
- **Cada barrido con su CONTRAPRUEBA.** Sin ella devuelve un número tranquilizador indistinguible
  de un instrumento roto.
- **La COLA se mira a mano.** El barrido ordena; los peores 50 los verifica Antonio, que conoce la
  ciudad. ⚠️ **46.150 casos no se verifican a mano: se verifican con un instrumento, y el
  instrumento es lo que hay que verificar a mano.**
- ⭐ **El control positivo NO lo elige quien escribió el instrumento** (§8·17).

---

## 6 · ⚠️ Decisiones que se DESHICIERON — no se borran

| Se creyó | Por qué se dejó de creer |
|---|---|
| **"El dataset de portales sirve de grafo"** | Una nube de puntos no es un grafo. Cero aristas en 46.150 registros |
| **"`vias-zaragoza.json` contiene las vías"** | Ocho campos de nombres. **Ni una coordenada.** Lo destapó el reconocimiento 0.A |
| ⭐⭐ **"Tenemos lat-lon de todas las paradas de autobús" → se registró como FALSO** | ⚠️ **Y era CIERTO. El error fue MÍO, dos veces.** Estaban en `00 ZGZ RADAR` (939 paradas + 46 líneas con secuencia de postes), una carpeta que **nadie miró en once tandas porque yo nunca pedí que se mirara**. Se buscó en `01 ZGZ RADAR REACT`, que es otra. *La memoria de Antonio era correcta; el reconocimiento buscó en el sitio equivocado* |
| ⭐ **"La capa de nombres de 003 es la excepción defendible del trasplante"** | ⚠️ **Falso, y era MÍO.** Lo llamé dato; es la salida de 74 peticiones de raspado con **compromiso escrito de no redistribuir** en el `THIRD-PARTY-NOTICES.md` de 003. Maquinaria con aspecto de dato |
| ⭐⭐ **"Ninguna capa de viario gana sola: hay que combinar dos"** | ⚠️ **Falso, y era MÍO.** `MU1_jerarquia_viaria` tenía las dos mitades — **y estaba impresa en la tabla A2 del informe anterior, sin abrir.** Construí encima un argumento entero sobre unir geometría con texto, sobre un hueco que no existía |
| ⭐⭐ **"Un montón de líneas que no se tocan no es una red"** | ⚠️ **Mal destilado, y era MÍO.** La medición era correcta (los extremos no coinciden) y la conclusión falsa: **las calles se cortan por el MEDIO**. Y lo peor: esa ley ya estaba en la guía (nº19 de ZetaBus, *"bien medida, mal apuntada"*) y caímos igual |
| **"El conjunto 279 'Vías' tampoco traerá geometría"** | ⚠️ **Sospecha MÍA, refutada.** Declara `MultiLineString` y describe los ejes como entidades lineales |
| **"No hay red peatonal municipal"** | **Matizado:** sí existe —rebajes de pasos, escaleras urbanas, inventario de puentes— pero **no se publica**: acceso restringido |
| **"Un `.geojson` siempre viene en WGS84"** | **Falso.** El WFS sirve metros por defecto. El formato no garantiza la proyección |
| **"`estadoEstacion` es el campo bueno de BiZi"** | **Falso, y es el más engañoso:** es el único con vocabulario controlado publicado. **El aspecto de rigor dice cómo se diseñó, no si se rellenó bien** |
| **"El nº total de anclajes BiZi no viene"** | ⚠️ **Falso.** Sí viene, en `anclajes_bicicletas` de la capa WFS. La 0.C solo había mirado el `.geojson` de la sede |
| **"Las 276 estaciones BiZi pueden incluir fantasmas"** | ⚠️ **Sospecha MÍA, refutada.** 276 únicas, cero duplicados, cero pares a menos de 25 m. Las ~130 públicas son la FASE I; la FASE II añadió 168 |
| **"El bloqueo se resuelve buscando más en el catálogo"** | **Parcialmente falso.** La topología no existe en ningún catálogo de ninguna ciudad, y buscarla es tirar peticiones. Lo que sí apareció buscando fue la capa que lo cambió todo |
| ⭐⭐ **"Ante un cruce dudoso, no unir por defecto: es el error ruidoso"** | ⚠️ **Falso, y lo firmé YO** con un argumento de asimetría correcto en abstracto. La medición lo tumbó: la jerarquía daba **4 falsos positivos y 0 aciertos** en la zona elegida como control positivo. **La prudencia salía carísima porque el caso que quería proteger casi no existe** (el 97 % de 2.680 cruces son a nivel) |
| ⭐⭐ **"Con la jerarquía fuera, la regla ya vale"** | ⚠️ **Falso, y también lo firmé YO.** Aplicada a 7.114 cruces habría cortado **634 uniones reales para evitar 2 errores**, y partido la plataforma de Delicias por dentro. Le faltaban dos cláusulas, **y ninguna salió de razonar: las dos salieron de contar** |
| ⭐ **"El municipal no tiene ninguna señal de desnivel"** | **Falso.** Sí la tiene —salto de `limite_vel`, jerarquía, titularidad—. Pero el paso inferior de Cesáreo Alierta demuestra que **no basta**: mismo límite arriba y abajo, misma familia de vía. Solo lo caza OSM |
| ⭐⭐ **"Unir los portales para generar el eje daría un zigzag inservible"** | ⚠️ **Falso, y era MÍO.** Describía bien la versión torpe (unir todos: 5,9 m) y la usé para descartar la idea entera **sin considerar la variante que la anula**: cada hilo va por su acera, y **la media de las dos aceras es la calzada — 1,3 m**. Nunca lo medí. *La idea era de Antonio y hubo que insistir* |
| ⭐⭐ **"De qué lado de la calle está un portal no se puede saber"** (P4.3 del diseño) | ⚠️ **Falso.** 89,5 % de aciertos contra una línea base del 4,3 %. **Abre el nivel 2 completo** |
| ⭐ **"Hay tres huecos de cobertura nuevos"** | ⚠️ **Dos de los tres eran del propio instrumento.** Un radio de 25,0 m contra portales a 25,0–26,5 m: **por un metro**. De 10 huecos publicados, **4 falsos** |
| ⭐ **"El 4,11 % puede estar tocado por el sesgo de homónimos"** | ⚠️ **Sospecha MÍA, refutada leyendo el código:** aquel instrumento **no toca los nombres**, así que era inmune. Correcto y **ligeramente pesimista** |
| ⭐⭐ **"La Estación de Delicias queda sin acceso, hay que usar los pasos condicionales"** | ⚠️ **Falso, y era MÍO.** Lo que la dejaba sin acceso era **su centroide, 60 m dentro del edificio**. Con la puerta, **ninguna de las siete rutas necesita un paso condicional (±0 m)**. *La decisión de Antonio sigue en pie —el caso que de verdad la justifica apareció solo: la ruta del casco que cruza el C.C. Independencia El Caracol— pero **se decidió con un argumento equivocado y se acertó igual*** |
| ⭐⭐ **"El contador de pasos condicionales se queda corto: el Pasaje Palafox no está entre los 96"** | ⚠️ **Falso, y era MÍO.** Sus tres ways **sí** llevan `building_passage`. Lo cierto es que **además** tiene la punta sin soldar de 4,94 m |
| ⭐ **"Las bandas de las siete rutas sirven para comparar"** | ⚠️ **Falso, y era MÍO.** Derivadas de los tiempos con **4,3–5,0 km/h**; Antonio anda a **~6**. Tres bandas eran **físicamente imposibles contra la línea recta**. ⭐ Y el aviso estaba escrito en el propio documento: *poner la advertencia y usar el instrumento igual no es una excepción, es el patrón* |
| **"Los 512 m del enganche eran por usar el grafo del casco"** | ⚠️ **Solo una de las dos causas.** `resolver()` enganchaba **al nodo**: máximo real 566,6 m. **512 m cabía también en el grafo bueno** |
| **"`entrance=*` no consta en el dato"** (tanda 12) | ⚠️ **Correcto con su dato, falso en general:** aquellas descargas eran de **ways** y las entradas son **nodos**. Existen: **2.085**. *Faltaba pedirlo* |
| **"Son 2.006 portales sin ningún testigo"** | ⚠️ **Era una extrapolación.** Contados: **1.879**, y la capa municipal rescata 287 ⇒ **1.592 (3,5 %)** |
| ⭐ **"Los 504 de Overpass eran la forma de la consulta"** (ley nº32) | ⚠️ **Refutada al día siguiente por el propio ejecutor**, con el dato en la mano: fallaron también sentencias únicas, y el servidor declaraba slots libres ocho segundos después de un 504. **Causa: `CAUSA NO CONFIRMADA`** — que es `NO CONSTA` con apellido |

---

## 7 · ⚠️ EL INSTRUMENTO HA MENTIDO 145 VECES

**Cuarenta tandas, cuatro bloques de auditoría y nueve de arreglo** *(siete numeradas más `1·bis` y
`2·bis` — contadas sobre §10 el 9/08, donde decía «diez»)*. **Ciento cuarenta y cinco instrumentos mintiendo** *(115 al cerrar H1 + 30 en las tandas de H2)* —
los 33 primeros, sin una sola línea de código. Ya es una categoría, no una anécdota — y llegó antes
que el proyecto.
⚠️ **Los treinta y cinco últimos (81-115) los produjo la propia auditoría y sus arreglos**, ⛔⛔ **y
el nº99 lo produjo la conversación de estrategia, que escribe estos encargos.** Casi todos se cazaron
**porque el instrumento llevaba dentro un contador o un control**. ⭐⭐ **El nº87 lo paró una costura
escrita en el encargo** — es la primera vez en este proyecto que se puede señalar una costura y
decir *«esto lo detuvo ella, no el criterio de quien medía»*.

| # | Qué mintió |
|---|---|
| 1 | ⭐ **`coveragePercent: 100` con el 29,6 % de los números mal.** Cinco contadores en verde midiendo si Nominatim **respondió**, no si respondió **bien**. Y es el metadato de un dataset **afirmando su propia calidad**: viaja entre proyectos como si fuera verdad verificada |
| 2 | **Los `sha256` del metadata no validan ninguno de sus 4 ficheros.** CRLF vs LF: la diferencia de bytes es exactamente el nº de líneas en los cuatro casos. Un verificador daría fallo sobre un dataset intacto |
| 3 | ⭐⭐ **El puente `int(stop_code[2:])`, verificado 934/934**, devuelve `1` para `"0101"` y `"1101"` en las 50 paradas de tranvía. **No revienta: miente** |
| 4 | **Un `.geojson` sirviendo UTM.** El formato tiene fama de ser siempre WGS84 y el fichero no avisa de nada |
| 5 | ⭐ **`lastUpdated` con sufijo `Z` y hora local.** ISO 8601 válido, parseable, valor creíble — y dos horas en el futuro. Un chequeo de frescura pasa *demasiado* en verde |
| 6 | ⭐ **`estadoEstacion`: el campo que PARECE riguroso es el roto.** Vocabulario controlado, URI publicada, interoperable — y `no-operativa` en 50 de 50 estaciones vivas. Cualquier criterio razonable elige justo ese |
| 7 | ⭐ **Un guion en un regex escondió dos capas**, y una era candidata a red viaria. `[a-zA-Z0-9_]*:` no incluye el guion, y `tn-ro` desapareció en silencio |
| 8 | **`grep -c` sobre un XML de 5 líneas con 178 capas dentro → 0.** Cuenta líneas, no coincidencias |
| 9 | **El extractor de campos asumiendo que `name` es el primer atributo:** ciego a todos los campos. Lo delató un control con `BRIDGE`, visto a ojo |
| 10 | ⭐ **El muestreo por ventanas contando el mismo tramo hasta 8 veces:** 33 pares donde había 21. `HISPANIDAD` es una feature de 19,4 km que cruza ocho ventanas |
| 11 | ⭐⭐ **Medir los EXTREMOS en vez de las INTERSECCIONES.** El número era correcto y la conclusión —"no hay topología"— falsa |
| 12 | ⭐ **Una tabla que enumeraba `MU1_jerarquia_viaria` sin haberla abierto.** Enumerar dio sensación de cobertura |
| 13 | ⭐ **El falso mojibake:** `V?as` en pantalla con fichero UTF-8 perfecto. Era la terminal en cp1252, y estuvo a punto de acusarse al servidor. **Reverso exacto** del caso `ABOGACíA`, donde el fichero estaba bien y el dato mal escrito |
| 14 | ⭐⭐ **El barrido de rutas locales dio CERO**, y era falso (escapado roto). El segundo intento tomaba `https:` por una unidad de disco. **Cero es la respuesta más tranquilizadora que existe y es indistinguible de "no he medido nada"** |
| 15 | ⭐⭐ **`*.pem  # claves privadas`** — el comentario formaba parte del patrón. **Tres reglas inertes, dos de credenciales**, en un fichero que se leía impecable. Sin la contraprueba obligatoria se habría publicado así |
| 16 | ⭐⭐ **La primera prueba del guardián dio verde sin probar nada:** la bitácora entera estaba en el stage, así que su propio diff satisfacía la comprobación. **La prueba compartía estado con lo probado** |
| 17 | ⭐⭐ **TRES NÚMEROS PUBLICADOS EN LOS INFORMES, FALSOS** — y los tres colaban porque **venían acompañados de un número verdadero al lado**: los "106 puntos de cruce" son 89 (un cruce sobre un vértice lo contaban los dos segmentos que lo comparten, y los 87 pares SÍ eran correctos); los "4 tramos duplicados" son 2 pares (el 4 contaba extremos, y cuadraba con el 21). **Un número que cuadra con su vecino no está verificado: está apuntalado** |
| 18 | ⭐⭐ **"LA MISMA ZONA DEL CASCO" ERAN DOS RECTÁNGULOS DISTINTOS.** Solapan un 21 %, y solo el 5,3 % de los vértices municipales caía dentro de la caja de OSM. La frase *"54 ways de OSM frente a 19 tramos municipales en una ventana equivalente"* **comparaba dos sitios.** ⚠️ Lo que salvó la decisión de meter OSM: **cero es cero en cualquier ventana** — 115 aceras y 43 pasos contra ninguno municipal no depende del encuadre |
| 19 | ⭐⭐ **UN CONTROL POSITIVO QUE ERA UN ESPEJO.** Pasó 3 de 3… y los tres casos los eligió quien escribió el instrumento, en la forma que su propio normalizador ya sabía resolver. Casos reales que fallaban: `CALLE UNCETA` ≠ *Calle de Marcelino Unceta*, `NTRA.SRA.DE BONARIA`, y sufijos rurales `---CST` / `---SGR` |
| 20 | ⭐ **"THE SERVER IS PROBABLY TOO BUSY" ERA FALSO.** Tres HTTP 504 y una réplica colgada: cuatro señales coherentes diciendo *servicio caído*. La misma ventana devolvió 871 KB sin problema. ⚠️ **Y al día siguiente se refutó también la explicación de recambio.** El mismo servidor dio dos explicaciones distintas del mismo hecho |
| 21 | ⭐⭐ **CUATRO VENTANAS, TRES FECHAS.** Al caer la instancia principal, dos zonas se pidieron a una réplica: traen datos del 6 y el 31 de mayo, no del 2 de agosto. **El sello de fecha vive tres niveles dentro del JSON y nadie lo mira** |
| 22 | ⭐ **`layer` NO ES ENTERO:** aparece `-1.5`. Un `int()` lo revienta o lo tira en silencio. Y **`tunnel=building_passage` NO es un túnel**: es un pasaje bajo un edificio y a pie se pasa. Tratarlo como desnivel cortaría un camino real |
| 23 | ⭐ **UN HTML DE ERROR GUARDADO CON EXTENSIÓN `.json`.** 695 bytes de `<!DOCTYPE html>` con nombre de dato. Cazado y renombrado en el momento — **una bomba a seis meses vista** |
| 24 | ⭐⭐ **UN INSTRUMENTO QUE MEDÍA DENSIDAD URBANA Y LO LLAMABA COBERTURA.** Con el callejero **movido 2 km al norte**, seguía dando **58 % de cobertura**: en una ciudad, cualquier línea está a 20 m de alguna calle |
| 25 | ⭐⭐ **Y LO QUE LO CERTIFICABA EN FALSO ERA UN BARRIDO DE SENSIBILIDAD:** 96-99 % con umbrales de 5, 10, 15, 20, 30 y 50 m. Esa estabilidad se lee como robustez —*"da igual el número, luego no depende de él"*— y era lo contrario: **salía lo mismo porque el umbral no era la variable que mandaba** |
| 26 | ⭐⭐ **UNA CONTRAPRUEBA DE LAXITUD QUE PASÓ 8 DE 8 Y NO VALÍA NADA:** los disparates inventados (`CALLE ZURRIBURRI DEL PAMPANO`) no se parecen a nada. **La laxitud vive en los casi-aciertos**, y lo destapó una muestra al azar: `PLAZA ESPAÑA ---GRP` casando con *Avenida de España*, con **ocho Plaza España en 20 km** |
| 27 | ⭐⭐ **AGRUPAR OSM POR `name` COSIÓ SIETE PLAZA DE ESPAÑA EN UN OBJETO DE 20 KM**, y cinco vías municipales emparejaron con esa quimera. ⚠️ **La ley 17 incumplida al día siguiente de escribirla.** (OSM tiene además 13 Calle Mayor y 9 Miguel Servet) |
| 28 | ⭐⭐⭐ **Y LA CONTRAPRUEBA DE DESPLAZAMIENTO DIO VERDE CON ESE FALLO DENTRO** — no por mala suerte: **mover 2 km no acerca dos homónimos que están a 20**. Comprueba que el instrumento sabe **dónde** está una cosa; no que sepa **cuántas** hay. *Lo cazó el banco de pruebas, no el total: 5 vías de 2.731 no mueven un porcentaje* |
| 29 | ⭐⭐⭐ **UN RADIO DE 25,0 m DECLARANDO UN HUECO QUE NO EXISTÍA, POR UN METRO.** `CALLE TOMILLO` está en OSM; sus portales, a 25,0–26,5 m (chalets con jardín delantero, portal en la valla). **4 de 10 huecos publicados eran falsos.** ⭐ Y lo que lo blindaba era su mejor argumento: *el radio salía del p85 de una propiedad física, no se puede retocar para que quede bonito*. Cierto — **y aun así sesgado** |
| 30 | ⭐⭐⭐ **UN DATO IMPECABLE EN TODOS LOS EJES QUE ESTE PROYECTO SABE COMPROBAR, Y LA TRAMPA EN UNA FRASE EN CASTELLANO.** `200`, JSON válido, `totalCount` cuadrando con `len(result)`, los cuatro campos rellenos… y **15 farmacias "de guardia" de las que solo 8 están abiertas a las 03:40**. Las otras 7 son refuerzo de horario partido. **Un filtro por `tipo=guardia` acierta el 53 %** a esa hora |
| 31 | ⭐⭐ **UN `200` DE 62 BYTES SIN LA CLAVE `result`.** No es una lista vacía: **el campo no existe**. Un cliente con `?.length ?? 0` obtiene cero y dice *"no hay guardias"* — **imposible en Zaragoza**. Solo se cazó porque el método obligaba a pedir HOY primero: **sin línea base, esos 62 bytes son indistinguibles de un día tranquilo** |
| 32 | ⭐⭐ **EL `break` EN LA PRIMERA URI DEL ARRAY.** Una farmacia que fuera *horario ampliado* **y** *guardia* perdía la segunda marca: **el "2" era un SUELO, no un total**, y no es recuperable porque el crudo no se persistió. ⭐ Lo blindaba la procedencia más creíble del proyecto —vocabulario SKOS, URI publicada, fecha en el identificador—. **El rigor del emisor no protege de un `break` en el receptor** |
| 33 | ⭐⭐ **UN CONTADOR QUE DEVOLVÍA LA CONSTANTE `1` POR SU RAMA `else`.** `Counter({1: 314})` tenía todo el aspecto de un barrido completo confirmando una hipótesis. **La estabilidad venía de que no había variable** — hermana directa del barrido de sensibilidad (nº25) |
| 34 | ⭐⭐⭐ **EL GRAFO DECÍA "UNIDO" Y EL DIBUJO ENSEÑABA DOS LÍNEAS SEPARADAS.** D5 soldaba **la identidad del nodo** y dejaba la geometría donde estaba: **20 nodos existiendo en dos sitios a la vez**, el peor a 1,90 m. ⭐ **Ningún contador de la tanda 8 podía verlo: todos preguntan por la topología y el fallo estaba en la geometría.** Y el signo lo delató — *si fuera redondeo habría MENOS nodos, no más* |
| 35 | ⭐⭐ **EL VISOR TENÍA UN ERROR DE SINTAXIS Y HABRÍA ABIERTO EN BLANCO.** Lo cazó **no tener navegador**: en vez de escribir *"abre y funciona"*, se montó un Leaflet simulado que **cuenta en vez de dibujar**. ⭐ **La limitación produjo la comprobación** |
| 36 | ⭐⭐ **UNA CONTRAPRUEBA QUE NO PODÍA PONERSE ROJA.** Elegía al azar entre 458 aristas de articulación y **341 son colgantes**: borrarlas deja un nodo huérfano que el contador saltaba en silencio. *El Tarjan estaba bien; mentía la traducción de su salida a la pregunta* |
| 37 | ⭐⭐⭐ **UN CONTROL POSITIVO DE 3 DE 10, Y ERA EL ENCUADRE** — siete cruces fuera del bbox. **El error nº18 otra vez, con la ley ya escrita, en la primera tanda de código.** ⭐ Y lo que lo blindaba: **que el resultado fuera MALO.** Un 3 de 10 se lee como *"el planarizado falla"* y manda a depurar el sitio equivocado |
| 38 | ⚠️ **EL GUARDIÁN ACERTÓ Y ESTROPEÓ EL COMMIT SIGUIENTE.** Rechazó un `fix:` sin bitácora —correcto, y por primera vez sobre un fallo real— pero **su rechazo deja el esqueleto en el stage**, y el commit siguiente se llevó 5 ficheros en vez de 2 |
| 39 | ⚠️ **Y DOS FALLOS DE LECTURA MÍOS SOBRE EL MAPA**, los dos por el mismo sesgo: tenía una hipótesis —*"hay demasiado azul, el clasificador falla"*— y **leí el mapa para confirmarla**. El azul era zona peatonal, no pasos de peatones; y lo que tomé por *eje-de-calzada* mal clasificado eran **escaleras** |
| 40 | ⭐⭐⭐ **EL CRUDO TRAÍA CALLES DE COSTA RICA Y DE MÉXICO.** `area["name"="Zaragoza"]` **no nombra un sitio: nombra una CLASE de sitios.** Cuatro municipios homónimos, 398 ways de 48.211 — invisibles en el volumen, y **mueven el bbox 18.000 km**: superficie declarada 27.013.502 km² contra los 973,8 del término. ⭐ **El fallo suma, no resta**, así que la descarga sigue valiendo. Y el casco lo tapaba porque el recorte los tiraba. *Tercera vez que muerde el homónimo — y ahora contra el nombre de la propia ciudad* |
| 41 | ⭐⭐⭐ **13,8 KM DE CALLES QUE TODAVÍA NO EXISTEN, Y EL GRAFO DEJA ANDAR POR ELLAS.** 178 aristas `proposed`, **23 de ellas ARTICULACIONES**: 82 nodos cuyo único paso es una calle sin construir. ⭐ Y la causa es la ley: *`transitableAPie()` excluye `construction` porque en el casco había 117 y se los encontró de frente; no excluye `proposed` porque allí había cero.* **Un filtro escrito enumerando los casos que aparecieron no es una regla: es una lista** |
| 42 | ⭐⭐ **PEÑAFLOR DE GÁLLEGO INCOMUNICADO —294 nodos, 317 calles con nombre— Y EL CONTADOR DE COMPONENTES URBANAS DABA 0.** El clasificador lo etiquetó como *"artefacto del límite"*: **la costura funcionaba y su propia definición se había comido el caso.** ⭐ *Estar pegado al borde es la causa, no una excusa para no contarlo: explicar un agujero no es taparlo* |
| 43 | ⭐⭐⭐ **UN SCRIPT MIRANDO EL GRAFO EQUIVOCADO, Y NADA AVISABA.** `ruta.js` usaba el grafo del **casco** (5.121 nodos) sobre una dirección del Actur: origen enganchado a **512 m** y **rodeo 0,884 — físicamente imposible**. ⭐ Y mentía con toda naturalidad: sello correcto, JSON válido, avisos coherentes, `encontrada: true`. **Solo el grafo estaba mal.** ⚠️ Lo destapó **una pregunta de curiosidad de Antonio** —*¿por qué pasa por Juslibol?*—, no una verificación: nadie tenía motivo para ejecutar ese script |
| 44 | ⭐⭐ **Y LOS 512 m TENÍAN DOS CAUSAS.** `resolver()` **enganchaba al NODO, no a la arista**: máximo real **566,6 m**. ⇒ **512 m cabía también en el grafo bueno.** Arreglar solo la zona no habría arreglado nada |
| 45 | ⭐⭐⭐ **UN GUARDIÁN QUE AVISA EN ROJO Y SIGUE.** Una ruta de cordura estuvo **DOS TANDAS rota**, publicada en `H1-PRIMER-GRAFO.md` §C4d **como correcta**, con el `⛔` impreso en pantalla y el proceso saliendo en 0. ⭐ **Aquí ni siquiera hacía falta escribir la ley: el instrumento ya lo había detectado.** *Un `⛔` impreso no es un fallo: es texto* |
| 46 | ⭐⭐⭐ **LA PREMISA DE UNA DECISIÓN ERA UN ARTEFACTO.** Se presentó *"la Estación de Delicias queda sin acceso"* como motivo urgente para cambiar la decisión sobre pasos condicionales. **Falso:** lo que la dejaba sin acceso era **su centroide, 60 m dentro del edificio**. Con la puerta, **ninguna de las siete rutas necesita un paso condicional (±0 m)**. ⭐ **Solo se pudo saber porque el orden C→D era obligatorio** — tocándolos a la vez, la conclusión habría sido *"C arregló Delicias"* para siempre |
| 47 | ⭐⭐ **EL CÓDIGO IBA POR DETRÁS DEL DOCUMENTO.** `rutas-antonio.js` tenía las bandas **v1** copiadas dentro y publicó *"0 de 5 en banda"* cuando el fichero decía otra cosa: eran **3 de 5 dentro y 2 rozando**. *Dos copias del mismo dato divergen — y ya habían divergido* |
| 48 | ⭐⭐ **UN CONTADOR DE SÍMBOLOS HABRÍA INFLADO EL PROBLEMA POR DIEZ.** Buscar `⛔` en las salidas dio **10 sospechosos de 18 scripts**; clasificados a mano, **nueve eran prosa o contadores en cero** (`⛔ rodeos imposibles 0 ✅`). **Solo uno era un fallo** |
| 49 | ⭐⭐⭐ **TRES COMPROBACIONES DEGRADADAS EN TRES TANDAS SEGUIDAS, TODAS POR PASAR POR CONSTRUCCIÓN.** El cuarto testigo del E7 *(un portal es ciego precisamente porque enganchó a una acera sin nombre)*; la de las puertas *(«el 97 % tiene la puerta entre los candidatos» era trivial: las entradas son vértices del polígono y el muestreo mete todos los vértices — la delató una mediana de 0,0 m)*; y la de articulaciones de la tanda 9. **Ya no es casualidad: es un patrón** |
| 50 | ⭐⭐ **LA TANDA 13 MIDIÓ LAS PUERTAS CON LA REGLA EQUIVOCADA.** Midió `puertaDe()` —el perímetro más pegado a la calle— **y el motor no usa eso**: usa el más barato por ruta. ⭐ **La advertencia estaba impresa en el propio informe dos pantallas más arriba, y el número se publicó igual** *(mismo patrón que las bandas de las rutas)* |
| 51 | ⭐⭐ **UN 100 % POR CONSTRUCCIÓN.** Tras aplicar `entrance`, Delicias acierta la puerta en el **100 %** de los orígenes — **porque el destino nuevo ES la entrada.** No vale nada, y el ejecutor lo declaró en vez de presumirlo. *Lo que sí informaba era el ANTES: en un tercio de los orígenes el motor ya acertaba* |
| 52 | ⭐⭐⭐ **UN ARNÉS DE PRUEBA QUE PROBABA OTRA COSA.** El detector del orden de números decía cazar el **44 %** del fallo correlacionado. Falso: el arnés **ordenaba por número y adivinaba el paso**, así que en una vía 1·3·5·7 movía el 1 y el 5 **dejando el 3 quieto** — *la prueba del fallo correlacionado estaba desordenando la vía*. **El 44 % era el detector cazando el destrozo del arnés.** ⭐ Lo delató **el álgebra escrita por el propio ejecutor ocho horas antes**: si la prueba es invariante a trasladar el trío, esa columna tiene que dar 0 |
| 53 | ⭐ **«QUEDARSE CON EL PRIMERO» NO ES COLAPSAR UN DUPLICADO: ES TIRAR UNA MONEDA.** Primera versión del detector, ante 147 portales llamados «31» en la misma vía |
| 54 | ⭐⭐⭐ **UNA DEPENDENCIA CIRCULAR QUE DEJABA EL MOTOR SIN MODELO — Y AVISABA DESDE HACÍA DOS TANDAS.** `ruta.js` devolvía rutas **sin los nombres deducidos** porque dos ficheros se pedían datos en círculo. El `Warning` de Node salía **en la última línea, después del resultado**, que es donde ya nadie mira. ⭐ Y **el `try/catch` lo tapaba: avisaba y seguía** |
| 55 | ⭐⭐⭐ **EL MAPA Y EL MOTOR DECÍAN COSAS DISTINTAS DE LA MISMA LÍNEA — 774 casos.** El exportador **copiaba la regla** del redactor en vez de llamarla. ⭐ Y **el primer arreglo tampoco valía**: copiar `deWay` seguía divergiendo en 341 |
| 56 | ⭐⭐⭐ **TRES CONTADORES DE LA MISMA FUENTE NO SON TRES TESTIGOS.** Visor, arnés y dato decían **44.842** y cuadraban perfectamente: **los tres leían lo mismo, y lo mismo estaba mal** |
| 57 | ⭐⭐⭐ **EL GROSOR Y LA OPACIDAD SON UNA AFIRMACIÓN.** El rojo se pintó a `2,2/0,9` y el azul a `1,4/0,55` —*«que canten»*— y **doce aceras rojas gruesas tapaban un eje azul fino**: la calle se leía roja teniendo su eje azul |
| 58 | ⭐⭐ **UN ARNÉS QUE NUNCA LLEGÓ A PROBAR NADA, Y DABA VERDE.** El precargado no cargaba y el proceso moría antes de arrancar — **código 1 y ninguna salida, los dos síntomas exactos del éxito buscado.** ⭐ **Lo cazó el reloj**: siete scripts de 20-60 s terminaban en 14 |
| 59 | ⭐⭐ **EL SEGUNDO TESTIGO LE QUITÓ EL NOMBRE A 176 LÍNEAS QUE LO TENÍAN** — *«Calle del Valle de Broto»* y *«CALLE VALLE DE BROTO»* **se partían el voto y se anulaban**. ⭐ Lo cazó **un `undefined` al ir a imprimir los dos nombres de cada discrepancia** |
| 60 | ⚠️ **EL MISMO CICLO DE `module.exports`, REPETIDO EN LA TANDA SIGUIENTE A ARREGLARLO.** *Cazado antes de ejecutarlo, y ahora hay un barrido que lo comprueba en los ocho ficheros* |
| 61 | ⭐⭐⭐ **3.786 PASOS DE CEBRA LLEVABAN UN NOMBRE QUE LES PUSIMOS NOSOTROS** — uno de cada tres. Casi todos, del testigo de la calle pegada: **un paso mide 4 m, así que sus cinco puntos de muestreo caen casi encima y siempre hay una calle a menos de tres metros.** ⭐ *No era un fallo del método: la pregunta no aplicaba y nadie se lo había dicho* |
| 62 | ⭐⭐⭐ **UN NÚMERO PUBLICADO SIN NADA QUE LO PROTEJA.** Rota `sinNombrePorDefinicion()`, el exportador sale en **código 0 con los nueve cuadres en ✅** y **0 grises**: el reparto publicado cambia entero y **nadie se entera**, porque los cuadres solo exigen que las categorías **sumen 98.774** — y eso pasa siempre |
| 63 | ⭐⭐⭐ **UN GUARDIÁN QUE NUNCA PUDO DISTINGUIR LO QUE DECÍA DISTINGUIR.** Se titula *«el positivo de control»* y afirma exigir un nombre **que solo puede venir del modelo**. Vaciado el modelo, **pasa en verde**: busca una subcadena que **el eje de la calle aporta por su cuenta, porque lo nombra OSM**. ⭐ *No se estropeó: nunca pudo. La frase era un razonamiento, no un rojo visto.* ⚠️ **Y no era la única: 7 de 210 comprobaciones tenían la misma forma** |
| 64 | ⭐⭐⭐ **CINCO DE DIEZ MUTACIONES DE UNA AUDITORÍA NO LLEGARON A OCURRIR** — y sin una columna de control **se habrían publicado como cinco guardianes muertos: hallazgos falsos que confirmaban justo la tesis de la tanda.** ⭐ Cazado por **el reloj y la palanca a la vez**: la segunda ronda murió a 0,1 s por script contra 15-60 s de base |
| 65 | ⭐⭐ **«20 CONGELADOS / 20 MEDIDOS / 0 HUÉRFANOS ✅»** — perfecto, **y dos de esas filas medían otra cosa.** *Una comprobación de cardinalidad no dice nada del contenido* |
| 66 | ⭐⭐ **TRES INDICADORES FAVORABLES QUE ERAN EL MISMO TESTIGO TRES VECES.** Al elegir la capa de parques, los tres medían **la pureza de lo que entra** y **ninguno miraba la cobertura**. ⛔ El positivo de control tumbó la elección: cruzar las dos capas **dejaba fuera el Parque del Agua entero, 0 de 493** |
| 67 | ⚠️ **DOS NÚMEROS PUBLICADOS CADUCADOS SIN QUE NADIE LO NOTARA.** *«De 11.742 a 3.166 puertas sin calle»* seguía escrito con el 3.166 cuando ya eran 2.669; y *«82 pasos»* eran 74. Tres tandas pasaron por encima |
| 68 | ⚠️ **UNA OPCIÓN INVENTADA QUE NO EXISTE SE PASA IGUAL DE BIEN QUE UNA QUE SÍ.** `{asignacion: …}` corrió veinte segundos y devolvió el modelo de hoy dos veces. ⭐ Lo delató **que el «antes» salió clavado al «ahora» — tercera vez** |
| 69 | ⚠️ **`codigo=0` LEÍDO CUANDO EL SCRIPT SALÍA EN 1**: `$?` era el de `tail`. *El instrumento con el que compruebo también es un instrumento* |
| 70 | ⚠️ **UN CERO PICA MENOS CUANDO CONFIRMA ALGO INTERESANTE.** «0 avisos de bici» buscando *«bicicleta»* cuando el texto dice *«bicis»*: eran 5 |
| 71 | ⭐⭐⭐ **EL BUSCADOR MANDABA A LA ACERA DE ENFRENTE Y NINGUNA SALVAGUARDA PODÍA VERLO.** Se pidió `Avenida Cataluña 78`, **el 78 no existe**, y cayó al **77** —la otra acera— con **el par más próximo a 258 m**. ⛔⛔ **Los tres testigos son ESTRUCTURALMENTE CIEGOS al lado**: las dos aceras tienen el mismo nombre y el mismo `codigoVia`, así que los tres dicen *«correcto»*. ⭐ **Y todos los porcentajes publicados —99,6 % · 97,0 % · 93,4 %— miden identidad de CALLE, no de acera.** Lo vio Antonio a ojo en el primer sitio que miró |
| 72 | ⭐⭐⭐ **EL CENTINELA 99999.** 117 portales con número crudo `BL0`/`A1` inflaban el universo de consultas **a 150.947** — el triple. ⚠️ **Y los dos números que esta ficha publicó antes —«de 51.028 a 151.026»— NO eran ninguno el bueno**: el 51.028 excluía la vía entera. Limpio son **51.065**. ⛔ Y lo grave: **dos cuadres entre tandas estaban en VERDE sobre el mismo artefacto** *(el barrido reproducía a la 32 con <0,1 % de diferencia y el dial de la 33 predijo 31.411 y salieron 31.411 clavadas)*. **Lo cazó una mediana redonda, no una comprobación** |
| 73 | ⭐⭐⭐ **EL ACANTILADO QUE JUSTIFICÓ UNA DECISIÓN ERA EL ARTEFACTO.** El listón se subió de 50 a 100 m porque *«entre 50 y 100 las contestadas se multiplican por siete»*. **Limpio, el salto es ×1,4.** ⇒ **La decisión se tomó sobre un número inflado** |
| 74 | ⭐⭐ **LOS 150 m DE «ENFRENTE» ERAN DESFASE, NO ANCHO.** Solo el **24,4 %** era de verdad cruzar la calle. *La avenida más ancha de Zaragoza tiene 80 m de mediana: 150 es casi el doble de la más ancha que existe* |
| 75 | ⭐⭐⭐ **CUATRO NÚMEROS PUBLICADOS QUE NO REPRODUCE NINGUNA VERSIÓN DEL REPOSITORIO** (nº144). El comentario del código decía unos, el documento publicó otros, **en el mismo commit y con el mismo bucle**. Sobrevivieron tres tandas porque **ningún guardián los comparaba con nada** |
| 76 | ⚠️ **UNA CIFRA MAL LEÍDA DE UNA TABLA PROPIA ENTRÓ EN UNA DECISIÓN.** *«Conservando 2.982 de los 3.340 buenos»* — los 2.982 eran el **total**, no los buenos: se perdían **1.206**, no 358. **Y la cifra volvió convertida en la base del encargo siguiente** |
| 77 | ⛔⛔ **EL CENTINELA SE APAGÓ EN EL INFORME, NO EN EL INSTRUMENTO** (auditoría A). `acera-equivocada.js` sigue imprimiendo **los cuatro números que la tanda 35 declaró falsos** — y **la batería lo ejecuta en cada `--todo` y sale en verde** |
| 78 | ⛔⛔ **DOS MEDIDAS DEL MISMO UNIVERSO QUE DIVERGEN HOY**: 50.986 contra 51.065. Una agrupa por `codigoVia` y otra por núcleo de vía. **Mismo rótulo, universos distintos** — y el congelado vigila uno de los dos |
| 79 | ⛔⛔ **EL README DICE QUE TODAVÍA NO HAY CÓDIGO.** *«Fase actual: reconocimiento de fuentes. Ni una línea de aplicación.»* — con **24.931 líneas de JavaScript y un motor funcionando.** ⚠️ **Es la portada pública de un portafolio público** |
| 80 | ⚠️ **297 LÍNEAS `⛔` EN 37 SCRIPTS QUE SALEN EN VERDE**, frente a 257 comprobaciones reales. ⭐ **Hay más `⛔` que no paran nada que guardianes que paran algo.** ⚠️ **Y el número hay que citarlo con lo que significa:** *37 scripts no se pueden leer por su código de salida*, **no «297 fallos»** — el mismo símbolo rotula prosa, controles negativos y fallos. El recuento estático deja el residuo real en **6 líneas** |
| 81 | ⭐⭐ **EL CENSO DE LA PROPIA AUDITORÍA CONTABA `require()` ESCRITOS DENTRO DE COMENTARIOS** — y su v2 los seguía contando **dentro de cadenas**. ⭐ **A la v2 la tumbó su propio control: 2 de 5 casos en rojo.** *El instrumento que iba a medir el código no sabía leer código* |
| 82 | ⭐⭐⭐ **UNA PRECARGA QUE ENVOLVIÓ UNA COPIA DEL MÓDULO QUE NADIE USABA.** Requirió `f:/…/portales.js` y el script requiere `F:\…\portales.js`: **dos entradas distintas en la caché de módulos de Node por la caja de una letra.** ⭐ Lo cazó **su propio contador diciendo «interceptado 0 veces»**. *Es el nº64 repetido por el ejecutor, hoy, sabiéndoselo* |
| 83 | ⚠️ **`CENTINELA = 9999` MIENTRAS EL CENTINELA ES `99999`.** El nombre dice «el valor centinela» y el valor es un listón por debajo; toda la documentación —y el comentario tres líneas más arriba— dice 99999. **`A.exige(maxN < P.CENTINELA)` compara contra el número equivocado.** ⭐ Hoy no muerde **y está medido**: cero portales caen en la franja |
| 84 | ⭐⭐ **UN VEREDICTO QUE ERAN CINCO CADENAS LITERALES.** `orden-numeros.js` **corre los controles arriba y luego los re-declara como texto fijo** en la sección «LO QUE NO HACE», que es justo la que lee un humano. **Si un control cambiara de resultado, el resumen seguiría diciendo lo mismo** |
| 85 | ⚠️ **UN CENSO QUE LLAMÓ «AFIRMACIÓN» AL RESIDUO.** El v1 del bloque B clasificó **10.192 de 19.906** tokens como afirmación **porque era la clase de lo que no encajaba en las otras siete**. ⭐ Lo tumbó **una muestra sistemática de 32 filas**: casi todas eran celdas de tablas de resultado. *Un denominador inflado ×5 que se habría publicado como cobertura* |
| 86 | ⚠️ **CINCO «EL DOCUMENTO NO LO CONTIENE» QUE ERAN DEL INSTRUMENTO.** `(4562).toLocaleString('es-ES')` devuelve **`4562` sin punto** —`Intl` **no agrupa cuatro cifras**— y los informes escriben `4.562`. ⭐⭐ Acertaba en **20 de 26**: todos los de cinco y seis cifras. ⇒ *cuando se busca un dato «como se escribe», hay que buscarlo como lo escribe QUIEN LO ESCRIBIÓ* |
| 87 | ⭐⭐⭐ **UNA CONTRAPRUEBA QUE IBA A FIRMAR UN «26 DE 26» CON EL ROJO NUNCA VISTO.** Cazaba **1 rojo de 6** — y **el método estaba bien**: la rotura sustituía **solo la primera aparición** del número, y en estos informes el mismo dato sale tres veces. ⛔⛔ **La columna VERDE salía impecable mientras el fallo estaba vivo**: es la séptima forma de mentir. ⭐ **Lo paró la costura del encargo, no el criterio del auditor** |
| 88 | ⛔⛔ **UNA COSECHA QUE SE TRAGÓ LOS NÚMEROS QUE LAS CONTRAPRUEBAS ROMPEN A PROPÓSITO.** Al ejecutar los 66 scripts para saber qué imprime el repositorio, entraron al diccionario los valores rotos adrede — *«mapa.grises: se publicó 11.168 y ahora sale 0»* — y el script firmaba **`✅ sin fallos, código 0`**. ⭐⭐⭐ **El productor más fiable del proyecto alimentando basura**, y todos sus contadores en verde |
| 89 | ⛔⛔⛔ **Y EL ARREGLO HIZO CIEN VECES MÁS DAÑO QUE EL VENENO — Y EL DAÑO IBA A PUBLICARSE COMO HALLAZGO.** El parche cortaba *«desde que la salida anuncia una contraprueba»*, **y en este proyecto la contraprueba va DELANTE**: empezaba en la línea 1 de tres productores. **Medido así, el veneno costaba 108 afirmaciones; el daño real era 1.** Las otras **107 las produjo el parche** |
| 90 | ⚠️ **LA CLASE «CITA DE FUENTE AJENA» ACERTABA 5 DE 14.** Saltaba si la línea nombraba OSM o el WFS cerca del número — pero ⭐ **en este proyecto OSM es el OBJETO de casi toda medición, no la fuente de la cifra.** Medía el vocabulario de la frase, no la naturaleza del número: **el censo v1 otra vez.** Retirada entera |
| 91 | ⚠️ **LA CLASE «FOTO» ACERTÓ 1 DE 10 Y SE DECLARÓ FALLIDA, no arreglada.** Tres versiones, tres muestras, tres suspensos: *«paso de peatones»* casa con *«pasó de»*, *«mucho antes»* es espacial y *«Caduca 05/10/2026»* mete el `05` y el `10` como cifras caducadas. ⭐ **Se publica con tamaño 1 y todo lo demás vuelve a `?`** |
| 92 | ⛔⛔ **LA CLASE «DESCRIBE» DABA 32 Y ERAN CERO.** Leídas 15 a mano: **20 de las 32 eran mediciones** del 2 de agosto y el resto reglas propuestas o el índice del documento. ⭐⭐⭐ **Y la ley 35 lo había predicho por escrito ANTES de mirar:** *«en castellano una regla PROPUESTA se escribe en presente de indicativo igual que una implementada»*. **El modo verbal no separa lo propuesto de lo implementado** |
| 93 | ⚠️ **UN CLASIFICADOR QUE EXIGÍA VERBO CONJUGADO Y NO VEÍA SU PROPIA SEMILLA.** La v1 no encontraba §P6.2 porque esa línea es **un sintagma nominal** *(«fichero versionado en el repositorio, leído por el proceso en cada regeneración»)*. ⭐ **Un diseño enuncia sus reglas sin conjugar nada** — y eso ya era un dato del bloque |
| 94 | ⚠️ **EL POSITIVO DE CONTROL SALTABA JUNTO AL GUARDIÁN QUE VIGILABA.** Al provocarle el rojo, el control se caía con él **porque contaba «los portales por debajo del techo» — la variable misma que se estaba probando.** ⭐ *Un control que depende de lo que controla no es un control* |
| 95 | ⛔⛔ **UN GUARDIÁN ESCRITO SOBRE LA FRASE QUE EL PROPIO SCRIPT ACABA DE CONSTRUIR.** `A.exige(FRASE.includes(razon))` **pasa siempre**: es el nº63 exacto. ⭐ Se cazó y se tiró **antes de commitear**, y en su sitio se escribió **por qué no hay guardián** — *lo que protege esa línea es que ya no queda ningún número que escribir a mano* |
| 96 | ⭐⭐ **UNA SALIDA CAPTURADA CON `2>&1` NO ES DETERMINISTA.** El banner `⚑` va por **stderr** y el resto por **stdout**: el orden en que se entrelazan **depende del buffering, no del programa** ⇒ dos ejecuciones idénticas dan ficheros distintos y un `diff` los cuenta como cambios. ⛔⛔ **Iba a declarar FALLADA la predicción de T1 y a parar la tanda.** ⭐⭐ Y lo que lo disfrazó: **dos aciertos de tres hicieron que el tercero pareciera un hallazgo** en vez de un fallo del comparador |
| 97 | ⚠️ **UN NÚMERO DERIVADO SE INTERPOLÓ Y PARTIÓ EL PÁRRAFO EN DOS VOCES.** Interpolar la resta de dos porcentajes del alcance dejó *«~11 puntos arriba»* junto a *«~10 puntos abajo»*, porque la frase de cierre estaba **fuera** de alcance. ⭐ **Aritméticamente el ~11 era mejor y aun así se revirtió**, con el porqué escrito al lado |
| 98 | ⛔⛔ **UN DETECTOR DE HERMANOS QUE EXIGÍA `%` O `×` — Y SE DEJÓ DOS EN EL FICHERO QUE ESTABA ARREGLANDO.** `214 casos` y `~10 puntos` son resultados medidos igual y no llevan ninguno de los dos símbolos. ⇒ **El «43 hermanos» publicado NO es un recuento: es un SUELO**, y no se declaró como tal. ⭐⭐⭐ **Y su control de semilla no lo cazó porque comprobaba que el detector encontrase el hermano YA CONOCIDO** |
| 99 | ⛔⛔⛔ **Y UNO DE ESTA CONVERSACIÓN, QUE ES EL MISMO ANIMAL:** los encargos a Claude Code llevaban escritas **las siete rutas «idénticas al milímetro»** como costura de parada dura — **con `523,4` en la nº6, valor que la tanda 33 sustituyó por `520,2`**, y con `3.086,9` en la nº1, **que ya no devuelve metros porque va en sugerencia**. ⭐ **Cinco encargos seguidos.** No mordió porque el ejecutor comparaba contra su propia línea base ⇒ **la costura escrita no era la que se estaba comprobando.** *Siete números a mano, en un texto que se lee como autoridad, sin congelar y sin salir del estado* |
| 100 | ⛔⛔⛔ **EL VERIFICADOR DE DATOS NACIÓ CON DIEZ DE DOCE HUELLAS INVENTADAS.** Se escribieron truncadas a 16 caracteres y **el resto se rellenó a mano** ⇒ **habrían dado `OTRO` sobre datos correctos.** ⭐ Es el **rojo falso que no caza nadie** (ley 91) **dentro del instrumento diseñado para ser de fiar** |
| 101 | ⛔⛔ **UNA LISTA ESCRITA A MANO QUE EL CÓDIGO SABÍA CALCULAR, Y NACIÓ MAL.** El campo `quien:` de `verificar-datos.js` daba **2 de 4 consumidores equivocados**. ⭐⭐ **Y las tres pruebas del comparador salían en verde con razón: nada de lo que ese fichero comprueba toca el texto descriptivo.** ⚠️ **Los otros diez estaban bien, así que la lista se leía como derivada del código** |
| 102 | ⛔⛔⛔ **`B·V2` ERA FALSO — SEGUNDO ROJO FALSO DE LA AUDITORÍA.** Confundió `movilidad:MU1_jerarquia_viaria` con `idezar_base:JERARQUIA_VIARIA`: **mismo nombre humano, espacio de nombres distinto.** ⭐⭐ **Las cuatro piezas eran ciertas por separado; lo falso era lo que las unía** — *«la capa nombrada es ésa»*, que no se comprobó contra nada. ⚠️ **Y la trampa: MU1 y RoadLink comparten el 3.644 porque RoadLink es su edición INSPIRE**, así que el número que delataba la confusión era el que la escondía |
| 103 | ⚠️ **«~120 MB» EN LA PORTADA QUE PROMETE QUE NO HAY NÚMEROS A MANO.** Medido: **135,1 MB**, y el mayor **62,4 MB**, no 37. ⭐ Y al medirlo salió lo que nadie sabía: **ese fichero de 62,4 MB no lo lee ningún script** — el 46 % del peso. *El `~` no es licencia para no medir* |
| 104 | ⛔⛔⛔ **UN COMANDO DE EJEMPLO PUBLICADO EN LA PORTADA Y NUNCA EJECUTADO — Y NO FUNCIONA.** *«El primer comando que copia quien llega.»* ⭐⭐ Se verificaron **las 30 cifras** y se dieron por buenos los `bash` que las rodean: **la mitad de la promesa que no se lee como promesa.** ⚠️ Y se eligió *«Plaza del Pilar»* **porque hacía bonito**, dentro de un documento cuyo método es no fiarse de lo que parece razonable |
| 105 | ⛔⛔ **UNA VALLA DE CÓDIGO HUÉRFANA DEJÓ MEDIO README RENDERIZÁNDOSE COMO CÓDIGO.** ⭐⭐⭐ **Tres pasadas de verificación sobre ese fichero la misma tarde —cifras, comandos, promesas— y NINGUNA lo miró RENDERIZADO.** ⚠️ En texto plano no se ve: las vallas están a 45 líneas y cada una, por separado, parece correcta. **Lo cazó el editor, no una comprobación** |
| 106 | ⛔⛔ **UN BARRIDO DE HERMANOS QUE NO ENCONTRÓ SU PROPIA SEMILLA — Y HABRÍA PUBLICADO 61 PARECIENDO LIMPIO.** `probar-paradas.js:129` **no es un `A.exige`**: es una variable con `.includes()` cuyo veredicto se imprime **veinte líneas más abajo, en un ternario anidado**, y un barrido por línea no lo ve. ⭐ **Lo cazó la ley 98, escrita por él mismo el día anterior**: se ensanchó hasta que las dos semillas salieron ⇒ el universo real son **464 veredictos**, no 61 |
| 107 | ⛔⛔⛔ **UN MARCADOR QUE BUSCABA LA CIFRA Y HABRÍA ESCRITO UNA AFIRMACIÓN FALSA DENTRO DE UN REGISTRO HISTÓRICO.** El `182` de `H1-ACERA-EQUIVOCADA:324` es **un listón p99 en metros**; los `412` de `H1-CIERRE` son **«412× el azar»**. ⭐ **Cazado mirando las líneas ANTES de escribir**, no después. ⚠️ **Y el mismo barrido llevaba dos tandas siendo aceptable**: auditando solo proponía; marcando, escribe |
| 108 | ⛔⛔⛔ **UN GUARDIÁN COLOCADO DETRÁS DE QUIEN REPARA EL DEFECTO.** `V3` vigilaba `tools/rutas-visor.js`: **a mano daba rojo real, en la batería salía verde** — porque `--todo` corre `exportar-rutas.js` **en el puesto 21** y el guardián **en el 69**. ⚠️ **Y el visor está en `.gitignore:318`, así que la escritura ni aparecía en `git status`.** ⭐ **El verde no era falso: era TARDÍO** |
| 109 | ⚠️ **UNA GUARDA CONTRA FALSOS POSITIVOS QUE PERDÍA DOS APARICIONES DE SEIS.** La cola exigía que tras la `h` de `km/h` no hubiera coma — **y las dos perdidas van seguidas de coma.** ⭐⭐ **Lo cazó que el «seis» del encargo VINIERA DE FUERA del instrumento**: su propio recuento decía cinco y parecía limpio |
| 110 | ⛔⛔⛔ **EL LATIDO RECITA EL VALOR PUBLICADO EN VEZ DE LEERLO.** `latido.js` guarda `publicado: '412'` **como literal copiado a mano y NUNCA abre un documento**: solo ejecuta productores. ⇒ **Republicar escribe 438 en un documento nuevo y ese documento no le llega.** ⭐⭐⭐ **Es la ley 105 incumplida DENTRO del instrumento construido para aplicarla**, y solo se ve **cuando llega la primera republicación** |
| 111 | ⛔⛔ **EL PUNTERO MANDABA A UN DOCUMENTO QUE NO EXISTE Y SALÍA VERDE ANTES Y DESPUÉS.** Al provocar el rojo se apuntó a `H1-NO-EXISTE-JAMAS.md` y **la cabecera pública lo publicó tan tranquila**. ⭐ *El remedio contra las referencias que nadie sigue estaba escribiendo referencias que nadie seguía.* Cerrado con `D4`, rojo visto |
| 112 | ⛔⛔⛔ **UN PARÉNTESIS DETRÁS DEL NÚMERO CAMBIA EL DESTINO EN SILENCIO.** `partir()` exige el número al final: con `«Calle Padre Arrupe 1 (Hospital…)»` **el buscador no ve número**, cae en `numero-aproximado` **y elige el portal central de la vía**. ⭐⭐ **No da error ni aviso: devuelve una ruta con buena pinta a OTRO sitio** —80,5 m de diferencia y 79 m más lejos del destino real— **y solo se ve mirando la columna `estado`** |
| 113 | ⛔⛔⛔ **EL LITERAL `7` DE `modelo-rutas.js` ERA EL FALLO QUE LA TANDA 2·bis CREYÓ CERRADO.** `const ESPERADOS = 7 - Object.keys(A_SUGERENCIA).length` **derivaba una mitad y dejaba la otra a mano**. Se arreglaron `donde-falta.js` y `pasos.js` **y quedaba un tercero — en el fichero que vigila las rutas.** ⭐⭐⭐ **Y solo apareció cuando el mundo cambió: al entrar la ruta nº8** |
| 114 | ⛔⛔ **UN REPARTO PUBLICADO MAL, Y LA SUMA LO TAPÓ.** Los 120 pasos se repartieron `83 + 9 + 28` y **el total cuadraba**. ⭐⭐⭐ *El número que se comprueba es el correcto: un reparto mal con el total bien es de lo más difícil de ver, porque el guardián mira la suma* |
| 115 | ⛔⛔⛔ **Y DOS DE ESTA CONVERSACIÓN, LOS DOS POR NO MEDIR:** dijo **«~35 min»** de la batería **en cinco encargos seguidos** —cronometrada, son **17m29s**: se estimó una vez y se repitió veinte— y pidió publicar **«dos de los ONCE hallazgos»** sin contarlos. ⭐ **El ejecutor fue a contar y el número cambia con la expresión regular** (8 · 10 · 13) ⇒ **enumeró en vez de contar.** *Ley 116 contra quien escribió el encargo* |
| | **⬇ H2 · TANDAS 1 Y 2 (10/08) — ONCE MÁS, Y NUEVE SON DE ESTA CONVERSACIÓN** ⬇ | |
| 116 | ⭐⭐⭐ **`git check-ignore -v` INVIERTE SU VEREDICTO.** Sin `-v` el código de salida es el veredicto; **con `-v`, `exit 0` significa «ha casado alguna regla» — incluida una negación `!`**, que es la que dice *«esto NO se ignora»*. La salida verbosa es honesta; el código de salida no, **y el código es lo que se automatiza.** ⛔ **Y el instrumento lo escribió esta conversación, como positivo de control sobre un fichero de CLAVES.** El caso que había delante era del lado que no falla |
| 117 | ⭐⭐ **UNA CARACTERIZACIÓN NO MEDIDA VIAJÓ DE UN ENCARGO A LA BITÁCORA COMO MEDIDA PROPIA.** Esta conversación escribió *«el `.gitignore` de 004 es deny-all con allowlist»* de memoria, arrastrado de 003. **Es falso**: es una lista de exclusiones normal con dos deny-all acotados (`data/exploracion/*` y las credenciales), y los 25 `!` son sus excepciones. El ejecutor lo copió a la bitácora nº177 **con la misma cara que una medida suya.** *Es el nº99 otra vez, tres días después* |
| 118 | ⭐⭐⭐ **UNA RUTA DE FICHERO CITADA DE MEMORIA, CON NOMBRE PLAUSIBLE.** `06-fase7b-desvios.md` no existe; es `...ruta-real.md`. **El contenido citado era correcto** —salió de un `grep` que sí devuelve la ruta buena— y el nombre se reconstruyó después. ⚠️ **Encaja en la serie de la carpeta** (`02-fase4-color-y-desvios`, `03-fase5-desvios`): un lector que no abra el fichero no puede sospechar. Al pasar el `ls` a las ocho rutas salieron **cinco números de línea más y un recuento**. ⭐ **El reparto dice de qué va: el nombre falló UNA vez y las coordenadas CINCO** |
| 119 | ⛔⛔ **UN CONTROL CUYO VERDE ERA IMPOSIBLE POR CONSTRUCCIÓN.** El saneamiento exigía 0 apariciones de `Decidida, no integrada` — **pero un documento que registra sus correcciones contiene por fuerza el texto retirado entre comillas.** Dio 2, y las dos eran citas. *Ley 136 mordiendo veinte minutos después de escribirse en este documento* |
| 120 | ⭐⭐ **LA LÍNEA BASE DEL SANEAMIENTO SE EJECUTÓ DESPUÉS DEL CAMBIO QUE IBA A PROTEGER.** Pedía ver 2.697 líneas antes de sustituir; cuando se corrió ya había 2.819. **No se puede atestiguar a posteriori** — se reconstruyó por huella git (`0a3423d…` y `76391073…`, las dos cuadraron) |
| 121 | ⭐ **`Measure-Object -Line` NO CUENTA LAS CADENAS VACÍAS.** Dio **2.273** donde `(Get-Content).Count` daba **2.697**: la diferencia son las **424 líneas en blanco**. **Dos instrumentos contestando «¿cuántas líneas?» en la misma sesión, con dos respuestas y las dos correctas para su pregunta** |
| 122 | **`[System.IO.File]` NO COMPARTE EL DIRECTORIO ACTUAL DE PowerShell.** Buscó `.env.local` en `C:\Users\Ordenador` después de un `cd` a `F:`. *De propina, un resultado bueno: no hay ningún `.env.local` suelto en la carpeta de usuario* |
| 123 | ⭐ **`Read-Host -AsSecureString` NO ADMITE PEGAR** en la consola de Windows: registró **un carácter**. Se pidió pegar con un método que no deja pegar. ⭐⭐ **Lo cazó el control de longitud —esperaba 36, salió 1—**, que estaba puesto justo para eso |
| 124 | ⭐⭐ **ESTA CONVERSACIÓN AFIRMÓ QUE `get_stops_list` DEVUELVE LA TRAZA REAL DE HOY.** Medio falso, y la mitad falsa era la que importaba: **refleja los desvíos de obras y NO las prolongaciones estacionales** — 003 lo midió con la línea 44, que tenía **cero viajes ese día** y aun así recibía el trazado completo. **Se repitió como hecho una frase propia de una conversación de julio contra un documento medido** |
| 125 | ⭐ **CONTAR `.ts` Y LLAMARLO «FICHEROS TYPESCRIPT».** 167 era correcto; el sustantivo no: faltaban 32 `.tsx`. **199.** El ejecutor no pudo reproducir el 167 con cuatro filtros y lo dejó en `CAUSA NO CONFIRMADA` — *el número era bueno y la etiqueta lo hacía irreproducible* |
| 126 | ⛔ **UN FALSO ROJO CONTRA EL EJECUTOR: `Test-Path` DIO `False` Y SE LEYÓ COMO «NUNCA EXISTIÓ».** Él había creado `.env.example`, medido y borrado. **Se midió después del hecho y se concluyó sobre el antes** — la misma forma que el nº120, el mismo día |
| | **⬇ H2 · TANDA 3 (10/08) — CUATRO MÁS** ⬇ | |
| 127 | ⛔⛔⛔ **EL POSITIVO DE CONTROL ESTABA VERDE Y ERA CORRECTO — LO QUE FALLÓ FUE LEERLO.** El `grep` de `transbordo` **sí devolvió `engine/correspondencias.ts`**; el informe de H2·2 lo clasificó como interfaz sin abrirlo y publicó *«003 no tiene NADA»*. **Y este documento lo destiló ayer a dos sitios.** ⇒ ⭐⭐ **Un positivo de control demuestra que el instrumento VE; no demuestra que tú hayas MIRADO** |
| 128 | ⛔⛔⛔ **UNA COMPROBACIÓN QUE NO PODÍA FALLAR, PEDIDA POR ESTA CONVERSACIÓN.** El encargo de H2·3 pedía verificar si `PA00617` aparece en algún viaje **para demostrar por qué falta del corredor**. Pero `stop_times` referencia `stop_id`, y **el `stop_id` de `PA00617` no existe** ⇒ **el cero estaba garantizado y no distingue nada** (ley 96). ⚠️ **Y la pregunta iba además a la línea equivocada:** quien serviría el parque es la `104/LAN`, que es zombi. *Hermano del nº119, con el signo cambiado: aquel no podía ponerse verde; éste no podía ponerse rojo* |
| 129 | ⭐⭐⭐ **EL DOCUMENTO DE 003 DESCRIBE DE MENOS, Y JUSTO EN LA VALLA.** Publica `poste = int(stop_code[2:])`; el código es `/^PA(\d{5})$/`, **anclada y exigiendo cinco dígitos**. Los 50 postes del tranvía llevan **cuatro** cifras ⇒ la fórmula publicada da **`1` para tres paradas distintas, sin un solo error**. ⛔ **Y la ruta del documento también es falsa**: no existe `sources/avanza-zaragoza/`; vive en `src/sources/gtfs-nap/identity.ts` |
| 130 | ⛔ **EL POSITIVO DE CONTROL DE LOS TERMINALES SALIÓ ROJO, Y ERA VERDAD.** **21 de 74 sentidos** dan ≥2 terminales, incluidas líneas que nadie había nombrado ⇒ la consulta **no distinguía un segundo destino de una cola de final de servicio**. ⭐ **El ejecutor paró el veredicto ahí**, como manda la costura, y lo separó después por cuota. ⚠️ *Umbral elegido DESPUÉS de ver los datos, declarado: lo sostiene el salto 32 % → 7 %, no el corte* |
| | **⬇ H2a · TANDA 5 (10/08) — TRES MÁS** ⬇ | |
| 131 | ⭐⭐⭐ **SE MIDIERON LAS COMPONENTES SOBRE UN GRAFO QUE EL MOTOR NO USA** (`sinCondicionales=true`) **Y DIO EL MISMO RESULTADO** — las mismas tres paradas fuera de la mayor. ⛔⛔ **Ninguna salida podía delatarlo: el número correcto tapaba el universo equivocado.** Se cazó **porque un número de al lado no cuadraba** ⇒ *el acierto es el peor camuflaje que hay* |
| 132 | ⛔⛔ **LA LÍNEA BASE SE LANZÓ Y SE EMPEZÓ A ESCRIBIR EN `docs/` A LA VEZ.** El razonamiento era *«el universo de la batería es `src/`, escribir en `docs/` es inocuo»* — **y es falso: el puntero lee `docs/`.** La batería de arranque salió roja **y se publicó declarada como inservible**, con la comparación válida hecha contra el cierre de la tanda 4. ⭐ *Hermano del nº120: la línea base vuelve a fallar por el mismo sitio, y esta vez por un razonamiento explícito y equivocado sobre su propio alcance* |
| 133 | ⭐ **UN `⛔` SIN `alarma` EN SU PROPIO SCRIPT — el fallo que fundó `alarma.js`** — y, el mismo día, **publicar «solo un fichero» sin pasar el `grep` cuatro horas después de escribir la ley 140 que lo prohíbe.** ⇒ *La lección de la tanda N no entra sola en la tanda N+1 ni siquiera cuando la escribiste tú* |
| | **⬇ H2a · TANDA 6 Y LA TANDA CORTA (10/08) — TRES MÁS, LAS TRES DE ESTA CONVERSACIÓN** ⬇ | |
| 134 | ✅ **ARREGLADO el 11/08 (tanda de arreglo 8) — se marca, no se reescribe.** ⛔⛔⛔ **`insertar` COBRA 32,5 m POR 11,9 m REALES EN EL CENTRO DE ZARAGOZA.** Enlaza cada nodo temporal **solo con los extremos de su arista, nunca entre sí** (`src/grafo.js:211-213`). **233.767 pares de direcciones reales** lo padecen, p50 34,8 m. ⛔ **Y lo peor no es el fallo: es que H1 se cerró con auditoría de cuatro bloques y siete tandas de arreglo encima sin verlo, porque LAS DIEZ RUTAS DE CORDURA VAN DE UN PORTAL A OTRO DISTANTE.** *El universo de la costura excluía por construcción la clase de trayecto más común que existe* |
| 135 | ⛔⛔ **UN ENCARGO PIDIÓ UN CERO SIN SU POSITIVO DE CONTROL.** Esta conversación escribió *«las rutas largas son el control»* — **y son un control NEGATIVO: demuestran que el instrumento no dispara de más, no que sepa decir que SÍ.** ⭐ **Lo cazó el ejecutor y montó el positivo que faltaba**: 233.767 pares que sí comparten arista, 6 de 6. *Ley 4, incumplida por quien la tiene escrita en este documento* |
| 136 | ⛔⛔ **SE ORDENÓ HACER ALGO QUE YA ESTABA HECHO, SOBRE UN DIAGNÓSTICO FALSO.** El encargo de H2·6 mandaba sacar la bitácora del universo del puntero: **ya estaba fuera desde la tanda 4** (`superados.js:342`), **y sacarla no habría arreglado el choque** — la causa es que un documento normal cita el ordinal de una entrada. ⚠️ **Se leyó del resumen del ejecutor sin ir al código, y se le hizo decidir a Antonio una decisión ya tomada.** *El nº99 otra vez* |
| | **⬇ H2a · TANDA 7 · PUERTA 1 (12/08) — DOS MÁS** ⬇ | |
| 137 | ⛔⛔⛔ **`ACERA` SIGNIFICABA «POR ARISTAS DE TIPO ACERA» Y SE LEÍA COMO «POR LA ACERA CORRECTA».** Publicado como 20,7 % durante cuatro tandas. Medido: **28 de esos 67 enlaces (41,8 %) son NO DECIDIBLES**, y **de cada cien aristas del camino se conoce el lado de siete.** ⇒ *La etiqueta no mentía en su definición: mentía en su lectura, y nadie lee las definiciones* |
| 138 | ⛔⛔ **UN VEREDICTO ESTUVO A PUNTO DE PUBLICARSE CON UN NOMBRE QUE ACUSABA.** Se llamaba `CRUZA CALLADO`. **Doblar una esquina cambia de acera sin ningún paso y es perfectamente legítimo** ⇒ el nombre habría metido una acusación falsa en 2.538 enlaces. Renombrado a `CAMBIA SIN PASO` antes de salir. ⭐ *Lo cazó su propio autor aplicándose la ley 145 a un nombre propio* |
| | **⬇ H2a · TANDA 7 · PUERTA 2 (11/08) — TRES MÁS** ⬇ | |
| 139 | ⛔⛔⛔ **UNA FÓRMULA CAMBIÓ DE POBLACIÓN Y SIGUIÓ CALCULANDO.** El rodeo nació sobre **portales**, donde el hueco al grafo es 5,3 m. Al mudarlo a **paradas de bus** siguió dando número **y empezó a mentir**: 33 enlaces «más cortos que su propia recta», mínimo **0,20×**. **El grafo no estaba roto** — la ruta iba de enganche a enganche y la recta de parada a parada: **cuatro puntos, no dos.** ⇒ *Una fórmula no declara su población, así que sobrevive a la mudanza en silencio* |
| 140 | ⛔ **UNA TOLERANCIA RELATIVA PIDIÓ MÁS PRECISIÓN DE LA QUE EL DATO TIENE.** Un umbral de `0,999` **exige 1,3 cm** a un dato redondeado a **0,1 m** por `Math.round(total*10)/10`. Dos falsos rojos: `13,0` publicado contra `13,044` real, **cuatro centímetros** |
| 141 | ⛔⛔ **UNA PREDICCIÓN CAYÓ DENTRO DE LA BANDA CON EL RAZONAMIENTO AL REVÉS.** Se predijo `sin-eje` **por debajo** del 21,3 % *«porque el tranvía empuja hacia el eje»* y salió **por encima** (23,2 %), dentro de la banda igualmente. ⭐ **Lo declaró su propio autor: acertar la banda con la razón equivocada no es acertar** ⇒ *una predicción se evalúa por su MECANISMO, no solo por su intervalo* |
| | **⬇ H2a · TANDA 7 · PUERTA 3 (11/08) — TRES MÁS** ⬇ | |
| 142 | ⛔⛔ **UN GUARDIÁN DE TEXTO NACIÓ SIN SERVIR PARA NADA Y SALIÓ VERDE A LA PRIMERA.** El patrón de L6 era `/\bel m[áa]s r[áa]pido\b/` y la frase real —*«el transbordo más rápido»*— **lleva una palabra en medio: no la cazaba.** ⭐ **Lo destapó su propia provocación** (ley 156), no una revisión. ⇒ *El patrón estaba pegado a `el` **porque así la escribió en su cabeza quien lo redactó**: un guardián de texto escrito desde la frase que se te ocurre vigila TU frase, no la prohibición* |
| 143 | ✅ **ARREGLADO el 11/08 (tanda 9), 55 días antes de mentir — se marca, no se reescribe.** ⛔⛔⛔ **UN GUARDIÁN DE FORMA SIN GUARDIÁN DE VIGENCIA: EL 06/10/2026 TODO SEGUIRÁ EN VERDE.** El `A.exige` comprueba que `fin === '20261005'` **viaje dentro del artefacto**, no que **la fecha no haya pasado**. ⭐⭐⭐ **Es el PRIMERO de los 143 que se cataloga ANTES de mentir** — escrito, fechado y con 55 días de aviso. *Es la forma exacta del fallo que fundó el proyecto: un instrumento que sigue dando verde después de que el mundo cambie* |
| 144 | ⛔ **UNA SECCIÓN DE LICENCIAS CON UN RECUENTO EN PROSA, MINTIENDO POR SEGUNDA VEZ.** Decía *«los datos tienen DOS licencias»* y **desde el 10/08 son TRES**: faltaban «Powered by MITRAMS», la cita al Ministerio y declarar el dato como **procesado, no bruto**. ⚠️ **La primera vez esa misma sección dijo *«hoy el repositorio no contiene ningún dato integrado»* con 46.150 portales dentro** ⇒ *un recuento escrito en prosa es un contador a mano en el sitio donde más caro sale equivocarse* |
| | **⬇ H2a · TANDA 9 (11/08) — UNO MÁS** ⬇ | |
| 145 | ⛔⛔ **UNA COLUMNA DE RECUENTOS CON UNA FILA QUE MEDÍA OTRA POBLACIÓN.** `docs/RECONOCIMIENTO-003-TRANSPORTE.md:105` publicó **52 rutas** donde el fichero tiene **53**: era **el recuento del BUS puesto en la columna del TOTAL**, y ⭐ *el tranvía se quedó fuera de su propio recuento*. **Las otras siete filas de la tabla eran correctas y lo arroparon.** ⛔⛔ **Y el número bueno llevaba UN MES publicado en otro documento del mismo proyecto** (`DISENO-H2A-RED.md:203`) ⇒ ***nada compara dos documentos entre sí***. Lo cazó un comparador de feeds escrito para otra cosa, **el día que el fichero no había cambiado** |

**Regla del proyecto, heredada de 003:** *sospechar del instrumento es verificar quién de los dos
miente.*

---

## 8 · Leyes nuevas que salen de este proyecto

Van a la guía maestra. Las tres primeras son las que más caro han salido.

1. ⭐⭐ **UNA REGLA VERIFICADA AL 100 % ARRASTRA SU DENOMINADOR.** Al cambiar de proyecto cambia el
   universo. El porcentaje viaja entre proyectos; el denominador no.
2. ⭐⭐ **UN NÚMERO CORRECTO PUEDE SOSTENER UNA CONCLUSIÓN FALSA SI MIDE LA MAGNITUD EQUIVOCADA** —
   y no hay forma de detectarlo mirando el número. *(Reincidencia: la ley ya existía como nº19 de
   ZetaBus y no entró en el prompt siguiente. Ley 7 de Linaje en directo.)*
3. ⭐⭐ **ENUMERAR NO ES VERIFICAR.** Una capa listada en una tabla no está examinada, y una tabla
   larga da una sensación de cobertura que no tiene.
4. ⭐ **CERO ES INDISTINGUIBLE DE "NO HE MEDIDO NADA"** — y en un barrido de seguridad es la
   respuesta que más ganas dan de firmar.
5. ⭐ **EL ASPECTO DE RIGOR DICE CÓMO SE DISEÑÓ, NO SI SE RELLENÓ BIEN.** Vocabulario controlado,
   URI, estándar: son señales de intención, no de calidad del dato.
6. **CUANDO UNA FUENTE OFRECE VARIOS CAMPOS PARA EL MISMO HECHO, COMPÁRALOS ENTRE SÍ.** La
   contradicción es gratis de detectar el día que miras el registro completo y carísima el día que
   ya construiste encima.
7. **UNA FECHA BIEN FORMADA NO ES UNA FECHA CORRECTA.** `Z` no significa "formato ISO": significa
   "esta hora es UTC", y se contrasta contra la cabecera `Date` de la propia respuesta, que viene
   gratis y nadie mira.
8. **EL ENCODING SE DIAGNOSTICA EN EL FICHERO, NUNCA EN LA PANTALLA.**
9. ⭐ **LA PRUEBA QUE COMPARTE ESTADO CON LO PROBADO NO PRUEBA NADA.**
10. **PUBLICADO ≠ DESCARGABLE ≠ REUTILIZABLE.** Tres preguntas distintas que hay que hacer por
    separado. Ver las calles en un visor no es tenerlas: WMS devuelve una imagen, WFS la geometría.
11. ⭐ **EDITAR LA EVIDENCIA LA DESTRUYE.** Un crudo redactado ya no es la respuesta del servidor:
    es *nuestra versión* de la respuesta, y entonces no sirve para lo único que justifica
    publicarlo.
12. ⭐ **UNA EDICIÓN INVISIBLE EN UN DOCUMENTO QUE PRESUME DE HONESTIDAD ES PEOR QUE LO QUE SE
    QUERÍA TAPAR.** *(De ahí la nota al pie en los dos informes redactados, cada una con su propio
    número.)*
13. **LA LEY DEL TRASPLANTE:** se copian datos y decisiones; nunca maquinaria. Un órgano se
    trasplanta; la máquina que lo mantenía vivo, no.
14. ⭐ **A LA BITÁCORA VAN LOS INSTRUMENTOS QUE MIENTEN, NO LOS QUE FALLAN A LA CARA.** Un comando
    que revienta con su mensaje de error se anuncia solo: no hubo estado incorrecto, no hubo verde
    falso, no hay nada perecedero que capturar. Anotarlo sería diluir la bitácora — y una bitácora
    diluida es una que nadie lee. *(Criterio propuesto por el ejecutor y aceptado.)*
15. **UN GRAFO NO SE PUBLICA.** La topología no existe en el catálogo de ninguna ciudad porque la
    cartografía municipal se publica para pintar mapas, no para calcular rutas. Buscarla es tirar
    peticiones; construirla es el proyecto.
16. ⭐⭐ **UN NÚMERO QUE CUADRA CON SU VECINO NO ESTÁ VERIFICADO: ESTÁ APUNTALADO.** Tres cifras
    publicadas eran falsas y las tres colaban por venir acompañadas de una correcta. *(Los 106
    cruces junto a 87 pares buenos; los 4 duplicados junto a un 21 que cuadraba.)*
17. ⭐⭐ **UN CONTROL POSITIVO QUE ELIGE QUIEN ESCRIBIÓ EL INSTRUMENTO PRUEBA QUE EL INSTRUMENTO
    HACE LO QUE SU AUTOR CREE** — que es justo lo que no está en duda. Los controles salen de
    casos que aporta quien conoce el terreno, o se eligen **al azar** del propio conjunto. Nunca a
    dedo.
18. ⭐⭐ **UNA REGLA TRASPLANTADA DE UN MUNDO A OTRO NECESITA COMPROBAR QUE EL TERRENO LA
    SOSTIENE.** *La regla de nivel se pensó para una capa sin nodos compartidos; aplicada a OSM —
    donde el nodo ES la topología— se volvió un destructor: 634 uniones reales cortadas para
    evitar 2 errores.*
19. ⭐ **UNA INTERVENCIÓN QUE FUNCIONA NO DEMUESTRA POR QUÉ FUNCIONA.** Si al arreglar algo se
    cambian dos cosas a la vez, el éxito no distingue cuál operaba. *(Y de ahí `CAUSA NO
    CONFIRMADA`: `NO CONSTA` con apellido, para cuando el fallo no se ha reproducido a voluntad.)*
20. ⭐ **UN MENSAJE DE ERROR ES UNA AFIRMACIÓN DEL SERVIDOR SOBRE SÍ MISMO, Y NO ESTÁ VERIFICADA
    POR VENIR DE DENTRO.** *El mismo servidor dio dos explicaciones distintas del mismo hecho.*
21. ⭐ **UNA RÉPLICA ES OTRA FUENTE.** Cuando la instancia principal cae y la petición viaja a un
    espejo, el dato puede tener meses. *El sello de fecha vive tres niveles dentro del JSON y nadie
    lo mira.*
22. ⭐ **EL VALOR DE UNA DIANA ES LO QUE PUEDE REFUTAR, NO LO QUE PUEDE CONFIRMAR.** Una zona que
    solo puede darte la razón no es una prueba: es una ceremonia. *(La Carretera de Huesca se
    eligió como control positivo y fue la que tumbó la regla.)*
23. ⭐ **EL ERROR ACEPTADO A SABIENDAS TIENE QUE SER CONTABLE.** Si no lleva un contador, "lo
    asumimos" es una frase que nadie relee a los tres meses, y el fallo sigue vivo.
24. ⭐⭐⭐ **UN INSTRUMENTO SE VERIFICA POR EJES, NO POR CASOS.** Son nueve, y hay que enumerarlos
    aunque no se puedan medir todos: **posición · vecindad · dirección · identidad ·
    correspondencia · umbral/cola · escala · densidad · agregación.** *Caso real: la contraprueba
    de desplazamiento pasa el eje POSICIÓN y es CIEGA al eje IDENTIDAD — mover 2 km no acerca dos
    homónimos que están a 20.* **Un instrumento que solo pasa un eje no está verificado: está
    verificado en un eje.**
25. ⛔ **UN BARRIDO DE SENSIBILIDAD NO ES UNA CONTRAPRUEBA.** Recorre el parámetro que sospechas y
    certifica el instrumento en el eje equivocado. Peor: **su estabilidad se lee como robustez**
    cuando significa que ese parámetro no es la variable que manda.
26. ⭐⭐ **LA LAXITUD VIVE EN LOS CASI-ACIERTOS, NO EN LOS DISPARATES.** Un control hecho de
    absurdos inventados los rechaza todos y no prueba nada. Los casos difíciles salen de una
    muestra **al azar**, con su semilla declarada.
27. ⭐⭐ **UN UMBRAL HONESTO NO ES UN UMBRAL CORRECTO.** Un percentil deja fuera su complemento
    **por construcción**, y en datos geográficos ese 15 % **no está repartido al azar: son barrios
    enteros**. ⭐ Corolario: **el umbral que sirve para ATRIBUIR no sirve para NEGAR.** Un radio que
    dice *"esto pertenece aquí"* no puede usarse para decir *"aquí no hay nada"*.
28. ⭐⭐ **`NO CONSTA` CUANDO NO SE PUEDE SABER; NO CUANDO NO SE HA MIRADO.** *Un `CAUSA NO
    CONFIRMADA` puesto teniendo el dato en disco no es honestidad: es deuda.*
29. ⭐⭐ **CLASIFICAR ANTES DE CONTAR.** Un número el doble de grande que el publicado parecía un
    hallazgo; clasificado, el **72,3 % era ruido del propio instrumento**. Contar sin clasificar
    convierte el error de medición en descubrimiento.
30. ⭐⭐ **UNA COSTURA NO TIENE QUE ACERTAR PARA SERVIR.** *La que mandaba parar si el número salía
    muy distinto no cazó lo que pretendía — pero metió una PAUSA entre el resultado y su
    publicación, y con eso bastó.* El valor de una costura es el tiempo que compra, no la
    predicción que hace.
31. **UNA COBERTURA SIN LÍNEA BASE NO ES UNA MEDICIÓN.** Ningún porcentaje se publica sin su azar
    al lado.
32. ⭐⭐⭐ **HAY UN DÉCIMO EJE, Y ES EL QUE NINGÚN INSTRUMENTO COMPRUEBA: LA SEMÁNTICA DEL
    CONTENIDO.** *El dato puede ser perfecto en los nueve ejes y significar otra cosa.* Un campo
    `tipo=guardia` impecable que mezcla farmacias abiertas 24 h con refuerzos de horario partido:
    la verdad estaba en una frase en castellano que ningún contador lee.
33. ⭐⭐ **UN CERO NO ES UNA RESPUESTA CUANDO EL CERO ES IMPOSIBLE.** En Zaragoza siempre hay
    farmacias de guardia. ⇒ **El cero se trata como FALLO, no como dato.** Y una clave ausente no
    es una lista vacía: `?.length ?? 0` convierte lo uno en lo otro sin avisar.
34. ⭐ **UNA LÍNEA BASE NO ES OPCIONAL AL INTERROGAR UNA API.** Sin haber visto qué devuelve una
    consulta que SÍ funciona, no se puede interpretar ninguna otra: *"no hay resultados"*, *"no
    entiendo tu petición"* y *"estoy roto"* se parecen todos a un `200` corto.
35. ⭐⭐⭐ **UNA CONTRAPRUEBA QUE PUEDE PASAR POR CONSTRUCCIÓN NO ES UNA CONTRAPRUEBA.** Antes de
    diseñar una comprobación, la pregunta es: *¿puede esto pasar sin que nada funcione?*
36. ⭐⭐⭐ **UN RESULTADO DECEPCIONANTE NO DESPIERTA SOSPECHA; UNO BUENO SÍ** — y ése es justo el
    sesgo peligroso. *Un control positivo de 3 de 10 se lee como "el planarizado falla" y manda a
    depurar el sitio equivocado, cuando el roto era el encuadre del control.*
37. ⭐⭐ **UNA LEY ESCRITA NO PROTEGE SIN UN MECANISMO QUE LA EJECUTE.** *El error de encuadre
    volvió a ocurrir con la ley ya escrita, en la primera tanda de código.* La contención se
    comprueba **en ejecución**, no de palabra.
38. ⭐⭐ **HAY FALLOS QUE NINGÚN CONTADOR VE PORQUE PREGUNTAN POR OTRA COSA.** *Todos los contadores
    del grafo preguntaban por la topología; el fallo estaba en la geometría.* ⇒ **Mirarlo dibujado
    no es un lujo: es otro eje.**
39. ⚠️ **UN GUARDIÁN QUE MODIFICA EL ESTADO QUE VIGILA ESTROPEA LA OPERACIÓN SIGUIENTE AUNQUE
    ACIERTE EN LA SUYA.** ⇒ `git status` después de todo commit rechazado.
40. ⭐⭐⭐ **UN FILTRO ESCRITO ENUMERANDO LOS CASOS QUE APARECIERON NO ES UNA REGLA: ES UNA LISTA.**
    Volverá a fallar con el siguiente valor que salga. **Una regla decide por lo que las cosas
    SIGNIFICAN, no por si están en un `array`.**
41. ⭐⭐ **UN NOMBRE NO IDENTIFICA UN SITIO NI SIQUIERA CUANDO ES EL DE LA CIUDAD.** *Cuatro
    Zaragozas en el planeta metieron 398 ways de Costa Rica y México en la descarga.* ⇒ Todo
    identificador por nombre necesita un **segundo discriminante** (posición, código, extensión).
42. ⭐⭐ **EXPLICAR UN AGUJERO NO ES TAPARLO.** *Un clasificador que etiqueta un barrio incomunicado
    como "artefacto del límite" no lo ha resuelto: lo ha excluido del contador.* La causa de un
    caso no es excusa para no contarlo — **dos ejes, y los dos se publican.**
43. ⭐ **EL SIGNO DEL ERROR ES INFORMACIÓN, Y HAY QUE MIRARLO ANTES DE BUSCAR LA CAUSA.** *"Es el
    redondeo" era plausible para +21 nodos y era falso; para −10 se demostró midiendo las 11
    colisiones.*
44. ⭐⭐⭐ **UN `⛔` IMPRESO NO ES UN FALLO: ES TEXTO.** Si el proceso acaba en 0, el fallo **no
    existe** para nadie que no lea la pantalla entera. ⇒ **Un guardián que avisa y no para es casi
    peor que no tenerlo**, porque el rojo estaba ahí y nadie lo leyó.
45. ⭐⭐⭐ **UNA MAGNITUD DERIVADA ARRASTRA EL ERROR DE LA CONSTANTE CON QUE SE DERIVÓ.** Si esa
    constante no está medida, **no es un dato: es una opinión con unidades.** *(Las bandas de las
    siete rutas se derivaron de los tiempos suponiendo 4,3–5,0 km/h; Antonio anda a ~6, y tres
    bandas salieron FÍSICAMENTE IMPOSIBLES contra la línea recta.)*
46. ⭐⭐⭐ **EL ORDEN DE LOS ARREGLOS ES PARTE DEL EXPERIMENTO.** Arreglar dos cosas a la vez no
    solo impide saber cuál operó: **puede fabricar una explicación falsa que nadie volverá a
    cuestionar.** *(Delicias.)*
47. ⭐⭐ **UNA COMPROBACIÓN QUE NO PUEDE FALLAR NO ES UNA COMPROBACIÓN — y el proyecto ya lleva
    tres seguidas.** ⇒ **Norma:** antes de escribir cualquier verificación, responder por escrito
    *"¿puede esto pasar (o fallar) sin que nada funcione?"*. **Si el resultado sale redondo —97 %,
    3 de 3, mediana 0,0— es la señal.**
48. ⭐⭐ **UNA DIFERENCIA EN BRUTO NO ES UN EFECTO: PUEDE SER GEOGRAFÍA.** *Los portales ciegos
    enganchaban 14,4 puntos peor… y ya estaban 8,9 m más lejos de su eje antes de que el motor
    tocara nada, porque la posición del portal la pone el Ayuntamiento. Emparejando por distancia
    previa: ±2,6 puntos.* ⇒ **Buscar el confusor antes de publicar el efecto.**
49. ⭐ **CLASIFICAR ANTES DE CONTAR, TAMBIÉN AL AUDITAR CÓDIGO.** *Buscar `⛔` daba 10 sospechosos;
    nueve eran prosa o contadores en cero.*
50. ⭐ **UN TESTIGO QUE NO PUEDE OPINAR EN TODAS PARTES SOLO VALE DONDE OPINA — y hay que decir
    dónde no.** *El tercer testigo no alcanza al 36,3 %, y no al azar: Garrapinillos 0 %,
    PLAZA 1,6 %.* ⇒ **El veredicto vale para la ciudad urbana, no para el término.**
51. ⭐⭐⭐ **CUANDO EL NÚMERO CONTRADICE A LA ARITMÉTICA, EL NÚMERO ESTÁ MAL.** *Si una prueba es
    invariante a trasladar un trío, su columna tiene que dar 0; salía 44 %.* ⇒ **Escribir el
    álgebra de un instrumento ANTES de ejecutarlo da un juez que no depende de los datos.**
52. ⭐⭐ **UN ARNÉS DE PRUEBA ES UN INSTRUMENTO, Y MIENTE IGUAL.** *No basta con verificar lo
    probado: hay que verificar lo que prueba.* **Un arnés roto no da un falso negativo: da un
    falso POSITIVO convincente**, porque mide su propio destrozo.
53. ⭐⭐ **UNA REGLA SOBRE IDENTIFICADORES EXIGE QUE EL IDENTIFICADOR IDENTIFIQUE.** *"El 5 está
    entre el 3 y el 7" necesita que «el 5» sea UN sitio. En la Avenida de la Ilustración hay 1.469
    portales con 22 números distintos y 147 llamados «31».* ⇒ **Y el 18,4 % del callejero comparte
    número dentro de su propia vía.** *(Tercera forma del mismo problema: el nombre de calle, el
    nombre de ciudad, y ahora el número de portal.)*
54. ⭐⭐ **UN DETECTOR CIEGO POR ARITMÉTICA NO SE ARREGLA CON UN UMBRAL.** *Si mueves el 3, el 5 y
    el 7 juntos, el 5 sigue estando entre el 3 y el 7: la pregunta se responde igual de bien
    estando todos mal.* ⇒ **Antes de ajustar nada, preguntarse si el fallo es de calibración o de
    planteamiento.**
55. ⭐⭐⭐ **LA COMPROBACIÓN VA CONTRA EL MOTOR, NO CONTRA EL PROPIO FICHERO.** *Tres contadores que
    leen la misma fuente no son tres testigos: cuadran perfectamente y pueden estar los tres mal.*
56. ⭐⭐⭐ **NO COPIES LA REGLA: LLAMA A LA FUNCIÓN.** *Copiar la lógica del redactor divergía en
    774 líneas; copiar una versión mejor seguía divergiendo en 341. Llamar a la misma función lo
    cerró en cero.*
57. ⭐⭐⭐ **EL GROSOR Y LA OPACIDAD DE UN DIBUJO SON UNA AFIRMACIÓN.** Pintar «lo que preocupa» más
    gordo **hace que tape lo demás**, y el ojo lee una conclusión que nadie midió.
58. ⭐⭐ **UN ARNÉS ROTO NO DA UN FALSO NEGATIVO: DA UN FALSO POSITIVO CONVINCENTE**, porque mide su
    propio destrozo. ⚠️ **Van CUATRO tandas seguidas con el arnés mintiendo.** ⇒ **La prueba se
    prueba a sí misma antes de usarse.**
59. ⭐⭐ **UN AVISO QUE SALE DESPUÉS DEL RESULTADO NO EXISTE.**
60. ⭐⭐⭐ **DOS TESTIGOS INDEPENDIENTES VALEN MÁS QUE TRES VOTOS DE LA MISMA FUENTE.** *Un portal
    con respaldo de la calle pegada acierta el 99,4 %; tres portales solos, el 86,9 %.* ⇒ **Y hay
    que DEMOSTRAR que son independientes**, no suponerlo: la paralela **no repitió ni una vez** el
    error de los 198 portales ya conocidos como malos, hablando en 67 de ellos.
61. ⭐⭐⭐ **LA SÉPTIMA FORMA DE MENTIR: LA COMPROBACIÓN DISTINGUE LOS EXTREMOS Y NO EL MEDIO.**
    Vigila *«está / no está»* y **es ciega a «está pero vacío»** — el estado en el que el sistema
    **no revienta, no avisa, y sigue dando respuestas plausibles y degradadas.**
    ⚠️ **Es la más peligrosa: un fallo que revienta se caza solo; el que degrada, no.**
    ⭐ *Nace mirando un fallo concreto y hereda su binariedad.*
62. ⭐⭐⭐ **UNA CONTRAPRUEBA SOLO VALE SI ALGUIEN LE HA VISTO EL ROJO.** Si nunca se ha puesto
    roja, **no sabemos si puede**. ⛔ *«Creo que funciona» no es una categoría.*
63. ⭐⭐⭐ **«EL INSTRUMENTO ARRANCA» NO ES «EL INSTRUMENTO MIDE».** *La ley 58 dejó la mitad
    —comprobar que la palanca está conectada—; falta la otra: **comprobar que la palanca mueve
    algo.***
64. ⭐⭐ **UNA COMPROBACIÓN DE CARDINALIDAD NO DICE NADA DEL CONTENIDO.** *Contar que hay veinte no
    dice que los veinte sean los buenos.*
65. ⭐⭐ **UN ROJO QUE NO SIGNIFICA NADA HACE RUIDO — y con ruido se dejan de mirar los que sí.**
    ⇒ Un rojo que señala una **predicción fallada** y no un fallo del proyecto **se apaga, dejando
    la predicción escrita**.
66. ⭐⭐ **UN GUARDIÁN QUE GRITA CUANDO NO DEBE SE DESACTIVA — y entonces no guarda nada.**
    *El hook rechazaba un `fix:` con la bitácora en el commit anterior: **castigaba exactamente la
    práctica que `CLAUDE.md` exige**.*
67. ⭐⭐ **UN NÚMERO PUBLICADO SIN CONGELAR CADUCA SIN QUE NADIE LO NOTE.** ⚠️ **Y congelar un
    número YA caducado clava un rojo permanente — y un rojo permanente deja de significar nada.**
    ⇒ **Primero se republica, después se congela.**
68. ⭐⭐ **CONGELAR EN PAREJAS, NO SUELTOS.** *Un número suelto se mueve con la excusa de que «el
    dato cambió»; una pareja hay que moverla dos veces.*
69. ⭐ **PARA MEDIR UN «ANTES» NO BASTA CON MONTAR EL ESTADO DE ANTES: HAY QUE HACERLE LA PREGUNTA
    DE ANTES.** *Y si el «antes» sale clavado al «ahora», eso dice qué pasa.*
70. ⭐ **UN CERO PICA MENOS CUANDO CONFIRMA ALGO INTERESANTE.**
71. ⭐⭐⭐ **LA CERCANÍA NUMÉRICA NO ES CERCANÍA FÍSICA.** *Todo el fallo del buscador sale de
    tratarlas como si fueran lo mismo: el 77 se parece al 78 en el número y está a 258 m.*
72. ⭐⭐⭐ **UN TESTIGO QUE NO PUEDE DISTINGUIR LA PREGUNTA NO ES QUE FALLE: ES QUE NO OPINA.** *Las
    dos aceras son la misma calle, así que los tres testigos aprobaban un portal enganchado
    enfrente.* ⇒ **Antes de fiarse de un porcentaje, preguntar QUÉ mide exactamente** — el 99,6 %
    medía identidad de calle y se leía como identidad de sitio.
73. ⭐⭐⭐ **DOS MEDIDAS DE ACUERDO NO SON DOS MEDIDAS CORRECTAS.** *Dos cuadres entre tandas
    coincidían al decimal sobre el mismo artefacto.*
74. ⭐⭐⭐ **CONGELAR PRESERVA LOS ERRORES CON LA MISMA FIDELIDAD QUE LAS VERDADES.** *Casi todos
    los cuadres contra lo publicado son **frenos de deriva, no validaciones**: sirven para que nada
    se mueva en silencio, pero **no pueden descubrir un error que ya estaba el día que se
    congeló**.*
75. ⭐⭐⭐ **UN LISTÓN CALIBRADO CONTRA N CASOS ACIERTA EN LOS N CASOS: eso no es una comprobación,
    es la definición de calibrar.**
76. ⭐⭐⭐ **UN NÚMERO QUE SOLO VIVE EN UN COMENTARIO NO TIENE GUARDIÁN POSIBLE, Y POR ESO NO
    ENVEJECE: SE PUDRE.**
77. ⭐⭐ **LA CIFRA QUE ENTRA EN UNA DECISIÓN ES LA DEL TEXTO, NO LA DE LA TABLA.** ⇒ **Imprimir la
    resta hecha**, no los dos números para que alguien la haga.
78. ⭐⭐ **UNA LEY ESCRITA NO PROTEGE: PROTEGE EL MECANISMO.** *El mismo mapeo campo a campo se
    comió la marca dos días seguidos, con la ley ya escrita y describiendo exactamente eso.*
79. ⭐⭐ **APAGAR ALGO EN EL INFORME NO ES APAGARLO EN EL INSTRUMENTO.** *El script que produce los
    números falsos sigue corriendo, y la batería lo da por verde.*
80. ⭐ **PARA CORRER LO QUE HAY NO HACE FALTA ESCRIBIR NADA NUEVO.** *De los cinco hallazgos del
    bloque A, tres los encontró código que ya estaba en el repositorio y que nadie ejecutaba.*
81. ⭐⭐⭐ **UN REPOSITORIO PÚBLICO QUE SOLO CORRE EN LA MÁQUINA DE QUIEN LO ESCRIBIÓ NO ES
    PÚBLICO.** *Dos rutas absolutas a otro disco dejan a cualquiera que clone sin poder ejecutar
    ni un script — y la decisión que las puso ahí («los portales se leen DONDE ESTÁN») es correcta
    para quien trabaja en esa máquina y falsa para todos los demás.* ⇒ **Toda decisión de entorno
    se relee desde fuera antes de publicar.**
82. ⭐⭐ **NO SE PUEDE COMPROBAR UNA JUSTIFICACIÓN QUE NO EXISTE.** *De 64 umbrales de nivel
    superior, 41 no tienen ni un comentario.* Un umbral sin porqué escrito no es que esté mal:
    es que **no hay nada contra lo que contrastarlo el día que se dude de él.**
83. ⭐⭐ **CONTAR SÍMBOLOS ES UNA CRIBA; EL VEREDICTO SALE DE EJECUTAR.** *764 líneas imprimen
    `⛔`/`✅`, 46 afirman algo sin vigilancia, y leídas una a una quedan **6**. Ejecutando, la
    pregunta es otra: 37 scripts que no se pueden leer por su código de salida.* ⇒ **Dos recuentos
    distintos de la misma pregunta, y el grande se lee mal si se cita solo.**
84. ⭐⭐ **UNA CIFRA EN UN COMENTARIO ES LA FOTO DE UNA MEDIDA QUE EL CÓDIGO YA NO REPITE.** *328 de
    330 son `NO CONSTA` estructural — comprobarlas exigiría reconstruir treinta y seis tandas.*
    ⇒ **No es dejadez: es que un comentario no tiene guardián posible.** Lo que sostiene una
    decisión, se congela; lo demás se escribe sabiendo que envejece.
85. ⭐⭐⭐ **UNA CONTRAPRUEBA QUE FALLA PUEDE ESTAR ACUSANDO AL DETECTOR CUANDO LA CULPABLE ES LA
    ROTURA.** *El método cazaba 1 de 6 y el método estaba bien: la mutación sustituía solo la
    primera aparición del número.* ⇒ **Antes de concluir «mi método no caza», comprobar que la
    rotura ocurrió DEL TODO.** ⚠️ Es el nº117 con una vuelta de tuerca peor: allí las mutaciones no
    llegaron a ocurrir; aquí **ocurrieron incompletas, que deja marca de haber ocurrido.**
86. ⭐⭐⭐ **LA CONVENCIÓN «SE AÑADE, NO SE REESCRIBE» CREA PUNTEROS SOLO HACIA ATRÁS.** *40 citas
    hacia atrás, 0 hacia delante en los documentos que un congelado declara superados.*
    ⇒ **La cadena es navegable solo en la dirección en la que nadie la lee.** El arreglo no es
    corregir los números: es que **republicar OBLIGUE a dejar la nota en el documento superado.**
    ⭐ *Una ley escrita no protege; protege el mecanismo.*
87. ⭐⭐⭐ **LA VERDAD DE UN DOCUMENTO ES UNA FOTO, NO UNA PROPIEDAD.** *`RAZONABLE_M = 50 m` fue
    cierto en la 33, falso en la 34 y la 35, y cierto otra vez en la 36 — **sin que nadie lo
    tocara**.* ⇒ *«el documento dice la verdad» es una afirmación sobre CUÁNDO se mira*, y **nada
    en el repositorio registra que estuvo mintiendo.**
88. ⚠️ **CUANDO SE BUSCA UN DATO «COMO SE ESCRIBE», HAY QUE BUSCARLO COMO LO ESCRIBE QUIEN LO
    ESCRIBIÓ**, no como lo escribiría la librería. *`Intl` no agrupa cuatro cifras y la prosa de
    este repositorio sí: cinco hallazgos falsos.*
89. ⭐⭐ **UN SESGO NO SE VE EN UN CASO: SE VE EN EL SIGNO DE TODOS.** *El 16,9×, la capa del README
    y el acantilado del listón fallan los tres **en la dirección que favorece a la tesis**.* Un
    error aislado es ruido; tres con el mismo signo son **quien escribe.**
90. ⭐⭐⭐ **LA MEDIDA DEL DAÑO DE UN FALLO SE TOMA CON EL ARREGLO PUESTO — Y EL ARREGLO ES UN
    INSTRUMENTO NUEVO QUE NADIE HA VERIFICADO.** *«El envenenamiento costaba 108» calculado con un
    parche recién escrito **medía el parche**: el daño real era 1 y las otras 107 las fabricó el
    remedio.* ⇒ **La cifra del daño se audita como se audita cualquier otra.**
91. ⭐⭐⭐ **UN VERDE FALSO LO CAZA EL SIGUIENTE QUE MIRE; UN ROJO FALSO PUBLICADO NO LO CAZA NADIE.**
    *Porque a un hallazgo nadie lo audita: entra en el registro, entra en el estado y en tres tandas
    es un hecho del proyecto.* ⇒ **Un instrumento que inventa fallos es más peligroso que uno que
    los tapa**, y los 87 anteriores mentían todos en verde.
92. ⭐⭐ **CONTRASTAR UNA CLASE DEFINIDA POR COINCIDENCIA ES CIRCULAR.** *Una cifra es `R` **porque**
    su valor coincide con lo que imprime un productor; preguntarle después «¿cuadra?» devuelve «sí»
    siempre.* ⇒ **Las divergencias no salen de recorrer lo que casa: salen de buscar al revés**, en
    lo que NO casa pero comparte vocabulario.
93. ⭐⭐⭐ **UN CENSO MIDE LO QUE EL PROYECTO SUBRAYA, NO LO QUE AFIRMA — Y LO QUE MÁS SE PROTEGE ES
    JUSTO LO QUE MENOS SE SUBRAYA.** *El censo v2 deja fuera 12 de los 26 congelados: viven en
    celdas de tabla sin negrita. Un número entra en `numeros-congelados.js` porque es importante,
    no porque esté destacado.* ⇒ **Todo denominador se declara por lo que realmente mide.**
94. ⭐⭐⭐ **ANTES DE AUDITAR UN DOCUMENTO HAY QUE PREGUNTARLE QUÉ ES — Y SUELE DECIRLO EN SU PRIMERA
    PÁGINA.** *Dos lectores clasificaron cuatro documentos razonando sobre su contenido, con
    «Estado: propuesta para aprobar. Nada de esto está construido» en la tercera línea del primero.*
    ⇒ **Clasificar por el contenido teniendo la declaración de estado delante sin leerla es el mismo
    fallo que la auditoría estaba denunciando en otros.**
95. ⭐⭐⭐ **UN EJE QUE GRITA LO QUE LE PASA NO ES EL PELIGROSO.** *La ruta nº7 avisa en su documento,
    avisa en el comentario del código de al lado, y la columna que decide es inmune. La batería no
    avisa de nada: cuelga todo de ella y su único fallo conocido fue **no ver nada**.*
    ⇒ **El riesgo se mide por carga partido por vigilancia, no por fragilidad aparente.**
96. ⭐⭐⭐ **UNA ESCALA DERIVADA DE LA MAGNITUD QUE VALIDA NO PUEDE INVALIDARLA.** *Las bandas de
    distancia salieron de los 6 km/h, así que **una ruta comparada con su banda no puede fallar por
    una calibración mala: banda y ruta se mueven juntas**.* Es la ley 92 vestida de otra cosa —
    y **no estaba escrita en ninguna parte** aunque el documento sí marcaba las bandas como
    derivadas.
97. ⚠️ **UN DISEÑO ENUNCIA SUS REGLAS SIN CONJUGAR NADA.** *Un clasificador que exige verbo pierde
    los sintagmas nominales, que en un documento de diseño son la mitad de las reglas.*
98. ⭐⭐⭐ **UNA SEMILLA QUE SE ENCUENTRA A SÍ MISMA NO DICE NADA DE LO QUE NO SE BUSCÓ.** *El control
    de un barrido comprobaba que el detector encontrase el hermano YA CONOCIDO — y salía. Mientras,
    se dejaba dos en el mismo fichero.* ⇒ **Una semilla mide el recall sobre lo que ya sabías; no
    dice nada sobre el hueco.** ⚠️ **Y afecta a los encargos de esta conversación, que la han pedido
    tres veces.** ⭐ **La alternativa buena: barrer una parcela pequeña con criterio ancho y contar
    la diferencia.**
99. ⭐⭐ **UN FILTRO DE FORMATO PRODUCE UN SUELO, NO UN RECUENTO — y si no se declara como suelo, se
    lee como total.** *Exigir `%` o `×` dejó fuera `214 casos` y `~10 puntos`, que son resultados
    medidos igual.*
100. ⭐⭐⭐ **UN NÚMERO ESCRITO A MANO DENTRO DE UNA CADENA QUE SE IMPRIME ES PEOR QUE EN UN
    COMENTARIO, PORQUE HEREDA LA CREDIBILIDAD DEL INSTRUMENTO.** *Un comentario se lee como un
    comentario; una línea de salida se lee como un resultado. **Nadie sospecha de la salida de un
    instrumento.*** ⇒ Y el corolario del arreglo: **cuando la solución es interpolar, el guardián
    que verifica la interpolación pasa por construcción. No se pone: se dice que no se pone y por
    qué.**
101. ⭐⭐ **UN NÚMERO DERIVADO DE DOS QUE SÍ ESTÁN EN EL ALCANCE NO ESTÁ EN EL ALCANCE** — arrastra a
    todos los sitios donde se repite. *Un párrafo con dos números incoherentes le cuesta más al
    lector que uno con dos números viejos coherentes: **el viejo es una foto, el incoherente es una
    duda**.* ⇒ **Antes de interpolar una cifra, buscar si se repite fuera del alcance.**
102. ⭐⭐ **UN NÚMERO PUEDE ESTAR BIEN Y AUN ASÍ SER EL FALLO.** *Las tres cifras de
    `sin-vigilancia.js` eran correctas el día que se arreglaron; el «400×» ya mentía.* ⇒ **El fallo
    no era el número: era que el número no podía enterarse.** ⚠️ **Y de ahí sale que el rojo tenga
    que PROVOCARSE y decirse que se provocó.**
103. ⭐ **UN CONTROL QUE DEPENDE DE LO QUE CONTROLA NO ES UN CONTROL.** *El positivo saltaba junto al
    guardián al provocarle el rojo, porque contaba la variable misma que se estaba probando.*
104. ⭐⭐⭐ **UNA RETIRADA QUE SOLO VIVE EN UN MENSAJE DE COMMIT NO ESTÁ PUBLICADA: UN HALLAZGO SE CAE
    DONDE SE LEYÓ.** *Es la ley 86 aplicada a las conclusiones y no a los números — el puntero hacia
    delante hace falta también cuando lo que se sustituye es un veredicto.*
105. ⭐⭐⭐ **SI EL CÓDIGO PUEDE CONTESTAR LA PREGUNTA, LA RESPUESTA NO SE ESCRIBE** — ni aunque se
    tenga delante, ni aunque sea texto y no un número. ⚠️ **Una lista descriptiva es PEOR que una
    cifra: no tiene quien la vigile, y no necesita pudrirse porque nace mal.** ⭐ Y el aviso:
    **diez elementos correctos de doce hacen creíble una lista inventada — la proporción no es
    evidencia de método.**
106. ⚠️ **UN `~` NO ES LICENCIA PARA NO MEDIR.** *Y la promesa de una portada alcanza a su prosa, no
    solo a su tabla.*
107. ⭐⭐⭐ **UNA PORTADA QUE PROMETE QUE NINGUNA CIFRA ESTÁ A MANO PROMETE TAMBIÉN QUE SUS COMANDOS
    CORREN.** *Se verificaron las 30 cifras y se dieron por buenos los `bash` que las rodean:*
    **la mitad de la promesa que no se lee como promesa.** ⭐ Y el arreglo bueno no es ejecutar el
    ejemplo: es **elegir un ejemplo que sea una comprobación** *(el que quedó da 598 m — la ruta nº2
    congelada al decimal)*.
108. ⭐⭐⭐ **LA LEY 5 EN SU VERSIÓN DIFÍCIL: SOSPECHAR DEL TEST CUANDO PASA.** *La batería salió en
    verde y no valía, porque su verde venía del booleano que la propia tanda acababa de denunciar.*
    ⇒ **La comprobación que vale es la que compara el CONTENIDO, no el veredicto.**
109. ⭐⭐⭐ **UNA PROPIEDAD SIN INSTRUMENTO NO ES QUE SALGA MAL: ES QUE NO SE MIRA.** *Tres pasadas
    sobre el README el mismo día y ninguna lo miró renderizado, porque «se ve bien» no tiene comando
    en este repositorio.* ⇒ ⭐⭐ **El repositorio vigila la clase de afirmación que sabe comprobar.**
    Y la forma **también tiene comando**: `grep -c '^```' README.md` **tiene que dar par.**
110. ⭐⭐⭐ **LO QUE MIENTE NO SIEMPRE ES UN NÚMERO: A VECES ES UN `✅` QUE SIGUE AHÍ.** *Los fallos que
    esta auditoría ha arreglado se veían al MIRAR; el silencio de un guardián solo se ve al CONTAR.*
111. ⭐⭐⭐ **UN DOCUMENTO NO ENVEJECE SOLO: ENVEJECE CUANDO MUERE SU CONTRADICTOR.** *El «412 m» de la
    ruta 6 fue cierto el 4 de agosto y consta. Se quedó viejo el 6, cuando §A6 dejó de medir — y
    nadie pudo desmentirlo durante dos días porque el único que sabía hacerlo estaba callado.*
    ⇒ ⭐⭐ **Lo que hay que vigilar no es el número publicado: es que su instrumento siga vivo.**
112. ⭐⭐⭐ **UN SILENCIO BIEN FORMADO NO LO CAZA NINGÚN CONTADOR.** *Imprimir `NO CONSTA` es una
    salida legítima: ni el código de salida ni el recuento de fallos podían decir «§A6 lleva dos
    días sin medir».* ⇒ **Saber si un instrumento sigue midiendo lo que dice medir no lo contesta un
    contador: lo contesta comparar su salida con la de otro.**
113. ⭐⭐ **UN BOOLEANO DONDE HAY UNA CANTIDAD NO ES UNA SIMPLIFICACIÓN: ES UNA VENDA.** *Contesta bien
    mientras importe «¿hay?» y deja de contestar cuando importe «¿cuántos?» — **sin cambiar una
    línea de su salida.***
114. ⭐⭐ **UNA VIGILANCIA DUPLICADA NO ENVEJECE COMO SU ORIGINAL.** *El original se actualiza con la
    decisión; la copia se queda dando un rojo indistinguible de un hallazgo.*
115. ⭐⭐⭐ **«HA DEJADO DE MENTIR EN ESTO» NO ES «DICE LA VERDAD».** *La batería pasó de contestar
    «¿hay?» a contestar «¿hay?» y «¿cuántos?». Sigue sin contestar **«¿de qué?»** — y ésa era la que
    importaba en el caso de la ruta 6.* ⇒ **Confundir las dos es exactamente el fallo que cada tanda
    viene a arreglar.**
116. ⭐⭐⭐ **UNA CIFRA NO IDENTIFICA UN DATO: LO IDENTIFICA LA CIFRA MÁS SU CONTEXTO.** *`182` era un
    listón p99 en metros y `412` era «412× el azar».* ⇒ **Y el corolario, que es la ley de verdad:
    EL RIESGO DE UN INSTRUMENTO NO ESTÁ EN LO QUE MIDE, ESTÁ EN LO QUE HACE CON LO MEDIDO.** *El
    mismo barrido, con la misma precisión, es aceptable auditando —solo propone— e inaceptable
    marcando —escribe en un registro histórico.*
117. ⭐⭐⭐ **UN GUARDIÁN CUYO ROJO SE APAGA CAMBIANDO SU EXPECTATIVA ES UN GUARDIÁN QUE ENSEÑA A
    MENTIRLE.** *Los `contexto` y los recuentos cerrados son fotos de hoy: el día que alguien escriba
    una frase nueva con ese número, el guardián dirá «se ha movido» —correctamente— y la salida
    cómoda será subir el número sin mirar.* ⚠️ **La tanda 3 construyó dos con esa forma, y lo
    declaró.**
118. ⭐⭐⭐ **UN GUARDIÁN PUEDE DECIR «LO QUE VIGILO HA CAMBIADO»; NO PUEDE DECIR «HAY ALGO QUE
    DEBERÍA VIGILAR Y NO VIGILO».** *La tabla tiene 18 pares porque alguien los conocía; el latido
    vigila 4 números porque son los que esa tanda midió.* ⇒ **Para eso haría falta el censo — y el
    censo es justo el instrumento que acaba de declararse ciego a la mitad de lo congelado y a todos
    los ceros.** ⭐⭐ **El instrumento que podría medir la cobertura de los demás es el que peor
    cobertura tiene, y no es casualidad: es el más difícil.**
119. ⭐⭐⭐ **EL ENVEJECIMIENTO QUE NO CAMBIA NINGUNA CIFRA NO LO VE NINGÚN MECANISMO DE ESTE
    PROYECTO.** *La definición que se ensancha, el criterio que se relaja, la pregunta que deja de
    ser la misma pregunta.* ⚠️ **Y el caso está medido:** la ruta 6 pasó de **221 m municipales
    (53,6 %, cero propios)** a **438 (100 %)** — *el número que se movió no es el mismo tipo de
    número*. ⇒ **El puntero y el latido comparan NÚMEROS, y eso es precisamente lo único que este
    envejecimiento no toca.**
120. ⚠️ **UN CENSO QUE NO PUEDE VER UN CERO NO PUEDE AUDITAR UNA NEGACIÓN.** *La expresión del censo
    v2 exige dos dígitos: en sus 2.360 marcas no hay un solo token de uno.* ⛔ **Y en un proyecto
    cuya regla exige demostrar todo cero con un positivo de control, eso lo inhabilita justo donde
    más falta hace.**
121. ⭐⭐⭐ **UN GUARDIÁN NO VALE POR LO QUE COMPRUEBA, SINO POR LO QUE PUEDE LLEGAR A VER.** *Antes de
    creerse un verde hay que preguntar **quién más toca el objeto vigilado, y en qué orden**.*
    ⇒ ⭐⭐ **Corolario: vigilar un artefacto GENERADO es vigilar a su generador con retraso.** Si se
    puede regenerar, **hay que vigilar el código, no el producto.**
122. ⭐⭐⭐ **UNA GUARDA QUE PROTEGE DE UN FALSO POSITIVO COMPRA EL FALSO NEGATIVO DEL OTRO LADO — Y
    ÉSE NO SE VE:** sale un número más pequeño y parece limpio. ⇒ ⭐⭐ **Y el corolario que salva:
    un recuento cerrado declarado a partir de lo que midió el propio barrido no es un guardián, es
    un ECO. Solo vale si la cifra viene de FUERA del instrumento.**
123. ⭐⭐⭐ **LO DE ANTONIO JUZGA, NUNCA DECIDE.** *Medido: `ruta.js` y `caminos.js` no conocen
    `rodeoMax`, ni `banda`, ni `tabla-rutas` — cero menciones.* ⇒ **Los topes, las bandas y los siete
    trayectos EVALÚAN al motor; ninguno entra en su cálculo.** ⚠️ **`VELOCIDAD_KMH` era la única cosa
    suya que decidía un número publicado, y ha dejado de serlo.**
124. ⭐⭐⭐ **CAMBIAR EL VALOR DE UNA CONSTANTE CIRCULAR NO ROMPE LA CIRCULARIDAD: LA TRASLADA.** *Si
    las bandas se recalculan con la constante nueva, vuelven a salir de ella y el guardián vuelve a
    no poder fallar por la misma razón — número cambiado, defecto conservado.* ⇒ **Solo la rompe una
    segunda distancia MEDIDA, no calculada.**
125. ⚠️ **UNA DECISIÓN CORRECTA PUEDE DEJAR UN DATO HUÉRFANO SIN QUE SALTE NADA.** *Con 6 km/h la
    ruta 7 cuadraba con su banda medida; con 5,0 no —30 calculados contra 25 declarados— **y ningún
    guardián lo denuncia, porque nadie compara el tiempo calculado con el declarado**.* ⚠️ **Segunda
    vez en dos tandas: la primera fue el 412.** ⇒ **El rojo del que se cae es un rojo que no
    existía**, y eso es la ley 119 otra vez.
126. ⭐⭐⭐ **UN PUNTERO ROTO ES PEOR QUE NO TENER PUNTERO, PORQUE PROMETE CAMINO.** *Una cabecera que
    manda al lector a un documento inexistente es peor que una que no le manda a ninguno: la
    primera se cierra sola, la segunda le hace buscar.*
127. ⭐⭐⭐ **UN BARRIDO POR CONTENIDO NO DISTINGUE UNA AFIRMACIÓN DE UNA TRANSCRIPCIÓN.** *«Recorrió
    los 56 scripts» es un hecho del 6 de agosto y sigue siendo cierto: **marcarlo como superado
    sería decir que aquella ejecución fue otra**.* ⇒ **El instrumento encuentra la cifra; el juicio
    lo pone una persona — y por eso cada par lleva su recuento cerrado: para que ese juicio se emita
    una vez y quede grabado.**
128. ⭐⭐⭐ **UN SISTEMA PUEDE ALCANZAR UNA CONSISTENCIA IMPECABLE ALREDEDOR DE UN ERROR QUE NADIE FUE
    A BUSCAR FUERA — Y CUANTO MEJORES SEAN SUS GUARDIANES, MÁS CONVINCENTE SERÁ EL CONJUNTO.**
    *111 instrumentos vigilando la coherencia interna; **una cinta métrica apuntando al mundo**.*
    ⇒ ⛔⛔ **El riesgo no es que mienta un número: es que TODO CUADRE y la ruta esté mal, porque lo
    único que podría desmentirla no está en el disco.**
129. ⭐⭐⭐ **UN GUARDIÁN TIENE QUE ACERTAR EN EL SOSPECHOSO, NO SOLO EN EL VEREDICTO.** *El de la
    tabla acusaba al parser de comerse una fila que había leído perfectamente.* ⇒ ⭐⭐ **Y el corolario
    es el que asusta: LOS MENSAJES DE ERROR NO LOS PRUEBA NADIE.** Se escriben una vez, con el mundo
    de aquel día en la cabeza, **y envejecen sin que ningún test los toque** — la ley 119 en su forma
    más barata de producir y más cara de detectar.
130. ⭐⭐⭐ **UN FALLO DE FORMA NO SE CIERRA ARREGLANDO SUS CASOS CONOCIDOS: SOBREVIVE DONDE NADIE FUE
    A MIRAR, Y SOLO APARECE CUANDO EL MUNDO CAMBIA.** *El literal `7` se quitó de dos ficheros en la
    tanda 2·bis y quedaba un tercero — **en el que vigila las rutas**—, y no se vio hasta que entró
    una ruta nueva.*
131. ⭐⭐⭐ **CUANDO LA INCERTIDUMBRE DEL CONTRASTE IGUALA AL EFECTO, LA MEDICIÓN NO PUEDE CONCLUIR
    NADA — SALGA LO QUE SALGA.** *El destino andado estaba a 134 m del portal medido: un 2,0 % sobre
    6,6 km, y la diferencia motor↔GPS que se querría medir es de ese mismo tamaño.* ⇒ ⭐⭐ **Medir
    mejor el trayecto no sirve si no se fija el punto final.**
132. ⭐⭐ **EL RODEO NO CRECE CON LA DISTANCIA — y es un resultado del MOTOR, no del instrumento.**
    *De 520 m a 6,4 km, factor 12, el rodeo no se mueve de 1,06–1,10.* ⇒ **En trayectos largos las
    desviaciones de manzana se promedian; en 500 m una sola manzana mal tomada es el 10 %.** ⚠️ Y lo
    que sí crece es otra cosa: **el error no se acumula con la distancia, sino con cuánta ciudad mal
    mapeada se cruza.**
133. ⭐⭐⭐ **EL PUNTERO ENVEJECE LAS CIFRAS Y NO LA PROSA QUE LAS ENVUELVE.** *`H1-VELOCIDAD-ESTANDAR.md`
    republicó su banda de 40 min — pero su §C se titula «LAS TRES BANDAS» y hoy son **cinco**, y su
    §D dice «dos de las tres se derivaron» cuando hoy se deriva **una de cinco**.* ⛔⛔ **El argumento
    de circularidad del documento casi se ha caído solo y el documento lo sigue afirmando: ningún
    mecanismo de este repositorio puede verlo.**
134. ⭐⭐⭐ **EL PUNTERO MARCA LO QUE ALGUIEN DECLARA. NO DESCUBRE NADA.** *La tanda 3 aceptó el
    mecanismo con una condición escrita —«¿qué pasa el día 24, cuando nadie se acuerde?»— **y el 9 de
    agosto FUE el día 24**: puntero en verde y una cifra caducada publicada.* ⭐ **Y el positivo de
    control separa las dos acusaciones: el instrumento no está ciego — nadie le mandó mirar.**
135. ⭐⭐ **UN REPARTO MAL CON EL TOTAL BIEN NO LO VE NADIE, PORQUE EL NÚMERO QUE SE COMPRUEBA ES EL
    CORRECTO.**
136. ⭐⭐ **CITAR UNA CIFRA CADUCADA LA MARCA COMO AFIRMADA — Y EVITARLO OBLIGA A MUTILAR LA CITA.**
    *Un documento que CUENTA los números caducados de otro sale marcado como si los AFIRMARA.* ⇒ Es
    la ley 127 vista desde el otro lado: **el instrumento no distingue afirmar de transcribir, y el
    precio lo paga quien escribe.**

137. ⭐⭐⭐ **LA MAQUINARIA ES LA FÓRMULA. LA DECISIÓN ES LA VALLA. Y LO QUE SE COPIA ES LA SEGUNDA.**
    *De la herencia de 003: `poste = int(stop_code[2:])` era correcto allí **y su autor lo encerró en
    la capa de fuente citando al tranvía por su nombre**.* ⇒ **El peligro de heredar no es copiar un
    fallo: es copiar la fórmula y dejarse la valla** — porque la fórmula cabe en una línea y la valla
    vive en un párrafo de un documento de diseño que nadie está obligado a leer.

138. ⭐⭐⭐ **UN CONTROL CUYO VERDE ES IMPOSIBLE POR CONSTRUCCIÓN NO ES UN GUARDIÁN: ES UNA CEREMONIA.**
    *Un documento que registra sus correcciones **tiene que** contener la frase retirada, entre
    comillas, o la corrección no se puede leer.* ⇒ Antes de exigir un cero, se comprueba **si ese cero
    puede darse alguna vez**.

139. ⭐⭐⭐ **EL DOCUMENTO QUE GOBIERNA A LOS DEMÁS ES EL QUE NINGÚN MECANISMO VIGILA — Y ES EL PRIMERO
    QUE LEE QUIEN LLEGA.** *La auditoría cubrió el código, los 44 de `docs/` y las decisiones.
    `DESPLAZAME-ESTADO.md` no entró en ninguno de los cuatro bloques: `superados.js` marca `docs/` y
    este fichero vive en la raíz.* ⇒ **Es la ley 111 en el peor sitio posible.**

140. ⭐⭐⭐ **UNA RUTA DE FICHERO ES UNA AFIRMACIÓN, Y SE VERIFICA COMO TAL.**
    *El contenido y su dirección son dos hechos distintos: acertar el primero no dice nada del
    segundo.* ⚠️ **Y en un registro histórico la dirección es lo único que le queda al que venga
    después.** Corolario medido: **lo que se degrada al resumir de memoria no es el fichero —ése se
    recuerda— son las COORDENADAS dentro de él** (un nombre mal contra cinco líneas mal).

141. ⭐⭐ **UN FLAG DE DIAGNÓSTICO PUEDE CAMBIAR LO QUE DEVUELVE EL MANDATO, NO SOLO LO QUE IMPRIME.**
    *`-v` se pone para VER MÁS y además decide otra cosa.* ⇒ **El veredicto se lee en el modo que se
    va a usar en producción, no en el que se usa para mirar.**

142. ⭐⭐ **UNA ALLOWLIST NECESITA SU PROPIA CONTRAPRUEBA.**
    *Comprobar que lo prohibido está prohibido no dice nada sobre si lo permitido está permitido, y
    las dos mitades de un `.gitignore` se rompen por motivos distintos.* ⚠️ Y el caso de 004 lo
    empeora: **`tools/` no la protege ninguna regla** — se versiona por defecto lo que caiga ahí, y
    cada derivado ha tenido que excluirse **a mano, cuatro veces**.

143. ⭐⭐ **MÁS PUNTOS NO ES MÁS VERDAD.**
    *Heredada de 003, medida allí: `shapes.txt` trae 300-440 puntos por trazado **y miente cuando hay
    obras**; el KML trae 153 **y dice la verdad**.* ⇒ Precisión sin exactitud. ⚠️ **Muerde directo
    aquí: 004 publica metros con un decimal sobre una geometría que puede estar desactualizada.**

144. ⭐⭐⭐ **CUANDO EL DATO NO TRAE LA RELACIÓN, LA RELACIÓN ES TUYA — Y QUIEN TIENE POR DÓNDE ANDAR NO
    NECESITA UN RADIO.**
    *El feed no trae `transfers.txt`, ni `pathways.txt`, ni un solo `parent_station`, y **bus y
    tranvía no comparten ni una parada de 984**.* ⇒ **Todo transbordo entre modos es forzosamente un
    tramo a pie.** Los routers que no tienen grafo peatonal lo resuelven con un radio fijo. **004 lo
    puede CALCULAR andando** — y eso convierte H1 en pieza portante del multimodal, no en un
    accesorio que se hizo antes.

145. ⭐⭐⭐ **SE BUSCA AL DOCUMENTO QUE PROMETE DE MÁS. EL QUE DESCRIBE DE MENOS HACE EL MISMO DAÑO Y
    NO LO MIRA NADIE.**
    *003 publicó `poste = int(stop_code[2:])` y su código era `/^PA(\d{5})$/`. La regex ancla y exige
    cinco dígitos; **el tranvía tiene cuatro**, así que el código devuelve `null` y la fórmula
    publicada devuelve **`1` para tres paradas distintas, sin error**.* ⇒ **La valla estaba en la
    regex, no en la frase — y quien hereda, hereda la prosa.** Corolario: **una auditoría que solo
    pregunta «¿el código cumple lo que el documento promete?» tiene media cara sin mirar.**

146. ⭐⭐⭐ **UN POSITIVO DE CONTROL DEMUESTRA QUE EL INSTRUMENTO VE. NO DEMUESTRA QUE TÚ HAYAS
    MIRADO.**
    *El `grep` devolvió `engine/correspondencias.ts` y el informe publicó «003 no tiene nada de
    transbordo».* ⇒ **Entre el instrumento y la afirmación queda un humano leyendo**, y ese tramo no
    lo cubre ningún control. ⚠️ Y este documento lo destiló al día siguiente, **a dos sitios**: *un
    error leído se propaga más rápido que uno medido.*

147. ⭐⭐ **UNA PRUEBA QUE SOLO TIENE UN RESULTADO POSIBLE NO ES UNA PRUEBA, EN CUALQUIERA DE LOS DOS
    SENTIDOS.**
    *El nº119 no podía ponerse verde; el nº128 no podía ponerse rojo. Los dos los escribió esta
    conversación, con un día de diferencia.* ⇒ **Antes de pedir una comprobación se pregunta qué
    resultado la haría fallar. Si no hay ninguno, no se está comprobando: se está decorando.**

148. ⭐⭐⭐ **UN RESULTADO CORRECTO NO DEMUESTRA QUE HAYAS MEDIDO EL UNIVERSO CORRECTO — Y EL ACIERTO
    ES EL MEJOR CAMUFLAJE QUE HAY.**
    *Las componentes se midieron sobre un grafo que el motor no usa y salieron las mismas tres
    paradas. Ninguna salida podía delatarlo.* ⇒ **Un guardián compara valores; nadie compara
    UNIVERSOS.** Corolario: **si el fallo hubiera cambiado el número, se habría cazado solo. Se
    escapó por acertar.**

149. ⭐⭐ **UNA MEDIDA REPRODUCIBLE POR SU PROPIO AUTOR, EL MISMO DÍA, NO ESTÁ VERIFICADA:
    ESTÁ REPETIDA.**
    *Dos scripts escritos por la misma persona con la misma idea en la cabeza reproducen su criterio,
    no la realidad.* ⇒ **El control de verdad es un TERCER CAMINO** — otro método, otra persona, o una
    muestra comprobada a mano. ⚠️ Y decir *«se reproduce exacto»* sin esto es cierto y engañoso a la
    vez.

150. ⭐⭐⭐ **UN INSTRUMENTO NO PUEDE PONERSE ROJO SOBRE LO QUE SU MODELO NO REPRESENTA.**
    *`acera-equivocada.js` no puede cazar una acera equivocada en las 456 paradas que enganchan al
    EJE DE LA CALZADA: ahí el grafo no tiene dos lados, tiene un eje.* ⇒ **Su verde cubre dos
    poblaciones y solo vigila una** — y **la que no vigila falla en silencio y sin cruzar nada.**
    ⛔ **Corolario que decide H2a: la cobertura de un guardián se declara sobre el MODELO, no sobre
    los casos.**

151. ⭐⭐⭐ **EL UNIVERSO DE LAS COSTURAS DECIDE QUÉ CLASE DE FALLO ES INVISIBLE — Y NADIE AUDITA EL
    UNIVERSO, SOLO LOS CASOS.**
    *Las diez rutas de cordura de H1 van todas de un portal a otro DISTANTE. Por eso ningún bloque de
    la auditoría, ni siete tandas de arreglo, pudieron ver que el motor cobra 32,5 m por 11,9 en el
    centro.* ⇒ **Una costura no solo comprueba: DEFINE lo que se puede comprobar.** ⚠️ Y la pregunta
    que la audita no es *«¿pasan las diez?»* sino ⭐ **«¿qué clase de trayecto NO hay entre las
    diez?»**

152. ⭐⭐⭐ **UN CONTROL NEGATIVO NO ES UN POSITIVO DE CONTROL, Y SE CONFUNDEN CON FACILIDAD PORQUE
    LOS DOS SALEN VERDES.**
    *«Las rutas largas son el control» demuestra que el instrumento no dispara de más. Para saber que
    sabe disparar hace falta darle casos que SÍ deben dispararlo.* ⇒ **Un cero solo vale acompañado
    de un uno**, y los dos tienen que salir del mismo instrumento en la misma ejecución.

153. ⭐⭐ **UNA CONCLUSIÓN CORRECTA CON CAUSA FALSA ES DEUDA, NO ACIERTO — Y SE CORRIGE LA CAUSA SIN
    TOCAR LA CONCLUSIÓN.**
    *La bitácora nº185 acertó que las diez rutas no cazaban el fallo, y lo explicó por una razón que
    resultó falsa: hay 8.811 pares reales igual de separados que la nº4 que sí lo padecen.* ⇒ **La
    causa vuelve a `NO CONSTA`, y la entrada vieja no se reescribe.** ⚠️ *No se cambia una explicación
    inventada por otra más bonita.*

154. ⭐⭐⭐ **EL TERCER CAMINO QUE VALE ES EL QUE NADIE ESTABA BUSCANDO.**
    *La tanda 6 midió `+49,0 m` como inflación mediana de 16 pares, midiendo el DEFECTO. La tanda 8
    midió `−49,0 m` de lo que se les quita, midiendo el ARREGLO. Dos instrumentos, dos días, dos
    propósitos, y ninguno escrito para comprobar al otro.* ⇒ **Una coincidencia entre dos medidas
    hechas con fines distintos vale más que una muestra grande hecha a propósito** (ley 149), *porque
    el sesgo del autor no puede haber apuntado a las dos.* ⭐ **Y por eso se busca hacia atrás: los
    números viejos del proyecto son terceros caminos esperando a que alguien los cruce.**

155. ⭐⭐⭐ **UNA EXPLICACIÓN QUE NO PREDICE DÓNDE FALLARÍA NO ES UNA EXPLICACIÓN: ES UN RELATO.**
    *58 de 60 edificios tenían el mecanismo y ninguno se movió. «Inercia por construcción» solo vale
    como explicación porque predice el caso contrario — un origen que COMPARTA arista con una puerta
    candidata SÍ tiene que cambiar.* ⇒ **Toda causa propuesta se acompaña del experimento que la
    mataría**, y si no se le encuentra ninguno, se queda en `CAUSA NO CONFIRMADA` (leyes 147 y 153).

156. ⭐⭐⭐ **CUMPLIR LA LEY 150 NO PROTEGE DE LA LEY 4 — Y LAS DOS MITADES VAN PEGADAS SIEMPRE.**
    *Declarar la cobertura de un guardián sobre el modelo no dice nada sobre si sabe disparar dentro
    de ella. `CAMBIA SIN PASO = 0` con un 6,7 % de cobertura era indistinguible de un detector roto,
    y solo valió cuando se provocaron los dos veredictos a propósito.* ⇒ **Un cero se publica con
    dos cosas o con ninguna: SU COBERTURA y SU PROVOCACIÓN.**

157. ⭐⭐⭐ **UNA ETIQUETA NO MIENTE EN SU DEFINICIÓN: MIENTE EN SU LECTURA — Y NADIE LEE LAS
    DEFINICIONES.**
    *`ACERA` significaba «por aristas de tipo acera» y estuvo cuatro tandas leyéndose como «por la
    acera correcta», incluida por quien la escribió.* ⇒ **El nombre de un veredicto es una
    afirmación**, y se audita como tal: ⭐ **la prueba es si un lector que solo ve la etiqueta puede
    concluir algo que el instrumento no sabe.** *Corolario, del mismo día: `CRUZA CALLADO` acusaba
    de cruzar a quien solo doblaba una esquina.*

158. ⭐⭐⭐ **UN CRUCE QUE NO CUADRA PUEDE SER UNA POBLACIÓN MAL PUESTA, NO UN DATO EN CONFLICTO — Y
    «CORREGIRLO» METE UNA CONTRADICCIÓN INVENTADA.**
    *La mediana de las paradas de tranvía a su bus daba 66 m sobre 48 y 73 m sobre 50: el máximo de
    418 son las dos de Juslibol, fuera del radio. Publicar «66 contra 73» habría fabricado un
    conflicto que no existe.* ⇒ **Antes de declarar que dos medidas se contradicen, se comprueba que
    miden la MISMA población** (hermana de la 154, y del mismo día que la 139).

159. ⭐⭐⭐ **UN COCIENTE EXIGE QUE LAS DOS MEDIDAS UNAN LOS MISMOS PUNTOS — Y UNA FÓRMULA NO DECLARA
    SU POBLACIÓN, ASÍ QUE SOBREVIVE A LA MUDANZA EN SILENCIO.**
    *El rodeo nació sobre portales (hueco al grafo 5,3 m) y al mudarse a paradas siguió calculando:
    la ruta unía enganches y la recta unía paradas. Cuatro puntos, no dos.* ⇒ ⭐ **Cuando un
    instrumento cambia de universo, el que hay que revisar primero es el que NO dio error.**
    Corolario: **una tolerancia relativa esconde la resolución del dato** — `0,999` pedía 1,3 cm a
    un número redondeado a 10.

160. ⭐⭐⭐ **UNA PREDICCIÓN SE EVALÚA POR SU MECANISMO, NO SOLO POR SU INTERVALO.**
    *`sin-eje` cayó dentro de la banda predicha con el razonamiento invertido: se esperaba por debajo
    «porque el tranvía empuja hacia el eje» y salió por encima.* ⇒ **Acertar la banda con la razón
    equivocada no es acertar**, y contarlo como acierto convierte el sellado de predicciones —que es
    el mejor instrumento antisesgo del proyecto— **en una lotería con acta notarial.**

161. ⭐⭐⭐ **UN LÍMITE ESCRITO EN EL README NO PROTEGE A NADIE: QUIEN CONSULTA UN DATO NO LEE EL
    README.**
    *Los seis límites de H2a viajan DENTRO del artefacto, con el dato al que afectan, y cada uno con
    su `A.exige`.* ⇒ **Un límite sin guardián es una intención**, y un límite lejos de su dato es una
    coartada. ⭐ **Y tiene precio medido: 19,4 KB de 491 — lo que cuesta no mentir.**
    ⚠️ Corolario del caso L1: **sin las 172 paradas invisibles dentro, una consulta devolvería una
    lista vacía — y una lista vacía es indistinguible de «no hay transbordo».**

162. ⭐⭐⭐ **UN GUARDIÁN DE TEXTO ESCRITO DESDE LA FRASE QUE SE TE OCURRIÓ VIGILA TU FRASE, NO LA
    PROHIBICIÓN — SE ESCRIBE DESDE EL NÚCLEO DE LO PROHIBIDO.**
    *`/\bel m[áa]s r[áa]pido\b/` no caza «el transbordo más rápido»: una palabra en medio y el
    guardián calla.* ⚠️ Y su límite estructural: **un detector de promesas no distingue una promesa
    de su negación**, así que vigila datos y no prosa.

163. ⭐⭐⭐ **UN GUARDIÁN DE FORMA NO ES UN GUARDIÁN DE VIGENCIA: COMPROBAR QUE UNA FECHA VIAJA NO ES
    COMPROBAR QUE NO HA PASADO.**
    *`fin === '20261005'` seguirá siendo cierto el 6 de octubre, y todo seguirá en verde.* ⇒ **Todo
    dato con caducidad necesita DOS guardianes: uno que exija que la fecha esté, y otro que la
    compare con hoy.** ⭐ *Y este caso tiene un mérito raro: es el primer instrumento del proyecto
    catalogado **antes** de mentir — con fecha y con 55 días de aviso.*

164. ⭐⭐⭐ **UNA COLUMNA DE RECUENTOS TIENE QUE SIGNIFICAR LO MISMO EN TODAS SUS FILAS — Y LA QUE
    MEZCLA POBLACIONES NO SE VE MIRANDO LA TABLA, PORQUE LAS OTRAS LA ARROPAN.**
    *«52 rutas» era el recuento del bus en la columna del total: el tranvía quedó fuera de su propio
    recuento, y las otras siete filas eran correctas.* ⇒ **Una tabla no se audita fila a fila: se
    audita preguntando de qué población es CADA celda.**

165. ⭐⭐⭐ **UN VEREDICTO QUE DEPENDE DEL RELOJ NO SE PUEDE CONGELAR EN UN ARTEFACTO.**
    *Un `dentro-del-periodo` horneado hoy diría lo mismo en noviembre.* ⇒ **Lo que viaja son las
    FECHAS y la REGLA; el estado se recalcula al servir.** ⚠️ Y su corolario incómodo: **es el único
    instrumento del proyecto que es función del fichero Y del reloj**, así que **un reloj mal puesto
    produce un veredicto falso indetectable desde dentro** — cotejarlo con la fecha del ZIP caza el
    atrasado y **no caza el adelantado**.

166. ⭐⭐⭐ **UN ROJO QUE DURA UN MES ENSEÑA A IGNORARLO — POR ESO HAY AVISOS QUE NO DEBEN FALLAR.**
    *`se-acaba` avisa treinta días y no rompe la batería, a sabiendas de que el coste es enterarse el
    día del rojo y no el del aviso.* ⇒ **La severidad de un guardián se elige por cuánto tiempo va a
    estar encendido**, no solo por la gravedad de lo que vigila. ⛔ *Y la decisión se escribe con su
    coste, o al mes siguiente parece un descuido.*

---

## 9 · Plan de construcción y mapa de tandas

### ⭐⭐ Los tres hitos

**Vocabulario:** una **tanda** es la unidad de trabajo con punto de aprobación. Un **hito** es el
conjunto de tandas que deja algo **cerrado y demostrable por sí solo**.

| | Hito | Objetivo | Cierra cuando… |
|---|---|---|---|
| **H1** | **El terreno** | El grafo peatonal, construido y correcto. Sin transporte ninguno | De un portal a otro **andando**, y la ruta es correcta: por acera, cruzando por donde se cruza, sin atravesar manzanas ni ríos |
| **H2** | **La red** | Paradas, líneas y transbordos encima del terreno. **Sin reloj** | Sabe que el 29 conecta A con B, y compone a pie + bus + tranvía + BiZi |
| **H3** | **El reloj** | Horarios, calendarios y búhos | *"El 29 ya no pasa a esta hora; tienes el N4."* Y sabe distinguir laborable, sábado, domingo y festivo |

> ⭐⭐ **LA REGLA QUE JUSTIFICA EL ORDEN: un hito no empieza hasta que el anterior está cerrado y
> es verificable por sí solo.**
> Si el reloj entra antes de tiempo, **cada fallo del grafo aparece disfrazado de fallo de
> horario** y se depura en el sitio equivocado durante semanas. Es la ley de Turnia —*primero lo
> que no puede fallar, luego lo que se ve*— aplicada a la escala del proyecto entero.

**Transversales — no son un hito, atraviesan los tres:**
- **La descarga propia del GTFS**, desde el diseño (el feed muere el 05/10/2026).
- **La interfaz**, que se construye contra lo que el motor YA sabe hacer, nunca por delante.

### H1 · El terreno — sus puntos

Desglosado porque su contenido está fundado en lo que ya se sabe:

1. Descargar la red de OSM de toda la ciudad (geometría base, D0) y `MU1_jerarquia_viaria`
   completa (atributos y verificación).
2. ⭐ **Planarizar**: partir cada tramo en sus intersecciones (**89** puntos de cruce detectados en
   la muestra — ⚠️ *9/08: decía 106, desmentido por §7·17*), y usar tolerancia pequeña (~2 m)
   **solo** para las puntas sueltas.
3. ⚠️ **Resolver los niveles.** Sin campo de cota, planarizar fusiona pasos elevados con la calle
   de debajo. La pista está en OSM (`bridge`, `layer`). **Riesgo de corrección nº1.**
4. Enganchar los 46.150 portales **por proximidad**, con el `codigoVia` como **salvaguarda**:
   marca y cuenta la discordancia, no la corrige (D0).
5. Transportar los atributos municipales (sentido, velocidad, peatonalidad) a la geometría OSM,
   **declarando la procedencia de cada uno** y contando lo que no case. ODbL declarada.
6. ⭐ **Verificar conectividad de verdad**: que no queden trozos de ciudad incomunicados. Los
   puentes sobre el Ebro, el Huerva y el Gállego son los puntos de fallo de mayor impacto — un
   puente sin coser parte la ciudad en dos y el motor responde *"no hay camino"*.

### H2 y H3 — sin desglosar, y a propósito

Tienen **objetivo y criterio de cierre**, no puntos. Su contenido real depende de lo que salga de
H1: si el planarizado destapa que la geometría está peor de lo medido —**solo se midió el 4,4 % de
la red**—, H2 cambia de forma entera.

⚠️ **Desglosarlos hoy sería enumerar sin verificar**, que es exactamente la ley que este proyecto
acaba de aprender a su costa (§8·3). Y un plan detallado a tres hitos vista es un plan que se
incumple y que después nadie se atreve a tocar porque *"estaba escrito"*.

### Mapa de tandas

| | Tanda | Hito | Estado |
|---|---|---|---|
| **0.A** | Reconocimiento del dataset heredado | — | ✅ |
| **0.B** | Reconocimiento de 003_ZETABUS (solo lectura) | — | ✅ |
| **0.C** | Fuentes en red del Ayuntamiento | — | ✅ |
| **0.D** | Barrido exhaustivo: 178 capas, 709 conjuntos, 11 zonas | — | ✅ |
| **1** | Andamiaje: git público, `.gitignore`, hook, README, licencia | — | ✅ **publicado**, 11 commits |
| **2** | ⭐ El diseño en papel del grafo (912 líneas, 6 preguntas) | **H1** | ✅ |
| **2.B** | Medir el falso negativo de la regla de nivel (Huesca + Delicias) | **H1** | ✅ **invirtió la decisión** |
| **2.C** | Cerrar el capítulo del nivel (Alierta + Pirineos + plataforma) | **H1** | ✅ **volvió a invertirla** |
| **3** | Cobertura de OSM contra las 3.359 vías municipales | **H1** | ✅ |
| **4** | ⭐ **Los portales como testigos** (idea de Antonio) | **H1** | ✅ **dos imposibles caídos** |
| **5** | Auditoría del 4,11 % — ¿es cierto el número publicado? | **H1** | ✅ **el instrumento auditor se encontró a sí mismo** |
| **6** | Las farmacias: ¿qué hay de verdad en el conjunto heredado? | **H3** | ✅ |
| **7** | Las guardias (¿calendario o consulta viva?) + `00 ZGZ RADAR` | **H3** | ✅ **es calendario** |
| **8** | ⭐ **El primer grafo** — adenda al diseño + planarizado de una zona | **H1** | ✅ **primera tanda con código** |
| **9** | ⭐ **Mirar el grafo con los ojos** — visor de inspección | **H1** | ✅ |
| **10** | ⭐⭐ **Zaragoza entera** — 98.774 aristas, los ríos no parten el grafo | **H1** | ✅ |
| **11** | ⭐ **Los portales entran en el grafo** + `proposed` fuera | **H1** | ✅ |
| **12** | Cerrar H1: el grafo equivocado, el centroide, los pasos condicionales | **H1** | ✅ |
| **13** | ⭐⭐ **El punto ciego** — la capa municipal completa como tercer testigo | **H1** | ✅ **cerrado** |
| **14** | Los últimos cabos: `entrance=*`, los 198, los 1.592 | **H1** | ✅ |
| **15** | ⛔ **El orden de los números** — cuarto testigo, probado y descartado | **H1** | ✅ |
| **16** | ⭐ **Ver las rutas** — texto salto a salto + visor de rutas | **H1** | ✅ **«están las 7 perfectas»** |
| **17** | Nombrar aceras con los portales — capa de prueba | **H1** | ✅ |
| **18** | La capa municipal de carriles bici | **H1** | ✅ |
| **19** | ⭐⭐ **El modelo vía · forma · papel** | **H1** | ✅ |
| **20** | ¿Dónde falta el nombre, de verdad? | **H1** | ✅ |
| **21** | ⭐ Poner los nombres y simplificar el itinerario | **H1** | ✅ |
| **22-24** | El mapa de dos colores, y dos divergencias mapa↔motor | **H1** | ✅ |
| **25** | ⭐⭐ **La calle que va pegada** — segundo testigo | **H1** | ✅ **+11.267 líneas** |
| **26** | ⭐ **Un paso de cebra no tiene nombre** — gris | **H1** | ✅ |
| **27** | Las isletas, y la teoría de los parques | **H1** | ✅ |
| **28** | El verde en el mapa | **H1** | ✅ |
| **29** | ⭐⭐ **¿Qué comprobación ha visto su rojo?** | **H1** | ✅ **6 de 198** |
| **30** | ⭐⭐ Congelar los números publicados | **H1** | ✅ |
| **31** | ⭐ Cerrar los rojos | **H1** | ✅ **de 5 a 0** |
| **32** | ⭐⭐ **¿A qué acera engancha cada portal?** | **H1** | ✅ |
| **33** | ⭐ Dos aceras, dos calles — el buscador respeta la paridad | **H1** | ✅ |
| **34-36** | Los tres listones, el tope de adelanto y el centinela | **H1** | ✅ |
| **A** | ⭐⭐ **AUDITORÍA DE CIERRE · el código** | **H1** | ✅ **4 vivos + `D5` ascendido** |
| **B** | **AUDITORÍA · la documentación contra el dato de hoy** | **H1** | ✅ **3 vivos · 13 superados · 5 deudas** |
| **B.2** | ⭐⭐ **AUDITORÍA · el contraste** — el mapa de las 2.062 | **H1** | ✅ **3 vivos · 10 superados. Contrastadas 38 (1,8 %)** |
| **C** | ⭐⭐ **AUDITORÍA · las decisiones y los ejes** | **H1** | ✅ ⛔⛔ **retira `B·V1`: era un rojo FALSO** |
| **Ar 1 · 1·bis** | ⭐⭐ El instrumento — el centinela y sus hermanos | **H1** | ✅ **la predicción acertó 6 de 6** |
| **Ar 2 · 2·bis** | ⭐⭐ El clon y la portada · la batería ya cuenta | **H1** | ✅ **58 de 58 · `B·V2` era FALSO** |
| **Ar 3** | ⭐⭐ El puntero y el latido | **H1** | ✅ **37 pares en 16 documentos** |
| **Ar 4** | ⭐⭐⭐ **La velocidad estándar** — disuelve el eje de la nº7 | **H1** | ✅ `VELOCIDAD_KMH = 5,0` |
| **Ar 5** | Las republicaciones | **H1** | ✅ **22 pares · el latido no pasó a verde solo** |
| **Ar 6** | ⭐⭐⭐ El latido lee — **y Antonio sale a andar: la nº8** | **H1** | ✅ |
| **Ar 7** | ⭐⭐ La portada cuenta la auditoría · **rutas nº9 y nº10** | **H1** | ✅ **4 de 5 bandas, medidas** |
| **—** | ⭐⭐ **H1 CERRADO** *(el diario de A→Ar7 vive en §10, no aquí)* | **H1** | ✅ **9/08** |
| **H2·1** | ⭐⭐⭐ **RECONOCIMIENTO DEL GTFS** — bajado con código propio y contado | **H2** | ✅ **10/08** ⛔ **el transbordo NO viene** |
| **H2·2** | ⭐⭐ **LA HERENCIA DE 003** — datos, decisiones y maquinaria | **H2** | ✅ **10/08** ⚠️ **de ENRUTADO de transbordo, nada que heredar** *(corregido por H2·3)* |
| **H2·3** | ⭐⭐⭐ **LAS VALLAS Y LOS CABOS** — cuatro verificaciones de solo lectura | **H2** | ✅ **10/08** ⛔ **la valla estaba en la REGEX, no en la frase** |
| **H2·4** | ⭐⭐⭐ **EL DISEÑO EN PAPEL de H2a** — `docs/DISENO-H2A-RED.md` | **H2a** | ✅ **10/08** ⭐ **2.538 pares, no 483.636** |
| **H2·5** | ⭐⭐⭐ **LOS POSTES EN EL GRAFO** — la medición que podía tumbar D4 | **H2a** | ✅ **10/08** ⭐ **el radio SOBREVIVE** |
| **H2·6** | ⭐⭐⭐ **LA RED DE BUS Y EL VEREDICTO POR ENLACE** | **H2a** | ✅ **10/08** ⛔⛔ **78,4 % de los enlaces van por EJE** |
| **—** | ⭐⭐ **TANDA CORTA · ¿está contaminado el rodeo de las cortas?** | **H1** | ✅ **10/08** ⭐ **SOBREVIVE ENTERO** |
| **Ar 8** | ⭐⭐⭐ **`insertar` Y LA MISMA ARISTA** — se reabre H1 por una rendija | **H1** | ✅ **11/08** ⭐ **las diez rutas, quietas** |
| **H2·7·P1** | ⭐⭐⭐ **EL LADO DE LA ACERA** — el veredicto deja de mentir | **H2a** | ✅ **12/08** ⛔ **el `ACERA` se desinfla** |
| **H2·7·P2** | ⭐⭐⭐ **LOS 2.538 ENLACES**, con el veredicto en dos campos | **H2a** | ✅ **11/08** ⭐ **andando ÷ volando = 1,3×** |
| **H2·7·P3** | ⭐⭐ **QUÉ SE PUBLICA Y CÓMO NO MENTIR** — los seis límites | **H2a** | ✅ **11/08** ⭐ **19,4 KB cuesta no mentir** |
| **H2·7** | ⭐⭐⭐ **EL TRANSBORDO ANDANDO — LA PIEZA. COMPLETO.** | **H2a** | ✅ **11/08** |
| **9** | ⭐⭐⭐ **LA CADUCIDAD Y LA REPETIBILIDAD** — el guardián de vigencia | **H2a** | ✅ **11/08** ⭐ **rojo con el reloj movido** |
| **H2·8** | *(siguiente: **el tranvía** — casi gratis si el modelo está bien)* | **H2a** | ⬜ |
| **H2b** | *(después: **la red ciclable y las estaciones BiZi**)* | **H2b** | ⬜ |

### 0.A — El dataset heredado (2/08)
46.150 portales WGS84 con `codigoVia`, geocodificador ya escrito, y **cero aristas, cero paradas,
cero GTFS**. La trampa: `vias-zaragoza.json` pesaba 1 MB, se llamaba "vías", y no tenía una sola
coordenada.

### 0.B — Los datos de transporte (2/08)
El GTFS 1176 tiene **todo**: 984 paradas (bus **y tranvía**), `shapes.txt` con 89 trazados sanos y
cero huérfanos, 870.717 horarios. Y las cuatro piezas de más valor de 003 **están gitignoreadas**:
no existen en un clon.

### 0.C — Las fuentes en red (2/08)
**El bloqueo se rompe**: 178 capas por WFS, licencia que permite redistribuir, sin registro. Y el
matiz que parecía cambiarlo todo —"geometría sí, topología no"— que resultó estar mal apuntado.

### 0.D — El barrido exhaustivo (2/08)
75 peticiones de 150 presupuestadas. Aparece `MU1_jerarquia_viaria`, se corrige la conclusión de
la 0.C, y se confirma que la red peatonal municipal existe pero **no se publica**.

### 1 — El andamiaje (2/08)
Barrido de sensibilidad **antes** del `git init`. Identidad verificada contra el disco. Once commits atómicos. Y dos instrumentos cazados en el proceso (§7 · 15 y 16).

### 2 — El diseño en papel del grafo (2/08)
912 líneas. Seis preguntas respondidas, cinco decisiones elevadas. ⭐ Y de paso, **tres números
publicados en los informes anteriores desmentidos por remedición** (§7 · 17 y 18). Aparece también
lo que nadie había medido: el municipal **sí** tiene señales de desnivel, y midiendo extremo contra
**línea** (no contra extremo) la red está mucho mejor conectada de lo que se creía — 17,2 % ya se
tocan, mediana 5,10 m.

### 2.B — La regla de nivel, medida (2/08)
Dianas de conocimiento de campo de Antonio: **Carretera de Huesca** (control positivo) y
**Avenida Ciudad de Soria / Estación Delicias**. ⭐ **La zona elegida como control positivo fue la
que tumbó la regla**: 4 falsos positivos, 0 aciertos. Y aparece un caso estructural que el diseño
no contemplaba: **la plataforma elevada de Delicias**, 90 ways a `layer=2` — el desnivel no como
excepción puntual, sino como estado normal del terreno.

### 2.C — Cerrar el capítulo del nivel (2/08)
Dianas nuevas: **Cesáreo Alierta × Camino de las Torres** (paso inferior — la única que podía
refutar) y **Avenida Pirineos**. ⛔ **La parada saltó donde estaba prevista**: la regla habría
cortado **634 uniones reales de 7.114 cruces** para evitar 2 errores. Le faltaban dos cláusulas, y
**las dos salieron de contar, no de razonar**. Resultado: 634 → 0, y 113 de 115 desniveles
cazados.

---

### 3 — ¿Cuánta ciudad se pierde con D0? (2/08)
Barrido completo de las 3.359 vías contra OSM. ⭐ **Y la contraprueba que cambió el método de este
proyecto: el callejero movido 2 km al norte seguía dando 58 % de cobertura** — el instrumento medía
densidad urbana, no correspondencia. Instrumento v2 (5 m + paralelismo ±30°): señal 92,2 % contra
azar 5,0 %. **Veredicto: D0 se sostiene.**

### 4 — Los portales como testigos (2/08)
⭐⭐ **Idea de Antonio.** Dos cosas que el diseño daba por imposibles resultaron posibles (§4), y
**dos de mis conclusiones cayeron**. Y un instrumento roto que las contrapruebas firmaron: siete
Plaza de España cosidas en un objeto de 20 km.

### 5 — ¿Es cierto el 4,11 %? (2/08)
La auditoría vino a revisar el número de la tanda 3 y **se encontró a sí misma**: el que fallaba
era el instrumento de la tanda 4, por **un metro**. El 4,11 % era correcto y ligeramente
pesimista. ⭐ Y sale la tabla de **los nueve ejes por los que un instrumento puede fallar**
(§8·24), que deja de ser anécdota y pasa a ser checklist.

### 6 y 7 — Las farmacias y las guardias (2/08)
De un comentario de Antonio sale **el momento oro** (§10). Las guardias existían **de rebote** —una
URI con la fecha incrustada, caducada hacía 82 días— y la fuente real estaba en el código sin
llamarse nunca. **Es un calendario**, así que se hornea y no rompe la exclusión del tiempo real.
⭐ Y `00 ZGZ RADAR` —carpeta que nadie miró en once tandas— resultó tener las paradas de autobús:
**la memoria de Antonio era correcta y el reconocimiento buscó donde yo le dije.**

### 8 — El primer grafo (3/08) · ⭐ PRIMERA TANDA CON CÓDIGO
3,24 km², 5.121 nodos, 7.175 aristas, 20 componentes con el 99,1 % en la mayor. **Solo 6 uniones
sin evidencia** en toda la zona —lejísimos del umbral que habría obligado a revisar D1— y de 49
cruces sin nodo compartido, **43 son desniveles declarados**: *la regla no inventa separaciones,
lee las que el dato trae*. El **40 % de las aristas son acera o paso de peatones**: el nivel 2
justificándose solo.
⭐ Y el eje **ESCALA**, medido por primera vez: **la mitad de las aristas miden menos de 10 m**, y
la tolerancia de D5 es del mismo orden que 800 de ellas.

### 9 — Mirar el grafo con los ojos (3/08)
El visor cazó **dos fallos antes de pintar nada** (§7 · 34 y 35). Y en la inspección: **ningún fallo
del grafo**. Los 6 `unido-por-defecto` correctos —cuatro son el Coso **en obras**, así que *ese
contador es una foto de agosto, no una propiedad del casco*—; los 43 no unidos aciertan donde
importa —el Andador de Mario Gaviria pasando **por debajo** del Puente de Piedra—; y de las 19
islitas, **cinco eran artefactos del borde**, incluida la de 1.004 m que habría disparado la
costura.
⭐ Lo que sí salió fue **una categoría entera que ningún dato iba a enseñar**: los pasos
condicionales (§10).

### 10 — Zaragoza entera (3/08)
De 3,24 km² a 973,8. **98.774 aristas en 6,5 segundos.** ⭐⭐ **Los ríos NO parten el grafo**: 36 de
36 pares sorteados (semilla declarada) cruzan el Ebro, el Huerva y el Gállego, y **28 de 32 puentes
con nombre son cruzables a pie** — los 4 que no son autovías, correctamente excluidas.
⭐ Y el eje **DENSIDAD**, medido por primera vez, explicó el 47,2 % de `eje-de-calzada` sin que
hubiera que tocar nada.
⛔ Tres hallazgos que no se arreglaron en la misma tanda **a propósito** —cambiar la regla y la
escala a la vez invalidaría la comparación—: las `proposed`, los tres barrios rurales, y que el
contador de pasos condicionales se queda corto.
⭐ **Y las cuatro puntas sin soldar las verificó Antonio una a una sobre el terreno.** Cuatro de
cuatro correctas.

### 11 — Los portales entran en el grafo (3/08)
El punto 4 de H1: **46.026 portales enganchados**, `proposed` fuera (**la lista convertida en
regla**), pasos condicionales marcados y caminos de tierra inventariados. ⭐ Y las **siete rutas de
Antonio** se ejecutan por primera vez.

### 12 — Cerrar H1 (3/08)
⭐⭐ **El hallazgo lo destapó una pregunta de curiosidad de Antonio** —*¿por qué la ruta 7 pasa por
Juslibol?*—: `ruta.js` miraba el **grafo del casco** y devolvía un **rodeo de 0,884**, físicamente
imposible, dentro de un JSON impecable. Y tenía **dos causas**, no una.
⭐ Y el orden obligatorio C→D destapó que **la premisa que justificó una decisión era un
artefacto**: Delicias no la arreglaron los pasos condicionales, la arregló el centroide.

### 13 — El punto ciego (3/08)
Se descarga la capa municipal completa como **tercer testigo, independiente de OSM**, y **el punto
ciego se cierra: el enganche SÍ acierta** donde nadie vigila.
⭐ Con el confusor localizado y neutralizado —*el −14,4 en bruto era geografía*— y el límite
declarado: **el veredicto vale para la ciudad urbana, no para el término.**
⛔ Y sale un patrón que ya no es anécdota: **tres comprobaciones degradadas en tres tandas
seguidas, todas por pasar por construcción** (§8·47).

### 14 — Los últimos cabos (3/08)
`entrance=*` aplicado. ⛔ Y el ejecutor **se pilló a sí mismo**: la tanda 13 midió las puertas con
una regla que el motor no usa, **con la advertencia impresa dos pantallas más arriba**.
⭐⭐ Y cae una conclusión mía: **los 198 no son inocentes.**
⭐ Y los 565 urbanos sin testigo resultan estar **apilados en 28 vías**, no repartidos.

### 15 — El orden de los números (3/08) · ⛔ idea probada y descartada
**Idea de Antonio**, y correcta: caza el 70,8 % del portal descolocado **cuando está solo**. Pero
es **ciego por aritmética** al fallo que arrastra vecinos, y **el número de portal no identifica**
(147 portales llamados «31» en la misma vía).
⭐ Lo mejor de la tanda no es el veredicto: es que **el arnés de prueba estaba roto y decía 44 %**,
y lo delató **el álgebra que el propio ejecutor había escrito ocho horas antes**.

**⭐⭐ Con esto, H1 queda terminado en lo que se puede terminar hoy.**

### 16 — Ver las rutas (4/08) · ⭐⭐ la primera verificación con los ojos
Texto salto a salto y visor de rutas. **Antonio las miró una a una:** *«están las 7 rutas
perfectas. Literalmente se me han caído los ojos al suelo.»* Y cerró tres cabos sobre el terreno,
incluido el carril bici de 1.269 m: *«es carril bici a misma cota que acera, pegado»* ⇒ **la
calibración de ~6 km/h se sostiene.**
⚠️ **SUPERADO (tanda de arreglo 4, 8/08):** aquella calibración **ya no rige**. `VELOCIDAD_KMH = 5,0`
es la estándar de OSRM/Valhalla y **la nº7 no calibra nada**. *La frase se conserva porque fue cierta
y es registro: se marca, no se reescribe* (ley 86).

### 17-18 — El método de los portales y la capa de carriles bici (4/08)
El método se prueba (77 % de acierto) y la capa municipal aparece con **el tipo al 100 % y el
`codigoVia` al 100 %**.

### 19 — El modelo vía · forma · papel (4/08)
⭐⭐ **Antonio destapa la suposición escondida:** el papel depende del modo, no de la línea. Y **el
ejecutor rebate el enunciado con un argumento mejor**: `forma` son dos campos, no uno.
⭐ **Las siete rutas, idénticas al milímetro.**

### 20-21 — Dónde falta el nombre, y ponerlo (4/08)
⭐ Antonio **le da la vuelta a la pregunta**: no *«¿cuántas líneas tienen nombre?»* sino
*«¿tienen nombre las líneas por donde hay PORTALES?»* — y con una definición sin umbral que
discutir: *donde no hay puntos, no es ciudad consolidada.*
⭐ Y **el itinerario se simplifica**: la ruta 7, de 20 pasos a 12.

### 22-24 — El mapa de dos colores, y dos divergencias (4/08)
⭐ Antonio pide **un mapa simple: azul con nombre, rojo sin nombre**. Y mirándolo destapa **dos
fallos reales**: `ruta.js` corría sin modelo por una dependencia circular, y **el mapa y el motor
decían cosas distintas de 774 líneas**.
⚠️ Y una tercera cosa que no era un fallo del dato sino **del dibujo**: el rojo grueso tapaba el
azul fino.

### 25 — La calle que va pegada (4/08)
⭐⭐ **Segunda idea de Antonio, y la mejor de las dos:** cruzar los portales con **la calle con
nombre que va pegada a lo largo**. **+11.267 líneas con nombre**, y el mapa cambia de cara: **el
continuo urbano queda azul y el rojo se retira a autovías, polígono y campo.**

### 26 · 27 · 28 — El mapa dice cuatro cosas (5/08)
⭐ **Dos ideas de Antonio, las dos correctas y las dos medidas**: los pasos de cebra **no tienen
nombre ni deben tenerlo** (y llevaban 3.786 puestos por nosotros), y **las manchas rojas son
parques**.
⭐ Y el ejecutor **recomendó NO aplicar la segunda como definición**, con el daño contado: el
criterio se llevaría por delante hasta 1.661 líneas que **sí tienen nombre**, incluidas 181 aceras.
⇒ **El verde es color, no definición.**

### 29 — ¿Qué comprobación ha visto su rojo? (5/08) · ⭐⭐ la tanda más incómoda
**De 198 comprobaciones censadas, solo 6 tenían el rojo visto.** **182 líneas imprimían `⛔`/`✅` y
no paraban nada.**
⚠️ **El 182 es de la tanda 29 y NO es la cifra de hoy: su propio instrumento
(`auditoria-guardianes.js` §A1b) da 232** (`B2·V3`, 7/08). ⭐ **Y con eso se cierra un `NO CONSTA`
del bloque A**, que no había podido reproducirlo porque buscó con otro instrumento.
⛔ **Tres números distintos rondan esta misma pregunta y NO se mezclan:** **198** *comprobaciones*
censadas (tanda 29) · **182 → 232** *líneas que imprimen un veredicto sin alarma cerca*
(`auditoria-guardianes.js`) · **297** en 37 scripts, que significa *«37 scripts no se pueden leer
por su código de salida»*, **no «297 fallos»** (bloque A, otro instrumento).
⛔ Y encontró **un número publicado sin nada que lo proteja** y **un guardián que nunca pudo hacer
lo que decía**.
⭐⭐ **Y la séptima forma de mentir** (§8·61), que es la peor: *distinguir los extremos y no el
medio*.
⚠️ Y el auditor **se pilló a sí mismo**: cinco de sus diez mutaciones no llegaron a ocurrir, y sin
control **se habrían publicado como cinco hallazgos falsos que confirmaban la tesis de la tanda**.

### 30 — Congelar los números publicados (5/08)
**20 números congelados. Antes había UNO en todo el proyecto.**
⭐⭐ Y la rotura pequeña enseñó por qué hacía falta: **quitar las isletas devuelve el reparto a un
estado que estuvo PUBLICADO el día antes** — plausible, real, y que nada habría notado.

### 31 — Cerrar los rojos (5/08)
**De cinco rojos vivos a cero.** El hook arreglado (7 de 7, incluidos los tres falsos positivos —y
**uno castigaba justo lo que `CLAUDE.md` exige**), el guardián del nº105 rehecho con su rojo **y**
su verde, y **dos números caducados republicados y congelados**.
⭐⭐ **Y los congelados de la 30 avisaron el mismo día**: un cambio de regla movió el mapa 63 líneas
y saltaron siete filas en rojo. *Un día antes habría pasado en silencio.*

### 32 · 33 · 34 · 35 · 36 — El buscador por paridad (6/08)
⭐⭐ **Antonio mira el mapa y ve que la ruta 1 arranca a 200 m del portal.** De ahí salen cinco
tandas: el fallo, la regla de paridad, los tres listones, **el centinela 99999** —que había
inflado el universo de medición de tres tandas— y el ajuste final del dial.
⭐ **Y el ejecutor corrigió a Antonio y a mí varias veces con datos**: los 150 m de *«enfrente»*
eran desfase, la previsión de pérdidas estaba mal por 848, y **el acantilado que justificó subir un
listón era el artefacto**.

### A — Auditoría de cierre de H1 · el código (6/08)
**Primer bloque de la auditoría. Cuatro hallazgos VIVOS y ninguno arreglado**, que es como debe ser:
la lista se decide entera al final.
⭐⭐ **El más incómodo es el README**: dice *«todavía no hay código»* con 24.931 líneas y un motor
funcionando — **en la portada pública de un portafolio público**.
⭐ **Y la frase que resume el bloque:** *de los cinco hallazgos principales, tres los encontró
código que ya estaba en el repositorio y que nadie ejecutaba. No hacía falta escribir nada nuevo:
hacía falta correr lo que había.*
## 10 · Cabos abiertos

### ⭐⭐ Los que bloquean el diseño

*(⭐ Cerrados el 2/08: **¿entran los horarios?** → sí. **¿dónde corre el motor?** → repartido.
Los dos en §5.)*

| Cabo | Qué hay que decidir |
|---|---|
| **El stack** | Ya condicionado por el reparto del motor: hace falta **algo que sirva consultas de horario**, no solo estático. ⚠️ Y ahí el hosting compartido de Hostinger tiene algo que decir: no es lo mismo servir ficheros que mantener un proceso vivo. *Cuando el hosting y tú discrepéis, gana el hosting.* Leaflet + OSM se reutiliza de 003 sin restar puntos: el diferencial de 004 está debajo del mapa |
| **El alcance v1 del buscador** | Cada casilla combinable duplica los casos a verificar: cuatro modos son 16 combinaciones, por dos criterios, 32. ⚠️ Y "menos transbordos" y "más rápido" son **objetivos que compiten**: optimizar los dos a la vez no da un óptimo, da un conjunto donde ninguna ruta gana en todo. Se puede resolver con una penalización por transbordo — pero entonces hay que **decir que es una preferencia cableada, no un óptimo** |

### ⭐⭐ LOS PASOS CONDICIONALES — categoría nueva (tanda 9, hallazgo de Antonio)

Existe un tipo de arista que **el dato no sabe describir**: tramos que **existen físicamente pero
solo se pueden usar a ciertas horas**.

**El caso que lo destapó:** una de las 19 componentes sueltas es un **pasaje que atraviesa el
edificio de Las Armas** (Plaza de Mariano de Cavia). El grafo lo tiene, y lo tiene bien — pero
**ese edificio no siempre está abierto**. Ningún dato lo dice. Y explica de paso por qué la
componente queda suelta: el pasaje está mapeado y la plaza es un área, no líneas.

⭐ **Lo encontró alguien que sabe que ese edificio cierra. Ningún barrido lo habría visto.**

**La clase, no el caso:** patios de manzana, galerías comerciales, parques que cierran de noche,
campus. Y **la etiqueta probablemente ya la vimos**: `tunnel=building_passage` salió en la tanda
2.C y entonces se dijo *"no es un túnel, a pie se pasa"* — **la clase estaba en el dato y no
supimos leerla.**

⭐ **Es el problema de las farmacias con otra piel:** *"existe"* no es *"está abierto ahora"*.

**DECISIÓN DE ANTONIO:**
> **Se IGNORAN para calcular rutas.** Un atajo perdido molesta; una puerta cerrada de noche te deja
> tirado.
> ⭐ **Pero se MARCAN y se CUENTAN**, como los `unido-por-defecto`. *El error aceptado a sabiendas
> tiene que ser contable* (ley 23): el error aceptado aquí es *"puede que estemos ignorando atajos
> que la gente usa"*.
> Con el grafo completo habrá un número: si son tres, la decisión fue evidente; **si son cuarenta,
> se reabre y ya no será a ojo.**
> Ventaja: si mañana se decide avisarlos en vez de ignorarlos, **el marcado ya está** y es un
> cambio de comportamiento, no una cirugía.

### ⚠️ CANDIDATOS APARCADOS — nada se decide hasta que H1 cierre

Salieron todos en una misma conversación (3/08) y **cada uno es defendible por separado. Juntos son
otro proyecto.** ⛔ Se aparcan **con nombre y fecha**, que es lo contrario de olvidarlos.

| Candidato | Qué es | Coste | Cuándo |
|---|---|---|---|
| ⭐ **Carril bici / red ciclable** | ⚠️ **NO es un extra: es la mitad de un modo YA DECIDIDO.** Una bici no va por la acera ni por las escaleras, y sí por el carril bici y la calzada. **El grafo pasaría a tener dos redes superpuestas con reglas distintas** | Alto, y **no evitable** si BiZi sigue dentro | **H2** |
| **Hospitales y más POI** | Destinos. **No tocan el motor** | Bajo | Cuando el terreno esté |
| ⭐ **Modo COCHE** | *"Puedo querer ir en coche a una farmacia de guardia que está lejos"* — y el argumento es bueno: **Google no te dice CUÁL está abierta**, así que pasar al navegador parte la experiencia justo cuando hay prisa | ⚠️ **El más caro.** Sentidos únicos · **giros prohibidos** (el coste depende de por dónde llegaste: cambio de estructura, no un atributo) · medianas · y el aparcamiento. **Y no suma al diferencial: calcular rutas en coche lo hace todo el mundo.** ⚠️ Un modo coche a medias produce rutas que un zaragozano detecta en diez segundos | Hito posterior |
| **Aparcamientos, zona azul/naranja** | Destinos — **pero solo tienen sentido SI entra el coche** | Bajo | Depende del coche |
| **Taxi** | ⚠️ **Rompe la estructura del grafo.** Una parada de taxi no es una parada de bus: el bus tiene recorrido fijo, **el taxi va a donde quieras**. No es añadir aristas, es *"desde aquí puedes llegar a cualquier sitio pagando"*. Y su coste depende del tráfico, que no tenemos | Alto y estructural | Sin fecha |
| **Zonas de bajas emisiones** | ⚠️ **NO CONSTA** que estén publicadas — pueden estar entre las 117 capas clasificadas sin abrir. **Sin coche no cambian ninguna ruta**; con coche son restricción real | Bajo | Depende del coche |
| **Zonas 30 / pacificadas / plataforma única** | ✅ **Ya las tenemos**: son ATRIBUTOS de `MU1_jerarquia_viaria` (`CALLE_Z30`, `PACIFICADA`, `plataforma`), no capas aparte. A pie casi no cambian nada; servirían como criterio de *comodidad* | Cero | Cuando haya criterio de comodidad |

⚠️ **Y la salida intermedia para la escena de la farmacia lejana, que cuesta poquísimo:** la app
resuelve **el "cuál"** —qué farmacia está abierta ahora, dónde, a qué distancia— y **si está lejos,
ofrece abrirla en el navegador del móvil**. No se finge calcular en coche: se reconoce que a esa
hora y a esa distancia el coche es lo razonable.

### Los técnicos

- ✅ **EL NIVEL — resuelto para OSM** (§5·D1, tres versiones y dos mediciones). ⚠️ **Abierto para
  el municipal**: ver P0 arriba.
- ⚠️ **2 cruces `footway`×`footway` sin marcar** en OSM. Son **escapados REALES**, no inferencias:
  el grafo peatonal *es* OSM. Medido: 2 de 4.137 = **0,05 %**, y los dos en el mismo punto entre
  ways de IDs casi consecutivos — **es un defecto, no dos**. No bloquea, pero se cuenta.
- ⚠️ **La plataforma elevada de Delicias.** La cláusula del nodo compartido la resuelve **en OSM**.
  ⛔ En la capa municipal, una plataforma elevada es **indistinguible de un cruce**.
- ⚠️ **`layer` no es entero** (`-1.5`) y **`tunnel=building_passage` no es un túnel**. Dos trampas
  de formato a manejar explícitamente.
- ⚠️ **Overpass: `CAUSA NO CONFIRMADA`.** Los 504 no se han reproducido a voluntad, y las dos
  hipótesis causales fueron refutadas. Vigilar en las descargas de H1.
- ⚠️ **Fechas de las réplicas.** Comprobar el sello de cada respuesta de OSM: una réplica puede
  servir datos de hace meses.
- ⭐⭐ **EL EJE ESCALA no está medido en NINGUNA tanda.** Una vía de 50 m tiene **2 puntos**
  muestreados a paso 25 m, y con 2 puntos un criterio de mayoría es una moneda. Es el hueco
  declarado de la tabla de nueve ejes (§8·24).
- ⚠️ **35.555 ways de OSM de 55.452 sin `highway` conocido.** El crudo solo trajo los que tienen
  `name`. Se cierra cuando toque descargar OSM de verdad en H1 — pide red.
- ⚠️ **163 de las 2.595 vías "encontradas" (6,3 %) apuntan a un nombre que corresponde a más de un
  objeto físico.** El texto acertó el nombre y **no dice cuál es**.

### ⛔ HALLAZGOS VIVOS DE LA AUDITORÍA — sin arreglar, se deciden al cerrar los tres bloques

⭐ **Registro:** `docs/auditoriafinal/A-CODIGO-2026-08-06.md` y `B-DOCUMENTACION-2026-08-07.md`.
⛔ **No se reescriben nunca** — lo que Antonio reclasifique después vive aquí, no allí.
⚠️ **Y la numeración manda desde el registro:** este documento la había renumerado y **se ha
corregido el 7/08.** *(Fue exactamente la clase de fallo que el bloque B audita.)*

| # | qué | dónde |
|---|---|---|
| ~~**A·V1**~~ | ✅ **ARREGLADO** en la tanda 1 (7/08) — apagado donde vive, no sobre una copia. *El hallazgo se conserva: la tabla registra qué se encontró, no solo qué queda* | `acera-equivocada.js` |
| **A·V2** | ⛔⛔ **Dos medidas del mismo universo divergen hoy** (50.986 vs 51.065): `codigoVia` contra núcleo de vía. **El congelado vigila uno de los dos** | `acera-equivocada.js` / `medir-paridad.js` |
| **A·V3** | ⛔ **Un número publicado infravalorado**: el *«16,9× el azar»* es **21,3×** limpio | `H1-PORTALES.md` §323 |
| **A·V4** | ⛔⛔ **El README dice que todavía no hay código** —ni una línea de aplicación—, con 24.931 líneas y un motor funcionando. **Y dos frases más:** *«no hay código que pueda fallar»* (144 entradas de bitácora) y *«no contiene ningún dato integrado»* (46.150 portales). ⭐ **No es registro histórico: es la puerta, y ahí sí se reescribe** | `README.md` |
| ⭐ **A·D5** | ⛔⛔ **UN CLON DEL REPOSITORIO PÚBLICO NO PUEDE EJECUTAR NI UN SCRIPT** — dos rutas absolutas a `E:/PROYECTOS WEB/…`. *(El registro de A lo anotó como **deuda D5**; **Antonio lo sube a VIVO el 6/08**.)* ⭐⭐ **Y el bloque B lo midió: 49 de los 70 ficheros de `src/` (70 %) no pueden correr en un clon**, y los 21 restantes son librerías que reciben la ruta por parámetro ⇒ **un clon no construye el grafo ni resuelve una dirección** | `portales.js:38-39` |
| ~~**B·V2**~~ | ⛔⛔ **RETIRADO el 7/08 — ERA FALSO.** *Ver «los dos rojos falsos» más abajo.* Decía que el README atribuía a una capa lo que estaba repartido en tres |
| **B·V3** | ⛔⛔ **Lo que el README promete no es verdad en un clon**, y **no lo menciona en ninguna línea**. ⭐ **Y lo afilado: los 48 comandos `node …` citados existen los 48.** No falta el fichero — está y no puede correr: el lector copia el comando y recibe un `ENOENT` sobre un disco que no es suyo | `README.md` |
| ⭐⭐ **B2·V1** | ⛔⛔ **EL DENOMINADOR APROBADO DEJA FUERA 12 DE LOS 26 CONGELADOS.** Aparecen **31 veces en `docs/` y ninguna marcada**; el control positivo (98.774 · 4.562) sale marcado 7 y 11 veces. Viven en celdas de tabla sin negrita. ⇒ **El censo v2 mide lo que el proyecto SUBRAYA, no lo que AFIRMA**, y con ello **toda cobertura declarada sobre 2.062** — en B y en B.2. ⛔ Propuesta del ejecutor: **no ampliar el censo** (el v1 ya enseñó adónde lleva) sino **declararlo por lo que es** y decir que su intersección con los congelados es de 13 | la definición de trabajo del bloque B |
| ~~**B2·V2**~~ | ✅ **ARREGLADO** en las tandas 1 y 1·bis — interpolado, no sustituido, y con sus tres hermanos del mismo veredicto. ⛔ **Un script recitaba un número que él mismo acababa de desmentir.** Línea 77 mide **412,7×**; línea 192 imprime **«400× el azar»** dentro del veredicto. ⭐ **El documento copió el bueno: el que miente es el script.** Es el nº144 con vuelta de tuerca — **vive en una cadena que se imprime, así que no parece un comentario: parece un resultado.** Sostiene el veredicto E7 de `H1-CIERRE.md` §433 | `sin-vigilancia.js:77/192` |
| **B2·V3** | ⚠️ **SOLO EN DOCUMENTOS — el instrumento ya interpola** (comprobado en la tanda 1: `grep '\b182\b' src/` no devuelve nada) ⇒ **es tanda 3.** El «182 líneas decorativas» es de la tanda 29; hoy su instrumento da 232, con siete tandas de código por medio — y este documento lo citaba en presente *(corregido el 7/08)*. ⭐⭐ **Cierra un `NO CONSTA` del bloque A**: el productor es `auditoria-guardianes.js` §A1b | `H1-AUDITORIA-GUARDIANES.md:20` |

### ⛔ SUPERADOS — trece números publicados y desmentidos, **ninguno con marca** (bloque B)

⭐⭐ **Y el hallazgo no son los trece: es el mecanismo que los produce.**

```
   citas entre documentos, HACIA ATRÁS                        40
   citas HACIA DELANTE                                        10
   ⛔ punteros hacia delante en los 5 documentos que un
      número congelado declara superados                       0
```

> **La convención «este documento se AÑADE, no reescribe nada» crea un puntero hacia ATRÁS y
> ninguno hacia DELANTE.** `H1-VERDE` sabe que actualiza a `H1-PARQUES`; `H1-PARQUES` no sabe que
> `H1-VERDE` existe. ⇒ **La cadena es navegable solo en la dirección en la que nadie la lee.**

⛔ **Y el precedente lo confirma:** la republicación *«3.166 → 2.669»* **existe** en
`H1-ROJOS-CERRADOS.md:359` y dice lo que dice — pero desde `H1-NOMBRES-Y-PASOS.md` **no se llega a
ella** (`grep -c` = 0). *Funcionó para el fichero y no para el lector.*

| documento | dice | hoy |
|---|---:|---:|
| `H1-VERDE.md` ×7 | 51.556 / 32.258 / 3.792 · 145,34 km · 4.405 | 51.493 / 32.310 / 3.803 · 145,94 · 4.424 |
| `H1-PARQUES.md` ×4 | 51.556 azules · 36.050 rojas · 4.055–4.405 | 51.493 · 36.113 · 4.424 |
| `H1-CALLE-PEGADA.md` | 56.864 azules | 56.801 |
| `H1-AUDITORIA-GUARDIANES.md` ×3 | el reparto de la tanda 29 | republicado en la 31 |
| `H1-NOMBRES-Y-PASOS.md` · `H1-DONDE-FALTA-EL-NOMBRE.md` | 3.166 · 11.742 puertas | **2.669** |
| `H1-ACERA-EQUIVOCADA.md` | 150.947 · 66.973 | 51.065 · 16.981 |
| `H1-PARIDAD.md` | dial 31.411 · «56 scripts» · «21 congelados» | 4.562 · 57 · 26 |
| ⭐⭐ `H1-LISTONES.md` ×4 | *«el dial predijo 31.411 y salieron 31.411 clavadas»* | **6.421** |
| `H1-PORTALES.md` §323 | «16,9× el azar» | 21,3× |

⭐⭐ **La fila que más pesa es `H1-LISTONES`:** es el cuadre que la tanda 35 demostró **en verde
sobre el artefacto del centinela**, y el documento lo sigue publicando como acierto del método.
✅ **La única que hizo lo que había que hacer:** `H1-TOPE-ADELANTO.md:164` publica 6.421 **y lleva
marca en su cabecera**.

### ⚠️ DEUDA de la documentación (bloque B)

- **BD1 · El puntero solo va hacia atrás.** No es error de ningún documento: **es la forma de la
  convención.** ⭐ *Trece filas son el mismo fallo trece veces; arreglarlas a mano garantiza la
  catorce.*
- **BD2 · `DISEÑO-H1-GRAFO.md` §P6.2 cita `data/excepciones-grafo.json` como fichero versionado y
  leído en cada regeneración. No existe.** Es una propuesta escrita en presente. ⚠️ **Y el diseño
  no marca en ningún sitio qué es descripción y qué es propuesta** — eso es lo que lo hace difícil
  de auditar.
- **BD3 · 16 rutas citadas que no existen**; ⭐ **14 son del proyecto heredado (001)** y en los
  `RECONOCIMIENTO-*` eso es legítimo — **pero nada en el texto lo distingue**.
- **BD4 · Tres informes crecieron después de publicarse** (`H1-PARIDAD` §G, `H1-ACERA-EQUIVOCADA`,
  `H1-DONDE-FALTA-EL-NOMBRE`). ⭐ Son **añadidos, no reescrituras** —la ley se respeta— pero el
  documento no dice que creció.
- **BD5 · Verificaciones publicadas que envejecen cada tanda y no están congeladas** («56 de 56
  scripts», «21 congelados»). ⭐ *De ahí sale el «69» del censo de A: era cierto el 6 a las 12:46.*

### ⭐ COBERTURA DECLARADA DEL BLOQUE B — y lo que queda abierto

```
   tokens numéricos en los 44 documentos                19.906
   ⛔ censo v1 «afirmación»                             10.192  ← DESCARTADO, era el residuo
   ⭐ cifras que el documento MARCA como afirmación       2.062
   contrastadas                                        ~212     (26 congelados · 16 pares ·
                                                                 218 comandos y rutas · README)
   ⛔ SIN CONTRASTAR                                   ~1.850
```

⭐ **Decisión de Antonio (7/08): se recorren las 2.062 enteras.** *Una cobertura del 10 % con
extrapolación es lo que este proyecto lleva cuarenta tandas denunciando.*
⛔ **Las 17.844 no marcadas quedan cerradas como `NO CONSTA` ESTRUCTURAL**, y no se vuelve sobre
ellas: son celdas de tablas de medición de 40 tandas y **el dato de cada día ya no existe**.

⚠️ **Lo que el bloque B declaró no haber podido auditar:** las ~1.850 · los `RECONOCIMIENTO-*`
(**exigen RED, parado ahí como manda la costura**) · `BITACORA.md` entera (7.252 líneas, el 28 % de
la documentación) · **cuándo empezó a mentir cada superado** (`CAUSA NO CONFIRMADA`).
⭐⭐ **Y las «~1.700 líneas de diseño sin contrastar» que este documento arrastraba como el riesgo
vivo mayor: NO LO ERAN.** El bloque C demostró que la pregunta no aplica — ver §10·C1.

### ⭐ EL MAPA Y LA COBERTURA REAL — tras B.2 (7/08)

⭐⭐ **El mapa de las 2.062 está ENTERO. El contraste, no** — y eso lo anticipó la costura del
encargo.

```
   afirmaciones del censo v2 (universo aprobado)        2.062   100 %
   R · reproducible, con productor NOMBRADO               531   25,8 %
        ⚠️ …cuya evidencia es PROSA del script             87   ⇒ suelo defendible: 444
   F · foto declarada (1 verificada a mano)                10    0,5 %
   P · suelo, umbral, ejemplo, identificador               13    0,6 %
   ⭐ ? · «no lo he sabido clasificar»                   1.508   73,1 %
        · casi-R (el valor está, faltó vocabulario)       354
        · ningún productor imprime hoy ese valor          304
        · menores de 100 (índices, porcentajes)           875
   ⛔ contrastadas contra el motor                          38    1,8 %
```

⛔ **`?` NO es `NO CONSTA`.** *`NO CONSTA` es «no se puede saber»; `?` es «no lo he sabido».*
⭐⭐ **Y el 73 % es un resultado, no un fracaso:** la válvula se pidió a propósito para que nadie
clasificara por descarte, que es lo que mató al censo v1.

⛔⛔ **Y por qué el contraste no se puede completar «recorriendo»:** *contrastar la clase R es
circular* (ley 92). Las diez divergencias nuevas salieron **al revés** — cifras NO-R cuya línea
comparte vocabulario con una salida que trae otro número del mismo orden: **38 candidatas, 10
confirmadas a mano, 28 falsas.** ⭐ El buscador es un **proponedor, no un juez**.

**⛔ SUPERADOS NUEVOS (B.2) — diez más, en siete documentos, ninguno con marca:**
`H1-PASOS-DE-CEBRA` (193 aristas · 1,20 km ⇒ **190 · 1,16**) · `H1-MODELO-VIA-FORMA-PAPEL`
(794 m ⇒ **783**) · `H1-PARQUES` (1.020 · 1.661 · 181 · 220 ⇒ **1.007 · 1.642 · 237 · 294**) ·
`H1-NOMBRAR-ACERAS` (1.159 de 3.851 ⇒ **1.069 de 3.582**) · `H1-CALLE-PEGADA` (+511 ⇒ **+495**).
⭐ **Y una que parecía superada y NO lo está:** el 2.667 contra 2.669 **lo explica el propio
`puertas-sin-calle.js`** (tanda 31, regla estricta de bici ⇒ +2). *El instrumento lleva dentro la
historia de su número — es lo que el resto no hace.*

### ⭐⭐ LA COSECHA — propuesta de guardianes, ⛔ sin aplicar

**495 afirmaciones tienen productor nombrado y ningún guardián · 279 valores distintos. Hoy hay 26.**
⚠️ **Y no es una lista de la compra:** de 28 candidatos fuertes, **ocho no deberían estar** (99999 es
el centinela; 100 · 150 · 500 son listones ya vigilados; cuatro casan con números de bitácora).
⇒ **El ejecutor propone diez y ninguno más** — `3.644` · `3.359` · `46.150` · `11.942` · `2.006` ·
`1.592` · `493` · `4.326` · `1.269` · `320/179` — *porque cada congelado es un rojo que alguien
tendrá que entender.* ⭐ **Y empezaría por los tres primeros: están en el README**, que es lo que lee
quien no es Antonio.

⚠️ **Lo que B.2 declaró no haber podido auditar:** 2.024 de 2.062 · las 1.508 de `?` · los
`RECONOCIMIENTO-*` (**RED, parado**) · **las 39 afirmaciones que sostiene `acera-equivocada.js`**
—marcadas `MEDIDO CON INSTRUMENTO TOCADO` y no medidas, para no usar el instrumento de `A·V1`— ·
los 19 ficheros sin salida (librerías: sus constantes son reproducibles y el mapa no las ve) · y
los `exportar-*.js`, **no ejecutados a propósito porque escriben dentro del repositorio**.

### ⛔⛔⛔ LOS DOS ROJOS FALSOS DE LA AUDITORÍA — `B·V1` y `B·V2` (7/08)

> **De once hallazgos publicados, DOS eran falsos. Y ninguno lo cazó el bloque que lo publicó:**
> el primero lo cazó el bloque siguiente, el segundo una tanda de arreglos dos días después.
> ⭐⭐⭐ **Sin bloque siguiente, los dos seguirían publicados como hechos del proyecto.**
> **Misma causa las dos veces: emparejar por el NOMBRE en vez de ir al OBJETO.**

### ⛔⛔ `B·V2` — RETIRADO. La capa nombrada no era la que se creía

Publicado: *«el README atribuye a `MU1_jerarquia_viaria` los 3.644 tramos con código de vía; 3.644
es `RoadLink` y no trae ninguno de los tres atributos.»* **Contrastado contra los cuatro crudos
archivados, sin descargar nada:**

| capa | `numberMatched` | ¿código? | ¿sentido + velocidad? |
|---|---:|---|---|
| ⭐ `movilidad:MU1_jerarquia_viaria` | **3.644** | ✅ **3.623** | ✅ |
| `tn-ro:RoadLink` | 3.644 | ⛔ | ⛔ *(edición INSPIRE de MU1)* |
| `idezar_base:JERARQUIA_VIARIA` | 3.453 | ⛔ | ✅ |
| `urbanismo:Vias` | 3.359 | ✅ | ⛔ |

⭐ **Cuarto testigo, la misma zona en dos capas:** `zona-casco_MU1jv` = 19 features **con** código;
`zona-casco_IDEZARjv` = 14 **sin** él.
⇒ **`B·V2` confundió `movilidad:MU1_jerarquia_viaria` con `idezar_base:JERARQUIA_VIARIA`** — mismo
nombre humano, espacio de nombres distinto. **El README original tenía razón.**

⭐⭐⭐ **Y lo que lo hace instructivo: las cuatro piezas eran ciertas por separado.** Lo falso era **lo
que las unía**, y eso no se comprobó contra nada. ⚠️ **Con la trampa encima: MU1 y RoadLink comparten
el 3.644 porque RoadLink es su edición INSPIRE**, así que el número que delataba la confusión era
justo el que la escondía.

⛔⛔ **Y la retirada se escribió primero en el cuerpo de un mensaje de commit.** De ahí la **ley 104**:
*una retirada que solo vive en un commit no está publicada — un hallazgo se cae donde se leyó.*

### ⛔⛔⛔ `B·V1` — RETIRADO (7/08)

> **Es la primera vez en este proyecto que se audita un HALLAZGO.** Y salió falso.

**Lo publicado en el registro de B:** *«`DISEÑO-H1-GRAFO.md` §P4.1 dice “manda el código, SIEMPRE”
y el motor engancha por distancia pura ⇒ el documento de diseño no describe lo que hace el motor.»*

**Las cinco pruebas que lo tumban, independientes entre sí:**

| # | evidencia |
|---|---|
| 1 | ⭐⭐ **`DISEÑO-H1-GRAFO.md:3`, su propia cabecera: *«Estado: propuesta para aprobar. Nada de esto está construido.»*** |
| 2 | `DISEÑO-H1-ADENDA.md:7`: *«`DISEÑO-H1-GRAFO.md` (tanda 2) y sus dos anexos son registro histórico»* |
| 3 | El diseño es del **2/08**; el primer fichero de `src/`, del **3/08** |
| 4 | La decisión que el código cita, **`D0`, dice *«por proximidad sobre la geometría OSM»*** — que es justo lo que el motor hace |
| 5 | `src/` cita `D0`-`D5` y `G1`-`G3` **más de 90 veces**, y **`§P4.x` CERO veces** |

⇒ **§P4.1 no es una descripción falsa: es una propuesta de tanda 2 que no se adoptó.**
⭐ **Decisión de Antonio (7/08): `B·V1` baja de VIVO a NOTA, y el arreglo va al README** — que es
quien los enlaza como *«el diseño»* sin decir que son el plan en papel del 2 de agosto.

⛔⛔ **Y las dos causas, que valen más que el hallazgo:**
1. **El ejecutor no fue al documento a preguntarle QUÉ ES: fue a buscar en él lo que el encargo
   señalaba.** La declaración de estado estaba en la primera página de dos de los cuatro.
2. ⭐⭐ **Y esta conversación lo RATIFICÓ**, por escrito, en el encargo de B.2: *«Antonio lo acepta:
   son VIVOS»*. **Dos lectores razonando sobre el contenido con la cabecera delante sin leerla.**

⚠️ **Lo cazó el bloque siguiente por la casualidad de que hubiera bloque siguiente. Si B hubiera
sido el último, `B·V1` seguiría publicado como un hecho del proyecto** — en el registro, en este
documento y en el portafolio. **Es la ley 91 cumpliéndose contra su autor a las veinticuatro horas
de escribirla.**

### ⭐⭐⭐ C1 · LOS CUATRO DOCUMENTOS DE DISEÑO — la pregunta no aplica

El bloque C fue a contrastar sus ~1.700 líneas contra el código. **Volvió diciendo que eso no se
puede preguntar**, con **tres testigos independientes** (ley 60):

```
   líneas de los cuatro documentos                    1.853
   con una afirmación de comportamiento                 573
      DESCRIBE     32   5,6 %   ⛔ y CERO tras leer 15 a mano
      PROPONE      84  14,7 %
      ?           457  79,8 %

   ⭐ ficheros de src/ citados en los cuatro documentos     0
   ⭐ control positivo · H1-CIERRE.md cita src/             8 veces
```

⭐⭐ **La ley 35 se cumplió entera, y estaba escrita ANTES de mirar:** *«en castellano una regla
PROPUESTA se escribe en presente de indicativo igual que una implementada ⇒ predigo que DESCRIBE se
llenará de propuestas»*. De las 15 leídas, **20 de las 32 eran mediciones del 2 de agosto** y el
resto reglas propuestas o el índice del documento.

> ⭐⭐⭐ **Los cuatro documentos son PLAN y MEDICIÓN, con DESCRIPCIÓN CERO POR CONSTRUCCIÓN.**
> Ninguna de sus líneas **puede** describir el código: no lo mencionan nunca. **Contrastarlos
> contra el motor es contrastar un plan contra su resultado.**

⚠️ **Y la pregunta buena queda abierta: de las 84 PROPONE, ¿cuáles se hicieron, cuáles siguen
pendientes y cuáles se abandonaron?** No se ha mirado.

✅ **Lo que sí se pudo comprobar sale limpio** — las seis decisiones que el código cita como su
autoridad están implementadas con el valor que dice este documento: `D0` distancia pura ·
`D1` nodo compartido · `D2` `unidoPorDefecto` · `D3` marca y no corrige · `D4` `precision()` por
tramo · `D5` `TOLERANCIA_PUNTA = 2.0` / `TECHO_PUNTA = 5.0`.
⚠️ **Con su advertencia, escrita por el propio ejecutor: se LEYERON, no se rompieron.** *«Existe y
dice lo que debe» no es «rige».*

### ⭐⭐⭐ LOS EJES — de qué se fía este proyecto (bloque C)

| eje | ¿rojo visto? | testigo | cuánto cuelga |
|---|---|---|---|
| **las 7 rutas** | ✅ **real** (tanda 33: la nº6 se movió 523,4 → 520,2) | ⚠️ **el mismo motor reejecutado**, salvo la nº7 | la costura de parada de 21 tandas · 6 documentos publican *«idénticas al milímetro»* |
| **los 26 congelados** | ✅ dos veces | ⛔ **el mismo código** — freno de deriva | el mapa, el verde, los pasos, el buscador. **Y cubren 13 de 26** |
| ⭐⭐⭐ **la batería de 57** | ⭐⭐⭐ **sí, y primero fue un VERDE FALSO** (56 scripts con uno estrellado dentro, código 0) | el propio repositorio | **TODO** |
| **los 2 testigos del nombrado** | ✅ (`calle-pegada.js:768`) | ⭐ **dos caminos distintos** | el nombrado y el 89,5 % |
| **los controles ±** | ⚠️ parcial: **7 de 210 pasaban por construcción** | variable | transversal |

⭐⭐⭐ **EL EJE DEL QUE MÁS CUELGA Y MENOS SE HA VERIFICADO ES LA BATERÍA.** Cuelga todo de ella —es
la única puerta por la que pasa cada tanda—, **su único rojo documentado fue un verde falso**, ese
arreglo **no ha vuelto a ponerse a prueba**, y el bloque A midió que **37 de sus 57 scripts no se
pueden leer por su código de salida**: ⇒ **vigila 57 scripts de los que solo puede interpretar 20.**
**Máxima carga, testigo más débil, y su único fallo conocido fue no ver nada.**

**⚠️ LA RUTA Nº7 cuelga MENOS de lo que temíamos** — *«un eje que grita lo que le pasa no es el
peligroso»*. Se caen **19 tiempos publicados en 8 documentos, los minutos del visor y 3 bandas**.
✅ **NO se caen**: los metros de las siete rutas, el grafo, el mapa, el nombrado, el buscador **ni la
columna RODEO, que es adimensional — y es «la columna que manda».**
⭐⭐ **Y una circularidad que nadie había escrito:** las bandas **se derivaron de los 6 km/h**, así
que **una ruta comparada con su banda NO PUEDE fallar por una calibración mala: banda y ruta se
mueven juntas.**
⛔⛔ **El agujero real: NO HAY NI UN GUARDIÁN SOBRE EL TIEMPO.** Los metros están congelados siete
veces; **los minutos, ninguna.**
⭐ **Segundo testigo, propuesto y sin hacer:** un trayecto más con la misma pulsera, **en cuadrícula**
(el nº7 va en diagonal). ⭐ **Y uno gratis: los ~25 min son «de repetición»** — si hay más de una
apuntada, su dispersión ya es un segundo dato. `NO CONSTA` si existe.
⛔ **Lo que NO vale:** una velocidad de tabla o de literatura. *Sería cambiar un testigo humano flojo
por ninguno, y el proyecto entero está construido contra eso.*

### ⚠️ HALLAZGOS MENORES DEL BLOQUE C

- **`C·N1` · DEUDA · `D1`-`D4` significan DOS COSAS en este repositorio**: la decisión de diseño y
  una sección del informe de cuatro scripts. ⭐ *Despistó al propio auditor en esta tanda.*
- **`C·N2` · DEUDA · `orden-numeros.js` —el cuarto testigo DESCARTADO— sigue en la batería.** No
  está en `MODULOS`, nadie lo requiere, y **dos de sus seis guardianes congelan cifras del
  experimento muerto**. ⭐ El ejecutor rozó la costura y juzgó que no aplica *(no imponen nada al
  motor: vigilan que la medición que descartó la idea siga dando lo mismo)*. **Propuesta: meterlo
  en `MODULOS`, no borrarlo.**
- **`C·N3` · NOTA · El resto de las decisiones deshechas no ha dejado código vivo.** `estadoEstacion`
  solo en comentarios que citan su ley; la jerarquía, con `planarizar.js:11` diciendo *«la jerarquía
  NO vota»*. ⚠️ **Buscado por el NOMBRE de cada creencia: si quedara código con otro nombre, no se
  ha mirado.**

### ⛔⛔ LO QUE HAY QUE DECIR EL DÍA QUE SE CIERRE H1

> **La auditoría ha mirado si el código está sano (A), si lo escrito coincide con el dato (B, B.2)
> y si las decisiones se cumplen (C). NINGUNO DE LOS CUATRO BLOQUES HA COMPROBADO QUE LA RUTA QUE
> SALE SEA LA RUTA CORRECTA.**

Eso lo sostienen **las siete rutas de Antonio**, y el bloque C acaba de medir de qué se fían: **del
mismo motor reejecutado, salvo una observación humana.** ⭐ **Es el hueco más grande de H1, y esta
auditoría no lo abre: lo hereda.**

### ✅ TANDAS DE ARREGLO 1 y 1·bis (7/08) — el instrumento

⭐⭐⭐ **LA PREDICCIÓN ACERTÓ 6 DE 6.** Escrita y fechada **antes de tocar una línea**: qué ficheros
se moverían, cuáles no, qué congelados saltarían (ninguno) y con qué valores.

```
   acera-equivocada.js   150.947 → 50.986 · 123.132 → 23.172 · 66.973 → 16.993 · 126 → 73 m
   informe-portales.js   16,9× → 21,3×
   congelados que saltaron            0 de 26
   siete rutas                        sin mover
```

⭐⭐⭐ **Y LA ÚNICA TRIANGULACIÓN REAL QUE TIENE ESTE PROYECTO:** el **bloque A predijo 21,3× el 6 de
agosto, con otro método y sin tocar nada**; con el centinela apagado sale **21,3× exacto**. *Todo lo
demás que aquí se llama «cuadre» es el mismo código reejecutado.*

**Lo arreglado:** `A·V1` el centinela, **apagado donde vive y no sobre una copia** — ⭐ *se marca, no
se excluye: el contrato ya estaba escrito en `portales.js` y en `direccion.js:36`; el arreglo no lo
inventa, lo mueve de la copia al origen* · `L2`, que resultó ser otra cosa mejor contada —
**`CENTINELA = 9999` era el TECHO, no el centinela: mentía el nombre, no el valor**, y el rojo
provocado enseñó los **3.553 portales reales** que un techo bajo tiraría en silencio · `B2·V2` el
«400×» y **sus tres hermanos del mismo veredicto**, todos **interpolados, no sustituidos**.

⛔ **`B2·V3` NO TENÍA ARREGLO QUE HACER.** `grep '\\b182\\b' src/` no devuelve nada: la línea ya
interpola. ⭐ **El error estaba en la lista y era de esta conversación** — heredado del criterio del
bloque C y propagado sin ir al código. *El ejecutor fue, miró, y dijo que no había nada en vez de
fabricar un arreglo para justificar el encargo.*

⛔⛔ **Y LA BATERÍA QUEDÓ DEMOSTRADA, NO ARGUMENTADA:** salió **byte a byte idéntica antes y después**,
con `acera-equivocada.js` pasando de 150.947 a 50.986 **dentro**. ⇒ **Sale en verde con el
instrumento mintiendo y en verde con el instrumento arreglado.** *El bloque C dijo que era el eje
más peligroso; ya no es una tesis.*

**⚠️ DOS ROJOS EN LA LÍNEA BASE QUE NINGÚN BLOQUE DE LA AUDITORÍA REPORTÓ**, y **no son de los 37
ilegibles: son de los que sí se pueden leer por su código de salida:**
- `modelo-rutas.js` → código 1: *«sobre las aristas que PISA la ruta 7, San Juan de la Peña no sale
  como carril en calzada»*
- `auditoria-guardianes.js` → código 1: *«el control NEGATIVO del clasificador falla»*
⛔ **No se sabe desde cuándo ni qué sostienen. ABREN LA TANDA 2.**

**Lo que queda anotado y sin tocar:** la divergencia `A·V2` **medida limpia: 79** (50.986 por
`codigoVia` contra 51.065 por núcleo de vía) — ⛔ **decisión de Antonio, no arreglo** · **39
afirmaciones liberadas** del marcaje `MEDIDO CON INSTRUMENTO TOCADO`, sin medir · **~40 hermanos**
en el resto de `src/` — ⚠️ **y el «43» declarado SUELO, no recuento** · **cinco cifras a mano** que
quedan en `sin-vigilancia.js` (líneas 580, 603, 611).

**Para republicar en la tanda 3:** `H1-ACERA-EQUIVOCADA.md` (los cuatro números) ·
`H1-PORTALES.md:323` (16,9×) · `H1-AUDITORIA-GUARDIANES.md:20` y este documento §29 (182 → 232).

### ✅ TANDA DE ARREGLO 2 (7/08) — el clon y la portada

**El agujero era mucho mayor que «dos rutas a `E:`»:** de los 36 ficheros versionados bajo `data/`,
**los 36 son de `exploracion/` y CERO de `fuentes/`** — el dato que el motor consume está
gitignoreado. ⇒ **Un clon no se quedaba sin dos ficheros: se quedaba sin nada.**

```
   CLON PURO        (162 rastreados · 0 datos)     ✅ 18 de 58    ⛔ 40 mueren, todos por ENOENT
   CLON + fuentes/  (162 rastreados · 37 datos)    ✅ 58 de 58    ⛔  0
```
⚠️ **Y el propio ejecutor desactivó su número:** *«corre» solo dice que no se estrella, no que
acierte* — los cinco rojos permanentes declaran lo suyo allí igual que aquí.
⭐ **Y lo que nadie sabía: los cuatro `*-visor.js` (48 MB) no viajan y el clon se los fabrica en
trece segundos**, con el comando que el README ya manda. ⇒ **Con los 12 ficheros puestos no queda
nada con nombre que le falte a la portada.**

**LA DECISIÓN (Antonio, 7/08):** ⛔ **no se versionan los crudos** (135,1 MB) · ⛔ **no se escribe un
script que los baje** —*un clon que se baja su propio OSM arranca y da OTROS números, y eso es peor
que no arrancar porque parece que funciona* (ley 21)— ✅ **rutas relativas + `verificar-datos.js`**,
con tres veredictos y ninguno por defecto: `EL MISMO` · `OTRO` · `NO ESTÁ`.
> ⭐⭐⭐ **Si el clon no puede tener el dato, que al menos SEPA que no lo tiene.**

**El README, reescrito entero.** Fuera: *«todavía no hay código»*, *«ni una línea de aplicación»*,
*«no hay código que pueda fallar»*, *«no contiene ningún dato integrado»*, *«la licencia se
declarará cuando se integre alguno»*. Dentro: que el dato no viaja y un clon no ejecuta el motor ·
que los `DISEÑO-H1-*` son **el plan en papel** · **ODbL + Ley 37/2007, ciertas ya** · `N4` con
`contributors` y enlace · y ⭐⭐ **el principio que salió del nº99:** *las siete rutas no se publican
en la portada — sus metros viven en el instrumento que las mide.*

**⛔⛔ LOS CINCO ROJOS PERMANENTES — y no eran dos.** Tres no los reportó ningún bloque de la
auditoría, **y el repositorio SÍ los reportaba en cuatro documentos**:

| script | desde | qué es | clase |
|---|---|---|---|
| `modelo-rutas.js` | 4/08, **nació rojo** | San Juan de la Peña sin asignación propia | **declarado**: *«decide Antonio»* |
| `auditoria-guardianes.js` | 5/08, **nació rojo** | el control negativo del clasificador falla | **declarado NO VÁLIDO a propósito**: *«ajustarlo hasta que pase sería ajustar el instrumento al resultado»* |
| `rutas-antonio.js` | tanda 16 | el rodeo de la nº4: 2,17 frente a ≤1,6 | declarado fuera de banda |
| ⛔ `donde-falta.js` | **6/08** | exige 7 rutas y la nº1 ya no se resuelve | ⚠️ **EXPECTATIVA CADUCADA** |
| ⛔ `pasos.js` | **6/08** | ídem | ⚠️ **EXPECTATIVA CADUCADA** |

⭐ **Reconciliación del «49 de 70» del bloque B, medida:** 29 ficheros requieren `portales.js`
directamente, **48 lo alcanzan transitivamente**, 48 + 1 = 49. *Aquel número medía la dependencia de
`E:`, no el agujero del clon.*

**⚠️ Y dos cosas que van a `§3 · qué miente cada fuente`:**
- ⛔⛔ **El callejero —46.150 portales, 3.359 vías, la base de todo— lo genera OTRO PROYECTO**
  (`ZGZ RADAR REACT`) y **004 no lo descarga.** ⚠️ **Y los metadatos de ese proyecto no describen los
  ficheros que 004 consume:** ni el tamaño (10.364.859 contra 10.835.605) ni la huella — **se
  reescribieron ocho horas después del metadato.** *La fuente de la que cuelga el proyecto entero
  miente sobre sí misma, y hasta hoy la dependencia ni siquiera estaba declarada.*
- ⚠️ **De los 12 ficheros necesarios, la consulta exacta de SEIS es `NO CONSTA`** (los POST a
  Overpass). ⭐ **Publicado en la portada como hallazgo, no tapado:** *el repositorio no sabe cómo se
  pidió la mitad de su dato, y prefiere decirlo a inventar una consulta plausible — alguien la
  ejecutaría.*

### ⛔⛔⛔ LO QUE MUERDE PRIMERO A QUIEN LLEGUE — y de ahí sale la tanda 2·bis

> **«Que el repositorio le va a decir que todo está bien cuando no lo esté.»**

`probar-paradas.js:129` decide con `salida.includes('⛔ FALLO ·')`. ⇒ **Un script que declara UN
fallo y uno que declara SIETE imprimen la misma línea `DECLARA FALLO ✅`.**
⭐⭐ **Cinco rojos permanentes son cinco vendas** — y una de ellas tapa `modelo-rutas.js`, **el control
de las siete rutas, el eje del que más cuelga del proyecto entero**, que no tiene ningún canal
automático para decir que le ha salido un segundo fallo.

⛔⛔ **Y ya está mordiendo, con fecha:** `donde-falta.js §A6` y `pasos.js` llevan **desde el 6 de
agosto publicando `NO CONSTA` en vez de medir**, y **la batería los da ✅ en cada pasada.**

> ⭐⭐⭐ **Lo que le miente no es un número: es el silencio de un guardián que sigue diciendo `✅`.
> Los fallos que esta auditoría ha arreglado se veían al MIRAR; éste solo se ve al CONTAR.**

### ✅ TANDA DE ARREGLO 2·bis (8/08) — la batería ya cuenta

**El arreglo:** `probar-paradas.js` decide con **recuento + código de salida** contra una **tabla de
excepciones** que vive en el propio guardián, con **cuatro campos por fila —recuento · texto · desde
cuándo · clase—** y ⭐⭐ **regla de mundo cerrado: todo lo que no esté en la tabla debe declarar 0.**
*Un script nuevo que empiece a fallar salta solo, sin que nadie se acuerde de añadirlo.*

⭐⭐⭐ **Y la contraprueba que vale no fue la planeada: el guardián cazó los arreglos de su propia
tanda, con la tabla todavía sin tocar.**
```
   donde-falta.js   0 de 1   ⛔ DECLARA 0 Y SE ESPERABAN 1
   pasos.js         0 de 1   ⛔ DECLARA 0 Y SE ESPERABAN 1
```
*Con la regla de ayer eso habría pasado a `✅` sin decir una palabra.* ⭐ **Y el orden fue el
correcto: las filas salieron de la tabla DESPUÉS del rojo** — al revés habría sido verde por
construcción.
⛔ **Ningún rojo apagado:** los tres declarados siguen rojos **y ahora se cuentan.** La clase
«expectativa caducada» ya no existe.
⭐ **Cerrojo aplicado:** los scripts que salen en 1 sin declarar nada **no entran en la tabla** —
salen como **HALLAZGO** (`ruta.js`, y seis más latentes con `process.exit(1)` sin `alarma`).

### ⭐⭐⭐ EL PRIMER CASO CONFIRMADO DE LA LEY 110 — la ruta 6, con autopsia a la hora

`§A6` revivió y **cinco de las seis rutas cuadran al metro con lo publicado. La sexta, no:**

```
   ruta 6   publicado   412 m sin nombre · 188 con portales · 10 portales
            medido      438 m            · 207              · 11
```

⭐ **Triangulado con instrumento vivo:** `modelo-rutas.js §D4` da **438** en cada batería, y está
comprobado que **las dos cifras miden lo mismo** (idéntico conjunto, idéntico filtro, idéntica suma).
⭐⭐ **Y el 412 FUE CIERTO — consta, y no nació desmentido:**

```
   04/08 15:15:15   nace §D4 en modelo-rutas.js
   04/08 15:15:16   se publica §D4 con «6 → 412»
   04/08 15:45:13   nace §A6 en donde-falta.js
   04/08 16:07:22   se publica §A6 con «6 → 412»
   06/08            la ruta nº1 deja de resolverse   ⇒ §A6 MUERE
   08/08            §A6 revive y dice 438
```

> ⭐⭐⭐ **No es un número que mienta: es un número viejo cuyo contradictor llevaba dos días muerto.**

⚠️ **Segundo dato para la tanda 3:** aquel día la ruta 6 ganaba **221 m de vía municipal (53,6 %, 0
propios)**; hoy §D4 le da **438 (100 %)**. **Se movió más que el reparto de «sin nombre».**
⛔ **Nada republicado.** Atado en bitácora 171 con su triangulación y su fecha de muerte.

### ⚠️ LO QUE LA BATERÍA SIGUE SIN PODER VER — declarado por su propio autor

- ⭐⭐ **El TEXTO del fallo no se compara.** La tabla lo guarda y el veredicto solo mira el número:
  **un rojo declarado puede cambiar de motivo, seguir siendo 1, y pasar en verde.** *Es el fallo de
  hoy un piso más abajo.*
- **La CLASE no la vigila nadie** · **la tabla puede sobrar** (si un script desaparece, su fila se
  queda) · **el recuento se fía de una línea de texto** que imprime `alarma.js`.
- ⛔⛔ **Y nadie compara dos documentos entre sí. Es lo que dejó vivir al 412 durante dos días.**

> ⭐⭐⭐ **«¿La batería ya puede decir la verdad, o solo menos mentira?» — SOLO MENOS MENTIRA, Y SÉ
> CUÁNTA MENOS.** *Antes contestaba «¿hay?» y la daba por respondida a otra pregunta. Ahora contesta
> «¿hay?» y «¿cuántos?». Sigue sin contestar **«¿de qué?»**, que era la que importaba en la ruta 6.*

**⚠️ Los hermanos, y es SUELO por dos razones medidas** (no se sigue el flujo, y 207 «otras» sin
leer): de **464 veredictos** — 137 booleanos donde puede haber cantidad · 81 literales numéricos, de
ellos **18 contra un valor medido** · 39 del patrón sano «hay alguno». ⛔ Ninguno arreglado.

### ✅ TANDA DE ARREGLO 3 (8/08) — el puntero y el latido

**EL PUNTERO.** `src/superados.js` genera una cabecera en el documento superado, entre marcas y **no
editable a mano**, con la tabla `lo que dice aquí · hoy vale · dónde se republicó`. **37 pares en 16
documentos, ninguno a mano.**
⭐⭐ **Y «marcar no es corregir» queda demostrado con instrumento, no con una frase:**
```
   git diff --numstat -- docs/   →   16 documentos · 197 insertadas · 0 BORRADAS
   tres pasadas de --marcar      →   un solo bloque por documento (idempotente)
```
⭐ **Y su rojo lo cazó la batería sin que nadie se lo pidiera:** `superados.js · 1 de 0 ⛔ DECLARA 1
Y SE ESPERABAN 0`. *El guardián de la 2·bis vigilando al de la 3.*

**⛔⛔ LOS CINCO QUE NO SE DEJARON MARCAR — y valen tanto como los 37 que sí.** El `182` de
`H1-ACERA-EQUIVOCADA:324` es **un listón p99 en metros**; los `412` de `H1-CIERRE` son **«412× el
azar»**. ⚠️ **La primera versión buscaba solo la cifra y los habría marcado: una afirmación FALSA
dentro de un registro histórico**, que es el único sitio del proyecto donde eso no tiene vuelta
atrás. **Cazado mirando las líneas antes de escribir.** ⇒ **leyes 116 y 107.**

**EL LATIDO.** Cada número publicado declara su productor y su sección; **si la sección no emite, el
latido lo dice — aunque el código de salida sea 0.**
⭐⭐⭐ **Y la prueba que decidía si el mecanismo servía: SÍ habría cazado el 412 el 6 de agosto.**
```
   §A6 imprimiendo «NO CONSTA», como del 6 al 8      MUDO    ⛔ EL PRODUCTOR NO EMITE
   positivo de control · la sección viva             VIVO    ✅
   ⭐ el CERO · la ruta 2 publica 0                   VIVO    ✅ (leyó «0»)
   …y la fila SIN cifra                              MUDO    ⛔ SALE PERO SIN EL DATO
   la deriva                                         DERIVA  ⛔ PUBLICADO 412 · HOY 438
```
⚠️ *Aquel día `donde-falta.js` declaraba 1 fallo y salía en 1 — **exactamente lo esperado**, y la
batería decía `1 de 1`. **Ningún contador tenía nada que decir. Éste sí.***
⛔ **El latido sigue en rojo a propósito** —clase nueva, «pendiente de republicar», **con fecha de
caducidad puesta**— y entró en la tabla **después** de que la batería gritara.

⛔ **Y una quinta opción murió medida antes de proponerse:** extender `numeros-congelados.js`. **El
412 no está entre los 26** (`grep -c` = 0) ⇒ *no habría cazado el caso que motiva la tanda.*

**`B2·V1` declarado en `docs/H1-CENSO-DECLARADO.md`**, no ampliado: el censo v2 mide **2.361 cifras
que el documento SUBRAYA**, ve **13 de los 26 congelados**, ⛔ **y no puede ver un cero** — su
expresión exige dos dígitos y en 2.360 marcas no hay un token de uno *(ley 120)*.

**⚠️ Lo que la propia tanda declaró sin arreglar:** las republicaciones **no cabían y no se
aceleraron** *(los dos pares ya llevan puntero diciendo `PENDIENTE`, y el día que se republiquen el
latido pasa a verde solo)* · el fixture del 6 de agosto **es un literal y envejecerá sin que nadie lo
diga** · el latido **añade ~12 min a cada pasada** porque ejecuta dos productores · **13 de 26, no
12** *(el candidato de la diferencia es `verde.municipalNombrados = 0`)* · y **`numeros-congelados.js`
apunta a `H1-ROJOS-CERRADOS §A1` cuando el dato vive en su §0** — *el documento es el correcto, el
ancla no: es lo que produce un puntero que nadie sigue.*

### ✅ TANDA DE ARREGLO 4 (8/08) — la velocidad deja de ser la de Antonio

⭐⭐⭐ **DECISIÓN DE ANTONIO, y es de DISEÑO, no un número mal:** los tiempos se calculaban con **su**
velocidad, y **esto es un buscador para cualquiera.** ⇒ **`VELOCIDAD_KMH = 5,0` (1,39 m/s).**

**Por qué 5,0 y no la media de la literatura:** es lo que fijan **openrouteservice** y las isócronas
de **OSRM / Valhalla** por defecto. ⭐⭐ **Y este proyecto se define por NO usar esos motores: usar su
misma constante hace que sus tiempos sean COMPARABLES con los de ellos.** *Si alguien contrasta una
ruta con Google Maps y sale lo mismo, eso valida el motor.*
⚠️ *Contexto, no validación: la marcha preferida humana cae entre 4,0 y 5,9 km/h. Antonio declara
~9 min/km = **6,67** — por encima del rango, y ése es el argumento de por qué su ritmo no calibra.*

⭐⭐⭐ **Y esto DISUELVE el eje que el bloque C marcó como el más frágil:** de la nº7 colgaban 19
tiempos y 3 bandas por un solo testigo humano. **Con la constante estándar, la nº7 ya no calibra
nada.** ⇒ **No se arregla el eje: desaparece.** ⭐ *Y las caminatas siguen valiendo para lo que de
verdad miden: que los METROS son correctos —2.529 contra 2.600 del GPS—. Un GPS mide bien
distancias; los minutos eran otra cosa.*

```
   ruta      metros      antes (~6)    ahora (5,0)
     2        598,1        6 min          7 min
     3      3.704,9       37 min         44 min
     7      2.528,9       25 min         30 min
```
✅ **Y los metros, IDÉNTICOS AL DECIMAL** — comprobado, no supuesto. Ningún congelado se movió.
⭐ **El cálculo vivía en UN solo sitio** (`relato.js:55`), con barrido ancho de cinco sondas sobre 77
ficheros y positivo de control. ⚠️ **Pero el NÚMERO estaba en dos:** `relato.js:647` lo escribía a
mano dentro de un texto. *Mismo valor, así que no saltó la costura — pero era un segundo sitio
esperando a pudrirse.* Ahora se deriva.

**⭐⭐ Y la pregunta de fondo, contestada y medida (ley 123):** en el motor **no queda ninguna
constante que salga de una persona.** Lo que queda de Antonio es un documento —`RUTAS-CONOCIDAS.md`,
con los topes de rodeo, las bandas y los siete trayectos— y **`ruta.js` y `caminos.js` no lo
conocen: cero menciones.** ⇒ **lo de Antonio JUZGA, nunca DECIDE.**

**Seis documentos marcados** con `superados.js` → `docs/H1-VELOCIDAD-ESTANDAR.md §0`. ⛔ **Uno no se
dejó y no se marcó a mano:** `data/pruebas/RUTAS-CONOCIDAS.md`, *que no es de este repositorio: es de
Antonio.* ⚠️ **Sigue diciendo `~6 km/h` cuatro veces y sus dos bandas derivadas siguen a 6.**

⚠️ **Y lo que la tanda declaró sin resolver:** la **circularidad de las bandas sigue entera —
trasladada, no tocada** (ley 124) · **la batería ejecuta los `exportar-*.js`**, así que la regla «no
los ejecutes» no se puede cumplir mientras se corra `--todo` — *decide Antonio* · y **el rojo
huérfano de la ley 125.**

### ✅ TANDA DE ARREGLO 5 (9/08) — las republicaciones, y la costura que saltó

**22 pares superado → vigente, en 103 líneas de 17 documentos.** ⚠️ *El «23» venía de dos sitios que
nadie había sumado.* ⭐ **Y tres que ninguna tabla tenía**: `36.050 → 36.113` · `21 congelados → 26`
· y uno de otra especie — **la anotación de un comando escrita en presente** (`# los 21
congelados`), *que el lector desmiente él solo en tres segundos.*

**Publicado:** `docs/H1-REPUBLICACIONES.md` *(la tabla no está escrita a mano: sale de
`superados.js --censar`, y la columna «líneas» es medida)* y `docs/H1-QUE-QUEDA-ABIERTO.md`.
⭐ **Y la segunda diferencia de la ruta 6 va publicada como diferencia, no como explicación:** el
4/08 ganaba **221 m de vía municipal (53,6 %, 0 propios)** y hoy **438 (100 %)** — **por qué,
`NO CONSTA`.**

⛔⛔ **PERO EL LATIDO NO PASÓ A VERDE SOLO — y ésa era la prueba de aceptación de la tanda.**
*Documento publicado, `republicaEn` puestos, cabeceras regeneradas, puntero en verde… y el latido
sigue diciendo `PUBLICADO 412 · HOY 438` por los dos productores.* ⇒ **El mecanismo de la tanda 3
quedó a medias: el puntero MIDE dónde aparece cada valor; el latido RECITA el valor publicado**
(instrumento nº110). ⛔ **Parado y sin tocar, como manda la costura.**

⭐⭐ **Y tres que NO se republicaron, ninguno a mano y ninguno por descuido** — *`superados.js`
encuentra la cifra pero no sabe distinguir una afirmación de una transcripción* (ley 127): los «56
scripts» son **un hecho del 6/08 que sigue siendo cierto** · el `4.055` es **otra magnitud**, no una
versión vieja · el `45.597` es **el «antes» de una transición narrada.**

✅ `26 insertadas · 18 borradas en docs/`, **y las 18 son cabeceras regenerándose** — cero líneas del
cuerpo, comprobado línea a línea. ✅ Siete rutas idénticas · congelados en 0 · **bitácora sin
entradas nuevas: no se equivocó en nada que el instrumento no cazara en el acto.**

### ⛔⛔⛔ LO QUE MÁS PREOCUPA AL CERRAR H1 — y no es un número

> **El repositorio ya sabe mirarse a sí mismo mucho mejor de lo que sabe mirar Zaragoza.**

*Seis tandas construyendo guardianes sobre guardianes —la batería cuenta, el puntero navega en dos
direcciones, el latido pregunta si un instrumento sigue vivo—, y **todo eso vigila el
repositorio**.* ⛔ **Mientras, sigue en pie la frase con la que se cierra H1: nadie ha comprobado que
la ruta que sale sea la CORRECTA.** *Siete trayectos, una sola observación humana — y a esa
observación se le acaban de retirar los minutos porque no servían para calibrar. **Queda una medida
de GPS contra una ruta.***

⇒ ⭐⭐⭐ **La siguiente tanda no debería ser otro guardián: debería ser salir a andar una segunda
ruta.** *(Ley 128.)*

### ✅ TANDA 6 (9/08) — el latido lee, y ENTRA LA RUTA Nº8

⭐⭐⭐ **ANTONIO SALIÓ A ANDAR.** *El informe de la tanda 5 decía que la siguiente no debería ser otro
guardián sino una segunda ruta. Lo fue.*

| | |
|---|---|
| **Trayecto** | **nº8** · El Coloso 2 → **Calle Padre Arrupe 1** *(Hospital Miguel Servet)* |
| **Medido** | **6,60 km · 59 min**, casi sin semáforos ⇒ **6,71 km/h** |
| **El motor** | **6.366 m** · recta 5.857 · ⭐ **rodeo 1,09** ✅ dentro de tope |

⭐⭐⭐ **Y EL RESULTADO ES DEL MOTOR, NO DEL INSTRUMENTO: el rodeo NO crece con la distancia.**
`nº6 520 m → 1,10` · `nº7 2.529 m → 1,06` · `nº8 6.366 m → 1,09`. **Factor 12 y no se mueve de la
banda 1,06–1,10** *(ley 132)*. ⭐ Y la nº8 **cruza por el Puente de Piedra**, el mismo que elige
Antonio en la nº1 — **sin que nadie se lo dijera.**

⛔⛔ **PERO NO VALIDA LOS METROS, y va declarado y no absorbido:** el trayecto andado terminaba en
**Consultas Externas** y el portal medido está a **134 m** de ahí ⇒ **2,0 % sobre 6,6 km, del mismo
tamaño que la diferencia motor↔GPS que se querría medir** *(ley 131)*. ⇒ **Valida el RODEO, que es
«la columna que manda». Los metros, no.**

**El latido cerró:** ya no recita — **cada número declara `docParte` + `ancla` y lee el valor DEL
DOCUMENTO** en cada pasada, con contraprueba de 7 de 7 *(el cero leído por los dos lados, el ancla
rota como `MUDO` y no como error)*. ⭐⭐ **Y el ciclo cerró por donde tenía que cerrar: la batería
gritó `latido.js · 0 de 1` al ponerse verde, y la fila salió de la tabla DESPUÉS del grito.**

**Y la nº8 entra en `PUBLICADOS`**, con los pasos republicados **de 56 a 83**, con puntero. ⭐ *Ya
había envejecido dos veces —110→82 fundiendo pasos, 74→56 al perderse la nº1—: **es la primera vez
que SUBE porque entra una ruta.*** ⚠️ **Y desde hoy la nº8 es costura de parada como las demás.**

**⛔⛔ Y lo que se descubrió por el camino, que es lo más caro:**
- **Un paréntesis detrás del número cambia el destino EN SILENCIO** (nº112). *Tres veces seguidas
  escribió esta conversación mal el destino de esa fila.*
- **El literal `7` que la tanda 2·bis creyó cerrado seguía vivo en `modelo-rutas.js`** (nº113) ⇒
  **ley 130**, y solo apareció **al entrar una ruta nueva**.
- ⚠️ **El centroide del complejo engancha a 70,8 m**, por encima del `AVISO_ENGANCHE_M = 65` que es
  el p99 del callejero: **el destino cae en el 1 % peor.** ⛔ Sin tocar.

**⭐ Lo que enseña un trayecto largo y en 500 m no se ve:** la nº8 **mezcla los dos regímenes** —64 %
de eje de calzada repartido en 12 de 27 pasos— mientras las cortas son homogéneas *(nº2 al 9 %, nº7
al 93 %)*. ⇒ **El error no se acumula con la distancia: se acumula con cuánta ciudad mal mapeada se
cruza.**

**⚠️ Las bandas, con dos mediciones:** ninguna se cae, **dos dejan de ser circulares y dos siguen
siéndolo** — y **el hueco no ha mejorado donde peor estaba**: las dos medidas están en los extremos
(2,6 y 6,6 km) y las derivadas en medio y por debajo. ⇒ **hace falta una tercera CORTA, bajo 1 km**,
que es donde un error de enganche de 30 m pesa el 6 %.

### ✅ TANDA 7 (9/08) — la portada cuenta la auditoría, y entran las rutas nº9 y nº10

**El README ya menciona la auditoría**, que hasta hoy no aparecía en ninguna línea: los cuatro
bloques con sus registros, **los dos hallazgos que resultaron falsos con dónde están contados**, los
enlaces a `H1-QUE-QUEDA-ABIERTO.md` y `H1-REPUBLICACIONES.md` —que la portada no enlazaba— y la
frase de cierre. ⭐ **Y seis cifras caducadas al día, cada una con su comando**, dos de ellas
encontradas al ejecutar toda la tabla y no solo lo señalado.

**⭐⭐⭐ CUATRO DISTANCIAS MEDIDAS, y con ellas las bandas dejan de ser circulares:**

```
   nº7   2,6 km / 25 min   →   6,24 km/h    urbano
   nº9   2,9 km / 28 min   →   6,26 km/h    urbano        ⭐ NUEVA
   nº10  4,4 km / 43 min   →   6,14 km/h    urbano        ⭐ NUEVA · rompe el origen
   nº8   6,6 km / 59 min   →   6,71 km/h    casi sin semáforos
```
⭐⭐ **Las tres urbanas caen entre 6,14 y 6,26 —un 2 % de dispersión— y la de sin paradas se sale del
grupo.** ⇒ **La parada urbana se come del orden de medio km/h**, y ya no es una comparación suelta:
son **tres contra una**.
⭐ **Y la nº10 ROMPE EL ORIGEN**: es la única medida que no sale de El Coloso 2, así que **no hereda
su enganche.** *Las otras tres compartiéndolo son un control que apareció solo.*

**De cinco bandas, cuatro son ya MEDIDAS.** ⚠️ **Y la de 40 min pasó de `~3,8–4,2` a `~4,3–4,5`: la
derivada se quedaba corta.** ⛔ **No se ajustó para que cuadrara — se sustituyó por una medida**, que
es el único motivo válido que el propio banco admite. ⚠️ **Solo la de 5 min sigue derivada**, y es
justo donde peor cubierto está: **cuatro trayectos de ~500 m sin ninguna medición.**

⭐⭐ **Y la batería volvió a salir IDÉNTICA fila a fila a la del día anterior, con dos rutas más
dentro** — con su línea de cierre volviendo a `✅ un fallo detectado ya no puede terminar en verde`,
**cerrada al declarar lo que faltaba, no apagando nada.**

**⛔⛔ EL DÍA 24 HA LLEGADO, Y ERA HOY.** *La tanda 3 aceptó el mecanismo del puntero con una condición
escrita —«¿qué pasa el día 24, cuando nadie se acuerde?»— y el 9 de agosto **el puntero estaba en
verde con una cifra caducada publicada**.* ⇒ **leyes 133 y 134**, y las dos en
`docs/H1-QUE-QUEDA-ABIERTO.md §B6` con su ejemplo.

⚠️ **Y `data/pruebas/RUTAS-CONOCIDAS.md` entra por fin al repositorio**, con su argumento: **dos de
los diez metros congelados salen de rutas que solo existen en ese fichero** ⇒ sin él, un clon no
puede reproducir la nº9 ni la nº10 y **la costura de parada se queda sin su entrada.**

⚠️ **Latentes que conviene no perder:** el apagado del centinela vive donde no toca y **29 ficheros
requieren `portales.js`** (L1) · `Par.analizar([])` devuelve `un-solo-lado` sobre una lista vacía
(L6) · **el índice se queda a 0 casillas en silencio** si las vías vienen vacías (L7) ·
`Gr.rutaEntre` sobre un grafo vacío revienta sin nombrar la causa, teniendo el proyecto la forma
correcta escrita al lado (L8) · **18 commits antiguos con correo personal** (los 18 más viejos: la
ley de 001 llegó tarde, y **no se puede deshacer sin reescribir el historial de un repositorio
público**) · **dos radios de enganche distintos** (120 m para los portales, 350 m para una
coordenada suelta) · y **la ODbL vencida** más los visores atribuyendo `© OpenStreetMap` **sin
`contributors` ni enlace a la licencia**.

✅ **Higiene limpia**: ningún secreto, credencial ni dato de terceros, con positivos de control.
✅ **Y lo que el bloque A cerró y no hay que volver a mirar:** `CLAUDE.md` (verdadero punto por
punto), `LICENSE` (Apache 2.0 íntegra), y el `.gitignore` (probado con `git check-ignore`, 14
rutas + 6 positivos).

⚠️ **Lo que A declaró que NO pudo auditar:** cuáles de las 297 líneas `⛔` son un fallo vivo *(el
volcado existe; es el sitio exacto donde estuvo dos tandas la ruta rota del casco)* · 328 de las
330 cifras de comentario · si las duplicaciones que hoy coinciden coincidieron siempre · y **si
`docs/` dice la verdad — que es el bloque B.**

⭐ **Y la costura que Antonio resolvió el 6/08:** el ejecutor **siguió auditando** tras encontrar el
correo y la ruta local, en vez de pararse, y **lo declaró**. Antonio le dio la razón ⇒ **el bloque
A queda firme entero.** *El criterio queda sentado: se puede seguir si se juzga que no es el caso
que la costura protege, pero se dice en voz alta y se declara qué quedaría provisional.*


### Los técnicos

- ⚠️ **Por qué faltan números en una calle** —¿solar, edificio grande, portales con letra, o hueco
  del dato?— **no se ha mirado nunca.** *(Duda de Antonio a partir de Cesáreo Alierta 79.)*
- ⚠️ **La interpolación sobre el hilo de la paridad**: lo honesto sería que el 78 caiga entre el 74
  y el 84. **32.401 consultas la esperan.** No hecha.
- ⚠️ **1.592 portales (3,5 %) sin NINGÚN testigo** — ni con nombre en OSM ni alcanzados por la capa
  municipal. ⚠️ **No todos son descampados**: mediana de 25 vecinos en 300 m, y en la muestra
  aparecen **Avenida de la Ilustración, José Anselmo Clavé y Vía Hispanidad**.
- ⛔ **198 portales con firma de enganche malo — y NO son inocentes** (tanda 14). Están en sitios
  donde **el 82,8 % de sus vecinos tampoco reconoce su calle**, frente al 43,3 % normal, **y no lo
  explica ni la geografía previa ni el tipo de vía**. Solo en **23** se puede señalar el culpable;
  de los otros **175 solo se sabe que no están donde deberían, no dónde deberían estar**.
  ⚠️ Esto **matiza** el `SÍ ACIERTA` del punto ciego: el veredicto no se mueve, pero **qué significa
  aquel 2,7 % sí** — parte parecen errores de verdad, no ruido inevitable.
- ⚠️ **565 portales sin ningún testigo EN SITIO URBANO** (de 1.592; el resto, polígono y campo).
  ⭐ **Y no están repartidos: están APILADOS.** 267 son de la **Avenida de la Ilustración**, tres
  vías juntan el 66,9 %, y en total son **28 vías**. *Un problema concentrado es mucho más barato de
  cerrar — y mucho más visible para quien ande por ahí.*
- ⚠️ **269 portales en 19 vías señalados por el orden de los números.** ⚠️ En 6 de las 10 peores,
  los señalados son **casi todos los portales de la vía** (6 de 6, 4 de 4): **no es un portal
  descolocado, es la vía entera rara.** Lista revisable: `CALLE RÍO` y `CALLE ARIZA` son las más
  limpias para mirar.
- ⚠️ **El punto ciego de Garrapinillos y los polígonos** necesitaría **otra fuente**, y hoy no se
  sabe cuál.
- ⚠️ **`H1-PRIMER-GRAFO.md` §C4d publica una ruta que estuvo rota dos tandas** (`Puerta del Carmen
  → Magdalena`). El documento es registro histórico: **se corrige en documento nuevo, no se
  reescribe.**
- ~~⚠️ **El diseño y la adenda se contradicen** en el enganche de portales~~ ⛔⛔ **RETIRADO EL
  9/08 — ES `B·V1`, EL ROJO FALSO, ESCRITO AQUÍ CON OTRAS PALABRAS.** *No hay contradicción que
  reconciliar:* `DISEÑO-H1-GRAFO.md` **declara en su tercera línea que es una propuesta sin
  construir**, y §P4.1 no describe el motor — lo propone y no se adoptó (las cinco pruebas, en
  §10 · `B·V1`). ⭐⭐ **Y lo que enseña: la retirada y lo retirado llevaban dos días conviviendo en
  esta misma sección.** *Es la ley 104 contra el propio documento de estado.*
- **944 paradas en el WFS contra 934 en el GTFS.** Sin explicar.
- **La clave del NAP.** Trámite de Antonio. El feed muere el **05/10/2026**.
- **Los dos números no cerrados de §4** (4,4 % de la red medida; 117 capas sin abrir).
- **`MU2_señalizacion_horizontal`** —donde vivirían las cebras— publicada pero inaccesible: su
  nombre lleva eñe y el servidor no resuelve el tipo. `NO CONSTA`.

### ⭐⭐ EL MOMENTO ORO — CANDIDATO FIRME (tandas 6 y 7)

> **Son las 03:40. Hay 15 farmacias "de guardia" y solo 8 están abiertas.**
> **Desplázame te lleva a una de esas 8, y te dice por qué las otras 7 no valen.**

Encaja con todo lo decidido: **necesita el reloj** (H3) · **necesita el motor multimodal** (a esa
hora casi no hay bus: se va andando o en BiZi) · y **se entiende en veinte segundos sin saber nada
de grafos**. Ninguna app de rutas lo hace: te llevan a *una* farmacia, no a la que está abierta
AHORA.

⚠️ **Y la escena estaba mal planteada al nacer.** Era *"la farmacia de guardia más cercana"* — y
**un filtro por `tipo=guardia` acierta el 53 % a las 03:40**, porque siete de las quince son
refuerzo de horario partido (*"de 9:15 a 13:45 y de 17:00 a 21:30"*), cerradas de madrugada.
⇒ **La pregunta correcta no es *"¿está de guardia?"* sino *"¿su horario cubre AHORA?"*.**
⭐ Y ahí está el momento oro de verdad: **no es que te lleve a la farmacia — es que distingue lo
que la fuente mezcla, y lo dice.**

### El dato de guardias — lo que se sabe

| | |
|---|---|
| **Fuente** | `farmacia.json?tipo=guardia&fecha=DD-MM-YYYY` (sede del Ayuntamiento) |
| ⭐ **¿Calendario o consulta viva?** | **CALENDARIO.** Acepta fechas futuras, el parámetro se respeta (probado a +1 y +15 días, con `turno` secuencial: catorce días, catorce turnos) ⇒ **se hornea como el GTFS y NO rompe la exclusión del tiempo real** |
| **Horizonte** | Al menos 15 días. Fechas pasadas: sin datos |
| ⚠️ **Tope silencioso** | `rows=1000` devuelve `rows: 500` |
| ⚠️ **El horario ORDINARIO no sirve** | Solo **67 de 314** dicen algo de entre semana; 121 hablan solo del sábado; 126 no dicen nada. **El horario de lunes a viernes no está en ninguna parte** |
| ⚠️ **Datos personales** | 11 registros llevan nombre de titular en `description`. 004 solo importa `sourceId`, `name`, `lat`, `lon` |
| ⚠️ **Licencia** | No consta en el metadata de farmacias. Hay que declararla por cuenta propia |

### ⭐⭐ EL HORNO DE HORARIOS — diseño apuntado, construcción en H3

El texto **no es lenguaje libre: es un formulario mal guardado.** 16 redacciones en 188 registros,
y dos patrones cubren las 15 de guardia de un día. Se parsea con reglas explícitas.

**Qué produce, y esto es lo que lo hace horneable:**
⛔ **NO devuelve "abierta / cerrada".** Devuelve **TRAMOS HORARIOS**, o el estado *no entendido*.
Quien decide si está abierta **ahora** es el motor comparando con el reloj. *Si el parser opinara
sobre "ahora", cada respuesta caducaría en minutos y no se podría hornear.*

**Tres estados de salida, no dos** *(la estructura de 003: no hay nada · no lo sé · no me lo creo)*:
- **Entendido** → *"abierta ahora, cierra a las 21:30"*
- ⭐ **No entendido** → **la app lo dice y enseña el texto original**: *"está de guardia; su horario
  dice «…» y no sé interpretarlo"*
- **Sin horario** → *"está de guardia, pero no publica horario"*

**Lo que lo hace fiable no es el parser, es lo que lleva alrededor:**
1. **Contador de cobertura** — cuántas de las 314 entiende. Se publica, y **si baja, algo cambió en
   el origen**.
2. **Corpus congelado** — las frases reales de hoy como casos de prueba. Cuando el Ayuntamiento
   cambie una redacción, **el parser se pone rojo contra el corpus** en vez de fallar en silencio.
3. ⭐ **Contraprueba de laxitud** — frases que NO debe entender. *Un parser laxo interpreta
   cualquier cosa y da 100 % de cobertura: el número más tranquilizador y más falso* (ley 26).
4. **Techo declarado** — qué frases ningún parser resolverá bien, dicho en voz alta.

⚠️ **Dos trampas ya visibles en el dato:**
- ⭐ **`"Abiertas de 9:15 h. a 9:15 h. del día siguiente"` CRUZA MEDIANOCHE.** Leído sin cuidado
  dura cero minutos o veinticuatro horas. **Y es justo la frase de las que están abiertas a las
  cuatro de la mañana: la que más importa es la que más fácil se rompe.**
- **El horario de guardia y el ordinario son cosas distintas** —uno viene del endpoint por fecha,
  otro del censo— y **no se mezclan en el mismo campo**.

⛔ **Lo que NUNCA se hace:** inventar el horario de las que no lo publican, ni asumir que una de
guardia abre 24 h. Ahí el silencio es obligatorio.

### Los POI, como categoría y no como cuarenta integraciones

Farmacias, centros cívicos, equipamientos: **no tocan el motor.** Son nodos que se enganchan al
grafo igual que un portal; lo único que cambian es el **buscador**. ⇒ Se pueden añadir **casi
gratis y en cualquier momento**, incluso con el motor ya hecho.

⚠️ **Y por eso NO entran ahora.** El catálogo tiene **709 conjuntos**, y cada uno que entra hay que
descargarlo, refrescarlo, verificar sus coordenadas, comprobar su licencia y mantenerlo vivo. **Si
Desplázame acaba con cuarenta capas de puntos, el mantenimiento se come el proyecto y el motor —que
es lo que se enseña— queda enterrado bajo un catálogo.**
⇒ **Entran como CATEGORÍA: un esquema común, un cargador, una regla de enganche.** Añadir un
conjunto nuevo debe costar una línea de configuración, no una tanda.

### `00 ZGZ RADAR` — cabo cerrado

⚠️ **Carpeta que nadie miró en once tandas, porque yo nunca pedí que se mirara.** Contiene **939
paradas de autobús con lat-lon** y **46 líneas con la secuencia ordenada de postes por sentido**.
**No hay geometría de calles** (control positivo y negativo pasados) ⇒ **D0 no se toca.**

**Valen como VERIFICADOR, no como fuente**: el GTFS ya trae las paradas, así que su papel es ser un
segundo par de ojos.
⛔ **No se copian todavía:** no hay script que los descargue, su propia documentación los llama
*"JSON maestros ubicados"* y **la licencia no consta**. Es el caso de la capa de nombres de 003 con
otra piel.

### ⭐⭐⭐ H2 · LA RED — LO QUE SE SABE TRAS LAS DOS PRIMERAS TANDAS (10/08)

**H2 abierto el 10/08.** Dos tandas de reconocimiento, ninguna línea de código de producto.
Registro entero en `docs/RECONOCIMIENTO-H2-GTFS.md` y `docs/RECONOCIMIENTO-H2-HERENCIA-003.md`.

> ⭐⭐⭐ **LO QUE DECIDE EL TAMAÑO DEL HITO: EL TRANSBORDO NO VIENE, DE NINGUNA FORMA.**
> `transfers.txt` ⛔ · `pathways.txt` ⛔ · `levels.txt` ⛔ · `parent_station` no vacío **0 de 984** ·
> `location_type = 1` **0 de 984**. **Y bus y tranvía no comparten NI UNA parada:** 934 + 50 = 984,
> intersección **0**, huérfanas **0**.
> ⇒ **Todo transbordo entre modos es forzosamente un tramo A PIE, y hay que construirlo entero.**
> ⭐⭐ **Y ahí está la ventaja: los routers sin grafo peatonal lo resuelven con un radio fijo. 004 lo
> puede CALCULAR ANDANDO.** H1 deja de ser un hito previo y pasa a ser **pieza portante** (ley 144).

**H2·1 · EL GTFS, BAJADO Y CONTADO (10/08).**

- ⭐ **Cuatro sondas antes de creerse el `200`** (ley 34): sin clave **401** · clave inventada con
  forma de UUID **401 con otro mensaje** · ficha 999999 **500** · la 1176 **200 y 6.883.311 B**.
  ⭐⭐ **La que discrimina es la segunda: dos mensajes distintos ⇒ comprueba la clave, no la cabecera.**
- ⚠️ **El NAP responde 500, no 404, a una ficha inexistente.** ⇒ **El día que la 1176 desaparezca,
  la señal será indistinguible de una avería.** Dato operativo del plazo del 05/10.
- ⛔ **La respuesta no trae `last-modified`, ni `etag`, ni `age`, ni `via`.** Desde HTTP **no se puede
  saber si es fresco o una réplica rancia**: la frescura hay que sacarla de dentro del fichero.
- ⭐⭐ **Ocho filas de nueve cuadraron con lo publicado el 2/08 — y NO se celebró.** Se comprobó si se
  estaba leyendo el mismo artefacto: la descarga es de hoy (`date` + `x-correlation-id` único), el
  servicio está vivo (tres cuerpos distintos), **y es el mismo fichero: el feed no se republica desde
  el 23 de junio.** ⇒ ⭐⭐⭐ **La descarga es fresca y el dato es viejo, y las dos son ciertas.
  Cuadrar no valida el instrumento: valida que el feed lleva siete semanas quieto.**
- ⛔⛔ **EL PRIMER CONTROL DE VERDAD SERÁ LA PRÓXIMA DESCARGA**, cuando cambie el `feed_version`.
  *Hasta entonces, todo lo que este proyecto cree saber del GTFS sale de un fichero inmóvil.*

**H2·2 · LA HERENCIA DE 003 (10/08).**

- ⭐⭐⭐ **Lo que 003 tiene de valor no son sus datos: son sus VALLAS** (ley 137).
- ~~⛔ **De transbordo, 003 no tiene NADA** — los 13 aciertos son chips de interfaz~~
  ⛔⛔ **CORREGIDO POR H2·3 (10/08). ERA FALSO, Y LO ESCRIBIÓ ESTE DOCUMENTO AYER.** Son **once**
  ficheros, no trece, y **tres son motor**: `engine/correspondencias.ts` (338 líneas),
  `engine/topologia.ts` (335) y `sources/avanza/correspondencias.ts` (277).
  ✅ **Lo que SIGUE siendo cierto:** 003 no tiene **ENRUTADO** de transbordo — nada enlaza dos
  paradas distintas, ni calcula un tramo a pie, ni mete el tiempo. Su pregunta es *«¿qué otras
  líneas paran EN ESTE MISMO POSTE?»*.
  ⚠️ **Y lo que la frase falsa hizo invisible es una DECISIÓN heredable:** *las correspondencias se
  resuelven en UN SOLO SITIO, con un índice del día —no «habitualmente»—, un suelo de cobertura
  declarado (`RATIO_SUELO = 0.8`) y un modo degradado que se dice en pantalla.*
  ⭐⭐⭐ **Y lo que enseña, que es lo que sube a ley: el positivo de control ERA CORRECTO y estaba
  verde.** El `grep` sí devolvió `correspondencias.ts`; **lo que falló fue leer su salida.**
- ⭐ **Se hereda ejecutada:** el GTFS se procesa en BUILD, no en runtime · cada geometría lleva su
  procedencia y **no se mezclan jamás** · ante dos fuentes que se contradicen **no se adjudica: se
  citan las dos y quién lo dice** · nunca decir «todos» · fuera el tiempo real.
- ⚠️ **Se hereda CON CAMBIO:** *el nombre bueno se pide al operador* — pero **en 004 los operadores
  son TRES** (Avanza, Tranvías, y el Ayuntamiento que nombra los portales), **y para el peatón puede
  que no haya a quién preguntar.**
- ⛔ **Cobertura declarada e incómoda: 3.101 de 22.615 líneas de documentación (13,7 %) y CERO de
  199 ficheros de código.** ⇒ **El cubo MAQUINARIA se apoya en documentos** — en un repositorio que
  tiene catalogado por escrito un caso de documento de diseño que promete un `User-Agent` **que el
  código nunca implementó**. *Hay prueba, dentro de 003, de que sus documentos pueden mentir sobre su
  código.*

**LO QUE SE MIDIÓ Y CORRIGE AL PROPIO PROYECTO:**

| | qué | |
|---|---|---|
| ⭐⭐ | **La caducidad es POR OPERADOR, no del feed** | El bus respeta `20260623–20261005` **al día, 0 filas fuera**; el tranvía mete **quince meses** (20250916 → 20261227). **72 filas posteriores al 05/10, y cinco de esos seis servicios TIENEN VIAJES** ⇒ *un motor que no mire `feed_end_date` seguirá sirviendo tranvías después de caducar, con cara de acertar* |
| ⭐⭐ | **8 rutas ZOMBI con cero viajes** | `CEM · CE · LAN · EM1 · EM2 · V1 · ES3 · V4`. De 53 rutas, **45 tienen viajes**; de 52 de bus, **operan 44**. ⇒ **Una ruta sin viajes es un enlace que nunca se puede tomar.** Y las tres primeras explican el corredor ausente. ⚠️ `EM3` **no existe** en este feed, aunque 003 la nombra en un título |
| ⭐⭐ | **944 contra 934 no eran diez casos: eran DOCE** | **11 solo en el WFS · 1 solo en el GTFS · 933 comunes.** *La resta escondía la mitad.* ⭐ Positivo de control geométrico: **ninguna tiene gemela** (la más cercana a 64 m y es otra parada) ⇒ discrepancias de **inventario**, no de codificación |
| ⭐⭐ | **Seis de las once, explicadas** | `PA00617` Parque de Atracciones + `PA00646`–`PA00650` Duque de Alba. Las sirven `CEM`/`CE`/`LAN`, **que son tres de los ocho zombis**. ⚠️ *La cadena «sin viajes ⇒ fuera de `stops.txt`» es inferencia, no un hecho declarado* |
| ⛔ | **Y las otras cuatro NO son obras** | 003 midió que **el GTFS conserva la ruta teórica con la calle cortada** (`Coso 126` sigue dentro). ⇒ **las obras no borran paradas del feed**, luego Ramón y Cajal / Madre Ràfols sigue `CAUSA NO CONFIRMADA` |
| ⭐⭐ | **Los grupos `813x` no cuadran entre TRES inventarios** | ZGZ RADAR tiene `8134-8137`; el WFS de hoy tiene `8130-8133`; **el GTFS no tiene ninguno de los ocho.** ⚠️ Ocho postes consecutivos partidos por la mitad: **la frontera cae en un número, no en un sitio.** ⛔ Asimetría de evidencia declarada: los `8130-8133` medidos aquí, los `8134-8137` citados de 003 |
| ⭐⭐⭐ | **Los nombres del GTFS están rotos en el 80,4 %** | 003 lo midió: **751 de 934** (491 conectores en mayúscula + 515 `N.º`), transformación **mecánica y determinista al exportar**, que destroza los romanos (`III → Iii`) y no sabe subir una `á`. ⛔⛔ **ES CON PÉRDIDA: deshacerlo desde este lado sería adivinar.** ⭐ Y la medida propia de 004, que es un SUELO porque no tiene el nombre verdadero: **492 de 934 (52,7 %)** |
| ⭐⭐⭐ | **Y el tranvía escribe BIEN, en el mismo fichero** | Bus: 8 tildes caídas y **489 partículas en mayúscula de 934**. Tranvía: **0 y 4 de 50.** ⇒ **Es la TERCERA aparición de «dos publicadores en una columna»** — ya cazada en `stop_code` y en `location_type`, y **en `stop_name` no se había mirado** |
| ⭐ | **La licencia del NAP, leída** | Permite *compartir, copiar, distribuir* **y modificar, adaptar, extraer, reordenar y combinar**. A cambio: **«Powered by MITRAMS» + cita del MITMS + decir si el dato es BRUTO o PROCESADO**, y ⚠️ **conservar SIN ALTERAR la metainformación de fecha y condiciones**. ⛔ **Ésta última muerde en el build: si el artefacto compacto se come `feed_info.txt`, 004 incumple la licencia Y pierde la caducidad. Un fallo, dos consecuencias** |
| ⭐⭐ | **Verificación externa que no se buscaba** | 003 auditó **este mismo feed** el 13/07 y publicó **catorce cifras: las mismas al byte.** Dos proyectos, dos instrumentos, 28 días. ⛔ **No valida el instrumento —el feed está quieto— pero descarta que las cifras sean artefacto de un parser** |
| ⚠️ | **El árbol local de 003 publica menos de lo que tiene** | **20 entradas ignoradas**, entre ellas `.cache/fixtures-reales/` con respuestas reales de Avanza **bajo compromiso de no redistribución. Ninguna se abrió.** ⇒ *Quien reconstruya esta herencia leyendo solo GitHub verá menos.* ⭐ Y medido aparte: **306 ficheros versionados en local contra 289 en el repo público ⇒ 17 que nunca se subieron** |
| ⚠️ | **`tools/` no la protege ninguna regla** | Se versiona por defecto lo que caiga ahí; cada derivado se ha excluido **a mano, cuatro veces** (`.gitignore` 312 · 318 · 324 · 334). **No muerde hoy** —`bajar-gtfs.js` solo escribe en `data/exploracion/`— **pero es un cabo** (ley 142) |
| ⭐ | **El mecanismo para cazar rutas falsas YA EXISTE, y le falta alcance** | `src/superados.js:447` hace `existsSync` sobre las rutas de **su propia tabla** y sobre ninguna otra. **Nada recorre las rutas que aparecen en la PROSA.** ⇒ *Ley 118: el guardián vigila lo que alguien le declaró, y nadie le declaró la prosa.* **Candidato a instrumento** |

**H2·3 · LAS VALLAS Y LOS CABOS (10/08) — lo medido:**

| | qué | |
|---|---|---|
| ⭐⭐⭐ | **La valla de 003 estaba en la REGEX, no en la frase** | Ver §7·129 y §8·145. ⛔ **004 NO puede heredar `int(stop_code[2:])`: tiene que heredar `/^PA(\d{5})$/`.** Cuatro vallas de cinco están en el código, y la del diff de desvíos **además en el tipo y en un test que existe** |
| ✅ | **Los dos 934 son EL MISMO conjunto** | `A∩B = 934`, las dos diferencias **0**. ⇒ **`A·V2` no tiene hermano aquí y el cruce contra el WFS se hizo contra el conjunto correcto: no hay nada que rehacer.** ⭐ Salió limpio a la primera y se trató como sospecha: el control es que **0 de las 50 del tranvía** casan el criterio ⇒ no se estaba comparando una lista consigo misma |
| ⛔ | **El cruce `813x` queda en `NO CONSTA`** | `PA08134`–`PA08137` **no están en ninguna fuente al alcance**; en todo el rango `080xx`–`082xx` el WFS de hoy solo tiene `PA08000` y `PA08130`–`PA08133`. **Haría falta el inventario de ZGZ RADAR o un WFS anterior al 13/07.** ⭐ **Control ya medido para cuando llegue:** en esa zona dos postes distintos están a **170-300 m** y el par más apretado a **50,2 m** ⇒ *«renumerado» y «otro poste» se distinguirán solos* |
| ⭐⭐⭐ | **Terminales variables: son DOS de 74 sentidos, no una anécdota ni la red entera** | `44 s0` cuota 39 %, determinante **DÍA** (117 laborables · 0 sábados · 0 domingos, y solo 07h-20h) · `23 s0` cuota 32 %, determinante **HORA** (cero viajes entre las 08h y las 12h; todo de 23h a 25h). ⭐⭐ **Salieron a ciegas dos de las tres que nombró Antonio** |
| ⚠️ | **La 34 NO sale variable en este feed** | Cuota 1,2 %, y su segundo terminal no es el parque. ⛔ **Y la cadena «sin viajes ⇒ fuera de `stops.txt`» SIGUE SIENDO INFERENCIA**: la comprobación que la habría cerrado no podía fallar (§7·128) |
| ⭐ | **003 no podría haber visto esto nunca** | Su adapter **se queda con el viaje más largo de cada (línea, sentido) y tira el resto** ⇒ **colapsa el terminal variable por construcción, y sobrestima su propia cobertura.** ⛔ **Decisión que 004 NO hereda** |

> ⭐⭐⭐ **Y LO QUE ABRE, COMO HALLAZGO Y NO COMO DISEÑO — pendiente de decisión de Antonio:**
> *«¿La línea 23 sirve Clara Campoamor?»* **no tiene respuesta sí/no.** A las diez de la mañana es
> **no**; a las once de la noche es **sí**. ⇒ **Una red sin reloj solo puede dar una de las dos, y
> las dos son falsas parte del día.**
> ⚠️ **Y el fallo NO es simétrico:** el «sí» falso **manda a alguien a esperar un autobús que no va
> a venir**; el «no» falso solo le esconde uno. **El primero se paga en la calle.**
> ⇒ Si esto entra, **H3 deja de ser «añadir horarios» y pasa a ser «restringir la red por tiempo»**,
> que es un encargo distinto. **Tamaño medido: 2 sentidos de 74.**

**H2·4 · EL DISEÑO EN PAPEL DE H2a (10/08) — `docs/DISENO-H2A-RED.md`, propuesta sin construir.**

> ⭐⭐⭐ **LA ARITMÉTICA QUE DECIDE EL HITO:**
> ```
>    pares totales  N(N-1)/2, N=984 ....... 483.636
>    a ≤ 300 m a vuelo de pájaro ..........   3.231   (0,668 %)
>    que además aportan una LÍNEA NUEVA ...   2.538
> ```
> **Reducción de 190×.** El transbordo **no es medio millón de rutas peatonales: son 2.538**, que es
> un cálculo de minutos. ⭐ **Y el filtro lleva control:** si no filtrara nada los inútiles serían 0,
> si filtrara todo quedarían 0 — **da 693 y 2.538.**
> ⚠️ **Coste declarado:** 9 paradas sin pareja a 300 m, 2 a 500 m, la más aislada a **592 m** ⇒
> *ningún radio le da transbordo a todo el mundo, y eso es un hecho de la ciudad, no del método.*

| | qué | |
|---|---|---|
| ⭐⭐⭐ | **EL HALLAZGO QUE CAMBIÓ EL DISEÑO — y sale de datos que ya estaban publicados** | Los rodeos de las diez rutas de H1, mirados **por tamaño de trayecto**, que nadie había hecho: **largas 1,06 · 1,09 · 1,15 · 1,24 · 1,25 (media 1,16)** contra **cortas 1,10 · 1,32 · 1,37 · ⛔ 2,17 (media 1,49).** ⚠️ *Corregido el 10/08: esta lista publicaba CUATRO largas y son **CINCO** — faltaba la nº10 (4.044 m, rodeo 1,15). El error lo copió esta conversación sin contarlas. **El argumento no se debilita: se refuerza**, porque la media de las largas baja.* La nº4 recorre **506 m para salvar 233 en recta.** ⇒ ⭐⭐⭐ **El rodeo es peor y mucho más variable justo en los trayectos cortos, que son los del transbordo.** Un radio fijo **no es solo impreciso: es peor precisamente en el rango donde vive la pieza.** ⇒ **El radio es un PRE-FILTRO barato; el coste son los METROS ANDANDO** |
| ⭐⭐ | **La costura bus↔tranvía existe físicamente** | **48 de 50** paradas de tranvía tienen un autobús a ≤300 m — mín **20 m**, mediana **73 m**, p90 **130 m**. Las dos que no son Juslibol, a **418 m**, declaradas. ⛔ **No se sube el radio a 500 m para rescatarlas: multiplicaría los pares por 2,5 para ganar dos paradas** |
| ⭐⭐⭐ | **D1 · La identidad, con la colisión medida EN 004** | `bus AA99999` 934/934 · `tranvía 9999` 50/50 · **intersección literal de códigos: 0**. ⛔ **Quitando prefijo y quedándose el número: 15 colisiones.** ⛔⛔ **Con `int(stop_code[2:])` de 003: 47 choques, y 24 paradas en el poste 1 — sin un solo error.** ✅ **Con `/^PA(\d{5})$/`: 0** ⇒ **La parada se identifica por su `stop_id` OPACO; el poste es un ATRIBUTO que 50 paradas no tienen.** ⭐ Y el tranvía **no recibe puente equivalente**: su código se guarda como cadena sin interpretar, porque `NO CONSTA` qué significa |
| ⭐⭐ | **La valla tiene una prueba que PUEDE FALLAR** | Meter los 50 códigos del tranvía y exigir 50 «no tiene». **Con la fórmula de 003 esa prueba da 24 al poste 1 y se pone roja** (ley 147) |
| ⭐ | **El enlace guarda METROS, no minutos** | Convertir a minutos exige una velocidad, y la de H1 **está medida como banda (4,3–4,5 km/h), no como número.** Guardar minutos convertiría una banda en un dato falso-preciso. **Se derivan al enseñar, con su banda y diciendo que son estimados** |
| ⭐⭐ | **`SIN CAMINO` es un RESULTADO, no un fallo** | El grafo tiene **170 componentes** y tres barrios rurales incomunicados de verdad. ⭐ **Y la comprobación que puede fallar: si el cocinado saliera con CERO `SIN CAMINO`, sería SOSPECHOSO** — significaría que el pre-filtro solo elige pares del centro |
| ⛔⛔ | **D3 QUEDA COMO MEDICIÓN PENDIENTE, Y ES LA QUE PUEDE TUMBAR ESTO** | **No hereda `AVISO_ENGANCHE_M = 65`**: ese es el p99 de **portales**, y un poste está **en la vía pública, no en una fachada**. ⇒ **Si muchos postes enganchan a 100-200 m, el radio de 300 m deja de tener sentido.** Es la primera tanda que puede fallar de verdad |

**⚠️ LAS CUATRO PREGUNTAS QUE EL DISEÑO NO SE HIZO, declaradas por su autor** — *el documento salió
redondo y en vez de celebrarlo enumeró lo que no había mirado:*

1. ⭐⭐ **Se asume que un enlace peatonal es SIMÉTRICO, y no se ha medido.** ⇒ *Y puede no ser una
   medición: si el grafo de H1 es NO DIRIGIDO, la simetría está garantizada por construcción — y
   entonces el enlace se guarda una vez y no dos, lo que ataca también la pregunta 4.*
2. **Dos paradas con el mismo nombre** («Juslibol» ×2).
3. ⛔⛔ **La estabilidad de los `stop_id` entre versiones del feed — Y ESTÁ DEBAJO DE D1.** Si los
   identificadores cambian, **la decisión central de la tanda está sobre arena** y lo cocinado en
   agosto deja de casar en octubre **sin avisar**. ⇒ **Hoy no se puede comprobar: solo existe una
   versión, y 003 auditó la misma.** ⭐⭐⭐ **Eso asciende la tanda de repetibilidad de higiene a
   VALIDACIÓN DE D1: cuando cambie el `feed_version`, la primera pregunta no es cuántas paradas hay,
   sino si las 934 siguen llamándose igual.**
4. **El tamaño del artefacto.**

⚠️ **Y un defecto del ENCARGO, que es de esta conversación:** pidió *cero código* y a la vez *toda
cifra medida con su comando*. Se resolvió con scripts de usar y tirar fuera del repositorio ⇒
**el 2.538, que es el número que decide el hito, está publicado SIN SU INSTRUMENTO.** La regla del
proyecto es *«lo que se versiona es el script, no su salida»* y aquí ha pasado lo contrario.
**Se arregla en H2·5, donde esos scripts entran como código de verdad.**

**H2·5 · LOS POSTES EN EL GRAFO (10/08) — `docs/H2A-ENGANCHE-DE-LAS-PARADAS.md`.**

> ⭐⭐⭐ **EL RADIO DE 300 m DE D4 SOBREVIVE, Y LA ARITMÉTICA DE 2.538 NO SE REHACE.**
> ```
>    población             n     mín   p50   p75   p90   p95    p99    máx
>    PORTALES (control) 2308     0,2   5,3   8,5  17,4  27,7   65,4  195,8
>    PARADAS · bus       934     0,0   2,2   5,0   7,3   8,3   11,1   23,7
>    PARADAS · tranvía    50     0,0   2,6   5,5   9,6  12,4   16,2   16,2
> ```
> **0 de 984 por encima de 65 m.** El error que el enganche mete en un par: **4,4 m típicos = 1,5 %
> del radio**; peor caso imaginable 47,4 m.
> ⭐⭐ **Y la respuesta es creíble por dos motivos que valen más que el número:**
> **(1) tiene causa física** — un portal es una puerta en una fachada, y entre fachada y calle hay
> acera, jardín o aparcamiento; **un poste está EN la vía pública, muchas veces encima de la propia
> arista**; **(2) tiene control** — el mismo instrumento reprodujo el p99 de 65 m sobre portales con
> **0,4 m de desvío**, y la tolerancia vive en `A.exige`, no en un comentario.
> ⇒ **`AVISO_ENGANCHE_M = 65` es el p99 de OTRA POBLACIÓN. Para paradas sobra un orden de magnitud.**

| | qué | |
|---|---|---|
| ⭐⭐ | **D1 implementado, y el rojo se vio primero** | `--formula=003` ⇒ **50 paradas de tranvía con poste · 24 colapsadas al poste 1 · 47 choques · 6 de 12 controles mal · código 1.** La buena ⇒ **0 · 934/934 · 0 choques · 12/12 · código 0.** ⭐ **Y el rojo destapó un séptimo defecto que nadie había nombrado: la fórmula publicada tampoco recorta espacios** — `" PA00669 "` le da `null` |
| ⭐⭐ | **EL GRAFO NO ES DIRIGIDO** | `src/grafo.js:25-26`: cada arista se empuja en los dos sentidos con el mismo peso. ⇒ **La simetría del enlace está GARANTIZADA POR CONSTRUCCIÓN, no asumida, y el enlace se guarda UNA vez** — cierra dos de las cuatro preguntas abiertas de H2·4 (la simetría y el tamaño). ⚠️ **Con su límite: simétrico DENTRO DEL MODELO, que no modela escaleras de un solo sentido** |
| ⭐ | **El 2.538 se reproduce exacto con los scripts ya versionados** | `483.636 → 3.231 → 2.538`, comparado con `A.exige`. ⛔⛔ **Y su autor lo declara: «reproducir no es verificar»** — los dos scripts los escribió él el mismo día con la misma idea; **reproducen su criterio, no la realidad. El control de verdad sería un tercer camino y no lo hay** |
| ⭐ | **`SIN CAMINO` existirá: el cero que se temía no se da** | **3 paradas fuera de la componente mayor** (Ctra. Castellón) |

**⛔⛔⛔ EL CRUCE QUE NADIE HABÍA HECHO — y apunta al corazón de H2a.**

*Tres hallazgos de esta tanda son EL MISMO, y sueltos no lo parecen:*

```
   456 de 984 (46,3 %) enganchan a EJE DE CALZADA, no a acera
   nadie ha comprobado que el enganche caiga al LADO CORRECTO de la calle
   nadie ha comprobado si dos paradas distintas enganchan al MISMO punto
```

⇒ **El 46,3 % parte la comprobación de la acera en DOS POBLACIONES con DOS modos de fallo:**

- **Los 457 que enganchan a ACERA:** ahí *«lado correcto»* **es una pregunta con respuesta**, y
  `src/acera-equivocada.js` la puede contestar. Riesgo real y **comprobable**.
- ⛔ **Los 456 que enganchan a EJE DE CALZADA: ahí la pregunta NI SIQUIERA SE PUEDE FORMULAR.** El
  grafo no tiene dos lados: tiene un eje. **`acera-equivocada.js` no puede ponerse rojo sobre ellos
  porque no hay acera que equivocar.** ⇒ **Un enlace que salga de una de esas paradas recorre el
  centro de la calzada y llega al otro lado SIN CRUZAR NADA, porque geométricamente no hay nada que
  cruzar. No avisa, y no puede avisar.**
- ⭐⭐⭐ **Y su forma extrema es el tercer hallazgo:** con mediana de **2,2 m**, dos andenes
  enfrentados pueden **colapsar al mismo nodo** ⇒ **su enlace mediría CERO METROS**, cuando en
  realidad hay que cruzar la calle. *Una respuesta falsa con pinta perfecta.*

⛔⛔ **POR QUÉ IMPORTA MÁS QUE NINGUNA OTRA COSA DE H2a:** la tesis del hito es *«los routers usan un
radio fijo y por eso te mandan a cruzar una autovía; nosotros lo calculamos andando»*. **Si la mitad
de los transbordos se calculan por el eje de la calzada, el cálculo andando puede producir
exactamente el mismo error que el radio — y ahora firmado con metros, con pinta de exacto.** La
mediana del enlace bus↔tranvía es **73 m**: a esa escala, **estar a un lado o al otro de la calle es
la mitad del trayecto.**

⭐ **Y no hace falta dibujar aceras para ser honesto. Propuesta pendiente de decisión:** que el aviso
de D5 deje de ser genérico y **pase a ser un VEREDICTO POR ENLACE** — `ACERA` cuando las dos puntas
enganchan a acera y el camino va por acera · `EJE` cuando alguna atraviesa el eje · **y decirlo en la
salida.** Es barato y **es lo que este proyecto vende.**

⚠️ *Y el 46,3 % de las paradas es casi calcado al 47,2 % del término entero que H1 ya publicaba
⇒ **las paradas no tienen sesgo propio: es la ciudad la que está así dibujada.***

**⛔ CUATRO FALLOS EN ESTA TANDA, Y NINGUNO LO CAZÓ UNA SALIDA:**

- ⭐⭐⭐ **El peor: se midieron las componentes sobre un grafo que el motor NO usa**
  (`sinCondicionales=true`) — **y dio el mismo resultado, las mismas tres paradas.** ⇒ **Ninguna
  salida podía delatarlo. Se cazó porque un número de al lado no cuadraba.**
- Un `⛔` sin `alarma` en su propio script: **el fallo que fundó `alarma.js`**.
- Se publicó *«solo un fichero»* sin pasar el `grep`, **cuatro horas después de escribir la ley que
  lo prohíbe** (ley 140).
- ⛔⛔ **La línea base de arranque salió EN ROJO y se publica declarada como inservible.** Se lanzó y
  se empezó a escribir; **el puntero lee `docs/`**. Se razonó que el universo de la batería es `src/`
  y que escribir en `docs/` era inocuo: **falso.** La comparación válida se hizo contra el cierre de
  la tanda 4 con el árbol quieto: **112 líneas contra 112, `diff` vacío.**

**⚠️ CABO ESTRUCTURAL — el choque bitácora ↔ puntero.** La bitácora va por **184 entradas**, y varios
valores retirados que el puntero vigila **caen dentro de ese rango**. Documentar el choque lo volvió
a provocar **cuatro veces**; se tapó con el convenio `⟨…⟩` que ya usaba `H1-QUE-QUEDA-ABIERTO.md`.
⇒ **Recomendación de esta conversación, pendiente de Antonio: sacar la bitácora del universo del
puntero, entera.** *El puntero marca valores superados para que nadie los lea como vigentes; la
bitácora es registro histórico y su valor es decir lo que se dijo entonces, números retirados
incluidos. Marcar un superado dentro de un registro histórico es la ley 86 al revés.* ⚠️ **Y `⟨…⟩`
tapa el síntoma: si el fichero crece, el choque vuelve.**

**MEDICIONES PENDIENTES QUE DEJA ESTA TANDA:** el lado de la acera (los 457) · el colapso de dos
paradas al mismo nodo · el enganche de las **11 paradas del WFS que no están en el GTFS** · y ⭐ **la
verificación del 2.538 por un tercer camino** — *propuesta barata: cinco pares de los 2.538 y cinco
de los 693 descartados, comprobados a mano en un mapa.*

**H2·6 · LA RED DE BUS Y EL VEREDICTO POR ENLACE (10/08) — `docs/H2A-RED-DE-BUS-Y-VEREDICTO.md`.**

> ⛔⛔⛔ **LA TESIS DEL HITO NO SE SOSTIENE ENTERA, Y EL NÚMERO ES ÉSTE:**
> ```
>    sobre 324 pares candidatos, muestra determinista 1 de cada 7
>       ACERA           67    20,7 %
>       EJE            254    78,4 %   ⛔
>       MISMA ARISTA     3     0,9 %
>       SIN CAMINO       0     0,0 %   (existe: se provocó)
> ```
> **Cuatro de cada cinco enlaces pasan por donde el grafo no sabe que hay dos lados de calle.**
> *«Nosotros lo calculamos andando»* **es cierto en el 20,7 %.** En el resto **el cálculo produce el
> mismo error que un radio — firmado con decimales, que se creen más.**
> ⭐⭐ **Y la justificación medida de haberlo metido AHORA y no tras el transbordo: 79 de 324 enlaces
> (24,4 %) parecen buenos mirando solo las paradas y no lo son.** Con veredicto por parada, esos 79
> se publicaban limpios.

| | qué | |
|---|---|---|
| ⭐⭐⭐ | **Predicciones selladas ANTES de ejecutar (18:39:36), y DOS fallaron** | `P2` puntas no-eje 35–45 % → **45,7 %** (fuera por 0,7) · `P3` ACERA 20–32 % → **20,7 %** ✅ · ⛔ `P4` reparto bimodal → **mezclado** · ⛔ `P5` enlaces de 0 m: 1–40 → **0**. ⭐ **Que fallen dos es la respuesta a la costura de «no te confirmes a ti mismo»** |
| ⛔ | **Y `P4` falla hacia el lado MALO** | **Mezclado es peor que bimodal**: p50 = 31 % de aristas en eje, **no hay frontera geográfica que sirva de aviso** ⇒ **el aviso tiene que ir en CADA enlace**, uno a uno |
| ⚠️ | **`ACERA` no significa «por la acera correcta»** | Significa **«por aristas de tipo acera»**. ⛔ **Ni siquiera ese 20,7 % está verificado**: es la segunda tanda sin comprobar el LADO de la calle, y `src/acera-equivocada.js` existe y sigue sin usarse |
| ⭐ | **La red** | **44 rutas** (las 8 zombis caen contra `trips.txt`, **y el script contrasta que sigan siendo esas ocho**), 74 sentidos, 934 paradas. Los dos condicionales con su cuota exigida en banda |
| ⭐⭐ | **El artefacto, que es lo que decidirá el stack** | **200,5 KB · 41,9 KB gzip · reducción 229×** |
| ⭐⭐ | **Una suma que cierra sola entre tres tandas y tres scripts** | **2.266** (bus×bus) **+ 272** (bus↔tranvía) **= 2.538** |
| ⛔ | **T3 del encargo: la premisa ya estaba cumplida** | **La bitácora estaba fuera del puntero desde la tanda 4** (`src/superados.js:342`), demostrado con control positivo: un valor superado aparece **19 veces** y el puntero declara **6 líneas**. ⚠️ **Y sacarla no habría arreglado el choque: la causa es que un DOCUMENTO NORMAL cita el ordinal de una entrada.** Por eso el `⟨…⟩` **no se retira** — retirarlo pone `D3` en rojo. ✅ **Lo que sí valía se hizo: el puntero DECLARA sus 7 de 55 documentos excluidos, con motivo y sin perder una marca** |

**⭐⭐⭐ TANDA CORTA (10/08) · ¿ESTABA CONTAMINADO EL ARGUMENTO DEL RODEO? — `docs/H2A-RODEO-DE-LAS-CORTAS.md`.**

> **SOBREVIVE ENTERO.** Ninguna de las nueve rutas resueltas tiene las dos puntas en la misma arista.
> **Los rodeos publicados no se mueven ni una centésima. El 2,17 de la nº4 es la ciudad.**
> ⭐ Y se explica tramo a tramo: **21 tramos, dos de escaleras (30 m), 284 m de paso peatonal sin
> nombre, 94 m de Calle de la Rioja** — la plataforma elevada. **Un ida y vuelta a la esquina no se
> itemiza así.** ⚠️ La nº6 estuvo a un índice: `52337` contra `52169`.

⭐⭐ **Y con TRES instrumentos detrás, porque un «no» sin instrumento no vale:** el script **no arranca
sin el artefacto del motor** y le exige reproducir ruta a ruta los metros y la lista entera de
índices (9 de 9) — *la delación exigida, que es justo lo que le faltó al nº131* · un **tercer camino**
leído solo del artefacto · y **el positivo de control**.

⛔⛔ **Y el positivo de control corrige el diseño del encargo, que era de esta conversación:** las
rutas largas son un control **NEGATIVO** —demuestran que el instrumento no dispara de más, **no que
sepa decir que SÍ**—. Se le echaron **233.767 pares de direcciones reales que sí comparten arista**:
**6 de 6 cazados.** *Se pidió el cero sin su positivo (ley 4), y lo montó el ejecutor.*

> ⛔⛔⛔ **Y DE AHÍ SALE UN DEFECTO DE PRODUCTO DE H1, QUE NO ES DE H2a:**
> ```
>    AVENIDA SAN JUAN BOSCO 5 × 3    motor 41,4 m   verdad 17,3 m   2,4×
>    CALLE ALFONSO I 12 × 17         motor 32,5 m   verdad 11,9 m   2,7×
>    universo: 233.767 pares reales sobre 7.192 aristas · p50 34,8 m · p99 433,2 m
> ```
> **Doce metros de acera y el motor cobra treinta y dos, en el eje peatonal del centro.**
> *«¿Cuánto hay del 12 al 17 de Alfonso I?»* **es la pregunta más elemental que contesta un buscador
> peatonal.** ⛔ **Y H1 está cerrado, auditado en cuatro bloques y con siete tandas de arreglo encima:
> ninguno lo vio, porque LAS DIEZ RUTAS DE CORDURA VAN DE UN PORTAL A OTRO DISTANTE** — y son las
> diez las que definen qué se mira.
> ⇒ ⭐⭐⭐ **Es la ley 148 en su forma más cara: el universo de las rutas de cordura excluía POR
> CONSTRUCCIÓN la clase de trayecto más común que existe.**

**✅ DECISIÓN TOMADA Y EJECUTADA (Antonio, 11/08) — ver la TANDA DE ARREGLO 8 más abajo:**
`insertar` enlaza cada nodo temporal **solo con los extremos de su arista, nunca entre sí**
(`src/grafo.js:211-213`). ⭐ **Y esta tanda ha medido que el radio de explosión de un arreglo acotado
es demostrablemente CERO:** ninguna de las nueve rutas resueltas comparte arista, así que un
tratamiento que **solo actúe cuando las dos puntas caen en la misma arista** no movería ni un metro
de lo publicado. ⚠️ **La alternativa legítima es NO arreglarlo y DECLARARLO**, como el veredicto por
enlace: *«estas dos direcciones están en el mismo tramo de calle; mi ruta da la vuelta porque no sé
andar entre ellas.»* ⛔ **Lo que no vale es seguir sirviendo 32,5 en silencio.**

⭐ **Y una corrección de la bitácora, hecha por su autor sobre sí mismo:** la nº185 explicaba el cero
diciendo *«las diez rutas van de un portal a otro distante»*. **La conclusión aguanta; la causa es
falsa** — hay **8.811 pares reales** que comparten arista y están tan separados como la nº4.
⇒ **El rango del defecto llega hasta donde viven las cuatro cortas y simplemente no las tocó.**
`CAUSA NO CONFIRMADA`, y la 185 **no se reescribe** (bitácora 186).

**⭐⭐⭐ H1 · TANDA DE ARREGLO 8 (11/08) — `insertar` y la misma arista.**
`docs/H1-ARREGLO-8-MISMA-ARISTA.md`. **Se reabrió H1 por una rendija y se cerró en la misma tanda.**

> ⭐⭐⭐ **LA CONDICIÓN CON LA QUE ANTONIO APROBÓ REABRIR H1, CUMPLIDA:**
> **Las diez rutas de cordura no se mueven — ni en metros ni en la lista de 678 índices de arista.**
> Δ = 0,0 en las nueve que resuelven, y `--aristas` idéntico salvo **una línea de 656: el
> cronómetro** (18,4 s → 18,6 s).
> ⚠️ *Y su autor corrige la precisión que pidió el encargo: son **0,1 m**, no un centímetro
> (`Math.round(total*10)/10`). **Pero los 678 índices de arista son más estrechos que cualquier
> tolerancia, y salen todos iguales** ⇒ la prueba real es mejor que la pedida.*

| | qué | |
|---|---|---|
| ⭐⭐ | **La prueba nació roja y se vio roja** | 6 fallos, código 1: `ALFONSO I 12×17` **32,5 / 11,9 · 2,7×** · `SAN JUAN BOSCO 5×3` **41,4 / 17,3 · 2,4×** · ⛔⛔ `AVENIDA MONTAÑANA 736×797` **1.145,2 / 4,5 · 256,4×** · y tres puntos en la misma arista. **Verde después SIN tocar una línea de la prueba** |
| ⭐⭐ | **El tercer caso, elegido mirando el resultado — y dicho** | El par de **mayor inflación de los 233.767**. ⭐ *No es una muestra: es el TECHO del universo. Si el arreglo resuelve el peor que existe, los de en medio no pueden salir peor.* Los otros dos siguen siendo la muestra ciega. ⭐ **Y su forma explica el 256×:** Montañana es un eje de calzada de **1.164,6 m sin partir**, con los dos portales a 4,5 m **cerca de su punto medio** ⇒ salir a la esquina era recorrer la avenida entera |
| ⭐⭐⭐ | **Y una diana, no un resultado** | **Lo único que se mueve en todo `misma-arista.js` son las SEIS parejas de su propio positivo de control** (32,5 → 11,9 · 2,7× → 1,0×). **Que se muevan ésas y solo ésas** es la mejor prueba de que el arreglo apunta donde debe |
| ✅ | **La estructura, intacta** | **68.649 nodos · 98.774 aristas**, iguales. Los **26 congelados**, `diff` vacío quitando cronómetros. `misma-arista.js` sigue **9 de 9 «no»** ⇒ *el arreglo es del CAMINO, no del grafo* |
| ⭐ | **La batería gana una fila y se explica exacta** | 112 → 113. `probar-paradas.js:217` lee **todos** los `.js` de `src/`, así que el guardián nuevo añade su línea. **Ninguna de las 112 anteriores cambia** |
| ⭐⭐ | **Lo que SÍ se movió (ley 152), del mismo instrumento** | Muestra determinista **401 de 233.767**: inflación **ANTES** p50 51,8 m · p99 439,9 · máx 850,2 · **factor máx 1.936,6×** ⇒ **DESPUÉS** p50 −0,0 · p99 0,0 · máx 0,0. **Se mueven 393 de 401 (98,0 %), exactos 401 de 401.** ⚠️ *Los 8 que no se mueven no son un fallo: tienen una punta en el extremo de la arista, donde salir a la esquina YA era el camino bueno* |
| ⭐ | **Simétrico por construcción, no por suerte** | `A→B` = `B→A` al decimal en los tres casos (`Math.abs`) |
| ⭐ | **Los 16 pares de bus, corregidos** | El instrumento **recupera primero `2.266 · 16`** —positivo de control de que mide el mismo universo— y luego los corrige. **Los otros 2.250, intactos. Nada de H2a recalculado** |

> ⭐⭐⭐ **EL TERCER CAMINO QUE SE DIJO NO TENER, Y APARECIÓ SOLO:**
> La **tanda 6** midió `+49,0 m` como inflación mediana de los 16 pares — **midiendo el DEFECTO**.
> La **tanda 8** mide `−49,0 m` de lo que se les quita — **midiendo el ARREGLO**.
> **Dos instrumentos, dos días, dos propósitos distintos, y ninguno se escribió para comprobar al
> otro.** ⚠️ No es independencia total —mismo grafo, mismo universo— **pero es lo más cerca del
> tercer camino que ha producido este proyecto, y vale más que la muestra de 401 porque NADIE LO
> ESTABA BUSCANDO** (ley 149).

**⭐⭐ LEY 151 APLICADA POR SU AUTOR AL DÍA SIGUIENTE DE ESCRIBIRLA — la clase que las diez no cubren:**
`rutaAEdificio` inserta **hasta 25 puntos a la vez** y muchas puertas candidatas caen en la misma
arista; **solo tres de las diez rutas tocan un edificio.** Medido sobre 60 edificios (1 de cada 197,
determinista): **58 de 60 tienen candidatas compartiendo arista, y en 0 de 57 cambia la puerta o los
metros.**

⭐ **Y la `CAUSA NO CONFIRMADA` tiene candidato estructural, propuesto por esta conversación:** el
origen está **fuera** de la arista. Que dos puertas queden enlazadas entre sí no ayuda a llegar a
ninguna **desde fuera** — el camino entra por un extremo y va a la más cercana; **el enlace
puerta↔puerta solo estaría en la ruta si hubiera que pasar por una puerta para alcanzar la otra**, y
viniendo de fuera eso no ocurre. ⇒ **No es inercia por suerte: es inercia por construcción.**
⭐⭐ **Y la explicación PUEDE FALLAR, que es lo que la hace valer:** predice que **un origen que
COMPARTA arista con una puerta candidata SÍ debe cambiar** — que es justo el caso declarado como no
probado. **Si no cambia, la explicación es falsa.**

⛔ **Y UNA CATEGORÍA DEL VEREDICTO QUEDÓ CADUCADA — ✅ RESUELTA EN H2·7·P1, ver más abajo:**
`MISMA ARISTA` se definió como *«el grafo no las distingue **y el metraje es falso**»*, y **desde
hoy el metraje YA NO es falso.** ⇒ **Pasa de VEREDICTO a MARCA.**

**⚠️ LO NO PROBADO, declarado:** un origen que comparta arista con una puerta candidata de su destino
· el coste en tiempo con 25 temporales (**el bucle es cuadrático en temporales**) · **el lado de la
acera, por CUARTA tanda** · y los otros 233.751 pares uno a uno.

**⭐⭐⭐ H2·7 · PUERTA 1 (12/08) — EL LADO DE LA ACERA. `docs/H2A-PUERTA-1-EL-LADO-DE-LA-ACERA.md`.**
*Se ordenó primero porque **si el veredicto nace mintiendo, calcular 2.538 enlaces con él es tirar la
tanda entera.** Las puertas 2 y 3 no se abrieron: una cerrada bien vale más que tres a medias.*

> ⛔⛔⛔ **EL `ACERA` DEL 20,7 % SE DESINFLA — Y NO POR DONDE SE ESPERABA.**
> **No es que los enlaces crucen mal: es que sobre la mayoría LA PREGUNTA NO SE PUEDE FORMULAR.**
> ```
>    los 67 enlaces ACERA            los 324 enteros
>       MISMO LADO        33  49,3 %    con alguna punta en eje ... 176  54,3 %
>       CAMBIA CON PASO    6   9,0 %    con LAS DOS en eje ........  53  16,4 %
>       CAMBIA SIN PASO    0   0,0 %    ⭐ donde SE PUEDE preguntar  131  40,4 %
>    ⚠️ NO DECIDIBLE      28  41,8 %
>
>    aristas del camino con lado conocido ......  58 de 867   (6,7 %)
>    enlaces ACERA con las DOS puntas conocidas ....  7 de 67
> ```
> ⇒ ⭐⭐⭐ **De cada cien aristas que recorre un enlace «ACERA», sabemos de qué acera son SIETE.**
> *«Calculamos andando, así que sabemos por qué lado»* **es cierto sobre el 6,7 % del camino y falso
> como frase general.** ⛔ **Y 193 de 324 enlaces (59,6 %) no salen aprobados: salen SIN EXAMINAR.**

| | qué | |
|---|---|---|
| ⭐⭐ | **La cobertura, declarada sobre el MODELO (ley 150)** | **2.397 de 98.774 aristas (2,4 %) tienen lado decidible.** `eje-de-calzada` 46.643 ⛔ **NUNCA** —un eje no tiene dos lados— · `paso-de-peatones` 10.494 ⛔ en ninguna · `acera` 16.858 ✅ 975 · `peatonal` 21.552 ✅ 386. ⭐ **No es un defecto del instrumento: el 47,2 % del grafo es eje de calzada** — *y ese 47,2 % es el del término entero, así que **la limitación es de cómo está dibujada Zaragoza, no de las paradas ni del método*** |
| ⭐⭐⭐ | **EL CERO QUE CASI SE LEE COMO BUENA NOTICIA** | `CAMBIA SIN PASO = 0` **no significaba nada**: con 6,7 % de cobertura casi ningún camino llega a ver dos lados, **así que el cero era candidato a artefacto.** ⇒ Se **provocaron los dos veredictos a propósito** buscando dos aristas de la misma vía con lados opuestos: ✅ `CAMBIA CON PASO` (vía 100, 101 m, 2 pasos) y ✅ `CAMBIA SIN PASO` (vía 105, 45 m, 0 pasos). **El cero pasa a ser un cero de verdad DENTRO DE SU COBERTURA, y las dos mitades van pegadas siempre** |
| ⭐⭐ | **Un veredicto renombrado antes de publicarse** | Se llamaba `CRUZA CALLADO` y **prometía más de lo que el instrumento sabe**: **doblar una esquina cambia de acera sin paso y es legítimo.** Pasa a `CAMBIA SIN PASO` (ley 145). *El nombre viejo habría metido una acusación falsa en 2.538 enlaces* |
| ✅ | **La muestra es la misma de ayer, y se exige** | `934 · 2.266 · 324` y `67 · 254 · 3 · 0` con `A.exige`, **no a ojo**: si el universo se hubiera movido, el script para antes de hablar del lado (ley 148) |

**⭐⭐ `MISMA ARISTA` PASA DE VEREDICTO A MARCA — decisión del ejecutor, aprobada.**
*La mitad que la justificaba —«el metraje es falso»— murió con la tanda de arreglo 8. Lo que queda no
es una cuarta clase de camino: es la clase de su arista.*
```
   bus×bus 16 de 2.266 · bus↔tranvía 3 de 272 ⇒ 19 de 2.538 (0,7 %)
   la arista que comparten:  acera 9 → serían ACERA  ·  eje 7 → serían EJE
```
⚠️ **Pero la marca NO se tira:** dos paradas con nombres distintos que son **el mismo punto para el
grafo** es algo que el usuario tiene derecho a saber. ⛔ **Lo que se retira es la palabra «falso».**
⭐ Y un cruce hacia atrás gratis: **los 272 bus↔tranvía salen solos del radio** — `2.266 + 272 =
2.538`, **cuarta vez que esa suma cierra con instrumentos distintos** (ley 154).

**⭐⭐⭐ LEY 155 · LA EXPLICACIÓN DE LA TANDA 8 SOBREVIVE AL EXPERIMENTO QUE LA MATARÍA.**
*Predicción: si el origen COMPARTE arista con una puerta candidata, tiene que cambiar.*
**11 de 25 cambian los metros y la puerta** (Δ mín −68,9 · p50 −14,4): *Automóviles Sánchez* **70,3 →
1,4 m**, la puerta se mueve 48,4 m. ⇒ ✅ **Los 58 de 60 no se movieron por INERCIA DE CONSTRUCCIÓN,
no por casualidad. Deja de ser `CAUSA NO CONFIRMADA`.**
⚠️ **Y trae un hallazgo con ella: existe una clase real donde el arreglo del 11/08 SÍ cambia lo que
devuelve H1, y cambia mucho.** Ningún número publicado depende de ella —las diez rutas no la
contienen— **pero *«el arreglo no mueve nada de H1»* hay que leerlo con su alcance exacto: no mueve
nada de lo PUBLICADO.**

> ⭐⭐⭐ **LA LECTURA ESTRATÉGICA, Y NO ES LA DERROTA QUE PARECE — la tesis se corrige, no se cae.**
> Lo que ya **no** se puede decir es *«calculamos andando, así que sabemos por qué acera»*: es falso
> y está medido. **Pero la comparación que decide es ésta:**
> ```
>                              ¿sobre qué % del camino sabe el lado?   ¿sabe que no lo sabe?
>    router de radio fijo                 0 %                                 NO
>    004                                6,7 %                    SÍ, enlace por enlace
> ```
> ⇒ **El diferenciador se mueve de «sabemos» a «SABEMOS QUÉ NO SABEMOS».** Un router de radio **no
> tiene camino que examinar**: no es que falle la pregunta, es que **no puede formularla y tampoco
> puede decírtelo.** ⭐ **Y eso es exactamente el carácter de este proyecto** —136 instrumentos
> mentirosos catalogados, un estado que se auditó a sí mismo, una auditoría que retiró dos de sus
> once hallazgos por falsos—: **un motor de transbordo que declara su cobertura epistémica enlace por
> enlace es raro de verdad, y es coherente con todo lo demás.**

**⚠️ Y UNA DESVIACIÓN DE MÉTODO, DECLARADA POR SU AUTOR:** escribió en `tools/` mientras corría la
batería base. **Su razonamiento es correcto** —`probar-paradas.js:217` lee `src/` y el puntero lee
`docs/`— **pero hace dos días el razonamiento tenía LA MISMA FORMA y era falso** (§7·132). ⇒ *La
regla no existe porque el razonamiento sea difícil: existe porque es fácil hacerlo bien y fácil
hacerlo mal, y desde dentro se parecen.* **Hoy acertó. No cambia la regla.**

**⛔ LO QUE LA PUERTA 1 NO MIDIÓ, declarado:** si un `MISMO LADO` **empieza** en el lado correcto
respecto a la parada —que no cambie de acera no dice que arranque en la buena— · los 193 sin examinar
siguen sin examinar · **y la cobertura del 6,7 % no se intentó subir**: bajar el listón de
`≥4 portales · 75 %` **subiría la cobertura y la tasa de error a la vez**, y eso es una decisión.

**⭐⭐⭐ H2·7 · PUERTA 2 (11/08) — LOS 2.538 ENLACES. `docs/H2A-PUERTA-2-LOS-2538.md`.**
**Calculados los 2.538 a pie por el grafo**, con el veredicto partido en dos campos (decisión de
Antonio). *La Puerta 3 no se abrió.*

> ⭐⭐⭐ **EL ARGUMENTO DEL HITO, EN UNA CIFRA — Y CONFIRMADO POR DOS CAMINOS QUE NADIE CRUZÓ:**
> ```
>    rodeo p50 de los 2.538 (parada→parada) ....... 1,29×
>    andando ÷ volando en las 48 del tranvía ...... 1,31×
> ```
> **Dos poblaciones distintas, elegidas con criterios distintos, en dos secciones distintas del
> informe — y el mismo número.** ⇒ ⭐⭐ ***Un radio a vuelo de pájaro se queda corto un 30 % EN LA
> MEDIANA*** — no en la cola. **Es el párrafo del README, y ya no es una cifra: es una cifra
> confirmada** (ley 154).

**⭐⭐ LOS DOS CAMPOS — y CINCO DE NUEVE NOMBRES NO PASARON LA LEY 157:**

```
   camino (hecho del GRAFO)          sin-eje · mixto · solo-eje · sin-camino-en-el-grafo
   lado   (hecho del CONOCIMIENTO)   sin-lados-en-el-grafo · no-consta · no-cambia-de-lado
                                     cambia-con-paso · cambia-sin-paso
```

| se llamaba | por qué no pasaba |
|---|---|
| `acera` | se lee *«va por la acera correcta»* — **lo que la Puerta 1 demostró que no se sabe** |
| `sin-camino` | se lee *«no se puede ir andando»*. **El grafo tiene 170 componentes**: lo que se sabe es que ESTE grafo no lo encuentra |
| `sin-lados` | **la calle sí puede tener dos aceras. Lo que no las tiene es el DIBUJO** |
| `mismo-lado` | se lee *«empieza en la acera correcta»*, **y eso no se mide** |
| `cruza-callado` | doblar una esquina cambia de acera sin paso **y es legítimo** |

⛔ **Cinco de nueve. No es estilo: cada uno era una frase que el instrumento no puede sostener.**

**LA TABLA CRUZADA — los 2.538 enteros:**

| camino \ lado | no-cambia | con-paso | sin-paso | no-consta | sin-lados | TOTAL |
|---|---:|---:|---:|---:|---:|---:|
| `sin-eje` | 235 | 53 | 2 | 298 | 0 | **588** |
| `mixto` | 499 | 46 | 0 | **1.158** | 32 | **1.735** |
| `solo-eje` | 0 | 0 | 0 | 0 | 215 | **215** |
| `sin-camino-en-el-grafo` | 0 | 0 | 0 | 0 | 0 | **0** |
| **TOTAL** | **734** | **99** | **2** | **1.456** | **247** | **2.538** |

⚠️ ⭐⭐ **La casilla que más dice de este proyecto: `mixto × no-consta` = 1.158, el 45,6 %.**
*El transbordo típico de Zaragoza es «el camino toca eje de calzada en algún punto, y del resto no
sabemos de qué acera es».* ✅ Y los 324 reetiquetados devuelven **69 y 33**, los dos números que H2·6
publicó, **exigidos con `A.exige`**.

**⭐⭐ PREDICCIONES SELLADAS A LAS 10:52:46, FUERA DEL REPOSITORIO. Fallan tres, y las tres enseñan:**

| | predicho | medido | |
|---|---|---|---|
| `sin-eje` · `mixto` · `solo-eje` | 18–23 · 64–72 · 8–13 % | **23,2 · 68,4 · 8,5 %** | ✅ |
| `SIN CAMINO` | 1–15 | **0** | ⛔ |
| metros p50 | 160–210 m | **261 m** | ⛔ |
| rodeo p50 | 1,20–1,45 | **1,29×** | ✅ |
| mínimo en recta | 70–80 m | **66 (48) · 73 (50)** | ⛔ *población* |
| artefacto | 350–600 KB | **471,7 KB** | ✅ |

⭐ **La de los metros falla EXACTAMENTE por el tamaño del rodeo:** *«pensé en la recta y el andado la
multiplica por 1,29»* — **el error es el fenómeno que este proyecto existe para medir.**
⛔⛔ **Y una «acertada» que su autor anula: `sin-eje` cayó en banda CON EL RAZONAMIENTO AL REVÉS.**
Escribió que el tranvía empujaría hacia el eje y salió **por encima**, no por debajo.
⇒ ***Acertar la banda con la razón equivocada no es acertar.***

**⭐⭐⭐ EL CRUCE HACIA ATRÁS — CUATRO DE CUATRO, Y CÓMO ESTUVO A PUNTO DE FALLAR:**
`20 · 73 · 130 · 418` y **48 de 50**, reencontrados **con otro script y otro camino** contra lo que la
tanda 4 publicó.
⚠️ **Hubo que medirlo sobre las 50, no sobre las 48:** sobre las 48 sale **66 m**, porque el máximo de
418 son **las dos de Juslibol, que están fuera del radio**. ⇒ ⭐⭐⭐ **Publicar «66 contra 73» habría
metido en este documento una contradicción INVENTADA.**

**⛔⛔ DOS ROJOS DEL RODEO, LOS DOS DE SU AUTOR (bitácora 189 y 190):** el guardián de imposibilidad
física saltó con **33 enlaces más cortos que su recta, mínimo 0,20×**. **El grafo no estaba roto:**
la ruta va **de enganche a enganche** y la recta iba **de parada a parada** — *cuatro puntos, no dos*.
31 de 33 se caen solos; **los 2 restantes eran redondeo** (`13,0` contra `13,044`: cuatro
centímetros, y el umbral de `0,999` **pedía 1,3 cm a un dato con 5 de resolución**).
⇒ **Ahora hay DOS rodeos y se dice qué es cada uno:** `CONSULTADO` parada→parada (puede bajar de 1:
el hueco al grafo) y `DEL CAMINO` enganche→enganche (no puede, y ahí vive el guardián). **Imposibles:
0. Consultados < 1: 33, publicados como lo que son.** ⛔ *El guardián no se relajó: se le dio la recta
correcta y la tolerancia que el dato sostiene.*

| | y además | |
|---|---|---|
| ⛔ | **`SIN CAMINO` = 0 sobre 2.538, y provocado** (ley 156) | `PA00002 × PA00349` ⇒ el veredicto existe. **El cero es real: 300 m no bastan para rozar otra componente**, porque están separadas por mucho más |
| ⛔⛔ | **172 de 984 paradas (17,5 %) no tienen NI UN par candidato** | **El pre-filtro de 300 m las hace invisibles**: quien esté en una de ellas **no verá una alternativa que existe a 320 m.** *Es el coste real de D4 y va escrito en la Puerta 3* |
| ⭐ | **El artefacto** | red de bus 200,5 KB + enlaces 471,7 KB = **672,2 KB · 119,7 gzip** (**444,7 · 63,1 sin las listas de aristas, que son el 48 % del peso y hacen falta para DIBUJAR, no para calcular**) |
| ⛔ | **`feed_info` vive DENTRO**, en `artefacto.feed`, **exigido con `A.exige`** | La licencia del NAP obliga a conservar **sin alterar** la metainformación de fecha, **y sin ella se pierde la caducidad del 05/10** |
| ✅ | **La marca `misma-arista`: 19**, los mismos que midió la Puerta 1 | |

⚠️⚠️ **Y UNA CONCLUSIÓN QUE NO SE PUEDE SACAR, dicha por esta conversación:** ⛔ **el artefacto NO
decide el stack.** 119,7 KB gzip caben en cualquier navegador **pero eso es la capa de TRANSPORTE**;
el motor sigue necesitando **el grafo peatonal de 68.649 nodos y 98.774 aristas en ejecución** para
el primer y el último tramo —de tu portal a la parada—, **y ése es el que decide si hace falta Node.**
*Los 672 KB no lo contestan.*

**⭐⭐⭐ H2·7 · PUERTA 3 (11/08) — LOS SEIS LÍMITES. `docs/H2A-PUERTA-3-LOS-LIMITES.md`.**
**CON ESTA PUERTA SE CIERRA H2·7 ENTERO.**

> ⭐⭐⭐ **EL CRITERIO QUE LA ORDENA:** *un límite escrito en el README no protege a nadie, **porque
> quien consulta un enlace no lee el README**.* ⇒ **Cada límite viaja CON EL DATO al que afecta**, y
> cada uno lleva su `A.exige` debajo: **un límite sin guardián es una intención.**

| | límite | dónde vive | guardián |
|---|---|---|---|
| **L1** | ⛔ **172 paradas invisibles** | `artefacto.sinEnlaces` — **las 172 con código, nombre y motivo** | ✅ `A.exige` del 172 + `code`/`motivo` de cada una |
| **L2** | el veredicto de dos campos | `artefacto.campos` + los dos campos **en cada enlace** | ✅ todo valor emitido tiene leyenda, y el aviso **separa CONOCIMIENTO de IGNORANCIA** |
| **L3** | la red es la del periodo del feed | `artefacto.cobertura` | ✅ las **8 zombis** y **la ausencia de `PA00617`** |
| **L4** | los dos sentidos condicionales | `sentido.terminal.aviso` | ✅ banda de cuota **+ nuevo**: el aviso existe y **nombra el segundo terminal** |
| **L5** | caducidad, licencia y atribución | `artefacto.feed` + README | ✅ `version`/`fin`/`atribucion`/`procesado` |
| **L6** | nunca «todos», nunca «el más rápido» | prohibición sobre **todo el JSON** | ✅ 7 patrones, **con provocación dentro** |

⭐⭐ **L1 con sus palabras, y el motivo de que estén las 172 dentro:** *«Para estas paradas este
artefacto NO dice nada. No significa que no haya transbordo: significa que a menos de 300 m no hay
ninguna parada que aporte línea nueva. Puede haber una a 320 m y no se ha calculado.»* ⇒ **Sin ellas
una consulta devolvería lista vacía, y una lista vacía es indistinguible de «no hay transbordo».**
⭐ **Y L4 pasa de número a AVISO:** la cuota `0,32` estaba desde H2·6, **pero un número no avisa a
nadie** — ahora dice *«el 32 % de los viajes NO acaba en 19414 sino en 17871. Depende de LA HORA»*.

**⛔⛔ EL GUARDIÁN DE L6 NACIÓ SIN SERVIR PARA NADA, Y LO DESTAPÓ SU PROPIA PROVOCACIÓN (ley 156).**
Salió **verde a la primera**; al darle la frase prohibida —*«el transbordo más rápido»*— **no la
cazaba**: el patrón era `/\bel m[áa]s r[áa]pido\b/` y la frase lleva **una palabra en medio**.
*Estaba pegado a `el` porque así la escribió quien lo redactó, en su cabeza.*
⚠️ **Y su límite declarado: vigila el ARTEFACTO, no la prosa** — sobre el README daría falso positivo
en *«no se puede prometer el mejor»*, **que es una negación**. *Un detector de promesas no distingue
una promesa de su negación.*
✅ Y sobre lo ya escrito, **ninguna frase incumplía L6** —comprobado sobre `README.md`, `src/relato.js`
y los cinco instrumentos—. ⭐ *Y no es casualidad: `relato.js` ya cierra diciendo lo que el motor **no**
sabe, «ni por cuál de las dos aceras vas».*

> ⭐⭐⭐ **EL PÁRRAFO DEL HITO, ESCRITO Y CON LA LEY 157 PASADA:**
> *Entre dos paradas, la distancia que importa no es la de la línea recta: es la que se anda.*
> **1,29× en la mediana** · el bus más cercano a cada tranvía: **66 m volando · 87 m andando =
> 1,31×**. ⇒ ***Un radio no se queda corto en los casos raros: se queda corto en la mitad.***
> ⛔ **Y lo segundo, que va dentro y no escondido:** *este proyecto **NO sabe por qué acera vas**.*
> En **1.456 de 2.538 (57,4 %)** no sabe de qué lado va el camino; en **247 (9,7 %)** sabe que el
> dibujo no tiene dos lados — **que es lo contrario de no saberlo.**
> ⇒ ***La diferencia con un radio no es que aquí se sepa: es que aquí se puede decir, enlace por
> enlace, qué NO se sabe.***
> ⛔ **Y una frase se cayó al pasar la prueba:** decía *«sabemos de qué lado son 7 de cada 100
> aristas»* — **ese 6,7 % es de los 67 enlaces `ACERA`, no de los 2.538**, y ahí habría sonado a
> global (ley 158, el mismo día).

**⛔⛔⛔ LA DEUDA, Y NO ES UN CABO MÁS — TIENE FECHA:**
**Nada comprueba que el feed no haya caducado.** El `A.exige` verifica que `fin === '20261005'`
**viaje dentro**, no que **no haya pasado**. ⇒ **El 6 de octubre de 2026 todo seguirá en verde.**
⭐⭐ *Es la forma exacta del fallo que fundó este proyecto —un instrumento que sigue dando verde
después de que el mundo cambie— **y es el PRIMERO de los 141 que se cataloga ANTES de mentir**: está
escrito, fechado y con 55 días de aviso.* ⇒ **Sale de la lista de deuda y pasa a ser la tanda
siguiente, junto con la repetibilidad de la descarga: las dos son el mismo problema.**

⚠️ **Y el resto de la deuda, declarada:** `L2` no vigila valores, **solo leyenda** — si baja el listón
de cobertura, **los 1.456 `no-consta` se mueven en silencio** · el artefacto **no se escribe a disco**
(los límites viven en la estructura; que sobrevivan a la serialización es de H2·8) · `L6` **no cubre
la prosa**, que es donde vive el riesgo de prometer.

**⛔ Y UNA TERCERA LICENCIA LLEVABA SEIS DÍAS SIN DECLARAR:** el README decía *«los datos tienen DOS
licencias»* y **el GTFS entró el 10/08** — faltaban **«Powered by MITRAMS»**, la cita al Ministerio y
decir que el dato es **procesado, no bruto**. ⚠️ **Es la SEGUNDA vez que miente esa misma sección**:
ya dijo *«hoy el repositorio no contiene ningún dato integrado»* con 46.150 portales dentro.

**⭐ EL CIERRE DE H2·7 — y el tamaño con los límites dentro:**
```
   la red de bus .............. 200,5 KB · gzip  41,9 KB
   los enlaces + los límites .. 491,1 KB · gzip  82,2 KB   (eran 471,7 / 77,8 sin ellos)
   TOTAL ...................... 691,6 KB · gzip 124,1 KB   (464,1 / 67,6 sin dibujar)
```
⭐⭐ **19,4 KB es lo que cuesta no mentir.** ⚠️ **Y esto NO decide el stack**: el motor necesita el
**grafo peatonal de 68.649 nodos EN EJECUCIÓN** para el primer y el último tramo, y ése es el que
manda.

**QUEDA ABIERTO DE LAS TRES PUERTAS:** los **193 enlaces sin examinar** · si un `no-cambia-de-lado`
**empieza** en el lado correcto · **el listón de cobertura (decisión de Antonio)** · los **2
`cambia-sin-paso`** sin mirar en el mapa · **la caducidad sin vigilar** · `L2` sin guardián de valores
· el artefacto sin escribir a disco.

**⭐⭐⭐ H2a · TANDA 9 (11/08) — EL 5 DE OCTUBRE. `docs/H2A-TANDA-9-VIGENCIA.md` y
`docs/H2A-LINEA-DE-FLOTACION.md`.**

> ⭐⭐⭐ **EL Nº143 ESTÁ ARREGLADO 55 DÍAS ANTES DE MENTIR, Y CON LA ÚNICA PRUEBA QUE LO DEMUESTRA:**
> ```
>    $ node src/probar-vigencia.js               ⇒ dentro-del-periodo · 55 días · ✅ código 0
>    $ node src/probar-vigencia.js --hoy 20261006 ⇒ fuera-del-periodo-declarado · -1 · ⛔ FALLO
> ```
> *Hasta ayer un guardián bueno y uno roto daban exactamente el mismo verde.*
> ⭐⭐ **Y la provocación va DENTRO de la ejecución verde:** no es que se haya visto rojo una vez —
> **enseña cada día que sabe ponerse rojo** (`20261005` todavía `se-acaba`, `20261006` ya no).

| | qué | |
|---|---|---|
| ⭐⭐⭐ | **Vive en `src/`, y ése es el punto entero** | `probar-paradas.js:217` solo ejecuta los `.js` de **`src/`**; `tools/` está fuera de la batería (ley 142). ⇒ ***Un guardián de caducidad metido en `tools/` es un guardián que nadie corre nunca***, y el 6 de octubre nadie se habría enterado igual. **La lógica en `tools/gtfs/vigencia.js`; el que la ejecuta a diario, en `src/`** |
| ⭐ | **Cinco estados, con la ley 157 pasada** | ⚠️ `vigente` **no pasaba** —se lee *«el dato es correcto»*, y **un feed puede estar dentro de su periodo y tener la red mal**— ⇒ `dentro-del-periodo`. ⚠️ `caducado` **no pasaba** —se lee *«ya no sirve»*— ⇒ `fuera-del-periodo-declarado`: *lo que se sabe es que **el editor declaró un periodo y terminó***. **Los cinco se provocan y se exigen: un estado que nunca sale no es un estado, es una promesa** |
| ⚠️ | **`se-acaba` avisa y NO falla, con su coste dicho** | Ponerlo rojo dejaría la batería roja **treinta días seguidos**, y **un rojo que dura un mes enseña a ignorarlo**. ⛔ *Consecuencia aceptada: el 6 de octubre uno se entera por el rojo, no por el aviso* |
| ⭐⭐ | **El único instrumento del proyecto cuyo veredicto cambia SIN QUE CAMBIE EL DATO** | Es función del fichero **y del reloj**. Desde dentro solo se puede cotejar con el repositorio: **si `HOY` < la fecha del ZIP (20260810), el reloj va atrasado**. ⛔ **Eso caza el atrasado —el que produce un falso «vigente»— y NO caza el adelantado** |
| ⭐⭐ | **Y por eso el estado NO se hornea en el artefacto** | Un `dentro-del-periodo` congelado hoy **diría lo mismo en noviembre**. ⇒ **Viajan las fechas y la REGLA; quien sirve el dato recalcula** |

**⭐⭐⭐ EL COMPARADOR DE FEEDS CAZÓ ALGO EL DÍA QUE NO HABÍA CAMBIADO NADA:**
```
   routes.txt      3.430 bytes = 3.430 bytes      53 filas ≠ 52 filas   ⛔
```
**Los bytes cuadran AL BYTE, así que el fichero es el mismo: lo que estaba mal era el recuento.**
Medido: **52 de `route_type` 704 (bus) + 1 de 900 (tranvía) = 53.** El **52** publicado en
`docs/RECONOCIMIENTO-003-TRANSPORTE.md:105` es **el recuento del bus puesto en la columna del
total**, y ⭐ *el tranvía se quedó fuera de su propio recuento.*
⭐⭐ **Y el número bueno llevaba UN MES publicado en otro documento del mismo proyecto**
(`DISENO-H2A-RED.md:203`). ⛔ El informe **no se reescribe** —registro histórico—: el ancla pasa a ser
**lo medido**, con la discrepancia **impresa en cada ejecución**.

**✅ SIETE DIFERENCIAS PROVOCADAS, SEIS CLASES, TODAS CAZADAS** —`caducidad · version · filas ·
fichero · identidad (×2) · zombis`—, ⛔ **con el sha y los bytes dejados iguales A PROPÓSITO**: si no,
todas se cazarían por el sha y no se probaría nada más.
⚠️ **Límite declarado: se muta la MEDICIÓN en memoria, no el ZIP** ⇒ prueba el comparador, **no el
lector de ZIP ni el descargador, que siguen sin control.**

**⭐⭐ Y LO QUE CONTESTARÁ EL DÍA QUE HAYA UN SEGUNDO FICHERO:** cuántos `stop_id` desaparecen, cuántos
son nuevos, y ⛔⛔ **cuántos MANTIENEN el id y CAMBIAN el `stop_code`** — *el caso peor, porque la
identidad parecería estable y señalaría a otro poste*. **Hoy no se puede contestar: solo existe una
versión.**

**LA LÍNEA DE FLOTACIÓN** (`docs/H2A-LINEA-DE-FLOTACION.md`) dice qué se hace el día que el feed
cambie y **qué deja de valer según qué cambie** — con el caso peor marcado como *«PARAR y decidir con
Antonio, no se recalcula nada»*. ⭐ **Y lo que NO se re-mide pase lo que pase: el grafo, las diez
rutas y los 26 congelados. El GTFS no toca H1.**
⚠️ **Su contradictor está escrito** —`comparar-feed.js --otro <zip>`— **pero solo puede dispararse el
día que exista un segundo fichero** ⇒ **es un contradictor con 55 días de latencia: hasta entonces el
documento no puede envejecer ni bien ni mal, está congelado por falta de mundo.** *Es una clase de
contradictor distinta a las demás y conviene que conste.*

**⛔⛔ CABO ESTRUCTURAL QUE DESTAPA ESTA TANDA — y es más grande que el 53/52:**
***Nada en este proyecto compara dos documentos entre sí.*** Hay un puntero que marca superados, un
latido que vigila cuatro números y `A.exige` por todas partes — **y ningún instrumento que cruce dos
documentos.** El **53** llevaba un mes conviviendo con el **52**, y lo encontró **un instrumento
escrito para otra cosa.** ⇒ Con **3.703 líneas de estado, 144 instrumentos y 163 leyes**, la pregunta
*«¿cuántas más hay?»* **no tiene respuesta hoy** — y la ley 154 dice que ahí dentro hay terceros
caminos esperando. *Cabo, no tanda: lo decide Antonio.*

⭐ **Y una medición que se creía imposible y no lo es:** el listón de 30 días de `se-acaba` está
*«decidido, no medido, porque nunca se ha cronometrado cuánto dura una tanda»* — **pero `git log` lo
sabe**: 26 commits el 10/08 y 20 el 11/08, con sus fechas. *El número existe y no hace falta
estimarlo.*

**DECISIONES NUEVAS DE H2:**

- ⭐ **El código que sale a la red vive en `tools/`, NO en `src/`.** `src/` es el universo de la
  batería, y **un invariante del proyecto no puede depender de que un tercero esté vivo** ni de que
  haya clave. *(Propuesta del ejecutor, aprobada.)*
- **La clave del NAP se LEE de 003 y la maquinaria se ESCRIBE en 004.** Fichero aparte con su
  positivo de control **antes** de que la clave exista, y **la dependencia se declara** — que es
  exactamente lo que faltaba en el caso del callejero (`C·V1`).
- ⭐⭐⭐ **H2 SE PARTE (Antonio, 10/08). `H2a` = bus + tranvía + transbordo a pie. `H2b` = red
  ciclable + estaciones BiZi, después.**
  *Motivo: la red ciclable es un GRAFO NUEVO con reglas propias —una bici no va por la acera ni sube
  escaleras— y es sola más de la mitad del hito. **Y el diferenciador no la necesita:** el transbordo
  andando se demuestra entero con bus y tranvía.* ⚠️ **Y las estaciones BiZi se van con la bici, no
  con el bus:** son nodos baratos, pero **sin red ciclable son nodos que no llevan a ningún sitio.**
  ⇒ *Un proyecto cerrado del todo bate a dos al 80 %, y eso vale también dentro de un hito.*
- ⭐⭐ **H2 SIGUE SIN RELOJ, y el reparto de terminales entra COMO DATO (Antonio, 10/08).**
  Cada enlace lleva terminal mayoritario, cuota y determinante (`DÍA` / `HORA` / `NO CONSTA`).
  **El motor no lo consulta y no decide nada con eso.** *Lo que compra: H3 no tiene que
  redescubrirlo, y hoy está medido con un feed que en octubre ya no existirá.*
  ⛔ **CON UNA CONDICIÓN: los dos sentidos condicionales se marcan EN LA SALIDA, no solo en el dato.**
  Guardar el reparto en un fichero no evita que el motor mande a alguien a esperar a las diez de la
  mañana. **El «sí» falso se paga en la calle.**
- ⚠️ **EL STACK NO SE DECIDE TODAVÍA — y el criterio sí.** Lleva sin decidir desde H1 y no ha
  bloqueado nada, porque el motor no tiene dependencias y el grafo cabe en memoria. **La restricción
  ya medida:** el hosting de `antonioblanquez.es` es compartido y **no tiene Node** ⇒ o el grafo se
  resuelve **en el navegador** —y manda cuánto pesa el artefacto— o hace falta plan Node como 003.
  **Se decide con el tamaño del grafo multimodal delante, que sale en H2·6.**

**LO SIGUIENTE — H2·3, cuatro verificaciones de solo lectura:**
`1` los cuatro ficheros dirigidos de 003 (`identity` · `adapter` · `desvios` · `topologia`), porque
**el cubo MAQUINARIA no puede afirmarse desde documentos** · `2` el cruce `8130-8133 × 8134-8137`:
**¿ocho postes o cuatro renumerados?** · `3` la intersección de los dos 934 —*«usadas por rutas 704»*
y *«códigos que empiezan por PA»*— que **cuentan igual y nadie ha comprobado que sean el mismo
conjunto** (la forma de `A·V2`) · `4` dónde acaba la traza de la línea 34.

---

### ⛔⛔⛔ EL ESTADO TAMBIÉN MENTÍA — saneamiento del 9/08

> **Los cuatro bloques auditaron el código (A), los 44 documentos de `docs/` (B, B.2) y las
> decisiones (C). NINGUNO AUDITÓ ESTE DOCUMENTO.**

Entró en la auditoría **solo como objeto de corrección puntual** —la renumeración de los hallazgos
(7/08) y el `182 → 232` de `B2·V3`—, **nunca como universo.** ⛔ **Y no lo vigila nada:**
`superados.js` marca `docs/` y este fichero vive en la raíz · el latido vigila cuatro números · el
censo v2 mide lo que un documento **subraya**. ⇒ **Es el único texto del proyecto sin contradictor**
(ley 111), **y es el primer input que lee cualquier conversación nueva.**

⚠️ **Y eso ya se había cobrado una pieza: el instrumento nº99** — esta conversación metiendo cifras
caducadas en **cinco encargos seguidos** porque las llevaba escritas de antes.

**Las once afirmaciones caducadas, todas corregidas hoy:**

| # | qué decía | dónde | qué pasa |
|---|---|---|---|
| 1 | *«bloque A hecho, B y C pendientes»* | cabecera | **Se desmentía a sí misma dos líneas más abajo**, donde la tabla daba los cuatro en ✅ |
| 2 | fechada **6/08** | cabecera | Con la tanda 6 (**9/08**) dentro, y **sin la tanda 7** |
| 3 | ⛔⛔ *«la nº7 CALIBRA los ~6 km/h de toda la tabla: ninguna tanda puede moverla»* | cabecera | **La tanda de arreglo 4 la retiró.** Era la frase en negrita más contundente del bloque de estado |
| 4 | *«una TERCERA medición corta»* | cabecera | Ya había **cuatro** mediciones; lo que falta es una **bajo 1 km** |
| 5 | **74 ficheros · 24.931 líneas · 166 commits** | cabecera | Cifras del 6/08 con siete tandas por medio ⇒ **puestas a `PENDIENTE DE MEDIR` con su comando**, no estimadas. ⭐ **MEDIDAS el 10/08: 74 · 27.097 · 235** (cabecera) |
| 6 | ⛔ *«la licencia de los datos se declarará cuando se integre alguno — no contiene ningún dato integrado»* | §1 | **Dos de las cinco frases que la tanda 2 retiró del README por falsas** (`A·V4`). *Arregladas en la portada, vivas aquí seis días* |
| 7 | *«red peatonal OSM: decidida, NO INTEGRADA»* | §3 | Con **68.649 nodos y 98.774 aristas** construidos encima. Es la fila de estado de la fuente de la que cuelga todo |
| 8 | **«106 puntos de cruce»**, tres veces | §3 · §4 · §9 | **Son 89**, y lo dice §7·17 de este mismo documento. ⭐ *Un superado sin marca dentro del documento que gobierna a los que sí la llevan* |
| 9 | *«7 de 7 resueltas · 0 imposibles»* | §4 | **La nº1 ya no se resuelve: va en sugerencia.** El «7 de 7» era de la tanda 13 |
| 10 | ⛔⛔ *«el diseño y la adenda se contradicen… pendiente de reconciliar»* | §10 | **Es `B·V1` con otras palabras** — el rojo falso que el bloque C retiró el 7/08. **La retirada y lo retirado convivían en la misma sección** |
| 11 | *«se escribirá cuando el motor resuelva su primera ruta»* | §12 | **La condición se cumplió en la tanda 11** y nadie volvió a por ella |

**Y dos de estructura, no de dato:**
- **El mapa de tandas (§9) se quedó en `A ✅ · B ⬜ · C ⬜`**, mientras todo lo posterior crecía en
  §10. ⇒ **El diario y el registro habían divergido**, y quien leyera §9 vería la auditoría a medias.
- **§7 decía «diez tandas de arreglo»** y son **nueve** (siete numeradas más dos `bis`), contadas
  sobre §10. *Enumerar no es contar* — ley 116 contra quien escribió la cabecera.

⭐⭐⭐ **LA LECTURA, Y ES LA QUE IMPORTA:** la regla propia de este documento —*«el bloque de estado
actual se SUSTITUYE, no se acumula»* (cabecera)— **nació para evitar el sedimento de 003 y produjo lo
contrario**: la cabecera se congeló el 6 de agosto y el cuerpo siguió creciendo hasta el 9.
⇒ **Congelar preserva los errores con la misma fidelidad que las verdades** (ley 74), aplicada al
documento que escribió esa ley.

⚠️ **Lo que este saneamiento NO ha hecho, declarado:** no se ha contrastado **cifra a cifra** — se
corrigió lo que once contradicciones internas delataron, **no un barrido de las 2.697 líneas**.
⛔ **La cobertura de este saneamiento es `NO CONSTA`**, y decirlo es la mitad del trabajo.

## 11 · Método y entorno

**Reparto:** esta conversación hace visión, estrategia, prompts y **este documento**. Claude Code
ejecuta. Antonio enruta, prueba con sus manos y aporta conocimiento de campo.

⭐ **Y ese conocimiento de campo ha ido por delante del análisis desde el primer día**: la
existencia del dataset heredado, las paradas de bus, los conjuntos de BiZi y de vías, los cuatro
visores. Ninguno lo encontró un barrido: los puso Antonio.

**Documentos y quién escribe cada uno:**

| Documento | Escritor | Regla |
|---|---|---|
| `DESPLAZAME-ESTADO.md` | **Solo la conversación de estrategia** | Claude Code lo lee, **nunca lo toca**. Lo que descubra que lo contradiga, lo reporta hacia arriba |
| `docs/BITACORA.md` | **Solo Claude Code**, en caliente | Una entrada por fallo. Agrupar es borrar. `NO CONSTA` es válido; inventar no |
| `docs/RECONOCIMIENTO-*.md`, `docs/INVENTARIO-*.md` | Claude Code | **Registro histórico: se añaden, no se reescriben** |
| ⭐ `docs/auditoriafinal/*.md` | Claude Code | **Registro fechado de cada bloque de auditoría. ⛔ NO SE REESCRIBE NUNCA** — lo que Antonio reclasifique después vive en §10 de este documento, no allí |
| `CLAUDE.md` | Ambos | Reglas permanentes de sesión |

**Prompts:** estructura de 7 puntos obligatoria, siempre completos y con detalle, en un solo
bloque copiable. Un prompt malentendido cuesta horas; los tokens no cuestan nada.

**Guardián instalado:** hook `commit-msg` propio — un commit `fix:` sin **entrada nueva** en la
bitácora se rechaza y se autogenera el esqueleto. ⭐ Mejora sobre el de Turnia, que solo
comprobaba que el fichero estuviera en el stage (añadirlo con una coma lo satisfacía).
⚠️ Los hooks no viajan en un clon: `git config core.hooksPath .githooks`, documentado en el README.

**Repositorio:** `github.com/ablanquez/desplazame`, público, Apache 2.0. Commits atómicos,
Conventional Commits con ámbito, asunto en español. Cero coautoría. ⛔ `git add -A` prohibido.

---

## 12 · La frase que resume el proyecto

*(Pendiente, **con condición NUEVA y declarada: se escribe cuando H2 componga su primer trayecto
multimodal.** Decidido por Antonio el 10/08.)*

**Por qué no se escribió el 9/08, cuando la condición vieja ya se había cumplido:** la frase
disponible era la del cierre de H1 —*«el repositorio sabe mirarse a sí mismo mucho mejor de lo que
sabe mirar Zaragoza»*— **y ésa es una frase sobre el MÉTODO, no sobre el proyecto.** El proyecto
aún no ha hecho lo que lo define: **componer a pie + bus + tranvía.** Escribirla hoy sería resumir
la mitad.

⭐ **Y lo que se arregla poniéndole condición nueva es el SILENCIO:** un «pendiente» sin disparador
no tiene contradictor y no envejece nunca (ley 111). Ahora sí lo tiene.

Lo que se puede decir hoy, y ya es una frase:

> **El Ayuntamiento publica las calles dibujadas, no conectadas.**
> **Las líneas se cruzan en el mapa y no se tocan en el dato.**
> **La red peatonal existe y no se publica.**
> **Y el trazado del autobús está en el fichero crudo, no en el que todos leen.**
>
> **Desplázame construye la red que nadie publica. Y cuando no sabe por dónde se pasa, LO DICE.**
