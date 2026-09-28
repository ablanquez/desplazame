# AUDITORÍA DE CIERRE · ANEXO A LOS ESCÁNERES EXTERNOS — la sesión de mano

> **Qué es:** lo que `EXTERNA.md` dejó en `NO CONSTA` el 27/09, cerrado el **28/09** con lo que
> solo puede hacer una persona delante de un navegador. Gobernado por
> `00-MARCO-AUDITORIA-DE-CIERRE.md` §7.
>
> **Fecha:** 2026-09-28 · **Datos de:** el navegador de Antonio (verbatim), más dos pasadas del
> validador del W3C hechas aquí.
>
> ⚠️ **POR QUÉ ES UN FICHERO NUEVO Y NO UNA LÍNEA MÁS EN `EXTERNA.md`.** Aquel informe lleva
> escrito en su propia cabecera **«REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE»**, y es la ley
> de la carpeta: los informes son registros con fecha, y lo que se sabe después entra **al lado
> y fechado**, no encima. Es lo que la casa ya hizo con `VERIFICACION.md`, que es su propio
> fichero y no un apéndice del marco. Así que `EXTERNA.md` se queda **intacto, byte a byte**, y
> esto se lee después de él.
>
> ⚠️ **Y NO SE TOCA EL TABLERO.** La fila del §9 del marco no nombra a este anexo: el marco es
> del estratega, y quien lo lleva decidirá si lo cita.

---

## 1 · LOS CUATRO `NO CONSTA`, UNO A UNO

El §9 de `EXTERNA.md` dejó cuatro. **Tres se cierran y uno se declara permanente.**

### 1.1 · securityheaders.com — ⚰️ CERRADO: **nota D**

Era `NO CONSTA` porque su Cloudflare devolvía 403 a cualquier cliente que no fuera un
navegador. Desde el navegador:

| Pasada | Resultado |
|---|---|
| Primera, sobre `http://` | **R** — la redirección a `https` es lo único que se midió |
| Sobre `https://` | **NOTA D** |

**Presentes: 1 de 9** — `Content-Security-Policy` con `upgrade-insecure-requests`.
**Faltan cinco por nombre:** `Strict-Transport-Security` · `X-Frame-Options` ·
`X-Content-Type-Options` · `Referrer-Policy` · `Permissions-Policy`.

⭐ **Y CONFIRMA EL §6 DE `EXTERNA.md`, QUE ES LO QUE IMPORTA AQUÍ:** esas cabeceras **no las
pone el código de este repositorio** — las pone el hosting o su CDN. Subir la nota es **tarea
de panel**, no de commit.

→ **Cola declarada**, sin dictado: *las cinco cabeceras que faltan son una tarea de panel de
Hostinger.* No se toca nada del árbol por esto.

### 1.2 · Validador del W3C sobre los TRES DOM pintados — ⚰️ CERRADO

Era `NO CONSTA` por dos motivos medidos: el POST a `validator.w3.org/nu/` lo para Cloudflare, y
en esta máquina **no hay Java** para el `vnu` de línea de órdenes. Los tres DOM quedaron
guardados en `externa/pintado-*.html` «listos para pegar», y eso es lo que se ha hecho, con el
filtro de mensajes del propio validador:

| DOM pintado | Lo que cantó el filtro | Lo que hay debajo |
|---|---|---|
| **portada** | **215 + 1 aviso** | 210 `_ngcontent…` + 5 de CSS (`base-select` / `::picker(select)`) — ruido ya adjudicado en el bloque B — **y 1 aviso de verdad: «Section lacks heading»**. Mi propia pasada da la misma partición: `error=215 · info/warning=1` |
| **identidad** | **1001** | 999 `_ngcontent…` + la señal **«main dentro de section»** |
| **creditos** | **50** | 49 `_ngcontent…` + la misma señal |

