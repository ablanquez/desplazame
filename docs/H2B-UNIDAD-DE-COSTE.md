# H2b · Tanda 0 — LA UNIDAD DE COSTE, y la velocidad de la bici

*2026-08-12 · base `1ccb339` · **decisión de Antonio: opción C-ESTÁNDAR.***

> ⛔⛔ **ESTO ES UN REGISTRO DE DECISIÓN. NO SE HA ESCRITO NI UNA LÍNEA DE CÓDIGO** y la constante
> **no está implementada en ninguna parte**: no hay `VELOCIDAD_BICI_KMH` en el repositorio. Su sitio
> y su guardián se proponen en §6 y se construyen en H2b·2, cuando haya algo que la consuma.

> **Este documento se AÑADE. No reescribe ninguno anterior.**

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐⭐ **La constante: 18 km/h**, adoptada, no medida | **Y no por mayoría:** es el valor que asignan a la bici urbana **las dos implementaciones que distinguen tipo de bicicleta**. OSRM da 15 y **no distingue tipo** — su número contesta otra pregunta |
| ⭐⭐⭐ **Las tres fuentes, verificadas hoy abriendo el fichero** | OSRM `profiles/bicycle.lua` **15** · Valhalla *Hybrid/City* **18** · openrouteservice `CommonBikeFlagEncoder.java` **18**. ⛔ **No se promedia** |
| ⭐⭐ **La unidad común son SEGUNDOS, y viven en la COMPARACIÓN, no en el dato** | ⇒ **la decisión D2 de H2a se RESPETA, no se contradice**: el enlace sigue guardando **metros**. Y hay un argumento nuevo a favor de D2 que en su día no se dijo (§2.2) |
| ⭐⭐ **El cambio de modo NO es gratis, y también hay estándar citable** | Valhalla: `bss_rent_cost` y `bss_return_cost`, **120 s cada uno**. ⇒ una ruta BiZi arrastra **240 s** de cambios |
| ⛔⛔ **PREMISA DEL ENCARGO REFUTADA: los tiempos a pie NO salen de la banda medida** | Salen de **5,0 km/h**, que es una **constante adoptada** igual que la de la bici. ⇒ **no hay dos clases de número en pantalla: hay una** (§4.1) |
| ⛔⛔ **Y esta unidad NO resuelve el transporte público** | El bus y el tranvía **no tienen velocidad: tienen horarios**, y eso es H3. ⇒ **la combinación de H2b·4 no puede incluirlos sin que salgan gratis e instantáneos** (§7) |
| ⛔ **Y de paso: la cita de los 5,0 km/h no se sostiene entera** | **Valhalla usa 5,1, no 5,0**, y la atribución se imprime en cada pasada de la batería. Bitácora nº198 (§5) |

---

## §1 · T1 · LA CONSTANTE, CON SU PROCEDENCIA

### 1.1 · ⭐⭐⭐ Las tres, verificadas hoy — ⛔ no recordadas

**Cada una se abrió y se leyó el literal.** La fecha de consulta es **12/08/2026**.

#### OSRM — `profiles/bicycle.lua`, rama `master`

`https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/bicycle.lua`

```lua
local default_speed = 15
local walking_speed = 4
...
bicycle_speeds = {
  cycleway = default_speed,   primary = default_speed,   secondary = default_speed,
  tertiary = default_speed,   residential = default_speed, unclassified = default_speed,
  living_street = default_speed, service = default_speed,
  track = 12,   path = 13
}
...
vehicle_max_speed = 21, -- in km/h, realistic for recreational bikers
```

⭐ **La unidad la declara el propio fichero** en el comentario de `vehicle_max_speed`: **km/h**.
⚠️ **`default_speed` es UNO para todo**: OSRM no distingue tipo de bicicleta. Y `walking_speed = 4`
aquí es *la velocidad a la que se empuja la bici*, no la de andar.

#### Valhalla — Route API reference, *Bicycle costing options*

`https://valhalla.github.io/valhalla/api/route/api-reference/`

> *«Cycling speed is the average travel speed along smooth, flat roads.»*
> **Road: 25 KPH · Hybrid or City: 18 KPH · Cross: 20 KPH · Mountain: 16 KPH**

