# AUDITORÍA DE CIERRE · LA SÉPTIMA PIEZA — LA VERIFICACIÓN DEL AUDITOR

> **Qué es:** la comprobación de que lo que las tandas dicen haber cerrado está cerrado **hoy, en
> el árbol**, y de que lo que se dejó sin tocar está declarado y quieto. Gobernada por
> `00-MARCO-AUDITORIA-DE-CIERRE.md` §6.
>
> **Fecha:** 2026-09-25 · **Árbol verificado:** `035f855` (limpio) · **Fase auditada:** desde
> `78821ff`, el commit que trajo el marco.
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Vale para `035f855` y ese árbol.
>
> ⚠️ **LA REGLA DE ESTA PIEZA (§6, literal):** cada hallazgo, cerrado o deliberadamente dejado,
> con evidencia **RE-CORRIDA SOBRE EL ÁRBOL ACTUAL**. Nunca «lo arreglé en el commit X»: el grep
> que vuelve vacío HOY, la jueza que existe y está verde HOY, la línea que dice HOY lo que el
> cierre afirma. **Y se desconfía de los papeles** —de los seis informes, del marco y de los
> checkpoints, incluidos los míos—: el estreno de esta pieza en ZetaBus cazó un subconteo del
> propio informe, y aquí ha cazado tres cosas.
>
> **R1 en su forma de esta pieza:** solo lectura. Greps, `tsc`, unidad de motor y app, y dos
> peticiones GET a la fuente legal. **La batería e2e NO se ha corrido**: es el peaje, y va después.
> Lo único que escribe esta pieza es este documento y la fila del tablero.

---

## 1 · LA COBERTURA, DECLARADA (R2)

| | |
|---|---|
| **Hallazgos de los seis informes** | **38** — contados sobre los informes, no sobre los checkpoints |
| **Nacidos después** (§10: T2, T3, T4 y el racimo) | **13** |
| **Anotados para esta pieza** (registros congelados) | **2 bloques**: el CENSO y los dos de `intranet/` |
| **Quietudes firmadas** | **3**: `buscador.ts` sin partir · `registro.ts` intacto · la forma del `git log` de la carpeta |
| **TOTAL de piezas verificadas** | **56** |
| **Verificadas con evidencia de hoy** | **51** |
| **NO verificables desde aquí** | **5** — §8, cada una con su porqué |
| **Discrepancias encontradas** | **3** — §7 |

**El recuento de los 38, contra los informes mismos** (`grep "^### [gravedad] [ID]"` + la fila
`Gravedad` de cada ficha, cruzadas):

| Bloque | 🔴 | 🟠 | 🔵 | Total | ¿Cuadra con su checkpoint? |
|---|---:|---:|---:|---:|---|
| A · código | 1 | 4 | 5 | 10 | ✅ |
| C · tests | 1 | 4 | 2 | 7 | ✅ |
| B · interfaz | 0 | 5 | 2 | 7 | ✅ |
| E · operación | 0 | 2 | 2 | 4 | ✅ |
| F · experiencia | 0 | 3 | 2 | 5 | ✅ |
| D · documentación | 0 | 1 | 4 | 5 | ✅ |
| **TOTAL** | **2** | **19** | **17** | **38** | ✅ |

Y **cero discrepancias entre la cabecera de cada hallazgo y la fila `Gravedad` de su propia
tabla** (38 fichas cruzadas). El 38 coincide además con el que el §10 del marco declara.

---

## 2 · LOS 38, UNO A UNO, CON LA EVIDENCIA DE HOY

