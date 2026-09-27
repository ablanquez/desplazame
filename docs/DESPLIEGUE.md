# DESPLIEGUE — cómo llega Desplázame a producción

> **Qué es:** el paso del repositorio al sitio vivo, escrito. Nace del hallazgo **E-3** de la
> auditoría de cierre (`docs/auditoriafinal/E-OPERACION.md` §5), que midió que **el repositorio
> entero decía dos líneas del despliegue**: `README.md:21-22` y `README.md:704`.
>
> **Nace el:** 2026-09-25 · **Al día con lo medido por SSH el 26/09** (sesión de Antonio en el
> servidor, más la pantalla de Despliegues del panel) · **Producción:**
> <https://desplazame.antonioblanquez.es> (Hostinger, plan Node, servido desde `de-fra-web2061`
> — `README.md:21-22`).
>
> ⚠️ **ESTE DOCUMENTO ES VIVO Y SE ACTUALIZA** —no es un registro fechado—, pero con la misma
> ley de siempre: **solo con evidencia**. Lo que se afirma aquí está verificado contra el
> repositorio, contra la máquina o contra la sesión SSH del 26/09, y lleva su fichero:línea, su
> comando o su línea de log al lado. Lo que sigue sin poder saberse sigue marcado **`NO CONSTA`**
> con la instrucción exacta de qué mirar (§7). **Nada se rellena con lo probable.**
>
> **Lo que cambió el 26/09:** de los cinco `NO CONSTA`, **uno se cierra** (7.3, y en la dirección
> buena), **tres quedan a medias** con su parte observable escrita (7.1, 7.2 y 7.5) y **uno sigue
> entero** (7.4). Y salió un hallazgo nuevo que no estaba en ninguna lista: **el webhook no
> disparó** (§1).
>
> 🔒 **Aquí no hay ningún secreto.** De las claves se dicen sus **nombres** y para qué sirven;
> nunca un valor, ni un fragmento, ni su longitud.

---

## 1 · El disparador: **el `git push` DEBERÍA SER el despliegue** — y el 26/09 no lo fue

> *«auto-deploy por cron desde `main`: cada push redespliega»* — `README.md:21-22`.

Eso es lo que el README declara y lo que el panel promete. **La primera vez que se comprobó de
verdad, no se cumplió** — el aviso con su evidencia va unos párrafos más abajo, y cambia el orden
de trabajo del §8.

**Y el repositorio no lo configura.** Medido el 25/09: **cero ficheros de despliegue rastreados**
—ni `.github/workflows/`, ni `Dockerfile`, ni `Procfile`, ni `.htaccess`, ni un `.yml` de CI—:

```bash
git ls-files | grep -Ei "\.ya?ml$|htaccess|Dockerfile|Procfile"   # → vacío
```

**Ese es el dato de fondo de este documento**: el despliegue vive **entero fuera del control de
versiones** —en el panel y en el servidor—, y por eso §7 nació con cinco `NO CONSTA` que ningún
`grep` podía cerrar; los cerró, en parte, una sesión SSH.

⚠️ Ojo al matiz del `.htaccess`: **no hay ninguno en el repositorio**, que es lo que el comando de
arriba mide. En el servidor **sí lo hay**, y es quien gobierna el arranque entero — está leído
verbatim en **§4**.

⚠️ **Consecuencia práctica, y sí es verificable:** cualquier commit que llegue a `main` —incluido
uno a medias— sale a producción sin revisión intermedia. De ahí las dos leyes de la casa que
sostienen el resto: **el guardián de build** (§3) y **el `dist` versionado** (§2).

### ⚠️ 26/09 · EL WEBHOOK NO DISPARÓ, Y HASTA SABER POR QUÉ EL PUSH NO BASTA

**Medido por SSH y en el panel el 26/09.** Se empujó el lote entero a `main` (`8aa418a`) y
**no pasó nada**:

