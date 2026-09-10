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

Los tres ficheros salieron de `web/` dentro de ese zip. ⚠️ **Y hasta el 10/09
viajaban sin tocar; desde el 10/09 van SUBCONJUNTADOS** —ver el recorte, más
abajo—, así que estos sha256 son los del fichero **tal como llegó**, no los del
que se sirve hoy. Se conservan porque son el primer eslabón de la cadena:

| fichero | peso | sha256 |
|---|---|---|
| `Inter-Regular.woff2` (400) | 111.268 B | `e06f6b1bc553aaea4e4668023ed0ab0a147129c3107f511bc7d03d361b0ae085` |
| `Inter-Medium.woff2` (500) | 114.348 B | `0ff3e94614e1493eb556314fd247ae6c4a85a7783b4cc86be539940cf83f2a48` |
| `Inter-SemiBold.woff2` (600) | 114.812 B | `5cb7103e4e605989afebc03d989c79201e54b21b5183db33981f70db9178a301` |

## ⭐ EL RECORTE (10/09/2026) — de 340.428 B a 54,168 B

Los tres pesos viajan **subconjuntados**: se les han quitado los glifos que esta
aplicación no usa. Antes traían 2.852 codepoints cada uno —el latín entero, el
griego, el cirílico, cientos de símbolos—; ahora traen **291**.

| fichero | antes | ahora | recorte | sha256 (el de ahora) |
|---|---|---|---|---|
| `Inter-Regular.woff2` | 111.268 B | **17.696 B** | 84.1 % | `91ab3badd9860237efa4d6b6b6cb7a3bed2ece15f3ca2d4f4838767cc160ea35` |
| `Inter-Medium.woff2` | 114.348 B | **18.180 B** | 84.1 % | `b9bc1e5aee8988c112d024c393a2b17c5814d1c53de0cad900cf731c148272ad` |
| `Inter-SemiBold.woff2` | 114.812 B | **18.292 B** | 84.1 % | `05fd698eb348f6470b45bd0ead1634571591657bf4532b26cf226ec06549ba98` |
| **los tres** | **340.428 B** | **54,168 B** | **84.1 %** | |

### La receta, entera y repetible

Las tres líneas del entorno, con las versiones **fijadas** — «lo que pip diera
ese día» no es reproducible:

```bash
python -m venv <carpeta-fuera-del-repositorio>/entorno-fuentes
<carpeta>/entorno-fuentes/Scripts/python.exe -m pip install fonttools==4.64.0 brotli==1.2.0
```

⚠️ **El entorno vive FUERA del repositorio, y a propósito.** [DOC Python] `venv`
es el mecanismo estándar para instalar paquetes sin tocar el entorno del
usuario: un `pip install --user` contaminaría el `site-packages` compartido de
todos los proyectos de la máquina, que es lo contrario de la ley de
dependencias cero de esta casa. El entorno se borra con su carpeta y no deja
rastro.

Y el recorte, uno por peso:

```bash
RANGO='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190,U+2196-2197,U+21A9,U+21B0-21B1,U+2600,U+26A0'

for peso in Regular Medium SemiBold; do
  python -m fontTools.subset app/public/fuentes/Inter-$peso.woff2 \
    --output-file=app/public/fuentes/Inter-$peso.subset.woff2 \
    --unicodes="$RANGO" \
    --layout-features='kern,liga,calt,tnum' \
    --flavor=woff2
done
```

⚠️ **La entrada es el `.woff2` que ya estaba en el repositorio**, no el TTF de la
release. Es más honesto: ese fichero tiene su sha256 declarado arriba, así que
la cadena entera —zip oficial → woff2 → subconjunto— está sellada paso a paso.

### ⚠️ `--layout-features` NO es opcional: es la trampa documentada

Sin esa bandera, `pyftsubset` **poda las features de OpenType**, y `tnum` es una
de ellas: se llevaría por delante las **cifras tabulares** que la tanda 2 puso
en el `body` para que los minutos y los metros no bailen al actualizarse.
Verificado sobre los ficheros recortados, leyendo sus tablas `GSUB`/`GPOS`:

```
Regular   glifos   415 · codepoints  291 · tnum SÍ · kern sí · calt sí
Medium    glifos   415 · codepoints  291 · tnum SÍ · kern sí · calt sí
SemiBold  glifos   415 · codepoints  291 · tnum SÍ · kern sí · calt sí
```

ℹ️ `liga` se pidió y no aparece: Inter no define esa feature en el latino, sus
sustituciones van por `calt`. Se pide igual —cuesta nada y protege del día que
sí la haya—, y que no esté no es una pérdida.

### ⭐ El rango: el latino canónico **más los siete de esta app**

El `unicode-range` estándar de las Google Fonts latinas no bastaba, y eso **se
midió antes de recortar**: se barrió el texto visible de las plantillas y los
literales de los componentes, y se cruzó con el `cmap` de la fuente. Siete
codepoints del texto real caían fuera **y la fuente sí los traía**:

| | dónde vive |
|---|---|
| `U+2190` `←` | «← Volver al buscador» de `/creditos` |
| `U+2196` `↖` · `U+2197` `↗` · `U+21A9` `↩` · `U+21B0` `↰` · `U+21B1` `↱` | **las flechas de giro de las indicaciones** |
| `U+2600` `☀` | el conmutador de `/identidad` |
| `U+26A0` `⚠` | la nota de un paso |

Otros trece —`⇄ ⏳ ◉ ⚑ ⬎ ⬐ 🅿 🌙 🚌 🚏 🚲 …`— **Inter no los trae ya**: caen al
respaldo del sistema desde siempre, y el recorte no los cambia.

**La regla que queda: lo que la app usa no se rompe.** Si mañana entra un
carácter nuevo fuera del rango, se añade al rango y se dice.


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
