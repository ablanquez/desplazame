# ANEXO al diseño H1 · ¿Cuántos desniveles se le escapan a la regla?

**Fecha:** 2 de agosto de 2026 · **Anexo de** [`DISEÑO-H1-GRAFO.md`](DISEÑO-H1-GRAFO.md), que **no
se reescribe**. Lo que aquí se corrija, se corrige aquí.

Mide **una sola cosa**: el falso negativo declarado en P2.5 del diseño — *"una pasarela peatonal
sobre una calle de 30 tiene la misma velocidad y la misma jerarquía a ambos lados, y la regla no la
ve"*. No construye nada.

**8 peticiones a Overpass, ninguna a otro servicio.** 4 con datos, 3 con error (guardadas también),
1 gastada en un intento que se resolvió sin red.

---

## A · LAS DOS ZONAS

Las eligió Antonio por conocimiento de campo. **Sus coordenadas no se han adivinado**: salen de los
portales del callejero municipal, que traen `coordLat`/`coordLon` — lectura local, cero peticiones.

```
CARRETERA HUESCA        codigoVia 14500 · 13 portales · lat 41.69035..41.71271  lon -0.87061..-0.86064
AVENIDA CIUDAD DE SORIA codigoVia 31151 ·  4 portales · lat 41.65619..41.65937  lon -0.90771..-0.90027
```

### A1 · Los encuadres

| Zona | bbox (lat0,lon0,lat1,lon1) | Tamaño | Qué contiene |
|---|---|---|---|
| **DELICIAS** | `41.65378,-0.91380,41.66283,-0.90178` | **1000 × 1000 m = 1,000 km²** | Estación Zaragoza-Delicias, Avenida de la Ciudad de Soria, Autovía del Ebro, Avenida de la Expo 2008 |
| **HUESCA** | `41.69048,-0.87201,41.69953,-0.85999` | **999 × 1000 m = 1,000 km²** | Tramo urbano de la Carretera de Huesca, con `trunk` y sus enlaces |

⭐ **A2 · Son comparables:** 1,000 km² exactos las dos, medidos en metros (EPSG:25830 equivalente),
no en grados. **Es el error nº31 de la bitácora, no repetido**: allí dos ventanas llamadas igual
resultaron ser sitios distintos porque nunca se pusieron en los mismos ejes.

**El encuadre encuentra lo que se esperaba**, y esto sí es comprobación y no confianza:

- DELICIAS: `Autovía del Ebro`, `Avenida de la Ciudad de Soria`, `Calle de la Rioja`,
  `Avenida de la Expo 2008`, 1 puente ferroviario (`bridge=viaduct`). ✅ Es el entorno de la
  estación.
- HUESCA: 16 ways `trunk` + 15 `trunk_link`, `Carretera de Alicante a Francia por Zaragoza`,
  `Ronda de San Gregorio`. ✅ Es la travesía con vía rápida.

⚠️ **La zona de Huesca cubre el extremo urbano** de la Carretera de Huesca (los portales llegan
hasta 41.71271, o sea 1,5 km más al norte). Se eligió el extremo sur **porque es donde la vía
rápida se encuentra con la ciudad**, que es donde puede haber desnivel. El resto no está medido.

---

## B · LAS SEÑALES DE NIVEL EN OSM

### ⭐⭐ B0 · Control positivo, ANTES de afirmar ningún cero

```
consulta : way["bridge"](41.6570,-0.8800,41.6610,-0.8750);  out tags center;
respuesta: HTTP 200 · 1.404 bytes · 2 elementos

  way 24025331   bridge=yes  highway=living_street  layer=1  name=Puente de Piedra
  way 421798388  bridge=yes  railway=…              layer=1  name=Puente de Piedra
```

**El instrumento encuentra `bridge` donde lo hay.** A partir de aquí, un cero significa algo.

*(Este control existe porque el diseño se apoyaba en un `bridge` = 0 de 309 ways en el casco
antiguo, que era un cero explicado pero no probado.)*

### B1-B4 · Lo que hay en cada zona

| | DELICIAS | HUESCA |
|---|---:|---:|
| ways con geometría | **1.197** | **184** |
| `bridge=*` | **85** | **2** |
| `tunnel=*` | 16 | 3 |
| `layer=*` | **112** | 2 |
| **Puentes (`bridge` o `layer`>0)** | **112** | **2** |
| — de ellos **peatonales** | **73** | **2** |
| Túneles / soterrados | 21 | 3 |

