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

## ESTADO ACTUAL — 6 de agosto de 2026

**H1 está terminado. Estamos en su AUDITORÍA DE CIERRE: bloque A hecho, B y C pendientes.**

**Lo que existe y funciona:**

- ⭐⭐ **El grafo peatonal de Zaragoza entera**, planarizado y verificado: **68.649 nodos, 98.774
  aristas**, 6,5 s de proceso. **Los ríos no lo parten** y los tres barrios rurales incomunicados
  lo están de verdad, contados y publicados.
- ⭐⭐ **El motor va de DIRECCIÓN a DIRECCIÓN**: 46.026 de 46.150 portales enganchados, 2.661 vías
  en el índice, itinerario agrupado por vía y explicado paso a paso.
- ⭐⭐ **LAS SIETE RUTAS DE ANTONIO, verificadas por él con los ojos sobre el mapa: 7 de 7.**
  ⚠️ **La nº7 da 2.529 m contra los 2.600 de su GPS (2,7 %) y CALIBRA los ~6 km/h de toda la
  tabla: ninguna tanda puede moverla.**
- ⭐ **El mapa dice cuatro cosas** (azul · rojo · gris · verde) y **56.864 líneas tienen nombre**,
  puestas con dos testigos independientes.
- ⭐⭐ **El buscador respeta la paridad** (tandas 32-36): *la acera par y la impar son como dos
  calles distintas que no guardan relación*. Si no hay número de tu paridad cerca, **no se
  contesta: se sugiere**. Tres listones: **su acera 50 m · la de enfrente 150 m · tope de adelanto
  20 m**.
- **26 números publicados congelados**, y ya han avisado en caliente más de una vez.
- **74 ficheros · 24.931 líneas de JavaScript · cero dependencias.** Repositorio público al día,
  166 commits.

**Dónde estamos exactamente: la AUDITORÍA DE CIERRE DE H1, tres bloques.**

| | | |
|---|---|---|
| **A · El código** | ✅ **HECHO** | `A-CODIGO-2026-08-06.md` — 4 vivos + D5 ascendido |
| **B · La documentación** | ✅ **HECHO** | `B-DOCUMENTACION-2026-08-07.md` — 3 vivos · 13 superados · 5 deudas |
| **B.2 · El contraste** | ✅ **HECHO** | `B2-CONTRASTE-2026-08-07.md` — **el mapa de las 2.062, entero**; 3 vivos · 10 superados · la cosecha. ⛔ **Contrastadas 38 (1,8 %)**: recorrer no se puede, contrastar `R` es circular |
| **C · Las decisiones y los ejes** | ✅ **HECHO** | `C-DECISIONES-2026-08-07.md` — ⛔⛔ **retiró `B·V1`, un rojo falso publicado** · el reparto del diseño · **la tabla de los ejes** · la cobertura de toda la auditoría |
| ⭐ **La lista de arreglos, entera** | ⬜ **SIGUIENTE** | **Diez vivos** + la batería + los diez congelados propuestos. **Se decide aquí, sin ejecutor** |

⛔⛔ **La auditoría NO arregla nada.** Todo se anota con su gravedad y **la lista de arreglos se
decide al final de los tres bloques, entera.**

⭐ **Y las tres frases que resumen lo que llevan dicho los cuatro bloques:**
> **La clase de fallo dominante aquí no es el código roto: es la medida que se corrigió en el
> informe y no en el instrumento.** *(A)*
> **La cadena de documentos es navegable solo en la dirección en la que nadie la lee.** *(B)*
> ⭐⭐⭐ **Ninguno de los cuatro bloques ha comprobado que la ruta que sale sea la ruta correcta.**
> *(C — y no lo abre esta auditoría: lo hereda)*

**Falta decidir:** el alcance v1 del buscador · la lista de **candidatos aparcados** (§10), que no
se toca hasta que H1 cierre.

**Después de la auditoría: H2, la red de transporte.**
⚠️ **Y un plazo real: el GTFS caduca el 05/10/2026, y H2 depende de él.**

*(Cómo se llegó hasta aquí: §4 el terreno · §5 las decisiones · §9 el diario de las tandas.)*

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

**7 de 7 resueltas · 6 de 7 en rodeo · 0 imposibles.**

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

## 7 · ⚠️ EL INSTRUMENTO HA MENTIDO 93 VECES

