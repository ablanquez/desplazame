# H1 · CIERRE — el motor deja de mentir en silencio

> **Tanda 12** · 3 de agosto de 2026 · sello del dato OSM `2026-08-03T08:19:51Z`
> Registro histórico: **se añade, no se reescribe.** Lo que corrija a un informe anterior lo dice
> con su número al lado.

---

## 0 · Lo que abrió esta tanda, y cómo apareció

Antonio quiso saber **por qué la ruta 7 pasa por la Calle de Juslibol**. No era una verificación: era
curiosidad. Lanzó el comando a mano y salió esto:

```
"grafo": { "nodos": 5121, "aristas": 7175, "componentes": 20 }     ⛔ EL CASCO
"engancheOrigen": 511.9                                            ⛔ medio kilómetro
"rodeo": 0.884                                                     ⛔ físicamente imposible
```

⚠️ **Diecisiete tandas de contrapruebas no lo tocaron, porque el fichero que fallaba no estaba en el
camino de ninguna.** `src/ruta.js` es la herramienta con la que se depura el motor, y **las
herramientas de depuración no las verifica nadie**: son las que verifican a las demás.

---

## A · El grafo equivocado — se arregla la clase, no el caso

### A1 · La tabla de los 23 ficheros

`node src/auditoria-grafo.js` — análisis estático, no ejecuta nada.

| fichero | ¿obtiene grafo? | qué zona | ¿explícita? |
|---|---|---|---|
| `caminos.js` | sí | término | sí |
| `ciudad.js` | sí (×2) | término · casco | sí |
| `exportar.js` | sí (×2) | `zona` (argumento) | sí |
| `informe-condicionales.js` | sí | *planariza por su cuenta* | zona a la vista |
| `informe-portales.js` | sí | término | sí |
| `informe.js` | sí | **⛔ POR DEFECTO** | **⛔ NO** |
| `ruta.js` | sí | **⛔ POR DEFECTO** | **⛔ NO** |
| `rutas-antonio.js` | sí (×2) | término | sí |
| `transitabilidad.js` | sí | *planariza por su cuenta* | zona a la vista |
| `verificar-ciudad.js` | sí (+4 propios) | término | sí |
| `verificar-rios.js` | sí | término | sí |
| `verificar.js` | sí (×2, +4 propios) | **⛔ POR DEFECTO** + `zona2` | **⛔ NO** |
| los otros 11 | no | — | — |

**Tres llamadas se apoyaban en el valor por defecto.** ⭐ **Y solo UNA estaba equivocada.**

- `informe.js` quería el casco de verdad: **su salida es idéntica byte a byte** antes y después de
  escribir la zona. Es la prueba, no la explicación.
- `verificar.js` también quería el casco —compara contra el crudo de la tanda 3, que es del casco—.
- `ruta.js` **NO**: es el comando de ciudad, y contestaba con 3 km² de casco.

⇒ **Respuesta a la costura *"¿hay MÁS scripts mirando el grafo equivocado?"*: NO.** Había más
apoyados en el mismo valor por defecto, pero para ellos el defecto era el correcto.

### A2 · El mecanismo (no la disciplina)

1. **`construir()` exige la zona y revienta sin ella.** No queda ningún valor por defecto que decida
   por nadie.
2. **Todo grafo se DECLARA al construirse**, por stderr —para no ensuciar el JSON—, **sin escotilla
   para callarlo**:
   ```
   ⚑ GRAFO · zona=termino  S 41.4011 O -1.2199 N 41.982 E -0.6541  (2989 km²)
   ⚑ sello=2026-08-03T08:19:51Z  nodos=68649  aristas=98774  a-pie=94570
     componentes=170  mayor=65707  pasos-condicionales=DENTRO (196 aristas, 28 identificadas)
   ```
3. **`src/auditoria-grafo.js`** se pone rojo si alguien obtiene un grafo sin zona a la vista.
   La única excepción es una regla, no una lista: la línea lleva la marca `PROVOCACIÓN` **y sale
   listada aparte con su número de línea**.

⭐ (1) y (2) no dependen de que nadie se acuerde de nada. Eso es la ley 37.

### A3 · Un rodeo por debajo de 1 es una PARADA