⭐ **Valhalla es la única de las tres que nombra el tipo de bicicleta**, y la que llama *«Hybrid or
City»* a la urbana.

#### openrouteservice — `CommonBikeFlagEncoder.java`, rama `main`

`https://raw.githubusercontent.com/GIScience/openrouteservice/main/ors-engine/src/main/java/org/heigit/ors/routing/graphhopper/extensions/flagencoders/bike/CommonBikeFlagEncoder.java`

```java
final int CYCLEWAY_SPEED = 18;  // Make sure cycleway and path use same speed value, see #634
protected static final int PUSHING_SECTION_SPEED = 4;
...
setHighwaySpeed(KEY_CYCLEWAY, CYCLEWAY_SPEED);        // 18
setHighwaySpeed("residential", 18);
setHighwaySpeed("primary", 18);  setHighwaySpeed("secondary", 18);  setHighwaySpeed("tertiary", 18);
setHighwaySpeed("unclassified", 16);   setHighwaySpeed(KEY_SERVICE, 14);
setHighwaySpeed(KEY_TRACK, 12);        setHighwaySpeed("path", 10);
setHighwaySpeed("footway", 6);         setHighwaySpeed("pedestrian", 6);
setHighwaySpeed(KEY_LIVING_STREET, 6); setHighwaySpeed(KEY_STEPS, PUSHING_SECTION_SPEED / 2);
```

Y la atribución del perfil sale de su propia documentación —
`https://giscience.github.io/openrouteservice/technical-details/travel-speeds/` —, que dice que los
valores del ciclismo regular viven en **`CommonBikeFlagEncoder`**.

⚠️ **UNA CAUTELA DECLARADA:** `CommonBikeFlagEncoder` es una clase **abstracta**. He verificado el
literal en la clase que la documentación señala; **no he abierto todas sus subclases** para
comprobar que ninguna sobrescriba `cycleway`. ⇒ *La cita es del fichero que la documentación
atribuye al perfil, no de una traza de ejecución.*

### 1.2 · ⭐⭐⭐ LA ELECCIÓN: 18 km/h — y no es una votación

```
   OSRM                15 km/h    un único `default_speed`, sin tipo de bici
   Valhalla            18 km/h    "Hybrid or City"  (Road 25 · Cross 20 · Mountain 16)
   openrouteservice    18 km/h    cycling-regular, en cycleway y en calzada urbana
```

⛔ **No se promedia** (el encargo lo prohíbe, y con razón: la media de tres constantes no es la
constante de nadie). **Y tampoco se elige por mayoría**, que sería el mismo error con otro nombre.

> **Se elige 18 porque es la única cifra que contesta LA PREGUNTA QUE HACEMOS.** Valhalla y
> openrouteservice **distinguen tipo de bicicleta** y a la urbana le dan 18 las dos. OSRM **no
> distingue**: su 15 es un valor único para carreras, montaña y ciudad a la vez. ⇒ **Los tres no
> discrepan sobre la bici urbana: dos hablan de ella y el tercero no.**

⭐ **Y hay una coincidencia que refuerza la elección sin ser su motivo:** los 18 de openrouteservice
están puestos **a la vez** en `cycleway` y en `residential`/`primary`/`secondary`/`tertiary` — la
misma velocidad en el carril bici y en la calzada. **Es exactamente lo que la tanda 1 midió que hace
falta aquí**: la red ciclable de Zaragoza son 666 trozos y la bici tiene que poder salir a la
calzada.

### 1.3 · ⚠️ QUÉ SE ESTÁ ADOPTANDO, Y QUÉ NO — el aviso del encargo, atendido

> *«Una velocidad media de ciclista urbano no es lo mismo que una velocidad de bici de alquiler
> pesada. Di cuál es la que citas.»*

⛔ **Lo que se cita es la de CICLISTA URBANO en bicicleta propia de ciudad.** *Hybrid or City* de
Valhalla y `cycling-regular` de openrouteservice describen eso.

