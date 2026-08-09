# H1 · LOS TRES LISTONES — su acera a 100 m, la de enfrente a 150

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 5 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `21 congelados` | **26 congelados** | `docs/H1-REPUBLICACIONES.md §B` · 2026-08-09 |
> | `31.411` | **4.562** | `docs/H1-TOPE-ADELANTO.md §B2` · 2026-08-06 |
> | `2.982` | **2.138** | `docs/H1-TOPE-ADELANTO.md §A3` · 2026-08-06 |
> | `6 km/h` | **5,0 km/h** | `docs/H1-VELOCIDAD-ESTANDAR.md §0` · 2026-08-08 |
> | `56 pasos` | **83 pasos** | `docs/H1-REPUBLICACIONES.md §F` · 2026-08-09 |
>
> <sub>cuántos números vigila `numeros-congelados.js` · las consultas contestadas — con el dial inflado · las sugerencias BUENAS a ≤ 20 m (nº142) · la velocidad con la que se calculan los tiempos — era la de UNA persona · los pasos del itinerario — cubre también la forma «56/56 pasos» de los cierres</sub>
<!-- SUPERADOS:FIN -->

**Tanda 34 · 2026-08-06.** Reproducible con:

```
node src/medir-listones.js            # B0 el eje · B4 los anchos · B1–B2 ancho o desfase · C1
node src/medir-paridad.js --rutas     # A4 lo que recupera cada listón · C1–C4 · el centinela
node src/rutas-antonio.js             # el banco de las siete
node src/modelo-rutas.js              # los metros y los pasos publicados
node src/numeros-congelados.js        # los 21 congelados
```

> ⛔ Este documento **se añade**, no reescribe a los anteriores. Corrige un
> denominador que las tandas 32 y 33 publicaron mal (§0), y esa corrección va
> aquí, en documento nuevo, con lo que corrige y por qué.

---

## ⭐⭐⭐ 0 · Lo primero: **el 68,9 % de las que entran por los 150 m es DESFASE**

Es la respuesta a la pregunta que el encargo pone por delante de todo lo demás, y
la costura dice que si sale así hay que **decirlo y parar**.

```
   sugerencias de la acera de enfrente (universo limpio)      10.755

   ⭐ ANCHO   — está cruzando la calle                         3.340    31,1 %
   ⛔ DESFASE — está calle abajo                               7.415    68,9 %
   ⚠️ NO CONSTA — sin eje medible                                  0     0,0 %
```

**Y aprieta más al comprobar la etiqueta contra la realidad.** De los 3.340
«ancho», solo **2.623 caben en el ancho medido de su propia calle** (≤×2). Los
otros 717 llevan la etiqueta «cruzando» y cruzan el doble o el triple de lo que
mide esa vía.

> ### ⇒ **2.623 de 10.755 — el 24,4 % — son de verdad cruzar la calle.**
> Tres de cada cuatro sugerencias de enfrente **no** lo son.

⛔ **No lo he arreglado**: el encargo dice que es decisión de Antonio. El dial
está en §B3.

---

## ⛔⛔ 0b · Y una corrección a las tandas 32 y 33: el centinela

```
   portales con `sortNumber = 99999`          117    su número crudo es "BL0", "BL1", "BL2"…
   vías afectadas                               1    GRUPO M. ANDREA CASAMAYOR Y DE LA COMA
   ⛔ «pedibles» que aporta ese centinela   99.998    66,2 % de las 151.026 publicadas
```

Son **bloques sin número de portal**, y 99999 es el centinela con el que el
callejero dice «no tiene». El universo *«lo que se puede pedir»* se construye del
número mínimo al máximo de cada vía ⇒ en esa vía iba **de 1 a 99999**.

| universo | pedibles | existen | huecos | cambian de acera |
|---|---:|---:|---:|---:|
| el de las tandas 32 y 33 | 151.026 | 27.882 | 123.144 | 66.961 · 54,4 % |
| ⭐ **LIMPIO** | **51.028** | 27.857 | **23.171** | **16.969 · 73,2 %** |

⚠️ **Ningún caso medido era falso** —los huecos reales siguen siendo reales—, pero
**todo porcentaje cuyo denominador fuera «lo pedible» estaba inflado**.