### Bloque A · código

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **A-1** 🔴 | CERRADO · T1 | Las cuatro que deciden pasan por `reloj.ts`: `trayecto.ts` 2 · `viaje-bus.ts` 2 · `viaje-coche.ts` 3 · `festivo.ts` 2 apariciones de `relojDeZaragoza`/`fechaGtfsEnZaragoza`. El cinturón `huso-del-proceso.ts` lo importa **solo `servidor.ts`** (la entrada), que es su ley. `huso.spec.ts`: 11 juezas, hijo en `TZ: 'UTC'`. Motor 673/673 hoy |
| **A-2** 🟠 | CERRADO · T2 | **0 ficheros de producción** con el literal `disponibilidad no verificada` (`grep -rl … --include=*.ts` sin specs). Definición única: `tipos/src/index.ts:48`. **4 importadores** reales (ver §7·2) |
| **A-3** 🟠 | CERRADO · T2 | `app/package.json` → `dependencies['@desplazame/tipos'] = "*"` |
| **A-4** 🟠 | CERRADO · T2 | Una sola aparición del nombre en todo el código, y es la lápida: `viaje-coche.ts:1039` *«AQUÍ VIVÍA `textoDeAparcarEnParking`, y se ha ido (A-4, 24/09)»* |
| **A-5** 🟠 | CERRADO · T2 | `TIPOS_CON_FACTOR` importado y usado 4 veces por `tipos-de-ruta.spec.ts` — la jueza que el comentario prometía |
| **A-6** 🔵 | CERRADO · T2 | Dos lápidas del mismo patrón: `rueda.ts:372` (`factorDe`) y `viaje-bus.ts:427` (`rodandoEntre`) |
| **A-7** 🔵 | CERRADO · T2 | `git show 1aa6dd6 \| grep -c "^-export "` → **89**. Que no se retiró ninguno con usuario lo compra el árbol: `tsc` limpio ×2 y 673+784 en verde hoy |
| **A-8** 🔵 | **DECLARADO** · §10 (*«SE DECLARA sin código»*) | `git log 78821ff..HEAD -- motor/src/registro.ts` → **0 commits**. La quietud se cumple |
| **A-9** 🔵 | **DECLARADO** · §10 (*«FIRMADO no-se-parte»*) | `buscador.ts` sigue siendo **un solo fichero**: 3.917 líneas hoy (3.771 al auditarlo; creció con las ediciones puntuales que las piezas mandaron) |
| **A-10** 🔵 | CERRADO · T2 | `buscador.ts:1396` → `const c = x as Record<string, unknown>`, con su nota al lado |

### Bloque C · tests y guardianes

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **C-1** 🔴 | CERRADO · T1 | `huso.spec.ts` existe con 11 juezas y su hijo en `TZ=UTC`; verde dentro de los 673/673 de hoy |
| **C-2** 🟠 | CERRADO · T3 | En las cuatro suites el `perfilesResiduales` aparece **antes** del veredicto final (medido por posición en el fichero): identidad · creditos · dos-filas · bizi-y-resumen → **SÍ** las cuatro |
| **C-3** 🟠 | CERRADO · T3 | `empuje.spec.ts:193` → `test('⭐ 0 · empujar va a 5 km/h y es más lento que rodar en los tres')` |
| **C-4** 🟠 | CERRADO · T3 | La ley del 22/09 presente en `moto.mjs` (1), `yego.mjs` (1) y `pintura.mjs` (31: el ayudante + sus bloques) |
| **C-5** 🟠 | CERRADO · T3 | `package.json` → **11 scripts** `bateria*`: la entrada más una por suite. (Su primer defecto —dos suites dejaban la captura en la raíz— lo cazó la T4 y lo arregló `39fde99`) |
| **C-6** 🔵 | **DECLARADO** · §10 (*«los grep y la M1a: SE DECLARAN»*) | Ningún commit de la fase los nombra fuera del propio informe (`263c4a2`): la quietud es real |
| **C-7** 🔵 | **DECLARADO** · §10 | Ídem |

### Bloque B · interfaz y textos

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **B-1** 🟠 | CERRADO · T3 | **5 páginas** llaman a `rotular()`; `rotulo.ts` inyecta los dos servicios oficiales (`Title`, `Meta`) |
| **B-2** 🟠 | CERRADO · T3 | `<main` presente en las cuatro: `identidad` · `creditos` · `panel` · `visor`. Las dos desviaciones (panel `section→main`; identidad/visor sin `footer`) van declaradas en el cuerpo de `1b6a36c` |
| **B-3** 🟠 | CERRADO · T3 | `ultimo-recurso.ts` existe con **5 juezas** en su spec; `<noscript>` en `index.html` |
| **B-4** 🟠 | CERRADO · T3 + T4 + racimo | El texto firmado de la ruta está (1 aparición) y **la jerga vieja ha desaparecido del producto**: `grep -rn "No se pudo preguntar al motor" app/src --include=*.html` → **0** |
| **B-5** 🟠 | CERRADO · T3 | `system-ui` aparece 3 veces en `panel.css` y **las tres son el acta** (`:74-78`, *«Aquí ponía…»*); ninguna es declaración viva |
| **B-6** 🔵 | ⚠️ **SIN DICTADO — abierto** | Ver §7·1. Ningún commit de la fase lo nombra salvo el propio informe (`77073c2`) |
| **B-7** 🔵 | ⚠️ **SIN DICTADO — abierto** | Medido hoy: `prefers-reduced-motion` en **2 de 12** hojas (el informe midió 2 de 11; la hoja nueva no lo trae). Sin tocar |