⛔⛔ **NINGUNA DE LAS TRES MODELA UNA BICI DE ALQUILER PÚBLICO.** Ni OSRM, ni Valhalla —que sí tiene
tipos— ni openrouteservice tienen un perfil de bici compartida. ⇒ **Los 18 km/h son, casi con
seguridad, OPTIMISTAS para una BiZi**: es más pesada, tiene menos desarrollos y no se ajusta al
usuario. **Cuánto de optimistas: `NO CONSTA`.**

⇒ **El coste declarado de esta decisión, y es el principal:** la misma constante sirve a **bici
propia** y a **BiZi**, que en el modelo de la tanda 1 comparten CIRCULACIÓN. **Es coherente con el
modelo y probablemente injusto con la BiZi.** ⛔ **No invento una segunda constante para arreglarlo**
—no hay fuente que citar— y lo dejo como decisión abierta en §8.

---

## §2 · T2 · LA UNIDAD, Y DÓNDE VIVE

### 2.1 · La unidad común son SEGUNDOS

```
   coste_comparable(tramo) = tramo.metros / velocidad_del_modo_del_tramo
```

⭐ **Y con eso el ejemplo que bloqueó la tanda 1 se resuelve solo:**

```
   500 m andando a 5,0 km/h  =  360 s  =  6,0 min
   2.000 m en bici a 18 km/h =  400 s  =  6,7 min
   ⇒ gana andar por poco — y ahora es una comparación, no una confusión de unidades.
```

### 2.2 · ⭐⭐ ¿Contradice la decisión D2 de H2a? — **NO. La respeta, y le da un argumento nuevo**

D2 de H2a dice que el enlace guarda **metros, no minutos**, porque *«convertir a minutos exige una
velocidad, y guardar minutos convertiría una banda en un dato falso-preciso»*.

> **La unidad que tiene que ser común es la de la COMPARACIÓN, no la del ALMACENAMIENTO.**
> **Se guarda:** metros por tramo **+ el modo del tramo**.
> **Se compara:** segundos, derivados **al leer**, con la constante del modo.

⇒ ⛔ **Ni un byte de los 2.538 enlaces cambia**, y no hace falta recalcular nada.

⭐⭐ **Y hay un argumento a favor de D2 que en su día no se dijo y que esta tanda hace visible:**
**si H2a hubiera guardado minutos, el hallazgo de la bitácora nº198 obligaría a recalcular el
artefacto entero.** Con metros guardados, cambiar 5,0 por 5,1 es una división distinta al leer. *La
decisión de guardar la magnitud cruda y no la derivada es lo que hace barato corregir una constante,
y eso solo se ve el día que una constante falla.*

⚠️ **Lo que sí hay que añadir al dato, y es nuevo:** hoy un enlace guarda `m` y no guarda el modo del
tramo, porque **todos** eran a pie. En cuanto haya tramos de bici, **cada tramo tiene que decir de
qué modo es**, o los metros dejan de ser convertibles. **Es un campo, no un recálculo.**

### 2.3 · ⭐⭐ El coste de un cambio de modo — **no es cero, y hay estándar citable**

**El argumento primero, el número después.** ⛔ **Con coste cero, un cambio de modo es gratis, y un
buscador que puede cambiar gratis produce rutas absurdas**: coger una BiZi para 40 m, o el
`BiZi → BiZi` seguidas que la tanda 1 declaró sin sentido. **Un coste > 0 no es una penalización
inventada: es lo único que hace que el camino mínimo prefiera no cambiar sin motivo.**

Y resulta que la misma fuente ya lo tiene, y con la misma clase de cita:

> **Valhalla, Route API reference:** `bss_rent_cost` — *«It is meant to give the time will be used to
> rent a bike from a bike share station. This value will be displayed in the final directions and
> used to calculate the whole duration. **The default value is 120 seconds**.»*
> `bss_return_cost` — mismo texto para devolverla, **120 segundos**.

```
   coger una BiZi ......... 120 s      devolverla ......... 120 s
   ⇒ una ruta con BiZi arrastra 240 s = 4 min de cambios de modo
```

⭐ **Y Valhalla separa `cost` de `penalty`**: el `cost` **se muestra al usuario y suma a la duración**;
el `penalty` **no se muestra y solo dirige al algoritmo**. ⇒ **Se adopta el `cost` (120 s) y NO el
`penalty`**: un número que cambia la ruta y no se enseña es exactamente lo que este proyecto llama
mentir.

