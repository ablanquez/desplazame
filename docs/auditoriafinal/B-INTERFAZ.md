# AUDITORÍA DE CIERRE · BLOQUE B — INTERFAZ Y TEXTOS

> **Qué es:** el mapa de hallazgos de lo que el usuario ve y lee, tercera de las seis piezas de
> la Fase 7. Gobernado por `00-MARCO-AUDITORIA-DE-CIERRE.md` §4·B.
>
> **Fecha:** 2026-09-24 · **Commit auditado:** `2c5735d`
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Vale para `2c5735d` y ese árbol. Si la
> interfaz cambia después, **se escribe otro informe**.
>
> **R1:** se ha servido y abierto cuanto hizo falta y se han provocado estados con el
> fingimiento de la casa —nada de eso escribe el repositorio—. **No se ha tocado fuente, estilo
> ni texto.** Árbol limpio verificado al cerrar; motor, serve y Chromes parados.

---

## 1 · COBERTURA DECLARADA (R2)

### Contra qué se validó, y por qué equivale a producción

| | |
|---|---|
| **Blanco principal** | el **`dist` construido**, servido por el motor en `:4300` — el mismo artefacto que Hostinger despliega |
| **Blanco de la intranet** | `ng serve --configuration local` en `:4200`, con motor en `:3000` para su proxy de `/api` |
| **Equivalencia con producción** | `git diff origin/main..HEAD -- app motor tipos` sale **vacío**: las 4 commits por delante son **solo documentación**. El código servido es byte a byte el de `origin/main`, que es lo que auto-despliega producción |
| **Marca del dist** | `main-5WNP7XDW.js`, la publicada por el guardián |
| **Procesos** | míos y verificados: motor `:4300` listener 6204 == `/api/salud` 6204 · motor `:3000` listener 9620 == 9620 |

⚠️ **`/visor` y `/panel` son superficie INTERNA**: desde el 19/09 no viajan al `dist`
(`fileReplacements`), así que se auditan **en local, como herramienta interna**, y así se dice
en cada hallazgo que les toca. En el `dist`, sus URLs caen en el comodín —comprobado: sirve la
portada— y eso es lo esperado.

### Páginas × anchos × estados

**6 páginas × 4 anchos = 24 combinaciones**, todas abiertas y capturadas; más 5 páginas sin
JavaScript y 3 estados provocados. **28 capturas.**

| Página | Dónde | 1920 | 1440 | 390 | 320 |
|---|---|---|---|---|---|
| portada / Buscador | dist | ✓ | ✓ | ✓ | ✓ |
| `/identidad` | dist | ✓ | ✓ | ✓ | ✓ |
| `/creditos` | dist | ✓ | ✓ | ✓ | ✓ |
| comodín (URL inexistente) | dist | ✓ | ✓ | ✓ | ✓ |
| `/panel` | local (interna) | ✓ | ✓ | ✓ | ✓ |
| `/visor` | local (interna) | ✓ | ✓ | ✓ | ✓ |

Los anchos son los que el proyecto declara —1920 «antonio», 1440 «pc», 390 «móvil»— más el
**suelo de reflow 320** que pide el marco.

**Estados provocados** (con el fingimiento de la casa: bloqueo de URL por CDP, que es lo que ya
hace la P28): **vacío** (portada en reposo) · **cargando** y **error** (la portada con
`/api/ruta` cortada, con el formulario ya relleno) · **error** del `/panel` con el manifiesto
cortado.

### Lo que NO se cubrió — **NO CONSTA**

1. **`/identidad` no pasó por el validador oficial:** su DOM renderizado son **142.940 bytes** y
   el servicio devolvió **HTTP 502 en dos intentos**. No se afirma nada sobre su validez.
2. **Las tres pestañas móviles de la portada** se capturaron en su estado inicial; **no** se
   recorrió cada pestaña con resultado pintado a 390. Lo que hay del resultado a 390 viene del
   estado provocado, no de un barrido pestaña a pestaña → `NO CONSTA`.
