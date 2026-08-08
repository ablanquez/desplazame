# H1 · ¿DE QUÉ CALLE ES ESTA ACERA?

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 1 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `412` | **438** | ⛔ **republicación PENDIENTE** · 2026-08-08 · medido y atado en la tanda 2·bis (bitácora 171) |
>
> <sub>los metros sin nombre de la ruta nº6 (§A6)</sub>
<!-- SUPERADOS:FIN -->

*Tanda 17 · 2026-08-04 · idea de Antonio: «si una línea la tenemos sin nombre, ¿no se puede deducir
a partir de esos puntos el nombre de la vía?».*

> ⛔⛔ **Esto es una CAPA DE PRUEBA. NO toca el motor y NO cambia ningún nombre.** `src/ruta.js`, el
> planarizado, el enganche y `src/relato.js` salen de esta tanda byte a byte como entraron: la
> auditoría de H1 revisa exactamente lo que iba a revisar. Aplicarlo —si se aplica— es decisión de
> Antonio y va DESPUÉS de la auditoría.

> **Este documento se AÑADE, no reescribe nada.**

```
node src/nombrar-aceras.js      # todo lo de aquí  (sale en código 1, y por qué está en §B2b)
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⛔⛔ el ejemplo que motivó la tanda NO se arregla** | `Coso 33 → Plaza San Francisco`: de sus **4 tramos sin nombre que molestan (779 m, el 41 %)**, el método nombra **uno de 12 m**. La acera de 499 m sigue muda con las dos unidades probadas. |
| **⭐ dónde sí funciona** | En las **siete rutas de Antonio** nombra **1.159 m de 3.851 sin nombre (30,1 %)**, con la unidad *way*. En la ciudad entera, el 6,3 % de los metros. |
| **⭐ cuando habla, acierta** | **76,7 %** por arista y **80,9 %** por way, contra un azar entre las vías cercanas del **18,5 %**. Y **es un techo**, dicho en §C2. |
| **⭐⭐ y ese 76,7 % está MEDIDO A LA BAJA** | El **56,8 %** de los «fallos» son la misma calle con otro nombre: `Calle de León Felipe` contra `poeta leon felipe`. No es el método: es el normalizador, que quita tipos de vía y artículos pero no títulos. |
| **⚠️⚠️⚠️ el riesgo con nombre y apellidos** | En la ruta nº7 le pondría **«Calle de San Juan de la Peña» a 760 m de CARRIL BICI**, con 37 votos de 44. El apoyo es altísimo y la frase sería falsa. **Ningún umbral de acuerdo caza esto**: el acuerdo mide si los portales coinciden, no si la línea es una acera. |
| **⭐ la circularidad, medida** | De los **23 enganches imputables** de la tanda 14, el método nombra 17 aristas — pero solo **0** de ellas gracias al portal malo. De los 198 con firma, **1**. La mayoría tapa el error suelto. |
| **⚠️ lo que sale mal (mío)** | Bitácora nº93: **declaré un invariante de ×3 sin medir el mando del que dependía**, y salió ×2,6. El guardián se queda en rojo y el umbral no se toca. |

---

## A · LAS ARISTAS SIN NOMBRE

### A1 · El número, y los metros

```
   aristas del grafo de la ciudad                             98774
   ⭐ …sin nombre en OSM                                       58354  (59.1 %)
   metros de red                                              6500.0 km
   ⭐ …sin nombre                                              3991.1 km  (61.4 %)
   aristas transitables a pie                                 94570  (5931.6 km)
      …sin nombre                                             56679  (59.9 % · 3803.4 km)
```

⚠️ **«Sin nombre» = el way de OSM no trae `name`.** NO significa que la calle no tenga nombre en la
realidad: significa que este dato no lo dice.

### A2 · Clasificadas antes de contarlas (ley 29)

```
   precisión (D4)                   aristas      metros  % de los metros   ¿le falta el nombre?
   eje-de-calzada                     22175   2999.6 km           75.2 %   ⭐ SÍ
   peatonal                           15958    672.2 km           16.8 %   ⭐ SÍ
   acera                              10032    267.1 km            6.7 %   ⭐ SÍ
   paso-de-peatones                    9393     42.2 km            1.1 %   ⛔ NO: el relato ya dice qué es
   escaleras                            724      7.6 km            0.2 %   ⛔ NO: el relato ya dice qué es
   eje-con-acera-declarada               72      2.5 km            0.1 %   ⭐ SÍ
