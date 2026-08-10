# RECONOCIMIENTO H2 · LA HERENCIA DE 003

**Fecha: 10/08/2026** · H2 · tanda 2 · `004_DESPLÁZAME`
**Alcance:** qué de `003_ZETABUS` entra en 004, qué entra cambiado y qué muere al cruzar.

⚠️ **Este documento es REGISTRO HISTÓRICO.** Documenta lo que se supo el 10/08/2026. Si algo
resulta estar mal, se corrige **en un documento nuevo** que diga qué corrige y por qué.

⛔ **003 se leyó EN SOLO LECTURA.** No se escribió, movió, borró ni commiteó nada allí. No se
copió ni un fichero. `003_ZETABUS/.env.local` **no se abrió**. Cero ficheros TypeScript abiertos.

---

## §0 · SI SOLO SE LEE UNA COSA

⭐⭐⭐ **Lo que 003 tiene de valor NO son sus datos: son sus VALLAS.**

El caso que lo dice entero es el puente de identidad. 003 escribió `poste = int(stop_code[2:])` —y
lo encerró en la capa de fuente **precisamente porque el tranvía no tiene prefijo `PA`**. La
fórmula es maquinaria y muere al cruzar. **La valla es la decisión, y es literalmente el problema
de 004.**

⇒ **El peligro de esta herencia no es copiar el fallo de 003. Es copiar la FÓRMULA y dejarse la
VALLA**, porque la fórmula cabe en una línea y la valla vive en un párrafo de un documento de
diseño que nadie está obligado a leer.

⛔ **Y lo segundo, que es una ausencia:** de **transbordo** —enlazar dos servicios, que es el
problema central de H2— **003 no tiene absolutamente nada**. No hay maquinaria que heredar. Medido,
con positivo de control, en §5·D.

---

## §1 · COBERTURA — qué se leyó, qué NO, y con qué comando

**⛔ La cobertura va delante, no al final, porque condiciona todo lo que viene detrás.**

### 1.1 · El tamaño de 003, medido

```
   cd 003_ZETABUS
   git ls-files | wc -l                                 306 ficheros versionados
   git ls-files '*.md' | wc -l                           59 documentos
   git ls-files '*.md' | xargs wc -l | tail -1       22.615 líneas
   git ls-files '*.ts' '*.tsx' | wc -l                  199 ficheros TypeScript
   git ls-files '*.ts' '*.tsx' | xargs wc -l | tail -1  33.850 líneas
   git rev-list --count HEAD                            343 commits
   git log -1 --format='%h %ad' --date=short    ebfd1b2 2026-08-01
```

⚠️ **El encargo decía «58 documentos, 167 ficheros TypeScript». No se reproduce.** Salen **59** y
**199**. Se probaron cuatro filtros para llegar al 167 —solo `src/` (83), sin ficheros de test
(112), solo bajo `docs/` (48)— y **ninguno da 167 ni 58**. `CAUSA NO CONFIRMADA`: o son de otro
momento del proyecto, o de otro criterio de recuento que no consta.

### 1.2 · Lo que SÍ se leyó

```
   213  THIRD-PARTY-NOTICES.md                      ENTERO
   559  docs/LECCIONES.md                           ENTERO
   821  docs/diseno/tanda1-modelo-de-datos.md       §5.3-5.5 · §6 · §7.3 · §10 · §11.2
   435  docs/auditoria/01-fase3-cruce-gtfs.md       ENTERO
   372  docs/auditoria/06-fase7b-ruta-real.md       por grep + secciones
   340  docs/AUDITORIA_NOMBRES_DE_PARADA.md         §2 y §3
   263  docs/BARRIDO_APARCADO.md                    por grep
    98  docs/AUDITORIA_LINEAS_OPERATIVAS.md         ENTERO
  ─────
  3.101 líneas ALCANZADAS de las 22.615 de documentación  ⇒  13,7 %
```

### 1.3 · ⛔ Lo que NO se leyó, y qué se lleva por delante

```
   ficheros TypeScript ABIERTOS      0  de  199    (0 de 33.850 líneas)
   documentos NO abiertos           51  de   59
```

⛔⛔ **El cubo MAQUINARIA del entregable A descansa sobre DOCUMENTOS, no sobre código.** Cuando
este documento dice *«003 hace X en `identity.ts`»*, la fuente es el documento de diseño que dice
que lo hace — **no el fichero.** Eso no es una pega menor: 003 tiene catalogado un caso
(`tanda1-modelo-de-datos.md:705`) en el que **el documento de diseño prometió un `User-Agent` con
correo de contacto y el código nunca lo implementó**, y la promesa se copió al README y al
`THIRD-PARTY-NOTICES.md` como si fuera un hecho. ⇒ **En este repositorio hay prueba escrita de que
sus documentos y su código pueden discrepar.** Todo lo que aquí se afirme sobre código de 003 se
lee con esa reserva.

⭐ **Por qué no se abrió ni un `.ts`:** el encargo prohíbe explícitamente traer código de producto
a 004 y copiar ficheros de 003. Leerlos no estaba prohibido — **pero la clasificación que se pedía
es DATO · DECISIÓN · MAQUINARIA, y las tres se deciden en los documentos.** Se declara como límite,
no como virtud.

### 1.4 · ⭐ Lo local vs lo público — y aquí hay hallazgo

