# H2a · LA RED DE BUS, Y EL VEREDICTO POR ENLACE

**Fecha: 10/08/2026** · H2a · tanda 6 · `004_DESPLÁZAME`
**Qué es:** el registro de tres medidas y una definición. ⛔ **La red está construida; los 2.538
enlaces NO se han calculado — eso es H2·7.**

---

## §0 · SI SOLO SE LEE UNA COSA

⛔⛔⛔ **LA TESIS DEL HITO NO SE SOSTIENE ENTERA, Y AQUÍ ESTÁ EL NÚMERO.**

```
   veredicto de los enlaces, sobre una muestra de 324 pares candidatos
      ACERA           67     20,7 %      el enlace se anda por donde el mapa distingue los dos lados
      EJE            254     78,4 %      ⛔ alguna punta o algún tramo va por el eje de la calzada
      MISMA ARISTA     3      0,9 %      el grafo no distingue las dos paradas
      SIN CAMINO       0      0,0 %      (existe: se provocó a propósito)
```

⇒ **Cuatro de cada cinco enlaces pasan por sitios donde el grafo NO SABE que hay dos lados de
calle.** La tesis *«los routers usan un radio y por eso te mandan a cruzar una autovía; nosotros lo
calculamos andando»* **es cierta en el 20,7 %**. En el resto, el cálculo andando produce el mismo
error que el radio — **solo que firmado con metros y con pinta de exacto**.

⭐⭐⭐ **Y un hallazgo que no se buscaba: una parada contra sí misma mide 15,70 m.** Ver §3.4. No es
un redondeo: es que `rutaEntre` no sabe ir de un punto insertado a otro si comparten arista.
**Infla hasta 26,4× en los enlaces más cortos**, que son justo los del transbordo.

---

## §1 · T1 · LA RED DE BUS

### 1.1 · Las ocho que caen, contadas contra `trips.txt`

```
   node tools/gtfs/red-bus.js

   rutas en routes.txt ............... 53
   de ellas, de BUS (route_type 704) . 52
   ⛔ sin ni un viaje ................  8      102 CEM · 103 CE  · 104 LAN · 131 EM1
                                              132 EM2 · 201 V1  · 203 ES3 · 204 V4
   ⇒ RUTAS QUE ENTRAN ...............  44
```

⭐ **El filtro es una regla, no una lista** (ley 40): *«esta ruta tiene ≥1 viaje en el feed»*. La
lista de ocho **no decide nada** — solo sirve para que un cambio se note: el script **contrasta** lo
que sale contra lo que midió H2·3 y **sale en rojo si difiere**. Hoy: `✅ las mismas ocho`.

⚠️ **Qué resultado lo haría fallar** (ley 147): que una zombi reviva, que aparezca una nueva, o que
el publicador renombre alguna. Cualquiera de las tres para la tanda.

### 1.2 · Los sentidos

```
   sentidos ......................... 74        viajes que los sostienen ... 29.320
   paradas usadas por la red de bus . 934       de ellas con poste ......... 934
```

⭐ **El viaje canónico NO es el más largo.** 003 se quedaba con el de más paradas y por eso **no
podía ver un terminal variable: lo colapsaba**. Aquí la secuencia de un sentido es la del viaje más
largo **entre los que acaban en el terminal mayoritario**, así no se cuela ni la variante corta ni
la de otro destino.

### 1.3 · ⚠️ Los dos sentidos condicionales, marcados

```
   línea 23 s0   644 viajes    mayoritario 68,0 %  Av. José Atarés / Noria Siria
                               segundo     32,0 %  Clara Campoamor      ⇒ HORA
   línea 44 s0   303 viajes    mayoritario 61,4 %  Pablo Ruiz Picasso N.º 35
                               segundo     38,6 %  Campus Río Ebro      ⇒ DÍA
```

⭐ **Y no van declarados a mano y ya está: el script EXIGE que la cuota siga en banda.** Si el feed
cambia y la cuota se mueve, sale en rojo diciendo cuánto. Una lista escrita a mano que nadie
contrasta es una lista que envejece en silencio.

