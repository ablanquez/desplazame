# AUDITORÍA DE CIERRE · BLOQUE A — CÓDIGO

> **Qué es:** el mapa de hallazgos del código ejecutable de Desplázame, primera de las seis
> piezas de la Fase 7. Gobernado por `00-MARCO-AUDITORIA-DE-CIERRE.md`, del que no se sale.
>
> **Fecha:** 2026-09-23 · **Commit auditado:** `78821ff` · **Árbol:** limpio al abrir y al
> cerrar; la única escritura de este bloque es este fichero.
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.** Lo que dice vale para `78821ff` y para
> ese árbol. Si el código cambia después, **se escribe otro informe**; éste no se corrige, no
> se actualiza y no se tacha. La séptima pieza (`VERIFICACION.md`) es la que vuelve a correr
> la evidencia sobre el árbol de entonces.
>
> **R1 cumplida:** no se ha arreglado nada. Ni un typo, ni un import, ni un export muerto.

---

## 1 · COBERTURA DECLARADA (R2)

### Lo que entra, y cuánto es

| Pieza | Total | Revisado | Cómo |
|---|---|---|---|
| Fuentes `.ts` de `app/src` (sin `*.spec.*`) | 24 | 24 | censo automático + lectura dirigida |
| Fuentes `.ts` de `motor/src` (sin `*.spec.*`) | 52 | 52 | ídem |
| Fuentes `.ts` de `tipos/src` | 1 | 1 | ídem |
| **Total de fuentes** | **77** (≈ 37.200 líneas) | **77** | ver «el método», abajo |
| Guiones (`scripts/`, `app/scripts/`, `motor/arranque.cjs`) | 6 | 6 | barridos; lectura dirigida en 2 |
| Manifiestos (`package.json` ×4) | 4 | 4 | declaradas vs usadas, en los dos sentidos |
| Configuración con lógica (`angular.json`, 5 `tsconfig`) | 6 | 6 | parcial — ver el hueco declarado |

**El método, dicho sin adornos:** las 77 fuentes han pasado **todas** por los barridos
automáticos (nueve, listados en § 6); de ellas se han **leído a mano** las regiones que los
barridos señalaron, más las cabeceras de los 14 ficheros que concentran los hallazgos.
**No se han leído las 37.200 líneas una por una**, y este informe no lo pretende.

### Lo que NO entra (declarado, no omitido)

| Fuera de A | Cuántos | Va a |
|---|---|---|
| `*.spec.ts` / `*.spec.mjs` | 33 ficheros | bloque **C** |
| Todo `app/e2e/` (10 suites + `medir.mjs`) | 11 ficheros | bloque **C** |
| Plantillas `.html` y textos de usuario | 11 | bloque **B** |
| Hojas `.css` | 12 | bloque **B** |
| Documentación y comentarios-como-documento | — | bloque **D** |
| Variables de entorno, logs, `app/dist/` | — | bloque **E** (el `dist` es artefacto generado: no se audita como fuente) |

### Los huecos, con su porqué — **NO CONSTA**

1. **Código inalcanzable:** `NO CONSTA`. No se ha hecho análisis de alcanzabilidad; TypeScript
   con `strict` caza el caso trivial, pero una rama viva-pero-imposible por invariante de
   datos **no se ha buscado**. Requiere instrumento propio.
2. **`package-lock.json`:** `NO CONSTA`. Se ha usado para nada; no se han auditado
   integridad, duplicados ni avisos de seguridad. Es candidato natural del bloque **E**.
3. **Configuración:** revisadas las piezas **con lógica** que tocan al producto (presupuestos,
   `fileReplacements`, `importHelpers`, `strict`). **No** se ha auditado el resto de
   `angular.json` ni las opciones de compilador una por una.
4. **Uso dinámico:** los barridos casan **nombres**. Un export invocado por cadena construida
   en tiempo de ejecución **no lo vería nadie**; en esta casa no se ha encontrado ningún
   indicio de ese patrón, pero no se ha demostrado su ausencia → `NO CONSTA`.