`git status --ignored --porcelain | grep -c '^!!'` sobre el árbol local de 003 devuelve **20
entradas que el repositorio público no contiene**. Dos importan:

```
   !! .cache/                 ⛔ contiene fixtures-reales/ : respuestas REALES de Avanza
   !! data/gtfs/*.zip         el crudo del GTFS, no versionado
   !! .spikes/                5 scripts de captura (capturar.mjs … logo.mjs)
   !! .agents/  .claude/      instrumental de sesión
```

⛔⛔ **`.cache/fixtures-reales/` NO SE COPIA JAMÁS.** Son respuestas reales del sistema de Avanza,
correctamente ignoradas allí, y cubiertas por un compromiso escrito de no redistribución.
**Están citadas aquí para que conste que existen y que se decidió no tocarlas** — no se abrió
ninguna.

⇒ **Y de propina, la observación de método:** el árbol local de 003 tiene material que el repo
público no publica. **Quien reconstruya esta herencia leyendo solo GitHub verá menos de lo que se
vio hoy.**

---

## §2 · ENTREGABLE A — DATO · DECISIÓN · MAQUINARIA

**Regla de la columna de supervivencia:** nada entra en ✅ sin decir **por qué vale también con
tranvía, peatón y multimodal dentro**. Si no se puede decir, no es ✅.

### 2.1 · DATO

| # | qué | veredicto | por qué — con tranvía, peatón y multimodal dentro |
|---|---|---|---|
| D1 | **El GTFS de la ficha 1176 del NAP** | ✅ **SOBREVIVE** | Es el mismo fichero, y **004 se lo descargó solo** (`tools/bajar-gtfs.js`, 10/08) — no se copió de 003. Aguanta el tranvía porque **el tranvía viene dentro**: `agency_id 11`, `route_type 900`, 50 paradas. Al peatón no le sirve y **tampoco le estorba**: son universos disjuntos dentro del mismo ZIP (§2.2·D6). |
| D2 | **Las 14 cifras del feed `20260623_AUZSA_Y_TRANVIA`** | ✅ **SOBREVIVE como CONTROL** | 8 tamaños en bytes + 6 recuentos. No es un dato de producto: es **la prueba de que dos instrumentos independientes, con 28 días de diferencia, leen el mismo fichero**. Vale con cualquier modo porque no habla de modos: habla del fichero. |
| D3 | **Las 8 rutas zombi** (`102/CEM`, `103/CE`, `104/LAN`, `131/EM1`, `132/EM2`, `201/V1`, `203/ES3`, `204/V4`) | ✅ **SOBREVIVE, remedido** | No se heredó: **se volvió a medir sobre el feed propio** (`routes.txt` × `trips.txt`). Vale con tranvía dentro porque **las 8 son de bus y el tranvía no tiene ninguna**: 45 de 53 rutas tienen viajes, 44 de 52 de bus operan. Y muerde en multimodal: **una ruta sin viajes es un enlace que nunca se puede tomar.** |
| D4 | **Las paradas del corredor ausentes del GTFS** (`PA00617`, `PA00646`–`PA00650`) | ✅ **SOBREVIVE, remedido** | Confirmado contra el WFS municipal de hoy. Vale para multimodal porque **una parada que existe en la calle y no en el feed es un nodo del grafo peatonal sin servicio detrás** — exactamente la costura de 004. |
| D5 | **La caducidad del feed: `feed_end_date 20261005`** | ⚠️ **SOBREVIVE CON CAMBIO** | 003 lo publicó como caducidad **del feed** (`tanda1-modelo-de-datos.md:481`, *«dentro de 84 días»*). **Medido en 004, es POR OPERADOR:** el bus respeta el rango al día y **el tranvía se sale con 72 filas posteriores al 05/10**, todas `exception_type=1`. ⇒ El cambio es exactamente el que impone el tranvía: **la pregunta «¿ha caducado el feed?» no tiene una respuesta, tiene dos.** |
| D6 | **La partición bus / tranvía dentro de `stops.txt`** | ✅ **SOBREVIVE** | 934 paradas de bus · 50 de tranvía · **0 compartidas · 0 huérfanas**. Es el dato que hace posible el resto: **los dos modos no comparten ni un poste**, así que un transbordo bus↔tranvía **es forzosamente un tramo a pie**. Sin esto no hay multimodal que diseñar. |
| D7 | **La capa de nombres heredada** (los 934 nombres bien escritos) | ⛔ **MUERE AL CRUZAR** | Compromiso escrito de no redistribución + prohibición explícita del encargo. **No entra en 004 en ninguna forma.** Lo que sí cruza es la DECISIÓN que produjo (§2.2·E4). |
| D8 | **`.cache/fixtures-reales/`** (respuestas reales de Avanza) | ⛔ **MUERE AL CRUZAR** | Mismo compromiso. Y además **004 no hace tiempo real**: no hay a qué aplicarlas. |
| D9 | **Los KML de trazado de Avanza** | ⚠️ **SOBREVIVE CON CAMBIO** | En 003 eran la geometría verdadera de una línea. En 004 **sirven para dibujar, no para enrutar**: el motor de 004 va por eje de calzada propio. Y traen su propio agujero medido: **`Ci3-1`, `Ci3-2`, `Ci4-1`, `Ci4-2` dan 404** ⇒ para dos líneas no hay más geometría que la del GTFS. |
| D10 | **Los nombres verdaderos pedidos al operador** | ⛔ **NO ESTÁ** | 003 concluyó que la autoridad es el operador. **Ese dato no está en 004 y no se puede copiar.** ⇒ 004 empieza sin él: o se vuelve a pedir, o se vive con los nombres del GTFS tal cual. `NO CONSTA` que se haya pedido. |

