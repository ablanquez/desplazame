# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 03/09/2026.** El proyecto está en construcción. Hoy hay de terceros: las
> dependencias npm, la cartografía de OpenStreetMap que pide el mapa, **treinta y un** conjuntos
> de datos con ficha propia —§ 1.1 a § 1.31— y **una norma citada** (§ 1.32); la § 1.33 declara
> lo que **todavía no** ha entrado.
> Quedan fuera las capas municipales de tranvía; cada pieza llega con su autorización y su ficha.
>
> ⭐ **Y tres de esas treinta y una NO SE COPIAN: SE CONSULTAN.** Es la línea que se cruzó el 30/08
> y que hoy separa el documento en dos mitades:
>
> | | Qué se consulta | Quién |
> |---|---|---|
> | § 1.23 | la disponibilidad del BiZi | Ayuntamiento de Zaragoza |
> | § 1.24 | las llegadas al poste | **Avanza Zaragoza** |
> | § 1.25 | la ruta operativa de hoy | **Avanza Zaragoza** |
>
> ⛔ **Y las dos de Avanza traen un aviso legal que PROHÍBE la extracción y la reutilización**,
> medido y transcrito el 01/09 en su ficha. No se interpreta aquí: se lee ahí.
>
> ⏳ **Uno de ellos caduca: el GTFS, el 05/10/2026** (§ 1.7) — y no de golpe: el **bus** se acaba
> ese día y el **tranvía** sigue. Está medido día a día en su ficha.
>
> ⚠️ **Este párrafo decía «catorce» conjuntos y «Estado a 20/08/2026», y las dos cosas se habían
> quedado viejas**: el documento pasó de catorce fichas a veintiséis sin que esta línea se
> enterara. Es la entrada nº5 de la bitácora otra vez —una regla de releída vale lo que su
> alcance—, y se corrige con el comando delante: `grep -c '^### 1\.' THIRD-PARTY-NOTICES.md` → **26**.
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
> proyecto pueda copiarlas hoy.

**✅ Y esa dependencia está resuelta desde el 31/08** — se anotó como pendiente aquí y se cerró
con tres piezas, cada una con su ficha:

- **§ 1.7, el GTFS**: de ahí salen las líneas, el orden de las paradas y el calendario. Es lo que
  el motor cocina en **170 patrones** y por lo que rutea.
- **§ 1.25, la ruta operativa de hoy**: lo que cada línea hace HOY, para saber por dónde **no**
  pasa.
- **§ 1.24, las llegadas al poste**: cuándo pasa el próximo de verdad.

El puente entre unos y otros es el **`stop_code`**, y ya está cruzado: el espacio `PA…` (p. ej.
`PA00010`) es el mismo en el catálogo municipal y en el feed. ⭐ **Medido el 01/09 sobre el feed
que se sirve: de sus 984 paradas, 934 traen `PA…`** — exactamente las de bus— **y las 50 restantes
son el tranvía**, con códigos de cuatro cifras. Y es el mismo número que se enseña al viajero:
`PA00033` se dice **«poste 33 · …»**, que es lo que hay escrito en la marquesina [referencia GTFS,
`stop_code`].

**Dos censos de la misma cosa, y los dos legítimos.** El proyecto anterior manejaba **~934**
postes; aquí hay **944**. ⭐ **Y el 934 ya no es «~»**: el feed de § 1.7 trae **exactamente 934**
paradas con `stop_code` `PA…`, medido el 01/09. No es una discrepancia que haya que resolver: son **censos
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
> no está vigente — y desde el 31/08 sí hay algo que lo avisa: **el cron nocturno trae la
> publicación nueva del NAP en cuanto Avanza la publique**, y el motor la sirve al arrancar.
>
> ⭐ **Y la caducidad NO es un corte limpio: el bus y el tranvía mueren en días distintos.**
> Medido el 01/09/2026 cruzando `calendar_dates.txt` con `trips.txt` sobre el feed que se sirve:
>
> ```
> 20261005 — bus 7217 · tranvía 368     ← el ÚLTIMO día con viajes de BUS
> 20261006 — bus    0 · tranvía 368
> 20261007 — bus    0 · tranvía 368
> 20261008 — bus    0 · tranvía 368
> 20261009 — bus    0 · tranvía 396
> 20261010 … 20261018 — SIN NI UNA FILA en calendar_dates
> 20261019 — bus    0 · tranvía 368     ← el tranvía vuelve, el bus no
> ```
>
> Tres cosas, y las tres son del dato:
>
> 1. **El bus se acaba el 05/10**, con **7.217 viajes** ese día. Del 06/10 en adelante, **cero**.
> 2. **El tranvía sigue** hasta el **27/12/2026**, con un hueco en medio.
> 3. **Del 10 al 18 de octubre no hay ni una fila** — ni bus ni tranvía—, y ahí dentro cae **el
>    12/10, el Pilar**. No es que el servicio sea cero: es que **este feed no describe esos
>    días**, y el operador publicará su calendario de fiestas por su cuenta.
>
> ⚠️ Escrito así porque «caduca el 05/10» a secas se lee como si el 06 se apagara todo, y lo
> medido es otra cosa.

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
| **Dónde está cumplida** | ⭐ **En el pie de créditos del buscador** (1/09): *«Horarios: GTFS del Punto de Acceso Nacional (MITMA) — Powered by MITRAMS (dato bruto y procesado)»*, con el enlace a `transportes.gob.es` puesto. Las dos naturalezas son ciertas a la vez: la traza que se pinta es `shapes.txt` **tal cual**, cortada por paradas; los minutos se **calculan** sobre `stop_times`. ⚠️ **Y esta fila decía otra cosa que dejó de ser verdad el 22/08**: decía *«colgada de la capa de trazados: "Trazados: GTFS de Avanza Zaragoza S.A.U. (dato bruto) · Powered by MITRAMS"»*, y esa capa era del **visor**, que se retiró de la app ese día. Desde entonces y hasta hoy la ficha declaraba cumplida una atribución que **no estaba en ninguna pantalla** — comprobado el 01/09 con `grep -rn "Powered by\|MITRAMS" app/src/`, que no devolvía nada. Se corrige aquí en vez de reescribirla en silencio |
| **¿Está en este repo?** | ✅ **Sí, el ZIP entero tal cual**: [`app/data/2026-08-10_nap_gtfs-ficha1176.zip`](app/data/2026-08-10_nap_gtfs-ficha1176.zip) · 6.883.311 bytes · sha256 `5c96992c97aac966bc9bc20babfbbbffb312f2a3cbcf9dd543982d2674cf3a82` **verificado sobre un clon** |
| **⭐ Es la SEMILLA, y desde el 31/08 lo es a propósito** | El ZIP de esta fila es la **semilla fechada**: la descarga del **10/08/2026**, con su `feed_version` `20260623_AUZSA_Y_TRANVIA` y su vigencia **23/06 → 05/10/2026**. **No se toca nunca.** Es lo que hace que un clon limpio arranque sin pedirle una clave a nadie |
| **Y el feed VIVO no está aquí** | El cron nocturno trae del NAP la última publicación y la escribe en `app/data/nap_gtfs-ficha1176.vivo.zip`, con su registro al lado — **ignorados por git y fuera de este manifiesto**. El vivo **releva** a la semilla: el motor lo sirve en cuanto existe y se deja leer |

⭐ **Por qué relevo y no sobrescribir la semilla.** Se pensó primero que el cron pisara este
mismo fichero. Se midió antes de escribirlo y no salía: el ZIP es un **recurso declarado del
manifiesto** —`bytes`, `hash`, `caducaEl`— y **dos pruebas vivas lo recalculan**
(`app/src/app/manifiesto.spec.ts` y `motor/src/datos-de-la-rueda.spec.ts`). Sobrescribirlo las
pondría rojas la primera noche que el cron corriera y dejaría **cinco campos** de
`datapackage.json` mintiendo (`bytes`, `hash`, `caducaEl`, `modified`, `descargadoEl`) — además
de que el nombre del fichero seguiría diciendo `2026-08-10`. Con el relevo, el manifiesto sigue
diciendo la verdad y el dato servido sigue siendo el de hoy. Decidido por Antonio el 31/08.

[GTFS Schedule Best Practices] *«el dato se publica en iteraciones de modo que un único fichero
en una ubicación estable contiene siempre la última descripción oficial del servicio»*: la
ubicación estable es el vivo; la semilla es el suelo del que se parte.

**Y dos copias de trabajo extraídas, solo dos**, porque el navegador no abre ZIP sin una
dependencia nueva y no la hay:

| Miembro extraído | Bytes | sha256 | Para qué |
|---|---|---|---|
| [`…_shapes.txt`](app/data/2026-08-10_nap_gtfs-ficha1176_shapes.txt) | 1.408.077 | `f38397d36c98fb756b2ee5a3ca261fbfc712aea2e51903d51b7c9b4fddb18157` | Los **89 trazados**. ⭐ **Desde el 31/08 no solo se pintan: se RUTEA con ellos** — el cocinado proyecta cada parada sobre su trazado y guarda **la traza de cada salto**, así que el bus va por el asfalto y no en línea recta. Medido: **3.362 saltos · 48.307 puntos** cocinados |
| [`…_stops.txt`](app/data/2026-08-10_nap_gtfs-ficha1176_stops.txt) | 99.309 | `6d1a969ab25d7be41ffb9b8184589865407be671fd52fadc50206aa3917c957b` | **Las 50 paradas del tranvía**, que no están en ninguna otra fuente del repositorio: el MU3 municipal (§ 1.6) es solo bus. ⭐ **Y desde el 31/08 las 984 son la red por la que el motor RUTEA** —sube, transborda y baja entre ellas—; **en el PINTADO de postes sigue mandando el MU3**, que es el censo municipal, y ahí de las 984 se pintan solo esas 50 |

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
| `route_type` | **704 en 52** y **900 en 1**. Los dos son de la **extensión de tipos de ruta** de GTFS, no del enum básico: `704` es *«Local Bus Service»* y `900` *«Tram Service»*. Un lector que solo entienda los siete valores clásicos (`0` tranvía, `3` autobús) **no reconoce ninguna de las 53** |
| `trips` | **34.427**, y **los 34.427 traen `shape_id`** |
| Rutas **sin ni un viaje** | **8**, todas de la agencia 1 y todas `704`: `CEM`, `CE`, `LAN`, `EM1`, `EM2`, `V1`, `ES3`, `V4`. Están declaradas en `routes.txt` y no las recorre nadie — refuerzos y servicios especiales que este calendario no incluye. No se borran ni se cuentan como línea viva |
| `shapes` | **89 trazados**, **27.603 puntos** |
| `shape_dist_traveled` | La columna **existe y está VACÍA en los 27.603 puntos**. Es opcional en la especificación, así que no es un defecto — pero quien cuente con ella para medir distancia sobre el trazado no la tiene, y la casa proyecta las paradas por su cuenta |
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
> consigo mismo.** Declara `feed_end_date = 20261005`, pero su `calendar_dates` llega hasta el
> **31/12/2026**. Son casi tres meses más allá de la validez que el propio feed se da. **Aquí se
> toma la fecha conservadora, la del publicador: 05/10/2026.**
>
> ⚠️ **Y una cuarta, del canal y no del feed: el metadato del NAP dice OTRA fecha final.**
> Lo que el NAP devuelve del fichero 1176, copiado del registro que el cron guarda al lado del
> feed vivo:
>
> ```json
> { "ficheroId": 1176, "fechaActualizacion": "2026-06-30T13:20:04.661082",
>   "numeroViajes": 34427, "numeroRutas": 53, "numeroParadas": 984,
>   "fechaDesde": "2025-09-16T00:00:00", "fechaHasta": "2026-12-27T00:00:00" }
> ```
>
> Los tres recuentos **cuadran clavados** con lo medido aquí (34.427 · 53 · 984). La que no cuadra
> es la fecha: el NAP dice **27/12/2026** y el feed se declara válido hasta el **05/10/2026**.
> ⭐ **Y el 27/12 no es un error del NAP**: es exactamente **el último día que algún viaje usa**,
> comprobado cruzando `calendar_dates` con `trips`. El NAP describe hasta dónde llega el
> calendario; el feed, hasta dónde el publicador se hace responsable. **Aquí manda la del feed**,
> que es la conservadora — y con el matiz de la caja de arriba: del 05/10 en adelante, lo que
> queda es tranvía.
>
> ℹ️ **De las TARIFAS, NO CONSTA.** Los **8 miembros** del archivo son `agency`, `calendar_dates`,
> `feed_info`, `routes`, `shapes`, `stops`, `stop_times` y `trips`: **ni `fare_attributes.txt`, ni
> `fare_rules.txt`, ni `fare_products.txt`** — en este ZIP **no hay precios**, y por eso el
> proyecto no dice ninguno. Si el catálogo del NAP anuncia tarifas para este conjunto **no se ha
> podido comprobar**: `…/api/Fichero/1176` y `…/api/Conjunto/1176` contestan **401** sin la clave,
> y la clave no se lee aquí. Queda como pregunta abierta, no como afirmación.
>
> ℹ️ **Y de la ficha 975, NO CONSTA también.** La descarga se hizo por
> `…/api/Fichero/download/**1176**`, el fichero se llama `…gtfs-ficha1176.zip` y el registro del
> NAP devuelve `ficheroId: 1176`. **En el repositorio no hay ni una traza de un 975**, y por lo
> público del NAP no se puede mirar (401). No se afirma que exista otra ficha ni que no exista.
>
> **Y el 31/12 no es siquiera servicio de verdad**, que es una precisión que faltaba aquí. De
> los **1.458 `service_id`** de `calendar_dates`, solo **1.262 aparecen en `trips.txt`**: hay
> **196 huérfanos** que no llevan ni un viaje. El último día con servicio que algún viaje usa de
> verdad es el **27/12/2026**; el 28, el 29, el 30 y el 31 son **una línea de huérfano cada
> uno**. Comprobado sobre el propio fichero, cruzando `calendar_dates.txt` con `trips.txt`.

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

> ⚠️ **Hay una segunda fuente de estaciones, y es OTRA COSA: la API de zaragoza.es**, que sirve
> **dato vivo** (`bicisDisponibles`, `anclajesDisponibles`, `estado`, `lastUpdated`). Aquí entra
> **el inventario**, que no caduca cada minuto; la disponibilidad en tiempo real tiene **su
> propia ficha desde el 30/08 — § 1.23**, porque no se guarda en el repositorio: se consulta.
>
> Aquel aviso que esta ficha dejó escrito «por si algún día se usa» se ha cumplido, y por eso la
> § 1.23 empieza por él: **la API se contradice dentro del mismo rasgo**. En la estación «193-
> Pza. La Ermita» convivían `estado: "IN_SERVICE"`, un `estadoEstacion` que apunta a la URI
> **`…/no-operativa`**, y una descripción que dice «Estado: **Operativa**». Tres afirmaciones, y
> al menos dos no pueden ser ciertas a la vez.

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

  > ⭐ **Y esos 6 nombres se completan por CONFLACIÓN DE ATRIBUTOS (4/09).** 6 rasgos sin
  > `Nombre_calle` completados desde el listado de la sede electrónica —conflación de atributos,
  > casados a 0,0 m, 4/09—. El fichero de esta ficha **no se toca**: la conflación vive en el
  > cocinado de § 1.33, que es donde se escribe el dato derivado.
  >
  > Es la práctica corriente cuando dos fuentes se solapan [OSM wiki, *conflation*: *«combinar
  > fuentes solapadas para retener el dato preciso»*; Hootenanny/NGA: *«mantener la procedencia de
  > geometría y atributos en los rasgos combinados»*, el flujo *Differential-With-Tags* — añadir a
  > un rasgo existente el atributo que le falta, casado uno a uno], y **no cambia quién manda**:
  > la geometría, las plazas y los portales siguen siendo de esta capa, y la sede no añade ni un
  > soporte —el que solo ella tiene sigue fuera—. Lo que entra es **un atributo, donde falta**.
  >
  > | WFS | sede | distancia | plazas | portal | nombre que entra |
  > |---|---|---|---|---|---|
  > | `MU2_motos.138` | 150 | 0,0033 m | 15 | `S/N` | `DE RANILLAS` |
  > | `MU2_motos.171` | 185 | 0,0041 m | 20 | `S/N` | `DE RANILLAS` |
  > | `MU2_motos.172` | 186 | 0,0033 m | 20 | `S/N` | `DE RANILLAS` |
  > | `MU2_motos.173` | 187 | 0,0019 m | 20 | `S/N` | `DE RANILLAS` |
  > | `MU2_motos.222` | 266 | 0,0065 m | 8 | `S/N` | `DE RANILLAS` |
  > | `MU2_motos.1483` | 1655 | 0,0047 m | 4 | `23` | `GRUPO ARZOBISPO DOMENECH` |
  >
  > ⚠️ **El portal no se rellena: ya lo trae esta capa**, y coincide carácter a carácter con el
  > que la sede escribe tras la coma — igual que las plazas. Esas dos coincidencias son **la
  > corroboración del casado**, no un relleno: el cocinado exige las tres cosas —≤ 1 m, mismo
  > portal, mismas plazas— y si alguna falla **no rellena**, que es preferible a nombrar mal un
  > sitio.
  >
  > ⚠️ Y **cada registro conflado lo dice de sí mismo**: lleva `nombreDe: "sede"` en el fichero
  > cocinado. Son 6 de 2.146, y se pueden contar sin fiarse de esta tabla.
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

**Lo que la aplicación pintaba, y lo que no.** Mientras el visor existió —hasta el 22/08, ver
más abajo— se pintaban **solo los 1.159 tramos `ESRO` y `ESRE`** —azul los primeros, naranja los
segundos, una sola casilla—. Los 6.204 `LIBRE` y los 28 sin clasificar **no se pintaban**: no
son regulado, y pintarlos contestaría otra pregunta. Están en el fichero igualmente.

> ℹ️ **Desde el 22/08 la app no pinta este dato ni ningún otro de estas fichas.** El visor de
> capas se retiró y **se reserva para la intranet, punto 14 del plan**; con él se fue la prueba
> que vigilaba este filtro (`app/src/app/capas.spec.ts`). El dato se queda en el repositorio con
> su ficha y su huella: lo que se retiró es el instrumento que lo miraba, no el dato.

> ⭐ **EN USO DESDE EL 3/09, y ya no para pintar: para RUTEAR** (punto 12, casilla
> 2). `POST /api/ruta` con `modo=coche` y `aparcamiento=regulado` conduce hasta
> uno de estos **1.159 tramos** y anda el resto [*car-to-park*, DOC OTP2]; con
> `aparcamiento=gratuito`, hasta uno de los **6.204 `LIBRE`**. Lo lee
> [`motor/src/aparcamiento.ts`](motor/src/aparcamiento.ts), que filtra por
> **`tipo_actual`** y solo por él — la trampa de arriba tiene ahora una juez que
> se pone roja si alguien mira `zona_reguladora`.
>
> ⚠️ **Los 28 sin clasificar no entran en ningún montón**, y hay una juez que lo
> compra por sus ids: el censo no dice qué son, y leer ese silencio como
> «gratuito» sería inventarse 226 plazas.
>
> ⚠️ **Y el paso que se escribe no dice ni tarifa ni horario**, porque esta capa
> no los trae: dice «zona regulada (ESRO)» y «zona regulada de residentes
> (ESRE)», y se calla lo que costaría. Hay una juez que se pone roja si aparece
> un € o una franja en esa frase.

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