Ninguna ruta puede medir menos que la línea recta entre sus propios extremos. Ahora **lanza**, no
devuelve. Y hay **dos rectas**, porque no son la misma pregunta:

| | qué mide | para qué |
|---|---|---|
| `lineaRecta` | entre los puntos **pedidos** | la tabla de Antonio |
| `rectaEnganchada` | entre los puntos donde el motor **entra al grafo** | el invariante físico |

Compararlas al revés fue el fallo nº58. **El guardián usa la segunda**, que es la única con la que un
rodeo < 1 es imposible de verdad.

### A4 · El umbral de enganche — X = 350 m, y de dónde sale

⭐ **MEDIDO, no puesto a ojo.** Distancia de los 46.150 portales reales a la arista transitable más
cercana:

```
   a la ARISTA   mediana  5,3 m   p90 18,0 m   p99  65,2 m   p99,9 174,6 m   MÁXIMO 303,1 m
   al NODO       mediana 24,4 m   p90 62,5 m   p99 197,3 m   p99,9 367,6 m   MÁXIMO 566,6 m
```

⇒ **X = 350 m**, por encima del peor portal que existe (303,1 m), con holgura. El criterio es **no
rechazar ninguna dirección real de Zaragoza**. Lo que cuesta: deja pasar cualquier punto hasta 350 m,
así que es un tope, no un detector fino.
⇒ Y a **65 m** (el p99) se **avisa sin parar**: ese punto está en el 1 % peor del callejero.

⚠️⚠️ **Y aquí apareció la segunda causa de los 512 m, que arreglar la zona no habría tocado:**
`resolver()` enganchaba **al NODO**, no a la arista. **Al nodo el máximo real es 566,6 m**, así que
**512 m cabía también en el grafo bueno**. Arreglar solo la zona habría bajado la frecuencia del
síntoma dejándolo vivo, que es la peor forma de arreglar algo.

### A5 · Un solo geocodificador, un solo motor

`ruta.js` acepta direcciones además de coordenadas, con el **mismo** `direccion.js` que las siete
rutas. Y de paso apareció que había **dos motores**: `ruta.js` enganchaba al nodo y
`rutas-antonio.js` a la arista, cada uno con su reconstrucción. `insertar` y `rutaEntre` suben a
`grafo.js`. **Uno.**

```
node src/ruta.js "Calle Manifestación 6" "Calle Don Jaime I 17"
node src/ruta.js casco 41.6563 -0.8783 41.6516 -0.8797
```

### Los cuatro rojos, provocados

`node src/probar-guardianes.js` — **y cada uno con su positivo de control**, que es lo que distingue
un guardián de una alarma estropeada:

| guardián | rojo | verde sin el fallo |
|---|---|---|
| `construir()` sin zona | ✅ lanza | ✅ `construir(ZONA_CASCO)` funciona |
| fichero nuevo sin zona | ✅ el auditor sale con código 1 | ✅ con el fichero limpio, código 0 |
| punto a >350 m (el caso real de los 512 m) | ✅ lanza | ✅ dos puntos del casco resuelven |
| arista que teletransporta | ✅ `IMPOSIBLE FÍSICO` | ✅ la ruta real: 3.276 m, rodeo 1,194 |

⚠️ El positivo de control **cazó un fallo real**: el rojo del cuarto saltaba **por otro motivo**
(bitácora nº71).

---

## B · Las bandas se leen, no se copian

⛔ `rutas-antonio.js` tenía la tabla **transcrita a mano**. Antonio publicó la v2 y el código siguió
comparando contra la v1: **declaró "0 de 5 en banda" cuando la cuenta real eran 3 de 5**, y no
comparaba en absoluto contra el **rodeo**, que es la columna que manda en la v2.

Ahora `src/tabla-rutas.js` lee el Markdown, **imprime lo que ha entendido** para poder contrastarlo,
deja `NO CONSTA` lo que no entiende y **cuadra las filas leídas contra las que declara el fichero**
(`Filas reales: 7`). Si no cuadra, para.

⛔ `data/pruebas/RUTAS-CONOCIDAS.md` **no se ha tocado**, ni para anotar un resultado.

---

## C · Los pasos condicionales entran en el cálculo, y avisan

