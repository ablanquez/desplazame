# AUDITORÍA DE CIERRE DE H1 · BLOQUE B — LA DOCUMENTACIÓN

**2026-08-07.** Segundo de tres bloques. ⛔ **Este documento no se reescribe nunca.**

> ⛔⛔ **Esta tanda NO ha arreglado nada.** Ni un carácter de `src/`, ni un
> documento, ni el README. Lo único escrito es este registro. Las siete rutas,
> idénticas.

---

## ⭐⭐⭐ 0 · EL AUDITOR MINTIÓ TRES VECES, Y UNA DE ELLAS IBA A PUBLICAR UN VERDE FALSO

Va primero, como en el bloque A, porque condiciona lo que se puede creer de abajo.

| # | qué hacía mal | cómo se cazó | qué habría publicado |
|---|---|---|---|
| 1 | el censo v1 clasificó **10.192 de 19.906** tokens como «afirmación» | ⭐ mirando una **muestra sistemática**: casi todas eran celdas de tablas de resultado | un denominador de cobertura inflado ×5 |
| 2 | el cruce congelados↔documentos daba **6 «el documento no lo contiene»** | ⭐ leyendo los seis: `(4562).toLocaleString('es-ES')` devuelve `«4562»` —Intl **no agrupa cuatro cifras**— y los documentos escriben `«4.562»` | **cinco hallazgos falsos** |
| 3 | ⭐⭐⭐ la contraprueba rompía **solo la primera aparición** del número | **la propia contraprueba: cazó 1 rojo de 6** | **«26 de 26 ✅» con el rojo del método nunca visto** |

⇒ El nº3 es el que importa: **el resultado limpio de §B2 estaba a punto de
publicarse con un método cuyo rojo no se había visto jamás.** Lo paró la ley 62,
no mi criterio.

**Estado final de los instrumentos** (todos fuera de `src/`, ninguno en la batería):

```
   b1-censo.js      censo bruto — DESCARTADO por sobreinclusivo (§B1)
   b1-titulares.js  censo acotado a lo que el documento MARCA como afirmación
   b2b4.js          cruce congelados ↔ documentos · --rojo = contraprueba
   b4-superados.js  barrido de valores superados · con control positivo y negativo
   b4-punteros.js   grafo de citas entre documentos · con control ± 
   b3-comandos.js   comandos, rutas citadas y alcance de V5
```

---

# ⛔⛔ HALLAZGOS VIVOS — un documento vigente afirma algo falso HOY

## BV1 · `DISEÑO-H1-GRAFO.md` §P4.1 no describe lo que hace el motor

**Dónde:** `docs/DISEÑO-H1-GRAFO.md:545`.

> **Regla:** manda el código. **Siempre.** Y si la distancia a su propia calle
> supera un umbral, no se cambia de calle: **se marca**.

**Lo que hace el motor, leído en el código** (`src/portales.js:181` +
`src/enganche.js:36`):

```js
if (!mejor || s.d < mejor.d) { … mejor = { i, k, d: s.d, … }; }
```

`engancharUno` elige **por distancia pura**. La función de nombre (`nucleoDe`)
entra **solo** para localizar la *segunda mejor de otra vía* — es decir, como
**testigo del empate**, nunca como filtro. El `codigoVia` no participa en la
elección: se usa después, para **marcar** discordancias.

⇒ **Quien manda es la proximidad.** Y hay un documento que lo dice bien:
`DISEÑO-H1-ADENDA.md:36` — *«El enganche sigue siendo **por proximidad sobre la
geometría de OSM** (D0, sin cambios)»*.

**Desde cuándo:** la ADENDA es del **2026-08-03**, un día después del diseño, y su
*«sin cambios»* dice que **P4.1 nunca describió el código**. No es que envejeciera:
nació describiendo otra cosa.

**Qué se apoya en ello:** la garantía más fuerte del diseño —*«cambiar de calle por
cercanía es reintroducir el emparejamiento aproximado por la puerta de atrás»*—.
⚠️ **La garantía real existe**, pero es otra: los dos testigos de la ADENDA. Lo que
falla es el documento que un lector abre primero.