⭐ **La distribución que los aísla, sobre los 74 sentidos:**

```
   cuota del SEGUNDO terminal, los 6 mayores:  38,6 % · 32,0 % · 6,6 % · 6,5 % · 6,5 % · 6,0 %
   sentidos con UN SOLO terminal .......... 53 de 74
   con el segundo por encima del 10 % ......  2 de 74
```

⇒ **Entre el 2.º y el 3.º hay un salto de 4,8×.** Los dos condicionales no son el extremo de una
distribución continua: **están separados del resto por un hueco.**

⛔ **El `determinante` es una ETIQUETA, no una condición.** H2a no mira el reloj. Los otros 72
sentidos llevan `NO CONSTA`, que aquí significa *«no se ha medido un determinante»*, **no** *«no lo
tiene»*.

### 1.4 · ⭐ El artefacto, medido — es lo que decidirá el stack

```
   paradas 934 · líneas 44 · sentidos 74
   JSON compacto .................... 200,5 KB
   de eso, las secuencias de parada .. 16,3 KB
   comprimido (gzip) ................. 41,9 KB
   ⚠️ contra el crudo: stop_times.txt son 47.049.063 B  ⇒  reducción 229×
```

⭐ **Y lleva dentro el bloque `feed` con sus cuatro campos, EXIGIDO por `A.exige`.** Si el
artefacto se come `feed_info`, **004 incumple la licencia del NAP Y pierde la caducidad. Un fallo,
dos consecuencias** — y ahora se pone rojo.

---

## §2 · T2 · EL VEREDICTO POR ENLACE

### 2.1 · La definición, y por qué son CUATRO valores y no dos

| veredicto | cuándo | qué significa |
|---|---|---|
| **ACERA** | las dos puntas en `acera`/`peatonal`/`paso` **y** ni una arista del camino es eje | el enlace se anda por donde el mapa **sí** distingue los dos lados |
| **EJE** | alguna punta **o** algún tramo va por eje de calzada | ⛔ el enlace **puede** estar cruzando y no hay forma de saberlo |
| **SIN CAMINO** | las dos paradas en componentes distintas | ⭐ es un **resultado**, no un fallo: hay barrios incomunicados de verdad |
| ⭐ **MISMA ARISTA** | las dos paradas enganchan a la **misma** arista | el grafo no las distingue **y el metraje es falso** (§3.4) |

⚠️ **El cuarto valor nació mal y hay que decirlo.** Se definió como *«MISMO PUNTO: camino < 1 m»*,
siguiendo el caso límite que levantó H2·5. **Esa condición no puede ocurrir nunca** — §3.4 explica
por qué—, o sea que era **un valor inalcanzable, una promesa**. Se cambió por el que sí es
detectable y sí es el caso real.

### 2.2 · ⭐⭐ El reparto que ESPERABA, escrito antes de medir

Sellado en el cuaderno de trabajo a las **18:39:36**, antes de ejecutar nada del veredicto:

```
   P1 · si las dos puntas fueran independientes: 0,537² = 28,8 % con las dos en NO-EJE
   P2 · con correlación espacial, espero MÁS: entre 35 % y 45 %
   P3 · el camino añade EJE ⇒ veredicto ACERA entre 20 % y 32 %
   P4 · reparto BIMODAL: el centro dará caminos 100 % acera y la periferia 100 % eje
   P5 · enlaces de 0 m: espero encontrar entre 1 y 40
```

### 2.3 · Lo medido, y **dos de las cinco fallaron**

| | predicho | medido | |
|---|---|---|---|
| **P2** puntas NO-EJE | 35–45 % | **45,7 %** (148 de 324) | ⚠️ **fuera por 0,7 puntos**: subestimé la correlación |
| **P3** veredicto ACERA | 20–32 % | **20,7 %** | ✅ dentro, en el borde bajo |
| **P4** reparto bimodal | sí | ⛔ **NO: mezclado** | **fallo** |
| **P5** enlaces de 0 m | 1–40 | ⛔ **0** | **fallo** |

