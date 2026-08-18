# Bitácora de fallos

> El registro crudo de los fallos reales, escrito EN CALIENTE.
> No es un changelog ni una guía. Cuenta EL CASO: qué pasó, qué dio verde
> mientras pasaba, y cómo se cazó.
>
> Campo estrella (⭐): se captura al DESCUBRIR el fallo, antes de
> arreglarlo. Es el dato perecedero.
>
> Una entrada por fallo. No se fusionan.
> `NO CONSTA` = lo busqué y no está. `⏳ PENDIENTE` = aún no ha ocurrido.
>
> Orden cronológico inverso: lo más reciente, arriba.

---

## [2026-08-18] ✅ CERRADA — El README juraba que no había «ningún dato integrado» con ocho dentro, y la regla de releída daba verde porque solo miraba el otro párrafo

**Categoría:** documentación que caduca
**Síntoma:** en «Licencia y créditos», el README dice: *«Hoy el repositorio **no
tiene ningún dato integrado** —ni cartografía, ni callejero, ni paradas—, así
que todavía no hay nada que atribuir»*. Falso: hay ocho conjuntos dentro, y el
párrafo nombra el callejero, que está cargado en el motor. Tres pantallas más
arriba, el mismo fichero enumera los siete dibujables con sus cifras. Se
contradice consigo mismo, en un repositorio público.
**⭐ Qué dio verde mientras el fallo estaba vivo:** **la propia regla transversal
del plan**, la que salió de la entrada nº1 de esta bitácora: *«todo encargo que
crea algo nuevo tiene que releer lo que la portada afirma sobre su ausencia»*.
Se cumplió, encargo tras encargo, y cada vez dio verde. La cuenta, ejecutada
antes de tocar nada:
```
$ git log --oneline -S "no tiene ningún dato" -- README.md
1f2498d docs(readme): que va a ser, estado y licencias

$ git log --oneline --ancestry-path a35ffc9..HEAD -- README.md | wc -l
13
```
Trece commits de README **después** de que el dato entrara, y el párrafo con una
sola línea de historia: la de su nacimiento. Nadie lo tocó porque nadie lo miró
— la releída iba siempre al párrafo de «Estado», que sí se ajustó trece veces
(«cuatro datos» → «seis» → «siete», el motor, el autocompletar, los corchetes,
el portal). El instrumento existía, se ejecutaba y salía verde; su ALCANCE real
era más estrecho que el documento que decía vigilar.
Y hay un agravante escrito de antemano: el cierre de la entrada nº1 ya avisó de
que *«el arreglo no creó ningún instrumento… la vigilancia es humana, así que
este fallo puede repetirse»*. Se repitió.
**Cronología:** el párrafo nace con el primer README (`1f2498d`, 16/08) cuando
era verdad. Se vuelve falso en `a35ffc9` (16/08 16:39:50), que es justo el
commit que **escribió la atribución de los portales** en el notices — decía «no
hay nada que atribuir» el día en que se atribuyó. Dos minutos después el dato
aterrizaba en `3de058c`. Ha sobrevivido 2 días y 13 commits de portada.
**Cómo se cazó:** ojo humano — el del ejecutor, aplicando la costura §6 de un
encargo que tocaba otra cosa (el selector de portales). No lo cazó la regla.
**Causa raíz:** la regla decía «releer lo que la portada afirma sobre su
ausencia», pero se ejecutaba como «releer el párrafo donde solemos anunciar lo
que hay». Es un desajuste entre el enunciado y el gesto, y sobrevivió porque
nada obligaba a comparar los dos: cada encargo cerraba con la portada ajustada
—de verdad, y trece veces— y esa sensación de deber cumplido tapaba lo que no
se había mirado. El párrafo podrido estaba además en la sección que el encargo
de licencias dio por buena el primer día y ningún encargo posterior volvió a
abrir: era la única parte del README que nadie tenía motivo para leer.
No es un fallo de una persona distraída: es un instrumento cuyo alcance real
nadie midió. Y estaba avisado — el cierre de la entrada nº1 dejó escrito que no
se había creado ningún instrumento y que el fallo podía repetirse.
**Arreglo aplicado:** `README.md`, sección «Licencia y créditos». El párrafo
pasa a decir lo que hay —los ocho conjuntos, de dónde sale cada uno, y dónde se
cumple cada atribución: la de OpenStreetMap en el control del mapa, comprobada
en el bundle servido (`colaboradores de OpenStreetMap`), y la del dato municipal
en el notices, ficha por ficha—. Con **rectificación visible** debajo, patrón de
la del notices §1.2: qué decía, desde cuándo era falso y por qué sobrevivió.
La tabla de licencias que hay encima no se tocó: ya decía la verdad.
Al escribirlo me equivoqué yo mismo en la cuenta —enumeré nueve conjuntos y
escribí «ocho»—; se cazó contando contra las fichas del notices antes de
comitear, no después.
**Commit:** `c0f449c` (el arreglo). La captura, antes de tocar el README:
`7360469`.
**Ley que sale de aquí:** una regla de releída vale lo que su ALCANCE, no lo que
su enunciado promete. Si en la práctica el ojo va a un párrafo, solo ese párrafo
está protegido: el resto del documento envejece **con la regla dando verde**, que
es peor que sin regla, porque la regla cumplida se siente como cobertura. Al
releer, la unidad es el DOCUMENTO, y la pregunta no es «¿qué he cambiado yo?»
sino «¿qué afirma este fichero que hoy sea mentira?».
**Traza:** `README.md`, sección «Licencia y créditos», el párrafo `> ℹ️` que
sigue a la tabla de licencias · nacido en `1f2498d` · falso desde `a35ffc9` ·
mismo género que la entrada nº1 de esta bitácora, que es de donde salió la
regla que aquí dio verde.

