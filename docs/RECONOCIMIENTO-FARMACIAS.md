# Reconocimiento del conjunto de farmacias

**Fecha:** 2026-08-02 · **Tanda 6** · Documento de reconocimiento.

El reconocimiento 0.A inventarió 314 farmacias con 26 campos y **no mencionó horarios ni guardias en
ningún sitio**. También declaró tres huecos propios: no leyó los 34 documentos del proyecto de
origen, ni la lógica de sus 36 servicios, ni el fichero grande entero. Esta tanda abre el conjunto
de farmacias de verdad, **campo a campo**, y lee el código que lo produce.

**Cero peticiones de red. Cero copias.** El conjunto se lee donde está y no se importa nada.

> ⚠️ **La escena que motiva esto** —*"son las 03:40, la farmacia de guardia más cercana está a
> 1,2 km"*— tiene una propiedad que ninguna otra del proyecto tiene: **si el dato está mal, alguien
> conduce de madrugada hasta una puerta cerrada.** Un calendario de guardias caducado no está
> desactualizado: **está equivocado**, porque las guardias rotan.

---

## 1 · El veredicto, primero

> **F1 · Sí se puede construir, pero NO con este fichero: las guardias existen y son consultables
> por fecha en el endpoint del Ayuntamiento (`tipo=guardia&fecha=DD-MM-YYYY`), no en el dato
> descargado; y el horario ordinario NO se puede prometer, porque solo 67 de 314 farmacias dicen
> algo de sus horas entre semana y en texto libre con HTML dentro.**

Es decir: **las guardias no son un dato que se copie. Son una consulta en vivo.** Justo lo contrario
de lo que 004 hace con todo lo demás.

---

## 2 · A) El conjunto, abierto

```
ruta      E:\…\01 ZGZ RADAR REACT\data\generated\servicios\farmacias\ayuntamiento-zaragoza\
ficheros  farmacias-zaragoza.json (219.330 B) · farmacias-zaragoza.metadata.json (496 B)
registros 314   (contador independiente sobre el JSON: 314 ✅ coincide con totalRaw y totalNormalized)
fecha     generatedAt = 2026-05-12T13:32:30.067Z    ⇒ 82 días
política  refreshPolicy = "semanal"                 ⇒ ~11 refrescos vencidos
version   "0.1"
```

**A3 · No hay más ficheros de farmacias**: el conjunto es un único array y su metadata. No hay crudo
persistido — el pipeline descarga y escribe el normalizado directamente, sin guardar la respuesta
original.

### A2 · Los 26 campos, uno a uno

⛔ De los campos personales solo se da el **recuento**. Ningún valor se transcribe.

| campo | tipo | no vacío | distintos | qué trae de verdad |
|---|---|---:|---:|---|
| `id` | str | 314 | 314 | identificador, copia de `sourceId` |
| `source` | str | 314 | 1 | `"ayuntamiento-zaragoza"` en las 314 |
| `sourceId` | int | 314 | 314 | id numérico de la sede — **clave de cruce con el endpoint de guardias** |
| `name` | str | 314 | 313 | ⛔ personal. **Dos farmacias comparten nombre exacto** |
| `addressLabel` | str | 313 | 314 | ⛔ dirección del establecimiento. 1 vacía |
| `type` | str | **190** | 3 | ⭐ **URI SKOS. Aquí está la única señal de guardia** (§4) |
| `clasificacion` | str | 188 | 2 | `"HorarioAmpliado"` ×188, `null` ×126 |
| `servicios` | list | **0** | 1 | ⛔ **`[]` en las 314. Campo completamente vacío** |
| `lat` | float | 311 | 312 | 3 sin coordenada |
| `lon` | float | 311 | 311 | idem |
| `hasCoordinates` | bool | 314 | 2 | `true` ×311 / `false` ×3 |
| `coordinatesSource` | str | 314 | 2 | `"official"` ×311 / `"missing"` ×3 |
| `coordinatesConfidence` | str | 314 | 2 | `"exact"` ×311 / `"none"` ×3 |
| `coordinatesLocked` | bool | 314 | **1** | `false` en las 314 — inerte |
| `phones` | list | 311 | 311 | ⛔ personal (contacto profesional) |
| `email` | str | **31** | 32 | ⛔ personal. Solo el 9,9 % |
| `description` | str | 44 | 18 | 26 son *"Red de Comercios Amigables"*. ⚠️ **11 contienen nombre de persona física** |
| `url` | str | **4** | 5 | ⛔ 4 de 314. Ruido, no dato |
| `hasExtendedHours` | bool | 314 | 2 | `true` ×188 / `false` ×126 |
| `extendedHoursText` | str | 188 | **16** | ⭐ el "horario". **No es un horario** (§3) |
| `scheduleSource` | str | 314 | 2 | `"official"` ×188 / `"missing"` ×126 |
| `scheduleLocked` | bool | 314 | **1** | `false` en las 314 — inerte |
| `isPublicVisible` | bool | 314 | 2 | `true` ×311 / `false` ×3 |
| `hiddenReason` | str | 3 | 2 | `"missing_coordinates"` ×3 |
| `qualityFlags` | list | 126 | 4 | `[]` ×188, `["missing_schedule"]` ×123, +3 con varias |
| `rawUpdatedAt` | — | **0** | 1 | ⛔ **`null` en las 314** |

