# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 17/08/2026.** El proyecto está en construcción. Hoy hay de terceros: las
> dependencias npm, la cartografía de OpenStreetMap que pide el mapa, y **tres** ficheros de
> datos —los portales del Ayuntamiento, el grafo de continuidad derivado de OSM y los carriles
> bici municipales—. Las paradas y las estaciones Bizi todavía no han entrado; cada pieza llega
> con su autorización y su ficha.
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

### 1.5 · El resto del dato municipal — todavía **ninguno**

No hay paradas de autobús ni tranvía, ni estaciones Bizi, en este repositorio. Cada pieza
entrará con su autorización y su ficha, como éstas.

---

## 2 · Software

### 2.1 · Dependencias declaradas como de ejecución

Las que van en `dependencies` de [`app/package.json`](app/package.json).

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

### 2.3 · El árbol transitivo — existe, y no se lista aquí

Las **17 declaradas** de arriba arrastran, con todo lo suyo, **500 paquetes** instalados.
Enumerarlos aquí sería una tabla que nadie lee y que caduca en la primera actualización.

**Dónde mirarlos, que es lo que importa:** [`app/package-lock.json`](app/package-lock.json), que
está versionado precisamente para eso — cada entrada trae su versión, su origen y su licencia.

```bash
cd app && npm ls --depth=0     # las 17 declaradas
cd app && npm ls --all         # el árbol entero
```

**El reparto de licencias del árbol completo, leído del `package-lock.json` el 16/08/2026
(recalculado al entrar Leaflet):**

| Licencia | Paquetes |
|---|---|
| MIT | 428 |
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
| **Total** | **500** |

### 2.4 · Las tres que no son MIT ni BSD

De las 500, tres familias no son la licencia permisiva de siempre. **Las tres son de desarrollo:
ninguna viaja al navegador.**

| Paquete | Licencia | Qué tiene de distinto |
|---|---|---|
| **`lightningcss`** 1.33.0 y sus **11 binarios** por plataforma | **MPL-2.0** | *Copyleft débil, por fichero.* Obliga a publicar las modificaciones **de sus propios ficheros**; no contamina el código que lo usa ni lo que produce. Es el minificador de CSS de `@angular/build`: **procesa** nuestro CSS, no se mezcla con él |
| **`caniuse-lite`** 1.0.30001809 | **CC-BY-4.0** | Es **datos**, no código: la tabla de compatibilidad de navegadores que usa browserslist. CC-BY **exige atribución** — y esta línea es la atribución |
| **`lru-cache`** 11.5.2 | **BlueOak-1.0.0** | Permisiva y aprobada por la OSI. Solo es infrecuente |

### 2.5 · Resumen de compatibilidad

**Las 17 dependencias declaradas son MIT, Apache-2.0, BSD-2-Clause o 0BSD**: permisivas, sin
copyleft, y compatibles con la Apache 2.0 de este proyecto sin ninguna condición añadida. **No
hay ninguna sorpresa entre ellas** — y en particular, Leaflet es BSD-2-Clause, no una licencia
con restricciones de uso.

En el árbol transitivo aparecen tres licencias menos habituales (§ 2.4). Ninguna bloquea nada:
la única con copyleft —MPL-2.0— es débil, por fichero, y está en una herramienta de *build* que
no se redistribuye. La única que obliga a algo —CC-BY-4.0— obliga a atribuir, y queda atribuida
arriba.

> **Y lo que este documento no garantiza:** el reparto de licencias de § 2.3 sale del campo
> `license` que cada paquete declara en el `package-lock.json`. **No se ha abierto el `LICENSE` de
> los 500 para comprobar que dicen la verdad**, y un paquete puede declarar mal. Las **17
> declaradas sí** se han mirado una a una. Del resto: **NO CONSTA**.