### 2.2 · DECISIÓN

| # | qué | veredicto | por qué — con tranvía, peatón y multimodal dentro |
|---|---|---|---|
| E1 | ⭐⭐⭐ **El puente de identidad va VALLADO en la capa de fuente** | ✅ **SOBREVIVE, y es la de más valor** | `tanda1-modelo-de-datos.md:380-384` textual: *«`poste = int(stop_code[2:])` … Vive en `sources/avanza-zaragoza/identity.ts` y no sale de ahí … **Es que el tranvía no tiene prefijo `PA`** (50 paradas, comprobado en Fase 3). **Si el puente estuviera en el núcleo, el tranvía lo rompería el primer día.**»* ⇒ **La razón que la produjo es el caso de 004.** Y con el peatón dentro se hace más fuerte, no menos: un portal del callejero municipal tampoco tiene `stop_code`. |
| E2 | **Cada geometría lleva su procedencia, y NO SE MEZCLAN JAMÁS** | ✅ **SOBREVIVE y se endurece** | 003 lo decidió con dos fuentes (KML vs `shapes.txt`), *«nada de coger la precisión del GTFS y corregirla con el KML»*. **004 tiene al menos tres**: eje de calzada municipal, acera, y `shapes.txt`. Más fuentes ⇒ más tentación de mezclar ⇒ la regla vale más aquí que allí. |
| E3 | **Ante dos fuentes que se contradicen, NO SE ADJUDICA: se citan las dos y quién lo dice** | ✅ **SOBREVIVE** | Nacida de las paradas suprimidas (`06-fase7b-ruta-real.md:226`). Es agnóstica de modo por construcción: **es una regla sobre cómo se habla de la incertidumbre, no sobre autobuses.** Muerde ya en 004: el WFS y el GTFS discrepan en 11 paradas y ninguno de los dos es la verdad. |
| E4 | **El nombre bueno se PIDE AL OPERADOR** — ni el GTFS ni el heredado son autoridad | ⚠️ **SOBREVIVE CON CAMBIO** | La decisión es correcta y cruza. **Lo que cambia es que en 004 «el operador» son TRES**: Avanza (934 paradas), Tranvías de Zaragoza (50) y el Ayuntamiento (el callejero, que es quien nombra los portales del peatón). ⇒ La pregunta *«¿a quién se le pide?»* pasa de tener una respuesta a tener tres, y **para el peatón puede que no haya a quién preguntar**. |
| E5 | **El GTFS se procesa en el BUILD, no en runtime** | ✅ **SOBREVIVE** | 870.717 filas de `stop_times`. Vale igual con tranvía (mismo ZIP) y es **más** cierto en multimodal: si el grafo peatonal ya está en memoria, parsear el ZIP en cada arranque es tirar arranque dos veces. |
| E6 | **Etiquetar si el dato es BRUTO o PROCESADO** | ✅ **SOBREVIVE — es obligación legal** | No es criterio: lo exige la licencia del NAP (§3·B5). Aplica a cualquier modo. |
| E7 | **Fuera el tiempo real** | ✅ **SOBREVIVE, y ya está escrito** | En 003 fue una decisión dolorosa tras pagar la Fase 7. En 004 **está en `CLAUDE.md` como alcance de v1** desde antes de esta tanda. Se hereda ya ejecutada. |
| E8 | **Nunca decir «todos los buses»** (`tanda1-modelo-de-datos.md:669`) | ✅ **SOBREVIVE ampliada** | *«Si digo "todos" y falta uno, miento.»* En 004 se generaliza: **nunca decir «la ruta más rápida»** si el grafo puede no tener una acera. Es la misma ley con otro sustantivo. |

### 2.3 · MAQUINARIA

⛔ **Regla del proyecto (`CLAUDE.md`): 004 copia DATOS y DECISIONES, nunca MAQUINARIA.** Así que
esta tabla no decide nada — **ya está decidido**. Lo que hace es decir **qué se pierde** al no
copiarla, que es lo único informativo.

| # | qué | veredicto | qué se pierde, y por qué da igual |
|---|---|---|---|
| M1 | `sources/avanza-zaragoza/identity.ts` y la capa de fuentes | ⛔ **MUERE** | Se pierden ~una docena de líneas triviales. **Lo que valía era la valla, y la valla es E1**, que sí cruza. |
| M2 | El scraper de Avanza + techo de 4 req/s + cortacircuitos | ⛔ **MUERE** | No se pierde nada: **004 no hace tiempo real** (E7). Y su base legal era frágil por escrito (§3·B4). |
| M3 | La interfaz Next.js / React | ⛔ **MUERE** | 004 no tiene ese producto. |
| M4 | El aparato de auditoría de 003 (~45 instrumentos mentirosos catalogados) | ⛔ **MUERE como código · ✅ SOBREVIVE como lecciones** | 004 ya tiene el suyo —la batería, el puntero, el latido, la bitácora—, construido aquí. Lo que cruza son las nueve lecciones del §4. |
| M5 | El artefacto compacto de build del GTFS | ⛔ **MUERE** | 004 tendrá que escribir el suyo. **Lo que cruza es E5**: que exista y sea de build. |
| M6 | ⛔⛔ **Maquinaria de TRANSBORDO** | **NO EXISTE — nada que heredar** | Ver §5·D. Es la ausencia más importante del documento: **el problema central de H2 empieza en cero.** |

