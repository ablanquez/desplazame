# RECONOCIMIENTO H2 · LAS VALLAS Y LOS CABOS

**Fecha: 10/08/2026** · H2 · tanda 3 · `004_DESPLÁZAME`
**Alcance:** cuatro medidas — el código de las vallas de 003 (T1), el cruce `813x` (T2), los dos
934 (T3) y los terminales variables (T4).

⚠️ **REGISTRO HISTÓRICO: se añade, no se reescribe.** Este documento **corrige** un descubrimiento
publicado en `docs/RECONOCIMIENTO-H2-HERENCIA-003.md` (§2.5). Aquel no se toca.

⛔ **003 se leyó EN SOLO LECTURA**, cuatro ficheros y ninguno más. Nada escrito, movido ni copiado.
`003_ZETABUS/.env.local` no se abrió.

---

## §0 · SI SOLO SE LEE UNA COSA

**Las cuatro medidas dan cuatro respuestas distintas, y ninguna es la que se esperaba:**

| | esperado | medido |
|---|---|---|
| **T1** | ¿miente el documento sobre el código? | ⭐⭐⭐ **Miente al revés: el código hace MÁS de lo que su documento dice.** La fórmula publicada, implementada tal cual, rompería la valla que la valla existe para sostener |
| **T2** | ocho postes o cuatro renumerados | ⛔ **`NO CONSTA`**, y con la lista exacta de lo que haría falta |
| **T3** | dos conjuntos que igual no coinciden | ✅ **A = B, exacto.** Cabo cerrado — y la contraprueba destapó lo de T1 |
| **T4** | el reparto de terminales de tres líneas | ⛔⛔ **EL POSITIVO DE CONTROL SALIÓ ROJO.** La consulta encargada está mal y su veredicto se para |

⭐ **Y una corrección propia que va delante de todo:** el descubrimiento nº1 de la tanda anterior
—*«de transbordo, 003 no tiene NADA»*— **es falso**, y está destilado al estado. Ver §2.5.

---

## §1 · COBERTURA

### 1.1 · Lo leído de 003 — cuatro ficheros, y son cuatro

```
   cd 003_ZETABUS && wc -l <fichero>
      24  src/sources/gtfs-nap/identity.ts     ENTERO   ⚠️ el puente NO vive donde el documento dice
     409  src/sources/gtfs-nap/adapter.ts      ENTERO
     287  src/engine/desvios.ts                ENTERO
     335  src/engine/topologia.ts              ENTERO
   ─────
   1.055 líneas de código abiertas   (de las 33.850 del repositorio: 3,1 %)
```

⚠️ **El encargo nombraba `src/sources/avanza-zaragoza/identity.ts`. Ese fichero no existe.** Se
localizó el puente **sin abrir nada**, por `grep`, y el resultado es §2.1.

### 1.2 · Lo medido SIN abrir, y hay que decirlo

Tres ficheros más entraron en el documento **por su superficie, no por su contenido**: se extrajo
con `grep` la lista de sus `export` y sus recuentos de línea, y **no se abrieron**, porque el
encargo limita la lectura a cuatro y exige preguntar por el quinto.

```
   src/engine/correspondencias.ts          338 líneas   19 exports   ⇒ §2.5
   src/sources/avanza/correspondencias.ts  277 líneas    8 exports   ⇒ §2.5
   tests/motor-vivo/identidad-de-linea.test.ts  ·  7 nombres de test  ⇒ §2.4
```

⛔ **Todo lo que este documento afirma sobre esos tres es sobre su SUPERFICIE.** Lo que hagan por
dentro `NO CONSTA`.

### 1.3 · Lo que no se tocó

`RUTAS-CONOCIDAS.md`, H1, `DESPLAZAME-ESTADO.md`, el `.gitignore`. **No se volvió a descargar el
GTFS**: todo sale del ZIP de `data/exploracion/` del 10/08.

---

## §2 · T1 — LAS VALLAS DE 003: ¿ESTÁN EN EL CÓDIGO O EN LA PROSA?

**La pregunta que decide:** una valla que solo vive en un documento no es una valla, es una
intención.

