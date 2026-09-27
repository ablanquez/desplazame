# AUDITORÍA DE CIERRE · LOS ESCÁNERES EXTERNOS

> **Qué es:** la pasada de herramientas de terceros sobre el sitio **en producción**, con su
> evidencia versionada al lado. Gobernada por `00-MARCO-AUDITORIA-DE-CIERRE.md` §7.
>
> **Fecha:** 2026-09-27 · **Contra:** <https://desplazame.antonioblanquez.es> · **Commit
> servido:** `8aa418a`, que Redistribuir desplegó el 26/09 (arrancado
> `2026-09-26T18:45:23.800Z`, `pid 3434675` leído hoy en `/api/salud`).
>
> **La equivalencia, demostrada y no supuesta:** `git diff 8aa418a..HEAD -- app motor tipos` sale
> **vacío**. Los dos commits que hay encima son papel (`docs/DESPLIEGUE.md` y el marco), así que
> **lo medido aquí es exactamente el producto de este árbol**.
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.**
>
> ⚠️ **LA LEY DEL §7, QUE MANDA SOBRE TODO LO QUE SIGUE:** esto son **mediciones de laboratorio,
> no certificados**. Miden **la forma, no el fondo** —*«una app que inventara los datos sacaría
> las mismas notas»*—; **las métricas concretas valen más que la nota**; y **un punto de
> diferencia es ruido**: dos pasadas del mismo motor el mismo día dan números distintos.
>
> ⚠️ **NINGUNA HERRAMIENTA ENTRA EN EL REPOSITORIO.** Todo por `npx` o por `npm pack` a un
> directorio fuera del árbol. `package.json` y `package-lock.json` **no se han tocado**.
>
> **Es medición, no arreglo:** lo que sale, sale al informe. **Aquí no se arregla nada.**

---

## 1 · LA TABLA, DE UN VISTAZO

| Escáner | Herramienta y versión | Resultado |
|---|---|---|
| **Lighthouse · escritorio** | lighthouse 13.5.0 (npx) | perf **96-99** · a11y **100** · buenas prácticas **100** · SEO **91-92** |
| **Lighthouse · móvil** | lighthouse 13.5.0 (npx) | perf **75-81** · a11y **100** · buenas prácticas **96-100** · SEO **91-92** |
| **axe-core** | axe-core 4.13.0 (npm pack, inyectado por CDP) | portada **0 violaciones** · `/identidad` y `/creditos` **1 cada una** (`region`, moderada) |
| **SSL Labs** | api.ssllabs.com, motor 2.4.3 (criterios 2009q) | **A en los cuatro nodos** (2 IPv4 + 2 IPv6) — **mérito del hosting** |
| **W3C Nu · HTML servido** | validator.w3.org/nu (API) | **0 errores y 0 avisos** en las tres rutas — con un matiz grande, §5 |
| **W3C Nu · DOM pintado** | — | `NO CONSTA` · el POST del `nu` lo bloquea Cloudflare y aquí no hay Java para el `vnu` oficial. **Los tres DOM quedan guardados** para que sea un pegado |
| **securityheaders.com** | — | `NO CONSTA` la nota (403 de Cloudflare). **Las cabeceras, medidas aquí**: de nueve, **hay una** |
| **Datos estructurados** | — | **No aplica: el sitio no emite datos estructurados** (0 JSON-LD, 0 microdatos, 0 RDFa, 0 OpenGraph) |
| **WAVE** | — | `NO CONSTA` · **puntuó otra página** y aun así dio nota: el §7 lo avisaba |

---

## 2 · LIGHTHOUSE — las cuatro categorías, seis pasadas

**Herramienta:** `npx -y lighthouse@latest`, **versión 13.5.0**, Chrome 153.0.8010.53 en
`--headless=new`. Móvil es el perfil por defecto (con su estrangulamiento); escritorio,
`--preset=desktop`. Informes completos en `docs/auditoriafinal/externa/lh-*.report.report.{json,html}`.

| Página | Forma | Perf | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---|---|---|
| portada | escritorio | 96 | 100 | 100 | 92 | 1,3 s | 0 | 0 ms |
| portada | móvil | 78 | 100 | 96 | 92 | 4,1 s | 0 | 0 ms |
| `/identidad` | escritorio | 99 | 100 | 100 | 91 | 0,8 s | 0 | 0 ms |
| `/identidad` | móvil | 75 | 100 | 100 | 91 | 4,1 s | 0 | 170 ms |
| `/creditos` | escritorio | 99 | 100 | 100 | 91 | 0,7 s | 0 | 0 ms |
| `/creditos` | móvil | 81 | 100 | 100 | 91 | 3,8 s | 0,004 | 10 ms |

