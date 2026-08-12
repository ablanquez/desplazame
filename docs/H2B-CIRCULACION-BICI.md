# H2b · Tanda 2 — POR DÓNDE PUEDE CIRCULAR UNA BICI

*2026-08-12 · base `34e7138` · **la tanda que yo mismo marqué como «la que puede fallar en verde».***

> ⛔⛔ **NO SE HA TOCADO NI UNA LÍNEA DE `src/`.** El predicado vive en
> `tools/grafo/circulacion-bici.js`, se calcula fuera del grafo uniendo por `e.way`, y **el grafo no
> se ha hecho dirigido, no ha ganado ningún campo y no se ha movido.**

> **Este documento se AÑADE. No reescribe ninguno anterior.**

```
   node tools/grafo/circulacion-bici.js      # todo lo de aquí
```

---

## §0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| ⛔⛔ **El fallo que predije, MEDIDO** | Un predicado hecho solo de carril bici deja pasar el **4,7 %** del grafo (y con `ciclista` del municipal, el **3,5 %**). **Era exactamente eso** |
| ⭐⭐⭐ **El predicado bueno: `circula`, y deja pasar el 50,6 %** | **49.972 aristas · 4.870,8 km.** Y con la calzada dentro la red queda en **178 trozos con el 94,3 % de los km en el mayor** ⇒ **la bici PUEDE rutear en Zaragoza** |
| ⭐⭐ **Tres valores, no dos** | `circula` · `empuja` · `prohibido`. **`empuja` no es un adorno**: es el nivel que las tres referencias modelan —ORS escribe `setHighwaySpeed("footway", 6)`— **y que nuestra constante única no puede representar** |
| ⛔⛔ **Y la ruta de ejemplo dice lo incómodo** | Delicias → Utrillas en bici: **4.788,9 m, y solo 79 m (1,6 %) por carril bici.** El **51,5 % va por `primary`** ⇒ **mandar la bici por avenidas es la consecuencia, y es decisión de producto** |
| ⛔⛔ **HALLAZGO NO BUSCADO: la bici no puede salir de un portal** | Un edificio engancha a una acera y **por una acera no se rueda**. Con el enganche de andar la ruta **no existe**; con enganche propio, sí. **La bici necesita su propio enganche** |
| ⛔ **PARA Y AVISO sobre H1 — y no es un campo** | `e.highway` YA está en la arista ⇒ el predicado de clase **no necesita campo nuevo**. Lo que sí bloquea es **`src/grafo.js:18`: `adyacencia(nodos, aristas, soloAPie = true, …)`** — el modo es un **booleano con el nombre de un modo** |
| ⚠️ **`oneway`: 23.499 aristas de las que circulan (47,0 %)** | Y el contrasentido ciclista **`NO CONSTA`**: solo **12** de ellas lo declaran |

---

## §1 · T1 · EL PREDICADO

### 1.1 · El nombre, con la ley 157 pasada

> *«Una etiqueta no miente en su definición: miente en su lectura — y nadie lee las definiciones.»*

| nombre | ¿pasa? |
|---|---|
| `ciclable` | ⛔ **NO.** Se lee *«apto para ir en bici»*, que incluye **seguro** y **legal**. De lo único que hay dato es de la clase de vía |
| `transitableEnBici` | ⛔ **NO.** *«Transitable»* afirma que se puede pasar; en una `primary` con tráfico denso eso es una opinión |
| `permitido` | ⛔ **NO.** Afirma permiso legal, y **OSM no lo declara**: solo **2.502 de 98.774** aristas traen `bicycle=*` |
| ⭐ **`circula`** | ✅ **PASA.** Dice que **esta clase de vía es de las que se recorren rodando**. No dice ni que sea segura, ni legal, ni agradable |

### 1.2 · ⭐⭐ Tres valores, y los dos primeros NO son lo mismo

```
   veredicto       aristas  % grafo         km    % km   qué significa
   circula           49972   50.6 %  4870.8 km  74.9 %   se RUEDA
   empuja            44882   45.4 %  1067.0 km  16.4 %   ⚠️ se pasa BAJÁNDOSE
   prohibido          3920    4.0 %   562.3 km   8.7 %   ⛔ el dato lo prohíbe, o la clase no admite bici
```