5. **El huso de producción:** el hallazgo A-1 depende de en qué zona horaria corre el proceso
   en Hostinger. **Desde aquí no se puede mirar** → `NO CONSTA`, y se declara como parte del
   hallazgo. Es del bloque **E** comprobarlo.

### Limpieza del instrumento (la lección de ZetaBus)

El primer barrido de exports dio **165 «huérfanos»**. Cruzados a mano, **161 eran del
instrumento**: 87 son tipos que su propio módulo usa —contrato exportado, no código muerto— y
74 son valores que solo usa su fichero. **Sobrevivieron 4.** El barrido de números mágicos dio
doce candidatos y **los doce eran coincidencias** (años, topes de milisegundos con sentidos
distintos): se descarta entero y no aporta ni un hallazgo. Queda dicho para que nadie lo
repita esperando otra cosa.

---

## 2 · HALLAZGOS

### 🔴 A-1 · La mitad que DECIDE la hora no está atada al huso de Zaragoza; la que PINTA sí

| | |
|---|---|
| **Categoría** | Fechas y zonas |
| **Ubicación** | `motor/src/trayecto.ts:250-252` · `motor/src/viaje-bus.ts:296-312` · `motor/src/viaje-coche.ts:953-958` · `motor/src/festivo.ts:444-446` |
| **Gravedad** | 🔴 (rompe **o miente** — el comentario afirma algo que el código no garantiza) |
| **Coste** | Acotado para atarlo; **tanda propia** si además se decide qué hacer con las juezas |

**Qué es.** `reloj.ts` existe precisamente para esto: nació el 8/09 de un fallo que *«el
portátil no podía ver»* —en producción, UTC, el minuto vivo del poste enseñaba «13:53» a quien
vive a las 15:53— y fija la doctrina: **zona IANA, nunca desfase fijo**, `ZONA_DE_ZARAGOZA =
'Europe/Madrid'`. Y `huso.spec.ts` la vigila lanzando un hijo con `TZ=UTC`.

Pero esa vigilancia cubre **la mitad de la pantalla** (el instante guardado y el texto
pintado). **La mitad que decide no pasa por `reloj.ts`:**

```
trayecto.ts:250   hoyEnGtfs(cuando)      → cuando.getFullYear()/getMonth()/getDate()
viaje-bus.ts:311  segundosDelDia(cuando) → cuando.getHours()*3600 + getMinutes()*60 + …
viaje-coche.ts:953 la franja de la ZBE   → cuando.getDay(), cuando.getHours()
festivo.ts:444    los días siguientes    → new Date(hoy.getFullYear(), …)
```

Los cuatro leen **el reloj del proceso**, y sus propios comentarios dicen *«en hora LOCAL, no
UTC: el día de servicio es el del reloj de la calle»*. Eso **solo es cierto si el proceso corre
en hora de Madrid**, y **nadie lo fija**: no hay `TZ` en `motor/arranque.cjs` (17 líneas), ni
en los `package.json`, ni en ningún guion de despliegue (comprobado con `grep`).

**Por qué importa.** `hoyEnGtfs` elige **qué día del calendario GTFS se sirve** y
`segundosDelDia` **desde qué segundo se busca el próximo autobús**. Con el proceso en UTC y
horario de verano, `segundosDelDia` va **dos horas atrasado todo el día**, y `hoyEnGtfs`
devuelve **el día anterior** entre las 00:00 y las 02:00 de Zaragoza — justo cuando cambia el
calendario de servicio (sábado→domingo, víspera de festivo). La ZBE de `viaje-coche` decide su
franja horaria con el mismo reloj.

**Lo que NO se afirma.** En qué huso corre hoy el proceso en Hostinger: **`NO CONSTA`** desde
este bloque. Si corre en Madrid, el producto acierta **por coincidencia de configuración**, que
es exactamente la forma del fallo del 8/09. La señal que el marco pide —*«la incoherencia entre
ficheros es la señal»*— está: dos definiciones de «hoy» en la misma casa, y la buena sin usar
donde más se decide.

