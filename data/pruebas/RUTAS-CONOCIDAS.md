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

> ⭐⭐ **Y estas siete se escribieron ANTES de que existiera el enganche de portales**, a propósito:
> así no pudieron elegirse mirando qué salía bien.

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

## ⚠️ Cómo se leen estos números — LÉASE ANTES DE COMPARAR NADA

⭐⭐ **LA DISTANCIA ESPERADA DE ESTA TABLA ESTÁ DERIVADA DEL TIEMPO, NO ESTIMADA APARTE.** Antonio
dio los tiempos; las distancias salen de convertirlos a ≈4,5–5 km/h.
⇒ **NO son dos datos independientes: comprobar la distancia es comprobar el tiempo otra vez.** Si
alguna vez alguien mide la distancia por su cuenta, se apunta como columna nueva, no se sustituye.

| Tiempo declarado | Banda razonable |
|---|---|
| 5 min | ~350–450 m |
| 25 min | ~1,8–2,1 km |
| 40 min | ~2,9–3,4 km |

⚠️ **Los "5 minutos" son una respuesta gruesa**: cubren de 300 a 500 m. **Sirven para detectar un
fallo grande —si sale 1,2 km, algo está roto— pero no para afinar.**
⭐ **El nº 7 es el único con tiempo de repetición real.** Es el número más fiable de la tabla.

⛔ **`NO CONSTA` es un valor válido y preferible** a un número aproximado que después se cite como
si fuera medido (ley 28: `NO CONSTA` es *no se puede saber*, no *no lo he mirado* — aquí es lo
primero: Antonio no ha hecho ese trayecto andando).

---

## La tabla

| # | origen | destino | distancia esperada | tiempo andando | ⭐ qué caso extremo prueba | notas |
|---|---|---|---:|---:|---|---|
| 1 | Avenida Cataluña 78 | Avenida Pablo Gargallo 16 | `NO CONSTA` | `NO CONSTA` | ⭐⭐ **CRUZA EL EBRO.** Y hay **tres puentes posibles** (Piedra, Santiago, Almozara): no prueba solo que el río se cruza, sino **cuál elige el motor** | Antonio cruza por el **Puente de Piedra**. Si el motor manda por Almozara, hay algo que mirar: o el coste está mal, o hay un rodeo escondido |
| 2 | Calle Manifestación 6 | Calle Don Jaime I 17 | ~350–450 m | ~5 min | **Casco antiguo**: trama irregular, calles peatonales, muchos callejones. Prueba que el motor **no sale del casco para volver a entrar** | En trayectos cortos un rodeo se nota; en uno de 3 km se disimula |
| 3 | Cantando Bajo la Lluvia 6 | Hospital Clínico Lozano Blesa | ~2,9–3,4 km | ~40 min | **Valdespartera → centro.** Enganche de portales donde el mapeado es más flojo y **las calles son nuevas** | Zona donde OSM *"va por delante"*: es donde pueden colarse `proposed`. Probablemente cruza el **Canal Imperial** |
| 4 | Centro Etopía | Estación Delicias | ~350–450 m | ~5 min | ⭐ **LA PLATAFORMA ELEVADA DE DELICIAS** — 90 ways a `layer=2`, donde D1 podría haber aislado la estación por dentro | Si el motor llega sin rodeo absurdo, esa parte de D1 funciona |
| 5 | Principado de Morea 14 | C.C. Utrillas | ~350–450 m | ~5 min | **Corto y cotidiano.** En 400 m, un error de enganche de 30 m es el 8 % del total | |
| 6 | Calle Francisco de Quevedo 1 | Calle Matadero 1 | ~350–450 m | ~5 min | ⭐ **DOS PORTALES EN ESQUINA** (los dos son el nº 1). Ataca la salvaguarda de **D3**: el enganche por proximidad puede mandarlos a la calle equivocada | El `codigoVia` tiene que **marcar** la discordancia, no corregirla |
| 7 | Calle El Coloso 2 | Calle Valle de Zuriza 48 | ~1,8–2,1 km | **~25 min** | ⭐⭐ **EL DE REPETICIÓN.** El único con tiempo real, no estimado | **Es el dato más fiable de la tabla** |

---

## ⭐ Qué se comprueba con cada uno, y qué NO

**Se comprueba:**
- Que **existe camino** entre los dos puntos.
- Que la distancia cae **dentro de la banda**.
- Que **el rodeo es razonable**: una ruta no puede ser más corta que la línea recta (imposible), ni
  mucho más larga sin una barrera real que lo explique (río, vía de tren, autovía).
- ⭐ En el nº 1, **por qué puente cruza**.

**NO se comprueba:**
- El tiempo real de recorrido: depende de semáforos, cuestas y del paso de cada uno.
- Que la ruta sea **la que una persona elegiría**. Una ruta correcta puede ser incómoda.
- Nada de transporte público: **los siete son a pie**, que es lo único que existe en H1.

---

## ⛔ Cómo NO usar esta tabla

- **No se ajusta el motor hasta que los siete salgan bien.** Eso es ajustar el instrumento al
  resultado deseado. Si uno falla, primero se averigua **por qué**, y la corrección va como
  **regla**, no como parche para ese caso (ley 40: *un filtro que enumera los casos que aparecieron
  no es una regla, es una lista*).
- **No se añaden trayectos elegidos mirando los resultados.** Los nuevos se escriben antes de
  ejecutarlos, igual que estos siete.
- ⚠️ **Que los siete pasen NO significa que el grafo esté bien.** Siete trayectos sobre 98.774
  aristas son una muestra minúscula. **Sirven para detectar fallos, no para certificar aciertos** —
  y *un resultado bueno despierta menos sospecha que uno malo* (ley 36).

---

## Para ampliar más adelante

Casos que **aún no están cubiertos** y conviene escribir **antes** de que el motor los resuelva:

- Un trayecto que **cruce el Gállego** (el 1 cruza el Ebro; el 3, probablemente el Canal Imperial).
- Uno en **zona de solo eje de calzada** — Movera, Garrapinillos, un polígono.
- ⭐ Uno cuya ruta obvia pase por un **paso condicional** (Pasaje Palafox, edificio de Las Armas)
  para comprobar que el motor **NO** lo usa.
- ⭐ Uno con destino en un **barrio incomunicado** (Peñaflor de Gállego): la respuesta correcta es
  `IMPOSIBLE`, no una ruta inventada.
- Uno que cruce una **plaza mapeada como área** — el problema abierto desde la tanda 3.
- Uno **de noche**, cuando exista el reloj (H3): mismo origen y destino, respuesta distinta.

---

## Estado

**Filas reales: 7**, escritas por Antonio el 3/08/2026, **antes de que existiera el enganche de
portales**.

⚠️ **Lo que sigue sin cubrir:** el Gállego, las zonas sin acera, los pasos condicionales, los
barrios incomunicados y las plazas-área. **Cinco de los seis casos declarados arriba.**

⚠️ Y las rutas de cordura que corren en `src/verificar.js` **las eligió el ejecutor**, así que
siguen sin contar como control positivo: solo comprueban que ninguna ruta es más corta que la línea
recta, que es una imposibilidad física, no un acierto.