- La pantalla de **Despliegues** del panel seguía dando por **«Actual»** el despliegue de
  `78821ff`, del **2026-09-24 13:12** — dos días atrás.
- Y en el servidor, a las **18:39 UTC**, `hbuilds/current` seguía apuntando al build del
  **24/09 a las 11:13**.

El despliegue solo ocurrió **al pulsar «Redistribuir» a mano**, y entonces completó bien: el log
del build nuevo trae el arranque del motor a las **18:45:19**.

> **La regla, hasta entender por qué:** **todo push a producción exige mirar el panel y pulsar
> Redistribuir si no ha saltado.** Va también en el orden del §8, que es donde se lee antes de
> empujar.

**Lo que esto le hace a la frase de arriba:** *«cada push redespliega»* es lo que el README
declara y lo que el panel promete, pero **el 26/09 no se cumplió**. Queda escrito así, con su
fecha, en vez de corregir el README a una regla nueva que tampoco consta: lo que consta es **un
push que no disparó y una redistribución a mano que sí**. Por qué no saltó → `NO CONSTA`.

---

## 2 · Qué viaja, y qué NO

| Qué | ¿Viaja? | Por qué, y dónde consta |
|---|---|---|
| `app/dist/` — la app construida | **SÍ**, versionada | El CLI de Angular **no corre en el panel**: exige Node ≥ 22.22.3 o ≥ 24.15.0 y el panel ofrece 22.18.0 y 24.6.0 (medido por SSH el 8/09 — `app/README.md:145-160`). Es un apaño **fechado**, con su condición de retirada escrita |
| `motor/dist/` — el motor emitido | **NO** | `.gitignore:7`. Lo produce `tsc`, que no exige nada raro; `app/README.md` declara que **lo construye el panel**. ⚠️ Con qué orden exacta lo construye sigue `NO CONSTA` (§7.1): lo que sí se midió el 26/09 es que el release ya desplegado **arranca** por `motor/arranque.cjs`, que carga ese emitido |
| `motor/.env.local` — las dos claves | **NO** | `.gitignore:35`. Nunca en el índice, nunca en la historia (verificado en el bloque E) |
| `app/data/…vivo.zip` y su registro | **NO** | `.gitignore:27-29`. Lo escribe la renovación del NAP; caduca y pesa 6,6 MB. Lo que sí viaja es la **semilla fechada** `app/data/2026-08-10_nap_gtfs-ficha1176.zip`, que es lo que hace arrancar un clon limpio |
| `motor/logs/` | **NO** | `.gitignore:42`. Testigo de **esa** máquina; se borran solos a los 14 días |
| `/visor` y `/panel` — la intranet | **NO** | Los `fileReplacements` de `app/angular.json` dejan la lista de rutas vacía y sus trozos **no se generan**. Firmado por Antonio el 19/09; la comprobación es `npm run comprobar-dist` (salida 17) y su jueza, `app/src/app/no-viaja.spec.ts` |
| `app/dist-tmp/`, `app/dist-anterior/`, `app/dist-local/`, `app/e2e/capturas/` | **NO** | `.gitignore:16-17`, `:49`, `:55` |

### ⚠️ Y viaja **byte a byte**, que no es gratis

`.gitattributes` marca `-text` en `app/data/**`, `motor/data/**`, `app/dist/**` y las fuentes
(`*.woff2`, `*.woff`, `*.ttf`, `*.otf`). Sin eso, `core.autocrlf` reescribe los saltos de línea en
el checkout **del servidor** y el fichero deja de ser el que su propio nombre —que lleva el hash
del contenido— dice: medido dos veces, entradas nº3 y nº40 de `docs/BITACORA.md` (el grafo con un
byte de más y otro sha256, y `main-<hash>.js` con 324.132 en vez de 324.130).

---

## 3 · Qué produce el build, y el guardián que lo publica

