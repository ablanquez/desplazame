# AUDITORÍA DE CIERRE · BLOQUE F — LA EXPERIENCIA COMPLETA

> **Qué es:** el único bloque que no se hace leyendo código, sino **usando el producto**.
> Quinta de las seis piezas de la Fase 7, gobernada por `00-MARCO-AUDITORIA-DE-CIERRE.md` §4·F.
>
> **Fecha:** 2026-09-24 · **Commit auditado:** `037e546`
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Vale para `037e546` y para lo que
> producción servía ese día.
>
> **R1:** no se ha arreglado nada ni se ha anotado nada para arreglar por cuenta propia. Todo
> va al mapa. Lo commiteado: este informe y la fila del tablero.

---

## 1 · COBERTURA DECLARADA (R2)

### La equivalencia, demostrada antes de abrir nada

El encargo pone una puerta y se ha pasado **antes** de mirar producción:

```
$ git diff origin/main..HEAD -- app motor tipos
(sin salida)
```

**Vacío.** Las 8 commits por delante de `origin/main` tocan **solo `docs/auditoriafinal/`**
(comprobado con `git log --name-only`). Por tanto **producción sirve el producto del commit
auditado**, y esta cabecera no miente.

**Contra qué se usó:** **<https://desplazame.antonioblanquez.es>** — producción real, datos
reales, red real. Los estados que producción no deja provocar van declarados como tales.

### Contexto limpio, de verdad

Cada recorrido abrió un **proceso de navegador nuevo con un perfil recién creado y borrado
antes de empezar** (`rm -rf` del directorio de perfil + `mkdir`): sin historial, sin caché, sin
sesión previa. La entrada directa **no pasó por la home**: se navegó a la URL interior.

### Recorridos × anchos × estados

| Recorrido | Ancho | Estado | Hecho |
|---|---|---|---|
| (a) Primer contacto | 390 y 1440 | normal | ✅ |
| (b) El caso del 90 % (portal → portal, bus) | 390 | datos reales | ✅ |
| (c) Entrada directa a `/creditos` | 390 | normal | ✅ |
| (c) Entrada directa a `/identidad` | 390 | normal | ✅ |
| (d) YeGo con destino fuera del área | 390 | **real, en producción** | ✅ |
| (f) Puentes al código y al autor | 1440 | inventario de enlaces | ✅ |
| (g) Escala de la lista de calles | 390 | «a», «ca», «cal» | ✅ |
| (h) Ancho por contenido | 390 y 1440 | normal | ✅ |

### Lo que NO se cubrió — **NO CONSTA**

1. **El motor caído y el dato rancio, en producción**: no se pueden provocar sin escribir. Se
   miraron **en local con el fingimiento de la casa** durante el bloque B y **se citan desde
   allí, declarados como locales** — no se repiten aquí como si fueran de producción.
2. **El viaje BiZi sin hitos**: depende de que la disponibilidad viva falle en ese instante. **No
   se dio** durante esta sesión → `NO CONSTA`. (Es el caso que la suite `bizi-y-resumen` ya
   declara y censa.)
3. **El caso del 90 % a 1440**: se hizo a **390**, que es el caso que el marco prioriza —*«el
   móvil de pie en la calle»*—. El escritorio se cubrió en primer contacto y anchos, no en el
   recorrido completo → `NO CONSTA`.
4. **La lista de pasos más larga posible**: se midió la lista de **calles** (g) y el resultado de
   un viaje real de 9 pasos. No se buscó el viaje más largo de la ciudad → `NO CONSTA`.
5. **Lo que exige la mano de Antonio** → ver §7.

---

## 2 · LOS RECORRIDOS, CON SUS CIFRAS

### (a) PRIMER CONTACTO — **sí, en menos de un segundo y sin scroll**

| | móvil 390 | escritorio 1440 |
|---|---|---|
| Legible desde la petición | **750 ms** | **871 ms** |
| ¿Pide scroll para entender qué es? | **no** (documento 844 = ventana 844) | **no** (900 = 900) |

Lo primero que se lee, en las dos: **«Desplázame»** y **«Cómo ir de un portal a otro en
Zaragoza.»** — el **qué** y el **ámbito** en dos líneas, antes de cualquier control. Debajo,
sin scroll, el formulario entero: Origen (Tipo · Calle · Nº), el botón de intercambio, Destino,
y en escritorio también los seis modos, los dos botones y el mapa ya encuadrado en Zaragoza.