```

⭐⭐ **La separación entre «molesta» y «no molesta» NO es de longitud —eso sería un umbral mío—: es
SEMÁNTICA, y sale del redactor que ya existe.** Un paso de peatones se cuenta *«Cruzas por un paso de
peatones»* y unas escaleras *«Subes o bajas unas escaleras»*: el nombre no les hace falta y no lo
llevan en ninguna ciudad. Todo lo demás se cuenta *«Por un tramo sin nombre»*, y ahí sí falta.

⇒ **48.237 aristas sin nombre que molestan · 3.941,4 km.**

Y el 55 % de esos metros están en aristas de **250 m o más**, que en su mayoría son `track` (2.045 km,
el 51,9 %): **caminos de campo**. Ése es el aviso de escala de toda la tanda — *el número de la
ciudad entera no es el número que decide*.

### A3 · Por zona

```
   zona                                aristas  sin nombre  % aristas  metros sin nombre  % metros
   casco histórico                        6984        3012     43.1 %            40.7 km    24.9 %
   ensanche (Gran Vía · Sagasta)          5918        3107     52.5 %            53.4 km    37.9 %
   periferia · Valdespartera              1445         592     41.0 %            26.3 km    34.9 %
   periferia · Actur-Rey Fernando         8514        4665     54.8 %           134.7 km    47.0 %
   polígono · Malpica-Santa Isabel        1309         725     55.4 %            70.3 km    54.3 %
   polígono · PLAZA                       2910        2328     80.0 %           192.7 km    66.7 %
   rural · Movera                          705         442     62.7 %            35.6 km    59.2 %
   rural · Garrapinillos                   424         210     49.5 %            38.9 km    61.1 %
   (fuera de las ventanas)               70565       43273     61.3 %          3398.5 km    64.2 %
```

**No es un problema del casco ni de la periferia: es de toda la ciudad**, entre el 43 % y el 80 % de
las aristas según la zona. Lo que cambia es el peso en metros — en el casco solo el 24,9 %.

### A4 · Cuántas tienen portales pegados

⛔ **«Pegado» NO lleva radio, y eso es a propósito.** Un radio a ojo sería un umbral mío escondido en
la definición. **«Pegado» = el enganche de ese portal cayó en esta arista** — la relación que el motor
ya calculó, leída al revés. Es literalmente la idea de Antonio.

```
   aristas sin nombre que molestan                            48237  (3941.4 km)
      …con AL MENOS UN portal pegado                          3868  (8.0 % · 383.2 km)
      …con al menos 3 con nombre municipal (el mínimo)        1337  (2.8 % · 179.9 km · 4.6 % de los metros)

   portales pegados a una arista sin nombre                   11813
   mediana · p90 · p99 · máximo             3.9 m · 19.2 m · 69.4 m · 118.9 m
```

⚠️ **Ese 2,8 % es la condición de partida, y ya avisa de dónde acaba esto.**

---

## B · EL MÉTODO, Y SU CONTRAPRUEBA ANTES QUE SU RESULTADO

### B1 · El método, escrito antes de ejecutarlo

`src/heredar-nombre.js`, 130 líneas, sin dependencias:

1. Los portales de una arista son **los que engancharon a ella**. Sin radio.
2. Cada portal vota el **núcleo de su calle según el `codigoVia` municipal**.
   ⭐ El nombre viene del **Ayuntamiento**, no de OSM: es otra fuente. Eso es lo que hace la idea de
   Antonio más fuerte que la mía (heredar de la arista vecina sería OSM contra OSM).
3. Con **menos de 3 votos → MUDA**.
4. Si el más votado llega al **67 % → NOMBRADA**. Si no → **AMBIGUA**.
5. Los empates no llevan regla aparte: un 2–2 da 50 % y cae solo en AMBIGUA.

**De dónde salen los dos umbrales:**

- **`MIN_PORTALES = 3`** — ⭐ no me lo invento: es el mismo listón que `src/enganche.js` puso en la
  tanda 6 para el consenso de la nube (*«con uno o dos, "la mayoría" es una palabra grande para
  nada»*). Un umbral heredado de otra pregunta no está elegido para que salga bien ésta (ley 17).
- **`ACUERDO = 2/3`** — ⚠️ **éste sí lo elijo yo**, y por eso va dicho. Con el mínimo de tres
  portales, 2/3 son «dos de tres»: la mayoría más floja que se admite. La curva entera está en §C1.

### B2a · ¿Puede el método estar leyendo el nombre que se supone tapado?

Es el fallo nº92 —**un espejo**— con otro disfraz. **Dos defensas independientes:**

1. **ESTRUCTURAL** · el método recibe una proyección de tres campos: `{arista, nucleoMunicipal,
   dEnganche}`. **El campo `nucleoOsm` no llega: no se puede leer lo que no existe.**
2. **MECÁNICA** · un **cepo** sobre `g.nombres.get` durante toda la evaluación.

```
      ⭐ el cepo salta cuando se le provoca (su ROJO, visto)   ✅ sí
      evaluación completa con el cepo puesto                  ✅ el método no leyó ni un nombre de OSM