Valores encontrados:

```
DELICIAS  bridge={'yes':85}   tunnel={'yes':16}   layer={'-1':10,'-1.5':1,'-2':4,'1':3,'2':90,'3':4}
HUESCA    bridge={'yes':2}    tunnel={'yes':2,'building_passage':1}   layer={'1':2}
control   bridge=viaduct (Puente de Piedra ferroviario)
```

⚠️ **Dos trampas de formato, medidas y no supuestas:**

1. **`layer` NO es un entero.** Aparece **`-1.5`**. Un parseo con `int()` revienta o —peor— lo
   descarta en silencio y pierde el único elemento que declara medio nivel.
2. **`bridge` NO es booleano.** Vale `yes`, pero también `viaduct` (y en OSM `boardwalk`,
   `covered`…). Y `tunnel` vale `building_passage`, que no es un túnel: es un pasaje bajo un
   edificio — **y a efectos de peatón sí se pasa por él**.

⭐ **B3 · `layer=2` en 90 ways de Delicias.** No es un puente aislado: **el entorno de la estación
es una plataforma elevada entera**. El nivel ahí no es una excepción puntual, es el estado normal
del terreno. Eso invalida cualquier regla que trate el desnivel como rareza.

---

## C · ⭐⭐ ¿LA REGLA MUNICIPAL LOS CAZARÍA?

**Método.** Para cada punto donde dos vías se cruzan en 2D se mira si **en ese punto exacto** hay un
vértice común a las dos. En OSM la conectividad es por identidad de nodo: si lo comparten, se cruzan
a nivel; si no, están a distinto nivel. Después se pregunta qué diría la regla del diseño
(salto de `limite_vel` ≥50, o jerarquía rápida contra no rápida).

⚠️ **Es una INFERENCIA, no una medición sobre `MU1_jerarquia_viaria`.** No se ha pedido el dato
municipal: se traduce `maxspeed` → `limite_vel` y `highway=motorway|trunk` → `01_CINTURON` /
`02_Penetracion`. Donde la traducción no es segura, se declara.

⭐ **Y una corrección de método sobre la marcha:** el primer recuento marcaba "comparten nodo" **por
par de vías**, no por punto. Dos vías pueden unirse en una rampa y cruzarse en un paso elevado 300 m
más allá. Rehecho punto a punto, los desniveles pasaron de 62 a 67 en Delicias y de 9 a 10 en
Huesca.

### C1-C2 · El reparto

| | DELICIAS | HUESCA |
|---|---:|---:|
| Puntos de cruce 2D | 2.344 | 336 |
| — a nivel (comparten nodo ahí) | 2.277 (97 %) | 326 (97 %) |
| — **a distinto nivel** | **67** | **10** |

Y esos 67 + 10, por cubos:

| Cubo | DELICIAS | HUESCA |
|---|---:|---:|
| **(a) Sin marcar en OSM** | 2 (3 %) | 0 |
| ⭐ **(b) Lo cubre OSM: hay una vía peatonal, y el dato trae `bridge`** | **52 (78 %)** | **10 (100 %)** |
| **(c) NO DETERMINABLE: hay una vía de servicio** | 13 (19 %) | 0 |
| **(d) CAZADO por la regla municipal** | **0** | **0** |
| ⛔ **(e) ESCAPADO** | **0** | **0** |

### ⭐ El control que sostiene ese cero

Un cero de escapados sin control es indistinguible de un contador roto. El control directo:

```
cruces RODADA x RODADA (sin peatonales ni servicio):
   DELICIAS : 462 puntos ->   0 sin nodo compartido
   HUESCA   : 113 puntos ->   0 sin nodo compartido
```

**En 2 km² no hay ni un solo cruce entre dos calles rodadas a distinto nivel.** El desnivel de
estas dos zonas está **íntegramente** entre (i) vías peatonales, que OSM etiqueta, y (ii) vías de
servicio.

### ⚠️ Los 13 "no determinables", mirados de cerca

Su naturaleza, contada:

```
primary          x  servicio SIN nombre   5
servicio CON nom x  servicio SIN nombre   3
residential      x  servicio SIN nombre   3
servicio SIN nom x  servicio SIN nombre   1
secondary        x  servicio SIN nombre   1
```

