# Desplázame

**Buscador de rutas urbanas multimodales en Zaragoza, con motor de cálculo propio.**

> ## ⚠️ Qué hay y qué no
>
> Hay **motor de rutas a pie funcionando**: un grafo de la ciudad construido desde cero, enganche de
> direcciones, cálculo de itinerarios y un redactor que los cuenta en castellano. Hay **cuatro
> visores** para mirarlos sobre el mapa.
>
> **No hay aplicación, ni interfaz de usuario, ni servidor.** Se interroga por línea de comandos.
> **El motor calcula a pie y nada más**: el carril bici está en el grafo como *etiqueta* —el texto
> de la ruta lo menciona— pero no hay cálculo en bici, ni autobús, ni tranvía. Eso es lo siguiente.
> Y el **tiempo real** (posiciones de vehículos, llegadas en vivo, bicis disponibles) está fuera de
> la primera versión.
>
> ⛔ **Y el dato NO viaja en este repositorio.** Un clon recién hecho **no puede ejecutar el motor**.
> Cómo saber qué te falta está tres secciones más abajo, en *Cómo ejecutarlo*.

---

## Qué hay dentro, en números

Cada cifra sale de un script que se puede volver a ejecutar, y va con él al lado. ⚠️ **Las cuatro
últimas suben solas** —código, bitácora, informes—: están medidas el **7 de agosto de 2026** y para
cuando leas esto serán otras. **Manda el comando, no el número.**

| Qué | Cuánto | De dónde sale |
|---|---|---|
| El grafo de Zaragoza | 68.649 nodos · 98.774 aristas · 170 componentes · 6.499,98 km | `node src/numeros-congelados.js` |
| …de ellas, a pie | 94.570 aristas | ídem |
| Sello del dato de OSM | `2026-08-03T08:19:51Z` | ídem |
| Portales del callejero municipal | 46.150, de los que **46.026** quedan enganchados a una calle | `node src/informe-portales.js` |
| Direcciones que el buscador puede pedir | 51.065 | `node src/numeros-congelados.js` |
| Rutas de cordura que se ejecutan en cada cambio | 7, y **una no debe resolverse** — es el control | `node src/modelo-rutas.js` |
| Código | 71 ficheros · 25.574 líneas | `ls src/*.js \| wc -l` · `cat src/*.js \| wc -l` |
| Entradas de bitácora | 167 | `grep -c '^## \[' docs/BITACORA.md` |
| Informes | 40 | `ls docs/*.md \| wc -l` |

⚠️ **Las siete rutas no se publican aquí a propósito.** Sus metros viven en el instrumento que las
mide, y un número copiado a una portada se pudre sin que nadie se entere. `node src/modelo-rutas.js`
las dice, y compara cada una con lo que se publicó.

## Qué va a ser

Un buscador de *"quiero ir de X a Y"* en Zaragoza, combinando **a pie, autobús, tranvía y BiZi**,
con un buscador configurable (qué transportes acepto, minimizar transbordos).

El cálculo de rutas es **código propio**: nada de OSRM, Valhalla ni GraphHopper. Ese es el motivo
del proyecto — el algoritmo es el trabajo, no el envoltorio.

## ⭐ Cómo ejecutarlo

**Qué necesitas instalar: nada.** No hay `package.json` porque no hay ni una dependencia externa —
todo son módulos de Node (`fs`, `path`, `crypto`, `child_process`, `os`, `vm`, `module`). Se
comprueba con:

```bash
grep -rhoE "require\('[^.][^']*'\)" src/*.js | sort -u
```

Se ejecuta hoy con **Node v24**. ⚠️ No hay medido cuál es el mínimo: no se dice para no inventarlo.

⚠️ **El motor funciona sin red; los cuatro visores no.** Cargan Leaflet 1.9.4 de `unpkg.com` y las
teselas de fondo de `tile.openstreetmap.org`. Sin internet salen en blanco — y eso no es un fallo
del cálculo: los metros y el texto de la ruta se producen enteros sin conexión.

**Primero, saber qué te falta:**

```bash
node src/verificar-datos.js
```

Te dice, fichero a fichero, qué necesita el motor, qué scripts se quedan sin poder correr si falta, y
—lo que de verdad importa— **si lo que tienes es EL MISMO fichero que produjo los números
publicados**. Tres veredictos y ninguno por defecto: `EL MISMO` · `OTRO` · `NO ESTÁ`.

⛔⛔ **Y de la consulta con la que se pidió cada uno: para SEIS de los doce, este repositorio NO
SABE.** Están archivadas las de los cinco WFS y la del OSM del grafo —ésa entera, en
[`docs/H1-PRIMER-GRAFO.md`](docs/H1-PRIMER-GRAFO.md) §1—; de las otras seis se guardó **la respuesta
y no la petición**, porque eran POST a Overpass. ⇒ **el verificador dice `NO CONSTA` con su motivo,
uno por uno**, y ahí se queda: se conserva el sello del dato que está dentro del propio fichero
(`timestamp_osm_base`), que sirve para saber **qué** tienes, no para volver a pedirlo.