```

⭐ **Al cepo se le ve el rojo ANTES de fiarse de él.** Un guardián cuyo rechazo nadie ha provocado es
una promesa, no una red — y un cepo que no salta haría pasar la prueba a cualquiera.

### B2b · ⚠️⚠️ Los dos barajados, y el invariante que declaré y NO se cumple

**El álgebra, escrita antes de ejecutar (ley 51):** con los nombres sacados de un bombo de ~3.000
vías, la probabilidad de que 2 de 3 portales coincidan es ~3/3.000 ≈ 0,1 %. ⇒ **el barajado GLOBAL
tiene que derrumbarse por aritmética**. Si sale alto, el método está roto; si sale ≈0, no he
demostrado gran cosa. **Por eso el que decide es el LOCAL** —permutar los nombres solo entre portales
de la misma celda de 300 m—: ahí los nombres siguen siendo los de la zona y siguen agrupados.

```
      experimento                          opina sobre    ACIERTO   nombra (sin nombre)
      el método, tal cual                3781 de 40168     76.7 %         1310  (2.7 %)
      ⛔ barajado GLOBAL (control negativo)    6 de 40168      0.0 %            6  (0.0 %)
      ⛔⛔ barajado LOCAL (celdas de 300 m)  903 de 40168     29.7 %          527  (1.1 %)
```

**Declaré antes de mirar que el local tenía que caer al menos ×3. Salió ×2,58. El guardián se queda
en ROJO y el umbral no se toca** — moverlo sería ajustar el instrumento al resultado, que es el nº88
y el nº91 por tercera vez.

⚠️ **Lo que sí se puede hacer es medir el mando que puse a ojo** (post-hoc, y va dicho):

```
      celda del barajado local           opina    ACIERTO    razón contra el método
      50 m                                2985      70.4 %                      ×1.1
      100 m                               1851      51.4 %                      ×1.5
      300 m                                903      29.7 %                      ×2.6
      1000 m                               386      12.4 %                      ×6.2
      3000 m                               197       2.5 %                     ×30.2
```

Con celdas pequeñas, **barajar dentro de la celda no baraja nada**: una celda de 50 m es una calle, y
permutar los nombres de una calle consigo misma devuelve la misma calle. ⇒ **el ×2,6 es un SUELO de
la separación, no su valor** — pero eso no rescata el invariante: lo que declaré fue ×3 y salió
menos. **Bitácora nº93.**

### B2c · La línea base

```
      aristas evaluadas (las mismas que el método nombra)     3755
      vías distintas a menos de 100 m (media)                 6.1
      ⭐ ACIERTO DEL AZAR entre las vías cercanas              695 de 3755  (18.5 %)
```

⇒ **76,7 % contra 18,5 %.** Sin esta línea, un 76,7 % no se sabe si es alto o si es lo que sale solo.

### B2d · ⭐⭐⭐ LA CIRCULARIDAD — la trampa de esta tanda

El enganche decide a qué arista va cada portal, y el método usa esos portales para nombrar esa
arista. **Si el enganche está mal, el método le pone a la acera el nombre equivocado y el resultado
se autoconfirma.**

⇒ Se cogen los que **sabemos** mal enganchados: los 198 con firma y los 23 imputables de la tanda 14.
⚠️ Aquí se **reimplementa** ese criterio, así que primero tiene que reproducir 198 y 23 — ése es su
positivo de control, y cuadra.

```
      los 198 con firma          n=198   NOMBRADA 126 (63.6 %)   AMBIGUA 11   MUDA 61
                                 ⚠️ el nombre que sale es el de la calle del portal sospechoso: 114
                                 ⛔⛔ …y sale PORQUE ese portal está: 1

      los 23 imputables al motor  n=23   NOMBRADA 17 (73.9 %)    AMBIGUA 2    MUDA 4
                                 ⚠️ el nombre que sale es el de la calle del portal sospechoso: 16
                                 ⛔⛔ …y sale PORQUE ese portal está: 0
