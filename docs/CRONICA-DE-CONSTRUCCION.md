# La construcción de Desplázame — crónica

> ⚠️ **REGISTRO FECHADO — era la sección «Estado» del README hasta el 2026-09-28; no se
> reescribe.**
>
> Esto es lo que el README contó **mientras se construía**, con sus fechas, sus cifras del día y
> sus «Aquí ponía». Se traslada **tal cual, byte a byte**: no se poda, no se actualiza y no se
> corrige. Un párrafo que envejeció **en su sitio** es el dato; reescribirlo lo borraría.
>
> Lo que hoy es verdad se dice en el [README](../README.md) y en el
> [CHANGELOG](../CHANGELOG.md). **Aquí se lee cómo se llegó.**
>
> ⚠️ **Sus enlaces relativos no resuelven desde aquí, y no se arreglan.** Se escribieron cuando
> este texto vivía en la raíz, así que apuntan a `CHANGELOG.md`, `docs/BITACORA.md`, `app/`… un
> nivel por encima de donde está ahora. **Tocarlos sería reescribir el registro**, que es justo
> lo que este documento promete no hacer. Los ficheros a los que apuntan existen todos: están en
> la raíz del repositorio o en `docs/`, y el [README](../README.md) los lista.

---

## Estado: ocho modos de punta a punta

