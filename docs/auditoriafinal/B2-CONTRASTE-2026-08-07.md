# AUDITORÍA DE CIERRE DE H1 · BLOQUE B.2 — EL CONTRASTE QUE FALTÓ

**Fecha de ejecución:** 2026-08-07
**Alcance:** las **2.062 afirmaciones marcadas** del censo v2, en los 44 documentos del alcance del
bloque B.
**Registro fechado. ⛔ No se reescribe.** Si algo de aquí resulta estar mal, se corrige en un
documento nuevo que diga qué corrige y por qué.

⛔⛔ **Esta tanda no ha arreglado ni un carácter.** Ni de `src/`, ni de un documento, ni del README.
Las siete rutas, idénticas.

⚠️ **Y no sale limpia.** Lo primero que se lee son los cuatro instrumentos míos que mintieron.

---

## 0 · ⭐⭐⭐ EL AUDITOR TAMBIÉN MIENTE — cuatro veces, y una casi publica un hallazgo inventado

> **Van primero porque el resto del documento descansa en ellos.** Bitácora 148-150.

### 0.1 · ⛔⛔ La cosecha de productores se tragó los números que las contrapruebas rompen a propósito

El mapa necesita saber qué números **produce hoy** el repositorio, así que se ejecutaron los 66
scripts de `src/` y se guardó lo que imprimen. **La mitad de los instrumentos de este proyecto
terminan rompiendo algo a propósito y publicando el número roto.** `numeros-congelados.js` imprime,
en su contraprueba:

```
   ⛔ mapa.azules: se publicó 51.493 y ahora sale 56.801  (+5308)
   ⛔ mapa.grises: se publicó 11.168 y ahora sale 0       (-11.168)
   ⛔ mapa.rojas:  se publicó 32.310 y ahora sale 38.145  (+5835)
```

…y a continuación: **`⇒ ✅ LA CONTRAPRUEBA: sin fallos. (código de salida 0)`**

**Qué estaba en verde mientras el fallo vivía:** ⭐⭐⭐ **el propio productor más fiable del
proyecto.** `numeros-congelados.js` acababa de decir *«NÚMEROS CONGELADOS: sin fallos»* y *«roturas
CAZADAS 2 de 2 ✅»*. Los contadores de la cosecha —66 ejecutados, 47 con salida— también. **Un
instrumento sano alimentando basura.**

**Cómo se cazó:** leyendo la salida de `numeros-congelados.js` antes de usarla, porque era el
productor del que dependía el control de semilla.

### 0.2 · ⛔⛔⛔ Y el arreglo hizo **cien veces más daño que el veneno** — y el daño iba a publicarse como hallazgo

El primer corte tiraba la salida «desde que anuncia una contraprueba». Medido así, el veneno costaba
**108 afirmaciones de clase R**, un 24 % de la clase. Iba a ir en el informe con ese número.

⛔ **Estaba al revés.** En este proyecto **la contraprueba va DELANTE** — `donde-falta.js` titula la
suya *«A0 · ⛔⛔ LA CONTRAPRUEBA QUE VA ANTES QUE NINGÚN NÚMERO»*. El corte empezaba en la línea **1**
de tres productores y **se llevaba su salida entera**.

Rehecho por línea, el daño real del veneno es **1 afirmación**. Las otras 107 **las produjo mi
arreglo**.

> ⭐⭐⭐ **Ley que sale de aquí: la medida del daño de un fallo se toma con el arreglo puesto, y el
> arreglo es un instrumento nuevo que nadie ha verificado.** Un «el fallo costaba 108» calculado con
> un parche recién escrito mide el parche.

### 0.3 · ⛔⛔ La clase «cita de fuente ajena» acertaba 5 de 14 — y era el censo v1 otra vez

El criterio saltaba si la línea mencionaba OSM, WFS, el Ayuntamiento o IDEZar cerca del número.
La muestra sistemática de 14 filas:

| dice | veredicto |
|---|---|
| «`univoca` coincide con OSM el **34,4 %**» | ⛔ es una medida NUESTRA |
| «**6,27 km** SOLO EN OSM» | ⛔ nuestra |
| «de las **313 líneas** de andar con carril bici municipal encima» | ⛔ nuestra |
| «**4.405 (160,72 km)** con OSM» | ⛔ nuestra |
| «Conjuntos que declaran formato WFS · **245**» | ✅ ajena |
| «Pedí `rows=1000` y el servidor contesta `rows: 500`» | ✅ ajena |

⇒ **En este proyecto OSM es el OBJETO de casi toda medición, no la fuente de la cifra.** El criterio
medía **el vocabulario de la frase**, no la naturaleza del número — que es exactamente por lo que
murió el censo v1. **Se retira entero**: 86 cifras vuelven a `?`.

### 0.4 · ⛔⛔ La clase FOTO acertó **1 de 10** y se declara fallida

Dos versiones, dos muestras, dos suspensos:

- **v1** (marca en cualquier parte de la línea): 3 mal de 12. En *«aparecen **17 túneles**, que en el
  casco eran 0»* el pasado es **del cero**, no del 17.
- **v2** (marca pegada al número, ±44 caracteres): **5 de 12**. `antes` casa en *«además está mucho
  antes»* —que es **espacial**, calle arriba—, en *«antes de leer ninguno»* —que es del método— y en
  la cabecera de columna `| antes (sin tope) |`.
- **v3** (solo marcas explícitas): **1 de 10.** *«paso de peatones»* casa con «pasó de», y
  *«Caduca 05/10/2026»* mete el `05` y el `10` como afirmaciones caducadas.

⇒ ⭐⭐ **No he sabido construir un criterio positivo de FOTO que sobreviva a su propia muestra.**
La clase se publica con su tamaño **1** —el único caso verificado a mano— y **todo lo demás que
pudiera ser una foto está en `?`**, que es donde va lo que no sé clasificar.

---

## 1 · ⭐⭐ EL MAPA — de cada afirmación, qué la produce

### 1.0 · El censo, reproducido — ⚠️ y no da 2.062

```
   hoy, sobre el árbol de trabajo            2.131   en 45 documentos
   sobre el árbol de 9747395 (ayer)          2.062   en 44 documentos   ✅ clavado
   ⇒ diferencia                              +69
```

**Los 69 son míos, y cuadran al token:** 64 del registro `B-DOCUMENTACION-2026-08-07.md` y 5 de las
entradas 145-147 de la bitácora, escritas **después** de correr el censo.

⚠️ **Y eso es en sí un hallazgo, aunque no sea del proyecto:** *el registro de la auditoría cae
dentro del alcance de la auditoría*, así que el denominador se mueve cada vez que se escribe. Se
trabaja sobre **el universo de ayer** —el que Antonio aprobó— y se declara. ⛔ Auditar mi propio
registro sería circular.

### 1.1 · Las cuatro clases, con su criterio positivo y su tamaño

| clase | criterio **positivo** | n | % |
|---|---|---:|---:|
| **R · REPRODUCIBLE** | existe hoy un script de `src/` que **imprime ese valor**, en una línea que comparte vocabulario con la del documento. **Se nombra el script y se guarda su línea.** | **531** | 25,8 % |
| **F · FOTO** | el documento dice con todas las letras que el número es de un estado anterior (`caducado`, `pasó de`, `ya no`, `sustituye`) | **10** *(1 tras leerlas)* | 0,5 % |
| **P · PROSA** | suelo o umbral declarado (`≥`, `más de`), ejemplo ilustrativo, identificador, coordenada | **13** | 0,6 % |
| **`?`** | **no lo he sabido clasificar** | **1.508** | **73,1 %** |

⛔ **`?` no es `NO CONSTA`.** `NO CONSTA` es *no se puede saber*; `?` es *no lo he sabido*. Son cosas
distintas y no se disfrazan la una de la otra.

### 1.2 · ⭐⭐ Dentro del `?` — para que no sea una caja negra

