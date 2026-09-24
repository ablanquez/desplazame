# AUDITORÍA DE CIERRE · BLOQUE E — OPERACIÓN Y DATOS

> **Qué es:** el mapa de hallazgos de cómo esto se ejecuta, se despliega y se mantiene. Cuarta
> de las seis piezas de la Fase 7, gobernada por `00-MARCO-AUDITORIA-DE-CIERRE.md` §4·E.
>
> **Fecha:** 2026-09-24 · **Commit auditado:** `4fd65cc`
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Vale para `4fd65cc` y ese árbol.
>
> ⚠️ **NINGÚN SECRETO SE IMPRIME EN ESTE INFORME.** De las dos claves solo se dice **si
> existen y si están vacías**, nunca su valor, su longitud real ni un fragmento. El barrido de
> fugas en los logs busca **formas** (cadenas largas, la palabra `Bearer`), no valores.
>
> **R1 en su forma de este bloque:** se ha ejecutado **solo lo reversible y barato**. No se ha
> tocado fuente rastreada, ni dato curado, ni respaldo, ni la tarea programada real —que se
> **consultó**, no se modificó—. Árbol limpio verificado al cerrar; motores parados.

---

## 1 · LA TRIPLE COBERTURA (R2)

### ✅ EJECUTADO de verdad

| Qué | Cómo | Resultado |
|---|---|---|
| **El clon limpio** | `rm -rf app/dist` y reproducir la cadena con `npm run construir` | ✅ reproducido |
| **Determinismo del build** | huella sha256 del árbol de `dist` antes y después | ✅ **idéntica** |
| **El guardián ante una build ROTA** | fichero transitorio con error de tipos → `npm run construir` | ✅ el `dist` sobrevive |
| **`PORT` vaciada y con basura** | proceso hijo mío, dos veces | ⚠️ ver E-1 |
| **`DESPLAZAME_REGEN_TOKEN` vaciado** | motor mío en `:4399` con la variable a `''` | ✅ 503 distinguido |
| **Las ramas baratas de `/api/renovar-feed`** | sin cabecera · token malo · `Bearer` vacío · método GET | ✅ 401/401/401/404 |
| **Fugas de secreto en el log del motor** | barrido de formas sobre 115 líneas de arranque | ✅ 0 |
| **El cron de datos** | lectura de su parte de hoy (10:08) y de la tarea programada | ✅ ver §4 |
| **El manifiesto contra el disco** | 53 declarados vs 75 ficheros | ✅ 0 prometidos y ausentes |
| **Los perfiles del arnés** | **contados**, no «retirados» | 142 = 115 + 26 fijos + 1 cuarentena |
| **La API de producción** | 5 lecturas GET + 1 POST de ruta, **sin escribir nada** | ver §3, E-3 |

### 🔶 SIMULADO (y cómo)

| Qué | Cómo se simuló | Por qué no en real |
|---|---|---|
| **La caída de configuración** | variables vaciadas **en mi proceso hijo**, nunca en el entorno real ni en `.env.local` | tocar el fichero real es tocar operación |
| **Una build rota** | fichero `.ts` **transitorio y no rastreado**, retirado y verificado | no se toca fuente rastreada (R1) |
| **El «clon limpio»** | borrando **solo** el artefacto generado más barato (`app/dist`, versionado y por tanto restaurable) | `node_modules` habría costado una instalación entera sin añadir nada |

### ⛔ NO EJECUTADO — y por qué

1. **La renovación real del feed contra el NAP** (`POST /api/renovar-feed` con token bueno):
   **rama cara**, escribe el zip servido y habla con el Punto de Acceso Nacional. Solo se
   probaron sus **ramas baratas**. → lo que hace después del 202: `NO CONSTA` desde aquí.
2. **La tarea programada real**: **consultada** (`schtasks /query`), nunca modificada ni
   disparada. No se ha visto una pasada real fallar.