**Juzgado por la imagen**, no por el árbol: `a-primer-contacto-movil.png`,
`a-primer-contacto-escritorio.png`.

### (b) EL CASO DEL 90 % — **10 toques, ruta en pantalla a los 4,1 s**

Ruta real de portal a portal en bus, en producción, con el navegador recién nacido:

```
        app usable .................................  744 ms
 toque  1  escribo «COLOSO» en la calle de origen ...  744 ms
 toque  2  elijo la sugerencia (había 1) ........... 1.068 ms
 toque  3  escribo el portal «2» ................... 1.071 ms
 toque  4  elijo el portal «2» ..................... 1.175 ms
 toque  5  escribo «CALLE OVIEDO» .................. 1.175 ms
 toque  6  elijo la sugerencia (había 2) ........... 1.502 ms
 toque  7  escribo el portal «5» ................... 1.504 ms
 toque  8  elijo el portal «5» ..................... 1.609 ms
 toque  9  elijo el modo «Bus / Tranvía» ........... 1.610 ms
 toque 10  pulso «Generar ruta» .................... 2.018 ms
        ▸ RUTA EN PANTALLA .......................... 4.087 ms
```

**Dónde se duda:** en ningún sitio del camino feliz. El «Nº» nace deshabilitado con el texto
**«Elige antes la calle»**, que resuelve por adelantado la única duda de orden posible; y tras
pulsar, la aplicación **cambia sola a la pestaña «Ruta»**, así que no hay que buscar el
resultado.

El resultado (`b-ruta-movil.png`): «8,2 km · ~53 min», origen y destino con sus pines, **«Se
viaja en 35 31»** con las insignias de línea en su color real, los pasos con icono y metros, la
parada nombrada, «17 paradas · cada 8 min» y un botón **«Próximo bus»**.

### (c) LA ENTRADA DIRECTA — una bien, otra es una isla

| Página | ¿Se sabe dónde se está? | ¿Hay salida? |
|---|---|---|
| `/creditos` | **sí** — `h1` «Créditos y fuentes» | **sí** — «Volver al buscador → /», lo primero de la página |
| `/identidad` | **sí** — `h1` «Identidad visual» | **NO — 0 enlaces en toda la página** |

### (d) LOS ESTADOS RAROS

**YeGo con destino fuera del área, provocado en producción** (`d-yego-fuera-de-area.png`):

> **Avisos de este viaje:**
> · Motos de YeGo: **148 libres, datos de hace 1 min.**
> · **El área de servicio de YeGo no llega a tu destino: su contrato solo permite terminar el
> viaje dentro de su zona.**

En palabras, sin jerga, **con el porqué** y con el dato vivo fechado. Es el mejor mensaje del
producto. Lo que le falta va en F-4.

**El motor caído y el dato rancio**: medidos en **local** (bloque B) y **citados desde allí**;
no se repiten aquí como producción.

### (g) LA ESCALA — la lista **tiene techo**, y se nota

| Escrito | Sugerencias | Alto de la lista | ¿Se sale de la ventana? | ¿Scroll propio? |
|---|---|---|---|---|
| `a` | **0** | — | — | — |
| `ca` | **10** | 242 px | **no** | **sí** |
| `cal` | **10** | 242 px | **no** | **sí** |

Con una letra no pregunta (es deliberado y está probado en la unidad). Con dos o más, **la lista
se corta en 10 y lleva su propio desplazamiento**: no empuja la página ni se sale de la pantalla,
que es justo lo que el marco teme de *«las listas sin techo»*.

### (h) «NO SE ROMPE» ≠ «APROVECHADO»

| Página | 1440 | Juicio |
|---|---|---|
| Portada | columna de 560 px + mapa a todo lo ancho | **aprovechado**: el mapa es el contenido y se lleva el espacio |
| `/creditos` | prosa en columna con medida | **aprovechado**: es texto para leer |
| `/identidad` | 18 encabezados de muestrario | **aprovechado** |
| Resultado YeGo rechazado | el aviso arriba y **~70 % de blanco** | **desaprovechado** → F-4 |

---

## 3 · HALLAZGOS