```

⭐ **La circularidad existe pero es pequeña, y se sabe por qué:** el método exige tres votos, así que
un portal mal enganchado solo manda si está **solo**. En 0 de los 23 casos imputables y en 1 de los
198 el nombre depende del portal sospechoso. En los demás, **la mayoría tapa el error suelto** — que
es exactamente lo que un consenso debe hacer.

⚠️ **Lo que esto NO dice:** que el método sea inmune a un enganche malo. Dice que es inmune a **los
enganches malos que sabemos detectar**. Si hay un modo de fallo que se lleva a los tres portales a la
vez —el fallo correlacionado de la tanda 15—, este experimento no lo ve, porque no tenemos ninguna
lista de esos casos.

### B3 · Los tres resultados

```
   resultado        aristas        %      metros   % metros
   NOMBRADA            1310    2.7 %    174.9 km      4.4 %
   AMBIGUA               27    0.1 %      4.9 km      0.1 %
   MUDA               46900   97.2 %   3761.5 km     95.4 %
```

⚠️ **27 ambiguas de 1.337 evaluables (2,0 %) es poco, y hay que decirlo.** No es cero —lo cual habría
sido imposible en una ciudad con esquinas— pero tampoco es el reparto que uno esperaría. La
explicación medida: una acera sin nombre suele recibir portales de **una sola** calle, porque los de
la calle de enfrente enganchan a **su** acera. Ejemplos reales:

```
      arista 24396 (413 m, eje-de-calzada): medio ×4 · cascajares ×3
      arista 32466 (752 m, eje-de-calzada): galan bergua grp ×6 · barrio canon ×4
      arista 53571 (130 m, peatonal): estudiantes ×4 · martincho ×3
```

### B3b · ⭐⭐ La misma idea con otra unidad: el WAY en vez de la arista

⚠️ **Post-hoc, y va dicho:** esto se escribe después de ver el 97,2 % de mudas y su porqué (§D1b).
⛔ **Los umbrales no se tocan** (3 votos, 2/3). Lo único que cambia es la unidad: una arista es un
trozo que cortó el planarizado; el **way** es como OSM dibujó la acera, y es la unidad con la que el
redactor **ya** agrupa los tramos.

```
   unidad            NOMBRADA      metros  % metros   ·   acierto  cobertura   (patrón de verdad)
   arista                1310    174.9 km     4.4 %   ·    76.7 %      9.4 %
   ⭐ way                 3001    247.9 km     6.3 %   ·    80.9 %     22.3 %
                    AMBIGUA 367 · MUDA 44869
```

**La cobertura se multiplica por 2,4 y el acierto sube 4 puntos.** ⚠️ Y no es gratis: un way largo
puede recorrer dos calles y llevarse un solo nombre para los dos trozos. Lo que dice si eso pasa
mucho o poco es el acierto de la derecha, medido con el mismo patrón — y sube, no baja.

### B4 · De qué depende

```
   longitud de la arista           aristas    opina  cobertura   ACIERTO
   1 · < 25 m                        20004       62      0.3 %    74.2 %
   2 · 25–50 m                        7510      654      8.7 %    78.9 %
   3 · 50–100 m                       7138     1715     24.0 %    76.5 %
   4 · 100–250 m                      4009     1116     27.8 %    79.2 %
   5 · ≥ 250 m                        1507      234     15.5 %    61.1 %

   portales pegados                aristas    opina  cobertura   ACIERTO
   1 · 3–4                            1666     1650     99.0 %    74.1 %
   2 · 5–9                            1318     1293     98.1 %    81.7 %
   3 · 10–19                           648      630     97.2 %    74.3 %
   4 · 20 o más                        220      208     94.5 %    74.0 %

   precisión (D4)                  aristas    opina  cobertura   ACIERTO
   acera                              6826      856     12.5 %    90.5 %
   eje-con-acera-declarada            2346      396     16.9 %    87.9 %
   eje-de-calzada                    24253     1846      7.6 %    66.6 %
   peatonal                           5557      683     12.3 %    80.2 %
```

⭐⭐ **La fila que importa: sobre `acera` el acierto es del 90,5 %, y sobre `eje-de-calzada` del
66,6 %.** Justo donde la idea sirve —las aceras, que son el caso que Antonio vio— es donde mejor
funciona. Y **más portales no es mejor**: la cobertura ya es del 99 % con 3–4, y el acierto no sube.

Por zona va del **94,7 % (casco)** al **31,6 % (Garrapinillos)**. ⚠️ Garrapinillos con 76 casos: en
un pueblo del término las calles del callejero municipal y las de OSM se parecen menos.

---

## C · CONTRA EL PATRÓN DE VERDAD

### C1 · Tapar el nombre a las que sí lo tienen

⚠️ El nombre se compara **por NÚCLEO**, no byte a byte: el normalizador es `P.nucleo()` de
`src/portales.js`, **el mismo que usa el enganche desde la tanda 6**. `CALLE MAYOR` y `Calle Mayor`
son el mismo núcleo; `Calle Mayor` y `Don Jaime I` no. ⛔ No es un emparejador aproximado: eso ya
falló en el 29,6 % del dataset heredado.

```
   aristas CON nombre en OSM                                  40420
      …con núcleo comparable (no vacío)                       40168  (se descartan 252, p.ej. «Gran Vía»)

   cubo                     aristas  % del patrón
   ACIERTA                     2901         7.2 %
   FALLA                        880         2.2 %
   NO OPINA · ambigua            71         0.2 %
   NO OPINA · muda            36316        90.4 %

   ⭐⭐ ACIERTO CUANDO OPINA        2901 de 3781  (76.7 %)
      COBERTURA                                    9.4 %
