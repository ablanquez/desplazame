# H2b · Tanda 3 — EL ENGANCHE PROPIO DE LA BICI

*2026-08-12 · base `da27616` · **la medición que corrige una conclusión mía de anteayer.***

> ⛔⛔ **NO SE HA TOCADO NI UNA LÍNEA DE `src/`.** La rendija de la tanda de arreglo 9 se cerró: el
> instrumento vive en `tools/grafo/enganche-bici.js` y **no añade ningún campo, no hace el grafo
> dirigido y no calcula ni un minuto.**

> **Este documento se AÑADE. No reescribe ninguno anterior** — y eso incluye
> `docs/H2B-CIRCULACION-BICI.md` §3, cuya conclusión esta tanda **corrige** (§2).

```
   node tools/grafo/enganche-bici.js      # todo lo de aquí
```

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⭐⭐ **El positivo de control reproduce el p99 exacto** | **65,4 m · desvío 0,0 m** sobre la misma muestra determinista de 2.308 que usó H2·5. *Sin esto, nada de lo demás valdría* |
| ⛔⛔ **Y corrige una conclusión mía de la tanda 2** | Escribí *«el hueco casi se triplica»* con **dos casos**. Sobre los 46.150 portales el factor es **1,39× en la mediana** y **1,13× en el p99**. Bitácora nº202 |
| ⭐⭐⭐ **Nadie se queda fuera** | **0 portales sin arista de bici a 350 m.** Y andando por el grafo, **solo 179 (0,4 %) no alcanzan la red de bici** |
| ⭐⭐⭐ **El tramo empujando, andado de verdad: p50 6,8 m · p90 26,9 m** | Y la causa está medida: **el 63,9 % de los portales engancha a una arista que YA es de bici** ⇒ empujan **cero** |
| ⭐ **El criterio elegido: se engancha a pie y se empuja hasta la calzada** | No es el enganche el que cambia: **es que la ruta en bici empieza y acaba andando.** Y eso es una decisión de producto, declarada |
| ⛔ **La ruta de los dos POI, con lo que la ruta NO cuenta** | 4.651,3 m rodando **+ 219,1 m empujando en el origen + 125,6 m en el destino = 4.996,0 m** |
| ⚠️ **Sigue sin duración y sigue no dirigida** | Falta una velocidad para `empuja`; y `oneway=yes` en **23.499 de 49.972 (47,0 %)** |

---

## §1 · T1 · LA MEDICIÓN

### 1.1 · ⭐⭐ El positivo de control, primero — y no es opcional

H2·5 midió el enganche **peatonal** de una muestra determinista de portales y publicó **p99 = 65,4
m**. Este instrumento mide **la misma muestra con su propio código**:

```
   muestra determinista (1 de cada 20)     2308   (H2·5: 2308)

   población                       n     mín     p50     p75     p90     p95     p99      máx
   PORTALES → red PEATONAL      2308     0.2     5.3     8.5    17.4    27.7    65.4    195.8

   p99 medido · publicado por H2·5 · desvío        65.4 m · 65.4 m · 0.0 m
   ⭐ provocado: la misma muestra inflada un 50 %   ✅ el control lo cazaría (p99 98.0)
```

⭐ **Desvío 0,0 m sobre las ocho columnas.** ⛔ Y la tolerancia se apretó a **1 m** —la hermana usa 10
m contra el 65 redondo de H1— porque aquí se contrasta contra **la misma medición**, no contra una
parecida. **Y lleva su provocación: un control que no sabe fallar no vale.**

### 1.2 · ⭐⭐⭐ Los 46.150 portales, contra las dos redes

```
   población                       n     mín     p50     p75     p90     p95     p99      máx
   PORTALES → red PEATONAL     46150     0.0     5.3     8.8    18.0    27.0    65.2    303.1
   ⭐ PORTALES → red de BICI    46150     0.0     7.4    14.0    30.8    43.4    73.9    303.1

   ⛔ portales SIN arista peatonal a 350 m      0   (0,0 %)
   ⛔ portales SIN arista de BICI a 350 m       0   (0,0 %)
```

⭐ **El factor, percentil a percentil — ⛔ no una media:**

```
   p50  1,39×   ·   p75  1,59×   ·   p90  1,71×   ·   p95  1,61×   ·   p99  1,13×   ·   máx  1,00×
```

