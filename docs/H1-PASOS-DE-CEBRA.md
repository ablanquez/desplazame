# H1 · UN PASO DE CEBRA NO TIENE NOMBRE

*Tanda 26 · 2026-08-05 · idea de Antonio: «si un paso de cebra es un paso de cebra y no tiene nombre,
no lo tendrá que tener ninguno, digo yo».*

> **Este documento se AÑADE, no reescribe nada.** Corrige un número publicado en
> `docs/H1-CALLE-PEGADA.md` §E y lo dice donde toca (§A1).

```
node src/paso-de-cebra.js                                   # todo lo de aquí
node src/exportar-nombre-simple.js && node src/probar-visor-nombre-simple.js
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ la distinción, que es lo importante** | Una **acera sin nombre** es información que falta: es un problema. Un **paso de cebra sin nombre** no lo es. Meterlos en el mismo rojo hacía que el mapa **exagerase el problema**. |
| **⛔ y encima se los estábamos poniendo** | **3.786 aristas de paso (36,1 %) llevaban un nombre puesto por nosotros**, y 3.753 los puso el testigo de la calle pegada — el de la tanda 25, el día antes. |
| **⭐⭐ el reparto nuevo** | **51.977 azules · 36.303 rojas · 10.494 grises.** |
| **⭐⭐ y el número que pediste** | **Quedan 36.303 rojas DE VERDAD**, no 41.910. El mapa exageraba el problema en **5.607 líneas, un 13,4 %**. |
| **⭐ escaleras: recomiendo NO tocarlas** | De las 75 que OSM nombra, **73 llevan el nombre de una calle que sale de su propio extremo**. El mapeador las trata como tramo escalonado, no como conector. En juego: 193 aristas, 1,20 km. **Decide Antonio.** |
| **⚠️ y hay una que sí es el mismo caso y NO he tocado** | La **isleta** (`footway=traffic_island`): 674 aristas, 369 con nombre deducido. Es literalmente el trocito de en medio del paso. Extender la regla es una decisión. |
| **⛔ lo que sale mal (mío)** | Tres entradas de bitácora: nº110 (publiqué el 3.786 como logro), nº111 (un cuadre que pasaba por construcción y un número falso con ✅), y nº112 (**el hook escribió en la bitácora y lo commiteé sin leerlo**). |

---

## LA DISTINCIÓN

> **«Si un paso de cebra es un paso de cebra y no tiene nombre, no lo tendrá que tener ninguno.»**

El modelo solo tenía dos estados: **con nombre** y **sin nombre**. Faltaba el tercero.

```
   una ACERA sin nombre         → falta información.  Es un problema.   ⇒ ROJO
   un PASO DE CEBRA sin nombre  → no falta nada. Es así.                ⇒ GRIS
```

⭐ Y el porqué no es estadístico, es de definición: **un paso de cebra no es de ninguna calle, es del
cruce.** El que cruza de Rodrigo Rebolledo a Salvador Minguijón está entre las dos y no pertenece a
ninguna. **Ponerle una es elegir, y elegir es inventar.**

⇒ La regla se declara **en un solo sitio**, `src/planarizar.js`, al lado de `precision()` — que es
donde vive D4—, y la leen desde ahí el modelo y el redactor. ⛔ **No se copia en ninguno de los dos**
(ley 56: no copies la regla, llama a la función).

---

## A · QUE EL MÉTODO NO SE LOS PONGA

### A1 · ⚠️ La sospecha del encargo era correcta, y era grande

> *«Un paso de cebra tiene portales cerca y una calle pegada, así que cumple las condiciones de los
> dos testigos. Probablemente hoy se les está poniendo nombre.»*

```
   aristas `paso-de-peatones`                              10494  (46,55 km)
   ⭐ con nombre que trae OSM — dato ajeno, SE RESPETA      1101  (4,38 km)   10,5 %
   ⛔ con nombre puesto POR NOSOTROS                        3786  (18,36 km)  36,1 %
      sin nombre de ninguna clase                          5607
```

**Uno de cada tres pasos de cebra llevaba un nombre de calle que le habíamos puesto nosotros.**

⭐ **El positivo de control de ese número, que el encargo pedía:** si saliera cero habría que
sospechar. Sale 3.786, **y con su desglose por testigo, que es lo que dice cuál de los dos lo hacía**:

```
   pegada                     3753   18,16 km
   portales+pegada              33      201 m