> ⭐ **EN USO DESDE EL 3/09, para RUTEAR** (punto 12, casilla 2). `POST /api/ruta`
> con `modo=coche` y `aparcamiento=discapacitado` conduce hasta una de estas
> **1.226 plazas** y anda el resto. Lo lee
> [`motor/src/aparcamiento.ts`](motor/src/aparcamiento.ts), y **filtra por
> `TIPO === '14_PMR'`**: hay una juez que cuenta las **158 retiradas o denegadas
> que dicen `SUBTIPO: 'PMR general'`** y se pone roja si alguna entra.
>
> ⚠️ **El `HORARIO` se enseña TAL CUAL viene.** Entre las 1.226 hay **104 formas
> distintas** —`PERMANENTE`, `Permanente`, `permanente`, `0-24`, `0-24 H.`,
> `n/a`, `VER OBSERVACIONES`—, y el paso dice «plaza PMR (horario: …)» con la
> cadena del censo dentro, recortada a 40 caracteres y sin interpretar. Hay una
> juez que compra que `VER OBSERVACIONES` llega entero hasta la frase.

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
| En el subgrafo que el peatón pisa (`a=1` ∧ `c=0` ∧ acceso) | **35.124 de 89.047 · 39,4 %** |

> ℹ️ **Ese 40 % es el TECHO de OSM, no un fichero cojo.** El otro 60 % son aceras, pasos de
> peatones, sendas y caminos de servicio, y en OSM **eso normalmente no tiene nombre propio**: no
> es que falten aquí, es que no existen allí.
>
> ✅ **Y desde el 20/08 ese 60 % ya no está condenado a hablar por tipo.** La mayor parte de esas
> aceras y carriles van pegados a una calle que **sí** tiene nombre en el callejero municipal, y
> lo heredan por vecindad: **§ 1.15**. El reparto queda 39,4 % OSM + 36,8 % municipal heredado =
> **76,3 % de las aristas con nombre**, y solo el 23,7 % se dice por su tipo.
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
> | **1** | El `name` del *way* en OSM | 35.124 | 39,4 % |
> | **2** | El `nombre_publico` del eje municipal más cercano (**§ 1.15**) | 32.808 | 36,8 % |
> | **3** | El genérico por su `highway` real — «el camino», «las escaleras» | 21.115 | 23,7 % |
>
> ⚠️ **Las cifras bajaron el 21/08 y no porque el cruce rinda menos.** La red pasó de 93.503
> aristas a 89.047 al cerrarle al peatón el carril bici (`motor/src/andando.ts`), y con ella se
> fueron 2.273 aristas de carril **con nombre en OSM** y 1.867 **con nombre heredado**. El
> reparto entre los tres niveles apenas se mueve; lo que encoge es el universo. Y «el carril
> bici» ya no puede salir en un paso: esa fila del nivel 3 existe, pero no se ejerce.
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
lo que caiga a su lado se queda con su nombre genérico.

⭐ **Y SÍ se puede escribir en el formulario, desde `4a4d3ab`** — aquí se decía lo contrario
mientras las vías sin portal no se sugerían, y el 27/08 dejó de ser verdad. Ahora se resuelven
por el punto medio de su geometría, y **el hueco de `nombre_publico` no le estorba para eso**:
el nombre que se lee sale de § 1.3 y el punto de la geometría de aquí, que trae sus **23
vértices en una sola parte**. Son dos campos distintos y solo falta uno.

⚠️ **Lo que no sirve es buscarla por el nombre con el que esta ficha la llama.** `ÓSCAR LAÍNEZ
HERNÁNDEZ` es el `nombre_completo` **de esta capa**; § 1.3, que es de donde sale lo que se
escribe, la registra **por apellidos, con coma y sin la palabra GLORIETA**: `LAÍNEZ HERNÁNDEZ,
ÓSCAR`. Por eso es **la única de las 3.359 que no empieza por la palabra de su tipo** —la misma
excepción que cita `motor/src/gacetero.ts`—, y por eso «oscar lainez» no la encuentra y «lainez»
sí. **Falso conocido, declarado** —igual que el `---CRT` del punto 4—: no se enmienda nada.

```
$ node -e "…agrupar las 3.359 por tipoVia y ver por qué palabra empieza cada grupo…"
GL   31 empiezan por «glorieta»: 30  ← EXCEPCIONES: lainez x1
TOTAL de vías que no empiezan por la palabra dominante de su tipo: 1

$ curl 'localhost:3000/api/vias?q=oscar%20lainez'
[]
$ curl 'localhost:3000/api/vias?q=lainez'
15912 LAÍNEZ HERNÁNDEZ, ÓSCAR (portales 0) · 20217 CALLE MANUEL MUJICA LÁINEZ (portales 23)

$ POST /api/ruta  {origen: CALLE MAYOR 1, destino: {via:'15912', portal:'15912'}}
4333 m · 3120 s · avisos []
· Sal de Calle Mayor 1 y dirígete hacia el noroeste por Calle Espoz y Mina  (250 m)
  … ocho pasos …
· Laínez Hernández, Óscar está a la derecha
```

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
| *Ways* mudos del subgrafo que el peatón pisa | **28.554** | el universo del cruce |
| ✅ **Heredan nombre municipal** | **18.779** | **65,8 %** |
| Sin ningún eje a 25 m | 6.764 | 23,7 % — huerta, interior de manzana, parque |
| Con eje, pero **poca cobertura** (<50 %) | 2.123 | 7,4 % |
| **En disputa** — dos calles se lo reparten | 848 | 3,0 % |
| Sin geometría que muestrear | 40 | 0,1 % |

Y lo que eso le hace a los pasos, que es para lo que se ha traído:

| Aristas del subgrafo que el peatón pisa | | |
|---|---|---|
| Con `name` de OSM (§ 1.14) | 35.124 | 39,4 % |
| **+ nombre municipal heredado** | **32.808** | **+36,8 %** |
| **= con nombre** | **67.932** | **76,3 %** · 2.749,8 de 5.466,6 km |
| Siguen mudas, y se dicen por su tipo | 21.115 | 23,7 % |

**Cuesta unos 200 ms al arrancar** —cinco medidas: 186, 190, 196, 204 y 215— **y deja ~1,0 MB vivos.** El índice de los 67.583 segmentos de eje
**muere en cuanto termina el cruce**: lo único que sobrevive es el `Map` de *way* a nombre.

**La distancia media al eje heredado es 4,9 m (p50)**, 14,4 en el p90 y 22,4 en el p99. Cuadra
con lo que hay de una acera al centro de su calzada, y es la señal de que se está casando lo que
se cree que se está casando.

> ⚠️ **Lo que esta pieza NO garantiza, dicho aquí y no en el pie.** Que haya un eje al lado no
> demuestra que sea **su** eje. Las dos puertas —cobertura y disputa— tapan los casos en que la
> duda es visible, pero un *way* pegado a una sola calle hereda **siempre**, y si el callejero lo
> tiene mal, se hereda mal. El modo de fallo documentado del proyecto OpenSidewalks es
> exactamente ese: heredar la calle de enfrente. **No se ha auditado caso a caso**, y hasta que
> se haga, la cifra honrada es «76,3 % de aristas con nombre», no «76,3 % con el nombre correcto».

---

### 1.16 · Farmacias — Ayuntamiento de Zaragoza (API de equipamientos)

| | |
|---|---|
| **Qué es** | Las **313 farmacias** del término municipal, con su dirección, su teléfono y —310 de ellas— su coordenada. Es el **primer destino con nombre** del buscador: el punto 8 empieza aquí porque es la categoría más pequeña que sirve para estrenar el tubo entero |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **API REST de equipamientos**, no el WFS: `https://www.zaragoza.es/sede/servicio/equipamiento/category/740.json` · categoría **740 «Farmacias»**, del tema *Comercio Menor*. El WFS de IDEZar **no publica equipamientos** —sus capas son cartografía, urbanismo y movilidad—, así que esta es la única puerta |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)**, la misma que el resto del dato municipal · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Dónde está cumplida** | En el control de atribución del mapa, junto a la de OpenStreetMap, y en esta ficha |
| **Descarga** | **23/08/2026 15:33:54 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-23_zgzapi_equipamiento-farmacias_cabeceras.txt), con el `Set-Cookie` filtrado por norma. Pedida **dos veces con 29 segundos de diferencia**: byte a byte idéntica las dos |
| **Fecha del dato** | ⭐ **08/06/2026 14:06:36**, y esta vez **sí es del dato**. La cabecera `Last-Modified` lo declara, y **coincide al segundo con el `lastUpdated` más reciente de los 311 registros que lo traen**. No es el caso del `timeStamp` del WFS (§ 1.15), que era cuándo se compuso la respuesta: aquí la fecha va **dos meses y medio por delante** de la descarga |
| **Campos** | `id` · `title` · `calle` 312/313 · `tel` 310 · `geometry` 310 · `horario` 187 · `description` 44 · `email` 31 · `servicios` 5 · `url` 4 · `lastUpdated` 311 · y los técnicos `sameAs`, `uri`, `type`, `link` |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-23_zgzapi_equipamiento-farmacias.json`](app/data/2026-08-23_zgzapi_equipamiento-farmacias.json) · 185.805 bytes · sha256 `9c64ee1749de63c6d2231913948a7f8c02f2d7470b2fc3a9b7c7d277f86dc091` **verificado sobre un clon** |

**La consulta EXACTA, que es lo único que hace esto reproducible:**

```
curl -o app/data/2026-08-23_zgzapi_equipamiento-farmacias.json \
  "https://www.zaragoza.es/sede/servicio/equipamiento/category/740.json?srsname=wgs84&start=0&rows=3000"
```

⚠️ **`srsname=wgs84`, en minúsculas y con ese alias, o la coordenada no sirve.** Es la trampa
medida el 18/08: `srsname=EPSG:4326` devuelve **UTM 25830** y **el parámetro se ignora en
silencio** —no hay error, no hay aviso, solo números que parecen coordenadas y no lo son—. Con
`wgs84` llega `[-0.8963658…, 41.6449290…]`, el mismo sistema y el mismo orden que el grafo.

Y va por la regla de bytes de `.gitattributes`: es **una sola línea de 185.805 bytes** sin un solo
retorno de carro, y sin la regla el clon la devolvería con otro sha256 (bitácora nº3).

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| Registros | **313** |
| **Con coordenada** | **310** |
| **Sin coordenada** | **3** — ids `29916` (Cno. El Pilón, 57), `30105` (Avda. Tenor Fleta, 108) y `8714`, que además **no declara calle** |
| Dentro del entorno de Zaragoza | **310 de 310**: ninguna coordenada se va del término. El entorno es el rectángulo que ocupan los 46.150 portales del censo, ensanchado 250 m |
| ⭐ **Rescatadas por el callejero** | **7** — estaban a más de 50 m de su propia dirección, ver abajo |
| **En el índice del buscador** | **310** de 313 |
| `lastUpdated` | 311 de 313 · del **26/09/2023** al **08/06/2026** |

Los tres primeros coinciden con la sonda de solo lectura del 18/08 (313 / 310), que es lo que se
esperaba de un conjunto que su propio `Last-Modified` sitúa en junio.

#### ⭐ Las tres sin coordenada NO se sugieren, y eso es doctrina

**Regla de Antonio, 23/08: sin coordenada no existe.** Un destino que no se puede situar no se
puede enrutar, y ofrecerlo en la lista sería prometer una ruta que va a acabar en un aviso. Es lo
que hacen los geocodificadores: [DOC Pelias] indexa *venues* con su punto, y sin punto no hay
documento que indexar.

Así que las 310 con coordenada entran al índice de sugerencias y **las 3 restantes no aparecen
jamás en la pantalla**. No se borran ni se editan: siguen en el fichero, se cuentan en esta ficha
y el motor las declara al arrancar. **La ausencia se dice; el dato no se toca.**

#### ⭐ Y SIETE tienen coordenada que no vale: el callejero las vuelve a situar

La regla B mira si **hay** punto. No mira si el punto **está donde dice**, y aquí siete no lo
están: su coordenada publicada queda a más de **50 m** de la puerta que su propia dirección
declara. Cuatro de ellas —las de Rosales del Canal— comparten **el mismo vector de desvío**
(Δlon −0,001355 · Δlat −0,001868, con una milésima de milésima de diferencia entre ellas), que es
la firma de un datum mal aplicado y no de siete erratas sueltas.

**No se edita el fichero: se corrige al cargar.** El motor le pregunta al **callejero municipal**
—46.150 portales con coordenada, del mismo Ayuntamiento— dónde está la dirección que el propio
registro publica, y usa esa. Es el método del inventario panafricano de hospitales [Lancet Global
Health], que geocodificó sus listas contra los gaceteros nacionales en vez de fiarse de las
coordenadas que traían. La regla completa, con su umbral y sus fuentes, está en
[`motor/src/gacetero.ts`](motor/src/gacetero.ts).

| id | qué es (nunca su título — ver abajo) | coordenada municipal | portal del censo que se usa | desvío |
|---|---|---|---|---|
| `20445` | Farmacia · C/ Joaquín Rodrigo, 17, portal 1 | −0,948249 · 41,634777 | CALLE JOAQUÍN RODRIGO 17 (−0,946893 · 41,636646) | **236 m** |
| `20443` | Farmacia · C/ Desayuno con Diamantes, 23 | −0,931442 · 41,620380 | CALLE DESAYUNO CON DIAMANTES 23 (−0,930088 · 41,622248) | **236 m** |
| `8671` | Farmacia · C/ Ciudadano Kane, 31 | −0,926235 · 41,618571 | CALLE CIUDADANO KANE 31 (−0,924879 · 41,620438) | **236 m** |
| `20444` | Farmacia · C/ La Caza, 11 | −0,926325 · 41,615041 | CALLE LA CAZA 11 (−0,924971 · 41,616909) | **236 m** |
| `9013` | Farmacia · Avda. de la Ilustración, 14 | −0,933322 · 41,628981 | AVENIDA DE LA ILUSTRACIÓN 14 (−0,931025 · 41,629453) | **198 m** |
| `20530` | Farmacia · C/ Luis Pinilla Soliveres, 10 | −0,870529 · 41,678682 | CALLE LUIS PINILLA SOLIVERES 10 (−0,870533 · 41,678001) | **76 m** |
| `8939` | Farmacia · Avda. Alcalde Gómez Laguna, 28 | −0,912518 · 41,641210 | AVENIDA ALCALDE GÓMEZ LAGUNA 28 (−0,912066 · 41,641538) | **52 m** |

**Lo que se gana se ve andando.** La de Joaquín Rodrigo estaba a **401 m de calles** de su propio
portal: pedir la ruta desde su puerta hasta su puerta devolvía una ruta de cuatrocientos metros.
Ahora devuelve cero, que es lo que hay que andar para llegar a donde ya se está.

⚠️ **Y el umbral corta un continuo, no un hueco.** De las 201 direcciones que el emparejador
resuelve en las tres categorías, la mediana del desvío es **1 m** y el p90 son **11 m** — pero
entre los sanos hay casos de 24, 25, 38, 40, 42 y 45 m, justo debajo de la raya. Los 50 m son
decisión firmada (Antonio, 24/08), no un escalón que el dato dibuje solo.

#### 🔒 Dato personal: se cuenta, no se enseña

**274 de los 313 títulos llevan el nombre del titular** («Farmacia ‹Apellido, Nombre›»). Es dato
registral publicado como abierto y reutilizarlo es lícito, pero republicarlo nos haría
responsables del tratamiento sin necesidad ninguna.

**Decisión parlamentada, y es de presentación, no de edición:** la pantalla dice **«Farmacia» + la
dirección**, y el título con el titular **no sale a ninguna parte** — ni a la sugerencia, ni al
paso de la ruta, ni al log del motor, ni a una prueba. El fichero se queda **íntegro**: es el
patrón de los corchetes de § 1.3 — el dato entra como vino, y quien lo presenta decide qué se lee.

> ℹ️ La sonda de solo lectura del 18/08 anotó **268** con nombre de titular y hoy la cuenta da
> **274**. No se ajusta ninguno de los dos: la expresión que los cuenta no era la misma y el
> conjunto pudo moverse entre medias. **Lo que rige es el recuento de hoy sobre ESTE fichero**,
> que es el que está en el repositorio.

### 1.17 · Centros de salud — Ayuntamiento de Zaragoza (API de equipamientos)

| | |
|---|---|
| **Qué es** | Los **56 equipamientos** de la categoría municipal *Centros de Salud*: centros de salud propiamente dichos, **centros de especialidades**, **consultorios médicos** de los barrios rurales y algún centro de día. Los **56 traen coordenada** |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **API REST de equipamientos**: `https://www.zaragoza.es/sede/servicio/equipamiento/category/781.json` · categoría **781 «Centros de Salud»**, del tema **4 «Salud Pública y Consumo»**. La misma puerta que las farmacias (§ 1.16) y por el mismo motivo: el WFS de IDEZar no publica equipamientos |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Dónde está cumplida** | En el control de atribución del mapa y en esta ficha |
| **Descarga** | **24/08/2026 09:30:23 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-24_zgzapi_equipamiento-centros-salud_cabeceras.txt), con los **dos** `Set-Cookie` filtrados por norma. Pedida **dos veces**: byte a byte idéntica las dos |
| **Fecha del dato** | ⭐ **20/05/2026 15:58:21**, y **es del dato**: la cabecera `Last-Modified` **coincide al segundo** con el `lastUpdated` más reciente de los 55 registros que lo traen. Es el mismo cotejo que se le hizo a farmacias, y aquí también sale |
| **Campos** | `id` · `title` · `calle` · `geometry` · `type` · `link` · `uri` · `sameAs` **56/56** · `lastUpdated` 55 · `tel` 51 · `gradoacc` 17 · `accesibilidad` 16 · `horario` 4 · `description` 3 · `imagen` 3 · `email` 2 · y cinco más con un solo registro cada uno |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-24_zgzapi_equipamiento-centros-salud.json`](app/data/2026-08-24_zgzapi_equipamiento-centros-salud.json) · 75.702 bytes · sha256 `1683f1828fdb665f9df0804a0a4ab3369be71882d7d65672c62813fc10ec3428` **verificado sobre un clon** |

```
curl -o app/data/2026-08-24_zgzapi_equipamiento-centros-salud.json \
  "https://www.zaragoza.es/sede/servicio/equipamiento/category/781.json?srsname=wgs84&start=0&rows=3000"