## [2026-08-18] ✅ CERRADA — Escribir la calle y salir sin elegir desbloqueaba «Generar ruta» sin código de vía fijado

**Categoría:** validación de formulario
**Síntoma:** en el campo de calle se escribe cualquier cosa —basta con que no
esté vacío— y se sale con Tab o con un click fuera, sin tocar el desplegable.
El texto se queda puesto y el formulario lo cuenta como campo relleno: con los
cuatro campos así, «Generar ruta» se desbloquea y genera. No hay ninguna vía
elegida detrás: el código de vía es `null` en los dos extremos. El campo no
distingue «escrito» de «elegido», y la decisión del encargo anterior era que
solo ELEGIR fija el código.
**⭐ Qué dio verde mientras el fallo estaba vivo:** las 18 pruebas, y dos de
ellas no es que no cubrieran el caso — lo **exigían**. `app.spec.ts` escribe
texto crudo en las dos calles (`escribir(raiz, 'calleOrigen', 'Don Jaime I')`,
sin pasar por el desplegable) y afirma `expect(botonGenerar(raiz).disabled).toBe(false)`.
Ejecutadas antes de tocar nada, con el fallo vivo:
```
$ npm test -- --reporters=verbose
 ✓ src/app/app.spec.ts > App > con los cuatro campos genera los tres pasos de prueba, marcados como prueba 37ms
 ✓ src/app/app.spec.ts > App > el modo elegido es el que se muestra en el resultado 49ms
 ✓ src/app/app.spec.ts > App > con tres de los cuatro campos, el botón sigue bloqueado 32ms
 Test Files  3 passed (3)
      Tests  18 passed (18)
```
La tercera pasaba por el motivo equivocado: daba bloqueado por el portal vacío,
no por las calles, que tampoco estaban elegidas. Y el checkpoint entero se dio
por bueno con este verde delante.
**Cómo se cazó:** ojo humano — Antonio, en la primera sesión de uso real de la
pantalla, con el checkpoint ya aceptado.
**Causa raíz:** el código y la prueba compartían la MISMA premisa falsa —«campo
con texto = campo relleno»— y por eso no podían contradecirse. `sePuedeGenerar()`
validaba `calleOrigen()`/`calleDestino()`, que es el texto; y la prueba rellenaba
ese mismo texto a pelo (`campo.value = …` más un evento `input`), que es
justamente el único camino que el código miraba. La prueba nunca ejercitó el
gesto del usuario —escribir, esperar los 200 ms, pulsar la sugerencia—: entraba
por el atajo que producía exactamente el estado que el código daba por bueno. Un
instrumento que asume lo mismo que el vigilado solo puede darle la razón.
Y el dato estaba bien: `alEscribir()` ya emitía `null` al teclear, así que el
código de vía era correcto en todo momento. Nadie lo miraba.
**Arreglo aplicado:** `app/src/app/app.ts` → `sePuedeGenerar()` pasa a mirar
`viaOrigen() !== null` y `viaDestino() !== null`, no el texto.
`app/src/app/autocompletar-via.ts` → el campo aprende a distinguir los dos
estados: `elegida` (la vía, o nada), `tocado` (si ya se salió alguna vez),
`esBorrador` (texto sin vía) y `marcado` (`tocado && esBorrador`); `alSalir()`
moja el campo, `alEscribir()` tira el código fijado, `elegir()` lo fija.
`autocompletar-via.html` → `aria-invalid`, `aria-describedby` y el mensaje
«Elige una calle de la lista: escribirla no basta.». `autocompletar-via.css` →
el ámbar que la pantalla ya usaba (`#b45309`/`#fff4e5`/`#7c3d00`); rojo no,
porque un borrador no es un error sino algo a medio hacer.
Y se arregló el instrumento: `app/src/app/app.spec.ts` ahora elige por el gesto
de una persona, con el motor fingido. De 18 pruebas a 24, las seis nuevas
nacidas en rojo y con su contraprueba. Verificado además en Chrome por Antonio:
borrador marcado, reapertura del desplegable, «Generar» bloqueado, edición que
invalida y vaciado que limpia.
**Commit:** `5624507` (el arreglo) y `776598a` (las pruebas). La captura de esta
entrada, antes de tocar código: `98c1633`.
**Ley que sale de aquí:** si un campo exige un código, la validación mira el
código, nunca el texto que se ve. Y una prueba que rellena por el atajo en vez
de por el gesto del usuario no deja de cubrir el fallo: lo fija.
*Añadido al cerrar (2026-08-18):* un instrumento que rellena por el mismo camino que el
código valida no vigila nada —comparten la premisa y solo pueden darse la
razón—. La prueba tiene que entrar por donde entra la persona.
**Traza:** `app/src/app/app.ts` → `sePuedeGenerar()`, que mira
`calleOrigen()`/`calleDestino()` (texto) y no `viaOrigen()`/`viaDestino()`
(la vía elegida) · `app/src/app/autocompletar-via.ts` → `alSalir()`, que cierra
el desplegable sin decidir nada sobre lo escrito · `app/src/app/app.spec.ts`.

