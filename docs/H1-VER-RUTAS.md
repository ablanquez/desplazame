# H1 · VER LAS RUTAS

*Tanda 16 · 2026-08-04 · «las rutas corren pero yo no las he visto pintadas para ver si son
coherentes» (Antonio).*

> **Este documento se AÑADE, no reescribe nada.**
> ⛔ Esta tanda **MUESTRA lo que ya hay**. No cambia el motor, ni el enganche, ni D0–D5. Lo que se ha
> visto torcido va **declarado, no arreglado**.

```
node src/ruta.js "Coso 33" "Plaza San Francisco"     # una ruta cualquiera, en texto
node src/ruta.js --json <latO> <lonO> <latD> <lonD>  # la salida de máquina, la de siempre
node src/exportar-rutas.js                           # genera tools/rutas-visor.js + el cuadre
node src/probar-visor-rutas.js                       # las comprobaciones del visor
tools/visor-rutas.html                               # doble clic
```

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐ el cuadre** | Las siete rutas: **lo pintado == lo calculado**, dentro de **0,2 m**. Y el contador de la derecha **se recalcula con el motor**, no se lee del propio fichero. |
| **⚠️⚠️ el hallazgo** | La ruta **nº7 —la de calibración— va 1,27 km por un `highway=cycleway`**: la mitad del trayecto del que sale la velocidad de toda la tabla. **No es un fallo del motor** (`cycleway` está en la lista positiva desde el diseño) pero **nadie lo había visto**. |
| **⛔ la acera** | `NO CONSTA`, con positivo de control: **0 de 9.634** aceras de Zaragoza declaran el lado. Decirlo sería inventarlo. |
| **⚠️ lo que sale mal** | Bitácora nº92: escribí **dos veces** la comprobación «el mapa dice lo mismo que la terminal» de forma que **no podía fallar**. La segunda era literalmente un espejo. |

---

## A · EL TEXTO, SALTO A SALTO

### La regla que gobierna toda la redacción

> **EL MOTOR SABE MENOS DE LO QUE UN TEXTO BONITO SUGIERE.**

⛔ No sabe si giras a izquierda o derecha. No sabe cuántos semáforos hay. No sabe si la calle sube.
Si el texto dijera *«gira a la derecha»* estaría **inventando**, y un motor que inventa una vez no se
distingue de uno que inventa siempre.

⇒ Cada frase dice **solo** lo que el grafo sabe: por qué calle va, cuántos metros, qué tipo de vía
es, la precisión con la que lo sabe (D4), y si es un paso condicional —con el nombre del sitio si el
dato lo trae, y *«un edificio»* si no—.

### ⛔ La acera: `NO CONSTA`, y no por falta de método

El encargo pedía *«acera de los impares»* cuando el lado esté determinado. **Ese campo no existe.**

```
   ways con footway=sidewalk                              9.634
   de ellos, con algo que diga el LADO                        0
     (sidewalk:side · side · is_sidepath:of:name)
   ⭐ POSITIVO DE CONTROL, con el MISMO buscador:
      con surface  7.759        con name  3.179
```

⇒ El buscador funciona; **el lado no está mapeado en Zaragoza**. `precision: 'acera'` significa *«esta
arista ES una acera»*, no *«es la acera de los pares»*. **Se calla, y se dice que se calla** — en la
última línea de cada ruta.

### ⚠️ El tiempo es una derivada (ley 45)

Sale de dividir los metros por **~6 km/h**, y esa constante **cuelga de UN solo trayecto**: los ~25
min de la ruta nº7 sobre 2,4–2,6 km medidos. Si fueran 22 min, todos los tiempos se mueven un 14 %.
**Va dicho en la cabecera de cada ruta**, no presentado como dato del motor.

### ⭐ Fuente única

`src/relato.js` lo usan **los tres**: `ruta.js` (terminal), `rutas-antonio.js` (las siete) y el
exportador del visor. ⛔ **No hay un segundo redactor.** Este proyecto ya tiene dos casos de
divergencia por copiar: las bandas (nº74) y los dos motores de ruta (nº68).

Y hay un **cuadre mecánico** entre el desglose de metros por arista (A6) y el relato: si alguien toca
uno de los dos y dejan de sumar lo mismo, `Al.exige` lo para.

### ⚠️ Agrupar es borrar — y aquí se agrupa