3. **El auto-deploy de Hostinger**: no se ha provocado ningún despliegue. Lo que hace el `pull`
   exactamente en el servidor → `NO CONSTA`; ver E-3 y §4.
4. **`NAP_API_KEY` en su camino real**: se comprobó que el motor arranca sin ella y **lo dice**;
   no se ha probado que con ella la descarga funcione → `NO CONSTA`.
5. **El huso del proceso de producción**: no se pudo determinar desde fuera. **Ver §3, que es el
   veredicto que este encargo pedía.**
6. **Node 22**: el README declara `engines: >=22` y dice que solo se ha probado 24.19.0. **No se
   ha probado 22 aquí tampoco** → `NO CONSTA`, y el propio README ya lo declara.

### Intendencia, declarada

Ayer hubo limpieza de `%TEMP%` (~2,3 GB). **No hizo falta invocarla como causa de nada**: el
parte del cron estaba en su sitio (`desplazame-mantener-datos.log`, 6.468 B, **hoy a las 10:08**)
y los 142 perfiles del arnés siguen cuadrando con el acta. No se ha abierto bitácora por ningún
fantasma.

---

## 2 · EL MAPA DEL BUILD, Y LA DEMOSTRACIÓN DE QUE EL ORDEN LO SATISFACE

```
raíz (workspaces: tipos · motor · app)
  └── npm install            ← una sola instalación para los tres
        │
        ├── @desplazame/tipos     sin build: TypeScript que Node borra al ejecutar
        │      ▲ directa de motor (declarada) · ▲ de app (USADA Y NO DECLARADA → A-3)
        │
        ├── motor          `node src/servidor.ts`  — sin compilar
        │      └── datos: app/data (46.150 portales, grafo, GTFS semilla) + motor/data (12)
        │
        └── app            `ng build` → app/dist        (el artefacto que viaja)
               └── guardián `construir.mjs`: build a `dist-tmp` → swap → `.build-ok`
```

**La demostración, ejecutada y no razonada:** se borró `app/dist` entero (23 ficheros) y se
reprodujo con `npm run construir`. Resultado:

```
huella del árbol (sin la marca), antes:  dc85dc0f2f788e3c7d6203e6   23 ficheros
huella del árbol (sin la marca), después: dc85dc0f2f788e3c7d6203e6   23 ficheros
bundle main-5WNP7XDW.js · sha256 252e6f1be921… · 22 ficheros publicados
único cambio respecto de git:  app/dist/.build-ok  (la fecha de la marca)
```

**El orden se satisface porque no hay orden que satisfacer**: ni `tipos` ni `motor` tienen paso
de compilación, así que la única dependencia de construcción es `app → tipos`, y la resuelve el
*workspace*. La cadena es **reproducible al byte** y, por tanto, **idempotente**: correrla dos
veces da el mismo artefacto (la segunda pasada fue precisamente esta reproducción).

⚠️ **El eslabón frágil del mapa es el del bloque A (A-3):** `app` importa `@desplazame/tipos` en
20 ficheros **sin declararlo** en su manifiesto. Funciona por el izado del *workspace*. Aquí se
confirma desde la operación: **el mapa del build tiene una arista que ningún manifiesto dibuja.**

---

## 3 · ⭐ EL VEREDICTO DEL HUSO — **NO CONSTA desde fuera**, y la instrucción exacta

Esta era la pregunta que decide el 🔴 de A-1 y C-1. **No se ha podido responder sin tocar el
panel de Hostinger**, y aquí está por qué, con lo que se probó.

### Lo que se intentó, y por qué cada vía no sirve

