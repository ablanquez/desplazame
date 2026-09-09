# Inter, autoalojada — de dónde salió y por qué está aquí

## La ficha

| | |
|---|---|
| **Familia** | Inter |
| **Versión** | 4.1 |
| **Publicada** | 2024-11-16 |
| **Origen** | `https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip` |
| **sha256 del zip** | `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e` |
| **Autoría** | The Inter Project Authors (Rasmus Andersson) |
| **Licencia** | SIL Open Font License 1.1 — `LICENCIA-OFL.txt`, al lado |
| **Descargada** | 2026-09-09 |

Los tres ficheros salen de `web/` dentro de ese zip, **sin tocarlos**: no se han
resubconjuntado, ni recomprimido, ni renombrado. Sus sha256, verificados contra
los del zip en el momento de copiarlos:

| fichero | peso | sha256 |
|---|---|---|
| `Inter-Regular.woff2` (400) | 111.268 B | `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085` |
| `Inter-Medium.woff2` (500) | 114.348 B | `0ff3e94614e1493eb556314fd247ae6c4a85a7783b4cc86be539940cf83f2a48` |
| `Inter-SemiBold.woff2` (600) | 114.812 B | `5cb7103e4e605989afebc03d989c79201e54b21b5183db33981f70db9178a301` |

## ⚠️ Por qué autoalojada y NUNCA desde el CDN de Google

El `index.css` del modelado de Figma Make abre con un
`@import url('https://fonts.googleapis.com/css2?family=Inter:...')`. **Esa línea
no se calca**, y es la única del fichero de referencia que se descarta a
propósito.

El **Juzgado Regional de Múnich (enero de 2022)** condenó a un sitio por
exactamente eso: incrustar Google Fonts en remoto hace que el navegador del
visitante mande su **IP a un tercero** sin base legal, **habiendo alternativa
neutra** — y la alternativa neutra es esto, servir el `.woff2` desde el propio
dominio. Es la razón de peso; el RGPD no admite «es que era más cómodo».

Y las dos razones técnicas que quitan el último argumento a favor del CDN:

- **La caché ya no se comparte entre sitios.** Desde que los navegadores
  particionan la caché por sitio, la fuente de Google **no viene ya cacheada**
  de otra web. La ventaja histórica del CDN sencillamente no existe.
- **Una resolución DNS y una conexión menos.** Un dominio de terceros cuesta
  DNS + TLS antes de empezar a bajar nada; desde el propio origen, la conexión
  ya está abierta.

## Por qué los tres estáticos y no `InterVariable.woff2`

Porque el encargo pide **400/500/600**, que es lo que el diseño usa, y no más.

⚠️ Merece saberse que **no sale a cuenta por peso**: los tres estáticos suman
340.428 B y la variable entera pesa 352.240 B — apenas 12 KB más para *todos*
los pesos. La diferencia real está en otro sitio: con los estáticos el navegador
**baja solo el peso que la página use**, y con la variable los baja todos de
golpe siempre. Si algún día se usan los tres a la vez en la misma pantalla, la
variable pasa a ser la opción barata y esta decisión hay que rehacerla.