> ⚠️ **Este repositorio está en construcción Y EN PRODUCCIÓN, y las dos cosas a la vez.** Desde el
> **8/09** vive en **<https://desplazame.antonioblanquez.es>** —Hostinger plan Node, servido desde
> `de-fra-web2061`—, con **auto-deploy por cron desde `main`**: cada push redespliega. Que se siga
> construyendo no lo vuelve inédito.
>
> ⚠️ **Este párrafo decía «arranca en local y no está publicado todavía en ninguna dirección»**, y
> siguió diciéndolo **dos días después** de que dejara de ser verdad. Se corrige aquí en vez de
> reescribirlo en silencio, que es la ley de la casa para los documentos que envejecen.
>
> Lo que ya funciona de punta a punta son **ocho modos en el motor**:
> andando, **bus y tranvía**, bici privada, patín (VMP), BiZi, **coche**, **moto** y **YeGo**. Se escribe de
> dónde a dónde, se elige el modo, se pulsa «Generar ruta», y la pantalla dibuja la ruta de verdad
> en el mapa y lista las indicaciones paso a paso.
>
> ⚠️ **Ocho en el motor y SEIS en la pantalla, y no es un descuadre**: hay **dos familias que se
> preguntan en dos pasos**. La bici privada y la BiZi son la misma —«Bici» y luego «¿Cuál?»— y
> desde el 5/09 la moto también —«Moto» y luego «Privada» o «Pública YeGo»—, así que la botonera
> enseña seis: Andando · Bus/Tranvía · Bici · Patín (VMP) · **Moto** · Coche. Este README
> distingue las dos cuentas a propósito, porque **no son la misma cosa** y confundirlas es como ha
> envejecido tres veces. ⚠️ **Y ha envejecido una cuarta**: decía «siete y seis» desde el 5/09 por
> la mañana, y **YeGo entró esa misma tarde**.
>
> ⭐ **Y EL COCHE ESTÁ ENTERO DESDE EL 3/09** — motor y pantalla. Rutea con las restricciones de
> giro de OpenStreetMap respetadas, remata en un aparcamiento de bordillo o en uno **público** si el
> destino cae dentro de la Zona de Bajas Emisiones y el vehículo no puede entrar, y **se ve en
> Chrome**: elegir «Coche» revela dos preguntas —dónde aparcar y qué distintivo ambiental— y el
> viaje se pinta con su hito de aparcar, su tramo a pie y el aviso de la zona junto al paso por el
> que se entra. **Ya no queda ningún modo cortado en la pantalla.**
>
> ⭐ **Y LA MOTO ENTRÓ EL 4/09** — motor el mismo día que la pantalla, punto 13. **Rueda por la red
> del coche**, con sus giros vetados y sus velocidades [OMUZ: el carril bus no es suyo salvo donde
> esté señalizado multiuso], y **remata siempre en un aparcamoto** elegido por coste: no hay
> pregunta de dónde aparcar, porque la moto no elige — el art. 32 de la OMUZ la manda a lo suyo y
> el Reglamento 13291 la deja **exenta de la tasa**, así que el hito dice «(sin coste)» y ésa es la
> única cifra que se puede dar. De la Zona de Bajas Emisiones **hereda el régimen entero**: la
> misma pregunta del distintivo que el coche, compartida en el mismo grupo de radios, con su
> matrícula y su autorización. Lo que **no** hereda es la excepción del aparcamiento público: sin
> distintivo y con el destino dentro, el remate cae en un aparcamoto **de fuera** y se anda el
> resto. Aquí se sigue distinguiendo
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
> > **[35]** ⚠ desviada **Sube**
> > **[33]** **Av. Academia General Militar N.º 37**
> > 17 paradas · cada 8 min
> > **(Próximo bus)** próximo en 2 min (dato de las 18:32)
> >
> > **[35] [31]** **Transborda**
> > **[147]** **Av. Francisco De Goya N.º 83**
> > 10 paradas · cada 11 min
> > **(Próximo bus)**
> >
> > **Baja** en el poste **860 · Villa De Ansó / Avenida De América**
>
> ⭐ **Así se pinta hoy, en CINCO líneas (14/09)**, y está copiado de la pantalla y no de memoria:
> `COLOSO 2 → CALLE OVIEDO 5` en bus, leído en Chrome por CDP contra el motor en `127.0.0.1` con la
> build `main-RM24EPQM.js`. Los corchetes son los chips —la línea con su color, la ficha de contorno
> del poste— y los paréntesis, el botón. Cada papel va en su línea: **L1** la línea y la acción
> —con la marca «desviada» si la línea va desviada hoy—, **L2** dónde, **L3** los datos, **L4** el
> botón y **L5** la región de estado.
>
> ⚠️ **Aquí ponía el paso en frase corrida** —«**Sube** a la línea **35** en el poste **33 · Av.
> Academia General Militar N.º 37** — 17 paradas — **próximo en 2 min** (dato de las 16:56)»—, y
> dejó de ser verdad el 14/09. La L3 **no sale de leer la frase**: `17 paradas · cada 8 min` son
> **campos del paso** —`paradas` y `frecuencia`, que el motor manda desde `c1a7026`—, y la frase
> entera sigue viajando en `texto` para quien no pinte. Y el minuto **ya no va dentro del paso**:
> es la L5, la región del último intento.
>
> **⭐ Y de los demás postes se pregunta A PETICIÓN**, con un botón **«Próximo bus»** al lado de
> cada subida y cada transbordo. Cada pulsación vuelve a preguntar de verdad —nada se guarda—, y
> el resultado aparece en una región `role="status"` que **ya estaba en el DOM antes** de tener
> nada dentro, que es lo único que hace que un lector de pantalla lo anuncie [WCAG 4.1.3]. El
> botón **no se deshabilita mientras carga**: eso lo sacaría del orden de tabulación justo al
> pulsarlo. **En el tranvía no hay botón**, porque no hay a quién preguntar.
>
> ⭐ **Y esa región es LA ÚLTIMA VOZ del paso (14/09, bitácora nº53).** Si al generar la fuente
> calló, la región sale **vestida de advertencia** —«No hemos podido preguntar…», con su icono— y
> no hay tira aparte que diga lo mismo; en cuanto el botón contesta, **la advertencia se va** y
> queda el dato. Un mismo hecho se dice en un solo sitio, porque dos escritores del mismo hecho que
> no se hablan acaban diciendo cosas distintas: hasta ese día la tira seguía avisando de un silencio
> que el botón ya había roto.
>
> **Y la pantalla dice la línea como se lee en la calle**: el chip con **su color**, el **número de
> poste** en su ficha junto al nombre —`PA00033` es el **33** de la marquesina—, cuántas paradas se
> va dentro, y un **ribete** bajo cada tramo montado para que ninguna línea se pierda contra el
> mapa [WCAG 1.4.11: 3:1 contra los colores **adyacentes**]. El aviso de desvío va **en dos
> niveles** —el hecho siempre visible y el detalle detrás de un botón, la revelación progresiva del
> GOV.UK—: **arriba**, en el resumen de avisos, un renglón por línea con el hecho y su «detalles»
> —«La línea 35 va hoy desviada. detalles»—; y **en el paso**, junto al chip, la marca **⚠
> desviada**, icono y palabra, sin repetir la frase. ⚠️ **Aquí ponía que aparecía «dos veces con
> el mismo texto: arriba en la cabecera y al lado del hito»**, y dejó de ser verdad el 13/09 (fase
> B de la tanda 5): la tira del paso murió para no decir dos veces lo mismo. Leído en la pantalla
> el 14/09 con el desvío de la 35 vivo.
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
> > **Coge una bici**
> > **[81]** **Tauromaquia**
> > 2 bicis a las 18:32
> > **(Bicis ahora)**
> >
> > **Deja la bici**
> > **[179]** **Fray J. Garcés: Lerga Luna**
> > 22 anclajes a las 18:32
> > **(Anclajes ahora)**
>
> Las mismas cinco líneas que el bus, copiadas igual: `COLOSO 2 → CALLE OVIEDO 5` en BiZi, en
> Chrome contra el motor en `127.0.0.1` y la build `main-RM24EPQM.js`. La L3 es el campo
> `disponibilidad` del paso —`{cuantas, hora}`, bicis en el de coger y anclajes libres en el de
> dejar—, y cada botón vuelve a preguntar por su estación: pulsado «Bicis ahora», la L5 dijo
> «2 bicis disponibles a las 18:32». ⚠️ **Aquí ponía** «🚲 **Coge** una bici en la estación
> **Tauromaquia** — 11 bicis disponibles a las 12:57», con el número dentro de la frase, hasta el
> 14/09.
>
> La disponibilidad **se pregunta en cada ruta de BiZi y no se guarda**: es el feed dinámico de
> GBFS, y reutilizar la respuesta anterior sería contestar con un número que ya no es cierto. La
> sirve la API de la sede de zaragoza.es (§ 1.23 del notices), **sin clave**, y es **la primera
> fuente del proyecto que no se copia: se consulta**.
>
> ⚠️ **Si la API calla, la ruta sale igual y no se inventa nada**: se rutea con el inventario, los
> hitos salen **sin L3** —ni número ni hora— y **cada hito dice su silencio en su propia región**,
> vestida de advertencia: «No hemos podido preguntar cuántas bicis hay en la estación Tauromaquia
> ahora mismo: disponibilidad no verificada.» en el de coger, y «…cuántos anclajes libres hay en
> la estación Fray J. Garcés: Lerga Luna…» en el de dejar. Es la L5 del bus: el botón de ese hito
> la reescribe en cuanto la sede contesta. ⚠️ **Aquí ponía «un aviso dice que la disponibilidad no
> está verificada»**, que fue verdad hasta el 14/09: era **un** aviso para el viaje entero, sin
> paso, y la pantalla lo colgaba de los dos hitos a la vez. Desde `c1a7026` el motor lo parte en
> dos —bicis y anclajes— y cada uno lleva su `paso`. Leído con la sede **callada a propósito**:
> la respuesta del motor retocada en el navegador con la misma forma que él escribe, que es como
> lo mide la P23 de `app/e2e/pintura.mjs`. Y si el pedaleo pasa de 30 minutos se dice que
> **supera el tramo incluido del abono**, sin inventar precios — las tarifas cambian cuando el
> Ayuntamiento quiere y no están en este repositorio.
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
> **⭐ Y el selector tiene historia, que es la del reparto legal.** Hasta el 30/08 eran **cuatro**
> botones y «Bici / Patinete» mandaba `bici`, así que un patinete recibía la ruta de una bici:
> legal para la bici, ilegal para él en cuanto la calle pasa de 30. El 30/08 pasaron a **seis**,
> cada rueda con la suya. El 2/09 bajaron a **cinco familias** —[DOC sistemas de diseño · control
> segmentado] el rango del patrón es de 2 a 5 con etiqueta, y las dos bicis son la misma pregunta
> con dos respuestas, así que se fueron a una segunda fila—. Y el 4/09 volvieron a **SEIS** con la
> moto.
>
> **Hoy son SEIS FAMILIAS**: Andando · Bus/Tranvía · Bici · Patín (VMP) · Moto · Coche. Tres de
> ellas revelan una segunda pregunta cuando se eligen, y **ninguna está en gris: lo que no aplica
> no está** [DOC GOV.UK, revelado condicional]:
>
> | familia | qué revela |
> |---|---|
> | **Bici** | ¿Qué bici? — Privada / Pública BiZi. Son los dos modos del contrato, `bici` y `bizi` |
> | **Coche** | ¿Dónde aparcar? (azul · naranja · discapacitado · gratuito) **y** ¿Distintivo ambiental? |
> | **Moto** | el distintivo **y nada más**: la moto no elige dónde deja |
>
> El distintivo del coche y el de la moto son **el mismo grupo de radios**, no dos que se parecen:
> el mismo `fieldset`, la misma matrícula y la misma región de estado, porque [OMUZ] la Zona de
> Bajas Emisiones no distingue entre los dos. Cambiar de familia devuelve esas respuestas a
> sin-elegir — cada vehículo el suyo.
>
> **Y ya no queda ningún modo cortado en la pantalla.** El bus perdió su corte el 31/08, el coche
> el 3/09, y la moto nació sin él.
>
> La pantalla vive en [`app/`](app/): el formulario de cuatro campos, las seis familias, el mapa
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
> botón de **mi ubicación** —la diana, «Usar mi ubicación como origen» o «…como destino» para quien
> no ve el dibujo— en **los dos campos**, que rellena la calle y el portal con donde estás. No
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
> > **Sal de** **Calle Alfonso I 10** y dirígete hacia el suroeste por **Calle de Alfonso I** · 91 m
> > **Gira a la izquierda** hacia la acera · 150 m
> > **Gira ligeramente a la derecha** hacia **Plaza de España** · 96 m
> > **Paseo Independencia 3** está a la izquierda
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
> `ligera-derecha`— y la pantalla elige el dibujo; parsear el texto para ver si lleva la palabra
> «derecha» ataría el icono a la redacción. Son **quince** clases y **quince símbolos SVG** de
> Material, sin una sola dependencia añadida (`SIMBOLO_DEL_GIRO` en `app/src/app/buscador.ts`,
> y las fichas en § 1.37 del notices). Ocho son giros, más la salida y la llegada; las otras
> cinco son los **hitos** —coger, aparcar, subir y bajar— y el **transbordo**, que no son maniobras
> sino cambios de vehículo, y llevan la señal de lo que pasa ahí en vez de una flecha. La tabla es
> exhaustiva por tipos: el día que el contrato añada una clase, **la pantalla deja de compilar** en
> vez de pintar un hueco. Cumplió el 30/08.
>
> ⚠️ **Aquí ponía «doce clases y doce caracteres Unicode»**, con 🅿 y 🚲 de ejemplo, y dejó de ser
> verdad el 12/09 (`a67122a`, «los emojis mueren en toda la app»): un carácter lo dibuja la fuente
> del sistema, y la misma indicación salía distinta en Windows, en Android o como una caja vacía.
> Por lo mismo, los ejemplos de pasos de este README ya no llevan glifo delante: en la pantalla,
> el dibujo va en el círculo del carril.
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
> **Lo que sigue sin verse en la pantalla: NADA.** Los **ocho modos** viajan al motor y se pintan,
> repartidos en **seis familias** —YeGo fue el último, el 5/09; la moto, el 4/09; el coche, el 3/09—. ⚠️ Este
> párrafo decía «bus o tranvía y coche» hasta el 1/09 y
> «el coche, y nada más» hasta el 3/09, y las dos veces **el motor ya sabía contestar**: es la
> tercera y la cuarta vez que una frase de este README envejece varias pantallas por debajo del
> párrafo que sí se estaba releyendo. La primera fue la bici (29/08), y antes la entrada nº5 de la bitácora. **Se corrige
> diciéndolo**, que es lo único que ha funcionado hasta ahora — y por eso la frase de arriba ya no
> dice «no existe» sino «no se ve»: son dos cosas distintas.
>
> Así que hoy el repositorio es esto: **el método de trabajo, el plan, las licencias, una ficha
> por cada conjunto de datos que entra —algunas consultadas en vivo y no copiadas; el recuento
> exacto lo lleva el [notices](THIRD-PARTY-NOTICES.md), que es su sitio—, y un buscador que de
> verdad busca: andando, en autobús o tranvía, en bici, en patín, en BiZi, en coche y en moto, de
> portal a portal, con la ruta en el mapa y los pasos escritos debajo.**
>
> El README se publica igualmente desde el principio —el repositorio es público desde el
> primer commit— y por eso dice lo que hay, no lo que habrá.

