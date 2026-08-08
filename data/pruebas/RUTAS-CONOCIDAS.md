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
>
> ⭐⭐ **Y estas siete se escribieron ANTES de que existiera el enganche de portales**, a propósito.

---

## ⛔ v2 — POR QUÉ SE REHIZO ESTA TABLA

**La v1 fue un instrumento roto, y lo era ANTES de que el motor calculara nada.**

En la tanda 11, tres de sus bandas resultaron **físicamente imposibles**: la línea recta —el
mínimo absoluto, que no depende de ningún motor— ya superaba el tope.

```
 nº   recta   banda v1     km/h que exigía LA RECTA
  2    454 m   350-450 m           5,4
  6    484 m   350-450 m           5,8
  7  2.380 m   1,8-2,1 km          5,7
```

**La causa:** las distancias de la v1 se derivaron de los tiempos suponiendo **4,3–5,0 km/h**.
Antonio anda a **~6 km/h**. La banda no medía el trayecto: **medía mi suposición sobre lo rápido
que anda.**

⭐ **Y el aviso estaba escrito en la propia v1** —*"la distancia esperada está derivada del tiempo,
no son dos datos independientes"*— y aun así se usó para comparar. **Poner la advertencia y usar el
instrumento igual no es una excepción: es el patrón que este proyecto lleva dieciséis tandas
cazando.**

> ⭐⭐ **LEY:** *una magnitud derivada arrastra el error de la constante con que se derivó. Si esa
> constante no está medida, la magnitud no es un dato: es una opinión con unidades.*

**Los dos cambios de la v2:**
1. **Velocidad calibrada** con la única medición real que existe (ver abajo).
2. ⭐⭐ **EL RODEO PASA A SER LA COLUMNA PRINCIPAL.** *Ruta ÷ línea recta* **no depende de lo rápido
   que ande nadie**: un 1,10 es bueno y un 2,40 es sospechoso, vayas al paso que vayas. Es lo que
   de verdad queríamos medir. El tiempo baja a referencia secundaria.

---

## La calibración — un solo dato, y hay que saberlo

| | |
|---|---|
| **Trayecto** | nº7 (El Coloso 2 → Valle de Zuriza 48) |
| **Distancia** | **2,6 km · medidos con GPS de pulsera**, no estimados |
| **Tiempo** | ~25 min, de repetición |
| **Velocidad** | **~6 km/h** |
| **Rodeo real** | 2.600 / 2.380 = **1,09** |

⚠️ **Las BANDAS cuelgan de UN trayecto.** Si esos 25 minutos fueran 22, se mueven.
⛔ **Los tiempos que publica el buscador ya NO** — desde el 8/08/2026 salen de una **constante
estándar de 5,0 km/h**, la de OSRM y openrouteservice. *Un buscador de rutas no puede publicar el
ritmo de una persona.*
⇒ ⭐ **Y esto es lo que sigue haciendo falta: en cuanto haya una SEGUNDA distancia medida, las
bandas dejan de ser circulares** —hoy salen del mismo ritmo que juzgan— y se anota aquí.

⚠️ **Y el GPS es un instrumento:** los relojes suelen dar **de más** en ciudad (el rebote en
edificios mete zigzag y el zigzag suma metros). ⇒ La distancia real está más probablemente entre
**2,45 y 2,6 km**, y la velocidad entre **5,9 y 6,2 km/h**.
⭐ **Comprobación de cordura que sale gratis:** un rodeo de **1,09** es casi el mínimo teórico en
una ciudad con manzanas. Es plausible si el trayecto va en diagonal; **si fuera todo cuadrícula,
sería raro y el GPS estaría dando de MENOS.** El número encaja.

**Bandas resultantes** (⚠️ derivadas, salvo la del nº7):

⛔⛔ **Y NO se recalculan a 5,0 km/h, aunque el buscador publique con esa constante.** Una banda dice
*«este trayecto lo ando en ~5 min, así que debe medir ~500 m»*: **es una expectativa de DISTANCIA
sacada de una observación real**, y los metros no cambian porque la aplicación publique otros
minutos. ⭐ **Recalcularlas las convertiría en “lo que el motor dice que son 5 minutos” — y entonces
dejarían de juzgarlo para repetirlo.**