```

⚠️ **`srsname=wgs84` en minúsculas**, la trampa del 18/08: con `EPSG:4326` llega UTM 25830 y el
parámetro **se ignora en silencio**. Está medida en § 1.16.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| Registros | **56** |
| **Con coordenada** | **56** — aquí no hay regla B que aplicar |
| Sin coordenada | **0** |
| ⭐ **Con coordenada que no vale** | **1** — el de Portugal, ver abajo |
| ⭐ **Corregidos a mano** | **1** — ese mismo, con la coordenada confirmada sobre el terreno |
| ⭐ **Rescatados por el callejero** | **2** — `9080` y `28600`, ver abajo |
| **En el índice del buscador** | **56** de 56 |
| `lastUpdated` | 55 de 56 · del **26/09/2023** al **20/05/2026** |

#### ⚠️ Una coordenada está en PORTUGAL, y se ha corregido A MANO

**`9090` «Centro de Salud Fernando El Católico», C/ Domingo Miral s/n** viene con
`lon = -8.184875 · lat = 41.542373`. Eso no es Zaragoza: es **Portugal**, a unos **610 km** al
oeste. Los otros 55 caen dentro del término.

**El proceso automático no podía arreglarlo.** El cheque de frontera lo caza —cae a 584 km del
rectángulo que ocupan los 46.150 portales del censo— pero el rescate por callejero no puede
salvarlo, porque su dirección es **«C/ Domingo Miral, s/n»** y sin número no hay portal que
devolverle. Coordenada inválida = sin coordenada, así que se quedó **fuera del índice**: el centro
de salud no se podía elegir. Mejor no ofrecerlo que mandar a alguien a Portugal.

**Y de ahí salió a la lista de confirmación manual, que es el paso que faltaba.** Es el método de
la base sanitaria de Kenia: lo que el proceso no puede arreglar se le manda **a quien conoce el
terreno** y vuelve confirmado. Aquí volvió el 24/08:

| | |
|---|---|
| Lo que dice el fichero municipal | `lon −8,184875 · lat 41,542373` — Portugal |
| **La coordenada buena** | **`lon −0,9011954 · lat 41,6402816`** |
| **Fuente** | **Confirmación manual de Antonio, Google Maps, 24/08/2026** |
| Motivo | Frontera: la coordenada municipal cae en Portugal |
| Comprobación independiente | La coordenada confirmada cae a **9 m del portal 11 de CALLE DOMINGO MIRAL**, que es justo la calle que el propio registro declara. La ida y vuelta, que con el punto publicado era imposible, ahora cierra |

**El fichero municipal no se toca.** La corrección vive en
[`motor/src/correcciones.ts`](motor/src/correcciones.ts) y se aplica **al cargar**, en memoria —el
precedente que ya sentó la validación espacial—. Es el patrón de las cinco correcciones declaradas
del callejero (§ 1.3) con una diferencia: allí se editó el fichero y aquí no hace falta.

Y lleva **tres candados**, porque una coordenada escrita a mano es la puerta más peligrosa de todo
esto. Los tres **impiden que el motor arranque** en vez de dejar pasar algo dudoso:

1. **Se escribió contra una coordenada municipal concreta**, que va apuntada. Si el Ayuntamiento
   publica otra, la corrección se escribió mirando otra cosa y hay que volver al caso.
2. **Pasa los dos cheques**, los mismos que el resto. Ni frontera ni distancia se le perdonan por
   venir de una persona.
3. **Se declara entera** —fuente y motivo— en el log de arranque y en esta ficha.

Con ella, el centro de salud vuelve al índice: se encuentra escribiendo «fernando el católico» con
el tipo en **Centros de Salud**, y la ruta desde Calle El Coloso 2 sale **6.000 m, 16 pasos, sin
avisos**.

#### ⭐ Y dos más estaban lejos de su propia dirección

| id | qué es | coordenada municipal | portal del censo que se usa | desvío |
|---|---|---|---|---|
| `9080` | Centro de Salud Almozara · C/ Batalla de Almansa, 17 | −0,904935 · 41,659571 | CALLE BATALLA DE ALMANSA 17 (−0,900023 · 41,662117) | **497 m** |
| `28600` | Centro de Salud Amparo Poch (Actur Oeste) · C/ Emilia Pardo Bazan, 2 | −0,892048 · 41,671347 | CALLE EMILIA PARDO BAZÁN 2 (−0,892895 · 41,672107) | **110 m** |

El de la Almozara es el desvío más grande de las tres categorías: su coordenada publicada cae
junto a **AVENIDA AUTONOMÍA 5**, a 27 m de ese portal y a casi medio kilómetro de la calle que él
mismo declara. La regla y sus fuentes, en [`motor/src/gacetero.ts`](motor/src/gacetero.ts); la
lista entera con las farmacias, en § 1.16.

#### La categoría es más ancha que su nombre

La 781 se llama «Centros de Salud» pero incluye **centros de especialidades** (Grande Covián,
Inocencio Jiménez, Ramón y Cajal, San José), **consultorios médicos** de barrio rural (San Juan de
Mozarrifar, Venta del Olivar, Villarrapa), un **centro de día** y el CMAPA. Se respeta la
clasificación del Ayuntamiento: reagrupar por nuestra cuenta sería editar el dato.

---

### 1.18 · Hospitales — Ayuntamiento de Zaragoza (API de equipamientos)

| | |
|---|---|
| **Qué es** | Los **17 hospitales y clínicas** de la categoría municipal. **15 traen coordenada**; 2 no |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **API REST de equipamientos**: `https://www.zaragoza.es/sede/servicio/equipamiento/category/780.json` · categoría **780 «Hospitales»**, tema **4 «Salud Pública y Consumo»** |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Dónde está cumplida** | En el control de atribución del mapa y en esta ficha |
| **Descarga** | **24/08/2026 09:30:24 GMT**, estado 200. Cabeceras en [`…_cabeceras.txt`](app/data/2026-08-24_zgzapi_equipamiento-hospitales_cabeceras.txt), con los dos `Set-Cookie` filtrados por norma. Pedida **dos veces**: byte a byte idéntica las dos |
| **Fecha del dato** | ⚠️ **NO CONSTA**, y es un hallazgo — ver abajo |
| **Campos** | `id` · `title` · `tel` · `lastUpdated` · `type` · `link` · `uri` · `sameAs` **17/17** · `calle` y `geometry` **15** · `url` 8 · `accesibilidad` y `gradoacc` 5 · `servicios` 4 · `email` 2 |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`app/data/2026-08-24_zgzapi_equipamiento-hospitales.json`](app/data/2026-08-24_zgzapi_equipamiento-hospitales.json) · 19.108 bytes · sha256 `46df1ff99a43a224f3b9fec4a4df76a6c38e6e4900ca21077644eba3efdd2dc8` **verificado sobre un clon** |

```
curl -o app/data/2026-08-24_zgzapi_equipamiento-hospitales.json \
  "https://www.zaragoza.es/sede/servicio/equipamiento/category/780.json?srsname=wgs84&start=0&rows=3000"
```

#### ⭐ Por qué aquí la fecha del dato NO CONSTA

En § 1.16 y en § 1.17 la cabecera `Last-Modified` se declara como fecha del dato **porque se
cotejó**: coincide al segundo con el `lastUpdated` más reciente de los registros. **Aquí no
coincide:**

| | |
|---|---|
| `Last-Modified` de la respuesta | **25/04/2025 10:56:36** |
| `lastUpdated` más reciente de los 17 | **15/03/2024 15:02:36** |
| Diferencia | **trece meses** |

Una cabecera que va trece meses por delante del registro más nuevo **no está describiendo al
dato**: describe otra cosa —cuándo se tocó el recurso, cuándo se recompuso; no consta—. Así que
`modified` **se omite** en el manifiesto en vez de copiarla, y la fila 24 del panel sale **gris**.
La regla que rige desde el punto 8 se cumple aquí en su otra dirección: *una fecha sin cotejar no
es la fecha del dato*.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| Registros | **17** |
| **Con coordenada** | **15** |
| **Sin coordenada** | **2** — `12288` «Clínica Actur» y `12289` «Clínica Almozara», que **tampoco declaran calle** |
| Dentro del entorno de Zaragoza | **15 de 15** |
| ⭐ Rescatados por el callejero | **0** — y no por casualidad: son recintos y quedan fuera del cheque de distancia, ver abajo |
| `lastUpdated` | 17 de 17 · del **26/09/2023** al **15/03/2024** |

**Regla B, otra vez:** las 2 sin coordenada no se sugieren, no se pueden elegir y no salen en
ninguna pantalla. Ni se borran ni se editan: siguen en el fichero y el motor las declara al
arrancar.

#### ⭐ Y ninguno pasa por el cheque de distancia: son RECINTOS

Las otras dos categorías comparan su coordenada con la puerta que su dirección declara y se
rescatan si están a más de 50 m (§ 1.16). **Los hospitales no**, y es decisión firmada (Antonio,
24/08).