| Vía | Qué salió | Por qué no decide |
|---|---|---|
| `GET /api/salud` | `arrancado: 2026-09-23T22:44:31.124Z`, `pid: 1945733` | `toISOString()` imprime **siempre** en UTC: no dice nada del huso del proceso |
| Cabeceras HTTP | `Date: Thu, 24 Sep 2026 08:51:59 GMT` | la especificación obliga a GMT; lo pone Node, no la zona |
| `GET /api/estacion-viva` | `«0 bicis disponibles a las 10:51»` con la cabecera en `08:51 GMT` | **parecía decisivo y no lo es**: ese texto lo formatea `alMinuto`, que **fija `timeZone: ZONA_DE_ZARAGOZA`** (`etapas.ts:71-83`). Prueba que `reloj.ts` funciona en producción — que ya lo probaba `huso.spec` — **no** el huso del proceso |
| `POST /api/ruta` en bus, producción **vs** mi motor local, al mismo minuto | 9 vs 11 pasos, 53,0 vs 53,3 min; ninguna hora de reloj en los pasos | la diferencia es de **desvíos cargados**, no de hora. Y hoy, a las 10:51 de Madrid (08:51 UTC), **la fecha es la misma en los dos husos**: `hoyEnGtfs` devolvería lo mismo corra donde corra |

**La conclusión técnica, que es el hallazgo:** la API **no filtra el huso del proceso**, porque
todo lo que se pinta con hora pasa por `reloj.ts` —que está bien— y lo único que depende del
huso son decisiones internas (`hoyEnGtfs`, `segundosDelDia`) **que no se devuelven**. La
diferencia solo sería observable **entre las 00:00 y las 02:00 de Madrid**, cuando las dos zonas
caen en días distintos.

### Lo que el repositorio ya dice (evidencia documental, no medición de hoy)

- `motor/src/etapas.ts:77-80`, acta del 8/09: *«En producción —**Fráncfort, UTC**— el poste
  decía "13:53" a quien vive a las 15:53»*. Es una medición **real y fechada** del proyecto.
- `README.md:21-22`: producción está *«servido desde **`de-fra-web2061`**»* — **fra = Fráncfort**,
  coherente con lo anterior.
- Y del bloque A: **nadie fija `TZ`** en `motor/arranque.cjs`, en los manifiestos ni en ningún
  guion de despliegue.

**Es decir: la mejor evidencia disponible apunta a UTC, y es de hace dieciséis días.** Este
informe **no la convierte en hecho de hoy**.

### ⛔ LA INSTRUCCIÓN EXACTA PARA ANTONIO (mano de Antonio, una sola cosa)

> En **hPanel → Sitios web → desplazame.antonioblanquez.es → Avanzado → Terminal SSH** (o el
> acceso SSH del plan), ejecutar **exactamente esto** y pegar las dos líneas de salida:
>
> ```bash
> date
> node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone, '|', new Date().getHours())"
> ```
>
> - Si la segunda línea dice **`Europe/Madrid`** y la hora coincide con el reloj de la calle →
>   **A-1 y C-1 bajan de gravedad**: el código acierta por configuración del servidor, y lo que
>   queda es dejarlo **escrito** para que nadie la cambie sin saberlo.
> - Si dice **`UTC`** (o la hora va dos por detrás) → **A-1 y C-1 se confirman como 🔴**: entre
>   las 00:00 y las 02:00 el motor sirve **el día de servicio anterior**.
>
> Y si además hay una sección de **variables de entorno** en el panel de la app Node,
> comprobar si existe `TZ`. **No hace falta cambiar nada para responder**: es una lectura.

---

## 4 · LOS PROCESOS DE LA CASA, UNO A UNO

