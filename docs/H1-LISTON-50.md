# H1 · EL LISTÓN VUELVE A 50 — y lo que cuesta

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 3 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `31.411` | **4.562** | `docs/H1-TOPE-ADELANTO.md §B2` · 2026-08-06 |
> | `6 km/h` | **5,0 km/h** | `docs/H1-VELOCIDAD-ESTANDAR.md §0` · 2026-08-08 |
> | `56 pasos` | **83 pasos** | `docs/H1-REPUBLICACIONES.md §F` · 2026-08-09 |
>
> <sub>las consultas contestadas — con el dial inflado · la velocidad con la que se calculan los tiempos — era la de UNA persona · los pasos del itinerario — cubre también la forma «56/56 pasos» de los cierres</sub>
<!-- SUPERADOS:FIN -->

**Tanda 36 · 2026-08-06.** Reproducible con:

```
node src/medir-paridad.js             # A1 · A2 la resta · A3 el dial limpio · B los casos
node src/medir-paridad.js --rutas     # C · las siete rutas
node src/medir-listones.js            # el efecto de rebote sobre las sugerencias de enfrente
node src/numeros-congelados.js        # los 26 congelados, con `buscador.contestadas` movido
```

> ⛔ Este documento **se añade**, no reescribe a los anteriores. Republica un número
> congelado (`buscador.contestadas`) y corrige una procedencia escrita en el código
> que llevaba tres tandas sin coincidir con lo publicado (§E2).

---

## La decisión, y por qué es un deshacer

> **El listón de la propia acera baja de 100 m a 50 m.**
> **`ENFRENTE_M` 150 y `ADELANTO_M` 20 se quedan como están.**

El listón subió a 100 en la tanda 34 por **un solo argumento**: el dial de la tanda
33 decía que entre 50 y 100 m las consultas contestadas se multiplicaban por siete.

**Ese acantilado era el centinela 99999.** La tanda 35 lo apagó y el mismo dial,
sobre el universo limpio, dice esto:

| listón | dial de la tanda 33 | limpio (tandas 35-36) |
|---|---:|---:|
| 50 m | 4.562 | **4.562** |
| 100 m | 31.411 | **6.421** |
| **⇒ el salto de 50 a 100** | **×6,9** | **×1,4** |

⇒ **La razón para estar en 100 no existía.**

⭐ Y hay una comprobación gratis escondida ahí: al bajar el listón, las contestadas
vuelven a **4.562 exactos** — el mismo número que midió la tanda 33 sobre el
universo inflado. No es suerte: **toda la contaminación del centinela vivía en la
banda de 50 a 100 m**, así que la fila de 50 nunca estuvo tocada. Es la prueba más
barata de que lo que se apagó era exactamente lo que se creía.

---

## ⭐⭐ A · Los números, sobre el universo limpio

### A1 · Qué contesta y qué pasa a sugerencia

De las **23.184** consultas que se pueden pedir y no existen:

| | | de los huecos |
|---|---:|---:|
| la respuesta de hoy ya era de su acera ⇒ no se toca | 6.203 | 26,8 % |
| ⚠️ la paridad no manda (correlativa / un solo lado) | 84 | 0,4 % |
| ⭐ **pasa a un portal de SU acera** — contesta | **4.562** | **19,7 %** |
| ⛔ **pasa a NO TENER respuesta** — solo sugerencia | **12.335** | **53,2 %** |

⛔ **Y va dicho sin envolver: el 53,2 % de los números que no existen ya no tienen
respuesta automática.** Antes de la tanda 33 todos tenían una — la de la acera de
enfrente, la que puso a Antonio a 258 m de donde iba.

De las 12.335 que se quedan sin respuesta:

| | | |
|---|---:|---:|
| ⭐ por hueco demasiado grande (> 50 m) | 7.411 | 60,1 % |
| ⚠️ por caer **fuera** del tramo numerado de su acera | 4.924 | 39,9 % |

⚠️ Esas 4.924 **no las arregla ningún listón**: no hay hueco que medir. Sólo las
movería la interpolación, y eso es otra tanda.

