# Las guardias, y la carpeta que nadie había mirado

**Fecha:** 2026-08-02 · **Tanda 7** · Dos reconocimientos independientes.

**Parte A** · 5 peticiones al endpoint de guardias del Ayuntamiento: ¿acepta fechas futuras?
**Parte B** · Inventario de solo lectura de una carpeta que en once tandas no había entrado en
ningún reconocimiento.

---

# PARTE A · Las guardias

## A5 · El veredicto, primero

> **Es un CALENDARIO: el endpoint acepta fechas futuras, el parámetro `fecha` se respeta de verdad
> —comprobado comparando conjuntos de identificadores y la fecha interna de cada registro— y a 15
> días vista devuelve datos. Se puede hornear como el GTFS, así que NO rompe la exclusión del tiempo
> real.**

⚠️ **Pero con una corrección grave a la escena**, en §A9: *de guardia* **no** significa *abierta*.

## A1 · Línea base — hoy, primero

```
GET https://www.zaragoza.es/sede/servicio/farmacia.json?tipo=guardia&fecha=02-08-2026&rows=1000

HTTP/1.1 200 OK
Date: Sun, 02 Aug 2026 16:36:49 GMT
Content-Type: application/json;charset=UTF-8
Content-Length: 7982
Server: Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips mod_fcgid/2.3.9
```

```
totalCount 15 · start 0 · rows 500 · icon "farmaciaguardia"
len(result) = 15   ⭐ contador independiente: COINCIDE con totalCount
```

⚠️ **Pedí `rows=1000` y el servidor contesta `rows: 500`.** Hay un tope silencioso. Con 15 registros
da igual hoy, pero **un consumidor que pida un rango largo tiene que paginar** y el servidor no lo
dice más que devolviendo otro número del que se pidió.

**El objeto `guardia`, entero** (no lleva ningún dato personal):

```json
{
  "fecha":   "2026-08-02T00:00:00",
  "turno":   "T-26",
  "horario": "Abiertas de 9:15 h. a 9:15 h. del día siguiente",
  "sector":  "Sector Torrero"
}
```

**Los cuatro campos del modelo, rellenos en los 15 registros.** Coincide exactamente con la
interfaz `RawFarmaciaGuardia` que se leyó ayer en el código, sin haberla llamado.

**Campos del registro completo:** `id`, `title` ⛔, `telefonos` ⛔, `calle` ⛔, `geometry`, `type`,
`guardia`, y opcionalmente `horario`, `clasificacion`, `email` ⛔, `descripcion`.

```
geometry con coordenadas ... 14 de 15   ⚠️ una farmacia de guardia SIN coordenada
horario ordinario .......... 6 de 15    (el registro de guardia es MÁS POBRE que el del censo)
```

⭐ **Y `type` es un array**, tal como se dedujo ayer:

```json
["http://www.zaragoza.es/sede/portal/skos/vocab/FarmaciaGuardia/2026-08-02"]

longitud del array por registro:  1 → 9 registros   ·   2 → 6 registros
```

**Seis de los quince traen DOS URIs.** Es la confirmación en vivo del hallazgo nº44: el normalizador
del proyecto de origen hace `break` en la primera y habría perdido la marca en esos seis.

## A2/A3/A4 · ¿Se respeta el parámetro `fecha`?

| petición | HTTP | `totalCount` | `result` | `guardia.fecha` **dentro** |
|---|---:|---:|---|---|
| **hoy** 02-08-2026 (domingo) | 200 | **15** | sí (15) | `2026-08-02` |
| **mañana** 03-08-2026 (lunes) | 200 | **7** | sí (7) | `2026-08-03` |
| **+15 días** 17-08-2026 (lunes) | 200 | **7** | sí (7) | `2026-08-17` |
| **pasada** 02-07-2026 | 200 | **0** | ⛔ **ausente** | — |
| **inválida** 99-99-9999 | **400** | — | ausente | — |

**Dos comprobaciones independientes de que el parámetro no es decorativo:**

1. **La fecha interna coincide con la pedida** en las tres consultas con datos. Si el servidor
   ignorase el parámetro, las tres traerían `2026-08-02`.
2. **Los conjuntos de identificadores son distintos**, no solo los conteos:

```
hoy      15 ids: 8672 8714 8750 8752 8801 8821 8883 8890 8903 8906 8931 8940 8945 8949 8972
mañana    7 ids: 8684 8801 8854 8860 8879 8918 8966
+15 días  7 ids: 8699 8772 8801 8826 8828 8860 8922

hoy ∩ mañana = 1     hoy ∩ +15d = 1     mañana ∩ +15d = 2
```

