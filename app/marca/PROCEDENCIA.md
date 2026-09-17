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

## Los cuatro ficheros

| fichero | para | notas |
|---|---|---|
| `simbolo.svg` | **El reducido** — el símbolo solo | `currentColor`: lo pinta quien lo use |
| `completo.svg` | **El completo** — símbolo + logotipo | ⚠️ el logotipo va como `<text>`, no como trazados: convertirlo a curvas pide un rasterizador, y este repositorio tiene **dependencias cero**. Fuera de una máquina con Inter, la palabra se pinta con la letra del sistema. Declarado, no disimulado |
| `favicon.svg` | **El favicon**, servido en `/favicon.svg` | La media query va **dentro**, en un `<style>` embebido |
| `app-icon.svg` | **El app-icon**, 512 × 512 | **PRODUCIDO Y NO CABLEADO**: hoy no hay `manifest.webmanifest` y crearlo queda fuera de alcance. Va a la cola, declarado |

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

## Lo que había antes en la pestaña

El favicon por defecto que dejó **el andamiaje de Angular** el 2026-08-16:
`app/public/favicon.ico`, 15.086 bytes, tres tamaños (48, 32 y 16),
`sha256 f9102be80297c0529207607be5277b4f90bca89d65988fa1771b91c7894e815f`. Sin
ninguna relación con este producto.

**No se retira**: sigue siendo el respaldo para quien no sepa leer un favicon
vectorial, y sustituirlo por uno de la marca pide un rasterizador que este
repositorio no tiene. Queda a la cola, declarado.