**Decisión nueva de Antonio.** Antes se ignoraban. *Ignorarlos en silencio es fingir que el camino no
existe, que es tan falso como fingir que está abierto.*

- El **motivo**, el **horario declarado** y el **edificio que atraviesa** viajan como CAMPO desde el
  planarizado hasta la salida, igual que la precisión de D4.
- El nombre **sale del dato o no sale**: edificio que atraviesa → nombre del way → nada.
- Componentes del término: **184 → 170**. Aristas condicionales: **196**, de ellas **28** con el
  sitio identificado por nombre.

### El aviso de Delicias, tal como lo vería un usuario

```
⚠️  este tramo cruza el interior de «Estación Zaragoza-Delicias», y puede estar cerrado
    a ciertas horas — la app no sabe su horario   (59 m)
⚠️  este tramo cruza el interior de un edificio (sin nombre en OSM), y puede estar cerrado
    a ciertas horas — la app no sabe su horario   (17 m en 6 tramos)
```

⚠️ **Y una cuarta respuesta que no es "no hay nombre": "no se ha mirado".** Los polígonos de edificio
solo se descargaron para el centro denso. Fuera de esa ventana el aviso lo dice.

### Lo que destapó, y que llevaba tandas escondido

⭐⭐ **Una ruta de cordura PUBLICADA como correcta llevaba dos tandas rota.** La tercera del casco,
`Puerta del Carmen → Magdalena`, publicada en `H1-PRIMER-GRAFO.md` §C4d como `1.334,4 m · rodeo
1,226 ✅`, daba `⛔ componentes-distintas` desde la tanda 11. **Necesita un paso condicional**, y
ahora se ve cuál:

```
   way  53856138  indoor=yes  ->  cruza el interior de «Centro Comercial Independencia El Caracol»
```

⇒ En la tanda 8 el motor mandaba a la gente **por dentro de un centro comercial sin decirlo**. En la
11 dejó de mandarlas, pero contestando **"no hay camino"**, que es falso. Desde hoy manda **y avisa**.

⭐ **Y `verificar.js` llevaba una tanda contradiciendo al documento publicado**: imprimía *"soldar las
puntas de D5 quitó 2 componentes"* donde `H1-PRIMER-GRAFO.md` dice *"D5 no quitó ni una"*. Con un
contador independiente y **la misma política en los dos lados**:

```
   D5=0,0 m  condicionales dentro  ->  22       D5=0,0 m  condicionales FUERA  ->  20
   D5=2,0 m  condicionales dentro  ->  22       D5=2,0 m  condicionales FUERA  ->  20
```

⇒ **D5 quita 0 componentes en las dos políticas.** El "2" no medía D5: medía la diferencia entre las
dos políticas. **⛔ D5 no está en cuestión; lo que estaba mal era la resta.**

---

## D · Rutear a la puerta, no al centro

### Es una clase, no el caso de Delicias

Sobre los **11.857** polígonos de edificio de la ventana (501 con nombre):

```
   distancia del punto de destino a la calle más cercana
     desde el CENTRO geométrico     mediana 11,9 · p90 23,2 · p99 53,4 · máx 164,3 m
     desde el PERÍMETRO             mediana  2,7 · p90  8,6 · p99 29,2 · máx 149,7 m
   edificios donde el centro miente más de 20 m:  759 de 11.857  (6,4 %)
```

Los peores, con nombre y comprobables a mano: **C.C. Augusta 83 m · Hospital Miguel Servet 71 m ·
Estación Delicias 60 m · Hospital Clínico 45 m · Palacio de Congresos 42 m.**

### ⛔ Por qué el perímetro y no `entrance=*`

```
   edificios   11.857 elementos   con entrance: 0
   poi             28 elementos   con entrance: 0
   viario      48.211 elementos   con entrance: 0
```

⭐ **Positivo de control**, porque un cero sin él es indistinguible de un buscador roto: el mismo
buscador encuentra **11.857** con `building=*` y **3.282** con `building:levels`.

⚠️ **Y la lectura honesta de ese cero:** `entrance` es una etiqueta de **nodo**, y las tres descargas
son **solo de ways**. ⇒ **`NO CONSTA` si Zaragoza tiene entradas mapeadas.** Lo que consta es que con
este dato no se pueden usar.

