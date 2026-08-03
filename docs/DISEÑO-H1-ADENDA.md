# Adenda al diseño de H1

**Fecha:** 2026-08-03 · **Tanda 8**

## Qué corrige este documento y por qué existe

`docs/DISEÑO-H1-GRAFO.md` (tanda 2) y sus dos anexos son **registro histórico**: documentan lo que
se supo el 2 de agosto. Las tandas 4 y 5 midieron cosas que **contradicen dos de sus respuestas** y
añaden un método de verificación que entonces no existía.

⛔ **Aquel documento no se reescribe.** Esta adenda dice qué corrige, con qué medición y qué queda
igual.

---

## A1 · El emparejador por nube de portales

El diseño resolvía el puente vía municipal ↔ geometría OSM **por el nombre**. La tanda 4 midió que
una **nube de portales** empareja sin mirar una sola letra.

```
                             vías resueltas de 3.359
solo el TEXTO ......................  77,3 %
solo la NUBE .......................  59,0 %
⭐ los dos juntos ...................  85,6 %
```

**Es complementario, no sustituto.** La nube rescata **279 vías que el texto no toca** —erratas de
OSM (`Calle David Farenheit`), homónimos resueltos por posición (`Calle Mayor #12`)— y caza errores
del texto: `CAMINO LAS MONJAS` casaba con un objeto **a 278 m** de sus portales.

⚠️ **Y no opina sobre 1.056 vías**: las 628 sin ningún portal y las 428 con uno o dos. Sobre ésas la
nube no dice nada, ni bien ni mal.

**Cómo entra en el punto 4 de H1** (enganchar los 46.150 portales):
1. El enganche sigue siendo **por proximidad sobre la geometría de OSM** (D0, sin cambios).
2. La **salvaguarda** deja de depender solo del `codigoVia`: ahora hay **dos testigos
   independientes** —el código municipal y el consenso de la nube— y **la discordancia entre ellos
   se marca y se cuenta**, no se corrige (D3).
3. En las 1.056 vías sin nube, la salvaguarda **es la de siempre**. Y hay que **decir cuántas son**
   en el informe de enganche, porque ahí la verificación es más débil y eso no puede quedar oculto
   en un porcentaje global.

---

## A2 · ⭐ El lado de la calle — `P4.3` decía que no se puede saber

**Se puede.** Medido sobre 1.289 ways de OSM y 21.140 portales:

```
                                 >=0,90 de acierto     =1,00
SEÑAL (paridad real)                  89,5 %           79,9 %
⭐ LÍNEA BASE (paridades barajadas)     4,3 %            2,0 %
```

**El umbral de uso es 0,95 por way**: cubre el 83,2 % de los ways y el 86,6 % de los portales
evaluables. ⚠️ **En el 16,8 % restante la app SE CALLA.** No dice "probablemente la acera de los
pares": no dice nada. **Decir la acera equivocada es peor que no decirla** — quien va con una
dirección en la mano y cruza donde no toca ha perdido más que si no le hubieran dicho nada.

**Dónde falla, y es reconocible desde el propio dato:** numeración **correlativa** en vez de
par/impar (`34,34,35,35,36,36` en Urbanización Torres de San Lamberto; `2,3,4,5,6,7` en Polígono San
Valero). Se puede detectar **sin saber la respuesta**: si los números consecutivos alternan paridad
en el mismo lado, la regla no aplica y se calla.

⚠️ **Dependencia declarada:** esto presupone que la vía **ya está emparejada** con su eje de OSM
(§A1). Sobre una vía mal emparejada, el lado se calcula contra el eje equivocado y sale basura con
buena pinta. **No se usa en vías `DUDOSA` ni `NO EMPAREJADA`.**

⚠️ **Y lo que cambia con el planarizado de esta tanda:** el 89,5 % se midió sobre ways **enteros**
de OSM. Al partirlos en sus intersecciones, la unidad de medida cambia. **Hay que volver a medirlo
sobre el grafo planarizado** antes de usarlo.

---

## A3 · Generar el eje uniendo portales — pregunta abierta a propósito