| # | valla | ¿el código hace lo que dice el documento? | ¿dónde vive la valla? |
|---|---|---|---|
| V1 | El puente de identidad fuera del núcleo | ⭐⭐⭐ **NO — hace MÁS** | **En el código**, y con más fuerza que en la prosa |
| V2 | «Saber qué es un bus» en una tabla, no en un `if` | ✅ **SÍ** | **En el código.** Es un `Record`, no una rama |
| V3 | Al diff de desvíos no entra ni un dato vivo | ✅ **SÍ** | **En el código Y en el tipo Y en un test** |
| V4 | El supuesto de las líneas que empiezan por cero | ✅ **SÍ** | **En un test que existe** |
| V5 | «El puente no sale de ahí» | ⚠️ **PARCIALMENTE** | En los hechos sí; el barril la deja entreabierta |

### 2.1 · ⭐⭐⭐ V1 — el documento describe una fórmula que ROMPERÍA su propia valla

**Lo que publica el documento de diseño** (`docs/diseno/tanda1-modelo-de-datos.md:382`):

> *«`poste = int(stop_code[2:])` (`"PA00669"` → `669`) es un detalle **de Avanza**. Vive en
> `sources/avanza-zaragoza/identity.ts` y **no sale de ahí**.»*

**Lo que hay en el código** (`src/sources/gtfs-nap/identity.ts:14-23`):

```
   const PA = /^PA(\d{5})$/;

   export function posteFromStopCode(stopCode: string | null): number | null {
     if (!stopCode) return null;
     const m = PA.exec(stopCode.trim());
     if (!m) return null;
     const n = Number.parseInt(m[1], 10);
     return Number.isFinite(n) && n > 0 ? n : null;
   }
```

⇒ **Dos diferencias, y la segunda es de fondo.**

**(a) La ruta del documento es falsa.** No existe `sources/avanza-zaragoza/`. El puente vive en
`src/sources/gtfs-nap/identity.ts`. Y hay un `src/sources/avanza/` —nueve ficheros— que **no es
donde está**. ⚠️ La ironía es completa: el fichero se abre diciendo *«ES ESPECÍFICO DE AVANZA»*
(`identity.ts:2`) y está guardado en la carpeta del GTFS.

**(b) ⭐⭐⭐ La fórmula del documento, aplicada al tranvía, produce colisiones silenciosas.** Medido
sobre el `stops.txt` del 10/08 — **los 50 postes del tranvía llevan códigos de CUATRO cifras**:

```
   int("2101".slice(2)) = 1     Paseo de Los Olvidados
   int("2301".slice(2)) = 1     Los Pájaros
   int("2401".slice(2)) = 1     Cantando bajo la lluvia
```

⛔ **Tres paradas distintas del tranvía, el mismo número de poste, y ni un error.** No sale `null`,
no revienta: sale un `1` con toda la pinta de ser un poste bueno. **Es exactamente el modo de fallo
que la valla existe para impedir**, y lo produciría la fórmula tal y como está publicada.

✅ **El código no lo produce**, porque su regex está **anclada** (`^…$`) y **exige cinco dígitos
tras `PA`**. Un código de tranvía no casa y devuelve `null`.

⭐ **⇒ El documento no exagera lo que hace su código: se queda corto, y se queda corto justo en lo
que sostiene la valla.** Esa dirección de la deriva casi nadie la comprueba — se busca al documento
que promete de más, no al que describe de menos. **Y las dos hacen el mismo daño**, porque quien
copia la decisión copia la prosa.

⚠️ **Cómo muerde esto en 004, que es a lo que veníamos:** el «caso plantilla» que se lleva 004 no
puede ser la frase `int(stop_code[2:])`. **Copiarla literalmente reproduce la colisión.**

### 2.2 · ✅ V2 — la tabla de modos, y está en el código

`src/sources/gtfs-nap/adapter.ts:42-58`:

> *«⭐ ESTA TABLA ES TODO EL "SABER QUÉ ES UN BUS" QUE HAY EN EL PROYECTO. Es una TABLA y no un
> `if (route_type === 704) esBus = true`, y esa es la diferencia entre un modelo agnóstico y uno
> que finge serlo. Añadir el tranvía no fue tocar el núcleo: fue tener ya la fila `900 → tram`
> puesta.»*

✅ **Y el código es literalmente eso**: un `Record<string, Mode>` con siete filas (`0`, `3`, `700`,
`702`, `704`, `715`, `900`). No hay ninguna rama por modo. **La valla es la estructura de datos.**

⭐ **Y el código sabe que existe 004.** `adapter.ts:61`, en el tipo de las opciones:

> *«Qué modos ingerir. `['bus']` para ZetaBus v1; `['bus','tram']` para el 004.»*