```
   su valor NO lo imprime hoy ningún productor          304
   su valor SÍ lo imprime alguno…                     1.204
     …y comparten alguna palabra (casi-R, faltó una)     354
     …y no comparten ninguna (coincidencia de valor)     850
   ⚠️ menores de 100 (probablemente no son medidas)       875
```

⇒ **354 son casi-R**: el número existe en la salida de un instrumento y el vocabulario no alcanzó
para nombrarlo con seguridad. Ésas son la siguiente tanda barata. Las **875 menores de 100** son
sobre todo porcentajes, índices de tabla y cuentas pequeñas.

### 1.3 · ⚠️ EL LÍMITE DE LA CLASE R, dicho antes de que lo encuentre nadie

**«Lo imprime un productor» no es «lo mide un productor».** Varios scripts imprimen números viejos
dentro de su propia prosa explicativa. El caso que lo enseñó:

```
   docs/H1-LISTONES.md:60   publica «LIMPIO · 51.028»                        ⇒ sale R
   src/medir-paridad.js:161 imprime  «⚠️ Y NO coincide con las 51.028 que la
                                       tanda 34 llamó «limpio»…»
```

El instrumento **está diciendo que ese número está mal** y mi mapa lo cuenta como productor.

```
   R totales                                                531
   ⚠️ cuya evidencia es una línea de PROSA del script          87   (16,4 %)
   ⭐ R con evidencia de línea de MEDIDA                      444
```

⇒ **R = 531 es un techo. El suelo defendible es 444.** Se publican los dos.

### 1.4 · Los productores que más afirmaciones sostienen

```
   medir-paridad.js 57 · donde-falta.js 41 · bici-inventario.js 40
   acera-equivocada.js 39 · orden-numeros.js 38 · nombrar-aceras.js 28
   candidatos-enganche.js 27 · medir-listones.js 25 · cerrar-punto-ciego.js 23
   ⇒ 36 productores distintos
```

⛔ **`acera-equivocada.js` sostiene 39 afirmaciones y es el instrumento que `A·V1` declara tocado**
(mide sobre el universo inflado por el centinela). Esas 39 quedan **MEDIDO CON INSTRUMENTO TOCADO**,
no verdes.

### 1.5 · ⭐ El control de semilla, y lo que descubre

> *«Si tu clasificador no marca esos 26 como R, está roto antes de empezar.»*

**De los 26 congelados, 13 aparecen en el censo v2 y el clasificador marca R los 13.** ✅

⚠️⚠️ **Los otros 12 no aparecen en el censo.** Con control positivo:

| congelado | veces en `docs/` | veces **marcado** |
|---|---:|---:|
| 68.649 · 94.570 · 378.222 · 32.310 · 3.803 · 36.113 · 4.424 · 145,94 · 1.235 · 1.153 · 4.155 · 56.801 | **31** | **0** |
| ⭐ control: 98.774 | 36 | **7** |
| ⭐ control: 4.562 | 23 | **11** |

⇒ Ver **`B2·V2`**.

---

## 2 · ⛔⛔ HALLAZGOS VIVOS

### `B2·V1` · ⚠️ El censo v2 —el denominador aprobado— deja fuera 12 de los 26 números más protegidos del proyecto

**Dónde:** la definición de trabajo del bloque B (negrita / cita `>` / conclusión `⇒`).
**Qué se apoya en ello:** **toda cobertura declarada sobre 2.062**, en B y aquí.
**Medido con:** `b1-titulares.js` sobre el árbol `9747395`, más un barrido de control con `grep`.

Los 12 congelados de arriba viven **en celdas de tabla de resultado sin negrita**. El censo v2
mide **lo que el proyecto SUBRAYA**, no **lo que el proyecto AFIRMA** — y resulta que **lo que más
se protege es justo lo que menos se subraya**: un número entra en `numeros-congelados.js` porque es
importante, no porque esté en negrita.

