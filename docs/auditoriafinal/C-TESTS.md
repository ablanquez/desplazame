# AUDITORÍA DE CIERRE · BLOQUE C — TESTS Y GUARDIANES

> **Qué es:** el mapa de hallazgos de las pruebas y los guardianes de Desplázame, segunda de
> las seis piezas de la Fase 7. Gobernado por `00-MARCO-AUDITORIA-DE-CIERRE.md` §4·C.
>
> **Fecha:** 2026-09-23 · **Commit auditado:** `2c4ebb5`
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Vale para `2c4ebb5` y para ese árbol.
> Si las pruebas cambian después, **se escribe otro informe**.
>
> **R1, en su forma de este bloque:** se ha roto para mirar, y **todo se ha restaurado**. Cada
> mutación: aplicar → correr **solo** lo que juzga esa pieza → apuntar veredicto → restaurar →
> **verificar `git status` limpio y `git diff` vacío antes de la siguiente**. Se hizo así en
> las **ocho**; ninguna quedó puesta. La verificación final: árbol limpio, y `%TEMP%` en su
> conjunto exacto (115 del acta + 26 fijos + 1 en cuarentena = 142, **0 fuera**), que es la
> prueba de que el perfil intruso de la M5 se retiró de verdad y no solo se dijo.
>
> **Lo único que se commitea es este informe.** Donde una mutación destapó un agujero, **eso
> es el hallazgo** y se ha dejado sin arreglar.

---

## 1 · COBERTURA DECLARADA (R2)

### El censo: qué hay que juzgar

| Familia | Piezas | Volumen |
|---|---|---|
| Unidad del motor | 45 ficheros `.spec.ts` | 662 tests, 82 suites |
| Unidad de la app | 25 ficheros `.spec.ts` | 775 tests |
| Suites e2e | 10 `.mjs` + `medir.mjs` (arnés) | ≈ 1.500 juezas |
| Guardianes ejecutables | `construir.mjs` (build + `--comprobar`), `comprobar-tipos.mjs`, `comprobar-arranque.mjs`, `mantener-datos.mjs` | 4 |
| Guardianes dentro del arnés | `terceros()`, `perfilesResiduales()` (acta + cuarentena), la jueza-censo de ⊘ | 3 |
| **Total de piezas censadas** | **85 ficheros + 4 guardianes** | |

### Cuáles son **de garantía crítica** — el censo del auditor

Criterio: *si esta pieza se afloja, ¿qué llega a producción sin que nadie lo vea?*

| Pieza | Qué garantiza | ¿Mutada? |
|---|---|---|
| `muralla-modos.spec.ts` | que los 160 trayectos de los 8 modos no se muevan (sha256) | **sí** ×2 |
| `rueda.spec.ts` ⭐ 11 y ⭐ 6 | las 391 rutas del peatón al byte, y las velocidades | **sí** |
| `empuje.spec.ts` | que empujar sea a paso de peatón | **sí** |
| `no-viaja.spec.ts` | que la intranet **no se despliegue** | **sí** |
| `construir.mjs --comprobar` | que el `dist` publicado sea el que dice su marca | **sí** |
| `comprobar-tipos.mjs` | que la interfaz compile, con censo de ficheros | **sí** |
| `huso.spec.ts` | que la hora sea la de Zaragoza corra donde corra | **sí** |
| `perfilesResiduales()` | que el arnés no deje perfiles ni crezca el conjunto | **sí** |
| la jueza-censo de ⊘ | que ningún salto se declare sin motivo firmado | **sí** (ver el matiz) |
| `m.esperar` | que una espera fallida **diga** en vez de colgarse | **sí** |
| `viaje-coche.spec.ts` (canon del 5b) | los rangos del aparcamiento, por sha del canon | **NO** → NO CONSTA |
| `aparcamotos.spec.ts`, `datos-de-la-rueda.spec.ts` (sellos sha del dato) | que el dato cocinado no cambie sin decirlo | **NO** → NO CONSTA |

### Lo que NO se ha mutado — **NO CONSTA explícito**