`rutaEntre` corta por *way* de OSM, y una calle real son varios ways. La nº2 salía con «Por Calle
Pedro Atarés 26 m» y «Por Calle Pedro Atarés 16 m» seguidos. Se funden los tramos **idénticos en todo
lo que se cuenta** (nombre, tipo, avisos), ⛔ nunca los parecidos — dos tramos de la misma calle con
precisión distinta siguen separados, porque esa diferencia es lo que hay que ver. **Y el número de
ways fundidos sale impreso**, así que la fusión no puede esconder nada.

---

## ⭐ A7 · LA RUTA nº2, ENTERA — la que tenía la pregunta abierta

```
  Calle Manifestación 6  →  Calle Don Jaime I 17
  ──────────────────────────────────────────────
  598 m · unos 6 min · rodeo 1,32
  ⚠️ el tiempo es una estimación a 6 km/h, la velocidad de Antonio calibrada sobre
     UN solo trayecto. No es un dato del motor.
  enganche: 7 m en el origen, 7 m en el destino

   1. ◦ Por Calle Manifestación (calzada con acera declarada)    51 m
   2.   Por Plaza del Justicia (calle peatonal)                 25 m
   3.   Por Calle Santa Isabel (calle peatonal)                152 m
   4.   Por Calle Miguel Molino (calle peatonal)                30 m
   5.   Por Calle Pedro Atarés (calle peatonal)                 42 m   · 2 tramos de OSM
   6.   Por Calle de Jussepe Martínez (calle peatonal)         108 m   · 3 tramos de OSM
   7.   Por Calle de Santa Cruz (calle peatonal)                51 m   · 2 tramos de OSM
   8.   Por Calle de Casto Méndez Núñez (calle peatonal)        84 m   · 3 tramos de OSM
   9.   Por Calle de Don Jaime I (calle peatonal)               54 m

       TOTAL                                                  598 m

   ◦  1 de los 9 tramos (51 m, el 9 % del recorrido) van por el EJE DE LA CALZADA:
      ahí no tengo la acera dibujada, así que los metros pueden bailar.

   ⛔ Lo que este motor NO sabe, y por eso no lo dice: giros, semáforos, cuestas,
      obras, ni por cuál de las dos aceras vas. El lado de la acera no está en el
      dato: 0 de 9.634 aceras de Zaragoza lo declaran.
```

**Ocho de los nueve tramos son calle peatonal.** El rodeo es 1,32 sobre una recta de 454 m, dentro
del ≤1,45 de Antonio. ⇒ **La pregunta sigue siendo suya:** ¿va por ahí, o hay un camino evidente por
el casco que el motor no ve?

### Y otra distinta, para ver el formato en otro caso — la nº7, la de calibración

```
  Calle El Coloso 2  →  Calle Valle de Zuriza 48
  2,53 km · unos 25 min · rodeo 1,06
  enganche: 8 m en el origen, 16 m en el destino

    1. ◦ Por Calle de El Coloso (eje de calzada)                 28 m
    2. ◦ Por un tramo sin nombre (eje de calzada)             1,27 km   · 3 tramos de OSM
    3. ◦ Por Calle de Juslibol (eje de calzada)                   4 m
    4. ◦ Por Avenida de San Juan de la Peña (eje de calzada)    753 m   · 6 tramos de OSM
    …
   13.   Por un tramo sin nombre (calle peatonal)               170 m   · 5 tramos de OSM
   14. ◦ Por Calle Caminos del Norte (calzada con acera declarada)    31 m
   15. ◦ Por Calle del Valle de Zuriza (calzada con acera declarada)  107 m   · 2 tramos de OSM

        TOTAL                                                2,53 km

   ◦  13 de los 15 tramos (2,35 km, el 93 % del recorrido) van por el EJE DE LA CALZADA
```

---

## ⚠️⚠️ EL HALLAZGO — y va declarado, no arreglado

**El tramo 2 de la ruta nº7 son 1.269 m por `highway=cycleway`.** Dos ways sin nombre
(`354344721` y `475881583`), en el corredor del Actur.

```
   way 354344721   {"highway":"cycleway"}
   way 475881583   {"highway":"cycleway","oneway":"yes"}
```

**Y no es un fallo del motor.** Comprobado antes de decir nada:

- `cycleway` **está en la lista positiva** de `VIARIO_ANDABLE` desde el diseño del grafo, con el
  comentario `// compartidas`. Es una decisión tomada, no un descuido.
