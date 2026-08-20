# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 20/08/2026.** El proyecto está en construcción. Hoy hay de terceros: las
> dependencias npm, la cartografía de OpenStreetMap que pide el mapa, y **catorce** conjuntos de
> datos —los portales, **el callejero de vías**, los carriles bici, los postes de autobús, las
> estaciones BiZi, los aparcabicis, los aparcamotos, el estacionamiento regulado, las zonas
> reguladas, **las reservas de espacio** y **los ejes de vía** del Ayuntamiento; el grafo de
> continuidad y **los nombres de vía** derivados de OSM; y el GTFS del Punto de Acceso Nacional—. Quedan fuera las capas municipales de tranvía;
> cada pieza llega con su autorización y su ficha.
>
> ⏳ **Uno de ellos caduca: el GTFS, el 05/10/2026** (§ 1.7).
>
> **Las huellas sha256 de esta página se verifican sobre un clon**, no sobre el disco de quien
> las escribe: git puede reescribir bytes al hacer *checkout*. Ver `docs/BITACORA.md` nº3, y el
> `.gitattributes` que lo impide.

---

## 1 · Datos de terceros

### 1.1 · OpenStreetMap — cartografía, **en uso desde hoy**

Desde que existe el mapa (punto 3 del plan), la aplicación **pide teselas a OpenStreetMap y las
enseña en pantalla**. Ya no es una declaración por adelantado: es una obligación viva.

| | |
|---|---|
| **Qué es** | Las teselas (imágenes) del mapa base, servidas por `tile.openstreetmap.org` |
| **Licencia** | **ODbL 1.0** |
| **Atribución exigida** | **Literal**: «© **colaboradores** de OpenStreetMap», con enlace a [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright). La palabra *«colaboradores»* **no es opcional** |
| **Dónde está cumplida** | En el control de atribución del propio mapa, `app/src/app/mapa.ts`. Renderizado real, copiado de la salida de una prueba: `© colaboradores de OpenStreetMap` |
| **¿Hay teselas en este repo?** | ❌ **NO.** Se piden en tiempo de ejecución, no se guardan ni se redistribuyen |

> ⚠️ **El ejemplo oficial de Leaflet NO cumple.** Su guía de inicio propone
> `&copy; <a href="...">OpenStreetMap</a>`, **sin la palabra «contributors»**. Copiarlo tal cual
> es incumplir la ODbL — es el mismo descuido que ya se pagó una vez en la casa. Aquí la cadena
> está escrita a mano, y hay una prueba (`app/src/app/mapa.spec.ts`) que falla si desaparece.

### 1.2 · Portales de Zaragoza — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **46.150 portales** del término municipal: código de vía, número, y coordenada (lat/lon). Es la base sobre la que el buscador resolverá «calle + número» |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS Urbanismo · `https://idezar-sig.zaragoza.es/servicios/geoserver/urbanismo/wfs` · capa `urbanismo:Portales` |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Dónde está cumplida** | En el control de atribución del mapa, junto a la de OpenStreetMap, **mientras la capa de portales está encendida** — que es cuando el dato se enseña |
| **Fecha del dato** | Generado el **2026-05-13T07:11:41.075Z** (conjunto `callejero-zaragoza` v1.0). CRS **EPSG:4326** |
| **Campos** | `portalId`, `codigoVia`, `numero`, `displayNumber`, `sortNumber`, `coordLat`, `coordLon`, `numeroPolicia`, y opcionales `calificacion`, `bloqueEscalera`, `letra`. **Ni un campo personal**: todo son componentes de dirección |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-05-13_zgzradar_callejero-portales-zaragoza.json`](app/data/2026-05-13_zgzradar_callejero-portales-zaragoza.json) · 10.835.605 bytes · sha256 `3c391d60cf91362c984ec2ac2e302f7eec2ce35d94deb42f6e42b678aef7cfdc` |

**Cómo llegó aquí, que no es una descarga.** No lo pidió este proyecto al WFS: es un **derivado**
producido por otro proyecto de la casa (*ZGZ RADAR REACT*), y entró en Desplázame **copiado tal
cual desde el archivo del intento anterior**, con autorización expresa y pieza a pieza. No se ha
editado, filtrado ni «limpiado»: el sha256 de la copia es idéntico al del origen.

**Avisos que el propio origen declara, y que se trasladan en vez de esconderse:**

- El WFS devolvió **239 features duplicadas en portales**, descartadas al generar.
- **`huerfanosReales = 29`**: portales sin vía que los reclame.
- ℹ️ **El metadato del proyecto de origen NO describe otro fichero: describe ÉSTE, con los
  saltos de línea en LF.** Declara `sha256 398ac652…` y 10.364.859 bytes, mientras que lo que
  hay aquí es `sha256 3c391d60…` y 10.835.605 bytes — pero **la diferencia es 470.746 bytes,
  que es exactamente el número de líneas del fichero**: un retorno de carro por línea.
  Convertido a LF sin tocar el contenido, da `398ac652…` y 10.364.859 bytes, **clavado**.
  **La huella válida sigue siendo la de este fichero** —es el que se consume— pero el metadato
  ajeno nunca estuvo equivocado.

  > ⚠️ **Rectificación (17/08/2026).** Hasta hoy este documento afirmaba que los metadatos
  > «describen OTRO fichero» y que «se reescribió después y nadie regeneró el metadato». **Era
  > falso.** La conclusión venía heredada de la ficha de procedencia del proyecto anterior y se
  > copió sin comprobarla; se destapó al medir los finales de línea por otro motivo. Se corrige
  > aquí en vez de borrarlo en silencio: un documento de licencias que se enmienda a sí mismo
  > sin decirlo vale menos que uno que lo dice.

**Cómo se vuelve a conseguir:** pidiendo la capa al WFS de Urbanismo — pero saldrá **otro**
fichero: el callejero municipal se refresca (política declarada: mensual). Lo que garantiza los
números de arriba es **este** fichero, no una consulta nueva.

### 1.3 · Callejero de vías — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | La tabla **código ↔ nombre** de las **3.359 vías** del término. Sin ella el censo de portales es mudo: el municipal trae `codigoVia` y **ni un nombre de calle**, así que no habría autocompletar posible |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS Urbanismo · capa `urbanismo:Vias`. **Es el hermano de los portales de § 1.2**: mismo conjunto `callejero-zaragoza` v1.0, mismo `generatedAt` **2026-05-13T07:11:41.075Z**, misma ficha de procedencia |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Dónde está cumplida** | Esta pieza **no se pinta** —es tabla, no capa—, así que no cuelga de ninguna capa del mapa. Su atribución es la de esta ficha, y la que acompañe a las sugerencias cuando el formulario las enseñe |
| **Campos** | `id`, `codigoVia`, `nombre`, `nombreCompleto`, `nombrePublico`, `nombrePublicoNorm`, `tipoVia`, `numPortales`, y en 739 vías `barrioRural`/`barrioRuralLabel`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ Sí, **con cinco correcciones declaradas** (abajo): [`app/data/2026-05-13_zgzradar_callejero-vias-zaragoza.json`](app/data/2026-05-13_zgzradar_callejero-vias-zaragoza.json) · 1.025.408 bytes · sha256 `5f5df76a32098e088ad4c92126e72a9e84835663647f9c4f47300232dc038104` **verificado sobre un clon**. Tal y como salió del origen era `9c7873679df0b94c7b27fa2f6cbaac84a0b610e64a06bfd725070df17d646ebc` y 1.025.210 bytes, la misma huella que su ficha de procedencia declaraba |

> ⚠️ **Este es el ÚNICO fichero de datos del repositorio que no está tal cual.** Lleva **cinco
> correcciones**, decididas expresamente y con la evidencia delante:
>
> | Vía | Decía | Dice | Por qué |
> |---|---|---|---|
> | `CALLE BARCELONA` (cod. 3564) | `---CRT` | `---CST` | Su propio `barrioRural` es **`CST`** y sus 20 portales tienen el centroide en **41,7238 · −1,0338**, dentro de Casetas |
> | `CALLE LA PARRA` (cod. 22340) | `---CRT` | `---CST` | Ídem: `barrioRural` = **`CST`**, y sus 11 portales en **41,7193 · −1,0282** |
> | `CALLE PARAÍSO` (cod. 22190) | sin barrio | `MRL` / `Miralbueno` | Lleva marcador `---MRL` y **no traía los campos de barrio**. Sus 37 portales están en **41,6603 · −0,9440**, junto a los de `CALLE MAYOR ---MRL`, que sí declara Miralbueno |
> | `CAMINO DEL CAIDERO` (cod. 5435) | sin barrio | `MRL` / `Miralbueno` | Ídem, sus 3 portales en **41,6593 · −0,9641** |
> | `JARDINES PORTAZGO SAN LAMBERTO` (cod. 23957) | sin barrio | `MRL` / `Miralbueno` | Ídem. ⚠️ **Esta no tiene portales**, así que no hay coordenadas que la confirmen: se completa **por el marcador y por coherencia con las otras tres `---MRL`**, no por evidencia geográfica propia |
>
> **Las dos primeras: el registro se contradecía a sí mismo.** El marcador del nombre decía
> `CRT` (La Cartuja, a 20 km al sureste) mientras el campo `barrioRural` del mismo registro
> decía `CST` y las coordenadas caían en Casetas. Dos evidencias contra una. Sin corregirlo,
> cualquiera que agrupase por marcador colocaría **31 portales** en el barrio equivocado. Se
> cambiaron **8 líneas** —los cuatro campos de nombre de cada vía: `nombre`, `nombreCompleto`,
> `nombrePublico` y `nombrePublicoNorm`—, ni una más.
>
> **Las tres siguientes: faltaban los campos, no estaban vacíos.** Se insertaron `barrioRural`
> y `barrioRuralLabel` (**+9 líneas, −3**), porque la pantalla enseña el núcleo entre
> paréntesis y sin ellos esas tres vías saldrían sin decir de dónde son. Después de esto,
> **ninguna de las 256 vías con marcador se queda sin barrio declarado**.

**Su huella de origen también coincide con el metadato ajeno**, y por lo mismo que en § 1.2:
el metadato declaraba `70d73b4321…` y 990.140 bytes, y este fichero tal como salió del origen
era `9c787367…` y 1.025.210 bytes — **35.070 bytes de diferencia, que son sus 35.070 líneas**.
Convertido a LF da `70d73b4321…` exacto. No eran dos ficheros: era el mismo con otros saltos.

**El cruce contra los portales municipales, que es la verificación de esta pieza** (no se pinta:
se cuenta). Medido con comando sobre los dos ficheros del repositorio:

| | |
|---|---|
| Vías en el callejero | **3.359** — *N* |
| **Vías con al menos un portal** | **2.731** — ***M*, la cifra que se publica** |
| Vías sin ningún portal | **628** |
| **Códigos de portal sin vía en el callejero** | **0** |

**Cero huérfanos en el sentido que importa**: los 46.150 portales tienen su vía. Y una
coherencia que merece decirse: el callejero declara en `numPortales` cuántos tiene cada vía, y
**cuadra con el recuento real en las 3.359, sin una sola excepción**.

> **Por qué se publica 2.731 y no 3.359.** El buscador solo sugiere vías **con portal**: sugerir
> una de las 628 sin portales sería ofrecer una dirección que después no se puede resolver. Los
> dos números están declarados en `/api/salud`, y el que sale a la pantalla es el cumplible.

**La suciedad del origen, trasladada y no corregida:**

- **Una sola vía con la vocal acentuada en minúscula**: `ANDADOR ABOGACíA TURNO DE OFICIO`
  (código 81). Es la misma familia de fallo que las 8 paradas del GTFS (§ 1.7). **No es
  sugerible**: no tiene portales, así que ni siquiera aparecerá.
- **256 vías arrastran marcadores internos** del tipo `---PÑF`, `---CST`, `---TRC`
  (`ANDADOR DEL CAIDERO ---PÑF`), y **231 de ellas sí son sugeribles**: saldrán así en las
  sugerencias, porque el nombre **se devuelve tal cual viene**. Maquillarlo sería editar el dato.

### 1.4 · Grafo de continuidad peatonal y ciclable — derivado de OpenStreetMap

| | |
|---|---|
| **Qué es** | La red por la que se podrá caminar y pedalear: **98.774 aristas** con su geometría propia (378.222 vértices) y **68.649 nodos** (que solo existen como contador y como extremos de arista) |
| **Origen del dato** | **OpenStreetMap**, vía Overpass. Cada arista conserva su etiqueta `highway` (`h`) y su **id de *way*** (`w`) de OSM — **pero ningún nombre: los nombres están en § 1.14**, y `w` es la clave que los cruza. Deriva de una descarga de Overpass registrada el **03/08/2026 08:20:58 GMT**; el propio grafo lleva sello `2026-08-03T08:19:51Z` |
| **Licencia** | **ODbL 1.0**, la misma que la cartografía de § 1.1, por ser un derivado de datos de OSM |
| **Atribución** | La exigida por la ODbL —«© **colaboradores** de OpenStreetMap»— **ya está cumplida** por el mapa base (§ 1.1), que está siempre encendido. La capa del grafo **no cuelga atribución propia**: sería la misma cadena repetida |
| **Zona** | bbox 41,4011–41,982 N · −1,2199–−0,6541 O — **más ancha que el término municipal**: trae calle de fuera de Zaragoza |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/grafo-visor.js`](app/data/grafo-visor.js) · 23.925.689 bytes · sha256 `d7d03aed71990d1ca5233955bff0940bda455422e6fd51dd755eb9c07f5cc717` |