Un hospital no es una puerta: es un recinto con varias. El **Miguel Servet** publica su punto a
**169 m** del portal de «Avda. Isabel La Católica, 3», y ese punto no está mal — cae a 1 m de
**CALLE GONZALO CALAMITA 4**, que es otra de las calles por las que se entra al recinto.
Rescatarlo lo movería de una entrada legítima a otra, con la ruta cambiando de lado del hospital
sin que nada mejore. Es el caso que describe **[Nominatim #536](https://github.com/osm-search/Nominatim/issues/536)**, y su arreglo documentado son las
entradas `entrance=*` de OpenStreetMap, que aquí **no están y no se inventan**.

El cheque de **frontera**, en cambio, se les pasa igual que a los demás: un recinto grande tampoco
puede estar en Portugal. Hoy los 15 con coordenada caen dentro, así que **0 rescatados y 0
inválidos**.

#### 🔓 Aquí el título SÍ se lee, y por qué

Al revés que en farmacias (§ 1.16), donde el título lleva el nombre de la persona titular y **no
sale de la pantalla**, aquí el título es **institucional**: «Hospital Universitario Miguel Servet»,
«Centro de Salud Actur Sur», «Clínica Quirón (La Floresta)». No es dato de una persona física: es
el nombre del establecimiento, que es justo lo que alguien escribe para buscarlo.

**Se verificó antes de publicarlo, sobre los 73 títulos de las dos categorías:**

| | |
|---|---|
| Títulos **sin** ninguna palabra institucional | **0** de 73 |
| Títulos con el patrón «Apellido, Nombre» —el de farmacias— | **0** de 73 |

Que algunos lleven nombre de persona —Lozano Blesa, Royo Villanova, Miguel Servet— no cambia
nada: son **el nombre del edificio**, puesto en honor de alguien que lleva un siglo muerto, no el
titular de un negocio. La presentación es **título + dirección**.

---

### 1.19 · Bibliotecas — Ayuntamiento de Zaragoza (API de equipamientos)

> ⭐ **Esta categoría del proyecto se COMPONE de DOS categorías municipales**, y por eso la ficha
> lleva dos ficheros, dos huellas y dos filas de manifiesto. Se dice aquí arriba porque es lo
> primero que hace falta saber para leer los recuentos de abajo.

| | |
|---|---|
| **Qué es** | Las **77 bibliotecas** del término municipal, **75 con coordenada**. Es la cuarta categoría de sitios y la primera de fuera de la sanidad: bibliotecas públicas de barrio, universitarias, de fundaciones, de hospitales y de institutos de investigación |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **API REST de equipamientos**, **dos categorías**: `category/35.json` — **35 «Bibliotecas»**, tema 9 *Cultura y Ocio* (75 registros) — y `category/223.json` — **223 «Bibliotecas Especializadas»**, tema 13 *Información y Comunicación* (2 registros). La misma puerta que farmacias y sanidad (§ 1.16, § 1.17, § 1.18) |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Dónde está cumplida** | En el control de atribución del mapa y en esta ficha |
| **Descarga** | **25/08/2026 15:50:17 GMT** (la 35) y **15:50:22 GMT** (la 223), estado 200 las dos. Cabeceras en [`…-bibliotecas_cabeceras.txt`](app/data/2026-08-25_zgzapi_equipamiento-bibliotecas_cabeceras.txt) y [`…-bibliotecas-especializadas_cabeceras.txt`](app/data/2026-08-25_zgzapi_equipamiento-bibliotecas-especializadas_cabeceras.txt), con el `Set-Cookie` filtrado por norma. **Cada una pedida dos veces**: byte a byte idéntica las dos veces |
| **Fecha del dato** | ⭐ **Distinta en cada fichero, y las dos por el mismo cotejo** — ver abajo |
| **Campos** (la 35) | `sameAs` · `id` · `title` · `uri` · `calle` · `type` · `link` **75/75** · `tel` y `lastUpdated` 74 · `geometry` 73 · `url` 72 · `email` 70 · `horario` 46 · `description` 42 · `imagen` 33 · `servicios` 30 · `poblacion` y `tipo` 27 · `accesibilidad` 15 · `gradoacc` 9 · `relacionado` 8 · `historia` 2 |
| **¿Está en este repo?** | ✅ **Sí, los dos tal cual**: [`…-bibliotecas.json`](app/data/2026-08-25_zgzapi_equipamiento-bibliotecas.json) · 152.700 bytes · sha256 `852eb219a5db3d633c7b995b01d66c9e83ed1465d1a464f7f4220c8e46378a67` · y [`…-bibliotecas-especializadas.json`](app/data/2026-08-25_zgzapi_equipamiento-bibliotecas-especializadas.json) · 4.503 bytes · sha256 `355c5ffc5fb3fc3cfbdc2f896bd651112dc7fc6f91e0000baf9be47be6798d33`. Los dos **verificados sobre un clon** |

**Las consultas EXACTAS, que es lo único que hace esto reproducible:**

```
curl -o app/data/2026-08-25_zgzapi_equipamiento-bibliotecas.json \
  "https://www.zaragoza.es/sede/servicio/equipamiento/category/35.json?srsname=wgs84&start=0&rows=3000"

curl -o app/data/2026-08-25_zgzapi_equipamiento-bibliotecas-especializadas.json \
  "https://www.zaragoza.es/sede/servicio/equipamiento/category/223.json?srsname=wgs84&start=0&rows=3000"
```

⚠️ **`srsname=wgs84` en minúsculas**, la trampa del 18/08: con `EPSG:4326` llega UTM 25830 y el
parámetro **se ignora en silencio**. Está medida en § 1.16. Comprobado aquí sobre lo descargado:
lon entre **−1,08357 y −0,79718**, lat entre **41,60563 y 41,76219** — grados, no metros.

#### ⭐ Por qué son DOS categorías, y por qué la tercera queda fuera

El catálogo municipal (`/sede/servicio/equipamiento.json`, 19 familias) tiene **tres** categorías
con bibliotecas dentro. Se sondearon las tres antes de descargar nada:

| id | título | familia | registros | con coordenada | ¿entra? |
|---|---|---|---|---|---|
| **35** | Bibliotecas | Cultura y Ocio | **75** | **73** | ✅ |
| **223** | Bibliotecas Especializadas | Información y Comunicación | **2** | **2** | ✅ |
| 4 | Archivos, bibliotecas y documentación | Educación | 55 | 54 | ❌ |

**La 223 entra porque sus dos no están en ninguna otra parte** —la Biblioteca del Museo de Goya y
El Kiosco de las Letras—, y son bibliotecas.

**La 4 queda fuera, y el motivo se escribe:** de sus 55 registros, **35 ya están en la 35**, y sus
**20 exclusivos son archivos, hemerotecas y unidades técnicas** —Archivo Histórico Provincial,
Hemeroteca Municipal, «Unidad de Sistemas de Reproducción Documentos»—, ninguno de los cuales es
una biblioteca a la que se vaya a por un libro. Decisión de Antonio, 25/08. Si algún día
interesan, entran **como categoría propia con su icono**, no coladas en esta.

**Y se deduplica por id**, porque componer dos fuentes obliga a ello: si un equipamiento
apareciera en las dos, entraría una sola vez. Medido sobre lo descargado: **0 duplicados**
—`35 ∩ 223 = 0`— y **0 ids repetidos dentro de cada fichero**. La cifra se cuenta igual, esté a
cero o no: es la que avisaría el día que el Ayuntamiento mueva un registro de categoría.

#### ⭐ La fecha del dato: la misma jurisprudencia, dos veredictos

| | categoría 35 | categoría 223 |
|---|---|---|
| `Last-Modified` de la respuesta | **23/06/2026 13:46:18** | **25/04/2025 10:56:36** |
| `lastUpdated` más reciente | **23/06/2026 13:46:18** (74 de 75 lo traen) | **26/09/2023 14:48:29** (los 2) |
| Diferencia | **ninguna: coincide al segundo** | **diecinueve meses** |
| `modified` en el manifiesto | **se declara** | **se omite**, y se dice por qué |

⚠️ **Y hay un detalle que refuerza lo que § 1.18 ya sospechaba.** El `Last-Modified` de la 223 es
**exactamente el mismo, al segundo, que el de la categoría 780 de hospitales**: `Fri, 25 Apr 2025
10:56:36 CEST`. Una fecha que **dos categorías distintas comparten al segundo** no está
describiendo a ninguna de las dos — describe otra cosa del servidor. Aquella lectura se hizo con
un solo caso; ahora hay dos que la sostienen.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| Registros | **77** = 75 (cat. 35) + 2 (cat. 223) |
| **Duplicados por id entre las dos** | **0** |
| **Con coordenada** | **75** |
| **Sin coordenada** | **2** — `20362` «Biblioteca Ibercaja José Sinués» (Paseo Fernando el Católico, 1-3) y `20351` «Biblioteca de la Universidad San Jorge» (Autovía A-23, Km. 510). Las dos **sí declaran calle** |
| Dentro del entorno de Zaragoza | **75 de 75** |
| ⭐ Rescatadas por el callejero | **0** — y no por casualidad: son recintos, ver abajo |
| **En el índice del buscador** | **75** de 77 |
| `lastUpdated` | 76 de 77 |

**Regla B, otra vez:** las 2 sin coordenada no se sugieren, no se pueden elegir y no salen en
ninguna pantalla. Ni se borran ni se editan: siguen en el fichero y el motor las declara al
arrancar.

ℹ️ **Dos registros comparten título y son dos sitios distintos**: «Biblioteca de la Estación
Experimental del Aula Dei» son los ids `12460` (Ctra. del aeropuerto, s/n) y `12280` (Avda.
Montañana, 1005), a más de **20 km** el uno del otro. No es un duplicado: son dos sedes, y por eso
la deduplicación va por **id** y no por título.

#### ⭐ Las bibliotecas son RECINTO, no puerta — y eso lo decidió el dato

Farmacias y centros de salud pasan por el **cheque de distancia**: si su coordenada queda a más de
50 m del portal que su propia dirección declara, se les rescata al portal (§ 1.16). **Las
bibliotecas no**, igual que los hospitales (§ 1.18), y por la misma razón: **muchas son un cuarto
dentro de un edificio mayor** —de un hospital, de una facultad, de un instituto de investigación,
de un centro cívico—, así que su punto no está «mal» cuando se aleja de la puerta que la dirección
nombra: está **en otra parte del recinto**. Es el precedente firmado del Miguel Servet (24/08).

Y esta vez la decisión no se tomó por analogía, sino **con el dato delante**. Aplicando el cheque
de chicos se habrían movido **8**, y la ida y vuelta dice que **las 8 están bien puestas**:

| id | qué es | desvío a su dirección | dónde cae su punto de verdad |
|---|---|---|---|
| `12521` | Biblioteca del CITA | **4.825 m** | a **19 m** de AVENIDA MONTAÑANA 216 |
| `12280` | Estación Experimental Aula Dei | 346 m | a 149 m de AVENIDA MONTAÑANA 999 |
| `12323` | Instituto Agronómico Mediterráneo | 346 m | al **mismo punto** que la anterior |
| `12329` | Instituto Aragonés de Ciencias de la Salud | 297 m | a 4 m de CALLE GALÁN GIMÉNEZ 13 |
| `12320` | **Biblioteca del Hospital Miguel Servet** | 169 m | a 1 m de CALLE GONZALO CALAMITA 4 |
| `12282` | Instituto de Carboquímica | 142 m | a 41 m de CALLE MARÍA DE LUNA 8 |
| `12284` | Instituto Aragonés de Antropología | 125 m | a 1 m de CALLE DOMINGO MIRAL 3 |
| `8165` | María Moliner (Facultad de Filosofía y Letras) | 123 m | a 62 m de CALLE PEDRO CERBUNA 9 |

**El caso que lo cierra es el quinto**: la biblioteca **del Hospital Miguel Servet** tiene el mismo
desvío de 169 m que el hospital, y su punto cae a 1 m del mismo portal de la calle Gonzalo
Calamita. El hospital ya está declarado recinto y **no se mueve**; su biblioteca, tratada como
«chico», **sí se movería**. El mismo edificio, dos criterios distintos dentro del mismo motor.

**Y no cuesta nada**, que es lo que cierra la decisión: de las bibliotecas que **sí** son un
edificio con dirección propia —«Biblioteca Pública», «Municipal», «para Jóvenes»—, las 14 cuya
dirección casa en el callejero tienen un desvío de **mediana 8 m y máximo 38 m**, por debajo del
umbral. El cheque de distancia **no habría cazado ni una**.

**El cheque de FRONTERA sí se les aplica**, como a todas: hoy las 75 caen dentro. Si alguna se
saliera y no se pudiera rescatar por su dirección, iría a la **lista de confirmación manual** como
le pasó al `9090` de § 1.17.

#### 🔓 El título SÍ se lee, verificado antes de publicarlo

Igual que en sanidad (§ 1.18) y al revés que en farmacias (§ 1.16), aquí el título es
**institucional** y es justo lo que alguien teclea: «Biblioteca Pública Benjamín Jarnés
(Actur-Rey Fernando)», «Biblioteca para Jóvenes Cubit». **Se verificó antes de publicarlo, sobre
los 77:**

| | |
|---|---|
| Títulos con el patrón «Apellido, Nombre» —el de farmacias— | **0** de 77 |
| Títulos **sin** ninguna palabra institucional | **0** de 77 |

Que muchos lleven nombre de persona —Benjamín Jarnés, Soledad Puértolas, Ricardo Magdalena— no
cambia nada: es **el nombre del edificio**, puesto en honor de alguien, no el titular de un
negocio. La presentación es **título + dirección**.

> ⚠️ El primer contador dio **1 sin palabra institucional** —«Cáritas Diocesana»— y era **fallo del
> contador**, no del dato: su lista de palabras llevaba `caritas` sin tilde y el título la lleva.
> Corregido, salen 0. Se anota porque una verificación que se cree a la primera no es una
> verificación.

---

### 1.20 · Educación — Ayuntamiento de Zaragoza (API de equipamientos)

> ⭐ **Aquí NO hay una categoría del proyecto, sino TRES**, y las tres salen de la misma familia
> municipal (`tema` 11 «Educación»). Cada una compone sus propias categorías municipales: son
> **once ficheros** para tres etiquetas. Se dice aquí arriba porque es lo primero que hace falta
> saber para leer los recuentos de abajo.
>
> **La partición en tres es la de la taxonomía de OpenStreetMap**, firmada por Antonio el 25/08:
> `amenity=school` cubre de los ~6 a los ~18 y **admite varios niveles en un elemento**,
> `amenity=kindergarten` es el preescolar —`preschool` quedó obsoletado a su favor— y
> `amenity=university` el campus terciario. La FP va con los institutos porque en España vive en
> los IES y los CIFP.

| | |
|---|---|
| **Qué es** | **357 centros de enseñanza** del término municipal, **346 con coordenada**, repartidos en tres categorías del buscador: **Colegios e Institutos** (264, 254 con coordenada), **Guarderías** (64, las 64) y **Universidades** (29, 28) |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **API REST de equipamientos**, **once categorías** de la familia 11 «Educación». La misma puerta que farmacias, sanidad y bibliotecas (§ 1.16 a § 1.19) |
| **Licencia** | **Licencia general de reutilización del Ayuntamiento de Zaragoza — [Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** · [condiciones](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones) |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Dónde está cumplida** | En el control de atribución del mapa y en esta ficha |
| **Descarga** | **27/08/2026, de 06:31:39 a 06:31:43 GMT**, estado 200 las once. Cabeceras en los once `…_cabeceras.txt` de [`app/data/`](app/data/), con el `Set-Cookie` filtrado por norma |
| **Fecha del dato** | ⭐ **Nueve por `Last-Modified`, dos omitidas** — y esta vez la regla del servidor se pudo demostrar. Ver abajo |
| **Campos** (Colegios) | `sameAs` · `id` · `title` · `uri` · `calle` · `type` · `link` **264/264** · `tel` y `lastUpdated` 262 · `geometry` 254 · `email` 236 · `url` 222 · `description` 168 · `servicios` 140 · `imagen` 123 · `horario` 61 · `tipo` 9 · `accesibilidad` 5 · `poblacion` 3 · `imagenPortada` 1 |
| **Campos** (Guarderías) | `sameAs` · `id` · `title` · `tel` · `lastUpdated` · `uri` · `calle` · `geometry` · `type` · `link` **64/64** · `description` 63 · `email` 44 · `servicios` 31 · `url` 15 · `imagen` 13 · `horario` 12 · `poblacion` 11 · `tipo` 10 · `accesibilidad` 1 |
| **Campos** (Universidades) | `sameAs` · `id` · `title` · `tel` · `lastUpdated` · `uri` · `calle` · `type` · `link` **29/29** · `geometry` 28 · `url` 27 · `email` 26 · `accesibilidad` 18 · `gradoacc` 4 · `description` y `servicios` 2 |
| **¿Está en este repo?** | ✅ **Sí, los once tal cual**, 676.993 bytes en total. Uno a uno en la tabla de abajo, **verificados sobre un clon** |

#### ⭐ LA COMPOSICIÓN TRIPLE: qué categoría municipal va a qué etiqueta

| etiqueta del proyecto | id | categoría municipal | fichero | registros | sha256 |
|---|---|---|---|---|---|
| **Colegios e Institutos** | 61 | Educación Infantil | [`…-educacion-infantil.json`](app/data/2026-08-27_zgzapi_equipamiento-educacion-infantil.json) | 141 | `985eee846a92377cfd368bc227d98129ce08049dcc623b497914088806466fb0` |
| | 62 | Educación Primaria | [`…-educacion-primaria.json`](app/data/2026-08-27_zgzapi_equipamiento-educacion-primaria.json) | 138 | `a4783cbc798084c3500bdbb9288bf6f2fb9688b54355455f8559ea890bd8f3bd` |
| | 63 | Educación Secundaria | [`…-educacion-secundaria.json`](app/data/2026-08-27_zgzapi_equipamiento-educacion-secundaria.json) | 104 | `0423270c853d0989f8896708b46a1c3f4e02de22d30a3be3f935dbbcd57f2218` |
| | 2060 | Bachillerato | [`…-bachillerato.json`](app/data/2026-08-27_zgzapi_equipamiento-bachillerato.json) | 7 | `080e51f8bae292a735b9ebdb579ee7abe1011da1ab1a00f173c08c2e358af926` |
| | 2061 | Ciclos Formativos | [`…-ciclos-formativos.json`](app/data/2026-08-27_zgzapi_equipamiento-ciclos-formativos.json) | 56 | `8dcafa1fb3cb2855ec1e88c2cfc88b4bad0fec6764cf8a44f3497d96c7c62383` |
| | 680 | Formación Profesional | [`…-formacion-profesional.json`](app/data/2026-08-27_zgzapi_equipamiento-formacion-profesional.json) | 49 | `bb9877b4596dc663434cd833c9f0edbf95174ec48000efb818dc1fa3602bbf2b` |
| | | 64 | Educación Especial (de los 19 entran **6**) | [`…-educacion-especial.json`](app/data/2026-08-27_zgzapi_equipamiento-educacion-especial.json) | 19 | `1570c9bc0333d92820ac69ada7aa7f566ef87a88cb9d4fba48b5b17f60512725` |
| **Guarderías** | 460 | Escuela Infantil | [`…-escuela-infantil.json`](app/data/2026-08-27_zgzapi_equipamiento-escuela-infantil.json) | 65 | `6583a84f8168d978e515cdaded94175d54402f71981a31e65b3f0de3b501b46b` |
| **Universidades** | 280 | Universitaria | [`…-universitaria.json`](app/data/2026-08-27_zgzapi_equipamiento-universitaria.json) | 14 | `cd6048ee69f86409e87c062541d669636b88d6b1e3ec7a5e91972351434c1699` |
| | 2300 | Colegios mayores | [`…-colegios-mayores.json`](app/data/2026-08-27_zgzapi_equipamiento-colegios-mayores.json) | 8 | `60d8495fc891393500776136fd05884fbab94bc8fe24400f375796dea4619402` |
| | 2280 | Residencias de Estudiantes | [`…-residencias-estudiantes.json`](app/data/2026-08-27_zgzapi_equipamiento-residencias-estudiantes.json) | 7 | `cd1087823a64f518d02dca6bc7522638fd87e62346f4e8ce7961925a6e892579` |

**Y las tres cuentas, que no se deducen de la tabla porque hay que quitar repetidos:**

```
Colegios e Institutos   514 filas (141+138+104+7+56+49+19)
                      − 234 repetidos   ← el mismo colegio fichado en varias etapas
                      −  16 excluidos   ← ver el reparto de abajo
                      = 264 distintos · 254 con coordenada · 10 sin

Guarderías               65 filas − 1 excluido  =  64 · las 64 con coordenada
Universidades            29 filas − 0 excluidos =  29 ·  28 con coordenada · 1 sin
```

Los **234 repetidos** son la partición de OSM funcionando: un centro que hace infantil, primaria y
secundaria está fichado en las tres categorías municipales y aquí es **un colegio**, no tres.

⚠️ Dos de las siete fuentes de Colegios —**62 «Educación Primaria»** y **2060 «Bachillerato»**— no
aportan **ni un id exclusivo**: todo lo suyo entra ya por otra. Se declaran como fuente igualmente
porque **aportan confirmación**, y porque el día que el Ayuntamiento fiche un colegio solo en una
de ellas, entrará sin que nadie tenga que darse cuenta.

#### ⭐ Las CUATRO decisiones de reparto, firmadas por Antonio el 25/08

Las cuatro salieron de mirar el dato **antes** de descargarlo, y las cuatro se llevaron a la mesa
porque el motor no debía resolverlas solo.

**1 · La categoría 660 «Centros Educativos» queda FUERA.** Es un paraguas de 213 registros, y
medido: **no aporta ni un centro escolar** que no venga ya por su etapa. Sus 29 exclusivos son
13 facultades —que van a Universidades— y **16 que pertenecen a tags propios que esta tanda no
trae**: cuatro conservatorios y tres escuelas municipales de música, danza y teatro
(`amenity=music_school`), la E.O.I. Nº1 Extensión (`amenity=language_school`), los cuatro
C.P.E.P.A. de adultos (`education=centre`), la Escuela Municipal de Jardinería El Pinar, la
Universidad Popular, el «Aula Bosque del CEIP Valdespartera» —que es un aula y no un centro, y
viola la regla de un-solo-elemento-por-colegio— y la empresa «Arqueología y Didáctica».

**2 · Las 13 facultades, SOLO en Universidades.** `amenity=university` es el campus terciario y
`school` es de 6 a 18. Entraban dos veces porque estaban en la 660 y en la 280; con la 660 fuera,
el solape muere solo.

**3 · Las cuatro escuelas infantiles del doble fichaje.** El municipio ficha cuatro registros a la
vez en «Educación Infantil» (61) y en «Escuela Infantil» (460). Tres van a **Guarderías** —el
4886, el 8566 y el 28948—, porque `kindergarten` es el tag del preescolar. El cuarto, el **8592
«Col. Virgen de Guadalupe»**, es un colegio completo (infantil + primaria) y va a **Colegios e
Institutos**, una sola vez.

**4 · De los 19 de «Educación Especial», entran SEIS.** Los colegios de necesidades especiales son
`amenity=school`: el 2713 «C.E.E. Alborada», el 30195 «C.E.E. María Soriano» —que **no trae
coordenada**, así que se cuenta y no se sugiere, regla B—, el 13944 «Col. San Germán (Aspace)», el
9609 «C.E.E. Jean Piaget», el 608 «C.E.E. Rincón de Goya» y el 2715 «C.E.E. Ángel Rivière».

Los otros trece quedan fuera. Diez son **servicios sociosanitarios** —tres centros de día, seis
fundaciones de atención a la discapacidad y el «Hospital de Día Infanto Juvenil Miguel Servet»,
que además ya vive en la categoría hospital—, y en la taxonomía son `social_facility` y
`healthcare`, no centros de enseñanza. Los otros tres entran igualmente, pero por otra fuente:
están fichados también en Ciclos Formativos o en FP.

> ⚠️ **Los tres últimos llegaron con un día de retraso, y merece quedar escrito por qué.** La firma
> del 25/08 decía «entran los tres C.E.E.» nombrando ids, porque en la mesa solo aparecían los que
> llegaban en exclusiva por la 64 — y el 9609, el 608 y el 2715 llegaban **por la categoría 660**,
> que **la misma firma sacó**. La letra los dejaba fuera y la doctrina los metía. Entraron el
> 27/08, y por eso los colegios son 264 y no 261: **una lista de ids firmada sobre una mesa deja
> de valer si otra decisión de la misma mesa cambia de dónde vienen**.

**Las consultas EXACTAS, que es lo único que hace esto reproducible:**

```
for id in 61 62 63 2060 2061 680 64 460 280 2300 2280; do
  curl "https://www.zaragoza.es/sede/servicio/equipamiento/category/$id.json?srsname=wgs84&start=0&rows=3000"
done
```

⚠️ **`srsname=wgs84` en minúsculas**, la trampa del 18/08: con `EPSG:4326` llega UTM 25830 y el
parámetro **se ignora en silencio**. Está medida en § 1.16. Comprobado aquí sobre lo descargado:
lon entre **−1,03516 y −0,78868**, lat entre **41,58676 y 41,72097** — grados, no metros.

#### ⚠️ Estos ficheros NO se pueden volver a descargar idénticos, y no es culpa nuestra

El ritual pide cada fichero **dos veces** y comparar. Aquí la comparación **falla en 7 de los 11**,
y se investigó antes de escribir esta ficha:

```
identicas al BYTE ........................  4 de 11
identicas como JSON ......................  4 de 11
identicas ordenando el array `type` ...... 11 de 11
```

Lo único que se mueve es **el orden de las URLs dentro del array `type`** de cada registro: mismos
ids, mismos valores, distinta permutación. El tamaño en bytes ni siquiera cambia. Dos peticiones
seguidas sí salen iguales; entre una descarga y otra un rato después, no.

Así que **el contenido es reproducible y el fichero no**, y las dos cosas se dicen. No afecta a
nada de aquí dentro: el motor no lee `type`, y la prueba del manifiesto compara el `sha256` contra
**el fichero en disco**, que no se mueve. Lo que deja de valer es la promesa de «descárgalo otra
vez y te sale el mismo byte», que sí valía en § 1.19.

#### ⭐ La regla del `Last-Modified` de esta API, por fin demostrada

§ 1.18 sospechaba y § 1.19 confirmó que **dos categorías compartían fecha al segundo**. Con las 43
categorías de la familia Educación delante se puede decir qué pasa, y no es una casualidad:

```
categorías con su registro más nuevo POSTERIOR al 2025-04-25 .... 26
   de esas, Last-Modified coincide AL SEGUNDO con ese registro ... 26   (26 de 26)

categorías con su registro más nuevo ANTERIOR .................... 14
   de esas, devuelven «Fri, 25 Apr 2025 10:56:36 CEST» ........... 13
categorías sin ningún `lastUpdated` ..............................  3
   las tres devuelven esa misma fecha
```

**`Fri, 25 Apr 2025 10:56:36 CEST` es un SUELO del servidor**, no una fecha del dato: sale cuando
nada se ha tocado desde entonces. La devuelven **dieciséis** categorías de esta familia, y también
los hospitales (§ 1.18) y las bibliotecas especializadas (§ 1.19) — que es la tercera y la cuarta
vez que aparece, y ahora se sabe por qué. La única excepción medida es la categoría 2140 «Espacio
de formación», que devuelve una tercera fecha que tampoco describe a sus registros.

Por eso aquí **nueve ficheros declaran `modified` y dos lo omiten**: `bachillerato` (2060) y
`universitaria` (280) devuelven el suelo, y copiar una fecha de despliegue como fecha del dato
sería inventar. Los otros nueve coinciden al segundo con su propio registro más reciente, cotejado
uno a uno.

⚠️ Y ahí sale otra pareja que **sí** es legítima: `educacion-infantil` (61) y `escuela-infantil`
(460) declaran las dos `Tue, 26 May 2026 13:33:58 CEST`. No es el suelo — es que el registro más
reciente de las dos categorías **es el mismo equipamiento**, fichado en ambas. Compartir fecha no
es sospechoso por sí solo; lo sospechoso es compartirla sin que ningún registro la respalde.

**Y ninguno declara `accrualPeriodicity`:** el Ayuntamiento no publica cada cuánto refresca estas
categorías. En el panel salen **grises**, que es la verdad.

#### 🔒 Los títulos: cero nombres de persona, verificado sobre los 357

Igual que en sanidad y bibliotecas, y al revés que en farmacias (§ 1.16), aquí el título es
**institucional** y se lee: es el nombre del centro y es lo que alguien teclea. «C.E.I.P. María
Moliner» es el nombre del colegio, no su titular — el mismo caso que Miguel Servet o Lozano Blesa.

Verificado antes de publicarlos, sobre los 357 que entran:

- **6 con el patrón «Apellido, Nombre»** —el que dispara en farmacias— y **los seis son empresas**:
  `Aneto, Sociedad Cooperativa Limitada` · `Ceserpi, SL` · `Emaragón, SL` · `Minueval, SL` ·
  `Performance, SL` · `Umbela, SCDAD. COOP. LTDA.` La coma es de la forma jurídica, no de un
  apellido. Son las empresas de FP dual: persona jurídica, y se leen.
- **4 sin ninguna palabra ni sigla institucional**, y ninguno es una persona: `Condes de Aragón
  (FP)` · `ETOPIA - Zaragoza Activa` · `Stylepack` · `Xior Zaragoza`.
- **357 títulos distintos de 357**, y ninguno vacío.

> ⚠️ **El contador de esta verificación falló dos veces antes de dar la cifra buena**, y se anota
> por lo mismo que el «Cáritas» de § 1.19: sin las siglas punteadas en su lista —`C.E.I.P.`,
> `I.E.S.`, `C.P.I.`, `C.E.E.`, `C.P.E.P.A.`, `E.O.I.`, `Col.`, `G.I.`— daba **325 falsos
> positivos** sobre los mismos datos. Una verificación que se cree a la primera no es una
> verificación.

**Y esas mismas siglas obligaron a tocar el buscador.** El troceador parte por lo que no es letra
ni número, así que «C.E.I.P. María Moliner» se troceaba en `c`, `e`, `i`, `p`, `maria`,
`moliner` — y **escribir «ceip moliner» no encontraba nada**. Como la sigla *es* el nombre de un
colegio, la categoría entera habría nacido inencontrable. Ahora lo buscable lleva **las dos
formas**: la punteada del dato y la sigla entera (`conSiglasEnteras`, en `motor/src/sitios.ts`).

#### La validación espacial: colegios y guarderías CHICOS, universidades RECINTO

Firmado el 25/08 y aplicado: colegios y guarderías pasan **frontera y distancia** —un colegio
tiene una puerta y su dirección es esa puerta—, y universidades solo **frontera**, como hospitales
y bibliotecas: un campus tiene varias entradas y sus facultades están repartidas por dentro. Es el
precedente firmado del Miguel Servet (24/08).

**Ninguno de los 357 cae fuera del término municipal**: cero inválidas, y la lista de confirmación
manual sigue vacía.

⭐ **Y el cheque de distancia se arregló el mismo día que lo estrenaron.** Los colegios lo
dispararon 19 veces, y al mirar los rescates uno a uno salió que **22 de los 29 de toda la casa
movían coordenadas que ya estaban en su sitio**. Un colegio tiene la fachada larga y su punto cae
donde cae: estar lejos del NÚMERO que la dirección declara no es un error si el punto está en esa
misma calle. Desde el cierre de la nº13, el rescate exige que el punto esté lejos de **la vía
entera**, y los rescates bajan de **29 a 17**.

⭐ **Y el mismo día se cerró el segundo, que era el que lo empezó todo.** El **C.E.I.P. Andrés
Oliván** aterrizaba en la ciudad porque su dirección dice «C/ Doctor Alejandro Palomar» y la calle
donde está, en San Juan de Mozarrifar, se llama **«Doctor Palomar»** — dos nombres distintos, sin
homónimo que desambiguar. Desde la nº14, un nombre del callejero que quepa **dentro** del escrito
—en orden y con palabras enteras, que es lo que impide que «mina» quepa en «taormina»— también es
candidato, y gana el que tenga una puerta cerca. El colegio vuelve a su barrio y los rescates
quedan en **16**: **10 de colegios y 1 de guarderías**.

---

### 1.21 · Etiquetas del viario de OpenStreetMap — el sentido y la velocidad

| | |
|---|---|
| **Qué es** | **Las 65.223 vías del ámbito del grafo con su juego de etiquetas ENTERO**: `oneway`, `maxspeed`, `bicycle`, `cycleway:*`, `access`, `surface`… Es lo que el grafo de § 1.4 **no lleva** —barridas sus 98.774 aristas, traen 9 campos y ninguno de sentido— y lo que la rueda necesita para saber por dónde puede ir y en qué dirección |
| **Origen del dato** | **OpenStreetMap**, vía **Overpass API 0.7.62.11 87bfad18**. El fichero declara `timestamp_osm_base` **`2026-08-28T15:24:06Z`** |
| **Licencia** | **ODbL 1.0**, como § 1.1, § 1.4 y § 1.14. El fichero **la trae escrita dentro**, en `osm3s.copyright` |
| **Atribución** | Cumplida por el mapa base de § 1.1 —«© **colaboradores** de OpenStreetMap»—, siempre encendido |
| **Zona** | bbox **41,4011–41,982 N · −1,2199–−0,6541 O**, que es **exactamente el declarado por § 1.4**: el ámbito a cubrir es el del grafo, y usar otro dejaría aristas suyas sin etiqueta |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`motor/data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json`](motor/data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas.json) · 11.271.911 bytes · sha256 `4a1c4f9c15c9cc6de57f44742fdcf9adc6175e88bfbff1507c28c8eb34a6150d` **verificado sobre un clon** · cabeceras en [`…_cabeceras.txt`](motor/data/2026-08-28_osm_overpass_zaragoza-bbox_viario-etiquetas_cabeceras.txt) |

**La consulta EXACTA, que es lo único que hace esto reproducible:**

```
[out:json][timeout:300];
way["highway"](41.4011,-1.2199,41.982,-0.6541);
out tags;
```

Es **la de § 1.14 sin el filtro de nombre**, y de ahí sale todo lo demás. La doctrina de la
extracción es la de **[DOC CycleStreets]**, el planificador ciclista de referencia, cuya tubería
documentada rellena *«highway, cycleway, access, bicycle, foot y oneway desde sus tags OSM»*: son
las etiquetas que se piden aquí, y se piden **todas**, sin filtrar ninguna — filtrar sería editar
el dato antes de guardarlo.

> ⚠️ **Se pidió DOS VECES y NO repite al byte.** Las dos descargas miden **11.271.911 bytes
> exactos** y difieren en **un solo byte, el 125**: el minuto de `timestamp_osm_base`
> (`15:24:06Z` frente a `15:25:06Z`). Los **65.223 elementos son idénticos serializados**. Es el
> precedente de § 1.20: se declara qué baila, y lo que baila es el reloj del corte de la base,
> no el dato. Entra la primera.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| *Ways* | **65.223**, los 65.223 con `highway` |
| Con `name` | 22.337 · **34,2 %** |
| **Con `oneway`** | **15.956 · 24,5 %** — `yes` 14.391 · `no` 1.557 · **`-1` 8** |
| **Con `maxspeed`** | **9.591 · 14,7 %** |
| Con `bicycle` | 1.607 · con `access` 1.998 · con `foot` 2.469 |
| Con `cycleway` | 550 · `cycleway:right` 551 · `cycleway:both` 249 · `cycleway:left` 204 |
| **Con `oneway:bicycle`** | **20** — `no` 18, `yes` 2 |
| Con `surface` | 31.660 · con `segregated` 149 · con `traffic_calming` 32 |

⭐ **Los 20 `oneway:bicycle` son el CONTRAFLUJO, y se cuentan aparte a propósito.** [DOC
CycleStreets] importa **bidireccionales para la bici** las `oneway=yes` que llevan etiqueta de
contraflujo: son calles de sentido único por las que la bici sí puede ir en los dos. Si una
limpieza de valores los aplastara contra el `oneway` de la calle, esas 18 desaparecerían sin que
nadie lo notara. Hay un guardián que los cuenta.

⚠️ **Y `-1` no es un valor sucio: es un sentido invertido.** Significa «al revés de como está
dibujada la línea», así que aplicarlo como si fuera `yes` mandaría por esas 8 vías en dirección
contraria. [DOC CycleStreets] repara `oneway=true` → `yes` y descarta lo no ruteable, pero `-1`
**no se repara: se respeta**.

#### El cruce con el grafo, y hasta dónde llega ahora

| | antes (§ 1.14) | **ahora** |
|---|---|---|
| *Ways* del grafo con entrada | 16.994 de 47.758 · 35,6 % | **47.734 de 47.758 · 99,9 %** |
| `oneway` en la calzada útil | 16.352 · 39,2 % | **22.473 · 53,9 %** |
| `oneway` en la calzada URBANA | 16.352 · 39,2 % | **22.465 · 65,2 %** |
| `maxspeed` en la calzada URBANA | 12.955 · 37,6 % | **14.365 · 41,7 %** |

Por tipo de vía, donde más se nota es en lo que no tiene nombre: `service` pasa de **6 % a 55 %**
de sentidos, `unclassified` de 6 % a 22 %, `tertiary_link` de 33 % a **100 %**. `track` sigue a
**0 %** en las dos cosas, y no es un fallo: son 2.156 km de camino rural que OSM no etiqueta.

> ⚠️ **Esto NO sustituye a § 1.14, y no es prudencia: está medido.** De sus 19.897 *ways*,
> **30 ya no existen** en esta descarga —26 días de OSM por medio—, y **7 de esos 30 siguen en el
> grafo**: la Plaza Salamero, cuatro trozos de la Calle de Marcelino Álvarez, la Calle de Tomás
> Bretón y una senda BTT. Sus nombres **solo están en § 1.14**. Pisar aquel fichero, o
> «evolucionarlo a v2», perdería esos siete nombres sin ganar nada: son dos fotos de fechas
> distintas y las dos hacen falta. Los nombres siguen siendo de § 1.14; esto trae **el resto de
> las etiquetas**.
>
> Por el otro lado, **24 de los 47.758 *ways* del grafo ya no están** en esta descarga (el grafo
> es del 03/08). Es el mismo riesgo residual que § 1.14 declara, con 25 días en vez de 17 horas.

### 1.22 · Jerarquía viaria municipal — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **3.644 tramos** del viario rodado con **`limite_vel`** —el límite legal, en km/h— y con las categorías de la Ordenanza: `calle_z30`, `pacificada`, `plataforma`, `residencia`, `doble_sent`. Es **la única fuente de casa que dice el límite de velocidad**, y el modo Patín depende de saber qué calzadas son de ≤30 |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_jerarquia_viaria`** — el mismo servicio de § 1.5, § 1.8, § 1.9 y § 1.15 |
| **Licencia** | ⚠️ **La capa NO declara la suya.** Su `GetCapabilities` no trae `ows:Fees` ni `ows:AccessConstraints`, y el `<Abstract/>` de la capa viene vacío. Lo que consta es **el régimen del servicio**: las cuatro capas ya fichadas de este mismo GeoServer van por **Ley 37/2007**, y así se declara aquí — pero **de la licencia propia de esta capa: NO CONSTA** |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»**, la misma del resto del servicio |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`motor/data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria.json`](motor/data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria.json) · 2.705.406 bytes · sha256 `57a31d0cffbe5f89d120e44a687acd3b2e2b5af7f232207b0b7fa993384a4a82` **verificado sobre un clon** · cabeceras en [`…_cabeceras.txt`](motor/data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria_cabeceras.txt) |