```bash
npm run construir        # en la RAÍZ → app/scripts/construir.mjs → app/dist/
npm run comprobar-dist   # el paso previo al commit del dist
```

**La mecánica, declarada en la cabecera del guion** (`app/scripts/construir.mjs`): construye a
`app/dist-tmp` —**hermano** del `dist`, porque `rename(2)` solo funciona dentro del mismo sistema
de ficheros— y publica con **dos renombrados** (`dist → dist-anterior`, `dist-tmp → dist`), porque
`rename(2)` no reemplaza un directorio que no esté vacío. Entre los dos pasos hay una **ventana**
en la que `dist` no existe: va **dicha, no fingida**, y `dist-anterior` se conserva hasta el final
para poder deshacer. Al publicar deja su marca `app/dist/.build-ok` con fecha, bundle, sha256 y
número de ficheros.

**Por qué importa aquí:** `ng build` **vacía la carpeta de salida antes de construir** —está en la
documentación de Angular—, y con el `dist` versionado y el push como despliegue, una build caída a
mitad es un **404 en producción**. Verificado bajo mutación por el bloque E: con una build rota a
propósito salió *«✖ LA BUILD FALLÓ (salida 1). El dist de ahora sigue INTACTO»*, el `dist` conservó
bundle, sha y marca, y **no quedó ni un resto**.

`npm run comprobar-dist` se niega si el `dist` no lleva marca, si el bundle no cuadra con ella, si
hay restos de un swap a medias, o si **la intranet se ha colado dentro** (salida 17).

---

## 4 · El arranque en el servidor

**Medido por SSH el 26/09**, y esto ya no es deducción: `public_html/` del dominio **no contiene
la aplicación**. Contiene **un solo fichero, `.htaccess`**, y lo que hay dentro es la
configuración de **Phusion Passenger**, que es quien arranca el motor:

```apache
PassengerAppRoot      …/hbuilds/current/nodejs
PassengerAppType      node
PassengerNodejs       /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile  motor/arranque.cjs
PassengerBaseURI      /
PassengerRestartDir   …/hbuilds/current/nodejs/tmp
SetEnv NODE_OPTIONS   --require …/hbuilds/config/preload-timestamp.js
SetEnv LSNODE_CONSOLE_LOG  console.log
SetEnv TOKIO_WORKER_THREADS 2
```

**Tres cosas que esto contesta de golpe:**

1. **El despliegue es POR RELEASES, no un `pull` sobre una carpeta viva.** Al lado está
   `hbuilds/`, con `versions/` (una carpeta por release, con nombre uuid), **`current`, que es un
   *symlink*** a una de ellas, `last-source/`, `logs/` y `config/`. Se publica **moviendo el
   enlace**, que es el mismo patrón que el guardián de build usa en casa (§3).
2. **El Node que corre es el 22 del hosting**: `/opt/alt/alt-nodejs22/root/bin/node`. El
   repositorio declara `engines: >=22`, así que cuadra — y confirma por qué el CLI de Angular no
   puede correr ahí (`app/README.md:145-160`: exige 22.22.3 o 24.15.0).
3. **El entry es `motor/arranque.cjs`**, exactamente el puente que la casa escribió para eso, y
   lo carga Passenger — no un `npm start`.