⛔ **Propuesta (sin aplicar):** no ampliar el censo —v1 ya enseñó adónde lleva—, sino **declarar el
2.062 como lo que es** en todo sitio donde se cite: *«las cifras que los documentos destacan»*, y
añadir que **la intersección con los 26 congelados es de 13**.

### `B2·V2` · ⛔ `sin-vigilancia.js` imprime un veredicto con un número que él mismo acaba de desmentir

**Dónde:** `src/sin-vigilancia.js`, salida líneas 77 y 192.
**Qué se apoya en ello:** el veredicto E7 de `docs/H1-CIERRE.md` §433, que es **la frase de cierre
del punto ciego**.
**Medido con:** ejecución directa del script.

```
   línea  77  ⇒ ¿y está por encima del azar?                    412.7×      ← lo MEDIDO
   línea 192     al nivel de los buenos conocidos (65,5 % frente
                 a 61,9 %, 400× el azar), pero el…              400×        ← lo RECITADO
```

⭐ **El documento copió el bueno** (`H1-CIERRE.md:433` dice **412×**). **El que miente es el
script**, en un literal de su propio veredicto. Es el **nº144** —*un número que solo vive en un
comentario se pudre*— con una vuelta: aquí vive en una **cadena que se imprime**, así que **no
parece un comentario: parece un resultado.**

⛔ **Propuesta (sin aplicar):** interpolar el valor medido en la frase, o quitarlo. Tres caracteres.

### `B2·V3` · ⛔ El `182` de las líneas decorativas es de la tanda 29; hoy su propio instrumento dice `232`

**Dónde:** `docs/H1-AUDITORIA-GUARDIANES.md:20` y **`DESPLAZAME-ESTADO.md:1433`** *(este último, en
presente)*.
**Qué se apoya en ello:** el encargo del bloque A lo citó como cifra actual.
**Medido con:** `src/auditoria-guardianes.js` §A1b, ejecutado hoy.

```
   docs/H1-AUDITORIA-GUARDIANES.md:20     «182 líneas imprimen un veredicto ✅/⛔
                                            sin poder poner el proceso en rojo»
   src/auditoria-guardianes.js §A1b hoy    líneas que imprimen un veredicto
                                            sin alarma cerca                    232
   ⇒ +50, y siete tandas de código por medio
```

⭐⭐ **Y esto cierra un `NO CONSTA` del bloque A.** `A-CODIGO-2026-08-06.md:327` dice *«No he podido
reproducir el 182 del encargo»*. **Sí se puede: el productor es `auditoria-guardianes.js`, y da
232.** El bloque A buscó con otro instrumento y otra definición.

⚠️ **Y hay tres números distintos rondando la misma pregunta.** Que no se mezclen:

| número | qué cuenta | de dónde |
|---:|---|---|
| **198** | *comprobaciones* censadas | tanda 29 |
| **182 → 232** | *líneas que imprimen un veredicto sin alarma cerca* | `auditoria-guardianes.js` §A1b |
| **297** en 37 scripts | *líneas con `⛔` impreso* | bloque A, otro instrumento |

⛔ Y el **297** significa *«37 scripts no se pueden leer por su código de salida»*, **no «297
fallos»**. Si se cita, se cita con eso al lado.

---

## 3 · ⛔ SUPERADOS NUEVOS — diez, en siete documentos

⭐ **Ninguno lleva marca**, igual que los trece del bloque B. **No son mentiras: son fotos.** Y
⛔ **no se agrupan** — dentro hay dos que no son lo que parecen, y van dichos.

**Cómo se encontraron:** ⛔ **no contrastando la clase R, que sería circular** —una cifra es R
*porque* su valor coincide con lo que imprime un productor, así que preguntarle después «¿cuadra?»
devuelve «sí» siempre; sería el **nº65** otra vez. Se buscó al revés: cifras **NO-R** cuya línea
comparte ≥3 palabras distintivas con una línea de salida que trae **otro** número del mismo orden.
**38 candidatas · 10 confirmadas a mano · 28 descartadas.**

### 3.1 · Verificadas leyendo la frase entera — la misma oración, palabra por palabra