### El perímetro más cerca de la calle **no** es el más cerca del que viene

⚠️ Esto no lo anticipé: al aplicar la regla del briefing, **la ruta 3 empeoró 119 m**. Ese punto está
a 0,0 m de una calle… **que está al otro lado del hospital**.

⇒ La regla correcta sale de qué significa un destino-edificio: **llegar a un edificio es tocar su
perímetro por donde antes se llegue.** Hasta 24 puntos de acceso candidatos, un solo Dijkstra con
varios destinos, y manda el más barato **por ruta**.

| ruta | [1] al centro | [2] perímetro ← calle | [3] ⭐ perímetro ← ruta |
|---|---|---|---|
| **nº3** Clínico | 3.731 m · rodeo 1,24 | 3.850 m · **1,29** ⬅ peor | **3.705 m · 1,24** |
| **nº4** Delicias | 900 m · rodeo 2,57 | 584 m · 2,31 | **506 m · 2,17** |

⛔ Se publican **las tres** en todas las rutas: la regla se elige por lo que significa el destino, no
por el número que produce.

⚠️ **D4 · ¿sigue siendo honesto?** A medias, y hay que decirlo: **el punto del perímetro más cercano
a la calle no tiene por qué ser una puerta.** Puede ser una pared ciega o un muelle de carga. Lo que
se gana es dejar de rutear a un punto que **con seguridad** no es la entrada. **Cuál es la puerta de
verdad: `NO CONSTA` con este dato.**

⚠️ Y el C.C. Utrillas **no cae dentro de ningún polígono de edificio** —el más cercano tiene su centro
a 110 m—, así que se queda en su punto y **lo dice**. Un caso no tratado tiene que verse distinto de
un caso que no aplica.

---

## ⭐⭐⭐ LAS SIETE RUTAS DE ANTONIO, con las bandas v2

`node src/rutas-antonio.js`

| # | trayecto | calculado | **⭐ rodeo** | tope | | banda | |
|---|---|---:|---:|---:|:--:|---:|:--:|
| 1 | Av. Cataluña 78 → Av. Pablo Gargallo 16 | 3.087 m | **1,17** | ≤ 1,45 | ✅ | `NO CONSTA` | |
| 2 | Manifestación 6 → Don Jaime I 17 | 598 m | **1,32** | ≤ 1,45 | ✅ | 450–550 | ⚠️ +48 |
| 3 | Cantando Bajo la Lluvia 6 → H. Clínico | 3.705 m | **1,24** | ≤ 1,40 | ✅ | 3.800–4.200 | ⚠️ −95 |
| 4 | Etopía → Estación Delicias | 506 m | **2,17** | ≤ 1,60 | ⛔ | 450–550 | ✅ |
| 5 | Principado de Morea 14 → C.C. Utrillas | 477 m | **1,37** | ≤ 1,45 | ✅ | 450–550 | ✅ |
| 6 | Francisco de Quevedo 1 → Matadero 1 | 523 m | **1,08** | ≤ 1,45 | ✅ | 450–550 | ✅ |
| 7 | El Coloso 2 → Valle de Zuriza 48 | 2.529 m | **1,06** | ≤ 1,20 | ✅ | 2.400–2.600 | ✅ |

**7 de 7 resueltas · 0 rodeos imposibles · 6 de 7 dentro del rodeo aceptable · 4 de 6 en banda.**

⭐ La **nº7**, la única con distancia medida por GPS: **2.529 m calculados frente a 2.600 medidos**,
un 2,7 % de diferencia, y rodeo **1,06** frente al 1,09 que sale de la pulsera.

### nº1 · ¿por qué puente cruza?

```
   puentes en la ruta      Puente de Piedra
   Antonio cruza por       el Puente de Piedra          ⇒ ✅ COINCIDE
```

### nº6 · la esquina, donde los dos portales son el nº 1

Los dos enganchan a aceras **sin nombre**, a 3,9 y 2,7 m. Los dos testigos de la tanda 11 **se
callan** — y callar es lo correcto: no hay discordancia porque no hay con qué comparar. **El tercer
testigo sí opina, y acierta los dos.**

### nº4 · la única fuera de tolerancia, y dónde se le van los metros