⇒ **La puerta multimodal está abierta en el código de 003, con 004 nombrado dentro.** Es la segunda
mención (la otra, `identity.ts:10`). ⛔ Sigue sin poder cruzar —es maquinaria— pero **la decisión de
que el modo sea un parámetro y no una rama es la que 004 se lleva.**

⚠️ Y la valla trae su propio agujero declarado: un `route_type` desconocido **descarta la ruta
entera** con un aviso (`adapter.ts:191-195`). Con el vocabulario básico (`0`/`3`) fuera de este
feed, la tabla es lo único que sostiene el reconocimiento — si el publicador cambia a `3`, sigue
funcionando; si cambia a `800`, **desaparecen rutas y solo lo dice un `warning`.**

### 2.3 · ⭐⭐ V3 — la valla que está en el TIPO, y además tiene test

`src/engine/desvios.ts:37-47`:

> *«A ESTA FUNCIÓN NO ENTRA NI UN DATO VIVO. MÍRALE LA FIRMA. […] Aquí no se evita con disciplina,
> que se olvida: se evita con el TIPO. Esta función recibe dos listas de postes y NADA MÁS. No hay
> por dónde colar una llegada aunque uno quiera.»*

✅ **Verificado en la firma:** `compararRecorrido(oficial, real)` recibe dos `ParadaDelDiff[]`
—`{poste, nombre}`— y devuelve un veredicto. Ni red, ni caché, ni reloj.

✅ **Y la valla tiene guardián**, `desvios.ts:56-59`: *«lo comprueba
`tests/desvios-no-miran-lo-vivo.test.ts`, que lee este fichero y se pone rojo si aparece un
`import` del canal vivo»*. **El fichero existe: 158 líneas** (comprobado con `ls`, ley 140).

⭐ **Es la única de las cinco vallas que está en los tres sitios a la vez: prosa, tipo y test.** Y
trae de propina el **freno de mano** (`desvios.ts:125`, `UMBRAL_ABSURDO = 0.5`): si el diff dice
que hoy faltan más de la mitad de las paradas, **no es un desvío, es una lectura rota, y no se
tacha nada**.

### 2.4 · ✅ V4 — el test prometido existe, con otro nombre

`topologia.ts:104-107` declara un supuesto y dice tenerlo atado: *«el test `ninguna línea del GTFS
empieza por 0` se pone rojo»*.

```
   grep -rn "empieza por 0"  →  1 acierto, y es el COMENTARIO. Ningún test.
   ⭐ pero el test existe con otra redacción:
      tests/motor-vivo/identidad-de-linea.test.ts:83
         it('⚠️ EL SUPUESTO, ATADO: ninguna línea del GTFS empieza por cero', …)
      :89  const conCero = lineas().filter((l) => l.shortName.startsWith('0'));
```

✅ **Valla real.** ⚠️ El único fallo es de cita: el comentario escribe «0» donde el test escribe
«cero», y buscarlo literalmente no lo encuentra. **Es la ley 140 en pequeño: una cita es una
afirmación**, y ésta manda a un sitio que existe con un nombre que no es.

### 2.5 · ⛔⛔ CORRECCIÓN — «de transbordo, 003 no tiene NADA» es FALSO

⚠️ **Esto corrige `docs/RECONOCIMIENTO-H2-HERENCIA-003.md` §6·1 y §2.3·M6, del 10/08**, que
publicaron: *«De transbordo, 003 no tiene NADA. Medido sobre sus 199 ficheros TypeScript: los 13
aciertos de `transfer|transbordo` son chips de interfaz.»*

**Lo que lo destapa** — `src/engine/topologia.ts:279-284`, leído para otra cosa:

> *«⛔ AQUÍ VIVÍAN `transbordosDe` y `lineasQuePasanPor`. Se RETIRARON las dos: quien arma "las
> líneas que pasan por aquí" (con su sentido, separando normales de provisionales) y **los
> transbordos del itinerario** es ahora `engine/correspondencias.ts`, que manda con el ÍNDICE
> DIARIO —de hoy, no "habitualmente"— y cae a ESTO solo en modo degradado (sin índice).»*

**El recuento, rehecho con el mismo comando:**