**El fichero es un `.js`, y no se carga como script.** Es una sola línea, `window.GRAFO = {…};`,
que es como lo exportó el proyecto anterior. Se copió **byte a byte** —convertirlo a `.json`
habría sido editar el dato— y la aplicación lo pide con `fetch` **como texto** y le quita el
prefijo en memoria. En el repositorio no se toca, y el navegador nunca lo ejecuta.

**Dentro viajan tres cosas, y solo una se usa:**

| Parte | Peso | Qué se hace con ella |
|---|---|---|
| **El grafo** (`aristas`) | **16,5 MB** | **Se usa y se pinta.** Es lo que este dato aporta |
| **La auditoría del enganche portal→arista** (`portales`) | **5,9 MB** | **NO se usa hoy.** Son los mismos 46.150 portales de § 1.2 otra vez, pero pegados al grafo: distancia de enganche, vía heredada y concordancias, con sus contadores (**46.026 enganchados · 124 no**). Se conserva porque es exactamente eso, **la auditoría**: a cuánto cayó cada portal de la calzada y si el nombre de OSM concordaba con el municipal. **El enganche en sí no está aquí** —ni id de arista ni punto proyectado—: viajaba en un `enlaces.json` del proyecto anterior que **no está versionado en ninguna parte**, ni en esta rama ni en la archivada. Por eso el punto 7 **construye la proyección por su cuenta** |
| **La auditoría del intento anterior** | **0,2 MB** | **No se hereda como documentación** —`componentes` (170), `noConectados` (1.410), `puntasLejos` (488), `porDefecto` (114)—. Viaja porque el fichero es **indivisible sin editarlo**, y editarlo está prohibido |

> ⚠️ **Hay dos versiones de los portales en este repositorio**, y es a propósito: los
> municipales de § 1.2 (fuente, Ley 37/2007) y los enganchados de aquí (derivados, ODbL). No son
> el mismo dato ni tienen los mismos campos. Que convivan es una decisión tomada, no un descuido.

### 1.5 · Carriles bici y sendas ciclables — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | La red ciclable de la ciudad: **733 rasgos** (`MultiLineString`) que suman **2.120 tramos** y **333,5 km** medidos. Es la capa que hará distinto al modo BICI |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU2_carriles_bici`** · petición registrada el **04/08/2026 11:52:40 GMT** (`timeStamp` del propio WFS: `2026-08-04T11:52:40.217Z`). CRS **EPSG:4326** |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)**, la misma que los portales de § 1.2 |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Dónde está cumplida** | Colgada **de esta capa también**, no solo de la de portales: si se apagan los portales y se dejan los carriles, sigue habiendo dato municipal en pantalla y la atribución tiene que seguir ahí |
| **Fecha del dato** | Es la **capa viva** de movilidad, no una instantánea. El campo `fecha` viene poblado en **424 de los 733** rasgos; en los otros 309, **NO CONSTA** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-04_wfs_movilidad-MU2_carriles_bici.json`](app/data/2026-08-04_wfs_movilidad-MU2_carriles_bici.json) · 785.975 bytes · sha256 `65b356aa751fb4ec02c24dce43e8fbaf51ee350987c798142feabb6320ac3fd4` **verificado sobre un clon** |

**Lo que distingue esta capa, y por eso es la que entró:** clasifica cada tramo en `tipo_carri`,
y esa clasificación es justo la que el modo BICI necesitará —**por dónde se rueda**:

`Bidireccional calzada` 216 · `Bidireccional acera` 202 · `Calmado` 123 · `Unidireccional
calzada` 81 · `Senda ciclable` 58 · `Unidireccional acera` 44 · **`En Construcción` 7** ·
`Senda Ciclable` 1 · **`No Municipal` 1**

**Y lo que el dato declara de honesto, que se traslada en vez de callarse:**

- **7 tramos «En Construcción»**: hay carril dibujado donde todavía no se puede rodar. Quien los
  pinte o los enrute sin mirar ese campo estará prometiendo un carril que no existe.
- **1 tramo «No Municipal»**: no lo mantiene el Ayuntamiento, y la capa lo dice.
- `Senda ciclable` aparece **dos veces con distinta capitalización** (58 + 1). Es del origen; no
  se corrige aquí porque el dato se copia tal cual.
- **343 de 733 rasgos traen `observaciones`** en texto libre.

**Enlaza con el callejero.** Los 733 rasgos traen `vias_codigo` (ninguno vacío): **255 códigos
distintos, de los que 207 (81%) están también en el `codigoVia` de los portales** de § 1.2. Es
el mismo espacio de códigos, lo que permitirá cruzarlos sin inventar correspondencias.

> ℹ️ **Había un segundo candidato y NO entró:** `idezar_base:carril_bizi_20250127` (700 rasgos,
> 322,1 km), descargado el mismo día del mismo servidor. Es una **instantánea congelada** —la
> fecha va en el nombre de la capa— y sus atributos colapsan la distinción calzada/acera que
> aquí es lo útil. Se queda en el archivo del intento anterior.

### 1.6 · Postes de autobús urbano — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **944 postes** de autobús urbano del catálogo municipal: `codigo`, `stop_name` y `stop_code`, con su coordenada. Son el dónde se sube y se baja del modo BUS |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU3_paradas_bus_unicas`** · petición registrada el **10/08/2026 09:48:39 GMT** (`timeStamp` del propio WFS: `2026-08-10T09:48:39.236Z`). CRS **EPSG:4326**, geometría `Point` |
| **Licencia** | **Ley 37/2007**, la misma que los portales (§ 1.2) y los carriles (§ 1.5) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `codigo`, `stop_name`, `stop_code` — los tres en los 944, y **ninguno personal**. 944 `stop_code` únicos, cero rasgos sin coordenada, 921 nombres distintos (los repetidos son postes enfrentados) |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json`](app/data/2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json) · 226.540 bytes · sha256 `f335b56d586a387bfd592abfa32d0536cc1bb1b8c3a2520d6cf68e0e05d43bad` **verificado sobre un clon** |

> ⚠️ **Este fichero NO trae las líneas que pasan por cada poste.** Tiene tres campos y ninguno
> es de líneas. No es un recorte: **no existen como fichero** en ningún sitio del que este
> proyecto pueda copiarlas hoy. Queda anotado como **dependencia pendiente**.

**Dónde viven las líneas, para cuando toque:** en el **GTFS** —pieza propia todavía por
autorizar en este mismo punto 4— y en el **barrido nocturno contra el operador**, que es el
patrón ya construido y probado en ZetaBus y que aquí corresponde al punto 8. El puente entre
unos y otros es el **`stop_code`**: el espacio de códigos `PA…` (p. ej. `PA00010`) es el mismo
que usan el catálogo municipal y los artefactos del intento anterior, así que se podrán cruzar
sin inventar correspondencias.

**Dos censos de la misma cosa, y los dos legítimos.** El proyecto anterior manejaba **~934**
postes; aquí hay **944**. No es una discrepancia que haya que resolver: son **censos
distintos**. Los ~934 salían del cruce GTFS + barrido del operador —lo que el operador
*anuncia*—; los 944 son lo que el Ayuntamiento *tiene inventariado*. Un poste fuera de
servicio, o de refuerzo, está en uno y no en el otro. Ninguno de los dos números está mal.

> ℹ️ **NO CONSTA por qué la OLD no lo adoptó como fuente.** Este fichero vivía en
> `data/exploracion/` y no en `data/fuentes/`, que en aquel proyecto marcaba «mirado, no
> adoptado». Puede que lo descartara a favor del GTFS o del barrido; no se ha averiguado, y no
> se infiere.

### 1.7 · GTFS del transporte urbano — Punto de Acceso Nacional (ficha 1176)

> ## ⏳ ESTE DATO CADUCA EL **05/10/2026**
> Lo declara el propio feed: `feed_info.feed_end_date = 20261005`. Es una **instantánea
> autorizada**, no una fuente viva. Pasada esa fecha, lo que hay aquí describe una red que ya
> no está vigente, y **nada en el repositorio lo va a avisar solo**.

| | |
|---|---|
| **Qué es** | El feed GTFS del transporte urbano de Zaragoza: líneas, viajes, orden de paradas, calendario y **trazados**. Es donde viven las líneas que § 1.6 dejó anotadas como dependencia |
| **Titular** | **Avanza Zaragoza S.A.U** (publicador del feed) |
| **Canal** | **Punto de Acceso Nacional** · Ministerio de Transportes y Movilidad Sostenible · **ficha 1176** · `https://nap.transportes.gob.es/api/Fichero/download/1176` |
| **Descarga** | **10/08/2026 09:44:51 GMT**, estado 200. Las cabeceras de la respuesta declaran `sha256 5c96992c…` y `content-length 6883311`: **las dos cuadran** con el fichero que hay aquí |
| **`feed_version`** | `20260623_AUZSA_Y_TRANVIA` · vigencia declarada **23/06/2026 → 05/10/2026** |
| **Agencias** | **Dos**: `1` Avanza Zaragoza S.A.U. y `11` **Tranvías Urbanos de Zaragoza S.L.** El tranvía viene dentro |
| **Licencia** | **Licencia de datos abiertos del MITMS.** Permite redistribuir: *«Compartir (copiar, distribuir) los datos […] obtenidos del MITRAMS»*, incluida *«modificación, adaptación, extracción, reordenación y combinación»* |
| **Atribución exigida** | *«Powered by MITRAMS»* con enlace a `https://www.transportes.gob.es/`, cita del MITMS como fuente, e **indicación de si el dato es bruto o procesado** |
| **Dónde está cumplida** | Colgada de la capa de trazados: *«Trazados: GTFS de Avanza Zaragoza S.A.U. (dato bruto) · Powered by MITRAMS»* |
| **¿Está en este repo?** | ✅ **Sí, el ZIP entero tal cual**: [`app/data/2026-08-10_nap_gtfs-ficha1176.zip`](app/data/2026-08-10_nap_gtfs-ficha1176.zip) · 6.883.311 bytes · sha256 `5c96992c97aac966bc9bc20babfbbbffb312f2a3cbcf9dd543982d2674cf3a82` **verificado sobre un clon** |

