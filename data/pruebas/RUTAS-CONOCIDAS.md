# Rutas conocidas — banco de pruebas del motor

> ## ⛔ ESTA TABLA LA RELLENA ANTONIO. NO LA RELLENA CLAUDE CODE.
>
> **Por qué, y no es una formalidad:** la ley 17 de este proyecto dice que *un control positivo
> que elige quien escribió el instrumento prueba que el instrumento hace lo que su autor cree* —
> que es justo lo que no está en duda. Si los trayectos los elijo yo, elegiré sin darme cuenta los
> que el motor resuelve bien: los que van por calles principales, sin cruzar el río, sin escaleras,
> sin plazas peatonales. **Los casos que rompen un motor de rutas los conoce quien anda por la
> ciudad, no quien la lee en un JSON.**
>
> Este proyecto ya tiene la prueba de que funciona así: la Carretera de Huesca la eligió Antonio
> como *control positivo* —"donde la regla debería acertar sola"— y **fue la que tumbó la regla de
> nivel**, con 4 falsos positivos y 0 aciertos. *El valor de una diana es lo que puede refutar, no
> lo que puede confirmar* (ley 22).

---

## Cómo se rellena

Una fila por trayecto. **No hace falta ser preciso con las coordenadas**: vale con el nombre del
sitio; las coordenadas se buscan después. Lo que **sí** importa es la última columna.

- **distancia esperada** — a ojo, la que dirías tú. Sirve para detectar que el motor da 3 km donde
  hay 800 m, no para calificarlo al metro.
- **tiempo andando** — el que tardas tú de verdad, no el de una app.
- ⭐ **qué caso extremo prueba** — *la columna que hace útil la tabla*. Un trayecto que no rompe
  nada no aporta: ya hay miles así. Sirven, por ejemplo, trayectos que obliguen a **cruzar el
  Ebro** (si falta un puente, el motor dice "no hay camino"), que pasen por **escaleras**, por una
  **plaza peatonal grande**, por un **paso a distinto nivel**, por una **calle cortada por obras**,
  o los que tengan **una respuesta contraintuitiva** que solo sabe quien vive allí.
- **notas** — cualquier cosa: "por aquí no se puede pasar de noche", "la gente corta por dentro
  del parque", "el paso subterráneo está cerrado desde marzo".

⚠️ **Y los trayectos que el motor NO debería poder resolver también valen**, y mucho: si el destino
está en una isla del grafo, la respuesta correcta es *"no hay camino"*, no una ruta inventada.
Márcalos con `IMPOSIBLE` en la distancia esperada.

---

## La tabla

| # | origen | destino | distancia esperada | tiempo andando | ⭐ qué caso extremo prueba | notas |
|---|---|---|---:|---:|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

---

## Ejemplos del formato — ⛔ INVENTADOS, BÓRRALOS AL RELLENAR

**Estas tres filas no son trayectos propuestos: son solo para enseñar cómo se escribe cada
columna.** Ninguna está medida, ninguna sale de conocimiento de campo, y **ninguna debe usarse como
prueba**. Se borran en cuanto haya filas de verdad.

| # | origen | destino | distancia esperada | tiempo andando | ⭐ qué caso extremo prueba | notas |
|---|---|---|---:|---:|---|---|
| EJEMPLO | *(un sitio de una orilla)* | *(un sitio de la otra)* | ~1,5 km | ~20 min | cruzar el río: si falta un puente en el grafo, el motor debería decir "no hay camino" en vez de dar un rodeo absurdo | — |
| EJEMPLO | *(arriba de una cuesta)* | *(abajo)* | ~300 m | ~6 min | escaleras: `highway=steps` existe en OSM, y a pie se pasa | — |
| EJEMPLO | *(un lado de una plaza grande)* | *(el otro lado)* | ~200 m | ~3 min | plaza peatonal mapeada como ÁREA: el grafo tiene el contorno y no el interior, así que el motor puede dar la vuelta entera | es el problema abierto desde la tanda 3 |

---

## Estado

**Filas reales: 0.** Mientras esta tabla esté vacía, el motor **no está verificado contra
conocimiento de campo** — solo contra sí mismo y contra el propio OSM, que es la misma fuente con la
que se construyó. Las tres rutas de cordura que corren hoy en `src/verificar.js` las elegí yo, y por
eso **no cuentan como control positivo**: solo comprueban que ninguna ruta es más corta que la línea
recta, que es una imposibilidad física, no un acierto.