| documento | dice | hoy | productor |
|---|---|---|---|
| `H1-PASOS-DE-CEBRA.md:224` | «lo que está en juego son **193 aristas y 1,20 km**» | **190 · 1,16 km** | `paso-de-cebra.js` |
| `H1-MODELO-VIA-FORMA-PAPEL.md:220` | «el way 475881583 tiene **794 m** asignados a San Juan de la Peña» | **783 m** | `modelo-rutas.js` |
| `H1-AUDITORIA-GUARDIANES.md:20` | «**182 líneas** imprimen un veredicto» | **232** | `auditoria-guardianes.js` |

### 3.2 · Verificadas por fila de tabla con las etiquetas coincidentes

| documento | dice | hoy | productor |
|---|---|---|---|
| `H1-PARQUES.md:23` | **1.020** municipal · **1.661** OSM · **181** deducidos · **220** declarados | **1.007 · 1.642 · 237 · 294** | `parques.js` |
| `H1-PASOS-DE-CEBRA.md:23` | «quedan **36.303** rojas de verdad» · exagera en **5.607** | **36.113 · 5.860** | `paso-de-cebra.js` |
| `H1-MODELO-VIA-FORMA-PAPEL.md:145` | intercambiar acera↔calzada: **1.919 de 3.557** | **1.873 de 3.472** | `asignar-bici.js` |
| `H1-MODELO-VIA-FORMA-PAPEL.md:323` | **3.557** aristas con `ciclista` | **3.472** | `modelo.js` |
| `H1-NOMBRAR-ACERAS.md:24` | en las siete rutas nombra **1.159 m de 3.851** | **1.069 de 3.582** | `nombrar-aceras.js` |
| `H1-CALLE-PEGADA.md:25` | **+511 puertas** ganan calle | **495** | `calle-pegada.js` |
| `H1-DONDE-FALTA-EL-NOMBRE.md:605` | **313 líneas** de andar con carril bici municipal encima | **307** | `modelo.js` |

⚠️ **Las dos que no son lo que parecen, y por eso no se agrupan:**

- `H1-MODELO-VIA-FORMA-PAPEL.md:145` y `:323` **son el mismo 3.557 contado dos veces**, no dos
  hallazgos. La fila de `:145` publica además el porcentaje **53,9 %**, que **sigue siendo correcto
  hoy** (1.873/3.472 = 53,9 %): **cambió el par y no cambió la conclusión.**
- `H1-PASOS-DE-CEBRA.md:23` y `H1-PARQUES.md:64` dan **36.303** y **36.050** para lo mismo con dos
  tandas de diferencia. El de `H1-PARQUES` ya estaba en los trece del bloque B; **el de
  `H1-PASOS-DE-CEBRA` es nuevo y es el más viejo de los dos.**

### 3.3 · ⭐ Y una que parecía superada y NO lo está — la que enseña que el proyecto sí sabe hacerlo

`H1-NUMEROS-CONGELADOS.md` publica **2.667** puertas sin calle; el congelado dice **2.669**.
No es un descuido: `puertas-sin-calle.js` **imprime la diferencia con su causa**:

```
   tanda 31 · la regla estricta de bici                    2667              +2
   movimiento REAL (3.166 → 2669)                                          −497
```

⇒ **El instrumento lleva dentro la historia de su propio número.** Es lo contrario de todo lo demás
de esta sección, y merece decirse.

### 3.4 · Las 28 descartadas — por qué

| motivo | n |
|---|---:|
| el documento publica un par `antes → ahora` y el instrumento cazó el «antes» | 11 |
| ya estaba en los trece del bloque B (`H1-VERDE`, `H1-NOMBRES-Y-PASOS`) | 6 |
| son magnitudes distintas con vocabulario parecido (*«acierto del 100 % cuando los dos testigos coinciden»* contra *«acierto bruto 76,7 %»*) | 7 |
| el documento declara que no lo mide (`H1-NUMEROS-CONGELADOS.md:279`: *«No medidos aquí. Cabo.»*) | 2 |
| es una descomposición, no una discrepancia (*«los 509 m se PARTEN en 427 + 82»*) | 2 |