- El motor **sí mira `foot=no`**: de los 1.503 `cycleway` del término, **49 lo declaran y están
  excluidos**. Estos dos no dicen nada.

⇒ **Lo que hay aquí no es un error: es un hecho que nadie había visto.** La ruta **de calibración**
—de la que sale la velocidad de ~6 km/h de **toda** la tabla— manda a un peatón **la mitad del
trayecto por un carril bici**. Si Antonio anda por ahí, perfecto y la calibración es buena. Si va por
otro sitio, **la constante de velocidad está calibrada sobre un trayecto que él no hace**.

⛔ **No lo he tocado.** Es decisión de Antonio, y toca H1 justo antes de auditarlo.

### Las otras rarezas, buscadas a propósito

Sobre **104 tramos mirados** en las siete rutas:

| qué se buscó | encontrado |
|---|---|
| vuelve a una calle por la que ya pasó | 13 — **11 con solo un cruce de por medio (normal)**, ⭐ **2 con un rodeo** |
| tramos sin nombre de ≥100 m | 8 (el mayor, los 1.269 m de la nº7) |
| tramos de 0 m | 1 (el corte del enganche cae sobre un vértice) |
| enganches a más de 30 m del punto pedido | **0** ⚠️ de **catorce** extremos: catorce no es una muestra |

⚠️ **Las dos cuentas de la primera fila van juntas a propósito**: quedarme solo con el 2 escondería
que el criterio de «cruce» —paso de peatones o menos de 15 m— lo he puesto yo.

**Los 2 que hay que mirar:**
- **ruta 1**, «Avenida de Cataluña» en los tramos 4 y 6, con **74 m** de por medio
- **ruta 3**, «Avenida del Alcalde Gómez Laguna» en los tramos 27 y 29, con **71 m** de por medio

---

## B · EL VISOR — `tools/visor-rutas.html`

Fichero aparte del visor del grafo: aquél tiene 98.774 aristas en cinco capas y meterle siete rutas
encima lo convierte en una sopa. **Dos instrumentos, dos ficheros** — pero **el mismo redactor**.

- **Un check por ruta**, con su nombre legible y su color. ⚠️ **Al abrir, solo la 1**: siete rutas
  superpuestas en el casco no se distinguen.
- **Al pinchar un tramo**, el mismo texto de la terminal: calle, metros, tipo, avisos.
- **Origen y destino marcados**, y **la línea negra hasta el punto de enganche** cuando difiere — que
  es lo que enseña un enganche malo de un vistazo.
- **Los tramos con aviso se ven sin pinchar**: más gruesos y punteados (punteado fino = paso
  condicional).
- **Una ficha por ruta**: metros, minutos, rodeo, si entra en el tope, recta, tramos, banda.
- **Leyenda que se entiende sin haber leído nada**, y el aviso de que **el fondo también es OSM: el
  fondo sitúa, no verifica.**

⛔ Nada más: no hay buscador, ni cálculo, ni edición. `tools/rutas-visor.js` va **gitignoreado** por el
mismo motivo que `grafo-visor.js` — es un derivado. El patrón se probó con `git check-ignore` y con su
positivo de control (el HTML **no** debe estar ignorado).

---

## ⭐⭐ C · LAS COMPROBACIONES, ANTES DE QUE NADIE MIRE

### V0 · El simulador es un instrumento (ley 52) — se verifica ANTES de usarlo

Un Leaflet falso que no registrara nada daría 0 pintados, y si yo esperase 0, **pasaría**.

```
   polilíneas registradas (esperadas 8)     8  ✅
   círculos registrados (esperados 2)       2  ✅
   una polilínea creada y NO añadida        0  ✅ no la cuenta
```

La última línea es el negativo: lo que no se añade al mapa **no se cuenta**.

### ⭐⭐ C1 · EL CUADRE — lo pintado contra lo calculado

⛔ **Y el contador de la derecha NO sale del fichero**: se recalcula llamando al motor en memoria.
Comparar un fichero consigo mismo no demuestra nada — y de paso esto caza un `rutas-visor.js` viejo,
que es un fallo real y silencioso.