**Propuesta (sin aplicar):** en `DISEÑO-H1-GRAFO.md`, una nota al pie en §P4.1 que
apunte a `DISEÑO-H1-ADENDA.md` §A1. ⛔ No reconciliar los textos: marcar cuál rige.

---

## BV2 · El README atribuye a una capa lo que está repartido en tres

**Dónde:** `README.md:32-34`.

> El GeoServer del Ayuntamiento publica 178 capas por WFS;
> `movilidad:MU1_jerarquia_viaria` **trae 3.644 tramos** con geometría, sentido de
> circulación, límite de velocidad y —lo decisivo— **el código de vía** que enlaza
> con los 46.150 portales.

**Lo que dice el informe que el propio README enlaza**
(`docs/RECONOCIMIENTO-RED-ZARAGOZA.md:236-246`):

| | `urbanismo:Vias` | `JERARQUIA_VIARIA` | `tn-ro:RoadLink` |
|---|---:|---:|---:|
| features | 3.359 | **3.453** | **3.644** |
| ⭐ `codigoVia` | **SÍ** | no | no |
| sentido · velocidad | no | **SÍ** | no |

- **3.644 es `tn-ro:RoadLink`**, que **no tiene** ni sentido, ni velocidad, ni código.
- La capa que el README nombra tiene **3.453**, y **no tiene código de vía**.
- El código de vía solo lo trae `urbanismo:Vias`, con **3.359**.

⇒ **Ninguna capa tiene las cuatro cosas.** El README funde tres en una y le pone el
número de la que menos atributos tiene.

**Qué se apoya en ello:** el primero de los cuatro puntos con los que la portada
sostiene *«sí hay red viaria vectorial descargable»*. ⚠️ **La conclusión sigue
siendo cierta** —hay red y hay código de vía— pero **la evidencia con la que se
justifica, no**. Es la ley 43: el error va en la dirección que favorece a la tesis.

⭐ **Medido con:** lectura directa del informe enlazado. El dato crudo (`178
capas`, `46.150 portales`) **sí cuadra**: 46.150 es lo que devuelve
`P.cargarPortales()` hoy.

---

## BV3 · Lo que el README promete no es verdad para quien clone el repositorio

**Dónde:** `README.md`, §*«Cómo comprobar lo que dicen los informes»* y §*«Si
trabajas en este repositorio»*.

El README explica cómo instalar el hook y dice que en `data/exploracion/` está *«lo
necesario para reproducir los números sin fiarse de nadie»*. **No menciona en
ninguna línea** que el motor lea de otro disco ni que `data/fuentes/` no viaje.

**Medido** (`b3-comandos.js`, cierre transitivo de `require` sobre las 70 fuentes):

```
   ficheros con una ruta que NO viaja en el clon        3
      portales.js              E:/PROYECTOS WEB/01 ZGZ RADAR REACT/…   (×2)
      cerrar-punto-ciego.js    data/fuentes/…            (gitignoreado)
      entrar-por-la-puerta.js  data/fuentes/…            (gitignoreado)
   ⭐⭐ ficheros de src/ que NO pueden correr en un clon  49 de 70   (70 %)
   ficheros que sí podrían cargarse                     21
```

⚠️ **Y los 21 son un techo, no una promesa:** casi todos son librerías (`geo`,
`grafo`, `osm`, `planarizar`, `paridad`) que reciben la ruta del crudo por
parámetro. **Un clon no puede construir el grafo ni resolver una dirección.**

⭐ **48 comandos `node …` distintos están citados en la documentación y los 48
existen** (§B3.2). ⇒ **El problema no es que falte el fichero: es que el fichero
está y no puede correr.** Un lector copia el comando, lo pega y recibe un
`ENOENT` sobre un disco que no es suyo.

**Propuesta (sin aplicar):** es decisión de Antonio si esto se arregla en el código
(bloque C) o en el README. ⛔ Lo que aquí se anota es que **hoy la portada no lo
dice**, y eso sí es documentación.