3. **Estados no provocados:** BiZi sin dato vivo, YeGo con destino fuera de área, y el
   **«rancio»** del panel (un conjunto realmente caducado). Los tres dependen de fuente viva o
   de fabricar dato; no se provocaron → `NO CONSTA`.
4. **La pantalla de error de último recurso** (la que se pinta si la aplicación misma revienta):
   **no se ha encontrado forma de dispararla** — no hay `ErrorHandler` con pantalla propia ni
   ruta de error. **Y ese hecho ES el hallazgo**: ver B-3.
5. **Lector de pantalla real y teléfono físico:** fuera del alcance de este ejecutor por doctrina
   del marco (§4·F) → `NO CONSTA`, sesión aparte.
6. **Contraste de color:** no se re-midió. Lo cubre la batería viva (P25/P26/P28/P31) y este
   bloque **no lo duplica**.

### Limpieza del instrumento

Tres barridos dieron ruido y se cruzaron a mano antes de escribir nada:

- **El validador:** 866 mensajes, de los cuales **857 son el atributo `_ngcontent-ng-c…`** de la
  encapsulación de Angular — artefacto de **mi método** (validar el DOM renderizado), no del
  producto. Reales: **9**.
- **Las zonas táctiles:** los seis `input.modo__radio` salían **1×1 px**. Son los radios
  *visualmente ocultos* cuyo objetivo real es la etiqueta; el propio censo de la casa dice que
  *«cuando quien se pincha es un envoltorio (el `label` de un radio invisible), se mide el
  envoltorio»*. **Ruido, 6 de 6.**
- **`aria-label` en elemento sin rol nombrable:** señaló `section[aria-label="Mapa"]`. Un
  `<section>` **sí** admite nombre accesible —y con él pasa a ser landmark `region`—, que es
  justo lo que se busca. **Ruido, 1 de 1.**

---

## 2 · HALLAZGOS

### 🟠 B-1 · Las seis páginas comparten `<title>`, y ninguna tiene `<meta description>`

| | |
|---|---|
| **Categoría** | Texto · metadatos por página |
| **Ubicación** | `app/src/index.html:13` (`<title>Desplázame</title>`, único) · no existe ningún `<meta name="description">` en el proyecto |
| **Gravedad** | 🟠 |
| **Coste** | Acotado |

**Medido, no leído:** las seis páginas abiertas devuelven `document.title === 'Desplázame'` y
`document.querySelector('meta[name=description]') === null`. Y **nadie usa `Title` ni `Meta` de
Angular**: `grep` sobre `app/src` no devuelve una sola llamada.

**Por qué importa.** El `<h1>` sí está bien y es propio de cada página («Desplázame»,
«Identidad visual», «Créditos y fuentes», «Frescura de los datos», «Visor de capas»): el
contenido distingue las páginas y **el título no**. Consecuencias concretas: con cinco pestañas
abiertas todas se llaman igual; un marcador no dice a qué se apunta; el historial no se puede
leer; y en un resultado de buscador, `/creditos` compite consigo misma con el mismo rótulo y
**sin descripción**, que es el texto que se enseña debajo. El marco lo pide explícito:
*«`<title>` Y `<meta description>` propios por página»*.

⚠️ **Marcado como decisión de producto** en su redacción: *qué* dice cada título y cada
descripción lo decide Antonio. Lo que el auditor afirma es que hoy **no hay ninguno**.

---

### 🟠 B-2 · Cuatro de las cinco páginas no tienen `<main>` ni `<footer>`

| | |
|---|---|
| **Categoría** | HTML · landmarks |
| **Ubicación** | `identidad.html`, `creditos.html`, `panel.html`, `visor.html` — `main=0`, `footer=0`, `header=1` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

La portada rinde `header` + **`main`** + `footer`. Las otras cuatro rinden **solo `header`**: el
contenido de la página vive fuera de cualquier landmark.

