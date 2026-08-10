# DISEÑO H2a · LA RED — bus + tranvía + transbordo a pie

**Fecha: 10/08/2026** · H2a · tanda 4 · `004_DESPLÁZAME`

> ⛔⛔⛔ **ESTO ES UNA PROPUESTA. NADA DE LO QUE HAY AQUÍ ESTÁ CONSTRUIDO.**
> **Este documento NO describe el motor de H2a: lo PROPONE.** Ni una línea de código de producto
> existe cuando esto se escribe. Cualquier auditoría que lea una decisión de aquí como si fuera un
> hecho del sistema estará leyendo mal el documento — **y esa confusión ya pasó una vez en este
> proyecto** (`B·V1`, retirado, `DESPLAZAME-ESTADO.md:2132`).

⚠️ **Lo que sí está medido son las CIFRAS.** Todas salen del GTFS de `data/exploracion/` del 10/08
o del grafo de H1, con su comando al lado. Las decisiones son propuestas; los números no.

⛔ **Fuera por decisión de Antonio:** el stack, la bici y las estaciones BiZi (son **H2b**), y el
reloj. **H2a no tiene lógica temporal de ninguna clase.**

---

## §0 · SI SOLO SE LEE UNA COSA

⭐⭐⭐ **La aritmética que decide el hito, medida:**

```
   pares de paradas totales   N(N-1)/2 con N=984 ........  483.636
   pares a ≤ 300 m a vuelo de pájaro ....................    3.231   (0,668 %)
   de ellos, los que aportan una línea nueva ............    2.538
   ⇒ el transbordo no es un problema de 483.636 rutas peatonales. Son 2.538.
```

⭐⭐ **Y la costura que nadie más hace bien, también medida: 48 de las 50 paradas del tranvía tienen
un autobús a menos de 300 m, con mediana 73 m.** Las dos que no son las de Juslibol, a 418 m.

⛔ **Y la decisión más cara del hito es D1**, porque hay **dos convenios de código en la misma
columna** y la forma ingenua de unificarlos **colisiona 15 veces en silencio**.

---

## §1 · D1 · LA IDENTIDAD DE UNA PARADA

### 1.1 · Lo que hay, medido — no lo que se supone

```
   node …/d1-identidad.js   sobre stops.txt del feed 20260623_AUZSA_Y_TRANVIA
                    stop_code           stop_id
      BUS      "AA99999"  934/934    "99999"  934/934      ⇐ PA + 5 dígitos
      TRANVÍA  "9999"      50/50     "9999"    50/50       ⇐ 4 dígitos, sin letras
   (forma: 9 = dígito · A = letra)
```

**Tres hechos que el diseño puede usar porque están contados, no supuestos:**

```
   stop_id distintos en todo stops.txt .................. 984 de 984   ✅ ya es clave
   stop_code distintos ............... bus 934/934 · tranvía 50/50     ✅
   intersección LITERAL de los stop_code de los dos modos ....... 0    ✅
```

### 1.2 · ⛔⛔ El peligro, medido: la colisión aparece al NORMALIZAR

Los dos convenios conviven sin rozarse **mientras se traten como cadenas**. El choque llega en
cuanto alguien «limpia» el código para quedarse con el número.

```
   Si se quita el prefijo y se conserva el número:  15 números quedan compartidos
      nº 301  ←  "PA00301" Camino Del Pilón / Ibón De…   ·   "0301" Juslibol
      nº 401  ←  "PA00401" Av. De Montañana N.º 876      ·   "0401" Campus Río Ebro
      nº 601  ←  "PA00601" Miguel Servet / 3er Cinturón  ·   "0601" Legaz Lacambra
      … 15 en total
```

⛔⛔ **Y con la fórmula que 003 publica —`int(stop_code[2:])`— es mucho peor**, porque los códigos
del tranvía tienen **cuatro** cifras y se les corta por la mitad:

```
   nº  1  ×24    "0101" "0201" "0301" "0401" …      ⇐ VEINTICUATRO paradas al mismo número
   nº  2  ×23    "PA00002" "0102" "0202" "0302" …   ⇐ y aquí choca el bus CON el tranvía
   nº 22  ×3     "PA00022" "2322" "2422"
   ⭐ POSITIVO DE CONTROL: con /^PA(\d{5})$/ los números colisionados son 0.
```

