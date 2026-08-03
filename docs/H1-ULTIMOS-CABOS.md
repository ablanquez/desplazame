# H1 · LOS ÚLTIMOS CABOS

*Tanda 14 · 2026-08-03 · última tanda de CONSTRUCCIÓN de H1.*

Tres cosas, ninguna grande: una decisión nueva de Antonio (`entrance=*`), y los dos cabos que la
tanda 13 dejó declarados a propósito.

> **Este documento se AÑADE, no reescribe nada.** Donde corrige un número publicado, lo dice con el
> documento y el apartado que corrige. Lo anterior se queda como está — documenta lo que se supo en
> su fecha.

Cómo reproducirlo:

```
node src/entrar-por-la-puerta.js     # A · entrance=* en el motor
node src/rutas-antonio.js            # A4 · las siete, antes y después
node src/candidatos-enganche.js      # B · los 198 candidatos
node src/sin-testigo.js              # C · los 1.592 sin testigo
```

---

## 0 · LO QUE HAY QUE LEER SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **A · la puerta** | `entrance=*` entra en el motor. **295 principales · 1.716 con aviso · 74 descartadas** con su motivo cada una. El destino se mueve en el 97,3 % de los casos, pero la mediana son **6,7 m**: lo que importa es el **11,3 % que se mueve más de 25 m**. |
| **B · los 198** | ⚠️ **NO son inocentes, y matiza la tanda 13.** Solo **23 (11,6 %)** son imputables con el criterio estricto, pero el tercer testigo discrepa en el **82,8 %** frente al **43,3 %** normal, y esa diferencia **sobrevive a los dos confusores que se le buscaron**. |
| **C · los sin testigo** | El número útil no es el 3,5 %: son **565 portales (1,2 %)** en sitio urbano. Y **el 47,3 % de ellos son de una sola avenida**. El cabo urbano no está repartido: está **apilado**. |
| **⚠️ lo que sale mal** | Tres fallos nuevos (nº87, nº88, nº89). El más gordo: **medí los tres casos de la puerta con una regla que el motor no usa**, con la advertencia impresa en mi propio informe dos pantallas más arriba. |

---

## A · `entrance=*` — «si el dato dice dónde se entra, se entra por ahí»

Decisión nueva de Antonio. **Orden: principal → cualquiera (avisando de que no es la principal) →
perímetro más barato por ruta → ⛔ nunca el centroide.**

La regla vive en [`src/entradas.js`](../src/entradas.js) y [`src/puerta.js`](../src/puerta.js), en un
sitio y solo en uno. Todo el que quiera saber por dónde se entra a un edificio pasa por `accesos()`:
el `if (hay entrada)` repetido en cada consumidor serían tres copias de una decisión, y dos copias
del mismo dato divergen (fallo nº74).

### A1 · La clasificación, antes de contar y con el motivo de cada corte

Sello de la descarga `2026-08-03T15:08:51Z` · positivo de control de la propia consulta:
**350 farmacias** ⇒ el buscador funciona, así que un cero sería un cero de verdad.

| valor | n | clase | por qué |
|---|---:|---|---|
| `entrance=main` | 295 | **principal** | la única que el dato llama así |
| `entrance=yes` | 1.707 | con aviso | se entra a pie, pero el dato no dice que sea la principal |
| `entrance=shop` · `gate` · `staircase` · `secondary` | 9 | con aviso | ídem |
| `entrance=service` | 24 | ⛔ descartada | acceso de servicio: es del personal, no de quien llega |
| `entrance=garage` | 22 | ⛔ descartada | es para el coche, y esto es un motor a pie |
| `entrance=emergency` | 16 | ⛔ descartada | no se abre desde fuera: mandar a alguien ahí es mandarlo a una pared |
| `entrance=exit` | 11 | ⛔ descartada | es salida, no entrada |
| `entrance=no` | 1 | ⛔ descartada | el dato declara que **no** es una entrada |

**74 descartadas (3,5 %), cada una por su motivo y no por parecerse entre ellas.** Se cuentan y se
declaran; no desaparecen. Y las tres listas son **explícitas**: un valor nuevo que aparezca mañana en
OSM cae en `desconocida` y sale contado aparte, nunca colado por un `default` invisible — que es la
forma exacta del fallo nº69.

**El emparejamiento es POR ID DE NODO**, no por proximidad. Identidad, no parecido.

```
   edificios en la ventana                              11.857
   ⭐ con alguna entrada USABLE                            458   (3,9 %)
      con entradas, pero todas descartadas                  9
   entradas emparejadas con un edificio           578 de 2.085   (27,7 %)
      sin edificio, FUERA de la ventana                 1.135    ⇒ no hay con qué emparejar
      sin edificio, DENTRO de la ventana                  380    ⇒ nodos que no son vértice de ningún building=*
```

⚠️ **Solo el 3,9 % de los edificios lo trae.** Para el 96,1 % la puerta sigue siendo el perímetro, y
si ese punto es una puerta de verdad sigue siendo **`NO CONSTA`** — no por falta de método, por falta
de dato.

### A2 · ¿A cuántos destinos les cambia el punto?