**Por qué importa.** Quien navega con lector de pantalla salta por landmarks y usa «ir al
contenido principal»: en cuatro de las cinco páginas **no hay adónde saltar**, y el contenido
queda en tierra de nadie. No lo caza ningún escáner de color ni la batería de pintura, que mide
píxeles y contraste. Es además lo que hace que el validador avise de `Section lacks heading` en
`/visor`.

---

### 🟠 B-3 · Sin JavaScript, las cinco páginas quedan **en blanco**, y no hay pantalla de último recurso

| | |
|---|---|
| **Categoría** | Contenido crítico sin JS · estado de último recurso |
| **Ubicación** | las cinco rutas; `app/src/index.html` no trae `<noscript>` con texto |
| **Gravedad** | 🟠 |
| **Coste** | **Tanda propia** (ver opciones) |

**Medido:** el cuerpo servido de `/`, `/identidad`, `/creditos`, `/panel` y `/visor` da **0
caracteres de texto** una vez quitados los `<script>`. El único `<noscript>` del `dist` **no es
un mensaje**: es el respaldo de la hoja de estilos que mete *beasties* (`<noscript><link
rel="stylesheet" …></noscript>`), con cero texto.

Y la otra mitad: **no se ha encontrado forma de disparar una pantalla de error de último
recurso** —no hay `ErrorHandler` propio ni ruta de error—, así que si la aplicación revienta al
arrancar, lo que queda es **la misma página en blanco**. El marco dice que ese hecho ES el
hallazgo, y aquí lo es.

**Opciones, con su coste y lo que rompe — el auditor no elige:**

| | Qué | Coste | Qué rompe / cuesta |
|---|---|---|---|
| 1 | Un `<noscript>` con texto en `index.html`: qué es esto y que hace falta JS | Trivial | Nada. No da contenido, pero **quita la página muda** |
| 2 | Lo anterior + un `ErrorHandler` que pinte una pantalla honesta si el arranque falla | Acotado | Nada visible en el camino bueno; hay que poder dispararla para probarla |
| 3 | Prerender de las rutas estáticas (`/creditos`, `/identidad`) con Angular | Tanda propia | Toca la tubería de construcción, el `dist` y el guardián; hay que revisar `no-viaja` y el presupuesto |
| 4 | Dejarlo y **declararlo** en el README como límite conocido | Trivial | No arregla; convierte un hueco en una decisión escrita |

---

### 🟠 B-4 · Los dos mensajes de error hablan en jerga de desarrollador

| | |
|---|---|
| **Categoría** | Texto de estados |
| **Ubicación** | portada, error de `/api/ruta` · `/panel`, error del manifiesto (`app/src/app/panel.ts:238`) |
| **Gravedad** | 🟠 |
| **Coste** | Trivial el segundo; el primero es redacción |

**Lo provocado y lo que salió, literal:**

```
portada, /api/ruta cortada → «No se pudo preguntar al motor. ¿Está arrancado?»
/panel, manifiesto cortado → «No se ha podido leer el manifiesto: TypeError: Failed to fetch»
```

**Por qué importa.** El marco pide *«mensajes sin jerga ni URLs internas»*. «El motor» es
vocabulario interno —el usuario no sabe que hay un motor— y *«¿Está arrancado?»* es una pregunta
dirigida a **quien lo desarrolla**, no a quien busca una ruta: quien está en la calle no puede
arrancar nada, y el mensaje **no ofrece salida** (ni reintento, ni «vuelve a probar en un
minuto»). El del panel es peor de forma y mejor de contexto: escupe **la excepción de
JavaScript en crudo** (`String(e)` llega a la pantalla), aunque `/panel` es **intranet** y su
lector es de casa — por eso no sube a 🔴.

⚠️ **Marcado como decisión de producto:** la redacción la firma Antonio. Lo que se reporta es
la **clase** de los dos textos, con su medición.

**A favor, y cuenta:** el aviso se pinta con icono de nube tachada, en ámbar y con foco de
lectura claro (`capturas/estado-error-motorcaido.png`) — **la forma está bien resuelta; lo que
falla son las palabras.**

---

