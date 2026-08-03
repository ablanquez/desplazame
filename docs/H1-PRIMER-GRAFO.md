# H1 · El primer grafo

**Fecha:** 2026-08-03 · **Tanda 8** · Primera tanda que produce código en todo el proyecto.

Trece tandas de reconocimiento y diseño, cero líneas de aplicación. Hoy se construye — **sobre una
zona, no sobre la ciudad**: si el primer planarizado sale sobre 3.644 tramos y algo está mal, el
fallo se esconde entre miles de aristas correctas.

---

## 0 · Una decisión de ejecutor que hay que ratificar

⚠️ **El stack sigue siendo un cabo abierto del estado, y esta tanda escribe código.** He elegido
**JavaScript sobre Node, cero dependencias, cero `package.json`, cero framework**, por un motivo
concreto: el estado ya decidió que **el grafo peatonal vive en el navegador**, así que escribirlo en
Python garantizaba reescribirlo. Esto no elige stack de aplicación —no hay servidor, ni bundler, ni
librería— solo el lenguaje que aquella decisión ya condicionaba.

**Si Antonio prefiere otra cosa, se rehace: son unas 500 líneas.**

```
src/geo.js          proyección EPSG:25830 y geometría        · 95 líneas
src/osm.js          carga del crudo y recorte a la zona      · 45
src/planarizar.js   D1 · D2 · D4 · D5                        · 210
src/grafo.js        componentes, Dijkstra, reconstrucción    · 130
src/ruta.js         el comando de interrogación              · 110
src/informe.js      los contadores                           · 70
src/verificar.js    las contrapruebas                        · 210
```

---

## 1 · El dato

```
consulta   [out:json][timeout:900];
           area["name"="Zaragoza"]["admin_level"="8"]["boundary"="administrative"]->.a;
           way["highway"](area.a);
           out geom;

⭐ sello   timestamp_osm_base = 2026-08-03T08:19:51Z   (67 s antes de la respuesta)
instancia  overpass-api.de — la principal, NO una réplica
ways       48.211, todos con tags y con geometría
```

⚠️ **La primera petición devolvió `504`**, y el servidor declaraba **2 slots libres 8 segundos
después**. El reintento de **la misma consulta completa** —sin trocearla— devolvió `200` en 12
segundos. Es el mismo patrón de la bitácora nº32/34: **`CAUSA NO CONFIRMADA`**, y el
comportamiento verificado sigue siendo *"reintentar funciona"*.

⭐ **Y se cierra un cabo del estado:** *"35.555 ways de 55.452 sin `highway` conocido"*. Eran
artefacto del crudo de la tanda 3, que solo pidió los que tienen `name`. En esta descarga:
**0 ways sin `highway`**, y 28 valores distintos.

### Dónde vive el dato, y por qué no en `data/exploracion/`

`data/exploracion/` está **congelada**: es evidencia de un momento y su valor es no cambiar. El dato
de producción tiene el ciclo de vida contrario — **se refresca**. Van en `data/fuentes/`, **fuera de
git entera**, con el motivo escrito en el `.gitignore` y **probado con `check-ignore -v` y
`add -n`**, no leído.

⚠️ Al probarlo, la primera contraprueba salió mal **y era la prueba, no la regla**: usé un fichero
`.tmp` para comprobar si `data/pruebas/` estaba libre, y `*.tmp` ya estaba ignorado por otra regla
de más arriba. Repetida con la extensión real (`.md`), correcta.

---

## 2 · C1 · La zona

```
bbox        S 41.6480   O -0.8945   N 41.6615   E -0.8690
superficie  3,24 km²
ways dentro 3.838
⭐ ¿contiene la ventana del crudo de la tanda 3?  SÍ — comprobado en ejecución
```

⚠️ **El primer bbox que escribí no la contenía**, y el control positivo dio **3 de 10** — que no
medía el grafo, medía el solape de dos rectángulos. Es el error nº18 de esta bitácora repetido en la
primera tanda de código. La zona actual **contiene** la anterior, y la contención **se comprueba
dentro del programa y se imprime**, en vez de darse por buena. *Escribir la lección es
documentación; ejecutarla es ingeniería.*

---

## 3 · C2 · El planarizado

```
nodos OSM usados                            12.416
  ⭐ COMPARTIDOS por >=2 ways (D1·C1)         4.783   (38,5 %)
particiones hechas (cortes internos)         3.345
────────────────────────────────────────────────────
nodos del grafo                              5.121
aristas del grafo                            7.175
  transitables a pie                         6.986   (97,4 %)
```