**Y dos copias de trabajo extraídas, solo dos**, porque el navegador no abre ZIP sin una
dependencia nueva y no la hay:

| Miembro extraído | Bytes | sha256 | Para qué |
|---|---|---|---|
| [`…_shapes.txt`](app/data/2026-08-10_nap_gtfs-ficha1176_shapes.txt) | 1.408.077 | `f38397d36c98fb756b2ee5a3ca261fbfc712aea2e51903d51b7c9b4fddb18157` | Los 89 trazados que se pintan |
| [`…_stops.txt`](app/data/2026-08-10_nap_gtfs-ficha1176_stops.txt) | 99.309 | `6d1a969ab25d7be41ffb9b8184589865407be671fd52fadc50206aa3917c957b` | **Las 50 paradas del tranvía**, que no están en ninguna otra fuente del repositorio: el MU3 municipal (§ 1.6) es solo bus. De sus 984 paradas se pintan **solo esas 50**; las 934 `PA…` de bus no, porque para eso manda el censo municipal |

**Extraer no es editar**: en los dos casos el hash del fichero en disco es idéntico al del miembro
dentro del archivo, comprobado con `unzip -p … | sha256sum` antes y después.

**`stop_times.txt` (47 MB) NO se extrae**: no hace falta para pintar y sería peso muerto rozando
los límites de GitHub.

> ⚠️ **Divergencia declarada.** Ni el proyecto anterior ni ZetaBus subieron este ZIP: los dos lo
> ignoraban a propósito, y por el mismo motivo — *«caduca, y una copia versionada se pudre en
> silencio mientras alguien construye contra ella»*. **Aquí sí entra**, por decisión expresa y
> con la caducidad escrita arriba en grande. Este proyecto trata los datos como **instantáneas
> autorizadas**; el dato fresco llegará por su vía en el punto 8.

**Recuentos re-verificados aquí, con comandos sobre este ZIP** (no heredados):

| | Medido |
|---|---|
| Ficheros en el archivo | **8** (`agency`, `calendar_dates`, `feed_info`, `routes`, `shapes`, `stops`, `stop_times`, `trips`) |
| `stops` | **984** = **934** con `stop_code` `PA…` + **50** con código de cuatro cifras (`0101`, `0201`…) |
| `routes` | **53** = **52** de la agencia 1 (bus) + **1** de la agencia 11 (tranvía) |
| `trips` | **34.427**, y **los 34.427 traen `shape_id`** |
| `shapes` | **89 trazados**, **27.603 puntos** |
| Huérfanos | **0** en los dos sentidos: ningún viaje apunta a un trazado inexistente, ningún trazado se queda sin usar |
| `calendar_dates` | 27.161 filas, **todas `exception_type=1`** (servicio añadido). Cero supresiones |

**Las dos minas conocidas, confirmadas con el dato delante:**

- **El puente `PA…` miente sobre el tranvía.** El `stop_code` `PA…` es lo que permite cruzar
  este feed con los postes municipales de § 1.6 — pero **solo lo tienen 934 de los 984**. Los
  **50 del tranvía usan otro espacio de códigos** (`0101`, `0201`, …). Quien cruce por `PA…`
  creyendo que cubre la red entera perderá el tranvía **sin que nada falle**.
- **Suciedad de codificación que viaja tal cual.** El origen no pone en mayúscula las vocales
  acentuadas: **8 nombres** salen mal — «Miguel **á**ngel Blanco N.º 53», «Nuestra Señora De Los
  **á**ngeles», «Ies **í**taca», «Marcelino **á**lvarez». No se corrige: el dato se copia tal cual.

> ⚠️ **Y una tercera que salió al re-verificar, que no venía heredada: el feed se contradice
> consigo mismo.** Declara `feed_end_date = 20261005`, pero su `calendar_dates` tiene servicio
> hasta el **31/12/2026**. Son casi tres meses de servicio declarado más allá de la validez que
> el propio feed se da. **Aquí se toma la fecha conservadora, la del publicador: 05/10/2026.**

### 1.8 · Estaciones BiZi — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Las **276 estaciones** del servicio público de bicicleta BiZi: posición, nombre, situación, **capacidad** (`anclajes_bicicletas`), tipo de pavimento y tipología. Es el dónde se coge y se deja una bici sin tenerla |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_estaciones_bici_ubicacion`** · descargada el **02/08/2026 10:10 GMT** (los `timeStamp` de las seis páginas van de las 10:10:20 a las 10:10:28). CRS **EPSG:4326**, geometría `Point` |
| **Licencia** | **Ley 37/2007**, la misma que portales (§ 1.2), carriles (§ 1.5) y postes (§ 1.6) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `numero`, `nombre`, `situacion`, `pavimento`, `coord_x`/`coord_y` (UTM), `fase`, `anclajes_bicicletas`, `junta_municipal`, `poligono`, `tipologia`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual, en sus seis páginas** (ver abajo) |

**Entra repartido en seis ficheros, y es a propósito.** El WFS lo sirvió **paginado de 50 en
50**, y así se descargó. Juntarlos en uno sería fabricar un fichero que nadie publicó — es
derivar, no copiar. Entran los seis tal cual y es la aplicación la que los une al leerlos:

| Página | Rasgos | Bytes | sha256 (verificado sobre un clon) |
|---|---|---|---|
| `…_pag0.json` | 50 | 21.848 | `7c26bc5679317044463335bf25a153cbaffed80aaaf30db75556caadbc6ac8a2` |
| `…_pag50.json` | 50 | 22.217 | `82633663b9c6abf68d7f517e34b1fefa459de30c8c03bfb91f8b0d75a36be98e` |
| `…_pag100.json` | 50 | 22.220 | `aeeb1448c9bfd7afca751c2c346af682933f988dc649a0e7005537cb656429bf` |
| `…_pag150.json` | 50 | 22.357 | `aeebdae28754910e2e57fd0b80c26a887a7340deeb118b1cb6772b9c389f5e23` |
| `…_pag200.json` | 50 | 22.483 | `215d8662231ab834733b7e1e4037dcef3e4ee0e0316efcbad504474e2cb9a368` |
| `…_pag250.json` | **26** | 11.786 | `61a54580f28d9cc94d6c48cbe609c2f49da7b4d9ee7134aeb9b0edff16e8c7ef` |
| **Total** | **276** | | Las seis declaran `totalFeatures: 276` |

**Comprobado que son el conjunto completo, no una muestra**: 276 rasgos sumados, **276 `id`
distintos y 276 números de estación distintos** — sin solapes ni huecos—, cero sin coordenada,
5.520 anclajes en total.

> ⚠️ **Hay una segunda fuente de estaciones en el archivo del intento anterior, y NO entra: la
> API de zaragoza.es**, que sirve **dato vivo** (`bicisDisponibles`, `anclajesDisponibles`,
> `estado`, `lastUpdated`). Eso no es esta pieza: la disponibilidad en tiempo real es otra cosa,
> de otra vía y de otro punto del plan. Aquí entra **el inventario**, que no caduca cada minuto.
>
> Y de paso, un aviso sobre esa API por si algún día se usa: **se contradice dentro del mismo
> rasgo**. En la estación «193- Pza. La Ermita» convivían `estado: "IN_SERVICE"`, un
> `estadoEstacion` que apunta a la URI **`…/no-operativa`**, y una descripción que dice
> «Estado: **Operativa**». Tres afirmaciones, y al menos dos no pueden ser ciertas a la vez.

> ℹ️ **Estos seis ficheros no traen `_cabeceras.txt`**, al contrario que los carriles o el GTFS.
> La procedencia se sostiene en lo que declara el propio dato: el `id` de cada rasgo
> (`MU1_estaciones_bici_ubicacion.N`), el `timeStamp` del WFS en cada página y el `crs`. **Del
> URL exacto de la petición: NO CONSTA.**

### 1.9 · Aparcabicis — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **2.158 aparcabicis** públicos: soportes donde dejar la bici propia, con su tipo, su vía y su número de anclajes. Completa el modo BICI por el otro lado — las estaciones de § 1.8 son la bici pública; esto es dónde dejar la tuya |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU2_aparcabicis`** |
| **Petición** | **Ésta la hicimos nosotros**, y por eso el URL sí consta: `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU2_aparcabicis&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **17/08/2026 12:34:30 GMT**, estado 200. Cabeceras completas guardadas en [`…_cabeceras.txt`](app/data/2026-08-17_wfs_movilidad-MU2_aparcabicis_cabeceras.txt) · `timeStamp` del WFS: `2026-08-17T12:34:31.537Z` · CRS **EPSG:4326**, geometría `Point` |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `tipo_aparcamiento`, `tipo_estacion`, `n_estacion`, `n_aparcamiento`, `anclajes`, `tipo_via`, `nombre_reducido`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-17_wfs_movilidad-MU2_aparcabicis.json`](app/data/2026-08-17_wfs_movilidad-MU2_aparcabicis.json) · 695.754 bytes · sha256 `777036273a0227e34b3af7c7c97d44f4a46e2138a0f231c60e52475577675710` **verificado sobre un clon** |

**Es la primera pieza que descargamos nosotros**, no heredada del intento anterior. Por eso la
procedencia la generamos aquí, con el mismo patrón que las heredadas traían de fábrica: el URL
de la petición y las cabeceras de la respuesta, en un fichero hermano.

