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

## ESTADO ACTUAL — 2 de agosto de 2026

**Fase 0 cerrada. Repositorio publicado. H1 en diseño. Cero líneas de código de producto.**

- Cuatro tandas de reconocimiento (0.A – 0.D) y la tanda 1 (andamiaje) cerradas.
  `github.com/ablanquez/desplazame`, público, 12 commits.
- **Tanda 2 · el diseño en papel de H1**: `docs/DISEÑO-H1-GRAFO.md` (912 líneas), seis preguntas
  respondidas, cinco decisiones elevadas a Antonio.
- **Tandas 2.B y 2.C · la regla de nivel, medida en cuatro zonas reales** (4 km², 7.114 cruces).
  ⭐ **Dos veces seguidas la medición ha INVERTIDO una decisión ya firmada**, no la ha confirmado.
- **Las cinco decisiones de diseño, cerradas** (§5 · D1–D5), más **el backtesting elevado a
  principio del proyecto** por Antonio.
- ⚠️ **La regla de nivel está resuelta PARA OSM y sigue abierta para la capa municipal**: toda su
  solidez viene del nodo compartido, y el dato municipal no tiene ninguno.

**Falta decidir:** ⭐ **si la geometría municipal entra en el grafo o solo aporta atributos**
(reabre la P0 del diseño y disolvería el problema anterior) · el stack · el alcance v1 del
buscador · el momento oro.

**Lo siguiente:** cerrar P0. De su respuesta depende si H1 arranca sobre una red o sobre dos.

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

**Licencia:** código Apache 2.0. La de los datos **se declarará cuando se integre alguno** — hoy
el repositorio no contiene ningún dato integrado, solo respuestas crudas citadas como evidencia.

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
| ⭐ **Red peatonal fina** | **OpenStreetMap** (Overpass) | ⬜ Decidida, no integrada. Aceras, pasos de peatones y escaleras **como líneas** y **ya nodalizadas por diseño**. ⚠️ **ODbL con efecto share-alike** |
| ⭐ **Transporte** | **GTFS 1176 del NAP** (bus + tranvía) | ⬜ Decidido, no descargado. 984 paradas, 52+1 rutas, 34.427 viajes, 870.717 horarios, `shapes.txt` con 89 trazados sanos. ⚠️ **CADUCA EL 05/10/2026** y exige clave propia del NAP |
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
- **`MU1_jerarquia_viaria`**: no tiene ningún campo de nivel. Con 106 cruces geométricos,
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
   geométricamente** (87 pares, 106 puntos). La información topológica **está en el dato**: hay
   que partir cada tramo en sus intersecciones y usar una tolerancia pequeña (~2 m) solo para las
   puntas sueltas. Nadie publica esto: la topología no existe en el catálogo de ninguna ciudad, y
   construirla **es** la parte interesante.
2. ⚠️ **EL NIVEL.** Sin campo de cota, planarizar inventa cruces. Es el mayor riesgo de
   corrección del proyecto y no está resuelto. La pista está en OSM (`bridge`, `layer`).
3. **INTEGRAR OSM** para el pie, con su ODbL declarada.

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

### ⭐⭐ Las cinco decisiones del diseño de H1 (tandas 2 · 2.B · 2.C)

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
| ⭐ **"Tenemos lat-lon de todas las paradas de autobús"** | ⚠️ **Falso, y era de Antonio, de memoria.** No estaban en el dataset heredado: estaban en el GTFS que procesa 003. Pilar 2.14 operando |
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
| ⭐ **"Los 504 de Overpass eran la forma de la consulta"** (ley nº32) | ⚠️ **Refutada al día siguiente por el propio ejecutor**, con el dato en la mano: fallaron también sentencias únicas, y el servidor declaraba slots libres ocho segundos después de un 504. **Causa: `CAUSA NO CONFIRMADA`** — que es `NO CONSTA` con apellido |

---

## 7 · ⚠️ EL INSTRUMENTO HA MENTIDO 23 VECES — sin una sola línea de código

**Ocho tandas. Cero código de producto. Veintitrés instrumentos mintiendo.** Ya es una categoría,
no una anécdota — y llegó antes que el proyecto.

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

1. Descargar `MU1_jerarquia_viaria` completa y la red peatonal de OSM de la ciudad.
2. ⭐ **Planarizar**: partir cada tramo en sus intersecciones (106 puntos de cruce detectados en
   la muestra), y usar tolerancia pequeña (~2 m) **solo** para las puntas sueltas.
3. ⚠️ **Resolver los niveles.** Sin campo de cota, planarizar fusiona pasos elevados con la calle
   de debajo. La pista está en OSM (`bridge`, `layer`). **Riesgo de corrección nº1.**