⚠️ **«El punto» no existe sin decir desde dónde**: el motor elige la puerta más barata *por ruta*, y
eso depende del origen. Se mide con orígenes al azar por bandas de distancia, semilla `20260810`
declarada, y los dos conjuntos de candidatos —el viejo y el nuevo— entran en **la misma copia del
grafo y el mismo Dijkstra**.

| banda del origen | pares | cambia el punto | movimiento mediano | p90 | máx |
|---|---:|---:|---:|---:|---:|
| 300–800 m | 424 | 412 (97,2 %) | 6,6 m | 23,9 m | 257,4 m |
| 800–2000 m | 455 | 443 (97,4 %) | 6,8 m | 30,3 m | 151,8 m |

**El 97,3 % no es el titular: la mediana son 6,7 m.** El titular es el **11,3 % que se mueve más de
25 m**, que es cuando alguien acaba en otra fachada.

Lo que **cuesta** ir a la puerta declarada: mediana **+6,7 m**, p90 **+38,3 m**, máx **+337,5 m**.
⭐ Un número positivo **no es un empeoramiento**: es que la puerta de verdad está más lejos que el
trozo de fachada más cómodo. Preferir la fachada era preferir nuestra estimación al dato.

```
   LOS QUE MÁS SE MUEVEN, con nombre — la lista que se puede comprobar a mano
       mueve     cuesta  nivel       edificio
       257 m      -78 m  principal   Estación Zaragoza-Delicias
       152 m      +61 m  cualquiera  (sin nombre en OSM)
       115 m     +214 m  principal   Edificio Central de Medicina
        80 m     +131 m  principal   Museo del Fuego y de Los Bomberos
        74 m      +79 m  cualquiera  Centro de Investigación Biomédica de Aragón (CIBA)
        70 m      +31 m  principal   Centro Comercial Augusta
```

#### ⭐⭐ El control nulo — lo que demuestra que el arnés mide algo

El mismo arnés, los mismos orígenes, sobre **edificios sin ninguna entrada declarada**, donde la
regla no cambia:

```
   pares del control                              283
   con desplazamiento distinto de 0                 0    ✅ el arnés no inventa movimiento
```

Sin esto, un 97,3 % podría ser ruido del instrumento en vez de efecto de la regla.

### A3 · Los tres casos conocidos

> ⛔⛔ **Aquí NO se mide `puertaDe()`.** Es la regla **[2]** —«el perímetro más pegado a la calle»— y
> **el motor no la usa**. Usa **[3]**, el perímetro más barato *por ruta*. La tanda 13 midió estos
> tres casos con [2]. **Bitácora nº87.**

**Estación Delicias** — way 23735099. **5 entradas `main` · 4 `yes` · 0 descartadas** ⇒ nivel
`PRINCIPAL`.

```
   ⭐ ANTES · el destino REAL del motor ([3], por ruta)
        a 25,8 m de la entrada declarada más cercana (mediana de 60 orígenes)
        y caía justo ENCIMA de una (≤ 5 m)         19 de 60   (31,7 %)
   ⭐ AHORA · el destino ES la entrada declarada    0,0 m en el 100 %   ⚠️ POR CONSTRUCCIÓN
```

⚠️ **Ese 100 % no es un logro y no entra en ningún veredicto**: el destino nuevo *es* la entrada, así
que la distancia es cero por definición (ley 35). La única línea que informa es la del **antes** — y
lo que dice es que **en un tercio de los orígenes el motor ya acertaba**, dato que la tanda 13 no
tenía.

**Hospital Clínico Lozano Blesa** — way 24582429. **0 entradas declaradas** ⇒ nivel `PERIMETRO`, no
cambia nada, y si su puerta es una puerta sigue siendo `NO CONSTA`.

**C.C. Utrillas** — el punto no cae dentro de ningún polígono de edificio ⇒ la regla no aplica y se
queda en el punto pedido. Es el caso del fallo nº78, y el motivo se imprime siempre.

### A4 · Las siete rutas de Antonio, antes y después

⛔ `data/pruebas/RUTAS-CONOCIDAS.md` **no se ha tocado**. Se lee y se ejecuta.

| nº | antes [3] | ahora [4] | Δ m | rodeo | tope | nivel | el punto de llegada |
|---:|---:|---:|---:|---:|---:|---|---|
| 1 | 3.087 m | 3.087 m | 0 | 1,17 | ≤1,45 | — | control nulo |
| 2 | 598 m | 598 m | 0 | 1,32 | ≤1,45 | — | control nulo |
| 3 | 3.705 m | 3.705 m | +0 | 1,24 | ≤1,40 | perímetro | se mueve 0,0 m |
| 4 | 506 m | 506 m | +0 | **2,17** | ≤1,60 | **principal** | se mueve 0,0 m |
| 5 | 477 m | 477 m | 0 | 1,37 | ≤1,45 | — | control nulo |
| 6 | 523 m | 523 m | 0 | 1,08 | ≤1,45 | — | control nulo |
| 7 | 2.529 m | 2.529 m | 0 | 1,06 | ≤1,20 | — | control nulo |

**Ninguna de las siete cambia.** Y eso hay que leerlo bien, porque es un resultado limpio y los
resultados limpios se auditan antes de celebrarse:

- **cinco de las siete no tocan ningún edificio** ⇒ tienen que quedar clavadas al metro, y quedan.
  Son el **control nulo** de esta tabla: si se hubieran movido, el cambio habría roto algo ajeno.
- la **nº3** (Hospital Clínico) es de un edificio **sin entrada declarada** ⇒ la regla no aplica.
- la **nº4** (Delicias) sí tiene entrada principal, y **desde Etopía el motor ya llegaba a ella**.

⇒ ⚠️ **Las siete rutas NO son una prueba de este cambio.** Solo una de ellas lo ejercita, y ahí ya
acertaba. Lo que sí demuestran es que **no rompe nada**, que no es lo mismo.

**La nº4 sigue fuera de tope: rodeo 2,17 contra ≤1,60.** Se mantiene lo publicado en `H1-CIERRE.md`:
puede ser real, porque la plataforma elevada obliga a rodear. ⛔ **Y ni el tope ni la ruta se tocan
para que entre.**

### A5 · El aviso cuando la entrada no es la principal

Lo llevarían **385 de 458 edificios (84,1 %)**.

```
   «Biblioteca de Humanidades María Moliner»
   ⚠️  se te lleva a una entrada del edificio, pero el mapa no dice que sea la
       principal (entrance=yes). Puede ser una puerta lateral.
```

⛔ **No inventa nombres.** Dice el tipo tal como viene del dato: si OSM pone `yes`, el aviso pone
`yes`. Escribir «puerta lateral de la calle X» sería escribir dato.
⭐ Y cuando **sí** es la principal, **no hay aviso**: avisar de todo es no avisar de nada.

### A6 · ⚠️⚠️ El cabo que no se puede cerrar

**Una entrada declarada puede estar cerrada al público.** `entrance=*` dice *«aquí hay una puerta»*,
no *«aquí se puede pasar ahora»*. Un portón que solo abre de día, un edificio que cambió de uso, una
puerta que existía cuando alguien la mapeó. Con este dato: **`NO CONSTA`**, y no por falta de método
— por falta de dato. Es el mismo límite que tienen los pasos condicionales, y se declara igual.

Y uno menor: `entrance=yes` puede ser una puerta lateral perfectamente buena o una de servicio que
nadie etiquetó mejor. El dato no distingue, y **el aviso tampoco pretende distinguir**: dice lo que
se sabe.

---

## B · Los 198 candidatos — ¿errores o firma inocente?

### B1 · Clasificar antes de contar

```
   portales ciegos evaluables por el testigo                7.245
   ⭐ con la firma (el enganche los ALEJA > 10 m de su eje)    198   (2,7 %)
      la misma firma en los BUENOS conocidos                   12   (0,1 %)
      la misma firma en los SOSPECHOSOS conocidos             470   (15,8 %)
```

**Las cuatro hipótesis, comprobadas y no asumidas.** Cada una con la misma medida sobre *todos* los
ciegos al lado — que es lo único que dice si el rasgo es del grupo o de la ciudad entera.

| hipótesis | resultado |
|---|---|
| 1 · «acera de avenida ancha» | ⚠️ **a medias.** Distribuidoras ×1,4 · Penetración ×1,7 · Peatonal ×2,2. No es el rasgo dominante. |
| 2 · «engancha a una vía de servicio» | ⭐ **SÍ.** `service` ×3,1 · `pedestrian` ×2,8 · `track` ×2,4 |
| 3 · «portal de esquina» | ⛔ **REFUTADA.** Con firma el portal está **más lejos** de otra calle (44,2 m) que la media de los ciegos (39,1 m). Si fueran esquinas, estaría más cerca. |
| 4 · «no es una calle: es plaza, pasaje o camino» | ⭐ **SÍ, y fuerte.** `PJ` (pasaje) ×24 · `CR` (carrera) ×9 · `CN` (camino) ×2,1 · `AV` ×1,5 |

### B2 · ⭐⭐ Separar la firma del fallo

La firma dice *«el enganche se alejó del eje de su calle»*. **Eso lo produce una acera de avenida sin
que nadie se equivoque.** Lo que no lo produce una acera es que el enganche caiga **encima del eje de
otra calle**: eso es identidad, no distancia.

Y antes de imputarle nada al motor, la pregunta de la ley 48 — **¿el portal ya estaba más cerca de
otra calle antes de que el motor tocara nada?**

| grupo (solo los que llevan la firma) | n | lejos de todo | ⛔ el motor lo movió | el portal ya era ambiguo |
|---|---:|---:|---:|---:|
| BUENOS con firma | 12 | 4 (33,3 %) | 1 (8,3 %) | 7 (58,3 %) |
| SOSPECHOSOS con firma | 470 | 32 (6,8 %) | 67 (14,3 %) | 371 (78,9 %) |
| **CIEGOS con firma** | **198** | **30 (15,2 %)** | **23 (11,6 %)** | **145 (73,2 %)** |

#### ¿Discrimina? — el control positivo no lo elijo yo

⛔ **No se mide sobre «los que llevan la firma»**: ahí los BUENOS son 12 casos y **una tasa sacada de
12 casos no dice nada** (el 8,3 % de la tabla es *un* caso). Se mide sobre **4.000 de cada grupo**,
misma semilla:

```
   «el motor lo movió» · BUENOS conocidos            53 de 4.000   (1,3 %)
   «el motor lo movió» · SOSPECHOSOS conocidos      240 de 4.000   (6,0 %)
   ⭐ «el motor lo movió» · CIEGOS                    70 de 4.000   (1,8 %)
   ⇒ ✅ SEPARA ×4,5 — la casilla mide calidad de enganche, no densidad de calles.
```

**Línea base de identidad barajada (ley 24): 0 de 190 (0,0 %).** Se derrumba, que es lo que tiene que
hacer: con la calle equivocada la casilla deja de encenderse.

### B3 · Los tres testigos

⚠️ **Dos están callados por definición.** Un portal es «ciego» *precisamente porque* enganchó a una
arista sin nombre, así que `codigoVia` y la nube no tienen nombre que comparar:

```
   testigo 1 · codigoVia          osm-sin-nombre: 198
   testigo 2 · la nube            osm-sin-nombre: 179   nube-no-opina: 19
```

⛔ **Ese silencio NO es un aprobado.** Leerlo como «los testigos no ven nada malo» sería el cuarto
testigo de la tanda 12 otra vez. Positivo de control de que los campos funcionan — los mismos dos
sobre portales **vistos**: `concuerda 3.335 / DISCORDA 665` y `concuerda 3.641 / DISCORDA 287`.

**⭐ Testigo 3 · la VECINDAD.** Éste sí puede hablar de un ciego, porque no mira su arista sino las de
al lado:

```
   la vecindad CONCUERDA con la calle del callejero     28 de 198   (14,1 %)
   la vecindad DISCORDA                                       164   (82,8 %)
   ⭐ LÍNEA BASE · ciegos SIN la firma (muestra de 400)   concuerda 52,5 %
```

**Y a esa diferencia se le buscaron sus dos confusores antes de publicarla.**

| d(PORTAL→su eje) | CON firma | SIN firma | diferencia |
|---|---:|---:|---:|
| 20–40 m | 37,5 % (n=32) | 48,4 % (n=384) | −10,9 pts |
| 40–80 m | 15,4 % (n=91) | 58,6 % (n=307) | −43,2 pts |
| 80–∞ m | 3,0 % (n=66) | 49,4 % (n=89) | −46,4 pts |

Y otra vez, **solo vías de tipo CALLE** (donde «rodeado de otras calles» no tiene excusa de plaza):
−15,8 · **−37,6** · **−62,8 pts**.

⇒ **La diferencia sobrevive a los dos.** No es el confusor de la nº85 (la geografía previa) ni el
tipo de vía.

### B5 · ¿Cae alguno en las siete rutas?

⛔ Las aristas **no se recalculan**: se le piden al propio `rutas-antonio.js` con `--aristas`. Dos
copias del mismo cálculo divergen (fallo nº68). La salida sin el flag es idéntica.

```
   ⭐ POSITIVO DE CONTROL · portales que enganchan a esas aristas   108   ✅ el cruce encuentra cosas
   ⭐ de los 198 candidatos, en una arista de las siete               1
      41.65729,-0.90896   PLAZA EL PERIÓDICO DE ARAGÓN   rutas nº 4
```

⭐⭐ **Ése es el más verificable de todos**: está en un trayecto que Antonio anda y del que ya declaró
cuánto debería medir. *(Y es el fallo nº89: la línea de conclusión decía «ninguno» debajo de ésta.)*

### B4 · Los 20 peores, ordenados por GRAVEDAD

**«Gravedad» = cuánto más cerca está el enganche del eje de otra calle que del suyo**, y solo entre
los 23 que el motor movió. Ordenar por la firma pondría arriba las avenidas anchas, que es justo lo
que no se busca.

⛔ Sin número de portal: se identifica por su vía del callejero y su coordenada, que es lo que hace
falta para mirarlo en un mapa. Misma regla que la tanda 13.