3. Y una tercera que apareció sola: **el turno es un contador secuencial.**
   `T-26` (2 ago) → `T-27` (3 ago) → `T-41` (17 ago). **Catorce días, catorce turnos.** Detrás hay un
   cuadrante rotativo, no una consulta improvisada.

**A4 · No hay histórico.** El 2 de julio devuelve `totalCount: 0`. ⚠️ Eso **no** significa que ese
día no hubiera guardias —imposible—: significa que **el endpoint no sirve el pasado**. Se registra
como *indeterminado*, no como cero.

## A6 · Caché, y qué pasa con una fecha inválida

**No hay `ETag`, ni `Last-Modified`, ni `Cache-Control`** en ninguna de las cinco respuestas. Sí hay
dos `Set-Cookie` (`JSESSIONID` y `cookiesession1`), `Access-Control-Allow-Origin: *` y
`X-Robots-Tag: noindex`. **Sin validadores de caché, un consumidor no puede hacer peticiones
condicionales**: cada consulta se paga entera.

La fecha inválida devuelve `400` **con el error interno filtrado**:

```json
{"status":400, "mensaje":"could not execute query; nested exception is
 org.hibernate.exception.GenericJDBCException: could not execute query"}
```

Revela la pila de persistencia del servicio. **No es aprovechable ni se ha explorado** —una sola
prueba, sin insistir— pero conviene no citar ese mensaje como si fuera una respuesta de negocio: es
una excepción que se ha escapado hasta el cliente.

## A7 · Licencia

La respuesta **no declara ninguna licencia** ni cabecera legal. La documentación del proyecto de
origen registra para la sede: *"Licencia general de reutilización del Ayuntamiento de Zaragoza,
alineada con Ley 37/2007. **No es CC BY 4.0. No es SPDX**"*, atribución *"Origen de los datos:
Ayuntamiento de Zaragoza"*. ⚠️ **004 tendría que declararla por su cuenta**; de este endpoint no
se puede deducir.

## A8 · Los cuatro casos, y su comportamiento

**El modo de fallo peligroso no es el error: es el `200` con cuerpo sin `result`.**

| caso | cómo se reconoce | qué hace 004 |
|---|---|---|
| **hay guardias** | `200` + `result` array **no vacío** | muestra las que cubren la hora actual |
| ⛔ **cero guardias** | `200` + `result` ausente **o** array vacío | **NUNCA decir "no hay". Es imposible.** Tratar como fallo |
| **no he podido preguntar** | timeout, error de red, `5xx` | el filtro de guardias **desaparece** |
| **fecha inválida** | `400` + `status` en el cuerpo | error del programa, no del usuario. Registrar y degradar |

**La frase de cada uno importa tanto como el comportamiento:**

```
hay guardias  ->  "Farmacia X, abierta hasta las 9:15 de mañana. A 1,2 km."
cero          ->  "No he podido comprobar las guardias de esta noche."   ⬅ NO "no hay guardias"
no pregunté   ->  lo mismo, y sin enseñar el filtro
inválida      ->  lo mismo de cara al usuario; el error se registra por dentro
```

⭐ La degradación se copia como **decisión** del proyecto de origen —la ley del trasplante lo
permite—: **si la consulta falla, el filtro GUARDIA no aparece.** No dice *"no hay"*: deja de
ofrecer la afirmación.

## A9 · ⚠️⚠️ La corrección grave a la escena

**Hoy hay 15 farmacias de guardia. Solo 8 están abiertas a las 03:40.**

```
turno T-26  x8  "Abiertas de 9:15 h. a 9:15 h. del día siguiente"           ✅ 24 h
turno 25-B  x7  "Abiertas de 9:15 h. a 13:45 h. y de 17:00 h. a 21:30 h."   ⛔ cerrada de madrugada
```

Las siete del turno `25-B` son **refuerzo de horario partido**: figuran como guardia del día porque
cubren la tarde, y a las tres de la mañana están cerradas. **Un filtro por `tipo=guardia` acierta el
53 % de las veces a esa hora.**

⇒ **La escena no puede filtrar por "está de guardia": tiene que filtrar por "su horario cubre la
hora actual"**, y eso obliga a interpretar el texto libre de `guardia.horario`. Hoy hay solo **dos
redacciones distintas** y son distinguibles por la frase *"del día siguiente"*, pero **es texto
libre y puede cambiar sin aviso**. Si no se entiende: **la app se calla**.

---