```
   grep -rl "transfer\|transbordo" src/ tests/ e2e/ --include=*.ts --include=*.tsx
      11 ficheros    ⚠️ la afirmación decía 13
      ⛔ y TRES de los once NO son interfaz:
         src/engine/correspondencias.ts         338 líneas
         src/engine/topologia.ts                335 líneas
         src/sources/avanza/correspondencias.ts 277 líneas  (sale por «correspondencia»)
```

**Qué es en realidad**, por su superficie exportada (⛔ **medida con `grep`, el fichero NO se
abrió**):

```
   correspondenciasDeParada · correspondenciasDePoste · otrasLineasEnPoste
   ArtefactoIndice · leerIndice · estadoIndice   ← con estado de FRESCURA
   RUTA_INDICE = data/generated/correspondencias.json
   y en sources/avanza/: fundirCorrespondencias · RATIO_SUELO = 0.8 · alcanzaElSuelo
```

⇒ **El veredicto correcto, en tres partes:**

- ⛔ **FALSO** que sean chips de interfaz. Son **615 líneas de `engine/`** más 277 de fuente, con
  índice horneado, modo degradado y un **suelo de cobertura declarado** (`RATIO_SUELO = 0.8`).
- ✅ **SIGUE SIENDO CIERTO** que 003 no tiene **enrutado** de transbordo: nada enlaza dos paradas
  distintas, ni calcula un tramo a pie, ni mete el tiempo en la ecuación. La pregunta que responde
  es *«¿qué otras líneas paran EN ESTE MISMO POSTE?»*.
- ⚠️ **Y lo que 004 sí puede heredar como DECISIÓN**, que la afirmación falsa hizo invisible:
  *las correspondencias se resuelven en UN SOLO SITIO, con un índice del día y un suelo de
  cobertura explícito; el modo degradado cae a la fuente cruda y se dice.*

⛔ **Esta corrección tiene que subir al estado**: la frase está en `DESPLAZAME-ESTADO.md:2825-2826`
y como titular de la tanda en `:1615`. **No la toco.** Ver §6·1 y bitácora 179.

---

## §3 · T2 — EL CRUCE `813x`

### 3.1 · El grupo que sí tengo

`data/exploracion/2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json`, **944 features**:

```
   PA08130   41.652516  -0.886390   Ramón Y Cajal / Camón Aznar
   PA08131   41.654801  -0.886428   Conde Aranda N.º 10
   PA08132   41.653323  -0.889388   Madre Rafols N.º 13
   PA08133   41.652308  -0.886927   Madre Rafols / Ramón Y Cajal
```

Los cuatro son un **racimo del centro**, entre 50,2 m y 295,8 m unos de otros.

### 3.2 · ⛔ El grupo que NO tengo — `NO CONSTA`

```
   PA08134 · PA08135 · PA08136 · PA08137   →  0 de 4 en el WFS del 10/08
   ⭐ y en TODO el rango 080xx–082xx el WFS solo tiene:
      PA08000 · PA08130 · PA08131 · PA08132 · PA08133      (5 códigos)
```

⛔ **`NO CONSTA` las coordenadas de `PA08134`–`PA08137`.** No están en el WFS de hoy, no están en el
GTFS y **el inventario de ZGZ RADAR está fuera de mi alcance**. No se estiman.

**Qué haría falta, exactamente:**

1. el inventario de paradas de ZGZ RADAR —la fuente de la que 003 citó esos cuatro—, **o**
2. una captura del WFS municipal **anterior al 13/07/2026**, para ver si aquel día daba `8134-8137`
   donde hoy da `8130-8133`.

Con cualquiera de las dos, la medida es inmediata: distancia de cada uno al más cercano del otro
grupo. **Sin ninguna de las dos, la pregunta no se puede responder.**

### 3.3 · ⭐ El positivo de control — qué significa «cerca» aquí

Aunque el veredicto sea `NO CONSTA`, el control se mide, porque es lo que haría falta para leer el
resultado el día que llegue el otro grupo:

```
   postes distintos a menos de 600 m de PA08130 ....... 39
      PA08133   50,2 m     ⇐ el más cercano de todos
      PA00093  169,1 m     PA03007  177,2 m     PA00317  227,2 m
      PA08131  254,1 m     PA08132  264,7 m
```

⇒ **En esta zona, dos postes distintos están típicamente a 170–300 m, y el par más apretado a 50
m.** Traducción para el día que haya datos: si un `8134` cayera **a menos de ~20 m** de un `813x`
de hoy, sería el mismo poste renumerado; **a 150 m o más**, es otro poste.

### 3.4 · Veredicto