---

## §3 · ENTREGABLE B — LOS LÍMITES YA PAGADOS

Cosas que 003 descubrió a base de estrellarse. **004 no tiene que volver a pagarlas — pero sí tiene
que saber que las hereda.**

### B1 · ⭐ La asimetría desvío / supresión

**Prueba:** `docs/auditoria/06-fase7b-ruta-real.md:226` y `docs/diseno/tanda1-modelo-de-datos.md:671-677`
**Fecha:** 13/07/2026

> *«El bus pasa y no para, y ningún sistema lo registra. El poste sigue conectado, la API sigue
> anunciando buses, `get_stops_list` sigue listando la parada.»*
> *«No es un fantasma. Es una parada suprimida sobre el papel y viva en la base de datos.»*

⇒ **Un DESVÍO es DERIVABLE** (se ve en la geometría y en los datos) **y por eso se puede AFIRMAR, y
se autoextingue** cuando la fuente vuelve a la normalidad. **Una SUPRESIÓN solo está DECLARADA** en
un comunicado en PDF y en un cartel de metacrilato ⇒ **nunca un tachado, siempre una nota**, con
fecha y con quién lo dice.

**Qué implica para 004:** es el mismo hueco, con otro nombre. **Una acera cortada por obras es una
supresión peatonal**: no está en ningún dato, solo en una valla física. ⇒ El motor de 004 **no
puede afirmar que un tramo es intransitable**; como mucho puede decir que alguien lo declaró.

### B2 · El GTFS cae por CALENDARIO, no por avería

**Prueba:** `tanda1-modelo-de-datos.md:481` · **Fecha:** 13/07/2026
**Remedido en 004 el 10/08/2026 y corregido:** ver §2.1·D5.

```
   feed_start_date  20260623
   feed_end_date    20261005          003, 13/07: «dentro de 84 días»
                                      004, 10/08: dentro de 56 días
   ⭐ y medido aquí: 72 filas de calendar_dates POSTERIORES al 20261005,
      las 72 con exception_type=1, y son del TRANVÍA. El bus respeta el rango al día.
```

⇒ **El día que caduque, nada se romperá: simplemente no habrá servicio para ninguna fecha
consultada.** Un fallo que no da error. **Y caducará en dos tiempos, no en uno.**

### B3 · No hay GTFS-RT en Zaragoza

**Prueba:** `docs/BARRIDO_APARCADO.md:224` · **Fecha:** 14/07/2026

> *«**NO EXISTE.** Verificado contra el NAP, Transitland y Mobility Database.»*

⇒ **Tres fuentes independientes consultadas, no una.** Y el mismo documento apunta que el pliego
del nuevo contrato **exige** *«APIs de acceso público y general para su uso por terceros»* (cláusula
27) — pero *«el contrato no está adjudicado»*.

**Qué implica para 004:** confirma E7 desde fuera. **El tiempo real no está fuera de la v1 solo
por decisión: es que no hay de dónde sacarlo.** ⚠️ Y da un disparador que vigilar: **si se adjudica
el contrato, esto cambia.**

### B4 · No hay `trip_id`, ni rumbo, y la distancia viene en km enteros

**Prueba:** `tanda1-modelo-de-datos.md:679-683` · **Fecha:** 13/07/2026

> *«No hay `trip_id` en el scrape → no se puede atar un bus a un viaje del GTFS → **no se proyecta
> sobre el trazado**.»* · *«Tampoco hay RUMBO … Sin flecha.»* · *«`distanceKm` viene **en
> kilómetros enteros**. `"0 kms."` significa "menos de 1 km", **no "ha llegado"**.»*

**Qué implica para 004:** nada operativo —no hay scrape— pero sí un aviso que **004 ya está
pisando**: `"0 kms."` es el caso puro de **una unidad que se lee como una medida**. En 004 el
equivalente es la banda de tiempo: una banda no es un tiempo, y publicarla como si lo fuera es el
mismo error con otra magnitud.

⚠️ **Y trae su propio caso de instrumento mentiroso pagado:** la base legal de los endpoints
internos de Avanza (`tanda1-modelo-de-datos.md:696-700`) — *«No tenemos permiso. Tenemos ausencia de
prohibición explícita, que no es lo mismo»* — más la promesa del `User-Agent` con correo **que se
escribió en el diseño, se copió al README y al `THIRD-PARTY-NOTICES.md`, y nunca se implementó.**
Es la prueba, dentro de 003, de que sus documentos pueden mentir sobre su código (§1.3).

### B5 · La licencia del NAP: qué obliga exactamente

**Prueba:** `THIRD-PARTY-NOTICES.md:17-18` · **Fecha del fichero:** commit del 01/08/2026

Permite *«compartir (copiar, distribuir)»* y *«modificación, adaptación, extracción, reordenación y
combinación»*. **A cambio, tres obligaciones:**

```
   1  «Powered by MITRAMS»  +  cita del MITMS como fuente
   2  indicar si el dato es BRUTO o PROCESADO
   3  ⚠️ conservar SIN ALTERAR la metainformación de fecha de actualización
      y de condiciones de reutilización
```