⚠️⚠️ **La cola CONVERGE.** En el p99 los dos números casi coinciden y el máximo es idéntico (303,1
m): **los portales peores no están lejos de la red de bici — están lejos de TODO.** *El problema del
p99 no es la bici: es dónde están esos portales.*

### 1.3 · Cuántos quedan lejos — la curva entera, sin elegir listón

```
   a más de     peatonal        %       bici        %
   25 m             2669    5,8 %       6289   13,6 %
   50 m              728    1,6 %       1579    3,4 %
   65 m              465    1,0 %        679    1,5 %
   100 m             202    0,4 %        210    0,5 %
   150 m              81    0,2 %         81    0,2 %
   350 m               0    0,0 %          0    0,0 %
```

⇒ ⭐ **A partir de 150 m las dos columnas son la MISMA**, hasta el último portal. **La bici solo
penaliza en el tramo corto**, que es donde se resuelve empujando.

---

## §2 · ⛔⛔ LO QUE ESTO CORRIGE DE LA TANDA 2

La tanda 2 concluyó, con **dos casos**:

> *«La bici necesita SU PROPIO ENGANCHE, y el hueco casi se triplica»* (28,7 → 65,6 m · 31,1 → 99,1 m)

**Los dos casos son correctos y están bien medidos. La generalización no.**

| | |
|---|---|
| ✅ **sigue en pie** | **la bici necesita su propio enganche** — con el de andar, la ruta no existe |
| ⛔ **se cae** | *«el hueco casi se triplica»*. **1,39× en la mediana, 1,13× en el p99, 1,00× en el máximo** |

⭐⭐ **Y la causa de mi error está medida: los dos casos son EDIFICIOS**, no portales — un centro
comercial y una estación, con su centroide lejos de cualquier calle. **Medí una población y hablé de
otra.** ⚠️ Y lo peor: la tanda 2 **declaraba ese límite en su §6** —*«no es una muestra: es un caso»*—
**y generalizaba en su §3.** Las dos frases convivieron, **y la que viajó al documento de estado fue
la conclusión.** Bitácora nº202, con su ley: ⭐⭐⭐ ***un adjetivo no tiene denominador, y por eso viaja
donde un número no habría pasado.***

---

## §3 · T2 · ⭐⭐⭐ EL CRITERIO — y no es el que parecía

Las tres salidas que el encargo planteaba, con su precio medido:

| | salida | precio |
|---|---|---|
| **A** | **enganchar a la arista `circula` más cercana** | p50 7,4 m · p90 30,8 · **0 portales fuera**. ⚠️ Pero **teletransporta**: pone al ciclista sobre la calzada sin decir cómo llegó |
| **B** ⭐ | **enganchar a pie, como siempre, y EMPUJAR hasta la red de bici** | p50 **6,8 m** · p90 **26,9 m** · **179 portales (0,4 %) no llegan** |
| **C** | declarar `sin camino` | ⛔ **descartada por el dato**: con A o B, **0 y 179 de 46.150**. Declarar sin camino a todo el mundo por 179 casos sería tirar el 99,6 % |

⇒ ⭐⭐⭐ **SE ELIGE B, y el motivo es que es la única que describe lo que pasa de verdad:** sales por
la puerta con la bici en la mano, andas por la acera hasta la calle, y ahí te subes. **A da un número
más bonito y esconde ese tramo; B lo cuenta.**

**Y su precio, escrito:**

- ⛔ **179 portales (0,4 %) no alcanzan la red de bici andando.** No es un listón que se pueda
  aflojar: **están en componentes peatonales que no tocan ninguna arista de bici.** Van declarados,
  no escondidos.
- ⚠️ **El primer y el último tramo de una ruta en bici se hacen ANDANDO**, empujando. ⇒ **Es una
  decisión de producto y aquí queda declarada**: quien pida una ruta en bici va a ver *«saca la bici
  y anda X metros hasta la calle»*.

### 3.1 · ⭐⭐ Por qué el tramo andado sale MENOR que la línea recta

```
   ⭐ EMPUJANDO, andado de verdad   45971   0.0   6.8   11.4   26.9   44.4   101.1   303.1
      (comparar) en línea recta    46150   0.0   7.4   14.0   30.8   43.4    73.9   303.1
```

