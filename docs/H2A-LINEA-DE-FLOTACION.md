# La línea de flotación — qué se hace el día que el feed cambie

**Escrito el 11/08/2026, con 55 días de margen y ANTES de que pase.**
**⭐ Su contradictor:** `node tools/gtfs/comparar-feed.js --otro <zip nuevo>`. **El día que exista un
segundo fichero, este documento se comprueba solo: cada fila de abajo dice qué salida del comparador
la activa.** Si el comparador dice algo que aquí no está previsto, es este documento el que está
mal.

---

## §1 · El disparador

```
   node src/probar-vigencia.js        ⇒ se-acaba  (30 días antes: el 05/09/2026)
                                      ⇒ fuera-del-periodo-declarado  (el 06/10/2026)
```

⚠️ **`se-acaba` avisa y NO falla** — el dato sigue siendo el bueno. **`fuera-del-periodo-declarado`
pone la batería en rojo.** Ver el porqué en `tools/gtfs/vigencia.js`.

---

## §2 · Los tres pasos, en orden

```
   1 ·  node tools/bajar-gtfs.js                        descarga y sella el nuevo
   2 ·  node tools/gtfs/comparar-feed.js --otro <zip>   el diff contra el del 10/08
   3 ·  según lo que diga el diff, la tabla del §3
```

⛔ **El paso 2 va antes que cualquier recálculo.** Recalcular sin saber qué ha cambiado es tirar
horas y perder la única medición que vale como control.

---

## §3 · Qué deja de valer, según qué cambie

| si el diff dice… | qué deja de valer | qué hay que re-medir |
|---|---|---|
| **`identidad`** · stop_id desaparecen o nuevos | **los 2.538 enlaces**, la red, y las 172 paradas invisibles | todo H2·6 y H2·7 |
| ⛔⛔ **`identidad`** · un stop_id **mantiene el id y cambia el stop_code** | **la decisión D1 entera.** Es el caso peor: la identidad parecería estable y señalaría a otro poste | **PARAR y decidir con Antonio.** No se recalcula nada hasta entonces |
| **`filas`** en `stops.txt` | las **934** paradas de bus y las **50** de tranvía · los pares candidatos | `red-bus.js` · `enlaces.js` |
| **`filas`** en `trips.txt` o `routes.txt` | las **44 rutas vivas** y las **8 zombis** · los **74 sentidos** | `red-bus.js` |
| **`zombis`** · la lista cambia | el filtro de zombis y su contraste | `red-bus.js` (su `A.exige` ya salta solo) |
| **`caducidad`** · periodo nuevo | nada del cálculo; **sí** el bloque `feed` del artefacto | volver a generar el artefacto |
| **`version`** sola, sin nada más | ⭐ **nada**: es una reetiquetación | anotar y seguir |
| **`fichero`** · desaparece `shapes.txt` | los **89 trazados** y el visor de líneas | reconocer de nuevo |
| **`posicion`** · paradas movidas | **el enganche de esas paradas al grafo**, y con él sus enlaces | `enlaces.js` para las afectadas |

⭐ **Y lo que NO hay que re-medir pase lo que pase:** el grafo peatonal, las diez rutas de Antonio y
los 26 congelados. **El GTFS no toca H1.**

---

## §4 · ⭐⭐ La pregunta que solo se puede contestar ese día

**¿Es estable el `stop_id`?** La identidad de H2a cuelga de un entero opaco (`16487` → `PA00002`), y
**su estabilidad entre versiones no se ha podido comprobar nunca porque solo existe una versión.**

⇒ **La primera medición que vale como control es la del feed siguiente.** Todo lo que hoy «cuadra»
—las ocho filas, las catorce cifras idénticas a las de 003— **no valida ningún instrumento: valida
que nadie ha tocado el fichero.**

⚠️ **Y hay una segunda pregunta esperando ahí:** `routes.txt` va fechado el **2025-09-23**, diez
meses antes que el resto del feed (`docs/RECONOCIMIENTO-003-TRANSPORTE.md:105`). **Si en el feed
siguiente sigue con esa fecha, el tranvía se arrastra congelado desde septiembre de 2025** — y eso
cambia lo que se puede prometer de las 50 paradas de tranvía.

---

## §5 · ⚠️ Lo que este documento NO cubre

- **Qué pasa si el NAP cambia la ficha 1176 de sitio o de formato.** `tools/bajar-gtfs.js` no se ha
  vuelto a ejecutar desde el 10/08: **el descargador también lleva siete semanas sin control.**
- **Qué pasa si el feed nuevo llega y no valida.** No hay validador GTFS propio.
- **Cuánto tarda todo esto.** El listón de 30 días de `se-acaba` **está decidido, no medido**: sale
  de cuánto se cree que dura una tanda, y eso no se ha cronometrado nunca.