**La consulta EXACTA:**

```
curl -o motor/data/2026-08-28_idezar_wfs_movilidad-MU1_jerarquia_viaria.json \\
  "https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU1_jerarquia_viaria&outputFormat=application/json&srsName=EPSG:4326"
```

⚠️ **`srsName=EPSG:4326` no es adorno, y aquí la trampa es peor que en § 1.15**: el
`GetCapabilities` declara `DefaultCRS` **`EPSG:25830`**, metros UTM. Verificado **sobre lo
descargado**: el primer vértice es `[-0,87148156, 41,64907146]` y el bbox de sus 22.138 vértices
cae en **lon −1,0602…−0,7651 · lat 41,5480…41,7342** — grados, no metros. La trampa se esquivó.

> ⚠️ **Se pidió DOS VECES y NO repite al byte.** Las dos miden **2.705.406 bytes exactos** y
> difieren en **4 bytes**, todos dentro del `timeStamp` que el propio WFS estampa
> (`15:26:44.503Z` frente a `15:26:48.274Z`). Los **3.644 rasgos son idénticos serializados**.
> Mismo trato que § 1.21: se declara qué baila y entra la primera.
>
> Y la respuesta traía **una cookie de sesión**, que **se filtró** antes de guardar las cabeceras
> —la norma de siempre—.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| Rasgos | **3.644**, y `numberMatched` = `numberReturned` = 3.644: no hay paginación oculta |
| Geometría | **3.644 `MultiLineString`** · 22.138 vértices · **EPSG:4326** |
| Campos | **22**: `fid`, `codigo`, `tipo_via`, `direccion`, `capacidad`, `tramo`, `tipo`, `pacificada`, `calle_z30`, `residencia`, `plataforma`, `doble_sent`, `limite_vel`, `municipal`, `carril_bus`, `carril_vh`, `malla_basi`, `longitud`, `pma_12_5_1`, `pma_18`, `observacio`, `calle_2024`. **Ninguno personal** |
| Longitud declarada | **1.119,3 km** en `longitud` |

**`limite_vel`, que es a lo que se viene:**

| | tramos | km | vías del callejero |
|---|---|---|---|
| **≤ 30 km/h** (y > 0) | **2.584** | **498,8** | **1.603** |
| > 30 km/h | 659 | 569,7 | 299 |
| = 0 | 400 | 50,9 | 334 |
| sin dato | 1 | 0,0 | 1 |

Sus valores, uno a uno: `30`=2.150 · `50`=616 · `0`=400 · `10`=271 · `20`=163 · `120`=16 ·
`80`=14 · `70`=6 · `40`=2 · `60`=2 · `90`=2 · **`39`=1**.

**El enganche: por `codigo`, y es perfecto.** **2.049 códigos distintos, los 2.049 en el
callejero de § 1.3, cero huérfanos** — el mismo tipo de unión que los carriles bici de § 1.5.
Cubre **2.049 de las 3.359 vías (61,0 %)**, que es lo coherente: es el viario **rodado**, no los
andadores ni los parques. **21 tramos vienen sin `codigo`.**

**`doble_sent`:** `SI` 1.263 · `NO` 2.376 · 5 nulos.

#### Lo que trae de roto, dicho antes de usarlo

**1 · ⚠️ `doble_sent` NO es un `oneway`, y confundirlos rompería rutas.** Dice **si** una calle es
de sentido único; **no dice hacia dónde**. La dirección respecto a la geometría solo la da el
`oneway`/`-1` de OSM (§ 1.21). Son fuentes **complementarias**: el límite legal es del
Ayuntamiento, la dirección del sentido es de OSM. Es el reparto de fuentes del punto 7 —
autoritativo municipal y colaborativo OSM, cada uno en lo suyo.

**2 · ⚠️ Un `limite_vel` = 39, y es errata.** Un solo tramo: la **`CT HUESCA`** (código 14500),
`03_Distribuidoras`, tramo «de rotonda a Jesús y María». No hay señal de 39 km/h en ninguna parte.
**Falso conocido, declarado**: entra tal cual, como el `---CRT` de § 1.15.

**3 · El `limite_vel` = 0 no es un hueco: es «aquí no se circula».** De los 400, **395 son
`06_Peatonal`**; los otros cinco se reparten entre `05_Restringida` (2), `04_Urbana No
Restringida` (2) y `01_CINTURON` (1).

**4 · ⚠️ 141 rasgos traen el carácter de reemplazo `U+FFFD`, y está en los bytes.** No es una
lectura mal hecha: el fichero lo contiene. Afecta a **dos campos y solo dos** — `tramo` (96
valores) y `calle_2024` (67) —, con acentos comidos: `«DE BARTOLOM� LORENTE A ESTEBAN PUJASOL»`,
`«CALLE ALFARER�A»`, `«RONDA DE BOLTA�A»`. Los otros **1.472 rasgos con acentos llegan sanos**, y
**`direccion` y `codigo` están intactos**: el enganche va por `codigo`, que es numérico, así que
**la rotura no toca nada de lo que se usa**. El fichero de § 1.21 no tiene ni uno.

### 1.23 · Disponibilidad del BiZi en vivo — Ayuntamiento de Zaragoza (sede electrónica)

| | |
|---|---|
| **Qué es** | Cuántas **bicis** y cuántos **anclajes libres** tiene cada una de las 276 estaciones **en este segundo**, con la hora del dato. Es lo que el inventario de § 1.8 no puede llevar: aquello dice dónde está cada estación y cuántos anclajes tiene en total; esto, cuántos están ocupados ahora |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | Sede electrónica de zaragoza.es · servicio `urbanismo-infraestructuras/estacion-bicicleta` |
| **Petición** | `https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/estacion-bicicleta.json?rows=300` — **sin clave y sin registro**. El `rows` está porque el defecto son 50 y las estaciones son 276 |
| **Sondeada** | **30/08/2026 09:56:37 GMT**, estado 200, 45.264 bytes sin `rows` y 247.955 con él, en **0,31 s**. `Last-Modified: 30/08/2026 11:56:08 CEST` — **un minuto antes de la consulta** |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal. La capa no declara una propia: **NO CONSTA**, y se aplica el régimen general |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Campos** | `id`, `title`, `address`, `estado`, `estadoEstacion`, `bicisDisponibles`, `anclajesDisponibles`, `geometry`, `lastUpdated`, `description`, `descripcion`, `icon`, `about`, `tipoEquipamiento`. **Ninguno personal** |
| **¿Está en este repo?** | ❌ **No, y no puede estar.** Es la **primera fuente que no se copia: se consulta** — y desde el 31/08 **ya no es la única**: § 1.24 y § 1.25 son las otras dos, las dos de Avanza |

**Por qué no entra en el repositorio.** Un fichero de dato se guarda porque es una foto que no
caduca — los portales del 13/05, los carriles del 04/08—. Esto caduca **cada minuto**: guardarlo
sería guardar una mentira con fecha. [DOC GBFS, la especificación de referencia de la bici
pública] separa exactamente por ahí: `station_information` es estático y `station_status` es
**dinámico**, con su `last_reported` por estación. Esta API es el segundo.

> ⚠️ **NO es GBFS, y eso hay que decirlo antes que nada.** Es un formato propio de la sede. La
> equivalencia campo a campo, para quien venga de la especificación:
>
> | Aquí | En GBFS | |
> |---|---|---|
> | `bicisDisponibles` | `num_bikes_available` | ✅ |
> | `anclajesDisponibles` | `num_docks_available` | ✅ |
> | `estado` (`IN_SERVICE` / `MAINTENANCE`) | `is_renting` / `is_installed` | ✅ el único que discrimina |
> | `lastUpdated` | `last_reported` | ✅ **por estación**, no por feed |
> | `estadoEstacion` | — | 🔴 **ROTO** |