| Proceso | Qué se comprobó | Veredicto |
|---|---|---|
| **Cron de datos** (`mantener-datos`) | Parte de hoy 10:08: **54 conjuntos · 0 actualizados · 24 sin cambio · 0 fallidos · 30 no vigilables**. Cada conjunto sale **nombrado** y con su porqué, incluidos tres `NO CONSTA cómo se vuelve a pedir`. Sale con código 1 si algo falla, 0 si no | ✅ **no falla en silencio** |
| **Pasadas perdidas** | `schtasks /query /XML`: **`<StartWhenAvailable>true</StartWhenAvailable>`** · tarea `\Desplazame - mantener datos`, próxima 25/09 03:30, estado *Listo* | ✅ el ajuste del 21/09, **verificado** |
| **Dónde se mira el parte** | `%TEMP%/desplazame-mantener-datos.log`, 6.468 B, de hoy | ✅ existe y es de hoy |
| **Escritura atómica** | el cron baja a un temporal **hermano** (`<fichero>.tmp`), valida y publica; el comentario declara *«el temporal es HERMANO y no vive en %TEMP%»* — que es el requisito del renombrado atómico | ✅ |
| **Guardián de build** | build a `dist-tmp` → dos renombrados → `.build-ok`. **Mutado con una build rota**: salió *«✖ LA BUILD FALLÓ (salida 1). El dist de ahora sigue INTACTO»*, el `dist` conservó bundle, sha y marca, y **no quedó ni un resto** (`dist-tmp` y `dist-anterior` ausentes) | ✅ **una build rota NO puede dejar el dist muerto** |
| **Arnés y perfiles** | **contados**: 142 en `%TEMP%` = 115 del acta + 26 con nombre fijo + 1 en cuarentena | ✅ cuadra con el acta |
| **Logs del motor** | rotación por nombre de día, `DIAS_QUE_SE_GUARDAN = 14`; hay **15 ficheros**, de 10/09 a 24/09 — las 14 jornadas más hoy, que es exactamente la ventana | ✅ |
| **Fugas en el log** | 0 cadenas de 32+ caracteres · sin `Bearer` · el único `matricula=` es **`0000XXX`, el ejemplo del banner de arranque**, no una matrícula real (el acta de `distintivo.ts` se cumple) | ✅ |
| **Secretos en git** | `motor/.env.local` **ignorado** (`.gitignore:35`), **nunca en el índice**, **nunca en la historia** (`git log --all` sobre `*.env*` vacío) | ✅ |
| **Re-firma del censo** | solo se encontró su rastro en el ESTADO (*«entrados por el canon snapshot: diff por contenido»*), sin guion ni guardián propio que ejecutar | **NO CONSTA** |
| **Auto-deploy** | documentado en `README.md:21-22` (cron desde `main`, cada push redespliega) | ver **E-3** |
| **Pasos manuales del despliegue** | el arranque en local, las dos variables y para qué sirven están escritos y son correctos | ver **E-3** |

---

## 5 · HALLAZGOS

### 🟠 E-1 · `PORT` vacía deja al motor escuchando en un puerto **aleatorio**, sin decir nada

| | |
|---|---|
| **Categoría** | Variables de entorno · arranque cojo en silencio |
| **Ubicación** | `motor/src/servidor.ts:125` — `export const PUERTO = Number(process.env['PORT'] ?? 3000);` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

**Ejecutado en proceso hijo mío, las dos ramas:**

```
PORT=''                 → PUERTO = 0   · tipo number · ¿NaN? false
PORT='no-soy-un-puerto' → NaN → RangeError [ERR_SOCKET_BAD_PORT]  ← falla RUIDOSAMENTE ✅
```

**Por qué importa.** `??` solo atrapa `undefined` y `null`: **la cadena vacía pasa**, y
`Number('')` es **0**. `server.listen(0)` es legal y significa *«dame cualquier puerto libre»*:
el motor arrancaría, imprimiría su banner entero y quedaría escuchando **donde nadie lo busca**,
sin un solo aviso. Y una variable puesta y vacía en el panel de un hosting no es un caso
retorcido: es lo que queda cuando alguien la borra a medias.

La basura **sí** falla ruidosamente, que es la mitad buena de la historia.

**Opciones, sin elegir:** (1) `Number(process.env['PORT'] || 3000)` — trivial, trata vacío como
ausente; (2) validar y **morir diciendo** si no es un entero de 1 a 65535 — acotado, y distingue
«no configurado» de «mal configurado»; (3) dejarlo y **declararlo** en el README junto a las
otras variables.

---

### 🔵 E-2 · Falta el token y el motor no lo menciona hasta que alguien llama