⭐ **Ahí está la ley 145 medida en 004 y no citada de 003:** la valla estaba en la regex.
**`PA00002` y `2102` colisionan de verdad**, y ni uno de los 47 choques da error: dan un número con
toda la pinta de ser bueno.

### 1.3 · ⭐ LA PROPUESTA

**Una parada se identifica por su `stop_id` del feed, tal cual, como cadena opaca.** Nada de
números. Nada de prefijos quitados.

```
   ParadaId  =  el stop_id del GTFS, cadena, sin transformar.        984 valores, 984 distintos.
```

**Y el número de poste de Avanza —que hace falta, porque es lo que la gente lee en la marquesina—
NO es la identidad: es un ATRIBUTO, y solo lo tienen las de bus.**

**La fórmula, escrita como se va a implementar** (ley 145: exacta, anclada y completa; ⛔ no hay
versión simplificada de esto en ninguna parte del documento):

```
   posteDeAvanza(stopCode):
      si stopCode es nulo o vacío            → NO TIENE
      si NO casa  /^PA(\d{5})$/              → NO TIENE          ⇐ ancla al principio Y al final
      n = entero decimal del grupo 1
      si n <= 0                              → NO TIENE
      devuelve n
```

⚠️ **Por qué cada trozo, porque un ancla sin motivo se borra en la primera refactorización:**

| trozo | qué impide, medido |
|---|---|
| `^` … `$` | Que `"XPA00002Y"` pase. Sin anclas, cualquier cadena que **contenga** el patrón valdría |
| `PA` literal | Que entre un código de tranvía. Los 50 son `\d{4}` y **ninguno lleva letras** |
| `\d{5}` exacto | ⭐ **Es el ancla de verdad.** Un código de tranvía tiene 4 dígitos: con `\d+` casaría `"2101"`… si llevara `PA`. Y sobre todo: **fija el convenio observado** (934/934) en vez de aceptar lo que venga |
| `n <= 0` fuera | Que un `"PA00000"` futuro se cuele como poste 0 |
| **NO TIENE** ≠ error | Los 50 del tranvía **no tienen poste y eso es correcto**, no una excepción |

**⭐ Y el tranvía NO recibe un puente equivalente.** No se inventa un «poste de tranvía»: su
`stop_code` de cuatro cifras se guarda **como cadena y sin interpretar**, porque `NO CONSTA` qué
significa. Interpretarlo sería exactamente el fallo de 003 con el signo cambiado.

### 1.4 · ⭐ DÓNDE VIVE, Y QUÉ IMPIDE QUE SALGA

**La valla no es un párrafo: es un sitio.** Propuesta:

```
   tools/gtfs/identidad.js      ⇐ ÚNICO fichero que conoce la forma "PA" + 5 dígitos
   tools/gtfs/*                 ⇐ el resto del cocinado del feed
   src/…                        ⇐ el motor. Ve ParadaId y un atributo `poste` que puede faltar.
```

**Tres cosas la sostienen, y las tres son comprobables:**

1. ⭐ **La regla textual**: el prefijo `PA` **solo** puede aparecer en `tools/gtfs/identidad.js`.
   Es un `grep`, y da un número:

```
   grep -rn "PA[0-9]" src/ | wc -l          0     ⇐ hoy, medido
   grep -rnE "['\"]PA['\"]" src/ | wc -l    0
   ⭐ POSITIVO DE CONTROL — el mismo grep, donde el prefijo SÍ está:
   grep -rn "PA0" docs/RECONOCIMIENTO-H2-CABOS.md | wc -l    19
```

   ⇒ **La regla nace cumplida y el buscador no está roto.** Un cero sin ese 19 al lado no valdría
   nada (ley 4).
2. ⭐⭐ **El invariante que se puede poner rojo**: recorrer las 984 paradas y exigir
   **934 con poste y 50 sin él**. Si alguien «arregla» el tranvía para que también tenga, sale rojo.
3. ⭐⭐⭐ **El caso de las 24**: una comprobación que meta los 50 códigos del tranvía por
   `posteDeAvanza` y exija **50 NO TIENE**. ⛔ **Con la fórmula de 003, esta prueba da 24 al poste 1
   y se pone roja.** Es decir: **existe un resultado que la haría fallar** (ley 147), y se sabe cuál.