| lat, lon | vía del callejero | engancha a | d eje propio | d otro eje | la que parecería correcta |
|---|---|---|---:|---:|---|
| 41.66711,-0.83602 | AVENIDA SANTA ISABEL | footway (sin nombre) | 106 m | 18 m | CALLE ALAMEDA SANTA ISABEL |
| 41.65771,-0.94003 | CAMINO ÉPILA | service (sin nombre) | 94 m | 28 m | CALLE FERNANDO OROZCO GONZALEZ |
| 41.65767,-0.93999 | CAMINO ÉPILA | service (sin nombre) | 92 m | 31 m | CALLE FERNANDO OROZCO GONZALEZ |
| 41.65745,-0.94017 | CAMINO ÉPILA | service (sin nombre) | 90 m | 34 m | CALLE FERNANDO OROZCO GONZALEZ |
| 41.65752,-0.94010 | CAMINO ÉPILA | service (sin nombre) | 90 m | 34 m | CALLE FERNANDO OROZCO GONZALEZ |
| 41.65754,-0.94013 | CAMINO ÉPILA | service (sin nombre) | 90 m | 34 m | CALLE FERNANDO OROZCO GONZALEZ |
| 41.66723,-0.88991 | CALLE MARGARITA NELKEN | footway (sin nombre) | 65 m | 22 m | CALLE MARIA ZAYAS SOTOMAYOR |
| 41.66444,-0.88609 | PLAZA ORTILLA | footway (sin nombre) | 82 m | 41 m | CALLE VALLE DE BROTO |
| 41.64109,-0.93194 | CALLE ALDEBARÁN | footway (sin nombre) | 71 m | 34 m | AVENIDA FRANCISCA MILLAN SERRA |
| 41.64103,-0.93178 | CALLE ALDEBARÁN | footway (sin nombre) | 71 m | 34 m | AVENIDA FRANCISCA MILLAN SERRA |
| **41.65729,-0.90896** | **PLAZA EL PERIÓDICO DE ARAGÓN** | pedestrian (sin nombre) | 87 m | 60 m | **CALLE RIOJA** ⭐ ruta nº4 |
| 41.66823,-0.89182 | CALLE CLARA CAMPOAMOR | footway (sin nombre) | 52 m | 26 m | CALLE MARIA DE ECHARRI |
| 41.66841,-0.89133 | CALLE CLARA CAMPOAMOR | footway (sin nombre) | 53 m | 31 m | CALLE MARIA DE ECHARRI |
| 41.65857,-0.86746 | PASAJE DEL VADO | footway (sin nombre) | 37 m | 19 m | CALLE PEDRO ARNAL CAVERO |
| 41.66830,-0.89166 | CALLE CLARA CAMPOAMOR | footway (sin nombre) | 55 m | 37 m | CALLE MARIA DE ECHARRI |
| 41.67194,-0.83076 | CALLE MARTINCHO | pedestrian (sin nombre) | 52 m | 36 m | AVENIDA ESTUDIANTES SANTA ISABEL |
| 41.67710,-0.89372 | CALLE PEDRO SAPUTO | footway (sin nombre) | 58 m | 44 m | CALLE ALEJANDRO CASONA |
| 41.64014,-0.88982 | CARRERA DEL SÁBADO | pedestrian (sin nombre) | 54 m | 41 m | CALLE MANUEL LASALA |
| 41.65503,-0.85648 | CALLE NOBLEZA BATURRA | footway (sin nombre) | 41 m | 28 m | CALLE ANTONIO ROYO |
| 41.65707,-0.87042 | CALLE CECILIO NAVARRO | footway (sin nombre) | 56 m | 44 m | CALLE PUENTE DE TABLAS |

*(3 más, no mostrados.)* Por zona: Actur 8 · casco 1 · ensanche 1 · Malpica 1 · fuera de las 8
ventanas 12.

### ⭐⭐⭐ B · EL VEREDICTO, EN UNA FRASE

> **MEZCLA, y NO son inocentes: solo en 23 de los 198 (11,6 %) se puede señalar la calle a la que el
> enganche fue a parar —y ése es el único número con nombre y apellidos—, pero los 198 están en
> sitios donde su vecindad tampoco reconoce su calle (82,8 % frente al 43,3 % normal), y eso no lo
> explica ni la geografía previa ni el tipo de vía.**

⇒ Un enganche puede estar mal **sin caer encima de otra calle**: basta con acabar en un camino
interior sin nombre a 90 m de la suya. El estricto no lo ve; la vecindad sí, pero **no puede decir a
dónde debería haber ido**.

#### ⚠️⚠️ Reporte hacia arriba

Esto **matiza `H1-PUNTO-CIEGO.md`**, que los llamó *«candidatos y no errores confirmados»* apoyándose
en que una acera de avenida ancha produce la firma. Eso **sigue siendo cierto** (hipótesis 1: ×1,4 en
distribuidoras), pero **ya no basta para llamarlos inocentes**.

⛔ **NO toca el veredicto «SÍ ACIERTA»**: ése compara 2,7 % contra 15,8 % y esa comparación no cambia
ni un decimal. Lo que cambia es **qué significa ese 2,7 %** — y decidirlo no es mío.

---

## C · Los 1.592 sin ningún testigo

Reconstruido con el mismo criterio de la tanda 13, y **da lo mismo**: 11.942 ciegos (25,9 %) → 1.879
huérfanos → **1.592 sin ningún testigo (3,5 %)**.

### C2 · ¿Por qué no los alcanza ninguno? — la pregunta útil

Casillas **disjuntas**, y el cuadre comprobado (1.553 + 39 = 1.592 ✅):

```
   ⛔ la capa municipal NO LLEGA a su zona            1.553   (97,6 %)
   ⛔ la capa llega, pero su vía NO está en ella          39   ( 2,4 %)
```

⭐ **¿Es que OSM está mudo, o es que 80 m se queda corto?** Con el radio a 300 m:

```
   encuentran un vecino con nombre       238 de 400   (59,5 %)   y está a mediana 147 m
   ⛔ ni a 300 m hay nada con nombre             162   (40,5 %)
```

⇒ Para **el 40,5 % no es el radio: es que OSM no nombra nada por ahí**. Para el resto, el vecino más
cercano está a 147 m — demasiado lejos para heredar un nombre con sentido.

