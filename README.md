<div align="center">

# Desplázame

**Cómo ir de un portal a otro en Zaragoza: andando, en autobús o tranvía, en bici o patinete, o en coche.**

[![Licencia](https://img.shields.io/badge/licencia-Apache%202.0-64748B)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet%20%2B%20OpenStreetMap-199900)](https://leafletjs.com/)
[![Estado](https://img.shields.io/badge/estado-en%20construcci%C3%B3n-B45309)](#estado-ya-calcula-rutas-andando)

</div>

---

## Estado: ya calcula rutas andando

> ⚠️ **Este repositorio está en construcción: arranca en local y no está publicado todavía en
> ninguna dirección.** Lo que ya funciona de punta a punta es **el modo andando**: se escribe
> de dónde a dónde, se pulsa «Generar ruta», y la pantalla dibuja la ruta de verdad en el mapa
> y lista las indicaciones paso a paso. **Los otros tres modos —bus o tranvía, bici y coche—
> todavía no calculan nada**, y el motor lo dice con esas palabras cuando se los piden.
>
> La pantalla vive en [`app/`](app/): el formulario de cuatro campos, los cuatro modos, el mapa
> y las indicaciones. **Los cuatro campos se rellenan contra el motor**, con el callejero de
> verdad de Zaragoza: la calle se autocompleta al teclear, y el
> portal se elige de la lista de los que esa calle tiene. El mapa ya es un mapa de verdad —Leaflet sobre
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
> ahí para contrastarla, no como afirmación. Ninguna de las catorce interviene en el cálculo:
> son **para mirar**, no para rutar. La ruta la calcula el motor con su propio grafo en
> memoria, y lo que el navegador recibe es la línea ya hecha.
>
> **Y ya son dos páginas.** La de siempre —el buscador, en la raíz— y un **visor de capas** en
> `/visor`: el mismo mapa y las mismas catorce capas, pero a ventana casi completa. No es
> producto: es la herramienta con la que se verifica cada dato que entra, porque en el lienzo
> pequeño de debajo del formulario no se ve nada. Se irá con el andamio.
>
> Y ya hay **motor**: un servidor mínimo en Node que carga al arrancar el grafo de la ciudad,
> el callejero y los **46.150 portales enteros**, y levanta con ellos la **red por la que de
> verdad se puede andar** —93.503 aristas de las 98.774, ya con su adyacencia—, que es la que
> rutea. Sirve lo que ves al rellenar el formulario
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
> **⭐ Y la ruta se ve.** El motor la calcula —`POST /api/ruta` recibe las dos direcciones por
> código— y la pantalla la enseña: la línea entera **de puerta a puerta** sobre el mapa, que se
> encuadra solo alrededor de ella, y debajo las indicaciones al **formato de Google Maps**,
> cada paso con su flecha, su frase y sus metros. De CALLE ALFONSO I 10 a PASEO INDEPENDENCIA
> 3 —342 m, ~4 min— son estos cuatro:
>
> > ◉ Sal de CALLE ALFONSO I 10 y dirígete hacia el suroeste por Calle de Alfonso I · **91 m**
> > ↰ Gira a la izquierda hacia la acera · **150 m**
> > ↗ Gira ligeramente a la derecha hacia Plaza de España · **96 m**
> > ⚑ PASEO INDEPENDENCIA 3 está a la izquierda
>
> **La flecha sale del tipo de giro, no de la frase.** El motor manda el dato —`izquierda`,
> `ligera-derecha`— y la pantalla elige el glifo; parsear el texto para ver si lleva la palabra
> «derecha» ataría el icono a la redacción. Son diez giros y diez caracteres Unicode, sin una
> sola dependencia añadida.
>
> **Cuatro, y no once.** Un cruce son siete piezas de red —bajas de la acera, cruzas, subes,
> bordeas— y quien anda percibe **una** maniobra, así que lo que mide menos de **25 m** se funde
> con el paso anterior y el giro que se anuncia se recalcula con el **ángulo combinado**, para
> que fundir no se coma un giro de verdad. El umbral no es un gusto: sale de medir 6.443 pasos de
> 363 rutas reales, donde la cuesta de micro-pasos muere justo en los 25-30 m.
>
> **Y hay una segunda pasada, la que quita el «otra vez esta calle».** OpenStreetMap parte los
> paseos en muchos trozos, así que Paseo de Fernando el Católico salía anunciado dos veces
> seguidas, y Paseo de la Independencia tres, partido por un tramo peatonal sin nombre. Dos
> maniobras de la misma calle separadas por un giro que no es un giro son **una**; y una calle
> que interrumpe a otra durante menos de **105 m** se absorbe entre sus dos mitades — los 105 m
> son de OSRM, su `NAME_SEGMENT_CUTOFF_LENGTH`, leído de su fuente. En una ruta de 6,4 km de
> punta a punta de la ciudad, los **82 tramos de red** que se pisan se leen en **17 pasos**. Lo
> que **no** desaparece es un giro de verdad aunque la calle se llame igual: ahí es justo donde
> hace falta la instrucción.
>
> **Y el tiempo va dicho como lo que es**: «~4 min **a 5 km/h**». Es una división —los metros
> entre la velocidad a pie de manual—, no un cronómetro: no entran cuestas, ni semáforos, ni el
> rato que se tarda en cruzar. Un «4 min» a secas prometería algo que aquí no se ha medido.
>
> Para escribirlos hizo falta el otro medio dato: las aristas del grafo llevan el id de calle de
> OpenStreetMap pero **ningún nombre**. Las **19.897 calles con nombre** viven en `motor/data/`,
> promovidas de la rama archivada sin descargar nada. Cubren el **40,8 %** de las aristas, que es
> el **techo de OpenStreetMap** y no un fichero incompleto: aceras y pasos de peatones no llevan
> nombre propio allí. Lo que no tiene nombre **ni lo hereda** se dice **por su tipo** —«el paso
> de peatones», «las escaleras», «la acera»—, que es lo que hace Valhalla.
>
> **Y por su tipo REAL, que no es lo mismo.** El grafo trae una etiqueta propia que mete en el
> mismo saco la calzada, el carril bici, el camino de tierra y el vial de servicio: **4.671 de
> sus 4.675 tramos de carril bici** la llevan. Fiándose de ella, a quien iba por un carril bici
> se le decía que anduviera **«por la calzada»** — no un hueco de información: una frase falsa.
> Ahora manda la etiqueta `highway` de OpenStreetMap, con **los 27 valores traducidos uno a
> uno**: «el carril bici», «el camino», «el vial de servicio», «la senda»… y «la calzada» solo
> donde de verdad lo es. Está contado en [`docs/BITACORA.md`](docs/BITACORA.md), entrada nº7.
>
> **⭐ Y desde el 20/08 la mayoría ya no se dice por su tipo: se dice por su nombre.** «Hacia el
> carril bici · 1.270 m» seguía siendo verdad y seguía sin servir, porque ese carril bici **es**
> la Avenida Academia General Militar: va pegado a ella. El nombre no está en OpenStreetMap y no
> va a estar —medido: **0 de 26.008** tramos mudos de Zaragoza declaran a qué calle pertenecen—,
> pero sí está en el callejero municipal, que publica **la geometría de sus 3.359 vías**. Así que
> el motor las descarga, y al arrancar **cada tramo mudo le pregunta a la calle que tiene al
> lado**: se muestrea cada 15 m, cada muestra vota al eje municipal más cercano dentro de 25 m, y
> gana el más votado. En **225 ms**, **19.358 de 29.206** tramos mudos cogen nombre, y las
> aristas con nombre pasan del **40,0 % al 77,1 %**.
>
> **Con dos puertas, porque lo dudoso no se acepta solo.** Si el ganador no cubre la mitad del
> tramo, no hereda; y si una segunda calle **con otro nombre** se lleva el 80 % de sus votos,
> tampoco — ahí el tramo va entre dos calles y no se sabe de cuál es, así que se sigue diciendo
> el genérico, que dice poco pero es cierto. Y los **pasos de peatones y las escaleras** no
> heredan nunca: una cebra **cruza** la calle, no pertenece a ella, y decir «continúa por Avenida
> de Navarra» mientras se cruza Navarra le quita a quien anda justo el aviso que necesita.
>
> Así, una ruta de punta a punta deja de decir «hacia el carril bici · 1.270 m» y dice lo que se
> anda de verdad: **AVENIDA ACADEMIA GENERAL MILITAR · 430 m**, un tramo de 82 m que ninguna
> calle reclama, y **AVENIDA SAN JUAN DE LA PEÑA · 760 m**.
>
> ⚠️ **Y trae un defecto conocido, que se dice en vez de esconderse.** Los nombres vienen de dos
> registros distintos —OpenStreetMap escribe «Avenida de San José» y el municipal «AVENIDA SAN
> JOSÉ»—, así que al pasar del carril heredado a la calzada nombrada, **la ruta dice la misma
> calle dos veces seguidas con dos ortografías**. Medido sobre 400 rutas de 300 a 4.000 m: pasa
> en el **54,8 %** de ellas y afecta al **6,5 %** de los pasos. No es falso —los dos nombres son
> ciertos—, pero se lee mal, y unificarlo exige decidir **qué registro manda dentro de la ruta**.
> Está declarado y sin decidir.
>
> **Y hay direcciones a las que el motor contesta que no puede, en vez de inventarse un camino.**
> Son **581 portales** de catorce vías —460 de ellos en URBANIZACIÓN PEÑA ZORONGO— cuyas calles
> existen y son andables, pero forman **islas** del grafo: desde el resto de Zaragoza no se llega
> andando. Ahí la pantalla enseña el aviso del motor en ámbar, con el nombre de la calle, y el
> mapa se queda limpio. Ni una línea inventada para tapar el hueco.
>
> **Lo que sigue sin existir**: rutas en bus, bici o coche —el motor lo dice cuando se las
> piden—, y saber qué líneas pasan por cada poste.
>
> Así que hoy el repositorio es esto: **el método de trabajo, el plan, las licencias, catorce
> conjuntos de datos verificados, y un buscador que de verdad busca — andando, de portal a
> portal, con la ruta en el mapa y los pasos escritos debajo.**
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

> ⚠️ **Solo hay rutas ANDANDO**, que es el modo que viene marcado al abrir. Con bus, bici o
> coche la pantalla enseña el aviso del motor diciendo que ese modo todavía no se calcula — no
> una ruta a pie disfrazada de otra cosa.

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
| `GET /api/salud` | si está vivo, y con qué dato: grafo, red andable —con cuántos nombres trae de OpenStreetMap y cuántos hereda del callejero municipal—, callejero y portales, con sus recuentos |
| `GET /api/vias?q=` | sugiere vías desde 2 letras, hasta 10 resultados. Sin `q`, lista vacía |
| `GET /api/portales?via=` | todos los portales de esa vía, ya ordenados. Sin `via`, lista vacía |
| `GET /api/portal-cercano?lat=&lon=` | el portal más cercano a un punto, con su vía y sus metros. Barre los 46.150 en **1,35 ms** medidos. Sin coordenadas válidas, `null` |
| `POST /api/ruta` | la ruta **andando** entre dos portales, por códigos: geometría, pasos escritos, metros y duración derivada. **Es la que llama «Generar ruta»**. Medido de punta a punta: **p50 15 ms, p95 19**. Sin ruta, un aviso que dice por qué |

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

> ℹ️ **Y las dos están en uso.** El repositorio lleva **catorce conjuntos de datos dentro**:
> **once** del Ayuntamiento de Zaragoza —el callejero, los portales, los carriles bici, los
> postes de autobús, las estaciones BiZi, los aparcabicis, los aparcamotos, el estacionamiento
> regulado, las zonas reguladas, las reservas de espacio y **los ejes de vía**—, el grafo de
> continuidad y **los nombres de vía**, los dos derivados de OpenStreetMap, y el GTFS del Punto
> de Acceso Nacional. A eso se suma la
> **cartografía de OpenStreetMap**, que no es un fichero: el mapa la pinta en vivo.
> **La atribución de OpenStreetMap se cumple en la pantalla**, en el control del mapa y con la
> palabra «colaboradores» literal. La del dato municipal se cumple en
> **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)**, con una ficha por conjunto —quince,
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