### 🟠 B-5 · La tipografía del panel: la deuda declarada, **confirmada y ahora medida**

| | |
|---|---|
| **Categoría** | Contraste de deuda declarada |
| **Ubicación** | `app/src/app/panel.css`, `.frescura { font-family: system-ui, sans-serif }` |
| **Gravedad** | 🟠 (intranet) |
| **Coste** | Trivial |

La mesa del ESTADO la declara: *«la tipografía de panel.css [system-ui mientras la app va en
Inter — cabo del puente-bis; mueve métricas de la tabla]»*. **Se contrasta y sigue viva**, con la
cifra que le faltaba — el bloque de contenido de cada página, computado en Chrome:

```
portada    → Inter, "Inter Fallback", system-ui, sans-serif
creditos   → Inter, "Inter Fallback", system-ui, sans-serif
visor      → Inter, "Inter Fallback", system-ui, sans-serif
identidad  → Inter, "Inter Fallback", system-ui, sans-serif
panel      → system-ui, sans-serif          ← la única
```

El `body` de `/panel` **sí** es Inter; quien se sale es `.frescura`, que es todo lo que se lee
de esa página. Es la única superficie de la casa que no va en la letra de la casa.

---

### 🔵 B-6 · Zonas táctiles fuera del censo cerrado

| | |
|---|---|
| **Categoría** | Accesibilidad · vara de la casa |
| **Ubicación** | `/creditos`: 8 × `a.creditos-pagina__enlace` a **26 px** de alto · `/identidad`: `button.identidad__conmutador` a **167×42** |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

**Lo que está censado y firmado se cita y no se re-abre**, como manda el encargo: el censo
`EXCEPCIONES_DE_TARGET` de `pintura.mjs` acoge `a.creditos__enlace` y
`.leaflet-control-attribution a` a la excepción **En-línea** de [WCAG 2.5.5], y su
`DEUDA_DE_TARGET` está **vacía con acta del 20/09** (`DEUDA_MAXIMA = 0`). Mis medidas coinciden
con lo censado y **no lo discuten**.

Lo que aparece es lo que **queda fuera del alcance de ese censo**, porque la P30 dice de sí
misma *«lo que entra aquí es EL FORMULARIO»*: los ocho enlaces en prosa de `/creditos` (que
encajarían en la misma excepción En-línea, pero **nadie la ha firmado para ellos**) y el
conmutador de `/identidad`, que **no es un enlace en línea** y se queda en **42 de 44** — a dos
píxeles, sin excepción que lo ampare.

---

### 🔵 B-7 · `prefers-reduced-motion` solo en dos de las once hojas

| | |
|---|---|
| **Categoría** | Accesibilidad |
| **Ubicación** | está en `styles.css` y `buscador.css` (7 apariciones); no en `mapa.css`, `resultado.css`, `autocompletar-via.css`, `identidad.css`, `panel.css`, `visor.css`, … |
| **Gravedad** | 🔵 |
| **Coste** | Acotado |

Existe y está bien puesto donde está. Se reporta porque **no es global**: quien pida movimiento
reducido lo obtiene en el buscador y en lo común, y `NO CONSTA` si alguna transición de las otras
hojas se le escapa — no se recorrieron una a una.

---