**«No se ha visto su rojo»** de: las **juezas del canon del 5b** (`viaje-coche.spec.ts:215-232`,
el sha del canon de rangos) · los **sellos de dato** (`aparcamotos.spec.ts:215`,
`datos-de-la-rueda.spec.ts:71`) · las **7 suites e2e** que no entraron en la M5/M6
(`esqueleto`, `identidad`, `pintura`, `dos-filas`, `yego`, `pantalla`, `proximo-bus`,
`bizi-y-resumen`) · los **guardianes de grep-de-fuente** (`pintura.spec.ts`, `tema.spec.ts`,
`chip.spec.ts`, `desvios.spec.ts`, `red-coche.spec.ts`) · `comprobar-arranque.mjs` ·
`mantener-datos.mjs`. De ninguno de ellos se afirma nada en este informe: **se leyeron, no se
rompieron**.

**Por qué se paró ahí:** cada mutación de e2e cuesta una tirada con Chrome y motor vivos
(19 s la más barata, ~35 min `pintura`). Se gastó el presupuesto en las piezas cuyo fallo
llegaría a producción sin verse, y se declara el resto.

### Limpieza del instrumento

El barrido del catálogo «tests que no prueban nada» señaló **7 tests sin aserción**. Cruzados a
mano, **los 7 aseveran**: el contador de llaves del instrumento se rompe con las expresiones
regulares multilínea que llevan `{` y `}` dentro. `expect(true)` / `assert.ok(true)`: **0**.
**El catálogo (c) no aporta ni un hallazgo, y el instrumento falló 7 de 7** — queda dicho.

---

## 2 · LA TABLA DE MUTACIONES

Ocho mutaciones, doce veredictos (una mutación puede juzgar a varias piezas a la vez).

| # | Pieza juzgada | Mutación aplicada | Qué se corrió | Veredicto |
|---|---|---|---|---|
| M1a | `huso.spec.ts` | `hoyEnGtfs` → `getUTC*` | `huso.spec` (5) | **NO PROBADA** — a esa hora en Madrid el día UTC y el civil coinciden: la mutación era inocua. **Rehecha** como M1b |
| M1b | `huso.spec.ts` | `hoyEnGtfs` devuelve **mañana** | `huso.spec` (5) | 🔴 **ESCAPADO** — 5/5 verdes |
| M1b | `trayecto` + `viaje-bus` + `festivo` | ídem | 90 tests | 🔴 **ESCAPADO** — 90/90 verdes |
| M1b | `muralla-modos.spec.ts` | ídem | 5 tests | ✅ **CAZADO** — 3 de 5 rojas |
| M2 | `no-viaja.spec.ts` | `app-panel` inyectado en el bundle del `dist` | 6 tests | ✅ **CAZADO** — 6/6 rojas |
| M3 | `construir.mjs --comprobar` | ídem (misma mutación) | el guardián | ✅ **CAZADO** — «EL SHA256 DEL BUNDLE NO CUADRA CON LA MARCA», salida **14** |
| M4 | `empuje.spec.ts` | `VELOCIDAD_EMPUJANDO_KMH` 5 → 6 | 5 tests | 🟠 **ESCAPADO** — 5/5 verdes |
| M4 | `rueda.spec.ts` ⭐ 6 | ídem | 19 tests | ✅ **CAZADO** — 1 roja |
| M4 | `muralla-modos.spec.ts` | ídem | 5 tests | ✅ **CAZADO** — 4 de 5 rojas |
| M4 | `rueda.spec.ts` ⭐ 11 (muralla del peatón) | ídem | — | **NO APLICA** — la constante es de la rueda, no del peatón; su verde es correcto |
| M5 | `perfilesResiduales()` | perfil intruso sembrado en `%TEMP%` | `creditos` (33 juezas, 19 s) | ✅ **CAZADO** — lo nombra y la suite sale **1** |
| M6 | `m.esperar` (en `moto.mjs`) | el hecho esperado nunca se cumple | `moto` | ✅ **CAZADO** — «⏱ TIEMPO AGOTADO esperando «…»: 5000 ms sin que se cumpla», salida 1 en 8 s (**con matiz**, ver C-4) |
| M7 | la jueza-censo de ⊘ | ⊘ sin firmar · total descuadrado · fecha vacía | sus **líneas reales rebanadas** | ✅ **CAZADO** — 3 mutaciones, 3 rojas; el caso honrado, verde |
| M8 | `comprobar-tipos.mjs` | tipo imposible en `tema.ts` | el guardián | ✅ **CAZADO** — nombra fichero, línea y `TS2322`; salida 1 |