⭐⭐ Y lo que lo hace grave: **dos cuadres entre tandas estaban en verde sobre el
mismo artefacto.** El barrido reproducía el universo de la tanda 32 con <0,1 % de
diferencia, y el dial de la tanda 33 predijo 31.411 consultas contestadas a 100 m
y salen **31.411 clavadas**. *Dos medidas de acuerdo no son dos medidas
correctas.* Lo cazó una mediana sospechosamente redonda, no una comprobación.

⛔ **El centinela NO se ha quitado del buscador.** Qué hacer con 117 portales que
no tienen número es una decisión, no un arreglo mío.

---

## A · Los tres listones aplicados

| | |
|---|---|
| **su acera** | **100 m** (era 50) |
| **la de enfrente** | **150 m**, medidos desde el portal que se ofrecería de su propia acera |
| **el orden** | ⛔ primero **todas** las de su acera, y solo después la de enfrente — **aunque la de enfrente esté más cerca en metros** |
| **la marca** | toda sugerencia de enfrente dice que lo es, y con cuánto es calle y cuánto es calle abajo |

⭐ **Desde dónde se mide el radio, que es lo que decide si el listón vale:** desde
el portal de su propia acera que se ofrecería. Es la misma distancia que la tanda
32 publicó —*«el par más próximo (nº74) a 258 m del nº77 que te da»*— así que los
tres informes hablan del mismo número.

⭐ **Los 100 no salen de un percentil**: salen del dial que la tanda 33 publicó, y
Antonio eligió sobre ese dato. ⛔ Y no se disimula el precio: 100 m está por
encima del p90 de la separación entre portales seguidos (52 m). **La respuesta ya
no es «el de al lado»: es «el de la manzana».**

⚠️ **Este guardián saltó al subir el listón**, y tenía razón: exigía que cayera
entre la mediana y el p95 del reparto **del que salía**, y 100 > 91. Se reescribe
con la procedencia nueva — lo que ahora se exige es que **el dial acertara**, y
acertó.

### A4 · Qué recupera cada listón — ⛔ y no se suman

Son dos cosas distintas: uno devuelve **respuestas**, el otro devuelve **opciones**.

```
   (1) SU ACERA, de 50 a 100 m — devuelve RESPUESTA automática
       consultas contestadas ahora                        31.411
       …que el listón de 50 rechazaba                     26.849   ⭐ eso recupera
       ⭐⭐ ¿lo predijo el dial de la tanda 33?            ✅ 31.411 clavadas

   (2) ENFRENTE, hasta 150 m — devuelve una OPCIÓN marcada, no una respuesta
                                              con centinela      ⭐ LIMPIO
       sin respuesta que ganan alguna              31.466          6.465   61,8 %
       …y en cuántas es la única alternativa       28.456          3.462
       distancia ofrecida (med · p75 · p90)     126·126·126      56·94·125
```

⚠️ **Y lo que el listón de enfrente NO recupera: ninguna consulta muda.** Las que
se quedan sin respuesta **siempre tenían ya al menos una sugerencia de su acera**
(0 mudas antes y después). ⇒ lo que aporta es **una opción más**, no rescatar
consultas perdidas. Decirlo al revés sería inflarlo.

### Y cuántas siguen sin respuesta

```
   ⛔ sin respuesta (solo sugerencia)     35.466    28,8 % de los huecos
      por hueco > 100 m                    5.647    15,9 %
      ⚠️ por caer FUERA del tramo          29.819    84,1 %
```

⚠️ **El motivo ha cambiado de sitio.** Con el listón a 50 la mitad se caía por
hueco grande; con 100, el **84,1 %** se cae por caer **fuera del tramo numerado de
su acera**. ⛔ Eso no lo arregla subir más el listón — solo lo movería la
interpolación, que sigue pendiente.

---

## B0 · ⭐⭐ ¿Vale el eje? — dos testigos que no se hablan, **antes** de usarlo

Toda la clasificación de §B2 cuelga de saber por dónde va la calle. Se mide de dos
formas independientes: el **hilo** (la dirección entre el portal anterior y el
siguiente de la misma acera, sin tocar el grafo) y la **arista** (la dirección del
segmento de OSM al que engancha).

```
   portales con los dos ejes medibles                33.207
   desacuerdo (grados)      med 1 · p75 9 · p90 53 · p95 78
   ⭐ concuerdan por debajo de 30°                    28.315   85,3 %
```

