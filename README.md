<div align="center">

# Desplázame

**Cómo ir de un portal a otro en Zaragoza: andando, en autobús o tranvía, en bici o patinete, o en coche.**

[![Licencia](https://img.shields.io/badge/licencia-Apache%202.0-64748B)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet%20%2B%20OpenStreetMap-199900)](https://leafletjs.com/)
[![Estado](https://img.shields.io/badge/estado-en%20construcci%C3%B3n-B45309)](#estado-cinco-modos-de-punta-a-punta)

</div>

---

## Estado: cinco modos de punta a punta

> ⚠️ **Este repositorio está en construcción: arranca en local y no está publicado todavía en
> ninguna dirección.** Lo que ya funciona de punta a punta son **cinco modos**: andando, **bus y
> tranvía**, bici privada, patín (VMP) y BiZi. Se escribe de dónde a dónde, se elige el modo, se
> pulsa «Generar ruta», y la pantalla dibuja la ruta de verdad en el mapa y lista las indicaciones
> paso a paso.
>
> ⭐ **Y EL COCHE ESTÁ ENTERO DESDE EL 3/09** — motor y pantalla. Rutea con las restricciones de
> giro de OpenStreetMap respetadas, remata en un aparcamiento de bordillo o en uno **público** si el
> destino cae dentro de la Zona de Bajas Emisiones y el vehículo no puede entrar, y **se ve en
> Chrome**: elegir «Coche» revela dos preguntas —dónde aparcar y qué distintivo ambiental— y el
> viaje se pinta con su hito de aparcar, su tramo a pie y el aviso de la zona junto al paso por el
> que se entra. **Ya no queda ningún modo cortado en la pantalla.** Aquí se sigue distinguiendo
> **lo que el motor calcula** de **lo que se ve en Chrome**, porque no son lo mismo y confundirlos
> es como este README ha envejecido tres veces.
>
> **⭐ Y desde el 31/08 el bus y el tranvía están enteros.** No es «una ruta más»: es la primera
> vez que el motor tiene que decidir **en qué te subes**, y eso trae media docena de piezas nuevas.
>
> **La red sale del GTFS y se cocina una vez.** Las **984 paradas** del feed —934 de bus y 50 de
> tranvía— se agrupan en **170 patrones**, que es la secuencia ordenada de paradas que cada línea
> recorre de verdad, con sus viajes y sus horas por servicio. El cocinado se guarda al lado del
> zip, así que el motor arranca leyéndolo en **196 ms** en vez de volver a masticar 34.427 viajes.
> Y los **89 trazados** del feed ya no solo se pintan: cada parada se proyecta sobre el suyo y se
> guarda **la traza de cada salto** —**3.362 saltos, 48.307 puntos**—, de modo que el bus va por el
> asfalto y no en línea recta de poste a poste.
>
> **La búsqueda es por rondas —RAPTOR—, y los pesos son de OpenTripPlanner.** Una ronda por
> vehículo: se sale andando a los postes que quedan cerca, se recorre lo que se alcanza sin
> transbordar, y así **tres rondas**. Lo que decide entre dos rutas no es la distancia: es el
> coste, y ahí están los tres números que OTP publica —**`walkReluctance` 4**, que hace que andar
> pese cuatro veces lo que ir sentado; **`boardCost` 600**, los diez minutos de fricción que cuesta
> subirse a algo; y **`transferSlack` 120**, los dos minutos de bajarse, orientarse y esperar a
> que el de enfrente abra la puerta—. Con ellos, un transbordo tiene que **ganarse** su sitio.
>
> **Y la ruta que se dice es la de HOY, no la del horario.** El feed dice por dónde pasa cada
> línea; la web de Avanza dice por dónde pasa **hoy** (§ 1.25 del notices). Restando una contra
> otra salen las paradas **fuera de servicio** y las **provisionales**, y con eso el motor no te
> manda a subir donde el autobús hoy no para. La ruta desviada se **reconstruye entera**: las
> paradas provisionales entran con su coordenada real —pedida a Avanza, porque el GTFS no las
> conoce— y **los saltos nuevos se trazan por el viario**, respetando los sentidos únicos. Medido
> al arrancar y cada media hora: `64 sentidos · 23 detectados · 23 aplicados · 0 sin saber · 17 s`.
>
> ⚠️ **Y esa reconstrucción va declarada por lo que es**: la red que se usa para rehacer el trozo
> desviado incluye carriles y sendas por los que un autobús no cabe, así que el trazado nuevo es
> *por dónde se puede ir respetando los sentidos*, no *por dónde va el autobús*. **Los saltos que
> el feed sí trae conservan su traza intacta**, que es el asfalto de verdad. Y los segundos de un
> salto nuevo salen de la **velocidad comercial del propio patrón** —sus metros entre sus
> segundos—, no de una velocidad de manual.
>
> ⚠️ **Y lo que esto NO detecta va escrito**: un autobús que **pasa pero no para** deja la ruta
> operativa igual, así que **ninguna fuente lo dice**. Se detectan desvíos, no supresiones.
>
> **⭐ Y el minuto de verdad, para el primer autobús.** Al generar, el motor le pregunta a Avanza
> por **el primer poste de subida** cuántos minutos falta, y ese número **sustituye** a la espera
> estimada del horario — lo real desplaza a lo programado, que es el principio de GTFS-Realtime.
> Solo el primero: «próximo en 3 min» en un poste al que se llega dentro de cuarenta minutos es un
> número cierto sobre un autobús que no se va a coger.
>
> > 🚌 **Sube** a la línea **35** en el poste **33 · Av. Academia General Militar N.º 37** — 17
> > paradas — **próximo en 2 min** (dato de las 16:56)
> > ⇄ En el poste **147 · Av. Francisco De Goya N.º 83**, **transborda** de la línea **35** a la
> > **31** — 10 paradas — frecuencia teórica de la 31: cada 11 min
> > 🚏 **Baja** en el poste **860 · Villa De Ansó / Avenida De América**
>
> **⭐ Y de los demás postes se pregunta A PETICIÓN**, con un botón **«Próximo bus»** al lado de
> cada subida y cada transbordo. Cada pulsación vuelve a preguntar de verdad —nada se guarda—, y
> el resultado aparece en una región `role="status"` que **ya estaba en el DOM antes** de tener
> nada dentro, que es lo único que hace que un lector de pantalla lo anuncie [WCAG 4.1.3]. El
> botón **no se deshabilita mientras carga**: eso lo sacaría del orden de tabulación justo al
> pulsarlo. **En el tranvía no hay botón**, porque no hay a quién preguntar.
>
> **Y la pantalla dice la línea como se lee en la calle**: el chip con **su color**, el **número de
> poste** junto al nombre —`PA00033` es el **33** de la marquesina—, cuántas paradas se va dentro,
> y un **ribete** bajo cada tramo montado para que ninguna línea se pierda contra el mapa
> [WCAG 1.4.11: 3:1 contra los colores **adyacentes**]. El aviso de desvío va **en dos niveles**
> —el hecho siempre visible y el detalle detrás de un botón, la revelación progresiva del GOV.UK—
> y aparece **dos veces con el mismo texto**: arriba en la cabecera y al lado del hito al que
> afecta.
>
> **⭐ Y desde el 29/08 el motor calcula también las tres rutas de la rueda** —bici propia,
> patín (VMP) y BiZi—, cada una por su tabla de acceso legal, respetando el sentido único de la
> calzada, con techo en el límite de velocidad de la vía y **prefiriendo el carril bici**. Es
> motor: donde no hay señal rige el **límite genérico del art. 50 RGC** —20 en plataforma única,
> 30 con un carril por sentido, 50 con dos o más—, que es lo que abre la calle de barrio al
> patín.
>
> **⭐ Y desde el 30/08 la rueda puede BAJARSE**: quien empuja su vehículo es peatón [RGC art.
> 121.2], así que las aceras y las zonas peatonales entran en la red **en modo empuje, a
> 5 km/h** —33.770 aristas y 1.016,4 km—. No hay umbral de «hasta cuántos metros»: el empuje
> **compite en tiempo** dentro del mismo Dijkstra, 5 km/h contra 18, y el rodeo largo pierde
> igual que pierde el atajo por la acera. El tramo empujado es **un paso propio** y se dice
> —«con el patín en la mano»—, y ninguna fusión de pasos lo cruza. Lo que abre es grande: el
> caso que lo pidió, `COLOSO 2 → LEOPOLDO ROMEO 27` en patín, pasa de **5.741 m a 4.832** de
> rodadura con 33 m en la mano; y en 200 peticiones al azar el patín pasa de resolver 51 a **83**.
>
> **⭐ Y desde el 30/08 la bici elige QUÉ CLASE de ruta quiere**: Rápida, Equilibrada o
> Tranquila. El trío es el de CycleStreets —«minimizar tiempo · evitar tráfico · el compromiso
> entre ambos»—, que además recomienda el equilibrado como defecto de la interfaz; y el
> mecanismo del dial es el `use_roads` de Valhalla, cuyo defecto documentado es justo el punto
> medio. **Rápida** no penaliza nada, **Equilibrada** es el calibrado firmado el 29/08 y
> **Tranquila** es esa misma tabla al cuadrado: `primary` ×4, `secondary` ×2,37, `tertiary`
> ×1,56 y el carril bici sin tocar. Lo que compra se ve en `Portales.99126 → Portales.126086`:
> la Rápida va **2.986 m por la avenida sin pisar un metro de carril bici**, y por un 2 % más
> de recorrido la Equilibrada compra **1.304 m de carril** y la Tranquila **1.339**.
>
> **El patín no elige, y no es un olvido**: su vía ciclista es obligatoria y la calzada solo
> subsidiaria, así que lleva siempre el calibrado fuerte y el campo ni se le enseña — con él
> hace la Avenida de Madrid en 1.972 m con **601 m de carril bici y CERO metros de vía con
> tráfico**, contra los 1.577 y 381 que daba compartiendo calibrado con la bici.
>
> Y **al Generar en bici se piden las tres a la vez**: cambiar de opción después repinta al
> instante, sin volver a preguntarle al motor. Es el planificador de CycleStreets —los tres
> tipos del mismo viaje— y sale barato porque cada Dijkstra son ~20 ms.
>
> **⭐ Y desde el 30/08 una ruta de bici no acaba pedaleando en el portal: acaba APARCANDO.**
> Se rueda hasta el aparcabicis municipal más cercano al destino, se dice dónde se deja el
> vehículo y cuántos anclajes tiene, y el resto se anda. Es el `BICYCLE_PARK` de OpenTripPlanner
> —*«deja la bicicleta y anda hasta el destino»*— sobre los **1.914 soportes** de § 1.9 que de
> verdad entran: `Abierto` (1.906) y `Vigilado` (8), **12.117 anclajes**. Los 238 `Cerrado` se
> quedan fuera porque **la capa no publica qué significa esa palabra** —¿clausurado, o un módulo
> con cerramiento?— y mandar a alguien a un sitio que a lo mejor está cerrado es peor que
> mandarlo doscientos metros más allá. El hito dice **«5 anclajes»** y no «5 huecos libres», y
> esa palabra es toda la diferencia: § 1.9 publica capacidad, no disponibilidad.
>
> ⚠️ **Y hay un tope de 500 m andando desde el soporte, que sale de un absurdo cazado midiendo.**
> Contra los 46.150 portales, el aparcabicis entrante más cercano queda a **p50 84 m** —el 58,2 %
> lo tiene a menos de 100— pero la cola es larguísima: **p99 5.656 m y máximo 11.641**, porque en
> los barrios rurales § 1.9 no llega. Sin tope, una ruta a `CALLE SAN MARCOS [TORRECILLA DE
> VALMADRID] 2` habría dicho «pedalea hasta el aparcabicis y **anda 11,6 km** hasta tu casa».
> Con tope, la ruta llega a la puerta como antes y **un aviso dice a cuántos metros estaba el más
> cercano** — el número, no una excusa. El **86,3 %** de los portales se queda con remate.
>
> **⭐ Y desde el 30/08 el BiZi deja de rutear como una bici y rutea como lo que es: TRES
> tramos.** Se anda hasta una estación **que tenga bicis**, se pedalea hasta otra **que tenga
> anclajes libres**, y se anda el resto — el modo de alquiler de OpenTripPlanner, literal. Las
> estaciones se filtran por disponibilidad **en el momento de planificar**, así que una llena no
> sirve para devolver y una vacía no sirve para coger. Y los dos hitos llevan el dato vivo con
> **la hora de ESA estación**:
>
> > 🚲 **Coge** una bici en la estación **Tauromaquia** — 11 bicis disponibles a las 12:57
> > 🅿 **Deja** la bici en la estación **Mrio. Siresa: Dr. Iranzo** — 16 anclajes libres a las 12:57
>
> La disponibilidad **se pregunta en cada ruta de BiZi y no se guarda**: es el feed dinámico de
> GBFS, y reutilizar la respuesta anterior sería contestar con un número que ya no es cierto. La
> sirve la API de la sede de zaragoza.es (§ 1.23 del notices), **sin clave**, y es **la primera
> fuente del proyecto que no se copia: se consulta**.
>
> ⚠️ **Si la API calla, la ruta sale igual y no se inventa nada**: se rutea con el inventario, un
> aviso dice que **la disponibilidad no está verificada**, y los hitos salen **sin número y sin
> hora**. Y si el pedaleo pasa de 30 minutos se dice que **supera el tramo incluido del abono**,
> sin inventar precios — las tarifas cambian cuando el Ayuntamiento quiere y no están en este
> repositorio.
>
> **⭐ Y los carriles bici ya dicen de qué calle son.** «Continúa hacia **el carril bici** ·
> 1.510 m», kilómetro y medio sin decir por dónde: lo vio Antonio en ruta viva el 30/08. La causa
> estaba escrita desde el día anterior en la cabecera del propio motor — la herencia de nombre del
> callejero municipal se cruzó sobre las aristas **del peatón**, y la tabla del peatón cierra los
> carriles bici, así que a los tramos que solo existen en la red de la rueda **nunca se les
> preguntó**. Ahora se les pregunta: **652 tramos mudos que el peatón no veía, 579 heredan** —
> todos carril bici—, **1.867 aristas y 71,8 km** con nombre. Y se viste, porque el nombre de un
> carril **es el de la calle a la que acompaña**: «el carril bici de Avenida San Juan de la Peña».
> Medido sobre 200 rutas al azar, los pasos que decían «el carril bici» a secas caen de **686 a
> 81**. Los que siguen callando lo hacen por su motivo —33 por disputa entre dos calles, 29 por
> poca cobertura, 11 sin eje cerca—, y ahí el genérico es lo honesto.
>
> **Y el rótulo vuelve a decir la velocidad, dicha como lo que es.** El empuje se la había
> quitado a la rueda por no mentir; ahora dice **«~17 min pedaleando a 20 km/h de crucero»**. Las
> dos palabras del final son las que la hacen verdad: 20 es la velocidad a la que se va cuando se
> va, no la media de un viaje que empieza y acaba andando. Los minutos siguen siendo la suma real.
>
> **⭐ Y desde el 30/08 el selector son seis y cada rueda manda la suya** —Andando · Bus /
> Tranvía · Bici privada · Patín (VMP) · BiZi · Coche—. Hasta entonces eran cuatro botones y
> «Bici / Patinete» mandaba `bici`, así que un patinete recibía la ruta de una bici: legal para
> la bici, ilegal para él en cuanto la calle pasa de 30. **El coche es el único que sigue con el
> corte en la pantalla**: dice «todavía no» sin llegar a preguntárselo al motor — aunque el motor
> ya sepa contestar desde el 2/09—. El bus perdió ese corte el 31/08 y viaja como los demás.
>
> La pantalla vive en [`app/`](app/): el formulario de cuatro campos, los seis modos, el mapa
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
> — de las 3.359 vías del callejero ofrece **3.350**, que es casi el callejero entero. Cuando la
> calle está en un barrio rural lo dice: **CALLE BURGOS [CASETAS]**, que es distinta de la CALLE
> BURGOS de la ciudad. Va entre corchetes y no entre paréntesis porque los paréntesis ya son del
> dato: hay 38 vías que los traen en su propio nombre, 32 de ellas con portal.
>
> **⭐ Y esas 3.350 son dos cosas sumadas, porque no toda calle tiene puertas.** Hasta el 27/08
> solo se ofrecían las **2.731 con algún portal**: sugerir una sin ellos era prometer una
> dirección que después no se podía resolver, así que **el PUENTE DE PIEDRA, la PLAZA CÉSAR
> AUGUSTO y el PARQUE JOSÉ ANTONIO LABORDETA no se podían ni escribir**. Ahora las otras **619**
> se resuelven por **el punto medio de su geometría** — el de la mitad del recorrido, que cae
> siempre sobre la propia calle—, que es la respuesta documentada de Pelias a una dirección sin
> número. Al elegir una de ellas **la casilla del Nº desaparece**: no hay ninguno que pedir.
>
> **Las 9 que faltan se quedan fuera, y se dicen.** Ocho son los `DISEMINADO`, que llegan con la
> geometría vacía porque un diseminado no es una calle; la novena es la GLORIETA LAS BANDERAS,
> que el callejero conoce y la capa de ejes todavía no —son dos fotos de fechas distintas, y está
> contado en la ficha § 1.15—. **Sin coordenada no existe**, también aquí.
>
> ```
> $ npm start --prefix motor
> motor: callejero en memoria — 3359 vías, de las que 3350 se sugieren: 2731 con portal ·
>        619 por punto medio (46150 portales) · 29 ms
> motor: fuera del buscador — 9: 1 sin eje en la capa municipal · 8 con la multilínea vacía
>
> $ curl 'localhost:3000/api/vias?q=puente%20de'
> PUENTE DE LA ALMOZARA · PUENTE DE LA UNIÓN · PUENTE DE LOS CANTAUTORES · PUENTE DE PIEDRA ·
> PUENTE DEL GÁLLEGO · PUENTE DEL PILAR · PUENTE DEL TERCER MILENIO · AVENIDA PUENTE DE LOS
> SUSPIROS · AVENIDA PUENTE DEL PILAR · CALLE PUENTE DE RIALTO
> ```
>
> Los siete primeros tienen **cero portales**: ninguno de ellos existía para el buscador hasta
> ese día.
>
> **El portal no se escribe: se elige.** Fijada la calle, el motor sirve sus portales reales y
> el campo los ofrece en el orden en que se lee un callejero —1, 2, 3, 10, no 1, 10, 2—, con
> sus rarezas tal cual vienen: **9-11**, **1DP**, **22B**, **71 TV C2**. Así no hay número
> inventado que resolver después: de una lista no se puede elegir lo que no existe.
>
> **Y el formulario gana dos atajos.** Un **⇅** entre origen y destino que los intercambia
> enteros: el texto, el código y hasta la marca de «esto está a medias» viajan con su lado. Y un
> **📍 Mi ubicación** en **los dos campos**, que rellena la calle y el portal con donde estás. No
> escribe texto: fija los mismos códigos que fijaría elegir de la lista, así que la validación ni
> se entera de que ha habido GPS. Antes de fiarse comprueba **dos cosas**: que el navegador sepa
> dónde estás con menos de **100 m** de margen, y que haya un portal a menos de **150 m**. Si no,
> lo dice en ámbar y no toca ningún campo. Y al usarlo, ese lado pasa al tipo **Dirección**:
> una ubicación es una dirección, y lo que se rellena son una calle y un portal.
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
> «derecha» ataría el icono a la redacción. Son **doce** clases y doce caracteres Unicode, sin
> una sola dependencia añadida. Diez son giros; las otras dos son los **hitos** —🅿 aparcar,
> 🚲 coger la bici—, que no son maniobras sino cambios de vehículo, y llevan la señal de lo que
> pasa ahí en vez de una flecha. La tabla es exhaustiva por tipos: el día que el contrato añada
> una clase, **la pantalla deja de compilar** en vez de pintar un hueco. Cumplió el 30/08.
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
> **Y el tiempo va dicho como lo que es**: «~4 min **a 5 km/h**» andando. Es una división —los
> metros entre la velocidad a pie de manual—, no un cronómetro: no entran cuestas, ni semáforos,
> ni el rato que se tarda en cruzar. Un «4 min» a secas prometería algo que aquí no se ha medido.
> **Sobre ruedas la coletilla es otra** —«pedaleando a 18 km/h **de crucero**», 20 en BiZi— y las
> dos últimas palabras no son un adorno: ahí no hay una sola velocidad, porque el techo legal de
> cada vía recorta la del modo, los cruces con el vehículo en la mano van a 5, y el viaje acaba
> andando. Decir «a 18 km/h» a secas volvería a ser falso; decir el crucero, no.
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
> **Lo que sigue sin verse en la pantalla: NADA.** Los seis modos viajan al motor y se pintan —el
> coche fue el último, el 3/09—. ⚠️ Este párrafo decía «bus o tranvía y coche» hasta el 1/09 y
> «el coche, y nada más» hasta el 3/09, y las dos veces **el motor ya sabía contestar**: es la
> tercera y la cuarta vez que una frase de este README envejece varias pantallas por debajo del
> párrafo que sí se estaba releyendo. La primera fue la bici (29/08), y antes la entrada nº5 de la bitácora. **Se corrige
> diciéndolo**, que es lo único que ha funcionado hasta ahora — y por eso la frase de arriba ya no
> dice «no existe» sino «no se ve»: son dos cosas distintas.
>
> Así que hoy el repositorio es esto: **el método de trabajo, el plan, las licencias,
> veinticinco conjuntos de datos con ficha —tres de ellos consultados en vivo, no copiados—, y un
> buscador que de verdad busca: andando, en autobús o tranvía, en bici, en patín y en BiZi, de
> portal a portal, con la ruta en el mapa y los pasos escritos debajo.**
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
- **Tres clases de ruta** para la bici y la BiZi: Rápida, Equilibrada (marcada) y Tranquila.
  Es otro grupo de radios, y **solo existe en esos dos modos** — el patín no elige por ley y
  los demás no tienen ruta que calibrar.
- **Seis modos, excluyentes**: andando, autobús/tranvía, bici privada, patín (VMP), BiZi y
  coche. Eran cuatro hasta el 30/08, con la bici y el patinete juntos; los separó el motor, que
  desde la casilla 3 les aplica **tres tablas de acceso legales distintas**. Son un **grupo de
  radios** vestido de botones: seis pasan del rango del control segmentado —de 2 a 5 con
  etiqueta—, y con radios el teclado sale de serie (una parada de tabulador para el grupo y
  flechas entre las opciones).
- **Mapa con la ruta**.
- **Las indicaciones paso a paso**, debajo — y **con hitos** cuando el viaje cambia de vehículo:
  dónde se **sube**, dónde se **transborda** y dónde se **baja** del autobús o el tranvía, dónde se
  aparca la bici, dónde se coge y se deja la BiZi.
- **Un aviso cuando hace falta**: que la línea va hoy **desviada** y por dónde no para, que Avanza
  no anuncia ningún próximo en ese poste, que no hay aparcabicis cerca y a cuántos metros estaba
  el más cercano, que la disponibilidad del BiZi no se ha podido verificar, o que el pedaleo
  supera el tramo incluido del abono.

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

> ⭐ **Y no hace falta ninguna clave para arrancar.** El GTFS entra en el repositorio como
> **semilla fechada** —`app/data/2026-08-10_nap_gtfs-ficha1176.zip`—, así que un clon limpio
> levanta el bus y el tranvía sin pedirle nada a nadie. Las dos variables de `motor/.env.local`
> **solo hacen falta para renovarlo**, y el fichero **no está en el repositorio**:
>
> | | Para qué |
> |---|---|
> | `NAP_API_KEY` | que el cron pueda **descargar** del Punto de Acceso Nacional la publicación nueva |
> | `DESPLAZAME_REGEN_TOKEN` | que `POST /api/renovar-feed` acepte **dispararlo** (`Authorization: Bearer …`) |
>
> Sin ellas el motor arranca igual y lo dice: sirve la semilla, y el cron no puede correr. En
> producción viven en el panel de Hostinger.

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

> ⚠️ **Andando es el modo que viene marcado al abrir.** Las tres ruedas —bici privada, patín y
> BiZi— dan ruta desde el 29/08 y el **bus y el tranvía desde el 31/08**. **Solo el coche conserva
> el corte**: ahí la pantalla dice que todavía no se calcula y no llega a preguntárselo al motor
> —que desde el 2/09 sí sabe contestar—, y nunca una ruta a pie disfrazada de otra cosa.
>
> ⏱️ **Y el bus tarda más que los demás a propósito**: pregunta a Avanza por el primer poste antes
> de contestar. Medido hoy sobre 200 peticiones: **p50 750 ms**, contra los **36 ms** que cuesta
> el mismo viaje sin salir a la red. La diferencia es la fuente, no el motor.
>
> Los seis caben en una fila. Medido en Chrome sobre la página servida (30/08, sonda de
> scratchpad por CDP): las seis opciones suman **567,2 px** y sus cinco huecos 40, o sea 607,2
> de los **671 útiles** que quedan en una ventana de 760. Por debajo el grupo se dobla solo
> —dos filas del mismo grupo, tres a 360 px— y **ninguna etiqueta se recorta ni se parte**.

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

**Y los tipos se comprueban desde la RAÍZ, con uno solo**: encadena el del motor y el de la
interfaz, y el contrato de `@desplazame/tipos` entra por dentro de los dos, que es lo que hace que
un cambio en él rompa por los dos lados a la vez. Además **cuenta cuántos ficheros ha mirado**,
para que un `tsconfig` mal apuntado no dé verde mirando cero:

```bash
npm run comprobar-tipos     # en la RAÍZ, no dentro de app/ ni de motor/
```

```
comprobar-tipos · la interfaz, con censo
  OK   tsconfig.app.json    limpio · 292 ficheros mirados
  OK   tsconfig.spec.json   limpio · 356 ficheros mirados
```

**Y las pruebas de pantalla, a mano.** Lo que vive en [`app/e2e/`](app/e2e/) no entra en
`npm test`: son guiones que conducen un **Chrome de verdad** por CDP —sin una dependencia
añadida— y necesitan **el motor y `ng serve` levantados**. Miden lo que solo se ve en el píxel:
el contraste real de los chips, los huecos del trazado, y el botón «Próximo bus» contra Avanza en
vivo.

```bash
node app/e2e/proximo-bus.mjs      # el botón, de punta a punta y con la fuente viva
```

### El arranque del bus, que es su comprobación

El motor declara al arrancar de dónde sale cada pieza del bus. Si algo falta, se ve aquí y no tres
pantallas más adelante:

```
motor: feed GTFS vivo (relevó a la semilla) — 20260623_AUZSA_Y_TRANVIA · 6883311 bytes
motor:   NAP 2026-06-30T13:20:04.661082 · vence 20261005 · 34 día(s) → VIGENTE
motor: red de bus LEÍDA del cocinado — 984 paradas · 170 patrones · 10588 transbordos · 196 ms
motor: escuchando en http://localhost:3000 (pid 23576)
motor: GET /api/poste-vivo?poste=N&linea=L pregunta a Avanza a peticion, sin guardar nada
motor: ruta operativa de hoy — 64 sentidos · 23 detectados · 23 aplicados · 0 sin saber · 17 s
```

Cuatro cosas: **qué feed se está sirviendo** —la semilla o el vivo— y cuántos días le quedan; **la
red cocinada**; **el puerto y el pid**, que es contra lo que se comprueba que contesta el proceso
de ahora; y **la ruta operativa de hoy**, que llega **después** de escuchar y sin que nadie la
espere — son medio centenar de peticiones a Avanza y el motor ya está sirviendo mientras tanto.

### La API del motor, hoy

**Ocho rutas vivas** (`grep -cE "url\.pathname === '/api/" motor/src/servidor.ts`). Las que
vengan las decide el plan, no esta lista:

| | |
|---|---|
| `GET /api/salud` | si está vivo, y con qué dato: grafo, red andable —con cuántos nombres trae de OpenStreetMap y cuántos hereda del callejero municipal—, callejero y portales, con sus recuentos |
| `GET /api/vias?q=&foco=` | sugiere vías desde 2 letras, hasta 10 resultados. Sin `q`, lista vacía. `foco` es **el código del otro extremo** ya resuelto —un portal, un sitio o una vía sin portales—: a igualdad de coincidencia sube lo que está cerca de él, y **no descarta nada**. Devuelve `portales`, y un **`0` significa que esa vía no tiene ninguna puerta que elegir**: se resuelve por el punto medio de su geometría |
| `GET /api/portales?via=` | todos los portales de esa vía, ya ordenados. Sin `via`, lista vacía — y **lista vacía también en las 619 sin portal**, que es la verdad: no tienen ninguno |
| `GET /api/sitios?q=&capa=&foco=` | sugiere **sitios** desde 2 letras, hasta 10 resultados — la otra capa del autocompletar, la que sirve al desplegable de tipos. `capa` acota a una categoría (`farmacia`, `hospital`, `centro-salud`), y **una capa que no existe se ignora** en vez de dar error. `foco` es **el código del otro extremo** ya resuelto —un portal o un sitio, no un par de coordenadas—: a igualdad de coincidencia sube lo que está cerca de él, pero no descarta nada. Sin `q`, lista vacía |
| `GET /api/portal-cercano?lat=&lon=` | el portal más cercano a un punto, con su vía y sus metros. Barre los 46.150 en **1,35 ms** medidos. Sin coordenadas válidas, `null` |
| `POST /api/ruta` | la ruta entre dos extremos, por códigos —un portal, un sitio, o **una vía sin portales, que viaja con su propio código en las dos casillas** (`{via: '23125', portal: '23125'}` es el Puente de Piedra)—: geometría, pasos escritos, metros y duración derivada. **Es la que llama «Generar ruta»**. Medido sobre 200 peticiones HTTP a portales al azar de toda la ciudad: **p50 22 ms, p95 35**. El Dijkstra son ~10 de esos milisegundos; el resto es escribir los pasos y serializar —**22,9 pasos y 13,5 kB** de media, que eran **23,3 pasos** en las mismas 200 peticiones antes de los combines de odin—. Sin ruta, un aviso que dice por qué. **`modo` es opcional y vale `andando` si falta** (`andando` · `bus` · `bici` · `patin` · `bizi` · `coche`; **ya no falta ninguno** desde el 2/09). ⭐ **Con `bus` la respuesta trae tramos MONTADOS**: cada uno con su `linea` —código corto, nombre largo, color y modo `bus`/`tram`— y sus pasos de hito `sube`, `transborda` y `baja`, con el número de poste, cuántas paradas se va dentro y la espera. Medido hoy sobre 200 peticiones HTTP a portales al azar (semilla 7, el mismo método que las demás filas): **p50 750 ms, p95 2.810, máximo 6.370**, y **133 de 200** dan ruta en autobús. ⚠️ **De esos 750 ms, el motor pone 36**: el mismo viaje resuelto sin salir a la red da **p50 36 ms y p95 74** — con las mismas 133 resueltas—, así que **lo demás es la consulta viva a Avanza** del primer poste. Es el precio de decir un minuto de verdad en vez de una estimación, y va dicho en vez de escondido. **`ruta` también es opcional y vale `equilibrada`** (`rapida` · `equilibrada` · `tranquila`): la miran `bici` y `bizi`, y **el `patin` la ignora** — su vía ciclista es obligatoria, así que lleva el calibrado fuerte pida lo que pida. Medido el 30/08 en `Portales.120344 → Portales.110047` en bici: rápida **1.554 m / 5,7 min / 150 m de Avenida de Madrid**, equilibrada **1.565 / 5,7 / 110**, tranquila **1.710 / 6,2 / ninguno**. ⭐ **Y desde el 30/08 la respuesta puede traer HITOS**: `aparca` en bici y patín —el aparcabicis donde se deja el vehículo— y `coge` + `aparca` en BiZi —las dos estaciones—. Un hito es un paso propio con `metros: 0`, porque no abre tramo: es una parada. Medido con las MISMAS 200 peticiones el 30/08 (semilla 7 sobre el censo): andando **p50 23,3 ms · p95 40,3**, bici **24,6 · 39,9**, patín **17,6 · 98,4**, BiZi **88,4 · 164,4**. ⚠️ **La BiZi cuesta cuatro veces más que las demás, y es la red**: cada ruta pregunta en vivo a la API de la sede (§ 1.23), que contesta en ~0,3 s la primera vez y en ~0,08 las siguientes. Es el precio de no mentir con un número guardado. Y en esas mismas 200: andando resuelve 197, bici 196, BiZi 197 y **el patín 98** — eran 35 antes del **defecto legal del art. 50 RGC**, 51 después, 83 desde el empuje, y **98 desde el remate**: al no necesitar ya una puerta rodable en el destino —le basta con llegar al aparcabicis y andar—, quince pares más tienen ruta. De las que resuelven, llevan hito **167 de 196** en bici y **196 de 197** en BiZi. El arranque lo declara capa a capa. ⭐ **Y con `coche` (2/09) la búsqueda va POR TRANSICIONES**, no por nodos: una restricción de giro no prohíbe una arista, prohíbe **pasar de una a otra**, y un Dijkstra que solo recuerda el mejor coste por nodo no puede obedecerla [GraphHopper: *«requieren recorrido edge-based del grafo»*]. Las **1.378 transiciones vetadas** de la casilla 1a se respetan, y las penalizaciones de `car.lua` —la sigmoide del giro, los 2 s del semáforo, los 20 de la media vuelta— **entran en el tiempo publicado**, porque en la fuente se suman a `turn.duration` y no solo al peso. Medido hoy sobre 200 peticiones HTTP a portales al azar (semilla 7, el mismo método que las demás filas, `pid` del log = `pid` que contesta): **p50 26 ms, p95 53-57, máximo 78-89** —dos pasadas, antes y después del arreglo de la entrada nº30, para que se vea el ruido del p95—, con **189 de 200** resueltas las dos veces, **16,4 pasos** y **12,1 kB** de media. ⚠️ **Las 11 que no resuelven no son un fallo del motor**: el 98,15 % de los portales enganchados tiene ida y vuelta al centro, y lo que queda son fondos de saco del viario y dos cruces que el propio OSM cierra —ver la ficha del viario—. ⭐ **Y si la ruta pisa la Zona de Bajas Emisiones, la respuesta trae su aviso con `paso`**: el índice del paso por el que se entra, para que la pantalla lo pinte arriba **y** junto a ese paso sin tener que adivinarlo leyendo el texto. **Avisa, no veta**: la app no sabe qué distintivo lleva el coche. En esas 200, **25 de las 189** lo traen. ⭐ **Y desde el 3/09 el coche tiene DOS parámetros más** (punto 12, casilla 2), los dos opcionales y con la misma ley que `modo` y `ruta`: sin ellos, la respuesta es la de la casilla 1b **al byte** —medido, sha256 de los 36 trayectos de los seis modos idéntico al de `8763c64`—. **`aparcamiento`** (`azul` · `naranja` · `discapacitado` · `gratuito`) remata *car-to-park* [DOC OTP2: *«conducir al aparcamiento y andar el resto»*]: la respuesta trae **dos tramos**, el primero `rodando` con `hito: "aparca"` y el segundo `andando`. El sitio se elige **POR COSTE** —conducir más andar por `walkReluctance` 4,0—, no por radio: un tope de distancia sería la misma anti-doctrina que los 500/800 m del bus, retirados el 31/08. Los cuatro montones salen de § 1.11 y § 1.13 filtrando por `tipo_actual` y por `TIPO`, y **los 28 tramos que el censo no clasifica no entran en ninguno**. El paso del hito dice lo que el dato dice y nada más: «zona azul (rotación)», «zona naranja (residentes)», «plaza PMR (horario: permanente)» —el horario, literal, con sus 104 formas—, «estacionamiento gratuito (sin coste)»; **ni tarifa ni franja, porque § 1.11 no las trae**. **`puedeEntrarEnLaZbe`** (sí/no) traduce la FAQ oficial a la única pregunta que el motor puede hacer: con `false` y **dentro de la franja L-V 8:00-20:00**, la Zona de Bajas Emisiones se veta —en la búsqueda y como sitio donde aparcar—. ⭐ **Y desde el 3/09 un destino DENTRO de la zona ya no se contesta con «no hay ruta»** (punto 12, casilla 2-bis): la ordenanza municipal deja entrar precisamente para ir a un aparcamiento público conectado [§ 1.32, trámite 42155, literal: *«Vehículos que accedan a estacionamientos públicos con sistema de control de acceso conectado»*], así que la ruta **remata en el mejor POR COSTE de los cuatro aparcamientos públicos que caen dentro de la fase 1** —Plaza del Pilar - Juzgados, Ayuntamiento, César Augusto y Puerta Cinegia, cruzados al cocinar en `app/data/parkings-zbe.json` (§ 1.31)— y se anda el resto. Callarlo es lo que hace la industria [TomTom SDK, literal: *«avoidance is not guaranteed if no alternative route exists»*]; la alternativa aquí es legal y se ofrece. ⚠️ **La zona se ENTRA, no se ATRAVIESA**: el aparcamiento está dentro, así que llegar a su puerta pisa aristas de la ZBE por fuerza, y lo que se prohíbe es la transición dentro → fuera. Con una excepción medida —salir **para rematar**, y ahí se acaba—, porque `Puerta Cinegia` engancha a **58,6 m**, en Plaza España, a una arista de fuera a la que solo se llega desde dentro: sin esa excepción se quedaba sin ruta y desaparecía del reparto, y es la que deja el paseo más corto. Medido sobre 122 portales del casco: **0 rutas atraviesan la zona**, el coste elige distinto que la recta en **17**, y ganan los cuatro (César Augusto 52 · Puerta Cinegia 30 · Pilar-Juzgados 25 · Ayuntamiento 15). Por HTTP contra el motor vivo (`pid` del log = `pid` que contesta): `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33` con `false` da **4.834 m en dos tramos** —rodando 4.538 + andando 296, 17 pasos, 33 ms— y con `true`, **3.386 m en uno** —14 pasos, 16 ms—. ⚠️ **Lo que NO se promete**: ni que ese aparcamiento siga abierto —el catálogo 55 sella sus filas en **2013**— ni que tenga el «sistema de control de acceso conectado» que la norma pide, porque ese campo no existe en el dato: el aviso cuenta la norma y manda al registro municipal. Y **el ORIGEN dentro sigue sin remate**: de ahí no se sale sin pisar la zona. Fuera de la franja **no se veta nada** y el aviso lo dice con la hora que ha mirado; el reloj entra por parámetro, como la fecha del bus, para poder mentirle en las jueces. Medido hoy sobre 200 peticiones HTTP (semilla 7, `pid` del log = `pid` que contesta): sin parámetros **p50 26 ms, p95 56**; `gratuito` **56 · 767**; `discapacitado` **53 · 440**; `regulado` **262 · 822** —medido el 3/09, cuando `regulado` era **los dos montones juntos**; desde el reparto del 4/09 son `azul` (664 tramos) y `naranja` (495), y esos números **no se han vuelto a medir**—; con el veto de la ZBE **24 · 53**. ⚠️ **El remate cuesta diez veces más, y se sabe dónde**: de los 332 ms de un `regulado` de entonces, **324 son los 40 Dijkstras del peatón** —uno por candidato— y **8 la búsqueda del coche**, que es una sola para los cuarenta. Recortar candidatos no es gratis: medido sobre ~58 viajes al azar, con 5 el ganador cambia en 32 de 58 casos del `gratuito` y se pierden hasta 2.640 s de coste ponderado. ⭐ Y con aparcamiento **resuelven 195 de 200** contra 189 sin él: hay portales a los que el coche no llega y cuyo bordillo de al lado sí |
| `GET /api/poste-vivo?poste=&linea=` | **Cuándo pasa el próximo de esa línea por ese poste**, preguntado a Avanza **en el momento** (§ 1.24 del notices). Es lo que contesta el botón «Próximo bus». **Idempotente** y con `Cache-Control: no-store`: cada pulsación vuelve a preguntar de verdad — un «en 3 min» servido de la caché cuarenta segundos después no es viejo, es **falso**. **Single-flight por poste**: dos peticiones simultáneas del mismo poste comparten una sola visita a la fuente. Contesta uno de **tres estados**, con su frase ya compuesta: `llega` («próximo en 4 min (dato de las 16:29)»), `ausente` («Avanza no anuncia ningún próximo…» — que es **sin información**, no «sin servicio») y `mudo` («disponibilidad no verificada»). Un poste o una línea que faltan son **400**; un poste que Avanza no conoce es `mudo` y **200**, porque no saberlo no es un error de quien pregunta. Medido hoy contra la fuente viva: poste 1203 línea 29 → `ausente` en **2,26 s**; poste 1000 línea 53 → `llega`, «próximo en 4 min», en **2,38 s** |
| `POST /api/renovar-feed` | **El disparador del cron nocturno**, que trae del NAP la última publicación del GTFS y la escribe al lado de la semilla. El token va **en la cabecera `Authorization: Bearer …`** y nunca en la URL, que se queda en los logs. **`503`** si no hay token configurado en el servidor —falla cerrado y no ejecuta nada—, **`401`** si el que llega no es el bueno, **`409`** si ya hay una renovación en curso, y **`202`** cuando arranca: se contesta antes de empezar para que ningún *timeout* del hosting mate el trabajo a medias. El zip nuevo **se sirve al próximo arranque**, no en caliente |

En desarrollo el `4200` las reenvía al `3000` con un proxy, así que la interfaz siempre pide a
`/api/…` y no sabe en qué puerto vive el motor.

---

## Ir a un sitio, y no solo a un portal

Los dos campos —origen y destino— admiten **una dirección o un sitio**. Un sitio es un destino
con nombre, y hoy son **820 equipamientos** del término municipal en **siete categorías**
—farmacias, hospitales, centros de salud, bibliotecas, colegios e institutos, guarderías y
universidades—, de los que **802 se pueden elegir**: los **18 que no traen coordenada** se quedan
fuera, y ninguno más.

**Y no se mezclan: primero se dice de qué se está hablando.** Cada campo son cuatro piezas en
fila —**📍 · tipo ▾ · cajetín · nº**— y el desplegable acota la búsqueda a **una sola** categoría:
`Dirección` primero, y detrás las siete alfabéticas —`Bibliotecas`, `Centros de Salud`, `Colegios
e Institutos`, `Farmacias`, `Guarderías`, `Hospitales`, `Universidades`—. **El orden no está
escrito: se calcula**, así que la categoría que entre mañana cae sola en su sitio. Y cada opción
lleva dentro **el icono de su clase** en los navegadores que soportan `appearance: base-select`;
en los demás es un desplegable de texto y funciona igual. Hasta el 24/08 las dos clases salían
revueltas en la misma lista y quien miraba tenía que distinguirlas por un icono; ahora no hay nada
que distinguir, porque **una lista es de una sola clase**. Cambiar de tipo **vacía el campo**: lo
escrito bajo «Farmacias» no significa lo mismo bajo «Dirección», y arrastrarlo dejaría un texto
contando algo que ya no es.

> Con el tipo en **Farmacias** y `navarra` escrito, salen dos, y las dos son farmacias:
>
> ```
>   Farmacia · Avda. de Navarra, 65
>   Farmacia · C/ Doña Blanca de Navarra, 46-48
> ```
>
> El mismo `navarra` en **Centros de Salud** trae uno —el Centro de Especialidades Inocencio
> Jiménez, de Avenida de Navarra 78—, en **Hospitales** ninguno, y en **Dirección**, las dos calles
> que se llaman así.

**El número de portal no queda apagado: desaparece.** Con «Dirección» el campo existe y se rellena
eligiendo de la lista; con una categoría de sitios **se va del formulario**, porque un sitio
trae su propia coordenada y no hay portal que pedirle. Es el *revelado condicional* del sistema de
diseño del GOV.UK, y la diferencia no es cosmética: una casilla apagada sigue diciendo «aquí falta
algo», y una que no está dice la verdad, que es que ahí no hay nada que rellenar.

**⭐ Y desde el 27/08 también se va con una calle que no tiene portales.** Elegir el PUENTE DE
PIEDRA quita la casilla del Nº y deja «Generar ruta» encendido con la calle sola: no es que falte
el número, es que ese sitio no tiene ninguno. Mismo patrón, mismo argumento, y la ausencia se lee
**del dato** —cuántos portales dice el motor que tiene— y no de una lista de nombres escrita en la
pantalla.

**El ⇅ cruza los campos enteros**: el tipo, el texto, lo ya resuelto y el número. Si un lado era
una dirección con su «2» y el otro un hospital, después de pulsarlo la casilla del número **se ha
mudado de lado con su número dentro** — no queda ninguna apagada ni ningún botón muerto.

**Y «Mi ubicación» vive en los dos campos**, no solo en el origen. Al usarla, ese lado pasa a
**Dirección**, porque una ubicación *es* una dirección: lo que rellena son la calle y el portal más
cercanos, los mismos códigos que fijaría elegirlos de la lista.

**De dónde sale el dato.** De la **[API de equipamientos del Ayuntamiento de
Zaragoza](https://www.zaragoza.es/sede/servicio/equipamiento/category/740.json)**, y hacen falta
**quince ficheros para siete categorías**: las tres de sanidad salen de una categoría municipal
cada una —**740 farmacias**, **780 hospitales**, **781 centros de salud**—, pero las otras cuatro
se **componen**. Bibliotecas sale de dos (la 35 y la 223) y las tres de educación de once, porque
el Ayuntamiento reparte por temas de interés y aquí se reparte por lo que la cosa **es**: un
colegio que hace infantil, primaria y secundaria está fichado en tres categorías municipales y en
el buscador es **un colegio**.

⭐ **La partición de educación no es nuestra: es la de OpenStreetMap.** `amenity=school` cubre de
los ~6 a los ~18 y admite varios niveles en un elemento, `amenity=kindergarten` es el preescolar y
`amenity=university` el campus terciario. La FP va con los institutos porque en España vive en los
IES y los CIFP.

Sus fichas enteras —licencia, fecha, huella, recuentos y lo que traen de roto— están en
**[§ 1.16 a § 1.20 del THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES.md)**, y su frescura son las
**filas 22 a 37** del manifiesto.

Las tres se descargaron en agosto de 2026 y **cada una declara su fecha de otra manera**, que es
justo lo que las fichas cuentan: farmacias y centros de salud traen un `Last-Modified` que
**coincide al segundo** con la modificación más reciente de sus propios registros —08/06/2026 y
20/05/2026—, así que se declara como fecha del dato; el de hospitales va **trece meses por delante**
del registro más nuevo, así que no describe al dato y **se omite** en vez de copiarlo. En el panel
las tres salen **grises**: ninguna fuente publica cada cuánto se refresca, y una caducidad sin
fuente no se inventa.

### ⭐ Tres reglas que se ven poco y deciden mucho

**Sin coordenada no existe.** De los 820 equipamientos de las siete categorías, **18 no traen
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
coordenada que la publicada. Son **16 de 820**.

**⭐ Y para moverlo hay que estar lejos de LA CALLE, no solo del número.** Es la lección que
costó una entrada de bitácora: al entrar los colegios el rescate saltaba 29 veces, y midiendo la
ida y la vuelta —a qué distancia estaba el punto ANTES de moverlo— salió que **22 de esas 29
movían coordenadas que ya estaban en su sitio**. Un colegio tiene la fachada larga y su punto cae
donde cae: que no coincida con el portal que su dirección declara no es un error, es el caso del
Miguel Servet a escala de portal. Ahora, antes de mover nada, se mira si hay **cualquier puerta de
esa misma calle** a menos de 50 m; si la hay, el punto se queda. De 29 rescates a 17.

**⭐ Y la calle se encuentra aunque el dato la nombre con una palabra de más.** El caso que lo
destapó: el **C.E.I.P. Andrés Oliván** está en San Juan de Mozarrifar, su coordenada cae a 11 m de
su puerta, y su dirección dice «C/ Doctor Alejandro Palomar» — pero la calle del barrio se llama
**«Doctor Palomar»**, sin el nombre de pila, y con ese nombre existe **otra** en la ciudad, a
7,6 km. El colegio aterrizaba allí. Ahora un nombre del callejero que quepa **dentro** del escrito
—en orden y con palabras enteras— también es candidato, y entre las candidatas gana la que tenga
una puerta cerca del punto. El colegio se queda en su barrio, y los rescates bajan a **16**.

⚠️ Lo de «palabras enteras» no es un detalle: **«mina» no cabe en «taormina»**, que son dos calles
distintas de Zaragoza. Comparar trozos de letras es lo que un día casó «Pza. Santo Domingo» con
CALLE ISABEL SANTO DOMINGO — 13.680 m de mentira—, y esa puerta sigue cerrada.

Y lo que falla y **no** se puede resituar —porque su
dirección es «s/n» o no resuelve— se trata como si no tuviera punto: fuera del índice, y a una
**lista de confirmación manual**.

**Esa lista hoy está vacía, y vaciarla es el ciclo completo de la regla.** El único que llegó a
ella fue el centro de salud de Portugal: su dirección es «C/ Domingo Miral, s/n» y sin número no
había portal que devolverle, así que el proceso automático no podía hacer más que apartarlo. Lo
que sí se puede hacer con una lista corta es mirarla sobre el terreno, y eso es lo que pasó el
24/08: **volvió con la coordenada confirmada a mano** (§ 1.17), va declarada con su fuente y su
motivo, y pasa los dos cheques como cualquier otra — el fichero municipal sigue diciendo Portugal,
intacto. Así que el centro de salud vuelve a ser un destino que se puede elegir.

**Hospitales, bibliotecas y universidades quedan fuera del cheque de distancia**, y a propósito:
no son una puerta, son un recinto con varias. El Miguel Servet está a 169 m del portal de su
dirección y eso no es un error, es otra de sus entradas; una biblioteca es muchas veces un cuarto
dentro de un edificio mayor, y un campus tiene sus facultades repartidas por dentro. Las otras
cuatro categorías **sí** lo pasan: una farmacia, un centro de salud, un colegio y una guardería
son una puerta.

**El fichero municipal no se toca.** Todo esto pasa en memoria al arrancar, y el motor lo dice
entero — con qué se movió, desde dónde y cuántos metros:

```
motor: sitios en memoria — 820 en total · 802 en el indice · 33 ms
motor:   Farmacia            313 · 310 en el indice · 3 sin coordenada · 0 corregidos · 4 rescatados · 0 invalidas · 0 duplicados · 0 excluidos
motor:   Centro de salud      56 ·  56 en el indice · 0 sin coordenada · 1 corregidos · 1 rescatados · 0 invalidas · 0 duplicados · 0 excluidos
motor:   Hospital             17 ·  15 en el indice · 2 sin coordenada · 0 corregidos · 0 rescatados · 0 invalidas · 0 duplicados · 0 excluidos
motor:   Biblioteca           77 ·  75 en el indice · 2 sin coordenada · 0 corregidos · 0 rescatados · 0 invalidas · 0 duplicados · 0 excluidos
motor:   Colegio o instituto 264 · 254 en el indice · 10 sin coordenada · 0 corregidos · 10 rescatados · 0 invalidas · 234 duplicados · 16 excluidos
motor:   Guardería            64 ·  64 en el indice · 0 sin coordenada · 0 corregidos · 1 rescatados · 0 invalidas · 0 duplicados · 1 excluidos
motor:   Universidad          29 ·  28 en el indice · 1 sin coordenada · 0 corregidos · 0 rescatados · 0 invalidas · 0 duplicados · 0 excluidos
motor: 18 sin coordenada en total, fuera del indice (sin coordenada no existe: no se pueden enrutar, asi que no se sugieren)
motor: 1 corregido a mano (lista de confirmacion manual, § 1.17)
motor:   CentrosSalud.9090    Centro de Salud Fernando El Católico · C/ Domingo Miral, s/n
motor:                        de [-8.184875, 41.542373] a [-0.901195, 41.640282] — frontera: la coordenada municipal cae en Portugal
motor:                        fuente: confirmación manual de Antonio, Google Maps, 24/08/2026
motor: 16 rescatados por callejero (coordenada a mas de 50 m de la puerta que su propia direccion declara)
motor:   Colegios.9008         587 m distancia Academia Izquierdo · c/ Bolonia, 14            → CALLE BOLONIA 14
motor:   CentrosSalud.9080     497 m distancia Centro de Salud Almozara · C/ Batalla de Alman → CALLE BATALLA DE ALMANSA 17
motor:   Colegios.112445       478 m distancia Col. La Salle Santo Ángel · C/ Tomás Anzano, 1 → CALLE TOMÁS ANZANO 1
…
```

Lo que se gana se ve andando: la farmacia de Joaquín Rodrigo 17 estaba a **401 m de calles** de su
propio portal, así que ir de su puerta a su puerta devolvía una ruta de cuatrocientos metros. Ahora
devuelve cero.

**Y el nombre de quien la regenta no sale de aquí.** Farmacias es la única de las siete donde el
título no se lee: el dato municipal trae el nombre de la persona titular en **274 de los 313**
títulos. En las otras seis el título es el nombre del establecimiento —«Hospital Universitario
Miguel Servet», «C.E.I.P. María Moliner»— y se verifica categoría por categoría antes de
publicarlo; en las tres de educación, sobre sus 354 títulos: **cero nombres de persona física**. Es dato registral publicado como abierto y
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
| ⚪ | **NO CONSTA** | **33 de los 39** recursos del manifiesto |

> ⭐ **El GTFS son dos ficheros, y no son lo mismo (31/08).**
>
> - **La semilla** — `app/data/2026-08-10_nap_gtfs-ficha1176.zip`. Está en git y en el
>   manifiesto con su `sha256` verificado sobre un clon. **No se toca nunca**: es lo que hace
>   que un clon limpio arranque sin pedirle una clave a nadie.
> - **El vivo** — `app/data/nap_gtfs-ficha1176.vivo.zip`, con su registro al lado. Lo trae del
>   NAP el cron nocturno, está **ignorado por git** y **releva** a la semilla: el motor lo sirve
>   en cuanto existe y se deja leer.
>
> El motor dice al arrancar cuál de los dos está sirviendo, con su `feed_version`, la fecha que
> el NAP dio y los días que le quedan. Para que el cron funcione hace falta `NAP_API_KEY` en
> `.env.local` (local) o en el panel de Hostinger (producción), y `DESPLAZAME_REGEN_TOKEN` para
> el disparador. **Ninguna de las dos vive en el repositorio.**

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
—ni el manifiesto, que son **44 KB**—: el panel se carga aparte (`loadComponent`) y pide su
manifiesto solo cuando alguien entra en él. Medido sobre el `dist`: la raíz en frío son **6
peticiones y 459 kB**, y **cero** de datos o de manifiesto. Hay dos guardianes que lo vigilan, y
uno cuenta el total de peticiones, no un patrón — para que la próxima cosa que quiera colgarse de
la portada tampoco pueda hacerlo en silencio.

Y el manifiesto **no puede pudrirse en silencio**: una prueba recalcula el `sha256` de **los 39
recursos** en cada ejecución y los compara con lo declarado. Si un dato cambiara sin que nadie
tocara el manifiesto, se pondría roja.

⚠️ **Aquí decía «37» en tres sitios, y son 39** (`node -e "console.log(require('./datapackage.json').resources.length)"`).
El manifiesto creció y estas tres líneas no se enteraron — la misma clase de descuido que la
entrada nº5 de la bitácora, corregida con el comando delante en vez de a ojo.

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

Los datos **no** van bajo esa licencia: conservan las suyas, y son **tres regímenes distintos**.

| Dato | Licencia | Obligación |
|---|---|---|
| **OpenStreetMap** (cartografía, teselas y datos derivados) | **ODbL 1.0** | Atribución **literal**: «© **colaboradores** de OpenStreetMap», con enlace a [openstreetmap.org/copyright](https://www.openstreetmap.org/copyright). La palabra *«colaboradores»* **no es opcional** |
| **Dato municipal del Ayuntamiento de Zaragoza** (callejero, portales y demás datos públicos) | Reutilización regida por la **[Ley 37/2007](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19814)** | Citar la fuente y la fecha de actualización, y no desnaturalizar el sentido de la información |
| ⛔ **Servicios en vivo de Avanza Zaragoza S.A.U.** (las llegadas al poste y la ruta operativa de hoy) | **Ninguna.** Su [aviso legal](https://www.avanzabus.com/informacion/aviso-legal/) —leído el 01/09/2026— **prohíbe expresamente** la *«extracción y/o reutilización»* y reclama el *«derecho sui generis sobre la base de datos»*. El texto literal, con su URL y su fecha, está en **§ 1.24** del notices | **Su licencia no pide atribución: no la contempla.** Y aun así **se atribuye**, en el pie de la pantalla: *«Llegadas y recorrido operativo: Avanza Zaragoza S.A.U.»* ⭐ **Decisión de Antonio, 01/09/2026**: *«es dato público de un servicio público concesionado, y esto es una demo — se atribuye y se sigue»*. Se tomó con el aviso legal transcrito delante y con los *fixtures* nombrados uno a uno, y **los *fixtures* se quedan**: hay bytes de sus respuestas en `motor/src/avanza.spec.ts`, `viaje-bus.spec.ts`, `desvios.spec.ts` y `patron-operativo.spec.ts`, puestos por la ley de la casa de que un *fixture* copia la medición. Nada más se guarda: las dos fuentes se **consultan** en tiempo de ejecución, como haría cualquier cliente de su web |

> ℹ️ **Y las tres están en uso.** El notices lleva **una ficha por conjunto, y hoy son 33**
> (`grep -c '^### 1\.' THIRD-PARTY-NOTICES.md`): **veintidós** del Ayuntamiento de Zaragoza —el
> callejero, los portales, los carriles bici, los postes de autobús, las estaciones BiZi, los
> aparcabicis, los aparcamotos, el estacionamiento regulado, las zonas reguladas, las reservas de
> espacio, los ejes de vía, la jerarquía viaria, las cinco de equipamientos, **la disponibilidad
> viva del BiZi** y **la fuente municipal del transporte urbano** (§ 1.26, sondeada el 1/09 y sin
> adoptar), y desde el 3/09 **los aparcamientos públicos cruzados con la ZBE** (§ 1.31) y
> **la autorización para entrar en ella** (§ 1.32, que no es un conjunto de datos sino una
> norma citada)—, **cuatro** de OpenStreetMap —la cartografía, el grafo de continuidad,
> los nombres de vía y las etiquetas del viario— **más las tres del coche** (§ 1.27 el viario rodable, § 1.28 las
> restricciones de giro y § 1.29 los semáforos, las tres de OpenStreetMap), el GTFS del Punto de
> Acceso Nacional, **las dos fuentes vivas de Avanza** —las llegadas al poste y la ruta operativa
> de hoy—, y la ficha que declara lo que **todavía no** ha entrado.
>
> ⚠️ **Este párrafo ha ido diciendo «quince», «veinticuatro», «veintiséis», «veintisiete»,
> «treinta y uno» y ahora treinta y tres**, y
> las tres primeras se quedaron viejas donde estaban. Es la entrada nº5 de la bitácora
> repitiéndose: una regla de releída vale lo que su alcance. **Desde el 1/09 ya no depende de que
> alguien relea**: `app/src/app/atribucion.spec.ts` cuenta las fichas del notices y las compara
> con el número que dice esta línea. Si no cuadran, la suite se pone roja.
>
> ⭐ **Y desde el 30/08 no todo «está dentro»: hoy son TRES las que no se copian.** La
> disponibilidad del BiZi (§ 1.23), las llegadas al poste (§ 1.24) y la ruta operativa de hoy
> (§ 1.25) **se consultan** — caducan en segundos o en minutos, y guardarlas sería guardar una
> mentira con fecha.
>
> 🔎 **Y desde el 1/09 hay una CUARTA que no se copia y que además no se consulta**: la fuente
> municipal del transporte urbano (§ 1.26), la alternativa del Ayuntamiento a las dos de Avanza.
> Se midió entera —licencia, llegadas cara a cara con Avanza en el mismo instante, recorridos,
> censo de postes y alteraciones— y **no se ha adoptado**. Se ficha igual, con lo medido y con lo
> que le falta: el día que la puerta de Avanza se cierre, lo que decide es esa ficha.
>
> ⛔ **Y las dos de Avanza traen algo que ninguna otra ficha tiene: un aviso legal que PROHÍBE
> expresamente la extracción y la reutilización**, leído y transcrito el 01/09 con su URL y su
> fecha. Ni se interpreta ni se resume aquí: está en § 1.24 del notices, literal.
>
> ⭐ **Y DESDE EL 1/09 LA ATRIBUCIÓN ESTÁ EN LA PANTALLA, no solo en este fichero.** El buscador
> lleva un pie de créditos con los cuatro titulares del dato que enseña:
>
> > Llegadas y recorrido operativo: Avanza Zaragoza S.A.U. · Horarios: GTFS del Punto de Acceso
> > Nacional (MITMA) — Powered by MITRAMS (dato bruto y procesado) · Datos municipales:
> > Ayuntamiento de Zaragoza (Ley 37/2007) · Cartografía: © colaboradores de OpenStreetMap
>
> Es un `<footer>` de verdad —punto de referencia `contentinfo`—, va en el flujo y **no tapa el
> mapa**, y su contraste está **medido en Chrome**, no calculado: `app/e2e/creditos.mjs`. Que los
> cuatro estén y que enlacen donde tienen que enlazar lo vigila
> `app/src/app/atribucion.spec.ts`.
>
> ⚠️ **Y lo que NO lleva es la fecha del GTFS servido.** No es un descuido: **la pantalla no sabe
> cuál sirve el motor** —la semilla del repositorio o el zip vivo que trae el cron cada noche—, y
> el contrato no lo publica. Escribir la de la semilla sería verdad hasta la primera noche que el
> cron corriera. Preguntárselo al motor al cargar tampoco: **la raíz en frío no pide nada** desde
> el 22/08, y hay juez. Así que la fecha se dice donde consta medida, dato a dato, que es
> **`/panel`** — y hasta ahí lleva el enlace del pie.
>
> ⚠️ **Esto arregla un incumplimiento real, y se cuenta en vez de taparlo.** La fórmula del MITMS
> —*«Powered by MITRAMS»*, el enlace y la indicación de si el dato es bruto o procesado— la
> declaraba § 1.7 como *«colgada de la capa de trazados»*: la del **visor**, retirado el 22/08.
> Desde ese día la ficha decía «cumplida» y en la pantalla no había ni una palabra. Ahora está, y
> § 1.7 dice dónde.
>
> La del **dato municipal** sigue cumpliéndose además en
> **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)**, que es donde está lo que la Ley 37/2007
> pide y una línea no cabe: fuente, **fecha de la última actualización**, licencia y cómo volver a
> conseguirlo. La de OpenStreetMap se cumple **dos veces**, en el control del mapa y en el pie, y
> las dos con la palabra «colaboradores» literal.

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