⭐ **`empuja` no me lo he inventado**: es el nivel que modelan las tres referencias que la tanda 0
citó. Sus literales, tal cual (⛔ la cita es el literal, no mi paráfrasis):

```java
   openrouteservice · CommonBikeFlagEncoder.java
      setHighwaySpeed("footway", 6);                          // frente a 18 en calzada
      setHighwaySpeed(KEY_STEPS, PUSHING_SECTION_SPEED / 2);   // PUSHING_SECTION_SPEED = 4
```

y OSRM **ni siquiera mete `footway` en su tabla `bicycle_speeds`**. ⛔ **Y nuestra constante única de
18 km/h no puede representar esa diferencia**, así que esta tanda lo declara y lo deja fuera de
`circula`.

### 1.3 · ⭐⭐⭐ Cuánto grafo deja pasar cada variante — el fallo predicho, medido

```
   variante                                      aristas  % grafo         km   trozos  el mayor
   ⛔ A · solo `cycleway` — EL FALLO PREDICHO        4675    4.7 %   191.5 km       56    70.1 %
   B · cycleway + campo (track, path)              15244   15.4 %  2947.1 km      575    56.4 %
   ⭐ C · B + CALZADA  ⇐ el predicado `circula`     50259   50.9 %  4896.8 km      178    94.3 %
   D · C + peatonal (empujando)                    94682   95.9 %  5968.7 km      247    95.3 %
```

⛔⛔ **La variante A es literalmente lo que `docs/DISENO-H2B-MODOS.md` §5.1 predijo** — *«produce
rutas por el 3,5 % del grafo sin quejarse»*—. Medida por `highway=cycleway` son **4,7 %**; medida por
las 3.472 aristas con `ciclista` del municipal (tanda 1), **3,5 %**. **Las dos formas de escribir el
error dan el mismo desastre.**

⚠️ **Y fíjate en la columna «trozos» de la D:** meter las aceras **sube** las componentes de 178 a
247. *Añadir aristas puede fragmentar más, porque lo que se añade son trozos de acera sueltos.*

### 1.4 · ⭐⭐ Cuánto DEBERÍA dejar pasar — el álgebra escrita antes, y se puso roja

```
   aristas del grafo                                            98774
   − clases peatonales puras (acera, zona peatonal, escaleras)  −45233
   − clases que no admiten ni peatón ni bici (autovía, obras…)   −3282
   ⇒ aristas de clase «se rueda»                                 50259   (50.9 %)
   lo que sale contando clases                                   50259   ✅ cuadra exacto
   − las que el DATO prohíbe (bicycle=no · access=no)              −287
   ⇒ veredicto «circula»                                         49972   (50.6 %)
```

⛔ **La primera versión de este álgebra se puso roja, con razón.** Restaba las **4.204 `!e.pie`** como
*«las que no admiten ni peatón ni bici»*, y eso es falso: `e.pie` se apaga también con `foot=no` sobre
clases que la bici sí usa —**184 `cycleway`, 94 `residential`, 47 `footway`**—. **Mezclaba una lista
de CLASES con un filtro del DATO** y no cuadraba por 635. ⭐ **El número no estaba mal: estaba mal el
argumento**, y lo cazó su propio `A.exige` en la primera ejecución. *Por eso el álgebra se escribe
antes (ley 51).*

⚠️ **Y no va a la bitácora**, con su criterio: **falló a la cara** (ley 14). No hubo verde falso.

### 1.5 · ⭐⭐ El positivo de control — acepta Y rechaza, en la misma ejecución (ley 152)

```
   lo que TIENE que pasar                    aristas  veredicto
   highway=cycleway                             4675  4671 circula   ✅
   highway=residential                         14861  14859 circula   ✅
   highway=primary                              2343  2310 circula   ✅
   highway=track                                7488  7474 circula   ✅

   lo que TIENE que rechazar                 aristas  veredicto
   highway=steps ⇒ empuja                        810  810 bien   ✅
   highway=motorway ⇒ prohibido                  526  526 bien   ✅
   highway=trunk ⇒ prohibido                    1000  1000 bien   ✅
   highway=motorway_link ⇒ prohibido             584  584 bien   ✅
   highway=construction ⇒ prohibido              693  693 bien   ✅
   highway=footway ⇒ empuja                    41256  41256 bien   ✅

   aristas con `bicycle=no` en el dato            362   ⇒ 362 «prohibido»   ✅ todas
   ⭐ provocado: se le pone `bicycle=no` a una que circula ⇒ ✅ cambia a prohibido
```