| Pieza | Qué es | Dónde consta |
|---|---|---|
| **Entry file** | `motor/arranque.cjs`, un puente de una línea: `import('./dist/servidor.js')` | Lo carga **Passenger**, con `PassengerStartupFile motor/arranque.cjs` (medido por SSH el 26/09, arriba): el entry se carga con `require()` y el motor es ESM **con top-level await** a conciencia (`await cocinarYServir(…)`: la red de bus cocinada ANTES de escuchar). `require()` no puede con eso, y el puente es la puerta que el propio error de Node dicta. Jueza: `motor/src/servidor.spec.ts` ⭐ 5 |
| **El arranque va SIEMPRE** | Importar el módulo **abre el puerto**; no hay `require.main === module` | Lo exige el preload del panel, que el 26/09 se leyó con nombre y todo: `NODE_OPTIONS --require …/hbuilds/config/preload-timestamp.js`. El primer despliegue dio **503** por lo contrario (8/09). Solo `DESPLAZAME_SIN_ARRANCAR=1` lo impide, y quien la pone es la suite |
| **El puerto** | `PORT` del entorno, **3000 de defecto** | `motor/src/servidor.ts:169`. Una `PORT` **vacía** se trata como no configurada y el arranque **lo dice**: `motor: puerto 3000 (defecto)` / `motor: puerto N (entorno)` (E-1, T4) |
| **El huso** | `TZ=Europe/Madrid`, fijado **en el repositorio** | `motor/src/huso-del-proceso.ts`, importado primero. El arranque imprime el huso que **Node resuelve**, no el que se le pidió (`servidor.ts:238`) |
| **El log** | `stdout` **y** un fichero por día en `motor/logs/`, 14 días | `servidor.ts:224`. En el panel el log es la única ventana: las primeras líneas son el huso, el puerto y qué capacidades quedan apagadas |
| **La app** | La sirve **el motor**, no Apache | Todo lo que no es `/api/` sale de `app/dist/…/browser`, con `index.html` de respaldo para el deep link del router (`servidor.ts:1138`) |

### Cómo se comprueba que un despliegue salió bien

```bash
curl -s https://desplazame.antonioblanquez.es/api/salud
```

Devuelve `ok`, el `pid`, el sello del feed servido y su vencimiento. Y en el log del panel, las
líneas que deciden: el **huso**, el **puerto y su origen**, qué **feed** se sirve, y —si falta el
token— `motor: renovación del feed: APAGADA (…)`.

**Y así se leyeron el 26/09**, en el log del build recién desplegado — las dos líneas que la T1 y
la T4 pusieron ahí para este momento, verbatim:

```
2026-09-26T18:45:19 I motor: huso del proceso Europe/Madrid — fijado a Europe/Madrid (el entorno ya traía la misma)
                    I motor: puerto 3000 (defecto)
```

**Lo que cada una cierra:**

- **El huso.** No dice solo que la zona sea la buena: dice **«el entorno ya traía la misma»**, o
  sea que la `TZ` del panel y el cinturón del repositorio **coinciden**, y que lo que se imprime
  es lo que **Node resuelve**, no lo que se le pidió. Era la pregunta que el bloque E dejó sin
  responder desde fuera tras descartar cinco vías.
- **El puerto.** `3000 (defecto)` significa, por la letra del E-1, que en producción la `PORT`
  **no está configurada —o está puesta y vacía, que desde el E-1 es lo mismo—**, y el motor cae
  al 3000 documentado **diciéndolo**. La línea no distingue esos dos casos y no se va a suponer
  cuál es; lo que importa es que antes del E-1 la segunda situación daba **puerto aleatorio y
  silencio**, y ahora se lee de un vistazo.

---

## 5 · Dónde viven las variables

**En producción, en el panel de Hostinger**, en la sección de variables de entorno de la app Node
(`README.md:704`). **En local, en `motor/.env.local`**, que está ignorado y del que el motor dice
solo **los nombres** que aporta, nunca los valores.

⚠️ **Y en el servidor ese fichero NO EXISTE, medido por SSH el 26/09:**

```bash
find ~ -maxdepth 5 -name ".env.local"    # → vacío
```

**No es que falte: es que no debe estar.** Las tres —`TZ`, `DESPLAZAME_REGEN_TOKEN` y
`NAP_API_KEY`— viven como **variables del panel**, o sea **fuera del ciclo de despliegue**. Eso es
lo que cierra el viejo §7.3: un deploy no puede pisar lo que no toca.