**Recuento: CAZADO 8 · ESCAPADO 3 · NO PROBADA 1 · NO APLICA 1.**

⚠️ **El matiz de la M7, dicho y no escondido:** la mutación se aplicó sobre **las líneas reales
de `pintura.mjs`** (57–123), rebanadas del fichero en tiempo de ejecución por un arnés — no
sobre una copia a mano—, pero **no se corrió la suite entera con la mutación puesta**. Por
tanto el veredicto vale para **la jueza**, no para su integración en `pintura`. Correr
`pintura` mutada son ~35 minutos y se decidió gastarlos en otra parte.

**Restauración, verificada 8 de 8:** `git status --porcelain` vacío y `git diff` vacío tras
cada una, comprobado **antes** de aplicar la siguiente. La M5 no tocó el repositorio (sembró en
`%TEMP%`) y su restauración se verificó contando el directorio: **142 perfiles = 115 del acta +
26 fijos + 1 en cuarentena, 0 fuera del conjunto**.

---

## 3 · HALLAZGOS

### 🔴 C-1 · La decisión de QUÉ DÍA de horarios se sirve no la vigila nadie

| | |
|---|---|
| **Categoría** | Mutación escapada · garantía crítica sin red |
| **Ubicación** | `motor/src/trayecto.ts:250` (`hoyEnGtfs`) · guardián ausente en `huso.spec.ts`, `trayecto.spec.ts`, `viaje-bus.spec.ts`, `festivo.spec.ts` |
| **Gravedad** | 🔴 |
| **Coste** | Acotado (una jueza nueva) |

**La evidencia, medida.** Se cambió `hoyEnGtfs` para que devolviera **el día siguiente** —no un
matiz de huso: un día entero de diferencia, observable a cualquier hora— y:

```
huso.spec.ts .................... 5 tests, 5 pass, 0 fail
trayecto + viaje-bus + festivo .. 90 tests, 90 pass, 0 fail
```

**95 juezas verdes con el calendario de servicio desplazado un día.**

**Por qué importa.** `hoyEnGtfs` elige la fecha con la que se consulta el calendario GTFS: de
ella dependen qué líneas circulan y con qué horario. Un error ahí no da error — **da otro
autobús**. Y las cuatro suites que tocan el tema son precisamente las que uno abriría a
buscarlo.

**El contraste que el encargo pedía (¿`huso.spec` ata las dos mitades?): NO, y ahora está
medido.** Lo que `huso.spec` compra es la mitad que **pinta** (el instante guardado y el texto)
bajo `TZ=UTC`; la mitad que **decide** no pasa por ahí. Confirma el hallazgo A-1 del bloque A
con evidencia de mutación, que es más fuerte que la lectura.

**Quién sí lo caza, y por qué no basta:** `muralla-modos.spec.ts` se puso roja (3 de 5). Pero
la muralla **clava el reloj** a propósito (su jueza ⭐ 6 se llama *«el sello lo fija EL_RELOJ, no
el día en que se corra la suite»*): caza que **el código** cambie, **no** que el proceso corra
en otro huso. Para el fallo de producción del A-1 la muralla es ciega por diseño.

**Opciones, con su coste y lo que rompe — el auditor no elige:**

