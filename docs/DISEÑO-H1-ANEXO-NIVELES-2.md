# ANEXO 2 al diseño H1 · La regla de nivel, probada contra lo que podía romperla

**Fecha:** 2 de agosto de 2026 · Anexo de [`DISEÑO-H1-GRAFO.md`](DISEÑO-H1-GRAFO.md) y de
[`DISEÑO-H1-ANEXO-NIVELES.md`](DISEÑO-H1-ANEXO-NIVELES.md). **Ninguno de los dos se reescribe.**

Prueba la **regla nueva (D1)** —*unir por defecto; no unir sólo con evidencia positiva*— contra un
paso subterráneo, una avenida con pasarelas, y el caso estructural que ninguna regla contemplaba:
una plataforma elevada entera.

**13 peticiones de 14.** Nada construido.

---

## ⚠️⚠️ EL TITULAR: LA REGLA D1, TAL COMO ESTÁ ESCRITA, ROMPE LA CIUDAD

Aplicada literalmente a los 7.114 puntos de cruce de las cuatro ventanas medidas:

```
                 uniones REALES que separaria       desniveles que se le escapan
ALIERTA                    166                                   0
PIRINEOS                    85                                   0
DELICIAS                   370                                   2
HUESCA                      13                                   0
TOTAL 4 km2            ⛔ 634                                     2
```

**634 uniones reales cortadas para evitar 2 errores.** Y en Delicias corta la plataforma elevada
**por dentro**: 177 separaciones por `bridge` y 56 por `layer`, todas entre trozos de la misma
superficie. Es el escenario que la costura anti-fallo marcaba como el peor posible, **y ha salido**.

### ⭐ Le faltaban dos cláusulas. Con ellas, el problema desaparece

```
                 falsos positivos      escapados
regla D1 literal        634                2
regla D1 + 2 clausulas    0                2      <- mismas 4 ventanas, mismos 7.114 cruces
```

**C1 · PRECEDENCIA DEL NODO.** Si dos vías **comparten un nodo en ese punto**, se conectan. Punto.
La señal de nivel sólo opina sobre cruces **sin** nodo compartido.
*Por qué faltaba:* la regla se pensó para la capa municipal, **que no tiene nodos compartidos**. Al
aplicarla a OSM, donde el nodo compartido *es* la topología, se convierte en un destructor: basta
que una vía sea puente en algún tramo para que la regla la desconecte también de la rampa que la
alimenta.

**C2 · EL SALTO DE VELOCIDAD SÓLO ENTRE DOS RODADAS.** Nunca cuando una de las dos es peatonal.
*Por qué faltaba:* en la capa municipal `06_Peatonal` lleva **`limite_vel = 0`** (35 de los 160
tramos medidos). Una calle peatonal que cruza una de 50 da un salto de **exactamente 50** y la
regla la separaría. ⚠️ **Esto no se vio en la muestra municipal por suerte**: entre los 89 cruces
medidos no había ni un `(0, 50)`. El fallo estaba ahí y el dato no lo enseñó.

⇒ **Ninguna de las dos se descubrió razonando. Las dos salieron de contar.**

---

## 0 · LAS CUATRO VENTANAS — y su fecha, que no es la misma

⚠️ **Cada cifra de este anexo lleva la fecha de su ventana**, porque las cuatro no son del mismo
día. Cuando la instancia principal de Overpass dejó de servir, dos zonas se pidieron a una réplica,
y **una réplica es otra fuente** (bitácora nº35):

| Zona | bbox | Tamaño | **Sello del dato** | ways |
|---|---|---|---|---:|
| **DELICIAS** | `41.65378,-0.91380,41.66283,-0.90178` | 1,000 km² | **2026-08-02** | 1.197 |
| **HUESCA** | `41.69048,-0.87201,41.69953,-0.85999` | 1,000 km² | **2026-08-02** | 184 |
| **ALIERTA** | `41.64040,-0.88409,41.64945,-0.87207` | 1,000 km² | ⚠️ **2026-05-31** | 1.500 |
| **PIRINEOS** | `41.65746,-0.88631,41.66651,-0.87429` | 1,000 km² | ⚠️ **2026-05-06** | 931 |