⭐⭐ **La línea base:** dos direcciones al azar desacuerdan **45°** de media. La
mediana es **1°**. ⇒ los dos testigos miden lo mismo y el eje vale.

---

## B4 · Los anchos reales de Zaragoza — con el dato, no a ojo

El ancho de una vía = la componente **transversal** entre un portal y el más
cercano de la otra acera. ⛔ No la distancia a secas: ésa incluye el desfase.

| vía | portales | ancho med | p75 | p90 | máx |
|---|---:|---:|---:|---:|---:|
| AVENIDA ALCALDE GÓMEZ LAGUNA | 50 | **78** | 115 | 137 | 550 |
| VÍA HISPANIDAD + RONDA HISPANIDAD | 215 | **80** | 120 | 141 | 303 |
| AVENIDA CATALUÑA | 122 | **23** | 49 | 103 | 230 |
| AVENIDA MADRID | 147 | **21** | 21 | 35 | 44 |

Y sobre las **960 vías** con ancho medible:

```
   ancho mediano por vía      med 13 · p75 21 · p90 43 · p95 58 · máx 400
   más anchas de  30 m        148   15,4 %
   más anchas de  50 m         71    7,4 %
   más anchas de 100 m         10    1,0 %
   más anchas de 150 m          4    0,4 %
```

> ⚠️⚠️ **150 m es muy generoso.** La calle típica de Zaragoza mide **13 m** de
> acera a acera, el p95 son **58 m**, y las dos avenidas más anchas que nombró
> Antonio están en **78 y 80 m**. El listón está a **casi el doble de la avenida
> más ancha que existe** — y ese margen es por donde se cuela el desfase.

---

## B1–B2 · Cómo se separan, y qué sale

**El criterio:** se descompone el vector *portal propio → portal de enfrente* en
sus dos componentes respecto al eje de la vía. **Ancho** si manda la transversal,
**desfase** si manda la longitudinal.

⛔⛔ **El corte NO está calibrado contra ningún caso conocido.** Es la ley de ayer
(nº132): *un listón calibrado contra N casos acierta en los N casos; eso no es una
comprobación, es la definición de calibrar.* El corte es **45°**, el punto medio
geométrico. Y la sensibilidad va impresa:

| corte | ancho | desfase | % desfase |
|---:|---:|---:|---:|
| 30° | 5.042 | 5.713 | **53,1 %** |
| **45°** ⭐ el aplicado | 3.340 | 7.415 | **68,9 %** |
| 60° | 2.074 | 8.681 | **80,7 %** |

⭐ **A cualquier corte, el desfase es mayoría.** El resultado no depende de estar
pegado al borde.

### Partido por situación

| situación | casos | ancho | desfase | % desfase |
|---|---:|---:|---:|---:|
| el número cae en un **hueco** de su acera | 4.512 | 1.476 | 3.036 | 67,3 % |
| el número cae **fuera del tramo** | 6.243 | 1.864 | 4.379 | 70,1 % |

⚠️ Se parte porque **la referencia no vale lo mismo en los dos casos**: cuando el
número cae dentro de un hueco, el portal de referencia está al lado y la
descomposición es limpia; cuando cae fuera del tramo, la referencia es el extremo
del hilo y **ya está lejos del sitio pedido**. Sale casi igual en los dos, así que
la conclusión no depende de eso.

### Cuánto, en metros

```
   ⛔ desfase: cuánto te adelanta CALLE ABAJO    n=7.415   med  61 · p75  95 · p90 124 · máx 150
   ⭐ ancho:   cuánto hay que CRUZAR             n=3.340   med  32 · p75  65 · p90  94 · máx 148
```

### ⭐⭐⭐ El aprieto: cada «ancho» contra el ancho real de **su propia vía**

El 45° dice que manda la componente transversal. **No dice que sea el ancho de esa
calle.**

```
   casos «ancho» con anchura de su vía medida         3.340
   ⭐ el cruce CABE en el ancho de su calle (≤×2)      2.623    78,5 %
   ⚠️ entre ×2 y ×3                                     282     8,4 %
   ⛔ más de ×3                                         435    13,0 %
```