```

⚠️⚠️ **Casi todos los pone la CALLE PEGADA: el testigo que metí en la tanda 25, el día antes.** Y el
mecanismo estaba escrito y medido en `H1-CALLE-PEGADA.md` §D4 —*«en una línea CORTA los cinco puntos
de muestreo caen casi encima»*, 85,8 % de acierto entre 25 y 50 m contra 99,7 % entre 100 y 250—.
**Las líneas más cortas del grafo son justamente los pasos** (mediana 3,9 m), y a menos de 11 m
siempre hay una calle. ⛔ **No es un fallo del método: es que la pregunta no aplicaba y nadie se lo
había dicho.**

### A1b · Los 1.101 que nombra OSM, mirados

Los nombres más repetidos: «Paseo de Sagasta» ×30, «Calle de Pablo Ruiz Picasso» ×17, «Avenida de
Santa Isabel» ×15, «Calle del Coso» ×10… **Son nombres de CALLE, no nombres propios del paso**: el
mapeador extendió la calle sobre el cruce.

⛔ **Aun así no se toca el dato ajeno.** El modelo lo sigue llevando y el texto lo sigue teniendo. Lo
que cambia es el **color**: la pregunta *«¿le falta el nombre?»* no aplica a un paso de peatones lo
lleve o no. ⇒ los 10.494 van de gris, los 1.101 incluidos.

### A3 · «Sin nombre» y «no tiene nombre», registrados en el dato

```
   src/planarizar.js    SIN_NOMBRE_POR_DEFINICION = new Set(['paso-de-peatones'])
   src/modelo.js        M[i].nombreNoAplica          ⇒ y no se le asigna vía deducida
   src/relato.js        Rel.tramo(...).noAplica      ⇒ lo que pregunta el mapa
```

### A4 · ⭐⭐ Qué cambia — el antes y el ahora, **los dos calculados**

⛔ El «antes» no se lee de ningún fichero **ni del modelo ya arreglado**: se monta el modelo con la
regla vieja (`construirModelo(g, portales, { pasosConNombre: true })`) en el mismo proceso y se le
pregunta **al mismo redactor** las dos veces. *(La primera versión no hacía esto y publicó un número
falso: bitácora nº111.)*

```
   categoría                     antes    ahora   metros antes   metros ahora
   AZULES · con nombre           56864    51977     3076,92 km     3054,18 km
   ⭐ ROJAS · LE FALTA            41910    36303     3423,06 km     3399,25 km
   ⭐ GRISES · no aplica              —    10494              —       46,55 km
   ─────────────────────────────────────────────────────────────────────────
   suman                         98774    98774
```

⭐⭐ **ROJAS DE VERDAD: 36.303 (3.399,25 km).** Parecían 41.910. **El mapa exageraba el problema en
5.607 líneas, un 13,4 %.**

Y cuatro exigencias que **no pasan por construcción** —si el gris se llevara una acera, o si algún
otro nombre se hubiera movido de sitio, se ponen rojas—:

```
   líneas que cambian de categoría                      10494
   ⛔ …de ellas, las que NO son un paso de peatones          0   ✅
   los azules bajan exactamente en los pasos que tenían nombre    ✅
   las rojas bajan exactamente en los que no lo tenían            ✅
```

---

## B · EL COLOR PROPIO EN EL MAPA

```
   AZUL  #1f5fd0   grosor 1,8   opacidad 0,75     tiene nombre de vía
   ROJO  #e01b00   grosor 1,8   opacidad 0,75     LE FALTA el nombre
   ⭐ GRIS  #9aa0a6   grosor 1,0   opacidad 0,35     NO TIENE nombre: es un paso
```

⚠️ **El gris va más fino y más apagado, y eso NO contradice la ley 57 de la tanda 25 — la aplica.**
Aquella dice que dos categorías que responden a **la misma** pregunta se pintan igual, para que el
ojo no le dé más peso a una. Azul y rojo son las dos respuestas a *«¿tiene nombre?»*. **El gris no es
una tercera respuesta: dice que la pregunta no aplica ahí.** El mapa se abre para ver dónde falta
nombre, y un paso no falta: no debe competir por la atención.

⭐ Y los grises **se pintan primero**: si un paso se dibujara encima de la calle taparía justo lo que
se viene a mirar. *El orden de pintado también afirma.*

### B3 · El reparto

```
                        visor     arnés      dato
   AZULES · con nombre  51977     51977     51977   ✅
   ROJAS  · le falta    36303     36303     36303   ✅
   GRISES · no aplica   10494     10494     10494   ✅
   ⭐ suman                                 98774 de 98774   ✅