⚠️ **Y lo que NO tiene fuente:** el cambio **bus → a pie** o **bici propia → a pie**. Valhalla solo
publica el de bici compartida. ⇒ **`NO CONSTA`, y no se inventa.** Bajarse de un bus también cuesta
tiempo; **cuánto, no lo sé y no lo pongo.**

---

## §3 · T3 · LA LEY 157 A LO QUE SE PUBLICA

> *«Una etiqueta no miente en su definición: miente en su lectura — y nadie lee las definiciones.»*

Un tiempo calculado con una constante adoptada **no es una predicción**: es una división. Las frases,
auditadas:

| frase | ¿pasa? |
|---|---|
| *«Tardarás 12 minutos»* | ⛔ **NO.** Afirma sobre el futuro de una persona concreta. **Nada de lo que hay aquí sabe eso** |
| *«12 minutos»* a secas | ⛔ **NO.** Sin la constante al lado, el lector la lee como una predicción |
| *«unos 12 minutos»* | ⛔ **NO, y es la peor**: suena a que hay un margen medido detrás, y no lo hay. **Suaviza sin informar** |
| ✅ *«12 min a 18 km/h»* | ✅ **PASA.** Dice el número **y de dónde sale**, en el mismo renglón |
| ✅ *«2,0 km en bici — 12 min a 18 km/h (velocidad estándar, no medida aquí)»* | ✅ **PASA y es la propuesta**: la constante viaja pegada al número (ley 161: *el límite viaja con el dato*) |

⭐ **Y el redactor ya lo hace bien para andar** — `src/relato.js:672` imprime *«⚠️ el tiempo es una
estimación a 5,0 km/h»*. **Lo que se propone es extender esa forma, no inventarla.**

### 3.1 · ⛔⛔ Y la premisa del encargo que hay que refutar

> *«Los tiempos a pie salen de la banda MEDIDA; los de bici saldrían de una constante ADOPTADA. Son
> dos clases de número distintas en la misma pantalla.»*

**No lo son. Los dos son adoptados**, y está en el código:

```
   src/relato.js:78    const VELOCIDAD_KMH = 5.0;
   src/relato.js:81-82 function minutos(metros) { return metros / (VELOCIDAD_KMH * 1000 / 60); }
```

Y `5.0` **es la constante estándar**, no la banda. La banda medida de Antonio —**4,3–4,5 km/h**—
vive en `data/pruebas/RUTAS-CONOCIDAS.md` y **no calcula ningún tiempo publicado**: sirve para
CONTRASTAR. *(Comprobado: los únicos consumidores de `Rel.minutos()` son `relato.js:667`,
`exportar-rutas.js:96` y `velocidad.js:110`, y los tres pasan por `VELOCIDAD_KMH`.)*

⇒ ⭐⭐ **Hay UNA sola clase de número en pantalla, y eso simplifica T3 en vez de complicarlo:** todos
los tiempos del proyecto son *«metros ÷ una constante estándar»*, y **la única regla que hace falta
es que la constante viaje al lado.** ⚠️ *La confusión venía de que la banda medida existe y es
famosa dentro del proyecto — pero no está enchufada a nada que se publique.*

---

## §4 · LO QUE ESTA TANDA **NO** CAMBIA

- ⛔ **`VELOCIDAD_KMH` no se toca.** Sigue en 5,0.
- ⛔ **Ni un metro de los 2.538 enlaces, ni del grafo, ni de las diez rutas.**
- ⛔ **No hay constante de bici en el código.** Este documento la decide; **H2b·2 la implementa.**
- ⛔ **No se ha medido ninguna velocidad sobre el terreno**, que es lo que la decisión descarta.

---

## §5 · ⛔ UN HALLAZGO DE CAMINO: la cita de los 5,0 km/h no se sostiene entera

Verificar las fuentes de la bici obligó a abrir las mismas páginas para andar:

```
   openrouteservice   "The travel speeds for foot-* profiles are set to 5 km/h on all
                       allowed waytypes"                                            ✅ 5
   OSRM               profiles/foot.lua → local walking_speed = 5                    ✅ 5
   Valhalla           pedestrian costing → "Defaults to 5.1 km/hr (3.1 miles/hour)"  ⛔ 5,1
```