**No es una paradoja: son dos preguntas.** La recta va del portal **a la arista de bici más cercana**;
la andada va del portal **a su arista peatonal** y de ahí, por el grafo, al nodo de bici más próximo.
⇒ **si la arista a la que engancha el portal ya es de bici, lo andado es cero.**

```
   ⭐ portales cuya arista PEATONAL ya es de bici     29502   (63,9 %)
```

⭐ **Casi dos de cada tres portales dan directamente a una calle por la que se puede rodar.** ⛔ Y esto
está **medido, no razonado**: el instrumento lo cuenta y se pone rojo si baja de la mitad.

⚠️ **Y en la cola se invierte:** el p99 andado (**101,1 m**) es mayor que el recto (73,9 m), porque
ahí sí hay que rodear. *La media habría escondido las dos cosas.*

### 3.2 · ⭐ El Dijkstra multiorigen, y su control

El tramo empujando de las 46.150 se mide con **un solo Dijkstra multiorigen** desde los **39.142
nodos** que tocan una arista de bici, sobre la red peatonal. ⛔ **No es una muestra: son todas.**

⭐⭐ **Y como es código mío y no del proyecto, lleva su control** (ley 56 al revés: si hay que
reescribir, hay que demostrar que coincide):

```
   ⭐ control: multiorigen con UN origen vs `G.dijkstra`   ✅ idéntico nodo a nodo
```

---

## §4 · T3 · LA RUTA, Y POR DÓNDE VA

⛔ **Que salga no demuestra nada.** Los dos POI son los ya medidos, para que sea comparable:

```
   POI                   enganche A PIE          enganche a la BICI
   Estación Delicias     corridor a 31,1 m       service a 99,1 m
   C.C. Utrillas         footway  a 28,7 m       tertiary a 65,6 m

   a pie   · enganche a pie        4743,4 m · 227 aristas
   en bici · enganche de bici      4651,3 m · 150 aristas

   highway               metros       %
   primary                 2596  54,7 %
   secondary                740  15,6 %
   residential              618  13,0 %
   service                  376   7,9 %
   cycleway                 306   6,4 %
   tertiary                 112   2,4 %
```

⭐ **306 m de carril bici (6,4 %)**, contra los 79 m (1,6 %) que publicó la tanda 2 **antes de que la
tanda de arreglo 9 destapara que el apaño le prohibía a la bici los carriles con el peatón vetado.**
*El número subió cuatro veces al quitar el apaño, y eso cierra aquel hallazgo con una cifra.*

⛔⛔ **Y aun así el 54,7 % va por avenida principal.** La decisión de producto de la tanda 2 sigue
igual de viva: **la bici va entre coches.**

### 4.1 · ⛔⛔ Lo que la ruta NO cuenta

```
   empujando en el origen     219,1 m
   empujando en el destino    125,6 m
   ⇒ el trayecto real         219,1 + 4651,3 + 125,6 = 4996,0 m
```

⚠️ **Los dos extremos son de los peores del reparto** —el p90 son 26,9 m— y aun así **suman 344,7 m,
el 6,9 % del trayecto**. ⭐ *Y no es casualidad: los dos POI son edificios grandes, que es exactamente
la población que me hizo equivocarme en §2.*

---

## §5 · T4 · LOS LÍMITES, DECLARADOS

### 5.1 · ⛔ Sin duración, y ahora se ve por qué

La constante adoptada son **18 km/h en calzada**. Este trayecto tiene **tres regímenes**: empujar ·
rodar · empujar. ⇒ **Falta una velocidad para `empuja`**, y sin ella **un trayecto en bici no tiene
duración**, ni siquiera con la constante ya decidida.

⭐ **Qué falta, exactamente, para que la tenga** — y es corto:

1. **Una velocidad para `empuja`**, adoptada como se adoptó la de rodar (openrouteservice le da a la
   acera una cifra muy inferior a la de calzada, y a las escaleras la mitad de ésa).
2. **Que el tramo empujado forme parte del trayecto**, no un número al lado. Hoy la ruta son 4.651,3
   m y el trayecto 4.996,0: **son dos objetos distintos y solo uno se calcula.**
3. ⚠️ **Y nada más.** No hace falta el reloj: son dos constantes y una suma.

### 5.2 · ⛔ La red de bici es NO DIRIGIDA

```
   `oneway=yes` en 23.499 de las 49.972 que circulan   (47,0 %)
```