⭐ **Los trece llevan al menos una vía de servicio SIN NOMBRE** — rampas de aparcamiento, accesos de
estación. `MU1_jerarquia_viaria` es una capa de **jerarquía de calles con nombre y `codigo` de vía**:
lo más probable es que no las tenga, y entonces esos 13 desniveles **ni siquiera existen** en el
grafo municipal, porque una de las dos líneas no está.

⚠️ **Pero "lo más probable" no es una medición, y no se va a apuntar como si lo fuera.** Se intentó
comprobar cruzando nombres contra el callejero municipal y **el instrumento resultó estar roto**
(bitácora nº33: `CALLE UNCETA` no casa con `Calle de Marcelino Unceta`, y hay sufijos `---CST`,
`---SGR`, `---SJN`). **La conclusión se retira, no se apuntala.**

**Qué lo resuelve:** descargar `MU1_jerarquia_viaria` entera y buscar por `codigo` —identificador
exacto, no nombre— si esas vías están. Es el paso 1 de H1 de todas formas.

**El peor caso, dicho:** si MU1 tuviera todas esas vías de servicio, los escapados serían **13 en
2 km²**, y el más incómodo ya tiene nombre: `Calle Miquel Roca i Junyent`, `residential`,
**`maxspeed=30`, `bridge=yes`, `layer=2`**, cruzando por encima de un vial en túnel (`layer=-2`).
**30 contra 30, misma jerarquía: la regla no vería nada.** Es exactamente el caso que esta tanda
venía a buscar, y existe — sólo que probablemente no en la capa municipal.

### C3 · ⭐⭐ LOS FALSOS POSITIVOS, que son el hallazgo de verdad

| | DELICIAS | HUESCA |
|---|---:|---:|
| Cruces **a nivel de verdad** (comparten nodo) que la regla marcaría como "no unir" | **0** | ⛔ **4** |

Los cuatro, en la zona de la Carretera de Huesca:

```
trunk_link  (sin maxspeed)  X  tertiary      30   Calle de Jesús y María
trunk_link  (sin maxspeed)  X  unclassified  --   Camino los Leones
tertiary    30              X  trunk_link    60
trunk_link  (sin maxspeed)  X  residential   30
```

**Los cuatro los dispara la señal de JERARQUÍA, no la de velocidad.** Y los cuatro son enlaces de
la travesía con las calles del barrio — **uniones reales, con nodo compartido en OSM**.

⭐ **Y aquí está el error conceptual que la medición destapa:** la señal de jerarquía asume que *vía
rápida ⇒ cruza por encima*. **Una travesía es exactamente lo contrario: una vía rápida que cruza a
nivel.** Por eso Antonio la eligió, y por eso el resultado es el opuesto al esperado — la zona que
debía confirmar la regla es la que la rompe.

**Qué costaría:** negarse a unir esos cuatro deja el acceso del barrio a la vía rápida sin conectar.
Un falso positivo **parte la ciudad**, y a diferencia del falso negativo, lo hace en el sitio con
más tráfico.

---

## D · VEREDICTO SOBRE LA REGLA

### D1 · En una frase

> **La regla sirve, pero hay que partirla en dos: la señal de velocidad se queda como criterio; la
> de jerarquía baja a mera marca y deja de decidir.**

Los matices:

| Señal | Falsos negativos medidos | Falsos positivos medidos | Veredicto |
|---|---:|---:|---|
| **Salto `limite_vel` ≥ 50** | 0 en 2 km² | **0** en 2 km² | ✅ **Se queda como criterio** |
| **Jerarquía rápida ≠ no rápida** | 0 | ⛔ **4** en 1 km² | ⚠️ **Sólo marca. No decide** |
| **`bridge`/`layer` de OSM** | — | — | ⭐ **Es la señal buena: cubre el 78 %** |

⚠️ **Corrección explícita al diseño (P2.3):** allí se propuso *"un cruce dudoso se une sólo si
ninguna de las dos vías es rápida"*. **Con estos datos esa regla es la que más daño hace**: en la
zona de Huesca habría desconectado 4 enlaces reales y ningún desnivel. **Se propone invertirla:**
unir por defecto salvo que haya salto de velocidad ≥50 **o** una señal de nivel de OSM, y dejar la
jerarquía sólo para la lista de revisión.

