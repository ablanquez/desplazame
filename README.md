<div align="center">

# Desplázame

**Cómo ir de un portal a otro en Zaragoza: andando, en autobús o tranvía, en bici o en coche.**

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
> portal se elige de la lista de los que esa calle tiene. Pero **no busca rutas**. Al pulsar «Generar
> ruta» devuelve siempre la misma **ruta de prueba, fija e inventada**, y la pantalla lo
> dice con todas las letras. El mapa ya es un mapa de verdad —Leaflet sobre
> OpenStreetMap— y ya puede dibujar encima **diez datos reales**: del Ayuntamiento de
> Zaragoza, los **46.150 portales**, los **733 tramos de carril bici**, los **944 postes de
> autobús**, las **276 estaciones BiZi**, los **2.158 aparcabicis**, los **2.146
> aparcamotos**, el **estacionamiento regulado** —los **1.159 tramos** de zona azul y de
> residentes, de un censo de 7.391— y los **13 perímetros de zona**; de OpenStreetMap, las
> **98.774 aristas** del grafo de
> continuidad peatonal y ciclable; y del GTFS, los **89 trazados de línea** —tranvía
> incluido, con sus 50 paradas—. **Trece capas**, cada una con su casilla; **todas empiezan
> apagadas** y se encienden a mano, porque las trece a la vez no se leen. Una de ellas no es un
> dato más: es una **vista de cotejo** del regulado —los 2.860 tramos libres cuya zona no tiene
> perímetro publicado, que **quizá** sean la ampliación de zona azul que se prepara—, y está
> ahí para contrastarla, no como afirmación. Pero el buscador **todavía no usa** ninguno: la
> línea que dibuja al generar sigue siendo tan inventada como los pasos.
>
> **Y ya son dos páginas.** La de siempre —el buscador, en la raíz— y un **visor de capas** en
> `/visor`: el mismo mapa y las mismas trece capas, pero a ventana casi completa. No es
> producto: es la herramienta con la que se verifica cada dato que entra, porque en el lienzo
> pequeño de debajo del formulario no se ve nada. Se irá con el andamio.
>
> Y ya hay **motor**: un servidor mínimo en Node que carga al arrancar el grafo de la ciudad,
> el callejero y los **46.150 portales enteros**, y sirve lo que ves al rellenar el formulario
> — de las 3.359 vías del callejero
> ofrece las **2.731 que tienen algún portal**, porque sugerir una calle sin portales sería
> prometer una dirección que después no se puede resolver. Cuando la calle está en un barrio
> rural lo dice: **CALLE BURGOS [CASETAS]**, que es distinta de la CALLE BURGOS de la ciudad.
> Va entre corchetes y no entre paréntesis porque los paréntesis ya son del dato: hay 15 vías
> que los traen en su propio nombre.
>
> **El portal no se escribe: se elige.** Fijada la calle, el motor sirve sus portales reales y
> el campo los ofrece en el orden en que se lee un callejero —1, 2, 3, 10, no 1, 10, 2—, con
> sus rarezas tal cual vienen: **9-11**, **1DP**, **22B**, **71 TV C2**. Así no hay número
> inventado que resolver después: de una lista no se puede elegir lo que no existe.
>
> **Pero no calcula ninguna ruta**: eso no existe todavía. Tampoco se sabe aún qué líneas
> pasan por cada poste.
>
> Así que hoy el repositorio es esto: el método de trabajo, el plan, las licencias y dos
> páginas con andamio.
>
> El README se publica igualmente desde el principio —el repositorio es público desde el
> primer commit— y por eso dice lo que hay, no lo que habrá.

---

## Qué va a ser

**Desplázame es un buscador de rutas para moverse por Zaragoza.** Se escribe de dónde a
dónde, se elige un modo de transporte, y devuelve la ruta en el mapa y los pasos escritos.

Una sola pantalla:

- **Formulario de cuatro campos**: calle y portal de origen, calle y portal de destino.
- **Cuatro botones de modo, excluyentes**: andando, autobús/tranvía, bici, coche.
- **Mapa con la ruta**.
- **Las indicaciones paso a paso**, debajo.

Y nada más. El alcance es corto a propósito.

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

> ℹ️ **Y las dos están en uso.** El repositorio lleva **once conjuntos de datos dentro**: nueve
> del Ayuntamiento de Zaragoza —el callejero, los portales, los carriles bici, los postes de
> autobús, las estaciones BiZi, los aparcabicis, los aparcamotos, el estacionamiento regulado y
> las zonas reguladas—, el grafo de continuidad derivado de OpenStreetMap, y el GTFS del Punto
> de Acceso Nacional. A eso se suma la
> **cartografía de OpenStreetMap**, que no es un fichero: el mapa la pinta en vivo.
> **La atribución de OpenStreetMap se cumple en la pantalla**, en el control del mapa y con la
> palabra «colaboradores» literal. La del dato municipal se cumple en
> **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)**, con una ficha por conjunto —doce,
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