### Bloque E · operación y datos

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **E-1** 🟠 | CERRADO · T4 | `servidor.ts` → `elPuertoYSuOrigen` (2 apariciones) y la línea `motor: puerto …` del arranque. Juezas 3, 13 y 14 verdes en los 673/673 |
| **E-2** 🔵 | CERRADO · T4 | `servidor.ts` → `motor: renovación del feed: APAGADA (…)`, compuesta de las dos constantes. Jueza 15 verde |
| **E-3** 🟠 | CERRADO · T4 | `docs/DESPLIEGUE.md` existe: **235 líneas**, con sus cinco `NO CONSTA` nombrados y su instrucción de panel |
| **E-4** 🔵 | CERRADO · T4 | `ficherosQueNoSonRecursos` presente en **las dos copias** del manifiesto (raíz y `app/public`), que es lo que exige la jueza del «byte a byte» |

### Bloque F · experiencia

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **F-1** 🟠 | CERRADO · T3 | Salida: «Volver al buscador» en `identidad.html`. Llegada: enlace «Identidad» en el pie de la portada. Y las dos se ven en la captura del D-3 |
| **F-2** 🟠 | CERRADO · T3 | `buscador.html` enlaza el repositorio y al autor (2 apariciones) |
| **F-3** 🟠 | CERRADO · T3 | `creditos.ts` decide por `RUTAS_DE_INTRANET` (2 apariciones): el mismo mecanismo que decide si la intranet existe, no una bandera nueva |
| **F-4** 🔵 | CERRADO · T3 | «Prueba con otro modo de transporte» en `buscador.html` |
| **F-5** 🔵 | CERRADO · T3 | «Escribe al menos dos letras para buscar» en `autocompletar-via.html`, por `role="status"` |

### Bloque D · documentación

| Id | Estado | Evidencia re-corrida hoy |
|---|---|---|
| **D-1** 🟠 | CERRADO · T4 (las tres de la opción 4) | (1) El candado se fue: la única aparición de `004_DESPLAZAME` en `renovar-feed.spec.ts` es el acta (`:445`). (2) El skip honesto dice su paso (`necesita motor/dist`, 1 aparición). (3) El README nombra `npm run probar` (3 apariciones, bloque propio) |
| **D-2** 🔵 | CERRADO · T2 | `grep -c "tipos/index.ts" docs/MIGRACION-CITAS-RGC-2026.md` → **0** |
| **D-3** 🔵 | CERRADO · T4 | `docs/img/portada.png`, **741.851 bytes**, citada 1 vez en el README bajo el título |
| **D-4** 🔵 | CERRADO · T4 | `allow-scripts` nombrado en el README (1 aparición, paso 2) |
| **D-5** 🔵 | CERRADO · T4 | `package.json` → `"license": "Apache-2.0"`; coincide con `LICENSE` y con la insignia |

---

## 3 · LOS NACIDOS DESPUÉS (§10), CON SU DICTADO Y SU EVIDENCIA