4. Enganchar los 46.150 portales por `codigoVia` — puente exacto, no coincidencia aproximada.
5. Coser la red municipal (calzada) con la de OSM (acera, paso, escalera), declarando la ODbL.
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
| **3** | *(siguiente: cerrar P0 — ¿entra la geometría municipal en el grafo?)* | **H1** | ⬜ |

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

## 10 · Cabos abiertos

### ⭐⭐ Los que bloquean el diseño

*(⭐ Cerrados el 2/08: **¿entran los horarios?** → sí. **¿dónde corre el motor?** → repartido.
Los dos en §5.)*

| Cabo | Qué hay que decidir |
|---|---|
| ⭐⭐ **P0 REABIERTA: ¿entra la geometría municipal en el grafo, o solo aporta atributos?** | **Es el cabo que bloquea H1.** La regla de nivel (§5·D1) está resuelta **para OSM** y sigue abierta para el municipal: toda su solidez viene de la **cláusula del nodo compartido**, y la capa municipal **no tiene ni un nodo compartido**. Ahí sigue siendo pura inferencia, y su único criterio —el salto de velocidad— acaba de fallar en el paso inferior de Cesáreo Alierta (mismo límite arriba y abajo). ⇒ **Si el grafo se construye sobre OSM y el municipal solo aporta `codigo` de vía y atributos, el problema del nivel municipal desaparece**: no hay que inferir nada sobre una capa que no se planariza. ⚠️ El coste: enganchar atributos municipales a geometría OSM es emparejamiento aproximado, y ya se han medido **cuatro familias de excepción** en los nombres |
| **El stack** | Ya condicionado por el reparto del motor: hace falta **algo que sirva consultas de horario**, no solo estático. ⚠️ Y ahí el hosting compartido de Hostinger tiene algo que decir: no es lo mismo servir ficheros que mantener un proceso vivo. *Cuando el hosting y tú discrepéis, gana el hosting.* Leaflet + OSM se reutiliza de 003 sin restar puntos: el diferencial de 004 está debajo del mapa |
| **El alcance v1 del buscador** | Cada casilla combinable duplica los casos a verificar: cuatro modos son 16 combinaciones, por dos criterios, 32. ⚠️ Y "menos transbordos" y "más rápido" son **objetivos que compiten**: optimizar los dos a la vez no da un óptimo, da un conjunto donde ninguna ruta gana en todo. Se puede resolver con una penalización por transbordo — pero entonces hay que **decir que es una preferencia cableada, no un óptimo** |

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
- **944 paradas en el WFS contra 934 en el GTFS.** Sin explicar.
- **La clave del NAP.** Trámite de Antonio. El feed muere el **05/10/2026**.
- **Los dos números no cerrados de §4** (4,4 % de la red medida; 117 capas sin abrir).
- **`MU2_señalizacion_horizontal`** —donde vivirían las cebras— publicada pero inaccesible: su
  nombre lleva eñe y el servidor no resuelve el tipo. `NO CONSTA`.

### ⭐ El momento oro — declarado abierto, no olvidado

No hay ninguno declarado, y **es lo único de Fase 0 que no depende de ningún dato**. La guía lo
exige en Fase 0 por un motivo práctico: si se encuentra al final, la demo puede no contenerlo y ya
no da tiempo a construirlo.

⚠️ **Y probablemente no tenerlo aún sea correcto.** El de ZetaBus no salió de una lluvia de ideas:
salió de entender que las fuentes mentían. Aquí el motor todavía no ha resuelto una ruta.
Forzarlo hoy daría una escena de folleto.

**Dónde vigilarlo** — las tres que ya tienen la forma correcta:

1. **La regla de los 400 metros.** *Pides una ruta y la app te dice que no cojas nada, que andes.*
   Una app de transporte que a veces te dice que no lo uses es memorable.
2. **El planarizado uniendo dos calles que no se tocaban.** El momento en que el dato se convierte
   en red, enseñado.
3. **La frontera peatonal.** *"Por aquí no sé"* en vez de inventarse una acera. Es la tesis de
   ZetaBus reapareciendo con otra piel.

---

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

*(Pendiente. Se escribirá cuando el motor resuelva su primera ruta — no antes.)*

Lo que se puede decir hoy, y ya es una frase:

> **El Ayuntamiento publica las calles dibujadas, no conectadas.**
> **Las líneas se cruzan en el mapa y no se tocan en el dato.**
> **La red peatonal existe y no se publica.**
> **Y el trazado del autobús está en el fichero crudo, no en el que todos leen.**
>
> **Desplázame construye la red que nadie publica. Y cuando no sabe por dónde se pasa, LO DICE.**