Y por dónde andan: `track` **×9,0** · `service` ×5,9 · `unclassified` ×4,8 · `living_street` ×2,3.
`residential` ×0,3 y `footway` ×0,2, o sea que **no son calles normales de ciudad**.

### C3 · ¿Se puede decir algo sin testigo? — dos señales, probadas antes de usarlas

**(a) Coherencia entre vecinos de la misma vía** (mínimo 5 portales, porque con 2 sale 100 % por
aritmética):

```
   BUENOS conocidos            1.255 vías   23.646 portales    76,4 %
   SOSPECHOSOS conocidos         387 vías    7.975 portales    74,2 %
   ⭐ SIN NINGÚN TESTIGO           68 vías    1.410 portales    64,0 %
```

⇒ ⚠️ **NO VALE.** Separa buenos de sospechosos por **2,2 puntos**, que es nada. Si no distingue un
enganche bueno de uno malo donde *sabemos* cuál es cuál, no puede decir nada donde no lo sabemos. **Se
publica que no vale, no se calla** — un test descartado con razón es información.
⛔ Y aunque separase: **coherente no es correcto.** Cinco portales que enganchan todos a la misma
calle equivocada son perfectamente coherentes.

**(b) La distancia de enganche:**

```
   BUENOS conocidos          mediana 5,3 m · p90 12,9 m · p99 42,9 m
   SOSPECHOSOS conocidos     mediana 7,0 m · p90 25,7 m · p99 62,6 m
   ⭐ SIN NINGÚN TESTIGO      mediana 5,6 m · p90 33,7 m · p99 95,1 m
   ⭐ sin testigo y a ≤ 5 m        728   (45,7 %)
```

⇒ La mediana es de los buenos; **la cola es de los sospechosos y peor**. Y un enganche a 3 m puede
seguir siendo a la calle equivocada —la de al lado está a 12 m—, así que esto **acota** el error, no
lo descarta. Es lo único que se puede decir sin testigo, y hay que decirlo con ese tamaño.

### C4 · ⭐⭐ ¿Importan? — el número que hay que publicar

⛔ **El listón no lo elijo yo** (ley 17): sale del **p10 de densidad de las tres zonas urbanas que
`src/ciudad.js` dibujó en la tanda 9** para el eje densidad, sin saber nada de este grupo.
**LISTÓN = 46 portales en 300 m.**

**Positivo de control**, y ⚠️ **pasa por los pelos: 34,9 %** de los portales de polígono y campo lo
aprueban. ⛔ **No se movió el listón** —ajustar el instrumento al resultado es lo único que este
proyecto no se permite—: se abrió por zona, y ahí estaba la respuesta.

```
   polígono · PLAZA                     0 de   554   ( 0,0 %)
   rural · Garrapinillos              579 de 1.130   (51,2 %)
```

⇒ El listón **no confunde polígono con ciudad**. Lo que hace es **aprobar el casco de un pueblo**, que
tiene densidad de ciudad porque *es* un sitio donde vive gente. Para la pregunta que se está haciendo
—*¿alguien pediría una ruta aquí?*— eso es un sí. *(Bitácora nº88.)*

```
   sin ningún testigo · TOTAL                    1.592   (3,5 % del callejero)
   ⭐⭐ …EN SITIO URBANO                             565   (35,5 % del grupo · 1,2 % del callejero)
      …en polígono, camino o descampado          1.027   (64,5 %)
```

Y su sensibilidad al listón, para que la decisión no quede escondida en un p10:

| listón | vecinos | urbanos |
|---|---:|---:|
| p5 | 36 | 662 (41,6 %) |
| **p10** | **46** | **565 (35,5 %)** |
| p25 | 71 | 443 (27,8 %) |
| p50 | 113 | 233 (14,6 %) |

### ⚠️⚠️ Y EL HALLAZGO NO ES EL TOTAL: ES LA AGRUPACIÓN

| vía del callejero | portales sin testigo |
|---|---:|
| **AVENIDA DE LA ILUSTRACIÓN** | **267** |
| CALLE SAGITARIO | 58 |
| VÍA HISPANIDAD | 53 |
| CALLE BELLAS ARTES | 40 |
| CALLE MELCHOR GASPAR JOVELLANOS | 38 |

```
   ⇒ la vía más afectada es el 47,3 % de los 565 ella sola
     las 3 primeras juntan el 66,9 %
     vías urbanas distintas afectadas: 28
```

⇒ **El cabo urbano no está repartido por la ciudad: está APILADO.** Eso lo hace mucho más barato de
cerrar que un 1,2 % disperso — y también mucho más visible para cualquiera que ande por ahí.

### C5 · Muestra al azar de 20 *(semilla 20260874, declarada)*