**Opciones, con su coste y lo que rompe cada una — el auditor no elige:**

| | Qué se hace | Coste | Qué rompe |
|---|---|---|---|
| **1** | Fijar `TZ=Europe/Madrid` al arrancar el proceso | Trivial (una línea en el lanzador) | Nada del código; pasa a depender del **despliegue**, que es lo que hoy no está escrito. Hace ciertos los comentarios sin tocarlos |
| **2** | Que los cuatro pasen por `reloj.ts` (piezas de `Intl` en `ZONA_DE_ZARAGOZA`) | Acotado: 4 funciones y sus llamantes | Hay que revisar cada jueza que hoy construye fechas con `new Date(a, m, d)` local; algunas cambiarán de valor esperado. Independiente del despliegue |
| **3** | Las dos: atar el código **y** fijar `TZ` | Acotado + trivial | Cinturón y tirantes; deja una de las dos sin vigilar por la otra |
| **4** | Dejarlo y **declararlo** con un acta y una jueza que fije el huso esperado | Trivial | No arregla; convierte una suposición en un requisito escrito de operación |

---

### 🟠 A-2 · El comportamiento de la app depende de una frase que el motor reteclea tres veces

| | |
|---|---|
| **Categoría** | La copia a mano (fuente única), a través de la frontera de proceso |
| **Ubicación** | `app/src/app/buscador.ts:79` y `:2032` · `motor/src/estacion-viva.ts:96` · `motor/src/poste-vivo.ts:87` · `motor/src/viaje-bizi.ts:223` |
| **Gravedad** | 🟠 |
| **Coste** | Acotado (la constante existe; falta mudarla al contrato) |

**Qué es.** La app tiene su constante —`MARCA_DE_DISPONIBILIDAD = 'disponibilidad no
verificada'`— y **decide con ella**: `buscador.ts:2032` hace
`a.texto.includes(MARCA_DE_DISPONIBILIDAD)` para colgar la nota junto al hito. El motor escribe
esa misma frase **a mano en tres sitios**, y en uno lo dice: *«Las mismas palabras que el BiZi
—«disponibilidad no verificada»— porque es la misma condición»*.

**Por qué importa.** Es una atadura **silenciosa y entre procesos**: si alguien afina la
redacción del motor —cosa que el bloque B puede pedir— la app **deja de colgar la nota y nada
se pone rojo**, porque no hay ninguna jueza que ate las cuatro copias. Es el patrón que el
marco llama *«un test de "este valor es UNO" solo vale si ata TODAS las copias»*, aquí sin
siquiera el test. Y hay casa para la constante: `@desplazame/tipos` es el contrato que ya
comparten los dos lados.

⚠️ **La redacción es del bloque B; la atadura es de A.** Aquí no se propone cambiar ni una
palabra del texto.

---

### 🟠 A-3 · `@desplazame/tipos` se usa en 20 ficheros de la app sin que la app lo declare

| | |
|---|---|
| **Categoría** | Dependencias usadas-sin-declarar (el caso peor del marco) |
| **Ubicación** | `app/package.json` (dependencias: `@angular/*`, `leaflet`, `rxjs`, `tslib` — falta) · 20 ficheros de `app/src` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial (una línea) |

**Qué es.** `motor/package.json` **sí** declara `"@desplazame/tipos": "*"`. `app/package.json`
**no**, y sin embargo 20 fuentes de `app/src` lo importan. Funciona porque los *workspaces* de
npm lo izan al `node_modules` de la raíz.

**Por qué importa.** El marco lo llama *«transitivas: el peor caso»* por una razón concreta:
la app compila y arranca por una **propiedad del monorepo**, no por un contrato declarado. El
día que `app/` se instale, se publique o se construya fuera de este *workspace* —o que la raíz
reordene sus paquetes— la resolución desaparece sin que nada lo hubiera avisado. Y la
declaración es justo lo que documenta que la interfaz depende del contrato.