⛔ **`NO CONSTA`. Ni «ocho postes» ni «cuatro renumerados».**

⚠️ **Y lo que sí se puede decir sin adjudicar, que es poco y hay que declararlo como tal:** el
sesgo apunta a una sola causa —los ocho códigos son consecutivos, ninguno de los ocho está en el
GTFS, y el corte cae entre `8133` y `8134`, **en un número y no en un sitio**—. La renumeración de
un bloque explicaría eso; la existencia de ocho postes reales también, si los cuatro que faltan
fueran retirados. **`CAUSA NO CONFIRMADA`: no tengo cómo separarlas.**

---

## §4 · T3 — LOS DOS 934: INTERSECCIÓN, NO RESTA

**A** = paradas usadas por alguna ruta de `route_type` 704 · **B** = paradas cuyo `stop_code`
empieza por `PA`.

```
   |A|      934          |B|      934
   |A ∩ B|  934
   |A \ B|    0          |B \ A|    0
   ⇒ A = B.  CABO CERRADO.
```

### 4.1 · ⚠️ Sale limpio a la primera, así que primero la sospecha (ley 108)

**Cómo sé que no estoy comparando una lista consigo misma:** los dos conjuntos salen de **ficheros
distintos y por caminos distintos**.

```
   A  ←  stop_times.txt  ×  trips.txt  ×  routes.txt (columna route_type)
   B  ←  stops.txt, columna stop_code
```

⭐ **Y el control que lo demuestra: el criterio B NO casa con todo.** Aplicado al universo entero
de 984 paradas deja fuera exactamente las 50 del tranvía:

```
   paradas de tipo 900 (tranvía) ....................... 50
   de ellas, con stop_code que empieza por PA .......... 0
   con stop_code VACÍO ................................. 0 de 50
```

⇒ Si `B` casara con cualquier cosa, habría dado 984. Da 934 **porque los 50 del tranvía tienen
código y no es de la forma `PA`**.

### 4.2 · ⭐⭐ La contraprueba destapó más de lo que se le pedía

Al mirar **qué forma tienen** esos 50 códigos apareció lo de §2.1: son de **cuatro cifras**
(`2101`, `2301`, `2401`, `2501`, `0101`) y la fórmula publicada por 003 los colapsaría al poste
`1`. **T3 se abrió para cerrar un cabo de recuento y acabó midiendo una valla.**

### 4.3 · Consecuencia

✅ **El cruce contra el WFS de ayer se hizo contra el conjunto CORRECTO.** No hay nada que rehacer.
⇒ La forma de `A·V2` —dos medidas del mismo universo divergiendo— **no se reproduce aquí**.

---

## §5 · T4 — LOS TERMINALES VARIABLES

### 5.1 · ⛔⛔ EL POSITIVO DE CONTROL SALIÓ ROJO. Y eso para el veredicto

La consulta encargada —*terminal = última parada por `stop_sequence`; contar terminales distintos
por línea y sentido*— se aplicó a las tres dianas **y a seis líneas que Antonio no nombró**.

```
   DIANAS              CONTROL (no nombradas)
   34  → 2 · 2         21  → 2 · 1        29  → 1 · 1
   23  → 2 · 3         35  → 3 · 2        40  → 1 · 1
   44  → 2 · 1         39  → 2 · 3        24  → ⛔ no existe en routes.txt
```

⛔ **Tres de las seis de control dan dos o tres terminales.** Extendido a los 74 sentidos de bus:

```
   sentidos con 1 terminal ....... 53   (72 %)
   sentidos con 2 terminales ..... 18
   sentidos con 3 terminales ......  3
   ⇒ «≥2 terminales» ocurre en 21 de 74. NO es la excepción que la consulta suponía.
```

⇒ **La consulta encargada no puede distinguir «esta línea tiene dos destinos» de «los últimos
servicios del día se quedan cortos».** Según la costura del encargo, **su veredicto se para aquí**.
Lo que sigue es **diagnóstico del rojo**, no la medida encargada.

### 5.2 · ⭐ La causa, y la medida que sí separa

Los terminales de sobra de las líneas de control son **colas**: 1, 4, 6, 7, 9, 11 ó 24 viajes sobre
600, y todos saliendo entre las 22h y las 25h. La medida que los separa no es *cuántos* terminales
hay, sino **qué cuota de los viajes se lleva el segundo**.