| | Qué | Coste | Qué rompe |
|---|---|---|---|
| 1 | Una jueza que llame a `hoyEnGtfs` con un instante fijo y `TZ=UTC` en proceso hijo, como hace `huso.spec` con la otra mitad | Acotado | Nada; la jueza nace roja si el A-1 no se arregla — **que es lo correcto** |
| 2 | Extender `huso.spec` con las cuatro funciones que deciden | Acotado | Convierte esa suite en la única puerta del tema (bien), y la alarga |
| 3 | Nada hasta que se decida el A-1 | — | Deja en producción una decisión sin red **y sin constancia de que no la tiene** |

---

### 🟠 C-2 · Cuatro de las diez suites cantan «✅ TODO VERDE» antes de juzgar el arnés

| | |
|---|---|
| **Categoría** | El sobre agregado que sale `ok` con algo caído |
| **Ubicación** | `app/e2e/identidad.mjs:577` vs `:593` · `creditos.mjs:359` vs `:375` · `dos-filas.mjs:242` vs `:258` · `bizi-y-resumen.mjs:484` vs `:500` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial (mover cuatro líneas) |

**La evidencia, salida literal de la M5** (con un perfil intruso sembrado):

```
✅ TODO VERDE
  ⚠️  NO se ha podido borrar …/perfil-medir-fijo-9350 — … Queda DICHO.
✖ ⭐ el conjunto de perfiles de %TEMP% no crece (…) — 1 PERFILES FUERA DEL CONJUNTO: …
salida 1
```

**Qué pasa.** En esas cuatro, el veredicto humano se imprime con el contador **antes** de
correr `perfilesResiduales()`, y la jueza parchea el código de salida después
(`if (!perf.bien) process.exitCode = 1`). Las otras seis lo hacen bien: o el guardián va antes
del banner (`esqueleto`, `pintura`) o su resultado entra por el mismo contador que lo imprime
(`moto`, `yego`, `pantalla`, `proximo-bus`).

**Por qué importa.** El código de salida **es correcto** —la batería lo lee y no se engaña—,
pero **el texto miente**: quien mira la cola de la salida, o busca el banner, lee «TODO VERDE»
en una tirada que ha fallado. Es exactamente el patrón que el marco llama *«el sobre agregado
que sale ok con todo caído»*, aquí en el instrumento que juzga a los demás.

---

### 🟠 C-3 · «Las jueces del empuje» no notan que cambie la velocidad de empujar

| | |
|---|---|
| **Categoría** | Guardián que no cumple la promesa de su cabecera |
| **Ubicación** | `motor/src/empuje.spec.ts` (5 tests) · la constante, `motor/src/rueda.ts:104` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial (una aserción) |

Con `VELOCIDAD_EMPUJANDO_KMH` movida de **5 a 6 km/h**, `empuje.spec.ts` —cuya cabecera dice
*«Quien empuja su vehículo es peatón, y con eso se le abre lo peatonal a paso de peatón»* y
explica que *«el empuje compite en tiempo dentro del mismo Dijkstra: 5 km/h contra 18 o 20»*—
se queda **5/5 en verde**. La caza `rueda.spec.ts ⭐ 6` y la caza la muralla (4 de 5), así que
**el sistema no está desprotegido**; lo que falla es que **la suite que lleva el nombre no
compra su número**. Quien la lea creerá que sí.

---

### 🟠 C-4 · Un reloj agotado mata la suite antes de su guardián — la ley de `bizi` no se extendió

| | |
|---|---|
| **Categoría** | Dependencia de entorno · fallo que no sigue contando |
| **Ubicación** | `app/e2e/moto.mjs` (y las demás que usan `m.esperar` sin envolver) · la implementación, `app/e2e/medir.mjs:945-953` |
| **Gravedad** | 🟠 |
| **Coste** | Acotado |

**Lo bueno, medido:** `m.esperar` **falla diciendo**. Con un hecho imposible:
`Error: ⏱ TIEMPO AGOTADO esperando «la aplicación montada: la fila de las seis familias»: 5000
ms sin que se cumpla`, con su fichero y su línea, y **salida 1 en 8 segundos** — no se cuelga.