### D2 · La señal adicional que hace falta

**`bridge` y `layer` de OSM**, y está disponible **donde OSM está mapeado**, que es la misma
condición que ya gobierna toda la capa peatonal del proyecto. En Delicias resuelve 52 de 67
desniveles ella sola, sin necesidad de ninguna regla.

⚠️ **No es gratis:** hace que el nivel del grafo **rodado** —que viene del municipal— dependa de una
fuente que sólo se usaba para el peatón. Y arrastra la ODbL a una parte más del artefacto.

### D3 · ⭐ Cuántas excepciones manuales harían falta

Sobre 2 km² medidos:

```
desniveles totales                                 77
  resueltos por el dato de OSM (bridge/layer)      62   (81 %)
  no marcados en OSM                                2   (footway x footway)
  pendientes de saber si estan en MU1              13
  que necesitarian excepcion a mano HOY             0-13
```

**Son decenas, no cientos.** Con el mecanismo de P6.2 del diseño —fichero versionado, reaplicado
solo, con su condición de caducidad— **esto se sostiene y H1 puede arrancar.**

### D4 · ⚠️ LA EXTRAPOLACIÓN, marcada como lo que es

**Esto es una extrapolación. NO es un dato.**

Se han medido **2 km² de Zaragoza**, elegidos **a propósito por ser difíciles** (una estación con
plataforma elevada y una travesía). No es una muestra aleatoria: está **sesgada hacia el desnivel**,
igual que las 11 ventanas del diseño lo estaban.

Lo que creo, y por qué:

- **El desnivel se concentra**, no se reparte. 112 puentes en Delicias contra 2 en Huesca y **0 en
  el casco antiguo** — tres zonas, tres órdenes de magnitud. Un modelo de "N puentes por km²" no
  describiría nada.
- ⇒ **La cifra de ciudad completa no se puede estimar desde aquí**, y no se va a inventar. Lo que sí
  se puede decir: los sitios donde va a haber desnivel son **identificables de antemano** — estación
  de tren, cinturones, cruces de río, polígonos — y son pocos.
- **El falso positivo, en cambio, sí escala**: hay `trunk`/`trunk_link` en todas las entradas de la
  ciudad, y en todas se une a nivel con las calles del barrio. **De los dos problemas, el que se
  repite es el que la regla causaba, no el que se le escapaba.**

⚠️ Y no sabemos qué superficie urbana tiene Zaragoza en total, así que **no se da un porcentaje de
cobertura**: sería inventarse el denominador, que es la ley nº1 de este proyecto.

---

## E · LO QUE NO SE PUEDE RESPONDER, Y CON QUÉ SE RESOLVERÍA

| # | Pregunta | Medición que la cierra |
|---|---|---|
| 1 | ⭐ **¿Están las vías de servicio en `MU1_jerarquia_viaria`?** De esto dependen los 13 | Descargar MU1 entera y buscar por `codigo`, **no por nombre** (el nombre ya falló) |
| 2 | ¿Cuántos desniveles hay en el resto de la ciudad? | Overpass por zonas identificadas (cinturones, ríos, polígonos). No es un barrido: es una lista corta |
| 3 | ¿Cuántos falsos positivos de jerarquía hay en total? | Los `trunk`/`trunk_link` de toda la ciudad contra sus cruces a nivel |
| 4 | Los 2 cruces peatonales sin marcar, ¿son fallo de OSM o pasos reales? | Sólo se resuelve mirando el sitio. Ninguna fuente lo dice |
| 5 | ¿Cubre `layer` todo lo que `bridge` no cubre? | Medido aquí en 2 km²; no generalizable |

---

## F · PETICIONES Y CRUDOS

| # | Consulta | Resultado |
|---:|---|---|
| 1 | localizar dianas por nombre, bbox ciudad | ⛔ HTTP 504 |
| 2 | DELICIAS, unión `bridge`+`tunnel`+`layer` | ⛔ HTTP 504 |
| 3 | igual, réplica `kumi.systems` | ⛔ colgada >2 min, sin respuesta |
| 4 | ⭐ **control positivo**: puentes del Ebro | ✅ 200 · 1.404 B |
| 5 | DELICIAS, unión otra vez | ⛔ HTTP 504 |
| 6 | ⭐ DELICIAS `way["bridge"]`, sentencia única | ✅ 200 · 65.232 B · **1,5 s** |
| 7 | DELICIAS `way["highway"]` completa | ✅ 200 · 871.241 B |
| 8 | HUESCA `way["highway"]` completa | ✅ 200 · 136.908 B |