---

### 🟠 A-4 · `textoDeAparcarEnParking` está muerta, y su frase vive duplicada en cuatro sitios

| | |
|---|---|
| **Categoría** | Código muerto + copia a mano |
| **Ubicación** | `motor/src/viaje-coche.ts:1031-1036` (muerta) · `:1105-1114` (la viva, por partes) |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

**Qué es.** El hito del aparcamiento público lo construye `hitoDeAparcarEnParking`
(privada, `:1105`) **por partes** —`accion` + `texto` + `via` + `texto`— y compone su `texto`
uniéndolas. Justo encima, `textoDeAparcarEnParking` (exportada, `:1031`) arma **la misma frase
en plano** y **no la llama nadie**: 0 usos en todo el repositorio, pruebas incluidas.

**Por qué importa.** No es solo un export muerto: es una **segunda redacción de una frase que
ve el usuario**. Las dos dicen hoy lo mismo; el día que se toque la viva, la muerta queda como
versión alternativa plausible esperando a que alguien la use. Y las juezas que la comprueban
—`viaje-coche.spec.ts:1217`, `buscador.spec.ts:1094`— **retecleana la frase entera a mano** en
vez de pedírsela a la función, con lo que hay **cuatro copias** de la misma oración.

⚠️ **Marcado como posible decisión de producto:** puede que el hito en plano se exportara para
un consumidor previsto que no llegó. El auditor no lo decide.

---

### 🟠 A-5 · `TIPOS_CON_FACTOR` existe «para que las pruebas lo nombren» y ninguna prueba lo nombra

| | |
|---|---|
| **Categoría** | ⭐ Declarado y nunca cableado |
| **Ubicación** | `motor/src/red-rueda.ts:972` |
| **Gravedad** | 🟠 |
| **Coste** | Trivial |

**Qué es.** La línea es `export const TIPOS_CON_FACTOR = Object.keys(FACTOR_DE_TRAFICO);` y su
comentario dice para qué: *«Los tipos con factor, para que las pruebas puedan nombrarlos sin
copiarlos»*. **Ninguna prueba lo usa** (0 referencias). Y la prueba que sí toca esa tabla
—`tipos-de-ruta.spec.ts:107`— **copia el acceso a mano**: `FACTOR_DE_TRAFICO[via] ?? 0`.

**Por qué importa.** Es el caso exacto que el marco marca con estrella, y con un agravante: no
es una constante olvidada, es **una promesa de guardián que no existe**. Quien lea esa línea
creerá que las copias están atadas. No lo están.

---

### 🔵 A-6 · Dos funciones exportadas más, sin un solo uso

| | |
|---|---|
| **Categoría** | Código muerto (huérfano) |
| **Ubicación** | `motor/src/rueda.ts:372` (`factorDe`) · `motor/src/viaje-bus.ts:419` (`rodandoEntre`) |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

`factorDe(highway)` devuelve `FACTOR_DE_TRAFICO[highway] ?? 1`; los cuatro consumidores reales
de la tabla la indexan directamente. `rodandoEntre` suma saltos en O(n) y **está justo debajo
de `acumuladoDe`**, que resuelve lo mismo en O(1) por resta y cuyo comentario explica por qué
—*«es lo que permite comparar dos subidas distintas sin recorrer los saltos otra vez»*—:
parece el antecesor que sobrevivió a su relevo.

⚠️ **Marcado:** un huérfano puede ser **cabo documentado**. Ninguno de los dos lleva nota que
lo diga, pero eso lo decide quien los escribió, no el auditor.

---

### 🔵 A-7 · 74 valores exportados que solo usa su propio fichero

| | |
|---|---|
| **Categoría** | Superficie pública mayor de la necesaria |
| **Ubicación** | 74 sitios; muestra: `app/src/app/iconos.ts:255,286,288,290,293,295` · `app/src/app/mapa.ts:439` · `app/src/app/buscador.ts:156,166` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial uno a uno; **acotado** los 74 |