**Lo que falta:** la excepción **aborta la suite**. `moto` no llegó a imprimir veredicto ni a
correr `perfilesResiduales()`. El 22/09 se legisló justo esto para `bizi-y-resumen` —*«la suite
falla DICIENDO y sigue contando — no muere con undefined»* (commit `0bcbe6c`)— y **la ley no se
extendió a las demás**. Consecuencia concreta: una tirada que muere así deja **perfiles de
Chrome sin contar** y, en la batería, una línea con 0 verdes y 0 rojas que solo el código de
salida desmiente.

---

### 🟠 C-5 · La batería de diez suites no tiene entrada en el repositorio

| | |
|---|---|
| **Categoría** | Configuración: qué corre y cómo |
| **Ubicación** | `package.json`, `app/package.json`, `motor/package.json` — ningún `script` las nombra |
| **Gravedad** | 🟠 |
| **Coste** | Acotado |

Las diez suites —el guardián más caro y más completo de la casa, ≈1.500 juezas— **no se lanzan
desde ningún script del repositorio**. El lanzador vive fuera, y cada suite recibe sus
argumentos de forma distinta: URL por `argv[2]` en siete, por `DESPLAZAME_URL` o `APP` en tres;
`argv[3]` es una **carpeta** en tres y **el nombre de un `.png`** en otras tres; `creditos` no
lo lleva. Quien clone el repositorio tiene la documentación, pero **no tiene el instrumento**:
lo reconstruye a mano, y equivocar una convención da fallos que parecen del producto
(`EISDIR` al guardar, `Illegal invocation` por apuntar a donde no hay nada).

⚠️ **Marcado como decisión de producto:** puede ser deliberado (un arnés de desarrollo, no de
CI). El auditor no lo decide; lo que sí señala es que **hoy no está escrito** en ninguna parte
del repositorio que esa decisión exista.

---

### 🔵 C-6 · Cinco guardianes protegen la FORMA del fuente, no el comportamiento

| | |
|---|---|
| **Categoría** | Guardianes de grep-de-fuente |
| **Ubicación** | `app/src/app/pintura.spec.ts`, `tema.spec.ts`, `chip.spec.ts` · `motor/src/desvios.spec.ts`, `red-coche.spec.ts` |
| **Gravedad** | 🔵 (reportado como el marco pide, **no** como defecto) |
| **Coste** | — |

Leen el fichero fuente (`readFileSync` de un `.ts`/`.css`) y comprueban que contenga —o no— un
texto. Compran **que la regla esté escrita**, no que el navegador la aplique. En esta casa está
bien acompañado: lo que esos guardianes afirman sobre el píxel lo vuelve a medir `pintura.mjs`
en Chrome. Se reporta para que nadie los lea como prueba de comportamiento.

---

### 🔵 C-7 · La M1a: una mutación puede ser inocua y parecer un escape

| | |
|---|---|
| **Categoría** | Método (para el checklist maestro) |
| **Gravedad** | 🔵 |

La primera mutación de `hoyEnGtfs` (`getDate()` → `getUTCDate()`) dejó 95 juezas verdes, y
habría pasado por ESCAPADO. **No lo era:** a esa hora, en Madrid, el día UTC y el civil son el
mismo, así que la mutación **no cambiaba nada**. Se rehízo desplazando un día entero. Queda
anotado como **NO PROBADA**, no como escape, porque llamarlo escape habría sido un hallazgo
falso — y con la firma de que lo caro de la mutación no es romper, es **comprobar que has roto
algo de verdad**.

---