**Coste de esta decisión:** el `stop_id` **no se lee en la calle**, así que toda pantalla y toda URL
que quiera hablar de un poste tendrá que traducir. Se paga una indirección en cada punto de
entrada. ⚠️ **Y para el tranvía no hay nada que traducir**: sus paradas no tendrán número público.

---

## §2 · D2 · EL MODELO

### 2.1 · Las cuatro entidades, y qué NO llevan

```
   PARADA    id (stop_id, opaco) · nombre · lat/lon · modo(bus|tranvía) · poste?    · procedencia
   LÍNEA     id (route_id)  · corta · larga · modo · operador · color?              · procedencia
   SENTIDO   línea + dirección(0|1) · rótulo · secuencia ORDENADA de paradas
             + terminal{mayoritario, cuota, determinante}                            ⇐ §2.2
   ENLACE    paradaA · paradaB · metros ANDANDO · veredicto                          ⇐ §4
```

**Qué NO se guarda, y por qué — que es la mitad del modelo:**

| no se guarda | por qué |
|---|---|
| **Ni un horario, ni una frecuencia, ni una hora** | H2a es sin reloj. `stop_times.txt` (47 MB, 870.717 filas) entra **solo** para derivar secuencias, terminales y qué paradas se usan; **sus horas no sobreviven al cocinado** |
| **El número de poste como identidad** | §1 |
| **Una geometría mezclada** | Heredado de 003: cada geometría con su procedencia y **no se mezclan jamás**. En 004 hay tres fuentes (eje de calzada, acera, `shapes.txt`) y es donde más tienta |
| **Un nombre «arreglado»** | Los nombres del GTFS están rotos en el 80,4 % y **es con pérdida**: de `Iii` no se vuelve a `III`. Se guarda el del feed, **marcado como del feed** |
| **Un valor por defecto en sitio de un dato ausente** | 003 pintaba paradas en `0,0` por un `?? 0`. Aquí una parada sin coordenadas **rompe el cocinado**, no avisa |

### 2.2 · ⭐ El terminal variable entra COMO DATO, y nada más

```
   terminal: { mayoritario: ParadaId, cuota: 0..1, determinante: 'DÍA'|'HORA'|'NO CONSTA' }
```

**Los dos únicos casos medidos de los 74 sentidos de bus** (`44 s0`: 39 %, corta por DÍA · `23 s0`:
32 %, corta por HORA) llevan su `determinante` puesto. **Los otros 72 llevan `NO CONSTA`** — que
aquí significa *«no se ha medido un determinante»*, **no** *«no lo tiene»*.

⛔ **Y el modelo NO sabe qué es un día ni qué es una hora.** El campo `determinante` es **una
etiqueta**, no una condición evaluable. Nada en H2a lee la hora del reloj para decidir nada. ⇒ La
única consecuencia del campo es que **se imprime** (§5).

⚠️ **Coste declarado, y es grande:** con esto, la red publica que la línea 23 sirve Clara Campoamor
**siempre**, y añade al lado que depende de la hora. **Sigue siendo una afirmación falsa parte del
día, y solo la nota la salva.** Es el precio de no meter el reloj, y va escrito para que se pueda
revisar cuando llegue H3.

### 2.3 · Las 8 rutas zombi: dónde se filtran

```
   node …/t4-terminales.js     de 53 rutas, 45 tienen viajes · de 52 de bus, operan 44
   sin ni un viaje:  102/CEM · 103/CE · 104/LAN · 131/EM1 · 132/EM2 · 201/V1 · 203/ES3 · 204/V4
```

**Se filtran en el cocinado, contra `trips.txt`, con la regla «esta ruta tiene ≥1 viaje en el
feed»** — ⛔ **nunca contra una lista negra escrita a mano**, que se queda obsoleta y miente en
silencio (decisión heredada de 003, ya aprobada; ley 40).

⭐ **Y se CUENTAN al filtrar**: el cocinado dice *«8 rutas sin ningún viaje, descartadas»*. Un
filtro que no dice cuánto quitó es indistinguible de uno roto.

⚠️ **Coste:** `EM3` aparece en documentación de 003 y **no existe en este feed**. Con la regla, si
un día vuelve con viajes, entra sola. Con una lista, alguien tendría que acordarse.

### 2.4 · La caducidad, que es por operador

```
   feed_start 20260623 · feed_end 20261005
   bus: 0 filas de calendar_dates fuera del rango.       tranvía: 72 filas posteriores, todas activas
```