# PARTE B · `E:\PROYECTOS WEB\00 ZGZ RADAR`

## B1/B2 · Qué es

**Existe.** Proyecto **Next.js anterior** (abril–mayo de 2026), con repositorio git propio y remoto
declarado `github.com/ablanquez/ZGZ-Radar-Estable.git`; último commit *"feat: integra farmacias en
salud"*. Tiene `AGENTS.md` (115 KB) y `CLAUDE.md` (122 KB), `docs/`, `services/`, `scripts/` de base
de datos, y `data/` con la misma estructura de cinco carpetas que el proyecto posterior.

**Es la versión ANTERIOR de `01 ZGZ RADAR REACT`**, no otra cosa: mismo dominio, misma arquitectura
`sources/generated/cache/snapshots/debug`, mismos módulos (farmacias, callejero), y el proyecto
posterior arranca donde éste lo deja.

## B3/B5 · Qué hay que 004 no tenga

Todo `data/` cabe en 15 ficheros. Los que importan:

| fichero | registros | qué trae |
|---|---:|---|
| ⭐ `sources/movilidad/bus/avanza-zaragoza/paradas-avanza-zaragoza.json` | **939** | `poste`, `title`, `modo`, `operador`, **`lat`**, **`lon`**, `googleMaps`, **`lineas[]`** |
| ⭐ `…/lineas-avanza-zaragoza.json` | **46 líneas** | `apiId`, `nombre`, `tipo` (diurna/…), `color`, **`sentido1[]` y `sentido2[]` = secuencia ORDENADA de postes**, `variaciones`, `paradasAnuladas`; y un bloque `incidencias` |
| `…/autobuses-avanza-zaragoza.json` | 369 | parque móvil: fabricante, modelo, longitud, año, combustible |
| `generated/…/farmacias-zaragoza.json` | 314 | censo del **7 de mayo** (el otro proyecto tiene el del 12) |
| `generated/…/callejero/*` | 3.359 vías / 46.150 portales | **los mismos que ya se conocen** |

⚠️ **Los tres ficheros de Avanza llevan BOM UTF-8**, a diferencia del resto del proyecto: `json.load`
con `utf-8-sig` o revientan. Es señal de que se generaron con otra herramienta.

### ⭐⭐ Y esto toca una decisión deshecha del estado

El documento de estado registra en §6:

> *"Tenemos lat-lon de todas las paradas de autobús"* — ⚠️ **Falso, y era de Antonio, de memoria.**
> No estaban en el dataset heredado: estaban en el GTFS que procesa 003.

**Antonio tenía razón, y la corrección también: son dos carpetas distintas.** Las paradas con
lat-lon **no** están en `01 ZGZ RADAR REACT` —donde se hizo el reconocimiento 0.A— y **sí** están
aquí, en `00 ZGZ RADAR`, que nadie había abierto. La frase del estado es correcta si *"dataset
heredado"* significa la carpeta que se inventarió; es incompleta si significa *todo lo que hay en
`E:\PROYECTOS WEB`*.

⚠️ **No lo corrijo yo.** Se reporta: el estado tiene un solo escritor.

## B4 · ⭐ ¿Hay geometría de calles? **No**, y con sus controles

Búsqueda **por contenido** en los tres ficheros candidatos:

```
                                   LineString  MultiLineString  Polygon  coordinates  geometry  shape
lineas-avanza-zaragoza.json             0            0             0          0          0        0
paradas-avanza-zaragoza.json            0            0             0          0          0        0
vias-zaragoza.json                      0            0             0          0          0        0

⭐ POSITIVO DE CONTROL (la búsqueda funciona):  lat 940 · poste 939 · avanza 940
⭐ CONTROL NEGATIVO:                            ZURRIBURRI 0
```

Y `vias-zaragoza.json` de esta carpeta tiene los mismos **ocho campos de nombres y ni una
coordenada** que el del otro proyecto: `id`, `codigoVia`, `nombrePublico`, `nombrePublicoNorm`,
`tipoVia`, `numPortales`, `barrioRural`. **Confirma la decisión deshecha nº2 del estado, no la
contradice.**

⇒ **D0 no se toca. No había geometría de calles escondida.**

## ⭐ Un control cruzado que cae de regalo

El censo de farmacias de esta carpeta es del **7 de mayo** (jueves) y trae **7** marcas
`FarmaciaGuardia/2026-05-07`. El del otro proyecto, del **12 de mayo** (martes), trae **2**. Y el
endpoint dice hoy que un día laborable tiene exactamente **7** (lunes 3 de agosto: 7; lunes 17: 7).