```
        m      %  highway       precisión               calle
    238.8   26.5  pedestrian    peatonal                (sin nombre en OSM)
    171.8   19.1  footway       peatonal                (sin nombre en OSM)
    101.5   11.3  footway       peatonal                (sin nombre en OSM)
     87.7    9.7  pedestrian    peatonal                (sin nombre en OSM)
     70.1    7.8  footway       acera                   Calle de la Rioja
```

⚠️ **No la he tocado.** El rodeo 2,17 es real: la estación está sobre una plataforma elevada y hay que
rodearla. **Tocar un umbral para que entre sería ajustar el instrumento al resultado deseado.**

### ⭐⭐ Y el contrafactual que cambia una conclusión de la tanda 11

```
   nº1 … nº7   el mismo trayecto SIN pasos condicionales   ±0 m   ⇒ no le afectan
```

**Ninguna de las siete necesita ya un paso condicional.** Delicias no lo arregló C: **lo arregló D**.
Lo que la dejaba sin acceso a pie era **rutear a su centro geométrico**, 60 m dentro del edificio.

⇒ ⭐ **Esto solo se puede afirmar porque el briefing impuso el orden C→D** (ley 19). Al revés, no se
sabría cuál operó.
⛔ **La decisión de Antonio sigue siendo correcta, y por un caso distinto**: la ruta del casco por El
Caracol sí los necesita, y ahí no hay ningún centroide de por medio.

---

## E · ⭐⭐⭐ Los 11.942 portales donde nadie vigila

### E1 · Qué son — clasificar antes de contar

**11.942 de 46.026 (25,9 %)**, y en **los 11.942** las **dos** salvaguardas están calladas.

| tipo de vía | | | precisión (D4) | |
|---|---:|---|---|---:|
| `footway` | 6.512 (54,5 %) | | acera | 5.132 (43,0 %) |
| `living_street` | 1.545 (12,9 %) | | eje-de-calzada | 3.485 (29,2 %) |
| `track` | 1.245 (10,4 %) | | peatonal | 3.246 (27,2 %) |
| `service` | 914 (7,7 %) | | paso-de-peatones | 47 |
| `residential` | 801 (6,7 %) | | escaleras | 30 |

**Por zona** — no están repartidos: **Actur 38,1 % · PLAZA 38,1 % · ensanche 30,6 %**, frente a
**casco 10,2 %** y **Valdespartera 9,9 %**.

⭐ Y la distancia de enganche de los ciegos es **mejor**, no peor: mediana **3,9 m** frente a 5,7 m.
Tiene sentido — una acera pasa más cerca del portal que el eje de la calzada.

### E2/E3 · El testigo que falló, y por qué el que falló era yo

*"Una acera sin nombre pegada a la Calle Mayor es de la Calle Mayor."* Medido contra 4.000 portales
con nombre conocido, ocultando el **way entero**:

```
   ⭐ acierta el vecino con nombre más cercano   24,5 %
   línea base (azar entre las vecinas)          26,0 %      ⇒ 0,94×  ⛔ POR DEBAJO DEL AZAR
```

⚠️ **Antes de culpar al testigo, hay que mirar la pregunta.** Esa prueba borra el nombre de toda la
calle: pide **reconstruir un nombre que ya no está en la zona**. El caso real es el contrario —la
acera no tiene nombre, **pero la calzada de al lado sí**—. ⇒ **La prueba era más difícil que el
problema.** Y ocultar solo la arista habría sido peor: sus hermanas del mismo way habrían cantado la
respuesta y **habría pasado por construcción**.

### E3b · La pregunta que sí se puede responder

No *"¿cómo se llama esta acera?"*, sino **"¿está la calle que dice el callejero entre las que hay
alrededor del enganche?"** — una **presencia**, no una adivinanza. ⭐ Y el patrón de verdad **ya
existía sin fabricarlo** (ley 17): los enganches que la salvaguarda 1 marca `concuerda` y `DISCORDA`.

```
   buenos conocidos     61,9 %        sospechosos    21,4 %        una calle AL AZAR   0,1 %
   ⇒ separa 40,5 puntos · 412× el azar
   ⭐⭐ DONDE NADIE VIGILA:  65,5 %     ⇒ al nivel de los BUENOS conocidos
```

### E2d · La geometría municipal — el único testigo que no depende de OSM