**Tres campos están muertos:** `servicios` (vacío en el 100 %), `rawUpdatedAt` (`null` en el 100 %) y
los dos `*Locked` (`false` en el 100 %, mecanismo de bloqueo manual nunca usado).

⚠️ **`rawUpdatedAt` a `null` en las 314 importa más de lo que parece:** es el campo que diría cuándo
cambió el dato **en origen**. Sin él, lo único que se sabe es cuándo se descargó (12 de mayo), no
cuándo se actualizó la sede. **No hay forma de distinguir un censo fresco de uno congelado hace
años.**

---

## 3 · B) El horario ordinario — **es una nota, no un horario**

**B1.** El campo es `extendedHoursText`. **B2.** Formato: **texto libre**, `string` en los 188 casos.
Ninguna estructura, ningún día/rango calculable. **47 de 188 llevan etiquetas HTML** (`<p>`, `<ul>`,
`<li>`), 1 lleva entidades (`&nbsp;`, `&iacute;`).

**B3 · 16 redacciones distintas.** Las cinco primeras, reales y enteras:

```
x93  Sábados horario de mañanas de 9:30 a 13:30 h. (Junio,julio y agosto: 9:15 a 13:45 h.)
x31  Lunes a Sábado excepto festivos de 9:30 a 22:00 h
x28  <p>Sábados horario de mañanas de 9:30 a 13:30 h. (Junio,julio y agosto: 9:15 a 13:45 h.)</p>
x8   <p>Lunes a Sábado excepto festivos de 9:30 a 22:00 h</p>
x7   Lunes a Domingo de 9:30 a 22:00 h
```

Y las de la cola, que son las que enseñan el problema:

```
x1   TODOS LOS DIAS HASTA 21:30 H CIERRE MEDIO DIA (de 9:30 a 13:30 y de 16:30 a 21:30 h.(junio, julio, agosto de 9:15 a 13:45 y de 17:00 a 21:30 h.)
x1   9:30-13:30 y 16:30-20 h de lunes a viernes , excepto junio, julio y agosto que es 9:15-13:45 y 17-20 h.
x1   <p>Horario desde el día 1 de Septiembre hasta el 1 de Junio</p> <ul> <li>De lunes a viernes de 9:30&nbsp;a 13:30&nbsp;y de 16:30 a 20:00 horas.</li> …
```

### ⭐⭐ Y lo que de verdad contiene el campo, clasificado

```
A. dice algo de ENTRE SEMANA ......................  67  (21,3 %)
B. SOLO habla del sábado (no dice el horario base)  121  (38,5 %)
C. sin nada .......................................  126  (40,1 %)
                                                    ────
                                                    314  ✅ suma exacta
```

**El valor más repetido —121 de 188— solo dice qué pasa los sábados.** El horario de lunes a viernes
de esas 121 farmacias **no está en el fichero ni en ninguna otra parte del conjunto**.

⚠️ **El nombre del campo era honesto**: `extendedHoursText` es *texto de horas extendidas*, no
*horario*. Describe exactamente lo que trae. El error habría sido leer la lista de campos y traducir
"campo de horas" por "horario".

**B4 · Festivos, sábados, agosto:** se mencionan en prosa —`festivo` 53 veces, `sábado` 175,
`domingo` 11— siempre dentro del texto libre. **No hay ningún campo de calendario, ni de festivos,
ni de temporada.** Un motor tendría que interpretar castellano con paréntesis anidados.

---

## 4 · C) ⭐⭐ Las guardias — **hay dato, y no es lo que parecía**

### C1 · La búsqueda, con sus dos controles

Búsqueda **por contenido** sobre los 218.616 bytes del fichero, no por nombre de campo:

```
guardia     ->   2      urgencia    ->   0      24h        ->   0      nocturn ->  0
permanente  ->   0      turno       ->   0      continuad  ->   0      noche   ->  0
festivo     ->  53      sábado      -> 175      domingo    ->  14      24 h    ->  2
```

```
⭐ POSITIVO DE CONTROL (tiene que dar >0):  Zaragoza 506 · farmacia 528 · lat 314 · "9:30" 188
⭐ CONTROL NEGATIVO   (tiene que dar  0):  ZURRIBURRI 0 · defibrilador_inexistente_xyz 0
```

Las **2** únicas coincidencias de `guardia` caen en el campo `type`, y en ningún otro:

```
2 x  http://www.zaragoza.es/sede/portal/skos/vocab/FarmaciaGuardia/2026-05-12
```

### C2 · Ni calendario ni marca fija: **una foto de un día**

**La fecha va dentro de la URI.** No es *"esta farmacia hace guardias"* (marca fija, que no diría
cuándo) ni un calendario con rango. Es **el estado de guardia del 12 de mayo de 2026**, el día en que
se descargó el censo, capturado de rebote porque la consulta `tipo=all` ya lo devuelve.

**C3 · Rango cubierto: un solo día, y caducado hace 82.** Inservible por completo para la escena.

### ⛔ Y el número 2 es un SUELO, no un total

El normalizador del proyecto de origen, en `normalizeType`, colapsa el array de URIs a una sola:

```ts
// type viene como Array<string> con URI SKOS; el normalizador lo absorbe
for (const v of raw) { if (typeof v === "string" && v.trim() !== "") { candidate = v; break; } }
```

Una farmacia clasificada a la vez como `FarmaciaHorarioAmpliado` **y** `FarmaciaGuardia/2026-05-12`
**conserva solo la primera**. Las 2 que sobreviven son las que no tenían ninguna otra clasificación.

⇒ **`NO CONSTA` cuántas farmacias estaban de guardia el 12 de mayo. Fueron 2 o más**, y las 188 con
horario ampliado son candidatas a haber perdido la marca. No se puede acotar sin volver a pedir el
crudo, y esta tanda tiene la red prohibida.

⚠️ Detalle que lo remata: esas **dos farmacias de guardia llevan `qualityFlags: ["missing_schedule"]`**.
Los dos únicos registros que traían la información más valiosa del fichero están marcados como
incompletos.

### C4 · ⭐⭐ Pero SÍ existe la fuente, y está en el código

`get-farmacias-guardia-today.ts` del proyecto de origen documenta y usa este endpoint:

```
https://www.zaragoza.es/sede/servicio/farmacia.json?tipo=guardia&fecha=DD-MM-YYYY&rows=1000
```

⛔ **No se ha llamado.** Lo que sigue sale de leer el código y los tipos, no de una respuesta.

Y el modelo de la respuesta está tipado en `types.ts` del proyecto de origen:

```ts
export interface RawFarmaciaGuardia {
  fecha?:   string;
  turno?:   string;     // ⬅ hay turnos
  horario?: string;
  sector?:  string;     // ⬅ hay sectores
}
```

**Cuatro campos: fecha, turno, horario y sector.** Es un modelo de guardia completo, no una marca.

⚠️ **Y el pipeline lo valida y lo tira:** `isRawFarmacia` acepta y comprueba `guardia`, pero
`normalize-farmacia.ts` **no lo menciona ni una vez** (`grep -c guardia` → **0**) y `toSerialized` no
lo incluye. Se verifica un dato que después se descarta.

**Lo que NO se sabe y no se puede saber sin red:** si el parámetro `fecha` acepta **fechas futuras**
—que es lo que convertiría la consulta en un calendario— o solo el día en curso. El código solo pide
hoy. **`NO CONSTA`.**

---

## 5 · D) Procedencia

**D1 · Origen exacto**, leído del metadata y del sync:

```
censo    https://www.zaragoza.es/sede/servicio/farmacia.json?tipo=all&rows=1000
guardias https://www.zaragoza.es/sede/servicio/farmacia.json?tipo=guardia&fecha=DD-MM-YYYY&rows=1000
```

**D2 · El pipeline**, con sus fail-safes leídos en `sync-farmacias-zaragoza.ts`:

- Manual (`npm run farmacias:sync`), **no hay cron**. `refreshPolicy: "semanal"` es una **declaración
  de intenciones, no un mecanismo**: nada la ejecuta.