---

## 4 · ⭐⭐ LA COSECHA — ⛔ propuesta, sin aplicar

```
   afirmaciones de clase R                              531
   …cuyo valor YA está congelado                         36 filas (13 de los 26 números)
   ⭐⭐ …con productor nombrado y SIN guardián            495
   valores distintos sin guardián                       279
```

⇒ **Hoy hay 26 guardianes sobre lo publicado. El mapa dice que hay 279 valores distintos con
productor nombrado y ninguno encima.**

⚠️ **Y ese 279 no es una lista de la compra.** Filtrando a lo que se publica en **≥2 documentos** y
vale ≥100 quedan **28**, y **leídos uno a uno, ocho no deberían estar**: `99999` es el centinela
—una constante, no una medida—; `100`, `150` y `500` son **listones**, que ya se vigilan en
`paridad.js`; `198`, `124`, `179` y `151` casan con números de entrada de bitácora.

**Los que yo propondría, y solo éstos —diez:**

| valor | qué es | productor | dónde se publica |
|---:|---|---|---|
| **46.150** | portales del callejero municipal | `acera-equivocada.js` ⚠️ *(instrumento tocado — medirlo con otro)* | 3 documentos |
| **3.359** | vías del WFS de urbanismo | `donde-falta.js` | 3 documentos |
| **3.644** | tramos de `tn-ro:RoadLink` | `cerrar-punto-ciego.js` | 3 documentos + README |
| **11.942** | enganches del punto ciego | `sin-vigilancia.js` | `H1-CIERRE` · `H1-PORTALES` |
| **2.006** | la estimación de la tanda 12 | `sin-vigilancia.js` | `H1-CIERRE` · `H1-PUNTO-CIEGO` |
| **1.592** | los del punto ciego, contados enteros | `cerrar-punto-ciego.js` | `H1-PUNTO-CIEGO` · `H1-ULTIMOS-CABOS` |
| **493** | polígonos del Parque del Agua | `parques.js` | `H1-VERDE` + bitácora |
| **4.326** | inventario de carril bici | `bici-inventario.js` | 4 documentos |
| **1.269** | carril bici · km asignados | `bici-inventario.js` | 4 documentos |
| **320 / 179** | pasos condicionales · de los cuales | `informe-condicionales.js` | `H1-GRAFO-CIUDAD` · `H1-PORTALES` |

⛔ **No se añade ninguno.** Y ⚠️ **añadirlos tiene coste**: cada congelado nuevo es un rojo que
alguien tendrá que entender el día que se mueva, y la cabecera de `numeros-congelados.js` dice que
actualizarlo **es una decisión, no un trámite**. Diez es lo que creo que se puede sostener; 279 no.

---

## 5 · ⭐⭐ LA COBERTURA REAL

| | n | % de 2.062 |
|---|---:|---:|
| afirmaciones del censo v2 (universo aprobado) | **2.062** | 100 % |
| **clasificadas con criterio positivo** (R+F+P) | **554** | **26,9 %** |
| ⇒ de ellas, con productor **nombrado** | 531 | 25,8 % |
| ⇒ …y con evidencia de línea de **medida**, no de prosa | 444 | 21,5 % |
| **`?` — no lo he sabido clasificar** | **1.508** | **73,1 %** |
| ⛔ contrastadas contra el motor (las 38 candidatas leídas a mano) | 38 | 1,8 % |
| ⛔ **NO contrastadas** | **2.024** | **98,2 %** |

⚠️⚠️ **El mapa está entero; el contraste no.** Y es lo que la costura del encargo anticipaba: *«el
mapa entero no cabe en la tanda → no lo aceleres»*. Lo que hay es un mapa de las 2.062 **completo**,
y un contraste de **las 38 divergencias que el mapa supo señalar**.