| Variable | Para qué | Sin ella |
|---|---|---|
| `NAP_API_KEY` | que se pueda **descargar** del Punto de Acceso Nacional la publicación nueva del GTFS | El motor arranca y sirve la **semilla** del repositorio, y lo dice |
| `DESPLAZAME_REGEN_TOKEN` | que `POST /api/renovar-feed` acepte **dispararlo** (`Authorization: Bearer …`, mínimo 32 caracteres) | El endpoint contesta **503** —distinto del 401 del token equivocado y del 409 de «ya hay una en curso»— y el **arranque nombra la capacidad apagada** (E-2, T4) |
| `PORT` | el puerto que asigna el hosting | Cae al **3000** documentado, y lo dice (E-1, T4) |
| `TZ` | el huso del proceso | ⚠️ **Añadida por Antonio el 24/09**, tras el veredicto del huso: el servidor decidía la hora en **UTC**. Desde la T1 el repositorio **también** la fija y las cuatro funciones que deciden ya no dependen de ella: la variable es el cinturón, no la fuente única |

⚠️ **Lo que ya está en el entorno MANDA** sobre `.env.local` —semántica de siempre—, y eso incluye
una variable **puesta y vacía**: es justo el caso que E-1 arregló.

---

## 6 · El cron de datos — **corre en la máquina de Antonio, no en el servidor**

Esto sorprende, y por eso va escrito: el mantenimiento de datos **no es un cron del hosting**. Es
una **tarea programada de Windows** en la máquina de Antonio, y lo que produce llega a producción
como cualquier otro cambio: **por commit y push** — con el aviso del §1: mirar el panel y
Redistribuir si no ha saltado.

Leído el 25/09 con `schtasks /query /tn "\Desplazame - mantener datos" /xml`:

| Campo | Valor leído |
|---|---|
| **Orden** | `cmd /c cd /d F:\01_PROYECTOS\004_DESPLAZAME && node scripts\mantener-datos.mjs >> %TEMP%\desplazame-mantener-datos.log 2>&1` |
| **Cadencia** | diaria (`ScheduleByDay`, `DaysInterval 1`), desde `2026-09-19T03:30:00` |
| **Pasadas perdidas** | `StartWhenAvailable: true` — una máquina apagada a las 3:30 **no se salta la pasada** |
| **Sesión** | `InteractiveToken` (solo interactivo) |
| **Estado** | `Listo`, próxima ejecución 26/09/2026 3:30 |
| **El parte** | `%TEMP%/desplazame-mantener-datos.log`. Nombra **los 54 conjuntos** en cada pasada y distingue *actualizado · sin cambio · fallido · no vigilable*; sale con **1** si algo falla |

A mano es el mismo guion: `npm run mantener-datos` (`-- --seco` pregunta y no escribe nada).

⚠️ **La escritura es atómica y el temporal es HERMANO** del fichero, no de `%TEMP%`: el renombrado
solo es atómico dentro del mismo sistema de ficheros. Es el mismo razonamiento del guardián de
build, aplicado por la misma mano.

**La otra renovación —la del GTFS— sí puede dispararse en el servidor**, con
`POST /api/renovar-feed` y su token en cabecera (jamás en la URL: la URL se queda en los logs). Lo
que hace **después** del 202 no se ha probado desde aquí: es la rama cara, escribe el zip servido y
habla con el NAP → `NO CONSTA`, y así lo declara el bloque E.

---

## 7 · LO QUE `NO CONSTA` — y qué se cerró el 26/09

Nacieron **cinco**, ninguna respondible desde el repositorio. La sesión SSH del **26/09** cerró
una, dejó **tres** a medias y una entera; cada punto lleva **lo medido** y **lo que sigue sin
mirar**.

