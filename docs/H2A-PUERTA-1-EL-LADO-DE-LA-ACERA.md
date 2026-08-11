# H2a · Tanda 7 · Puerta 1 — el veredicto deja de mentir

**Fecha:** 12/08/2026 · **Base:** `df8b040` · **Puerta 1 de 3.** Las puertas 2 y 3 **no se han
abierto**: ver §7.
**⭐⭐⭐ VEREDICTO: el `ACERA` del 20,7 % SÍ se desinfla, y no por donde se esperaba. No es que los
enlaces crucen mal — es que sobre el 41,8 % de ellos la pregunta NO SE PUEDE FORMULAR, y el
instrumento solo alcanza al 6,7 % de las aristas del camino.**

---

## §1 · Qué se preguntaba

H2·6 publicó **20,7 % `ACERA`** sobre 324 enlaces. Pero ese `ACERA` significa *«el camino va por
aristas de tipo acera»*, **no «va por la acera correcta»**. La tesis del hito —*«nosotros lo
calculamos andando, así que sabemos por qué lado»*— cuelga de la segunda lectura, y llevaba cuatro
tandas sin comprobarse.

⛔ **Va antes que los 2.538 porque si el veredicto nace mintiendo, calcular con él es tirar la tanda
entera.**

**Instrumento:** [`tools/grafo/lado-de-la-acera.js`](../tools/grafo/lado-de-la-acera.js), sobre
`R.construir(R.ZONA_TERMINO)` — el grafo del motor (ley 148).

### 1.1 · La misma muestra de ayer, demostrada

```
   paradas de bus ....... 934    (H2·6 publicó 934)     ✅
   pares candidatos .... 2.266   (H2·6 publicó 2.266)   ✅
   muestra 1 de cada 7 ... 324   (H2·6 publicó 324)     ✅

   ACERA          67   20,7 %     H2·6 publicó   67     ✅
   EJE           254   78,4 %     H2·6 publicó  254     ✅
   MISMA ARISTA    3    0,9 %     H2·6 publicó    3     ✅
   SIN CAMINO      0    0,0 %     H2·6 publicó    0     ✅
```

⭐ **Las cuatro cifras se exigen con `A.exige`, no se comparan a ojo.** Si el universo se hubiera
movido, este script para antes de decir nada del lado de la acera.

---

## §2 · ⭐⭐ La cobertura, declarada sobre el MODELO (ley 150)

`src/acera-equivocada.js` sabe de qué lado está una arista **solo cuando cuelgan de ella ≥4 portales
de una misma vía y ≥75 % son de la misma paridad**. Fuera de ahí la pregunta **no se puede ni
formular**.

```
   aristas del grafo ............................. 98.774
   ⭐ aristas con LADO decidible ..................  2.397   (2,4 % del grafo)
   aristas donde dos vías se contradicen ..........     18   (descartadas)
```

| clase de arista | en el grafo | con lado | ¿puede el instrumento ponerse rojo? |
|---|---:|---:|---|
| `eje-de-calzada` | 46.643 | 942 | ⛔ **NUNCA** — un eje no tiene dos lados |
| `peatonal` | 21.552 | 386 | ✅ donde hay paridad dominante |
| `acera` | 16.858 | 975 | ✅ donde hay paridad dominante |
| `paso-de-peatones` | 10.494 | 0 | ⛔ en ninguna |
| `eje-con-acera-declarada` | 2.418 | 94 | ⛔ **NUNCA** |
| `escaleras` | 809 | 0 | ⛔ en ninguna |

⚠️ **Las 942 y las 94 de los ejes están contadas y NO se usan**: tienen paridad dominante porque los
portales de las dos aceras cuelgan de la misma línea, y eso no es un lado. Se enseñan para que se
vea que el filtro no es un descuido.

---

## §3 · ⭐⭐⭐ Los 67 enlaces `ACERA`, uno a uno

**Cuatro respuestas y ninguna es «otros»:**

```
   MISMO LADO             33    49,3 %
   CAMBIA CON PASO         6     9,0 %
   CAMBIA SIN PASO         0     0,0 %
   ⚠️ NO DECIDIBLE        28    41,8 %
```

⛔⛔ **Y lo que `CAMBIA SIN PASO` NO significa, dicho antes que el número** (ley 145): **no es
«cruza la calle a lo loco»**. Doblar la esquina cambia de acera sin ningún paso y es perfectamente
legítimo. Lo que marca es que **el camino pasa de un lado al otro y el dato no dice por dónde**.
*La primera versión de este informe lo llamaba `CRUZA CALLADO`, y ese nombre prometía más de lo que
el instrumento sabe.*

### 3.1 · ⛔⛔ El número que desinfla la tesis

```
   aristas del camino con lado decidible ........  58 de 867   (6,7 %)
   enlaces ACERA con las DOS puntas de lado conocido    7 de 67
   ⚠️ enlaces ACERA sobre los que el instrumento NO puede ponerse rojo   28 de 67  (41,8 %)
```