```

⚠️ Y esos tres contadores **leen la misma fuente**, así que no son tres testigos (ley 55). El que
vale es el de abajo:

```
   CONTRA EL MOTOR · líneas donde el color y el redactor NO coinciden      0   ✅
   ⭐⭐ y su ROJO, VISTO — dos veces, con las dos reglas viejas:
      (a) el nombre por ARISTA (antes de la tanda 24)                 11000   ✅ la caza
      (b) DOS categorías, con los pasos en el rojo (la tanda 25)       10494   ✅ la caza
```

⭐ La categoría tampoco la reimplementa el arnés: **llama a `CATEGORIA()` del exportador**, que a su
vez llama a `Rel.tramo()`. Un solo camino.

Y la línea falsa, con las tres categorías: se mete roja y sube el rojo; se mete azul y sube el azul;
**se mete de paso de peatones y sube el gris**, y en los tres casos los otros dos montones no se
mueven.

---

## C · ESCALERAS Y PASARELAS — se mira, NO se decide

### C1 · Cuántas hay

```
   aristas `escaleras`                                809  (8,33 km)
      con nombre de OSM                                85  (756 m)
      ⭐ con nombre DEDUCIDO — lo que está en juego     193  (1,20 km)
```

### C2 · ⭐⭐ El testigo independiente: cuando OSM nombra una escalera, ¿qué nombre le pone?

Si le pusiera un nombre **propio** («Escaleras de X»), tendría sentido que las escaleras llevaran uno
suyo. Si le pone el de una **calle vecina**, es que el mapeador la trata como el tramo escalonado de
esa calle. ⭐ **Y esto no lo elijo yo: lo dice el dato ajeno.**

```
   ways de escalera que OSM nombra                                    75
   ⭐ el nombre es el de una calle que sale de su propio extremo       73   (97,3 %)
      no coincide con ninguna vecina (podría ser nombre propio)        2   (2,7 %)
         · «Calle de Desideria Giménez Moner»
         · «Puente de la Banda del Canal»
```

### C1b · La prueba que separa: ¿RECORRE o ATRAVIESA?

Si los dos extremos dan a la misma calle, la escalera es un **tramo escalonado** de ella. Si dan a
dos calles distintas, **atraviesa** — que es el caso del paso de cebra.

```
   forma              los extremos…                                 ways        %    metros
   escaleras          NO CONSTA (alguno no toca calle con nombre)    630   82,7 %   7,14 km
                      ⭐ dan a LA MISMA calle  ⇒ la recorre            89   11,7 %     560 m
                      ⛔ dan a calles DISTINTAS ⇒ la atraviesa         29    3,8 %     584 m
                      (no tiene dos extremos limpios)                  14    1,8 %      44 m
```

⚠️ **El 82,7 % no se puede decidir así.** `NO CONSTA` no es «no lo he mirado»: es que no se sabe.

### C3 · ⭐ LA RECOMENDACIÓN — y decide Antonio

> **NO aplicar la regla del paso a las escaleras.**

1. **El dato ajeno dice lo contrario:** 73 de 75 llevan el nombre de una calle que sale de su propio
   extremo. Quien mapea las trata como tramo escalonado, no como conector.
2. **De las que se pueden decidir por sus extremos, la mayoría RECORRE una sola calle** (89 contra
   29).
3. **Lo que está en juego son 193 aristas y 1,20 km:** el mapa no se mueve por eso, y el riesgo de
   quitarle el nombre a una calle escalonada real es mayor que el de dejárselo a un conector.

⚠️ **El cabo que queda:** las 29 que unen calles **distintas** sí son el caso del paso, y ahí el
nombre es tan inventado como en un cruce. Se puede distinguir con esta misma prueba de extremos —
pero solo en el 17,3 % de los casos.

### C4 · ⚠️ Qué más está en el mismo caso — buscado a propósito

El criterio no es «es pequeño»: es **atravesar en vez de recorrer**.

```
   familia                                     aristas     metros   con nombre DEDUCIDO
   ⭐ isleta · `footway=traffic_island`             674    3,56 km       369  (1,67 km)
   pasarela peatonal · `footway`+`bridge`          371   15,31 km        69  (2,63 km)
   pasarela ciclista · `cycleway`+`bridge`          67    5,84 km        33  (1,98 km)
   paso subterráneo · `footway`+`tunnel`           167    4,14 km        33  (843 m)
   ascensor · `highway=elevator`                     0        0 m         0
   rotonda · `junction=roundabout`                1520   35,23 km       282  (4,78 km)