```
   cuota del 2º terminal, los 5 mayores de los 74 sentidos de bus:
      44  s0   39 %   Campus Río Ebro          vs  Pablo Ruiz Picasso N.º 35
      23  s0   32 %   Clara Campoamor          vs  Av. José Atarés / Noria Siria
      41  s1    7 %   Hernán Cortés N.º 9      vs  Hernán Cortés N.º 10
      Ci2 s1    6 %   Camino De Las Torres 3   vs  Camino De Las Torres / Silvestre
      38  s0    6 %   Plaza San Miguel N.º 5   vs  Tulipán N.º 67

   con el 2º terminal ≥ 10 % de los viajes ....  2 de 74
   con ≥2 terminales pero el 2º < 5 % (colas) ... 15
```

⭐⭐ **El control corregido pasa, y pasa a ciegas:** la medida no sabe qué líneas nombró Antonio, y
**selecciona dos de sus tres**. Las 72 restantes quedan fuera.

⚠️ **Y el umbral no lo elijo yo, aunque lo parezca** (ley 17/22 — quien elige la diana). Escogí el
10 % **después** de ver los datos, así que no puede confirmarse a sí mismo. Lo que lo sostiene es
que **entre el 2º puesto (32 %) y el 3º (7 %) hay un salto de 4,5×**: cualquier corte entre el 8 %
y el 30 % da exactamente las mismas dos líneas. **El hueco está en el dato, no en mi número.**

### 5.3 · El determinante de cada una — y coincide con lo que dice Antonio

**LÍNEA 44 · sentido 0 — corta por DÍA, y limpio:**

```
                    Pablo Ruiz Picasso    Campus Río Ebro
   laborable                 23                 117
   sábado                    79                   0
   domingo                   42                   0
   festivo/mixto             42                   0
   y dentro del laborable: Campus Río Ebro solo entre las 07h y las 20h
```

⇒ **DÍA Y HORA.** Un cero perfecto en fin de semana no es una cola: es un destino que solo existe
los días lectivos y en horario de campus.

**LÍNEA 23 · sentido 0 — corta por HORA, con gradiente de día:**

```
   04h  0|2     08h 33|0     14h 28| 8     20h 14|22
   05h  1|13    09h 39|0     15h 27|11     21h 10|22
   06h 13|8     10h 36|0     16h 28|10     22h  2|28
   07h 26|2     11h 35|0     17h 27|12     23h  0|18
                12h 35|0     18h 27|13     24h  0|14
   (izq. Noria Siria · der. Clara Campoamor)
   por día:  laborable 234|31 · sábado 148|58 · domingo 30|65
```

⇒ **HORA**, y de las dos puntas: Clara Campoamor se lleva **todo** de 23h a 25h y **casi todo** de
04h a 05h, y **cero** entre las 08h y las 12h. ⚠️ El domingo se invierte el reparto (30|65), así
que el día también pesa.

**⭐ CONTRASTE — una cola, para que se vea que no es lo mismo.** Línea 39 sentido 1, 2º terminal al
4 %: `Coso N.º 188` **solo** aparece de 22h a 24h y **nunca** antes. Correlaciona con la hora
igual de bien — pero es el final del servicio, no un segundo destino. ⇒ **Correlacionar con la
hora NO distingue las dos cosas. Lo que las distingue es la cuota, y en la 44, el corte por día.**

### 5.4 · ⚠️ LA 34 NO SALE VARIABLE EN ESTE FEED

```
   34 s0:  645 viajes a «Fray Julian Garces / Cementerio»
             8 viajes a «P. Pamplona N.º 1 / Plaza Paraíso»   (1,2 %)
   34 s1:  658 a «Estación Delicias / Acceso Llegadas» · 1 a «Glorieta De Sasera»
```

⇒ El segundo terminal de la 34 es una **cola**, y **no es el Parque de Atracciones**.

**Y lo que el dato NO puede decir, dicho en voz alta:** que la 34 se prolongue cuando el parque
abre lo sabe Antonio **por usar el servicio**. El calendario del parque no está en el GTFS ni tiene
por qué. **Este feed cubre del 23/06 al 05/10 y en ese periodo no hay ni un viaje al parque. No se
sigue que no exista otro periodo en que lo haya** — sigue sin poderse afirmar ni negar.

### 5.5 · ⛔ `PA00617`: la comprobación pedida NO PUEDE FALLAR, así que no prueba nada

