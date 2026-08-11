# H2a · Tanda 10 — los andenes gemelos: la marca, no la fusión

**Fecha:** 11/08/2026 · **Base:** `1a7ab5b` · **Decisión de Antonio: opción C — se declara, no se
fusiona.**

**⭐⭐⭐ VEREDICTO EN UNA LÍNEA: la marca está puesta en las paradas y en los enlaces, ⛔ los 2.538
enlaces salen byte a byte los mismos, y el umbral no encontró ninguna frontera: las dos poblaciones
de la tanda 8 se solapan a lo largo de 52,7 m y 19 de los 48 pares caen dentro.**

---

## §1 · ⭐⭐⭐ EL UMBRAL, CON LA DISTRIBUCIÓN DELANTE

### 1.1 · No hay frontera. Y eso es el resultado, no un problema del método

Las 48 distancias entre paradas homónimas, ordenadas, en la zona donde el umbral tiene que caer:

```
        #   metros   salto  clase     nombre
       13     10.7     0.1  tranvia   La Chimenea                    ◀ marcado
       14     10.8     0.5  tranvia   Juslibol                       ◀ marcado
       15     11.3     1.8  tranvia   Paseo de Los Olvidados         ◀ marcado
       16     13.1     0.7  tranvia   Parque Goya                    ◀ marcado
       17     13.7     1.7  bus       Av. De Montañana / Cno. B.…    ◀ marcado
       ──────────────────── el umbral cae aquí, en un hueco de 1,7 m ────────────
       18     15.4     2.4  bus       Valle De Broto / Intercambiador
       19     17.8     0.3  tranvia   César Augusto
       20     18.0     3.8  bus       Plaza De España
```

**El hueco más ancho de toda la zona 10–20 m mide 1,7 m.** ⛔ Eso no es una frontera: es donde menos
mal cae el corte.

### 1.2 · ⭐⭐⭐ LA BANDA DE SOLAPE — las dos poblaciones no se tocan: se pisan

La tanda 8 leyó dos poblaciones: el tranvía como *«dos andenes del mismo sitio»* y el bus como *«dos
aceras, sitios distintos»*. Puestas una al lado de la otra:

```
   par de BUS más corto     («dos aceras»)      13,7 m
   par de TRANVÍA más largo («dos andenes»)     66,4 m
   ⇒ ancho de la banda                          52,7 m
```

```
   zona                                pares   de qué clase son
   por debajo  (< 13,7 m)                 16   tranvía 16 · bus  0 · mixto 0
   ⚠️ DENTRO DE LA BANDA                  19   tranvía  2 · bus 15 · mixto 2
   por encima  (> 66,4 m)                 13   tranvía  0 · bus 11 · mixto 2
```

⇒ **19 de 48 pares (39,6 %) están en la banda**, y ⛔ **dentro de ella no hay ni un caso verificado
de ninguna de las dos cosas**: `parent_station` está vacío en las 984 y nadie ha mirado un par sobre
el mapa. *«Andenes» y «aceras» son LECTURAS, no comprobaciones.*

### 1.3 · Por qué 15 m, con los tres motivos y en este orden

| | motivo | fuerza |
|---|---|---|
| 1 | Es el umbral con el que ya está medido y publicado lo que hay en la mesa de Antonio: *«15 de 17»*, *«170 de 272»*. Moverlo mueve un número publicado **sin ninguna medida nueva que lo justifique** | ⭐⭐ es el bueno |
| 2 | Es el hueco más ancho de su zona | ⚠️ **1,7 m. No es un argumento y no se presenta como tal** |
| 3 | Por debajo, 16 de los 17 pares son de tranvía; el 17º es de bus | ⭐ y eso es lo que prueba que la marca **mira el bus** |

### 1.4 · ⭐ EL ERROR QUE SE ACEPTA A SABIENDAS — con su lista, no con una frase (ley 23)

```
   SIN MARCA y con toda la pinta de ser el mismo sitio:
      1201 / 1202      17,8 m   "César Augusto"
      2501 / 2502      66,4 m   "Mago de Oz"
   CON MARCA y que la tanda 8 leyó como dos aceras distintas:
      PA00406 / PA00407  13,7 m   "Av. De Montañana / Cno. B. Las Flores"
```