*No es un matiz: es que el repositorio no sabe cómo se pidió la mitad de su dato. Prefiere decirlo a
inventar una consulta plausible — alguien la ejecutaría.*

**Por qué el dato no viaja, y por qué no hay un script que lo baje:**

- `data/fuentes/` es **dato de producción**: se refresca. OSM cambia a diario. Versionarlo sería
  guardar para siempre algo que se pudre sin avisar, y que alguien clonaría seis meses después
  creyendo que está al día. Los **12 ficheros que el motor necesita suman 72,7 MB**, el mayor de
  37,4 MB — los dice `node src/verificar-datos.js`, uno a uno y con su tamaño. *(La carpeta entera
  pesa 135,1 MB por `du -sb data/fuentes`, pero 62,4 de ellos son una capa que no lee ningún
  script.)*
- ⛔ Y **no se escribe un script que lo descargue**, que sería lo cómodo: *un clon que se baja su
  propio OSM arranca y da OTROS números — y eso es peor que no arrancar, porque parece que
  funciona.* Un dato de otro día es otra fuente.

⇒ La limitación es real y está declarada. Lo que se ha construido es que **el clon lo sepa**.

**Después, el motor:**

```bash
node src/ruta.js "Calle Manifestación 6" "Calle Don Jaime I 17"   # una ruta (da 598 m)
node src/modelo-rutas.js                                     # las siete rutas de cordura
node src/probar-paradas.js --todo                            # la batería entera (~35 min)
node src/exportar-rutas.js && start tools/visor-rutas.html    # verlas sobre el mapa
```