> 🔒 **Norma, desde hoy: las cabeceras de descargas propias se guardan SIN `Set-Cookie`.** El
> servidor emite un identificador de sesión hasta en una petición anónima de dato abierto, y un
> repositorio público no es sitio para un token — commiteado una vez, se queda en la historia
> para siempre. En su lugar va una línea que declara la omisión, para que se vea que se filtró y
> no que faltaba. **Las cabeceras de las piezas heredadas no se tocan**: las generó el proyecto
> anterior y son su registro, no el nuestro.

**Vino completa de una vez**: `numberMatched` = `numberReturned` = **2.158**, sin paginar. Todos
los rasgos con geometría, dentro del término (41,60–41,76 N · −1,04–−0,77 O). **14.544 anclajes**
en total.

**Lo que el dato declara de honesto, y se traslada:**

- **`tipo_aparcamiento`** distingue lo que existe de lo que no: `Abierto` 1.906 · `Cerrado` 238 ·
  `Vigilado` 8 · **`Proyecto` 4** · **`Sin servicio` 2**. **Seis de los 2.158 no se pueden usar
  hoy**: cuatro están proyectados y dos fuera de servicio. Quien los pinte o los enrute sin mirar
  ese campo ofrecerá aparcabicis que no existen — es la misma trampa que los 7 tramos «En
  Construcción» de § 1.5.
- **`tipo_estacion`** trae 17 tipos de soporte (`Individuales U` 1.003, `Bicis y Vmp en calzada`
  833, `Módulo  U en bastidor` 123…) — con **dobles espacios** en algunos nombres, del origen.
- **`anclajes`** va de **0 a 110**, y **un rasgo no lo trae**.
- **`nombre_reducido`** arrastra marcadores internos del callejero municipal en **36 de los
  2.158**: valores como `"LOGROÑO  ---CST"`. No se corrige: el dato se copia tal cual.

### 1.10 · Aparcamotos — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **2.146 aparcamotos** públicos: los reservados donde dejar la moto, con su vía, su portal y cuántas plazas tiene cada uno — **11.715 plazas** en total. Es el equivalente de § 1.9 para el otro vehículo de dos ruedas: las motos ruedan como el coche pero aparcan en lo suyo |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU2_motos`** |
| **Petición** | **Ésta la hicimos nosotros**, y por eso el URL sí consta: `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU2_motos&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **18/08/2026 12:04:45 GMT**, estado 200. Cabeceras completas guardadas en [`…_cabeceras.txt`](app/data/2026-08-18_wfs_movilidad-MU2_motos_cabeceras.txt), sin `Set-Cookie` (norma de § 1.9) · `timeStamp` del WFS: `2026-08-18T12:04:45.494Z` · CRS **EPSG:4326**, geometría `Point`. ⚠️ El `content-length: 64811` de esas cabeceras es el del cuerpo **comprimido** (`content-encoding: gzip`), no el del fichero: el tamaño real es el de la fila de abajo |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal. La capa no declara condiciones propias: no trae `MetadataURL`, y el servicio va con `Fees: NONE` y `AccessConstraints: NONE` |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `Nombre_calle`, `Tipo_via`, `Portal`, `Codigo_calle`, `Poligono`, `Numero_plazas`, `Fecha_instalacion`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-18_wfs_movilidad-MU2_motos.json`](app/data/2026-08-18_wfs_movilidad-MU2_motos.json) · 625.297 bytes · sha256 `8a0b4727b85fc7e2aa310641d9a3f7fcb56ba20a87ff3d464cb08e856c56a00b` **verificado sobre un clon** |

**Vino completa de una vez**: `numberMatched` = `numberReturned` = **2.146**, sin paginar. Los
2.146 con geometría —ni uno sin coordenada—, dentro del término (41,604–41,720 N ·
−1,031–−0,822 O). Plazas: mínimo 1, mediana 5, máximo 74.

**⚠️ Frescura: `NO CONSTA`.** El WFS no publica cuándo se actualizó la capa —sin `MetadataURL`,
sin fecha de revisión—, así que **la única marca temporal fiable de esta pieza es la fecha de
descarga** de arriba. Lo único que se puede afirmar es una cota inferior: el censo contiene una
instalación fechada el 01/12/2025, así que no es anterior a esa fecha.

#### Se eligió el WFS, y no la API, con la discrepancia medida

El Ayuntamiento publica los aparcamotos **por dos puertas que no coinciden**: esta capa
(**2.146 / 11.715 plazas**) y el servicio REST `…/equipamiento/aparcamiento-moto.json`
(**2.115 / 11.543**). No hay identificador común —los del WFS son correlativos de GeoServer y
los de la API son ids de tabla con 136 huecos—, así que se casaron por **vecino más próximo,
uno a uno**; donde casan, **la coordenada es idéntica**: es el mismo dato de origen saliendo por
dos sitios. La diferencia se reparte así, y suma exacto:

- **32 solo en el WFS.** Su firma los delata como una **tanda de altas**: el 94 % trae
  `Fecha_instalacion` (31 de ellas de 2024) y el 91 % trae `Poligono`, un campo que en el resto
  del censo casi nadie lleva. Publicados y ubicados en el WFS; la API todavía no los volcó.
- **1 solo en la API**: MANUEL LASALA F 44, 2 plazas, id 1198. **El WFS no es un superconjunto**:
  ese lo quitó y la API lo conserva.
- **7 soportes movidos** entre 1,2 y 14,9 m. La posición corregida la lleva el WFS en los siete.
- **Plazas: cuadre exacto.** Cero soportes con plazas distintas en la misma posición; las 172 de
  diferencia son enteras de los huérfanos.

Con eso delante, **la decisión fue quedarse con el WFS**: va por delante añadiendo (32 contra 1),
sus altas son recientes y suyas son las correcciones de posición.

> ⚠️ **Y hay un tercer número.** La serie estadística municipal
> `datos-movilidad/plazas-estacionamiento-por-tipo` declara **8.644 plazas de moto** en el mes de
> esta descarga, frente a las 11.715 de aquí. Son tres fuentes municipales contando lo mismo de
> tres maneras, y **esta ficha declara la cifra de SU fuente** — la del fichero que está en el
> repositorio. Ni se promedian, ni se corrigen, ni se esconde que no cuadran.

#### Lo que el dato trae de honesto, y de roto

- **⭐ Viene enganchado al callejero.** A diferencia de los aparcabicis, trae `Codigo_calle` y
  `Portal`: **821 de sus 823 códigos de vía casan** con el callejero de § 1.3, y cubren 2.140 de
  los 2.146 registros. Los **2 códigos huérfanos** (25000 y 9740) son exactamente los **6
  registros que el propio origen deja sin `Nombre_calle`**: un agujero suyo, coherente consigo
  mismo. Ese enganche **todavía no se usa para nada**; viaja en el dato para el día del modo
  coche/moto.
- **`Fecha_instalacion` solo en 616 de los 2.146** (el 29 %): 2020 → 111, 2021 → 261, 2022 → 65,
  2023 → 93, 2024 → 84, 2025 → 1.
- **🐞 Una fecha imposible, que viaja tal cual**: el aparcamoto de **AV TENOR FLETA 134** declara
  `Fecha_instalacion = 0203-10-20`. Un 2023 mal tecleado, con toda probabilidad — pero eso es una
  conjetura, no un dato. **No se corrige**: el fichero se copia como vino, y el defecto se
  declara aquí. Quien ordene por esa columna se lo encontrará el primero.
- **`Poligono` solo en 33 de los 2.146** (el 1,5 %), y **30 de esos 33 son de 2024**: es el
  campo que delata la tanda de altas de arriba.
- **`Portal`** trae `"S/N"` cuando no hay número, que es literal del origen.

### 1.11 · Estacionamiento regulado en superficie — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **7.391 tramos de bordillo** del censo de estacionamiento en calzada, con cuántas plazas tiene cada uno y de qué clase son — **55.572 plazas**. Es la respuesta a «dónde se paga por aparcar»: **1.159 de esos tramos** son zona regulada, y los otros 6.232 son bordillo libre |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_estacionamientos_calle`** |
| **Petición** | **Ésta la hicimos nosotros**: `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU1_estacionamientos_calle&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **18/08/2026 12:26:53 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-18_wfs_movilidad-MU1_estacionamientos_calle_cabeceras.txt), sin `Set-Cookie` · `timeStamp` del WFS: `2026-08-18T12:26:53.933Z` · CRS **EPSG:4326**, geometría `MultiLineString`. ⚠️ El `content-length: 367269` es el del cuerpo **comprimido** (`content-encoding: gzip`), no el del fichero |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal. La capa no declara condiciones propias: sin `MetadataURL`, y el servicio con `Fees: NONE` y `AccessConstraints: NONE` |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `tipo_actual`, `direccion`, `portal`, `forma_estacionar`, `longitud`, `plazas`, `zona_reguladora`, `distrito`, `codigo`, `tipo_via`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json`](app/data/2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json) · 3.178.840 bytes · sha256 `f45f394b2d2190e676ae7bea0fd74856d1fbbcb235a2b1579126e4a6cb8a467d` **verificado sobre un clon** |

**Vino completa de una vez**: `numberMatched` = `numberReturned` = **7.391**, sin paginar. Los
7.391 con geometría, y cada `MultiLineString` trae **exactamente una parte** — 16.763 vértices en
total, unos 2,3 por tramo: son bordillos rectos, no trazados sinuosos.

El desglose que importa, por **`tipo_actual`**:

| `tipo_actual` | Tramos | Plazas | Qué es |
|---|---|---|---|
| `LIBRE` | 6.204 | 49.222 | bordillo sin regular |
| **`ESRO`** | **664** | **3.507** | **regulado de rotación** — la zona azul |
| **`ESRE`** | **495** | **2.617** | **regulado de residentes** |
| `null` | 28 | 226 | sin clasificar |
| | **7.391** | **55.572** | |

Y `forma_estacionar`: `CORDON` 5.824 · `BATERIA` 1.533 · **`null` 34**.

> 🚨 **LA TRAMPA, y es gorda: `zona_reguladora` NO significa «está regulado».** Es un perímetro
> **geográfico**, y lo llevan tramos que no se pagan. Medido sobre este fichero:
>
> ```
> LIBRE con zona_reguladora > 0 ....... 5.049
> LIBRE con zona_reguladora 0 o nula .. 1.155
> ESRO con zona_reguladora > 0 ........   664   (todos)
> ESRE con zona_reguladora > 0 ........   494   (uno se queda sin ella)
> ```
>
> **Quien filtre por `zona_reguladora` se lleva 5.049 bordillos gratuitos pintados como de
> pago.** El único campo que dice si se paga es **`tipo_actual`**.
>
> Cruzados los números de zona contra la capa de polígonos (`MU1_zonas_reguladas`, que desde hoy
> está en el repositorio: § 1.12), el reparto sale limpio — los **13 polígonos publicados son
> exactamente las zonas 1 a 13**, y son exactamente las que cobran:
>
> ```
> zonas 1..13, CON polígono ....... 3.346 tramos · 1.157 de pago
> 19 zonas SIN polígono ........... 2.860 tramos ·     0 de pago   (14,15,16,18,21,22,25,26,27,
> zona 0 (el centinela «sin zona»)  1.125 tramos ·     0 de pago    29,32,33,34,37,39,40,43,46,47)
> zona 65 y zona nula ................. 60 tramos ·     2 de pago  ← los dos raros
> ```
>
> Los **dos únicos tramos de pago sin perímetro publicado** no parecen zonas fantasma sino
> registros a medio rellenar: un `ESRO` de zona **65** en CALLE SAN VICENTE MARTIR 11 —valor único
> en todo el censo, en pleno Centro, con `tipo_via` y `codigo` nulos— y un `ESRE` en CAMINO DE LA
> MOSQUETERA que viene **vacío de todo**: sin zona, sin plazas, sin forma, sin distrito, sin
> código y con el portal literal `"NUL"`.

