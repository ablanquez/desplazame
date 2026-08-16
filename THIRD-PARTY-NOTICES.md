# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 16/08/2026.** El proyecto está en construcción. Hoy lo único de terceros que hay
> en él son las dependencias npm que ha traído Angular. Este documento nace con ellas y crece
> cuando entre lo demás.

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
| **¿Está en este repo?** | ✅ **Sí, tal cual**: [`data/2026-05-13_zgzradar_callejero-portales-zaragoza.json`](data/2026-05-13_zgzradar_callejero-portales-zaragoza.json) · 10.835.605 bytes · sha256 `3c391d60cf91362c984ec2ac2e302f7eec2ce35d94deb42f6e42b678aef7cfdc` |

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

### 1.3 · El resto del dato municipal — todavía **ninguno**

No hay grafo de calles, ni paradas, ni carriles bici en este repositorio. Cada uno entrará con su
autorización y su ficha, como ésta.

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