⭐ **Y el control de la unión, que es de lo que cuelga todo:** las **0** aristas cuyo `way` no está en
el crudo, **con su provocación** —se borra un way del índice y lo caza—. *Si la unión fallara en
silencio, cada arista sin tags saldría «prohibido» y el predicado se hundiría sin decir por qué.*

---

## §2 · T4 · LA RUTA DE EJEMPLO — y lo que enseña no son sus metros

⛔ Los dos extremos **no los elijo a ojo**: son dos de los cuatro POI que el proyecto ya tiene
declarados en `src/rutas-antonio.js:45`, y son los dos más separados (ley 17).

```
   a pie   · enganche a pie          4743.4 m · 227 aristas
   ⭐ en bici · enganche de bici      4788.9 m · 155 aristas

   ⭐⭐⭐ EL REPARTO — esto es lo que hay que mirar
   highway               metros       %   veredicto
   primary                 2516  51.5 %   circula
   residential             1193  24.4 %   circula
   secondary                546  11.2 %   circula
   service                  404   8.3 %   circula
   tertiary                 112   2.3 %   circula
   cycleway                  79   1.6 %   circula
   primary_link              34   0.7 %   circula
```

⛔⛔ **79 metros de carril bici en una ruta de 4,8 km. El 1,6 %.** Y el **51,5 % por `primary`** —
avenidas principales. ⇒ **Ésta es la consecuencia de los 666 trozos de la tanda 1, con un caso
delante:** *no es un defecto del predicado, es cómo está la ciudad*, y **mandar la bici por avenidas
es una decisión de producto que hay que tomar a sabiendas.**

⚠️ **LEY 177 SOBRE ESTA RUTA:** pasa por **7 clases de vía distintas**, y openrouteservice les daría
velocidades distintas. **Con una sola constante de 18 km/h el tiempo de esta ruta ya es optimista.**
*Adoptar una sola cifra es adoptar la mitad del modelo* — se declara, no se arregla aquí.

---

## §3 · ⛔⛔ EL HALLAZGO NO BUSCADO: la bici no puede salir de un portal

```
   POI                   enganche A PIE                enganche EN BICI
   Estación Delicias     corridor a 31,1 m [empuja]    service a 99,1 m
   C.C. Utrillas         footway a 28,7 m [empuja]     tertiary a 65,6 m

   ⛔ en bici con el enganche DE ANDAR ⇒ SIN CAMINO
   ⭐ en bici con enganche de bici     ⇒ 4.788,9 m
```

**Un edificio da a la acera, y por una acera no se rueda.** El punto de inserción queda aislado y la
ruta no existe — **con el grafo perfectamente sano**: su mayor componente tiene el 94,3 % de los km.

⇒ ⭐⭐ **La bici necesita SU PROPIO ENGANCHE, y el hueco casi se triplica** (28,7 → 65,6 m · 31,1 →
99,1 m). **Ese tramo se hace empujando**, y es exactamente la misma pregunta que H2b·3 va a tener que
hacerse con las 276 estaciones BiZi.

⛔ **Y queda como invariante con su provocación al revés:** si algún día SÍ hay ruta con el enganche
de andar, el `A.exige` salta — porque entonces este texto habría caducado.

⚠️ **Bitácora nº199:** el `A.exige` que cazó esto **acusó a quien no era** —*«el predicado deja el
grafo roto»*—, y la medición que lo desmentía estaba impresa veinte líneas más arriba, en la misma
ejecución.

---

## §4 · T3 · `oneway` — se MIDE, ⛔ no se resuelve

```
   aristas que «circulan»                    49972
   ⛔ …de ellas con `oneway=yes`              23499   (47,0 %)   1008,5 km
      por clase: residential 10521 · service 4279 · tertiary 2308 · secondary 2155
                 primary 1754 · cycleway 1257 · living_street 737 · unclassified 230
```