⭐ **Lo que sí se puede decir del resto:** de las 1.508 de `?`, **304 tienen un valor que hoy no
imprime ningún instrumento del repositorio** — ésas no se pueden contrastar con lo que hay, y decir
otra cosa sería fingir.

### 5.1 · ⭐⭐⭐ La contraprueba del mapa — dos columnas, con el rojo visto

**Ley 35, respondida por escrito ANTES de mirar el resultado** *(está en la cabecera de
`b2-valida-mapa.js`, fechada antes de la primera ejecución)*:

> · `R` **no** puede salir bien sin que nada funcione: si la cosecha estuviera vacía, R sería 0.
> · `P` y `F` **sí pueden**: son expresiones regulares sobre el contexto, y si fueran glotonas el
>   mapa saldría «clasificado» sin haber medido nada. **⇒ P y F necesitan muestra.**
> · `?` no se puede falsear: es lo que sobra, y su tamaño es el resultado.

**Y las dos que podían falsearse fallaron las dos** (§0.3 y §0.4). La predicción se cumplió.

```
   ⭐⭐ ROJO · a una cifra R se le cambia el valor por uno que ningún productor imprime
      4.326 → 4333    BITACORA.md                     ✅ deja de ser R
      1.269 → 1276    H1-CARRILES-BICI.md             ✅ deja de ser R
      2.719 → 2726    H1-DONDE-FALTA-EL-NOMBRE.md     ✅ deja de ser R
     12.335 → 12342   H1-LISTON-50.md                 ✅ deja de ser R
      1891,0 → 1898   H1-NOMBRAR-ACERAS.md            ✅ deja de ser R
     11.168 → 11175   H1-PARQUES.md                   ✅ deja de ser R
      3.340 → 3347    H1-TOPE-ADELANTO.md             ✅ deja de ser R
      3.644 → 3651    INVENTARIO-FUENTES-ZARAGOZA.md  ✅ deja de ser R
   ⇒ ROJOS VISTOS 8 de 8
   ⭐ VERDE · las otras cifras de las mismas líneas ⇒ 0 cambian de clase · ✅ sin contagio
```

⭐ **Ley 85 aplicada de entrada:** la rotura sustituye **todas las formas** del número (`4.326`,
`4326`) en la línea, no la primera. Fue lo que ayer cazaba 1 de 6.

⚠️ **Lo que esta contraprueba NO cubre:** que el vocabulario compartido sea el *correcto*. Un rojo
por cambio de valor no dice nada de una R que casó con la línea equivocada — eso solo lo dice la
muestra, y la muestra de R salió **12 de 12** legibles.

---

## 6 · ⚠️ LO QUE NO SE HA PODIDO AUDITAR

| qué | por qué |
|---|---|
| **2.024 de las 2.062 afirmaciones** | el mapa se llevó la tanda. Es el agujero, y no se disimula |
| **1.508 sin clasificar (`?`)** | mis criterios no llegaron. ⛔ No es `NO CONSTA`: es *no lo he sabido* |
| **Los `RECONOCIMIENTO-*` contra sus fuentes** | exige RED. **Parado ahí, como en el bloque B** |
| **Las 39 afirmaciones que sostiene `acera-equivocada.js`** | `A·V1`: el instrumento mide sobre el universo inflado. **MEDIDO CON INSTRUMENTO TOCADO** |
| **Los 19 ficheros de `src/` sin salida** | son librerías: no imprimen nada, así que no entran en el diccionario de productores. Sus constantes (`RAZONABLE_M`, `MIN_TRIOS`, `FRAC_CORRELATIVA`) **son reproducibles y este mapa no las ve** |
| **Los `exportar-*.js`** | ⛔ **no se ejecutaron a propósito**: escriben el fichero del visor **dentro** del repositorio. Sus números entran por `numeros-congelados.js`, que los llama como librería |
| **Las 17.844 no marcadas** | cerradas por Antonio como `NO CONSTA` estructural |

### 6.1 · Los dos universos (`A·V2`)