⇒ El modelo guarda la **vigencia declarada del feed** y, aparte, **lo que cada operador hace con
ella**. ⛔ No se «arregla» al tranvía recortándole las fechas: se guarda lo que dice y se enseña.

---

## §3 · D3 · EL ENGANCHE DE LOS POSTES AL GRAFO PEATONAL

### 3.1 · Un poste no es un portal, y la diferencia importa

| | portal (H1) | poste (H2a) |
|---|---|---|
| qué es | una **puerta**, en la fachada | un **punto en la acera o en la calzada** |
| a qué debe engancharse | a la calle de su portal | ⭐ **a la acera por la que se llega**, y **al lado correcto** |
| si engancha mal | la ruta empieza en la calle de al lado | ⛔ **manda a cruzar** — y H1 ya tiene un instrumento que se llama `acera-equivocada.js` |

⇒ **El enganche de un poste es el problema de la acera equivocada otra vez**, y con más
consecuencia: un portal mal enganchado cuesta metros; **un poste mal enganchado cuesta un cruce que
no existe.**

### 3.2 · ⛔ MEDICIÓN PENDIENTE — no se supone

H1 publica `AVISO_ENGANCHE_M = 65` (`src/ruta.js:151`), y es **el p99 del callejero de portales**.

⛔⛔ **Nadie ha medido a qué distancia enganchan los 984 postes.** No se hereda ese 65: **un poste
está en la vía pública y un portal en una fachada; no tienen por qué distribuirse igual.**

**La medición que hace falta, especificada para que se pueda ejecutar tal cual:**

```
   Para cada una de las 984 paradas:
     · distancia al nodo más cercano del grafo a pie de H1
     · si el enganche cae en una arista `eje-de-calzada` o en una `acera`
     · en qué componente del grafo cae
   Y se publica: mediana · p90 · p99 · máximo · el listado de las que pasen del p99
   ⭐ Positivo de control: los diez orígenes/destinos de RUTAS-CONOCIDAS.md, que ya
      tienen enganche conocido, tienen que dar el mismo valor que dan hoy.
```

⚠️ **Y el diseño de D4 SÍ depende de ese número**, así que aquí queda declarado: **hasta que se
mida, el radio de 300 m de §4 es una propuesta sobre distancias a vuelo de pájaro, no sobre
distancias andando.**

### 3.3 · Un dato del grafo que ya condiciona esto

```
   node src/rutas-antonio.js   ⚑ nodos=68649 aristas=98774 a-pie=94570
                               ⚑ componentes=170  mayor=65707
   ⇒ 2.942 nodos (4,3 %) NO están en la componente mayor.
```

⇒ **Un poste puede caer en una isla.** Cuando pase, el enlace no existe — y eso es §4.4.

---

## §4 · D4 · EL TRANSBORDO

### 4.1 · ⭐⭐⭐ La aritmética, con el número delante

```
   N = 984 paradas          pares totales = N(N-1)/2 = 483.636
```

⛔ **Calcular 483.636 rutas peatonales no es aceptable**, y no por el tiempo: porque **el 99,3 % de
esos pares son parejas de paradas separadas por kilómetros**, y una ruta peatonal entre ellas es una
respuesta que nadie va a usar.

**El acotado propuesto, con su coste medido:**

```
   radio      pares ≤ radio     % del total    de ellos BUS↔TRANVÍA
     100 m             531        0,110 %            59
     150 m             955        0,197 %           108
     200 m           1.536        0,318 %           160
   ⭐ 300 m           3.231        0,668 %           272
     500 m           7.946        1,643 %           672
   1.000 m          28.022        5,794 %         2.601
```

**Y el segundo filtro, que quita los pares que no sirven de nada:**

```
   pares ≤300 m .................................... 3.231
   de ellos, SIN ninguna línea nueva que ofrecer ....   693     ⇐ las dos paradas dan lo mismo
   ⇒ PARES CANDIDATOS ..............................  2.538
```

⭐ **De 483.636 a 2.538: una reducción de 190×.** Y el orden de magnitud es el que decide el hito:
**2.538 rutas peatonales cortas es un cálculo de minutos, no de días.**

⭐ **Positivo de control del segundo filtro** (ley 147 — ¿qué resultado lo haría fallar?): si el
filtro no filtrara nada, los inútiles serían **0**; si filtrara todo, quedarían **0**. Da **693** y
**2.538**. **Discrimina.**