> 🔴 **El campo roto, medido dos veces.** `estadoEstacion` apunta a una URI del vocabulario de
> datos abiertos y **en las 276 de 276 apunta a `…/no-operativa`**. Sondeado el 28/08 y vuelto a
> sondear el **30/08**: sigue igual. La misma estación afirma a la vez `estado: "IN_SERVICE"`,
> ese `estadoEstacion` que dice no-operativa, y una descripción que dice «Estado: Operativa».
> **Se usa `estado`** — el 30/08 daba 275 `IN_SERVICE` y 1 `MAINTENANCE`—, y el campo roto no se
> mira. Con él, ninguna estación pasaría el filtro y **no habría ni una ruta de BiZi**: está
> puesto por escrito en la juez 6 bis de `motor/src/bizi.spec.ts`, que nació de esa contraprueba.

> 🔴 **Y el mismo 30/08, por la tarde, dejó de contestar: `200 OK` con
> `Content-Length: 0`.** Cuerpo vacío, medido tres veces seguidas y también sin
> `?rows`, cuando cuatro horas antes devolvía 247.955 bytes. **Un 200 no
> garantiza un cuerpo**, y por eso el lector no se fía del código de estado: el
> `json()` sobre el vacío lanza, se recoge, y la ruta sale por el plan D-G con
> su aviso. Es la única vez que se ha visto, y queda escrito porque la próxima
> vez que alguien mire este servicio conviene que sepa que puede pasar.

> ⚠️ **Y una estación en `MAINTENANCE` puede venir SIN los campos de disponibilidad.** El 30/08,
> la 276 (`Acuario Zaragoza`) llegaba sin `bicisDisponibles`, sin `anclajesDisponibles` y sin
> `description`. Leerlos con un `?? 0` diría «no quedan bicis»; lo que pasa es que **no se sabe**,
> y se trata como tal.

**Casa con el inventario, comprobado.** El `title` abre con el número de estación —«193- Pza. La
Ermita»— y ese número es la única clave que las dos fuentes comparten. Medido el 30/08: **las 276
traen número legible y las 276 casan con § 1.8**, sin sobras ni faltas por ninguno de los dos
lados.

**Y si calla, la ruta sale igual.** Es el plan D-G firmado el 28/08 —*componer sin prometer*—:
se rutea con el inventario de § 1.8, un aviso dice que **la disponibilidad no está verificada**, y
los hitos salen **sin número y sin hora**. Nunca se inventa un «quedan 3 bicis».

---

### 1.24 · Llegadas al poste en vivo — Avanza Zaragoza (`fRefrescaEmpresaExternos`)

| | |
|---|---|
| **Qué es** | Los **próximos vehículos de un poste**, con sus minutos y su número de coche. Es el dato que **sustituye la espera estimada del PRIMER vehículo** —lo real desplaza a lo programado [GTFS-Realtime]— y el que contesta el botón **«Próximo bus»** de cada subida y cada transbordo |
| **Titular** | **Avanza Zaragoza S.A.U.** (el mismo publicador del feed de § 1.7) |
| **Fuente** | `gps.avanzabus.com` — el visor de posiciones del operador. **No es una API documentada**: es el endpoint que su propia página consulta |
| **Petición** | `POST https://gps.avanzabus.com/index.php/zaragoza/fRefrescaEmpresaExternos` · `Content-Type: application/x-www-form-urlencoded` · cuerpo `poste=N&coche=0` |
| **Sondeada** | **01/09/2026 15:44 GMT**, `Server: nginx`. Tres postes, tres respuestas: **poste 1000** → 200 · **2.929 bytes** · 0,908 s; **poste 1203** → 200 · **219 bytes** · 0,861 s; **poste 33** → 200 · **5.610 bytes** · 1,043 s. Y por el endpoint de la casa, con su tope y su reintento dentro: **2,26 s** y **2,38 s** |
| **La forma, medida** | `Content-Type: text/html; charset=UTF-8` **y dentro va JSON** — se declara una cosa y se manda otra, y por eso el cuerpo se decodifica con el charset **declarado** y se parsea a mano. Dos claves raíz: `maquinas` (la parada en `["0"]` y un coche por cada una de las demás) y `tablatiempos` (HTML). Trae la cicatriz entera: `<strong>053 <i class="fa fa-long-arrow-right fa-fw"></i>MIRALBUENO`, cuyo texto plano sería `053MIRALBUENO` pegado |
| **Licencia** | ⛔ **Medida, y NO es un NO CONSTA.** Ver el recuadro de abajo: el aviso legal de Avanza **prohíbe expresamente** la extracción y la reutilización |
| **Atribución exigida** | **NO CONSTA**: el aviso legal no regula la reutilización con atribución — la prohíbe. No hay fórmula que cumplir porque no hay permiso que acompañar |
| ⭐ **Decisión (1/09)** | **De Antonio, el 01/09/2026, y con el recuadro de abajo delante: «es dato público de un servicio público concesionado, y esto es una demo — se ATRIBUYE y se sigue».** Se decide **con los *fixtures* a la vista**, los del recuadro de la divergencia, y **se quedan como están**: `motor/src/avanza.spec.ts`, `motor/src/viaje-bus.spec.ts`, `motor/src/desvios.spec.ts` y `motor/src/patron-operativo.spec.ts`. Lo que cambia es que **el titular sale a la PANTALLA**: «Llegadas y recorrido operativo: Avanza Zaragoza S.A.U.», en el pie de créditos del buscador. ⚠️ **Y no cambia lo que dice la licencia**: sigue diciendo que no. Esto no es cumplir una condición —no hay ninguna que cumplir— sino la consecuencia honesta de seguir usándolo: **se dice de quién es el dato**, que es lo contrario de disimularlo |
| **Campos** | `maquinas[n].coordenadas`, `.info`, `.title`, `.icon` y el HTML de `tablatiempos`. **Ninguno personal**: lo que viaja son números de coche, líneas, minutos y posiciones de vehículo |
| **¿Está en este repo?** | ❌ **No se copia: se consulta.** Es la segunda fuente viva, después del BiZi de § 1.23. ⚠️ **Con una excepción que se declara abajo**: hay bytes de sus respuestas en los *fixtures* de las pruebas |

**Cómo se consulta, que es la mitad de la ficha.** El precedente entero es de ZetaBus
[`003_ZETABUS/src/lib/transporte.ts`], y se aplica igual:

- **Tope duro de 4.000 ms**, **un** reintento y **300 ms** entre los dos. El peor caso son 8,3 s,
  que es lo que cabe dentro de los 10 s de atención de [NN/g].
- **Single-flight por poste**: dos preguntas simultáneas por el mismo poste comparten **una sola
  visita**. Sin caché: cada pulsación del botón vuelve a preguntar de verdad, y la respuesta del
  endpoint propio va con `Cache-Control: no-store`.
- **Y el Generar pregunta por UN solo poste**, el primero de subida. De los demás nunca se dijo el
  minuto, así que consultarlos solo producía avisos y gastaba hasta 8,4 s por cabeza. Lo que
  quiera saberse de ellos se pide a petición.

**Los cuatro estados, y ninguno se aplasta contra otro.** Es la lectura de [GTFS-Realtime] llevada
a una fuente que no lo es: **ausente ≠ sin servicio**.

| | Qué significa | Qué se dice |
|---|---|---|
| `llega` | la línea está en el poste, faltan N minutos | «próximo en N min (dato de las HH:MM)» |
| `ausente` | la fuente contestó y esa línea **no está en su lista** | «Avanza no anuncia ningún próximo…» — **sin información**, no «sin servicio» |
| `mudo` | no contestó, o se contradijo a sí misma | «disponibilidad no verificada» — las mismas palabras que el BiZi |
| `sinFuente` | ni se preguntó: el tranvía no tiene `stop_code` de los suyos | nada. Lo que falta no es el dato, es la fuente |

⚠️ **Y el `mudo` lleva su motivo AL LOG y solo al log** —`tope`, `red`, `http`, `parseo`,
`contador`—, con sus milisegundos. De cara afuera las cinco causas son lo mismo: se ha preguntado
y no se sabe. Nació de un diagnóstico de media hora el 1/09.

> ⛔ **LA LICENCIA, MEDIDA EL 01/09/2026 — y dice que no.**
>
> `gps.avanzabus.com` **no publica aviso legal propio**: `/aviso-legal` y `/robots.txt` devuelven
> los mismos 70 bytes —*«Error 404. Usted está intentando acceder a una página que no existe.»*—
> y la raíz redirige (303) a `/login`. El que rige es el de su casa,
> **<https://www.avanzabus.com/informacion/aviso-legal/>** (200, 557.607 bytes, leído el
> 01/09/2026), § 2.2 *Propiedad Industrial e Intelectual*, **literal**:
>
> > *«Los derechos de propiedad intelectual sobre la disposición de los contenidos del Sitio Web
> > (derecho sui generis sobre la base de datos) […] corresponden a Avanza o a sus licenciantes.
> > […] salvo en aquellos supuestos en los que esté legalmente permitido, queda expresamente
> > prohibido al Usuario la reproducción, transformación, distribución, comunicación pública,
> > puesta a disposición, **extracción y/o reutilización** del Sitio Web, sus contenidos y/o los
> > signos distintivos de Avanza y/o de las sociedades del Grupo Avanza.»*
>
> **No se interpreta ni se matiza aquí**: se transcribe, con su URL y su fecha, y se deja a la
> vista. Lo único que se añade es la constatación de que el *«salvo en aquellos supuestos en los
> que esté legalmente permitido»* es una remisión a la ley, no un permiso otorgado por Avanza.
>
> ⚠️ **Esto corrige al precedente.** ZetaBus ficha estos mismos servicios como *«**Licencia:
> NINGUNA.** Sin documentar, sin términos de uso publicados, sin permiso»*
> [`003_ZETABUS/THIRD-PARTY-NOTICES.md`, § 4]. Medido hoy, **sí hay términos publicados** y lo
> que dicen es más fuerte que «ninguna»: prohíben. La ficha de aquí es la exacta.

> ⚠️ **Y LA DIVERGENCIA CON ZETABUS, que hay que decidir y no esconder.**
>
> ZetaBus escribe: *«¿Se redistribuye? ⛔ **NO. NI UN BYTE.** No hay respuestas cacheadas en este
> repositorio, ni de ejemplo, ni de prueba, ni como *fixture*. El `.gitignore` lo impide
> explícitamente.»* **Aquí no es así**, y se dice con el recuento delante:
>
> | Fichero | Qué guarda |
> |---|---|
> | `motor/src/avanza.spec.ts` | **1** respuesta literal del poste 1000 (3.216 caracteres de fuente) |
> | `motor/src/viaje-bus.spec.ts` | **2** respuestas literales (postes 1000 y 1203) |
> | `motor/src/desvios.spec.ts` · `motor/src/patron-operativo.spec.ts` | trozos de `<option>` de § 1.25 |
>
> Están ahí por la **ley nº18 de la casa** —*un fixture copia la medición, no la lectura de la
> documentación*—, que es lo que impide inventarse una respuesta que Avanza nunca manda. Y son
> **bytes de un tercero en un repositorio público**, que es exactamente lo que ZetaBus decidió no
> hacer. **Las dos cosas son ciertas a la vez y el conflicto es real**: queda escrito aquí, con
> los ficheros nombrados, para que se decida mirándolo — no se ha decidido en esta ficha.
>
> ⭐ **DECIDIDO EL 01/09 — y la línea de arriba se queda escrita.** La decisión está en la fila
> «Decisión (1/09)» de la tabla: se atribuye y se sigue, y los *fixtures* no se tocan. El *«no se
> ha decidido en esta ficha»* **no se borra** porque era verdad cuando se escribió, y porque el
> conflicto que describe no desaparece por haberse decidido: **sigue estando, decidido**. Quien
> lea esta ficha tiene que poder ver las dos cosas — lo que se sabía y lo que se eligió.

**Si Avanza pide que se deje de consultar, se deja.** Es la misma línea que ZetaBus escribió en su
§ 4, y por la misma razón.

### 1.25 · La ruta operativa de hoy — Avanza Zaragoza (`get_stops_list`)

| | |
|---|---|
| **Qué es** | **Los postes por los que cada línea pasa HOY, en orden.** No es una fuente de desvíos: es la ruta de hoy. El desvío sale de **restarla contra el GTFS** —lo que el feed dice que la línea hace frente a lo que la web del operador dice que hace hoy—, y de esa resta salen las paradas **fuera de servicio** y las **provisionales** |
| **Titular** | **Avanza Zaragoza S.A.U.** |
| **Fuente** | `zaragoza.avanzagrupo.com` — el backend del selector de postes de su página de líneas y horarios. **No es una API documentada** |
| **Petición** | `POST https://zaragoza.avanzagrupo.com/wp-admin/admin-ajax.php` con `action=get_stops_list`, `selectLinea`, `selectSentido` (`-1` ida, `-2` vuelta) y **`nonce`** |
| **El nonce** | 🔒 Un nonce de WordPress, **re-scrapeado** del campo oculto `avz_bus_ajax_nonce` de <https://zaragoza.avanzagrupo.com/lineas-y-horarios/>. **Nunca va cableado en el código, ni en un fichero, ni en un log.** Se memoiza 30 min en memoria y se re-pide al primer 403 |
| **Sondeada** | **01/09/2026 15:47 GMT**. La página del nonce: 200 · **132.744 bytes** · 510 ms, y **trae el campo**. **Sin nonce: `403` con cuerpo de 0 bytes** —medido, es lo que obliga al re-scrapeo—. Con nonce, línea 29 sentido `-1`: 200 · **2.005 bytes** · 286 ms |
| **La forma, medida** | `Content-Type: text/html; charset=UTF-8`, y el cuerpo es **el trozo de HTML de un desplegable**: `<option value="posteDefault">Seleccionar poste</option>` y detrás un `<option id="posteValue" value="284">284 - Camino de Las Torres n.º 10</option>` por poste. En esa lectura, **24 `<option>`** = 1 de cabecera + **23 postes** |
| **Licencia** | ⛔ **La misma medición de § 1.24, y aquí es la casa de Zaragoza**: <https://zaragoza.avanzagrupo.com/aviso-legal/> (200, 114.166 bytes, leído el 01/09/2026), § 3, con el mismo texto — *«queda expresamente prohibido […] la extracción y/o reutilización»*, *«derecho sui generis sobre la base de datos»* |
| **Atribución exigida** | **NO CONSTA**, por lo mismo: no hay permiso al que acompañar una atribución |
| ⭐ **Decisión (1/09)** | **La misma de § 1.24, y con las mismas palabras de Antonio: «dato público de un servicio público concesionado; esto es una demo — se atribuye y se sigue».** Aquí el titular sale a la pantalla en la misma frase, porque es el mismo dato y el mismo dueño: «Llegadas y **recorrido operativo**: Avanza Zaragoza S.A.U.». Los `<option>` medidos que hay en `motor/src/desvios.spec.ts` y `motor/src/patron-operativo.spec.ts` **se quedan**, por la misma ley de la casa. ⚠️ **Y el aviso legal sigue prohibiendo**: la decisión no lo reinterpreta, lo asume |
| **Campos** | El `value` del `<option>` (número de poste) y su texto (`número - nombre`). **Ninguno personal** |
| **¿Está en este repo?** | ❌ **No se copia: se consulta**, y con **caché propia de 1 hora** —separada de la de § 1.24, que no tiene ninguna—. Los `<option>` de las pruebas son los medidos |

> ℹ️ **Y su `robots.txt` abre esta puerta a propósito**, medido el 01/09/2026 en
> <https://zaragoza.avanzagrupo.com/robots.txt>:
>
> ```
> User-agent: *
> Disallow: /wp-admin/
> Allow: /wp-admin/admin-ajax.php
> ```
>
> El `Allow` es **una excepción explícita al `Disallow` de la línea anterior**, y apunta
> exactamente al fichero que esta ficha consulta. Se deja escrito como lo que es —**un dato
> medido**— y no como una licencia: `robots.txt` gobierna el rastreo, no la reutilización, y el
> aviso legal de arriba sigue diciendo lo que dice. Las dos cosas conviven y las dos constan.

**Lo que se hace con la resta, y sus dos frenos [heredados de ZetaBus].**

- ⭐ **SE AUTO-APAGA.** No hay lista de desvíos que mantener ni vigencia que vigilar: el día que
  Avanza restaure la ruta, `get_stops_list` vuelve a coincidir con el GTFS, el diff sale vacío y
  el aviso desaparece **solo**. *«Un sistema que hay que acordarse de apagar acaba mintiendo —
  siempre.»*
- ⭐ **EL UMBRAL DEL 50 %** (`UMBRAL_ABSURDO`). Si la ruta de hoy se deja fuera **más de la mitad**
  de las paradas oficiales, eso **no es un desvío: es una lectura rota**, y el veredicto es
  `indeterminado`. Un desvío de obras quita tres paradas, cinco, ocho; no quita el 70 % de la
  línea. Y una lista vacía tampoco se compara, porque daría **todas** las paradas por suprimidas.

> ⚠️ **LA ASIMETRÍA, y se dice en voz alta: esto detecta desvíos, NO detecta supresiones.**
>
> ```
> DESVÍO DE RUTA       el autobús NO PASA por la calle
>                      → la ruta operativa CAMBIA → get_stops_list lo refleja → DETECTABLE
>
> SUPRESIÓN DE PARADA  el autobús PASA pero NO PARA
>                      → la ruta operativa NO cambia → sigue listando la parada → NO DETECTABLE
> ```
>
> Está comprobado en la auditoría de ZetaBus: con el comunicado de Avanza diciendo **por escrito**
> que las líneas 29 y 39 hacen *«su recorrido habitual pero sin realizar parada»* en el **poste
> 744**, la API viva seguía anunciando «039 VADORREY, 0 minutos». Ponen el cartel en la marquesina
> y no desconectan el poste. **Por ninguna fuente**, no solo por esta.

⚠️ **Y aquí no entra ni un dato vivo de § 1.24.** Deducir un desvío de «ese poste lleva callado
toda la mañana» sería un error: un poste callado puede ser un desvío, pueden ser las cuatro de la
mañana, o puede ser un poste que Avanza no tiene dado de alta — y la fuente devuelve **lo mismo en
los tres casos**. La comparación recibe **dos listas de postes y nada más**.

**Lo que da hoy, medido** (`motor/src/patron-operativo.ts`, al arrancar y cada media hora):

```
motor: ruta operativa de hoy — 64 sentidos · 23 detectados · 23 aplicados · 0 sin saber · 17 s
```

---

### 1.26 · Líneas, paradas y tiempos de Autobús Urbano — Ayuntamiento de Zaragoza (sede)

> ## 🔎 SONDADA EL 01/09/2026 · **NO SE USA HOY**
> Es la **alternativa municipal a las dos fuentes de Avanza** (§ 1.24 y § 1.25): el mismo dato
> —cuándo llega el próximo, por dónde va la línea— publicado por el Ayuntamiento, con licencia
> abierta y sin clave. Se midió entera antes de decidir nada, **no se ha adoptado**, y se ficha
> igual: el día que la puerta de Avanza se cierre, lo que decide es esta ficha y no una sonda que
> haya que repetir. Lo que sigue es **medición, no recomendación**.