---

# ⛔ SUPERADOS — registro histórico desmentido y sin marca que lo diga

⭐ **El patrón, medido, y es lo que más dice de este apartado:**

```
   citas entre documentos, HACIA ATRÁS (a uno anterior)     40
   ⭐ citas HACIA DELANTE (a uno posterior)                  10
   ⛔ punteros hacia delante en los 5 documentos que un
      número congelado declara superados                     0
```

> ⭐⭐ **La convención «este documento se AÑADE, no reescribe nada» crea un puntero
> hacia ATRÁS y ninguno hacia DELANTE.** `H1-VERDE.md` dice que actualiza a
> `H1-PARQUES.md`; **`H1-PARQUES.md` no sabe que `H1-VERDE.md` existe.** ⇒ La cadena
> es navegable **solo en la dirección en la que nadie la lee.**

**El precedente que el encargo mandaba comprobar** — la republicación de las
puertas sin calle:

| | |
|---|---|
| ¿existe? | ✅ `H1-ROJOS-CERRADOS.md:359` — «Las puertas sin calle: 3.166 → **2.669**» |
| ¿dice lo que dice? | ✅ con su reparto y su *«se ha movido en −497 en cuatro tandas»* |
| ⛔ ¿se llega desde el documento viejo? | **NO.** `grep -c H1-ROJOS-CERRADOS docs/H1-NOMBRES-Y-PASOS.md` = **0** |

⇒ **El arreglo funcionó para el fichero y no para el lector**, exactamente como el
encargo temía.

## La tabla, por documento

| documento | línea(s) | dice | hoy | ¿marca? |
|---|---|---:|---:|---|
| `H1-VERDE.md` | 19 · 24 · 194 · 237 | reparto 51.556 / 32.258 / **3.792** | 51.493 / 32.310 / 3.803 | ⛔ ninguna |
| `H1-VERDE.md` | 57 · 120 · 137 | 145,34 km · 4.405 sin listón | 145,94 · 4.424 | ⛔ ninguna |
| `H1-PARQUES.md` | 20 | «51.556 azules · 36.050 rojas» | 51.493 · 36.113 | ⛔ ninguna |
| `H1-PARQUES.md` | 22 · 173 · 276 | «entre 4.055 y 4.405 rojas de parque» | 4.424 sin listón | ⛔ ninguna |
| `H1-CALLE-PEGADA.md` | 25 | «45.597 → **56.864** azules» | 56.801 | ⛔ ninguna |
| `H1-AUDITORIA-GUARDIANES.md` | 22 · 175 · 352 | reparto de la tanda 29 | republicado en la 31 | ⛔ ninguna |
| `H1-NOMBRES-Y-PASOS.md` | 25 | «de 11.742 a **3.166** puertas» | **2.669** | ⛔ ninguna |
| `H1-DONDE-FALTA-EL-NOMBRE.md` | 166 · 566 | 11.742 portales colgados | 2.669 | ⛔ ninguna |
| `H1-ACERA-EQUIVOCADA.md` | 140 · 155 | 150.947 · 66.973 | 51.065 · 16.981 | ⛔ ninguna |
| `H1-PARIDAD.md` | 278 | dial `100 m → 31.411` | 4.562 | ⛔ ninguna |
| `H1-PARIDAD.md` | 421 · 429 | «**56 scripts**» · «los **21** congelados» | 57 · 26 | ⛔ ninguna |
| `H1-LISTONES.md` | 67 · 68 · 106 · 108 | «el dial predijo 31.411 y salieron **31.411 clavadas**» | 6.421 | ⛔ ninguna |
| `H1-PORTALES.md` | 323 | «⇒ **16,9× el azar**» | **21,3×** (V3 del bloque A) | ⛔ ninguna |

⭐⭐ **La fila que más pesa es la de `H1-LISTONES.md`**: es el cuadre que la tanda 35
demostró que estaba **en verde sobre el artefacto del centinela**. El documento lo
sigue publicando como acierto del método, sin una palabra al lado.