⚠️ **Los dos números son del MISMO umbral: no se puede bajar uno sin subir el otro.** Eso es
exactamente lo que significa que las poblaciones se solapen.

---

## §2 · ⛔⛔ EL SEGUNDO TESTIGO QUE PARECÍA HABER Y NO SIRVE

Los 50 códigos del tranvía son `NNN1` / `NNN2` y dan la tentación de leerlos como «estación +
andén». Si fuera cierto sería un testigo **independiente** del nombre y de la distancia, y decidiría
el umbral él solo. Se comprobó **antes** de usarlo:

```
   prefijos de 3 cifras con dos códigos      23
      de ésos, con el MISMO nombre           18
      ⛔ con nombre DISTINTO                  5

      0901 / 0902    108,2 m   "Martínez Soria"     vs  "María Montessori"
      0801 / 0802    117,5 m   "Rosalía de Castro"  vs  "León Felipe"
      0601 / 0602    131,2 m   "Legaz Lacambra"     vs  "Adolfo Aznar"
      0501 / 0502    131,5 m   "Margarita Xirgu"    vs  "García Abril"
      0701 / 0702    154,8 m   "Clara Campoamor"    vs  "Pablo Neruda"
```

⇒ **El prefijo de código NO identifica una estación.** Usado como testigo habría certificado como
«un mismo sitio» dos postes a **155 metros**.

### 2.1 · ⭐⭐⭐ Y al descartarlo apareció el fallo

`1001 "La Chimenea"` y `1002 "La chimenea"` están a **10,7 m** y son los dos andenes de la misma
parada. **La comparación de nombres de la tanda 8 los tenía por dos paradas distintas** porque una
lleva la ce en mayúscula.

```
   los números buenos      18 pares de tranvía · 16 a menos de 15 m · 178 de 272 enlaces
   los de la tanda 8       17                  · 15                 · 170
```

⛔ El informe de la tanda 8 **no se reescribe** (registro histórico). El instrumento reproduce sus
diez cifras con la regla vieja **antes** de cambiar de regla, y solo entonces cambia. **Bitácora
nº196**, y de ahí sale la ley del §6.

⚠️ **Hasta dónde se normaliza, y por qué no más:** minúsculas y espacios colapsados, nada más.
Medido sobre las 984, quitar tildes o dejar solo alfanuméricos da **los mismos 940 nombres y los
mismos 48 pares** ⇒ el paso extra no compra nada y sí podría fundir dos nombres que se distinguen
por una tilde. **Queda con su `A.exige` para enterarse el día que esa cifra deje de ser cero.**

---

## §3 · LA MARCA — su nombre y su texto, con la ley 157 pasada

### 3.1 · ⛔ Por qué NO se llama `gemelo`

| nombre | ¿pasa la ley 157? |
|---|---|
| `gemelo` | ⛔ **NO.** Dos gemelos son la misma cosa duplicada: un lector concluye *«es la misma parada»*, que es la **opción B entrando por la puerta de atrás**. Es la palabra del encargo y por eso se audita la primera |
| `estacion` | ⛔ **NO**, y peor: nombra un nivel de modelo que este feed **no declara en ninguna de sus 984** |
| `andenes` | ⛔ **NO.** Afirma que son andenes de algo |
| `mismoNombreCerca` | ✅ **SÍ.** Dice un hecho medible y **no dice qué significa** |

### 3.2 · Las palabras exactas

> Hay otro poste con este mismo nombre a menos de 15 m. ⛔ Esto **NO afirma que sean la misma parada
> ni la misma estación**: el feed no trae `parent_station` en ninguna de sus **984** paradas, así que
> NADA en el dato declara que dos postes formen un sitio. **Este proyecto modela POSTES.** ⇒ Quien
> consulte va a ver DOS entradas muy próximas con el mismo nombre; **si en la calle son un sitio o
> dos, este dato no lo sabe y no lo dice.**

⛔ **La frase que estuvo escrita en el primer borrador y se retiró:** *«…dos entradas para lo que en
la calle es un mismo sitio»*. **Eso AFIRMA que son el mismo sitio**, que es justo lo que no se sabe.