## 4 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Por qué no es defecto |
|---|---|
| **0 tests saltados** en las 85 piezas (`.skip`, `skipIf`, `todo`) | No hay saltos acumulados: no existe la «ilusión de sistema bien probado» por esa vía. Lo que se declara se declara con `⊘` y lo vigila su censo |
| **0 `expect(true)` / `assert.ok(true)`** | — |
| Los 7 «tests sin aserción» del barrido | **Los 7 aseveran.** Fallo del instrumento (`http.expectNone` es una aserción; las regex multilínea rompen el contador de llaves) |
| `intranet/recuperado/*.spec.ts` (2 ficheros) que **nadie ejecuta** | Deliberado y documentado: están fuera de `app/src` para que ni el build ni los `tsconfig` los miren. Son evidencia con procedencia, no pruebas vivas |
| La muralla del peatón verde ante la M4 | **Correcto**: `VELOCIDAD_EMPUJANDO_KMH` es de la rueda; las 391 rutas del peatón no la usan |
| `pintura` con 3 `esperar` y 147 `dormir` | Deuda **ya declarada** en la cola del proyecto. Este bloque la **contrasta, no la re-descubre**: medido, seis suites no usan `esperar` ni una vez (57 `dormir` entre ellas) y solo `moto`, `yego` y `bizi-y-resumen` esperan al hecho. La cifra declarada («las otras siete duermen») **cuadra** |
| Los 3 `⊘` de `yego` y la cuarentena del 9790 | Vigilancias vivas del §3 del marco: contrastadas, verdes, sin novedad |

---

## 5 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **La contraprueba incorporada, y nacida roja.** `no-viaja.spec.ts` no solo comprueba que el
   `dist` está limpio: tiene **tres juezas que siembran** un dist con el visor, con el panel y
   con el mapa de capas y exigen el rojo. El guardián **se prueba a sí mismo** en cada tirada.
   Es la pieza mejor construida que ha visto esta auditoría.
2. **El guardián que se apoya en otro guardián.** `no-viaja` invoca a `construir.mjs
   --comprobar` y comprueba su salida literal: cuando la M2 metió un byte en el bundle, la
   primera roja fue *«expected … to contain "sin rastro de intranet"»*. Dos redes independientes
   cazando la misma piedra.
3. **`huso.spec.ts` y su proceso hijo.** *«Una juez que corre en el mismo huso que el código que
   juzga no vigila el huso»*: por eso lanza un hijo con `TZ=UTC` y **lo primero que compra es
   que el reloj falso ha entrado**. El sanity anti-vacío hecho bien. (Que cubra media casa es
   el C-1; el instrumento es ejemplar.)
4. **Las murallas de sha con su cláusula de uso escrita.** *«Esta juez DEBE ponerse roja el día
   que alguien cambie un modo a propósito. Cuando pase, se recalcula y se cambia el número con
   la razón escrita — nunca porque estorbe.»* Un candado que dice cuándo se abre no es un
   candado sobre dato exacto: es un acta.
5. **Las murallas congelan lo vivo en `null` a propósito** —sin BiZi, sin YeGo, sin desvíos, con
   el reloj clavado—, así que la cifra depende del código y del dato del repositorio, **no de
   internet**. Es la respuesta correcta al *«e2e contra tercero real donde un doble daría el
   mismo verde»*.
6. **`m.esperar` falla diciendo**: nombra el hecho esperado, el tope y el sitio. Un tope que
   dice *qué* no ocurrió vale diez veces más que uno que dice «timeout».
7. **El guardián que declara su techo.** `perfilesResiduales` no exige lo imposible (borrar lo
   que Windows no deja): **vigila que el conjunto no crezca**, con acta de 115, censo de
   puertos y cuarentena — cada entrada con autorización fechada y su porqué. Una jueza que
   siempre estaría roja deja de mirarse; ésta se cambió de vara **sin aflojar el espíritu**.
8. **La jueza-censo de ⊘ ata el motivo, no la cantidad**, para no aflojarse sola cuando se
   añada una pantalla. Y su guarda muerde por tres lados (motivo sin firmar, total
   descuadrado, fecha vacía): 3 de 3 en la mutación.
9. **Cero saltos en 85 piezas.** El *smell* «Ignored Test» aquí no existe.

---

## 6 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

1. **C-1** primero, y **junto al A-1**: son el mismo asunto visto desde dos sitios. Decidir el
   A-1 sin poner la jueza dejaría el arreglo sin red.
2. **C-2** después: cuatro líneas movidas, y quita una mentira del instrumento que juzga a los
   demás.
3. **C-4**: extender a las demás suites la ley que ya tiene `bizi`. Acotado, y hace que una
   tirada muerta siga contando y llegue a su guardián.