| | |
|---|---|
| **Categoría** | Fail-safe · configuración a medias |
| **Ubicación** | `motor/src/renovar-feed.ts:386-409`, `servidor.ts:1023` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

**Lo bueno, ejecutado:** con `DESPLAZAME_REGEN_TOKEN` vaciado, `POST /api/renovar-feed`
responde **503** con *«Sin DESPLAZAME_REGEN_TOKEN configurado (o de menos de 32 caracteres) esto
no se ejecuta»* — **y eso es distinto** del **401** del token equivocado y del **409** de «ya hay
una renovación en curso». El fail-safe **distingue las tres cosas**, que es justo lo que el
marco pide.

**Lo que se reporta:** al arrancar, el motor dice *«sin .env.local (o sin nada nuevo que
aportar); manda el entorno»* — que es cierto y suficiente para un humano atento, pero **no nombra
qué capacidad queda apagada**. El endpoint está muerto y solo se sabe al usarlo.

⚠️ **Y se declara lo que estuve a punto de cantar mal:** el README promete *«Sin ellas el motor
arranca igual y lo dice»*, y al buscar «token» en el log no aparecía nada. **La promesa se
cumple**: el motor lo dice con otras palabras, en su línea 89. Era mi `grep` el que miraba mal.

---

### 🟠 E-3 · Qué hace exactamente el despliegue **no está escrito** en el repositorio

| | |
|---|---|
| **Categoría** | Paso de operación sin documentar |
| **Ubicación** | `README.md:21-22` y `:704` — lo único que hay |
| **Gravedad** | 🟠 |
| **Coste** | Acotado (es escribir, no programar) |

Lo que el repositorio dice es que hay *«auto-deploy por cron desde `main`: cada push
redespliega»* y que las variables *«viven en el panel de Hostinger»*. **Lo que no dice, y es lo
que hace falta el día que algo salga mal:**

- **Qué ejecuta exactamente ese cron** (¿`git pull`? ¿`git reset --hard`? ¿con qué usuario? ¿con
  qué frecuencia?) → `NO CONSTA`.
- **Si puede pisar algo local del servidor.** Es la pregunta que el marco hace explícita, y aquí
  importa de verdad: `motor/.env.local` **está ignorado por git**, así que un `pull` no lo toca
  — pero un `git clean -fdx`, si lo hubiera, **se lo llevaría por delante** y el motor arrancaría
  sin claves. **Nadie puede descartarlo leyendo el repositorio.**
- **Cómo se reinicia el motor tras el pull**, y si el `dist` nuevo se sirve sin reinicio.
- **Qué hacer si el despliegue deja el sitio caído**: no hay vuelta atrás escrita.

⚠️ **Marcado como decisión de producto** en su alcance: puede que Antonio prefiera que eso viva
en sus notas y no en el repositorio. Lo que el auditor afirma es que **hoy no está**, y que sin
ello el bloque D no tendrá contra qué contrastar.

---

### 🔵 E-4 · Veintidós ficheros de datos fuera del manifiesto

| | |
|---|---|
| **Categoría** | Datos · derivados declarados |
| **Ubicación** | `app/data/*_cabeceras.txt` (22) |
| **Gravedad** | 🔵 |
| **Coste** | Trivial (o ninguno, si se decide que está bien) |

El manifiesto declara **53 recursos** y **ninguno falta del disco** —dato importante: el
manifiesto no promete nada que no esté—. Al revés sí hay diferencia: en `app/data` hay **22
ficheros no declarados, y los 22 son `_cabeceras.txt`**, las cabeceras HTTP guardadas que el
cron usa para la petición condicional (y cuya ausencia es justo lo que hace a un conjunto
*«no vigilable»*, como su propio parte explica).

**No son huérfanos: son el mecanismo.** Se reporta porque un tercero que mire la carpeta no
puede saberlo del manifiesto, y porque conviene decidir **a propósito** si el registro de
operación pertenece o no al *data package*.

---