**Las cuatro miden 1,000 km² exactos**, calculados en metros. Los encuadres salen de los portales
del callejero (lectura local): `AVENIDA CESÁREO ALIERTA` (cod 980) y `CAMINO DE LAS TORRES`
(cod 32120) tienen dos portales a **24 m** el uno del otro, y ése es el cruce.

⚠️ Comparar zonas entre sí cruza **hasta tres meses**. Lo único comprobable sin gastar más
peticiones: los dos ficheros de Alierta, de fechas distintas (31/05 y 12/06), **contienen los
mismos 15 túneles, uno a uno**.

---

## A · EL PASO SUBTERRÁNEO — la diana que podía refutar, y refutó

### A1-A2 · Existe, y está marcado

```
way 24303037  highway=primary  tunnel=yes  layer=-1  maxspeed=50  name=Avenida de Cesáreo Alierta
way 24313977  highway=primary  tunnel=yes  layer=-1  maxspeed=50  name=Avenida de Cesáreo Alierta
```

**Es un paso inferior de VEHÍCULOS**, no de peatones: las dos calzadas de Cesáreo Alierta pasan por
debajo. La pregunta que el prompt dejaba abierta queda contestada **con el dato**, no por deducción.

Lleva **las dos señales**: `tunnel=yes` y `layer=-1`.

### A3 · ¿La regla nueva lo resuelve? **Sí, y por `tunnel`**

Los 20 cruces que tocan esos dos ways salen todos `NO UNIR (tunnel)`. Y lo que pasa por encima:

```
Camino de las Torres   highway=primary          maxspeed=50   layer=None   nodo comun: NO
Camino de las Torres   highway=secondary_link   maxspeed=--   layer=None   nodo comun: NO
(mas 2 cycleway y 2 footway por encima, sin nodo comun)
```

### A5 · ⭐⭐ **Y la regla MUNICIPAL sola lo habría fallado**

```
Cesareo Alierta (abajo)  maxspeed 50
Camino de las Torres (arriba) maxspeed 50     ->  SALTO = 0
```

**Mismo límite de velocidad arriba y abajo, y las dos son vías urbanas de la misma familia.** El
salto de `limite_vel ≥50` **no dispara**. La jerarquía tampoco: ninguna es cinturón ni penetración.

⇒ **La diana era buena: refuta la parte municipal de la regla.** El paso inferior de Cesáreo
Alierta se salva **únicamente** porque OSM lo etiqueta. Sin OSM, el planarizado uniría una avenida
que va por debajo con la que va por encima, y el motor mandaría a un peatón a cruzar por donde no
hay cruce.
*(Inferencia: no se ha pedido la capa municipal. Los `maxspeed` son de OSM.)*

### A4 · `layer` se lee como decimal con signo, o se pierde dato

Valores medidos en las cuatro ventanas: `-3, -2, -1.5, -1, 1, 2, 3` y **ausente**.

- ⛔ `int("-1.5")` → **excepción**. Y si se captura y se ignora, se pierde en silencio el único
  elemento a media altura.
- ✅ Se lee **`float`**, y **la ausencia es `0`, no "desconocido"**.
- ⚠️ Y `layer` **no basta**: de los 56 túneles de Delicias, **7 no llevan `layer`** (todos
  `service` con `tunnel=yes`). En Alierta, **9 de 18** no lo llevan. **La señal `tunnel` es
  obligatoria además de `layer`.**

### A6 · Pasos subterráneos peatonales, y una trampa

En la ventana de Alierta, 18 elementos con `tunnel=*`:

```
tunnel=yes                12      (2 primary, 3 RAIL, 3 service, 3 footway/steps, 1 otro)
tunnel=building_passage    6      <- ⚠️ NO son tuneles
```

⚠️ **`building_passage` es un pasaje bajo un edificio, y se pasa a pie.** Son `Pasaje Miraflores`,
`Pasaje Ciuvasa` y cuatro más sin nombre. **Tratarlos como desnivel corta seis caminos peatonales
reales.** En Pirineos hay **11 más**. Por eso la regla final los excluye explícitamente:
`tunnel ∈ {yes, culvert, passage}` sí; `building_passage` no.

*(Y `culvert` tampoco es transitable — es un conducto de agua. Se excluye del grafo peatonal, pero
sí cuenta como desnivel.)*

---

## B · AVENIDA PIRINEOS — la diana que confirma

**Ventana:** 1,000 km², sello **2026-05-06**, 931 ways.

