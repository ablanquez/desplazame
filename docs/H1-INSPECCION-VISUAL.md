# H1 · Mirar el grafo con los ojos

**Fecha:** 2026-08-03 · **Tanda 9** · Instrumento de inspección, no pantalla de la aplicación.

La tanda 8 dejó escrito lo que faltaba: *"nadie ha mirado el grafo sobre un mapa; todo es numérico y
verificado contra OSM, la fuente con la que se construyó"*. Eso es un guardián que comparte el sesgo
del vigilado.

⚠️ **Y el aviso que va delante de todo:** el mapa de fondo del visor **también es OpenStreetMap**. Si
el grafo arrastra un error heredado de OSM, **el fondo lo confirmará tan contento**. ⇒ **El fondo
sitúa; no verifica.** Lo que verifica es alguien reconociendo calles que ha andado.

```
node src/exportar.js       genera tools/grafo-visor.js y comprueba el cuadre
node src/probar-visor.js   ejecuta el visor contra un Leaflet simulado
tools/visor-grafo.html     doble clic
```

---

## 1 · ⛔ Antes de mirar: el visor no miente

**El instrumento se verifica antes de usarlo.** Tres comprobaciones, y una falló.

### A1 · La reproyección

El grafo se construye en metros (EPSG:25830) y se pinta en grados. **Un error ahí no revienta: mueve
la ciudad.** Ida y vuelta sobre los 5.146 nodos: **error máximo 0,080 mm**.

### A2 · El cuadre — y aquí falló

```
aristas                       exportado  7175   grafo  7175   ✅
nodos                         exportado  5142   grafo  5121   ⛔
unido-por-defecto             exportado     6   grafo     6   ✅
no conectados por evidencia   exportado    43   grafo    43   ✅
puntas 2-5 m sin soldar       exportado    51   grafo    51   ✅
componentes                   exportado    20   grafo    20   ✅
```

⚠️ **21 nodos de más, y el signo importaba.** Si fuera redondeo, habría *menos*. La causa: **D5
soldaba la identidad del nodo y no movía la geometría**, así que 20 nodos aparecían en dos sitios,
el peor a **1,90 m**. El grafo decía "unido" y el dibujo enseñaba dos líneas separadas.

**Ningún contador de la tanda 8 podía verlo** — todos preguntan por la topología y el fallo estaba
en la geometría. Arreglado (se mueve el extremo y se recalcula el largo), el cuadre pasa a
**5.121 = 5.121** y todo lo demás queda idéntico.

### C · El visor, ejecutado

⚠️ **No tengo navegador aquí**, así que no vale escribir *"abre y funciona"*. El script del HTML se
ejecuta en Node contra un **Leaflet simulado que no dibuja: cuenta**.

**Reventó a la primera** — un error de sintaxis (una expresión como clave de objeto sin corchetes)
que habría dado **página en blanco**. Arreglado. Con los datos reales:

```
polilíneas creadas        14.401   =  7.175 aristas × 2 capas  +  51 puntas    ✅
marcadores (D2)                6   =  los 6 unido-por-defecto                  ✅
circleMarker                 119   =  19 islitas + 6 + 43 + 51                 ✅

⭐ ARISTA FALSA PLANTADA:  14.401 -> 14.403 -> 14.401 al borrarla              ✅
```

**El visor no filtra en silencio.** Y la zona de apertura es idéntica a la de la tanda 8,
comprobado en ejecución.

⚠️ **Lo que esto NO demuestra:** que se vea bien. Descarta que falte algo y que reviente; **no
descarta un fallo de pintado** —capas tapándose, colores indistinguibles, tiles que no cargan—. Eso
solo lo ve un ojo delante del navegador.

---

## 2 · ⭐⭐ D2 · Las 19 componentes sueltas, una a una

La pregunta que justifica el visor: *¿alguna de esas islitas es un trozo de ciudad incomunicado?*

**La respuesta corta: no. Pero hay que contarla en dos partes, porque cinco de ellas no son lo que
parecen.**

### ⚠️ Cinco son artefactos del BORDE, no huecos del grafo

El recorte conserva el way entero si **algún** vértice cae dentro. Un way largo que entra por un
lado y sigue fuera tiene **los dos extremos fuera del bbox**, y no puede conectar con nada de
dentro.

| comp | nodos | largo | dist. al borde | qué es |
|---:|---:|---:|---:|---|
| **6** | 2 | **1.004 m** | **5 m** | `cycleway` — *Camino de las Torres* |
| 8 | 2 | 209 m | 1 m | `footway`/acera — *Camino de las Torres* |
| 1 | 2 | 204 m | 0 m | `residential`+`construction` — *M. Escoriaza y Fabro* / *Moncayo* |
| 3 | 2 | 177 m | 0 m | `footway`/acera — *Avenida José Atarés* |
| 7 | 2 | 89 m | 1 m | `residential` — *Pasaje de Coimbra* |