⭐ **Que fallen dos es la mejor noticia del apartado**, porque es la respuesta a la costura del
encargo: **no me estoy confirmando a mí mismo.** Si las cinco hubieran salido dentro de banda, la
sospecha sería que la predicción se escribió sabiendo el resultado — y la única defensa habría sido
el sello de hora. Con dos fallos no hace falta defensa.

### 2.4 · ⛔ P4 falló, y el fallo importa más que el acierto

```
   fracción de ARISTAS del camino que son eje de calzada:
      p10 0 %  ·  p25 7 %  ·  p50 31 %  ·  p75 62 %  ·  p90 100 %
   caminos SIN ni una arista de eje ..... 69 de 324
   caminos ENTEROS por eje .............. 33 de 324
   ⇒ solo el 31 % son PUROS  ⇒  reparto MEZCLADO, no bimodal
```

⚠️ **Y mezclado es peor que bimodal, que es justo lo contrario de lo que yo esperaba.** Si fuera
bimodal se podría decir *«en el centro los enlaces son buenos y en la periferia no»* y avisar por
zonas. **Siendo mezclado, el enlace típico tiene un trozo por acera y un trozo por el eje** — y no
hay ninguna frontera geográfica que sirva de aviso. **El aviso tiene que ir en cada enlace.**

### 2.5 · ⭐ Por qué el veredicto es del ENLACE y no de la parada — con su cifra

```
   de los 254 EJE:
      alguna PUNTA en eje ...................... 175
      ⚠️ las dos puntas en acera y el CAMINO se mete ... 79
```

⇒ **79 de 324 enlaces (24,4 %) parecen buenos mirando solo las paradas y no lo son.** Si el
veredicto fuera por parada, esos 79 se publicarían como limpios. **Es la justificación medida de la
decisión de Antonio de meter el veredicto en esta tanda.**

### 2.6 · ⭐⭐⭐ Los cuatro valores se han visto salir

**Ninguno es una promesa** (*un guardián cuyo rojo nadie ha provocado no es una red*):

```
   ACERA · EJE          salieron SOLOS sobre la muestra
   SIN CAMINO           provocado: "PA00349" Ctra. Castellón (comp 52) × "PA00002" (comp 0)  ✅
   MISMA ARISTA         provocado: "PA00002" contra SÍ MISMA                                  ✅
```

⚠️ **Con su matiz honesto:** a dos hubo que ir a buscarlos. **Que existan no dice nada de su
frecuencia — dice que el clasificador sabe emitirlos.**

### 2.7 · ⭐⭐ Un tercer camino para una cifra (ley 149)

```
   fracción GLOBAL (todas las aristas del conjunto juntas) .... 32,2 %
   media de las fracciones POR ENLACE ......................... 37,3 %
```

⚠️ **No coinciden y NO tienen por qué**: la primera pesa por longitud de camino, la segunda da a
cada enlace el mismo voto. **Publicar solo una de las dos como «el porcentaje de eje» sería elegir
la que más gusta.** Van las dos.

⭐ **Y un cuadre independiente que salió solo:**

```
   pares candidatos bus×bus  (esta tanda) ........... 2.266
   pares candidatos totales  (H2a·5, con tranvía) ... 2.538
   pares bus↔tranvía a ≤300 m (H2a·4) ................. 272
   ⇒ 2.266 + 272 = 2.538   ✅
```

**Tres medidas de tres tandas distintas, con tres scripts distintos, y la suma cierra.**

---

## §3 · LOS CASOS LÍMITE

### 3.1 · El cruce invisible — 1 de 324

```
   enlaces por debajo de 40 m con el camino 100 % eje ... 1 de 324   (0,3 %)
      38,0 m   "PA00913" Lagos De Coronas / Campo × "PA00916" Lagos De Coronas / La Camisera
```

