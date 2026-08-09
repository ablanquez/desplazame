# H1 · QUÉ QUEDA ABIERTO

*Tanda 5 · 2026-08-09 · el inventario de lo que NO se sabe de H1, para el documento de cierre.*

> **Este documento se AÑADE, no reescribe nada.** ⛔ **No arregla nada y no minimiza nada.**
> Reúne lo que los cuatro registros de auditoría declararon no haber podido auditar y lo que
> las seis tandas de arreglo dejaron anotado y sin tocar.

---

## 0 · LA FRASE QUE HAY QUE DECIR EL DÍA QUE SE CIERRE H1

> ⛔⛔ **Ningún bloque de la auditoría ha comprobado que la ruta que sale sea la ruta
> CORRECTA.** A miró si el código está sano, B y B.2 si lo escrito coincide con el dato, C si
> las decisiones se cumplen. **Que el camino sea el bueno lo sostienen las siete rutas de
> Antonio, y de ellas se fía del mismo motor reejecutado salvo UNA observación humana.**

⭐ Es el hueco más grande de H1. No lo abrió la auditoría: lo heredó, y las seis tandas de
arreglo **no lo han tocado** porque ninguna era sobre eso.

---

## A · LO QUE LA AUDITORÍA DECLARÓ NO HABER PODIDO AUDITAR

⛔ Reunido de los cuatro registros de `docs/auditoriafinal/`, tal y como ellos lo dejaron.
**Las clases son suyas y significan cosas distintas:** `NO CONSTA` es *no se puede saber con
lo hecho*; *no lo he sabido* es que el criterio no llegó; *no lo he mirado* es que no cupo.

| qué | clase | bloque |
|---|---|---|
| **Si el motor calcula la ruta CORRECTA** | ⛔⛔ **ningún bloque lo audita** | A, y sigue abierto |
| 2.024 de las 2.062 afirmaciones marcadas | *no lo he mirado* | B · B2 |
| 1.508 sin clasificar de esas 2.062 | *no lo he sabido* | B2 |
| 17.844 cifras no marcadas | `NO CONSTA` estructural · **cerrado por Antonio** | B |
| Las 84 `PROPONE` del diseño: ¿hechas, pendientes o abandonadas? | *no lo he mirado* | C |
| Las 457 `?` del diseño | *no lo he sabido* | C |
| 297 líneas `⛔` impresas: cuáles son un fallo vivo | *no lo he mirado* | A |
| 328 de las 330 cifras de comentario | `NO CONSTA` estructural | A |
| Si las duplicaciones que hoy coinciden coincidieron siempre | `NO CONSTA` | A |
| `BITACORA.md` entera contra lo que dice | *no lo he mirado* | B |
| Los `RECONOCIMIENTO-*` contra sus fuentes | ⛔ **exige RED — parado** | B · B2 · C |
| Cuándo empezó a mentir cada superado | `CAUSA NO CONFIRMADA` | B |
| Las 39 afirmaciones que sostiene `acera-equivocada.js` | **medidas con instrumento tocado** | B2 |
| Las constantes de las 19 librerías sin salida | *no lo he mirado* — el mapa no las ve | B2 |
| Si `D0`–`D5` RIGEN, no solo existen | **parcial**: leídas en el código, no puestas a prueba | C |
| `G1`/`G2`/`G3` contra su definición canónica | `NO CONSTA` — no se encuentra dónde se definen | C |
| Si el `~25 min` del nº7 tiene más de una repetición apuntada | `NO CONSTA` | C |

---

## B · LO QUE LAS SEIS TANDAS DE ARREGLO DEJARON ANOTADO Y SIN TOCAR

### B1 · ⛔⛔ Lo que esta misma tanda acaba de descubrir