```

**La curva del umbral**, publicada para que se vea de qué depende. ⛔ El número que vale es el de
0,67, fijado antes de mirar:

```
   acuerdo exigido          opina   cobertura   ACIERTO
      0.50                   3843       9.6 %    76.1 %
      0.60                   3811       9.5 %    76.4 %
   ⭐ 0.67                    3781       9.4 %    76.7 %
      0.75                   3668       9.1 %    77.3 %
      0.90                   3440       8.6 %    77.6 %
      1.00                   3356       8.4 %    77.7 %
```

⭐ **El umbral casi no manda**: entre exigir la mitad y exigir la unanimidad hay 1,6 puntos de
acierto. Eso es tranquilizador respecto a mi elección — y también dice que **subir el listón no
arregla los fallos**, porque los fallos son unánimes (ver §C4).

### C2 · ⚠️⚠️ El sesgo, declarado — y hay DOS

**Primero, el que pedía el encargo:** las aristas **con** nombre no son una muestra al azar de las
que **no** lo tienen. Una acera con nombre está en una calle que alguien se molestó en mapear bien.
⇒ **el acierto de C1 es un TECHO, no una estimación.**

**Y hay un segundo techo, más duro, que no se arregla con ninguna muestra:** el método vota con
`codigoVia` sobre los portales que el **enganche** asignó. Sobre una arista con nombre, «acertar» es
casi la misma pregunta que *«¿concuerda el `codigoVia` con el nombre de OSM?»* — que es la
**salvaguarda 1 del enganche**.

```
   portales donde el `codigoVia` CONCUERDA con OSM         25120  (73.7 %)
   …DISCORDA                                                8964  (26.3 %)
```

⇒ El 76,7 % del método está **tres décimas por encima** de la concordancia bruta del enganche
(73,7 %). Lo que el método añade sobre el testigo suelto es **la mayoría**, que tapa discordancias
aisladas. No es más que eso, y no hay que pedirle más.

### C3 · Acotar el sesgo

Se **pesa** el acierto de las aristas con nombre con el reparto de estratos de las aristas **sin**
nombre que el método nombraría. Estrato = zona × banda de portales pegados.

```
   acierto BRUTO sobre el patrón de verdad (C1)            76.7 %
   ⭐ acierto ESTANDARIZADO al perfil de las sin nombre     74.3 %
   peso sin estrato comparable (≥10 casos con nombre)      18 de 1310  (1.4 %)
```

⚠️ **Esto no elimina el sesgo: lo acota en las variables que miro.** Lo que hace que una calle esté
mapeada con nombre puede ser justo lo que no está ni en la zona ni en el número de portales. Lo que
se sabe es que **al reponderar por las dos variables medibles el acierto baja 2,4 puntos**, no
veinte.

### C4 · Dónde falla — y qué son de verdad esos fallos

```
   fallos totales sobre el patrón de verdad                   880
      …donde el nombre verdadero SÍ estaba entre los votos y perdió  39  (4.4 %)
      …donde ni siquiera aparecía                                   841  (95.6 %)
```

Diez fallos, sin elegirlos:

```
    117 m  eje-con-acera-declarada  VERDAD: Calle de los Jilgueros       MÉTODO: arzobispo casimiro morcillo  (13/13)
     97 m  eje-de-calzada           VERDAD: Calle del Arzobispo Casimir  MÉTODO: fernando antequera  (12/15)
    110 m  eje-de-calzada           VERDAD: Calle Doctor Lozano Monzón   MÉTODO: doctor ricardo lozano monzon  (7/7)
    105 m  eje-de-calzada           VERDAD: Calle de Domingo y Juan Fra  MÉTODO: francisco ripa  (10/10)
     61 m  peatonal                 VERDAD: Andador del Teniente Genera  MÉTODO: juan carlos i  (4/4)
     76 m  peatonal                 VERDAD: Calle de León Felipe         MÉTODO: poeta leon felipe  (3/3)
    154 m  acera                    VERDAD: Calle de Gabriel Celaya      MÉTODO: poeta gabriel celaya  (4/4)
     94 m  eje-de-calzada           VERDAD: Calle de García Arista       MÉTODO: gregorio garcia arista  (3/3)
     84 m  eje-con-acera-declarada  VERDAD: Calle Juan José Rivas        MÉTODO: doctor juan jose rivas  (7/7)