⇒ **Una ruta en bici puede meterse a contramano y el motor no se entera.** Medido en H2b·2, sin
resolver, **y sigue igual**. ⛔ La ruta del §4 **puede llevar contramanos dentro y no se ha mirado.**

---

## §6 · ⚠️ QUÉ CLASE DE PORTAL **NO** HE PROBADO

- **Los 179 que no alcanzan la red de bici andando.** Están contados y **no están mirados**: no sé si
  son barrios rurales, polígonos o artefactos del límite del grafo. *Es exactamente la forma del
  hallazgo de los tres barrios incomunicados de H1, y merece su vistazo.*
- **Ningún portal con `numero-aproximado` ni de vía sin nombre.** El instrumento coge los 46.150 tal
  cual salen de `cargarPortales()`, **sin mirar su calidad**: si un portal está mal situado, aquí
  entra como bueno.
- **Ningún portal de los tres barrios rurales incomunicados**, que H1 dejó fuera a propósito.
- **Ningún caso mirado sobre el mapa.** Ni uno. Todo sale de tres columnas y un grafo.
- ⚠️ **Y la ruta del §4 no es un portal: son dos EDIFICIOS.** *Después de la bitácora nº202, esto se
  dice antes y no después:* **no es una muestra, es un caso**, y su 6,9 % de empuje **no se puede
  leer como propiedad de las rutas en bici.**

---

## §7 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐ **El positivo de control reproduce el p99 de H2·5 con desvío 0,0 m** sobre las ocho columnas,
   con provocación. **El instrumento mide lo que dice medir.**
2. ⛔⛔ **Se corrige una conclusión de la tanda 2 que ya estaba destilada en el estado:** el hueco de
   enganche **no se triplica** — **1,39× en la mediana, 1,13× en el p99, 1,00× en el máximo**.
   Bitácora nº202.
3. ⭐⭐⭐ **Ley nueva:** *un adjetivo no tiene denominador, y por eso viaja donde un número no habría
   pasado.* ⚠️ Y su corolario: **declarar el límite en la sección de límites no protege la
   conclusión** — la tanda 2 decía *«es un caso»* en su §6 y generalizaba en su §3.
4. ⭐⭐⭐ **Nadie se queda fuera: 0 portales sin arista de bici a 350 m**, y solo **179 (0,4 %)** no la
   alcanzan andando.
5. ⭐⭐ **El criterio: se engancha a pie y se empuja hasta la calzada.** p50 **6,8 m**, p90 **26,9 m**.
   ⇒ **el primer y el último tramo de una ruta en bici se hacen andando**, y es decisión de producto.
6. ⭐ **El 63,9 % de los portales da directamente a una calle por la que se rueda** ⇒ empuja cero. **Y
   por eso la mediana andada baja por debajo de la recta**, que no es una paradoja sino dos preguntas.
7. ⚠️ **La cola converge:** en el p99 y en el máximo las dos redes dan lo mismo. **Los portales peores
   están lejos de todo, no de la bici.**
8. ⭐ **El carril bici de la ruta de ejemplo pasa de 79 m a 306 m** al quitar el apaño de la tanda de
   arreglo 9. *Aquel hallazgo se cierra con una cifra.*
9. ⚠️ **Sigue sin duración** —falta la velocidad de `empuja`— **y sigue no dirigida** (47,0 %).

---

## §8 · LAS DOS BATERÍAS

```
   base    16:53:43 → 17:15:17   exit 0   114 líneas
```

*(la de cierre, con su `diff`, va en el checkpoint)*

⚠️ El instrumento vive en `tools/grafo/`, **fuera del runner** (`src/probar-paradas.js:217`), y **no
se ha tocado `src/`** ⇒ la batería no debería moverse ni una fila. Lo que sí toca `docs/` —este
documento y la bitácora— **sí lo lee `src/superados.js:272`**, por eso la base se lanzó con el árbol
quieto.

---

**Instrumento:** [`tools/grafo/enganche-bici.js`](../tools/grafo/enganche-bici.js) ·
**Citados:** [`tools/grafo/enganche-paradas.js`](../tools/grafo/enganche-paradas.js) ·
[`src/portales.js`](../src/portales.js) · [`src/ruta.js`](../src/ruta.js) · **Bitácora:** nº202.
