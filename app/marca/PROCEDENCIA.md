# La marca de Desplázame — qué hay aquí y por qué está aquí

## La ficha

| | |
|---|---|
| **Qué es** | El símbolo y el logotipo de Desplázame |
| **Autoría** | **Obra propia** de este proyecto — no viene de ninguna colección ajena |
| **Licencia** | La del repositorio (`LICENSE`). **No necesita ficha en `THIRD-PARTY-NOTICES.md`**, que es el inventario de lo de terceros |
| **Elegido** | 2026-09-17, por Antonio, entre tres candidatos pintados a 16/32/64 px en los dos temas y montados en la cabecera real |
| **Rejilla** | `viewBox="0 0 32 32"`, trazo de 4 unidades |

## Por qué NO vive en `app/simbolos/`

**Es marca, no icono del set.** El §5 firma Material Symbols como familia única
**para la interfaz** —acciones, modos, maniobras, controles—, y un logotipo no
se toma prestado de una familia de iconos de sistema: no dice «esto hace tal
cosa», dice «esto es Desplázame». Mezclarlos habría hecho que el censo de
`app/simbolos/` dejara de cuadrar contra el repositorio de Google, que es lo que
le da valor.

Su portero está igual: `sistema-de-iconos.spec.ts` reconoce `marca.ts` como
**cuarto sitio declarado** que puede escribir un `<svg>`, y una jueza comprueba
que el símbolo de la cabecera y el del favicon son **el mismo dibujo**.

## La letra que lo manda

**[DISEÑO §4]** «símbolo geométrico simple, reconocible a **16 px**», que evoque
*ruta / movimiento*, en azul primario.
**[DISEÑO §36]** favicon **SVG** con media query interna; versiones del logo por
tema, **evitando el blanco puro en oscuro**.

## Los ficheros: cuatro fuentes y tres rasters

**Las fuentes** — lo que se edita a mano:

| fichero | para | notas |
|---|---|---|
| `simbolo.svg` | **El reducido** — el símbolo solo | `currentColor`: lo pinta quien lo use |
| `completo.svg` | **El completo** — símbolo + logotipo | ⚠️ el logotipo va como `<text>`, no como trazados: convertirlo a curvas pide un rasterizador, y este repositorio tiene **dependencias cero**. Fuera de una máquina con Inter, la palabra se pinta con la letra del sistema. Declarado, no disimulado |
| `favicon.svg` | **El favicon**, servido en `/favicon.svg` | La media query va **dentro**, en un `<style>` embebido |
| `app-icon.svg` | **El app-icon**, 512 × 512 | ⚰️ **CABLEADO EL 28/09** por dictado de Antonio. De aquí salen los tres rasters de abajo |

**Los rasters** — ⚠️ **no se editan: se regeneran.** Nacen de las fuentes por el
comando de la sección siguiente:

| fichero | para | de |
|---|---|---|
| `apple-touch-icon.png` | 180 × 180, el icono de Safari en iOS | `app-icon.svg` |
| `icon-192.png` | 192 × 192, el del manifest | `app-icon.svg` |
| `icon-512.png` | 512 × 512, el del manifest | `app-icon.svg` |
| `../public/favicon.ico` | 16 · 32 · 48 en un solo `.ico` | `favicon.svg` |

⚠️ **Un PNG retocado a mano es un dibujo huérfano.** La jueza del parecido mira
solo los **cuatro vectoriales**, porque son la fuente; si alguien retoca un
raster, su dibujo deja de cuadrar con el SVG del que dice venir y **nadie se
entera**. Se cambia el SVG y se vuelve a correr el comando.

## Cómo se regeneran — el comando

```
node scripts/rasterizar-marca.mjs
```

Deja `app/public/favicon.ico`, `app/marca/apple-touch-icon.png`,
`app/marca/icon-192.png` y `app/marca/icon-512.png`. **Es determinista**: dos
corridas seguidas dan el mismo `sha256` fichero a fichero (comprobado el 28/09).