```

⭐⭐ **Mirarlos uno a uno cambia lo que significan.** `Calle de León Felipe` contra `poeta leon
felipe`, `Calle de Gabriel Celaya` contra `poeta gabriel celaya`, `Calle Juan José Rivas` contra
`doctor juan jose rivas`: **eso no es la calle equivocada, es la misma calle** con el nombre largo
del Ayuntamiento contra el corto de OSM. El normalizador quita el tipo de vía y los artículos, **no
los títulos**.

Medido (post-hoc, y va dicho), con su control:

```
   ⭐ un núcleo CONTIENE al otro (la misma calle, otro nombre)  500 de 880  (56.8 %)
   comparten alguna palabra pero no se contienen                43  (4.9 %)
   ⛔ no tienen nada que ver: la calle equivocada de verdad     337  (38.3 %)
   ⭐ CONTROL · el mismo test sobre parejas de vías AL AZAR     3 de 19992  (0.0 %)  ✅
```

⇒ **El acierto de C1 está medido a la baja.** Si las variantes contaran como acierto sería el 89,9 %.
⛔ **No se publica ese número y no se toca el normalizador**: es el del enganche, y esta tanda
prometió no tocar el motor. Se dice cuánto pesa y se deja. ⭐ **Pero es un cabo concreto y barato**
para después de la auditoría.

Los **337 fallos de verdad** son avenidas y calles paralelas: `Calle de los Jilgueros` nombrada
`arzobispo casimiro morcillo` con 13 votos de 13 — trece portales que enganchan a la calle de al
lado. **Y son unánimes, por eso subir el umbral no los arregla.**

---

## D · QUÉ CAMBIARÍA — sin cambiarlo

### D1 · ⭐⭐ El ejemplo de Antonio, entero

`Coso 33 → Plaza San Francisco`. La ruta se resuelve con `G.rutaEntre` —la misma función del motor—
y se **cuadra** contra `node src/ruta.js … --json`: **1891,0 m contra 1891,0 m.**

```
    nº  lo que dice hoy                               metros   por ARISTA                ⭐ por WAY
     1  Por un tramo sin nombre (acera)                 12 m   — NADA (0 amb · 1 muda)   «coso» (1/1)
     2  Por Calle del Coso (calle peatonal)             11 m
     3  Por un tramo sin nombre (acera)                499 m   — NADA (0 amb · 14 muda)  — NADA (0 amb · 14 muda)
     4  Por un tramo sin nombre (calle peatonal)        83 m   — NADA (0 amb · 2 muda)   — NADA (0 amb · 2 muda)
     5  Cruzas por un paso de peatones de Plaza Ara      2 m
     6  Por Paseo de la Independencia (eje de calza    108 m
     7  Por Plaza Basilio Paraíso (eje de calzada)      53 m
     8  Por Gran Vía de Santiago Ramón y Cajal (cal    450 m
     9  Por Gran Vía de Santiago Ramón y Cajal (eje    141 m
    10  Por Paseo de Fernando el Católico (eje de c    342 m
    11  Cruzas por un paso de peatones                   4 m   — NADA (0 amb · 1 muda)   — NADA (0 amb · 1 muda)
    12  Por un tramo sin nombre (acera)                185 m   — NADA (0 amb · 10 muda)  — NADA (0 amb · 10 muda)
```

⛔⛔ **De los 779 m sin nombre que molestan, el método nombra 12.** El tramo de 499 m —el tercio del
recorrido que Antonio señaló— sigue mudo con las dos unidades.

⚠️ El encargo decía «3 tramos, 696 m, el 37 %». Son los tres marcados `(acera)`, y 696/1.891 = 36,8 %:
es la misma ruta. Los otros dos que salen aquí son un tramo peatonal de 83 m y un paso de 4 m.

### D1b · ⚠️⚠️ Por qué sale mudo — y no vale con decir «no hay portales»

Radio de **diagnóstico** de 25 m (⛔ el método no tiene radio; esto es para mirar):

```
      tramo 3 · 499 m · acera · 14 arista(s)
         portales ENGANCHADOS a estas aristas              2
         portales a menos de 25 m de ellas                19
         ⇒ esos portales engancharon a:
               15  (arista sin nombre)
                2  Calle del Coso
                1  Pasaje Palafox
                1  El Caracol

      tramo 12 · 185 m · acera · 10 arista(s)
         portales ENGANCHADOS a estas aristas              4
         portales a menos de 25 m de ellas                 8
         ⇒ esos portales engancharon a:
                8  (arista sin nombre)
```

⭐⭐ **Ésta es la respuesta, y no es «faltan portales»: en el tramo 3 hay 19 portales a 25 m y solo 2
cuelgan de sus aristas.** Los otros 17 cuelgan de **otras aristas sin nombre** — las aceras de al
lado y las de enfrente. En un corredor como Independencia hay varias líneas peatonales paralelas
(acera, soportal, paseo central), y los portales se reparten entre ellas.

⇒ **El problema no es la falta de puertas: es que las puertas de una calle no cuelgan todas de la
misma línea.** Cambiar la unidad de arista a way ayuda en la ciudad (§B3b) pero **aquí no**, porque
las líneas paralelas son ways distintos.

### D2 · Las siete rutas de Antonio

⛔ **No se recalculan**: se piden a `rutas-antonio.js --aristas`, que es el único que las produce.

```
    ruta  metros motor  suma aristas  sin nombre  m sin nombre  m por ARISTA   m por WAY
       1          3087          3152          14           296           106         106
       2           598           634           0             0             0           0
       3          3705          3792          17           695             0           0
       4           506           708          18           589             0           0
       5           477           663           8           382           197         197
       6           523           644          10           412            92          95
       7          2529          2596          34          1478           369         760
   ─────────────────────────────────────────────────────────────────────────────────────
   TOTAL                                     101          3851           765        1159
```

⚠️ Los metros de aquí se suman sobre **aristas enteras**, y las dos de los extremos van cortadas por
el enganche; por eso al lado va el cuadre contra los metros del motor (la diferencia es ese corte).

**Y los nombres que saldrían, tal cual, sin elegirlos:**

```
    ruta  highway          metros   nombre heredado   (apoyo)
       1  footway             106   «pablo gargallo»   (3/3)
       5  footway             197   «principado morea»   (2/3)
       6  footway              95   «francisco quevedo»   (8/8)
       7  cycleway            760   «san juan pena»   (37/44)
```

⚠️⚠️⚠️ **MIRA LA ÚLTIMA FILA.** Son los **1.269 m de carril bici de la ruta nº7** —el que Antonio
confirmó que es su camino— y el método les pondría **el nombre de la calle paralela, con 37 votos de
44**. El apoyo es altísimo y la frase sería falsa: no vas por la acera de esa calle, vas por un
carril bici. **Y no lo caza ningún umbral de acuerdo: el acuerdo mide si los portales coinciden, no
si la línea es una acera.**

⚠️ Y la nº5: `principado morea` con **2 votos de 3** — el mínimo exacto del método. 197 m de texto
colgando de dos portales.

### D3 · ¿Merece la pena?

```
   ciudad · metros sin nombre que molestan                 3941.4 km
   ciudad · …nombrados por ARISTA                          174.9 km  (4.4 %)
   ciudad · …nombrados por WAY                             247.9 km  (6.3 %)
   siete rutas · sin nombre → ARISTA → WAY                 3851 m → 765 m (19.9 %) → 1159 m (30.1 %)
   ejemplo de Antonio · sin nombre que molesta             779 m, y se nombran 12
```

⭐⭐ **El número de la ciudad entera (6,3 %) NO es el número que decide**: está dominado por 2.045 km
de `track` en el campo, donde no hay portales ni falta hacen. **El número que decide es el 30,1 % de
las siete rutas** — y el 1,5 % del ejemplo que motivó la tanda.

### D4 · El riesgo de producto

Un nombre **heredado** no es un nombre **declarado**. Si el texto dice *«por la acera de Paseo de la
Independencia»* y es la acera de al lado, **la app miente con aplomo**, que es peor que callarse.
⇒ **Propuesta, no decisión** — distinguirlos en el texto y llevar el apoyo al lado:

- **declarado** → «Por Calle Santa Isabel (calle peatonal)»
- **deducido** → «Por una acera que **parece** de Calle Santa Isabel (8 de 9 portales)»
- **ambiguo** → «Por un tramo sin nombre, entre X e Y» — ⭐ la AMBIGUA también informa

⛔ **Decide Antonio, y después de la auditoría.**

---

## E · ⭐⭐ EL VEREDICTO, EN UNA FRASE

> **SIRVE, PERO SOLO EN CIERTAS CONDICIONES, Y NO EN LA QUE LO PIDIÓ:** cuando una acera recibe tres
> o más portales acierta el **76,7 %** por arista y el **80,9 %** por way —contra el 18,5 % del azar
> entre las vías cercanas, y con la circularidad medida en 0 de 23 casos imputables—, pero **eso solo
> pasa en el 22,3 % de las aristas** y **no pasa en el corredor de Independencia**, que es donde
> Antonio vio el problema: allí los portales se reparten entre las líneas paralelas y ninguna llega a
> tres.

**Y las condiciones, con su porcentaje de los metros sin nombre:**

| condición | acierto | cuántos metros |
|---|---|---|
| la arista es una **`acera`** | **90,5 %** | 6,7 % de los metros sin nombre |
| la arista es **`peatonal`** | 80,2 % | 16,8 % |
| la arista es **`eje-de-calzada`** | 66,6 % | 75,2 % — ⚠️ el grueso, y el peor |
| tiene **3 o más portales pegados** | ~76 % | 4,6 % de los metros (por arista) |

⇒ **Donde mejor funciona es donde menos metros hay**, y donde están los metros —los ejes de calzada
del campo y el polígono— es donde peor acierta y donde no hace ninguna falta.

---

## LO QUE SE BUSCÓ A PROPÓSITO Y NO SE ENCONTRÓ

- **Que el método estuviera leyendo el nombre tapado** (el espejo del nº92) — **no**: la proyección
  no lo lleva y el cepo, al que se le vio el rojo primero, no saltó en 40.168 evaluaciones.
- **Que la circularidad fuera grande** — **no**: 0 de 23 y 1 de 198. La mayoría tapa el error suelto.
- **Que no hubiera ni una AMBIGUA** (la costura del encargo) — **hay 27**, pocas, y con su porqué.
- **Que el umbral que elegí mandara mucho** — **no**: 1,6 puntos entre 0,50 y 1,00.

## LO QUE NO SE HA COMPROBADO

- **Que ninguno de los 1.310 nombres sea correcto sobre el terreno.** Nadie ha ido a mirar. Todo lo
  de aquí se mide contra OSM y contra el callejero, que son las dos fuentes que ya se usaban.
- **El fallo correlacionado**: si un modo de fallo se lleva a los tres portales de una arista a la
  vez, este trabajo no lo ve. No hay lista de esos casos (es el límite que dejó la tanda 15).
- **Si el patrón de verdad sesga por algo que no sea zona ni número de portales.** §C3 acota dos
  variables; puede haber más.
- **La variante por WAY no tiene su propia contraprueba de barajado.** Se mide contra el mismo patrón
  de verdad y nada más. ⚠️ Se declara: es una medida, no una validación completa.

## LOS DIEZ EJES

| eje | ¿tocado? |
|---|---|
| posición | ⭐ sí — dónde caen los portales respecto a la arista (§A4, §D1b) |
| vecindad | ⭐ sí — el barajado local por celdas (§B2b) |
| dirección | ⛔ **no** — no se ha mirado si la acera va en el mismo sentido que la calle |
| identidad | ⭐⭐ sí — es la pregunta entera: de qué calle es esta línea |
| correspondencia | ⭐ sí — `codigoVia` municipal contra `name` de OSM (§C2, §C4) |
| umbral/cola | ⭐ sí — la curva del acuerdo (§C1) y la del tamaño de celda (§B2b) |
| escala | ⭐ sí — arista contra way (§B3b), y bandas de longitud (§B4) |
| densidad | ⭐ sí — por zona (§A3, §B4) |
| agregación | ⭐⭐ sí — es el hallazgo de §B3b y §D1b |
| semántica | ⭐ sí — la separación «molesta / no molesta» (§A2) y `highway` (§D2) |

## LO QUE QUEDA ABIERTO

| # | cabo | estado |
|---|---|---|
| 1 | **Los títulos en el normalizador** (`poeta`, `doctor`, `gregorio`) — el 56,8 % de los «fallos» | medido, **no tocado**: es el normalizador del enganche |
| 2 | **El carril bici de la ruta 7 se llamaría «San Juan de la Peña»** | ⚠️ ningún umbral de acuerdo lo caza; haría falta una regla de `highway` |
| 3 | **El corredor de Independencia** — líneas paralelas entre las que se reparten los portales | sin resolver por ninguna de las dos unidades |
| 4 | **La variante por WAY sin contraprueba propia** | declarado |
| 5 | **Aplicarlo al motor** | ⛔ decisión de Antonio, y **después** de la auditoría |
