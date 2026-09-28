# Changelog

Todo lo destacable que le pasa a Desplázame se anota aquí.

El formato es el de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las
versiones, las de [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-09-28

**Desplázame dice cómo ir de un portal a otro en Zaragoza.** Se escribe de dónde a dónde, se
elige el modo, y la pantalla dibuja la ruta en el mapa y lista las indicaciones paso a paso.
Son **ocho modos enteros en el motor** —andando, bus y tranvía, bici privada, patín (VMP),
BiZi, coche, moto y YeGo— que la botonera presenta en seis, porque dos familias se preguntan
en dos pasos. Angular 22 con Leaflet sobre OpenStreetMap delante; Node y TypeScript **sin
compilar** detrás, con el grafo de 68.649 nodos en memoria entre peticiones. En producción
desde el 8/09 en <https://desplazame.antonioblanquez.es>.

Esta versión es **la que cierra la auditoría de la fase 7**: seis bloques auditados —código,
tests, interfaz, operación, experiencia y documentación—, 38 hallazgos dictados uno a uno,
cuatro tandas de arreglo, un racimo de cinco micro-piezas, la verificación del auditor sobre
56 piezas y los escáneres externos. Lo que sigue son sus efectos.

### Añadido

- `npm run bateria` y sus diez atajos: las diez suites de pantalla —más de mil setecientos
  veredictos conducidos con un Chrome de verdad por CDP— se lanzan **desde el repositorio**.
  Antes el lanzador vivía fuera y quien clonaba lo reconstruía a mano.
- `docs/DESPLIEGUE.md`: cómo esto llega a producción, medido por SSH contra el servidor, con
  lo que no se sabe nombrado como `NO CONSTA` en vez de rellenado con lo probable.
- `docs/auditoriafinal/`: los seis informes de bloque, la verificación del auditor
  (`VERIFICACION.md`) y la medición externa (`EXTERNA.md`) con sus 22 ficheros de evidencia.
- El README enseña el producto: captura de la portada, el bloque de cómo correr las pruebas
  —que no estaba en ningún papel de la raíz— y el aviso del `npm install`.
- `robots.txt`, y en el manifiesto de datos el campo `ficherosQueNoSonRecursos`, que da sitio
  a los 22 `_cabeceras.txt` que el estándar no sabe declarar.

### Cambiado

- La frase con la que la interfaz **decide** se muda al contrato `@desplazame/tipos`: una
  definición en vez de una frase copiada. El paquete pasa a emitir un valor, y se dice por qué.
- Poda: 89 exports que nadie importaba y tres funciones muertas, fuera.
- Los avisos de error dejan de hablar de las tripas. Donde decía «No se pudo preguntar al
  motor. ¿Está arrancado?» ahora dice «No se ha podido buscar la calle en este momento.
  Prueba de nuevo en un rato.» Lo técnico va al log, que es su sitio.
- El botón del tema se llama «Tema oscuro» y no «Modo oscuro», para que su nombre accesible
  empiece por lo que se lee (WCAG 2.5.3). El estado sigue en `role="switch"`.
- Rótulos de la pestaña, `<main>` y `<footer>` en su sitio, el `<noscript>` deja de ser mudo,
  y las zonas táctiles suben a los 44 px de la casa o entran al censo con su razón.

### Arreglado

- **El huso**: producción decidía la hora en UTC —dos horas atrás todo el día, y de 00:00 a
  02:00 de Madrid servía el calendario del día anterior—. El motor pasa a resolver la fecha
  por el reloj de Zaragoza, lo imprime al arrancar, y **el log de producción lo confirmó el
  26/09**: «huso del proceso Europe/Madrid».
- `PORT=''` arrancaba en un puerto aleatorio **sin decirlo**: ahora vale 3000 y el arranque lo
  dice. Y cuando la renovación del feed se queda apagada, el arranque **nombra** la capacidad
  que falta en vez de callarse.
- Leer una lista que había fallado **lanzaba** y se llevaba por delante la detección de
  cambios de Angular; y en esas dos listas el teclado estaba muerto desde el primer día. Las
  tres lecturas de la app quedan con guarda.
- Los cinco hallazgos de los escáneres externos, **a cero**: la cabecera de `/creditos` y
  `/identidad` vuelve a ser `banner`, las cuatro columnas que se desplazan se alcanzan con el
  teclado y enseñan su foco, y el título vacío del acordeón se apaga en móvil.
- Los enlaces y las citas rotas de la documentación, arreglados a línea exacta.

[1.0.0]: https://github.com/ablanquez/desplazame/releases/tag/v1.0.0
