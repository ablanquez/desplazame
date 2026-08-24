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
> portal se elige de la lista de los que esa calle tiene. El mapa es un mapa de verdad —Leaflet
> sobre OpenStreetMap— y encima dibuja **una sola cosa: la ruta**. La calcula el motor con su
> propio grafo en memoria, y lo que el navegador recibe es la línea ya hecha.
>
> **⭐ Y hasta el 22/08 dibujaba catorce capas más, que ya no están.** Eran los datos abiertos
> del Ayuntamiento y del GTFS pintados encima del mapa —los 46.150 portales, las 98.774 aristas
> del grafo, los carriles bici, los postes de bus, los trazados de línea, el BiZi, los
> aparcabicis y aparcamotos, el estacionamiento regulado, las zonas, las reservas PMR—, cada una
> con su casilla y todas apagadas de inicio. Y había una **segunda página**, el **visor de
> capas** en `/visor`, con ese mismo mapa a ventana casi completa.
>
> **Fue el instrumento de la fase de datos**, no producto: con él se verificó, uno a uno, cada
> conjunto que entró en el repositorio — que los 1.159 tramos de zona azul caían donde deben,
> que el tranvía no se perdía al cruzar por `PA…`, que las reservas PMR retiradas no se
> pintaban. Se **retiró de la app el 22/08** y **se reserva para la intranet, punto 14 del
> plan**, que es donde una herramienta de verificación tiene sentido. No está comentado: está
> borrado, y vive en la historia de git.
>
> Lo que la app gana con eso es lo que ya no baja: **de 41,07 MB en 20 peticiones al abrirla, a
> 0,22 MB en 3**. Los datos siguen en el repositorio con sus fichas y sus huellas —son materia
> de los puntos 9, 10 y 11, y de la propia intranet—; lo que dejó de hacerse es servírselos al
> navegador.
>
> Y ya hay **motor**: un servidor mínimo en Node que carga al arrancar el grafo de la ciudad,
> el callejero y los **46.150 portales enteros**, y levanta con ellos la **red por la que de
> verdad se puede andar** —**89.047** aristas de las 98.774, ya con su adyacencia—, que es la
> que rutea. Sirve lo que ves al rellenar el formulario
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
> cada paso con su flecha, su frase y sus metros. De Calle Alfonso I 10 a Paseo Independencia
> 3 —342 m, ~4 min— son estos cuatro:
>
> > ◉ **Sal de** **Calle Alfonso I 10** y dirígete hacia el suroeste por **Calle de Alfonso I** · 91 m
> > ↰ **Gira a la izquierda** hacia la acera · 150 m
> > ↗ **Gira ligeramente a la derecha** hacia **Plaza de España** · 96 m
> > ⚑ **Paseo Independencia 3** está a la izquierda
>
> **⭐ Y una calle puede torcer sin dejar de ser ella.** Cuando el giro no cambia de calle, el
> paso lo dice: «Gira a la derecha **para seguir por** Calle Monasterio de Nuestra Señora de los
> Ángeles», no «**hacia**» — que prometería una calle nueva y no la hay. Es la fórmula de
> Valhalla, *«Turn right to stay on X»*, y **solo se usa cuando hay nombre**: por una acera
> anónima no se «sigue», porque no había nada en lo que seguir. Lo disparan los giros de
> verdad — un giro suave por la misma calle no llega hasta aquí, porque el colapso ya lo ha
> fundido antes.
>
> **La negrita no es adorno: es el formato de Google.** Lo que hay que hacer y por dónde, en
> negrita; el pegamento de la frase, no. Y **el motor no manda HTML**: manda los trozos de la
> frase **con su papel** —acción, vía o texto— y la pantalla elige la etiqueta. El texto plano
> sigue viajando en la respuesta, y es exactamente la unión de esos trozos, para quien no pinte
> nada. Un tramo que se narra por su tipo —«la acera»— **no** va en negrita: destacarlo lo haría
> parecer un nombre de calle, y no lo es.
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
> son de OSRM, su `NAME_SEGMENT_CUTOFF_LENGTH`, leído de su fuente — y se absorbe **contra el
> paso anterior sin exigir que las dos calles vecinas sean la misma**, que es la regla ancha de
> OSRM. En una ruta de 6,4 km de punta a punta de la ciudad, los **87 tramos de red** que se
> pisan se leen en **13 pasos**. Lo que **no** desaparece es un giro de verdad: ni el propio del
> tramo corto ni el que resultaría de sumar dos suaves seguidos, que se mide aparte.
>
> ⚠️ **Lo que la regla ancha sí se lleva: los nombres cortos que sirven para orientarse.** Un
> tramo de plaza de sesenta o setenta metros entre dos calles —los dos casos medidos fueron
> «Plaza de España · 66 m» y «Plaza Basilio Paraíso · 62 m»— suma sus metros al paso anterior,
> pero su nombre no se dice. Es el precio declarado de seguir a OSRM, y esas plazas siguen
> viéndose en el mapa.
>
> **Y una tercera pasada, la de Valhalla: dos cosas que no son maniobras.** Hasta aquí todo venía
> de OSRM; esto viene de **odin**, que es como Valhalla llama a su fase de narración, y de su
> función `Combine()`. Son dos reglas y las dos quitan pasos que no dicen nada:
>
> - **Dos genéricos seguidos y rectos son uno.** Una ruta larga por las afueras decía «Continúa
>   hacia el camino · 6.230 m» y justo después «Continúa hacia el camino · 1.260 m». Es el mismo
>   camino contado dos veces porque OpenStreetMap lo parte, y ahora se lee **un solo paso de
>   7.500 m**. ⚠️ Con una condición que no es un detalle: **tienen que decir lo mismo**. «La
>   calzada» seguida de «el vial de servicio» no se funden, porque cuando un paso se llama por su
>   tipo el tipo es toda la información que lleva, y juntarlos escribiría una vía que no existe.
> - **Un «Continúa» que no se puede desobedecer se calla, y le deja su nombre al paso que se lo
>   come.** Si vienes por un tramo sin nombre y desde el cruce no hay más que seguir —o ninguna
>   otra rama se llama igual—, «Continúa hacia el camino · 107 m» y «Continúa hacia Calle Cristo
>   Rey · 54 m» pasan a ser **«Continúa hacia Calle Cristo Rey · 160 m»**. No se pierde nada: lo
>   que desaparece es el hueco y lo que queda es el nombre.
>
> **Lo que estas dos reglas NO hacen, y es la mitad del trabajo.** Valhalla también absorbe el
> «Continúa» cuando el paso que se lo come **ya tenía nombre**, y eso aquí no entra. Medido sobre
> 387 rutas antes de decidirlo: **desaparecerían 1.099 nombres de calle**, 237 de ellos en tramos
> de más de 600 m, con casos como **«Avenida de Cataluña · 2.971 m» absorbida dentro de «Paseo de
> la Ribera»**. La razón está en el dato: **de los 1.511 «Continúa» que quedan, ninguno repite la
> calle del paso anterior** —esos ya los junta la regla de arriba—, así que aquí un «Continúa» es
> siempre una calle que **cambia de nombre**, y callarlo sería callar la única seña de tres
> kilómetros. Queda fuera con sus números escritos, no en silencio.
>
> **Lo que las tres pasadas juntas hacen, medido:** sobre 387 rutas reales, **9.348 pasos pasan a
> 9.232** —80 rutas se acortan y **ninguna se alarga**— y los pasos que dicen un genérico bajan de
> **1.420 a 1.308**. Y lo que no se mueve ni un byte: **la geometría y los metros de las 387 son
> idénticos**, comprobados con la misma huella `sha256`. Narrar es escribir lo que ya está
> calculado; el día que una regla de narración mueva un metro, será que está tocando la ruta.
>
> **Y el tiempo va dicho como lo que es**: «~4 min **a 5 km/h**». Es una división —los metros
> entre la velocidad a pie de manual—, no un cronómetro: no entran cuestas, ni semáforos, ni el
> rato que se tarda en cruzar. Un «4 min» a secas prometería algo que aquí no se ha medido.
>
> Para escribirlos hizo falta el otro medio dato: las aristas del grafo llevan el id de calle de
> OpenStreetMap pero **ningún nombre**. Las **19.897 calles con nombre** viven en `motor/data/`,
> promovidas de la rama archivada sin descargar nada. Cubren el **40,8 %** de las 98.774 aristas
> del grafo, que es
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
> gana el más votado. En **unos 200 ms**, **18.779 de 28.554** tramos mudos cogen nombre, y las
> aristas con nombre pasan del **39,4 % al 76,3 %**.
>
> **Con dos puertas, porque lo dudoso no se acepta solo.** Si el ganador no cubre la mitad del
> tramo, no hereda; y si una segunda calle **con otro nombre** se lleva el 80 % de sus votos,
> tampoco — ahí el tramo va entre dos calles y no se sabe de cuál es, así que se sigue diciendo
> el genérico, que dice poco pero es cierto. Y los **pasos de peatones y las escaleras** no
> heredan nunca: una cebra **cruza** la calle, no pertenece a ella, y decir «continúa por Avenida
> de Navarra» mientras se cruza Navarra le quita a quien anda justo el aviso que necesita.
>
> Así, una ruta de punta a punta deja de decir «hacia el carril bici · 1.270 m» y dice lo que se
> anda de verdad, avenida por avenida. Aquella frase, además, ya no puede salir por un segundo
> motivo, que es el párrafo siguiente: **al peatón no se le deja entrar en un carril bici**.
>
> **⭐ Y al peatón no se le mete por el carril bici.** El motor busca el camino más corto, y eso
> lo metía por el carril siempre que fuera recto: en una ruta medida, **el 87,3 % de sus
> metros**. El carril bici **no es sitio para un peatón**, y en eso coinciden las tres fuentes:
> `graph.lua` de Valhalla le pone `pedestrian_forward = false`, `foot.lua` de OSRM ni le da
> velocidad, y la Ordenanza de Circulación de Zaragoza (art. 25) no lo cuenta como zona
> peatonal. Así que **se cierra al construir la red**: 4.456 aristas fuera, la única prohibición
> de una tabla que declara los 27 tipos de vía uno a uno. Las rutas de arriba no pisan **ni un
> metro** de carril.
>
> ⚠️ **Y se cobra un precio que se enseña.** Cerrarlo parte el grafo en 21 trozos y deja **20
> portales sin ruta** —el 0,044 % de los 45.569 que resuelven—, repartidos en seis parcelas
> donde el único enlace con el resto de la ciudad estaba dibujado como carril bici. Es un hueco
> de OpenStreetMap, no una regla nuestra, y **no se les abre una excepción**: ninguna de las
> fuentes leídas contiene la regla «reabrir la vía prohibida si es el único enlace», e
> inventarla sería peor que el aviso honesto que ya reciben.
>
> **La calzada, en cambio, no se cierra.** El reglamento dice que el peatón va por la zona
> peatonal *«salvo cuando ésta no exista o no sea practicable»* (art. 121.1), y ese **salvo** es
> un condicional: cerrar la calzada dejaría gente encerrada el día que le falte un metro de acera
> dibujada. Se queda abierta, y la acera se anda porque está y porque es el camino corto — hoy,
> el **37,4 % de los metros** de 310 rutas medidas.
>
> ⚠️ **Aquí vivió un día una capa más, y se retiró.** Del 21 al 22/08 el motor ponderó cada tipo
> de vía con las prioridades de OSMAnd —acera ×1,2, calzada ×0,9— para empujar al peatón a la
> acera. Subía la vía peatonal al 79,4 %, pero en las rutas vivas **cobraba hasta +502 m y seis
> minutos** por rodear un corredor por cuya avenida también se anda, por su acera. **Fuera.**
> Entre lo permitido, el camino es el más corto en metros, que es el defecto documentado de los
> dos motores de referencia: Valhalla lleva su `walkway_factor` a **1,0, «neutral»**, y
> `foot.lua` de OSRM no pondera por tipo. No queda tabla apagada ni bandera: la capa se fue
> entera.
>
> **⭐ Y se escribe como se lee, no como se registra.** El callejero municipal publica en
> mayúscula administrativa —`AVENIDA SAN JUAN DE LA PEÑA`— y OpenStreetMap en caso mixto;
> mezclados en la misma lista, la ruta parecía escrita por dos personas. La última línea del
> motor los recompone: **palabras significativas con mayúscula inicial y partículas en
> minúscula** —artículos, preposiciones y conjunciones, el criterio de las directrices
> toponímicas del IGN—, **números romanos en mayúsculas** —«Calle Alfonso I», que es lo que manda
> la RAE— y **ni una abreviatura nueva**:
> lo que el censo escribe `NTRA. SRA.` se dice `Ntra. Sra.`, porque abreviar —y desabreviar— es
> decisión de quien escribe el callejero, no nuestra. **El dato no se toca**: esto ocurre al
> escribir el paso y en ningún sitio más, y las comprobaciones internas siguen operando sobre el
> nombre crudo.
>
> **⭐ Y el artículo sube cuando forma parte del nombre.** El IGN declara la excepción con sus
> ejemplos —**El** Escorial, **La** Laguna— pero no dice cómo reconocerla, y del censo municipal
> no sale: publica todo en mayúscula, así que `CALLE EL COLOSO` y `CALLE LA FUENTE` se ven
> iguales. **La señal la pone OpenStreetMap**, que escribe en caso mixto y decide calle por
> calle: «Calle de **El** Coloso» —el cuadro de Goya— frente a «Calle de **la** Fuente». El motor
> cruza los dos ficheros por el núcleo del nombre al arrancar: **252 núcleos** llevan artículo
> alto en OSM, y le afectan a **142 nombres municipales**; los otros **327** con artículo
> intermedio van con la regla general.
>
> ⚠️ **Y trae la errata de OSM dentro, que es el precio de fiarse de él.** Entre esos 142 hay
> media docena donde el alto es discutible —«Calle de Alfonso X **El** Sabio», «Pedro II **El**
> Católico», «Martín **El** Humano»—, que la RAE escribiría con minúscula por ser apodos. No se
> corrigen a mano: enmendar a OpenStreetMap uno a uno es empezar otra lista.
>
> ⚠️ **Y tres cosas más que se dicen en vez de esconderse.** `BAJO` y `AL` se quedan **fuera** de
> la lista de partículas porque en el censo salen mal 2 de cada 3 veces —`CALLE BARRIO BAJO` lo
> usa de adjetivo y `JARDINES AL ÁNDALUS` lleva el artículo árabe pegado al nombre—, y el precio
> es que `CALLE CANTANDO BAJO LA LLUVIA` sale con mayúscula donde el IGN pediría minúscula. De
> **siglas no hay regla**: la doctrina no dice cómo distinguir una sigla de una palabra, así que
> no se inventa. Y de los 3.358 nombres del censo, **uno** queda peor que como venía: la sigla de
> `GRUPO ALFÉREZ ROJAS (GP-F II)` se recompone a `(Gp-F II)`.
>
> **⭐ Y una calle se dice de UNA sola manera en toda la lista.** Los dos nombres vienen de dos
> registros que escriben distinto —OpenStreetMap pone «Avenida de San José» y el municipal
> «AVENIDA SAN JOSÉ»—, así que la misma avenida salía dos veces seguidas con dos ortografías: en
> el **54,8 %** de las rutas, medido. Se comparan por su **núcleo** —fuera la palabra de
> tipo, fuera las partículas, fuera tildes y mayúsculas—, que es lo que hace OSRM al decidir si
> un nombre ha cambiado de verdad; y cuando dos formas de la misma calle coinciden en una ruta,
> **manda la municipal**, que es la que el usuario leyó en el formulario. Queda en el **2,5 %**,
> y lo que queda ya no es un cambio de registro: es OpenStreetMap escribiéndose distinto a sí
> mismo —«Calle de Martín Ruizanglada» y «Calle de Martín Ruiz Anglada»—.
>
> ⚠️ **Y hay dos precios, que se dicen en vez de esconderse.** El primero: quitar la palabra de
> tipo hace que `RONDA HISPANIDAD` y `VÍA HISPANIDAD` —dos vías municipales distintas— den el
> mismo núcleo. Medido sobre 20.233 pares de tramos contiguos, pasa en **42**, y mirados uno a
> uno la mayoría son **la misma calle** que cada registro escribe con un tipo distinto (`Calle de
> Pablo Ruiz Picasso` / `AVENIDA PABLO RUIZ PICASSO`), que es justo lo que se busca. El segundo:
> las nueve vías cuyo nombre **es** una palabra de tipo —`CALLE PARQUE`, `CAMINO RONDA`— se
> quedan sin núcleo, y sin núcleo no casan con nada. Es a propósito: antes que adivinar, no unir.
>
> **Y hay direcciones a las que el motor contesta que no puede, en vez de inventarse un camino.**
> Son **581 portales** de catorce vías —460 de ellos en URBANIZACIÓN PEÑA ZORONGO— cuyas calles
> existen y son andables, pero forman **islas** del grafo: desde el resto de Zaragoza no se llega
> andando. Y desde que el carril bici está cerrado al peatón, **20 más** en otras siete, por el
> mismo motivo con otra causa: su único enlace estaba dibujado como carril. Ahí la pantalla
> enseña el aviso del motor en ámbar, con el nombre de la calle, y el mapa se queda limpio. Ni
> una línea inventada para tapar el hueco.
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
| **<http://localhost:4200/panel>** | el panel de frescura de los datos (ver abajo) |