⚠️ **El buscador entiende `Calle X 17`, no `Plaza del Pilar`.** Resuelve **portales del callejero
municipal** —vía + número— y una lista corta de sitios con nombre; un topónimo suelto no. Si no lo
resuelve te lo dice, pero ⛔ **sale en código 0 igualmente**: está anotado como fallo pendiente.
```

## Qué se sabe de las fuentes

- **Sí hay red viaria vectorial descargable.** El GeoServer del Ayuntamiento publica **178 capas** por
  WFS; `movilidad:MU1_jerarquia_viaria` trae **3.644 tramos** con geometría, sentido de circulación
  y límite de velocidad, y **3.623 de ellos con el código de vía** que enlaza con los 46.150
  portales del callejero municipal. Un cruce por identificador exacto, no por nombre y cercanía.
  ⚠️ `tn-ro:RoadLink` publica **los mismos 3.644** —es la edición INSPIRE de esa capa— con menos
  atributos; e `idezar_base:JERARQUIA_VIARIA` es **otra** (3.453 tramos, sin código de vía).
- **No hay topología.** Las líneas están dibujadas, no conectadas: de 160 tramos medidos en 11
  zonas, solo 21 pares de extremos coinciden. Pero **87 pares se cruzan geométricamente**, así que
  la información está en el dato — hay que *planarizarla*. Ese paso está construido, y es la parte
  interesante.
  ⚠️ De esas cuatro cifras, **solo los 160 tramos salen de un instrumento que siga vivo** (los 12
  ficheros de zona de `data/exploracion/`, contando `fid` únicos). **Los 21 y los 87 los midió un
  script de la tanda 0 que no está en `src/`**: son citas de
  [`docs/BITACORA.md`](docs/BITACORA.md), no algo que puedas reproducir con un comando de aquí.
- **No hay red peatonal municipal publicada.** Ni aceras como eje, ni pasos de peatones. Existen
  —están catalogados— pero son de acceso restringido a técnicos municipales. OpenStreetMap sí los
  tiene, y usarlo tiene un precio que se ha decidido pagar: **la ODbL alcanza a las bases de datos
  derivadas**, así que el grafo nace bajo esa licencia aunque el código siga siendo Apache 2.0.
- **El transporte está resuelto y sin integrar.** El GTFS del Punto de Acceso Nacional trae bus y
  tranvía, con paradas, horarios y el trazado real de cada línea.

Los cuatro informes de reconocimiento, con sus comandos y sus números:

| Informe | Qué responde |
|---|---|
| [Reconocimiento del dataset heredado](docs/RECONOCIMIENTO-DATASET.md) | Qué había ya: 46.150 portales y ni una arista |
| [Reconocimiento de los datos de transporte](docs/RECONOCIMIENTO-003-TRANSPORTE.md) | El GTFS: qué trae y cuándo caduca |
| [Reconocimiento de las fuentes en red](docs/RECONOCIMIENTO-RED-ZARAGOZA.md) | Los servicios del Ayuntamiento: qué se puede descargar |
| [Inventario exhaustivo de fuentes](docs/INVENTARIO-FUENTES-ZARAGOZA.md) | Las 178 capas, clasificadas una a una |

## ⚠️ Los documentos de diseño son el plan en papel, no el diseño vigente

Los cuatro `docs/DISEÑO-H1-*.md` están fechados el **2 y el 3 de agosto de 2026** y el primero dice
en su tercera línea: *«Estado: propuesta para aprobar. **Nada de esto está construido.**»* Siguen
publicados como **registro histórico** —lo que se pensó antes de escribir código—, y se leen así.

⭐ Y se dice aquí porque hace falta decirlo: un auditor con el encargo delante los leyó como el
diseño vigente y publicó un hallazgo falso a partir de ellos. Lo que rige de verdad son las
decisiones de `DESPLAZAME-ESTADO.md` §5, que el código cita más de noventa veces.

## La bitácora es la mitad del proyecto

[`docs/BITACORA.md`](docs/BITACORA.md) es el registro de los fallos reales, escrito **en caliente**,
en el momento en que se descubren. Existe desde antes que el repositorio.

El campo importante de cada entrada es *"qué se probó y DIO VERDE mientras el fallo estaba vivo"* —
la prueba que pasaba mientras el problema ya existía. Es un dato perecedero: si se deja para la
retrospectiva, se pierde. Algunos ejemplos de lo que hay ahí dentro:

- Un dataset que declaraba `coveragePercent: 100` con el 29,6 % de los números de portal mal.
  Cinco contadores en verde midiendo si el servidor **respondió**, no si respondió **bien**.
- Un `.gitignore` cuyas reglas de claves privadas no protegían nada, porque el comentario al final
  de la línea formaba parte del patrón.
- Una batería que recorrió los 57 scripts que había entonces y terminó en verde **con uno
  estrellado**.
- Un centinela `99999` apagado en una copia y no en el origen: cuatro tandas de números falsos, con
  todos los invariantes en verde, porque eran invariantes de forma y no de valor.

Junto a ella está [`DESPLAZAME-ESTADO.md`](DESPLAZAME-ESTADO.md), la memoria del proyecto: qué se ha
decidido y con qué motivo, qué miente cada fuente y qué sigue abierto — incluida una tabla de lo que
se creyó y resultó falso, que no se borra.

## Cómo comprobar lo que dicen los informes

En `data/exploracion/` están las respuestas **crudas** de los servidores que sostienen las
afirmaciones más fuertes: el catálogo completo de capas, las zonas de medición de conectividad, el
contraste con OpenStreetMap y la misma calle servida en dos sistemas de coordenadas distintos.
Ésas **sí viajan** en el repositorio, una a una y con su motivo escrito en el `.gitignore`.

No está toda la exploración —son evidencia de un momento, y un repositorio guarda todas las
versiones para siempre— pero sí lo necesario para reproducir los números sin fiarse de nadie. Y lo
que se quedó fuera está **nombrado** en el `.gitignore`, con el porqué: un crudo de 35,9 MB y
tres ficheros con datos personales.

## Si trabajas en este repositorio

Instala el guardián de la bitácora (los hooks de git no viajan en un clon):

```bash
git config core.hooksPath .githooks
```

Rechaza cualquier commit `fix:` que no traiga una entrada nueva en la bitácora, y te autogenera el
esqueleto para que rellenarlo sea fácil. Las reglas de trabajo están en [`CLAUDE.md`](CLAUDE.md).

## Licencia

El **código** de este proyecto está bajo [Apache 2.0](LICENSE).

**Los datos tienen dos licencias distintas, y ya son ciertas las dos:**

- **OpenStreetMap — ODbL.** El grafo de la ciudad es una **base de datos derivada** de OSM, así que
  nace bajo [ODbL](https://opendatacommons.org/licenses/odbl/). Alcanza a lo derivado: quien
  redistribuya el grafo, o cualquier cosa calculada a partir de él que constituya base de datos,
  queda bajo la misma licencia. Atribución: *© colaboradores de OpenStreetMap.*
- **Ayuntamiento de Zaragoza — Ley 37/2007.** El callejero (portales y vías) y las capas
  municipales (jerarquía viaria, carriles bici, zonas verdes) se reutilizan bajo la
  [licencia general de reutilización](https://www.zaragoza.es/sede/portal/aviso-legal#condiciones).
  Atribución: *Origen de los datos: Ayuntamiento de Zaragoza (IDEZar).* La reutilización no implica
  que el Ayuntamiento participe, patrocine o apoye este proyecto.

## Aviso

Este proyecto **no es un producto oficial** del Ayuntamiento de Zaragoza, ni de Avanza Zaragoza, ni
de Tranvías de Zaragoza, ni de ninguna otra entidad. Es un trabajo personal que utiliza datos
publicados en abierto por esos organismos.