- Aborta sin escribir si normaliza 0 registros o menos de 100 (`MIN_NORMALIZED`).
- Avisa si hay más de 50 no publicables o si rechaza registros por forma.
- ⚠️ **No persiste el crudo.** Si la fuente cambia de forma, no queda con qué comparar.

Y la consulta de guardias, en `get-farmacias-guardia-today.ts`, está bien hecha:
`cache: "no-store"`, `AbortController` con **timeout de 5 s**, y **nunca lanza**: devuelve
`{ map: vacío, failed: true }`.

**D3 · ¿El origen publica horarios y guardias?** Publica **las dos cosas, por vías distintas**: el
horario (parcial, texto libre) dentro del censo, y las guardias **solo bajo consulta por fecha**.
*Inferencia, marcada como tal:* que el censo `tipo=all` devuelva la marca de guardia del día sugiere
que el endpoint construye la respuesta contra el calendario del día — pero **no está comprobado**.

**D4 · Licencia.** El metadata de farmacias **no declara ninguna**: no tiene campos de licencia,
atribución ni aviso legal — a diferencia del conjunto de callejero del mismo proyecto, que sí los
lleva. La documentación del proyecto de origen declara para la sede: *"Licencia general de
reutilización del Ayuntamiento de Zaragoza, alineada con Ley 37/2007. **No es CC BY 4.0. No es
SPDX**"*, con atribución *"Origen de los datos: Ayuntamiento de Zaragoza"*. ⚠️ **004 tendría que
declararla por su cuenta**, y para farmacias no puede copiarla de este metadata porque no está.

---

## 6 · E) Datos personales — recuento, sin valores

**E1 · El recuento del 0.A, revisado:**

| | 0.A dijo | medido hoy | campo |
|---|---:|---:|---|
| nombres de persona física | 267 | ⚠️ **no reproducible** sin transcribir | `name` |
| teléfonos | 311 | **311** ✅ | `phones` |
| correos | 31 | **31** ✅ | `email` |

⚠️ **Y un campo que el 0.A no inventarió:** **11 registros de `description` contienen nombre de
persona física** (titulares), en prosa dentro del texto de descripción. No es un campo pensado para
eso, así que no aparecería en ningún filtro que mirase `name`.

*(La cifra de 267 no se ha reproducido porque distinguir "nombre de persona" de "nombre comercial"
exige leer los 314 valores, y transcribirlos —aunque fuera para contarlos— está prohibido en esta
tanda. `NO CONSTA` con motivo: se puede saber, pero no aquí.)*

**E2 · ⭐ El subconjunto mínimo que 004 necesita:**

```
sourceId   ← clave de cruce con el endpoint de guardias. IMPRESCINDIBLE
name       ← para enseñarlo en el resultado ("Farmacia X")
lat, lon   ← el nodo del grafo
```

**Tres campos y medio. Nada más.** Fuera quedan teléfono, correo, descripción, URL y las banderas de
calidad del otro proyecto. ⚠️ `name` es inevitable —hay que decirle al usuario adónde va— y en 267
casos es el nombre del titular: **004 lo enseña, no lo indexa ni lo republica como listado.**

---

## 7 · F) La escena, ¿se puede construir?

**F1** — respondido en §1.

### F2 · Qué se puede prometer y qué no

| Se PUEDE decir | ⛔ NO se puede decir |
|---|---|
| *"la farmacia más cercana está a 1,2 km"* | *"está abierta ahora"* — el horario ordinario **no existe** para el 78,7 % |
| *"está de guardia esta noche"* **si y solo si** se consulta el endpoint en vivo y responde | *"está de guardia"* a partir de este fichero: son 2 farmacias del **12 de mayo** |
| *"los sábados por la mañana abre de 9:30 a 13:30"* (para 121 de ellas) | *"no hay ninguna farmacia de guardia"* — eso es **imposible** en la realidad y sería el fallo peligroso |
| *"no sabemos su horario"* (para 126) | interpretar el texto libre y presentarlo como dato calculado |

**Las dos afirmaciones son distintas y la segunda es la peligrosa.** *"Abierta según su horario
habitual"* es una promesa floja que aquí ni siquiera se puede hacer. *"Está de guardia esta noche"*
es una promesa fuerte que solo vale con el dato del día.

### F3 · Qué haría falta para la escena entera