**Lo que no cabe aquí vive al lado**, y es donde está lo interesante:

- **[`CHANGELOG.md`](CHANGELOG.md)** — qué trae cada versión publicada, en formato Keep a
  Changelog. Hoy una sola entrada, la del `1.0.0`.
- **[`PLAN-DESPLAZAME.md`](PLAN-DESPLAZAME.md)** — el plan por puntos: qué está hecho, qué toca
  ahora y qué queda.
- **[`docs/BITACORA.md`](docs/BITACORA.md)** — los fallos reales, con lo que daba verde mientras
  el fallo estaba vivo y la ley que salió de cada uno.
- **[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)** — cómo esto llega a producción: qué viaja y qué
  no, el guardián del build, dónde viven las variables, y lo que quedó por saber, con la
  instrucción exacta de qué mirar. Al día con lo medido por SSH el 26/09 — incluido el aviso de
  que **un push puede no disparar el despliegue**.
- **[`docs/auditoriafinal/EXTERNA.md`](docs/auditoriafinal/EXTERNA.md)** — la **verificación
  externa**: Lighthouse, axe, SSL Labs y el validador del W3C pasados sobre el sitio en
  producción, con sus informes guardados al lado. Con la nota y con lo que la nota esconde —una
  auditoría de accesibilidad que falla mientras la categoría marca 100— porque esto mide **la
  forma, no el fondo**.
- **[`docs/INVESTIGACION-EQUIPAMIENTOS.md`](docs/INVESTIGACION-EQUIPAMIENTOS.md)** — los datos
  abiertos del Ayuntamiento sondeados uno a uno: qué publican, por qué puerta, y en qué no
  coinciden entre sí.
- **[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)** — una ficha por conjunto de datos: de
  dónde salió, con qué licencia, y qué trae de roto.

---


---

## La versión anterior (también estaba en el README)

Esto es **un reinicio, no una migración**. Hubo un intento previo, con otro planteamiento, y
**no se hereda de él ni código ni documentación**. Pero tampoco se borra: está archivado y se
puede consultar.

- Rama: [`archivo/motor-vanilla`](https://github.com/ablanquez/desplazame/tree/archivo/motor-vanilla)
- Etiqueta: [`archivo/v1-motor`](https://github.com/ablanquez/desplazame/releases/tag/archivo/v1-motor)

---