## 3 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Por qué no es defecto |
|---|---|
| **857 errores del validador** por `_ngcontent-ng-c…` | Encapsulación de Angular, y artefacto de validar el **DOM renderizado**. Ni el producto ni la plantilla los escriben |
| `CSS: “appearance”: “base-select” …` y `::checkmark` (4 mensajes) | **Verificado contra su fuente, como pide el marco:** son nuestros, viven **dentro de `@supports (appearance: base-select)`** (`buscador.css:104`) con su respaldo documentado para el navegador que no lo conozca. **El validador va por detrás de la especificación**, no el producto |
| `The “base” element must come before any “link” or “script”` en `/panel` y `/visor` | **Solo en `:4200`**: es el `<script type="module" src="/@vite/client">` que inyecta el servidor de desarrollo. **El `dist` lo tiene bien** — comprobado: `<base href="/">` es lo primero. Artefacto del blanco, no del producto |
| `Section lacks heading` en la portada | Es `section[aria-label="Mapa"]`: tiene **nombre accesible**, que es la alternativa que el propio mensaje ofrece, y con él es un landmark `region` deliberado |
| Los tres `outline: none` | **Los tres documentados y con sustituto**: dos son destinos de foco programático (`tabindex="-1"`, donde el anillo sería ruido y el comentario lo explica) y el tercero mueve el anillo al `::before` del asa, que sí lo pinta |
| Los seis `input.modo__radio` a 1×1 | Radios ocultos; el objetivo es su etiqueta. Lo dice el propio censo de la casa |
| `/panel` y `/visor` en el `dist` devuelven 200 | Es el comodín sirviendo la portada, que es lo diseñado desde el 19/09 y lo que la P31 ya documenta |
| Glosario | **Un concepto, un nombre**: «Generar ruta», «Buscador», «Indicaciones», «Créditos» aparecen con una sola forma cada uno |
| Los enlaces del pie «de 17-114 px NO medidos» (deuda del ESTADO) | **Contrastado: medidos ya.** `Leaflet` 53×14, `colaboradores de OpenStreetMap` 188×14, `Créditos` 48×15 — y **los tres están en el censo firmado** con la excepción En-línea. La deuda, tal como está escrita, **ya no tiene objeto**; lo que queda vivo es B-6, que es otra cosa |

---

## 4 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **Cero desbordes horizontales en las 24 combinaciones**, incluido el suelo de 320: documento
   y vista miden lo mismo en todas. Un reflow que aguanta seis páginas a cuatro anchos sin una
   sola barra lateral no es casualidad.
2. **El vacío dice qué falta Y qué hacer:** *«Todavía no hay pasos. Rellena origen y destino,
   elige cómo te mueves y pulsa "Generar ruta"»*. Distingue **«no hay nada»** de **«no lo sé»**,
   que es justo lo que el marco pregunta, y además instruye.
3. **Un `h1` visible por página y propio de ella**, y **cero saltos de jerarquía** en las seis
   —incluida `/identidad`, que tiene 18 encabezados—.
4. **El censo cerrado de zonas táctiles** con las cuatro excepciones tasadas *nombradas una a
   una*, una lista de deuda separada y un tope (`DEUDA_MAXIMA = 0`). Que la deuda esté **vacía
   con acta** es el final correcto de esa historia: la deuda se salda, no se amplía.
5. **`@supports` antes de estrenar CSS moderno.** El `appearance: base-select` llega por
   mejora progresiva y con el camino viejo escrito. Que el validador oficial lo marque y el
   producto tenga razón es la prueba de que se comprobó contra la fuente y no contra la
   herramienta.
6. **Los `outline: none` con su porqué y su sustituto**, incluido el anillo movido a un
   pseudo-elemento para no rodear 20 px transparentes. Es el nivel de detalle que separa
   «quitar el anillo» de «ponerlo donde se ve».
7. **La forma del error está resuelta aunque las palabras no**: icono, color de aviso y
   jerarquía. Arreglar B-4 es cambiar texto, no rediseñar.
8. **La intranet no viaja, y se comprueba de tres maneras** (el `fileReplacements`, la jueza
   `no-viaja` y el comodín sirviendo la portada). Auditarla «en local y declarado» fue posible
   **porque el proyecto ya tenía dicho dónde vive cada cosa**.

---

## 5 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

1. **B-1** (títulos y descripciones): el más barato con más alcance — toca SEO, pestañas,
   marcadores e historial de golpe. **Necesita la redacción de Antonio.**
2. **B-2** (`<main>` en las cuatro páginas): trivial, y es accesibilidad real que hoy no
   vigila nadie.
3. **B-4** (los dos mensajes): trivial el del panel —dejar de imprimir la excepción—; el de la
   portada es decisión de redacción.