| | |
|---|---|
| **Qué es** | El conjunto **«Líneas, paradas y tiempos de Autobús Urbano»** del portal de datos abiertos (catálogo **335**). Tres cosas: el **censo de postes** con su coordenada, los **tiempos de espera** de un poste, y el **recorrido con sus paradas** de una línea |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | ⚠️ **DOS árboles de URL distintos, y conviven.** `www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/…` sirve postes y tiempos; `www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano/linea-autobus/{n}.json` sirve recorridos |
| **Petición** | `GET …/api/recurso/…/transporte-urbano/poste.json` (censo entero) · `GET …/api/recurso/…/transporte-urbano/poste/tuzsa-{n}.json` (tiempos) · `GET …/sede/servicio/…/transporte-urbano/linea-autobus/{n}.json` (recorrido). **Sin clave y sin registro**, y con `Access-Control-Allow-Origin: *` — se puede llamar desde el navegador. ⚠️ `…/api/recurso/…/transporte-urbano/linea/{n}` da **400 en las cinco probadas** (29, 22, 35, C1 y 1), **incluidas las que su propio índice publica** |
| **Sondeada** | **01/09/2026, 16:13–16:26 GMT.** `Content-Type: application/json; charset=UTF-8`. Censo: 200 · **333.135 bytes** · 654 ms, `totalCount 1271`. Tiempos del poste 532: 200 · **491 bytes** · 149 ms, con `Last-Modified` **igual al segundo de la consulta**. Recorrido de la 29: 200 · **42.234 bytes** · 290 ms |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal (§ 1.23). Las **«Condiciones de uso»** de la ficha 335 llevan a <https://www.zaragoza.es/sede/portal/aviso-legal> (200, 78.149 bytes, leído el 01/09/2026), y **permiten la reutilización comercial y no comercial**, literal: *«Las presentes condiciones generales permiten la reutilización de los documentos sometidos a ellas para fines comerciales y no comerciales»* |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»**, y —esto es propio de esta licencia— *«debe mencionarse la fecha de la última actualización»*, además de no *«desnaturalizar el sentido de la información»*. Los tres, literales del aviso legal |
| **Campos** | Censo: `id` (`tuzsa-N` o `rural-N`), `title` (`(532) Jorge Cocci N.º 17 Líneas: 22, 30`), `geometry.coordinates` **en UTM EPSG:25830**, `link`, `icon`. Tiempos: `lastUpdated`, `destinos[].linea`, `.destino`, `.primero`, `.segundo`. Recorrido: `geometry`, `link`, `about`, `title`, `description`. **Ninguno personal** |
| **¿Está en este repo?** | ❌ **No, y hoy tampoco se consulta.** Sondeada y fichada; los *fixtures* de la sonda se quedaron fuera del repositorio |

**Las llegadas, cara a cara con Avanza y en el MISMO instante.** No se comparan dos capturas de
dos momentos: las dos preguntas salen juntas.

| Poste, y la hora | SEDE | AVANZA |
|---|---|---|
| **532** · 16:15:16 | 200 · 494 B · **149 ms** · `30` → «En la parada.» / 4 min · `22` → 15 / 20 | 200 · 5.565 B · 843 ms · `30` → **4** / 11 · `22` → 15 / **18** |
| **1000** · 16:14 | 200 · 427 B · 129 ms · `53` → 7 / 14 min | 200 · 2.927 B · 2.460 ms · `53` → **6** / **12** |
| **33** · 16:13 | 200 · 517 B · 28 ms · `29` → 7 / 15 · `35` → 12 / 15 | 200 · 5.638 B · 4.935 ms · `29` → 0 / 5 · `35` → 8 / 13 |
| **1203** · 16:15 | **400 «Parametros incorrectos»** | 200 · 219 B (parada sin coches) |

Tres diferencias que no son de matiz:

1. ⚠️ **Los minutos NO coinciden**, en el mismo segundo, por 1-3 minutos.
2. ⚠️ **La sede da exactamente DOS coches por línea** (`primero`, `segundo`); Avanza da todos los
   que hay, y se le han visto cuatro.
3. ⚠️ **`primero` es TEXTO LIBRE**: *«En la parada.»*, *«7 minutos.»* Un número hay que sacarlo de
   una frase, y la frase puede no traerlo.

**La fiabilidad, medida hoy — y esto corrige de raíz la idea de que «es 50 veces más rápida».**

```
20 llamadas al MISMO poste, seguidas       60 postes DISTINTOS, uno cada uno
  1000 · SEDE   19/20 · p50    32 ms         SEDE  57/60 · p50 1.267 ms · p95 1.503
  1000 · AVANZA 20/20 · p50   788 ms               3 en 400 PERMANENTE (3 de 3 reintentos):
    33 · SEDE   20/20 · p50    36 ms               tuzsa-875, tuzsa-666, tuzsa-647
    33 · AVANZA 20/20 · p50 1.808 ms
   532 · SEDE   20/20 · p50    32 ms
   532 · AVANZA 20/20 · p50 1.847 ms
```

⭐ **Los 32 ms son de la SEGUNDA vez que se pregunta por un poste, no de la primera.** Preguntando
por sesenta postes distintos la mediana es **1.267 ms** — el mismo orden de magnitud que Avanza.
La sede parece guardar la respuesta de cada poste; encadenar veinte preguntas iguales mide esa
caché, no la fuente. **Queda escrito aquí porque el número rápido es el que se habría citado.**

⚠️ **Y el 400 no siempre es permanente: hay una ventana en la que la fuente se cae y vuelve sola.**
A las **16:15**, tres de los cuatro postes de la tabla —1000, 33 y 1203— contestaron
`400 «Parametros incorrectos»` **tardando 6,1 s**, después de haber contestado 200 un minuto antes
y antes de volver a contestar 200 dos minutos después. El 1203, en cambio, dio 400 las **cinco**
veces que se le preguntó, **estando en el censo y con su coordenada**: eso ya no es una caída, es
una contradicción de la fuente consigo misma.

**El recorrido de una línea: es el GTFS, congelado en 2013.**

```
linea-autobus/29.json → 200 · 42.234 B · lastUpdated 2013-10-14T08:40:00   (idéntico en 22 y 35)
  totalCount 51 = 2 MultiLineString (el trazado) + 49 Point (las paradas)
  campos: geometry · link · about · title · description       ← SIN campo de sentido
  el poste va dentro de `about`: …/poste/tuzsa-219            ← coordenadas ya en WGS84
```

El cruce, medido el 01/09 contra el feed que sirve el motor y contra Avanza:

| | Postes | Que la sede NO tiene |
|---|---|---|
| GTFS · 29 dirección 0 | 23 | **0** |
| GTFS · 29 dirección 1 | 26 | **0** |
| **suma** | **49** | = los 49 `Point` de la sede, **exacto** |
| Avanza hoy · sentido `-1` | 23 | **0** |
| Avanza hoy · sentido `-2` | 25 | **2 → los postes 654 y 1285** |

⭐ **La sede reproduce el GTFS oficial sin sobras ni faltas**, y por eso **no sirve para lo que
sirve § 1.25**: los dos que le faltan son las paradas **provisionales del desvío de hoy** —1285 es
«Asalto / Centro de Historias», que el motor ya está usando—. Y sin campo de sentido, los 49
puntos son los dos sentidos mezclados y no hay forma de separarlos.

**El censo de postes, y el tranvía.**

```
poste.json · totalCount 1271 = 983 tuzsa-N + 288 rural-N   ·  0 sin coordenada  ·  UTM EPSG:25830
  las 944 del MU3 (§ 1.6) están las 944, y la sede trae 39 más
  la documentación del catálogo: «los tiempos de espera sólo son para los postes con id tuzsa»
```

⛔ **El tranvía: 5 postes de 50.** Hay línea `TRA` y sus cinco paradas son de tranvía por nombre
—Mago de Oz ×2, Plaza Aragón ×2, Un americano en París—, pero la L1 tiene **50**. Y hay una mina
igual que la del `PA…` de § 1.6: **16 códigos de parada de tranvía chocan numéricamente con un
`tuzsa-N`, y los 16 son FALSOS AMIGOS** — `tranvía 0101 «Avenida de la Academia»` contra
`tuzsa-101 «Av. Cesáreo Alierta / Av. de San José»`. Cruzar por número perdería el tranvía **sin
que nada se pusiera rojo**.

**Alteraciones y desvíos municipales: NO CONSTA, y está buscado.** `alteracion.json`, `aviso.json`
e `incidencia.json` dan **404**; la documentación del catálogo 335 declara **tres** recursos
—`linea`, `linea-autobus/{n}`, `poste-autobus/{id}`— y ninguno es de avisos. El catálogo **2682**
es un directorio de equipamientos de transporte con frecuencia de actualización **anual**. Se
buscó y no está: eso es un dato, no un hueco.

---

### 1.27 · Viario rodable del coche — OpenStreetMap (Overpass)

| | |
|---|---|
| **Qué es** | **Las 25.242 vías por las que rueda un coche**, con su geometría, **sus ids de nodo** y sus etiquetas enteras. Es la base de la red del coche del punto 12, y trae lo que § 1.21 no puede dar: la **topología**. Sin ids de nodo, una restricción de giro no se puede aplicar |
| **Origen del dato** | **OpenStreetMap**, vía **Overpass API 0.7.62.11 87bfad18**. El fichero declara `timestamp_osm_base` **`2026-09-02T15:38:39Z`** |
| **Licencia** | **ODbL 1.0**, como § 1.1, § 1.4, § 1.14 y § 1.21. El fichero **la trae escrita dentro**, en `osm3s.copyright` |
| **Atribución** | Cumplida en el pie de créditos del buscador y en el control del mapa: «© **colaboradores** de OpenStreetMap» |
| **Zona** | bbox **41,4011–41,982 N · −1,2199–−0,6541 O**, el mismo de § 1.4 y § 1.21 |
| **Campos** | `id` · `nodes` (los ids, en orden) · `geometry` (`lat`/`lon` punto a punto) · `tags`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`motor/data/2026-09-02_osm_overpass_zaragoza-bbox_viario-coche.json`](motor/data/2026-09-02_osm_overpass_zaragoza-bbox_viario-coche.json) · 19.960.302 bytes · sha256 `1422908732a7a3b3de1cc1ec3ddab2cae25349b080af0a3f83c66265460bf0de` · cabeceras al lado |

**La consulta EXACTA:**

```
[out:json][timeout:900];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](41.4011,-1.2199,41.982,-0.6541);
out geom;
```

⭐ **`out geom` en vez de `out tags`, y ahí está toda la diferencia.** Devuelve
`nodes` **y** `geometry` **y** `tags` en el mismo elemento: los ids permiten casar
las restricciones de § 1.28 y los semáforos de § 1.29 **por identidad**, no por
coordenada. Medido: por id casan **1.240 de 1.283 restricciones**; por coordenada
contra el grafo de § 1.4, **876**.

> ⚠️ **Y por eso la red del coche NO se cocina sobre el grafo de § 1.4.** Aquél es
> el grafo del PEATÓN: no trae ids de nodo y no pone vértice en todos los cruces
> de OSM. La decisión es de Antonio, del 2/09, tomada con esas dos cifras
> delante. No sustituye a § 1.4 ni a § 1.21: son tres fotos para tres redes.

> ⚠️ **Se pidió DOS VECES y NO repite al byte.** Las dos miden **19.960.302
> bytes exactos** y difieren en **el byte 124**: el `timestamp_osm_base`
> (`15:38:39Z` frente a `15:41:41Z`). Los **25.242 elementos son idénticos
> serializados**. Es el precedente de § 1.20 y § 1.21: lo que baila es el reloj
> del corte de la base, no el dato.

#### Los recuentos, medidos sobre lo descargado

| | |
|---|---|
| *Ways* | **25.242** |
| Rodables tras mirar el acceso | **23.922** — 1.320 caen por `access`/`motor_vehicle`/`motorcar` |
| Por tipo | `residential` 9.835 · `service` 5.440 · `tertiary` 1.855 · `unclassified` 1.773 · `primary` 1.258 · `secondary` 1.255 · `trunk` 890 · `living_street` 862 · `motorway` 783 · `motorway_link` 783 · `trunk_link` 247 · `primary_link` 123 · `secondary_link` 76 · `tertiary_link` 62 |
| Vértices | **174.893** · nodos distintos **138.553** |
| Sentido único | **14.407** ways · de ellas **8** con `oneway=-1` |

⚠️ **Y las `oneway:bicycle` NO se aplican aquí.** Son 9 en este viario, y para el
coche esas calles son de **un solo sentido**: la excepción exime a la bici, no al
coche. Aplicarla mandaría el coche a contramano por una calle donde solo la bici
puede. Es la diferencia entre esta red y la de la rueda, y tiene juez.

---

### 1.28 · Restricciones de giro — OpenStreetMap (Overpass)

| | |
|---|---|
| **Qué es** | Las **1.283 `relation type=restriction`** del ámbito: los giros que **están prohibidos**. [OSRM, palabra de su desarrollador] las penalizaciones no prohíben; lo que prohíbe son las *relations* |
| **Origen del dato** | **OpenStreetMap**, vía Overpass. `timestamp_osm_base` **`2026-09-02T15:38:39Z`** |
| **Licencia** | **ODbL 1.0**, dentro del fichero |
| **Campos** | De cada *relation*: `id`, `members` (con `role` `from`/`via`/`to`) y `tags`. Y **los 1.036 nodos `via` con su coordenada**, que van en el mismo fichero. **Ninguno personal** |
| **¿Está en este repo?** | ✅ [`motor/data/2026-09-02_osm_overpass_zaragoza-bbox_restricciones-giro.json`](motor/data/2026-09-02_osm_overpass_zaragoza-bbox_restricciones-giro.json) · 574.549 bytes · sha256 `29dfeb2b670eddd91549df92e68342937729a1d633892fc10c9d7ce1b617aafe` |

```
[out:json][timeout:600];
rel["type"="restriction"](41.4011,-1.2199,41.982,-0.6541)->.r;
.r out body;
node(r.r);
out body;
```

#### El censo, medido antes de cocinar

| Tipo | |
|---|---|
| `only_straight_on` | **580** |
| `no_left_turn` | **317** |
| `no_u_turn` | **221** |
| `no_right_turn` | **89** |
| `only_right_turn` | **52** |
| `only_left_turn` | **18** |
| `no_straight_on` | **6** |

⭐ **NI UNA `no_entry` NI UNA `no_exit`.** La doctrina avisaba de que OSRM las
ignora por completo [wiki OSM] y de que aquí había que contarlas y decidir con el
dato delante. El dato dice que **en Zaragoza no existen**, así que no hay nada que
decidir. Se cuenta y se declara.

| | |
|---|---|
| Con **1** `from` y **1** `to` | **las 1.283** — ni una con varios |
| `via` de **un nodo** | **1.272** |
| ⚠️ `via` con **way(s)** | **11** — se **cuentan y NO se aplican**: [wiki OSM] la via-way es más compleja que el via-nodo, y se hereda la limitación escrita en vez de inventar |
| Con `except` | **16** — `bus` 4 · `motorcar` 3 · `psv` 3 · `taxi` 2 · `bicycle;small_electric_vehicle` 1 · `taxi;bicycle` 1 · `bus;taxi` 1 · `emergency` 1 |
| **Condicionales** | **2** — `rel 1243522` (`restriction:motor_vehicle:conditional = none @ (delivery AND weightrating<=3.5)` y `restriction:taxi:conditional = none @ (occupants>1)`) y `rel 3755137` (`except:conditional = bus @ (permit "authorized events")`) |
| Variantes por vehículo | **2**, y las dos son las condicionales de arriba. Ni una `restriction:hgv` ni parecidas |

⭐ **`except` exime a QUIEN NOMBRA, no al coche.** Solo **3** de las 16 llevan
`except=motorcar` —`1244752`, `2204334` y `9451064`— y solo ésas dejan pasar al
coche. Una `except=bicycle` sigue prohibiendo el giro a quien conduce.

⚠️ **Las condicionales se aplican como INCONDICIONALES** [PROPIO, conservador y
declarado]: si una prohíbe solo unas franjas, se prohíbe siempre. Mejor no mandar
por donde a esa hora no se puede que mandar y que no se pueda. Son 2 y se cuentan.

---

### 1.29 · Semáforos — OpenStreetMap (Overpass)

| | |
|---|---|
| **Qué es** | Los **1.360 nodos `highway=traffic_signals`** del ámbito. Cada uno cuesta **2 s** al pasar [`car.lua` de OSRM, vía `lib/obstacles.lua`] |
| **Origen del dato** | **OpenStreetMap**, vía Overpass. `timestamp_osm_base` **`2026-09-02T15:40:40Z`** |
| **Licencia** | **ODbL 1.0**, dentro del fichero |
| **Campos** | `id` · `lat` · `lon` · `tags`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ [`motor/data/2026-09-02_osm_overpass_zaragoza-bbox_semaforos.json`](motor/data/2026-09-02_osm_overpass_zaragoza-bbox_semaforos.json) · 231.503 bytes · sha256 `436ae7931167793b71e9c6ed475afaea48cceba4e3df0214202c6ba189f6c8f3` |

⭐ **EL SEMÁFORO NO ESTÁ EN EL CRUCE, y eso cambió la cocina.** Medido sobre este
fichero: de los 1.360, **1.298 caen en un nodo INTERIOR de una sola vía** y solo
**28** en un nodo compartido por dos. En OSM el `traffic_signals` va donde está el
poste, no en el centro geométrico del cruce.

La consecuencia es directa: partiendo las vías **solo por los cruces**, el nodo
del semáforo no sería el final de ninguna arista y **sus 2 s no se podrían cobrar
nunca**. Por eso el semáforo **también parte la vía**. Lo cazó la juez 6 en rojo,
con «semáforos casados: 26».

| | |
|---|---|
| Casados con un nodo del viario de § 1.27 | **1.298** |
| Sueltos (fuera del viario rodable) | **62** |
| Con `traffic_signals:direction` | 240 |
| Con `crossing` | 42 |

---

### 1.30 · Zona de Bajas Emisiones — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **2 polígonos** de la ZBE: **FASE 1**, la vigente (el casco), y **FASE 2**, futura. El motor marca las aristas que caen dentro de la fase 1 |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_ZBE_Zona_Bajas_Emisiones`** |
| **Petición** | `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=movilidad:MU1_ZBE_Zona_Bajas_Emisiones&outputFormat=application/json&srsName=EPSG:4326` |
| **Descarga** | **02/09/2026 15:31 GMT**, estado 200 · `timeStamp` del WFS `2026-09-02T15:31:21.774Z` · geometría `MultiPolygon` |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Campos** | `fase` — y nada más. **Ninguno personal** |
| **¿Está en este repo?** | ✅ [`app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json`](app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json) · 2.909 bytes · sha256 `7fd19d79f02f693d17531c8997599c03c891efd27d72b3302bcc763b16f34b06` |

