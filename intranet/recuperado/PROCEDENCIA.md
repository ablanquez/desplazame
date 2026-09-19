# Procedencia de lo recuperado

Estos ficheros **no se han escrito aquí**: se han sacado de la historia de git,
tal cual estaban el día antes de que se borraran. Se guardan con su procedencia
anotada para que la fase 2 no dependa de la memoria de nadie.

El commit que los borró es `6327e45` —*«fuera la pestaña del visor y los
andamios - se reserva para la intranet»*, sábado 22/08/2026 16:19—, y su mensaje
dice dónde buscarlos: *«todo eso vive en la historia de git a partir de este
commit, que es donde el punto 14 lo va a buscar»*.

El punto conocido es su **primer padre**, `6327e45^` = `ddcdb11`. [gitrevisions,
manual oficial] `<rev>^` es el primer padre y `<rev>:<path>` nombra el blob de
esa ruta en ese commit.

## Cómo se sacó cada uno

    git show 6327e45^:app/src/app/<fichero> > intranet/recuperado/<fichero>

## Qué se sacó, y la prueba de que es lo mismo

El `blob` que git guarda y el `hash-object` del fichero recuperado son **el
mismo sha1** en los siete. No es una copia parecida: es el mismo objeto.

| fichero | líneas | blob en `6327e45^` |
|---|---:|---|
| `capas.ts` | 677 | `e4684a2d05c0e55b051b8598769deac2b7af7a39` |
| `capas.spec.ts` | 221 | `582a6ccfe2f94328dbec5e643d677022c0954908` |
| `visor.ts` | 42 | `eda103957491d0d88e83a3eabf4878eb71d1d446` |
| `visor.html` | 11 | `752bfba914b04074b8dc554ffc373406a5b488ee` |
| `visor.css` | 32 | `a676ed902076cc65c82c20fed179a16496a625f7` |
| `visor.spec.ts` | 190 | `4a44efc8e814274ce46adae52f9986e3c902fcd9` |
| `mapa.ts` | 1.001 | `96fdd689a6972f63fbff4f450efcdffe0ab8ff1b` |

⚠️ **`mapa.ts` no es un fichero del visor.** Es el mapa de entonces, entero, y
se recupera solo por sus **líneas 261-972**: los catorce pinceles y el control
de casillas. Sus otras 289 líneas son el mapa del buscador de agosto, y ése ha
seguido viviendo y creciendo en `app/src/app/mapa.ts` — hoy tiene 1.019 líneas
y **no se parece**. Ver `../DIAGNOSTICO.md`.

## La letra del PLAN, comprobada contra git

La letra registra; git manda. Coinciden en todo lo que se pudo comprobar:

- `capas.ts` 677 líneas → **git dice 677**.
- `mapa.ts` de entonces 1.001 líneas, pinceles en 261-972 → **git dice 1.001**, y
  el primer pincel (`pintarPmr`) abre en la 261 y el último (`pintarPortales`)
  cierra en la 972, justo antes de `pintarTrazado` en la 973.
- «21 guardianes retirados: los 10 de `capas.spec`, los 7 de `visor.spec` y
  cuatro de `app.spec`» → **10 y 7 contados en los ficheros recuperados**.

## Lo que NO se ha recuperado, y por qué

El commit del borrado también quitó **el andamiaje**: la ruta `/visor` en
`rutas.ts`, la barra de navegación de `app.ts`/`app.html`/`app.css`, la llamada
`capas.cargar()` del constructor del buscador, la entrada `data → datos` de
`angular.json` y cuatro guardianes de `app.spec.ts`.

Nada de eso se trae: **son tres líneas sueltas en ficheros que llevan un mes
cambiando**, y traerlas sería traer conflictos, no código. Están donde siempre:

    git show 6327e45 -- app/src/app/rutas.ts app/src/app/app.ts app/angular.json

Y la forma que tendrían HOY no es la de agosto: la app ya tiene tres rutas
perezosas nacidas después (`/panel`, `/identidad`, `/creditos`) que son el
molde. Ver `../DIAGNOSTICO.md`.