### A2 · ⭐⭐ Lo que se pierde respecto a los 100 m — la resta, hecha

| listón | contestadas |
|---|---:|
| 100 m (tandas 34-35) | 6.421 |
| ⭐ **50 m (tanda 36)** | **4.562** |
| ⇒ **se pierden** | **1.859** |

**La previsión de la tanda 35 era 1.859. Acierta clavada.** ⚠️ Y se comprueba, no se
cita: la anterior —las «358 perdidas» del tope de adelanto— falló por un factor de
tres, y era mía.

⭐ **Va medido por dos caminos que no se hablan y se exige que coincidan:** un
contador que va consulta a consulta durante el barrido, y la resta de dos filas del
dial. Los dos dan 1.859. Y un tercero lo ata por detrás: **4.562 + 1.859 = 6.421**,
que es el número que la tanda 35 congeló — si la resta estuviera mal, la suma no
daría el congelado. Ese `exige` está puesto y es el que se queda vigilando.

⚠️ **Lo que se pierde no desaparece: se convierte en sugerencia.** Las 1.859 siguen
sabiendo su número, su acera y el tamaño de su hueco. Lo que pierden es que la app
decida sola.

### A3 · ⭐ El dial entero, limpio

⛔ Éste es el que hay que mirar. El que publicó la tanda 33 llevaba el centinela
dentro. El denominador son las **16.897** consultas que la regla llega a evaluar, y
no cambia de fila a fila: sólo se mueve dónde cae el corte.

| listón | contestadas | sin respuesta | % contestadas |
|---:|---:|---:|---:|
| 25 m | 2.604 | 14.293 | 15,4 % |
| **50 m** ⭐ el aplicado | **4.562** | **12.335** | **27,0 %** |
| 75 m | 5.630 | 11.267 | 33,3 % |
| 100 m | 6.421 | 10.476 | 38,0 % |
| 150 m | 7.289 | 9.608 | 43,1 % |
| 200 m | 7.995 | 8.902 | 47,3 % |

⭐ **No hay ningún acantilado.** La curva no tiene ni un codo: **cada duplicación del
listón compra unos diez puntos de cobertura, y cada una menos que la anterior**
(25→50: +11,6 · 50→100: +11,0 · 100→200: +9,3). ⇒ **ningún valor de este dial se
defiende solo**; el listón es una decisión sobre cuánto error se acepta a cambio de
cuánta cobertura, y ésa no es mía.

⭐ Y la fila del listón aplicado **tiene que dar exactamente lo que devuelve el
buscador** (4.562 = 4.562), exigido. Es el nº141 —*un dial que no reproduce la
regla mide otra cosa*— puesto como comprobación en vez de como frase.

---

## ⭐ B · Qué contestan ahora, enteras

### El caso de Antonio — `Avenida Cataluña 78`

```
   estado      sin-numero-cerca   [vía par-impar]
   respuesta   ⛔ NO SE TIENE — solo sugerencia
   aviso      «el 78 no existe · en su acera, la de los pares, los más cercanos
               son el 74 y el 84, y entre ellos hay 175 m»
      ⭐ su acera  nº74   175 m   un extremo del hueco
      ⭐ su acera  nº84   175 m   un extremo del hueco
```

**Igual que ayer.** El 77 sigue fuera —está a 258 m del 74— y no entra ni por el
radio de 150. El hueco de 175 m pasaba de 100 y pasa de 50: el listón nuevo no lo
toca.

### `Avenida Pablo Gargallo 16`

```
   estado      sin-numero-cerca   [vía no-verificable]
   respuesta   ⛔ NO SE TIENE — solo sugerencia
   aviso      «el 16 no existe · en esta vía los pares empiezan en el 36,
               10 números más adelante»
      ⭐ su acera  nº36   NO CONSTA la distancia: fuera del tramo numerado
```

**Igual que ayer.** Cae **fuera** del tramo, no dentro de un hueco: aquí no hay
listón que valga, y los dos portales de enfrente (nº17 a 52 m y nº15 a 47 m calle
abajo) los sigue frenando el tope de adelanto de 20 m.