| Qué | Dictado | Evidencia de hoy |
|---|---|---|
| `contrasteRgb` ×2 (T2) | **SE DECLARA** (§4·A: duplicación deliberada con nota cruzada) | Las dos implementaciones siguen ahí, con su nota: `app/src/app/contraste.ts` y `app/e2e/medir.mjs` |
| B-4-bis: poste vivo · ubicación (T3) | RESUELTOS en la T4 | `b552f2f`; y el barrido de jerga de hoy da **0 en el producto** |
| El `[::1]` del README (T3) | RESUELTO en la T4 | `0ab6eae`; el README dice lo medido |
| La nota `MOTOR_LOG` (T3) | RESUELTO en la T4 | `0ab6eae` |
| La juez 5 compra el `dist` EMITIDO (T4) | **SE DECLARA** | El acta está puesta: `grep -c "artefacto EMITIDO" motor/src/servidor.spec.ts` → 1 |
| La rama de `/api/poste-vivo` sin guardián (T4) | **SE DECLARA** a la cola | Sigue sin jueza: ninguna prueba hace fallar `/api/poste-vivo` (0 coincidencias). El comportamiento sí está medido (T4) |
| La batería sin jueza (T4) | **SE DECLARA** a la cola | No existe ningún `*.spec` de la batería. Su primer defecto ya se cazó y arregló (`39fde99`) |
| El §7.3 del DESPLIEGUE (T4) | **DE ANTONIO, TRAS EL PUSH** | El hueco está escrito con su instrucción exacta en `docs/DESPLIEGUE.md` §7.3 |
| Los dos sitios de jerga (T4) | HECHOS · micro-pieza 1 | `70fc580`; barrido a 0 |
| La rama muda de sitios (micro-1) | HECHO · micro-pieza 2 | `920cbff`; la rama existe y su jueza está verde |
| El «Buscando…» de una sola capa (micro-2) | HECHO · micro-pieza 3 | `b1e91a9`; `cargandoLaCapaActiva` |
| La **asimetría de las dos ramas de error** (micro-3) | **SE DECLARA** (cuerpo de `b1e91a9`) | Sigue: cada rama nombra una capa. Su conducta es correcta porque un recurso inactivo no conserva error — **medido** en la micro-pieza 2 |
| El teclado muerto (micro-3) | HECHO · micro-piezas 4 y 5 | `1a1c9ef` + `035c687`. **Cierre de clase verificado hoy**: 3 recursos en toda la app, 3 lecturas de `.value()`, **las 3 guardadas** con `hasValue()`; las dos coincidencias de `.value() ??` que quedan son texto de actas |

---

## 4 · LOS ANOTADOS PARA ESTA PIEZA — registros congelados

**La ley que se aplica:** un registro fechado dice la verdad **contra el árbol de su fecha**. Su
deriva no se arregla: se nombra. Estado final de las dos, verificado hoy:

### 4.1 · `docs/CENSO-PRE-DESPLIEGUE.md`

- **Intacto:** `git log 78821ff..HEAD -- docs/CENSO-PRE-DESPLIEGUE.md` → **0 commits** en toda la
  fase.
- **Deriva conocida, medida exacta hoy** (intersección de los nombres que la poda del A-7 retiró
  con los que el censo cita entre comillas): **20 nombres** —no 17, ver §7·3—:
  `BACKOFF_MS` · `CAMPO_NONCE` · `COLOR_BIBLIOTECA` · `COLOR_CENTRO_SALUD` · `COLOR_COLEGIO` ·
  `COLOR_GUARDERIA` · `COLOR_HOSPITAL` · `COLOR_UNIVERSIDAD` · `ESPERA_MS` ·
  `MIENTRAS_SE_PREGUNTA` · `MIENTRAS_SE_PREGUNTA_AL_AYUNTAMIENTO` · `REINTENTOS` · `TTL_NONCE_MS` ·
  `URL_AJAX` · `URL_FLOTA` · `URL_NONCE` · `URL_POSTE` · `URL_ZONAS` · `contrasteRgb` · `encimaDe`.
- **Estado final: deriva conocida de registro congelado. No se arregla.**

### 4.2 · `intranet/PARLAMENTO.md` y `intranet/DIAGNOSTICO.md`

- **Intactos byte a byte:** `git diff --stat 78821ff..HEAD -- intranet/` → **vacío**. Los dos
  commits que los tocaron en la fase son la edición del D-2 y su reversión (`8a39bd4`): neta cero.
- **Deriva conocida, y sigue moviéndose:** la cita `motor/src/servidor.ts:1139` (dos veces) apunta
  a `RAIZ_DE_LA_APP`, que hoy vive en la **1138** —al cerrar la T2 estaba en la 1149—; la cita
  `buscador.ts:32` apunta al `import { Mapa }`, hoy en la **35**.