⛔⛔ **Qué pasa hoy si se ignora:** el grafo es **no dirigido** —`src/grafo.js:18`, `adyacencia()`
empuja en `ady[e.a]` **y** en `ady[e.b]`— así que **una ruta en bici puede meterse a contramano por
cualquiera de esas 23.499 aristas y el motor no se entera. Es el 47,0 % de su propia red.**

**¿Puede una bici ir en contra de un `oneway`?** Se contesta con el dato, no con lo que yo sepa de
tráfico:

```
   aristas con `oneway:bicycle=no` en todo el grafo      31
   …de las 23.499 que circulan con oneway                12
```

⇒ ⛔ **`NO CONSTA` para las otras 23.487.** El contrasentido ciclista existe en España pero **depende
de señalización municipal, y OSM no lo declara aquí**. **Es dato, no deducción:** no se supone ni que
sí ni que no.

⚠️ Y lo que hay en su lugar son etiquetas que describen **si hay carril**, no el sentido:
`cycleway:right` 1.012 · `cycleway:left` 520 · `cycleway:both` 374 · `cycleway=opposite` **3**.

---

## §5 · ⛔⛔ T2 · QUÉ TOCA H1 — **PARA Y AVISO**, y no es lo que parecía

### 5.1 · La buena noticia: el predicado de clase NO necesita campo nuevo

```
   ¿está `highway` en la arista?                        SÍ — `e.highway`
   ¿están `bicycle` / `access` / `oneway` en la arista?  NO. Solo en los tags del crudo
```

⭐ **`e.highway` ya viaja en cada arista**, así que un predicado hecho solo de clase **no toca nada**.

**El precio de no reabrir H1, en un número:**

```
   aristas que el dato prohíbe y la clase dejaría pasar   287
   sobre las que «circulan»                              0,6 %
```

⇒ **Un predicado solo de clase se equivoca en 287 aristas de 49.972.** *Ése es el coste exacto de no
abrir H1*, y con él delante la decisión es de Antonio y no una corazonada.

### 5.2 · ⛔⛔ Lo que SÍ obliga a tocar `src/`, y es más grande que un campo

```
   src/grafo.js:18   function adyacencia(nodos, aristas, soloAPie = true, sinCondicionales = false)
```

> **El modo no es un predicado: es un booleano con el nombre de un modo.**

Para que el motor rutee en bici hay que darle a esa función **una forma de preguntar «¿pasa este
modo?»**, y eso es **cambiar su firma** — la usa `src/ruta.js:117` para construir el grafo entero.
⇒ **PARA Y AVISO. Es reabrir H1 y lo decide Antonio**, con la condición de la última vez: *las diez
rutas de cordura no se mueven ni un decimal.*

⭐⭐ **Y hay una noticia buena escondida aquí: el proyecto ya está a medio camino.**

```
   src/portales.js:250   function indexarAristas(aristas, filtro, celda = 100)      ⇐ ACEPTA PREDICADO
   src/direccion.js:156  Po.indexarAristas(g.aristas, (e) => e.pie)                 ⇐ y se le pasa uno
```

**El índice espacial ya acepta un filtro; la adyacencia no.** ⇒ *La forma correcta ya existe en el
proyecto, en el fichero de al lado.* **No hay que inventar el diseño: hay que igualar las dos firmas.**

### 5.3 · ⚠️ Y el coste de la alternativa, para que se pueda comparar

Mantener la unión por `e.way` en ejecución cuesta **un índice de 48.211 entradas** en memoria **y
obliga a llevar el crudo de OSM al lado del grafo**, que hoy no hace falta para andar.

---

## §6 · ⚠️ LO QUE NO SE HA COMPROBADO

- **Que ninguna de las 49.972 sea peligrosa.** El predicado dice *«se rueda»*, no *«se puede rodar
  sin miedo»*. **El 51,5 % de la ruta de ejemplo va por `primary` y nadie la ha mirado.**
- **Que `track` y `path` se puedan rodar de verdad.** Son **7.488 + 3.081 aristas y 2.755 km** —el
  42 % de los km que circulan— y son pistas y caminos rurales. **OSM no dice su firme en el 32,4 %.**
- **Nada sobre el sentido.** Se mide y no se aplica: la ruta de ejemplo **puede llevar contramanos
  dentro** y no se ha mirado cuáles.