```

⭐⭐ **LA ISLETA ES EL MISMO CASO Y NO ESTÁ ARREGLADA.** Es literalmente el trocito que queda en medio
del paso de cebra. Su precisión D4 es `peatonal`, no `paso-de-peatones`, así que la regla de hoy no
la toca: **369 aristas siguen llevando un nombre deducido que no les corresponde.** ⛔ Extender la
regla es una decisión, y las decisiones son de Antonio.

⚠️ **Las pasarelas y los pasos subterráneos son OTRO caso:** atraviesan un río o una autovía, no una
calle — no hay «dos calles» entre las que elegir—, y cuando llevan nombre suelen llevar uno propio
(«Puente de la Banda del Canal»).

⛔ **Las rotondas NO están en este caso**, y se miró: en Zaragoza una rotonda tiene nombre propio
(«Rotonda Villa de Pau», «Rotonda Pablo Gargallo»). Se descarta con su evidencia.

---

## LAS SIETE RUTAS

**Idénticas al milímetro** (3086,9 · 598,1 · 3704,9 · 505,9 · 477,4 · 523,4 · 2528,9) y contra lo
publicado en la tanda 16. Único rojo vivo del guardián: el declarado de la tanda 19.

⭐ **El texto de las rutas no se mueve por esto**, y tiene su porqué: `relato.js` ya contaba un paso
como *«Cruzas por un paso de peatones»* **sin imprimir nunca su nombre** (tanda 17 §A2: *«el nombre no
les hace falta y no lo llevan en ninguna ciudad»*). El nombre estaba en el dato, no en la frase. ⇒ la
semántica ya era correcta en el redactor **y el modelo no se había enterado**.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que ningún paso tuviera nombre deducido** (la costura del encargo) — **falso**: 3.786, con su
  desglose por testigo.
- **Que el gris se llevara algo que no es un paso** — **no**: 0, comprobado en las dos direcciones
  (*todos los pasos son grises* **y** *todos los grises son pasos*).
- **Que alguna ruta se moviera** — **no**: las siete idénticas al milímetro.
- **Que hubiera ascensores en el mismo caso** — **no hay ninguno** en el grafo (`highway=elevator`: 0
  aristas). ⚠️ Los pasos condicionales de D3 sí incluyen ascensores, pero entran por otra etiqueta.
- **Que las rotondas fueran el mismo caso** — **no**: llevan nombre propio.

## LO QUE NO SE HA COMPROBADO

- **Que los 1.101 nombres de paso que trae OSM sean correctos.** No se tocan: son dato ajeno.
- **Si la isleta debe ir de gris.** Está medida (674 aristas, 369 con nombre deducido) y **no
  aplicada**. Decide Antonio.
- **Si alguna de las 630 escaleras «NO CONSTA» es un conector.** No se puede saber con esta prueba.
- **Que el gris se vea bien.** Eso lo dice un ojo delante del navegador, y no lo tengo.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| semántica | ⭐⭐⭐ sí — **es la tanda entera**: «sin nombre» contra «no tiene nombre» |
| identidad | ⭐⭐ sí — de qué calle es un paso de cebra: de ninguna |
| escala | ⭐ sí — el paso es la línea más corta del grafo, y por eso el testigo de la tanda 25 lo nombraba |
| agregación | ⭐ sí — el antes/ahora calculado dos veces, no reconstruido |
| correspondencia | ⭐ sí — el nombre de OSM sobre una escalera contra la calle de su extremo (C2) |
| vecindad | ⭐ sí — la prueba de extremos (recorre / atraviesa) |
| umbral/cola | ⛔ no — aquí no hay umbral: la regla es de definición |
| posición · dirección · densidad | ⛔ no |

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **La isleta (`traffic_island`)**: 674 aristas, 369 con nombre deducido | medido, ⛔ **no aplicado**. Es el mismo caso |
| 2 | **Las 29 escaleras que unen dos calles distintas** | medido; recomendación: dejarlas. Decide Antonio |
| 3 | **El hook rechaza en falso un `git commit --amend`** y escribe un esqueleto en la bitácora | reportado, ⛔ **no tocado**: es un guardián |
| 4 | **365 `cycleway` con el nombre de la avenida paralela** (cabo de la tanda 17) | sigue abierto, sin tocar |