### B1-B2 · Qué hay

```
bridge=yes            7
tunnel real           1
building_passage     11     <- mas pasajes que tuneles de verdad
layer != 0            7
puntos de cruce   1.664   ·   a nivel 1.655   ·   a distinto nivel 9
```

⚠️ **Menos pasarelas de las esperadas.** Antonio las describe como abundantes; OSM marca 7 puentes
en este kilómetro cuadrado. Dos lecturas posibles y **no se puede distinguir con lo que hay**:
(a) el encuadre —centrado en los 4 portales de la avenida— no cubre donde están, o (b) OSM no las
tiene todas. `NO CONSTA`. Lo resolvería una consulta sobre la avenida completa.

### B3 · Escapadas: **0 de 9**

Los 9 desniveles los caza `bridge`. Ninguno necesita la señal de velocidad, y ninguno se escapa.

### B4 · Falsos positivos con la regla nueva: **0** ⚠️ *sólo con las dos cláusulas*

Sin ellas: **85**. El arreglo de la tanda anterior —quitarle el voto a la jerarquía— **era
necesario y no suficiente**: eliminó los 4 falsos positivos de Huesca, pero dejó vivos otros 634 de
otras dos familias que aquella medición no vio porque sólo miró cruces rodada×rodada.

---

## C · ⭐⭐ LA PLATAFORMA ELEVADA DE DELICIAS — el caso estructural

### C1 · No son 90 puentes: es **una** superficie

```
layer=2 : 90 ways   ->   64 con bridge=yes,  26 SIN bridge
tipos   : footway 50 · secondary 11 · primary 9 · service 6 · cycleway 5 · pedestrian 5 · residential 4
nombres : Calle de la Rioja (15) · Autovia del Ebro (9) · Miquel Roca i Junyent (6) · Expo 2008 (4)
componentes conexas entre ellos: 7   ->   la mayor tiene 81 de los 90
```

⭐ **81 de 90 forman una sola pieza conectada.** No es un puente sobre una calle: es **terreno a
otra altura**, con calles, aceras y carriles bici propios. Y **26 de los 90 no llevan `bridge`** —
porque no son puentes: **son el suelo de arriba.**

### C2 · Se entra por 51 sitios

```
nodos donde algo de layer=2 toca algo del suelo : 51
  por footway 38 · secondary 9 · cycleway 6 · pedestrian 4 · primary 2 · service 2
escaleras (highway=steps) en la ventana : 26        ascensores : 0
```

Los accesos **están en OSM y son abundantes**. La plataforma no queda aislada por falta de datos.
⚠️ **Cero ascensores mapeados.** Para una ruta accesible eso importa, y está fuera del nivel 2.

### C3 · ⚠️⚠️ ¿La regla la desconectaría por dentro? **SÍ, la literal. NO, la corregida**

**Medido, con n grande:**

```
cruces con MISMO layer   : 3.696  ->  3.694 comparten nodo  (99,9 %)
cruces con layer DISTINTO:   216  ->    151 comparten nodo  (69,9 %)
```

⭐ **La pista del prompt queda CONFIRMADA por un lado y REFUTADA por el otro:**

- *"Dos vías con el mismo `layer` que se cruzan probablemente sí se conectan"* → **99,9 %.
  Confirmado.** Sólo 2 excepciones en 3.696, y son las dos de la sección D.
- *"Con `layer` distinto, probablemente no"* → ⛔ **REFUTADO: el 70 % SÍ se conectan.** Son las
  rampas, escaleras y accesos — precisamente lo que une la plataforma con el suelo. Una regla que
  separe por "layer distinto" **corta los 151 accesos** y deja la estación en el aire.

### C4 · Zonas frente a puntos: **no hace falta una regla distinta**

Era la sospecha razonable, y la medición dice que no. **No hay que detectar la zona**: basta la
cláusula C1 (precedencia del nodo). Dentro de la plataforma todo comparte nodos, así que se
conecta; con el suelo comparte los 51 nodos de acceso, así que también. **La zona se resuelve
sola** porque OSM ya la resolvió al mapearla.

⚠️ **Pero eso sólo vale para la geometría de OSM.** En la capa municipal, sin nodos compartidos, una
plataforma elevada sería indistinguible de un cruce a nivel. ⇒ **Consecuencia de diseño: la
geometría municipal no debe planarizarse en las zonas donde OSM declara `layer`.** Es una razón más,
independiente de las anteriores, para que las dos capas convivan.