## [2026-08-17] ✅ CERRADA — El sha256 del dato cuadraba en mi disco y NO es el que recibe quien clona: git le cambia los bytes al salir

**Categoría:** instrumento que no identifica lo que mide

**Síntoma:** el grafo (`app/data/grafo-visor.js`, 22,8 MB en una sola línea) se copió byte a
byte y la comprobación de integridad dio idéntico: mismo tamaño, mismo sha256 que el origen.
Pero `core.autocrlf = true` y no hay `.gitattributes`: al hacer *checkout*, git convierte el
único `\n` final en `\r\n`. **El fichero que recibe quien clona pesa un byte más y tiene otra
huella.** El sha256 que la ficha del notices declara como identidad del dato es el de mi disco,
no el del repositorio. Al portales no le pasa: no tiene salto de línea, así que no hay nada que
convertir — y por eso el fallo no se vio con la primera pieza.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la comprobación de integridad prescrita, y
también el blob de git. Las dos ciertas, y las dos midiendo lo que no era. Ejecutado antes de
tocar nada:

```
$ sha256sum app/data/grafo-visor.js                        # mi árbol de trabajo
d7d03aed71990d1ca5233955bff0940bda455422e6fd51dd755eb9c07f5cc717
$ sha256sum <origen en la OLD>
d7d03aed71990d1ca5233955bff0940bda455422e6fd51dd755eb9c07f5cc717
$ git cat-file -p HEAD:app/data/grafo-visor.js | sha256sum # el blob guardado
d7d03aed71990d1ca5233955bff0940bda455422e6fd51dd755eb9c07f5cc717
```

