# H1 · `B2·V1` — QUÉ MIDE DE VERDAD EL CENSO DE AFIRMACIONES

*Tanda 3 · 2026-08-08 · el censo v2 declarado por lo que mide, no ampliado.*

> **Este documento se AÑADE, no reescribe nada.** No corrige el censo: lo declara.

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐ qué mide el censo v2** | **2.361 cifras que el propio documento MARCA como afirmación** — en negrita, detrás de un `⇒`, o dentro de una cita `>`. **No mide lo que el proyecto AFIRMA: mide lo que SUBRAYA.** |
| **⛔ y deja fuera la mitad de lo congelado** | De los **26 números congelados** —el único conjunto de afirmaciones que este proyecto ha declarado una a una— el censo v2 ve **13**. Deja fuera **13**. |
| **⚠️⚠️ y no puede ver un cero** | Su expresión de cifras exige **dos dígitos o más**. En sus 2.360 marcas **no hay un solo token de un dígito**. ⇒ un `0` publicado es invisible para él, y en este proyecto un cero publicado es justo lo que más testigo necesita. |
| **⛔ qué NO se ha hecho** | **Ampliarlo.** La v1 ya enseñó adónde lleva: clasificó 10.192 tokens como «afirmación» de 19.906 y casi todos eran celdas de tabla. Un denominador que no se puede recorrer entero es cobertura fingida. |

---

## A · LA MEDIDA

⭐⭐ **El control del cruce va primero.** Sin él, «13 no salen» es indistinguible de un
cruce roto:

```
   98.774      SALE      las aristas del grafo, publicadas en negrita por todas partes   ✅
   77.777.777  no sale   inventado: no puede salir                                       ✅
```

### A1 · Los 26 congelados contra el censo v2

⛔ Los 26 no se copian a mano: se leen de `src/numeros-congelados.js` (ley 105).

| congelado | valor | ¿lo marca alguien? |
|---|---|---|
| `dato.sello` | 2026-08-03T08:19:51Z | ⛔ no |
| `grafo.nodos` | 68.649 | ⛔ no |
| `grafo.aristas` | 98.774 | ✅ 5 marcas |
| `grafo.componentes` | 170 | ✅ 1 |
| `grafo.aristasAPie` | 94.570 | ⛔ no |
| `grafo.vertices` | 378.222 | ⛔ no |
| `grafo.km` | 6.499,98 | ✅ 1 |
| `mapa.azules` | 51.493 | ✅ 1 |
| `mapa.rojas` | 32.310 | ⛔ no |
| `mapa.verdes` | 3.803 | ⛔ no |
| `mapa.grises` | 11.168 | ✅ 4 |
| `mapa.rojasMotor` | 36.113 | ✅ 1 |
| `verde.sinListon` | 4.424 | ⛔ no |
| `mapa.verdesKm` | 145,94 | ⛔ no |
| `verde.osmNombrados` | 199 | ✅ 1 |
| `verde.municipalNombrados` | **0** | ⛔ **no, y no puede** — ver §B |
| `verde.municipalPolis` | 1.235 | ⛔ no |
| `pasos.deOsm` | 1.153 | ⛔ no |
| `pasos.deducidos` | 4.155 | ⛔ no |
| `mapa.azulesConPasos` | 56.801 | ⛔ no |
| `puertas.sinCalle` | 2.669 | ✅ 4 |
| `buscador.sinNumero` | 117 | ✅ 6 |
| `buscador.pedibles` | 51.065 | ✅ 3 |
| `buscador.huecos` | 23.184 | ✅ 3 |
| `buscador.cambianAcera` | 16.981 | ✅ 2 |
| `buscador.contestadas` | 4.562 | ✅ 12 |

```
   congelados que el censo v2 SÍ ve      13 de 26
   ⛔ congelados que DEJA FUERA          13
```

### A2 · ⚠️ Y una diferencia con lo que dijo la auditoría, dicha y no tapada

La auditoría registró **12**. Aquí sale **13**, y la diferencia tiene un candidato exacto:
**`verde.municipalNombrados = 0`**. ⛔ **No se corrige ninguna de las dos cifras**: se deja
declarada la discrepancia y su causa probable, que es §B.

---

## B · ⭐⭐ LO QUE ESTE CENSO NO PUEDE VER, Y ES SU PROPIEDAD MÁS IMPORTANTE

Su expresión de cifras es, literalmente:

```js
   const NUM = /\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d+,\d+\b|\b\d{2,}\b/g;
```

Las tres alternativas exigen **dos dígitos o más**. Comprobado sobre su propio volcado:

```
   tokens del censo v2                    2.360
   …de ellos, de UN SOLO DÍGITO               0
   …y de ellos, el token «0»                  0
```

⇒ **el censo v2 es ciego al cero.** Y eso no es un detalle de implementación en este
proyecto: la regla 2 de `CLAUDE.md` dice que **todo «cero» se demuestra con un positivo de
control**, y `verde.municipalNombrados = 0` está congelado precisamente porque es la mitad
de una razón —*«OSM es la única capa con nombre»*— cuya otra mitad es `199`. El censo ve el
199 y no ve el 0.

⚠️ **Un censo que no puede ver un cero no puede auditar una negación.** Y las negaciones son
la mitad de lo que este proyecto publica.

---

## C · POR QUÉ NO SE AMPLÍA

⛔ **La v1 ya se probó y se tumbó**: clasificó 10.192 de 19.906 tokens como «afirmación», la
muestra enseñó que casi todos eran celdas de tablas de resultado, y publicar ese
denominador habría sido fingir cobertura sobre algo que nadie puede recorrer.

⇒ La v2 compra un denominador **recorrible entero** a cambio de una definición **estrecha y
declarada**. Ésta es la declaración. Lo que hace falta no es un censo más ancho: es
**saber qué queda fuera**, y ahora se sabe — la mitad de los congelados, y todos los ceros.

⭐ Y hay un instrumento que sí cubre la parte que a éste le falta, por otro camino:
`src/latido.js` no busca cifras en los documentos — ejecuta al productor de cada número
publicado y comprueba que siga emitiéndolo. **Sus expresiones admiten un solo dígito a
propósito**, y su tabla lleva un cero publicado (la ruta 2 de §A6) como positivo de control
de esa propiedad.

---

## D · LOS COMANDOS

```
   node src/numeros-congelados.js      # los 26, medidos contra el motor
   node src/latido.js --probar         # el productor de cada número, y el cero
   node src/superados.js               # el puntero hacia delante, en las dos direcciones
```

⚠️ El censo v2 en sí **no vive en `src/`**: es un instrumento de auditoría, fuera de la
batería, y esta declaración se hace sobre su volcado. ⇒ **no hay guardián que impida que
esta declaración envejezca**, y se dice aquí en vez de suponerlo.
