# El panel de frescura, y el manifiesto que lo sostiene

> **Documento vivo.** Salió del README el 2026-09-28. Resumen y enlace en el
> [README → Las fuentes](../README.md#las-fuentes-y-qué-se-hace-con-cada-una).

---

Un dato descargado empieza a caducar el mismo día. Nada en un repositorio avisa de eso solo, así
que el proyecto lo escribe: **`datapackage.json`, en la raíz**, dice de cada conjunto cuándo se
descargó, qué fecha declara **el dato de sí mismo**, con qué regla caduca y **de dónde sale esa
regla**, más su huella `sha256`.

**El formato no se inventó, se adoptó.** Es el descriptor **Data Package v1** de
[Frictionless Data](https://specs.frictionlessdata.io/data-package/) —un JSON en la raíz del
paquete, con `resources[]` y sus `path`, `hash`, `bytes`, `licenses` y `sources`— y de
[**DCAT**](https://www.w3.org/TR/vocab-dcat-3/) toma los términos de frescura: `accrualPeriodicity`
con su vocabulario controlado y `modified`. **Valida contra el JSON Schema oficial**, sin errores.
Solo hay propiedades nuestras donde el estándar calla, y van en castellano para que se note:
`descargadoEl`, `modifiedFuente`, `periodicidadFuente`, `caducaEl`, `caducidadFuente`.

**<http://localhost:4200/panel>** lo pinta con un semáforo, y la regla del semáforo es lo que
tiene de particular:

| | cuándo | ejemplo de hoy |
|---|---|---|
| 🔴 | el conjunto declara una fecha de caducidad y ya pasó | — |
| 🟡 | se refresca cada X en origen y nuestra copia es más vieja | — |
| 🟢 | hay regla con fuente y se cumple | el GTFS: «vale hasta el 2026-10-05» |
| ⚪ | **NO CONSTA** | **33 de los 39** recursos del manifiesto |

> ⭐ **El GTFS son dos ficheros, y no son lo mismo (31/08).**
>
> - **La semilla** — `app/data/2026-08-10_nap_gtfs-ficha1176.zip`. Está en git y en el
>   manifiesto con su `sha256` verificado sobre un clon. **No se toca nunca**: es lo que hace
>   que un clon limpio arranque sin pedirle una clave a nadie.
> - **El vivo** — `app/data/nap_gtfs-ficha1176.vivo.zip`, con su registro al lado. Lo trae del
>   NAP el cron nocturno, está **ignorado por git** y **releva** a la semilla: el motor lo sirve
>   en cuanto existe y se deja leer.
>
> El motor dice al arrancar cuál de los dos está sirviendo, con su `feed_version`, la fecha que
> el NAP dio y los días que le quedan. Para que el cron funcione hace falta `NAP_API_KEY` en
> `.env.local` (local) o en el panel de Hostinger (producción), y `DESPLAZAME_REGEN_TOKEN` para
> el disparador. **Ninguna de las dos vive en el repositorio.**

⭐ **El gris no es un fallo del panel: es la verdad, y la lista de deberes.** Un color solo se
pinta si detrás hay una regla **publicada por alguien** — el `feed_end_date` del GTFS lo dice su
publicador, el refresco mensual del callejero lo dice el Ayuntamiento—. Inventar un umbral
«razonable» para que la tabla se vea bonita sería cambiar información por decoración, así que
donde no hay fuente sale gris y **se dice por qué**.

Un caso enseña bien la diferencia: **el callejero tiene regla y aun así sale gris**. Se sabe que
en origen se refresca cada mes, pero no consta cuándo se descargó esta copia —no fue una
descarga: llegó copiada del archivo del proyecto anterior—, así que no hay contra qué medirla. El
panel no adivina: lo dice.

**La portada no se entera de nada de esto.** Abrir la raíz sigue sin pedir un solo byte de datos
—ni el manifiesto, que son **59.051 bytes**—: el panel se carga aparte (`loadComponent`) y pide su
manifiesto solo cuando alguien entra en él. Medido sobre el `dist` el **14/09** con
`app/e2e/identidad.mjs` (motor en `127.0.0.1`, `main-RM24EPQM.js`): la raíz en frío son **6
peticiones propias y 611.836 B sin comprimir** —el `main` pone 507.353— más las teselas de
OpenStreetMap, y **cero** de datos o de manifiesto. ⚠️ **Aquí ponía «6 peticiones y 459 kB» y
«44 KB»**, medidos el 23/08 y escritos sin fecha: las peticiones siguen siendo seis, y los bytes
crecieron con el producto —la letra, los símbolos, la pintura del resultado—. Hay dos guardianes que lo vigilan, y
uno cuenta el total de peticiones, no un patrón — para que la próxima cosa que quiera colgarse de
la portada tampoco pueda hacerlo en silencio.

Y el manifiesto **no puede pudrirse en silencio**: una prueba recalcula el `sha256` de **los 39
recursos** en cada ejecución y los compara con lo declarado. Si un dato cambiara sin que nadie
tocara el manifiesto, se pondría roja.

⚠️ **Aquí decía «37» en tres sitios, y son 39** (`node -e "console.log(require('./datapackage.json').resources.length)"`).
El manifiesto creció y estas tres líneas no se enteraron — la misma clase de descuido que la
entrada nº5 de la bitácora, corregida con el comando delante en vez de a ojo.