⚠️ **Y el guardián del texto lleva su límite declarado (ley 162):** no sabe distinguir una afirmación
de su negación —*«NO afirma que sean la misma parada»* contiene la frase prohibida—. Lo único que
hace es mirar si hay una negación delante, **y eso se rompe con una frase más larga**. ⇒ **Es un
aviso, no una red; la red son las tres comprobaciones POSITIVAS**: que el texto diga POSTES, que diga
`parent_station` en las 984, y que diga explícitamente que no afirma identidad.

---

## §4 · EL RECUENTO — ⭐⭐ de qué población es CADA celda (ley 164)

```
   población                        pares ≤15 m  de un total de  postes marcados     sobre
   tranvía × tranvía                         16              18               32        50
   bus × bus                                  1              26                2       934
   bus ↔ tranvía (mixto)                      0               4                —         —
   TOTAL                                     17              48               34       984
```

⛔ **Las dos columnas de la derecha NO se suman entre sí:** una cuenta **PAREJAS** y la otra
**POSTES**, y un poste de «Campus Río Ebro» está en dos parejas. La fila `mixto` no tiene columna de
postes porque **sus postes ya están contados en las otras dos filas**.

```
   paradas de TRANVÍA con marca      32 de 50    64,0 %
   paradas de BUS con marca           2 de 934    0,2 %
```

⇒ **Es una diferencia de estructura, no de grado** (ley 169). Y los enlaces:

```
   enlaces con marca      178 de 2.538
      bus×bus               0 de 2.266
      bus↔tranvía         178 de   272     (65,4 %)
```

### 4.1 · ⭐ El cero de `bus×bus`, con su causa y su provocación (leyes 152 y 156)

**LA CAUSA:** los dos postes de bus con marca son `PA00406` y `PA00407`, y **los dos están en
`sinEnlaces`** — el pre-filtro de 300 m ya los había dejado fuera. ⇒ **El cero no es que la marca no
mire el bus: es que esas dos paradas no tienen ni un enlace que marcar.** ⚠️ **Dos límites distintos
que se tapan el uno al otro**, y sin mirarlo el cero se habría leído como *«la marca solo afecta al
tranvía»*.

**LA PROVOCACIÓN:** con el umbral a 25 m salen **58 enlaces bus×bus marcados** ⇒ el cruce entre la
marca y los enlaces funciona.

### 4.2 · ⭐ Y la sospecha, atendida

*«Si la marca sale exactamente en los pares del tranvía y en ninguno de bus, comprueba que el
instrumento MIRA el bus»* — un filtro que solo recorriera el tranvía habría dado casi este mismo
resultado. Lo que lo separa:

```
   paradas de BUS con marca a 15 m      2   PA00406 · PA00407    ✅ NO es un filtro de tranvía
   pares MIXTOS marcados a 15 m         0   ⇒ provocado: a 55 m salen 2 (Campus Río Ebro)
                                            ✅ el cero es del DATO, no del instrumento
```

---

## §5 · ⭐⭐⭐ LA PRUEBA DE QUE NO SE HA MOVIDO NADA

Se quita el campo nuevo y se comprueba que el artefacto vuelve a salir **byte a byte** el de ayer.

```
   ENLACES
      sha del fichero que había en disco     e3a3a81a3b4c5617341183814c5af2a1000191990a039d243c25d9444d17a559
      sha del artefacto de hoy SIN la marca  e3a3a81a3b4c5617341183814c5af2a1000191990a039d243c25d9444d17a559
      bytes: hoy sin marca · tanda 8         506.524 · 506.524   ✅
      ⭐ provocado: +0,1 m a UN enlace        ✅ el sha lo caza

   RED DE BUS        sha d883310a…  205.744 B ✅      RED DE TRANVÍA   sha 9c3bb3c9…  9.528 B ✅
      ⭐ provocado: una parada movida 1e-7 grados ⇒ ✅ el sha lo caza
```

⚠️ **Y por eso el campo se añade AL FINAL del objeto y del enlace, nunca en medio:** bastaría meterlo
entre dos claves para que los bytes cambiaran sin que nada se moviera, **y entonces esta prueba no
podría distinguir un reorden de un recálculo.**

### 5.1 · Lo que cuesta la marca

```
   enlaces        506.524 B → 516.054 B     +9.530 B   (+1,9 %)    gzip 82,4 → 84,2 KB
   red de bus     205.744 B → 205.868 B       +124 B   (+0,06 %)
   red de tranvía   9.528 B →  11.522 B     +1.994 B   (+20,9 %)   ⭐ el modo pequeño paga el 21 %
```

