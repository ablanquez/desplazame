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
> campos, los cuatro modos y las indicaciones. Pero **no busca rutas**. Al pulsar «Generar
> ruta» devuelve siempre la misma **ruta de prueba, fija e inventada**, y la pantalla lo
> dice con todas las letras. El mapa ya es un mapa de verdad —Leaflet sobre
> OpenStreetMap— y ya puede dibujar encima dos datos reales: los **46.150 portales** del
> Ayuntamiento de Zaragoza y las **98.774 aristas** del grafo de continuidad peatonal y
> ciclable, cada uno con su casilla para encenderlo y apagarlo. Pero el buscador **todavía
> no los usa**: la línea que dibuja al generar sigue siendo tan inventada como los pasos.
> No hay motor, y de las paradas y los carriles bici no hay nada.
>
> Así que hoy el repositorio es esto: el método de trabajo, el plan, las licencias y una
> pantalla con andamio.
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
| **Motor** | **Node** + **TypeScript**, servidor mínimo (`node:http`) · *build* con `tsc` o esbuild |
| **Tipos compartidos** | Un paquete común al motor y a la interfaz (`Paso`, `Trayecto`, `Modo`, `Aviso`): si el motor cambia la forma de la respuesta, la interfaz no compila. **Eso es a propósito.** |
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

> ℹ️ **Estas dos declaraciones van por adelantado.** Hoy el repositorio **no tiene ningún dato
> integrado** —ni cartografía, ni callejero, ni paradas—, así que todavía no hay nada que
> atribuir. Se declaran ahora porque la atribución de OpenStreetMap es **una obligación de la
> ODbL**, no una cortesía, y porque el modelo de licencia del proyecto ya está decidido: el día
> que entre el primer fichero de datos, la obligación ya está escrita y no se olvida.

**No es un producto oficial del Ayuntamiento de Zaragoza.**