- **Nada sobre el enganche de las 276 estaciones BiZi.** El hallazgo del §3 dice que hay que
  medirlo; **no se ha medido aquí** (es H2b·3).
- **Ningún tiempo.** Esta tanda no aplica los 18 km/h a nada.
- **La ruta de ejemplo es UNA.** Dos POI de cuatro. *No es una muestra: es un caso.*

---

## §7 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⛔⛔ **El fallo predicho existe y está medido:** solo carril bici deja pasar el **4,7 %** del
   grafo (**3,5 %** con `ciclista`). **La predicción de `docs/DISENO-H2B-MODOS.md` §5.1 se cumple.**
2. ⭐⭐⭐ **El predicado `circula` deja pasar el 50,6 % (49.972 aristas · 4.870,8 km) y la red queda
   en 178 trozos con el 94,3 % de los km en el mayor** ⇒ **la bici puede rutear en Zaragoza.**
3. ⭐⭐ **Tres valores y no dos: `circula` · `empuja` · `prohibido`.** `empuja` es el nivel que
   modelan las tres referencias y **que la constante única de 18 km/h no puede representar.**
4. ⛔⛔ **Una ruta en bici de 4,8 km lleva 79 m de carril bici (1,6 %) y el 51,5 % por `primary`.**
   **Mandar la bici por avenidas es la consecuencia medida, y es decisión de producto.**
5. ⛔⛔ **La bici no puede salir de un portal**: un edificio engancha a una acera y por ahí no se
   rueda. **Necesita su propio enganche y el hueco casi se triplica.** Mismo problema que espera a
   las estaciones BiZi.
6. ⛔ **PARA Y AVISO: lo que bloquea H1 no es un campo, es una firma.** `adyacencia(nodos, aristas,
   soloAPie = true, …)`. ⭐ **Y `indexarAristas(aristas, filtro)` ya acepta predicado: la forma
   correcta existe en el fichero de al lado.**
7. ⭐ **El coste de no reabrir H1 es exactamente 287 aristas de 49.972 (0,6 %).**
8. ⚠️ **`oneway` afecta al 47,0 % de la red ciclable (23.499 aristas), y el contrasentido ciclista
   `NO CONSTA`: solo 12 lo declaran.**
9. ⭐⭐ **Ley nueva (bitácora nº199):** *el mensaje de un guardián es una afirmación sobre la causa y
   se escribe antes de ver el fallo* ⇒ **debería decir QUÉ se ha roto, no POR QUÉ.** Y su corolario:
   **un rojo se audita menos que un verde porque parece que ya ha hecho su trabajo.**
10. ⚠️ **Añadir aristas puede fragmentar más:** meter las aceras sube las componentes de 178 a 247.
11. ⛔ **`src/superados.js` no distingue una cifra propia superada de la misma cifra citada de un
    tercero.** Puso la batería en rojo por dos líneas que citaban el `6` de openrouteservice (§8).
    **Va a volver a saltar**, y la solución durable —una regex de exclusión, como la que algún par de
    su lista ya tiene— **edita un recuento declarado dentro de `src/`: es de Antonio.**

---

## §8 · ⛔ LA PRIMERA BATERÍA DE CIERRE SALIÓ EN ROJO — y la causa, exacta

```
   base    13:26:40 → 13:47:07   exit 0   114 líneas
   cierre  13:57:09 → 14:21:08   exit 1   ⛔ 114 líneas, DOS distintas:

   82c82
   <    superados.js   código 0   0 de 0  sin fallo  ✅
   >    superados.js   código 1   2 de 0  declara    ⛔ DECLARA 2 Y SE ESPERABAN 0
   114c114
   <    ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.
   >    ⇒ ⛔ HAY UN CAMINO POR EL QUE UN FALLO SIGUE SALIENDO EN 0.
```

**Lo rompió ESTE documento.** `src/superados.js` vigila un puñado de cifras que el proyecto ya
retiró, y una de ellas es **la velocidad de andar que la tanda de arreglo 4 sustituyó por 5,0 km/h**.
Dos líneas de §1.2 la escribían tal cual… **para decir otra cosa: la velocidad de EMPUJAR que
openrouteservice le da a una acera.** Dos hechos distintos con la misma cadena de caracteres.