⇒ El caso puro *«corto, entero por eje, casi seguro un cruce»* **es raro**. Lo que no es raro es el
mixto: un enlace de 150 m con el 30 % de sus aristas en eje.

### 3.2 · `SIN CAMINO`: 0 en la muestra, y no es tranquilizador

Las tres paradas fuera de la componente mayor son de la Ctra. Castellón, y **ninguna tiene pareja
candidata dentro de los 300 m**. ⇒ Sobre bus×bus el veredicto no aparece. **Aparecerá en H2·7 en
cuanto entren los 272 pares con el tranvía**, o no aparecerá — y entonces habrá que decir que las
tres paradas de la Ctra. Castellón **no tienen transbordo posible**, que es exactamente el
resultado que hay que publicar.

### 3.3 · Los enlaces de 0 metros: NO EXISTEN

H2·5 avisó: *«dos andenes enfrentados pueden colapsar al mismo nodo ⇒ su enlace mediría 0 m»*.
**Medido: no ocurre. Ni una vez en 324.**

⭐ **Pero el aviso valía igual**, porque ir a buscar el cero destapó §3.4. *Un caso límite mal
formulado sigue siendo mejor que no mirarlo.*

### 3.4 · ⛔⛔⛔ UNA PARADA CONTRA SÍ MISMA MIDE 15,70 METROS

```
   veredicto("PA00002" Agustín Príncipe N.º 2, LA MISMA)
      el motor dice ....... 15,70 m
      la verdad es ......... 0,00 m
```

**La causa está en la estructura, no en un redondeo.** `src/grafo.js:227-228` inserta **dos nodos
temporales independientes**, e `insertar` (`src/grafo.js:211-213`) enlaza cada uno **solo con los
dos extremos de la arista**, nunca entre sí. ⇒ **Si las dos puntas caen en la misma arista, el
camino más corto es «salir a la esquina y volver».**

**Y no es de laboratorio:**

```
   pares candidatos bus×bus .................... 2.266
   ⛔ con las dos puntas en la MISMA arista ........ 16   (0,7 %)

   el motor    la verdad    se infla    el par
     78,9 m       3,0 m     +75,9 m    Camino De Los Molinos × Camino De Los Molinos
     86,1 m      16,8 m     +69,3 m    Av. De Madrid N.º 29 × Av. De Madrid / Aljafería
     80,1 m      10,9 m     +69,2 m    Av. De Madrid N.º 36 × Av. De Madrid N.º 38

   inflación: mín +1,2 · p50 +49,0 · p90 +69,3 · máx +75,9 m
   factor motor/verdad: mediana 2,79×  ·  MÁXIMO 26,4×
```

⭐ **Positivo de control:** un par en aristas **distintas** sale normal — `PA00002 × PA00004`, motor
291,1 m contra 242,1 m de recta, **rodeo 1,20**. ⇒ El sesgo es exclusivo del caso «misma arista».

⛔ **No se ha arreglado.** `src/grafo.js` es H1 y está fuera del alcance. Lo que se hace es
**medirlo y publicarlo con los dos números al lado**; corregir el metraje aquí escondería un
defecto de H1 dentro de un fichero de H2a.

---

## §4 · T3 · EL PUNTERO Y LA BITÁCORA

### 4.1 · ⛔ La premisa del encargo ya estaba cumplida

El encargo pedía sacar `docs/BITACORA.md` del universo del puntero. **Ya estaba fuera, desde la
tanda 4**, y con su motivo escrito (`src/superados.js:244-264`):

```
   src/superados.js:342     for (const d of docs) { if (esActa(d)) continue; … }
   src/superados.js:263     const esActa = (d) => /BITACORA\.md$|auditoriafinal\//.test(d) || …
```

⭐ **La prueba, con positivo de control** (ley 4) — un valor superado que **sí** abunda en la
bitácora:

```
   par A (un valor de tres cifras)  apariciones en docs/BITACORA.md .... 19 líneas
                                    lo que el puntero declara .. propias 3 + ajenas 3 = 6
   par B (un valor de cinco cifras) apariciones en docs/BITACORA.md ..... 6 líneas
                                    lo que el puntero declara .. propias 8 + ajenas 0 = 8
```