⇒ **La tercera es la que muerde y la que casi nadie recuerda.** En 004 significa que
`feed_info.txt` y su fecha **no se pueden tirar al cocinar el artefacto de build** (E5). Si el
proceso de build se come `feed_start_date`/`feed_end_date`, **004 incumple la licencia sin darse
cuenta** — y de paso pierde B2.

### B6 · `shapes.txt` es preciso y mentiroso

**Prueba:** `tanda1-modelo-de-datos.md:456-460` · **Fecha:** 13/07/2026

> *«`shapes.txt` tiene 300-440 puntos y **miente cuando hay obras**; el KML tiene 153 y **dice la
> verdad**.»*

⇒ **Más puntos no es más verdad.** Es el caso canónico de precisión sin exactitud.

**Qué implica para 004:** muerde directo en el motor. **004 mide por eje de calzada y publica
metros con un decimal.** Un decimal sobre una geometría que puede estar desactualizada es
exactamente la misma trampa. ⚠️ **Y ya hay una medida de 004 en esa zona**: la ruta nº10 va a zona
de mapeado flojo, y se publicó por eje de calzada precisamente para que se viera.

---

## §4 · ENTREGABLE C — LAS NUEVE LECCIONES, Y DÓNDE MUERDEN EN 004

**Regla del encargo:** *«Sin el "dónde muerde" no entra: una lección sin destino es decoración.»*
Las nueve tienen destino concreto — fichero o instrumento de 004.

### L1 · TODO EXTRACTOR NECESITA UN CONTADOR DE CONTROL INDEPENDIENTE

**Caso real en 003:** un extractor daba una cifra y no había con qué contrastarla; la cifra era
suya y de nadie más.
**⇒ DÓNDE MUERDE EN 004:** `tools/bajar-gtfs.js` + el inventario de H2·1. **El recuento de las 984
paradas y las 870.717 filas lo hizo el mismo script que leyó el ZIP.** Hoy tiene contador
independiente y es el mejor que podía salir: **las 14 cifras de 003, medidas con otro instrumento
28 días antes, coinciden al byte** (§5·H8). ⚠️ **Pero eso fue suerte de la corroboración, no
diseño.** Cuando el feed se republique, ese contador desaparece.

### L2 · EN CUANTO DEJAS DE DECLARAR Y EMPIEZAS A CONTAR, EL PROBLEMA DESAPARECE

**Caso real en 003:** listas escritas a mano que se desincronizaban del código.
**⇒ DÓNDE MUERDE EN 004:** `src/superados.js` **D3** (los recuentos por par, cerrados) y
`src/modelo-rutas.js` (`PUBLICADOS`). Y muerde en un sitio incómodo: **la tabla `DECLARADOS` de la
batería es una lista escrita a mano.** Funciona porque es corta y porque P5 la audita — pero es
exactamente la forma que esta lección desaconseja.

### L3 · UN DATO HEREDADO SIN PROCEDENCIA NO SE CORRIGE: SE SUSTITUYE

**Caso real en 003:** el heredado estaba **mejor escrito** que el GTFS y aun así no se usó para
parchear, porque no tenía procedencia limpia (traduce `Av.` → `Avenida`).
**⇒ DÓNDE MUERDE EN 004:** los 934 nombres del `stops.txt`. Hay 5 con `ángel` en minúscula y 11
palabras iniciales en minúscula. **La tentación es arreglarlos.** ⛔ Y no se puede: de `ángel` a
`Ángel` se llega, pero de `Iii` no se vuelve a `III` sin diccionario, y **un arreglo parcial es
peor que ninguno porque no se distingue del original.** Muerde en `src/exportar-nombres.js` y
`src/heredar-nombre.js`, que es donde 004 ya toca nombres.

### L4 · SI LA FUENTE NO PUEDE DISTINGUIR DOS ESTADOS, NO LA INTERROGUES MÁS FUERTE: CAMBIA LA PREGUNTA DE SITIO

**Caso real en 003:** la Fase 7 pagó 67 peticiones y ~60 s por pulsación para acabar sin poder ver
al tercer autobús de un pelotón. **El coste compra corrección dentro de lo que la fuente publica,
no la verdad.**
**⇒ DÓNDE MUERDE EN 004, y es la que más:** **el transbordo.** No hay `transfers.txt`, no hay
`pathways.txt`, no hay `parent_station`. ⛔ **Insistirle al GTFS no va a producir un transbordo.**
⇒ La pregunta se cambia de sitio: **el enlace lo deriva 004 con SU grafo peatonal** —que es lo que
tiene y 003 no tenía— y se declara como derivado, no como dato del feed.

### L5 · UNA PROTECCIÓN Y LA FUNCIÓN QUE PROTEGE SE MIDEN JUNTAS, O NO SE MIDEN

**Caso real en 003:** una protección verde sobre una función que ya no hacía nada.
**⇒ DÓNDE MUERDE EN 004:** `.githooks` + `src/probar-hook.js`, y **la bitácora nº178 de hoy es un
caso vivo**: D4 comprueba que existen los destinos de su tabla y **no comprueba las rutas que
aparecen en la prosa**. La protección está verde; el trozo que no mira es el que falló.

### L6 · SI COMPARAS DOS MEDIDAS TOMADAS EN INSTANTES DISTINTOS, ESTÁS MIDIENDO TU PROPIO RETRASO