Y lo que el proyecto publica —en `docs/H1-VELOCIDAD-ESTANDAR.md` §A, en `src/velocidad.js:20-23`
y **en pantalla en cada pasada de la batería** (`src/velocidad.js:113`)— es:

> *«Las isócronas basadas en **OSRM / Valhalla** usan **5 km/h** por defecto»*

⇒ **Cierto de OSRM, falso de Valhalla.** Bitácora nº198.

⭐ **Y la decisión de los 5,0 NO se cae**, por dos razones: **dos de las tres fuentes dan 5 exacto**,
y sobre todo **el argumento de la tanda 4 nunca fue la media de la literatura** — era *«usar la
constante de los demás hace nuestros tiempos comparables con los suyos»*. **Lo que hay que corregir
es la FRASE, no el número.**

**Propuesta de redacción, para que la apruebe o la cambie Antonio** *(⛔ no aplicada: `velocidad.js`
está fuera del alcance de esta tanda)*:

> *el estándar que este proyecto adopta: 5,0 km/h — openrouteservice (foot-\*, 5 km/h) y OSRM
> (`profiles/foot.lua`, `walking_speed = 5`). ⚠️ Valhalla usa 5,1 km/h en su coste peatonal.*

---

## §6 · DÓNDE VA A VIVIR LA CONSTANTE, Y QUÉ GUARDIÁN LE FALTA

⛔ **No se construye aquí.** Se deja escrito para H2b·2:

- **Un sitio, no dos.** Igual que `VELOCIDAD_KMH` vive en `src/relato.js` y todo el mundo la deriva
  —lo que `velocidad.js:159` ya vigila con `V3`—, la de bici tiene que tener **un único origen**.
- ⭐⭐ **Y el guardián que hoy NO existe para ninguna de las dos: uno de PROCEDENCIA.** Los tres
  invariantes de `src/velocidad.js` vigilan el **valor** y ninguno la **cita** — por eso la
  atribución de Valhalla sobrevivió cuatro tandas (bitácora nº198). **Un guardián de procedencia
  tendría que exigir que cada constante adoptada lleve al lado, en el código, la URL y el literal
  citado**, de forma que un `grep` los encuentre y una persona pueda volver a abrirlos.
  ⚠️ **Lo que ese guardián NO puede hacer, dicho ya: comprobar que la URL siga diciendo lo mismo.**
  Eso exige red, y el código que sale a la red vive en `tools/`, no en `src/`.

---

## §7 · ⚠️ QUÉ MODO **NO** QUEDA RESUELTO CON ESTA UNIDAD

⛔⛔ **EL TRANSPORTE PÚBLICO. Y no es un fleco: es la mitad del producto.**

Una velocidad convierte metros en segundos. **El bus y el tranvía no tienen velocidad propia en este
proyecto:**

- H2a metió `stop_times.txt` **y sus horas no sobrevivieron a propósito** — la red se derivó de
  secuencias, no de tiempos.
- Un tramo de bus **no es una distancia recorrida a una velocidad**: es *«esperar lo que sea + ir de
  la parada 4 a la 11»*, y las dos mitades son reloj.

⇒ **Con esta unidad, una ruta `andar → bus → andar` NO tiene duración calculable.** Y las dos salidas
que caben son las dos malas:

| | qué pasaría | por qué es malo |
|---|---|---|
| **el tramo de bus cuesta 0** | el buscador manda a todo el mundo en bus | ⛔ **el bus sería gratis e instantáneo**: gana siempre |
| **el tramo de bus no se puede componer** | H2b·4 combina solo a pie + bici propia + BiZi | ⚠️ **Es honesto y deja fuera el modo que más usa la gente** |

⇒ ⛔ **REPORTADO HACIA ARRIBA, y no lo decido:** *la combinación de modos de H2b·4 nace sin poder
incluir el transporte público, y eso no lo arregla esta unidad — lo arregla H3.*
⭐ **Lo bueno: la unidad no se rompe, se queda corta.** El día que H3 traiga horarios, un tramo de bus
producirá segundos como los demás y **la fórmula de comparación no cambia.**