Y lo que recibe de verdad quien clona el repositorio:

```
$ git clone <repo> clon && cd clon
$ wc -c   app/data/grafo-visor.js  -> 23925690        (el origen: 23925689)
$ sha256sum app/data/grafo-visor.js
7f7304080cc9b2aaf9f690216834837220021540d7af249705b7ab1b1183f56a
```

**Cómo se cazó:** el aviso de git al commitear —«LF will be replaced by CRLF the next time Git
touches it»—, que llevaba saliendo en todos los commits desde el primero y que hasta hoy había
tratado como ruido. Sobre un fichero de una sola línea dejó de ser ruido.

**Causa raíz:** la medida cubría el trayecto equivocado. Comparaba **origen contra copia**, que
son las dos puntas de un `cp` y coinciden por construcción; el trayecto que altera los bytes es
**commit → checkout**, y ése no lo tocaba ninguna comprobación. Git no guarda ficheros, guarda
contenido normalizado: con `core.autocrlf=true` y sin `.gitattributes` decide por heurística que
un fichero es «texto» y le reescribe los finales de línea **al salir**. Y hubo suerte engañosa:
el portales no tiene saltos de línea que convertir, así que la primera pieza pasó limpia y dejó
la comprobación acreditada cuando ya era insuficiente.

**Arreglo aplicado:** `.gitattributes` en la raíz con `app/data/** -text` —no conviertas nada,
ni al entrar ni al salir— más `git add --renormalize app/data/` para que los blobs guarden los
bytes tal cual. Verificado como manda la ley nueva, **sobre un clon recién hecho**, no sobre mi
disco: `grafo-visor.js` sale con 23.925.689 bytes y `d7d03aed…`, y el portales con 10.835.605 y
`3c391d60…` — los dos idénticos a sus originales en la OLD.

**Commit:** `6a9cffa` (`fix(datos): gitattributes para que el dato salga del clon tal cual
entro`). La captura de esta entrada es `a9f05b5`, anterior al arreglo.

**Ley que sale de aquí:** una huella calculada sobre el árbol de trabajo **no acredita lo que
el repositorio entrega**. Git puede reescribir bytes entre el commit y el checkout, y lo hace
en silencio. Todo dato cuya integridad se declare tiene que verificarse **sobre un clon**, no
sobre el fichero que uno acaba de copiar — y todo fichero de datos tiene que quedar marcado
para que git no lo toque. Corolario: un aviso repetido que se asume como ruido es un fallo
esperando el fichero adecuado.

**Traza:** `app/data/grafo-visor.js` · `core.autocrlf=true` sin `.gitattributes` ·
ficha en `THIRD-PARTY-NOTICES.md` § 1.3 · detectado durante el punto 4 (grafo).

---

## [2026-08-16] ✅ CERRADA — El `200` de `localhost:4200` lo daba un servidor muerto: contestaba el proceso anterior con la configuración vieja

**Categoría:** instrumento que no identifica lo que mide

**Síntoma:** tras añadir el CSS de Leaflet a `angular.json`, reinicié el servidor. El
nuevo **murió al arrancar** (`Port 4200 is already in use`, código 127) porque el anterior
seguía vivo: `TaskStop` mató el envoltorio y no al `ng serve` hijo. `curl` siguió
devolviendo **200** — lo contestaba el proceso viejo, PID 14536, con la configuración
anterior. Es el mismo `200` que llevo usando tres encargos como condición de HECHO.

**⭐ Qué dio verde mientras el fallo estaba vivo:** el `curl` de siempre. Ejecutado con el
servidor nuevo ya muerto y el viejo respondiendo:

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/
200

$ curl -s http://localhost:4200/styles.css | grep -c leaflet
0                          <- el servidor NO tiene el CSS de Leaflet

