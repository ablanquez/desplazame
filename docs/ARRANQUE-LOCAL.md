# Arrancarlo en local — el detalle

> **Documento vivo.** Salió del README el 2026-09-28: el escaparate se queda con el
> [arranque corto](../README.md#poner-en-marcha) —clonar, instalar, construir, arrancar,
> probar— y aquí vive **el porqué de cada paso**, que es lo que hace falta cuando algo no sale.

---

Hace falta **[Node](https://nodejs.org/)** y nada más. **Probado con Node 24.19.0 y npm 11.17.0**
—la versión de npm la fija `app/package.json`, en `packageManager`—.
**El repositorio declara `engines: { node: ">=22" }`**, en el `package.json` de la raíz y en el del
motor. ⚠️ **Aquí ponía «el mínimo de Node no consta: el repositorio no declara `engines`»**, y dejó
de ser verdad el 8/09 (`455374d`, el entry que pide el panel de Hostinger). Lo que sigue sin
constar es que **22** arranque de verdad: aquí solo se ha probado 24.19.0. Y por qué importa —
**el motor ejecuta TypeScript sin compilarlo**, y eso pide un Node reciente: con uno viejo no
arranca.

```bash
git clone https://github.com/ablanquez/desplazame.git
cd desplazame
npm install          # en la RAÍZ: son workspaces, instala los tres a la vez
```

> ℹ️ **`npm install` imprime avisos `allow-scripts` de esbuild y otros: es lo esperado y no
> bloquea nada.** Salen cuatro paquetes con `postinstall` sin ejecutar —`esbuild`, `lmdb`,
> `@parcel/watcher`, `msgpackr-extract`— y la orden sale con **0**. Demostrado en el clon limpio del
> bloque D de la auditoría de cierre: con esos mismos avisos, `ng serve` compiló y sirvió las
> páginas. Se dice aquí porque cuatro líneas con la palabra `esbuild` en amarillo, sin nada escrito
> al lado, son media hora de alguien comprobando si tiene un problema.

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
| **<http://localhost:4200/identidad>** | la identidad visual: los tokens medidos, con su contraste (9/09) |
| **<http://localhost:4200/creditos>** | los créditos y las fuentes, con su licencia y su enlace (10/09) |

> Son **cuatro páginas y dos tienen puerta**, las dos desde la franja del pie: `/creditos`, porque
> un aviso legal tiene que estar accesible «de forma permanente, fácil y directa» [RD 1495/2011],
> y `/identidad` **desde el 24/09**. Al panel se sigue llegando escribiendo su dirección, a
> propósito: es donde el ojo comprueba, y ese sitio no es el producto.
>
> ⚠️ **Aquí ponía que a la identidad también se llegaba solo escribiendo la URL, «a propósito»**,
> y ha dejado de ser verdad. Lo movió el hallazgo F-1 de la auditoría de cierre, que midió las dos
> mitades del problema y solo una estaba declarada aquí: no se llegaba —eso sí lo decía este
> párrafo— **y no se salía**, que no lo cubría ningún papel. La salida es el mismo «Volver al
> buscador» de `/creditos`; la llegada, un enlace «Identidad» en el pie de la portada. La razón
> por la que el panel se queda fuera no ha cambiado: es intranet y en producción **no existe**.
> ⚠️ Y antes de eso ponía «dos páginas y no hay barra que las una», que dejó de ser verdad el 9
> y el 10/09.
> Cualquier otra —incluida `/visor`, que fue una página hasta el 22/08— cae en el buscador por
> el comodín del router: ni pantalla en blanco ni 404.

> ⭐ **AL ABRIR NO HAY NINGÚN MODO MARCADO** (10/09) — y «Limpiar búsqueda» devuelve a eso
> mismo. ⚠️ **Aquí ponía «Andando es el modo que viene marcado al abrir»**, que era el defecto
> de la maqueta: nadie decide por quien busca que va andando, y el modo entra en la condición
> que enciende «Generar ruta». Las tres ruedas —bici privada, patín y
> BiZi— dan ruta desde el 29/08, el **bus y el tranvía desde el 31/08**, el **coche desde el 3/09**
> y la **moto y YeGo desde el 4 y el 5/09**. **Ya no queda ningún modo cortado**: los ocho viajan
> al motor, y ninguna ruta a pie se disfraza de otra cosa. ⚠️ **Aquí ponía «solo el coche conserva
> el corte»** hasta el 10/09 — y el propio Estado de arriba decía desde el 3/09 que no quedaba
> ninguno. Dos párrafos del mismo documento diciendo cosas distintas: eso es lo que pasa cuando
> una releída no llega a todas las páginas.
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

### Correr las pruebas

⚠️ **Aquí no había nada, y eso era el hallazgo D-1 de la auditoría de cierre.** Este README solo
nombraba `npm test` **para decir que las de pantalla no entran en él**, y ningún otro papel de la
raíz decía cómo correr las de unidad: quien probaba lo obvio —`npm run probar`, que la raíz
expone— se llevaba **dos rojos que no eran suyos**. Son tres órdenes y **una va primero**:

```bash
npm run build --workspace @desplazame/motor   # PRIMERO: emite motor/dist (tsc, ~2 s)
npm run probar                                # motor (node:test) + interfaz (Vitest)
npm run comprobar-tipos                       # los dos lados, con censo de ficheros
```

**Por qué el build va antes.** Una jueza del motor comprueba el **puente de arranque de
producción** (`motor/arranque.cjs`), y ese puente carga `motor/dist/servidor.js`, que **no viaja
en el repositorio** (`.gitignore:7`). Sin construirlo primero, esa jueza **se salta diciéndolo**:

```
﹣ ⭐ 5 · un lanzador que hace require() del puente lo pone a escuchar # necesita motor/dist —
  npm run build --workspace @desplazame/motor
```

Un *skip* que nombra su paso es información; el rojo que salía antes era ruido. Con el `dist`
hecho, corre como siempre.

**Y las de pantalla no entran en `npm run probar`**: son diez suites que conducen un Chrome de
verdad y necesitan la aplicación sirviendo. Van por su propia entrada, `npm run bateria` — ver
[«Y las pruebas de pantalla, a mano»](#comprobar-que-lo-que-contesta-es-lo-de-ahora), abajo.

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
  OK   tsconfig.app.json    limpio · 296 ficheros mirados
  OK   tsconfig.spec.json   limpio · 364 ficheros mirados
```

*(Salida del 14/09. Aquí ponía 295 y 361: el censo crece con cada fichero, y por eso se copia de
una ejecución y no se razona.)*

**Y las pruebas de pantalla, a mano.** Lo que vive en [`app/e2e/`](../app/e2e/) no entra en
`npm test`: son **diez guiones** —y `medir.mjs`, el instrumento que comparten— que conducen un
**Chrome de verdad** por CDP, sin una dependencia añadida. Necesitan **el motor levantado**
sirviendo la interfaz, y la mayoría aceptan la dirección como primer argumento, que es lo que
permite correrlos contra el `dist` y no solo contra `ng serve`. Miden lo que solo se ve en el
píxel: el contraste real, el aire entre piezas, los solapes, y los botones vivos contra sus
fuentes.

Desde el 24/09 tienen **entrada propia**, que es la que sabe qué argumentos pide cada una —son
seis convenciones distintas— y dónde dejar las capturas:

```bash
npm run bateria                  # las diez, en fila, con su resumen y su código de salida
npm run bateria:pintura          # una sola, por su nombre
npm run bateria -- --url=http://localhost:4300/   # contra otra dirección
```

Las capturas salen a `app/e2e/capturas/`, que está en el `.gitignore`: son el testigo de una
tirada concreta. Y a pelo siguen corriendo igual, que es lo que permite afinar una:

```bash
node app/e2e/pintura.mjs http://localhost:4200 <carpeta-de-capturas>   # la pintura del resultado
APP=http://localhost:4200/ node app/e2e/proximo-bus.mjs                # los botones, con la fuente viva
```

⚠️ **`localhost` y no `127.0.0.1` cuando sirve `ng serve`**, y es un hecho **medido hoy**
(25/09): el servidor de desarrollo de Angular **se ata solo a `[::1]`** —`netstat` dice
`TCP [::1]:4200 LISTENING`—, así que `http://127.0.0.1:4200/` **no contesta nadie**
(`ECONNREFUSED`) y `localhost` y `[::1]` dan **200**. El motor es otra historia: escucha en
`0.0.0.0` y en `[::]`, y por él se puede entrar de las tres formas.

> ⚠️ **Aquí ponía justo lo contrario** —«`127.0.0.1` y no `localhost`», porque en Windows
> `localhost` resuelve antes a `[::1]` y un `ng serve` viejo escuchando ahí te hace medir **su**
> página—. El riesgo que describía es real y sigue siéndolo contra el `dist` servido por el motor;
> lo que no decía es que contra `ng serve` **esa dirección no funciona en absoluto**. Se corrige
> en vez de reescribirlo en silencio: dejó de ser un buen consejo el día que alguien lo siguió.

ℹ️ **Y `MOTOR_LOG` es una captura de `stdout`, no el log diario del motor.** Las suites que
esperan una línea del arranque buscan `^motor: …` anclado, y `motor/logs/<día>.log` escribe cada
línea con su marca de tiempo delante (`2026-09-25T…Z I motor: …`): apuntar ahí **no casa nunca** y
da un tope de dos minutos que parece un fallo del producto. Se le da el fichero donde se esté
volcando la salida del motor.

### El arranque del bus, que es su comprobación

El motor declara al arrancar de dónde sale cada pieza del bus. Si algo falta, se ve aquí y no tres
pantallas más adelante:

```
motor: feed GTFS vivo (relevó a la semilla) — 20260623_AUZSA_Y_TRANVIA · 6883311 bytes
motor:   NAP 2026-06-30T13:20:04.661082 · vence 20261005 · 21 día(s) → VIGENTE
motor: red de bus LEÍDA del cocinado — 984 paradas · 170 patrones · 10588 transbordos · 64 ms
motor: escuchando en http://localhost:4200 (pid 13016)
motor: GET /api/poste-vivo?poste=N&linea=L pregunta a Avanza a peticion, sin guardar nada
motor: GET /api/estacion-viva?estacion=N&pide=bicis|anclajes pregunta a la sede igual
motor: GET /api/distintivo?matricula=0000XXX pregunta a la sede de la DGT y devuelve su frase
motor: ruta operativa de hoy — 74 sentidos · 24 detectados · 24 aplicados · 0 sin saber · 48 s
motor: festivo 20260914 — 10 sentidos sin calendario · 1 suplidos del cuadro web · 9 mudos (manda el feed) · 27 s
```

*(Copiado del log del 14/09, con el motor arrancado con `PORT=4200`; el defecto es el 3000. Aquí
ponía el arranque del 1/09 —34 días, 64 sentidos—, y desde entonces entraron dos rutas vivas, la
capa del festivo y diez sentidos más: § 1.25 y § 1.35 del notices.)*

Cinco cosas: **qué feed se está sirviendo** —la semilla o el vivo— y cuántos días le quedan; **la
red cocinada**; **el puerto y el pid**, que es contra lo que se comprueba que contesta el proceso
de ahora; **la ruta operativa de hoy**, que llega **después** de escuchar y sin que nadie la
espere — son setenta y cuatro peticiones a Avanza y el motor ya está sirviendo mientras tanto—; y
**el festivo**, la capa que suple con el cuadro de la web los sentidos que el feed deja sin
calendario.

### La API del motor, hoy

**Once rutas vivas** (`grep -cE "url\.pathname === '/api/" motor/src/servidor.ts`, 14/09). Las que
vengan las decide el plan, no esta lista.

⚠️ **Aquí ponía «Ocho», con el mismo comando delante**, y era verdad el 1/09, cuando se escribió.
Al día siguiente entró `estacion-viva`, el 3/09 `distintivo` y el 5/09 `area-yego`, y la tabla
siguió con ocho filas durante dos semanas: el comando estaba escrito, pero nadie lo volvía a
correr. Las tres filas nuevas van en su orden del servidor.

| | |
|---|---|
| `GET /api/salud` | si está vivo, y con qué dato: grafo, red andable —con cuántos nombres trae de OpenStreetMap y cuántos hereda del callejero municipal—, callejero y portales, con sus recuentos |
| `GET /api/vias?q=&foco=` | sugiere vías desde 2 letras, hasta 10 resultados. Sin `q`, lista vacía. `foco` es **el código del otro extremo** ya resuelto —un portal, un sitio o una vía sin portales—: a igualdad de coincidencia sube lo que está cerca de él, y **no descarta nada**. Devuelve `portales`, y un **`0` significa que esa vía no tiene ninguna puerta que elegir**: se resuelve por el punto medio de su geometría |
| `GET /api/portales?via=` | todos los portales de esa vía, ya ordenados. Sin `via`, lista vacía — y **lista vacía también en las 619 sin portal**, que es la verdad: no tienen ninguno |
| `GET /api/sitios?q=&capa=&foco=` | sugiere **sitios** desde 2 letras, hasta 10 resultados — la otra capa del autocompletar, la que sirve al desplegable de tipos. `capa` acota a una categoría (`farmacia`, `hospital`, `centro-salud`), y **una capa que no existe se ignora** en vez de dar error. `foco` es **el código del otro extremo** ya resuelto —un portal o un sitio, no un par de coordenadas—: a igualdad de coincidencia sube lo que está cerca de él, pero no descarta nada. Sin `q`, lista vacía |
| `GET /api/portal-cercano?lat=&lon=` | el portal más cercano a un punto, con su vía y sus metros. Barre los 46.150 en **1,35 ms** medidos. Sin coordenadas válidas, `null` |
| `POST /api/ruta` | la ruta entre dos extremos, por códigos —un portal, un sitio, o **una vía sin portales, que viaja con su propio código en las dos casillas** (`{via: '23125', portal: '23125'}` es el Puente de Piedra)—: geometría, pasos escritos, metros y duración derivada. **Es la que llama «Generar ruta»**. Medido sobre 200 peticiones HTTP a portales al azar de toda la ciudad: **p50 22 ms, p95 35**. El Dijkstra son ~10 de esos milisegundos; el resto es escribir los pasos y serializar —**22,9 pasos y 13,5 kB** de media, que eran **23,3 pasos** en las mismas 200 peticiones antes de los combines de odin—. Sin ruta, un aviso que dice por qué. **`modo` es opcional y vale `andando` si falta** (`andando` · `bus` · `bici` · `patin` · `bizi` · `coche` · `moto` · `yego`; **ya no falta ninguno** desde el 2/09, y son **ocho** desde el 5/09). ⭐ **Con `bus` la respuesta trae tramos MONTADOS**: cada uno con su `linea` —código corto, nombre largo, color y modo `bus`/`tram`— y sus pasos de hito `sube`, `transborda` y `baja`, con el número de poste, cuántas paradas se va dentro y la espera. Medido hoy sobre 200 peticiones HTTP a portales al azar (semilla 7, el mismo método que las demás filas): **p50 750 ms, p95 2.810, máximo 6.370**, y **133 de 200** dan ruta en autobús. ⚠️ **De esos 750 ms, el motor pone 36**: el mismo viaje resuelto sin salir a la red da **p50 36 ms y p95 74** — con las mismas 133 resueltas—, así que **lo demás es la consulta viva a Avanza** del primer poste. Es el precio de decir un minuto de verdad en vez de una estimación, y va dicho en vez de escondido. **`ruta` también es opcional y vale `equilibrada`** (`rapida` · `equilibrada` · `tranquila`): la miran `bici` y `bizi`, y **el `patin` la ignora** — su vía ciclista es obligatoria, así que lleva el calibrado fuerte pida lo que pida. Medido el 30/08 en `Portales.120344 → Portales.110047` en bici: rápida **1.554 m / 5,7 min / 150 m de Avenida de Madrid**, equilibrada **1.565 / 5,7 / 110**, tranquila **1.710 / 6,2 / ninguno**. ⭐ **Y desde el 30/08 la respuesta puede traer HITOS**: `aparca` en bici y patín —el aparcabicis donde se deja el vehículo— y `coge` + `aparca` en BiZi —las dos estaciones—. Un hito es un paso propio con `metros: 0`, porque no abre tramo: es una parada. Medido con las MISMAS 200 peticiones el 30/08 (semilla 7 sobre el censo): andando **p50 23,3 ms · p95 40,3**, bici **24,6 · 39,9**, patín **17,6 · 98,4**, BiZi **88,4 · 164,4**. ⚠️ **La BiZi cuesta cuatro veces más que las demás, y es la red**: cada ruta pregunta en vivo a la API de la sede (§ 1.23), que contesta en ~0,3 s la primera vez y en ~0,08 las siguientes. Es el precio de no mentir con un número guardado. Y en esas mismas 200: andando resuelve 197, bici 196, BiZi 197 y **el patín 98** — eran 35 antes del **defecto legal del art. 50 RGC**, 51 después, 83 desde el empuje, y **98 desde el remate**: al no necesitar ya una puerta rodable en el destino —le basta con llegar al aparcabicis y andar—, quince pares más tienen ruta. De las que resuelven, llevan hito **167 de 196** en bici y **196 de 197** en BiZi. El arranque lo declara capa a capa. ⭐ **Y con `coche` (2/09) la búsqueda va POR TRANSICIONES**, no por nodos: una restricción de giro no prohíbe una arista, prohíbe **pasar de una a otra**, y un Dijkstra que solo recuerda el mejor coste por nodo no puede obedecerla [GraphHopper: *«requieren recorrido edge-based del grafo»*]. Las **1.378 transiciones vetadas** de la casilla 1a se respetan, y las penalizaciones de `car.lua` —la sigmoide del giro, los 2 s del semáforo, los 20 de la media vuelta— **entran en el tiempo publicado**, porque en la fuente se suman a `turn.duration` y no solo al peso. Medido hoy sobre 200 peticiones HTTP a portales al azar (semilla 7, el mismo método que las demás filas, `pid` del log = `pid` que contesta): **p50 26 ms, p95 53-57, máximo 78-89** —dos pasadas, antes y después del arreglo de la entrada nº30, para que se vea el ruido del p95—, con **189 de 200** resueltas las dos veces, **16,4 pasos** y **12,1 kB** de media. ⚠️ **Las 11 que no resuelven no son un fallo del motor**: el 98,15 % de los portales enganchados tiene ida y vuelta al centro, y lo que queda son fondos de saco del viario y dos cruces que el propio OSM cierra —ver la ficha del viario—. ⭐ **Y si la ruta pisa la Zona de Bajas Emisiones, la respuesta trae su aviso con `paso`**: el índice del paso por el que se entra, para que la pantalla lo pinte arriba **y** junto a ese paso sin tener que adivinarlo leyendo el texto. **Avisa, no veta**: la app no sabe qué distintivo lleva el coche. En esas 200, **25 de las 189** lo traen. ⭐ **Y desde el 3/09 el coche tiene DOS parámetros más** (punto 12, casilla 2), los dos opcionales y con la misma ley que `modo` y `ruta`: sin ellos, la respuesta es la de la casilla 1b **al byte** —medido, sha256 de los 36 trayectos de los seis modos idéntico al de `8763c64`—. **`aparcamiento`** (`azul` · `naranja` · `discapacitado` · `gratuito`) remata *car-to-park* [DOC OTP2: *«conducir al aparcamiento y andar el resto»*]: la respuesta trae **dos tramos**, el primero `rodando` con `hito: "aparca"` y el segundo `andando`. El sitio se elige **POR COSTE** —conducir más andar por `walkReluctance` 4,0—, no por radio: un tope de distancia sería la misma anti-doctrina que los 500/800 m del bus, retirados el 31/08. Los cuatro montones salen de § 1.11 y § 1.13 filtrando por `tipo_actual` y por `TIPO`, y **los 28 tramos que el censo no clasifica no entran en ninguno**. El paso del hito dice lo que el dato dice y nada más: «zona azul (rotación)», «zona naranja (residentes)», «plaza PMR (horario: permanente)» —el horario, literal, con sus 104 formas—, «estacionamiento gratuito (sin coste)»; **ni tarifa ni franja, porque § 1.11 no las trae**. **`puedeEntrarEnLaZbe`** (sí/no) traduce la FAQ oficial a la única pregunta que el motor puede hacer: con `false` y **dentro de la franja L-V 8:00-20:00**, la Zona de Bajas Emisiones se veta —en la búsqueda y como sitio donde aparcar—. ⭐ **Y desde el 3/09 un destino DENTRO de la zona ya no se contesta con «no hay ruta»** (punto 12, casilla 2-bis): la ordenanza municipal deja entrar precisamente para ir a un aparcamiento público conectado [§ 1.32, trámite 42155, literal: *«Vehículos que accedan a estacionamientos públicos con sistema de control de acceso conectado»*], así que la ruta **remata en el mejor POR COSTE de los cuatro aparcamientos públicos que caen dentro de la fase 1** —Plaza del Pilar - Juzgados, Ayuntamiento, César Augusto y Puerta Cinegia, cruzados al cocinar en `app/data/parkings-zbe.json` (§ 1.31)— y se anda el resto. Callarlo es lo que hace la industria [TomTom SDK, literal: *«avoidance is not guaranteed if no alternative route exists»*]; la alternativa aquí es legal y se ofrece. ⚠️ **La zona se ENTRA, no se ATRAVIESA**: el aparcamiento está dentro, así que llegar a su puerta pisa aristas de la ZBE por fuerza, y lo que se prohíbe es la transición dentro → fuera. Con una excepción medida —salir **para rematar**, y ahí se acaba—, porque `Puerta Cinegia` engancha a **58,6 m**, en Plaza España, a una arista de fuera a la que solo se llega desde dentro: sin esa excepción se quedaba sin ruta y desaparecía del reparto, y es la que deja el paseo más corto. Medido sobre 122 portales del casco: **0 rutas atraviesan la zona**, el coste elige distinto que la recta en **17**, y ganan los cuatro (César Augusto 52 · Puerta Cinegia 30 · Pilar-Juzgados 25 · Ayuntamiento 15). Por HTTP contra el motor vivo (`pid` del log = `pid` que contesta): `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33` con `false` da **4.834 m en dos tramos** —rodando 4.538 + andando 296, 17 pasos, 33 ms— y con `true`, **3.386 m en uno** —14 pasos, 16 ms—. ⚠️ **Lo que NO se promete**: ni que ese aparcamiento siga abierto —el catálogo 55 sella sus filas en **2013**— ni que tenga el «sistema de control de acceso conectado» que la norma pide, porque ese campo no existe en el dato: el aviso cuenta la norma y manda al registro municipal. Y **el ORIGEN dentro sigue sin remate**: de ahí no se sale sin pisar la zona. Fuera de la franja **no se veta nada** y el aviso lo dice con la hora que ha mirado; el reloj entra por parámetro, como la fecha del bus, para poder mentirle en las jueces. Medido hoy sobre 200 peticiones HTTP (semilla 7, `pid` del log = `pid` que contesta): sin parámetros **p50 26 ms, p95 56**; `gratuito` **56 · 767**; `discapacitado` **53 · 440**; `regulado` **262 · 822** —medido el 3/09, cuando `regulado` era **los dos montones juntos**; desde el reparto del 4/09 son `azul` (664 tramos) y `naranja` (495), y esos números **no se han vuelto a medir**—; con el veto de la ZBE **24 · 53**. ⚠️ **El remate cuesta diez veces más, y se sabe dónde**: de los 332 ms de un `regulado` de entonces, **324 son los 40 Dijkstras del peatón** —uno por candidato— y **8 la búsqueda del coche**, que es una sola para los cuarenta. Recortar candidatos no es gratis: medido sobre ~58 viajes al azar, con 5 el ganador cambia en 32 de 58 casos del `gratuito` y se pierden hasta 2.640 s de coste ponderado. ⭐ Y con aparcamiento **resuelven 195 de 200** contra 189 sin él: hay portales a los que el coche no llega y cuyo bordillo de al lado sí. ⭐ **Y desde el 4/09 hay `moto`** (punto 13, casilla 1): **rueda por la red del coche** entera —sus giros vetados, sus velocidades, su sentido único— porque es lo que la ordenanza dice, y **el carril bus no es suyo** [OMUZ: solo donde esté señalizado multiuso]. **Ignora `aparcamiento`**: si llega en la petición **no se contesta con error, se descarta** —la ley que `ruta` estrenó el 30/08—, porque la moto no elige dónde deja: **remata SIEMPRE en un aparcamoto**, elegido por coste entre los 40 candidatos más cercanos en recta (poda de rendimiento, no radio), y el hito dice «Aparca en el aparcamiento de motos de X **(sin coste)**» — la exención es del [Reglamento 13291: las motocicletas están exentas de la tasa], no una promesa nuestra. De la ZBE **hereda los dos parámetros y el régimen entero**, `puedeEntrarEnLaZbe` incluido; lo que **no** hereda es la relajación del aparcamiento público del coche —un aparcamoto de calle no tiene control de acceso conectado—, así que con **`false` + destino dentro de la franja** el remate cae en un aparcamoto **DE FUERA** y se anda el resto. Medido por HTTP contra el motor vivo (`pid` del log = `pid` que contesta), `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33`: el normal **3.513 m** en tres tramos —2.782 rodando fuera de la zona, 592 dentro, 139 andando; 17 pasos, 525 s— y el `no + dentro` **4.705 m** en dos —4.228 rodando sin pisar la zona y 477 andando; 16 pasos, 756 s—. Y **ningún otro modo ha aprendido a aparcar motos**: el sello de los seis de antes, idéntico. ⭐ **Y desde el 14/09 el `Paso` trae tres campos OPCIONALES más** (`c1a7026`, contrato en `abb87a1`), que son lo que la pantalla pinta en la L3 **sin leer la frase**: **`paradas`** —cuántas se va dentro, en `sube` y `transborda`— y **`frecuencia`** —el intervalo del patrón en minutos, en los mismos dos—, y **`disponibilidad`** `{cuantas, hora}` en los hitos de BiZi: bicis en `coge`, anclajes libres en `aparca`, con la hora ya escrita en la de Zaragoza. **Solo viajan donde el motor ya los sabe**: una estación sin estado no lleva `disponibilidad`, y un paso que no es de ésos no lleva ninguno. **La frase no cambia**, y los ocho modos salen **byte a byte iguales** fuera de los campos nuevos —sha256 del JSON entero normalizado, la juez 14 de `motor/src/muralla-modos.spec.ts`—. Y con la sede de la BiZi callada, el aviso ya no es uno para el viaje entero: **son dos, uno por hito, con su `paso`** —«cuántas bicis hay en la estación X» y «cuántos anclajes libres hay en la estación Y»— |
| `GET /api/poste-vivo?poste=&linea=` | **Cuándo pasa el próximo de esa línea por ese poste**, preguntado a Avanza **en el momento** (§ 1.24 del notices). Es lo que contesta el botón «Próximo bus». **Idempotente** y con `Cache-Control: no-store`: cada pulsación vuelve a preguntar de verdad — un «en 3 min» servido de la caché cuarenta segundos después no es viejo, es **falso**. **Single-flight por poste**: dos peticiones simultáneas del mismo poste comparten una sola visita a la fuente. Contesta uno de **tres estados**, con su frase ya compuesta: `llega` («próximo en 4 min (dato de las 16:29)»), `ausente` («Avanza no anuncia ningún próximo…» — que es **sin información**, no «sin servicio») y `mudo` («disponibilidad no verificada»). Un poste o una línea que faltan son **400**; un poste que Avanza no conoce es `mudo` y **200**, porque no saberlo no es un error de quien pregunta. Medido hoy contra la fuente viva: poste 1203 línea 29 → `ausente` en **2,26 s**; poste 1000 línea 53 → `llega`, «próximo en 4 min», en **2,38 s** |
| `GET /api/estacion-viva?estacion=&pide=` | **Cuántas bicis o cuántos anclajes libres tiene esa estación de BiZi ahora** (§ 1.23 del notices), con `pide` = `bicis` o `anclajes`. Es lo que contestan los botones **«Bicis ahora»** y **«Anclajes ahora»** de los dos hitos. El mismo trato que `poste-vivo`: idempotente, `Cache-Control: no-store` y *single-flight*. Tres estados con su frase ya compuesta: `hay` («2 bicis disponibles a las 18:32», leído en la pantalla el 14/09), `ausente` y `mudo` («No hemos podido preguntar cuántas bicis hay en la estación X ahora mismo: disponibilidad no verificada.»). Una estación que no es un número o un `pide` que no es ninguno de los dos son **400** |
| `GET /api/distintivo?matricula=` | **El distintivo ambiental de una matrícula**, preguntado a la sede de la DGT (§ 1.36 del notices). Cinco clases: `etiqueta` —con `distintivo` `0`, `ECO`, `C` o `B`—, `sinDistintivo`, `noExiste`, `formato` —la matrícula no tiene forma de tal y no se llega a preguntar, **400**— y `mudo`. ⛔ **La matrícula no se guarda ni se escribe en el log**: entra por la URL, se pregunta y se tira, y por eso aquí no hay caché ninguna, solo *single-flight* por matrícula |
| `GET /api/area-yego` | **El área de servicio de YeGo, para pintarla** (§ 1.34 del notices): sus manchas en `[lat, lon]`, huecos incluidos. Sale de **la misma función** con la que el viaje en YeGo decide si un destino se puede alcanzar, para que el mapa no pinte una zona y el motor corte por otra. `no-store` |
| `POST /api/renovar-feed` | **El disparador del cron nocturno**, que trae del NAP la última publicación del GTFS y la escribe al lado de la semilla. El token va **en la cabecera `Authorization: Bearer …`** y nunca en la URL, que se queda en los logs. **`503`** si no hay token configurado en el servidor —falla cerrado y no ejecuta nada—, **`401`** si el que llega no es el bueno, **`409`** si ya hay una renovación en curso, y **`202`** cuando arranca: se contesta antes de empezar para que ningún *timeout* del hosting mate el trabajo a medias. El zip nuevo **se sirve al próximo arranque**, no en caliente |

En desarrollo el `4200` las reenvía al `3000` con un proxy, así que la interfaz siempre pide a
`/api/…` y no sabe en qué puerto vive el motor.

---