4. **C-3**: una aserción en `empuje.spec.ts`. Trivial.
5. **C-5**: **necesita parlamento** antes que código — primero decidir si el arnés es de
   desarrollo o de CI.
6. **C-6**, **C-7**: no son deuda; son constancia.

### ⛔ Qué NO tocar

- **Las murallas de sha no se «flexibilizan».** Su valor es exactamente que duelen. Y su
  cabecera ya dice cuándo se recalculan y con qué requisito.
- **`perfilesResiduales` no vuelve a exigir el borrado.** Ese cambio de vara está razonado y
  fechado; deshacerlo devuelve una jueza roja para siempre.
- **Los guardianes de grep-de-fuente no se retiran** (C-6): son baratos y están acompañados por
  medición real en Chrome.
- **`intranet/recuperado/*.spec.ts` no se conecta a ninguna tubería.** Son evidencia.
- **No se añaden reintentos ni se suben topes** en el arnés para «estabilizar»: hoy no hay
  ninguno escondiendo nada, y sería el camino corto para que un rojo real se volviera
  intermitente.

---

## 7 · PARA EL CHECKLIST MAESTRO (en genérico)

1. **Antes de cantar ESCAPADO, demuestra que la mutación cambia algo.** Una mutación puede ser
   inocua en el entorno donde corres (misma hora, misma zona, mismo dato) y el verde entonces
   no dice nada. Verdicto **NO PROBADA**, y se rehace más agresiva.
2. **Mutar la constante que da nombre a una suite.** Si «las jueces del empuje» no se enteran de
   que cambia la velocidad de empujar, ninguna cabecera vuelve a leerse igual.
3. **Comprobar dónde se imprime el veredicto respecto de dónde corren los guardianes.** Un
   banner impreso antes del último guardián miente aunque el código de salida acierte.
4. **Un tope agotado debe decir QUÉ no ocurrió, y además dejar seguir contando.** Fallar
   diciendo y morir son dos cosas distintas: la segunda se lleva por delante a los guardianes
   que van después.
5. **Preguntar si el arnés más caro se puede lanzar desde el repositorio.** Un instrumento que
   solo existe en la máquina de quien lo escribió no es del proyecto.
6. **Un guardián de instantes/zonas debe cubrir las dos mitades: la que PINTA y la que
   DECIDE.** La primera se nota a ojo y suele estar atada; la segunda cambia el resultado sin
   cambiar la apariencia.
7. **Una muralla de sha con el reloj clavado caza cambios de CÓDIGO, no de ENTORNO.** Decirlo
   en su cabecera evita que se la crea más de lo que promete.
8. **Clasificar los guardianes de grep-de-fuente como «forma, no comportamiento»** y comprobar
   que algo más mide el comportamiento.
9. **Restaurar y VERIFICAR la restauración entre mutaciones**, con el estado del repositorio y
   también el del entorno que se haya tocado (ficheros temporales, perfiles, cachés). «Lo
   borré» no es una comprobación: contar el directorio, sí.

---

## 8 · LAS HORAS DE ESTE BLOQUE

| Tramo | Reloj |
|---|---|
| Censo de piezas y elección de las críticas | 18:58 → 19:02 |
| Las ocho mutaciones, con restauración verificada entre ellas | 19:02 → 19:09 |
| Barridos del catálogo, entorno y configuración | 19:09 → 19:12 |
| Redacción del informe | 19:12 → cierre |
| **Total del bloque C** | **≈ 50 min** de reloj de pared |

**Cualitativo:** salió **más barato que el A** y con más hallazgos por minuto, al revés de lo
que el estreno de ZetaBus pronosticaba — porque **la mutación va directa**: se rompe, se corre
una pieza y el veredicto es binario, sin la fase de limpiar el instrumento que se llevó la
mitad del bloque A. Lo caro fue elegir **qué** mutar (el censo de críticas) y una mutación
fallida que hubo que rehacer (M1a). Las e2e son el sumidero: la más barata cuesta 19 segundos y
`pintura` treinta y cinco minutos, y por eso siete suites quedan en NO CONSTA declarado.