⭐ D0 dice que el dato municipal **verifica, no decide**. Éste es el caso para el que existe.

⭐ **Y lo primero fue comprobar que el código es el mismo código** (eje correspondencia): los 197
tramos tienen un `codigo` que existe en `vias-zaragoza.json` —**197 de 197**— y donde el tramo trae
nombre coincide con el del callejero en el **62 %** (el resto son nombres nulos y variantes de la A-2).

⚠️ **Y el filtro que faltaba:** la muestra se bajó **por zonas**, así que un portal fuera de esos
recuadros está a kilómetros del trozo muestreado de su propia calle. Sin condicionar por **zona
cubierta**, el test daba mediana 39,5 m y **p99 de 3 km** — medía la descarga, no el enganche.

```
   portales en zona CUBIERTA y con su vía en la muestra     1.633
   a ≤ 25 m del eje municipal de SU calle                     54,2 %
     donde OSM SÍ da nombre                                   55,6 %   (n = 1.419)
     ⭐⭐ DONDE NADIE VIGILA                                   44,9 %   (n =   214)
   ⭐ CONTROL contra un código municipal AL AZAR                0,5 %   ⇒ se derrumba
```

⚠️⚠️ **Y el confusor obvio no lo explica.** Los ciegos son aceras, y una acera está desplazada del eje
por definición — pero dentro del mismo tipo de vía la diferencia sigue:

```
   CON nombre · acera     53,5 %          SIN nombre · acera     44,0 %
   CON nombre · calzada   56,8 %          SIN nombre · calzada   46,6 %
```

### El testigo que se cayó, y no por su culpa

Un cuarto testigo —*¿cuelga del mismo way que sus hermanos de calle?*— tenía la virtud de **no
necesitar nombres**, y decía: buenos 3,1 % solos · sospechosos 9,4 % · **ciegos 12,9 %**.

⛔ **Falla por construcción.** Un portal está en el grupo ciego **precisamente porque enganchó a la
arista sin nombre**; sus hermanos que engancharon a la calzada con nombre están, por definición, en
otro way. **Sale "solo" sin que nadie se haya equivocado.** Se degrada y no entra en el veredicto —
pero se publica, porque un testigo descartado con razón es información.

### E5 · Las dos contrapruebas

```
   (a) desplazamiento 200 m   acierto  24,5 % → 5,3 %      ✅ se derrumba
   (b) identidad barajada     acierto  24,5 % → 0,1 %      ✅ se derrumba
```

⚠️ **Y las dos pasaron sobre un testigo que no servía para nada.** Una contraprueba valida el
instrumento, **no la pregunta**.

### E6 · Las cuatro direcciones de Antonio, una a una

| dirección | engancha a | a | salvaguardas | ⭐ tercer testigo | callejero | |
|---|---|---:|---|---|---|:--:|
| Av. Pablo Gargallo 16 | `footway` 485506218 sin nombre | 3,6 m | las dos calladas | «pablo gargallo» a 0,0 m | «pablo gargallo» | ✅ |
| Principado de Morea 14 | `footway` 740129460 sin nombre | 4,3 m | las dos calladas | «principado morea» a 5,2 m | «principado morea» | ✅ |
| Francisco de Quevedo 1 | `footway` 589611516 sin nombre | 3,9 m | las dos calladas | «francisco quevedo» a 4,6 m | «francisco quevedo» | ✅ |
| Matadero 1 | `footway` 588927730 sin nombre | 2,7 m | las dos calladas | «matadero» a 2,7 m | «matadero» | ✅ |

**4 de 4.** ⚠️ Son las cuatro que Antonio conoce, y por eso valen — **y son cuatro de 11.942.**

### E7 · ⭐⭐⭐ El veredicto, en una frase

> **NO SE PUEDE SABER CON LO QUE HAY** — el testigo más potente pone el enganche ciego **al nivel de
> los enganches buenos conocidos** (65,5 % frente a 61,9 %, 412× el azar), pero **el único
> independiente de OSM lo pone ~10 puntos por debajo** sobre **214 casos**, y 214 casos no deciden
> nada.

⛔ **Y lo que sí es seguro, que es lo que hay que arreglar:**