**Caso real en 003:** comparar el scrape con el GTFS y atribuir a la realidad lo que era desfase.
**⇒ DÓNDE MUERDE EN 004:** el cruce WFS municipal ↔ GTFS. **Los grupos `8130-8133` y `8134-8137`
son el aviso** (§6·nº2): 003 los vio de una forma en julio, el WFS de hoy los da de otra, y puede
que no discrepen — **puede que solo estén separados por un mes**. Y muerde en `src/latido.js`, que
existe para esto.

### L7 · VERIFICAR UNA CAPA Y AFIRMAR SOBRE OTRA

**Caso real en 003:** verificar el extractor y afirmar sobre el dato.
**⇒ DÓNDE MUERDE EN 004:** H1 entero. **Se mide por EJE DE CALZADA y se afirma sobre un TRAYECTO A
PIE.** Ya está declarado en las medidas de la nº8 y la nº10, pero la lección dice que la
declaración hay que repetirla cada vez, porque el que lee la cifra no lee la nota.

### L8 · UNA MEDIDA QUE SALE REDONDA A LA PRIMERA NO ES UNA CONFIRMACIÓN: ES UNA MUESTRA MAL ELEGIDA

**Caso real en 003:** una comprobación que salió perfecta y estaba mirándose a sí misma.
**⇒ DÓNDE MUERDE HOY, en este documento:** **las ocho hipótesis salen 5 confirmadas y 3 matizadas,
cero desmentidas.** Eso es sospechoso por construcción (ley 108). ⇒ Por eso el §5 lleva delante
**cómo se evitó leer el documento del que salieron**. Y muerde otra vez en H8: **catorce cifras
idénticas** es exactamente la clase de resultado que esta lección manda mirar dos veces.

### L9 · UN MÓDULO PROBADO Y DESCONECTADO DA MÁS CONFIANZA QUE UNO QUE NO EXISTE

**Caso real en 003:** módulos escritos, probados y no cableados, que luego entraron sin sustos.
**⇒ DÓNDE MUERDE EN 004:** es el permiso para escribir el lector del GTFS **antes** de que el motor
sepa qué hacer con él. Y es lo contrario de la trampa del `User-Agent` (§3·B4): **un módulo
desconectado que existe** vale; **una promesa escrita que no existe** miente.

---

## §5 · ENTREGABLE D — LAS OCHO HIPÓTESIS

**Veredicto global: 5 CONFIRMADAS · 3 MATIZADAS · 0 DESMENTIDAS.**

⛔ **Y como salen casi todas confirmadas, primero cómo se evitó leer el documento del que salieron
(ley 108):** las hipótesis **3, 4, 5, 6, 7 y 8** se comprobaron **contra el feed propio de 004
descargado el 10/08**, no contra un documento de 003. Las hipótesis **1 y 2** son sobre documentos
de 003 por naturaleza —hablan de su licencia y de su auditoría— y ahí **no hay independencia
posible**: se declaran como lo que son, lectura directa de la fuente citada.

| # | hipótesis | veredicto | fuente de la comprobación |
|---|---|---|---|
| H1 | La licencia del NAP permite redistribuir con atribución | ✅ **CONFIRMADA** | documento de 003 (no hay independencia) |
| H2 | 126/803/10 en el cruce de nombres, y «el GTFS ganó el juicio» | ⚠️ **MATIZADA** | documento de 003 + relectura del veredicto |
| H3 | La capa heredada arregla 751 de 934 con `ucwords()`, y es con pérdida | ⚠️ **MATIZADA** ×2 | 003 + **medida propia sobre el feed de 004** |
| H4 | El tranvía no sufre el destrozo de mayúsculas | ✅ **CONFIRMADA** | **medida propia** |
| H5 | Hay 8 rutas zombi | ✅ **CONFIRMADA** | **medida propia** |
| H6 | 6 paradas del corredor están en el WFS y no en el GTFS | ✅ **CONFIRMADA** | **medida propia** |
| H7 | Las obras no explican las paradas que faltan | ✅ **CONFIRMADA** | **medida propia** |
| H8 | La auditoría de 003 es de julio y el feed es el mismo | ✅ **CONFIRMADA** | **medida propia contra 003** |

### H1 · CONFIRMADA — y trae una obligación que la hipótesis no recogía

`THIRD-PARTY-NOTICES.md:17-18`. Ver §3·B5 para el texto y las tres obligaciones. ⚠️ **La que
faltaba en la hipótesis es la tercera:** conservar sin alterar la metainformación de fecha de
actualización y condiciones de reutilización.

### H2 · MATIZADA — las cifras son exactas y el veredicto está al revés

**Las cifras, exactas** (`AUDITORIA_NOMBRES_DE_PARADA.md:130-132`, 14–15/07/2026):

```
   126  idénticos      803  DIFIEREN      10  solo en el heredado
   y en auditoria/01-fase3:82 → 929 en el GTFS · 5 solo en el GTFS
```

⛔ **Pero «el GTFS ganó el juicio» es de la Fase 3 y va de COORDENADAS y SECUENCIAS.** En los
**nombres**, 003 dice lo contrario, y en primera persona:

> `:135` — *«Y en **prácticamente todas** las 803, **el heredado está mejor escrito**»*
> `:166` — *«**Me equivoqué**: dictaminé "trabajo redundante" mirando solo las coordenadas…»*