**Por qué importa poco y aun así se reporta:** no rompen nada y no cuestan bytes (el *bundler*
los elimina). Lo que cuestan es **lectura**: un `export` dice «esto lo usa alguien de fuera», y
en 74 casos no es verdad. Muchos están citados en `docs/CENSO-PRE-DESPLIEGUE.md`, así que
retirarlos tocaría ese documento —lo cual es asunto del bloque **D**—.

---

### 🔵 A-8 · Dos definiciones de «día» conviven, y la segunda está declarada

| | |
|---|---|
| **Categoría** | Fechas y zonas |
| **Ubicación** | `motor/src/registro.ts:60-62` y `:85` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial (o ninguno, si se decide que está bien) |

`registro.ts` usa `toISOString().slice(0, 10)` —el patrón que el marco prohíbe **como «hoy»**—
para nombrar el fichero de log y para calcular el corte de retención. **No es el caso
prohibido:** lo declara (*«El día de una fecha en UTC»*), lo aplica **a los dos lados de la
comparación** y `motor/README.md:73` ya avisa de que *«el nombre del fichero es un día UTC, y el
nombre no lo dice»*. Se reporta porque **es la segunda definición de día de la casa** y su
consecuencia conviene escrita: con el proceso en hora de Madrid, una línea escrita entre las
00:00 y las 02:00 cae **en el fichero del día anterior**. Toca al A-1: si se fija `TZ`, esto
cambia de comportamiento.

---

### 🔵 A-9 · `buscador.ts`, 3.771 líneas — **y se reporta para decir que NO se toque**

| | |
|---|---|
| **Categoría** | Estructura, con contrapeso |
| **Ubicación** | `app/src/app/buscador.ts` |
| **Gravedad** | 🔵 |
| **Coste** | — |

Es el fichero más grande del proyecto y el marco pide mirarlo. **El contrapeso manda aquí:**
el producto es *una sola pantalla* por carta fundacional, y ese fichero **es** esa pantalla —
formulario, modos, resultado, mapa, pestañas y sus estados. Partirlo repartiría un estado
compartido entre piezas que tendrían que volver a hablarse: sería **peor**. Se deja escrito
para que la próxima lectura no lo proponga como mejora evidente.

---

### 🔵 A-10 · Una aserción que estrecha menos de lo que promete

| | |
|---|---|
| **Categoría** | Tipos |
| **Ubicación** | `app/src/app/buscador.ts:1350-1353` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

`loQueDiceElFallo` comprueba `typeof cuerpo === 'object'` y `'clase' in cuerpo`, y entonces
hace `return cuerpo as DistintivoConsultado`. La guarda mira **un** campo de cuatro: un cuerpo
de error con `clase` pero sin `texto` pasaría y la pantalla pintaría un hueco. El dato viene de
**nuestro propio motor**, así que el riesgo es bajo y la mitigación existe (la guarda parcial);
se reporta como el marco pide: *«aserciones sobre dato PROPIO reportadas con su mitigación»*.

---