| nº | tramos pintados | metros pintados | motor (recalculado) | dif |
|---:|---:|---:|---|---:|
| 1 | 27 | 3.087,1 m | 3.086,9 m · 27 tramos | +0,20 ✅ |
| 2 | 9 | 598,2 m | 598,1 m · 9 tramos | +0,10 ✅ |
| 3 | 31 | 3.704,8 m | 3.704,9 m · 31 tramos | −0,10 ✅ |
| 4 | 11 | 505,7 m | 505,9 m · 11 tramos | −0,20 ✅ |
| 5 | 3 | 477,4 m | 477,4 m · 3 tramos | +0,00 ✅ |
| 6 | 8 | 523,4 m | 523,4 m · 8 tramos | +0,00 ✅ |
| 7 | 15 | 2.528,9 m | 2.528,9 m · 15 tramos | −0,00 ✅ |

```
   ⇒ ✅ SÍ CUADRAN — lo pintado es lo calculado
   tramos pintados en total                    104
      de ellos, destacados por llevar aviso     32
   marcas de origen y destino                   14   (esperadas 14)
   líneas portal→enganche dibujadas             11
```

*(La diferencia de ±0,2 m es el redondeo a un decimal de los metros por tramo, no un desajuste de
geometría: la polilínea se corta en el punto de enganche exacto.)*

### C2 · Contraprueba del tramo falso

```
   tramos pintados SIN el falso     104
   tramos pintados CON el falso     105    ✅ SE VE, y el contador lo declara
   tramos pintados tras BORRARLO    104    ✅ ya no está
```

⛔ El tramo falso **se copia de uno real** y solo se le cambia lo justo: si lo inventara entero, un
fallo de formato se leería como «el visor filtra».

### C3 · El texto del mapa es el texto de la terminal

**Y ésta es la que salió mal dos veces (bitácora nº92).** La versión que vale:

```
   (1) frases del fichero == frases del motor recalculado    104 de 104  ✅
   (2) frases del MAPA presentes en el TEXTO de la terminal    9 de 9    ✅
       ⭐ control: una frase inventada, ¿aparece?            ✅ NO — la comprobación distingue
```

Para (2) se calcula la ruta nº2 **desde el motor**, se genera **el texto que vería la terminal**, y se
busca dentro **cada frase del fichero del mapa**. Con su positivo de control: una frase que no existe
tiene que dar negativo, o `includes` estaría roto y el 9 de 9 no valdría nada.

### ⚠️ C4 · Lo que esto **NO** demuestra

- **Que se vea bien.** Colores distinguibles, capas tapándose, tamaño de los círculos, legibilidad de
  la leyenda. Eso solo lo dice un ojo delante del navegador, **y no lo tengo**.
- **Que el fondo coincida con el grafo.** Es la **misma fuente**: si una calle está mal en OSM, estará
  igual de mal en los dos. **El fondo sitúa, no verifica.**
- **Que la ruta sea la que andaría una persona.** Eso es exactamente lo que Antonio tiene que
  contestar.

---

## ⭐ D · LA LISTA PARA ANTONIO

### D1 · Qué mirar, en orden de lo que más cambia si está mal

1. **⚠️ RUTA 7 — el carril bici de 1,27 km.** Enciende la 7 y mira el tramo largo del principio.
   **¿Andas tú por ahí?** De esa ruta sale la velocidad de toda la tabla: si no vas por ese carril, la
   constante está calibrada sobre un trayecto que no haces. *(Es la pregunta más cara de las cuatro.)*
2. **⭐ RUTA 2 — la pregunta que quedó abierta.** Manifestación → Plaza del Justicia → Santa Isabel →
   Miguel Molino → Pedro Atarés → Jussepe Martínez → Santa Cruz → Méndez Núñez → Don Jaime I.
   **¿Irías por ahí, o hay un camino evidente por el casco que el motor no ve?**
3. **RUTA 1, tramos 4 y 6** — vuelve a Avenida de Cataluña con 74 m de por medio. **¿Es un cruce
   normal o está rodeando algo?**
4. **RUTA 3, tramos 27 y 29** — lo mismo en Avenida del Alcalde Gómez Laguna, 71 m.
5. **RUTA 3 y RUTA 4 — los tramos peatonales largos sin nombre** (308 m y 283 m). ¿Existen esos
   caminos, o son atajos por dentro de una parcela?
6. **Los catorce extremos** — mira si el círculo grande (punto pedido) está donde está el portal, y si
   la línea negra hasta el enganche va a la calle que toca.

### D2 · Las preguntas que solo tú puedes contestar