**La componente de 1.004 m —la que dispararía la costura— es el carril bici del Camino de las Torres
saliendo de la zona.** No es un hueco: es el filo del recuadro.

### Las 14 interiores — ninguna llega a los 135 m

| comp | nodos | largo | highway | nombre OSM | dist. borde |
|---:|---:|---:|---|---|---:|
| 13 | 5 | 134 m | `footway` | sin nombre | 654 m |
| 14 | 2 | 109 m | `footway` | sin nombre | 461 m |
| 19 | 2 | 107 m | `service` | sin nombre | 32 m |
| 12 | 2 | 26 m | `footway` | sin nombre | 618 m |
| 15 | 2 | 25 m | `footway` | sin nombre | 594 m |
| 10 | 2 | 20 m | `footway` | sin nombre | 417 m |
| 2 | 4 | 16 m | `steps`+`footway` | sin nombre | 42 m |
| 11 | 2 | 13 m | `path` | sin nombre | 214 m |
| 9 | 2 | 12 m | `footway` | sin nombre | 440 m |
| 4 | 2 | 11 m | `pedestrian` | sin nombre | 508 m |
| 5 | 3 | 10 m | `steps`+`footway` | sin nombre | 631 m |
| 16 | 2 | 8 m | `footway` | sin nombre | 559 m |
| 17 | 2 | 6 m | `steps`+`footway` | sin nombre | 262 m |
| 18 | 2 | 2 m | `steps` | sin nombre | 77 m |

**Ninguna tiene nombre y todas son peatonales o de servicio.** El patrón es claro: **tramos de acera,
pasarela o escalera cuyo extremo no llega a tocar nada en OSM** — geometría suelta de mapeado, no
barrios aislados.

⇒ **Ninguna componente es un trozo urbano incomunicado.** La costura no se dispara.

---

## 3 · D3 · Los 6 `unido-por-defecto` — los seis

Cruces donde **nada en el dato dice si una vía pasa por encima de la otra**, y se han unido.

| nº | dónde | A | B |
|---:|---|---|---|
| 1 | 41.65105, -0.87766 | way 677962428 · `construction` · **Calle del Coso** | way 1540745057 · `footway` |
| 2 | 41.65110, -0.87763 | way 1528239372 · `construction` · **Calle del Coso** | way 1540745057 · `footway` |
| 3 | 41.65012, -0.86980 | way 713940507 · `pedestrian` | way 717641811 · `footway` |
| 4 | 41.65011, -0.86976 | way 713940507 · `pedestrian` | way 717641811 · `footway` |
| 5 | 41.65081, -0.87697 | way 92692714 · `construction` · **Calle del Coso** | way 1540745056 · `footway` |
| 6 | 41.65086, -0.87694 | way 1528239372 · `construction` · **Calle del Coso** | way 1540745056 · `footway` |

⭐ **Dos lecturas que el contador solo no daba:**

1. **Los 6 están en 3 sitios**, no en 6 puntos repartidos por el casco. Cada sitio produce dos
   cruces porque hay dos ways por lado.
2. ⚠️ **Cuatro de los seis son la Calle del Coso en `highway=construction`.** El contador de D2 en
   esta zona **está dominado por unas obras**, no por ambigüedad estructural del viario. Cuando esas
   obras terminen y OSM se actualice, **el número bajará solo** — y eso significa que **6 no es una
   propiedad del casco: es una foto de agosto de 2026**.

---

## 4 · D4 · Los 43 no unidos por evidencia

```
layer-distinto  38      bridge  5
```

Ninguno tiene pinta de cruce de calle normal cortado por error. Los pares más repetidos son
`footway × footway` (5), `pedestrian × service` (5) y `footway × secondary` (4): pasarelas, rampas y
viales de servicio a distinta cota.

⭐ **Los cinco casos donde ambas vías tienen nombre son todos el mismo sitio, y es tranquilizador:**

```
Puente de Piedra                    ×  Andador de Mario Gaviria   (living_street × footway)
Puente de Nuestra Señora del Pilar  ×  Andador de Mario Gaviria   (secondary × footway)   ×3
Puente de Nuestra Señora del Pilar  ×  Andador de Mario Gaviria   (cycleway × footway) [bridge]
```

**El andador va por la ribera del Ebro y los puentes pasan por encima.** D1 los separa correctamente
— y es exactamente el caso que la regla existe para acertar.

---

## 5 · Las 51 puntas de 2 a 5 m sin soldar