⭐ **Y LAS DOS SEÑALES DE `identidad` Y `creditos` SON UNA FOTO VIEJA, NO UN DEFECTO VIVO.** Los
tres ficheros se capturaron **de producción el 27/09**, y lo que denuncian —la cabecera
encerrada en un `<section>`— es **exactamente el hallazgo que la MP7 arregló ese mismo día**
(`section`→`div`, para que el `<header>` vuelva a ser `banner`). Así que el validador **confirma
el hallazgo por su cuenta y desde otro instrumento**, que es lo mejor que puede pasarle a un
hallazgo. No hay nada que arreglar por esta vía.

**Y el HTML servido, re-verificado hoy por Antonio: 0 errores** — como el 27/09.

El aviso de la portada **sí estaba vivo**, y es la línea dictada. Va entero en el §2.

### 1.3 · WAVE (la extensión, no el servicio) — ⚰️ CERRADO

Era `NO CONSTA` porque el servicio en línea midió **otra página**: el interstitial del CDN, tal
como el §7 del marco predijo por escrito. Con la extensión, sobre la portada:

| Lo que cuenta WAVE | |
|---|---|
| **ERRORS** | **0** |
| «contrast errors» | **6**, todos **sobre elementos visualmente ocultos** |
| alerts | **12** — 2 de `noscript`, 10 de *very-small-text* |
| features | 40 |
| structure | 9 |
| ARIA | 86 |
| **AIM score** | **7,7 / 10** |

⚠️ **LOS 6 «CONTRAST ERRORS» SON RUIDO DEL INSTRUMENTO, y se dice con su razón:** miden el
color de cosas que **no se ven**. Un elemento oculto no tiene contraste que incumplir; es la
misma clase de ruido que el §7 manda acotar en vez de perseguir.

⚠️ **Y LOS DOS AVISOS DE `noscript` NO APLICAN AQUÍ:** WAVE avisa por costumbre de que un
`noscript` suele estar mudo — **el de esta casa habla**, y eso lo firmó el B-3 con cinco juezas
detrás.

⚠️ **Los 10 de *very-small-text*, varios de ellos también sobre elementos ocultos**, son la
letra pequeña que esta casa **ya tiene censada**: el censo de tamaños del bloque B, con su fila
y su razón por cada sitio.

**Las 40 + 9 + 86 son detecciones POSITIVAS**, no problemas: lo que WAVE encuentra bien puesto.

⚠️ **Y el 7,7/10 se anota como lo que es: la métrica de WebAIM, no la de esta casa.** Igual que
la nota de Lighthouse: vale menos que las cifras que la componen.

### 1.4 · La regla del desafío del CDN — ⛔ `NO CONSTA` **PERMANENTE**

A quién le sirve el CDN la página y a quién le pone un desafío no se deduce desde fuera, y **no
hay acción de navegador que lo averigüe**: el navegador de Antonio pasa, y eso solo dice que
pasa el suyo. Deja de ser un hueco por rellenar y pasa a ser **un límite declarado**: para
saberlo haría falta el panel del CDN, que es otra mesa.

---

## 2 · LA LÍNEA DICTADA · «Section lacks heading» en la portada

**Dictado de Antonio: ARREGLAR.** Y lo primero era saber de quién hablaba el aviso, porque
**el validador no da selector**.

### 2.1 · Cómo se pudo correr el validador desde aquí

Las dos paredes del 27/09, **re-medidas hoy y en pie**: `curl -X POST` a
`validator.w3.org/nu/?out=json` → **HTTP 403** con el «Just a moment…» de Cloudflare, incluso
con cabeceras de navegador; y `java -version` → **no existe**.

La salida no era rendirse: **Cloudflare no veta al navegador, veta al cliente sin sesión**. Se
abre la página de Nu con el Chrome del arnés —carga: «Ready to check»— y el `fetch` del POST se
hace **desde dentro de la página**, que es donde viven sus cookies. El validador contesta
**HTTP 200 con su JSON**. Instrumento de verdad, sin raspar pantallas.

### 2.2 · El `<section>` localizado, midiendo

Sobre el **mismo fichero que validó Antonio** (`externa/pintado-portada.html`):

