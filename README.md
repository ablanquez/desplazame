<div align="center">

# Desplázame

**Cómo ir de un portal a otro en Zaragoza: andando, en autobús o tranvía, en bici o patinete, o en coche.**

[![Licencia](https://img.shields.io/badge/licencia-Apache%202.0-64748B)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet%20%2B%20OpenStreetMap-199900)](https://leafletjs.com/)
[![Estado](https://img.shields.io/badge/estado-en%20construcci%C3%B3n-B45309)](#estado-hoy-no-hay-aplicación)

</div>

---

## Estado: hoy no hay aplicación

> ⚠️ **Este repositorio está en construcción, y todavía no hay nada que puedas usar.**
> La pantalla ya existe en [`app/`](app/) y arranca en local: el formulario de cuatro
> campos, los cuatro modos y las indicaciones. **Los cuatro campos se rellenan ya contra el
> motor**, con el callejero de verdad de Zaragoza: la calle se autocompleta al teclear, y el
> portal se elige de la lista de los que esa calle tiene. Pero **la pantalla todavía no pide
> rutas al motor**: al pulsar «Generar ruta» devuelve siempre la misma **ruta de prueba, fija e
> inventada**, y lo dice con todas las letras. El mapa ya es un mapa de verdad —Leaflet sobre
> OpenStreetMap— y ya puede dibujar encima **once datos reales**: del Ayuntamiento de
> Zaragoza, los **46.150 portales**, los **2.120 tramos de carril bici**, los **944 postes de
> autobús**, las **276 estaciones BiZi**, los **2.158 aparcabicis**, los **2.146
> aparcamotos**, el **estacionamiento regulado** —los **1.159 tramos** de zona azul y de
> residentes, de un censo de 7.391—, los **13 perímetros de zona** y las **1.226 reservas
> PMR** —dónde puede aparcar quien lleva tarjeta de movilidad reducida—; de OpenStreetMap, las
> **98.774 aristas** del grafo de continuidad peatonal y ciclable; y del GTFS, los **89
> trazados de línea** —tranvía
> incluido, con sus 50 paradas—. **Catorce capas**, cada una con su casilla; **todas empiezan
> apagadas** y se encienden a mano, porque las catorce a la vez no se leen. Una de ellas no es un
> dato más: es una **vista de cotejo** del regulado —los 2.860 tramos libres cuya zona no tiene
> perímetro publicado, que **quizá** sean la ampliación de zona azul que se prepara—, y está
> ahí para contrastarla, no como afirmación. Pero el buscador **todavía no usa** ninguno: la
> línea que dibuja al generar sigue siendo tan inventada como los pasos.
>
> **Y ya son dos páginas.** La de siempre —el buscador, en la raíz— y un **visor de capas** en
> `/visor`: el mismo mapa y las mismas catorce capas, pero a ventana casi completa. No es
> producto: es la herramienta con la que se verifica cada dato que entra, porque en el lienzo
> pequeño de debajo del formulario no se ve nada. Se irá con el andamio.
>
> Y ya hay **motor**: un servidor mínimo en Node que carga al arrancar el grafo de la ciudad,
> el callejero y los **46.150 portales enteros**, y sirve lo que ves al rellenar el formulario
> — de las 3.359 vías del callejero
> ofrece las **2.731 que tienen algún portal**, porque sugerir una calle sin portales sería
> prometer una dirección que después no se puede resolver. Cuando la calle está en un barrio
> rural lo dice: **CALLE BURGOS [CASETAS]**, que es distinta de la CALLE BURGOS de la ciudad.
> Va entre corchetes y no entre paréntesis porque los paréntesis ya son del dato: hay 38 vías
> que los traen en su propio nombre, 32 de ellas con portal.
>
> **El portal no se escribe: se elige.** Fijada la calle, el motor sirve sus portales reales y
> el campo los ofrece en el orden en que se lee un callejero —1, 2, 3, 10, no 1, 10, 2—, con
> sus rarezas tal cual vienen: **9-11**, **1DP**, **22B**, **71 TV C2**. Así no hay número
> inventado que resolver después: de una lista no se puede elegir lo que no existe.
>
> **Y el formulario gana dos atajos.** Un **⇅** entre origen y destino que los intercambia
> enteros: el texto, el código y hasta la marca de «esto está a medias» viajan con su lado. Y un
> **📍 Mi ubicación** en origen, que rellena la calle y el portal con donde estás. No escribe
> texto: fija los mismos códigos que fijaría elegir de la lista, así que la validación ni se
> entera de que ha habido GPS. Antes de fiarse comprueba **dos cosas**: que el navegador sepa
> dónde estás con menos de **100 m** de margen, y que haya un portal a menos de **150 m**. Si no,
> lo dice en ámbar y no toca ningún campo. Para poner la ubicación como **destino** no hay botón
> aparte: se pone en origen y se pulsa el ⇅.
>
> Lo que ese aviso **no** dice es si estás en Zaragoza, y no por prudencia: **con estos datos no
> se puede saber**. El Polígono PLAZA está en Zaragoza y su portal más cercano queda a
> **1.423 m** — más lejos que el centro de Utebo, que no lo está (1.387 m). No hay distancia que
> separe los dos grupos, así que el aviso habla de lo que sí se sabe: a cuántos metros está el
> portal más cercano.
>
> **⭐ Y desde hoy el motor CALCULA RUTAS andando** — pero la pantalla todavía no las enseña, así
> que conviene decirlo fino. `POST /api/ruta` recibe dos direcciones por código y devuelve la
> ruta de verdad: la línea entera, los metros, una duración derivada, y los pasos escritos al
> **formato de Google Maps**. De CALLE ALFONSO I 10 a PASEO INDEPENDENCIA 3, 342 m, son estos
> cuatro:
>
> > Sal de CALLE ALFONSO I 10 y dirígete hacia el suroeste por Calle de Alfonso I · **91 m**
> > · Gira a la izquierda hacia la acera · **150 m**
> > · Gira ligeramente a la derecha hacia Plaza de España · **96 m**
> > · PASEO INDEPENDENCIA 3 está a la izquierda
>
> **Cuatro, y no once.** Un cruce son siete piezas de red —bajas de la acera, cruzas, subes,
> bordeas— y quien anda percibe **una** maniobra, así que lo que mide menos de **25 m** se funde
> con el paso anterior y el giro que se anuncia se recalcula con el **ángulo combinado**, para
> que fundir no se coma un giro de verdad. El umbral no es un gusto: sale de medir 6.443 pasos de
> 363 rutas reales, donde la cuesta de micro-pasos muere justo en los 25-30 m.
>
> **El botón «Generar ruta» del formulario sigue devolviendo la respuesta inventada**:
> engancharlo es lo siguiente.
>
> Para escribirlos hizo falta el otro medio dato: las aristas del grafo llevan el id de calle de
> OpenStreetMap pero **ningún nombre**. Las **19.897 calles con nombre** viven en `motor/data/`,
> promovidas de la rama archivada sin descargar nada. Cubren el **40,8 %** de las aristas, que es
> el **techo de OpenStreetMap** y no un fichero incompleto: aceras y pasos de peatones no llevan
> nombre propio allí. Por eso lo que no tiene nombre se dice **por su tipo** —«el paso de
> peatones», «las escaleras», «la acera»—, que es lo que hace Valhalla.
>
> **Y hay direcciones a las que el motor contesta que no puede, en vez de inventarse un camino.**
> Son **581 portales** de catorce vías —460 de ellos en URBANIZACIÓN PEÑA ZORONGO— cuyas calles
> existen y son andables, pero forman **islas** del grafo: desde el resto de Zaragoza no se llega
> andando. Ahí sale un aviso con su nombre, no una ruta.
>
> **Lo que sigue sin existir**: rutas en bus, bici o coche —el motor lo dice cuando se las
> piden—, y saber qué líneas pasan por cada poste.
>
> Así que hoy el repositorio es esto: **el método de trabajo, el plan, las licencias, trece
> conjuntos de datos verificados, **un motor que ya calcula rutas andando de portal a portal**,
> y dos páginas con andamio.**
>
> El README se publica igualmente desde el principio —el repositorio es público desde el
> primer commit— y por eso dice lo que hay, no lo que habrá.

**Lo que no cabe aquí vive al lado**, y es donde está lo interesante:

- **[`PLAN-DESPLAZAME.md`](PLAN-DESPLAZAME.md)** — el plan por puntos: qué está hecho, qué toca
  ahora y qué queda.
- **[`docs/BITACORA.md`](docs/BITACORA.md)** — los fallos reales, con lo que daba verde mientras
  el fallo estaba vivo y la ley que salió de cada uno.
- **[`docs/INVESTIGACION-EQUIPAMIENTOS.md`](docs/INVESTIGACION-EQUIPAMIENTOS.md)** — los datos
  abiertos del Ayuntamiento sondeados uno a uno: qué publican, por qué puerta, y en qué no
  coinciden entre sí.
- **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)** — una ficha por conjunto de datos: de
  dónde salió, con qué licencia, y qué trae de roto.

---

## Qué va a ser

**Desplázame es un buscador de rutas para moverse por Zaragoza.** Se escribe de dónde a
dónde, se elige un modo de transporte, y devuelve la ruta en el mapa y los pasos escritos.

Una sola pantalla:

- **Formulario de cuatro campos**: calle y portal de origen, calle y portal de destino.
- **Cuatro botones de modo, excluyentes**: andando, autobús/tranvía, bici o patinete, coche.
- **Mapa con la ruta**.
- **Las indicaciones paso a paso**, debajo.

Y nada más. El alcance es corto a propósito.

---

## Cómo arrancarlo en local

Hace falta **[Node](https://nodejs.org/)** y nada más. **Probado con Node 24.19.0 y npm 11.17.0**
—la versión de npm sí la fija el repositorio, en `packageManager`—.
⚠️ **El mínimo de Node no consta**: el repositorio no declara `engines`, y aquí no se ha probado
con versiones anteriores. Lo que sí se sabe es por qué importa — **el motor ejecuta TypeScript sin
compilarlo**, y eso pide un Node reciente: con uno viejo no arranca, y nadie te avisa antes.

```bash
git clone https://github.com/ablanquez/desplazame.git
cd desplazame
npm install          # en la RAÍZ: son workspaces, instala los tres a la vez
```

Y luego **dos terminales**, porque son dos procesos:

```bash
# terminal 1 — el motor, en el 3000
cd motor && npm start

# terminal 2 — la interfaz, en el 4200
cd app && npm start
```

Con las dos arriba, en el navegador:

| | |
|---|---|
| **<http://localhost:4200/>** | el buscador: el formulario, el mapa y las indicaciones |
| **<http://localhost:4200/visor>** | el visor de capas: el mismo mapa a ventana completa |

> ⚠️ **No esperes rutas EN LA PANTALLA.** El motor ya las calcula —se pueden pedir a
> `POST /api/ruta` con `curl`—, pero el formulario todavía no está enganchado a él: «Generar
> ruta» sigue devolviendo la misma ruta inventada, y lo dice con todas las letras.

> ℹ️ **«Mi ubicación» solo funciona en `localhost`.** El navegador reserva la geolocalización a
> los contextos seguros, y `localhost` cuenta como tal; si abres la interfaz por la IP de la
> máquina desde otro aparato, el botón lo dirá en vez de quedarse callado.

### Comprobar que lo que contesta es lo de ahora

Un `200` dice que **alguien** contesta; no dice quién ni con qué. Hay una guardia para cada
proceso, y sale de un fallo real que está contado en la bitácora:

```bash
cd app
npm run comprobar-arranque            # la interfaz: ¿contesta, quién, y no es un servidor caducado?
npm run comprobar-arranque -- motor   # el motor: ¿lleva el dato, y sabe rutear?
```

Las dos son solo de Windows: leen el PID con `netstat` y la hora de arranque con PowerShell.

### La API del motor, hoy

Cinco rutas vivas. Las que vengan las decide el plan, no esta lista:

| | |
|---|---|
| `GET /api/salud` | si está vivo, y con qué dato: grafo, callejero y portales, con sus recuentos |
| `GET /api/vias?q=` | sugiere vías desde 2 letras, hasta 10 resultados. Sin `q`, lista vacía |
| `GET /api/portales?via=` | todos los portales de esa vía, ya ordenados. Sin `via`, lista vacía |
| `GET /api/portal-cercano?lat=&lon=` | el portal más cercano a un punto, con su vía y sus metros. Barre los 46.150 en **1,35 ms** medidos. Sin coordenadas válidas, `null` |
| `POST /api/ruta` | la ruta **andando** entre dos portales, por códigos: geometría, pasos escritos, metros y duración derivada. Medido de punta a punta: **p50 15 ms, p95 19**. Sin ruta, un aviso que dice por qué |

En desarrollo el `4200` las reenvía al `3000` con un proxy, así que la interfaz siempre pide a
`/api/…` y no sabe en qué puerto vive el motor.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Interfaz** | [Angular 22](https://angular.dev/) con componentes *standalone* (sin NgModules) · *build* con Angular CLI |
| **Mapa** | [Leaflet](https://leafletjs.com/) sobre [OpenStreetMap](https://www.openstreetmap.org/) |
| **Motor** | **Node** + **TypeScript** ejecutado **sin compilar** —Node borra los tipos al ejecutar, así que no hay *build*— · servidor mínimo (`node:http`) |
| **Tipos compartidos** | Un paquete común al motor y a la interfaz (`@desplazame/tipos`), también sin *build*. **El contrato crece cuando el motor lo pide**, no antes: si el motor cambia la forma de la respuesta, la interfaz no compila. **Eso es a propósito.** |
| **Lenguaje** | **TypeScript** de punta a punta |
| **Despliegue** | Hostinger, plan Node |

---

## La versión anterior

Esto es **un reinicio, no una migración**. Hubo un intento previo, con otro planteamiento, y
**no se hereda de él ni código ni documentación**. Pero tampoco se borra: está archivado y se
puede consultar.

- Rama: [`archivo/motor-vanilla`](https://github.com/ablanquez/desplazame/tree/archivo/motor-vanilla)
- Etiqueta: [`archivo/v1-motor`](https://github.com/ablanquez/desplazame/releases/tag/archivo/v1-motor)

---

## Licencia y créditos

Código: **[Apache 2.0](LICENSE)** · © 2026 **Antonio Blánquez Cabeza** —
[antonioblanquez.es](https://antonioblanquez.es)

Las dependencias de terceros conservan sus propias condiciones, una por una, en
**[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)**.

Los datos **no** van bajo esa licencia: conservan las suyas, y son estas dos.

| Dato | Licencia | Obligación |
|---|---|---|
| **OpenStreetMap** (cartografía, teselas y datos derivados) | **ODbL 1.0** | Atribución **literal**: «© **colaboradores** de OpenStreetMap», con enlace a [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright). La palabra *«colaboradores»* **no es opcional** |
| **Dato municipal del Ayuntamiento de Zaragoza** (callejero, portales y demás datos públicos) | Reutilización regida por la **[Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** | Citar la fuente y la fecha de actualización, y no desnaturalizar el sentido de la información |

> ℹ️ **Y las dos están en uso.** El repositorio lleva **trece conjuntos de datos dentro**: diez
> del Ayuntamiento de Zaragoza —el callejero, los portales, los carriles bici, los postes de
> autobús, las estaciones BiZi, los aparcabicis, los aparcamotos, el estacionamiento regulado,
> las zonas reguladas y las reservas de espacio—, el grafo de continuidad y **los nombres de
> vía**, los dos derivados de OpenStreetMap, y el GTFS del Punto de Acceso Nacional. A eso se suma la
> **cartografía de OpenStreetMap**, que no es un fichero: el mapa la pinta en vivo.
> **La atribución de OpenStreetMap se cumple en la pantalla**, en el control del mapa y con la
> palabra «colaboradores» literal. La del dato municipal se cumple en
> **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)**, con una ficha por conjunto —catorce,
> contando la cartografía—: fuente, fecha de descarga, licencia y cómo volver a conseguirlo.

> ⚠️ **Rectificación (18/08/2026).** Hasta hoy este párrafo decía que el repositorio **«no
> tiene ningún dato integrado —ni cartografía, ni callejero, ni paradas—, así que todavía no
> hay nada que atribuir»**. Era verdad el 16 de agosto por la mañana y dejó de serlo ese mismo
> día, en el commit `a35ffc9` — que es, precisamente, el que escribió la atribución de los
> portales en el notices. Sobrevivió dos días y trece commits de este README porque la regla
> de releer la portada se estaba cumpliendo **sobre el párrafo de «Estado»**, tres pantallas
> más arriba, que sí se corrigió trece veces. Queda escrito en `docs/BITACORA.md` (entrada
> nº5): una regla de releída vale lo que su alcance, y el resto del documento envejece con la
> regla dando verde. Se corrige aquí en vez de borrarlo en silencio, por lo mismo que en el
> notices: un documento que se enmienda sin decirlo vale menos que uno que lo dice.

**No es un producto oficial del Ayuntamiento de Zaragoza.**