**El 38,5 % de los nodos de OSM son cruces explícitos.** Ahí D1·C1 manda y ninguna señal la
contradice: en OSM el nodo **es** la topología.

---

## 4 · ⭐⭐ C3 · Los contadores — el producto tanto como el grafo

### D2 · `unido-por-defecto`

```
cruces geométricos SIN nodo compartido          49
  ⭐ UNIDOS POR DEFECTO (D2)                     6      (12,2 %)
  NO unidos, por evidencia positiva (D1)        43
       · layer-distinto                         38
       · bridge                                  5
```

**Solo 6 uniones en toda la zona se hacen sin evidencia.** Muy lejos del umbral que habría obligado
a revisar D1 por cuarta vez (más de la mitad).

⭐ Y el reparto dice algo del terreno: de 49 cruces geométricos sin nodo compartido, **43 son
desniveles reales** (38 por `layer`, 5 por `bridge`). Es decir: **en OSM, dos líneas que se cruzan
sin compartir nodo casi siempre están a distinta altura.** La regla no está inventando separaciones:
está leyendo las que el dato declara.

Los 6 marcados, mirados uno a uno (**agrupar es borrar**): 22 aristas en 7 ways — 2 de
`highway=construction` (obras) y el resto pares `pedestrian`/`footway` que son **el mismo cruce
contado desde los dos ways**.

### D5 · Puntas sueltas

```
soldadas por tolerancia (≤2,0 m)     22
  distancia   min 0,49  mediana 1,40  p90 1,78  max 1,91 m
⚠️ puntas entre 2 y 5 m NO soldadas  51    ← se cuentan, no se tocan
```

**Las 51 que quedan entre la tolerancia y el techo son el dato interesante**: son candidatas a
error de mapeado que el criterio actual deja fuera a propósito. Están contadas para poder mirarlas.

### D4 · La precisión, por arista

```
peatonal                  2.196   30,6 %
acera                     1.812   25,3 %
eje-de-calzada            1.622   22,6 %
paso-de-peatones          1.055   14,7 %
eje-con-acera-declarada     377    5,3 %
escaleras                   113    1,6 %
```

⭐ **El 40,0 % de las aristas son acera o paso de peatones**: eso es **nivel 2 real**, que es lo que
justificaba meter OSM. Y el 22,6 % es eje de calzada sin acera conocida — ahí la app tendrá que
avisar por tramo (D4), no al pie de página.

### Componentes conexas — con su línea base

```
⭐ LÍNEA BASE (sin soldar puntas, D5 = 0 m)    20 componentes
   grafo de hoy (D5 = 2,0 m)                  20 componentes
   la mayor                                   5.016 nodos = 99,1 %
   nodos aislados (sin salida a pie)          86
```

⚠️ **D5 no quitó ni una componente en esta zona.** Las 22 puntas soldadas unían trozos que **ya
estaban conectados por otro lado**. No es un fallo —la tolerancia hace su trabajo cerrando geometría
suelta— pero **el argumento de que D5 conecta la red no se sostiene aquí**, y hay que decirlo.

Las 19 componentes pequeñas, miradas: la mayor tiene 5 nodos, y son **`footway` y `steps` sueltos**
—pasarelas y escaleras cuyo extremo no llega a tocar la acera en OSM—. Ninguna es un barrio
incomunicado.

---

## 5 · ⭐⭐ C4 · La verificación

### C4b · Los 10 cruces conocidos

**No los elijo yo hoy**: salen del crudo `casco-highway.json` de la **tanda 3** —otro fichero, otra
fecha, otra consulta— tomando los nodos que más ways comparten, que es un criterio objetivo.

```
10 de 10 cruces CONSTRUIDOS   (grado total >= 3, a <= 1,00 m de su sitio — nueve a 0,00 m)
 9 de 10 utilizables A PIE    (la diferencia son vías con foot=no)
```

⚠️ **El criterio de este test estaba mal la primera vez** y lo corrijo enseñando los dos números:
medía el grado *a pie*, y daba un ⛔ en un cruce **perfectamente construido** cuyas cuatro vías
incluyen dos con `foot=no`. No es lo mismo *"el planarizado encontró el cruce"* que *"se puede
cruzar andando"*, y el motor necesita saber las dos cosas.

### ⭐⭐ C4c · Las tres contrapruebas — plantar el fallo y ver el rojo

**[1] Borrar una unión a propósito**