| Tiempo declarado | Banda (a ~6 km/h) |
|---|---|
| 5 min | **~450–550 m** |
| 25 min | **~2,4–2,6 km** ✅ *medida* |
| 40 min | **~3,8–4,2 km** |

⛔ **`NO CONSTA` es válido y preferible** a un número aproximado que después se cite como medido.

---

## La tabla

⭐ **La columna que manda es el RODEO.** La distancia es de apoyo; el tiempo, referencia.

| # | origen | destino | recta | banda distancia | ⭐ rodeo aceptable | tiempo | ⭐ qué caso extremo prueba | notas |
|---|---|---|---:|---:|---:|---:|---|---|
| 1 | Avenida Cataluña 78 | Avenida Pablo Gargallo 16 | *(medir)* | `NO CONSTA` | **≤ 1,45** | `NO CONSTA` | ⭐⭐ **CRUZA EL EBRO**, y hay **tres puentes posibles**: no prueba solo que el río se cruza, sino **cuál elige el motor** | Antonio cruza por el **Puente de Piedra**. ✅ **v1: el motor eligió ese** |
| 2 | Calle Manifestación 6 | Calle Don Jaime I 17 | 454 m | ~450–550 m | **≤ 1,45** | ~5 min | **Casco antiguo**: trama irregular y peatonal. Prueba que el motor **no sale del casco para volver a entrar** | La banda v1 (350-450) era **imposible**: la recta ya son 454 |
| 3 | Cantando Bajo la Lluvia 6 | Hospital Clínico Lozano Blesa | *(medir)* | ~3,8–4,2 km | **≤ 1,40** | ~40 min | **Valdespartera → centro.** Enganche donde el mapeado es flojo y **las calles son nuevas** | Zona donde OSM *"va por delante"*. ⚠️ Destino = **edificio grande**: ver aviso del centroide |
| 4 | Centro Etopía | Estación Delicias | *(medir)* | ~450–550 m | **≤ 1,60** | ~5 min | ⭐ **LA PLATAFORMA ELEVADA** (90 ways a `layer=2`) | ⛔ **v1: NO HAY CAMINO.** Ver §"lo que rompió esta tabla" |
| 5 | Principado de Morea 14 | C.C. Utrillas | *(medir)* | ~450–550 m | **≤ 1,45** | ~5 min | **Corto y cotidiano.** En 500 m, un error de enganche de 30 m es el 6 % | |
| 6 | Calle Francisco de Quevedo 1 | Calle Matadero 1 | 484 m | ~450–550 m | **≤ 1,45** | ~5 min | ⭐ **DOS PORTALES EN ESQUINA** (los dos, el nº 1). Ataca la salvaguarda **D3** | ✅ **v1: la esquina no engañó al enganche** (3,9 y 2,7 m). Los testigos callan porque las aceras no tienen nombre — **y callar es lo correcto** |
| 7 | Calle El Coloso 2 | Calle Valle de Zuriza 48 | 2.380 m | **2,4–2,6 km** ✅ | **≤ 1,20** | **~25 min** | ⭐⭐ **EL DE CALIBRACIÓN.** Único con distancia **medida** y tiempo de repetición | ⚠️ **Ya NO sale de aquí la velocidad del buscador** (8/08: constante estándar de 5,0 km/h). De aquí salen **las BANDAS de distancia**, que siguen a ~6 km/h **porque son el ritmo de Antonio y su trabajo es juzgar los metros, no calcularlos** |

⚠️ **Los rodeos son propuestos, no medidos.** Se ajustan cuando haya rodeos reales de varios
trayectos — **y el ajuste se declara**, no se hace en silencio. El de la nº4 es más generoso porque
una estación obliga a rodear el edificio; el de la nº7 es más estricto porque **está medido: 1,09**.

---

## ⛔ Lo que esta tabla rompió en su primera ejecución

**Cero de siete en banda — y el fallo era de la tabla, no del motor.** Eso ya la justifica: un
banco de pruebas que solo confirma no sirve de nada.

**Y encontró dos cosas que ningún contador había visto:**