### 4.2 · ⚠️ Qué se pierde al acotar — declarado, no escondido

```
   paradas sin NINGUNA otra a ≤300 m ......  9 de 984
   paradas sin NINGUNA otra a ≤500 m ......  2 de 984
   la parada más aislada de todas .......... 592 m de su vecina más cercana
```

⇒ ⛔ **Ningún radio por debajo de 592 m le da pareja a todo el mundo.** Y eso **no es un defecto
del radio: es que hay paradas que están solas.**

**En la costura que importa —bus↔tranvía— el coste tiene nombre y apellidos:**

```
   radio    paradas de tranvía con un bus cerca
    150 m              46 de 50
    200 m              47 de 50
   ⭐300 m             48 de 50
    500 m              50 de 50
   distancia de cada parada de tranvía al bus más cercano:
      mín 20 m · mediana 73 m · p90 130 m · máx 418 m
   ⛔ las dos que se quedan fuera a 300 m:  "0301" y "0302" Juslibol, con el bus a 418 m
```

⚠️ **Propuesta: 300 m, y las dos de Juslibol se declaran.** ⛔ **No se sube el radio a 500 m para
que salgan**: subirlo multiplica los pares por 2,5 (3.231 → 7.946) **para ganar dos paradas**, y
además **500 m a vuelo de pájaro pueden ser 1.000 m andando** (§4.3). Prefiero decir *«Juslibol no
enlaza con el bus»* que fabricar un enlace de un kilómetro y llamarlo transbordo.

⭐ Y hay una simetría bonita en el dato: **`0301` Juslibol es uno de los 15 números que colisionan
en §1.2**, con `PA00301`. La misma parada aparece en los dos problemas del documento.

### 4.3 · ⭐⭐ Por qué el radio es solo un PRE-FILTRO — y esto lo cambia todo

Los rodeos **medidos** de las diez rutas de `RUTAS-CONOCIDAS.md` (`node src/rutas-antonio.js`):

```
   rutas LARGAS  (2,5 – 6,4 km)     rodeo 1,06 · 1,09 · 1,24 · 1,25
   rutas CORTAS  (477 – 598 m)      rodeo 1,10 · 1,32 · 1,37 · ⛔ 2,17
```

⭐⭐⭐ **El rodeo es PEOR y mucho más variable en los trayectos cortos — que son exactamente los del
transbordo.** La nº4 (Centro Etopía → Estación Delicias) recorre **506 m para salvar 233 m en línea
recta**.

⇒ **Un par a 300 m a vuelo de pájaro puede ser un paseo de 330 m o uno de 650 m.** Por eso:

- el **radio es un pre-filtro barato** que elige a quién se le calcula la ruta, y **nada más**;
- ⛔ **el coste de un enlace NO es la distancia recta jamás**, ni siquiera como aproximación;
- **el coste es los METROS ANDANDO por el grafo de H1.** Es lo que 004 tiene y los demás no.

### 4.4 · El coste de un enlace, y la costura de honestidad

**Propuesta: el enlace guarda METROS ANDANDO, no tiempo.**

⚠️ **Por qué metros y no minutos:** convertir a minutos exige una velocidad, y la de H1 está
**medida en 4,3–4,5 km/h con banda**, no como un número. Guardar minutos convertiría una banda en
un dato falso-preciso. **Los minutos se derivan al enseñar, con su banda, y ahí se dice que son
estimados.** (Es la ley de 003 aplicada: *«`0 kms.` significa "menos de 1 km", no "ha llegado"»*.)

⭐⭐ **Y la costura de honestidad, que es una decisión de diseño y no un caso de error:**

```
   veredicto del enlace:
      ENLAZA      hay ruta peatonal · se guardan los metros
      NO ENLAZA   hay ruta pero es absurda o el grafo no la tiene
      ⭐ SIN CAMINO   las dos paradas están en COMPONENTES DISTINTAS del grafo
```

⛔⛔ **`SIN CAMINO` es un RESULTADO, no un fallo.** El grafo de H1 tiene **170 componentes** y ya
sabe que **hay tres barrios rurales incomunicados de verdad** —Peñaflor está a 15 km y se llega por
carretera—. Si dos paradas no se enlazan andando, **la respuesta correcta es decirlo**, no fabricar
una línea recta para tapar el hueco.