⚠️ **La trampa del CRS, y cómo se esquiva.** La ficha del catálogo declara
**EPSG:25830** (UTM), que es el mismo pie con el que tropieza el resto del dato
municipal. **Pidiendo `srsName=EPSG:4326` el WFS reproyecta él**, y lo que llega
es lon/lat: el primer vértice es `[-0.88930788, 41.65869065]`. No se reproyecta
nada a mano, que es donde se cometen los errores.

> ⭐ **LA ZBE AVISA, NO VETA — y la letra es oficial.** [**FAQ de la sede**,
> `https://www.zaragoza.es/sede/portal/movilidad/bajas-emisiones/faq`, **leída el
> 02/09/2026**] es de aplicación **L-V 8:00-20:00**, con sanciones desde el
> **12/12/2025**, y **B, C, ECO y CERO circulan libres sin registro**: a quien
> alcanza es a los **SIN etiqueta**, salvo excepciones con registro. La **Fase 1**
> es la vigente; la Fase 2, futura.
>
> ⚠️ **La app NO SABE la etiqueta ambiental de quien conduce.** Así que la red
> **marca** las aristas de dentro y el viaje **avisa con la letra citada**; vetar
> sería prohibirle el paso a un coche ECO que puede entrar. Es componer sin
> prometer, y es la misma regla del D-G del BiZi.

⭐ **Dónde está cumplida (2/09).** La frase que se le enseña a quien busca vive
en **una sola constante**, `AVISO_ZBE` de
[`motor/src/viaje-coche.ts`](motor/src/viaje-coche.ts), con la URL de la FAQ y la
fecha de lectura en su comentario. Va en `Trayecto.avisos` **con el índice del
paso por el que se entra en la zona** —el campo `paso` que el contrato estrena
hoy—, para que la pantalla pueda ponerlo arriba y junto a ese paso sin adivinar
nada leyendo el texto. La ruta **se devuelve entera**: 200 aristas de las 57.390
caen dentro de la fase 1, y en 200 peticiones al azar el aviso salió en **25 de
las 189** que dieron ruta.

---

### 1.31 · Aparcamientos públicos y su cruce con la ZBE — Ayuntamiento de Zaragoza (catálogo 55)

| | |
|---|---|
| **Qué es** | Los **41 aparcamientos públicos** del catálogo municipal —nombre, horario y punto en WGS84— **cruzados con los dos polígonos de la ZBE** (§ 1.30). El motor los usa para rematar la ruta en coche cuando el destino cae dentro de la zona y el vehículo no puede entrar |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | API de la sede · conjunto **55 «Aparcamientos Públicos»** · servicio `equipamiento/aparcamiento-publico` |
| **Petición** | `https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/equipamiento/aparcamiento-publico.json?srsname=wgs84&start=0&rows=500` |
| **Descarga** | **02/09/2026**, estado 200 · 20.585 bytes · `totalCount` 41 · 41 filas con punto, **ninguna sin coordenada** |
| **Licencia** | **Ley 37/2007** · la ficha del catálogo declara `https://www.zaragoza.es/sede/portal/aviso-legal#condiciones` |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **Campos que se guardan** | `id` · `nombre` · `lon`/`lat` · `horario` · `dentroDeFase1` · `dentroDeFase2`. **Ninguno personal** |
| **¿Está en este repo?** | ✅ [`app/data/parkings-zbe.json`](app/data/parkings-zbe.json) · 6.956 bytes · sha256 `9d71d1e2dbde722558bea2abd6e36eddded86538cee52fda12291aad77391061` |

⭐ **EL CRUCE ES NUESTRO, y por eso se declara aquí con fecha.** Las dos banderas
no vienen del Ayuntamiento: las calcula
[`motor/src/cocinar-parkings-zbe.ts`](motor/src/cocinar-parkings-zbe.ts) el
**03/09/2026** con `dentroDeLaZbe` de
[`motor/src/red-coche.ts`](motor/src/red-coche.ts) —**el mismo punto-en-polígono
que marca las 200 aristas del coche**, para que la respuesta en el borde no
dependa de qué función se pregunte—. Resultado: **4 dentro de la fase 1**
(`1` Plaza del Pilar - Juzgados · `2` Ayuntamiento · `3` César Augusto ·
`105` Puerta Cinegia), **7 solo dentro de la fase 2** (`4` · `103` · `112` ·
`113` · `118` · `119` · `122`) y **30 fuera**. La juez 5 de
`viaje-coche.spec.ts` recalcula las 41 filas contra la capa y las compara.

⚠️ **EL DATO ESTÁ SELLADO EN 2013 y dice DÓNDE, no que sigan abiertos.** Las 41
filas traen `lastUpdated` **2013-07-08** —trece años—, aunque el registro del
catálogo se tocara el **2026-01-20**. El `horario` viaja **literal, en sus 11
formas** («24 horas», «24 horas.», «comercial.», «L-J 9,00 a 2,00 V-S-FyVis 9,00
a 4,00 Domingos 11,00 a 2,00.», …) y **una ficha no lo trae**: no se normaliza ni
se rellena.

⚠️ **Y NO TRAE lo que la norma pide.** El § 1.32 exige «sistema de control de
acceso conectado» para poder entrar en la ZBE hacia un aparcamiento, y **ese
campo no existe en este censo**: `NO CONSTA` cuáles lo tienen. Tampoco hay
tarifas, ni plazas, ni ocupación. Por eso el aviso del motor cuenta **la norma**
y manda al registro municipal; no promete la plaza.

⚠️ **El crudo NO está en el repo.** Es una descarga, y aquí solo entra dato
declarado: lo que entra es el **cocinado**, y el crudo se vuelve a bajar de la
petición de arriba y se pasa por ruta —
`node src/cocinar-parkings-zbe.ts <crudo.json>`—. La cocina es **determinista**:
ordenada por `id`, claves en orden fijo y **sin fecha de generación dentro**; dos
pasadas dan el mismo sha256.

---

### 1.32 · La autorización para entrar en la ZBE — Ayuntamiento de Zaragoza (trámite 42155)

| | |
|---|---|
| **Qué es** | La página del trámite **«Zona de Bajas Emisiones: registro»**, que enumera **quién puede obtener autorización** para acceder a la ZBE sin distintivo ambiental. Es la base de la ruta que remata en un aparcamiento público |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | Sede electrónica · trámite **42155** |
| **Petición** | `https://www.zaragoza.es/sede/servicio/tramite/42155` |
| **Lectura** | **03/09/2026 09:07 GMT**, estado **200** · **131.795 bytes** · `text/html;charset=UTF-8` · título «Zona de Bajas Emisiones: registro. Trámites y servicios. Ayuntamiento de Zaragoza» |
| **Licencia** | **Ley 37/2007**, la misma que el resto del dato municipal |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza»** |
| **¿Está en este repo?** | ❌ **No.** Es una página, no un dato: lo que entra es **la cita**, en el comentario de `avisoDelRemateEnParking` |

> ⭐ **LA LISTA, TRANSCRITA — no resumida.** Bajo *«Requisitos»*: *«Si su
> vehículo NO tiene derecho a distintivo ambiental, PUEDE OBTENER autorización
> registral para acceder, circular y estacionar en ZBE de Zaragoza si su vehículo
> se encuentra en alguno de estos casos:»*
>
> 1. *«Vehículo Transporta Persona con Movilidad Reducida PMR.»*
> 2. *«Vehículo asociado a plaza de garajes dentro de la ZBE.»*
> 3. *«Vehículo asociado a local con actividad comercial dentro de la ZBE.»*
> 4. *«Vehículo con tarjeta de residente de estacionamiento regulado dentro de la ZBE.»*
> 5. *«Vehículo de Servicio de emergencia y esenciales. (Servicios médicos, Ambulancias, Grúa Municipal, funeraria, protección civil y salvamento, bomberos, policía y cuerpos y fuerzas de seguridad del estado y militares, limpieza pública, alumbrado, semáforos y obra pública o Servicios públicos esenciales.»*
> 6. *«Vehículos de matrícula extranjera.»*
> 7. *«Vehículos que transportan personas enfermas»*
> 8. *«Vehículos que accedan a estacionamientos públicos con sistema de control de acceso conectado.»*
> 9. *«Vehículos que accedan a reservas de hoteles con sistema de control de acceso conectado.»*
> 10. *«Vehículos de servicio singular. (Autoescuelas, blindados, emisoras de radio o televisión, talleres o laboratorios, bibliotecas volantes, tiendas volantes, grúas de arrastre, grúas de elevación, hormigoneras, vehículos para ferias, riego asfáltico, pinta-líneas, quitanieves¿)»*
> 11. *«Taxis adaptados»*
> 12. *«Vehículos históricos»*
> 13. *«Vehículos con permiso diario sin mas justificación (máximo 8 al mes).»*
> 14. *«Vehículos de titulares de plazas de estacionamiento municipales para residentes dentro de la ZBE de Zaragoza»*
>
> Y bajo *«¿Con qué frecuencia hay que renovar la autorización de acceso a la
> ZBE?»*: *«Autorizaciones puntuales: como los accesos diarios con límite de 8 al
> mes, o accesos vinculados a estancias en hoteles o aparcamientos públicos
> conectados.»*
>
> La página también dice qué calles la delimitan: *«La Zona de Bajas Emisiones
> (ZBE) está delimitada por el Paseo Echegaray y Caballero, San Vicente de Paúl,
> Coso, Plaza de España, Conde Aranda, Mayoral, Plaza de Santo Domingo y la calle
> Ramón Celma, que conecta nuevamente con Echegaray.»*

⚠️ **Se transcribe tal cual, erratas incluidas.** El punto 10 acaba en
`quitanieves¿)` y el 5 abre un paréntesis que no cierra: **están así en la
página**. Corregirlas sería empezar a interpretar, y lo que aquí vale es la
letra.

⚠️ **La ordenanza general de movilidad NO sirve para esto.** Su propia
exposición de motivos dice que *«dicha Zona de Bajas Emisiones no se encuentra
dentro del contenido de esta ordenanza»*, porque la regula su reglamento propio
(pleno de **25 de julio de 2024**). Antes de este encargo, la excepción del
aparcamiento público **NO CONSTABA** en el repositorio.

⭐ **Dónde está cumplida (3/09).** En dos constantes de
[`motor/src/viaje-coche.ts`](motor/src/viaje-coche.ts) —`avisoDelRemateEnParking`
y `textoDeAparcarEnParking`—, con la URL y la fecha de lectura en su comentario.
El aviso enumera **cuatro** de los catorce casos (residentes, plaza de garaje,
PMR y aparcamiento público conectado) porque son los que caben en una frase; los
catorce están arriba. **No se afirma que el aparcamiento elegido esté
conectado** — eso § 1.31 no lo sabe—: se dice la norma y se manda al registro.

---

### 1.33 · Aparcamotos cocinados — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **2.146 aparcamotos** públicos reducidos a lo que el motor mira: dónde están, en qué calle y portal, y cuántas plazas tienen — **11.715 plazas**. Es donde la moto remata su viaje (punto 13, casilla 1) |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | **La capa de § 1.10**, `movilidad:MU2_motos` del GeoServer de IDEZar. No se vuelve a bajar: el cocinado lee [`app/data/2026-08-18_wfs_movilidad-MU2_motos.json`](app/data/2026-08-18_wfs_movilidad-MU2_motos.json), que ya está en el repositorio con su sha256 verificado |
| **Petición** | La de § 1.10, y por eso el cocinado **se puede repetir sin red** |
| **Licencia** | **Ley 37/2007**, la de § 1.10 |
| **Atribución exigida** | **«Origen de los datos: Ayuntamiento de Zaragoza (IDEZar)»** |
| **Campos que se guardan** | `id` (el del WFS, `MU2_motos.N`) · `via` (`Nombre_calle`, verbatim) · `portal` (`Portal`, verbatim) · `plazas` · `lon`/`lat` · **`nombreDe`** —solo en los **6 conflados**: dice que el nombre de la vía viene del listado de la sede y no de la capa (§ 1.10)—. **Ninguno personal** |
| **Campos que NO entran** | `Codigo_calle` —el enganche al callejero; hoy no hace falta, el nombre viene en la misma fila—, `Fecha_instalacion` —solo en 616 de 2.146, y § 1.10 declara una fecha imposible dentro— y `Poligono` —en 33 de 2.146, y es el distrito—. Y el `Tipo_via`: expandir `CL` a «Calle» sería inventarse una tabla que este repositorio no tiene |
| **¿Está en este repo?** | ✅ [`app/data/aparcamotos.json`](app/data/aparcamotos.json) · 239.343 bytes · sha256 `5021e2b736d98a43adfdbaecea6a40672eb70239b2867e011afdf88ee43842b4` · ⚠️ **sellado nuevo el 4/09** con la conflación de los 6 nombres: el anterior era 239.156 y `415d5440…`, y el `git diff` entre los dos son **6 líneas** |

**El cocinado es determinista** —[`motor/src/cocinar-aparcamotos.ts`](motor/src/cocinar-aparcamotos.ts)—:
ordena por el **número** del `id` —como texto, el `MU2_motos.10` iría antes que el `MU2_motos.9`—,
escribe las claves en orden fijo y **no mira el reloj**. Comprobado dándole los rasgos **en orden
inverso**: los mismos bytes. Así el `git diff` sirve para ver si el dato ha cambiado, que es para
lo que se usa.

**Y el agujero del origen no se tapa inventando**: **6 de los 2.146 no traen `Nombre_calle`** —los
mismos que llevan los 2 códigos de vía huérfanos de § 1.10— y **8 no traen `Portal`**. Los 8 sin
portal salen con el campo vacío: inventarles un número sería peor que callar. Los 6 sin calle
**sí se completan, y no inventando: por conflación declarada** — ver abajo.

> ⚠️ **Y esos 6 SÍ tienen nombre en la sede**, medido el 04/09 casándolos por posición: los seis
> caen a **0,0 m** de un registro del directorio que sí los nombra.
>
> | WFS | plazas | cómo lo llama la sede |
> |---|---|---|
> | `MU2_motos.138` | 15 | `DE RANILLAS, S/N` |
> | `MU2_motos.171` | 20 | `DE RANILLAS, S/N` |
> | `MU2_motos.172` | 20 | `DE RANILLAS, S/N` |
> | `MU2_motos.173` | 20 | `DE RANILLAS, S/N` |
> | `MU2_motos.222` | 8 | `DE RANILLAS, S/N` |
> | `MU2_motos.1483` | 4 | `GRUPO ARZOBISPO DOMENECH, 23` |
>
> Así que **el precio de esta puerta no era solo un soporte: eran también seis nombres de calle**.
> Y no era teórico — es exactamente el caso `no + destino dentro` del punto 13: el remate cae en
> el `MU2_motos.171`, y la frase pasó de «el aparcamiento de motos de De Ranillas, S/N» a «el
> aparcamiento de motos», el mismo sitio sin nombre.
>
> ⭐ **Y el 4/09 se escribió la decisión, que es lo que esta nota pedía**: los seis se completan
> por **conflación de atributos** desde el listado de la sede — la nota entera, con la tabla del
> casado y las tres condiciones que se exigen, está en **§ 1.10**. No es mezclar las dos puertas:
> la geometría, las plazas y los portales siguen siendo de la capa, entra **un atributo donde
> falta**, y cada registro conflado lo declara con `nombreDe: "sede"`. El hito de aquel caso
> vuelve a decir dónde es: «Aparca en el aparcamiento de motos de De Ranillas S/N (sin coste)».

#### Manda la CAPA, y es doctrina de procedencia

El Ayuntamiento publica los aparcamotos por dos puertas que no coinciden: esta capa del GIS
—**2.146 soportes, 11.715 plazas**— y el directorio de la sede electrónica
`urbanismo-infraestructuras/equipamiento/aparcamiento-moto` —**2.115 y 11.543**—.

Manda **la capa**, que es donde el dato vive, y no el directorio, que es donde se publica una
copia. Entre una fuente original y una derivada se toma la original, y esta casa ya lo hizo así
en **§ 1.6 con los postes**: mandó el `MU3` del WFS.

> ⚠️ **Esto invierte una decisión de esta misma ficha.** El 4/09 por la mañana la fuente pasó al
> directorio de la sede, por frescura aparente: publica `Last-Modified` y un `lastUpdated` por
> registro, y el WFS no publica marca temporal ninguna —§ 1.10 dice literalmente *«Frescura: NO
> CONSTA»*—. Lo medido esa misma mañana deshizo el argumento, y está abajo.

**El cruce, medido el 04/09/2026** por vecino más próximo —no hay identificador común: los del
WFS son correlativos de GeoServer y los de la sede ids de tabla con huecos—:

| | |
|---|---|
| Casan a ≤ 20 m | **2.114** |
| Solo en el **WFS** | **32** — la sede todavía no los ha volcado. **Entran** |
| Solo en la **sede** | **1** — `MANUEL LASALA, F 44`, id 1198, 2 plazas. **Se queda fuera** |
| Casan pero **movidos** | **7**, entre 1,2 y 14,9 m. La posición corregida la lleva el WFS en los siete |
| Casan con **plazas distintas** | **1** — `MIGUEL LABORDETA, 1`: la sede dice **5** y el WFS **6** |

Las cuentas cierran por los dos lados: 2.114 + 1 = 2.115 (sede) y 2.114 + 32 = 2.146 (WFS).

> ⚠️ **Lo que cuesta esta puerta: UN soporte**, y **`NO CONSTA` qué es**. `MANUEL LASALA, F 44`
> puede ser una **baja** que el WFS ya aplicó y la sede no ha volcado, o un **alta** que solo
> existe en la tabla de la sede. Ninguna de las dos fuentes trae fecha de baja y el WFS no
> publica marca temporal, así que no hay con qué decidirlo — y no se elige. La juez 5c lo vigila
> por su posición: si algún día la capa lo publica, se pone roja.

#### ⚠️ Por qué la frescura de la sede no era frescura, medido

Los **2.115 registros de la sede llevan una marca del 3/09 entre las 23:13:30 y las 23:15:16** —
el catálogo entero sellado en **106 segundos**, con 107 valores distintos. Eso es la firma de un
**volcado nocturno de la tabla**, no el historial de cada plaza: `lastUpdated` dice cuándo se
republicó el registro, y **no se puede leer como «este aparcamoto se tocó ayer»**.

Y el segundo dato, medido el mismo día: **ninguna de las dos fuentes ha cambiado de contenido en
17 días.** El WFS servido el 04/09 trae los mismos 2.146 rasgos que la copia del 18/08 —firma
idéntica sobre `id`, geometría y propiedades; lo único que cambia en la respuesta es su
`timeStamp`— y la sede sigue en 2.115 y 11.543 plazas, los mismos números que § 1.10 midió aquel
día. Así que **lo que respira cada noche en la sede son las marcas de tiempo, no los
aparcamotos**.

⚠️ **Y lo que se pierde al volver a la capa, va dicho**: la marca temporal por registro. Medida,
decía cuándo se volcó la tabla y no cuándo cambió la plaza — pero se pierde igual, y de esta capa
la frescura sigue siendo `NO CONSTA`.

### 1.34 · El resto del dato — todavía **ninguno**

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