⭐⭐ **1 · NO HAY CAMINO A LA ESTACIÓN DE DELICIAS** (ruta nº4). Dos causas, **ninguna del grafo**:
se rutea **al centro del edificio, no a su puerta**, y **el único acceso que queda es un pasillo
interior — un paso condicional de los que se decidió ignorar.** Con ellos abiertos: 900 m.
⇒ **Le pone número a una decisión tomada a ojo** (*"se ignoran porque rara vez vamos a tener estas
cosas"*): la primera consecuencia real es que **la estación de tren de Zaragoza queda sin acceso.**
⇒ **Esa decisión hay que reabrirla**, y la salida ya estaba escrita: **usarlos y avisar** en vez de
ignorarlos.

⭐ **2 · EL CENTROIDE DE LOS EDIFICIOS GRANDES.** Rutear a una estación, un hospital o un centro
comercial **por su centro geométrico** en vez de por su entrada. No afecta solo a Delicias: afecta
al Clínico de la nº3 y a cualquier POI grande.

---

## ⭐ Qué se comprueba, y qué NO

**Se comprueba:**
- Que **existe camino**. *(Y ya falló una vez.)*
- Que el **rodeo** cae dentro de lo aceptable. **Es la comprobación principal.**
- Que ninguna ruta es **más corta que la recta** — imposibilidad física.
- ⭐ En la nº1, **por qué puente cruza**.

**NO se comprueba:**
- El tiempo real: depende de semáforos, cuestas y del paso de cada uno.
- Que la ruta sea **la que una persona elegiría**. Una ruta correcta puede ser incómoda.
- Nada de transporte público: **los siete son a pie**, que es lo único que existe en H1.

---

## ⛔ Cómo NO usar esta tabla

- **No se ajusta el motor hasta que salgan bien.** Si uno falla se averigua **por qué**, y la
  corrección va como **regla**, no como parche (ley 40).
- ⭐ **Pero tampoco se ajusta la TABLA hasta que salgan bien.** La v2 existe porque la v1 era
  imposible **contra la línea recta**, que no depende del motor. **Ése es el único motivo válido
  para tocar una banda: que sea físicamente inalcanzable, no que el motor no llegue.**
- **No se añaden trayectos elegidos mirando los resultados.**
- ⚠️ **Que los siete pasen NO significa que el grafo esté bien.** Siete sobre 98.774 aristas es una
  muestra minúscula: **sirven para detectar fallos, no para certificar aciertos** (ley 36).

---

## Para ampliar más adelante

- Un trayecto que **cruce el Gállego**.
- Uno en **zona de solo eje de calzada** (Movera, Garrapinillos, un polígono).
- ⭐ Uno cuya ruta obvia pase por un **paso condicional**, para ver qué hace el motor.
- ⭐ Uno con destino en un **barrio incomunicado** (Peñaflor): la respuesta correcta es `IMPOSIBLE`.
- Uno que cruce una **plaza mapeada como área** — abierto desde la tanda 3.
- Uno **de noche**, cuando exista el reloj (H3).
- ⭐⭐ **Y una segunda distancia medida con GPS**, la que sea: **toda la calibración cuelga de un
  solo trayecto.**

---

## Estado

**Filas reales: 7** · **v2 (3/08/2026)** — velocidad recalibrada a ~6 km/h y rodeo como columna
principal.
⭐ **Nota del 8/08/2026:** el buscador dejó de calcular sus tiempos con el ritmo de Antonio y pasó a
una **constante estándar de 5,0 km/h**. **Esta tabla no cambia**: sus bandas y sus tiempos siguen
siendo los de Antonio, **porque su trabajo es JUZGAR al motor, no alimentarlo.**

⚠️ **Sin cubrir:** el Gállego, las zonas sin acera, los pasos condicionales, los barrios
incomunicados y las plazas-área.

⚠️ **Y el hueco que la propia tanda 11 declaró y que esta tabla NO cubre:** **11.942 portales
(25,9 %) donde los dos testigos callan** porque la calle no tiene nombre en OSM. Ahí el enganche
puede estar equivocándose **sistemáticamente** sin que ninguna salvaguarda se entere. **Es por donde
entraría el fallo invisible**, y ninguno de estos siete trayectos pasa por ahí.