```
2-3 m: 23      3-4 m: 15      4-5 m: 13        la mayor: 4,94 m
```

Distribución bastante plana: **no hay un pico justo por encima de 2,0 m** que delatara que la
tolerancia se queda corta por poco. Si la tolerancia subiera a 5 m se soldarían 51 pares más, y
**no hay forma de saber desde el dato cuántos de ésos son continuaciones reales de una calle y
cuántos son dos cosas distintas que casualmente casi se tocan.** Por eso se cuentan y no se tocan.

---

## 6 · ⭐⭐ Lo que yo NO puedo juzgar — la lista para Antonio

No *"échale un vistazo"*. Cosas concretas, en orden de lo que más cambia si está mal:

1. **Capa 3 · los tres sitios de `unido-por-defecto`.** ¿Se cruza a nivel en los tres?
   - `41.65105, -0.87766` y `41.65081, -0.87697` — **Calle del Coso** (en obras en OSM) contra una
     acera. ¿Hay ahí una pasarela, un paso elevado o un vado? ¿O es un cruce a pie normal?
   - `41.65012, -0.86980` — dos vías peatonales sin nombre cruzándose. ¿Es un cruce real?
2. **Capa 4 · el Andador de Mario Gaviria bajo los puentes.** El grafo dice que **no** se puede pasar
   del andador al Puente de Piedra en ese punto. ¿Es cierto, o hay una escalera o rampa que sube al
   puente y que OSM no tiene?
3. **Capa 2 · las 14 islitas interiores.** ¿Alguna es un sitio por el que se pasa andando?
   Las de mirar primero, por tamaño: `41.65544,-0.87750` (134 m), `41.65736,-0.88069` (109 m),
   `41.64971,-0.89408` (107 m, `service`).
4. **Capa 5 · las puntas de 4 a 5 m.** ¿`41.65121,-0.88324` (4,94 m) es una calle que continúa?
   Si lo es, D5 se queda corta y hay que decidirlo con casos, no con un número.
5. ⭐ **Capa 1, lo más importante y lo más aburrido: las zonas ROJAS** (`eje-de-calzada`, 22,6 % de
   las aristas). Ahí el motor te llevará por el eje de la calle sin saber por dónde se cruza.
   **¿Coincide con las calles donde tú, andando, no tendrías dudas?** Si el rojo cae en sitios
   evidentes, D4 está midiendo bien; si cae donde hay aceras clarísimas, OSM tiene un hueco de
   mapeado que el grafo hereda.
6. **Y la pregunta general:** ¿hay alguna calle **dibujada donde no hay calle**, o alguna que
   **falte** y que tú sepas que existe? Eso es lo único que ni el grafo ni el fondo de OSM pueden
   contestar, porque los dos vienen del mismo sitio.

---

## 7 · Qué NO se puede ver en este visor, aunque esté mal

- **Si el grafo se equivoca igual que OSM.** El fondo es la misma fuente: un error heredado se
  confirma solo.
- **El sentido de circulación.** No se pinta, y hoy el motor no lo usa (a pie da igual, en H2 no).
- **Los niveles.** Un puente y la calle de debajo se dibujan **uno encima del otro**, indistinguibles
  en planta. Sé que están separados porque D1 lo dice, **no porque se vea**.
- **Que una arista tenga la longitud correcta.** Se ve el trazado, no el número.
- **Los 86 nodos aislados** (sin ninguna arista transitable a pie): no se pintan, porque se pintan
  aristas.
- **Si el enganche origen/destino es razonable.** El visor no calcula rutas — a propósito.

---

## 8 · ⚠️ Qué he buscado a propósito y NO he encontrado

Porque un resultado bueno despierta menos sospecha que uno malo, y ése es el sesgo que mordió ayer:

- **Componentes urbanas aisladas**: buscadas listando las 19 una a una. **No hay.** La mayor
  interior son 134 m de acera sin nombre.
- **Cruces cortados por error**: buscados entre los 43 no unidos filtrando los que tienen nombre en
  las dos vías. **Los 5 que aparecen son puentes sobre el Ebro**, que es donde la regla debe cortar.
- **Un pico de puntas justo por encima de 2,0 m**, que delataría una tolerancia mal elegida.
  **No lo hay**: 23 / 15 / 13 por tramo de metro.
- **Aristas que el visor se tragara**: buscadas contando lo que pinta contra lo que hay.
  **Cuadra al uno.**
- ⛔ **Lo que sí encontré, y no lo buscaba**: los 20 nodos con geometría desplazada (§1) y el error
  de sintaxis del visor (§1). **Los dos aparecieron por comprobaciones obligatorias del método, no
  por sospecha propia.**