**Arreglo: se cita el literal de la fuente en vez de parafrasearlo** —`setHighwaySpeed("footway", 6)`
en vez de la frase con las unidades detrás—, que **es más fiel** (ley 145: se describe exactamente) y
de paso deja de coincidir con la cadena vigilada.

### 8.1 · ⛔⛔ Y LA SEGUNDA VEZ FUE PEOR: la escribí explicando la primera

La primera versión de este mismo §8 **citaba el informe del guardián palabra por palabra**, y con eso
metió la cadena **cuatro veces más**. La batería de cierre volvió a salir en rojo, y el contador del
guardián pasó de `11 de 9` a `14 de 9`.

⇒ ⭐⭐⭐ **HAY GUARDIANES CUYO UNIVERSO INCLUYE LOS DOCUMENTOS QUE LOS DESCRIBEN, Y CON ÉSOS
DOCUMENTAR ES MODIFICAR LO VIGILADO.** No se puede contar lo que cazaron **citándolo**: hay que
contarlo **describiéndolo**. Por eso este §8 no escribe la cifra ni una sola vez, y por eso lo dice.

⭐ **Y el proyecto ya tenía el sitio previsto y yo estaba escribiendo en el otro:**
`src/superados.js:263` —`esActa()`— exime a `docs/BITACORA.md` precisamente porque *«el valor viejo
TIENE que aparecer; marcarlo sería marcar el acta»*. ⇒ **La evidencia verbatim de las dos ejecuciones
vive en la bitácora nº200**, que es donde puede vivir.

⚠️ **Y el fallo de método, que es mío y no del guardián:** ejecuté `superados.js`, salió `exit=0`, lo
publiqué como prueba de que estaba arreglado **y después escribí el §8**. *Comprobar y luego cambiar
es no haber comprobado* (bitácora nº200).

### 8.2 · ⛔⛔ Y HUBO UNA TERCERA, que convierte el accidente en una propiedad

El §8.1 que acabas de leer **tampoco salió a la primera**. Su primera versión explicaba la solución
durable **nombrando otro par de la lista del guardián y citando su regex de exclusión** — y con eso
volvió a saltar, esta vez por **otra** cifra retirada distinta.

⇒ ⭐⭐⭐ **`src/superados.js` está hecho exactamente de las cadenas que prohíbe.** Nombrar un par,
citar una exclusión o pegar su informe **es republicar lo que vigila.** ⛔ **No se le puede describir
dentro de `docs/`**, que es donde este proyecto documenta todo. *Tres intentos, tres rojos, y el
tercero ya no es un descuido: es una propiedad del guardián.*

### 8.3 · ⛔ Lo que el guardián no puede saber, y hay que decidir

**Tiene razón en su mecanismo y no puede tenerla en su lectura:** no distingue *una cifra propia
superada* de *la misma cifra citada de un tercero*, y **va a volver a saltar** con el próximo
documento que cite a openrouteservice. ⇒ **La solución durable es enseñarle la distinción** —el
mecanismo ya existe: algún par de su lista lleva una regex que excluye las líneas que llevan la cifra
sin ser ese dato— **pero eso es editar un recuento declarado dentro de `src/`, y lo decide Antonio.**
Va a §7·11.

⭐ **Y una cosa que esto sí demuestra:** sin la disciplina de batería-antes-y-después, este
repositorio se habría quedado con un guardián en rojo **dos veces**, y el checkpoint diría *«todo
verde»* las dos.

⚠️ El instrumento vive en **`tools/grafo/`**, que **no está en el universo del runner**
(`src/probar-paradas.js:217` solo ejecuta los `.js` de `src/`) ⇒ **la batería no debería moverse ni
una fila.** Lo que sí toca `docs/` —este documento y la bitácora— **sí lo lee `src/superados.js:272`**,
por eso la línea base se lanzó con el árbol quieto.

---

**Instrumento:** [`tools/grafo/circulacion-bici.js`](../tools/grafo/circulacion-bici.js) ·
**Citados:** [`src/grafo.js`](../src/grafo.js) · [`src/portales.js`](../src/portales.js) ·
[`src/planarizar.js`](../src/planarizar.js) · **Bitácora:** nº199.