⚠️ **Y aquí hay una comprobación que sí puede fallar** (ley 147): si el cocinado saliera con **cero
`SIN CAMINO`**, sería sospechoso, no tranquilizador — con 170 componentes y 4,3 % de nodos fuera de
la mayor, **algún par tiene que caer partido**. Un cero significaría que el pre-filtro de 300 m está
eligiendo solo pares del centro, y eso **hay que mirarlo**.

---

## §5 · D5 · QUÉ SE PUBLICA, Y CÓMO NO MENTIR AL PUBLICARLO

### 5.1 · ⛔ La red es la del PERIODO DEL FEED, no la de la ciudad

**Va declarado desde el primer commit, en el propio artefacto y en la portada.**

```
   Esta red es la del feed 20260623_AUZSA_Y_TRANVIA, vigente del 23/06/2026 al 05/10/2026.
```

⚠️ **El caso concreto que lo demuestra, y hay que enseñarlo:** quien busque el **Parque de
Atracciones** no encontrará su parada. `PA00617` **no está en `stops.txt`**, y la línea que lo
serviría —`104/LAN`, *«Lanzadera Cementerio - Parque Atracciones»*— es **una de las ocho zombis**.
⛔ **Eso no es un fallo de 004: es lo que el feed publica.** Y decirlo es la diferencia entre un
hueco y una mentira.

### 5.2 · ⚠️ Los dos sentidos condicionales se marcan EN LA SALIDA

⛔ **No basta con guardar el `determinante` en el dato.** Los dos casos medidos —`23 s0` y
`44 s0`— llevan aviso **en la respuesta**, junto al resultado, no en una nota al pie:

```
   ⚠️ Esta línea no termina siempre en la misma parada.
      El 32 % de sus viajes acaban en Clara Campoamor, y el reparto depende de la HORA.
      Esta red no mira el reloj: compruébalo antes de salir.
```

⭐ **Por qué en la salida y no solo en el dato:** el modo de fallo **no es simétrico**. Un «sí»
falso manda a alguien a esperar un autobús que no va a venir; un «no» falso solo le esconde uno.
**El primero se paga en la calle.** ⇒ El aviso va donde está el «sí».

### 5.3 · ⚠️ La obligación legal: dónde sobrevive `feed_info`

La licencia del NAP exige **conservar sin alterar la metainformación de fecha de actualización y
condiciones de reutilización**. ⛔ Si el artefacto cocinado se come `feed_info.txt`, **004 incumple
la licencia Y pierde la caducidad de §2.4. Un fallo, dos consecuencias.**

**Propuesta — sobrevive en tres sitios, y los tres se pueden comprobar:**

1. **En el artefacto**: un bloque `feed` con `version`, `start`, `end`, `publisher`, copiados
   **literales** del `feed_info.txt`, sin reformatear las fechas.
2. **En la portada**, visible: *«Datos: GTFS de Avanza Zaragoza y Tranvías de Zaragoza vía el NAP
   (MITMS). Powered by MITRAMS. Dato PROCESADO. Vigencia declarada 23/06/2026 – 05/10/2026.»*
   ⚠️ **«PROCESADO» es obligatorio y no es un detalle**: la licencia exige decir si el dato es bruto
   o procesado, y el nuestro está cocinado.
3. **En un invariante**: el artefacto no se publica si le falta cualquiera de los cuatro campos.
   ⭐ **Y esa comprobación puede fallar**: basta borrar un campo del artefacto para verla roja.

### 5.4 · ⭐ Nunca «la ruta más rápida»

Heredado de 003 —*«Nunca "todos los buses". Si digo "todos" y falta uno, miento»*— con el sustantivo
cambiado:

⛔ **H2a no dice «la ruta más rápida».** Dice **«la más corta que he encontrado con lo que tengo»**,
y lo que tiene es un grafo donde el **47,2 % del término es eje de calzada sin acera dibujada**.
⇒ Cuando la ruta pasa por ahí, se avisa. **Es el mismo aviso que H1 ya imprime**, y no se calla por
estar en H2a.

---

## §6 · D6 · EL ORDEN DE LAS TANDAS

**Propuesta, con lo que cada una tiene que ENSEÑAR** — y con un cambio sobre la de partida:

| tanda | qué | qué enseña |
|---|---|---|
| **H2a·5** | ⭐ **La medición de D3**: los 984 postes contra el grafo | mediana/p90/p99/máx del enganche, tipo de arista, componente. ⛔ **Va primero porque D4 depende de ella** |
| **H2a·6** | Las paradas y las líneas en el modelo | 984 paradas · 44 líneas de bus operativas · 8 zombis descartadas **contadas** · los dos convenios sin colisión |
| **H2a·7** | Los sentidos y sus secuencias | 74 sentidos con su orden · los dos terminales condicionales con su cuota y su determinante |
| **H2a·8** | ⭐⭐ **El transbordo andando** | los 2.538 pares calculados · el reparto de metros · los `SIN CAMINO` **con nombre** |
| **H2a·9** | El tranvía dentro | 48 de 50 enlazadas · Juslibol declarada · **cero cambios en el núcleo**, que es la prueba de D1 |

⚠️ **Cambio sobre la propuesta de partida del encargo:** la medición del enganche **se adelanta a
la primera posición**. En la propuesta original era parte de «las paradas en el grafo»; separarla
la convierte en una tanda que puede salir mal **antes** de que nada dependa de su resultado.

### 6.1 · ⭐ Cuál es la primera que puede fallar de verdad

**H2a·5, la medición del enganche.** Y no por dificultad: **porque es la única cuyo resultado puede
tumbar el diseño escrito aquí.**

```
   si la mediana de enganche sale como la de los portales (decenas de metros)  →  D4 aguanta
   si sale que hay postes a 100-200 m de cualquier acera                        →  ⛔ el radio de
      300 m deja de tener sentido: el error del enganche sería del tamaño del propio transbordo
   si muchos postes caen en aristas `eje-de-calzada`                            →  ⛔ el enlace
      pasaría por el centro de la calzada, no por la acera: el aviso de H1 se convierte en la regla
```

⚠️ **Y hay una segunda candidata, por otro motivo:** **H2a·8** es la primera que produce un número
que nadie puede verificar a ojo. **2.538 distancias andando no se revisan una a una.** ⇒ Necesitará
su propio control: un puñado de pares **con la distancia comprobada a mano en el visor**, como se
hizo con las cuatro puntas sin soldar.

---

## §7 · MEDICIONES PENDIENTES

**Lo que este diseño necesita y NO tiene. Ninguna se ha supuesto.**

| # | qué | por qué bloquea | dónde muerde |
|---|---|---|---|
| **M1** | ⭐⭐ **Distancia de enganche de los 984 postes al grafo** | El radio de 300 m es a vuelo de pájaro; si el enganche tiene un error del mismo orden, el pre-filtro no vale | §3.2 · §4.2 · tanda H2a·5 |
| **M2** | **En qué tipo de arista engancha cada poste** (acera / eje de calzada) | Un enlace por el eje de la calzada **no es un enlace a pie** | §3.1 · §5.4 |
| **M3** | **En qué componente del grafo cae cada poste** | Decide cuántos `SIN CAMINO` habrá, y si el cero sería sospechoso | §4.4 |
| **M4** | ⭐ **El rodeo real de los pares cortos** (100–300 m) | Los rodeos de H1 en ese rango van de **1,10 a 2,17**, con una sola muestra por valor. **Cuatro rutas no son una distribución** | §4.3 |
| **M5** | **Cuántos pares candidatos cruzan una vía de alta capacidad** | Es el caso que los routers de radio fijo resuelven mal, y el que 004 dice resolver bien. **Hoy no está contado** | §4.4 |
| **M6** | ⚠️ **La forma de los `stop_code` en la PRÓXIMA descarga del feed** | Todo §1 se apoya en `934/934` y `50/50` **de un fichero que lleva quieto desde el 23/06**. El convenio es una observación, no una promesa del publicador | §1.1 |

---

## §8 · ⚠️ LO QUE NO ME HE PREGUNTADO

El encargo pide que, si el diseño sale redondo, diga qué pregunta no me he hecho. **Sale bastante
redondo, y son cuatro:**

1. ⛔⛔ **¿Un enlace es simétrico?** Todo §4 supone que A→B y B→A son el mismo enlace, y **guarda uno
   solo**. En un grafo peatonal con sentidos únicos, escaleras o pasos elevados, **puede no serlo**.
   No lo he medido y el modelo ya asume que sí. **Es la suposición más cara del documento.**
2. **¿Dos paradas con el mismo nombre son la misma parada?** Hay `0301` y `0302`, ambas *«Juslibol»*.
   El modelo las trata como distintas —lo son, son andenes— pero **quien busque «Juslibol» tendrá
   dos resultados idénticos en pantalla** y no he dicho qué se hace con eso.