### C5 · Otros sitios así en Zaragoza (detectados, **no medidos**)

`Autovía del Ebro`, `Avenida de la Expo 2008` y `Calle de la Rioja` continúan fuera de la ventana:
la plataforma **se sale del kilómetro cuadrado medido**. Y por estructura urbana son candidatos:
el entorno de la estación **El Portillo**, los enlaces de la **Z-40**, y el eje de la **Expo/Ranillas**.
⚠️ Nombrados, no medidos.

---

## D · LOS `footway` × `footway` SIN MARCAR — ¿raros o patrón?

**Medido sobre las cuatro ventanas (4 km², 5.137 cruces peatonales):**

| Zona | cruces peatonal×peatonal | sin marcar | % |
|---|---:|---:|---:|
| ALIERTA | 1.686 | **0** | 0,00 % |
| PIRINEOS | 989 | **0** | 0,00 % |
| HUESCA | 115 | **0** | 0,00 % |
| DELICIAS | 1.347 | **2** | 0,15 % |
| **TOTAL** | **4.137** | **2** | **0,05 %** |

⇒ **Son raros, no el patrón.** Y hay un detalle que reduce aún más su peso: los dos están **en el
mismo sitio**, a menos de un metro (`41.658070,-0.912026` y `41.658064,-0.912018`), entre ways de
identificadores casi consecutivos (`1458513410`, `1458513411`, `1458513413`). **No son dos defectos:
es uno**, un cruce peatonal partido en una edición reciente sin unir los nodos.

⚠️ Siguen siendo **escapados reales**, no inferencias: el grafo peatonal *es* OSM. Pero 1 defecto
en 4 km² entra de sobra en el fichero de excepciones.

---

## E · VEREDICTO

### E1 · En una frase

> **La regla sirve —caza 113 de 115 desniveles y no inventa ninguno— pero SÓLO con las dos
> cláusulas que le faltaban: el nodo compartido manda sobre cualquier señal, y el salto de
> velocidad no se aplica cuando una de las dos vías es peatonal. Sin ellas cortaría 634 uniones
> reales en 4 km².**

### E2 · La redacción final

```
PARA CADA PUNTO donde dos lineas se cruzan:

  # ---- 1. PRECEDENCIA: el hecho gana a la inferencia ----
  si las dos comparten un NODO en ese punto exacto:
      -> CONECTAR.  (fin. ninguna señal puede contradecir esto)
      # solo aplica a geometria de OSM. La municipal no tiene nodos compartidos.

  # ---- 2. EVIDENCIA POSITIVA DE DESNIVEL ----
  nivel(via)  =  float(via.layer)  si viene,  0.0  si no       # ⚠️ float: existe -1.5
  puente(via) =  via.bridge existe y != "no"
  tunel(via)  =  via.tunnel en {yes, culvert, passage}          # ⚠️ building_passage NO
                                                                #    es un pasaje: se pasa a pie

  si puente(A) o puente(B):        -> NO CONECTAR   motivo="bridge"
  si tunel(A)  o tunel(B):         -> NO CONECTAR   motivo="tunnel"
  si nivel(A) != nivel(B):         -> NO CONECTAR   motivo="layer"

  # ---- 3. LA SEÑAL MUNICIPAL, acotada ----
  si A y B son AMBAS rodadas  y  |limite_vel(A) - limite_vel(B)| >= 50:
      -> NO CONECTAR   motivo="velocidad"
      # ⚠️ "ambas rodadas" es obligatorio: 06_Peatonal lleva limite_vel=0,
      #    y peatonal(0) x calle(50) da un salto de 50 que NO es un desnivel.

  # ---- 4. POR DEFECTO ----
  -> CONECTAR, y MARCAR el nodo como "unido-por-defecto"        # D2: el error es contable

  # ---- 5. LA JERARQUIA NO VOTA ----
  # tipo 01_CINTURON / 02_Penetracion: solo se anota en la lista de revision.
  # Medido: 4 falsos positivos y 0 aciertos en la travesia de la Carretera de Huesca.
```

**No hace falta una regla especial para zonas** (C4): la cláusula 1 las resuelve.

### E3 · Cuántas excepciones manuales — **decenas, no cientos**