| qué | estado |
|---|---|
| ⛔⛔ **El latido NO pasa a verde solo al republicar** | Su tabla lleva el valor publicado como **literal copiado a mano**, y nunca abre un documento. Republicar no puede alcanzarle. **El mecanismo de la tanda 3 no estaba terminado**: el puntero MIDE, el latido RECITA. ⚠️ **Parado y sin tocar, como manda la costura.** |
| **`superados.js` no distingue una afirmación de una transcripción** | Encuentra la cifra; si el documento la *afirma hoy* o *narra lo que pasó aquel día* lo juzga una persona. Por eso cada par lleva su recuento cerrado. |
| **Por qué la ruta 6 pasó del 53,6 % al 100 %** de vía municipal | `NO CONSTA`. Se publica la diferencia medida, no una explicación. |

### B2 · Los suelos: números que son un mínimo, no un recuento

| qué | cuánto | por qué es un suelo |
|---|---|---|
| **Veredictos del repositorio** (tanda 2·bis) | **464** — 254 `A.exige` · 130 ternarios · 80 derivadas | **no se sigue el flujo**, y la clase «otra» (207) no se ha leído |
| …de ellos, **booleano donde hay una cantidad** | **137** | la familia del fallo de la batería, sin revisar una a una |
| …de ellos, **expectativa fija contra un valor medido** | **18** | pueden pudrirse como se pudrieron `donde-falta` y `pasos` |
| **Los ~40 hermanos** del fallo de la tanda 1 | ~40 | declarados y no tocados desde entonces |

### B3 · Guardianes que no vigilan todo lo que parece

| qué | qué le falta |
|---|---|
| **`latido.js`** | vigila **4 números**, no los 22 republicados. Y su prueba del 6 de agosto usa un **literal** capturado: si §A6 cambia de formato, el fixture envejece sin que nadie lo diga |
| **El censo v2** | ve **13 de los 26** congelados y **no puede ver un cero** — su expresión exige dos dígitos. ⇒ no puede auditar una negación (`docs/H1-CENSO-DECLARADO.md`) |
| **`ruta.js`** | sale en **código 2 sin declarar nada**. Hallazgo nombrado por la batería, fuera de la tabla, **sin decidir** |
| **Seis scripts latentes** | `auditoria-grafo` · `exportar` · `informe-condicionales` · `probar-guardianes` · `probar-visor` · `tabla-rutas` usan `process.exit(1)` sin `alarma`: hoy salen en 0, el día que salgan en 1 lo harán en silencio |
| **La batería** | ejecuta los `exportar-*.js`, que **escriben** en `tools/`. Por eso un guardián colocado detrás de ellos sale verde por construcción — el caso de la tanda 4 |

### B4 · Lo que se decidió NO arreglar, con su porqué

| qué | por qué NO |
|---|---|
| **La circularidad de las tres bandas** | Dos se derivaron de la velocidad, así que banda y ruta se mueven juntas. **Cambiarla a 5,0 la trasladaría, no la rompería.** ⭐ Solo la rompe **una segunda distancia MEDIDA**, y eso no es código |
| **`data/pruebas/RUTAS-CONOCIDAS.md`** | Es de Antonio. Sigue publicando la velocidad vieja en cuatro sitios y **debe seguir haciéndolo**: una banda es una expectativa de distancia sacada de una observación real; recalcularla la convertiría en «lo que el motor dice que son 5 minutos» y dejaría de juzgarlo para repetirlo |
| **Los cuerpos de los registros históricos** | Eran verdad el día que se escribieron. Se marcan, no se corrigen |
| **Tres valores que un barrido saca y no son superados** | `56 scripts` es una transcripción · `4.055` es otra magnitud · `45.597` es un «antes» contado como antes (`docs/H1-REPUBLICACIONES.md` §D) |
| **Los tres rojos declarados de la batería** | `modelo-rutas.js` y `auditoria-guardianes.js` declarados a propósito · `rutas-antonio.js` fuera de banda. **Se cuentan, no se apagan** |

### B5 · Lo que un clon no puede tener

| qué | estado |
|---|---|
| **Los datos crudos de OSM y del callejero** | No se versionan y **no hay script que los baje**: un clon que se descargara su propio OSM arrancaría y daría OTROS números, que es peor que no arrancar |
| **El verificador `verificar-datos.js`** | Existe para que el clon **SEPA** lo que no tiene. Con los crudos delante hoy dice ✅ los 12 ficheros; sin ellos, la mitad de sus consultas contestan `NO CONSTA` |