## 3 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Dónde | Por qué NO es defecto |
|---|---|---|
| `intranet/recuperado/` — 7 ficheros fuera de la construcción | `intranet/` | **Evidencia conservada, y probada**: `PROCEDENCIA.md` documenta que salieron de `6327e45^` y que **el sha1 del blob coincide** con el recuperado. Está fuera de `app/src` a propósito y se comprobó que los `tsconfig` no lo miran. Es el ejemplo de manual de «un huérfano puede ser evidencia conservada» |
| 7 `catch` sin sentencias | `tema.ts:71` · `feed.ts:275,307` · `registro.ts:91,114,127,151` | **Los siete llevan escrito su porqué y qué se degrada**: almacenamiento que lanza en modo privado, temporal que no se deja borrar, log que se pierde. Ninguno es un `catch` mudo |
| `void fetch(...)` ×2 | `panel.ts:233,251` | Ambos con `.catch` y con acta: uno lleva el fallo a la pantalla, el otro calla **a propósito** y lo explica |
| `tslib`, `@angular/compiler-cli`, `@types/leaflet`, `jsdom` «declaradas y no vistas» | `app/package.json` | **Convenciones del framework**: `importHelpers: true` está en `app/tsconfig.json:21` (eso es `tslib`), los otros tres los consume la tubería de Angular y de las pruebas por su nombre, no por `import` |
| 87 tipos exportados «sin usuario externo» | varios | Son **el contrato del módulo**: los usa su propio fichero para tipar lo que exporta |
| 76 aserciones `as X` | 29 ficheros | Las de terceros (`bizi.ts:240`, `avanza.ts:119,395`, `yego.ts:270`) **aseveran a una forma con campos `unknown`/opcionales y estrechan después en tiempo de ejecución**. Las demás son `as Vertice` sobre pares `[lat, lon]` propios |
| Números repetidos en 3+ ficheros | 12 casos | Coincidencias (años, topes de ms con sentidos distintos). Barrido descartado entero |

---

## 4 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **Cero `any`, cero `@ts-ignore`, cero `eslint-disable`** en 37.200 líneas de fuente. No es
   suerte: es `strict` sostenido sin válvulas de escape. Lo primero que se mira en una
   auditoría y aquí no dio nada.
2. **La frontera con terceros, hecha como manda el manual.** Los cuatro puntos donde entra
   dato ajeno (BiZi, Avanza ×2, YeGo) siguen el mismo patrón: `as` a una forma cuyos campos
   son `unknown` u opcionales, **guardas de `typeof`/`Array.isArray` después**, y `null` ante
   cualquier sorpresa. Y `null` significa **«no lo sabemos»**, distinto de «no hay» — dicho en
   el propio comentario de `leerRespuesta`.
3. **Ningún `catch` mudo.** Siete tragan la excepción y **los siete escriben qué se pierde y
   por qué eso es mejor que caerse**. Es la diferencia entre degradar y esconder.
4. **Cero inyección de HTML** —ni `innerHTML`, ni `bypassSecurityTrust`, ni
   `insertAdjacentHTML`— y **cero secretos en fuente**. El único fichero que parecía tenerlos
   hablaba de *design tokens*.
5. **`reloj.ts` y su jueza de huso en proceso hijo.** Aunque A-1 diga que cubre media casa, el
   instrumento es ejemplar: *«una jueza que corre en el mismo huso que el código que juzga no
   vigila el huso»*, y por eso lanza un hijo con `TZ=UTC`. Esa frase debería viajar a la guía.
6. **Los porqués de las decisiones negativas están escritos donde se tomarían al revés.** El
   carril bici cerrado al peatón, la excepción de los menores no implementada, los dos PAROs
   del RGC: cada uno vive **junto a la línea** que alguien cambiaría, no en un documento aparte.
7. **`intranet/recuperado/` como forma de guardar un cabo:** sacar los ficheros de la historia,
   demostrar con el sha1 que son los mismos, dejarlos fuera de la construcción y escribir el
   parlamento pendiente. Es mejor que un `TODO`.

---

## 5 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

**Primero, porque decide comportamiento:**
1. **A-1** (el huso). Antes de nada porque de él depende A-8, y porque las opciones 1 y 2
   llevan a sitios distintos: una compra operación, la otra código. **Necesita parlamento.**

**Después, baratos y con consecuencia real:**
2. **A-3** (declarar `@desplazame/tipos`): una línea, riesgo cero.
3. **A-5** (`TIPOS_CON_FACTOR`): o se cablea en la prueba que hoy copia el acceso, o se retira.
   Lo que no puede quedarse es la promesa sin cumplir.
4. **A-2** (la frase compartida): mudar la constante al contrato y que el motor la use.
5. **A-4** (la función muerta y su frase): retirar o cablear — **con Antonio**, que la frase es
   de usuario.