```
   ¿está PA00617 en stops.txt? ................. NO
   filas de stop_times con ese stop_id ......... 0
   ⭐ positivo de control: PA00338 «Coso N.º 126» → 2.226 filas
```

⚠️ **El cero es real, y es vacío de contenido.** `stop_times.txt` referencia `stop_id`, y el
`stop_id` de `PA00617` **no existe**: ninguna fila podría citarlo aunque el servicio existiera. ⇒
**La prueba propuesta solo tenía un resultado posible** y por tanto **no distingue nada** (ley 96).

⛔ **La cadena «no hay viajes ⇒ el publicador quita la parada de `stops.txt`» SIGUE SIENDO
INFERENCIA.** No queda cerrada.

⭐ **Y hay una razón de fondo por la que no podía cerrarse aquí:** quien serviría el Parque de
Atracciones no es la 34 —cuyo destino es el Cementerio— sino la `104/LAN`, *«Lanzadera Cementerio -
Parque Atracciones»*, que **es una de las ocho rutas zombi**. La pregunta se le hizo a la línea
equivocada.

### 5.6 · ⭐⭐⭐ LO QUE ESTO ABRE PARA «H2 SIN RELOJ» — hallazgo, no propuesta

`DESPLAZAME-ESTADO.md:1518` define H2 como *«Paradas, líneas y transbordos encima del terreno.
**Sin reloj**»*, y su cierre como *«sabe que el 29 conecta A con B»*.

**El dato medido dice esto, y nada más que esto:**

```
   línea 23, sentido 0:   68 % de los viajes terminan en Noria Siria
                          32 % terminan en Clara Campoamor
                          entre las 08h y las 12h, los que van a Clara Campoamor son CERO
```

⇒ **La pregunta «¿la línea 23 sirve Clara Campoamor?» no tiene respuesta sí/no.** Tiene una
respuesta que depende de la hora, y a las diez de la mañana esa respuesta es **no**.

⚠️ **Cómo muerde, dicho como hecho y no como diseño:** una red construida sin reloj solo puede
responder una de dos cosas, y las dos son falsas parte del tiempo — **«sí, la sirve»** (falso a las
10h) o **«no la sirve»** (falso a las 22h). ⭐ **Y el modo de fallo no es simétrico:** el «sí»
manda a alguien a esperar un autobús que no va a venir; el «no» le esconde uno que sí. **El primero
se paga en la calle.**

⛔ **Cuántas líneas afecta, medido, para que la decisión se tome sobre un tamaño y no sobre una
anécdota: 2 sentidos de 74** con la medida corregida. **No es la red entera: son dos.**

⛔ **No decido nada de esto.** Decide Antonio.

---

## §6 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ **`DESPLAZAME-ESTADO.md` no se toca.**

1. ⛔⛔ **CORRECCIÓN URGENTE, y es de una frase que ya está en el estado.**
   `DESPLAZAME-ESTADO.md:2825-2826` y `:1615` publican *«de transbordo, 003 no tiene NADA … los 13
   aciertos son chips de interfaz»*. **Falso.** Son **11** ficheros, y tres son motor:
   `engine/correspondencias.ts` (338), `engine/topologia.ts` (335),
   `sources/avanza/correspondencias.ts` (277). ✅ Sigue siendo cierto que **no hay ENRUTADO** de
   transbordo. ⚠️ Y hay decisión heredable que la frase falsa tapó: **índice diario, un solo sitio,
   suelo de cobertura declarado (`RATIO_SUELO = 0.8`), modo degradado que se dice.** Bitácora 179.

2. ⭐⭐⭐ **El documento de 003 describe su puente de identidad PEOR de lo que está.** La fórmula
   publicada, `int(stop_code[2:])`, aplicada a los códigos de cuatro cifras del tranvía **colapsa
   tres paradas distintas al poste `1`, sin error**. El código real usa `/^PA(\d{5})$/` y devuelve
   `null`. ⇒ **004 no puede heredar la frase: tiene que heredar la regex.**

3. ⭐⭐ **T4: el positivo de control salió rojo y la consulta encargada se para.** «≥2 terminales»
   ocurre en **21 de 74** sentidos de bus. La medida que sí separa es la **cuota del segundo
   terminal**, y deja **2 de 74**: `44 s0` (39 %, corta por DÍA) y `23 s0` (32 %, corta por HORA).
   El control corregido acierta **dos de las tres** líneas de Antonio a ciegas.