```
fuente       endpoint de la sede, tipo=guardia&fecha=DD-MM-YYYY   (única conocida)
formato      JSON, result[] con guardia{fecha,turno,horario,sector} — tipado, no verificado
frecuencia   EN VIVO, por petición. No se descarga: se consulta
caché        minutos, nunca horas — y jamás servir la de ayer
alternativa  el calendario lo publica el Colegio Oficial de Farmacéuticos de Zaragoza
             (hipótesis del briefing, NO comprobada: sería otra fuente y otra licencia)
```

⚠️ **Y esto choca con la arquitectura de 004**, que hasta ahora descarga todo y calcula en local.
Las guardias serían **la primera dependencia en vivo del proyecto** — precisamente lo que se dejó
fuera del alcance al excluir el tiempo real. **Decisión de Antonio, no mía.**

### F4 · ⚠️ El riesgo, por escrito

**Si el dato de guardias se sirve caducado, alguien conduce de madrugada a una puerta cerrada.**

Modos de fallo, ordenados por peligro:

1. ⛔ **El peor: el endpoint responde `200` con lista vacía.** No es un error, así que ningún
   `failed` se activa, y la app diría **"0 farmacias de guardia"**. Eso es **imposible en la
   realidad** —siempre hay guardia— y es indistinguible de una noche sin servicio. **Hay que tratar
   el cero como fallo, no como respuesta.**
2. **Caché servida de un día anterior.** Las guardias rotan: el dato de ayer no está viejo, **está
   equivocado**.
3. **Timeout o error.** Es el caso benigno **si se degrada bien**.

**Cómo tiene que degradar**, y aquí el proyecto de origen ya lo resolvió bien y conviene copiar la
**decisión** (que la ley del trasplante permite) y no el código:

```
si la consulta falla  ->  el filtro GUARDIA DESAPARECE de la interfaz
                          la app no dice "no hay guardias": deja de ofrecer la afirmación
```

⭐ Es *"cuando no lo sé, lo digo"* llevado un paso más allá: **cuando no lo sé, ni siquiera enseño el
botón.** Y para la escena de las 03:40 la degradación honesta es: *"no he podido comprobar las
guardias de esta noche — llama al 112 o consulta el Colegio de Farmacéuticos"*, **nunca** una lista
de farmacias cercanas sin decir si están abiertas.

---

## 8 · G) Qué no se ha mirado, y por qué

- ⛔ **Si el endpoint acepta fechas futuras.** Es la pregunta que decide si hay calendario o solo
  "hoy". **Exige red, prohibida en esta tanda.** Cabo abierto y declarado.
- ⛔ **Cuántas farmacias estaban realmente de guardia el 12 de mayo.** El normalizador borró la
  información y el crudo no se persistió. `NO CONSTA`, y **no es recuperable** ni con red: aquel día
  ya pasó.
- ⛔ **El calendario del Colegio Oficial de Farmacéuticos.** Hipótesis del briefing, **no
  comprobada**: sería otra fuente, otra licencia y otra tanda.
- **Los 267 nombres de persona física** no se han reproducido: exige transcribir, prohibido aquí.
- **Los otros 33 documentos** del proyecto de origen. Solo se ha leído lo que toca farmacias, por
  alcance. Los tres huecos del 0.A siguen abiertos para lo demás.
- **`FarmaciasExplorer.tsx` entero** (más de 350 líneas): se ha leído la degradación y los filtros,
  no la lógica de búsqueda ni el mapa.
- **Si el censo tiene farmacias que ya cerraron.** Con `rawUpdatedAt` a `null` en las 314 **no hay
  forma de saberlo desde el fichero**.

---

## 9 · Trazas

Todo por **lectura directa**, sin red, sin copiar nada:

| qué | dónde |
|---|---|
| conjunto | `…\ZGZ RADAR REACT\data\generated\servicios\farmacias\ayuntamiento-zaragoza\farmacias-zaragoza.json` |
| metadata | `…\farmacias-zaragoza.metadata.json` |
| pipeline | `src/services/sync/servicios/farmacias/ayuntamiento-zaragoza/` — `sync-`, `normalize-`, `validate-raw-`, `types.ts` |
| consulta guardias | `src/services/queries/servicios/farmacias/ayuntamiento-zaragoza/get-farmacias-guardia-today.ts` |
| degradación UI | `src/app/salud/farmacias/page.tsx`, `_components/FarmaciasExplorer.tsx`, `farmaciaVisualState.ts` |
| licencia | `docs/roadmap/00_ROADMAP_ACTIVO_POST_HITO_0044_…md` |

⛔ **Ningún fichero de aquel proyecto se ha modificado, copiado ni importado.**
⛔ **Ningún endpoint se ha llamado.**