- **2.006 portales (4,4 % del total)** no tienen **ni una** arista con nombre a 80 m. Ahí no opina
  **ningún** testigo: ni el nuevo ni los dos viejos.
- La muestra municipal cubre el **5,4 %** de la capa. **Con `MU1_jerarquia_viaria` entera descargada,
  el testigo 2 pasaría de 214 casos a decenas de miles y esto se decidiría.** ⛔ No se ha descargado:
  no estaba en el alcance de esta tanda.

---

## Los diez ejes — cuáles se han tocado y cuáles no

| eje | ¿tocado? | dónde |
|---|:--:|---|
| **posición** | ✅ | enganche a arista en vez de a nodo · contraprueba de desplazamiento 200 m |
| **vecindad** | ✅ | el testigo de presencia · la herencia por conexión |
| **dirección** | ⛔ | **no tocado.** A pie el sentido no opera; entrará con el coche, que está aparcado |
| **identidad** | ✅ | contraprueba de identidad barajada · el `codigo` municipal, ¿es el mismo código? |
| **correspondencia** | ✅ | **el eje central de la tanda**: E entero |
| **umbral / cola** | ✅ | X = 350 m del máximo real · el p99 de 65 m · el p99 de 3 km que destapó el filtro que faltaba |
| **escala** | ✅ | casco 3 km² frente a término 2.989 · 11.857 edificios |
| **densidad** | ✅ | el reparto por zona de los ciegos (Actur 38,1 % frente a casco 10,2 %) |
| **agregación** | ✅ | el cuadre de metros por tramo contra el total · agrupar solo avisos idénticos |
| **semántica** | ✅ | qué significa `entrance` · qué significa "puerta" · qué significa un paso condicional |

---

## Qué he buscado a propósito y NO he encontrado

- **`entrance=*`**: cero en los tres ficheros, con positivo de control. Y el cero significa *"no se ha
  descargado"*, no *"no existe"*.
- **Más scripts mirando el grafo equivocado**: no hay. Tres se apoyaban en el valor por defecto; para
  dos de ellos era el correcto, y se demuestra con salida idéntica.
- **Un testigo que ADIVINE el nombre de una calle sin nombre**: no existe. Por debajo del azar.
- **`MU1_jerarquia_viaria` completa**: solo hay una muestra del 5,4 % de la tanda 0. No se ha
  descargado nada nuevo.
- **Un paso condicional necesario en las siete rutas**: ninguno, una vez arreglado el centroide.

## Qué NO he comprobado

- ⚠️ **Que la puerta elegida sea una puerta.** Puede ser una pared. `NO CONSTA`.
- ⚠️ **Que el veredicto de E7 se sostenga con la capa municipal completa.** Es la prueba que falta, y
  es la que decidiría.
- ⚠️ **Los 2.006 portales sin ningún testigo posible.** No hay con qué.
- ⚠️ **Que el visor aguante en un navegador de verdad.** Solo se ha descartado que filtre en silencio.
- ⚠️ **Que las rutas sean las que una persona elegiría.** Una ruta correcta puede ser incómoda.
- ⚠️ **`verificar.js` sigue imprimiendo `⛔` y continuando** cuando una ruta de cordura no se resuelve.
  Por eso una ruta publicada estuvo rota dos tandas sin que nadie se enterara. **No lo he cambiado en
  esta tanda a propósito** —tocarlo mientras se comparan sus salidas es cambiar dos cosas a la vez—,
  y queda anotado.

## Lo que se reporta hacia arriba

1. ⚠️⚠️ **La premisa que justificó la decisión C era un artefacto del centroide.** La decisión sigue
   siendo correcta, pero por el caso de El Caracol, no por el de Delicias. **Cambia cuál es su
   prueba.**
2. ⚠️ **`H1-PRIMER-GRAFO.md` §C4d publica una ruta de cordura que estuvo rota** desde la tanda 11
   hasta hoy. El documento no se toca; queda corregido aquí, con su número.
3. ⚠️ **La decisión sobre la capa municipal completa es de Antonio**: es lo único que convierte el
   `NO CONSTA` de E7 en un sí o un no.

---

**Bitácora de esta tanda:** nº69 a nº82 — catorce entradas. **Ninguna tanda ha salido limpia todavía,
y ésta tampoco.**