> ⏳ **Este dato va a caducar de golpe, no despacio.** El Ayuntamiento prepara una **ampliación
> de la zona azul/naranja**; el día que se active, el reparto `LIBRE`/`ESRO`/`ESRE` cambia de
> golpe para miles de tramos. **Hipótesis declarada, no dato**: que `zona_reguladora` marque ya
> perímetros donde hoy todo es `LIBRE` encaja con que el campo describa lo previsto y no lo
> vigente — pero eso es una lectura nuestra, y el WFS no dice nada al respecto. Lo que sí es
> firme: **la fecha de descarga de esta ficha es lo único que fecha este reparto**, y a partir de
> la ampliación habrá que volver a bajarlo.

**⚠️ Frescura: `NO CONSTA`.** Como en § 1.10: el WFS no publica cuándo se actualizó la capa. La
fecha de descarga es la única marca.

**Y la cifra de SU fuente.** Aquí se censan **55.572 plazas**, de las cuales 6.124 reguladas
(3.507 + 2.617). La serie estadística municipal `datos-movilidad/plazas-estacionamiento-por-tipo`
declara para el mismo mes **6.794** de superficie regulada y **31.676** de superficie libre,
contra las 49.222 de aquí. **Esta ficha declara la cifra de su fuente** — la del fichero que está
en el repositorio—, como en § 1.10. Ni se promedian, ni se corrigen.

**`distrito` viene sucio, y se copia sucio.** El campo tiene **31 valores distintos para 10
distritos**: mayúsculas mezcladas, acentos inconsistentes y erratas del origen.

```
Centro 599 · CENTRO 31              Delicias 1432 · DELICIAS 21
Casco Historico 285 · Casco Histórico 5 · CASCO HISTORICO 1 · CASCO HISTÓRICO 3 · CASCO HISTÓRICI 1
El Rabal 1134 · EL Rabal 1 · El RAbal 1 · El rabal 1 · El Arrabal 1
Universidad 647 · UNIVERSIDAD 4 · INIVERSIDAD 1
Torrero-La Paz 711 · Torrero-La paz 1 · Torrer-La Paz 1 · Torrero 1
Las Fuentes 622 · LAs Fuentes 1 · La Fuentes 1
San Jose 777 · SAN JOSÉ 4            Actur-Rey Fernando 672 · Actur-Rey FErnando 4
La Almozara 398 · La ALmozara 2      null 28
```

**No se normaliza**: el fichero se copia como vino. Quien agrupe por distrito sin unificar antes
contará «Centro» dos veces y perderá un «CASCO HISTÓRICI» por el camino.

**Lo que la aplicación pinta, y lo que no.** El visor y el buscador pintan **solo los 1.159
tramos `ESRO` y `ESRE`** —azul los primeros, naranja los segundos, una sola casilla—. Los 6.204
`LIBRE` y los 28 sin clasificar **no se pintan**: no son regulado, y pintarlos contestaría otra
pregunta. Están en el fichero igualmente, y hay una prueba
(`app/src/app/capas.spec.ts`) que se pone roja si alguien los cuela.

Y de este mismo fichero sale una **segunda vista, de cotejo y temporal**: los **2.860 tramos
`LIBRE` de las 19 zonas sin polígono** (21.268 plazas), en morado y discontinua, con la casilla
«¿Ampliación? zonas sin activar». **No es otro dato ni otra descarga**: es otra lectura de estas
mismas 7.391 filas. Existe para cotejarla contra los planos de la ampliación, y **se retira o se
consolida cuando ese cotejo diga** — el signo de interrogación del nombre es literal.

### 1.12 · Zonas reguladas — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **13 perímetros** de zona de estacionamiento regulado: la mancha dentro de la cual vive cada bordillo de pago de § 1.11 |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_zonas_reguladas`** |
| **Petición** | **Ésta la hicimos nosotros**: `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU1_zonas_reguladas&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **18/08/2026 13:21:04 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-18_wfs_movilidad-MU1_zonas_reguladas_cabeceras.txt), sin `Set-Cookie` · `timeStamp` del WFS: `2026-08-18T13:21:04.074Z` · CRS **EPSG:4326**, geometría `MultiPolygon`. El `content-length: 10699` es el del cuerpo **comprimido** (`gzip`) |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal. Sin `MetadataURL`; el servicio con `Fees: NONE` y `AccessConstraints: NONE` |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `fid`, `NUMERO_ZONA`, `NOMBRE_ZONA`, `TAMAÑO`, `PERIMETRO`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-18_wfs_movilidad-MU1_zonas_reguladas.json`](app/data/2026-08-18_wfs_movilidad-MU1_zonas_reguladas.json) · 27.079 bytes · sha256 `db6fba882b7135dc0469f75172288793be8746b9848602e4f0bc7989bcd50b08` **verificado sobre un clon** |

`numberMatched` = `numberReturned` = **13**. Los 13 con geometría, **un polígono y un anillo cada
uno** —ni islas ni huecos—, 920 vértices en total, dentro de un recuadro de 41,640–41,659 N ·
−0,906–−0,871 O: la almendra central y poco más.

**`NUMERO_ZONA` va del 1 al 13 sin huecos.** Ojo, porque el `fid` **no coincide** con el número:
el WFS las sirve por `fid` y así la Zona 1 llega la segunda y la Zona 11 la última. Quien las lea
por orden de llegada se equivocará de zona.

#### Qué resuelven estos 13 polígonos, y qué no

Cruzados contra los 7.391 tramos de § 1.11, el reparto es sorprendentemente limpio: **los 13
polígonos publicados son exactamente las 13 zonas que cobran**.

| | Zonas | Tramos | De pago |
|---|---|---|---|
| **Con polígono** (1…13) | 13 | 3.346 | **1.157** |
| Sin polígono, numeradas | 19 | 2.860 | **0** |
| `zona 0` (centinela «sin zona») | — | 1.125 | 0 |
| zona 65 y zona nula | — | 60 | 2 |

**Resuelven 1.157 de los 1.159 tramos de pago: el 99,83 %.** Los dos que faltan son los dos
registros a medio rellenar que § 1.11 describe con nombre.

**Lo que NO resuelven son las 19 zonas numeradas sin polígono** —14, 15, 16, 18, 21, 22, 25, 26,
27, 29, 32, 33, 34, 37, 39, 40, 43, 46 y 47—, que no cobran ni un tramo. Ésas son las de la
**vista de cotejo** de § 1.11, la de la posible ampliación: existen como número en el censo de
bordillos, pero **su perímetro no está publicado**. Que la numeración tenga huecos y llegue al 65
mientras solo hay 13 polígonos es coherente con eso: **no es una serie 1…N, es un catálogo con
sitio reservado**.

#### 🐞 Dos defectos del dato, declarados y NO corregidos

**1 · La Zona 11 está rota en tres sitios a la vez.** Es la única fila que se sale del patrón, y
se sale por todo:

```
NOMBRE_ZONA .... "11"   (las otras doce: "Zona 1" … "Zona 13")
TAMAÑO ......... 0      (las otras doce: de 134.782 a 445.241)
PERIMETRO ...... 0      (las otras doce: de 810 a 2.683)
vértices ....... 7      (las otras doce: de 11 a 138)
```

**Pero su geometría es válida**: un hexágono cerrado de unos **234.950 m² y 1.992 m** de
perímetro, medidos sobre sus coordenadas. O sea, **el polígono está bien y sus atributos están a
cero**: nadie los calculó. Y no es una zona menor — la Zona 11 tiene **492 tramos** en § 1.11,
**154 de ellos de pago**, de las que más.

**2 · `TAMAÑO` y `PERIMETRO` no siempre cuadran con la geometría.** Calculados sobre las
coordenadas con una aproximación equirectangular —que en diez de las trece acierta con un error
por debajo del 0,15 %, así que sirve para detectar los que se salen—:

```
zona    TAMAÑO decl.   área calc.     PERIMETRO decl.   perím. calc.
   6         445.241     444.824               2.380          2.736   ← perímetro un 15 % corto
  11               0     234.950                   0          1.992   ← sin calcular
  13         202.830     190.116                 810          1.903   ← perímetro a menos de la mitad
```

**No se corrigen**: el fichero se copia como vino y el defecto se declara aquí. **Quien necesite
superficie o perímetro que los calcule de la geometría**, que es la que está bien; los dos campos
declarados no son de fiar en tres de las trece.

**⚠️ Frescura: `NO CONSTA`**, como en § 1.10 y § 1.11. La fecha de descarga es la única marca — y
aquí importa más que en las otras: **es la capa que la ampliación moverá primero**.

**Cómo se pinta.** Trece manchas en pizarra acromática con relleno al 8 % y borde fino, cada una
rotulada con su número, en un panel **por debajo** del de los bordillos: se encienden a la vez que
el regulado y la vista de cotejo, y hay que poder leer el bordillo sobre la mancha.

### 1.13 · Reservas de espacio, y las PMR — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | El censo de **2.636 reservas de espacio** en la vía pública, con su tipo, sus plazas y su horario — **5.813 plazas**. De ellas, **1.226 son reservas PMR** (1.447 plazas): dónde puede aparcar quien conduce con tarjeta de movilidad reducida |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_reservas`** |
| **Petición** | **Ésta la hicimos nosotros**: `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU1_reservas&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **18/08/2026 13:41:55 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-18_wfs_movilidad-MU1_reservas_cabeceras.txt), sin `Set-Cookie` · `timeStamp` del WFS: `2026-08-18T13:41:55.079Z` · CRS **EPSG:4326**, geometría `Point`. El `content-length: 84480` es el del cuerpo **comprimido** (`gzip`) |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal. Sin `MetadataURL`; el servicio con `Fees: NONE` y `AccessConstraints: NONE` |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, colgada también de esta capa |
| **Campos** | `TIPO`, `SUBTIPO`, `NOMBRE_CALLE`, `PORTAL`, `LONGITUD`, `PLAZAS`, `HORARIO`. **Ninguno personal** — barrido abajo |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-18_wfs_movilidad-MU1_reservas.json`](app/data/2026-08-18_wfs_movilidad-MU1_reservas.json) · 746.406 bytes · sha256 `8aaf80c1d946bf891c5a6387a213cb56fa4581922ee07ebb5fd0e7aaa3500057` **verificado sobre un clon** |

`numberMatched` = `numberReturned` = **2.636**, sin paginar. Los 2.636 con geometría, dentro del
término (41,603–41,760 N · −1,036–−0,796 O). 9 sin `NOMBRE_CALLE` y 47 sin `PLAZAS`.