### B6 · ⭐⭐ TANDA 8 · Los dos límites del puntero, con su fecha y su ejemplo

**Los dos salieron el 9 de agosto de 2026 al republicar una banda de
`data/pruebas/RUTAS-CONOCIDAS.md`, y ninguno de los dos se ha arreglado.**

| qué | estado |
|---|---|
| ⭐⭐⭐ **El puntero envejece las CIFRAS y NO la PROSA que las envuelve** | Es un límite **de diseño**, no un fallo: `superados.js` busca cadenas de dígitos. Una frase que ha dejado de ser cierta no lleva dígitos y **no hay barrido posible** con este mecanismo |
| ⭐⭐⭐ **El puntero MARCA lo que alguien declara; no DESCUBRE nada** | Su cobertura es igual a *lo que un humano se acordó de escribir en `PARES`*. Cuando el 9/08 cambió una banda, **nada se lo contó**. Es la **ley 118** con fecha |

**El ejemplo, y es el que hay que leer porque los dos límites se ven en el mismo
documento.** `docs/H1-VELOCIDAD-ESTANDAR.md` publicaba tres cosas caducadas a la vez, y el
mecanismo alcanza **una**:

| lo que dice | por qué es falso hoy | ¿lo ve el puntero? |
|---|---|---|
| la banda de distancia de los 40 min | era **derivada** del ritmo al que anda Antonio; hoy hay una **medida** (ruta nº10, 9/08) | ✅ **sí** — es una cifra, y se ha republicado |
| **«§C · LAS TRES BANDAS»** | son **cinco**: 5, 25, 28, 40 y 59 min | ⛔ **no** — «tres» es una palabra |
| **«dos de las tres bandas se derivaron de la velocidad»** | hoy se deriva **una de cinco**; las otras cuatro están medidas con GPS | ⛔ **no** — y es la peor de las tres, porque **el argumento de circularidad de §D casi se ha caído solo** y el documento sigue afirmándolo |

⛔⛔ **Y el segundo límite no es una queja teórica: incumple el criterio con el que se aceptó
este mecanismo.** La tanda 3 lo eligió con una condición escrita — *«no vale una convención
que alguien tenga que acordarse de cumplir. ¿Qué pasa el día 24?»*. **El 9 de agosto fue el
día 24**, y el puntero pasó sus propios `D1`, `D2` y `D4` mientras una cifra caducada estaba
publicada delante.

⭐ **Lo que sí quedó demostrado, y conviene no confundirlo con lo anterior:** el barrido **no
está ciego**. Declarado el par, lo encuentra a la primera y sin un solo falso positivo en los
otros dieciséis documentos:

```
node src/superados.js      # con el par recién declarado, ANTES de marcar
   ⟨la banda vieja⟩      1 de 1    0 de 0    ✅
   D1 · valor superado impreso SIN que la cabecera lo declare   1
      H1-VELOCIDAD-ESTANDAR.md
```

⚠️ **Y las dos cifras van sustituidas por `⟨…⟩` a propósito, no por adorno:** escribirlas
aquí haría que este documento saliera marcado como si las AFIRMARA, cuando solo las está
contando. Es el límite de B1 —*`superados.js` no distingue una afirmación de una
transcripción*— visto desde el otro lado: **evitarlo obliga a mutilar la cita.**

⇒ **El problema no está en lo que el instrumento ve: está en lo que se le manda mirar.**

---

---

## C · ⚠️ LO QUE ESTE INVENTARIO NO PUEDE PROMETER

- **Que esté completo.** Sale de leer los cuatro registros de auditoría y los informes de
  seis tandas. **Nadie ha barrido `docs/` buscando huecos que nadie declaró** — y el
  instrumento que debería hacerlo, el censo, está declarado corto.
- **Que las clases sean comparables.** `NO CONSTA`, *no lo he sabido* y *no lo he mirado*
  vienen de bloques distintos y **no significan lo mismo**. Se conservan como se escribieron
  en vez de fundirlas en una sola columna que quedaría más limpia y diría menos.