⇒ **De cada cien aristas que recorre un enlace «ACERA», sabemos de qué acera son SIETE.** Decir que
esos enlaces «van por la acera correcta» es una afirmación sobre el 6,7 % del camino.

### 3.2 · ⭐⭐⭐ El positivo de control de los ceros (ley 4 y ley 152)

**Un `0` sin positivo de control es indistinguible de un detector roto**, y aquí ese riesgo era
real: con el 6,7 % de cobertura, casi ningún camino llega a ver dos lados, así que el cero podía
ser un artefacto. ⇒ **Se provocan los dos veredictos a propósito**, buscando en el grafo dos aristas
de la misma vía con lados opuestos y ruteando entre ellas:

```
   intentos de provocación ......... 3
   CAMBIA CON PASO   ✅ PROVOCADO — vía 100, aristas 59106×58903: 101 m, 6 aristas, 2 pasos
   CAMBIA SIN PASO   ✅ PROVOCADO — vía 105, aristas 32495×32500:  45 m, 3 aristas, 0 pasos
```

⇒ **El instrumento sabe emitir los dos.** Su cero en la muestra es un cero de verdad **dentro de su
cobertura**, y la cobertura es del 6,7 %. Las dos mitades de la frase son necesarias.

---

## §4 · ⭐⭐ La población que no se puede vigilar — los 324 enteros

```
   enlaces con alguna PUNTA en eje de calzada ......... 176 de 324   (54,3 %)
   enlaces con LAS DOS puntas en eje ..................  53 de 324   (16,4 %)
   ⭐ enlaces sobre los que la pregunta SE PUEDE FORMULAR  131 de 324   (40,4 %)
```

⇒ **193 de 324 enlaces (59,6 %) no salen aprobados: salen SIN EXAMINAR.** Es la ley 150 en números,
y es la respuesta honesta a *«¿va por la acera correcta?»*: **sobre seis de cada diez enlaces, no se
puede saber con el dato de hoy.**

---

## §5 · ⭐⭐ `MISMA ARISTA` — la categoría que la tanda de arreglo 8 dejó caducada

H2·6 la definió como *«el grafo no las distingue **y el metraje es falso**»*. **Desde el 12/08 el
metraje ya no es falso**, así que media definición se cayó sola.

```
   pares bus×bus con las dos puntas en la misma arista ....  16 de 2.266   (0,7 %)
   pares bus↔tranvía en el radio · con la misma arista ....  272 · 3
   ⭐ sobre los 2.538 del hito ............................  19 pares      (0,7 %)

   de qué clase es la arista que comparten (bus×bus):
      acera             9    ⇒ el enlace sería ACERA
      eje-de-calzada    7    ⇒ el enlace sería EJE
```

⭐⭐ **DECISIÓN: `MISMA ARISTA` deja de ser un VEREDICTO y pasa a ser una MARCA.**

**El argumento:** la mitad que la justificaba —el metraje falso— ya no existe. Lo que queda —*«el
grafo no distingue las dos paradas»*— **no es una cuarta clase de camino**: es una propiedad de su
arista, y por esa arista se clasifica igual que todos los demás (9 serían `ACERA`, 7 serían `EJE`).
⚠️ **Pero la marca no se tira:** sigue siendo el caso donde dos paradas con nombres distintos son el
mismo punto para el grafo, y **eso el usuario tiene derecho a saberlo**. ⛔ Lo que se retira es la
palabra «falso».

⭐ **Y de paso, un cruce hacia atrás que sale gratis:** los pares bus↔tranvía dentro del radio salen
**272**, exactamente los que el hito viene arrastrando desde la tanda 4. **2.266 + 272 = 2.538**, la
cuarta vez que esa suma cierra con instrumentos distintos.

---

## §6 · ⭐⭐⭐ Ley 155 — el experimento que mataría la explicación de ayer

`docs/H1-ARREGLO-8-MISMA-ARISTA.md` §6 midió que **58 de 60 edificios tienen puertas candidatas
compartiendo arista** y que **ninguno cambió**. La causa propuesta, marcada `CAUSA NO CONFIRMADA`:
*«desde un origen lejano el coste lo domina la aproximación»*.

**Su predicción falsable: un origen que SÍ comparta arista con una candidata tiene que cambiar.**

**Instrumento:** [`tools/grafo/prueba-ley-155.js`](../tools/grafo/prueba-ley-155.js). El «antes» se
consigue pasándole a `rutaAEdificio` un `G` con el `insertar` anterior al arreglo, y **se valida
contra el rojo de la tanda 8**: `CALLE ALFONSO I 12 × 17` → 32,5 m antes, 11,9 m después. ✅

**25 casos deterministas** (los 25 primeros edificios cuyo contorno tiene una candidata de la que
además cuelga un portal real):