| | Estado tras el 26/09 |
|---|---|
| 7.1 · qué ejecuta el deploy | 🟡 **PARCIAL** — el mecanismo, medido; el comando de build, no |
| 7.2 · con qué usuario y cada cuánto | 🟡 **PARCIAL** — el usuario, medido; la cadencia, no |
| 7.3 · ¿pisa lo no versionado? | ✅ **CERRADO**, y en la dirección buena |
| 7.4 · cómo se reinicia el motor | ⬜ **SIGUE `NO CONSTA`** |
| 7.5 · la vuelta atrás | 🟡 **PARCIAL** — la vía manual, verificada |

### 7.1 · Qué ejecuta EXACTAMENTE el auto-deploy → 🟡 PARCIAL

**Lo medido por SSH el 26/09 — el mecanismo, que antes era pura conjetura:**

- **Es un despliegue por RELEASES.** `hbuilds/versions/` guarda una carpeta por release (nombre
  uuid), **`hbuilds/current` es un *symlink*** a la que está viva, y al lado hay `last-source/`,
  `logs/` y `config/`. Publicar es **mover el enlace**, no escribir sobre una carpeta viva.
- **Passenger sirve desde `hbuilds/current/nodejs`**, arrancando `motor/arranque.cjs` con el Node
  22 del hosting. El `.htaccess` entero está en §4.
- **Hay un `preload` del hosting** en el arranque: `NODE_OPTIONS --require
  …/hbuilds/config/preload-timestamp.js`.

**Lo que sigue `NO CONSTA`: el comando exacto del build.** Si corre `npm install`, si corre el
`tsc` del motor —que es lo que `app/README.md` afirma—, y en qué orden. El mecanismo de
publicación ya no es una incógnita; **la receta sí**.

> **Qué mirar para cerrarlo:** en **hPanel → Sitios web → desplazame.antonioblanquez.es**, la
> pantalla de **Despliegues** (la misma donde está el botón «Redistribuir») y, si el plan la
> tiene, **Build Settings**. Copiar literalmente el comando. Y por SSH, el registro del release:
> `ls -la hbuilds/logs/` y las últimas líneas del log del último build.

⚠️ **Y lo que esa misma sesión destapó y no estaba en ninguna lista: el webhook no disparó.** El
push `8aa418a` del 26/09 no produjo despliegue —el panel seguía dando por «Actual» el de
`78821ff` del 24/09, y `current` apuntaba al build del 24/09 a las 11:13—; hizo falta pulsar
**Redistribuir**. Está contado con su evidencia en **§1** y convertido en paso obligatorio en
**§8**. Por qué no saltó → `NO CONSTA`.

### 7.2 · Con qué usuario corre, y cada cuánto → 🟡 PARCIAL

**Medido el 26/09:** los ficheros del servidor son del usuario **`u376210983`**, que es con quien
corre lo que se despliega y lo que arranca.

**Sigue `NO CONSTA`:** cada cuánto mira el disparador —y si «mira» es la palabra: el 26/09 no
disparó (§1)—, y si hay un cron detrás o es un webhook del repositorio.

> **Qué mirar:** la pantalla de **Despliegues** (si dice «automático» y con qué periodicidad) y,
> en **Avanzado → Cron jobs**, si existe una entrada que lo dispare. Por SSH: `crontab -l`.

### 7.3 · Si el despliegue puede pisar lo NO versionado → ✅ CERRADO

**Y se cierra por donde no se esperaba: el fichero que se temía por él NO EXISTE en el servidor,
ni debe.** Medido por SSH el 26/09:

```bash
find ~ -maxdepth 5 -name ".env.local"    # → vacío
```

Las tres variables —`TZ`, `DESPLAZAME_REGEN_TOKEN` y `NAP_API_KEY`— viven **como variables del
panel**, o sea **fuera del ciclo de despliegue**. Y el despliegue, además, **no escribe sobre una
carpeta viva**: publica un release nuevo y mueve `current` (7.1). Las dos cosas juntas dan la
respuesta buena a la pregunta del principio: **un deploy no puede pisar las claves, porque no
están en el camino del deploy.**

