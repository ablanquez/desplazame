# DESPLIEGUE — cómo llega Desplázame a producción

> **Qué es:** el paso del repositorio al sitio vivo, escrito. Nace del hallazgo **E-3** de la
> auditoría de cierre (`docs/auditoriafinal/E-OPERACION.md` §5), que midió que **el repositorio
> entero decía dos líneas del despliegue**: `README.md:21-22` y `README.md:704`.
>
> **Fecha:** 2026-09-25 · **Producción:** <https://desplazame.antonioblanquez.es> (Hostinger,
> plan Node, servido desde `de-fra-web2061` — `README.md:21-22`).
>
> ⚠️ **LA REGLA DE ESTE DOCUMENTO.** Lo que se afirma aquí está **verificado contra el
> repositorio o contra la máquina**, y lleva su fichero:línea o su comando al lado. Lo que solo
> se puede saber **mirando el panel de Hostinger** va marcado como **`NO CONSTA`** y con la
> instrucción exacta de qué mirar — §7, y son cinco. **Nada se rellena con lo probable.**
>
> 🔒 **Aquí no hay ningún secreto.** De las claves se dicen sus **nombres** y para qué sirven;
> nunca un valor, ni un fragmento, ni su longitud.

---

## 1 · El disparador: **el `git push` ES el despliegue**

> *«auto-deploy por cron desde `main`: cada push redespliega»* — `README.md:21-22`.

**Y el repositorio no lo configura.** Medido hoy: **cero ficheros de despliegue rastreados**
—ni `.github/workflows/`, ni `Dockerfile`, ni `Procfile`, ni `.htaccess`, ni un `.yml` de CI—:

```bash
git ls-files | grep -Ei "\.ya?ml$|htaccess|Dockerfile|Procfile"   # → vacío
```

**Ese es el dato de fondo de este documento**: el despliegue vive **entero en el panel**, fuera
del control de versiones, y por eso §7 tiene cinco `NO CONSTA` que ningún `grep` puede cerrar.

⚠️ **Consecuencia práctica, y sí es verificable:** cualquier commit que llegue a `main` —incluido
uno a medias— sale a producción sin revisión intermedia. De ahí las dos leyes de la casa que
sostienen el resto: **el guardián de build** (§3) y **el `dist` versionado** (§2).

---

## 2 · Qué viaja, y qué NO

| Qué | ¿Viaja? | Por qué, y dónde consta |
|---|---|---|
| `app/dist/` — la app construida | **SÍ**, versionada | El CLI de Angular **no corre en el panel**: exige Node ≥ 22.22.3 o ≥ 24.15.0 y el panel ofrece 22.18.0 y 24.6.0 (medido por SSH el 8/09 — `app/README.md:145-160`). Es un apaño **fechado**, con su condición de retirada escrita |
| `motor/dist/` — el motor emitido | **NO** | `.gitignore:7`. Lo produce `tsc`, que no exige nada raro; `app/README.md` declara que **lo construye el panel** |
| `motor/.env.local` — las dos claves | **NO** | `.gitignore:35`. Nunca en el índice, nunca en la historia (verificado en el bloque E) |
| `app/data/…vivo.zip` y su registro | **NO** | `.gitignore:27-29`. Lo escribe la renovación del NAP; caduca y pesa 6,6 MB. Lo que sí viaja es la **semilla fechada** `app/data/2026-08-10_nap_gtfs-ficha1176.zip`, que es lo que hace arrancar un clon limpio |
| `motor/logs/` | **NO** | `.gitignore:42`. Testigo de **esa** máquina; se borran solos a los 14 días |
| `/visor` y `/panel` — la intranet | **NO** | Los `fileReplacements` de `angular.json` dejan la lista de rutas vacía y sus trozos **no se generan**. Firmado por Antonio el 19/09; la comprobación es `npm run comprobar-dist` (salida 17) y su jueza, `app/src/app/no-viaja.spec.ts` |
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

| Pieza | Qué es | Dónde consta |
|---|---|---|
| **Entry file** | `motor/arranque.cjs`, un puente de una línea: `import('./dist/servidor.js')` | El panel carga el entry con `require()` y el motor es ESM **con top-level await** a conciencia (`await cocinarYServir(…)`: la red de bus cocinada ANTES de escuchar). `require()` no puede con eso, y el puente es la puerta que el propio error de Node dicta. Jueza: `motor/src/servidor.spec.ts` ⭐ 5 |
| **El arranque va SIEMPRE** | Importar el módulo **abre el puerto**; no hay `require.main === module` | Lo exige el preload del panel. El primer despliegue dio **503** por lo contrario (8/09). Solo `DESPLAZAME_SIN_ARRANCAR=1` lo impide, y quien la pone es la suite |
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

---

## 5 · Dónde viven las variables

**En producción, en el panel de Hostinger**, en la sección de variables de entorno de la app Node
(`README.md:704`). **En local, en `motor/.env.local`**, que está ignorado y del que el motor dice
solo **los nombres** que aporta, nunca los valores.

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
como cualquier otro cambio: **por commit y push**.