```
aristas de articulación: 458   INTERNAS (parten de verdad): 117   colgantes: 341
se borra la arista 3405 (way 672502466, secondary, 43,8 m)
componentes   20 -> 21        mayor  5.016 -> 5.014         ✅ ROJO
```

⚠️ **La primera versión de esta contraprueba no podía ponerse roja.** Elegía al azar entre las 458
articulaciones, y **341 son colgantes**: borrarlas deja un nodo huérfano, que mi contador saltaba en
silencio. Arreglado en dos sitios — el test solo elige internas, y el contador mide también el
tamaño de la mayor y devuelve los aislados aparte.

**[2] Forzar un cruce falso**

```
se plantan dos ways en aspa, sin nodo compartido y sin evidencia:
   unido-por-defecto     6 -> 17        cruces geométricos  49 -> 60      ✅ ROJO

⭐ control complementario — el MISMO cruce con bridge + layer=1:
   no-conectados        43 -> 45        ✅ D1 lo separa por evidencia positiva
```

Las dos mitades importan: que D2 **cuente** lo que une sin evidencia, y que D1 **no una** lo que
lleva evidencia. Un test que solo comprobara la primera no distinguiría un contador de un sello de
goma.

**[3] Mover la zona 2 km**

```
zona original:  3.838 ways, 7.175 aristas, 20 componentes, mayor 5.016
zona +2 km N:   2.571 ways, 5.517 aristas, 10 componentes, mayor 3.700
```

⚠️ **Y ésta hay que leerla con cuidado, porque no es la misma clase de contraprueba que las otras
dos.** Mover la zona da **otra zona real de la ciudad**, no un absurdo: el planarizado *debe*
funcionar allí. Lo que comprueba es que no está cableado a este trozo — si diera números idénticos,
o basura (0 aristas, una componente gigante, mil componentes), estaría mal. **No es la contraprueba
de desplazamiento de las tandas anteriores y no demuestra lo mismo.**

### C4d · Rutas de cordura

```
Pilar -> Plaza España            683,1 m   recta   534,9 m   rodeo ×1,277  ✅
Mercado Central -> San Miguel    985,9 m   recta   959,7 m   rodeo ×1,027  ✅
Puerta del Carmen -> Magdalena  1.334,4 m  recta 1.088,5 m   rodeo ×1,226  ✅
```

Ninguna más corta que la línea recta, que sería físicamente imposible. ⚠️ **Estas tres las elegí yo,
así que NO son un control positivo**: solo descartan una imposibilidad. El control de verdad es
`data/pruebas/RUTAS-CONOCIDAS.md`, **que está vacío y lo rellena Antonio**.

---

## 6 · ⭐ C5 · El eje ESCALA — medido por primera vez en el proyecto

```
longitud de arista   min 0,35   p10 1,9   mediana 9,4   p90 67,3   max 1.751 m

  aristas de menos de  1 m:   128   ( 1,78 %)
  aristas de menos de  2 m:   800   (11,15 %)
  aristas de menos de  5 m: 2.436   (33,95 %)
  aristas de menos de 10 m: 3.691   (51,44 %)

longitud por WAY     mediana 17,7 m   max 2.054 m
  ways de menos de 10 m:  1.496 de 3.832  (39,0 %)
  ways NO partidos:       2.053 de 3.832  (53,6 %)
⭐ el way más partido: 111847140, en 59 aristas
```

**La mitad de las aristas del grafo miden menos de 10 metros.** Eso tiene tres consecuencias que hay
que anotar antes de que muerdan:

1. **Cualquier criterio de mayoría sobre aristas está dominado por trocitos.** Un porcentaje "por
   aristas" y uno "por metros" darán números muy distintos, y el bueno casi siempre es el segundo.
2. **La tolerancia de 2,0 m de D5 es del mismo orden que 800 aristas del grafo.** Soldar con una
   tolerancia mayor no sería afinar: sería empezar a fundir aristas enteras.
3. **El rango es de 1 a 5.000**: de 0,35 m a 1.751 m en la misma estructura. Cualquier umbral
   absoluto que se elija va a ser generoso para unas y absurdo para otras.

---

## 7 · C6 · Qué NO funciona

- ⚠️ **`highway=construction` entra en el grafo**: 117 aristas. Se marca como no transitable, pero
  **está en la geometría**. Si unas obras terminan, el dato de OSM cambia y el grafo también — bien;
  pero hoy hay 2 de los 6 `unido-por-defecto` que son cruces **entre obras**, y eso es ruido.
- ⚠️ **61 nodos quedan sin ninguna salida a pie** y 207 pierden grado al filtrar. Son puntos que
  existen en el terreno y no participan de la red peatonal — sobre todo en vías con `foot=no`.