4. ⭐⭐⭐ **Un terminal que depende de la hora rompe el enunciado de «H2 sin reloj»** para 2 de 74
   sentidos: la línea 23 no sirve Clara Campoamor entre las 08h y las 12h. **Los dos veredictos
   posibles sin reloj son falsos parte del día, y el «sí» falso es el que se paga en la calle.**
   Hallazgo, no propuesta.

5. ✅ **T3 cerrado: A = B, 934 = 934, intersección 934, diferencias 0.** El cruce contra el WFS se
   hizo contra el conjunto correcto. La forma de `A·V2` no se reproduce.

6. ⛔ **T2 `NO CONSTA`.** `PA08134`–`PA08137` no están en ninguna fuente a mi alcance; el WFS de hoy
   solo tiene `PA08000` y `PA08130`–`PA08133` en todo el rango. Haría falta el inventario de ZGZ
   RADAR o un WFS anterior al 13/07. **Control medido para cuando llegue: en esa zona dos postes
   distintos están a 170–300 m, y el par más apretado a 50,2 m.**

7. ⭐ **La prueba de `PA00617` que pedía el encargo no podía fallar.** Su `stop_id` no existe en
   `stops.txt`, así que el cero en `stop_times` estaba garantizado. **La cadena sigue siendo
   inferencia.** Y la pregunta iba a la línea equivocada: quien serviría el parque es la `104/LAN`,
   que es zombi.

8. ⭐ **La ruta que 003 publica de su propio puente no existe:** el documento dice
   `sources/avanza-zaragoza/identity.ts`; está en `src/sources/gtfs-nap/identity.ts`. Y el fichero
   se abre diciendo *«ES ESPECÍFICO DE AVANZA»* desde la carpeta del GTFS.

9. ⭐⭐ **003 se queda con el viaje MÁS LARGO de cada (línea, sentido) y tira el resto**
   (`adapter.ts:242-244`: *«los viajes cortos son refuerzos y variantes, y darían un recorrido
   truncado»*). ⇒ **Su ruta oficial es la variante MÁXIMA**, así que por construcción **no puede
   ver un terminal variable: lo colapsa.** ⛔ Para H2, donde la pregunta ES qué paradas sirve una
   línea, esa decisión **sobrestima la cobertura** y no se hereda sin declararlo.

10. **El código de 003 nombra a 004 dos veces** (`identity.ts:10`, `adapter.ts:61`: *«`['bus','tram']`
    para el 004»*). La puerta multimodal está abierta **en el código**, no solo en la prosa.

11. **Cuatro vallas de cinco están en el código; V3 está además en el tipo y en un test.** La única
    entreabierta es V5: `posteFromStopCode` **se re-exporta en el barril** `gtfs-nap/index.ts` —así
    que sale de su carpeta— aunque **nadie lo importa desde fuera**. Valla cumplida en los hechos,
    no en la estructura.

12. ⚠️ **La línea `24` no existe en `routes.txt`**, y la elegí como control sin comprobarlo. El
    script lo dijo en vez de callarlo. Es la misma clase que `EM3`.

---

## §7 · LÍNEAS BASE DE LA BATERÍA

```
   ANTES    ARRANQUE 2026-08-10T14:06:02+02:00  →  FIN 2026-08-10T14:25:23+02:00   exit=0
   DESPUÉS  ARRANQUE 2026-08-10T14:29:35+02:00  →  FIN 2026-08-10T14:47:28+02:00   exit=0

   ⇒ la de arranque terminó a las 14:25:23 y el primer fichero de esta tanda se escribió
     DESPUÉS. No corrieron en paralelo.
```

### 7.1 · La comparación, con `diff` y no a ojo

```
   diff  bateria-ANTES.txt  bateria-DESPUES.txt      (sin las líneas ARRANQUE/FIN/exit)
   112 líneas   vs   112 líneas          ⇒  salida VACÍA: IDÉNTICAS
```

⚠️ **Y lo que las dos traen en amarillo, que es previo a esta tanda y sigue igual:** `ruta.js` sale
en **código 2 sin declarar nada**, y la batería lo destapa en vez de tragárselo. Los tres rojos
declarados —`modelo-rutas.js`, `auditoria-guardianes.js`, `rutas-antonio.js`— siguen en 1.

⇒ **Esta tanda no movió ni un instrumento.** Fue lectura de 003, medición sobre el ZIP del 10/08 y
escritura de dos documentos.