- **¿Irías por ahí?** ¿O hay un camino evidente que el motor no ve?
- **¿Alguna ruta cruza dos veces la misma calle o rodea una manzana por dentro?**
- **¿Alguna te mete por un descampado o un carril bici teniendo acera al lado?**
- **¿El enganche del portal está donde está el portal?**

### D3 · Cómo tirar las tuyas

```
node src/ruta.js "Calle Manifestación 6" "Calle Don Jaime I 17"
node src/ruta.js "Coso 33" "Plaza San Francisco"
```

Acepta direcciones (mismo geocodificador que las siete) o cuatro coordenadas
`latO lonO latD lonD`. Añade `casco` como primer argumento para usar el grafo del casco en vez del
término. ⚠️ Declara siempre por `stderr` **qué grafo está usando**.

---

## MÉTODO

### «¿Puede esto pasar o fallar sin que nada funcione?»

| verificación | podía | cómo se tapó |
|---|---|---|
| V0 · el simulador cuenta | **sí**, si no registrara nada | guion con 8 polilíneas y 2 círculos conocidos + el negativo |
| C1 · el cuadre de metros | **sí**, comparando el fichero consigo mismo | el lado derecho se **recalcula con el motor** |
| C2 · el tramo falso | **sí**, si el falso no cumpliera el formato | se copia de uno real y se cambia lo justo |
| C3 · mapa == terminal | ⛔ **y pasó, dos veces** | bitácora nº92. Ahora compara contra el texto generado, con control negativo |
| rareza «vuelve a la misma calle» | **sí**: cruzar una bocacalle la produce | se separan las dos cuentas y **se publican las dos** |
| la acera `NO CONSTA` | **sí**, con un buscador roto | positivo de control: `surface` 7.759, `name` 3.179 |

### Los diez ejes

| eje | tocado | cómo |
|---|---|---|
| posición | ✅✅ | la geometría pintada, cortada en el punto de enganche exacto |
| vecindad | ⛔ | no tocado en esta tanda |
| dirección | ⛔ | **no tocado** — el motor es simétrico, y por eso el texto no dice giros |
| identidad | ✅ | la frase del mapa contra la de la terminal, cadena a cadena |
| correspondencia | ✅✅ | tramo del texto ↔ polilínea del mapa, uno a uno |
| umbral/cola | ✅ | ±1 m de tolerancia en el cuadre, declarada |
| escala | ✅ | metros por tramo y total, con el cuadre |
| densidad | ⛔ | no tocado |
| agregación | ✅✅ | la fusión de tramos del mismo nombre, **con el contador de ways a la vista** |
| semántica | ✅✅ | toda la redacción: qué puede decir un tramo y qué sería inventarlo |

### Lo que se buscó a propósito y NO se encontró

- **Que el visor filtrara en silencio.** El tramo falso aparece y desaparece.
- **Que lo pintado no fuera lo calculado.** Cuadra a 0,2 m en las siete.
- **Que hubiera dos redactores.** Las 104 frases del mapa salen de `relato.js`, y las 9 de la nº2
  aparecen literales en el texto de la terminal.
- **Un enganche a más de 30 m** en los catorce extremos. ⚠️ Catorce no es una muestra.

### Lo que NO se ha comprobado

- **Que se vea bien.** No tengo navegador. Es la limitación grande de esta tanda.
- **Si las rutas son las que andaría una persona.** Ésa es la pregunta de Antonio, y sigue abierta.
- **Las rutas fuera de las siete.** El comando las acepta; no se ha barrido nada.
- **Si el corredor del Actur es paseable a pie**, más allá de que OSM no lo prohíba.

---

## Reportes hacia arriba

1. ⚠️⚠️ **La ruta de calibración va 1,27 km por un carril bici.** No es un fallo —`cycleway` está en
   la lista positiva por decisión de diseño y el motor sí respeta `foot=no`— pero **de esa ruta sale
   la velocidad de toda la tabla**. Si Antonio no anda por ahí, la constante está calibrada sobre un
   trayecto que no hace. **No lo he tocado.**
2. ⛔ **La acera no se puede decir.** 0 de 9.634. Lo que el encargo pedía en A4 no es posible con este
   dato, y el texto lo declara en cada ruta en vez de callarlo.
3. **`ruta.js` ahora contesta en texto por defecto.** El JSON sigue existiendo con `--json`, byte a
   byte como antes.

---

*Ejecutado el 2026-08-04. Sello del grafo `2026-08-03T08:19:51Z`. 104 tramos en siete rutas.
Bitácora nº92.*