⇒ **Si la bitácora entrara, el par A contaría 25 líneas y no 6.** Está fuera, medido.

⚠️ **Y los dos valores van sin escribir, con el mismo convenio `⟨…⟩` de ayer, por la razón de
siempre:** citarlos aquí los contaría, este documento pasaría a «publicar dos cifras superadas», y
la demostración de que el mecanismo funciona **rompería el mecanismo**. Los comandos que producen
esas cuatro cifras están en el cuaderno de la tanda; **el que quiera reproducirlos tiene los dos
valores en la tabla del propio `src/superados.js`.**

### 4.2 · ⛔⛔ Y sacarla NO habría arreglado el choque de ayer

**El choque no venía de la bitácora.** Venía de `docs/H2A-ENGANCHE-DE-LAS-PARADAS.md` —un documento
normal, dentro del universo— **citando el ORDINAL de una entrada de bitácora**. Ese ordinal coincide
con un valor retirado.

⇒ **La medida propuesta no toca la causa.** Si se hubiera aplicado sin mirar, el resultado habría
sido: el choque intacto, y una exclusión nueva escrita en el código sin motivo real.

⚠️ **Por eso tampoco se ha retirado el convenio `⟨…⟩`** que se puso ayer: retirarlo **volvería a
poner D3 en rojo**, porque la causa sigue ahí. **PARA Y AVISA**, que es lo que manda la costura.

### 4.3 · ✅ Lo que sí se ha hecho, que es la mitad que valía

**El puntero DECLARA su universo excluido en la salida**, con el motivo de cada uno:

```
   ⛔ FUERA DEL UNIVERSO — 7 de 55 documentos
      docs/BITACORA.md              ACTA · el valor viejo TIENE que aparecer
      docs/H1-REPUBLICACIONES.md    ES EL ÍNDICE de las republicaciones
      docs/auditoriafinal/…  (×4)   ACTA de auditoría
      data/pruebas/RUTAS-CONOCIDAS.md  ⛔ NO ES DE ESTE REPOSITORIO: es de Antonio
   ⚠️ Y una exclusión más, por par: el documento al que cada par REPUBLICA.
   ⭐ Lo que esto NO cubre: la ley 109 —vallas ``` pares— SÍ se comprueba sobre TODOS.
```

⛔ **Esto no cambia lo que se vigila.** Cambia que se pueda saber **sin abrir el código**, que es la
diferencia entre una decisión y un olvido.

### 4.4 · El recuento, antes y después

```
                              ANTES    DESPUÉS
   pares en la tabla            24        24      ✅
   documentos con marca         18        18      ✅
   líneas que la llevan        112       112      ✅
   documentos EXCLUIDOS      no se decía   7      ⭐ lo único que cambia