### 🟠 F-1 · `/identidad` es una isla: no se llega sin saber la URL, y no se sale

| | |
|---|---|
| **Página y momento** | `/identidad`, al entrar por enlace compartido |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

Inventario de enlaces hecho sobre producción, página a página:

```
/           9 enlaces → ninguno a /identidad
/creditos   8 enlaces → ninguno a /identidad
/identidad  0 enlaces
```

**Por qué importa, y aquí el marco es explícito:** esto **es portfolio**, y `/identidad` —el
muestrario de tokens, con sus 18 secciones y su juez de contraste— es **la página que más
impresionaría a quien evalúa**. Hoy **no existe para nadie que no conozca su URL**. Y quien
llega por un enlace compartido queda **atrapado**: sin un solo `<a>`, la única salida es el
botón «atrás» del navegador, que en una pestaña recién abierta **no lleva a ninguna parte**.

⚠️ **Marcado como decisión de producto**: puede que `/identidad` se quiera interna-pero-pública
y sin promoción. Lo que el auditor afirma es que **hoy es inalcanzable y sin salida**, y que esas
son dos cosas distintas: la segunda no tiene lectura buena.

---

### 🟠 F-2 · No hay puente del sitio al código ni al autor

| | |
|---|---|
| **Página y momento** | las tres páginas públicas |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

De los **17 enlaces** que suman la portada y `/creditos`, ninguno lleva al repositorio
(`github.com/ablanquez/desplazame`, que el README sí nombra) ni a una página del autor. Los
externos van a OpenStreetMap, Leaflet, Avanza, MITRAMS y el BOE — **todos a terceros, ninguno a
quien lo hizo**.

**Por qué importa.** El marco pregunta *«¿hay puente del sitio al código y al autor?»* porque
para un evaluador el sitio es la puerta: si desde él no se llega al código, **el trabajo que hay
detrás —las bitácoras, las murallas, los 1.437 tests— no existe**. Es el hallazgo con mejor
relación coste/beneficio de este bloque.

⚠️ **Marcado como decisión de producto**: qué se enlaza, con qué rótulo y dónde, lo decide
Antonio. (Y hay un sitio natural: `/creditos` ya es la página de procedencias.)

---

### 🟠 F-3 · `/creditos` ofrece un enlace que en producción no lleva a ninguna parte

| | |
|---|---|
| **Página y momento** | `/creditos` → «el panel de frescura» |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

`/creditos` dice, en su párrafo sobre la fecha de los datos: *«La fecha de actualización de cada
dato, medida una a una, está en **el panel de frescura**»*, y enlaza a `/panel`. Pero `/panel`
**es intranet y no viaja al dist**. Comprobado en producción:

```
GET https://desplazame.antonioblanquez.es/panel  → HTTP 200
cmp con la portada → sirve EXACTAMENTE el mismo HTML
```

El usuario pulsa una promesa concreta («aquí está la fecha de cada dato») y **aparece en la
página de inicio, sin explicación**. No es un 404 —que al menos se entiende—: es un silencio.

Y el daño es doble, porque esa frase es **cómo `/creditos` cumple la obligación legal** de la
Ley 37/2007 de citar la fecha de actualización: el puntero está, pero en producción no lleva al
dato.

**Opciones, con su coste y lo que rompe — sin elegir:**

| | Qué | Coste | Qué rompe |
|---|---|---|---|
| 1 | Que el enlace no se pinte cuando el panel no viaja | Trivial | Nada; la frase se queda sin puntero y habrá que reescribirla |
| 2 | Enlazar al `datapackage.json`, que **sí** viaja | Trivial | El usuario ve JSON crudo |
| 3 | Publicar el panel (que deje de ser intranet) | Tanda propia | Contradice la firma del 19/09 y tumba la jueza `no-viaja` |
| 4 | Que el comodín diga «esa página no existe aquí» en vez de servir la portada callando | Acotado | Toca el comportamiento del comodín, que hoy es deliberado |

---

### 🔵 F-4 · El rechazo de YeGo tranquiliza y explica, pero no ofrece salida

| | |
|---|---|
| **Página y momento** | resultado con destino fuera del área |
| **Gravedad** | 🔵 |
| **Coste** | Acotado |