- ⚠️ **D5 no conectó nada** en esta zona (§4). El argumento de que la tolerancia cose la red no está
  demostrado aquí; habrá que volver a mirarlo en una zona con más geometría suelta.
- ⚠️ **Las plazas mapeadas como área siguen sin resolverse**, y esta zona es justo donde más duele:
  el casco tiene Plaza del Pilar, Plaza San Miguel y Plaza España. El grafo tiene su contorno, no su
  interior.
- ⚠️ **El enganche de origen y destino es al nodo más cercano**, no a la arista más cercana. En la
  ruta Puerta del Carmen → Magdalena el enganche fue de **35,2 m**. Con el punto 4 de H1 (enganchar
  los 46.150 portales) esto tiene que mejorar.

---

## 8 · ⚠️ Qué NO he comprobado de mi propia conclusión

El briefing pregunta esto explícitamente, y la respuesta honesta es que **de los diez ejes he tocado
seis**:

| eje | estado hoy |
|---|---|
| **posición** | ⬜ no aplica igual aquí: el grafo no "acierta o falla", construye |
| **vecindad** | ⬜ **NO medido** — no he comprobado que el planarizado distinga una calle de su paralela |
| **dirección** | ⬜ **NO medido** — la zona solo se movió al norte |
| **identidad** | ✅ contraprueba [2]: plantar un cruce y ver si lo cuenta |
| **correspondencia** | ✅ los 10 cruces conocidos, de un crudo independiente |
| **umbral / cola** | ⚠️ parcial: las 51 puntas entre 2 y 5 m están contadas, **no miradas** |
| **escala** | ✅ medido por primera vez (§6) |
| **densidad** | ⬜ **NO medido** — solo se ha planarizado casco urbano denso |
| **agregación** | ⚠️ parcial: sé que aristas y metros darán números distintos, no lo he cuantificado |
| **semántica** | ✅ los tags se abrieron uno a uno (`layer` float, `building_passage`) |

Y tres cosas más que no están comprobadas:

1. **Nadie ha mirado el grafo sobre un mapa.** Todas las comprobaciones son numéricas y contra el
   propio OSM, **que es la fuente con la que se construyó**. Un error sistemático de mi código sería
   invisible a todas ellas.
2. **Las rutas de cordura las elegí yo** (§C4d).
3. **La zona es 3,24 km² de 973 km² del término**: el 0,33 %. Nada de lo medido hoy garantiza que la
   ciudad entera se comporte igual, y **el eje densidad es justo el que dice que no**.

---

## 9 · El comando de interrogación

```
node src/ruta.js 41.6563 -0.8783 41.6516 -0.8797
```

Devuelve **JSON, no prosa** — un motor que contesta en texto no se puede comprobar solo:

```json
{ "sello": "2026-08-03T08:19:51Z",
  "grafo": { "nodos": 5121, "aristas": 7175, "componentes": 20, "mayor": 5016 },
  "encontrada": true, "metros": 683.1, "lineaRecta": 534.9, "rodeo": 1.277,
  "engancheOrigen": 17.1, "engancheDestino": 11.6, "aristas": 29,
  "pasosPorDefecto": 0, "pasosSinAceraConocida": 0, "avisos": [],
  "pasos": [ { "way": 444342375, "highway": "pedestrian", "precision": "peatonal",
               "unidoPorDefecto": false, "metros": 38.4, "aristas": 1 }, … ] }
```

⭐ **`pasosPorDefecto` y `pasosSinAceraConocida` viajan hasta aquí**, que es el punto entero de que
D2 y D4 nazcan en el planarizado: la interfaz podrá decir *"por este tramo no sé si hay acera"* sin
que nadie tenga que reabrir el motor.

**Cuando no encuentra ruta lo dice con su motivo** —`componentes-distintas`, `sin-grafo-cerca`,
`sin-camino`— en vez de devolver una lista vacía.

⛔ **No es una API HTTP, no tiene opciones y no formatea bonito.** Eso se construiría para un motor
que todavía no sabemos cómo será.

---

## 10 · Reproducir

```
node src/informe.js      los contadores de C2 y C3
node src/verificar.js    C4a, C4b, las tres contrapruebas, C4d y C5
node src/ruta.js <latO> <lonO> <latD> <lonD>
```

El crudo de OSM (37,4 MB) **no está en el repositorio**: `data/fuentes/` está gitignoreada por
frescura. Se regenera con la consulta de §1. **Lo que se versiona es el script, no su salida.**