⭐ **Y ese 20,9 % contra 0,06 % es el mismo hecho del §4 medido en bytes:** la marca cuesta en
proporción a cuánto le falta al modelo en ese modo.

---

## §6 · L7 — el límite, releído del fichero del disco

```
   L1  sinEnlaces con las 172, cada una con code y motivo               ✅ sí
   L2  la leyenda cubre todo valor emitido, y separa saber de ignorar   ✅ sí
   L3  cobertura: periodo, aviso, PA00617 y las 8 líneas fuera          ✅ sí
   L4  NO vive aquí — vive en el artefacto de la red                    ✅ sí
   L5  feed con version, fin, atribución y la marca de PROCESADO        ✅ sí
   L6  ni una promesa en el texto del fichero escrito                   ✅ sí
   L7  mismoNombre: umbral, banda con dudosos, texto y las 34 con distancia   ✅ sí
   ⇒ 7 de 7                     ⭐ provocado: se quita feed.procesado ⇒ ✅ lo caza
```

⭐⭐ **El `A.exige` de L7 mira las 984, no la lista de marcadas (ley 167).** Lo que vigila:

| | qué exige | universo |
|---|---|---|
| ⛔⛔ | `parent_station` vacío en **las 984** | el feed entero. *Si el editor empieza a rellenarlo, lo que hay que hacer no es marcar: es leerlo* |
| ⛔ | siguen habiendo **984 códigos distintos** | *si alguien fusiona dos postes, esto se pone rojo* |
| | el texto dice POSTES **y** `parent_station` **y** 984 | el texto escrito |
| | la banda viaja diciendo **cuántos pares caen dentro** | *sin eso, el umbral parecería una frontera limpia* |
| | la simetría, **sobre el fichero releído** | las 34 relaciones A→B, con su provocación |

---

## §7 · ⚠️ QUÉ CLASE DE PAR NO PODRÍA HABER CAZADO ESTA TANDA

- **Dos postes del mismo sitio con nombres DE VERDAD distintos.** Es el caso `0501 "Margarita
  Xirgu"` / `0502 "García Abril"`: si esos dos fueran el mismo sitio, esta tanda no tiene forma de
  saberlo — **la marca entera cuelga del nombre**. ⭐ Y no es hipotético: el convenio de código los
  empareja y están a 131 m.
- **Dos postes del mismo sitio a más de 15 m.** Ya se sabe que hay dos (`César Augusto`, `Mago de
  Oz`) y **están contados**; lo que no se puede saber es cuántos más hay entre los 19 de la banda.
- **Un nombre repetido en dos sitios genuinamente distintos y CERCANOS.** Si existieran dos «Plaza
  España» a 8 m que fueran cosas distintas, la marca los marcaría y no habría nada que lo desmintiera.
- **Nada sobre el terreno.** ⛔ **Ni un par se ha mirado sobre un mapa ni en la calle.** Todo lo de
  esta tanda sale de tres columnas del feed —nombre, latitud, longitud— y de una lectura.
- **Nada sobre si la duplicación molesta de verdad al usuario.** Que 178 enlaces salgan por
  duplicado es un hecho medido; **que eso sea un problema es una hipótesis**, y esta tanda no la
  prueba.

---

## §8 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **La decisión C está ejecutada y no ha movido nada:** los tres artefactos vuelven a salir
   byte a byte los de ayer al quitar el campo nuevo. **178 enlaces y 34 postes marcados.**
2. ⭐⭐⭐ **No hay frontera entre «dos andenes» y «dos aceras».** Las dos poblaciones se solapan
   **52,7 m** y **19 de los 48 pares (39,6 %)** caen dentro, ⛔ **sin ni un caso verificado en toda la
   banda.** ⇒ *El dato de hoy NO puede sostener una regla de agrupación,* y eso vale como respuesta a
   la pregunta que quedaba abierta: **el umbral de una futura opción B no se puede medir con esto.**
3. ⛔ **El convenio de código del tranvía NO identifica estaciones**: cinco parejas `NNN1`/`NNN2`
   están a 108–155 m con nombres de calles distintas. **Se descartó como testigo antes de usarlo.**