## 6 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Por qué no es defecto |
|---|---|
| El `dist` cambia su `.build-ok` en cada construcción | Es la marca: fecha, bundle, sha y número de ficheros. Lo demás sale **idéntico al byte** |
| 15 ficheros de log para una ventana de 14 días | Son las 14 jornadas **más hoy**. El corte es `< hoy-14`, así que el día del borde se conserva a propósito |
| `matricula=0000XXX` en el log | Es el **ejemplo del banner de arranque**, no una consulta real. El acta de `distintivo.ts` —*«la matrícula NO se guarda y NO se escribe en el log»*— se cumple |
| El mismo cuerpo 401 para token malo y para cabecera ausente | **Correcto por seguridad**: no se le dice a quien prueba si el token existe. Y el operador **sí** tiene su caso propio: el 503 |
| Los 30 conjuntos «no vigilables» del cron | Cada uno con su razón escrita —fuente viva que no se copia, o `NO CONSTA` cómo re-pedirla—. Un «no vigilable» **nombrado** no es un silencio |
| `motor/.env.local` existe en la máquina | Ignorado, nunca versionado, y el motor **nombra las variables que aporta sin imprimir valores** |

---

## 7 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **El guardián de build cumple su promesa bajo mutación.** Es lo más valioso del bloque: con
   la build rota a propósito, dijo *«el dist de ahora sigue INTACTO»*, salió con 1, dejó el
   artefacto anterior servible y **no se dejó un solo directorio temporal**. Construir a un
   hermano y hacer swap solo al final es la respuesta correcta a *«el push ES el despliegue»*.
2. **El build es reproducible al byte.** Borrar el artefacto y reconstruirlo dio la **misma
   huella**. Eso es determinismo e idempotencia demostradas de una vez, no razonadas.
3. **El fail-safe distingue tres cosas** —sin configurar (503), mal autorizado (401), ya en
   curso (409)— y aun así **no le cuenta al atacante** cuál es cuál en el caso sensible.
4. **El token viaja en la cabecera y nunca en la URL**, con la razón escrita: *«la URL se queda
   en los logs»*. Y el cargador de entorno *«rellena `process.env` y calla»*.
5. **El cron nombra los 54 conjuntos, siempre.** Distingue *actualizado*, *sin cambio*,
   *fallido* y *no vigilable*, y donde no sabe cómo re-pedir un dato escribe `NO CONSTA` en el
   parte. Un informe que se puede leer en veinte segundos y en el que **ningún conjunto queda
   callado**.
6. **La escritura de datos es atómica y el temporal es HERMANO**, con el porqué escrito —el
   renombrado solo es atómico dentro del mismo sistema de ficheros—. Es el mismo razonamiento
   que el guardián de build, aplicado dos veces por la misma mano.
7. **Las pasadas perdidas se recuperan** (`StartWhenAvailable`), verificado sobre la tarea real.
8. **El panel de frescura lee el artefacto vivo y no solo el recibo:** añade una fila desde
   `GET /api/salud` con el zip que **de verdad se está sirviendo**, porque *«el manifiesto declara
   la caducidad de la SEMILLA y el motor sirve el VIVO: eran dos verdades para la misma
   pregunta»*. Ese es exactamente el problema que el marco señala, resuelto y documentado.
9. **Un clon limpio no necesita ninguna clave**: la semilla del GTFS viaja en el repositorio, y
   el README lo dice con su tabla de qué hace falta cada variable.

---

## 8 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

1. **El huso (§3): la lectura de Antonio en el panel.** Es un minuto y **desbloquea dos 🔴** de
   dos bloques. Nada más debería moverse de A-1/C-1 hasta tener esa línea.
2. **E-1** (`PORT` vacía): trivial, y quita un modo de fallo mudo.
3. **E-3** (escribir el despliegue): es lo que el bloque D va a necesitar para contrastar, así
   que conviene **antes** de D.
4. **E-2** y **E-4**: cosméticos; E-4 es más decisión que arreglo.