**Cuarenta tandas y cuatro de auditoría. Noventa y tres instrumentos mintiendo** — los 33 primeros,
sin una sola línea de código. Ya es una categoría, no una anécdota — y llegó antes que el proyecto.
⚠️ **Los trece últimos (81-93) los produjo la propia auditoría de cierre**, y casi todos se cazaron
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
2. ⭐ **Planarizar**: partir cada tramo en sus intersecciones (106 puntos de cruce detectados en
   la muestra), y usar tolerancia pequeña (~2 m) **solo** para las puntas sueltas.
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
| **A** | ⭐⭐ **AUDITORÍA DE CIERRE · el código** | **H1** | ✅ **4 vivos** |
| **B** | *(siguiente: **AUDITORÍA · la documentación contra el dato de hoy**)* | **H1** | ⬜ |
| **C** | AUDITORÍA · las decisiones y los ejes | **H1** | ⬜ |

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
| **A·V1** | ⛔⛔ **El centinela 99999 se apagó en el informe, no en el instrumento.** Sigue imprimiendo los cuatro números que la tanda 35 declaró falsos, **y la batería sale en verde** | `acera-equivocada.js` |
| **A·V2** | ⛔⛔ **Dos medidas del mismo universo divergen hoy** (50.986 vs 51.065): `codigoVia` contra núcleo de vía. **El congelado vigila uno de los dos** | `acera-equivocada.js` / `medir-paridad.js` |
| **A·V3** | ⛔ **Un número publicado infravalorado**: el *«16,9× el azar»* es **21,3×** limpio | `H1-PORTALES.md` §323 |
| **A·V4** | ⛔⛔ **El README dice que todavía no hay código** —ni una línea de aplicación—, con 24.931 líneas y un motor funcionando. **Y dos frases más:** *«no hay código que pueda fallar»* (144 entradas de bitácora) y *«no contiene ningún dato integrado»* (46.150 portales). ⭐ **No es registro histórico: es la puerta, y ahí sí se reescribe** | `README.md` |
| ⭐ **A·D5** | ⛔⛔ **UN CLON DEL REPOSITORIO PÚBLICO NO PUEDE EJECUTAR NI UN SCRIPT** — dos rutas absolutas a `E:/PROYECTOS WEB/…`. *(El registro de A lo anotó como **deuda D5**; **Antonio lo sube a VIVO el 6/08**.)* ⭐⭐ **Y el bloque B lo midió: 49 de los 70 ficheros de `src/` (70 %) no pueden correr en un clon**, y los 21 restantes son librerías que reciben la ruta por parámetro ⇒ **un clon no construye el grafo ni resuelve una dirección** | `portales.js:38-39` |
| **B·V2** | ⛔ **El README atribuye a una capa lo que está repartido en tres.** Dice que `MU1_jerarquia_viaria` trae 3.644 tramos **con código de vía**: 3.644 es `tn-ro:RoadLink` y no tiene ninguno de los tres atributos; la capa nombrada tiene 3.453 y tampoco trae código; el código solo está en `urbanismo:Vias` (3.359). ⭐ **La conclusión sigue siendo cierta; la evidencia con que se justifica, no** | `README.md:32-34` |
| **B·V3** | ⛔⛔ **Lo que el README promete no es verdad en un clon**, y **no lo menciona en ninguna línea**. ⭐ **Y lo afilado: los 48 comandos `node …` citados existen los 48.** No falta el fichero — está y no puede correr: el lector copia el comando y recibe un `ENOENT` sobre un disco que no es suyo | `README.md` |
| ⭐⭐ **B2·V1** | ⛔⛔ **EL DENOMINADOR APROBADO DEJA FUERA 12 DE LOS 26 CONGELADOS.** Aparecen **31 veces en `docs/` y ninguna marcada**; el control positivo (98.774 · 4.562) sale marcado 7 y 11 veces. Viven en celdas de tabla sin negrita. ⇒ **El censo v2 mide lo que el proyecto SUBRAYA, no lo que AFIRMA**, y con ello **toda cobertura declarada sobre 2.062** — en B y en B.2. ⛔ Propuesta del ejecutor: **no ampliar el censo** (el v1 ya enseñó adónde lleva) sino **declararlo por lo que es** y decir que su intersección con los congelados es de 13 | la definición de trabajo del bloque B |
| **B2·V2** | ⛔ **Un script recita un número que él mismo acaba de desmentir.** Línea 77 mide **412,7×**; línea 192 imprime **«400× el azar»** dentro del veredicto. ⭐ **El documento copió el bueno: el que miente es el script.** Es el nº144 con vuelta de tuerca — **vive en una cadena que se imprime, así que no parece un comentario: parece un resultado.** Sostiene el veredicto E7 de `H1-CIERRE.md` §433 | `sin-vigilancia.js:77/192` |
| **B2·V3** | ⛔ **El «182 líneas decorativas» es de la tanda 29; hoy su instrumento da 232**, con siete tandas de código por medio — y este documento lo citaba en presente *(corregido el 7/08)*. ⭐⭐ **Cierra un `NO CONSTA` del bloque A**: el productor es `auditoria-guardianes.js` §A1b | `H1-AUDITORIA-GUARDIANES.md:20` |

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

### ⛔⛔⛔ UN HALLAZGO PUBLICADO Y RETIRADO — `B·V1` (7/08)

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
- ⚠️ **El diseño y la adenda se contradicen** en el enganche de portales: P4.1 dice *"manda el
  código, SIEMPRE"* y la adenda §A1 dice *"por proximidad"*. **Manda la adenda** (posterior y
  explícita, y es lo que se ha construido). Pendiente de reconciliar por escrito.
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

*(Pendiente. Se escribirá cuando el motor resuelva su primera ruta — no antes.)*

Lo que se puede decir hoy, y ya es una frase:

> **El Ayuntamiento publica las calles dibujadas, no conectadas.**
> **Las líneas se cruzan en el mapa y no se tocan en el dato.**
> **La red peatonal existe y no se publica.**
> **Y el trazado del autobús está en el fichero crudo, no en el que todos leen.**
>
> **Desplázame construye la red que nadie publica. Y cuando no sabe por dónde se pasa, LO DICE.**