#### El desglose por `TIPO`

| `TIPO` | Puntos | Plazas | | `TIPO` | Puntos | Plazas |
|---|---|---|---|---|---|---|
| **`14_PMR`** | **1.226** | **1.447** | | `08_E.S.P.` | 47 | 91 |
| `13_CyD` | 846 | 2.766 | | `17_HOTEL` | 24 | 66 |
| **`RETIRADA`** | **125** | 177 | | `12_BUS_ESC` | 22 | 182 |
| **`DENEGADA`** | **98** | 56 | | `06_SEG.PUB` | 13 | 113 |
| `19_TAXI` | 84 | 525 | | `null` | 9 | 1 |
| `09_C.SANIT` | 67 | 158 | | `21_PROX_CO` | 8 | 40 |
| `07_VH.OFI` | 60 | 174 | | `10_E.S.PMR` | 5 | 10 |
| | | | | `22_NP.CLAS` · `18_ATRACCI` | 1 · 1 | 6 · 1 |

> 🚨 **LA TRAMPA, y aquí duele más que en § 1.11: el campo que manda es `TIPO`, no `SUBTIPO`.**
>
> **1.384 registros llevan `SUBTIPO: 'PMR general'`**, pero solo 1.224 de ellos están en vigor:
>
> ```
> SUBTIPO 'PMR general' por TIPO:
>    14_PMR ......... 1.224   ← en vigor
>    RETIRADA ...........84   ← se quitó
>    DENEGADA ...........74   ← nunca se concedió
>    10_E.S.PMR ..........2
> ```
>
> **158 plazas retiradas o denegadas dicen «PMR general».** Filtrar por `SUBTIPO` no es un error
> de pintado: es **mandar a alguien con tarjeta PMR a 158 plazas que no existen**, y esa persona
> es justo la que menos puede permitirse el viaje en balde. El filtro correcto es
> **`TIPO === '14_PMR'`**.
>
> Y al revés también hay ruido: dentro de los 1.226 de `14_PMR` hay 1.224 con `SUBTIPO`
> `'PMR general'`, **uno** `'Hotel'` y **uno** `'Sanitaria'`. Se pintan los 1.226: manda el `TIPO`.

**Los 5 de `10_E.S.PMR` se quedan fuera, y es una decisión.** Dos llevan `SUBTIPO: 'PMR general'` y
tres `'Ent.Priv para S.P.'`: es un tipo mezclado, y meterlos rompería la coincidencia exacta con el
otro censo municipal —ver abajo—. Están en el fichero, sin pintar.

#### La cifra de SU fuente, y esta vez cuadra

Es la primera pieza donde **dos puertas del Ayuntamiento dicen exactamente lo mismo**: el WFS da
**1.226 PMR / 1.447 plazas** filtrando por `TIPO`, y el servicio REST
`equipamiento/aparcamiento-personas-discapacidad` da **1.226 / 1.447**. Al dígito.

Del censo entero no se puede decir lo mismo: el WFS trae **2.636 reservas** y los dos servicios de
la API que cubren esto —`aparcamiento-personas-discapacidad` 1.226 y `reserva-de-espacio` 846—
suman **2.072**. Las 564 de diferencia son, sobre todo, los tipos que la API no publica por
separado (taxi, vehículo oficial, hotel, escolar…) más las 223 retiradas y denegadas. **Esta ficha
declara la cifra de su fuente**, como § 1.10 y § 1.11.

#### Dato personal: barrido y limpio

La investigación miró la API; esto es el barrido sobre **los campos reales del WFS**, hecho
**antes de meter el fichero en el repositorio**:

```
campos marcados por su nombre ....... NOMBRE_CALLE (y es el nombre de la calle)
matrículas (patrón español) ......... 0
DNI/NIE ............................. 0
tratamientos (D./Dña/Sr./Dr.) ....... 10, y los diez son nombres de calle:
     DON JUAN DE ARAGÓN · DON PEDRO DE LUNA · NTRA.SRA.DEL AGUA · DON TEOBALDO…
```

`HORARIO` es texto libre —472 valores distintos— y era el candidato natural a colar algo: no cuela
nada, solo horarios. Eso sí, **escritos de 472 maneras**: `PERMANENTE`, `Permanente`,
`permanente`, y las erratas `PERMENENTE`, `PERMAENTE`, `PERMANTE`, `PERMANETE`, `PERMENTE`,
`PERMANENT`, `Permanante`. Se copia tal cual.

**⚠️ Frescura: `NO CONSTA`**, como el resto del WFS. La fecha de descarga es la única marca.

**Cómo se pinta.** Solo las **1.226 PMR**, en discos rosa con aro blanco. El resto del censo viaja
en el fichero sin pintarse, y hay una prueba (`app/src/app/capas.spec.ts`) que se pone roja si una
retirada o una denegada se cuela.

### 1.14 · Nombres de vía de OpenStreetMap — la otra mitad del grafo

| | |
|---|---|
| **Qué es** | Los **nombres de calle** que el grafo de § 1.4 no lleva. Una respuesta de Overpass con **19.897 *ways*, los 19.897 con `name`**. Es lo que convierte «sigue recto 200 m» en «sigue por Calle Delicias» |
| **Origen del dato** | **OpenStreetMap**, vía **Overpass API 0.7.62.11**. El propio fichero declara `timestamp_osm_base` **`2026-08-02T14:36:18Z`**, que es la fecha del nombre |
| **Licencia** | **ODbL 1.0**, la misma que § 1.1 y § 1.4. El fichero **la trae escrita dentro**, en `osm3s.copyright` |
| **Atribución** | Cumplida por el mapa base de § 1.1 —«© **colaboradores** de OpenStreetMap»—, que está siempre encendido. Un nombre de calle escrito en un paso no cuelga atribución propia: sería la misma cadena repetida |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`motor/data/2026-08-02_osm_overpass_zaragoza-termino_nombres.json`](motor/data/2026-08-02_osm_overpass_zaragoza-termino_nombres.json) · 5.023.094 bytes · sha256 `ddd22f7df3981b52e7762473e678b8a9b7e139fc92f3b7d6487f9b1a803fd2ef` **verificado sobre un clon** |

**No se descargó nada.** Este fichero ya vivía en el repositorio, en la rama archivada
`archivo/motor-vanilla`, y aquí se **promueve al árbol activo** tal cual — copiado con
`git cat-file -p` y comprobado por huella a los dos lados. Es la **segunda** pieza del intento
anterior que entra —la primera fue el grafo de § 1.4—, y entra como dato, nunca como código.

**Y vive en `motor/data/`, no en `app/data/`**, que es la primera vez que el proyecto usa esa
carpeta. El criterio: **los pasos los redacta el motor**, y `app/data/` está enganchado a un glob
de `angular.json` que se lo serviría al navegador entero. Son 5 MB que el navegador no necesita,
y los ~42 MB que ya se sirven son un cabo abierto, no un sitio donde añadir.

> ⚠️ **La regla de bytes hubo que ampliarla, y no es papeleo.** `.gitattributes` cubría solo
> `app/data/**`. Medido en un clon con `core.autocrlf=true`: **sin** la regla el fichero sale con
> **5.276.472 bytes** —253.378 de más, uno por salto de línea— y otro sha256. Es la entrada nº3
> de la bitácora exactamente, evitada antes de que ocurriera. Ahora `motor/data/**` va por la
> misma regla, y el clon lo devuelve byte a byte.

#### El cruce, y hasta dónde llega

Cada arista del grafo lleva `w`, su id de *way* de OSM; aquí está el `name` de ese way. Medido
sobre lo copiado:

| | |
|---|---|
| *Ways* distintos en el grafo | 47.758 |
| **De esos, con nombre aquí** | **16.994 · 35,6 %** |
| **Aristas que quedan con nombre** | **40.316 de 98.774 · 40,8 %** |
| Kilómetros con nombre | **2.404 de 6.500 · 37,0 %** |
| En el subgrafo andable y conectado (`a=1` ∧ `c=0`) | **37.397 de 93.503 · 40,0 %** |

> ℹ️ **Ese 40 % es el TECHO de OSM, no un fichero cojo.** El otro 60 % son aceras, pasos de
> peatones, sendas y caminos de servicio, y en OSM **eso normalmente no tiene nombre propio**: no
> es que falten aquí, es que no existen allí.
>
> ✅ **Y desde el 20/08 ese 60 % ya no está condenado a hablar por tipo.** La mayor parte de esas
> aceras y carriles van pegados a una calle que **sí** tiene nombre en el callejero municipal, y
> lo heredan por vecindad: **§ 1.15**. El reparto queda 40,0 % OSM + 37,1 % municipal heredado =
> **77,1 % de las aristas con nombre**, y solo el 22,9 % se dice por su tipo.
>
> ⚠️ **Y lo que sigue diciéndose por tipo, se dice por el tipo REAL** —la etiqueta `highway` que § 1.4
> conserva en `h`—, **no por el perfil propio del grafo**. El perfil dice `eje-de-calzada` de
> 46.643 aristas que son calzada, carril bici, camino de tierra y vial de servicio a la vez, y
> fiándose de él el motor llegó a escribir «anda por la calzada» sobre un carril bici. Está
> contado en `docs/BITACORA.md`, entrada nº7. De los 19.897 con nombre, 6.649 son `residential`,
> 4.583 `footway`, 1.146 `tertiary`, 1.069 `secondary` y 986 `primary` — el viario con nombre de
> la ciudad, que es justo por donde discurre el interior de una ruta.

#### Lo que trae de roto, dicho antes de usarlo

**1 · El desfase de 17 h 44 min.** El nombre es del **02/08/2026 14:36:18 GMT** y el grafo del
**03/08/2026 08:19:51 GMT** (§ 1.4). No son la misma foto de OSM. Un *way* renombrado, partido o
fusionado en esa ventana puede no casar: su `w` no estaría aquí, o llevaría otro nombre.
**Cuánto pasó, NO CONSTA** — medirlo exigiría volver a descargar de Overpass, y eso sería otro
dato con otra fecha, no una comprobación de este. Queda declarado como **riesgo residual**: se
manifestaría como una arista sin nombre, que es el caso que el 60 % ya obliga a saber tratar.

**2 · La discordancia del 19,4 %.** La auditoría que el propio grafo trae dentro (`portales.cv`)
compara, portal a portal, el nombre municipal con el de OSM:

| | | |
|---|---|---|
| `concuerda` | 25.120 | 54,4 % |
| `osm-sin-nombre` | 11.942 | 25,9 % |
| **`DISCORDA`** | **8.964** | **19,4 %** |
| `sin-enganche` | 124 | 0,3 % |

**Uno de cada cinco portales enganchó a una calle cuyo nombre en OSM contradice al del
callejero.** De ahí sale **la regla de reparto**, que es la única forma de que los pasos no se
contradigan con el formulario:

> **Los extremos hablan MUNICIPAL. El interior habla OSM, y si OSM calla, municipal heredado,
> y si tampoco, su tipo.**
>
> Los **extremos** los eligió el usuario de nuestro callejero, con su código, y ahí se dice **su**
> nombre — el que leyó al elegirlo. Si en un extremo dijéramos el de OSM, en el 19,4 % de los
> casos le estaríamos nombrando una calle distinta de la que acaba de escribir.
>
> El **interior** son tres niveles y este es el orden, escrito en `comoSeLlama` de
> [`motor/src/pasos.ts`](motor/src/pasos.ts):
>
> | | De dónde sale | Aristas | |
> |---|---|---|---|
> | **1** | El `name` del *way* en OSM | 37.397 | 40,0 % |
> | **2** | El `nombre_publico` del eje municipal más cercano (**§ 1.15**) | 34.675 | 37,1 % |
> | **3** | El genérico por su `highway` real — «el carril bici», «las escaleras» | 21.431 | 22,9 % |
>
> **Y todo se escribe igual.** El nivel 2 llega en mayúscula administrativa y el 1 en caso
> mixto; al narrarse, los dos pasan por la misma recomposición —significativas capitalizadas,
> partículas en minúscula (IGN), romanos en mayúsculas (RAE), sin abreviar ni desabreviar (OSM
> ES)—. **Es presentación: el dato no se toca y las comparaciones siguen sobre el nombre crudo.**
>
> Y hay un **tercer cruce entre los dos ficheros**, además del de § 1.15: el artículo que forma
> parte del nombre propio —«Calle de **El** Coloso»— solo se ve en OSM, porque el censo publica
> todo en mayúscula. Al arrancar se anota, por núcleo, qué artículos intermedios lleva OSM altos:
> **252 núcleos**, que le afectan a **142 nombres municipales**. ⚠️ Con la errata dentro: media
> docena son apodos regios —«Alfonso X **El** Sabio»— que la RAE escribiría en minúscula.
>
> **Con dos excepciones que se saltan el nivel 2, y son a propósito:** los **pasos de peatones**
> y las **escaleras** narran por su tipo SIEMPRE, hereden lo que hereden. Una cebra CRUZA la
> calle, no pertenece a ella, y decir «continúa por Avenida de Navarra» mientras se cruza Navarra
> le quita a quien anda justo el aviso que necesita.

> ✅ **Y el registro es UNO por calle, que es lo que cierra el reparto.** Los niveles 1 y 2 son
> dos registros que escriben distinto —OSM «Avenida de San José», el municipal «AVENIDA SAN
> JOSÉ»—, y una ruta que pasaba del carril heredado a la calzada nombrada decía la misma calle
> dos veces con dos ortografías: **el 54,8 % de las rutas**, medido. Dos reglas lo cierran, las
> dos en [`motor/src/pasos.ts`](motor/src/pasos.ts):
>
> - **La equivalencia por NÚCLEO** —fuera la palabra de tipo (las 30 del censo de § 1.15), fuera
>   las partículas, fuera tildes y mayúsculas, espacios colapsados—. [DOC OSRM] Su
>   `requiresNameAnnounced` descompone el nombre exactamente por esto: que un cambio de prefijo
>   «Avenida» no cuente como cambio de calle.
> - **El canónico MUNICIPAL.** [DOC esquema Karlsruhe / Streetmangler] Cuando calles y
>   direcciones viven en registros distintos, la búsqueda se rompe; aquí el canónico es el
>   municipal, porque es el registro de nuestras direcciones y el nombre que el usuario acaba de
>   leer en el formulario. Un nombre que **solo** existe en OSM no se toca.
>
> Queda en el **2,5 % de las rutas**, y lo que queda ya no es un cambio de registro: es OSM
> escribiéndose distinto a sí mismo (`Calle de Martín Ruizanglada` / `Calle de Martín Ruiz
> Anglada`), o una de las **nueve vías municipales cuyo nombre es una palabra de tipo**
> —`CALLE PARQUE`, `CAMINO RONDA`—, que se quedan sin núcleo y por diseño no casan con nada.
>
> ⚠️ **El precio, medido:** quitar la palabra de tipo hace que `RONDA HISPANIDAD` y `VÍA
> HISPANIDAD` den el mismo núcleo. Sobre 20.233 pares de tramos contiguos de 400 rutas, casan con
> tipo distinto **42** — y mirados uno a uno, la mayoría son **la misma calle** escrita con otro
> tipo por cada registro (`Calle de Pablo Ruiz Picasso` / `AVENIDA PABLO RUIZ PICASSO`,
> `Pasarela del Voluntariado` / `PUENTE PASARELA DEL VOLUNTARIADO`). Dos son de verdad distintas
> —una plaza y su calle—, y quedan aquí escritas.

**3 · Y dos cosas menores, medidas.** 1.970 *ways* traen además `name:es`, que no se usa: manda
`name`. Y cuatro llevan `addr:city` de **otro municipio** —Cuarte de Huerva, Villanueva de
Gállego—, coherente con que el bbox del grafo sea más ancho que el término (§ 1.4).

> ✅ **Barrido de dato personal, porque el fichero viene de un mapa colaborativo.** Las 319 claves
> de etiqueta se pasaron por un patrón de `phone·email·contact·addr:·operator·owner·website·fax`.
> Casan **quince *ways* en total**, y ninguno es de una persona: «Ayuntamiento de Zaragoza» (3),
> dos gasolineras de una empresa, un Mercadona, un área de servicio y siete direcciones
> municipales. **No hay dato personal.**

---

### 1.15 · Ejes de vía municipales — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | La **geometría con nombre** de las 3.359 vías del término: una multilínea por vía, con su `codigo` y su `nombre_publico`. Es la capa que permite que una acera muda **herede el nombre de la calle que tiene al lado** — el 60 % de la red peatonal no lo lleva en OSM, y no es que falte: es que allí no existe |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS Urbanismo · `https://idezar-sig.zaragoza.es/servicios/geoserver/urbanismo/wfs` · capa `urbanismo:Vias`. **Es la misma capa de § 1.3**, pedida con geometría en vez de como tabla: § 1.3 entró copiada de otro proyecto de la casa y sin geometría, y esto se pide al WFS directamente |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)**, la misma que § 1.2, § 1.3, § 1.5 y § 1.13 · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Dónde está cumplida** | Esta pieza **no se pinta**: se consume al arrancar y muere. Su atribución es la de esta ficha — y la que ya cuelga del mapa mientras hay capas municipales encendidas |
| **Fecha de descarga** | **2026-08-20**. El fichero declara dentro `timeStamp` **`2026-08-20T14:35:52.919Z`**, que es cuándo el servidor compuso la respuesta y **no la fecha del dato**: el WFS no publica la fecha del dato |
| **Campos usados** | `codigo` (la clave, que cruza con el `codigoVia` de § 1.3), `nombre_publico` y la geometría. El fichero trae doce y **se guardan los doce**: `tipo_via`, `nombre`, `nombre_completo`, `nombre_reducido`, `barrio_rural`, `codigo_via_entrada`, `codigo_via_salida`, `fecha_acuerdo`, `fecha_baja` y `fecha_propuesta` no se usan hoy, y filtrarlos sería editar el dato. **Ninguno es personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`motor/data/2026-08-20_idezar_wfs_urbanismo-vias_ejes.json`](motor/data/2026-08-20_idezar_wfs_urbanismo-vias_ejes.json) · 3.434.156 bytes · sha256 `ebf6dabd47416b4f9f371317bdfe512d9cd977fa7ac454a078e5c307b38c3ae7` **verificado sobre un clon** |

**La consulta EXACTA, que es lo único que hace esto reproducible:**

```
curl -o motor/data/2026-08-20_idezar_wfs_urbanismo-vias_ejes.json \
  "https://idezar-sig.zaragoza.es/servicios/geoserver/urbanismo/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=urbanismo:Vias&outputFormat=application/json&srsName=EPSG:4326"
```

`srsName=EPSG:4326` no es adorno: sin él el WFS devuelve **EPSG:25830**, metros UTM, que no casa
con el `[lon, lat]` del grafo y obligaría a reproyectar. Pidiéndolo así, el vértice llega en el
mismo sistema y con el mismo orden que § 1.4, y el cruce es geometría contra geometría.

> ⚠️ **La fuente VIVE, y esto se descargó dos veces con tres horas de diferencia.** Las dos
> respuestas salen **byte a byte iguales salvo el `timeStamp`** —mismos 3.434.156 bytes, mismas
> 3.359 *features*—, y eso es lo que dice que el dato no se movió esa tarde. Pero el callejero
> municipal se refresca (política declarada: mensual), así que **lo que garantiza los números de
> abajo es ESTE fichero, no una consulta nueva**.
>
> Y va por la regla de bytes de `.gitattributes`, como § 1.14: es **una sola línea de 3,4 MB**
> sin un solo retorno de carro, y sin la regla el clon la devolvería con otro sha256.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| *Features* | **3.359**, y `numberMatched` = `numberReturned` = 3.359: no hay paginación oculta |
| Códigos distintos | **3.359** — exactamente **una *feature* por vía**, ni una repetida |
| Con `nombre_publico` | **3.358** |
| Geometría | **3.359 `MultiLineString`** · **8.261 tramos** · **75.844 vértices**, en **`[lon, lat]`** como el grafo |
| Longitud total | **1.998,5 km** · mediana por vía **224 m** |
| **Con `fecha_baja`** | **0** — ninguna vía dada de baja viaja aquí dentro |

#### Lo que trae de roto, dicho antes de usarlo

**1 · Las 18 vías con geometría VACÍA, y no son un fallo.** Son las 18
`DISEMINADO DISEMINADO <núcleo>` —Alfocea, La Cartuja, Casetas, Garrapinillos, Juslibol,
Villarrapa, Montañana, Venta del Olivar, Montemolín, Torrero, Monzalbarba, Movera, San Juan,
Peñaflor, Torrecilla, Santa Isabel, Casablanca y Miralbueno—. Llegan con `coordinates: []`, y es
coherente: un **diseminado** es la dirección de lo que está esparcido por el campo, no una calle,
y no tiene eje que dibujar. **No prestan nombre a nadie**, y el cruce las cuenta y sigue.

**2 · Una vía sin `nombre_publico`.** Es la **`GLORIETA ÓSCAR LAÍNEZ HERNÁNDEZ`** (código 15912),
que trae `nombre` y `nombre_completo` pero el campo público a `null`. **No puede prestar nada**:
lo que caiga a su lado se queda con su nombre genérico. Es una glorieta sin portales, así que
nadie la va a escribir en el formulario.

**3 · El desfase con § 1.3 es de UNA vía, y retrata que la fuente está viva.** Los dos ficheros
declaran 3.359, pero no son las mismas 3.359:

| | |
|---|---|
| Ejes que § 1.3 no conoce | **1** — `GLORIETA POLICÍA NACIONAL` (cod. 40127), `fecha_acuerdo` **2026-05-22** |
| Vías de § 1.3 sin eje aquí | **1** — `GLORIETA LAS BANDERAS` (cod. 3410), **0 portales** |

§ 1.3 es una foto del **13/05/2026** y esta del **20/08/2026**: esa glorieta se acordó **nueve
días después** de aquella foto. Una entra, otra sale, y el total no se mueve. **No se toca
ninguno de los dos ficheros**: son dos fechas distintas del mismo callejero, y eso es lo que son.