### ⛔ Qué NO tocar

- **El guardián de build no se «simplifica».** Los dos renombrados, el respaldo y la ventana
  declarada son lo que hace que una build rota no tumbe producción.
- **La tarea programada real no se modifica** desde una auditoría: se consulta.
- **`motor/.env.local` no se toca, ni se copia, ni se imprime.** Está bien donde está y bien
  ignorado.
- **El 401 indistinguible no se «mejora»** contándole al cliente si el token está configurado:
  el operador ya tiene su 503.
- **Los `_cabeceras.txt` no se borran** (E-4): son el mecanismo de la petición condicional.

---

## 9 · PARA EL CHECKLIST MAESTRO (en genérico)

1. **Probar cada variable de entorno en sus TRES estados: ausente, vacía y con basura.** El
   caso «vacía» es el que se escapa, porque `??` y `||` no se comportan igual y una cadena vacía
   puede convertirse en un cero perfectamente válido para la API de abajo.
2. **Demostrar el clon limpio borrando el artefacto y comparando la HUELLA**, no mirando que el
   comando termine. La misma prueba da determinismo e idempotencia de regalo.
3. **Mutar el guardián de build con una build rota de verdad** y comprobar que el artefacto
   anterior sobrevive **y que no quedan restos**. Un guardián que deja `dist-tmp` a medias es un
   guardián que fallará al segundo intento.
4. **Exigir que el fail-safe distinga «no configurado» de «mal autorizado» de «ocupado»** — y
   que la distinción llegue al **operador**, aunque al cliente se le dé la misma respuesta.
5. **Buscar fugas de secretos por FORMA, no por valor**: cadenas largas, la palabra del esquema
   de autorización, parámetros sensibles en URL. Y comprobar el `.gitignore` **contra el nombre
   real del fichero**, no contra el que uno supone (`.env` no cubre `.env.local`).
6. **Un proceso periódico debe nombrar TODO lo que gestiona en cada pasada**, incluido lo que no
   pudo mirar y por qué. «0 fallidos» sobre una lista invisible no dice nada.
7. **Comprobar la recuperación de pasadas perdidas en el planificador real**, leyéndolo. Un cron
   nocturno en una máquina que se apaga por la noche no corre nunca.
8. **Preguntar qué hace EXACTAMENTE el despliegue y si puede pisar lo que no viaja en el
   repositorio** —los ficheros ignorados son justo los que nadie puede restaurar desde git—.
9. **Cuando una medición «decisiva» salga redonda, comprobar que mide lo que crees.** Aquí un
   texto que decía la hora de la calle parecía zanjar el huso y solo probaba que el formateador
   tenía la zona fijada.

---

## 10 · LAS HORAS DE ESTE BLOQUE

| Tramo | Reloj |
|---|---|
| Lectura del §4·E y sondeo del huso en producción (5 vías) | 10:49 → 10:53 |
| Variables, endpoint caro, secretos y `.gitignore` | 10:53 → 10:56 |
| Clon limpio, determinismo y mutación del guardián de build | 10:56 → 10:58 |
| Cron, tarea programada, logs, perfiles y datos | 10:58 → 11:00 |
| Redacción del informe | 11:00 → cierre |
| **Total del bloque E** | **≈ 45 min** de reloj de pared |

**Cualitativo:** el más barato de los cuatro hasta ahora, y con el mejor ritmo de hallazgo por
minuto **salvo en una cosa**: el huso se llevó casi una cuarta parte del bloque y terminó en
`NO CONSTA`. No fue tiempo perdido —descartar cinco vías **es** el resultado, y deja a Antonio
una pregunta de un minuto en vez de una investigación—, pero confirma que **lo que no se puede
observar desde fuera hay que declararlo pronto y dejar de insistir**. Lo demás fue rápido porque
el proyecto ya estaba instrumentado: el guardián, el cron y el arnés **se auditan solos** si uno
se limita a ejecutarlos y leerlos.