> Son **dos páginas y no hay barra que las una**: al panel se llega escribiendo su dirección.
> Cualquier otra —incluida `/visor`, que fue una página hasta el 22/08— cae en el buscador por
> el comodín del router: ni pantalla en blanco ni 404.

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
| `POST /api/ruta` | la ruta **andando** entre dos portales, por códigos: geometría, pasos escritos, metros y duración derivada. **Es la que llama «Generar ruta»**. Medido sobre 200 peticiones HTTP a portales al azar de toda la ciudad: **p50 22 ms, p95 35**. El Dijkstra son ~10 de esos milisegundos; el resto es escribir los pasos y serializar —**22,9 pasos y 13,5 kB** de media, que eran **23,3 pasos** en las mismas 200 peticiones antes de los combines de odin—. Sin ruta, un aviso que dice por qué |

En desarrollo el `4200` las reenvía al `3000` con un proxy, así que la interfaz siempre pide a
`/api/…` y no sabe en qué puerto vive el motor.

---

## Ir a un sitio, y no solo a un portal

Los dos campos —origen y destino— admiten **calles o sitios**. Un sitio es un destino con
nombre: hoy, **las 313 farmacias** del término municipal. Se escriben en la misma casilla y se
buscan a la vez, pero salen marcados como lo que son, porque una calle y un local no son la
misma clase de cosa aunque se escriban igual.