⚠️ **Y no instala nada.** El rasterizador es **el Chrome del arnés** —`app/e2e/medir.mjs`,
por CDP—, que es con lo que esta casa mide píxeles desde el primer día. Ninguna
dependencia entra en `package.json` por producir imágenes.

⚠️ **El guion vive en el repositorio a propósito** [la lección C-5 de la auditoría
de cierre]: un instrumento que vive fuera deja a quien clona con la documentación
y sin la herramienta. Un comando que no se puede repetir no es un comando.

⚠️ **El `.ico` sale del TEMA CLARO y no puede ser de otro**: un raster no lee
`prefers-color-scheme`. Se rasteriza con lo que el navegador ve sin emular nada
—el guion lo **imprime** al correr, medido: `CLARO`—, así que lleva el `#2563eb`.
Quien entienda el SVG verá el color de su tema; quien no, este.

## El calado de la gota

El hueco es un **calado de verdad** —una sola ruta con `fill-rule="evenodd"`—,
no un disco del color del fondo. Un tapón pintado se delata en cuanto la marca
cae sobre una tarjeta, sobre la página o sobre una tesela; el calado vale sobre
las tres. Se probó sobre las tres antes de fijarlo.

## Los dos azules, y por qué el favicon responde al SISTEMA

`#2563eb` en claro y `#93c5fd` en oscuro — los dos `--primary` del tema. **En
oscuro no hay blanco puro** [§36].

⚠️ **El favicon sigue al SISTEMA, no al conmutador**, y eso no es un fallo: un
favicon se pinta en la pestaña, fuera del documento, así que **no hereda el
`data-theme` de la página**. Lo único que puede leer es `prefers-color-scheme`,
y es lo que lee. Queda declarado en vez de fingir que sigue al tema elegido.

⚠️ **El `app-icon` sí lleva blanco**, y tampoco choca con el §36: el § prohíbe el
blanco puro del **logo sobre el fondo oscuro del tema**, no un icono de
aplicación que trae su propio fondo de marca. La marca va calada en blanco sobre
el azul, y ocupa el **60 %** del lienzo — el área segura que los lanzadores
recortan con máscara.

## El manifest, y lo que NO declara

`app/public/manifest.webmanifest`, nacido el 28/09 con el app-icon: `name` y
`short_name` «Desplázame», `theme_color` el azul de marca `#2563eb`,
`background_color` el `--claro-background` de `styles.css` (`#ffffff`), e `icons`
de 192 y 512 con `purpose: "any"`.

⚖️ **`display: "browser"`, firmado por Antonio, y es lo importante de este
fichero:** Desplázame **NO es una PWA** — no hay service worker ni nada fuera de
línea—, así que declararla instalable sería prometerle a quien la instale algo
que no hay. El manifest está aquí por el nombre, el color y los iconos que el
sistema usa; el día que se quiera instalable, **es otra decisión**.

## Lo que había antes en la pestaña — y ya no está

El favicon por defecto que dejó **el andamiaje de Angular** el 2026-08-16:
`app/public/favicon.ico`, 15.086 bytes, tres tamaños (48, 32 y 16),
`sha256 f9102be80297c0529207607be5277b4f90bca89d65988fa1771b91c7894e815f`. Sin
ninguna relación con este producto. Estuvo en la pestaña **43 días**.

⚠️ **AQUÍ PONÍA:** *«No se retira: sigue siendo el respaldo para quien no sepa
leer un favicon vectorial, y sustituirlo por uno de la marca pide un rasterizador
que este repositorio no tiene. Queda a la cola, declarado.»*

Y era verdad a medias: el `.ico` **sí** sigue siendo el respaldo —no se retira, se
sustituye—, pero lo del rasterizador no lo era. **El 28/09 el `.ico` pasó a ser la
marca**, rasterizada desde `favicon.svg` con el Chrome del arnés: 2.239 bytes, los
mismos tres tamaños, `sha256 ea10f8e7faac7009f89a4a9b7aecae0aa04b35c7f3a868af66f9afd112394654`.

**El sha viejo queda escrito arriba a propósito**, y una jueza lo vigila: si algún
día vuelve —un revert, una plantilla copiada—, salta.