⚠️ **Y una que NO es un hallazgo, dicha para que no se cuente dos veces:**
`H1-TOPE-ADELANTO.md:164` sigue imprimiendo 6.421 **y sí lleva marca** en su
cabecera. Es el único de la lista que hizo lo que había que hacer.

---

# ⚠️ DEUDA

| # | qué | dónde |
|---|---|---|
| **BD1** | **El puntero solo va hacia atrás** (40 contra 0 en los superados). No es un error de ningún documento: es la forma de la convención. | todo `docs/` |
| **BD2** | `DISEÑO-H1-GRAFO.md:740` cita **`data/excepciones-grafo.json`** como *«fichero versionado en el repositorio, leído por el proceso en cada regeneración»*. **No existe.** Es una propuesta de diseño no implementada y el documento la escribe en presente. | `DISEÑO-H1-GRAFO.md` §P6.2 |
| **BD3** | **16 rutas citadas entre acentos graves no existen.** ⭐ **14 son del proyecto heredado (001)** —`src/app/moverme/page.tsx`, `data/gtfs/…`— y en los `RECONOCIMIENTO-*` eso es legítimo: describen otro repositorio. ⚠️ Pero **nada en el texto lo distingue**, y un lector las lee como rutas de éste. | `RECONOCIMIENTO-*` |
| **BD4** | **Tres informes tienen commits posteriores a su publicación**: `H1-PARIDAD.md` (+28 líneas, §G), `H1-ACERA-EQUIVOCADA.md`, `H1-DONDE-FALTA-EL-NOMBRE.md`. ⭐ **Los tres son AÑADIDOS, no reescrituras** —la ley se respeta— pero el documento no dice que creció después, y su §G quedó fechado como si fuera de la tanda. | ver tabla |
| **BD5** | `H1-PARIDAD.md` §G y `H1-LISTONES.md` publican verificaciones (**«56 de 56 scripts»**, «21 congelados») que envejecen a cada tanda y **no están congeladas ni marcadas como fotografía**. | §G de varios informes |

---

# NOTAS

- **BN1 · ⭐⭐ Un documento volvió a ser verdad él solo.** `H1-PARIDAD.md:132` dice
  **`RAZONABLE_M = 50 m`**. Fue **cierto** (tanda 33), **falso** dos tandas (34-35,
  cuando el listón subió a 100) y **cierto otra vez** (tanda 36), **sin que nadie lo
  tocara**. ⇒ *«el documento dice la verdad» es una afirmación sobre CUÁNDO se
  mira*, y no hay nada en el repositorio que registre que estuvo mintiendo.
- **BN2 · Los comandos están todos.** 48 comandos `node …` distintos citados en la
  documentación; **los 48 existen**. Control: `src/no-existe-jamas.js` sale
  inexistente, como debe.
- **BN3 · Los 26 congelados, limpios — y con el método probado.** El motor
  reproduce **26 de 26**, y **26 de 26** aparecen en su documento vigente.
  ⚠️ Este verde solo vale porque la contraprueba pasó: **6 rojos de 6 cazados, 0
  contagios, 0 falsas alarmas sobre los documentos sin tocar.**
- **BN4 · La diferencia de UNO, cerrada.** `ls src/*.js` da **70** y `git ls-files
  src/` da **70**: idénticos, sin ningún fichero sin versionar. **El «69» es real y
  fechado**: sale del commit `75e965a` (6 ago, 12:46), cuyo mensaje dice *«El 56
  sale de `ls src/*.js` (69) menos los 13 módulos que P4 excluye»*. Era cierto
  entonces; hoy son 70 y 57. ⇒ no es un error de nadie: es **un número de
  verificación publicado dentro de un informe y sin congelar** (BD5).