⚠️ **Y el heredado tampoco ganó:** traduce (`Av.` → `Avenida`, `P.` → `Paseo`) y no tiene
procedencia limpia. ⇒ **La respuesta de 003 fue una TERCERA: el nombre bueno se pide al operador**
(§2.2·E4). ⭐ *«El heredado no era la respuesta. Era la PISTA de que existía una respuesta mejor.»*

### H3 · MATIZADA por dos lados distintos

**Las cifras están:** 751 de 934 (**80,4 %**) = unión de 491 conectores en mayúscula + 515 `N.º`.

⚠️ **Matiz 1 — 003 NO afirma que sea `ucwords()`.** Lo dice explícitamente:

> *«No afirmo que sea `ucwords()`. Afirmo lo que he medido: la transformación es mecánica,
> determinista, y se aplica al exportar.»*

Reproduce 80 de 82 casos. **La hipótesis daba por hecho lo que 003 se negó a afirmar.**

⚠️ **Matiz 2 — la medida independiente da MENOS, y es un SUELO.** Buscando en el `stops.txt` propio
las dos huellas visibles sin fuente externa —palabra con tilde inicial en minúscula, y partícula
en mayúscula— salen **492 de 934 (52,7 %)**.

```
   003, contra el nombre VERDADERO pedido a Avanza       751 / 934   80,4 %
   004, contra dos huellas visibles en el propio fichero 492 / 934   52,7 %   ⇐ SUELO
```

⛔ **No se contradicen: miden cosas distintas.** 003 tenía la verdad para comparar y 004 no la
tiene. **La cifra de 004 es lo que se ve sin esa verdad**, y por eso es un suelo y no una medida.

✅ **«Con pérdida» es correcto, y es lo que más importa para 004:** de `Iii` no se vuelve a `III`,
ni de `ángel` a `Ángel`, sin diccionario. **Deshacerlo desde nuestro lado sería adivinar** (L3).

### H4 · CONFIRMADA — y medida sobre el feed propio

```
   grupo      n     tilde inicial en minúscula     partícula en mayúscula
   bus      934      8   (0,9 %)                    489   (52,4 %)
   tranvía   50      0   (0,0 %)                      4   (8,0 %)
```

Los cuatro del tranvía son títulos de película —`La ventana indiscreta`, `Un americano en París`,
`Mago de Oz`, y `Paseo de Los Olvidados`—, no el mismo destrozo.

⭐ **Mismo fichero, misma columna, mismo día: un operador escribe bien y el otro rompe.** ⇒ La
transformación **no es del NAP ni del formato: es del exportador de Avanza.** Esa es la conclusión
que 004 necesita, porque significa que **no se arregla cambiando de fuente.**

### H5 · CONFIRMADA — las ocho, y son exactamente esas ocho

```
   rutas en routes.txt        53      con viajes   45      ⛔ con CERO viajes   8
      102 CEM  Puerta del Carmen - Cementerio
      103 CE   San Miguel - Cementerio
      104 LAN  Lanzadera Cementerio - Parque Atracciones
      131 EM1  Plaza Europa - Estadio Modular
      132 EM2  Paseo de La Ribera - Estadio Modular
      201 V1  ·  203 ES3  ·  204 V4
   de las 52 rutas de bus, operan 44
```

⚠️ **Con un matiz:** 003 titula su auditoría *«EM1, EM2, **EM3**, V1, V4»* — y **`EM3` no existe en
este feed**, ni con viajes ni sin ellos. `CAUSA NO CONFIRMADA`: o existió en un feed anterior, o es
un error de transcripción de 003.

### H6 · CONFIRMADA en el hecho, con la causa a la vista

`PA00617` (Parque de Atracciones) y `PA00646`–`PA00650` (Duque de Alba) están en el WFS municipal y
**no en el GTFS**. Y las tres rutas que las servirían —`CEM`, `CE`, `LAN`— son **tres de los ocho
zombis de H5**.

⚠️ **La cadena «no hay viajes ⇒ el publicador las quita de `stops.txt`» es inferencia mía, no un
hecho declarado por nadie.** Encaja perfectamente y por eso hay que decirlo: `CAUSA PLAUSIBLE, NO
CONFIRMADA`.

### H7 · CONFIRMADA

`PA00338 «Coso N.º 126»` está en el `stops.txt` de hoy. ⇒ **El GTFS no borra paradas por obras**, y
las obras no explican las que faltan.

### H8 · CONFIRMADA — y es la corroboración más fuerte que podía salir

`docs/auditoria/01-fase3-cruce-gtfs.md`, **fecha 13/07/2026**, mismo `feed_version
20260623_AUZSA_Y_TRANVIA`. Sus cifras contra las medidas en 004 el **10/08/2026**:

```
   agency.txt         429        routes.txt       3.430        stops.txt        99.309
   calendar_dates 729.890        shapes.txt   1.408.077        stop_times   47.049.063
   feed_info.txt      244                                      trips.txt     2.112.380

   53 rutas  ·  89 shapes  ·  27.603 puntos  ·  984 paradas  ·  870.717 horarios  ·  34.427 viajes
```

⭐⭐⭐ **Los catorce números, idénticos. Dos proyectos, dos instrumentos, 28 días de diferencia.**
⇒ Es a la vez la confirmación externa del reconocimiento de H2·1 **y** la prueba de que el feed
lleva sin republicarse desde el 23 de junio.

