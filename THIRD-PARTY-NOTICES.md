# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 17/08/2026.** El proyecto está en construcción. Hoy hay de terceros: las
> dependencias npm, la cartografía de OpenStreetMap que pide el mapa, y **siete** conjuntos de
> datos —los portales, los carriles bici, los postes de autobús, las estaciones BiZi y los
> aparcabicis del Ayuntamiento; el grafo de continuidad derivado de OSM; y el GTFS del Punto de
> Acceso Nacional—. Solo quedan fuera las capas municipales de tranvía; cada pieza llega con su
> autorización y su ficha.
>
> ⏳ **Uno de ellos caduca: el GTFS, el 05/10/2026** (§ 1.6).
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
- ⚠️ **Los metadatos del proyecto de origen describen OTRO fichero.** Declaran para portales
  `sha256 398ac652…` y 10.364.859 bytes; lo que hay en disco —y lo que está aquí— es
  `sha256 3c391d60…` y 10.835.605 bytes. El metadato es de las 07:11 y el fichero de las 15:26
  del mismo día: se reescribió después y nadie regeneró el metadato. **La huella válida es la de
  este fichero**, que es el que se consume.

**Cómo se vuelve a conseguir:** pidiendo la capa al WFS de Urbanismo — pero saldrá **otro**
fichero: el callejero municipal se refresca (política declarada: mensual). Lo que garantiza los
números de arriba es **este** fichero, no una consulta nueva.

### 1.3 · Grafo de continuidad peatonal y ciclable — derivado de OpenStreetMap

| | |
|---|---|
| **Qué es** | La red por la que se podrá caminar y pedalear: **98.774 aristas** con su geometría propia (378.222 vértices) y **68.649 nodos** (que solo existen como contador y como extremos de arista) |
| **Origen del dato** | **OpenStreetMap**, vía Overpass. Cada arista conserva su etiqueta `highway` (`h`) y su **id de *way*** (`w`) de OSM. Deriva de una descarga de Overpass registrada el **03/08/2026 08:20:58 GMT**; el propio grafo lleva sello `2026-08-03T08:19:51Z` |
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
| **El enganche portal→arista** (`portales`) | **5,9 MB** | **NO se usa hoy.** Son los mismos 46.150 portales de § 1.2 otra vez, pero pegados al grafo: distancia de enganche, vía heredada y concordancias, con sus contadores (**46.026 enganchados · 124 no**). Se conserva porque **el motor del punto 6 lo necesitará** y porque el `enlaces.json` del proyecto anterior referencia aristas **por índice de este fichero** |
| **La auditoría del intento anterior** | **0,2 MB** | **No se hereda como documentación** —`componentes` (170), `noConectados` (1.410), `puntasLejos` (488), `porDefecto` (114)—. Viaja porque el fichero es **indivisible sin editarlo**, y editarlo está prohibido |

> ⚠️ **Hay dos versiones de los portales en este repositorio**, y es a propósito: los
> municipales de § 1.2 (fuente, Ley 37/2007) y los enganchados de aquí (derivados, ODbL). No son
> el mismo dato ni tienen los mismos campos. Que convivan es una decisión tomada, no un descuido.

### 1.4 · Carriles bici y sendas ciclables — Ayuntamiento de Zaragoza (IDEZar)

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

### 1.5 · Postes de autobús urbano — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **944 postes** de autobús urbano del catálogo municipal: `codigo`, `stop_name` y `stop_code`, con su coordenada. Son el dónde se sube y se baja del modo BUS |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU3_paradas_bus_unicas`** · petición registrada el **10/08/2026 09:48:39 GMT** (`timeStamp` del propio WFS: `2026-08-10T09:48:39.236Z`). CRS **EPSG:4326**, geometría `Point` |
| **Licencia** | **Ley 37/2007**, la misma que los portales (§ 1.2) y los carriles (§ 1.4) |
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

### 1.6 · GTFS del transporte urbano — Punto de Acceso Nacional (ficha 1176)