### ⭐⭐ La que enseña qué se pierde — `Avenida Cesáreo Alierta 79`

Hoy, con el listón a 50:

```
   estado      sin-numero-cerca   [vía par-impar]
   respuesta   ⛔ NO SE TIENE — solo sugerencia
   aviso      «el 79 no existe · en su acera, la de los impares, los más cercanos
               son el 71 y el 83, y entre ellos hay 77 m
               · enfrente tienes el 80 a 49 m, cruzando»
      ⭐ su acera  nº71    77 m   un extremo del hueco
      ⭐ su acera  nº83    77 m   un extremo del hueco
      ⛔ ENFRENTE  nº80    49 m   75° ancho  (calle abajo 12 m · cruzando 47 m)
```

Con el listón a 100 **contestaba**: *«te dejo en el 83, en su acera · el 79 caería
como mucho a 77 m»*.

⭐⭐ **Y esto es exactamente el argumento de diseño de Antonio.** Lo que se pierde
es que la app te deje sola en el 83 con 77 metros de error callado. Lo que se gana
es que te lo diga y te ponga tres opciones delante — **incluida una que el listón
alto te ocultaba**: el 80 está enfrente, a 49 m, y son 47 de cruzar y sólo 12 calle
abajo. Es una avenida ancha y el de enfrente está a tu altura.

⚠️ Con el listón a 100 esa sugerencia **no se emitía**, porque la consulta ni
siquiera llegaba a ser una sugerencia. Bajar el listón no sólo quita respuestas:
también destapa opciones.

---

## ⭐⭐ C · Las siete rutas

| ruta | tanda 16 | ahora | |
|---:|---:|---:|---|
| 1 | 3.086,9 | ⛔ SUGERENCIA | O+D sin respuesta · aceptando la 1ª (nº74 → nº36): 2.832,1 m |
| 2 | 598,1 | **598,1** | ✅ idéntica |
| 3 | 3.704,9 | (POI) | origen en **nº10**, intacto |
| 4 | 505,9 | (POI) | — |
| 5 | 477,4 | (POI) | — |
| 6 | 523,4 | **520,2** | −3,2 m, de la tanda 33 · sin cambio hoy |
| **7** | 2.528,9 | **2.528,9** | ⭐⭐ **INTACTA** |

**Ninguna ruta se mueve.** La 7 tiene sus dos extremos exactos y la calibración de
los ~6 km/h no está en cuestión. `modelo-rutas.js`: 6 rutas clavadas, 56/56 pasos,
la nº1 sigue en sugerencia.

### ⚠️ La ruta 3 — la pregunta del encargo, contestada

`Cantando Bajo la Lluvia 6` **no se mueve, y no por poco: la regla ni la mira.**

```
   estado      numero-aproximado   [como-siempre · vía un-solo-lado]
   respuesta   nº10
   aviso      «el 6 no existe · te dejo en el 10, el más cercano de su misma acera»
```

Dos motivos, y cualquiera de los dos basta:

1. **El candado.** El 6 y el 10 son los dos pares: la respuesta de hoy ya es de su
   acera, así que la regla de paridad no toca nada. Es el invariante que la tanda 33
   dejó escrito, y se comprueba sobre las 51.065 consultas: **0 excepciones**.
2. **La vía tiene un solo lado** — 38 pares y **cero impares**. No hay acera de
   enfrente a la que mandar a nadie.

⚠️ **¿A qué distancia está?** El 6 cae **dos números antes del primero** de la calle
(la numeración empieza en el 10). ⇒ **NO CONSTA, y no en el sentido de que no lo
haya mirado**: no está entre dos portales, así que no hay hueco que medir, y decir
un número exigiría interpolar hacia fuera del tramo. Lo que sí se puede enseñar es
el paso local, medido: del **nº10 al nº12 hay 19,8 m**, y el nº14 está a 36,0 m del
nº10. ⛔ Multiplicar eso por dos hacia atrás sería interpolar, y hoy no se interpola.

---

## D · Los congelados