### Lo que dicen las métricas, que es lo que importa

- **CLS 0 en cinco de seis** y 0,004 en la sexta. El diseño **no salta**, y eso es lo que la
  persona nota. Es la métrica de la que más orgullo cabe sacar aquí.
- **TBT 0 ms en cuatro de seis.** El hilo principal no se bloquea: no hay JavaScript peleándose
  con el usuario.
- **LCP ~4 s en móvil contra ~1 s en escritorio.** Ahí está la nota de rendimiento, entera. El
  móvil de Lighthouse es un aparato lento con red estrangulada a propósito; el escritorio mide la
  misma página sin eso. **No son dos resultados: son la misma página bajo dos raseros.**

### Los tres avisos concretos, por encima de la nota

**(a) `robots-txt` — falla en las SEIS pasadas, y es real.** No hay `robots.txt`: el comodín del
router devuelve el `index.html` con **HTTP 200**, y Lighthouse intenta leer HTML como robots y se
atraganta. Medido aparte:

```
GET /robots.txt → 200 · content-type: text/html; charset=utf-8
primeros bytes: <!doctype html> <!-- ⭐ SIN `data-theme` (16/09, tanda 6 · parte 3)…
```

Es de arreglo trivial —un fichero— y **no se arregla aquí**: esto es medición.

**(b) ⭐ `label-content-name-mismatch` falla, y la categoría de accesibilidad sigue marcando 100.**
Éste es **el ejemplo perfecto de la ley del §7**, y por eso va con nombre y apellidos. En la barra
de pestañas de móvil, el botón del tema enseña **«Tema»** y su nombre accesible es **«Modo
oscuro»**:

```
visible: «Buscador»  ·  aria-label: (ninguno)
visible: «Ruta»      ·  aria-label: (ninguno)
visible: «Mapa»      ·  aria-label: (ninguno)
visible: «Tema»      ·  aria-label: «Modo oscuro»     ← el nombre no contiene lo que se lee
```

[WCAG 2.5.3 *Label in Name*] quien maneja el sitio **por voz** dice lo que ve —«Tema»— y no
activa nada. **El peso de esa auditoría en la categoría es 0**, así que la nota sigue diciendo
100 con el fallo dentro. Si esta pieza se hubiera quedado en la nota, no lo habría visto nadie.

**(c) `image-size-responsive` en portada móvil.** Las teselas de OpenStreetMap se sirven a 256 px
y se pintan a 256 px CSS en una pantalla de densidad 2. **No es código de esta casa**: es Leaflet
con el proveedor de teselas estándar, y pedir teselas @2x va justo contra la política de uso del
proveedor. Se reporta como **mérito ajeno al revés**: defecto ajeno.

---

## 3 · axe-core — el motor de accesibilidad, aparte

**Herramienta:** **axe-core 4.13.0**, bajado con `npm pack` a mi directorio de trabajo e
inyectado en mi propio Chrome por CDP. *(El `@axe-core/cli` oficial exige un `chromedriver` a
juego con el Chrome instalado y aquí no lo hay; el motor es el mismo.)*

⚠️ **Comparte motor con la categoría de accesibilidad de Lighthouse**, así que **esto no es una
segunda opinión: es la misma medición con otra interfaz**, y no se cuenta dos veces. Lo que sí
añade es el detalle por nodo, que la nota esconde.

| Página | Violaciones | Incompletas (piden ojo humano) |
|---|---|---|
| portada | **0** | 1 · `color-contrast` en 3 nodos |
| `/identidad` | **1** · `region` (moderada), 2 nodos | 0 |
| `/creditos` | **1** · `region` (moderada), 2 nodos | 0 |

### ⭐ El `region`, que es un hallazgo de verdad y afina al B-2

*«All page content should be contained by landmarks»*, y el nodo de ejemplo lo dice todo:
`header` en `/creditos`, `header > div` en `/identidad`. El marcado es:

```html
<section class="creditos-pagina">
  <header class="creditos-pagina__cabecera">   ← anidado dentro de <section>
    <h1>Créditos y fuentes</h1>
    <p class="creditos-pagina__intro">…</p>
    <p class="creditos-pagina__volver">…</p>
  </header>
  <main>…</main>
```

Un `<header>` **dentro de un `<section>` no es el landmark `banner`** —solo lo es cuando cuelga
del `<body>`—, así que su contenido queda fuera de todo landmark. **El B-2 de la T3 le dio a
estas páginas su `<main>`, y eso está; lo que no se vio es que la cabecera se quedaba fuera.**
Impacto moderado, de arreglo pequeño. **No se toca aquí.**