$ grep -c leaflet angular.json
2                          <- pero el fichero en disco SÍ lo declara

$ netstat -ano | grep ":4200"
  TCP    [::1]:4200    [::]:0    LISTENING    14536
```

Y el arranque que había fallado, en su propio registro:

```
> ng serve
An unhandled exception occurred: Port 4200 is already in use.
[exited with code 127]
```

**Cómo se cazó:** casualidad. El aviso automático de que la tarea de fondo había muerto
llegó **después** de que yo diera el `200` por bueno. Sin ese aviso, el checkpoint habría
dicho «200 comprobado» con un servidor de hace media hora.

**Causa raíz:** el instrumento medía **el puerto**, no **el servidor**. Un código de estado
HTTP es una propiedad de la conexión: dice que algo escucha en 4200 y contesta, y no puede
decir qué proceso es ni de qué build viene. Nada en `curl` distingue un servidor recién
arrancado de uno de hace media hora. Y encima confluyeron dos cosas que se tapan entre sí:
`TaskStop` informó de éxito habiendo matado solo el envoltorio —el `ng serve` hijo quedó
huérfano y escuchando—, y `angular.json` es de los ficheros que **solo se leen al arrancar**,
así que el recargado en caliente no podía corregir la diferencia ni delatarla. El resultado
es un servidor que sirve la aplicación correctamente y con la configuración caducada: 200
legítimo, respuesta obsoleta.

**Arreglo aplicado:** dos capas. **(1) El caso**: se mató el proceso huérfano (PID 14536), se
confirmó el puerto libre —`curl → 000`— y se arrancó de nuevo, verificando esta vez por
identidad. **(2) El fondo**, que es lo que cierra esta entrada: `app/scripts/comprobar-arranque.mjs`,
invocable con `npm run comprobar-arranque`, que comprueba (a) que contesta la aplicación y no
otra cosa, (b) **qué PID** escucha, (c) que ese proceso **arrancó después** de la última
modificación de `angular.json`, `package.json` y `package-lock.json` —los que solo se leen al
arrancar—, (d) que los recursos que el HTML anuncia se sirven, y (e) si traen hash de
contenido, que ese fichero esté en `dist/`. Visto en rojo tres veces antes de fiarse de él,
con condiciones reales y tres códigos de salida distintos: `1` nadie escucha · `4` servidor
anterior a la configuración —este caso, reproducido: mientras el script daba ROJO, `curl`
daba **200** en el mismo instante— · `6` sirve un bundle que no está en `dist/`. El script
lleva escrito en su cabecera qué **no** puede detectar.

**Commit:** `c3263a0` (`feat(comprobar): el arranque se verifica por identidad, no por
estado`, 2026-08-16). La captura de esta entrada es `8af95ba`, anterior al arreglo.

**Ley que sale de aquí:** un `200` en un puerto fijo dice que **alguien** contesta, no
**quién**. No prueba que conteste el código de ahora. Todo arranque que se dé por bueno
tiene que comprobar además **una marca propia de la versión que se acaba de construir**
—un fichero, una cadena, un recurso nuevo— y no solo el código de estado. Y matar un
servidor no es matar su envoltorio: se confirma que el puerto queda libre.

*Añadido al cerrar (2026-08-16):* la ley pedía «una marca propia de la versión recién
construida», y al buscarla apareció un límite que hay que decir: **`ng serve` no pone hash
de contenido en los nombres** —sirve `main.js`, no `main-XXXXXXXX.js`—, así que en
desarrollo esa marca **no existe**. El hash solo lo emite `ng build`. Lo que sí distingue a
un servidor caducado en desarrollo es **cuándo arrancó** frente a cuándo se tocó la
configuración, y por ahí va la comprobación. La ley se cumple; la marca no siempre es un
hash.

**Traza:** `app/angular.json` (`styles`, `allowedCommonJsDependencies`) · proceso `ng
serve` PID 14536 · detectado durante el punto 3 (mapa) · guardia en
`app/scripts/comprobar-arranque.mjs`.

---

## [2026-08-16] ✅ CERRADA — Crear `app/` dejó falso el párrafo de «Estado» del README, y vivió tres commits en un repo público

**Categoría:** documentación que caduca en silencio

**Síntoma:** el blockquote de «Estado» (`README.md` 19-21) afirma «no hay nada que
instalar ni nada que abrir en el navegador» y «lo que hay es el método de trabajo, el
plan y estos dos ficheros de licencia». Desde `baccc36` existe `app/` con 497 paquetes
instalados, arranca con `npm start` y responde en `http://localhost:4200`. Tres
afirmaciones falsas en la portada pública, vivas durante `baccc36`, `299770d` y
`726cb51`.