> Escribiendo `navarra` en el destino salen las dos capas:
>
> ```
>   CALLE NAVARRA                          31       ← calle
>   Farmacia · C/ Doña Blanca de Navarra, 46-48     ← sitio
>   Farmacia · Avda. de Navarra, 65                 ← sitio
> ```

**Al elegir un sitio, la casilla de portal de ese lado se apaga.** No es un adorno: un sitio
trae su propia coordenada, así que no hay portal que pedirle — y dejar la casilla encendida
sería ofrecer un campo que nadie puede rellenar. Es la **regla del portal condicional**, y
funciona en los dos lados, así que el **⇅** los intercambia sin dejar botones muertos.

**De dónde sale el dato.** De la [API de equipamientos del Ayuntamiento de
Zaragoza](https://www.zaragoza.es/sede/servicio/equipamiento/category/740.json), categoría 740.
Su ficha entera —licencia, fecha, huella, recuentos— está en
[§ 1.16 del THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES.md), y su frescura es la **fila 22** del
manifiesto: descargado el 23/08/2026, y el dato dice ser del **08/06/2026** — lo declara la
cabecera `Last-Modified`, que coincide al segundo con la fecha de modificación más reciente de
sus registros. En el panel sale **gris**: la fuente no publica cada cuánto lo refresca, y una
caducidad sin fuente no se inventa.

### ⭐ Tres reglas que se ven poco y deciden mucho

**Sin coordenada no existe.** De los 386 equipamientos de las tres categorías, **5 no traen
punto**. No se sugieren, no se pueden elegir y no aparecen en ninguna pantalla. Un destino que no
se puede situar no se puede enrutar, y ofrecerlo sería prometer una ruta que va a acabar en un
aviso — es lo que hace un geocodificador de verdad: sin punto no hay nada que indexar. **Pero no
se borran ni se editan**: siguen en el fichero, se cuentan en su ficha, y el motor los declara al
arrancar.

**⭐ Y tener punto no basta: el punto tiene que valer.** El dato municipal trae coordenadas rotas
demostradas —un centro de salud en **Portugal**, a 610 km, y cuatro farmacias corridas todas por
el mismo vector—, y la regla de arriba no las caza porque coordenada tienen. Así que al cargar hay
un segundo portero, con dos comprobaciones que son las de la doctrina de calidad de
geocodificación: **frontera** —¿cae dentro del rectángulo que ocupan los 46.150 portales del
censo, con 250 m de margen?— y **distancia** —¿está a menos de **50 m** de la puerta que su propia
dirección declara?—.

Lo que falla se **vuelve a situar por el callejero municipal**, que es el gacetero de la casa: si
el registro dice «C/ La Caza, 11» y el censo sabe dónde está el 11 de La Caza, esa es mejor
coordenada que la publicada. Son **9 de 386**. Y lo que falla y **no** se puede resituar —porque su
dirección es «s/n» o no resuelve— se trata como si no tuviera punto: fuera del índice, y a una
lista de confirmación manual. Hoy es uno: el de Portugal.

**Los hospitales quedan fuera del cheque de distancia**, y a propósito: un hospital no es una
puerta, es un recinto con varias. El Miguel Servet está a 169 m del portal de su dirección y eso
no es un error, es otra de sus entradas.

**El fichero municipal no se toca.** Todo esto pasa en memoria al arrancar, y el motor lo dice
entero — con qué se movió, desde dónde y cuántos metros:

```
motor: sitios en memoria — 386 en total · 380 en el indice · 11 ms
motor:   Farmacia         313 · 310 en el indice · 3 sin coordenada · 7 rescatados · 0 invalidas
motor:   Centro de salud   56 ·  55 en el indice · 0 sin coordenada · 2 rescatados · 1 invalidas
motor:   Hospital          17 ·  15 en el indice · 2 sin coordenada · 0 rescatados · 0 invalidas
motor: 5 sin coordenada en total, fuera del indice (sin coordenada no existe: …)
motor: 9 rescatados por callejero (coordenada a mas de 50 m de la puerta que su propia direccion declara)
motor:   CentrosSalud.9080     497 m distancia Centro de Salud Almozara · C/ Batalla de Alman → CALLE BATALLA DE ALMANSA 17
motor:   Farmacias.20445       236 m distancia Farmacia · C/ Joaquín Rodrigo, 17, portal 1    → CALLE JOAQUÍN RODRIGO 17
…
motor: 1 con coordenada INVALIDA y sin direccion que case: fuera del indice, a confirmacion manual
motor:   CentrosSalud.9090    frontera  lon -8.184875 lat 41.542373  Centro de Salud Fernando El Católico · C/ Domingo Miral, s/n
```

Lo que se gana se ve andando: la farmacia de Joaquín Rodrigo 17 estaba a **401 m de calles** de su
propio portal, así que ir de su puerta a su puerta devolvía una ruta de cuatrocientos metros. Ahora
devuelve cero.

**Y el nombre de quien la regenta no sale de aquí.** El dato municipal trae el nombre de la
persona titular en **274 de los 313** títulos. Es dato registral publicado como abierto y
reutilizarlo es lícito, pero republicarlo no hace falta para nada de lo que esta pantalla hace.
Así que la pantalla dice **«Farmacia» y la dirección**, y el título con el nombre **no sale a
ninguna parte**: ni a la sugerencia, ni al paso de la ruta, ni al registro del motor, ni a una
prueba. El fichero se queda íntegro — el dato entra como vino, y quien lo presenta decide qué se
lee.

Una ruta a un sitio se lee igual que cualquier otra, con el sitio nombrado en su extremo:

> > ⬆ **Sal de** **Farmacia · Avda. de Navarra, 65** y dirígete hacia el este por
> > **Avenida de Navarra** · 66 m
> > …
> > ⚑ **Calle El Coloso 2** está a la derecha

## El panel de frescura, y el manifiesto que lo sostiene

Un dato descargado empieza a caducar el mismo día. Nada en un repositorio avisa de eso solo, así
que el proyecto lo escribe: **`datapackage.json`, en la raíz**, dice de cada conjunto cuándo se
descargó, qué fecha declara **el dato de sí mismo**, con qué regla caduca y **de dónde sale esa
regla**, más su huella `sha256`.

**El formato no se inventó, se adoptó.** Es el descriptor **Data Package v1** de
[Frictionless Data](https://specs.frictionlessdata.io/data-package/) —un JSON en la raíz del
paquete, con `resources[]` y sus `path`, `hash`, `bytes`, `licenses` y `sources`— y de
[**DCAT**](https://www.w3.org/TR/vocab-dcat-3/) toma los términos de frescura: `accrualPeriodicity`
con su vocabulario controlado y `modified`. **Valida contra el JSON Schema oficial**, sin errores.
Solo hay propiedades nuestras donde el estándar calla, y van en castellano para que se note:
`descargadoEl`, `modifiedFuente`, `periodicidadFuente`, `caducaEl`, `caducidadFuente`.

**<http://localhost:4200/panel>** lo pinta con un semáforo, y la regla del semáforo es lo que
tiene de particular:

| | cuándo | ejemplo de hoy |
|---|---|---|
| 🔴 | el conjunto declara una fecha de caducidad y ya pasó | — |
| 🟡 | se refresca cada X en origen y nuestra copia es más vieja | — |
| 🟢 | hay regla con fuente y se cumple | el GTFS: «vale hasta el 2026-10-05» |
| ⚪ | **NO CONSTA** | 17 de los 21 conjuntos |

⭐ **El gris no es un fallo del panel: es la verdad, y la lista de deberes.** Un color solo se
pinta si detrás hay una regla **publicada por alguien** — el `feed_end_date` del GTFS lo dice su
publicador, el refresco mensual del callejero lo dice el Ayuntamiento—. Inventar un umbral
«razonable» para que la tabla se vea bonita sería cambiar información por decoración, así que
donde no hay fuente sale gris y **se dice por qué**.

Un caso enseña bien la diferencia: **el callejero tiene regla y aun así sale gris**. Se sabe que
en origen se refresca cada mes, pero no consta cuándo se descargó esta copia —no fue una
descarga: llegó copiada del archivo del proyecto anterior—, así que no hay contra qué medirla. El
panel no adivina: lo dice.

**La portada no se entera de nada de esto.** Abrir la raíz sigue sin pedir un solo byte de datos
—ni el manifiesto, que son 21 KB—: el panel se carga aparte (`loadComponent`) y pide su
manifiesto solo cuando alguien entra en él. Medido sobre el `dist`: la raíz en frío son **6
peticiones y 459 kB**, y **cero** de datos o de manifiesto. Hay dos guardianes que lo vigilan, y
uno cuenta el total de peticiones, no un patrón — para que la próxima cosa que quiera colgarse de
la portada tampoco pueda hacerlo en silencio.

Y el manifiesto **no puede pudrirse en silencio**: una prueba recalcula el `sha256` de los 21
ficheros en cada ejecución y los compara con lo declarado. Si un dato cambiara sin que nadie
tocara el manifiesto, se pondría roja.

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