> ## ⏳ ESTE DATO CADUCA EL **05/10/2026**
> Lo declara el propio feed: `feed_info.feed_end_date = 20261005`. Es una **instantánea
> autorizada**, no una fuente viva. Pasada esa fecha, lo que hay aquí describe una red que ya
> no está vigente, y **nada en el repositorio lo va a avisar solo**.

| | |
|---|---|
| **Qué es** | El feed GTFS del transporte urbano de Zaragoza: líneas, viajes, orden de paradas, calendario y **trazados**. Es donde viven las líneas que § 1.5 dejó anotadas como dependencia |
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
| [`…_stops.txt`](app/data/2026-08-10_nap_gtfs-ficha1176_stops.txt) | 99.309 | `6d1a969ab25d7be41ffb9b8184589865407be671fd52fadc50206aa3917c957b` | **Las 50 paradas del tranvía**, que no están en ninguna otra fuente del repositorio: el MU3 municipal (§ 1.5) es solo bus. De sus 984 paradas se pintan **solo esas 50**; las 934 `PA…` de bus no, porque para eso manda el censo municipal |

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
  este feed con los postes municipales de § 1.5 — pero **solo lo tienen 934 de los 984**. Los
  **50 del tranvía usan otro espacio de códigos** (`0101`, `0201`, …). Quien cruce por `PA…`
  creyendo que cubre la red entera perderá el tranvía **sin que nada falle**.
- **Suciedad de codificación que viaja tal cual.** El origen no pone en mayúscula las vocales
  acentuadas: **8 nombres** salen mal — «Miguel **á**ngel Blanco N.º 53», «Nuestra Señora De Los
  **á**ngeles», «Ies **í**taca», «Marcelino **á**lvarez». No se corrige: el dato se copia tal cual.

> ⚠️ **Y una tercera que salió al re-verificar, que no venía heredada: el feed se contradice
> consigo mismo.** Declara `feed_end_date = 20261005`, pero su `calendar_dates` tiene servicio
> hasta el **31/12/2026**. Son casi tres meses de servicio declarado más allá de la validez que
> el propio feed se da. **Aquí se toma la fecha conservadora, la del publicador: 05/10/2026.**

### 1.7 · Estaciones BiZi — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Las **276 estaciones** del servicio público de bicicleta BiZi: posición, nombre, situación, **capacidad** (`anclajes_bicicletas`), tipo de pavimento y tipología. Es el dónde se coge y se deja una bici sin tenerla |
| **Titular** | **Ayuntamiento de Zaragoza** |
| **Fuente** | IDEZar GeoServer WFS · capa **`movilidad:MU1_estaciones_bici_ubicacion`** · descargada el **02/08/2026 10:10 GMT** (los `timeStamp` de las seis páginas van de las 10:10:20 a las 10:10:28). CRS **EPSG:4326**, geometría `Point` |
| **Licencia** | **Ley 37/2007**, la misma que portales (§ 1.2), carriles (§ 1.4) y postes (§ 1.5) |
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

### 1.8 · Aparcabicis — Ayuntamiento de Zaragoza (IDEZar)

| | |
|---|---|
| **Qué es** | Los **2.158 aparcabicis** públicos: soportes donde dejar la bici propia, con su tipo, su vía y su número de anclajes. Completa el modo BICI por el otro lado — las estaciones de § 1.7 son la bici pública; esto es dónde dejar la tuya |
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
  Construcción» de § 1.4.
- **`tipo_estacion`** trae 17 tipos de soporte (`Individuales U` 1.003, `Bicis y Vmp en calzada`
  833, `Módulo  U en bastidor` 123…) — con **dobles espacios** en algunos nombres, del origen.
- **`anclajes`** va de **0 a 110**, y **un rasgo no lo trae**.
- **`nombre_reducido`** arrastra marcadores internos del callejero municipal en **36 de los
  2.158**: valores como `"LOGROÑO  ---CST"`. No se corrige: el dato se copia tal cual.

### 1.9 · El resto del dato — todavía **ninguno**

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