**Evidencia convergente de que el fichero del 12 de mayo perdió marcas** por el `break` del
normalizador. ⚠️ **No es demostración**: no se puede descartar que ese martes hubiera realmente
menos, y el crudo no se persistió. Pero tres fuentes independientes apuntan a 7 en día laborable.

## B6 · Sensibilidad

⛔ **No se transcribe ningún valor.** `.env.local` define **10 variables**: clave de AEMET, cinco de
conexión a una base de datos MySQL/MariaDB alojada, contraseña y secreto de sesión de una zona
interna, y un secreto de cron. **Está correctamente ignorado por el git de esa carpeta**
(`git check-ignore -q .env.local` → ignorado ✅).

Y los datos: el censo de farmacias lleva nombres de titular, teléfonos y correos, igual que el otro.
Los 939 registros de paradas **no llevan ningún dato personal**.

## B7 · ⭐ Veredicto

> **Sí aporta, pero como VERIFICADOR, no como fuente: 939 paradas con lat-lon y 46 líneas con la
> secuencia ordenada de postes por sentido son exactamente lo que H2 necesita — y el GTFS del NAP,
> que es la fuente ya decidida, trae lo mismo. El valor real es tener un segundo par de ojos
> independiente sobre el GTFS. No hay geometría de calles, así que D0 no se toca.**

⚠️ **Y una condición que hay que resolver antes de tocarlos:** **no se ha verificado la licencia ni
la procedencia** de esos tres ficheros. Su propia documentación los llama *"JSON maestros ubicados"*
y **no hay ningún script que los descargue** — solo lectores. Vienen de la API de Avanza por una vía
que no consta. Este portfolio ya se llevó un susto igual en 003 con una capa de nombres que resultó
ser *"la salida de 74 peticiones de raspado con compromiso escrito de no redistribuir"*. **Hasta
saberlo, ni se copian ni se publican.**

**Con esto el cabo queda cerrado:** la carpeta se ha mirado, y lo que hay está enumerado arriba.

---

## Qué no se ha mirado, y por qué

- **Hasta dónde llega el horizonte de fechas.** Se comprobó +15 días. **No se ha buscado el límite**:
  serían más peticiones, y el briefing daba cinco. `NO CONSTA` si acepta 3 meses o 3 años.
- **Si `rows` pagina de verdad** por encima de 500. Con 15 registros no se puede probar.
- **Cuántas redacciones distintas tiene `guardia.horario` a lo largo del año.** Hoy hay dos. **Es
  texto libre y no hay garantía de que sean las únicas.**
- **La licencia real de los ficheros de Avanza** (§B7). Exige revisar el repositorio de aquel
  proyecto entero, y no es esta tanda.
- **`AGENTS.md` y `CLAUDE.md` de `00 ZGZ RADAR`** (237 KB entre los dos): no se han leído.
- **El resto de `services/` de esa carpeta.** Se listó, no se abrió.

## Trazas

| qué | dónde | publicado |
|---|---|---|
| respuesta de hoy (15 guardias) | `data/exploracion/2026-08-02_sede-zaragoza_farmacia-guardia_fecha-02-08-2026.json` | ⛔ **NO** — nombres de titular y teléfonos |
| respuestas 03-08 y 17-08 | idem, `_fecha-03-08-2026` / `_fecha-17-08-2026` | ⛔ **NO** — mismo motivo |
| ⭐ respuesta vacía (62 B) | `…_fecha-02-07-2026_VACIA-sin-result.json` | ✅ **sí** |
| ⭐ fecha inválida (142 B) | `…_fecha-invalida_HTTP400.json` | ✅ **sí** |
| cabeceras de hoy | `…_cabeceras-hoy.txt` | ⛔ **NO** — lleva `Set-Cookie` de sesión |

⚠️ **Es la segunda vez en este proyecto que la evidencia de una afirmación fuerte no se publica.** La
primera fue por peso (34 MB de geometría OSM); **ésta es por dato personal**, y a diferencia de
aquella **no se puede resolver comprimiendo**: habría que editar el crudo, y *editar la evidencia la
destruye* (ley 11). Lo que sí se publica es el agregado sin dato personal —turnos, sectores,
horarios y conteos—, que es lo que sostiene cada afirmación de este documento. Está **declarado en
`.gitignore`** con su motivo, y probado con `git check-ignore -q` y `git add -n`.

**5 peticiones de 5 autorizadas. Ninguna a ningún otro servicio.**
⛔ **Nada de `E:\` se ha modificado, copiado ni importado.**