Y el `color-contrast` **incompleto** de la portada no es un fallo: axe dice *«no puedo
decidirlo»* —fondos con imagen o gradiente, que en esta portada es el mapa—. Esta casa mide el
contraste **sobre el píxel** en su propia batería, que es la respuesta a ese «no puedo».

---

## 4 · SSL Labs — A en los cuatro nodos, y el mérito no es nuestro

**Herramienta:** `api.ssllabs.com/api/v3`, **motor 2.4.3**, criterios **2009q**. Salida completa
en `externa/ssllabs.json`. Probado el 2026-09-27T15:01:01Z.

| Nodo | Nota | Protocolos |
|---|---|---|
| `92.112.198.228` | **A** | TLS 1.2, TLS 1.3 |
| `77.37.76.243` | **A** | TLS 1.2, TLS 1.3 |
| `2a02:4780:50:7486:…:9394` | **A** | TLS 1.2, TLS 1.3 |
| `2a02:4780:51:4fe:…:b40a` | **A** | TLS 1.2, TLS 1.3 |

**Los cuatro nodos del CDN, mirados uno a uno**, que es lo que la letra del §7 pide: una nota
buena en un nodo no dice nada de los otros tres.

⚠️ **Y el mérito es del hosting, no de este proyecto.** El certificado, los protocolos y la
configuración los pone Hostinger (`server: hcdn`); aquí no hay una línea de código que haya
contribuido a esa A. Se anota porque el §7 lo manda anotar, **no como medalla**.

---

## 5 · Validador del W3C — y el matiz que hace falta para leerlo

**Herramienta:** `validator.w3.org/nu`, por su API, sobre las tres URLs públicas **de
producción**. Salida en `externa/w3c-nu-servido.json`.

| URL | Errores | Avisos/info |
|---|---|---|
| `/` | **0** | 0 |
| `/identidad` | **0** | 0 |
| `/creditos` | **0** | 0 |

### ⚠️ Y aquí va el matiz, porque sin él estas tres filas engañan

**Las tres rutas sirven EXACTAMENTE el mismo HTML.** Medido:

```
/           sha256 1a573546bc9847e5   14.667 bytes
identidad   sha256 1a573546bc9847e5   14.667 bytes
creditos    sha256 1a573546bc9847e5   14.667 bytes
```

Es una aplicación de cliente: lo que el validador descarga es **el caparazón del router**, no la
página. Así que esas tres filas **son una sola medición repetida tres veces**, y lo que dicen es
que *el caparazón es HTML válido*. De las páginas de verdad no dicen nada.

**Lo que sí es la página es el DOM pintado**, y ahí el instrumento se cae:

- El **POST** del `nu` —la vía para validar un HTML que uno trae— responde con un **desafío de
  Cloudflare** a un cliente que no es navegador. Evidencia: la respuesta trae
  `__cf_chl_rt_tk` y el `<title>Just a moment...</title>`.
- El **`vnu` oficial fuera de línea** es un `.jar`: **esta máquina no tiene Java**
  (`java: command not found`).

→ **`NO CONSTA`**, y con el trabajo hecho para que cueste un minuto: **los tres DOM pintados están
guardados y versionados** (`externa/pintado-portada.html`, `-identidad`, `-creditos`; 72.663,
145.699 y 21.822 bytes).

> **Instrucción para Antonio:** abrir <https://validator.w3.org/nu/#textarea>, elegir *«Validate
> by input»*, pegar el contenido de cada `pintado-*.html` y anotar errores y avisos. **Y el
> precedente del bloque B a mano al leerlo:** los atributos `_ngcontent-…`/`_nghost-…` que Angular
> siembra ya se descartaron una vez como **ruido del instrumento** —no son HTML inválido, son
> atributos `data-`less del framework—. Señal es lo que quede después de quitar eso.

---

## 6 · Cabeceras de seguridad — la nota `NO CONSTA`, las cabeceras medidas

**securityheaders.com no se pudo consultar:** su propio Cloudflare responde **HTTP 403** a un
cliente que no es navegador (respuesta guardada en `externa/securityheaders.html`: *«Just a
moment...»*). → la **nota**, `NO CONSTA`.

**Pero la nota es un resumen de algo que sí se puede medir desde aquí**, y se ha medido
(`externa/cabeceras-produccion.txt`):