El mensaje es excelente (ver §2). Lo que la pantalla **no** hace es decir qué se puede hacer
ahora: no hay «prueba otro modo», ni un botón que devuelva al formulario con lo escrito. La
salida existe —la barra inferior con «Buscador»— pero es el usuario quien tiene que deducirla, y
el **70 % de la pantalla queda en blanco** justo donde cabría la sugerencia.

⚠️ **Marcado como decisión de producto**: proponer un modo alternativo es una decisión de
producto, no una corrección.

---

### 🔵 F-5 · Con una sola letra no pasa nada, y nada lo dice

| | |
|---|---|
| **Página y momento** | campo «Calle», al escribir la primera letra |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

Escribir `a` da **0 sugerencias** y ningún mensaje: la app no pregunta al motor con menos de dos
letras —deliberado, y con su prueba de unidad—. Desde fuera, un segundo de silencio es
indistinguible de «esto no funciona». Un «escribe al menos dos letras» lo cerraría.

---

## 4 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Por qué no es defecto |
|---|---|
| El `<title>` compartido en las tres páginas | **Ya es el hallazgo B-1**; no se duplica aquí |
| El resultado móvil tiene desplazamiento interno | Es una lista de 9 pasos: se lee desplazándose, como cualquier lista |
| La lista de calles corta en 10 | **Es lo correcto**: con techo y con scroll propio, sin empujar la página |
| Con una letra no se consulta al motor | Deliberado y probado; lo que se reporta (F-5) es el **silencio**, no la decisión |
| `/panel` responde 200 en producción | Es el comodín, diseñado así el 19/09. Lo que se reporta (F-3) es **enlazarlo desde una página pública** |

---

## 5 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **El qué y el ámbito, en las dos primeras líneas.** «Desplázame» / «Cómo ir de un portal a
   otro en Zaragoza.» responde en cinco palabras a *qué es* y *dónde aplica*, **sin scroll** en
   los dos anchos. La mayoría de los productos tardan una pantalla entera en decir la ciudad.
2. **Diez toques y 4,1 segundos, sin una duda en el camino.** Y el detalle que lo consigue: el
   campo «Nº» **nace deshabilitado diciendo «Elige antes la calle»** — no deja que el usuario se
   equivoque de orden en vez de regañarle después.
3. **La aplicación cambia sola a la pestaña del resultado.** No hay que buscar lo que acabas de
   pedir.
4. **La honestidad se PERCIBE, y en el flujo**: el «~» de «~53 min», el «cada 8 min» dicho como
   frecuencia, el «⚠ desviada» **pegado al paso concreto** que afecta, y el dato vivo con su
   edad («148 libres, **datos de hace 1 min**»). No es una nota al pie: está donde se decide.
5. **El rechazo de YeGo explica el porqué y cita el contrato** en lugar de decir «no hay ruta».
   Distingue *«no puedo»* de *«no sé»*, que es la pregunta del marco.
6. **La lista de sugerencias tiene techo y scroll propio.** Dos o tres decisiones pequeñas que
   evitan el fallo clásico de la lista que crece hasta empujar el botón fuera de la pantalla.
7. **`/creditos` abre con «Volver al buscador»**: una página interior que sabe que alguien puede
   llegar de fuera. Es justo lo que `/identidad` no hace (F-1), y por eso se sabe que **el
   patrón existe en la casa**: falta aplicarlo.

---

## 6 · ⭐ LA LISTA DE SESGOS (salida obligatoria)

Cada momento en que usé conocimiento previo, y qué habría visto sin él.