```

⇒ **Ni una marca perdida**, que es exactamente lo que la costura del encargo prohibía perder.

---

## §5 · ⚠️ QUÉ COMPROBACIÓN NO SE ME OCURRIÓ

1. ⛔⛔ **Sigo sin comprobar el LADO de la calle**, que ya era la que más falta hacía en H2·5.
   `src/acera-equivocada.js` existe, y el veredicto `ACERA` de hoy **solo dice que el camino va por
   aristas de tipo acera — no que vaya por la acera CORRECTA.** Un enlace `ACERA` puede seguir
   mandando a cruzar.
2. **No he mirado si el veredicto cambia con los pasos condicionales fuera.** El grafo los lleva
   dentro (es como contesta el motor), pero un enlace que dependa de un pasaje que cierra por la
   noche es un enlace condicional, y no lo he marcado.
3. **No he medido el veredicto de los 272 pares bus↔tranvía**, que son justo los que sostienen el
   diferenciador del hito. Están fuera del alcance de hoy, pero la cifra del §0 es **solo de bus**.

---

## §6 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ **`DESPLAZAME-ESTADO.md` no se toca.**

1. ⛔⛔⛔ **El 78,4 % de los enlaces pasa por eje de calzada.** La tesis del hito —*«nosotros lo
   calculamos andando»*— **es cierta en el 20,7 %**. En el resto el cálculo andando da el mismo
   error que un radio, con decimales.
2. ⛔⛔⛔ **Una parada contra sí misma mide 15,70 m.** `rutaEntre` no sabe ir de un punto insertado
   a otro si comparten arista (`src/grafo.js:211-213`, `:227-228`). **16 de 2.266 pares afectados,
   inflación mediana +49,0 m, máxima 26,4×.** ⛔ Es de H1 y **no se ha tocado**: se reporta.
3. ⛔ **El reparto es MEZCLADO, no bimodal** (p50 = 31 % de aristas en eje). ⇒ **No hay frontera
   geográfica que sirva de aviso: el aviso tiene que ir en cada enlace.**
4. ⭐⭐ **79 de 324 enlaces (24,4 %) parecen buenos mirando solo las paradas y no lo son.** Es la
   justificación medida de que el veredicto sea del enlace.
5. ⭐ **El artefacto de la red de bus pesa 200,5 KB (41,9 KB en gzip)** — reducción de **229×**
   sobre `stop_times.txt`. **Es el número que decidirá el stack.**
6. ⭐ **La suma cierra entre tres tandas:** 2.266 (bus×bus, hoy) + 272 (bus↔tranvía, H2a·4) = 2.538
   (H2a·4). Tres scripts distintos, tres días distintos.
7. ⭐ **Los dos condicionales están separados del resto por un salto de 4,8×** (38,6 % y 32,0 %
   frente al 6,6 % del tercero). No son el extremo de una distribución: son otra cosa.
8. ⛔ **La premisa de T3 del encargo ya estaba cumplida** desde la tanda 4, y **sacar la bitácora no
   habría arreglado el choque**: la causa es que un documento normal cita el ordinal de una entrada.
   ⇒ **El cabo sigue abierto y no se ha tocado el convenio `⟨…⟩`.**
9. ✅ **El puntero ya declara su universo excluido**: 7 de 55 documentos, con motivo, en su salida.
   Sin perder ni una marca.
10. ⚠️ **Y lo que falta, por segunda tanda consecutiva: el LADO de la calle.** `ACERA` hoy significa
    *«por aristas de tipo acera»*, no *«por la acera correcta»*.

---

## §7 · LÍNEAS BASE DE LA BATERÍA

```
   ANTES    ARRANQUE 2026-08-10T18:38:28+02:00  →  FIN 18:55:21   exit=0
            ⭐ con el árbol QUIETO: terminó antes de escribir el primer fichero.
   DESPUÉS  (ver §7.1)
```

### 7.1 · La comparación, con `diff`

```
   ANTES    18:38:28 → 18:55:21   exit=0     ⭐ árbol quieto
   DESPUÉS  19:07:20 → 19:24:16   exit=0     ⭐ árbol quieto

   diff (sin ARRANQUE/FIN/exit)   112 líneas vs 112 líneas   ⇒  salida VACÍA: IDÉNTICAS
```

✅ **Ni una fila movida**, y esta vez la comparación vale de verdad: las dos se tomaron sin escribir
nada mientras corrían. Ayer la de arranque salió roja por lanzarla y ponerse a escribir en `docs/`.

⚠️ **Y esta tanda SÍ ha tocado `src/`** —`src/superados.js`, para que declare su universo excluido—,
así que la comparación idéntica dice algo: **el cambio es de SALIDA, no de veredicto.** El puntero
imprime siete líneas más y sigue contando lo mismo, que es exactamente lo que se pretendía.

⛔ **Lo que sigue sin cubrir, por segunda tanda:** los tres ficheros nuevos de `tools/` **no los
mira la batería** (`src/probar-paradas.js:217` recorre `__dirname`, o sea `src/`). Que el `diff`
salga vacío **no dice nada sobre ellos**.