| lat, lon | vía del callejero | engancha a | a | vecinos | ¿urbano? |
|---|---|---|---:|---:|---|
| 41.71955,-0.81630 | BARRIO DE LAS FLORES ---MNT | residential | 32,5 m | 18 | no |
| 41.63849,-0.82618 | CAMINO ALTO DE LA TORRE DEL HOSP | track | 4,3 m | 26 | no |
| 41.63773,-0.82563 | CAMINO ALTO DE LA TORRE DEL HOSP | track | 4,1 m | 14 | no |
| 41.66479,-0.97831 | CARRETERA AEROPUERTO | unclassified | 7,7 m | 12 | no |
| 41.65829,-0.80541 | CAMINO DEL PINO ---MVR | residential | 7,7 m | 3 | no |
| 41.67854,-0.89581 | CALLE MARGARITA XIRGU | footway | 6,1 m | 23 | no |
| 41.67713,-1.04548 | CAMINO BÁRBOLES | track | 65,6 m | 1 | no |
| **41.62704,-0.92988** | **AVENIDA DE LA ILUSTRACIÓN** | living_street | 4,1 m | 127 | ⭐ SÍ |
| 41.64854,-0.81076 | CAMINO DEL PORTAL | residential | 31,0 m | 9 | no |
| **41.62764,-0.92943** | **AVENIDA DE LA ILUSTRACIÓN** | living_street | 4,3 m | 127 | ⭐ SÍ |
| 41.61462,-0.85740 | CAMINO DEL CANAL | track | 78,2 m | 3 | no |
| 41.69274,-1.07028 | CAMINO LA FRONDOSA | residential | 38,4 m | 2 | no |
| 41.66045,-0.79872 | CALLE MALPICA II (E) | residential | 2,4 m | 6 | no |
| **41.63148,-0.93220** | **AVENIDA DE LA ILUSTRACIÓN** | living_street | 4,2 m | 172 | ⭐ SÍ |
| 41.64100,-0.82318 | CAMINO ALTO DE LA TORRE DEL HOSP | track | 6,7 m | 1 | no |
| 41.67249,-0.82542 | CAMINO TORRE LANAS | track | 20,0 m | 4 | no |
| 41.67804,-1.01879 | CAMINO BARRIO DEL CAÑÓN | residential | 3,7 m | 17 | no |
| 41.64658,-0.79163 | CAMINO LUGARICO DE CERDÁN | service | 5,6 m | 43 | no |
| 41.66366,-0.97865 | CARRETERA AEROPUERTO | track | 1,2 m | 12 | no |
| 41.62548,-0.86586 | CAMINO MIRAFLORES | track | 3,0 m | 2 | no |

### C6 · El cabo, declarado

⛔ **No se ha buscado otra fuente.** Cerrar esto necesitaría una, y hoy no se sabe cuál. Eso es una
tanda con su propia decisión, no un remate de ésta.

---

## D · MÉTODO — lo que se preguntó antes de medir

⭐⭐⭐ **La norma nueva de esta tanda: antes de escribir cada verificación, responder por escrito
«¿puede esto pasar o fallar sin que nada funcione?»** Las respuestas están **en la cabecera de cada
script**, escritas antes de medir, no después. Resumen:

| verificación | podía pasar por construcción | cómo se tapó |
|---|---|---|
| A1 · «existen 2.085 entradas» | sí, con el fichero vacío | positivo de control de la propia consulta: 350 farmacias |
| A2 · «se mueve el destino» | **sí, dos veces**: comparando contra el *conjunto* viejo (nº86) y con orígenes pegados | se compara contra el candidato que el motor **elegía**; orígenes por bandas; **control nulo** con 0,0 m en el 100 % |
| A3 · «ahora acierta el 100 %» | **sí, es tautológico** | se declara como tal y **no entra en el veredicto**; lo que informa es el *antes* |
| A4 · las siete rutas | sí, si ninguna tocara un edificio | la columna `nivel` sale siempre; 5 de 7 son el control nulo |
| B2 · «cae en otra calle» | sí, en el casco denso (ejes a 15 m) | control sobre BUENOS y SOSPECHOSOS (4.000 de cada) + identidad barajada a 0,0 % |
| B3 · el silencio de dos testigos | **sí, es la definición del grupo** | se imprime el estado real y el positivo de control sobre los vistos |
| B3 · la vecindad | sí, por la distancia previa del portal | estratificado por d(portal→eje) **y** por tipo de vía |
| C2 · las causas | sí, si se solapan | casillas disjuntas + cuadre 1.553+39 = 1.592 |
| C3a · coherencia | **sí, con 2 portales por vía** | mínimo 5, y validación contra buenos/sospechosos ⇒ **no vale, y se publica** |
| C4 · el listón | sí, si lo elijo yo | p10 de unas ventanas de la tanda 9 + control en polígono y campo |

### Los diez ejes

| eje | tocado | cómo |
|---|---|---|
| posición | ✅ | metros a la entrada declarada, al eje municipal, al perímetro |
| vecindad | ✅ | testigo 3 (`heredar` a 80 y a 300 m), densidad de portales en 300 m |
| dirección | ⛔ | **no tocado** — el motor de H1 es simétrico y no hay sentido de circulación |
| identidad | ✅✅ | entradas por **id de nodo**; discriminador «otra calle»; identidad barajada |
| correspondencia | ✅ | edificio ↔ entrada, portal ↔ vía del callejero, codigoVia ↔ tramo municipal |
| umbral/cola | ✅ | firma > 10 m, listón p10 con su sensibilidad p5–p50, distancia p90/p99 |
| escala | ✅ | movimiento del destino en metros por banda de distancia del origen |
| densidad | ✅ | portales en 300 m, el listón entero de C4 |
| agregación | ✅✅ | ⭐ **el hallazgo de C es una agregación**: 47,3 % del número útil en una avenida |
| semántica | ✅✅ | la clasificación de `entrance=*`: `exit` ≠ entrada, `emergency` ≠ puerta, `no` = lo contrario |