| # | Dónde | El sesgo | Qué hice |
|---|---|---|---|
| 1 | **El recorrido del 90 %** | Escribí «COLOSO» y «CALLE OVIEDO» **porque me las sé de las suites**. Un usuario no llega sabiendo qué calles resuelven bien | Lo declaro: **los 10 toques son el mejor caso**. No probé una calle ambigua, ni una con tilde, ni un portal que no existe. El número real de toques de alguien que duda **NO CONSTA** |
| 2 | **«Elige antes la calle»** | Me pareció «obvio» el orden calle→número… **porque lo había leído en el código** semanas atrás | Al mirar la imagen sin el código delante, el texto **sí** lo explica solo. Buen diseño, no conocimiento previo — pero la duda era legítima |
| 3 | **La pestaña que cambia sola** | No me sorprendió; sabía que existía la coreografía de pestañas | Un usuario nuevo podría tardar un segundo en entender que la pantalla cambió. **NO CONSTA** si desorienta |
| 4 | **`/panel` y `/identidad`** | Supe **desde el bloque B** que el panel es intranet y que identidad existe. Sin eso, `/identidad` **no la habría encontrado nunca** — que es exactamente el hallazgo F-1 | El sesgo **produjo** el hallazgo en vez de taparlo. Pero conviene decir que llegué por la puerta de atrás |
| 5 | **El «desviada» del paso** | Lo leí como un acierto de diseño al instante **porque conozco el trabajo de los desvíos** | Sin ese contexto, ¿se entiende «⚠ desviada» junto a la insignia 35? Probablemente sí, pero **no lo puedo juzgar limpio** |
| 6 | **YeGo fuera de área** | Usé **el par exacto que la suite `yego.mjs` emplea** (`PASEO INDEPENDENCIA 3`), porque mi primer intento a ciegas falló | El estado es real y de producción, pero **lo encontré con el mapa puesto**. Un usuario daría con él por casualidad |
| 7 | **La escala** | Sabía por el bloque C que hay una prueba de «menos de dos letras» | Por eso interpreté el silencio como diseño y no como avería — **y por eso F-5 es 🔵 y no 🟠**. Un usuario no tiene esa información |

**Los huecos que el dato vivo no dejó ver:** no hubo ningún fallo de BiZi durante la sesión, así
que el viaje sin hitos no se vio; y a esta hora ningún dato estaba rancio, así que el aviso de
vejez del feed tampoco.

---

## 7 · LO QUE EXIGE LA MANO DE ANTONIO — **NO CONSTA**, con su instrucción

El marco lo saca del alcance del ejecutor. Va con la instrucción exacta para su sesión.

### 7.1 · El lector de pantalla real (NVDA)

> Con **NVDA** abierto y el navegador en **<https://desplazame.antonioblanquez.es>**:
> 1. **`Insertar+F7`** → lista de **encabezados**: ¿se entiende la página solo con esa lista?
> 2. **`D`** repetido → salta por **landmarks**: en la portada deberían salir *banner*, *main*,
>    *contentinfo* y la región «Mapa». **En `/creditos` y `/identidad` no hay `main`** (hallazgo
>    B-2): comprobar qué se oye al intentarlo.
> 3. Rellenar el formulario **solo con el teclado** y escuchar: ¿se anuncia que aparecieron
>    sugerencias? ¿se anuncia el resultado al pulsar «Generar ruta» (debería, hay un
>    `role=status`)?
> 4. En el resultado, **`Insertar+Flecha abajo`** (leer todo): ¿el aviso «desviada» se oye
>    **junto a su paso** o suelto?

### 7.2 · El teléfono físico

> Con el móvil de verdad, en datos móviles (no wifi):
> 1. **Primer contacto**: ¿se lee «Desplázame / Cómo ir de un portal a otro en Zaragoza» **sin
>    tocar nada** y sin que el teclado tape el formulario?
> 2. **El teclado**: al tocar «Calle», ¿el desplegable de sugerencias queda **encima** del
>    teclado o debajo?
> 3. **La safe-area**: con un móvil con muesca o barra inferior, ¿la barra de pestañas
>    (Buscador · Ruta · Mapa · Tema) queda **por encima** del indicador del sistema?
> 4. **El pin de «usar mi ubicación»**: ¿aparece el *prompt* real de permiso? ¿qué pasa si se
>    deniega — lo dice en palabras?

---

## 8 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

1. **F-2** (el puente al código y al autor): trivial, y es lo que convierte el sitio en
   portfolio. **Necesita decisión de Antonio** sobre rótulo y sitio.
2. **F-1** (la salida de `/identidad`): trivial la salida; **el enlace de entrada es decisión**.
   Las dos mitades se pueden separar: poner la salida **no compromete nada**.
3. **F-3** (el enlace muerto de `/creditos`): trivial en tres de sus cuatro opciones, y limpia
   una promesa incumplida en una página con obligación legal detrás.
4. **F-5**: trivial.
5. **F-4**: **parlamento** — proponer modo alternativo es producto.

### ⛔ Qué NO tocar

- **El primer contacto no se toca.** Dos líneas dicen qué es y dónde: cualquier añadido las
  empuja fuera de la primera pantalla.