- **Estado final: deriva conocida de registro congelado. No se arregla** — y el que la línea haya
  vuelto a moverse dos veces en dos días es justamente el argumento.

---

## 5 · LAS QUIETUDES, Y LA FORMA DEL `git log`

| Quietud | Verificación de hoy |
|---|---|
| `buscador.ts` **no se parte** | Un solo fichero, 3.917 líneas. 7 commits de la fase lo tocan, y todos son ediciones puntuales que una pieza mandó (A-2, A-7, A-10, B, F, B-4-bis, micro-2) |
| `registro.ts` **como estaba** (A-8) | **0 commits** en toda la fase |
| Los seis informes: **una alta y ni una edición** | ✅ exacto: `A-CODIGO` 1 · `B-INTERFAZ` 1 · `C-TESTS` 1 · `D-DOCUMENTACION` 1 · `E-OPERACION` 1 · `F-EXPERIENCIA` 1 |
| El marco: solo el estratega **más** las seis filas del tablero | ✅ **16 commits** = 1 alta (`78821ff`) + 6 filas de bloque (`2c4ebb5`·`2c5735d`·`4fd65cc`·`037e546`·`53ae338`·`064cb94`) + **9 del estratega**. Ni una edición fuera de esa forma |
| La carpeta entera | 22 commits = 16 del marco + 6 altas. **Ningún commit de tanda toca `docs/auditoriafinal/`** |

---

## 6 · LAS CIFRAS VIVAS, RE-CORRIDAS HOY

| Qué | Última declarada | **Hoy** |
|---|---|---|
| Unidad del motor | 673 | **673 / 673**, 83 suites, 0 skipped |
| Unidad de la app | 784 | **784 / 784**, 26 ficheros |
| `comprobar-tipos` | limpio | **limpio** los dos lados · 307 y 385 ficheros mirados |
| La frase de disponibilidad | 1 definición | **1 definición** (`tipos/src/index.ts:48`), **0** copias en código de producción |
| La jerga vieja en el producto | 0 | **0** |
| Lecturas de `.value()` sin guarda | 0 | **0** — 3 lecturas, 3 guardadas |
| Los ELI del RGC (muestra) | 200 / 200 | **200 / 200** hoy: `…/rd/2003/11/21/1428/con` y `…/l/2007/11/16/37/con` |

---

## 7 · ⭐ LAS DISCREPANCIAS — que es para lo que existe esta pieza

### 7.1 · 🟠 **B-6 y B-7 no tienen dictado, y el marco los da por HECHOS**

La fila **G4** del §10 lista sus piezas así: *«B-1 … B-5 · 🔵 [táctiles fuera de censo ·
reduced-motion 2/11]»*, y su columna de dictado dice **«⚰️ HECHOS 24/09 [T3]»**.

**Pero la T3 no los llevaba.** Su encargo tenía catorce piezas —C-2 a C-5, B-1 a B-5, F-1 a F-5— y
**ninguna era B-6 ni B-7**. Verificado en git: el único commit de toda la fase que los nombra es
`77073c2`, **el alta del propio informe B**.

Y verificado en el árbol: **`prefers-reduced-motion` sigue en 2 de 12 hojas** (el informe midió
2 de 11; la hoja que ha entrado después tampoco lo trae).

**Estado real: ABIERTOS Y SIN DICTAR.** No están cerrados y tampoco declarados: son los dos únicos
hallazgos de los 38 en ese limbo. **Corresponde a Antonio decidir**: tanda, «se declara» con su
porqué, o nevera.

### 7.2 · 🔵 **«Cinco importadores» de `MARCA_DE_DISPONIBILIDAD` — son CUATRO**

El checkpoint de la T2 (y el encargo de esta pieza, que lo hereda) dice *«UNA definición en el
código que corre, **cinco** importadores»*. Medido hoy:

```
ficheros que hacen `import { MARCA_DE_DISPONIBILIDAD }`:  4
  motor/src/estacion-viva.ts · motor/src/poste-vivo.ts · motor/src/viaje-bizi.ts · app/src/app/buscador.ts
```

Y no es que alguien lo haya perdido: `git log -S "import { MARCA_DE_DISPONIBILIDAD }"` devuelve
**un solo commit**, el de la T2 (`2878517`), que los creó. **Siempre fueron cuatro.** El quinto que
el checkpoint contó es un fichero que **nombra** la constante en un comentario o acta, no que la
importe.