3. **¿Qué pasa cuando el feed se republique?** Todo el diseño está calibrado sobre un fichero
   inmóvil desde el 23/06. **Los `stop_id` podrían no ser estables entre versiones**, y si no lo
   son, los 2.538 enlaces cocinados apuntan a paradas que ya no existen. **No lo he comprobado y no
   puedo: solo tengo una versión.**
4. **¿Cuánto ocupa el artefacto?** Digo que `stop_times.txt` no sobrevive, pero **no he estimado el
   tamaño de lo que sí**. Y el estado ya avisa de que el stack se decide con el tamaño medido.

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ **`DESPLAZAME-ESTADO.md` no se toca.**

1. ⭐⭐⭐ **La aritmética del transbordo, medida: 483.636 → 3.231 (≤300 m) → 2.538 (con línea
   nueva). Reducción de 190×.** El hito es tratable.
2. ⭐⭐⭐ **48 de 50 paradas de tranvía tienen bus a ≤300 m, mediana 73 m, máx 418 m.** Las dos
   excepciones son Juslibol. **La costura bus↔tranvía existe físicamente**; solo hay que calcularla.
3. ⭐⭐⭐ **La colisión de convenios, medida en 004 y no citada de 003:** normalizar quitando el
   prefijo **choca 15 veces**; la fórmula de 003 **choca 47, con 24 paradas del tranvía en el poste
   1**; y con `/^PA(\d{5})$/` los choques son **0**. **`PA00002` y `2102` colisionan de verdad.**
4. ⭐⭐⭐ **El rodeo de H1 es peor en los trayectos cortos: 1,06–1,25 en los largos, 1,10–2,17 en los
   de 477–598 m.** ⇒ **La distancia recta no vale ni como aproximación para un transbordo**, y el
   radio solo puede ser un pre-filtro. *Es un uso nuevo de datos que ya estaban publicados.*
5. ⭐⭐ **El grafo tiene 170 componentes y 2.942 nodos (4,3 %) fuera de la mayor** ⇒ habrá pares
   `SIN CAMINO`, y **un cero sería sospechoso, no tranquilizador**.
6. ⭐ **Ninguna parada tiene pareja a menos de 592 m** en el peor caso: **no existe radio que le dé
   transbordo a todo el mundo**, y eso es un hecho de la ciudad, no del método.
7. ⚠️ **Seis mediciones pendientes bloquean o condicionan el diseño** (§7). La primera, el enganche
   de los 984 postes, **es la que puede tumbarlo**.
8. ⚠️ **Y la suposición más cara, declarada sin medir: que un enlace peatonal es simétrico.**

---

## §10 · LÍNEAS BASE DE LA BATERÍA

```
   ANTES    ARRANQUE 2026-08-10T14:57:19+02:00  →  FIN 2026-08-10T15:14:07+02:00   exit=0
   DESPUÉS  ARRANQUE 2026-08-10T15:17:57+02:00  →  FIN 2026-08-10T15:34:32+02:00   exit=0
   ⇒ la de arranque terminó ANTES del primer fichero escrito de esta tanda.
```

⛔ **Esta tanda no toca `src/`. Es papel.** Las cifras salen de scripts de medición **de usar y
tirar, fuera del repositorio**, y del `node src/rutas-antonio.js` que ya existía. **Ni un fichero de
código entra en 004.**

### 10.1 · La comparación, con `diff`

```
   diff  bateria-ANTES.txt  bateria-DESPUES.txt      (sin ARRANQUE/FIN/exit)
   112 líneas   vs   112 líneas          ⇒  salida VACÍA: IDÉNTICAS
```

✅ **Lo que tenía que pasar, pasó: ni una fila movida.** Los tres rojos declarados siguen en 1 y el
amarillo de `ruta.js` —código 2 sin declarar nada, previo a esta tanda— sigue exactamente igual.

⚠️ **Y conviene decir por qué esto vale poco hoy y valdrá mucho en la tanda 5:** una batería
idéntica en una tanda de papel **solo demuestra que no se tocó nada**. La comprobación de verdad
llega cuando H2a empiece a escribir en `tools/` — porque `tools/` **no está en el universo de la
batería** (`src/`), y eso es un cabo abierto del proyecto, no una garantía.