```
mensajes: 216 · error=215 · info/warning=1          ← las cifras de Antonio, clavadas
⭐ «Section lacks heading»: 1 vez
   línea 141, columnas 32481-32564
   extracto: hidden=""><section aria-labelledby="cabecera-pasos" class="pasos">
```

**Es `<section class="pasos" aria-labelledby="cabecera-pasos">`**, el panel de las
indicaciones: `app/src/app/buscador.html:826`.

⭐ **Y SU HERMANO DE AL LADO NO SALE, lo que enseña qué exime la regla exactamente.** En la
portada hay **dos** `<section>` y las dos están sin título dentro, pero el validador solo
señala una. Medido con un fixture de seis casos, porque suponerlo no valía:

| Caso | Nu |
|---|---|
| `<section aria-label="Mapa">` | **exento** ← el mapa de la portada |
| `<section aria-labelledby="…">` | **avisa** ← el panel de los pasos |
| `<section role="status" aria-labelledby="…">` | **avisa** |
| `<div role="region" aria-labelledby="…">` | **exento** ← el arreglo |
| `<section>` pelada | avisa |
| `<section>` con su `<h3>` dentro | exento |

O sea: **Nu acepta el nombre puesto con `aria-label`, y no el heredado por `aria-labelledby`.**

### 2.3 · El arreglo, y por qué ése

El `<h2>Indicaciones</h2>` que vivía dentro de esa sección **se fue a propósito**: la cabecera
del acordeón dice ya lo mismo justo encima, y `aria-labelledby` ata la sección a esa cabecera.
Está escrito en la plantilla desde entonces. **Meterle un título dentro sería deshacer una
decisión tomada, o inventar texto** — y el encargo prohíbe las dos.

Queda la otra mitad, que es **el propio consejo del validador**: *«or else use a "div" element
instead for any cases where no heading is needed»*.

```
antes:   <section class="pasos" aria-labelledby="cabecera-pasos">
después: <div class="pasos" role="region" aria-labelledby="cabecera-pasos">
```

⭐ **Y EL PUNTO DE REFERENCIA NO SE PIERDE, que era lo único delicado.** Un `<section>` con
nombre **sí es** un `region`, así que pasarla a `div` a secas habría borrado un landmark — justo
lo contrario de lo que buscaba la MP7. `role="region"` escrito a mano hace lo que el elemento
hacía solo.

**Es el patrón de la casa, no uno nuevo:** la MP7 hizo `section`→`div` en `/creditos` y
`/identidad` («los contenedores son `div` A PROPÓSITO»), y la MP8 puso `div` + `role="region"` +
`aria-labelledby` en las cuatro columnas de `/identidad`.

### 2.4 · Antes → después, medido en el árbol de accesibilidad de verdad

El estado que importa es **con la pestaña abierta**: cerrada, el `[hidden]` del cuerpo del
acordeón la saca del árbol y no aporta nada. Las cuatro medidas, por CDP:

| | ANTES `<section>` | DESPUÉS `<div role="region">` |
|---|---|---|
| 1440, cerrado | `none` [IGNORADO] · sin nombre · caja 0×0 | **idéntico** |
| 1440, **abierto** | **`region` · «Indicaciones»** · caja 526×264 | **idéntico** |
| 390, cerrado | `none` [IGNORADO] · caja 0×0 | **idéntico** |
| 390, abierto | `none` [IGNORADO] · caja 0×0 | **idéntico** |

Y los puntos de referencia de la página entera, con la pestaña abierta a 1440, antes y después:

```
contentinfo«» · banner«» · main«» · region«Mapa» · form«» · region«Indicaciones»
```

**No se mueve un solo nodo.** A 390 la cabecera del acordeón no está (`display:none`: allí manda
la pestaña, y su rótulo visible es «Resultado de rutas»), y el panel sigue fuera del árbol en
los dos lados por igual: lo que había antes es lo que hay ahora.

### 2.5 · La contraprueba: el aviso a cero

Mismo montaje del 27/09 —captura del DOM pintado a 1440×1000, con su testigo— contra `ng serve`,
antes y después del arreglo, y las dos pasadas por el validador:

| | Mensajes | «Section lacks heading» |
|---|---|---|
| **ANTES** (local, sin el arreglo) | 217 · error=216 · **info/warning=1** | **1 vez** (línea 1055) |
| **DESPUÉS** (local, con el arreglo) | 216 · error=216 · **info/warning=0** | **⭐ 0 veces** |

Los 216 errores son los mismos en las dos: el ruido de `_ngcontent…`, los dos de CSS, y uno
propio del servidor de desarrollo.

⚠️ **Y ese uno se declara, porque es del instrumento y no del producto:** *«The "base" element
must come before any "link" or "script" elements»*. Aparece **solo midiendo local** — `ng serve`
inyecta sus etiquetas en otro orden— y **no está en la captura de producción**, que es la que
manda. Se dice para que nadie lo lea como un hallazgo nuevo.

**axe-core 4.13.0 sobre la portada**, los dos anchos × los dos estados, con la regla
experimental encendida como en la contraprueba del 27/09:

```
1440 cerrado: 0 · 1440 ABIERTO: 0 · 390 cerrado: 0 · 390 ABIERTO: 0     region: 0 en las cuatro
```

### 2.6 · Las juezas, medidas antes de tocar

**Ninguna compra ese elemento.** Grep sobre `app/src`, `app/e2e` y las dos carpetas de
`scripts/`:

- **cero** selectores por elemento: nadie escribe `section` en una consulta, ni en CSS ni en
  jueza.
- Las que miran ahí dentro lo hacen **por clase, y la clase no se mueve**: `.pasos__vacio`,
  `.pasos__error`, `.pasos__modo`, `.pasos__lista`, y en `pintura.mjs` tres descendientes
  —`.pasos [role=status]`, `.pasos [role=alert]`, `.pasos [role=…]`—.
- La única que nombra `#cabecera-pasos` (`pintura.mjs:3843`) **pulsa el botón**, que no se toca.

**Cero actas**: no había nada que avisar.

---

## 3 · LO QUE ESTE ANEXO DEJA DECLARADO

1. ⛔ **`NO CONSTA` PERMANENTE**: la regla del desafío del CDN (§1.4).
2. **Cola de panel, sin dictado**: las cinco cabeceras de seguridad que faltan (§1.1). No son
   del código.
3. ⚠️ **UN CABO NUEVO, MEDIDO Y SIN TOCAR — el hermano del arreglado.**
   `app/src/app/buscador.html:924` es `<section class="resumen ambar" role="status"
   aria-labelledby="resumen-titulo">`, y **el caso 3 del fixture del §2.2 dice que el validador
   lo avisaría igual**. No salió en la pasada de Antonio porque **solo existe con un viaje
   pintado**, y la captura del 27/09 es la portada recién cargada.
   **Lo que NO se ha hecho, y se dice:** no se ha validado un DOM pintado **con ruta**, porque
   rellenar el formulario es la maquinaria de una suite entera. La prueba es el fixture de la
   misma forma, más que esa caja se pinta con el viaje (lo compra `bizi-y-resumen`: «UNA sola
   caja de avisos, `role=status`»).
   **El arreglo sería la misma línea** —`section`→`div`, con su `role="status"`, que ya manda
   sobre el elemento—, pero **el dictado era una línea y esto es otra**: se reporta, no entra
   por iniciativa.

---

## 4 · LO QUE SE HA USADO

| Instrumento | Cómo |
|---|---|
| securityheaders.com · W3C Nu (filtro de mensajes) · WAVE | **navegador de Antonio**, a mano |
| Nu, las dos pasadas de la contraprueba | Chrome del arnés, `fetch` desde dentro de la página |
| axe-core **4.13.0** | `npm pack` a un directorio **fuera del árbol**, inyectado por CDP |

⚠️ **Ninguna herramienta ha entrado en el repositorio:** `package.json` y `package-lock.json`
**no se tocan** por medir. Los guiones de las dos pasadas y sus JSON viven fuera del árbol; lo
que queda aquí son las cifras y el camino para repetirlas.