Ninguna de las diez divergencias confirmadas depende de agrupar por `codigoVia` o por núcleo de vía:
las diez son del mapa, del modelo o de los pasos. **Las que sí dependen —las 39 de
`acera-equivocada.js`— están declaradas arriba y no se han contrastado**, precisamente para no
medirlas con el instrumento tocado.

---

## 7 · ⭐ PARA LA CONVERSACIÓN DE ESTRATEGIA — `DESPLAZAME-ESTADO.md`

⛔ **No se ha tocado.** Escritor único.

| línea | dice | el dato |
|---|---|---|
| **1433** | *«**182 líneas** imprimen `⛔`/`✅` y no paran nada»*, en presente | su instrumento (`auditoria-guardianes.js` §A1b) da **232** hoy. Ver `B2·V3` |

⭐ **Y dos que estaban en el reporte de ayer y hoy están corregidas:** la línea 866 ya declara que
*«los dos números que esta ficha publicó antes —de 51.028 a 151.026— NO eran ninguno el bueno»*, y
la numeración de los hallazgos de A vuelve a mandar desde el registro. **Cerradas.**

---

## 8 · ⭐ MI CRITERIO — qué arreglaría de lo de hoy

**Los tres caracteres de `sin-vigilancia.js`** (`B2·V2`). Es el arreglo más barato de todo lo que
llevo visto en tres bloques y quita un número desmentido de un veredicto impreso.

**La frase del `182` en el estado** (`B2·V3`) — o mejor: **que el número lo interpole el
instrumento**, que es la forma de que no vuelva a pasar. Es el mismo mecanismo que la tanda 36 le
puso al reparto de la paridad.

**De los diez congelados propuestos, empezaría por tres:** `3.644`, `3.359` y `46.150`. No por
importancia técnica: porque los tres están **en el README o en los documentos de entrada**, que es
lo que lee alguien que no es Antonio — y `B·V2` ya demostró que ahí hay una atribución mal hecha.

⛔ **No tocaría los diez superados.** Eran verdad. Lo que falta no es el número: es el puntero, y
eso ya está dicho en el bloque B.

⚠️ **Y lo que no me atrevo a recomendar:** qué hacer con las 1.508 de `?`. **354 son casi-R** y
saldrían con una tanda más de vocabulario. De las otras **1.154 no sé nada**, y después de que en
esta misma tanda se me hayan caído dos clases enteras por su propia muestra, **no voy a estimar
cuántas están bien.** Lo que sí diría: **el censo v2 mide lo que el proyecto subraya, no lo que
afirma** (`B2·V1`), así que cualquier cifra de cobertura que salga de aquí hay que leerla con eso
delante.

---

## Z · LOS INSTRUMENTOS DE ESTA TANDA

⭐ Todos **desechables**, todos **fuera de `src/`**, ⛔ **ninguno entra en la batería.** Viven en el
scratchpad de la sesión.

| instrumento | qué hace | ¿mintió? |
|---|---|---|
| `b1-titulares-param.js` | el censo v2 del bloque B, parametrizado por raíz | no |
| `b2-cosecha.js` | ejecuta los 66 scripts de `src/` y guarda su salida | ⛔ **sí — §0.1** |
| `b2-mapa.js` | el clasificador R/F/P/`?` | ⛔ **sí — §0.2, §0.3, §0.4** |
| `b2-veneno.js` | mide el daño del diccionario envenenado | no |
| `b2-valida-mapa.js` | semilla · rojo · verde · muestra sistemática | no |
| `b2-diverge.js` | las candidatas a divergencia | no *(38 candidatas, 28 falsas: es un proponedor, no un juez)* |
| `b2-cosecha-guardianes.js` | la cosecha de congelados posibles | no |

**Reutilizados del bloque B:** `b2b4.js` (los 26 congelados), `b3-comandos.js`.

⛔ **Cero descargas.** Todo desde `data/fuentes/` y `data/exploracion/`. Nada exigió red salvo los
`RECONOCIMIENTO-*`, y ahí se paró.