```
   casos donde CAMBIAN los metros ......... 11 de 25   (44,0 %)
   casos donde CAMBIA la puerta elegida ... 11 de 25
   reparto de Δ ........................... mín −68,9 m · p50 −14,4 m · máx −1,0 m

   Automóviles Sánchez        CAMINO DE LA NOGUERA 1     70,3 → 1,4 m    la puerta se mueve 48,4 m
   Biblioteca Ignacio Jordán  GRAN VÍA DE DON SANCHO     59,9 → 1,2 m    la puerta se mueve 45,0 m
   (sin nombre) 39354196      PASEO REYES DE ARAGÓN 5-6 125,5 → 73,6 m   la puerta se mueve 38,1 m
```

⇒ ✅ **LA EXPLICACIÓN DE AYER SOBREVIVE, y deja de ser `CAUSA NO CONFIRMADA`.** Que los 58 de 60 no
se movieran era **inercia por construcción** —el origen estaba fuera de la arista— **y no
casualidad**.

⚠️ **Y con ella entra un hallazgo que ayer no se veía:** existe una clase real donde el arreglo de
la tanda 8 **sí cambia lo que devuelve H1** —origen sobre la arista de una puerta—, y **cambia
mucho**: 70,3 m pasan a 1,4 m. ⛔ **Ningún número publicado depende de esa clase** (las diez rutas
no la contienen, medido ayer), así que **no invalida nada** — pero **la afirmación «el arreglo no
mueve nada de H1» hay que leerla con su alcance: no mueve nada de lo PUBLICADO.**

---

## §7 · ⛔ Lo que esta tanda NO ha hecho

**Las puertas 2 y 3 no se han abierto.** La Puerta 1 se cierra aquí, con sus resultados enseñados,
que es exactamente lo que el encargo pedía antes de pasar a la siguiente. Queda para la próxima:

- **Puerta 2**: el cálculo de los 2.538 enlaces, las predicciones selladas antes, los cruces hacia
  atrás y el tamaño del artefacto.
- **Puerta 3**: dónde queda escrito cada límite.

⚠️ Y de la Puerta 1 misma, lo que **no** se ha medido:

- **Si un `MISMO LADO` es el lado CORRECTO respecto a la parada**, y no solo «el camino no cambia
  de acera». Que no cambie de lado no dice que empiece en el bueno.
- **Los 193 enlaces sin examinar** siguen sin examinar: haría falta otro testigo del lado, y el
  proyecto ya descartó el cuarto testigo (el orden de los números) por ciego al fallo que arrastra
  vecinos.
- **La cobertura del 6,7 % no se ha intentado subir.** Bajar el listón de `≥4 portales · 75 %`
  aumentaría la cobertura y la tasa de error a la vez, y eso es una decisión, no un ajuste.

---

## §8 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **El `ACERA` del 20,7 % se desinfla: de sus 67 enlaces, 28 (41,8 %) son NO DECIDIBLES.** Y
   sobre los 324 enteros, **la pregunta solo se puede formular en 131 (40,4 %)**. ⇒ *«Sabemos por
   qué acera»* es cierto **sobre el 6,7 % de las aristas que se recorren**, y falso como frase
   general.
2. ⭐⭐ **Solo 2.397 de 98.774 aristas (2,4 %) tienen lado decidible.** No es un problema del
   instrumento: es que **el 47,2 % del grafo es eje de calzada**, donde el lado no existe.
3. ⭐ **Cero `CAMBIA SIN PASO` en la muestra, y el cero tiene positivo de control**: los dos
   veredictos se provocaron a propósito. ⛔ Sin esa provocación el cero no valía nada.
4. ⭐⭐ **`MISMA ARISTA` deja de ser veredicto y pasa a ser marca** — son **19 de 2.538 (0,7 %)**: 16
   bus×bus y 3 bus↔tranvía. De los 16, **9 serían ACERA y 7 EJE**.
5. ⭐⭐ **La explicación de la tanda 8 sobrevive al experimento que la mataría** (ley 155): con el
   origen sobre la arista de una candidata, **11 de 25 cambian**, hasta −68,9 m. **Deja de ser
   `CAUSA NO CONFIRMADA`.**
6. ⚠️ **Y con ella, el alcance exacto de «el arreglo no mueve H1»: no mueve nada de lo PUBLICADO.**
   Existe una clase donde sí cambia lo que devuelve el motor, y no está en las diez rutas.
7. ⭐ **Los 272 pares bus↔tranvía salen solos del radio de 300 m** — cuarta vez que `2.266 + 272 =
   2.538` cierra con instrumentos distintos.

---

**Instrumentos:** [`tools/grafo/lado-de-la-acera.js`](../tools/grafo/lado-de-la-acera.js) ·
[`tools/grafo/prueba-ley-155.js`](../tools/grafo/prueba-ley-155.js)