### Lo que se buscó a propósito y NO se encontró

- **Que el arnés de A2 inventara movimiento** — control nulo: 283 pares, **0** con desplazamiento.
- **Que los 198 fueran esquinas** — refutado: están **más** lejos de otra calle, no menos.
- **Que la discordancia de la vecindad fuera geografía** (el confusor de la nº85) — no lo es:
  sobrevive estratificando.
- **Que fuera el tipo de vía** (plazas y pasajes) — tampoco: sobrevive restringiendo a CALLE.
- **Que la coherencia entre vecinos sirviera de algo** — no sirve: 2,2 puntos.
- **Que `--aristas` cambiara la salida de las siete** — no la cambia: `diff` idéntico salvo el
  tiempo de ejecución.

### Lo que NO se ha comprobado

- **Si las entradas declaradas están abiertas.** `NO CONSTA` con este dato (A6).
- **Si los 23 imputables son errores de verdad sobre el terreno.** Ninguno se ha ido a mirar. Lo que
  se sabe es que el enganche cayó más cerca del eje de otra calle; **eso no es una foto**.
- **Qué son los 175 restantes.** La vecindad dice que no están donde deberían; el instrumento
  estricto no sabe decir dónde deberían estar.
- **Si el 3,9 % de edificios con `entrance` es representativo.** No lo es: son el centro denso y
  sitios muy mapeados (universidad, hospitales). Nada de lo medido en A se extrapola al resto.
- **Los 565 urbanos, uno a uno.** Se han contado y agrupado, no visitado.

---

## ⭐ LO QUE QUEDA ABIERTO EN H1 — para la auditoría de cierre

| # | cabo | estado | qué haría falta |
|---|---|---|---|
| 1 | **Los 23 enganches imputables** | contados, con coordenada y con la calle que parecería correcta | mirarlos. Uno está en la ruta nº4 de Antonio ⇒ es el más barato de verificar |
| 2 | **Los 175 con la firma sin culpable identificado** | ⚠️ **no inocentes**, pero sin calle a la que señalar | decidir si «la vecindad discrepa» basta para marcarlos |
| 3 | **Los 565 sin testigo en sitio urbano** | acotados y agrupados: 47,3 % en una sola avenida | otra fuente, o mirar la Avenida de la Ilustración |
| 4 | **Los 1.027 sin testigo en polígono y campo** | declarados | otra fuente. Garrapinillos 0 % de cobertura, PLAZA 1,6 % |
| 5 | **¿Está abierta una entrada declarada?** | `NO CONSTA` por falta de dato | `opening_hours` en los nodos de entrada, que hoy casi no existe |
| 6 | **El 96,1 % de edificios sin `entrance`** | perímetro, y si es una puerta `NO CONSTA` | nada disponible hoy |
| 7 | **La ruta nº4 fuera de tope** (2,17 > 1,60) | publicado en `H1-CIERRE.md`; sigue igual | decidir si el tope es real o la plataforma elevada lo justifica |
| 8 | **La capa municipal no llega al 36,3 %** | medido, con el sesgo declarado (no es aleatorio) | otra fuente para la periferia |
| 9 | **Qué SIGNIFICA el 2,7 % del punto ciego** | ⚠️ abierto por esta tanda | decisión de Antonio |
| 10 | **`entrance` en el motor: ¿y las descartadas?** | 74 nodos fuera, cada uno con su motivo | revisar si `staircase` y `gate` deberían estar donde están |

---

## Reportes hacia arriba

1. ⚠️⚠️ **`H1-PUNTO-CIEGO.md` llamó «candidatos y no errores» a los 198.** Con el tercer testigo y
   sus dos confusores descartados, **eso ya no se sostiene tal cual**. No toca el veredicto
   «SÍ ACIERTA» (2,7 % contra 15,8 %), pero sí lo que ese 2,7 % significa. **No he tocado el
   documento.**
2. ⚠️ **`H1-PUNTO-CIEGO.md` §D3 midió los tres casos de la puerta con la regla [2], que el motor no
   usa.** El «25,8 m» de Delicias es correcto como mediana, pero **en el 31,7 % de los orígenes el
   motor ya llegaba a la puerta buena**. Bitácora nº87. **No he tocado el documento.**
3. **Meter `entrance` en el motor puede alargar rutas** — hasta **+337 m** en el peor par medido, y
   +214 m en el Edificio Central de Medicina. Es la consecuencia correcta de la decisión, pero es una
   consecuencia y va dicha.

---

*Ejecutado el 2026-08-03. Sello del grafo `2026-08-03T08:19:51Z` · entradas `2026-08-03T15:08:51Z` ·
capa municipal `MU1_jerarquia_viaria` completa, 3.644 tramos. Bitácora nº87, nº88 y nº89.*