- **BN5 · Licencias, continuando desde el bloque A.** Barrido de lo que el
  repositorio afirma sobre procedencia: el README declara *«Origen de los datos
  consultados: Ayuntamiento de Zaragoza»*, el aviso de no-oficialidad, y la ODbL
  **anticipada** (*«el grafo que salga de ahí nacerá bajo esa licencia»*).
  ⚠️ **No he encontrado ninguna afirmación de licencia que contradiga lo que hay
  dentro** — lo que hay es **una declaración vencida** (N5 del bloque A) y ningún
  documento de `docs/` que la retome. ⛔ No redacto ninguna: eso es un arreglo.

---

# B0 · INVENTARIO Y CLASE

**44 documentos en el alcance**: 40 en `docs/`, 1 en `docs/auditoriafinal/`, más
`README.md`, `CLAUDE.md` y `data/pruebas/RUTAS-CONOCIDAS.md`.
**25.716 líneas** solo en `docs/`.

⚠️ **Los recuentos de líneas del encargo (87 y 58) son los NO VACÍOS**, comprobado:
`README.md` tiene **119 líneas / 87 no vacías**; `CLAUDE.md`, **81 / 58**. No hay
discrepancia: son dos formas de contar y el encargo ya lo avisaba.

## El criterio de clase, escrito

- **VIVO** — pretende describir cómo son las cosas **hoy**. Si miente, es hallazgo.
- **REGISTRO** — describe **su momento**. No se reescribe; si está desmentido y no
  lo dice, es **SUPERADO**.

| clase | n | cuáles |
|---|---:|---|
| **VIVO** | 7 | `README.md` · `CLAUDE.md` · los **4 documentos de diseño** · `data/pruebas/RUTAS-CONOCIDAS.md` |
| **REGISTRO** | 37 | los 30 informes `H1-*`/`AUDITORIA-*`/`COBERTURA-*` · los 5 `RECONOCIMIENTO-*`/`INVENTARIO-*`/`PORTALES-COMO-TESTIGOS` · `BITACORA.md` · `auditoriafinal/A-CODIGO-*` |

## ⭐ La frontera que había que resolver: los cuatro documentos de diseño

**Son VIVOS.** El argumento, y no es de forma:

1. **Nadie los fecha como tanda.** `DISEÑO-H1-GRAFO.md` no dice *«tanda N ·
   fecha»* como los `H1-*`: describe el diseño, no una medición.
2. **El código los cita como su autoridad.** Los identificadores **D0–D5**, **P4.1**,
   **P4.3**, **G1/G2/G3** aparecen en los comentarios de `src/` como la regla que se
   está aplicando. Un informe de tanda nunca se cita así.
3. **Y la prueba definitiva es la propia ADENDA:** existe **porque el diseño se
   corrigió**, no porque se midiera algo nuevo. Un registro histórico no tiene
   adendas: tiene sucesores.

⇒ Si un documento de diseño está desactualizado **no es viejo: está mintiendo sobre
lo que el motor hace**. Por eso **BV1 es VIVO y no SUPERADO**.

⚠️ **Y el matiz que impide aplicar la regla a ciegas:** los cuatro contienen
secciones que son **propuesta, no descripción** (BD2 es una de ellas). Un diseño
mezcla *«esto es así»* con *«esto se hará así»*, y **el documento no distingue las
dos con ninguna marca**. Eso es lo que hace difícil auditarlos.

---

# B1 · EL CENSO — y por qué NO lo doy como cobertura

⛔ **Este apartado es el que peor sale, y va dicho antes que su número.**

```
   tokens numéricos en los 44 documentos                    19.906
   ⛔ clasificados «AFIRMACIÓN» por el censo v1              10.192   ← DESCARTADO
   ⭐ cifras que el documento MARCA como afirmación           2.062
        · en **negrita**                                     1.883
        · dentro de una cita `>`                               107
        · detrás de un `⇒` de conclusión                        72
```

**Por qué se descartó el v1:** una muestra sistemática de 32 filas mostró que casi
todas eran **celdas de tablas de resultado** —`| 4 | CAMINO PEÑAFLOR | 2,33 km |`—
y no afirmaciones. Un denominador así no se puede recorrer y publicarlo como
cobertura sería fingirla. **Es la ley 3 otra vez: enumerar no es verificar.**