**El caso visible:** la ruta 1 tiene su destino en `Avenida Pablo Gargallo 16`, y
las dos sugerencias de enfrente son el **nº17 (79 m de calle)** y el **nº15
(103 m)**. Pablo Gargallo mide **37 m** de mediana. ⇒ **ninguna de las dos es
cruzar Pablo Gargallo**, y las dos salen etiquetadas «cruzando».

---

## B3 · ⛔ El dial — no elijo, es decisión de Antonio

**El radio es una palanca mala.** Incluso a 25 m, el 42 % sigue siendo desfase:

| radio | sugerencias | ancho | desfase | % desfase | cruce que **cabe** en su calle |
|---:|---:|---:|---:|---:|---:|
| 25 m | 2.427 | 1.405 | 1.022 | 42,1 % | 1.367 (56,3 %) |
| 50 m | 4.862 | 2.083 | 2.779 | 57,2 % | 1.906 (39,2 %) |
| 75 m | 6.772 | 2.535 | 4.237 | 62,6 % | 2.228 (32,9 %) |
| 100 m | 8.501 | 2.963 | 5.538 | 65,1 % | 2.485 (29,2 %) |
| **150 m** ⭐ | 10.755 | 3.340 | 7.415 | **68,9 %** | 2.623 (24,4 %) |

**La palanca que sí separa es limitar lo que te adelanta CALLE ABAJO**, que es
exactamente lo que distingue las dos cosas:

| tope de «calle abajo» | sugerencias | ancho | desfase | % desfase |
|---|---:|---:|---:|---:|
| ≤ 10 m | 1.601 | 1.496 | 105 | **6,6 %** |
| ≤ 20 m | 2.982 | 2.138 | 844 | **28,3 %** |
| ≤ 40 m | 5.148 | 2.800 | 2.348 | 45,6 % |
| sin tope (hoy) | 10.755 | 3.340 | 7.415 | 68,9 % |

⭐ **Mi recomendación, sin aplicarla:** dejar el radio en 150 —cubre las avenidas
anchas de verdad— y **añadir un tope de unos 20 m a la componente calle abajo**.
Con eso el desfase cae del 68,9 % al 28,3 % y se conservan 2.982 de las 3.340
sugerencias que de verdad son cruzar. ⛔ Pero **es una decisión, y es de Antonio.**

---

## C1 · `Avenida Cataluña 78`, con los tres listones

```
   estado       sin-numero-cerca   [vía par-impar]
   respuesta    ⛔ NO SE TIENE — solo sugerencia

   aviso   «el 78 no existe · en su acera, la de los pares, los más cercanos
            son el 74 y el 84, y entre ellos hay 175 m»

   ⭐ su acera   nº74   175 m   un extremo del hueco
   ⭐ su acera   nº84   175 m   un extremo del hueco
```

> ### ⛔⛔ ¿Entra el 77? **NO.** Está a **258 m** del 74 y el listón de 150 no lo
> deja pasar. Va como `A.exige`: si algún día entrara, el script se pone rojo.

⚠️ El hueco del 78 mide 175 m — sigue por encima de los 100— así que **la ruta 1
sigue sin resolverse por su origen**. Lo que ha cambiado en esa consulta es nada;
lo que ha cambiado es su destino, que ahora ofrece dos opciones de enfrente.

---

## C2 · ⭐⭐⭐ Las siete rutas, una a una

| ruta | qué pasa | tanda 16 | ahora |
|---:|---|---:|---:|
| **1** | ⛔ **sigue en sugerencia** por los dos extremos. El destino gana ahora nº17 y nº15 de enfrente | 3.086,9 | — |
| 2 | ✅ exactos | 598,1 | 598,1 |
| 3 | ✅ su origen es vía de un solo lado: la respuesta no se toca | 3.704,9 | 3.704,9 |
| 4 | ✅ los dos extremos son edificios | 505,9 | 505,9 |
| 5 | ✅ exacto | 477,4 | 477,4 |
| 6 | ⭐ `Matadero 1` → nº3, a un paso de 23 m (igual que en la tanda 33) | 523,4 | **520,2** |
| **7** | ⭐⭐ **exactos los dos — INTACTA** | 2.528,9 | **2.528,9** |

⭐⭐ **La ruta 7 no se mueve.** Su guardián sigue puesto y en verde: *«la RUTA 7 se
ha movido → PARAR»*. **La calibración de los ~6 km/h no está en cuestión.**