⚠️ **Y es justo el resultado que L8 manda mirar dos veces.** Se mira: la coincidencia **no puede
ser circular**, porque las cifras de 004 salieron de un ZIP descargado con `tools/bajar-gtfs.js` el
10/08 y las de 003 estaban escritas en disco desde el 13/07, **antes de que 004 existiera**. Un
documento de julio no puede haber copiado una medida de agosto.

---

## §6 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ **`DESPLAZAME-ESTADO.md` no se toca. Esto se REPORTA; decide Antonio.**

1. ⭐⭐⭐ **De transbordo, 003 no tiene NADA que heredar.** Medido sobre los 199 ficheros TS: los 13
   aciertos de `transfer|transbordo` son **interfaz** (specs de e2e y `page.tsx` — los *chips* que
   dicen qué líneas pasan por una parada). **Positivo de control en el mismo universo:**
   `stop_code|stopCode` → 5 ficheros, así que el buscador funciona. ⇒ **El problema central de H2
   empieza en cero.**

2. ⭐⭐ **Los grupos `813x` no cuadran entre tres inventarios.** 003 (vía ZGZ RADAR, julio) da
   `8134-8137`; el WFS municipal de hoy da `8130-8133`; **el GTFS no tiene ninguno de los ocho.**
   Son dos grupos DISTINTOS de cuatro postes. `CAUSA NO CONFIRMADA` — y la asimetría de evidencia
   va declarada: **los `8130-8133` los medí yo hoy; los `8134-8137` los cito de 003.**

3. ⭐⭐ **La caducidad del GTFS es POR OPERADOR, no del feed.** El bus respeta `feed_start`/`feed_end`
   al día; el tranvía se sale con 72 filas posteriores, todas de servicio activo. ⇒ 004 caducará en
   dos tiempos.

4. ⭐⭐ **El caso plantilla del encargo estaba mal atribuido, y la corrección importa más que el
   caso.** 003 **no** cometió el error del puente de identidad: lo valló, y lo valló **citando el
   tranvía por su nombre**. ⇒ La ley que sale no es *«ojo con heredar fallos»* sino
   ***«la maquinaria es la fórmula, la decisión es la valla, y lo que se copia es la segunda»***.

5. **Obligación de licencia que muerde en el build:** hay que conservar **sin alterar** la
   metainformación de fecha de actualización. Si el artefacto compacto se come `feed_info.txt`,
   004 incumple la licencia **y** pierde la caducidad. Un fallo, dos consecuencias.

6. **`EM3` no existe en este feed** aunque la auditoría de 003 la nombra en su título.

7. **Disparador externo que vigilar:** el pliego del nuevo contrato exige APIs públicas (cláusula
   27). **Si se adjudica, la decisión «fuera el tiempo real» cambia de fundamento** — deja de ser
   «no hay de dónde» y pasa a ser «no queremos por ahora».

8. **El árbol local de 003 publica menos de lo que tiene.** 20 entradas ignoradas, entre ellas
   `.cache/fixtures-reales/` con respuestas reales de Avanza bajo compromiso de no redistribución.
   ⇒ **Quien reconstruya esta herencia leyendo solo GitHub verá menos.** No se abrió ninguna.

9. **El recuento del encargo no se reproduce:** 59 documentos y 199 ficheros TypeScript, no 58 y
   167. `CAUSA NO CONFIRMADA`.

10. ⚠️ **Y el límite propio de esta tanda, que debe subir con lo demás:** el cubo MAQUINARIA se
    apoya en documentos, con **0 de 199 ficheros de código abiertos** — en un repositorio que tiene
    catalogado por escrito un caso de documento que promete lo que el código no hace.

---

## §7 · LÍNEAS BASE DE LA BATERÍA

⭐ **La de arranque corrió ANTES de escribir el primer fichero**, no en paralelo.

```
   ANTES    ARRANQUE 2026-08-10T12:53:34+02:00  →  FIN 2026-08-10T13:11:34+02:00   exit=0
   DESPUÉS  ARRANQUE 2026-08-10T13:19:26+02:00  →  FIN 2026-08-10T13:37:09+02:00   exit=0

   ⇒ la de arranque TERMINÓ 8 minutos antes de que existiera el primer fichero escrito.
     No corrieron en paralelo.
```

⚠️ **Y lo que la de arranque ya traía en amarillo, para que no se confunda con nada de hoy:**
`ruta.js` sale en **código 2 sin declarar nada**, y la batería lo destapa en vez de tragárselo.
**Es previo a esta tanda, y en la de cierre sigue exactamente igual.**

### 7.1 · La comparación, y no es a ojo

```
   los 3 rojos declarados      modelo-rutas.js 1 · auditoria-guardianes.js 1 · rutas-antonio.js 1
   el amarillo sin declarar    ruta.js código 2
   P5 «¿sabe esta batería contar?»   ✅ un fallo detectado ya no puede terminar en verde
```

⭐ **Contadas cuerpo a cuerpo, quitando solo las dos líneas de sello:**

```
   diff  bateria-ANTES.txt  bateria-DESPUES.txt      (sin ARRANQUE/FIN)
   112 líneas   vs   112 líneas          ⇒  salida VACÍA: IDÉNTICAS
```

⇒ **Esta tanda no movió ni un instrumento**, que es lo que tenía que pasar: fue lectura de 003 y
escritura de dos documentos de 004. ⚠️ Y la comparación se hace con `diff`, **no leyéndolas al
lado**: dos salidas de 112 líneas se parecen demasiado como para fiarse de la vista.
