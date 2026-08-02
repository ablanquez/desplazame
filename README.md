# Desplázame

**Buscador de rutas urbanas multimodales en Zaragoza, con motor de cálculo propio.**

> ## ⚠️ Fase actual: reconocimiento de fuentes. **Todavía no hay código.**
>
> Lo que hay en este repositorio es el trabajo previo: cuatro informes de reconocimiento, una
> bitácora de fallos y la evidencia cruda que sostiene sus afirmaciones. **Ni una línea de
> aplicación.** Si has llegado buscando una app que funcione, todavía no existe.

---

## Qué va a ser

Un buscador de *"quiero ir de X a Y"* en Zaragoza, combinando **a pie, autobús, tranvía y BiZi**,
con un buscador configurable (qué transportes acepto, minimizar transbordos).

El cálculo de rutas será **código propio**: nada de OSRM, Valhalla ni GraphHopper. Ese es el
motivo del proyecto — el algoritmo es el trabajo, no el envoltorio.

**Fuera de la primera versión:** el tiempo real (posición de vehículos, llegadas en vivo,
disponibilidad de bicis).

## Por qué el reconocimiento va primero

Porque la pregunta que decide el proyecto entero —*¿existe una red de calles descargable con la
que construir un grafo?*— no tenía respuesta. Elegir el stack antes de saberlo es elegir la
herramienta y después recortar el proyecto para que quepa en ella.

Cuatro tandas de reconocimiento después, esto es lo que se sabe:

- **Sí hay red viaria vectorial descargable.** El GeoServer del Ayuntamiento publica 178 capas por
  WFS; `movilidad:MU1_jerarquia_viaria` trae 3.644 tramos con geometría, sentido de circulación,
  límite de velocidad y —lo decisivo— el **código de vía** que enlaza con los 46.150 portales del
  callejero municipal. Un cruce por identificador exacto, no por nombre y cercanía.
- **No hay topología.** Las líneas están dibujadas, no conectadas: de 160 tramos medidos en 11
  zonas, solo 21 pares de extremos coinciden. Pero **87 pares se cruzan geométricamente**, así que
  la información está en el dato — hay que *planarizarla*. Ese paso lo construye el proyecto, y es
  justamente la parte interesante.
- **No hay red peatonal municipal publicada.** Ni aceras como eje, ni pasos de peatones. Existen
  —están catalogados— pero son de acceso restringido a técnicos municipales. OpenStreetMap sí los
  tiene: en la misma zona del casco, 115 aceras, 43 pasos de peatones y 26 escaleras. Usarlo tiene
  un precio y se ha decidido pagarlo: la ODbL alcanza a las bases de datos derivadas, así que el
  grafo que salga de ahí nacerá bajo esa licencia, aunque el código siga siendo Apache 2.0.
- **El transporte está resuelto.** El GTFS del Punto de Acceso Nacional trae bus y tranvía, con
  paradas, horarios y el trazado real de cada línea.

Nada de esto se afirma de memoria: cada cifra de ahí arriba tiene detrás su comando y su respuesta
cruda, y lo que no se ha llegado a comprobar está declarado como tal, informe por informe.

Los cuatro informes, con sus comandos y sus números:

| Informe | Qué responde |
|---|---|
| [Reconocimiento del dataset heredado](docs/RECONOCIMIENTO-DATASET.md) | Qué había ya: 46.150 portales y ni una arista |
| [Reconocimiento de los datos de transporte](docs/RECONOCIMIENTO-003-TRANSPORTE.md) | El GTFS: qué trae y cuándo caduca |
| [Reconocimiento de las fuentes en red](docs/RECONOCIMIENTO-RED-ZARAGOZA.md) | Los servicios del Ayuntamiento: qué se puede descargar |
| [Inventario exhaustivo de fuentes](docs/INVENTARIO-FUENTES-ZARAGOZA.md) | Las 178 capas, clasificadas una a una |

## La bitácora nació antes que el código

[`docs/BITACORA.md`](docs/BITACORA.md) es el registro de los fallos reales del proyecto, escrito
**en caliente**, en el momento en que se descubren. Existe desde antes de que hubiera repositorio,
y a día de hoy todas sus entradas son de **datos y de instrumentos que mintieron**, porque
todavía no hay código que pueda fallar.

El campo importante de cada entrada es *"qué se probó y DIO VERDE mientras el fallo estaba
vivo"* — la prueba que pasaba mientras el problema ya existía. Es un dato perecedero: si se deja
para la retrospectiva, se pierde. Algunos ejemplos de lo que hay ahí dentro:

- Un dataset que declaraba `coveragePercent: 100` con el 29,6 % de los números de portal mal.
  Cinco contadores en verde midiendo si el servidor **respondió**, no si respondió **bien**.
- Una regla verificada «934 de 934» que miente en 50 casos, porque al cambiar de proyecto cambia
  el denominador.
- Un `.gitignore` cuyas reglas de claves privadas no protegían nada, porque el comentario al final
  de la línea formaba parte del patrón.

Junto a ella está [`DESPLAZAME-ESTADO.md`](DESPLAZAME-ESTADO.md), la memoria del proyecto: qué se
ha decidido y con qué motivo, qué miente cada fuente y qué sigue abierto — incluida una tabla de lo
que se creyó y resultó falso, que no se borra.

## Cómo comprobar lo que dicen los informes

En la carpeta `data/exploracion/` están las respuestas **crudas** de los servidores que
sostienen las afirmaciones más fuertes: el catálogo completo de capas, las 11 zonas de medición de
conectividad, el contraste con OpenStreetMap y la misma calle servida en dos sistemas de
coordenadas distintos.

No está toda la exploración —son evidencia de un momento, y un repositorio guarda todas las
versiones para siempre— pero sí lo necesario para reproducir los números sin fiarse de nadie.

## Si trabajas en este repositorio

Instala el guardián de la bitácora (los hooks de git no viajan en un clon):

```bash
git config core.hooksPath .githooks
```

Rechaza cualquier commit `fix:` que no traiga una entrada nueva en la bitácora, y te autogenera el
esqueleto para que rellenarlo sea fácil. Las reglas de trabajo están en [`CLAUDE.md`](CLAUDE.md).

## Licencia

El **código** de este proyecto está bajo [Apache 2.0](LICENSE).

La licencia de los **datos** se declarará cuando se integre alguno: hoy este repositorio no
contiene ningún dato integrado, solo respuestas crudas de servicios públicos citadas como
evidencia. Las fuentes previstas tienen condiciones distintas entre sí —la del Ayuntamiento de
Zaragoza exige atribución; la de OpenStreetMap es ODbL, con efecto sobre las bases de datos
derivadas— y eso se documentará cuando sea cierto, no antes.

## Aviso

Este proyecto **no es un producto oficial** del Ayuntamiento de Zaragoza, ni de Avanza Zaragoza,
ni de Tranvías de Zaragoza, ni de ninguna otra entidad. Es un trabajo personal que utiliza datos
publicados en abierto por esos organismos.

Origen de los datos consultados: Ayuntamiento de Zaragoza.