**4 · Y 22 nombres que no se escriben igual que en § 1.3**, de los 3.358 comparables — el 0,7 %.
Se cuenta entero porque es el nombre que se va a leer en un paso:

- **20 son espacios de más** — `CALLE JUAN RAMÓN··JIMÉNEZ`, `PLAZA EL··PROGRESO`,
  `CAMINO DE EN MEDIO···MRL`… El WFS los trae dobles y el derivado de § 1.3 los colapsó. En
  pantalla **no se notan**: el navegador colapsa los espacios del HTML al pintar.
- **2 son las correcciones declaradas de § 1.3**: `CALLE BARCELONA` (3564) y `CALLE LA PARRA`
  (22340) llevan aquí el marcador `---CRT` (La Cartuja) y allí se corrigió a `---CST` (Casetas),
  con dos evidencias delante. **Aquí llegan sin corregir y se dejan así**: el dato entra tal cual,
  y la regla de la casa es reportar lo falso, no enmendarlo dentro del fichero. Si una ruta pasa
  por esas dos calles de Casetas heredando su nombre, dirá `---CRT`. **Falso conocido, declarado.**

**5 · Veintiún nombres repiten su primera palabra.** Los 18 `DISEMINADO DISEMINADO …` y tres vías
de verdad: `PATIO PATIO DE LA LICORERA` (16690), `CAMINO CAMINO DE LAS TORRES` (32120) y
`CARRETERA CARRETERA DE VILLAMAYOR ---SIS` (33560). Se dicen tal cual: es el dato.

#### El cruce, y con qué puertas

Al arrancar, cada *way* **mudo** del subgrafo andable se muestrea cada 15 m; cada muestra vota al
eje municipal más cercano dentro de 25 m; gana el más votado, si cubre la mitad del *way* y si
ninguna otra calle se lo disputa. La regla, sus umbrales y sus citas están en
[`motor/src/ejes.ts`](motor/src/ejes.ts); lo que aquí importa es **cuánto rinde y qué deja fuera**:

| | *ways* | |
|---|---|---|
| *Ways* mudos del subgrafo útil | **29.206** | el universo del cruce |
| ✅ **Heredan nombre municipal** | **19.358** | **66,3 %** |
| Sin ningún eje a 25 m | 6.775 | 23,2 % — huerta, interior de manzana, parque |
| Con eje, pero **poca cobertura** (<50 %) | 2.152 | 7,4 % |
| **En disputa** — dos calles se lo reparten | 881 | 3,0 % |
| Sin geometría que muestrear | 40 | 0,1 % |

Y lo que eso le hace a los pasos, que es para lo que se ha traído:

| Aristas del subgrafo andable | | |
|---|---|---|
| Con `name` de OSM (§ 1.14) | 37.397 | 40,0 % |
| **+ nombre municipal heredado** | **34.675** | **+37,1 %** |
| **= con nombre** | **72.072** | **77,1 %** · 2.915 de 5.651 km |
| Siguen mudas, y se dicen por su tipo | 21.431 | 22,9 % |

**Cuesta 225 ms al arrancar y deja ~1,0 MB vivos.** El índice de los 67.583 segmentos de eje
**muere en cuanto termina el cruce**: lo único que sobrevive es el `Map` de *way* a nombre.

**La distancia media al eje heredado es 4,9 m (p50)**, 14,4 en el p90 y 22,4 en el p99. Cuadra
con lo que hay de una acera al centro de su calzada, y es la señal de que se está casando lo que
se cree que se está casando.

> ⚠️ **Lo que esta pieza NO garantiza, dicho aquí y no en el pie.** Que haya un eje al lado no
> demuestra que sea **su** eje. Las dos puertas —cobertura y disputa— tapan los casos en que la
> duda es visible, pero un *way* pegado a una sola calle hereda **siempre**, y si el callejero lo
> tiene mal, se hereda mal. El modo de fallo documentado del proyecto OpenSidewalks es
> exactamente ese: heredar la calle de enfrente. **No se ha auditado caso a caso**, y hasta que
> se haga, la cifra honrada es «77,1 % de aristas con nombre», no «77,1 % con el nombre correcto».

---

### 1.16 · El resto del dato — todavía **ninguno**

No hay capas municipales de tranvía (`MU3_lineas_tranvia`, `MU3_paradas_tranvia`, que existen en
el catálogo y nadie ha descargado), ni el cruce líneas↔postes, que es trabajo de motor y no un
dato que copiar.

---

## 2 · Software

### 2.1 · Dependencias declaradas como de ejecución

Las que van en `dependencies` de [`app/package.json`](app/package.json) — la interfaz.

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `@angular/core` | 22.1.2 | MIT | El framework |
| `@angular/common` | 22.1.2 | MIT | Lo común del framework (directivas, `HttpClient`) |
| `@angular/compiler` | 22.1.2 | MIT | Compilador de plantillas |
| `@angular/forms` | 22.1.2 | MIT | Los formularios — el de cuatro campos irá aquí |
| `@angular/platform-browser` | 22.1.2 | MIT | Arrancar la aplicación en el navegador |
| `@angular/router` | 22.1.2 | MIT | ⚠️ **Instalado y sin usar** — ver la nota de abajo |
| `leaflet` | 1.9.4 | **BSD-2-Clause** | El mapa. Es quien pide las teselas de § 1.1 |
| `rxjs` | 7.8.2 | **Apache-2.0** | Flujos asíncronos; `HttpClient` los devuelve |
| `tslib` | 2.8.1 | **0BSD** | Ayudantes que emite TypeScript al compilar |

> ⚠️ **`@angular/router` está declarado aunque la aplicación no tiene router.** Se creó con
> `--routing=false` y no hay fichero de rutas ni `provideRouter` en ninguna parte —comprobado—,
> pero el CLI lo instala igual en su conjunto estándar. Se deja como lo dejó el CLI y se dice
> aquí, en vez de quitarlo por iniciativa propia. Desplázame es **una sola vista**: si sigue sin
> usarse, sobra.

> **Lo que esta tabla NO dice:** cuál de estos paquetes acaba realmente dentro del JavaScript que
> descarga el navegador. Eso lo decide el *build*, no el `package.json`, y **no está medido**:
> **NO CONSTA**. Hoy no hay ni build de producción que mirar.

### 2.2 · Dependencias de desarrollo

No se distribuyen: no viajan al navegador. Se listan igualmente, porque en la casa ya se ha
pagado el precio de una tabla incompleta.

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `@angular/cli` | 22.1.4 | MIT | La herramienta: `ng serve`, `ng build`, `ng generate` |
| `@angular/build` | 22.1.4 | MIT | El constructor (esbuild + Vite por debajo) |
| `@angular/compiler-cli` | 22.1.2 | MIT | Compilación anticipada (AOT) |
| `typescript` | 6.0.3 | **Apache-2.0** | El lenguaje |
| `@types/leaflet` | 1.9.22 | MIT | Los tipos de Leaflet: **no vienen en el paquete**, van aparte |
| `vitest` | 4.1.10 | MIT | El corredor de pruebas que eligió el CLI |
| `jsdom` | 28.1.0 | MIT | DOM de mentira para que Vitest pueda correr pruebas |
| `prettier` | 3.9.6 | MIT | Formateo |
| `@types/node` | 26.2.0 | MIT | **Del motor**, no de la interfaz: los tipos de Node para revisar `motor/` con `tsc` |

### 2.3 · El árbol transitivo — existe, y no se lista aquí

Las **18 declaradas** de arriba arrastran, con todo lo suyo, **502 paquetes** de terceros
instalados.
Enumerarlos aquí sería una tabla que nadie lee y que caduca en la primera actualización.

**Dónde mirarlos, que es lo que importa:** [`package-lock.json`](package-lock.json) **de la
raíz** —desde que el repositorio son workspaces npm hay uno solo para las tres piezas—, que
está versionado precisamente para eso — cada entrada trae su versión, su origen y su licencia.

```bash
npm ls --depth=0 --workspaces  # las declaradas, pieza a pieza
npm ls --all                   # el árbol entero
```

**El reparto de licencias del árbol completo, leído del `package-lock.json` de la raíz el
17/08/2026 (recalculado al montar los workspaces):**

| Licencia | Paquetes |
|---|---|
| MIT | 430 |
| ISC | 25 |
| BSD-2-Clause | 13 |
| **MPL-2.0** | 12 |
| Apache-2.0 | 10 |
| BSD-3-Clause | 6 |
| MIT-0 | 2 |
| **CC-BY-4.0** | 1 |
| BlueOak-1.0.0 | 1 |
| CC0-1.0 | 1 |
| 0BSD | 1 |
| **Total** | **502** |

*(El `package-lock.json` trae tres entradas más sin licencia: `desplazame`, `@desplazame/tipos`
y `@desplazame/motor`. No son terceros — son los enlaces de nuestros propios workspaces, y por
eso no cuentan en los 502.)*

### 2.4 · Las tres que no son MIT ni BSD

De las 502, tres familias no son la licencia permisiva de siempre. **Las tres son de desarrollo:
ninguna viaja al navegador.**

| Paquete | Licencia | Qué tiene de distinto |
|---|---|---|
| **`lightningcss`** 1.33.0 y sus **11 binarios** por plataforma | **MPL-2.0** | *Copyleft débil, por fichero.* Obliga a publicar las modificaciones **de sus propios ficheros**; no contamina el código que lo usa ni lo que produce. Es el minificador de CSS de `@angular/build`: **procesa** nuestro CSS, no se mezcla con él |
| **`caniuse-lite`** 1.0.30001809 | **CC-BY-4.0** | Es **datos**, no código: la tabla de compatibilidad de navegadores que usa browserslist. CC-BY **exige atribución** — y esta línea es la atribución |
| **`lru-cache`** 11.5.2 | **BlueOak-1.0.0** | Permisiva y aprobada por la OSI. Solo es infrecuente |

### 2.5 · Resumen de compatibilidad

**Las 18 dependencias declaradas son MIT, Apache-2.0, BSD-2-Clause o 0BSD**: permisivas, sin
copyleft, y compatibles con la Apache 2.0 de este proyecto sin ninguna condición añadida. **No
hay ninguna sorpresa entre ellas** — y en particular, Leaflet es BSD-2-Clause, no una licencia
con restricciones de uso.

En el árbol transitivo aparecen tres licencias menos habituales (§ 2.4). Ninguna bloquea nada:
la única con copyleft —MPL-2.0— es débil, por fichero, y está en una herramienta de *build* que
no se redistribuye. La única que obliga a algo —CC-BY-4.0— obliga a atribuir, y queda atribuida
arriba.

> **Y lo que este documento no garantiza:** el reparto de licencias de § 2.3 sale del campo
> `license` que cada paquete declara en el `package-lock.json`. **No se ha abierto el `LICENSE` de
> los 502 para comprobar que dicen la verdad**, y un paquete puede declarar mal. Las **18
> declaradas sí** se han mirado una a una. Del resto: **NO CONSTA**.