| Cabecera | ¿Está? | Valor |
|---|---|---|
| `content-security-policy` | ✅ | `upgrade-insecure-requests` |
| `strict-transport-security` | ❌ | — |
| `x-frame-options` | ❌ | — |
| `x-content-type-options` | ❌ | — |
| `referrer-policy` | ❌ | — |
| `permissions-policy` | ❌ | — |
| `cross-origin-opener-policy` · `-embedder-` · `-resource-` | ❌ | — |

**De nueve, hay una** —y la que hay es mínima—. Con ese cuadro, la nota de securityheaders.com
sería baja, y **la decisión de si eso importa no es de esta pieza**: son cabeceras que pone el
hosting o el CDN (§4 del `docs/DESPLIEGUE.md`), no el código.

> **Instrucción para Antonio:** abrir <https://securityheaders.com/?q=desplazame.antonioblanquez.es>
> en el navegador y anotar la letra. La lista de arriba ya dice por qué saldrá la que salga.

---

## 7 · Datos estructurados — **no aplica**

Buscado en los tres DOM pintados: **0 bloques `application/ld+json`, 0 microdatos (`itemscope`),
0 RDFa (`vocab`/`typeof`/`property`), 0 etiquetas OpenGraph**.

**El sitio no emite datos estructurados**, así que la prueba de resultados enriquecidos **no
aplica** y no se inventa una. Si algún día se emiten, la herramienta es
<https://search.google.com/test/rich-results>.

---

## 8 · WAVE — ⭐ el §7 lo avisó, y pasó exactamente eso

**Un solo intento**, como manda la letra. WAVE cargó su informe y **puntuó una página que no es
ésta**. Su propio título lo delata:

```
WAVE Report of Checking your browser before accessing. Just a moment...
AIM Score: 8.5 out of 10 · 1 Errors · 2 Alerts · 1 Features · 1 Structure · 0 ARIA
  1 Page refreshes or redirects · 1 No page regions · 1 Noscript element · 1 Language
```

Lo que midió es un **interstitial** —«Checking your browser…»—: el «Page refreshes or redirects»,
el «No page regions» y el «Noscript element» son del desafío, no de Desplázame. **Y aun así dio
una nota de 8,5 sobre 10.**

⚠️ **Eso es exactamente lo que el §7 avisa** —*«revienta … y pinta nota igual»*— y es la razón de
que este documento empiece recordando que estas herramientas miden la forma. Una nota de WAVE
sobre este sitio **no vale nada mientras no se compruebe qué página cargó**.

Y deja un dato lateral que sí es nuestro: **a algunos clientes el CDN les sirve un desafío**. Desde
aquí un `fetch` plano recibe la página buena (200, con el sha del caparazón), así que la regla que
decide a quién se le pone el desafío **no se puede deducir desde fuera** → `NO CONSTA`.

> **Instrucción para Antonio:** usar la **extensión de WAVE en el navegador**, que mide la página
> que se está viendo de verdad. La web pública no sirve para este dominio.

Captura del intento: `externa/wave-intento.png`.

---

## 9 · LO QUE `NO CONSTA`, JUNTO

1. **La nota de securityheaders.com** — 403 de su Cloudflare. Las cabeceras, medidas aquí (§6).
2. **El W3C sobre el DOM pintado** — POST bloqueado y sin Java para el `vnu`. Los tres DOM,
   guardados y listos para pegar (§5).
3. **WAVE** — midió otra página (§8). Queda la extensión de navegador.
4. **La regla del desafío del CDN** — a quién se le sirve y a quién no, no se deduce desde fuera
   (§8).

---

## 10 · LAS HORAS DE ESTA PIEZA

| Tramo | Reloj |
|---|---|
| Estado, equivalencia con lo desplegado y arranque de SSL Labs | 16:55 → 16:58 |
| Cabeceras, W3C servido y captura de los tres DOM pintados | 16:58 → 17:02 |
| Lighthouse ×6 y lectura de las auditorías que fallan | 17:02 → 17:07 |
| SSL Labs, datos estructurados, axe-core ×3 y el intento de WAVE | 17:07 → 17:12 |
| Redacción | 17:12 → cierre |
| **Total** | **≈ 35 min** de reloj de pared |

**Cualitativo:** de los seis escáneres, **tres midieron y tres tropezaron con su propio
instrumento** —dos por Cloudflare y uno por falta de Java—, y eso ya es un resultado: la mitad del
trabajo de esta pieza fue **saber qué estaba midiendo cada herramienta**. Lo más valioso no
salió de ninguna nota: salió de **mirar debajo** —el `label-content-name-mismatch` con peso 0, el
`region` de las dos páginas, las tres rutas sirviendo el mismo HTML— y de **leer el título del
informe de WAVE** antes que su puntuación.