**El censo v2 acota a lo que el propio documento marca.** ⚠️ Es una definición
**estrecha y declarada**: deja fuera cifras ciertas. Lo que compra es un
denominador que existe.

## ⚠️ Y aquí se cumple la costura del encargo

> **2.062 afirmaciones marcadas no caben en una tanda, y no las he contrastado
> todas.** Lo digo en vez de repartir el tiempo entre censo y contraste y quedarme
> con los dos a medias.

**Lo contrastado, y por qué esas:**

| prioridad del encargo | qué hice | n |
|---|---|---:|
| 1 · sostienen un titular | los **26 congelados**, contra el motor, con contraprueba | 26 |
| 2 · ya sabemos tocadas | **V1** y **V3** del bloque A, más el barrido de 16 pares viejo→nuevo | 16 pares · 97 apariciones |
| 3 · sin congelar | los **48 comandos**, las **130 rutas citadas**, los **punteros** entre 40 documentos | 218 |
| 3 · sin congelar | el README, afirmación por afirmación (§BV2, §BV3) | 9 |
| 4 · el resto | ⛔ **no** | — |

---

# B2 · EL CONTRASTE

**Los 26 congelados: 26 de 26 los reproduce el motor y 26 de 26 están en su
documento vigente.**

⚠️⚠️ **Un 26 de 26 es exactamente la señal de «redondo» que el encargo manda
sospechar, y por eso este resultado NO se publica solo.** Va con su contraprueba:

```
   VERDE  documentos sin tocar → 26 de 26 localizados · 0 marcados
   ROJO   se rompe cada afirmación en una copia en memoria:
          dato.sello · grafo.nodos · grafo.aristas · grafo.componentes
          grafo.aristasAPie · grafo.vertices        ⇒ 6 de 6 cazadas
   contagio a otras filas                            ⇒ 0
```

**Ley 35 · ¿puede esto salir bien sin que nada funcione?** Sí, de una manera: si
`buscar()` casara siempre. **Lo cierran las dos columnas a la vez** — el rojo exige
que **deje** de encontrar lo cambiado, el verde exige que **siga** encontrando lo
demás. Con una sola de las dos, no valdría.

**B2.1 · Con qué se midió cada cosa.** ⛔ `acera-equivocada.js` está tocado (V1) y
**no se ha usado para medir nada** en este bloque. Los 26 salen de
`numeros-congelados.medir()`, que llama al motor. Los 46.150 portales salen de
`P.cargarPortales()`. **BV1 se resolvió leyendo el código, no ejecutando el
instrumento sospechoso.**

**B2.3 · Los dos universos.** Ninguna cifra de este bloque depende de esa elección:
el único congelado afectado —`buscador.pedibles` = 51.065— sale del camino por
**núcleo de vía**, y el otro camino da **50.986**. ⛔ No lo resuelvo. Lo que este
bloque añade es **qué documentos están del lado equivocado del rótulo**:
`H1-ACERA-EQUIVOCADA.md` publica 150.947 —el mismo rótulo, el universo inflado, y
además por `codigoVia`—, así que **su número está mal por las dos razones a la vez**.

---

# ⚠️ Z · LO QUE NO SE HA PODIDO AUDITAR