| número | antes | ahora | |
|---|---:|---:|---|
| `buscador.contestadas` | 6.421 | **4.562** | ⭐ depende del listón |
| `buscador.pedibles` | 51.065 | 51.065 | no depende |
| `buscador.huecos` | 23.184 | 23.184 | no depende |
| `buscador.cambianAcera` | 16.981 | 16.981 | no depende |
| `buscador.sinNumero` | 117 | 117 | el positivo de control |

⭐ **Y queda escrito en el propio fichero que este número se ha movido dos veces:**
`4.562 (tanda 33) → 6.421 (tanda 34) → 4.562 (tanda 36)`, con las dos razones y con
el hecho de que la segunda mudanza deshace una decisión tomada sobre un artefacto.

⚠️ **Lo que esa fila enseña de sí misma, y es incómodo:** el 6.421 estuvo congelado
y en verde, y **era correcto**. Lo que estaba mal era la razón por la que se eligió
el listón que lo producía. ⇒ **congelar preserva los errores con la misma fidelidad
que las verdades.** Un número congelado protege del cambio silencioso, no de haber
decidido sobre un artefacto.

---

## ⚠️ E · Las filas que no esperaba

### E1 · Bajar un listón **sube** las sugerencias de enfrente

Las sugerencias de la acera de enfrente pasan de **2.986 a 3.885 (+899)** sin haber
tocado ni el radio ni el tope. El motivo es mecánico: la población de partida son
*las consultas que se quedan sin respuesta de su propia acera*, y al bajar el listón
caen ahí 1.859 más.

⭐ **Lo que no se mueve es la mezcla**, y eso es lo interesante:

| | tanda 35 (n=2.986) | tanda 36 (n=3.885) |
|---|---:|---:|
| ⭐ ancho — está cruzando | 71,7 % | **71,5 %** |
| ⛔ desfase — está calle abajo | 28,3 % | **28,5 %** |
| ⭐⭐ el apriete: cabe en el ancho de su calle | 63,9 % | **64,3 %** |

Que la clasificación aguante al cambiar la población en un tercio es **un indicio**
de que mide algo de la calle y no del listón. ⛔ **Un indicio, no una prueba:** nadie
ha ido a mirar ninguna acera.

⚠️ Y una consecuencia práctica: **las cifras de «lo que se pierde por el tope» de la
tanda 35 dependen del otro listón.** Hoy salen 1.368 «ancho» perdidas donde ayer
salían 1.206. **No es que el tope haya cambiado** —sigue en 20 m—: es que hay 899
consultas más entrando en el reparto. Va impreso en el propio medidor para que
nadie compare las dos tablas creyendo que mide lo mismo.

### E2 · ⛔ La procedencia escrita en el código no era la publicada

`paridad.js` decía, en el comentario que justifica el listón:

> *«30.239 pares medidos: mediana 14 m, p75 23 m, **p90 48 m**, p95 82 m»*

Y `docs/H1-PARIDAD.md` §A2 publicó, **en el mismo commit y con el mismo bucle de
medida**: 30.283 · 14 · **24** · **52** · **91**. Que es lo que sale hoy, clavado.

⇒ **El fichero que ES la regla llevaba tres tandas declarando una procedencia que
nunca coincidió con la publicada.** Sobrevivió porque **ningún guardián lo comparaba
con nada**: el que vigila el listón lee el reparto *medido*, no el *escrito*, y los
50 m caen dentro de los dos.

⛔ **De dónde salieron esos cuatro números: NO CONSTA.** Probé las tres variantes que
podrían explicar una población de 30.239 —sin el filtro de portales repetidos, con el
centinela dentro, y las dos a la vez— y **ninguna los reproduce**. No los produce
ninguna versión del código que esté en el repositorio: salieron de un borrador que
nunca se commiteó.

Corregido, y el reparto entero pasa a estar exigido en `medir-paridad.js` §A2.

⭐⭐ **Y el rojo se ha provocado poniéndole al guardián los números del propio
comentario** (p90 48 · p95 82). Salta y dice cuáles se mueven y a qué:

```
   ⭐ ¿el reparto sigue siendo el que publicó la tanda 33?   ⛔ se mueve: p90, p95
   ⛔ FALLO · el reparto del que sale el listón se ha movido en p90, p95:
      publicado n 30283 · p75 24 · p90 48 · p95 82, ahora n 30283 · p75 24 · p90 52 · p95 91
```

⇒ **Si este guardián hubiera existido el primer día, habría cazado el comentario esa
misma tarde.** No es una hipótesis: es literalmente lo que acaba de pasar al meterle
sus números.

---

## ⚠️ F · Qué busqué y no encontré · qué NO he comprobado

| | |
|---|---|
| **Alguna ruta que se moviera** | Ninguna. Y era lo previsto: esta tanda sólo **retira** respuestas, y las siete rutas o son exactas o caen en el candado. Se comprueba, no se anuncia. |
| **Un acantilado en el dial limpio** | ⭐ **No hay ninguno**, en ningún punto entre 25 y 200 m. Lo busqué expresamente porque la decisión anterior se tomó sobre uno. |
| **Otro cuadre de acuerdo sobre el artefacto** | No he encontrado ninguno nuevo. ⚠️ Pero sólo he mirado los que tocan el listón: la auditoría de los siete cuadres de la tanda 35 revisó su **forma**, no fue a buscarles el artefacto a cada uno. |
| ⛔ **Si el hueco de 77 m del Alierta es «mucho» para una persona** | **NO CONSTA.** El listón sale de la geometría del callejero, no de nadie andando. |
| ⛔ **Si cruzar esos 47 m es poco camino de verdad** | **NO CONSTA.** Sigo midiendo la recta entre portales, no el rodeo hasta el paso de peatones. |
| ⛔ **Qué direcciones pide la gente de verdad** | **NO CONSTA.** Todos los porcentajes de este informe pesan cada consulta igual: el nº 7 de una calle sin nadie cuenta lo mismo que el 79 de Cesáreo Alierta. |
| ⛔ **Si el portal está físicamente en la acera que dice el callejero** | **NO CONSTA.** Los 76 enganchados a la acera contraria siguen ahí, marcados y sin mover. |

---

## G · Verificación

| | |
|---|---|
| batería `--todo` | **57 scripts · invariante cumplido en los 57 · código 0** · ninguno estrellado |
| rojos declarados | los mismos cinco, ni uno más: `auditoria-guardianes` · `donde-falta` · `modelo-rutas` · `pasos` · `rutas-antonio` |
| las cuatro paradas provocadas | P1 · P2 · P3 · P4 ✅, con sus positivos de control |
| los 26 congelados | ✅ código 0 · 26 filas verdes con el 4.562 nuevo · 2 de 2 roturas cazadas |
| el invariante de la paridad | **0** consultas cambian sin cambiar de acera, sobre 51.065 |
| el dial contra el buscador | ✅ 4.562 = 4.562 |
| las dos cuentas de lo perdido | ✅ 1.859 = 1.859, y 4.562 + 1.859 = 6.421 congelado |
| el recálculo de enfrente | ✅ 3.885 = 3.885 |
| el rojo del guardián nuevo (§E2) | ✅ provocado y visto antes de dejarlo puesto |

---

## H · Mi fallo de esta tanda

| nº | qué |
|---:|---|
| **144** | La procedencia del listón escrita en `paridad.js` (p90 48 · p95 82) **nunca coincidió con la publicada** (52 · 91), y sobrevivió tres tandas porque ningún guardián comparaba ese número con nada. §E2. |

⭐ **La ley que sale:** *un número copiado a un comentario no está publicado: está
escondido.* La tabla de `docs/` tenía el dato bueno y el fichero que manda tenía el
malo, y quien lee el código para entender por qué el listón vale 50 **lee el malo**.
⇒ Es el nº142 otra vez —*la cifra que entra en una decisión es la del texto*— con el
texto dentro del código. Y el arreglo es el mismo: no corregir la frase, sino
**hacer que el número tenga que pasar por una comparación**.