**⭐ Qué dio verde mientras el fallo estaba vivo:** git, preguntado por el fichero que
mentía. Ejecutado antes de tocar nada, con las tres frases falsas dentro:

```
$ git status -sb -- README.md
## main

$ git log --oneline -1 -- README.md
726cb51 docs(readme): badge de typescript a la version real

$ git diff --stat HEAD -- README.md
(sin salida)
```

Y el criterio de HECHO del encargo que introdujo el fallo —«árbol limpio, y NADA fuera
de este alcance tocado»— se cumplió entero: en el checkpoint de `baccc36` se reportó
`## main` con árbol limpio y los 22 ficheros de `app/` comprobados con 200. Todo verde.

**Cómo se cazó:** ojo humano — la costura §6 de un encargo posterior («si ves cualquier
otro dato falso, repórtalo»). No lo cazó ningún instrumento: no hay CI (`.github/` no
existe), ni hooks activos (solo `.sample`), ni pruebas, ni enlace comprobado. Nada
vigila el README.

**Causa raíz:** `git status` compara un fichero contra su última versión commiteada, y
nada más. Detecta **ediciones**; no puede detectar **afirmaciones que dejaron de ser
ciertas**, porque la verdad del README no dependía del README sino del resto del repo —
de que `app/` no existiera. Ningún instrumento ata lo que un documento afirma a los
hechos que describe. Y encima el alcance del encargo prohibía tocar el README, así que
«nada fuera del alcance tocado» convirtió el fichero caduco en criterio cumplido: el
verde no fue un descuido del método, fue el método funcionando como estaba escrito.

**Arreglo aplicado:** `README.md`, blockquote de «Estado» (hoy líneas 19-25): las tres
afirmaciones falsas se sustituyen por lo que sí es verificable contra el repo —no hay
formulario, ni motor, ni mapa; lo único que hay es el esqueleto del CLI en `app/`, que
arranca en local—, comprobado antes de escribirlo (sin `<form>`/`<input>`/`FormsModule`
en `app/src/`, sin `leaflet` instalado, `localhost:4200 → 200`). El titular «Estado: hoy
no hay aplicación» se mantiene. Y en el mismo commit, línea 77-78, el enlace a
`THIRD-PARTY-NOTICES.md` en «Licencia y créditos». Total: +10 −3, un solo fichero.

**Commit:** `7976623` (`docs(readme): el estado dice la verdad de hoy y enlaza los
notices`, 2026-08-16) — la captura de esta entrada es `2742033`, anterior al arreglo.

**Ley que sale de aquí:** añadir una pieza puede falsear un documento que el encargo
prohíbe tocar. El alcance protege el fichero de que lo editen, no de que envejezca. Todo
encargo que crea algo nuevo (`app/`, un endpoint, un dato) tiene que releer lo que la
portada afirma sobre su ausencia — antes de cerrar, no dos commits después.

*Añadido al cerrar (2026-08-16):* la ley ya no vive solo aquí — es regla transversal del
plan (`PLAN-DESPLAZAME.md` 14-16, commit `b6aba72`). Pero **el arreglo no creó ningún
instrumento**: sigue sin haber CI, hook ni prueba que mire el README. La vigilancia es
humana, así que este fallo puede repetirse; lo único que cambia es que ahora hay una
regla escrita a la que señalar cuando pase.

**Traza:** `README.md` 19-21 · introducido en `baccc36` (`chore(app): esqueleto angular
22 en app/`) · detectado en `726cb51`.