---

## §8 · DECISIONES QUE QUEDAN ABIERTAS

| | qué | por qué no la cierro |
|---|---|---|
| **1** | ⚠️ **¿Una constante o dos —bici propia y BiZi?** | Los 18 son de bici urbana propia; **una BiZi es más pesada y no hay fuente que citar** (§1.3) |
| **2** | ⚠️ **El coste de bajarse de un bus o de dejar la bici propia** | Valhalla solo publica el de bici compartida. **`NO CONSTA`** (§2.3) |
| **3** | ⛔ **La frase de la procedencia de los 5,0 km/h** | Propuesta escrita en §5; `velocidad.js` está fuera del alcance |
| **4** | ⛔⛔ **Qué se hace con el transporte público en H2b·4** | §7. **Es de Antonio** |
| **5** | ⚠️ **Si la velocidad debe variar por tipo de vía**, como hacen las tres fuentes | ORS da 18 en calzada y **6 en `footway`**; OSRM da 13 en `path`. **Adoptar una sola cifra es adoptar la mitad del modelo**, y hay que decir que se hace |

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **La constante es 18 km/h**, con las tres fuentes verificadas fichero a fichero. **No es una
   mayoría: OSRM no distingue tipo de bici y las otras dos sí, y las dos dan 18 a la urbana.**
2. ⭐⭐ **La unidad común son SEGUNDOS y viven en la comparación.** ⇒ **D2 de H2a se respeta** y gana
   un argumento nuevo: **guardar la magnitud cruda es lo que hace barato corregir una constante.**
3. ⭐⭐ **El cambio de modo no es gratis: 120 s por coger y 120 s por devolver una bici compartida**,
   citado de Valhalla. Y se adopta su `cost` (visible) y **no** su `penalty` (invisible).
4. ⛔⛔ **La premisa de que hay dos clases de número en pantalla es falsa**: los tiempos a pie salen
   de una constante **adoptada**, no de la banda medida. **La banda no calcula nada publicado.**
5. ⛔⛔ **Esta unidad NO resuelve el transporte público**, y eso deja a H2b·4 naciendo sin el modo que
   más se usa. **Decisión de Antonio.**
6. ⛔ **La cita de los 5,0 km/h es falsa para Valhalla (5,1)** y se imprime en cada pasada de la
   batería. Bitácora nº198. **La decisión no se cae; la frase sí.**
7. ⭐⭐ **Ley nueva:** *una atribución sin cita no es falsable, y por eso sobrevive a cualquier número
   de revisiones.* **La ley 140 no se estaba aplicando hacia fuera.**
8. ⚠️ **Adoptar una sola cifra es adoptar la mitad del modelo:** las tres fuentes dan velocidades
   **por tipo de vía** (ORS: 18 en calzada, 6 en `footway`, 2 en escaleras).

---

## §10 · LAS DOS BATERÍAS

```
   base    11:38:50 → 11:59:59   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

⚠️ Esta tanda **no toca código**. Lo que toca —dos ficheros de `docs/`— **sí está dentro del universo
de la batería** (`src/superados.js:272` recorre `docs/`), así que la línea base se lanzó con el árbol
quieto y **no se escribió nada hasta que terminó.**

---

**Fuentes externas citadas** *(consultadas el 12/08/2026)*:
[OSRM `profiles/bicycle.lua`](https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/bicycle.lua) ·
[OSRM `profiles/foot.lua`](https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/foot.lua) ·
[Valhalla Route API reference](https://valhalla.github.io/valhalla/api/route/api-reference/) ·
[openrouteservice `CommonBikeFlagEncoder.java`](https://raw.githubusercontent.com/GIScience/openrouteservice/main/ors-engine/src/main/java/org/heigit/ors/routing/graphhopper/extensions/flagencoders/bike/CommonBikeFlagEncoder.java) ·
[openrouteservice · Travel Speeds](https://giscience.github.io/openrouteservice/technical-details/travel-speeds/)

**Instrumentos citados:** [`src/relato.js`](../src/relato.js) · [`src/velocidad.js`](../src/velocidad.js) ·
**Bitácora:** nº198.