⭐ **Ningún listón de esta tanda ha movido una ruta.** Los 100 m no alcanzan al
hueco de 175 m de Cataluña, y los 150 de enfrente **solo añaden opciones, nunca
respuestas** — por diseño. El banco sigue en **6 de 7 resueltas**, con el mismo y
único rojo de siempre (el rodeo de la nº4).

`modelo-rutas.js`: **6 rutas clavadas · 56/56 pasos · la nº1 sigue en sugerencia.**

---

## C3 · Los números congelados

**Los 21 intactos.** `numeros-congelados.js` sale en código 0 sin mutar, y las dos
roturas de la tanda 30 se siguen cazando **2 de 2**.

⭐ Es esperable y se dice por qué: los 21 miden **grafo, mapa y modelo**, y esta
tanda solo toca **el buscador**. Que ninguno se moviera es una comprobación del
alcance, no un alivio.

⚠️ El único número publicado que se ha movido no es un congelado: es el
denominador de las tandas 32 y 33 (§0b), y se republica aquí.

---

## D · Qué busqué y no encontré · qué NO he comprobado

**Busqué y no encontré:**

- **Una consulta que se quedara muda.** Con el listón de enfrente y sin él, salen
  **0**: toda consulta sin respuesta tiene ya al menos una sugerencia de su acera.
  Buscarlo era la forma de saber si el listón de 150 rescataba algo perdido, y
  **no rescata nada perdido: añade opciones**.
- **Un radio al que el desfase deje de ser mayoría.** No lo hay: ni a 25 m
  (42,1 %). Por eso la recomendación no es bajar el radio.
- **Una ruta movida por los listones nuevos.** Ninguna.

**NO he comprobado:**

- **Si cruzar esos 32 m es realmente poco camino.** Se mide la línea recta entre
  portales, no el recorrido hasta el paso de peatones y vuelta. El motor sabría
  calcularlo —es una ruta— y **no se ha hecho**. Es lo que convertiría «cruzando»
  en un coste real en metros andados. **NO CONSTA.**
- **Si el portal está físicamente en la acera que dice el callejero.** Igual que
  en las tandas 32 y 33: esto compara contra la paridad del dato, no contra el
  terreno. **NO CONSTA.**
- **Qué direcciones pide la gente.** Sin eso, ningún porcentaje «de lo pedible»
  —ni siquiera el limpio— se traduce en daño real. **NO CONSTA.**

---

## D2 · Verificación

```
node src/probar-paradas.js --todo
   P4 · 57 scripts · invariante cumplido en los 57 · código 0
   ninguno se estrella (el guardián que se añadió ayer, en verde)
   rojos DECLARADOS — los mismos cinco de antes de esta tanda:
      auditoria-guardianes.js · donde-falta.js · modelo-rutas.js
      pasos.js · rutas-antonio.js
```

| | |
|---|---|
| los 21 congelados | ✅ intactos · código 0 sin mutar · 2 de 2 roturas cazadas |
| el banco de las siete | 6 de 7 · único rojo el de la nº4, **idéntico** |
| `modelo-rutas.js` | 6 rutas clavadas · 56/56 pasos · la nº1 sigue en sugerencia |
| el eje (§B0) | mediana 1° frente a los 45° del azar |
| el 77 de Cataluña | ✅ fuera, con `A.exige` puesto |
| la ruta 7 | ✅ 2.528,9 m, con su guardián en verde |

---

## E · Mis fallos de esta tanda

| nº | qué |
|---:|---|
| **137** | Añadí `enfrente` a la sugerencia y **el mismo mapeo campo a campo de ayer se lo comió**. La ley del nº134 estaba escrita, era correcta y describía exactamente esto. *Una ley escrita no protege: protege el mecanismo.* |
| **138** | **El 66,2 % del universo «pedible» de tres tandas era un centinela 99999.** Lo cazó una mediana redonda; **dos cuadres entre tandas estaban en verde sobre el mismo artefacto**. |
| **139** | La sugerencia de enfrente llegaba marcada y **el sitio donde se lee no la marcaba** — y llamaba «hueco» a la distancia. El barrido comprueba el dato; el requisito era sobre el texto. |

⭐ **La ley que se lleva la tanda:** *dos medidas de acuerdo no son dos medidas
correctas.* Si comparten el defecto, concuerdan por él — y el cuadre perfecto es
justo lo que hace que nadie vuelva a mirar.
