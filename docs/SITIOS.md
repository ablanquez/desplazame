# Ir a un sitio, y no solo a un portal

> **Documento vivo.** Salió del README el 2026-09-28 para que el escaparate cupiera en una
> lectura; aquí sigue creciendo. Resumen y enlace en el
> [README → Características](../README.md#características).

---

Los dos campos —origen y destino— admiten **una dirección o un sitio**. Un sitio es un destino
con nombre, y hoy son **820 equipamientos** del término municipal en **siete categorías**
—farmacias, hospitales, centros de salud, bibliotecas, colegios e institutos, guarderías y
universidades—, de los que **802 se pueden elegir**: los **18 que no traen coordenada** se quedan
fuera, y ninguno más.

**Y no se mezclan: primero se dice de qué se está hablando.** Cada campo son cuatro piezas en
fila —**diana · tipo ▾ · cajetín · nº**— y el desplegable acota la búsqueda a **una sola** categoría:
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
**[§ 1.16 a § 1.20 del THIRD-PARTY-NOTICES](../THIRD-PARTY-NOTICES.md)**, y su frescura son las
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

> > **Sal de** **Farmacia · Avda. de Navarra, 65** y dirígete hacia el este por
> > **Avenida de Navarra** · 66 m
> > …
> > **Calle El Coloso 2** está a la derecha