**Al final, o nunca:**
6. **A-6**, **A-7**, **A-10**: cosméticos. A-7 arrastra al bloque D, así que conviene **después**
   de D, no antes.

### ⛔ Qué NO tocar

- **`buscador.ts` no se parte** (A-9). Está grande porque el producto es una pantalla.
- **Los 7 `catch` documentados no se «arreglan»**: hacerlos relanzar rompería justo lo que
  protegen.
- **`intranet/recuperado/` no se limpia.** Es evidencia con procedencia probada, y su fase 2
  está esperando parlamento.
- **Las aserciones `as Vertice`**: cambiarlas por guardas metería validación en bucles que
  recorren decenas de miles de puntos, por dato propio y de forma conocida. Sería peor.
- **`registro.ts` no se «corrige» a día civil por su cuenta** (A-8): depende de lo que se
  decida en A-1, y hoy es coherente consigo mismo.

---

## 6 · PARA EL CHECKLIST MAESTRO (en genérico, para cualquier proyecto)

1. **Cruzar cada export contra su uso real, y luego LIMPIAR EL BARRIDO por causa.** Separar
   «tipo que usa su propio módulo» (contrato) de «valor sin usuario externo» (superficie de
   más) de «nadie lo nombra, ni su fichero» (muerto). Sin esa separación, el 97 % del
   resultado es ruido del instrumento — aquí, 161 de 165.
2. **Buscar la constante cuyo comentario diga «para que las pruebas la usen», y comprobar que
   alguna prueba la usa.** Una promesa de guardián incumplida es peor que no tenerlo.
3. **Cuando un proceso decide con una cadena que otro proceso escribe, exigir la constante
   compartida.** El acoplamiento entre procesos por literal no lo caza ningún compilador.
4. **Comparar las dependencias importadas contra las DECLARADAS en el manifiesto de cada
   paquete, no del monorepo.** Lo que funciona por izado deja de funcionar al mudarse.
5. **Si el proyecto tiene un módulo que resuelve la hora/zona, listar TODOS los lectores de
   reloj y comprobar cuáles pasan por él.** La mitad que pinta suele estar atada; la que
   decide, no. Y preguntar siempre: **¿quién fija la zona del proceso, y dónde está escrito?**
6. **Ante un `toISOString().slice(0,10)`, no cantar victoria: mirar si está declarado y si se
   aplica a los dos lados de la comparación.** Puede ser una convención legítima.
7. **Todo `catch` que no relanza debe escribir qué se pierde.** El criterio no es «no tragar»,
   es «no tragar en silencio».
8. **Reportar también dónde agrupar sería PEOR**, con su razón. Si no, la próxima auditoría
   propondrá el refactor que ésta descartó.
9. **Distinguir el huérfano-basura del huérfano-evidencia** antes de proponer borrar: si trae
   procedencia y prueba de identidad, es un cabo, no un descuido.

---

## 7 · LAS HORAS DE ESTE BLOQUE

*(La deuda que ZetaBus dejó: allí no se registraron. Aquí sí.)*

| Tramo | Reloj |
|---|---|
| Lectura del marco e inventario de alcance | 18:27 → 18:37 |
| Barridos (9) y limpieza del instrumento | 18:37 → 18:47 |
| Lectura dirigida y verificación de cada hallazgo | 18:47 → 18:52 |
| Redacción del informe | 18:52 → cierre |
| **Total del bloque A** | **≈ 1 h 5 min** de reloj de pared |

**Cualitativo, para dimensionar los siguientes:** lo caro **no** fue barrer —los nueve barridos
son minutos— sino **limpiar el barrido** y **verificar cada candidato antes de llamarlo
hallazgo**. El del huso costó cuatro comprobaciones encadenadas (¿hay módulo de zona? ¿quién lo
usa? ¿hay jueza? ¿qué ata esa jueza? ¿alguien fija `TZ`?) y es el único 🔴: **el tiempo se fue
donde estaba el hallazgo**, que es buena señal. El pronóstico de ZetaBus se confirma: A lleva
del gordo.