4. ⛔⛔ **`1001 "La Chimenea"` / `1002 "La chimenea"`: una mayúscula dejó fuera un par de andenes**
   (bitácora nº196). Los números buenos son **18 · 16 · 178**, no 17 · 15 · 170.
5. ⭐⭐ **Ley nueva:** *un cruce hacia atrás valida un NÚMERO, no la DEFINICIÓN con la que se midió —
   y si las dos mediciones comparten la definición rota, el cruce sale verde y refuerza el error.*
   **Las diez cifras de la tanda 8 se reencontraron clavadas y no valían nada.**
6. ⚠️ **El cero de `bus×bus` marcados lo produce OTRO límite**: los dos postes de bus con marca están
   en `sinEnlaces`. **Dos límites que se tapan el uno al otro**, y solo se ve mirando la causa.
7. ⚠️ **El modo pequeño paga la marca**: el artefacto de tranvía crece un **20,9 %** y el de bus un
   **0,06 %**.
8. ⛔⛔ **CORRIGE A LA TANDA 8: el universo de la batería NO es `src/`.** Es `src/` **más todo lo que
   lean los scripts de `src/`**, y `superados.js:272` recorre los 65 documentos de `docs/`. ⇒ *La
   frase «la batería no protege `tools/`» es cierta del runner y engañosa del universo.* ⚠️ Y la
   batería **no lo enseñaría**: su línea por script solo lleva código de salida y número de fallos.
   **Un `diff` vacío demuestra que no se ha roto nada, no que nada se haya movido.** Ver §10.

---

## §9 · LO QUE ESTA TANDA NO DECIDE

- ⛔ **El umbral de una futura AGRUPACIÓN.** Y ahora se sabe algo más que ayer: **el dato no lo
  sostiene** (§8·2). Haría falta otro testigo —el terreno, o un feed que rellene `parent_station`—.
- ⛔ **No se ha fusionado nada.** Ni una línea junta dos `stop_id`, y hay un `A.exige` que se pone
  rojo si los códigos distintos dejan de ser 984.
- ⛔ **El listón de cobertura** `≥4 portales · 75 %` sigue en la mesa de Antonio, sin tocar.

---

## §10 · ⚠️ DESVIACIÓN DE MÉTODO, DECLARADA — y lo que destapó

**Lancé la batería de cierre y me puse a escribir este documento mientras corría.** Al comprobar si
eso la contaminaba salió que sí puede:

```
   src/superados.js:272    for (const f of fs.readdirSync(path.join(RAIZ, 'docs'))) …
   ⇒ recorre los 65 documentos de docs/, y este documento es uno de ellos
```

⇒ **Maté la ejecución y la relancé con el árbol congelado.** Lo que se publica es la segunda.

### 10.1 · ⭐⭐ Y corrige algo que la tanda 8 dio por cerrado

La tanda 8 concluyó —y está destilado en el estado— que *«la batería no protege `tools/`, porque
`probar-paradas.js:217` lee `readdirSync(__dirname)`»*. **Eso es cierto del RUNNER y falso del
UNIVERSO.** `superados.js` es uno de los scripts que el runner ejecuta, y **él sí recorre `docs/`**.
⇒ **El universo de la batería es `src/` MÁS todo lo que lean los scripts de `src/`**, y nadie lo
tenía escrito.

### 10.2 · ⛔ Y por qué no se habría visto

La batería resume cada script en una línea:

```
   superados.js              código 0       0 de 0  sin fallo  ✅
```

**Ahí no aparece el número de documentos.** `superados.js` cuenta 64 documentos o 65 y **la batería
imprime lo mismo** mientras no haya fallo. ⇒ *Un `diff` vacío de la batería no demuestra que
`docs/` no se haya movido: demuestra que no se ha roto nada.* **Son dos cosas distintas.**

⚠️ **Esto NO va a la bitácora**, y el criterio es el de la ley 14: **no hubo verde falso ni estado
perecedero** — se detectó antes de leer ningún resultado. Lo que sí va, al estado, es el §8·8.

---

**Instrumentos:** [`tools/gtfs/gemelos.js`](../tools/gtfs/gemelos.js) ·
[`tools/gtfs/enlaces.js`](../tools/gtfs/enlaces.js) ·
[`tools/gtfs/red-bus.js`](../tools/gtfs/red-bus.js) · **Bitácora:** nº196.