**El fondo del A-2 no cambia:** una definición, cero copias en producción. Lo que falla es la
cifra del checkpoint.

**Precisión de la misma familia, que no es discrepancia:** el checkpoint habla de *«las DOS juezas
que teclean la frase a propósito, con acta»*. Hoy **7 ficheros de prueba** contienen el literal,
6 de ellos con marca de acta. Verificado: **los 7 ya lo contenían antes de la fase** (`git show
78821ff:<fichero>`), dentro de frases largas de fixture. Las dos que recibieron acta en la T2 son
dos; las otras cinco no son copias de la constante, son textos esperados completos. Queda dicho
para que el número no vuelva a leerse mal.

### 7.3 · 🔵 **«Los 17 nombres» del CENSO — son VEINTE**

La anotación que dejó la T2 en el cuerpo de su commit dice *«los **17** nombres que
`docs/CENSO-PRE-DESPLIEGUE.md` cita de la poda del A-7»*. Medida exacta de hoy —intersección de
los nombres a los que `1aa6dd6` quitó el `export` con los que el censo cita **entre comillas**—:
**20**. La lista completa va en §4.1.

**El trato no cambia** (registro congelado, no se toca); la cifra sí.

### 7.4 · Lo que se comprobó y **cuadra**

Para que la cobertura sea honesta, lo que NO salió discrepante: el recuento de los 38 por bloque y
por gravedad · la coherencia entre cada cabecera y su propia tabla · el 89 de la poda del A-7
(`grep -c "^-export "` → 89, exacto) · la forma del `git log` de la carpeta · las tres quietudes ·
las siete cifras vivas del §6.

---

## 8 · LO QUE NO SE PUEDE VERIFICAR DESDE AQUÍ — `NO CONSTA`

1. **La batería e2e completa** —y con ella la re-tirada de `pintura` en verde que la T3 dejó
   pendiente—. **No es un límite: es el orden.** La batería es el peaje del lote y va después de
   esta pieza. `NO CONSTA` hasta entonces.
2. **Los cinco `NO CONSTA` del despliegue** (`docs/DESPLIEGUE.md` §7): qué ejecuta el auto-deploy,
   con qué usuario, si pisa lo no versionado, cómo se reinicia el motor y si hay vuelta atrás. Solo
   se leen en el panel de Hostinger — **mano de Antonio**, y el papel ya deja el hueco y la
   instrucción.
3. **El efecto real del `TZ` en producción**, que la T1 dejó pendiente de la primera línea del log
   tras el push. Desde aquí no se observa: el bloque E descartó cinco vías.
4. **Las sesiones de mano de Antonio**: NVDA y teléfono físico (§7 del informe F). Siguen
   **PENDIENTE** en el §10 y no son verificables por software.
5. **Las ramas caras que el bloque E declaró no ejecutadas** (la renovación real del feed contra el
   NAP, `NAP_API_KEY` en su camino real, Node 22). Siguen sin ejecutarse, y siguen declaradas.

---

## 9 · LAS HORAS DE ESTA PIEZA

| Tramo | Reloj |
|---|---|
| Recuento de los 38 contra los informes y cruce cabecera↔tabla | 14:15 → 14:20 |
| Forma del `git log`, quietudes y registros congelados | 14:20 → 14:26 |
| Evidencia de hoy, hallazgo a hallazgo (los seis bloques) | 14:26 → 14:34 |
| Nacidos después, cifras vivas, ELI y las tres discrepancias | 14:34 → 14:42 |
| Redacción | 14:42 → cierre |
| **Total** | **≈ 40 min** de reloj de pared |

**Cualitativo:** la pieza se paga sola en la primera hora. Lo caro no fue verificar lo cerrado
—casi todo cae con un `grep` bien apuntado— sino **contar otra vez lo que ya estaba contado**: las
tres discrepancias salieron de ahí, y las tres son de cifra, no de fondo. Confirma la lección de
ZetaBus y le añade una: **el que escribe el checkpoint es el peor lector de su propio checkpoint**,
y por eso esta pieza tiene que volver a medir incluso lo que uno mismo midió ayer.