Leído hoy con `schtasks /query /tn "\Desplazame - mantener datos" /xml`:

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

## 7 · LO QUE `NO CONSTA` — y la instrucción exacta para cerrarlo

Son **cinco**, y ninguna se puede responder desde el repositorio: el despliegue se configura en el
panel (§1). Cada una lleva **qué mirar**. Son lecturas: **no hace falta cambiar nada**.

### 7.1 · Qué ejecuta EXACTAMENTE el auto-deploy → `NO CONSTA`

¿`git pull`? ¿`git reset --hard`? ¿Corre `npm install`? ¿Corre el `tsc` del motor —que es lo que
`app/README.md` afirma— y con qué orden?

> **Qué mirar:** en **hPanel → Sitios web → desplazame.antonioblanquez.es**, la sección de **Git /
> Deployment** (donde está conectado el repositorio y vive el disparador que despliega) y, si el
> plan la tiene, la de **Build Settings** de la app Node. **Copiar literalmente el comando o los
> comandos que aparezcan ahí**, y si hay un registro de despliegue, sus últimas líneas.

### 7.2 · Con qué usuario corre, y cada cuánto → `NO CONSTA`

El README dice *«cron»* pero no su periodicidad ni su usuario. Eso decide **cuánto tarda un push
en verse** y **qué permisos tiene** lo que se ejecuta.

> **Qué mirar:** la misma pantalla de **Git / Deployment**, y en **Avanzado → Cron jobs** la
> entrada que dispare el despliegue, con su expresión de cron. Por SSH: `whoami` y `crontab -l`.

### 7.3 · Si el despliegue puede pisar lo NO versionado → `NO CONSTA`, y es la que importa

`motor/.env.local` está ignorado por git, así que **un `pull` no lo toca**. Pero **un
`git clean -fdx`, si lo hubiera, se lo llevaría por delante** y el motor arrancaría sin claves; lo
mismo vale para el feed vivo (`app/data/…vivo.zip`) y para `motor/logs/`. **Nadie puede descartarlo
leyendo el repositorio.**

> **Qué mirar:** el comando de 7.1 —si contiene `clean`, `reset --hard` o un borrado de la carpeta,
> la respuesta es sí—. Y la comprobación directa, por SSH, **después del siguiente despliegue**:
>
> ```bash
> ls -la motor/.env.local app/data/nap_gtfs-ficha1176.vivo.zip
> ```
>
> Si siguen ahí, con su fecha anterior al despliegue, el despliegue no los pisa. Si desaparecen,
> **eso es un 🔴**: hay que volver a poner las claves, y el paso entra en §8.

### 7.4 · Cómo se reinicia el motor tras el despliegue → `NO CONSTA`

El `dist` nuevo de la app lo sirve el motor **desde disco**, así que podría verse sin reiniciar; el
motor, en cambio, tiene el grafo en memoria y `dist/servidor.js` ya cargado: sin reinicio seguiría
corriendo el código anterior.

> **Qué mirar:** en el panel de la app Node, si hay un **reinicio automático** tras el despliegue.
> Y la comprobación que no depende de leer nada: **el `pid` de `GET /api/salud` antes y después de
> un push**. Si cambia, el motor se reinicia solo; si no, hay que reiniciarlo a mano y **eso es un
> paso del despliegue** que va escrito en §8.

### 7.5 · La vuelta atrás → `NO CONSTA` si hay botón; lo que el repositorio permite, sí consta

**Lo que sí consta:** como el push es el despliegue, `git revert <commit>` y `git push` **son** la
vuelta atrás, y el `dist` anterior vuelve entero **porque está versionado**. Lo que no consta es si
además el panel guarda despliegues anteriores, y **cuánto tarda** cualquiera de las dos vías.

> **Qué mirar:** en **Git / Deployment**, si hay historial de despliegues y opción de volver a uno.
> Y medirlo una vez, sin prisa: el reloj entre el push y el cambio en `GET /api/salud`.

---

## 8 · El despliegue, en orden, tal y como se hace hoy

1. **Construir la app** si ha cambiado algo de `app/src`: `npm run construir` en la raíz.
2. **Comprobar el artefacto**: `npm run comprobar-dist` (marca, bundle, restos, intranet fuera).
3. **Las pruebas**: `npm run probar` y `npm run comprobar-tipos`, los dos desde la raíz. La batería
   de pantalla (`npm run bateria`) **al peaje del lote**, no en cada commit.
4. **Commit y push a `main`**. A partir de aquí el despliegue es del panel y **no hay revisión
   intermedia**.
5. **Mirar que llegó**: `GET /api/salud` —el `pid`, el feed y su vencimiento— y las primeras líneas
   del log del panel: huso, puerto y su origen, feed servido, y capacidades apagadas.

⚠️ **Y lo que NO se toca desde una tanda de arreglo:** el guardián de build no se «simplifica»
—los dos renombrados y el respaldo son lo que impide que una build rota tumbe producción—, la tarea
programada real se **consulta**, no se modifica, y `motor/.env.local` no se toca, ni se copia, ni se
imprime.