| qué | por qué |
|---|---|
| **~1.850 de las 2.062 afirmaciones marcadas** | **no lo he mirado, y es el agujero grande del bloque.** El censo está hecho y volcado; el contraste no cabe. |
| **Las 17.844 cifras no marcadas** | **NO CONSTA, y es estructural**: son celdas de tablas de medición de 40 tandas. Contrastarlas es reejecutar 40 tandas con el dato de cada día, y el dato de cada día ya no existe. |
| **Si los `RECONOCIMIENTO-*` dicen la verdad sobre las fuentes** | ⛔ **exigiría RED** —volver a pedir el WFS y Overpass— y el método lo prohíbe. **PARADO ahí, como manda la costura.** Lo único contrastable en disco (178 capas, 3.644 / 3.453 / 3.359) sí se miró: de ahí sale BV2. |
| **Si `BITACORA.md` (7.252 líneas, 144 entradas) dice la verdad** | **no lo he mirado.** Es el 28 % de toda la documentación y es registro histórico por definición; auditarlo es auditar 144 casos. |
| **Cuándo empezó a mentir cada SUPERADO** | **CAUSA NO CONFIRMADA.** Sé qué dice hoy y qué mide hoy; la fecha exacta en que dejó de ser cierto exigiría reconstruir la medida en cada tanda intermedia. |
| **Si los cuatro documentos de diseño describen el motor en lo demás** | **parcial.** Comprobé §P4.1 (BV1) y §P6.2 (BD2) por ser los que el encargo señalaba. **Las otras ~1.700 líneas de diseño no las he contrastado contra el código.** |

---

# ⭐ PARA LA CONVERSACIÓN DE ESTRATEGIA — `DESPLAZAME-ESTADO.md`

⛔ No lo he auditado ni tocado. Dos cosas que salieron de lado y que decide Antonio:

| línea | dice | el dato |
|---|---|---|
| **866** | el centinela *«inflaba el universo de consultas de **51.028 a 151.026**»* | La tanda 35 declaró que **ninguno de los dos** es el bueno: 51.028 excluía la vía entera y el universo inflado era **150.947**. Hoy: **51.065**. |
| **1537-1538** | numera los hallazgos del bloque A como **V3** y **V4** | El registro `A-CODIGO-2026-08-06.md` los llama **V2** y **V3**. Las referencias cruzadas entre los dos documentos no casan. |

⭐ Y lo que sí está al día y conviene decir: el estado ya recoge los tres listones
correctos (50 · 150 · 20), los 26 congelados y los hallazgos del bloque A.

---

# ⚠️ MI CRITERIO SOBRE QUÉ ARREGLARÍA — y qué no

⛔ **Antonio decide con los tres bloques delante.** Esto es opinión, pedida.

**Arreglaría, y en este orden:**

1. **BV3 + V5 — el clon.** Es lo único de esta lista que **un extraño encuentra en
   diez minutos**, y el repositorio es un portafolio. Un motor que no arranca pesa
   más que cuarenta números caducados.
2. **BV1 — la nota en `DISEÑO-H1-GRAFO.md` §P4.1.** Cuesta tres líneas y cierra una
   contradicción que lleva **cuatro días** publicada en el documento que el propio
   código cita como su autoridad.
3. **BD1 — el puntero hacia delante.** ⭐ **Y arreglaría el mecanismo, no los
   casos:** que la republicación **obligue** a dejar la nota en el documento
   superado. Trece filas de la tabla de arriba son el mismo fallo trece veces, y
   arreglarlas a mano garantiza que la catorce vuelva a pasar. *Una ley escrita no
   protege: protege el mecanismo.*
4. **BV2 — la frase del README.** Barata y está en la portada.

**NO arreglaría:**

- **Los SUPERADOS uno a uno.** Son registro histórico y **eran verdad**. Tocarlos
  es corregir la historia — justo lo que el bloque prohíbe. Lo que falta no es el
  número: es **el puntero**, y ése es el punto 3.
- **BD3, las 14 rutas del proyecto heredado.** No están rotas: describen otro
  repositorio. Como mucho, una línea que lo diga.
- **BD4, los tres informes con commits posteriores.** Son añadidos legítimos.
- ⛔ **Y no tocaría `H1-PARIDAD.md:132`** —el que volvió a ser verdad solo—. Es la
  mejor prueba que tiene este proyecto de que **la verdad de un documento es una
  foto, no una propiedad**, y borrarla no dejaría nada en su sitio.

⚠️ **Lo que NO me atrevo a recomendar:** qué hacer con las ~1.850 afirmaciones sin
contrastar. **No sé si están bien.** Y después de lo que este bloque acaba de
enseñar —tres instrumentos míos mintiendo y trece documentos publicando números
desmentidos— **apostaría a que no todas lo están.**