- **El orden calle → número, ni el «Elige antes la calle».** Es lo que hace que el recorrido no
  tenga una sola duda.
- **El techo de 10 sugerencias con scroll propio**: no se «mejora» enseñando más.
- **Los textos de los avisos de YeGo y de los desvíos**: son el mejor material del producto.
  F-4 pide **añadir** una salida, no reescribir lo que dice.
- **El cambio automático a la pestaña «Ruta»**: funciona y ahorra un toque.

---

## 9 · PARA EL CHECKLIST MAESTRO (en genérico)

1. **Demostrar la equivalencia con producción ANTES de abrir el navegador**, con el `diff`
   pegado en el informe. Una auditoría de experiencia sobre un commit que no es el desplegado no
   vale nada, y el error no se nota luego.
2. **Perfil de navegador nuevo y borrado por recorrido.** «Modo incógnito» no basta: arrastra
   configuración. Y la entrada directa se hace **navegando a la URL interior**, no pulsando un
   enlace desde la home.
3. **Contar los toques y poner el reloj en cada uno.** Un recorrido «fácil» y otro «fácil» se
   distinguen en que uno son 10 toques y el otro 17.
4. **Inventariar los enlaces de cada página pública** y preguntar dos cosas: ¿se llega aquí desde
   algún sitio? y ¿se sale? Una página con 0 enlaces es una trampa, aunque su contenido sea
   excelente.
5. **Seguir cada enlace interno EN PRODUCCIÓN.** Un enlace a una ruta que no se despliega no da
   404: da la home, en silencio, y desde el código no se ve.
6. **Un producto de portfolio se audita también como portfolio:** ¿hay puente al código y a
   quien lo hizo? Es la pregunta que el autor nunca se hace porque él ya sabe llegar.
7. **Probar la lista sin techo con la entrada más corta que la dispare**, y mirar si se sale de
   la ventana o empuja los controles.
8. **Un error debe hacer tres cosas: tranquilizar, explicar y ofrecer salida.** Es fácil acertar
   en las dos primeras y olvidar la tercera — y la tercera es la única que deja seguir.
9. ⭐ **Escribir la lista de sesgos MIENTRAS se usa, no al final.** Cada vez que algo parezca
   «obvio», anotar si es buen diseño o conocimiento previo. Aquí, de siete momentos, **dos eran
   sesgo puro** —las calles que me sé y el par de YeGo que saqué de la suite— y cambiaron la
   gravedad de un hallazgo.

---

## 10 · LAS CAPTURAS (ruta absoluta)

Todas en
`C:\Users\ORDENA~1\AppData\Local\Temp\claude\f--01-PROYECTOS-004-DESPLAZAME\bf1ac4a1-259c-49fb-a0b6-3255f588d85b\scratchpad\audF\capturas\`

```
a-primer-contacto-movil.png        a-primer-contacto-escritorio.png
b-ruta-movil.png                   c-entrada-directa-creditos.png
c-entrada-directa-identidad.png    d-yego-fuera-de-area.png
g-escala-a.png                     g-escala-ca.png            g-escala-cal.png
```

---

## 11 · LAS HORAS DE ESTE BLOQUE

| Tramo | Reloj |
|---|---|
| La puerta de equivalencia y el montaje del contexto limpio | 11:05 → 11:08 |
| Primer contacto, entrada directa e inventario de enlaces | 11:08 → 11:10 |
| El caso del 90 %, la escala y el estado de YeGo | 11:10 → 11:12 |
| Redacción del informe y la lista de sesgos | 11:12 → cierre |
| **Total del bloque F** | **≈ 35 min** de reloj de pared |

**Cualitativo:** el marco lo avisaba —*«F es corto en piezas pero exige el contexto limpio de
verdad»*— y se cumplió: **el trabajo fueron seis recorridos, y el gasto estuvo en montarlos bien**
(perfil nuevo por recorrido, entrada sin pasar por la home, datos reales). Dos sondas fallaron y
hubo que rehacerlas —una calle que no existía con el nombre que supuse y un selector de espera
que no era el del rechazo—, y ese tropiezo **es parte del hallazgo**: el producto no se deja
recorrer a ciegas, igual que no se deja recorrer a ciegas un usuario nuevo.