4. **B-5** (la letra del panel): trivial, y salda un cabo declarado.
5. **B-6** y **B-7**: cosméticos; B-6 conviene **después** de decidir si el censo de la P30 se
   extiende más allá del formulario, que es otra conversación.
6. **B-3**: **parlamento primero.** Las opciones van de trivial a tanda propia y la decisión
   cambia la tubería de construcción.

### ⛔ Qué NO tocar

- **El censo de zonas táctiles y sus excepciones firmadas.** Están razonadas, fechadas y con la
  figura de [WCAG 2.5.5] nombrada. B-6 habla de lo que quedó **fuera**, no de reabrir lo de
  dentro.
- **El `appearance: base-select`**: el validador está desactualizado, el código no. Tocarlo para
  «arreglar» un mensaje del validador sería empeorar el producto por complacer a la herramienta.
- **La página en blanco del `dist` no se «arregla» poniendo SSR por iniciativa propia** (B-3):
  toca construcción, presupuesto y `no-viaja`.
- **No se re-mide el contraste** aquí: lo hace la batería viva, y duplicar la vara es el camino
  para que dos varas se separen.
- **El `<base href="/">` está bien**: lo que lo desordena es el servidor de desarrollo.

---

## 6 · PARA EL CHECKLIST MAESTRO (en genérico)

1. **Validar el DOM RENDERIZADO, no la URL**, en cualquier aplicación de cliente — y después
   **descontar los atributos del framework**, que serán la inmensa mayoría de los mensajes. Sin
   ese descuento, 857 de 866 errores son del método.
2. **Antes de cantar un error del validador, comprobar la regla contra su especificación.** Una
   herramienta puede ir por detrás del navegador; lo que parece errata puede ser mejora
   progresiva bien escrita.
3. **Declarar en qué blanco se validó** y, si son dos, cuál es equivalente a producción y por
   qué — con el `diff` contra la rama desplegada, no de palabra.
4. **`document.title` y `meta[name=description]` se leen del DOM de cada ruta**, no de la
   plantilla: en una SPA los pone (o no) el código de la ruta.
5. **Contar landmarks por página, no por plantilla.** El `<main>` que está en la portada no
   cubre a las demás.
6. **Apagar el JavaScript y mirar** cada página: si queda en blanco, decirlo, y decir si hay
   algún mensaje. Un `<noscript>` puede existir y no contener ni una palabra.
7. **Provocar los errores y LEER lo que dicen.** El icono y el color suelen estar bien; la
   jerga se cuela en las palabras: nombres de componentes internos («el motor») y excepciones en
   crudo (`String(e)`) llegando a la pantalla.
8. **Al medir zonas táctiles, medir el elemento que recibe el puntero**, no el control oculto:
   un radio invisible mide 1×1 y su etiqueta 48.
9. **Contrastar las deudas declaradas con una medición**, no con una lectura: una puede estar
   saldada sin que nadie lo apuntara y otra seguir viva con la cifra que le faltaba.

---

## 7 · LAS HORAS DE ESTE BLOQUE

| Tramo | Reloj |
|---|---|
| Lectura del §4·B, montaje de los tres procesos y verificación de blancos | 10:12 → 10:20 |
| Barrido de 6 páginas × 4 anchos con medición y captura | 10:20 → 10:26 |
| Sin JS, validador oficial, estados provocados, tipografía y zonas táctiles | 10:26 → 10:42 |
| Redacción del informe | 10:42 → cierre |
| **Total del bloque B** | **≈ 1 h** de reloj de pared |

**Cualitativo:** el gasto se fue en **montar los blancos** (tres procesos, dos de ellos motores,
y la comprobación de equivalencia con producción) y en **limpiar tres instrumentos** que
mentían a la vez. Abrir y capturar es barato; decidir qué de lo que sale es del producto y qué
del método, no. Un intento de sondeo con JavaScript apagado **se colgó** y hubo que cortarlo:
`m.ir` espera a que la aplicación monte, y sin JS no monta nunca — se resolvió por el camino
corto, mirando lo que el servidor entrega antes de ejecutar nada.