**8 de 8 gastadas.** La localización de las dianas, que había fallado por red, se resolvió **sin
red**: con los portales del callejero, que traen coordenadas.

⚠️ Las 504 **no eran del servidor** pese a decir *"the server is probably too busy"*: la misma
ventana devolvió 871 KB sin problema. Era la **forma** de la consulta (unión de sentencias).
Bitácora nº32.

Crudos añadidos a `data/exploracion/`, ninguno sustituido:

```
2026-08-02_osm_overpass_control-positivo-puentes-ebro.json      1,4 KB   ✅
2026-08-02_osm_overpass_delicias-estacion_puentes.json           64 KB   ✅
2026-08-02_osm_overpass_delicias-estacion_todas-vias.json       851 KB   ✅
2026-08-02_osm_overpass_carretera-huesca_todas-vias.json        134 KB   ✅
2026-08-02_osm_overpass_localizar-dianas_HTTP504.html           695 B    (error)
2026-08-02_osm_overpass_delicias_HTTP504-servidor-ocupado.html  695 B    (error)
2026-08-02_osm_overpass_delicias_HTTP504-intento2.html          695 B    (error)
```

⚠️ Los tres errores llegaron a guardarse con extensión **`.json`**. Un `<!DOCTYPE html>` de 695 B
llamado `..._niveles.json` es una bomba a seis meses vista. Renombrados en el momento.

---

## G · ⚠️ QUÉ NO ENCAJA, Y QUÉ NO HE MIRADO

**Lo que no encaja** — porque un resultado limpio sin casos incómodos es un resultado mal mirado:

1. ⭐ **OSM tampoco está completo: 2 cruces `footway` × `footway` sin `bridge` ni `layer`.** Como el
   grafo peatonal **es** OSM, esos dos son escapados de verdad, sin regla que los salve. Pequeños,
   pero desmienten que "OSM lo cubre" sea absoluto.
2. ⭐⭐ **El nivel no es binario.** 90 ways con `layer=2` en Delicias: la estación es una plataforma
   elevada entera. Y hay `layer=-1.5`. Un modelo de "está arriba o está abajo" no describe eso.
3. **`tunnel=building_passage`** no es un túnel: es un pasaje bajo un edificio, y **a pie se pasa**.
   Tratarlo como desnivel cortaría un camino real.
4. ⚠️ **El cero de escapados y el cero de falsos positivos vienen de zonas distintas**: Delicias
   aporta el desnivel y cero falsos positivos; Huesca aporta cero desnivel rodado y los 4 falsos
   positivos. **Ninguna de las dos zonas prueba las dos cosas a la vez.**
5. **La zona de Huesca tiene 184 ways contra 1.197 de Delicias**, en la misma superficie. Son 1 km²
   de ciudad muy distinta, y la comparación entre ambas hay que hacerla con eso delante.
6. **`trunk_link` sin `maxspeed`** en 3 de los 4 falsos positivos: la señal de velocidad no puede
   opinar sobre ellos ni para bien ni para mal. La regla que propongo los deja unidos por defecto,
   que es lo correcto aquí — pero por ausencia de dato, no por criterio.

**Qué NO he mirado:**

- El dato municipal de estas dos zonas. **Cero peticiones al WFS**, por prohibición de la tanda.
  Todo lo municipal de este anexo es **inferencia desde OSM**.
- El resto de la Carretera de Huesca (1,5 km al norte de la ventana).
- Relaciones OSM (`type=multipolygon`, restricciones de giro): sólo se han pedido *ways*.
- La capa ferroviaria de Huesca. En Delicias entró 1 puente ferroviario por venir etiquetado
  `bridge`, pero **no se ha pedido `railway`** en ninguna de las dos consultas grandes.
- Los nodos con etiquetas (`highway=crossing`, `kerb`): `out geom` devuelve la geometría de los
  ways, no las etiquetas de sus nodos.

---

*Anexo escrito el 2026-08-02. 8 peticiones a Overpass, ninguna a otro servicio. Nada construido.*