⚠️ Lo que esto sí cambia es **dónde duele un error**: si alguien borra una variable en el panel,
no hay fichero de respaldo en el servidor que lo salve. El motor lo dirá al arrancar —desde el
E-2 nombra la capacidad apagada—, que es exactamente para lo que se escribió esa línea.

### 7.4 · Cómo se reinicia el motor tras el despliegue → ⬜ SIGUE `NO CONSTA`

**Lo único observado el 26/09, sin afirmar mecanismo:** el `.htaccess` declara
`PassengerRestartDir …/hbuilds/current/nodejs/tmp`, o sea que existe **un directorio con el que se
le pide el reinicio a Passenger**. Qué lo toca, y cuándo, no se ha mirado.

**No se midió lo que decidía:** el `pid` de `GET /api/salud` **antes y después** de un despliegue.
Sin eso, que el motor se reinicie solo sigue siendo suposición.

> **Qué mirar, y es un minuto:** `curl -s …/api/salud` **antes** de pulsar Redistribuir y **otra
> vez** cuando complete. Si el `pid` cambia, se reinicia solo. Si no, reiniciar es un paso del
> despliegue y entra en §8.

### 7.5 · La vuelta atrás → 🟡 PARCIAL, con la vía manual ya verificada

**Lo que consta, y ahora por partida doble:**

- **Por git:** `git revert <commit>` y `git push`. El `dist` anterior vuelve entero **porque está
  versionado** — con el aviso del §1: puede que el push no dispare nada.
- **Por el panel, VERIFICADO el 26/09:** el botón **«Redistribuir»** despliega el `HEAD` de `main`
  y completa. Es la vía que salvó el despliegue de ese día.

**Sigue `NO CONSTA`:** si el panel permite volver a un release **anterior** —`hbuilds/versions/`
los guarda todos, así que el material está ahí— y cuánto tarda cada vía.

> **Qué mirar:** en la pantalla de **Despliegues**, si la lista de despliegues pasados ofrece
> volver a uno. Y por SSH, cuántos releases guarda: `ls -la hbuilds/versions/`.

---

## 8 · El despliegue, en orden, tal y como se hace hoy

1. **Construir la app** si ha cambiado algo de `app/src`: `npm run construir` en la raíz.
2. **Comprobar el artefacto**: `npm run comprobar-dist` (marca, bundle, restos, intranet fuera).
3. **Las pruebas**: `npm run probar` y `npm run comprobar-tipos`, los dos desde la raíz. La batería
   de pantalla (`npm run bateria`) **al peaje del lote**, no en cada commit.
4. **Commit y push a `main`**. A partir de aquí el despliegue es del panel y **no hay revisión
   intermedia**.
5. ⚠️ **MIRAR EL PANEL Y REDISTRIBUIR SI NO HA SALTADO** (regla nueva del 26/09, §1). En
   **Despliegues**, comprobar que el despliegue «Actual» es **el commit que se acaba de empujar**.
   Si sigue siendo el anterior —como pasó el 26/09—, pulsar **«Redistribuir»**, que despliega el
   `HEAD` de `main` y completa. **Un push sin esta comprobación no es un despliegue: es una
   esperanza.**
6. **Mirar que llegó**: `GET /api/salud` —el `pid`, el feed y su vencimiento— y las primeras líneas
   del log del panel: huso, puerto y su origen, feed servido, y capacidades apagadas. Las dos que
   deciden, tal y como se leyeron el 26/09, están en §4.
7. **Y de paso, el minuto que cierra el 7.4**: comparar el `pid` de `/api/salud` **antes y
   después**. Cuesta nada y contesta si el motor se reinicia solo.

⚠️ **Y lo que NO se toca desde una tanda de arreglo:** el guardián de build no se «simplifica»
—los dos renombrados y el respaldo son lo que impide que una build rota tumbe producción—, la tarea
programada real se **consulta**, no se modifica, y `motor/.env.local` no se toca, ni se copia, ni se
imprime.