```
                              calles   error mediana    p90      máx
E1  unir TODOS en orden         200         5,9 m     26,4 m   284,8 m
E2  promediar por paridad       168         1,3 m     17,1 m   126,9 m
```

**Solo la versión E2 vale**, y con dos límites que van juntos al número:
- Se calcula en **168 de 200 calles (84 %)**, y **las 32 que faltan no son al azar**: son las de
  numeración correlativa o de un solo lado, es decir, las difíciles.
- El eje generado **no tiene cruces, ni sentido de circulación, ni nivel, ni conexión con nada**. Es
  una línea, no viario.

⭐ **La pregunta queda planteada y NO se resuelve hoy:** ¿sirve para las 48 vías del hueco duro,
donde no hay geometría de OSM en absoluto? En las 11 de esas 48 con ≥6 portales, el eje generado
reproduce el eje **municipal** con menos de 10 m de error en 9 casos. Pero meter ejes generados en
el grafo **reabre en 48 sitios el problema que D0 cerró**: geometría sin nodos compartidos, donde la
cláusula C1 de D1 no aplica. **Se decide con el grafo completo delante, no antes.**

---

## A4 · ⭐⭐ Los diez ejes de verificación — checklist reutilizable

Un instrumento no se verifica por casos: se verifica por **ejes**. Ésta es la tabla, y las dos
últimas columnas son el estado real hoy.

| eje | la pregunta | cómo se comprueba |
|---|---|---|
| **posición** | ¿se hunde con el dato movido lejos? | desplazar 2 km y remedir |
| **vecindad** | ¿distingue una cosa de la de al lado? | desplazar **15-20 m**, que es lo que separa dos calles de una manzana |
| **dirección** | ¿da igual hacia dónde se mueva? | repetir el desplazamiento en 4 rumbos |
| **identidad** | ¿sabe **cuántas** cosas hay? | duplicar una entidad, o partirla, o coserla, y ver si se entera |
| **correspondencia** | ¿es LA MISMA cosa, o una parecida? | testigo independiente de la fuente que se está midiendo |
| **umbral / cola** | ¿a quién deja fuera el percentil? | mirar si los descartados tienen algo en común |
| **escala** | ¿funciona igual con lo muy pequeño y lo muy grande? | distribución de tamaños, y los extremos a mano |
| **densidad** | ¿funciona igual en el casco que en el campo? | separar zona urbana de zona vacía |
| **agregación** | ¿el criterio de resumen absorbe o amplifica ruido? | comparar el criterio grosero con el fino |
| **semántica** | ¿el contenido dice lo que el nombre del campo promete? | abrir los valores y clasificarlos, no contarlos |

⚠️ **Un instrumento que pasa un eje no está verificado: está verificado en un eje.** El caso que lo
demostró: la contraprueba de desplazamiento pasa **posición** y es **ciega a identidad** — mover 2 km
no acerca dos homónimos que están a 20.

---

## A5 · ⚠️ Lo que esta adenda NO cambia

Un documento que lo cambia todo es sospechoso. Sigue en pie, sin tocar:

- **D0** — el grafo se construye sobre OSM; el municipal verifica, no decide. La tanda 5 la
  **reforzó**: el hueco donde el padrón dice que hay puertas es del **0,97 %**.
- **D1** — la regla de nivel, en su tercera versión, con la precedencia del nodo compartido.
- **D2** — el contador de `unido-por-defecto`.
- **D4** — la precisión como campo por tramo.
- **D5** — tolerancia 2,0 m, techo 5 m.
- **El planarizado** sigue siendo el trabajo del proyecto, y **sigue sin guardián independiente**:
  el verificador de cruces por portales se midió y **se descartó** (1,58× sobre azar, 57 % de falsos
  avisos).
- **Las plazas mapeadas como área** siguen sin resolverse.
- **El eje ESCALA** estaba sin medir en todas las tandas anteriores. Esta tanda lo mide **por
  primera vez** (ver `docs/H1-PRIMER-GRAFO.md` §C5).