```
4 km2 medidos · 7.114 puntos de cruce · 115 a distinto nivel
  cazados por bridge/tunnel/layer   113
  ESCAPADOS                           2   (y son un unico defecto de OSM, en un punto)
  falsos positivos                    0
```

⚠️ **EXTRAPOLACIÓN, no dato.** Las cuatro ventanas se eligieron **por difíciles** (estación,
travesía, paso inferior, avenida con pasarelas): están sesgadas hacia el desnivel, así que la tasa
real en el resto de la ciudad debería ser **menor**, no mayor. Con 2 excepciones en 4 km² de las
zonas peores, el fichero versionado de P6.2 aguanta de sobra y **H1 puede arrancar**.

⚠️ Y no se da porcentaje de cobertura de la ciudad: **no sabemos la superficie urbana total**, y
inventarse el denominador es la ley nº1 de este proyecto.

### E4 · ⭐ QUÉ MEDIR SOBRE EL GRAFO COMPLETO — el plan, no la intención

| # | Barrido (COMPLETO, no muestra) | Contraprueba obligatoria | Qué lo pone rojo |
|---|---|---|---|
| 1 | Todos los cruces de los 3.644 tramos municipales, clasificados por la regla | Plantar un `bridge` falso en un cruce conocido a nivel | Debe aparecer en la lista de "no unidos" |
| 2 | **Contar los `unido-por-defecto`** | Contar también los "no unidos": si uno de los dos es 0, el clasificador no discrimina | 0 en cualquiera de los dos cubos |
| 3 | Componentes conexas antes y después de aplicar la regla | Grafo sin regla (todo unido) como línea base | Si la regla sube el nº de componentes >1 %, mira |
| 4 | Los 46.150 portales enganchados, con su distancia y su lado | Los 807 ya medidos deben dar 84,5 % otra vez | Desviación >2 pp = el barrido cambió algo |
| 5 | Cruces peatonal×peatonal sin marcar en TODA la ciudad | La tasa medida es 0,05 %: si sale 0,00 %, el detector está roto | 0 exacto, o >1 % |
| 6 | Los pares de la prueba de ríos (12) y el control del mismo lado | — | Cualquiera que falle |

⭐ **La cola se mira a mano:** los `unido-por-defecto` se ordenan por **ángulo de cruce y diferencia
de velocidad**, y los 50 peores los verifica Antonio sobre el terreno. Los que pasan no enseñan
nada.

### E5 · ⚠️ EL CASO QUE NO ENCAJA

Buscados a propósito. Seis:

1. ⭐⭐ **La cláusula 1 no existe para el dato municipal.** Toda la solidez de la regla en OSM viene
   del nodo compartido, y la capa municipal **no tiene ninguno** — es el problema original del
   proyecto. En la parte municipal la regla sigue siendo **pura inferencia**, y ahí su único
   criterio es un salto de velocidad que **el paso inferior de Alierta ya demostró que falla**
   (50 contra 50).
2. ⭐ **La plataforma elevada es indistinguible de un cruce en la capa municipal.** Si el grafo
   rodado sale del municipal y ahí hay una plataforma, se planariza y se fusiona. La única defensa
   es no planarizar donde OSM declare `layer` — y eso **hace que la calidad del grafo municipal
   dependa de la cobertura de OSM**, que no está medida.
3. **Pirineos da 7 puentes donde el conocimiento de campo dice que hay más.** O el encuadre falla o
   OSM no los tiene. Sin resolver.
4. **`building_passage` y `culvert` obligan a listas blancas de valores.** Hoy son 2 excepciones
   conocidas; OSM tiene más valores y aparecerán. Una lista blanca es una promesa de mantenimiento.
5. ⚠️ **Cero ascensores mapeados** en una estación con plataforma elevada. Para el nivel 2 la ruta
   dirá "sube por las escaleras" siempre, y no sabrá si hay alternativa.
6. **Las cuatro ventanas son de tres fechas distintas** (mayo, junio, agosto). Las conclusiones
   cruzan hasta tres meses de dato.

---

## F · PETICIONES Y CRUDOS

**13 de 14.** Desglose:

| # | Consulta | Instancia | Resultado |
|---:|---|---|---|
| 1 | control positivo `tunnel` (Delicias) | principal | ⛔ 504 |
| 2 | ⭐ discriminador: la consulta que ayer funcionó | principal | ✅ 200 · **0,65 s** |
| 3 | `tunnel` Delicias + `out geom` | principal | ✅ 200 · 53 KB |
| 4 | repetición exacta de la nº1 | principal | ⛔ **429 `rate_limited`** |
| 5 | `/api/status` | principal | ✅ `Rate limit: 2` |
| 6 | Alierta, todas las vías | principal | ⛔ 504 |
| 7 | `/api/status` | principal | ✅ 2 slots libres |
| 8 | Alierta, reintento tras 60 s | principal | ⛔ 504 |
| 9 | Alierta, sólo `tunnel` | principal | ⛔ 504 |
| 10 | Alierta, cuarto intento | principal | ⛔ 504 |
| 11 | ⭐ Alierta `tunnel`, **réplica** | private.coffee | ✅ 200 · 13 KB · 81 s |
| 12 | Alierta, todas las vías | private.coffee | ✅ 200 · 1,05 MB |
| 13 | Pirineos, todas las vías | private.coffee | ✅ 200 · 684 KB |

**Sobra 1.** Y **cero peticiones** costaron las secciones C y D enteras: salen del crudo de ayer.
La localización de las dianas también fue local, con los portales del callejero.

⚠️ **Seis 504 y un 429.** La ley nº32 de la bitácora atribuía esos 504 a la forma de la consulta;
**hoy queda refutada** (bitácora nº34): fallan igual las sentencias únicas, y `/api/status` decía
tener slots libres justo después de un 504. **La causa queda `CAUSA NO CONFIRMADA`.** Lo único
verificado: el servicio alterna, y reintentar más tarde o en otra réplica funciona.

**Crudos añadidos** (ninguno sustituido, extensión según el contenido real):

```
2026-08-02_osm_overpass_control-positivo-tunnel-delicias.json   52 KB  ✅
2026-08-02_osm_overpass_alierta-torres_tuneles.json             13 KB  ✅
2026-08-02_osm_overpass_alierta-torres_todas-vias.json        1.024 KB ✅
2026-08-02_osm_overpass_pirineos_todas-vias.json               668 KB  ✅
2026-08-02_osm_overpass_api-status.txt                          .2 KB  (cuota)
2026-08-02_osm_overpass_tunnel_HTTP429-limite-peticiones.html   703 B   (error)
2026-08-02_osm_overpass_control-tunnel_HTTP504-intento1.html    695 B   (error)
2026-08-02_osm_overpass_alierta_HTTP504-sin-slot.html           695 B   (error)
2026-08-02_osm_overpass_alierta_HTTP504-intento2.html           695 B   (error)
2026-08-02_osm_overpass_alierta-tuneles_HTTP504-intento3.html   695 B   (error)
```

### ⭐ El control positivo, que **no lo elegí yo**

El número esperado salía del volcado completo de ayer, no de mi criterio:

```
consulta   : way["tunnel"](bbox Delicias);  out geom;
respuesta  : 56 elementos  ->  40 ferroviarios + 15 service + 1 footway
volcado de ayer (way["highway"]) decia:      16 tuneles de tipo highway
15 + 1 = 16   ✅ COINCIDE EXACTAMENTE
```

Dos consultas independientes, dos días, el mismo número. Los 40 ferroviarios no estaban en el
volcado de ayer **porque aquella consulta no pedía `railway`**: la diferencia también se explica.

---

## G · QUÉ NO HE MIRADO

- **Nada municipal.** Cero peticiones al WFS. Todo lo municipal es **inferencia desde OSM**.
- **La Avenida Pirineos completa**: sólo 1 km² centrado en sus 4 portales.
- **El resto de la plataforma elevada de Delicias**, que se sale de la ventana.
- **Relaciones OSM** (`type=restriction`, multipolígonos): sólo se han pedido *ways*.
- **Etiquetas de nodo** (`highway=crossing`, `kerb`, `elevator` como nodo): `out geom` devuelve la
  geometría de los ways, no las etiquetas de sus nodos. ⚠️ Los ascensores podrían estar mapeados
  como nodos y no los vería.
- **El resto de valores de `tunnel` y `bridge`** que OSM admite y aquí no han salido.

---

*Anexo escrito el 2026-08-02. 13 peticiones a Overpass, ninguna a otro servicio. Nada construido.*
