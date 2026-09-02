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

## [2026-09-02] 🔴 ABIERTA — Dos portales del mismo cruce dan 635 m en coche, o «no hay forma», y las 509 jueces en verde

**Categoría:** un caso que sí está vigilado en un modo y no en el modo nuevo

**Síntoma:** dos direcciones que enganchan al MISMO nodo de la red del coche no
se resuelven como lo que son —el mismo sitio—: o se rodea la manzana, o se
contesta que no hay camino. Medido antes de tocar nada, con los tres modos sobre
los mismos dos pares:

```
Portales.115617 (CAMINO ABEJAR 71 TV C9) -> Portales.118293 (CAMINO ABEJAR 71 TV C11) · 45.9 m en linea recta
  los dos enganchan al MISMO nodo del coche: 20400 == 20400
  andando  -> 0 m · 0 s · 1 pasos
  coche    -> 635 m · 119 s · 2 pasos

Portales.90046 (CALLE ABEDUL 1) -> Portales.114182 (CALLE ABEDUL 2) · 11.0 m en linea recta
  los dos enganchan al MISMO nodo del coche: 23373 == 23373
  andando  -> 1 m · 1 s · 2 pasos
  coche    -> 0 m · 0 s · 0 pasos · No hay forma de ir en coche de CALLE ABEDUL 1 a CALLE ABEDUL 2 por las calles que conocemos.
```

**Son 672 nodos** de la red del coche con más de un portal pegado por el
`node_snap`, de los 4.121 portales que enganchan a un cruce.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **509 jueces del motor**,
incluidas las diez del coche recién escritas, y —esto es lo que duele— **la juez
del peatón que cubre exactamente este caso**, que lleva viva desde el 24/08 y
sigue en verde porque solo mira `andando`. Ejecutadas antes de tocar nada:

```
$ node --test motor/src/viaje-coche.spec.ts
ℹ tests 10
ℹ pass 10
ℹ fail 0

$ node --test --test-name-pattern "UNA RESCATADA" motor/src/trayecto.spec.ts
  ✔ ⭐ UNA RESCATADA anda hasta su propia puerta: de 401 m a ninguno (3.8688ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Y la juez 7 del coche —«un destino al que el coche no puede llegar se contesta,
no se rompe»— compraba en verde un «No hay forma» legítimo mientras en el mismo
camino de código salía otro que no lo era.

**Cómo se cazó:** instrumento — una sonda de bordes escrita a mano al terminar
el encargo, buscando qué pasa cuando los dos enganches caen en el mismo cruce.
Ninguna juez lo pedía.

**Causa raíz:** ⏳ PENDIENTE
**Arreglo aplicado:** ⏳ PENDIENTE
**Commit:** ⏳ PENDIENTE

**Ley que sale de aquí:** cuando un modo nuevo estrena su propia búsqueda, **las
jueces de borde de los modos viejos son la lista de la compra**: los extremos
que caen en el mismo sitio, la isla, el portal que no existe. Escribir jueces
nuevas para lo que el modo trae de nuevo —los vetos, el sentido, la ZBE— y no
re-correr las viejas deja vigilado lo llamativo y a oscuras lo básico.

**Traza:** `motor/src/viaje-coche.ts`, `calcularRutaEnCoche` — el caso trivial
busca una arista que sea a la vez salida y llegada, y dos enganches pegados al
mismo NODO no comparten ninguna: las salidas son las que salen de él y las
llegadas las que llegan.

---

## [2026-09-01] ✅ CERRADA — Los cuatro titulares de la línea de créditos salen PEGADOS al separador, y los nueve jueces que los buscan por nombre dan verde

**Categoría:** un juez que busca un nombre no ve dónde termina ese nombre

**Síntoma:** el pie de créditos nuevo nombra a los cuatro titulares del dato,
separados por `·`. Medido en Chrome contra la página de verdad, lo que Angular
pintaba era esto — el separador **pegado por los dos lados**, y sin el punto
(que va `aria-hidden`) los titulares pegados **entre sí**:

```
a la vista:    …Avanza Zaragoza S.A.U.·Horarios: GTFS del Punto de Acceso Nacional (MITMA)…
lo que se oye: …Avanza Zaragoza S.A.U.Horarios: GTFS del Punto de Acceso Nacional (MITMA)…
```

Angular borra el espacio en blanco que hay ENTRE elementos
(`preserveWhitespaces: false` es el defecto), así que los saltos de línea de la
plantilla entre `</span>` y `<span>` **no existen en el DOM**. Lo único que
separaba las cuatro cosas eran los **2,4 px** de `margin: 0 0.15rem` del punto.

Es la misma cicatriz que § 1.24 del notices le documenta a Avanza
—`053MIRALBUENO`, el texto plano pegado—, y aquí la habríamos puesto nosotros.

⭐ **Lo que daba verde mientras el fallo estaba vivo** — los cuatro jueces del
navegador que compran justamente que los titulares están, ejecutados con los
nombres pegados:

```
✔ nombra a «Avanza Zaragoza S.A.U.»
✔ nombra a «Punto de Acceso Nacional (MITMA)»
✔ nombra a «Ayuntamiento de Zaragoza»
✔ nombra a «colaboradores de OpenStreetMap»
✅ TODO VERDE
```

y los cinco de jsdom, en la misma pasada:

```
✓ ⭐ nombra a los CUATRO titulares del dato que se está enseñando
     Tests  13 passed | 217 skipped (230)
```

**Cómo se cazó:** instrumento, y **de refilón**. `creditos.mjs` imprime la línea
entera antes de juzgarla —`console.log(`   dice: «…»`)`— porque la prueba real de
un texto es leerlo. El juez dijo verde; el `dice:` de encima, no.

**Causa raíz:** `toContain('Avanza Zaragoza S.A.U.')` es cierto tanto si detrás
hay un espacio como si hay una `H`. Un juez que busca una **subcadena** compra
que el nombre está y **no compra nada sobre dónde termina** — y ahí es donde
estaba el fallo. Los nueve decían la verdad, y ninguno decía lo que hacía falta.

**Arreglo aplicado:** `&ngsp;` —la entidad de Angular para «un espacio que SÍ
sobrevive»— a los dos lados de cada separador y **fuera** de los tramos
`aria-hidden`, para que separe las dos cosas: lo que se ve y lo que se lee en voz
alta. Y un juez nuevo que nombra **las tres juntas una a una**, sobre las dos
versiones del texto: la pintada, y la misma sin lo oculto.

⚠️ **Y el primer juez que escribí para eso daba ROJO sobre la línea buena.** Era
un patrón —«una mayúscula pegada a un punto»— y **«S.A.U.» es exactamente eso**.
Un juez que se equivoca con el caso normal no vale, aunque también cace el malo.
Por eso las juntas van escritas una por una y no como regla.

**Contraprueba** (los seis `&ngsp;` fuera, una sola vez):

```
✖ los tres cortes entre titulares llevan su espacio a la vista — pegados: S.A.U. · Horarios | (dato bruto y procesado) · Datos municipales | (Ley 37/2007) · Cartografía
✖ los tres cortes … sin lo oculto (lo que lee un lector de pantalla) — pegados: S.A.U. Horarios | …
   lo que se oye: «…Avanza Zaragoza S.A.U.Horarios: GTFS del Punto de Acceso Nacional (MITMA)…»
```

**Ley:** un juez que compra **presencia** con `toContain` no compra
**separación**, y en un texto que se lee en voz alta la separación es la mitad
del significado. Donde varias cosas se listan en una línea, lo que hay que
nombrar en el juez son **las juntas**, no los elementos — y una a una: un patrón
que las adivine se equivoca con la primera abreviatura que aparezca.

**Commit:** `b57def1` — *feat(app): la linea de creditos — avanza nap ayuntamiento osm*

**Ficheros:** `app/src/app/buscador.html` · `app/e2e/creditos.mjs`

**Nota:** el arreglo ya había comenzado al abrir esta entrada.

---

## [2026-09-01] ✅ CERRADA — La región de estado del botón «Próximo bus» nace FUERA del árbol de accesibilidad: `:empty { display: none }`

**Categoría:** una región viva que no está viva hasta que ya es tarde

**Síntoma:** el botón «Próximo bus» promete [WCAG 4.1.3] que su región
`role="status"` está en el DOM **antes** de la actualización, que es lo único
que hace que un lector de pantalla la esté observando cuando llega el
resultado. Medido con Chrome contra la pantalla de verdad, el caso del ojo
—`COLOSO 2 → OVIEDO 5` en bus, dos subidas—:

```
región 1 (la que el Generar lleno):  display "block"  ·  alto 16  ·  :empty false
región 2 (la que nace vacía):        display "none"   ·  alto  0  ·  :empty true

status en el árbol de accesibilidad — con la región vacía: 2  |  con texto: 3
```

La segunda región **no está en el árbol** mientras está vacía, y entra en él
justo cuando recibe su contenido. Para un lector de pantalla eso no es una
región viva que cambia: es una región que aparece ya escrita, y eso es
exactamente lo que 4.1.3 dice que no se anuncia.

⭐ **Lo que daba verde con el fallo vivo** — la juez que compra esa promesa,
ejecutada con el fallo dentro:

```
 ✓  desplazame  src/app/buscador.spec.ts > Buscador > ⭐ 18 · la región de estado existe antes de pulsar, y el botón la señala 2887ms
      Tests  2 passed | 79 skipped (81)
```

Y la sonda del navegador que lo destapó no era una juez: fue una duda mía
mirando el CSS que había escrito una hora antes.

**Cómo se cazó:** leyendo mi propio `buscador.css` después de darlo por bueno.
`.vivo__estado:empty { display: none }` lo puse para que una región vacía no
reservara sitio, sin pensar que `display: none` **saca el elemento del árbol de
accesibilidad**. La juez 18 pregunta `querySelector('.vivo__estado')`, y eso
encuentra el elemento igual esté pintado o no.

⚠️ Es la misma familia que la entrada del 31/08 —«el detalle del desvío se ve
con `hidden` puesto»— y la misma lección al revés: **allí la juez preguntaba
por el atributo y no por lo que se ve; aquí pregunta por la existencia en el
DOM y no por la existencia para quien no mira la pantalla.**

**Causa raíz:** dos cosas, y la segunda es la que importa.

1. `display: none` **saca el elemento del árbol de accesibilidad**, y una
   región viva que no está en el árbol no está siendo observada por nadie. La
   regla la escribí para un problema de maquetación —que un hueco vacío no
   moviera la lista— sin caer en que el remedio tenía ese precio. No hacía
   falta: un `<span>` vacío ya no ocupa ni ancho ni alto.

2. **Y la juez preguntaba por la existencia en el DOM, no por la existencia
   para quien no mira la pantalla.** `querySelector('.vivo__estado')` encuentra
   el elemento igual esté pintado o no; `getAttribute('role')` devuelve
   `status` igual. Las dos aserciones eran ciertas y ninguna compraba lo que la
   juez dice comprar en su nombre.

⚠️ **Y hay una tercera, que salió al arreglar:** intenté cerrar el hueco
añadiendo `expect(getComputedStyle(region).display).not.toBe('none')` a la
propia juez 18, y **siguió verde con la regla mala dentro** — medido, no
supuesto. **jsdom no aplica el CSS del componente**, así que en `buscador.spec.ts`
`display` sale `block` haga lo que haga la hoja de estilo. La aserción habría
sido una segunda mentira encima de la primera, con mejor aspecto.

**Arreglo aplicado:**

1. `app/src/app/buscador.css` — fuera `.vivo__estado:empty { display: none }`, y
   en su sitio el comentario que dice por qué no vuelve.
2. `app/e2e/proximo-bus.mjs` — **dos jueces nuevas donde hay píxeles**: la 7
   mide `getComputedStyle(...).display` de cada región **antes de pulsar** —y
   exige que al menos una esté vacía, o no compraría nada—, y la 8 cuenta los
   nodos `role=status` no ignorados del árbol de accesibilidad con las regiones
   vacías y con texto, y exige que sean **los mismos**.
3. `app/src/app/buscador.spec.ts` — la juez 18 conserva lo que **sí** puede ver
   en jsdom (la región existe, su papel, su `id`, su texto vacío) y lleva
   escrito, en el sitio donde uno iría a añadirla, que la mitad del píxel vive
   en `proximo-bus.mjs` y por qué no puede vivir aquí.

**Contraprueba** (la regla mala devuelta, una sola vez):

```
✖ 7 · ninguna región de estado está en display:none, ni vacía — con texto:block · vacía:none
✖ 8 · las regiones ya están en el árbol de accesibilidad ANTES de tener texto — 2 con las vacías · 3 al darles texto
ROJO: 2 en rojo.
```

**Ley:** una **región viva** no se compra preguntando si el elemento existe:
se compra preguntando si **está en el árbol de accesibilidad antes de tener
contenido**. Y de ahí sale la segunda mitad, que es la que se paga cara: **una
juez en jsdom no puede comprar nada que dependa del CSS del componente**, así
que toda promesa que se cumpla o se rompa en una hoja de estilo tiene su juez
en el navegador o no la tiene. Es la del 31/08 —«el atributo `hidden` no
esconde nada por sí solo»— una vuelta más adentro: allí la juez miraba el
atributo en vez del píxel; aquí miraba el DOM en vez del árbol.

**Commit:** `177ae73` — *fix(app): la region de estado no se esconde ni vacia*

**Ficheros:** `app/src/app/buscador.css` · `app/e2e/proximo-bus.mjs` ·
`app/src/app/buscador.spec.ts`

---

## [2026-09-01] ✅ CERRADA — El refresco de desvíos DETECTA 23 y APLICA 4: un viaje sube en un poste donde el autobús hoy no para

**Categoría:** una cuenta que dice «leído» y se lee como «hecho»

**Síntoma:** `COLOSO 2 → COMPROMISO DE CASPE 121` en bus manda subir a la
**línea 22 en el poste Plaza De España**, y la 22 va hoy desviada precisamente
por ahí. Medido contra la fuente en ese momento, los dos postes que se llaman
así están suprimidos, cada uno en su dirección:

```
   dir 0 · poste 720 (17391): en el GTFS=true · en la ruta de hoy=false · SUPRIMIDO=true
   dir 1 · poste 719 (17390): en el GTFS=true · en la ruta de hoy=false · SUPRIMIDO=true
```

Y el paso de subida **no llevaba el aviso del desvío**. Es el fallo más grave de
los que hay: un viaje que manda esperar donde no pasa nadie.

**⭐ Qué dio verde mientras el fallo estaba vivo:** **el log del propio motor**,
que imprimió lo mismo en los dos refrescos del proceso mientras uno aplicaba 23
desvíos y el otro 4:

```
motor: ruta operativa de hoy — 64 sentidos · 23 desviados · 0 sin saber · 36 s
motor:   23 patrones rehechos · 78 saltos nuevos (78 ruteados · 0 en RECTA de reserva) · 5 postes provisionales · 5 sin coordenada
motor: ruta operativa de hoy — 64 sentidos · 23 desviados · 0 sin saber · 17 s
motor:   4 patrones rehechos · 10 saltos nuevos (10 ruteados · 0 en RECTA de reserva) · 1 postes provisionales · 0 sin coordenada
```

⚠️ **Las dos líneas dicen «23 desviados» y las dos son ciertas**: ésa es la
cuenta de lo que la FUENTE contestó. Lo que se aplicó a la red va en la línea de
abajo y con otra palabra —«patrones rehechos»—, así que **19 desvíos detectados
y no aplicados no producen ni una señal**: hay que leer dos líneas, saber que la
segunda debería parecerse a la primera, y restar de cabeza.

Y la muralla entera en verde: **454 en el motor**, `fail 0`.

**Cómo se cazó:** ojo humano — Antonio vio que el viaje subía en Plaza de España
estando la 22 desviada.

**Causa raíz:** **el veredicto caducaba entre leerlo y aplicarlo.**

`refrescarYServir` leía los 64 sentidos y después `aplicarDesvios` **los volvía a
pedir a la caché**. Y la caché caduca mientras el pase corre, porque el pase
tarda de 17 a 36 s y `TTL_DESVIOS_MS` era **la misma constante** que el periodo
del refresco — `setInterval(refrescarLosDesvios, TTL_DESVIOS_MS)`—. Medido con
reloj falso, un pase a `TTL − 10 s` del anterior:

```
   detectados: 64 desviados de 64 sentidos
   visitas nuevas a la fuente: 0  (0 = todo de caché)
   al aplicar,  5 s después del pase: 64 vivos · 64 con desvío
   al aplicar, 11 s después del pase:  0 vivos ·  0 con desvío
```

El segundo pase encuentra la capa fresca por unos segundos, **no visita la fuente
ni una vez** —así que tampoco renueva el `cuando` de nada—, cuenta los desvíos
que ya tenía... y cuando termina, lo que iba a aplicar ya no existe.

**Arreglo aplicado:** tres piezas, y la tercera es la del log.

1. `motor/src/desvios.ts` — `refrescarDesvios` devuelve **`leido`**, un veredicto
   por sentido, y `refrescarYServir` aplica **eso**. No hay ventana entre leer y
   aplicar porque ya no hay segunda lectura. Los postes provisionales salen del
   mismo sitio, por lo mismo.
2. `motor/src/servidor.ts` — `CADA_CUANTO_SE_REFRESCA_MS = TTL / 2`: el refresco
   renueva **antes** de que la caché caduque. ⚠️ No arregla el fallo por sí solo
   —lo arregla lo anterior—, pero sin ello el sistema seguiría dependiendo de que
   dos relojes no se rocen.
3. `resumenDelRefresco` — el log dice **«N detectados · M aplicados»** en una
   sola línea y con la misma palabra, y si no cuadran lo grita.

Medido con el motor reiniciado, y ésta es la línea nueva:

```
motor: ruta operativa de hoy — 64 sentidos · 23 detectados · 23 aplicados · 0 sin saber · 34 s
```

Y el caso del ojo, con el mismo par de portales:

```
  [transborda] En el poste Asalto / Centro De Historias, transborda de la línea 29 a la línea 22
  ¿alguien sube en Plaza De España? False
  AVISO: La línea 22 va hoy desviada: no para en Plaza Aragón N.º 1, Plaza De España…
```

**Commit:** `5b5c9f8`

**Ley que sale de aquí:** un log dice **lo que se aplicó**, no lo que se leyó. Y
cuando imprime las dos cosas, la diferencia entre ellas se dice **en voz alta**:
dos números correctos en dos líneas distintas no son una alarma — son un acertijo
que nadie resuelve a las tres de la mañana.

Y la del cierre, que la trajo la contraprueba: **quien lee un dato y quien lo
aplica no pueden ir a buscarlo por separado si el dato caduca.** El que lo lee lo
entrega. Una caché entre dos pasos del mismo trabajo es una ventana abierta, y
basta con que el trabajo tarde más que ella.

Y una tercera, sobre las jueces: ⚠️ **mutar el sitio arreglado no ponía roja
ninguna juez**. Las tres que escribí probaban `aplicarDesvios` pasándole los
veredictos a mano, que es justo lo que el arreglo hace bien — no que
`refrescarYServir` lo hiciera. La juez 7, la que muerde, salió de la contraprueba
y no de escribir la juez. **Una juez que no cubre la línea que se cambió no es
una juez de ese cambio.**

**Traza:** `motor/src/patron-operativo.ts` (`refrescarYServir`) ·
`motor/src/desvios.ts` (`desvioServido`, `traerDesvio`, `TTL_DESVIOS_MS`) ·
`motor/src/servidor.ts` (las dos líneas del log).


## [2026-09-01] ✅ CERRADA — «Plaza Arag��n»: el lector del zip decodifica CADA TROZO del flujo por separado y parte las tildes que caen en la costura

**Categoría:** una decodificación con estado, hecha sin estado

**Síntoma:** la parada **1312** sale en pantalla como `Plaza Arag��n`. Y solo
ella: la **1311**, que está en la fila de arriba y dice exactamente lo mismo,
sale bien. Cocinado el feed vivo con el propio código del motor:

```
paradas leidas: 984
paradas con caracteres de reemplazo: 1
   id 1312 · "Plaza Arag��n" · 50 6c 61 7a 61 20 41 72 61 67 fffd fffd 6e
1311: "Plaza Aragón"
1312: "Plaza Arag��n"
```

⚠️ **Y el dato de origen está impecable.** Las dos filas del `stops.txt` del zip
que se sirve traen los mismos bytes, y el fichero entero es UTF-8 válido:

```
   b'1311,1311,Plaza AragÃ³n,,41.647957954594006,...'
   b'1312,1312,Plaza AragÃ³n,,41.64791411735438,...'
  el fichero ENTERO es UTF-8 valido
  bytes invalidos encontrados (tope 7): 0
```

Dos caracteres de reemplazo donde va **una** «ó» —que en UTF-8 son los dos bytes
`c3 b3`— dicen que cada byte se rechazó por separado.

**⭐ Qué dio verde mientras el fallo estaba vivo:** **la muralla entera del
motor**, que cocina esa misma red en su `before` y la recorre en veintitantas
jueces. Ejecutada con el nombre roto dentro:

```
$ npm run probar
ℹ pass 446
ℹ fail 0
```

Y las que miran `stops.txt` de cerca tampoco: la **juez 10** compra que el
partidor de CSV entiende las comillas —*«934 de las 984 filas las traen»*— y ahí
se quedó; las demás cuentan paradas, saltos y patrones. `grep` sobre las dos
suites: **ninguna juez busca un carácter de reemplazo ni un nombre con tilde**.

⚠️ Tampoco lo vio el manifiesto, y es coherente: comprueba el **sha256 del
fichero**, que está bien. El fichero no es el que miente.

**Cómo se cazó:** ojo humano — Antonio leyó «Plaza Arag��n» en la pantalla.

**Causa raíz:** **el troceado, no el charset.** `porLineas` descomprimía el zip
en flujo y hacía `trozo.toString('utf8')` **a cada trozo por separado**. Un trozo
del stream corta por donde le toca —no por donde acaba un carácter—, y cuando el
corte separaba los dos bytes de una «ó» —`c3` y `b3`— **cada mitad era una
secuencia inválida por su cuenta** y se convertía en un carácter de reemplazo.

⇒ De ahí que salieran **dos** donde va una letra. Y de ahí que fallara **una de
984**: solo una tilde cayó justo en la costura de dos trozos.

⚠️ Y por eso ninguna prueba lo veía. Todas cuentan —984 paradas, 170 patrones,
3.362 saltos— y contar sale bien: **el nombre roto también es un nombre**. La
juez 10, que es la única que mira dentro de `stops.txt`, compra que el partidor
entiende las comillas; el manifiesto comprueba el `sha256` del fichero, que está
impecable. Nadie miraba lo que los nombres **decían**.

**Arreglo aplicado:** cuatro cosas.

1. `motor/src/red-bus.ts` — un `TextDecoder` **con estado**, `{ stream: true }`,
   que se guarda los bytes sobrantes del trozo y los estrena con el siguiente. Y
   se **vacía** al cerrar el flujo: si el zip acabara a mitad de una secuencia,
   sale el reemplazo en vez de perderse en silencio.
2. `motor/src/servidor.ts` — el mismo fallo, juntando el cuerpo de una petición.
   Arreglado igual, antes de que lo pagara el nombre de un sitio.
3. `FORMATO_DEL_COCINADO` **sube a 4**, que es el mecanismo previsto para esto:
   el dato de un cocinado 3 es el mismo salvo por los nombres rotos que se
   guardaron con él, y esos **no se arreglan releyendo el guardado**.
4. `motor/src/texto.ts` — y de paso, lo que el encargo pedía: `textoDe` decodifica
   por bytes con el charset **declarado**, porque [WHATWG Fetch] `Response.text()`
   lo ignora y decodifica siempre UTF-8. Hoy no cambia nada —medido: las tres
   fuentes de Avanza declaran y sirven UTF-8, con 0 caracteres de reemplazo—, así
   que no arregla un fallo vivo: **quita uno mudo**.

Medido tras reiniciar el motor, que **recocina** en vez de leer el guardado:

```
motor: red de bus COCINADA — 984 paradas · 53 líneas (8 sin viajes) · 170 patrones
U+FFFD en el cocinado: 0
formato: 4
```

Y en la pantalla, con el instrumento: `OK   5 · ni un carácter de reemplazo en la
narración · ninguno`.

**Commit:** `d79c170`

**Ley que sale de aquí:** contar filas no es leer un fichero. Un lector que
procesa **984 nombres** y solo se equivoca en **uno** no lo delata ninguna
prueba que cuente cuántos hay: hace falta una que mire **qué dicen**.

Y la del cierre, que es la que casi me hace arreglar lo que no estaba roto:
**el síntoma nombra la fuente equivocada.** Un texto con acentos rotos parece un
problema de charset, y el encargo señalaba a Avanza con toda la lógica del
mundo. Avanza estaba **bien** —tres respuestas medidas, `charset=UTF-8`
declarado y servido—: el roto era nuestro lector, tres capas más acá. Medir la
fuente antes de tocarla no fue burocracia; fue lo que evitó el arreglo falso.

**Traza:** `motor/src/red-bus.ts` (`porLineas`, el bucle del flujo) ·
`motor/src/red-bus.spec.ts` (juez 10).


## [2026-09-01] ✅ CERRADA — El contorno del chip no pinta ni un píxel negro: 0,7 px a 13,6 px de fuente se disuelve en el antialiasing

**Categoría:** una promesa calculada en hexadecimal que el render no cumple

**Síntoma:** la regla nueva del chip dice que el número blanco se lee sobre
cualquier color **por su trazo negro**. En pantalla, el chip de la línea 44
(`#27A737`) sale a **3,15:1**, que es blanco contra verde a pelo — el trazo no
está aportando nada. Censo de los 700 píxeles del chip, en la captura:

```
CHIP: { "clases": "chip-linea chip-linea--contorno",
        "stroke": "0.7px rgb(0, 0, 0)", "paint": "stroke", "fuente": "13.6px" }
censo del chip (color, veces, luminancia):
   rgb(39,167,55) x700  lum=0.2834      <- el fondo
   rgb(255,255,255) x71  lum=1.0000     <- el número
   rgb(29,125,41) x60  lum=0.1509       <- lo más oscuro que hay: verde sucio
```

La clase está puesta y `-webkit-text-stroke` está aplicado. **No hay un solo
píxel negro.** El trazo se reparte 0,35 px a cada lado del borde de la letra y
no llega a cubrir ninguno entero.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la juez que compra
exactamente esa promesa, sobre las 46 diurnas. Ejecutada con el chip a 3,15:1 en
pantalla:

```
$ npx ng test --include=src/app/chip.spec.ts --filter="toda diurna" --reporters=verbose
 ✓  desplazame  src/app/chip.spec.ts > ⭐ EL CHIP DE UNA LÍNEA — heredado de ZetaBus > ⭐ 1 · toda diurna lleva número BLANCO con contorno, y se lee 5ms
      Tests  1 passed | 7 skipped (8)
```

Y con ella `legiblePorContorno`, que devuelve **6,67:1** para ese mismo verde. La
muralla entera, `Tests  208 passed (208)`.

**Cómo se cazó:** instrumento — el medidor de píxel recién heredado de ZetaBus
(`app/e2e/pantalla.mjs`), en su primera pasada sobre la pantalla arreglada.

**Causa raíz:** dos cosas, y hacían falta las dos para que fallara.

1. **`-webkit-text-stroke` centra el trazo en el borde del glifo**, y
   `paint-order: stroke fill` pinta el relleno encima — así que **por fuera
   solo queda la mitad**. Con 0,7 px eso son 0,35 px, que no cubren un píxel
   entero ni con la alineación perfecta. El trazo de ZetaBus funciona porque su
   chip mide de 24 a 48 px con `font-black`; el nuestro son 13,6 px en una línea
   de indicaciones. **El mismo trazo en otro cuerpo no es el mismo trazo.**
2. Y Chrome suaviza por **subpíxeles** (LCD) por defecto: reparte el trazo entre
   los canales R, G y B, así que lo poco que pinta sale teñido — medidos
   `rgb(18,57,167)` y `rgb(23,67,17)`— y nunca llega a negro.

⚠️ Y había un tercero, en el instrumento: `contrasteReal` medía «la moda contra
el más lejano en luminancia», que es lo correcto para un texto plano y **no para
uno con halo**. Con tres colores, el fondo adyacente al relleno blanco ya no es
el verde del chip: es el trazo. Y como el blanco está más lejos del verde que el
negro, el instrumento elegía el blanco y devolvía justo el contraste que el halo
viene a arreglar. Medía bien, pero **la pregunta era otra**.

**Arreglo aplicado:** tres, todos con la cifra delante.

1. `app/src/app/buscador.css` — trazo de **2 px** en vez de 0,7, y
   `-webkit-font-smoothing: antialiased` para que el suavizado vaya en escala de
   grises. Barrido medido sobre el chip de la 44, contando píxeles con
   luminancia < 0,15 y buscando el más oscuro que salga ≥3 veces:

   ```
     fuente peso grosor   px oscuros(lum<0.15)   el mas oscuro        contraste blanco/ese
     13.6   700  1.5          45            (ninguno x3)        —
     13.6   700  2            66            rgb(0,0,0)          21.00:1
     16     700  1.5          71            rgb(0,0,0)          21.00:1
   ```

   A nuestro cuerpo hacen falta **2 px**. Y el número **se sigue leyendo**:
   ampliado ×8, el «44», el «33» y el «29» conservan su forma — el relleno va
   encima, así que el trazo solo crece hacia fuera.
2. `app/e2e/medir.mjs` — `contrasteReal` **le pregunta a la página si hay trazo**
   (`webkitTextStrokeWidth > 0`) y, si lo hay, mide **el más claro contra el más
   oscuro** de los que se ven, que es el relleno contra su halo.
3. `app/e2e/pantalla.mjs` — la misma corrección para las líneas del mapa: con
   ribete, lo que se mide es el ribete contra el plano y la línea contra el
   ribete, y quién es el halo de quién se lee del propio SVG.

Medido en la pantalla después, con el motor vivo:

```
    [44] fondo rgb(0,0,0) · número rgb(255,255,255) → 21.00:1
  OK   1+2 · todo chip de la pantalla ≥ 4,5:1 medido en el píxel
```

**Commit:** `d7dfd5d`

**Ley que sale de aquí:** un cálculo de contraste sobre dos hexadecimales compra
que **esos dos colores** se distinguen, no que el navegador vaya a pintarlos. Si
uno de los dos lo produce un efecto de render —un trazo, una sombra, un borde
fino— la promesa no está comprada hasta que se mide el píxel.

Y la de al lado: **es el mismo error de ayer con otro traje** — la entrada del
31/08 sobre `hidden` decía que preguntar por el atributo no compra lo que se ve.
Aquí se pregunta por la aritmética.

Y la que sale del cierre, que es la que no me esperaba: **un instrumento heredado
trae consigo el caso para el que fue escrito**. El de ZetaBus mide texto plano
sobre fondo plano y lo hace impecablemente; el primer día que le puse delante un
texto con halo devolvió un número correcto **de la pregunta equivocada**, sin
avisar. Heredar una herramienta obliga a comprobar que su pregunta sigue siendo
la nuestra.

**Traza:** `app/src/app/buscador.css` (`.chip-linea--contorno`) ·
`app/src/app/chip.ts` (`legiblePorContorno`) · `app/src/app/chip.spec.ts` (juez 1).


## [2026-08-31] ✅ CERRADA — El detalle del desvío se ve con `hidden` puesto: mi `display: block` gana a la regla del navegador

**Categoría:** una regla de CSS que pisa al atributo que la tenía que apagar

**Síntoma:** el desvío se parte en dos niveles y la lista de los diez postes
tiene que quedarse escondida hasta pulsar «detalles». En Chrome se ve entera
desde el primer momento. Medido en el DOM vivo, antes y después de pulsar:

```
CERRADO : {"atributoHidden":true,"display":"block","alto":72,"ancho":710,"altoDelBanner":114,"seVeElTexto":true}
ABIERTO : {"atributoHidden":false,"display":"block","alto":72,"ancho":710,"altoDelBanner":114,"seVeElTexto":true}
```

El atributo `hidden` sí cambia. El alto no se mueve: **72 px en los dos**, y el
banner mide 114 px cerrado, que es lo que mide abierto.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **tres jueces escritas
para este pulido**, 15, 16 y 17, que son justo las que compran que la lista no
se vea. Ejecutadas con el fallo delante, sin tocar nada:

```
$ npx ng test --include=src/app/buscador.spec.ts --filter="el desvío|el botón se alcanza|el hito también" --reporters=verbose
 ✓  desplazame  src/app/buscador.spec.ts > Buscador > ⭐ 15 · el hecho del desvío se ve siempre; la lista, no hasta pulsar 3069ms
 ✓  desplazame  src/app/buscador.spec.ts > Buscador > ⭐ 16 · el botón se alcanza con el tabulador, dice su estado y alterna 2875ms
 ✓  desplazame  src/app/buscador.spec.ts > Buscador > ⭐ 17 · el hito también parte en dos, y cada botón va por su cuenta 2834ms
 Test Files  1 passed (1)
      Tests  3 passed | 73 skipped (76)
```

Y la muralla entera, `Tests  195 passed (195)`. La sonda de Chrome también dijo
que estaba escondido — `CUERPO #detalle-banner-0 visible=false` — porque
preguntaba por `e.hidden`.

**Cómo se cazó:** ojo humano sobre una cifra de la sonda: el `alto del banner`
salía **114 px cerrado y 114 px abierto**, y un aviso que no crece al desplegarlo
no está desplegando nada.

**Causa raíz:** `[hidden] { display: none }` **es una regla de CSS como
cualquier otra**, no una propiedad del elemento, y pesa lo mismo que una clase
—selector de atributo, especificidad (0,1,0)—. Mi `.detalles__cuerpo { display:
block }` empataba con ella y ganaba por venir después: la hoja del autor va
detrás de la del navegador. El atributo se ponía y no apagaba nada.

Y las tres jueces no lo veían porque preguntaban `cuerpo.hidden === true`, que
era **cierto**: el atributo estaba puesto. Medían lo que el código hacía, no lo
que se prometía — «esto no se ve» no es un atributo, es un píxel.

**Arreglo aplicado:** dos cosas, y ninguna es un `!important`:
1. `app/src/app/buscador.css` — `.detalles__cuerpo` pasa a
   `.detalles__cuerpo:not([hidden])`, que pesa (0,2,0) **y** deja de aplicarse
   mientras está oculto.
2. `app/src/app/buscador.spec.ts` — un ayudante `seVe(e)` que pregunta por
   `getComputedStyle(e).display !== 'none'`, y las siete aserciones de las
   jueces 15, 16 y 17 pasan a usarlo. Con el CSS todavía roto, las tres se
   pusieron **rojas** antes de tocar la hoja.

Medido en Chrome después: el banner baja de **114 px a 36 px** cerrado, y el
detalle de 72 px a **0**:

```
CERRADO : {"atributoHidden":true,"display":"none","alto":0,"ancho":0,"altoDelBanner":36,"seVeElTexto":false}
ABIERTO : {"atributoHidden":false,"display":"block","alto":72,"ancho":710,"altoDelBanner":114,"seVeElTexto":true}
```

**Commit:** `e87cbdd`

**Ley que sale de aquí:** una prueba que pregunta por el ATRIBUTO no compra lo
que se VE. Si lo que se promete es «esto no se ve», el juez mide píxeles.

Y la que sale del cierre: **el atributo `hidden` no esconde nada por sí solo**
—lo esconde una regla de CSS que cualquier hoja de autor puede pisar—, así que
todo `display` sobre un elemento que se oculta con `hidden` se escribe
`:not([hidden])`. Escribir la juez a la vez que el código no basta si las dos
miran el mismo sitio equivocado: aquí el instrumento y el defecto nacieron el
mismo día y del mismo malentendido.

**Traza:** `app/src/app/buscador.css` (`.detalles__cuerpo`) ·
`app/src/app/buscador.html` (`[hidden]`) · `app/src/app/buscador.spec.ts`
(jueces 15, 16 y 17).


## [2026-08-31] ✅ CERRADA — Con dos vehículos desviados, las dos notas dicen lo del PRIMERO: el aviso de la 29 se pega al hito de la 22 porque nombra su poste

**Categoría:** dos reglas de casado en el orden equivocado

**Síntoma:** en Chrome, el caso del ojo de hoy —`COLOSO 2 → LEOPOLDO ROMEO 27`,
que sale en **29 + 22** y las **dos** líneas van desviadas— pinta dos notas junto
a los hitos y **las dos son la de la 29**:

```
BANNER: La línea 22 va hoy desviada: no para en Plaza Aragón N.º 1, Plaza De España…
BANNER: La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo…
NOTA  : ⚠ La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo…
NOTA  : ⚠ La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo…
```

Los dos banners están bien. La segunda nota —la del hito **«Sube a la línea 22 en
el poste Asalto / Centro De Historias»**— cuenta el desvío de la 29. Quien la
lea creerá que la 22 se salta las paradas que se salta la 29.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la juez **11** de
`buscador.spec.ts`, que es **exactamente la del aviso de desvío en el doble
sitio**, y con ella la suite entera del buscador. Ejecutada con el fallo vivo:

```
$ npx ng test --include=src/app/buscador.spec.ts
      Tests  70 passed (70)
```

Su fixture tiene **un solo vehículo y un solo aviso**, así que la pregunta que
falla —¿cuál de los dos avisos le toca a cada hito?— no se le llega a hacer.

**Cómo se cazó:** ojo humano — mirando la salida de la captura de Chrome antes
de darla por buena.

**Causa raíz:** `notaDelHito` tiene **dos reglas** para casar un aviso con el
hito que explica —«el que nombra tu sitio» y «el que es de tu línea»— y estaban
en el orden equivocado. Con un solo vehículo las dos dan lo mismo y da igual
cuál vaya primero; con dos, no: **el aviso de la 29 nombra el poste donde se
sube a la 22**, porque esa parada es una de sus provisionales. La regla del
sitio casaba primero y se lo quedaba.

El orden se eligió sin pensarlo, escribiendo la regla del sitio antes porque
era la que ya existía para el BiZi. Y la de la línea es la que **no admite
interpretación**: un texto que empieza por «La línea 22 » es de la 22 y de
ninguna otra; un sitio lo pueden nombrar dos avisos distintos.

**Arreglo aplicado:** ~~`app/src/app/buscador.ts` — en `notaDelHito`, la regla
de la línea pasa **delante** de la del sitio, con el porqué escrito al lado. Y
de paso `motor/src/viaje-bus.ts` filtra los avisos por línea **y dirección**.
`app/src/app/buscador.spec.ts` gana la juez **12**, con el caso entero y la
trampa dentro.~~ → ⏳ PENDIENTE (ver la reapertura)

**Commit:** ~~`519be6c`~~ → ⏳ PENDIENTE

---

### Nota de reapertura [2026-08-31] 🔁 — el cierre fue PARCIAL: se cambió el ORDEN de las dos reglas, pero la del sitio siguió viva

**Qué la reabrió:** el caso `COLOSO 2 → OVIEDO 5`, que sale en **35 + 31**. Aquí
**la 31 NO va desviada** y la 35 sí, y el aviso de la 35 nombra
`Av. Francisco De Goya N.º 83` entre sus paradas provisionales — que es justo
donde se sube a la 31. Con el arreglo del cierre anterior:

1. la regla de la línea busca un aviso que empiece por «La línea 31 » → no hay;
2. la regla del sitio busca uno que nombre `Av. Francisco De Goya N.º 83` →
   **encuentra el de la 35**, y se lo cuelga a la subida de la 31.

El orden estaba bien. Lo que sigue mal es que la regla del sitio exista para un
aviso de desvío: **un desvío explica una línea, no un poste**. Cambiar el orden
solo tapaba los casos en que la línea del hito también iba desviada.

**⭐ Qué dio verde mientras el fallo estaba vivo (2ª captura):** la juez **11** y
la **12** —las dos del aviso de desvío— y con ellas la suite entera del
buscador. Ejecutada con el fallo vivo:

```
$ npx ng test --include=src/app/buscador.spec.ts
      Tests  71 passed (71)
```

⚠️ Y la 12 se escribió **para este mismo fallo**: trae dos líneas y el poste
compartido. Lo que no trae es el caso que rompe — **una línea NO desviada
subiendo en un poste que otra desviada nombra**. Sus dos líneas van desviadas,
así que la regla de la línea casa siempre y la del sitio no llega a mirarse.

**Causa raíz (la de verdad, la que el primer cierre no vio):** `notaDelHito`
tenía **dos reglas** para casar un aviso, y una de ellas —«el que nombra tu
sitio»— **no debía aplicarse a un desvío en absoluto**. Un desvío explica una
línea; que nombre un poste es un accidente de su redacción, no una relación.

El primer cierre trató el síntoma —la regla equivocada ganaba— y no la
enfermedad —la regla equivocada existía—. Ponerla la segunda hizo que acertara
mientras la primera contestara, y el día que la primera calló —una línea NO
desviada— volvió el fallo entero.

Y salió un tercero al arreglarlo, del mismo material: la regla de la línea
preguntaba si **alguna** de las `via` del paso casaba, y un paso de transbordo
tiene **dos líneas**. Así que el transbordo a la 31 se quedaba también el aviso
de la 35 — correcto de casualidad, porque el de la 35 ya sale pegado a su
propia subida. No basta con «alguna de sus líneas»: hay que decir **cuál es la
línea de este hito**, y es a la que se SUBE.

**Arreglo aplicado:** `app/src/app/buscador.ts` — la regla del sitio **excluye**
los avisos de desvío (`!a.texto.includes(MARCA_DE_DESVIO)`), y nace
`lineaDelHito`, que dice cuál es la línea de un hito: la primera `via` en un
`sube`, la última en un `transborda`. `app/src/app/buscador.spec.ts` — la juez
**14** trae el caso que faltaba: **la 31 NO desviada subiendo en el poste que la
35 nombra**, que es justo el que la 12 no podía hacer porque sus dos líneas iban
desviadas. Contraprueba: con la regla del sitio de vuelta, `1 failed | 72
passed`.

**Commit:** `8dad9e7`

**Ley que sale de aquí:** cuando hay **dos reglas** para casar un aviso con lo
que explica, el orden entre ellas es parte de la regla — y hay que escribirlo y
comprarlo con un caso donde **las dos apliquen y digan cosas distintas**. Una
juez con un solo candidato no comprueba un casado: comprueba que hay texto.

Y la que sale de la reapertura, que es más dura: **cambiar el ORDEN de dos
reglas no arregla que una de ellas sobre.** Si la regla A puede dar una
respuesta falsa, ponerla la segunda solo esconde el fallo detrás de los casos en
que la B contesta — y el día que la B calle, vuelve. La pregunta al arreglar no
es «cuál va primero» sino «¿esta regla puede acertar por casualidad?».

**Traza:** `app/src/app/buscador.ts` — `notaDelHito`, `sitioDelHito`;
`app/src/app/buscador.spec.ts` — juez 11.

---

## [2026-08-31] ✅ CERRADA — La búsqueda se sube en la primera parada marcada del patrón y no la reconsidera: anda 478 m para coger la misma línea que tenía a 60 m

**Categoría:** regla de RAPTOR copiada sin traducir a costes

**Síntoma:** Antonio pide `COLOSO 2 → I.E.S. Grande Covián` en bus y el motor le
manda a **Bernardo Ramazzini / Maz, a 478 m**. A **60 m** de su portal está el
poste `PA00033` (Av. Academia General Militar N.º 37), y lleva **la misma línea
29, en la misma dirección, del mismo patrón `29|1|1`**. Medido:

```
POSTES A <=500 m DE COLOSO 2, POR EL PEATON
  SI    39 m recta ·    60 m andando · PA00033 Av. Academia General Militar N.º 37 · 29← 35→
  SI   398 m recta ·   478 m andando · PA01203 Bernardo Ramazzini / Maz            · 29←   <- el que elige
indices en el patron 29|1|1:  Ramazzini = 8 · poste 33 = 10  (rodar del 8 al 10: 87 s)
coste con walkReluctance 1: por Ramazzini 870 s · por el poste 33 482 s  -> el 33 gana por 388 s
```

Paga **418 m de más andando y 87 s de más rodando**, y con el peso que ya había.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la **juez 1 de la casilla 3b**,
que es justamente la del caso del ojo y la que compra los postes. Ejecutada con
el fallo vivo, antes de tocar nada:

```
$ node --test src/viaje-bus.spec.ts
  ✔ ⭐ 1 · el caso del ojo sale en un vehículo, con sus postes y sus cifras (10.9446ms)
ℹ tests 15
ℹ pass 15
ℹ fail 0
```

Y lo que compra, literal (`motor/src/viaje-bus.spec.ts:111-112`):

```ts
assert.equal(nombre.get(viaje.accesoAndando.parada), 'Bernardo Ramazzini / Maz');
assert.equal(viaje.accesoAndando.metros, 478);
```

Ese `'Bernardo Ramazzini / Maz'` y ese `478` **los copié de lo que el motor
devolvía**. La juez no compraba un viaje razonable: compraba el viaje que
salía.

**Cómo se cazó:** usuario — Antonio lo vio en localhost y dijo que tenía un poste
de la 29 a veinte metros de casa.

**Causa raíz:** una regla de RAPTOR copiada **sin traducirla**. En el RAPTOR de
libro la etiqueta de una parada es una **hora de llegada**, y por eso *«subirse
en la primera parada marcada»* es correcto: subir antes nunca hace llegar más
tarde, y la regla de «coger un vehículo anterior» solo mira si en esta parada se
puede coger uno que salga antes.

Aquí la etiqueta es un **coste** y no hay horas — no se pregunta a qué hora
sales [firmas 6 y 7]. Con costes, subir antes **cuesta más rodar**, así que
«la primera marcada» deja de ser óptima y pasa a ser simplemente la primera. La
regla existía en el código, con su cita, y lo que faltaba era la traducción.

Y la juez no lo vio porque su valor esperado salió de la propia salida del
motor: se escribió mirando lo que devolvía, no lo que tenía que devolver.

**Arreglo aplicado:** `motor/src/viaje-bus.ts` — la fase de patrones se recorre
con un **mínimo corrido**, `min_{k' <= k} (coste[k'] + espera − acumulado[k']) +
acumulado[k]`, y la subida se reconsidera en cada parada; `acumuladoDe` da los
segundos de rodar desde el principio del patrón. En `motor/src/viaje-bus.spec.ts`
la juez 1 compra el poste **justificado** —y comprueba que Ramazzini sigue
siendo un acceso posible, para no ganar por ausencia—, la 16 es nueva y compra
el índice 10 contra el 8, y las 11, 12 y 14 sacan del viaje lo que antes tenían
escrito a mano.

Medido: el caso del ojo pasa de **51,8 a 43,0 min** con solo este arreglo, y el
caso (A) de Antonio de **81 a 47**. Con la doctrina entera —pesos y acceso— el
ojo acaba en **35,9** y el (A) en **39,5**.

**Commit:** `bf59be4`

**Ley que sale de aquí:** **el guardián de un viaje compra los postes que
cogeria un vecino, no los que el motor devolvió.** Un valor esperado copiado de
la salida no es una expectativa: es un calco, y calca también el fallo. Cuando
el esperado sea una elección —qué poste, qué línea— hay que poder decir **por
qué ese y no el de al lado**, con el número delante.

Y una segunda, que salió al cerrar: **una regla prestada se traduce, no se
copia.** El código traía la cita de RAPTOR correcta y la aplicaba sobre una
etiqueta que no era la suya. Cuando se toma una regla de un algoritmo publicado,
hay que escribir **qué supone** —aquí: que la etiqueta es una hora— y comprobar
que eso se cumple en casa.

**Traza:** `motor/src/viaje-bus.ts` — `buscarViaje`, la fase de patrones (`la
parada marcada más temprana del patrón`); `motor/src/viaje-bus.spec.ts` — juez 1.

---

## [2026-08-31] ✅ CERRADA — Una juez escribe el cocinado de producción con una red cocinada SIN peatón, y el motor arranca sirviendo 0 transbordos

**Categoría:** juez que escribe el dato del producto

**Síntoma:** el motor arranca y dice que la red no tiene ni un transbordo:

```
$ node src/servidor.ts
motor: red de bus LEÍDA del cocinado — 984 paradas · 170 patrones · 0 transbordos · 14 ms
motor: escuchando en http://localhost:3000 (pid 19108)
```

Deberían ser **10.588**. El fichero de disco lo confirma:

```
$ node -e "..."
cocinado en disco: transbordos = 0 | formato 2 | feed 20260623_AUZSA_Y_TRANVIA | 2240344 bytes
```

Lo escribió la juez 12 de `red-bus.spec.ts`, que llama a `guardarCocinado(red)`
con una red cocinada con `andar = null` —sin peatón, para no cargar 68.649
nodos—. Es la juez que **yo acabo de escribir hoy** para cerrar la entrada de
aquí abajo. Con la red así, la fase de transbordos de RAPTOR se queda sin
aristas y **ningún viaje puede cambiar de vehículo andando**.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la suite del motor entera,
**incluida la juez 12 que es la que rompe el dato**. Ejecutada con el fichero ya
estropeado:

```
$ node --test "src/**/*.spec.ts"
ℹ tests 423
ℹ pass 423
ℹ fail 0
```

Y el guardián nuevo del formato tampoco lo ve: el fichero es del `formato 2`
correcto y del feed correcto. Lo único que le falta no se mira.

**Cómo se cazó:** instrumento — la regla de la casa `pid del log == pid que
contesta`. Al ir a medir el caso del ojo, el pid del log (22652) no era el que
escuchaba (21636); al limpiar y arrancar uno solo, la primera línea del arranque
decía `0 transbordos`.

**Causa raíz:** dos cosas que se juntaron, y la primera es una ley mal aplicada.

La nº17 dice que **un valor por defecto que producción usa necesita una juez que
lo llame sin argumento**, y la leí como «hay que ejercitar el defecto» sin
preguntarme qué hace ese defecto. `cocinadoGuardado` LEE —llamarla no estropea
nada— y `guardarCocinado` ESCRIBE el fichero que el producto sirve. Ejercitar el
defecto de la segunda es pisarle el dato al producto, y eso no lo pide ninguna
ley. Encima con una red cocinada **sin peatón**, que la juez usaba a propósito
para no cargar 68.649 nodos por una comprobación de ida y vuelta.

La segunda: el guardián que acababa de nacer —`sirveElGuardado`— preguntaba **de
qué versión** es el fichero, y no **si está completo**. Un cocinado sin peatón
tiene el formato bueno y el feed bueno; lo único que le falta no se miraba.

**Arreglo aplicado:** `motor/src/red-bus.ts` — `RedDeBus.conPeaton` (que
`cocinar` rellena con `andar !== null`), exigido por `sirveElGuardado`; formato
a **3**; y `guardarCocinado(red, ruta = COCINADO)` con la ruta por parámetro.
`motor/src/red-bus.spec.ts` — la juez 12 escribe en un temporal de `tmpdir()` y
lo borra; la 11 gana el caso de la red sin peatón. El defecto de escritura queda
**sin juez a propósito**, y se dice en su comentario: es la misma constante que
el de lectura, que sí se llama sin argumento.

Comprobado como se rompió: borrado el cocinado, corrida la suite entera y el
fichero **ya no aparece**; arrancado el motor, `10588 transbordos a pie` y
`pid del log == pid que escucha` (21936).

**Commit:** `a3a23e8`

**Ley que sale de aquí:** una juez **no escribe el dato que el producto lee**.
Si para probar el camino de escritura hace falta escribir, se escribe en otro
sitio; y lo que el producto sirve tiene que poder decir por sí mismo si está
completo, no solo de qué versión es.

Y un añadido a la nº17, que salió al cerrar: **el defecto que se ejercita es el
que no tiene efectos**. Una función que lee por defecto se prueba llamándola sin
argumento; una que escribe, no — ahí lo que se clava es que las dos compartan
la constante.

**Traza:** `motor/src/red-bus.spec.ts` — juez 12; `motor/src/red-bus.ts` —
`guardarCocinado`, `sirveElGuardado`, `cocinar`;
`app/data/nap_gtfs-ficha1176.cocinado.json`.

---

## [2026-08-31] ✅ CERRADA — El cocinado del disco se sirve tal cual aunque la cocina haya cambiado de forma: el motor arrancaría con saltos SIN traza y la suite entera en verde

**Categoría:** caché en disco sin versión de su propio esquema

**Síntoma:** la casilla 4 añade a cada `SaltoBus` su `traza`, sus `metros` de
asfalto y su `recta`. Cocinando de cero salen. Pero el arranque de verdad no
cocina: lee `app/data/nap_gtfs-ficha1176.cocinado.json`, y ese fichero es de
antes del cambio. Ejecutado el camino del arranque, sin tocar nada:

```
$ node -e "cocinarYServir(feed, '20260623_AUZSA_Y_TRANVIA', null)"
deDisco: true | salto[0] del patron 1|0|1: {"tipico":128,"maximo":147}
```

Ni `traza`, ni `metros`, ni `recta`. El motor serviría la geometría vieja —la
recta de poste a poste— con el código nuevo dentro.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la suite del motor **entera**,
incluidas las cinco jueces recién escritas de la traza y la 15 del asfalto.
Ejecutada con el fallo vivo:

```
$ node --test "src/**/*.spec.ts"
ℹ tests 421
ℹ pass 421
ℹ fail 0
```

Las jueces de la traza llaman a `cocinar()` directamente y ven las trazas; el
arranque llama a `cocinarYServir()` y ve el fichero viejo. **Ninguna juez pasa
por el camino que usa el producto.**

**Cómo se cazó:** ojo humano — al ir a medir el caso del ojo por HTTP me acordé
de que el cocinado se guarda en disco, y fui a mirar qué se sirve.

**Causa raíz:** el guardián del cocinado comparaba **una sola cosa**: que el
`feed_version` del fichero fuera el del zip que se sirve. Esa comparación
responde a «el dato de origen no ha cambiado», que era la única pregunta que
había que hacerse mientras la forma del cocinado no se moviera — y llevaba sin
moverse desde que nació, ayer. En cuanto la forma cambió, la pregunta se quedó
corta y nadie la amplió, porque el fichero **no decía de qué forma era**.

Y la suite no lo vio por una razón aparte, que es la que la hace cómplice:
**ninguna juez entraba por `cocinarYServir`**. Todas llamaban a `cocinar()`, que
siempre da la forma de hoy porque la acaba de fabricar. El atajo del disco —que
es lo que el producto usa **siempre** salvo la primera vez— no tenía juez.

**Arreglo aplicado:** `motor/src/red-bus.ts` — `FORMATO_DEL_COCINADO` (hoy `2`),
que viaja dentro del propio fichero en `RedDeBus.formato`, y `sirveElGuardado`,
que junta las tres condiciones en una función a la que se le puede poner una
juez delante sin arrancar el motor: formato, feed y no vacío. `cocinarYServir`
la llama en vez de comparar a mano. Y dos jueces en `motor/src/red-bus.spec.ts`:
la **11** rechaza un cocinado de otro formato —y uno sin el campo, que es como
estaba el de ayer—, y la **12** entra por el camino del arranque de verdad,
guardando y leyendo con la ruta de producción [ley nº17], y comprueba que lo
que vuelve trae sus trazas.

**Commit:** `c8e40c1`

**Ley que sale de aquí:** un fichero derivado que se guarda para no recalcularlo
necesita **la versión de su propio formato**, no solo la del dato de origen. La
versión del origen dice «el dato no ha cambiado»; no dice «yo sé escribirlo como
lo lee el código de hoy».

Y una segunda, que salió al cerrar: **un atajo que el producto usa siempre
necesita una juez que entre por él**. Aquí había doce jueces sobre la cocina y
ninguna sobre el camino que de verdad se recorre al arrancar; probar la función
que fabrica no es probar la que sirve.

**Traza:** `motor/src/red-bus.ts` — `cocinadoGuardado`, `guardarCocinado`,
`cocinarYServir`; `app/data/nap_gtfs-ficha1176.cocinado.json`.

---

## [2026-08-31] ✅ CERRADA — `downloadLink` manda `text/plain`, mi código pide `.json()`, y mi juez pasa porque el fixture inventó unas comillas que el NAP no pone

**Categoría:** fixture que copia el esquema y no la respuesta

**Síntoma:** con la clave ya encontrada, la primera descarga real del feed
muere antes de bajar un byte:

```
$ node src/sonda-fetch.mjs
NAP_API_KEY presente: true
registro previo: NO (nunca se ha renovado)

LANZO: Error
  No se ha podido descargar del NAP: Unexpected token 'h', "https://mf"... is not valid JSON
```

**Lo que el NAP manda de verdad**, medido contra `downloadLink/1176`:

```
status      : 200
content-type: text/plain; charset=utf-8
largo       : 397 caracteres
empieza por : "https://mfom"
¿comillas?  : false
JSON.parse  : FALLA → Unexpected token 'h', "https://mf"... is not valid JSON
host        : mfomwpronapdata.s3.eu-west-1.amazonaws.com
```

Es **un enlace firmado de S3 en texto plano**, sin comillas. Mi código hacía
`await r.json()` y reventaba ahí.

⚠️ **Y lo peor es de dónde salió el error.** El OpenAPI declara para esa ruta
`{"type": "string"}`, lo leí, y escribí en el comentario del código que devuelve
«un string pelado» — que es exactamente lo que devuelve. Pero al construir el
fixture traduje «string» a **string JSON**, con sus comillas y su
`Content-Type: application/json`, porque es lo que hacen las otras rutas del
mismo API. **Leí el esquema y luego inventé la codificación.**

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **trece** pruebas de
`renovar-feed.spec.ts`, con la juez 2 —la de la descarga— entre ellas:

```
$ node --test src/renovar-feed.spec.ts
  ✔ ⭐ 2 · si la fecha cambió, descarga y deja el registro completo (15.102ms)
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

La juez 2 baja el zip, comprueba el `sha256`, el `feed_version`, los bytes y la
fecha del registro. Todo correcto — **sobre una respuesta que el NAP no manda**.
El fixture era:

```
return respuesta(JSON.stringify('https://descargas.nap.example/1176.zip'));
```

`JSON.stringify` de un string le pone comillas y `respuesta()` le cuelga un
`Content-Type: application/json`. Dos decisiones mías, ninguna del servidor.

**Cómo se cazó:** la prueba real contra el NAP, otra vez. La suite es de red
cero a propósito y eso está bien; lo que enseña este caso es que **una suite sin
red no puede validar la forma de una respuesta ajena** — solo puede validar que
el código hace lo que el fixture describe. Si el fixture miente, el verde
también.

**Causa raíz:** **leí el esquema y después inventé la codificación.** El OpenAPI
dice `{"type": "string"}`, y eso es cierto y suficiente para saber *qué* viaja —
pero no dice *cómo*: si va entre comillas como valor JSON o pelado como
`text/plain`. Rellené ese hueco con la costumbre de las otras rutas del mismo
API, que sí devuelven JSON, en vez de con una medición. Y como el fixture lo
escribí yo con esa misma suposición, la prueba y el código estaban de acuerdo
**en el error**: dos piezas mías confirmándose la una a la otra.

**Arreglo aplicado:** el enlace se lee con `r.text()` y `elEnlace` acepta **las
tres formas** —URL pelada, string JSON entrecomillado, u objeto con
`enlaceDescarga`—, porque la de hoy está medida y la de mañana no. El fixture
pasa a mandar la forma real: `text/plain; charset=utf-8` con el URL sin
comillas. Con ella puesta **caen tres jueces** (la 2, la 3 y la 4) contra el
código viejo, que es lo que tenía que haber pasado desde el principio.

Y la prueba real, entera, en dos pasadas:

```
1ª (sin registro previo) → renovado · sha256 5c96992c… · 20260623_AUZSA_Y_TRANVIA
2ª (con registro)        → sin-cambios · 2026-06-30T13:20:04.661082
```

**Commit:** `de5bcba`

**Ley que sale de aquí:** **un esquema dice el TIPO, no la codificación.**
«String» no dice si viaja entre comillas, y esa diferencia rompe. La forma de
una respuesta ajena **se mide una vez contra el servidor** y el fixture copia la
medición, no la lectura del esquema. Y su corolario, que es el que duele: **una
suite sin red no puede descubrir que un fixture miente** — solo comprueba que el
código hace lo que el fixture describe. Red cero sigue siendo lo correcto para
la suite; lo que hace falta al lado es **una prueba real, una sola, antes de
cantar victoria**.

**Traza:** `motor/src/renovar-feed.ts` (el `await r.json()` del bloque del
enlace, y `elEnlace`) · `motor/src/renovar-feed.spec.ts` (`napQueFunciona`, el
fixture del `downloadLink`).

---

## [2026-08-31] ✅ CERRADA — El lector de `.env.local` busca la clave donde no está, y su juez pasa porque nunca le pregunta por su ruta por defecto

**Categoría:** guardián que prueba la función pero no el valor por defecto

**Síntoma:** Antonio pone la clave del NAP en `motor/.env.local` y la prueba real
del fetch muere sin salir a la red:

```
$ node src/sonda-fetch.mjs
el fichero de entorno que el codigo mira: F:\01_PROYECTOS\004_DESPLAZAME\.env.local
variables que .env.local ha aportado: (ninguna)
NAP_API_KEY presente: false
registro previo: NO (nunca se ha renovado)

LANZO: ErrorDeConfiguracion
  Falta NAP_API_KEY. Se para aquí aunque ya haya un zip: …
```

El fichero existe —`motor/.env.local`, 2.956 bytes— y está bien ignorado por
git. Lo que está mal es **dónde mira el código**: `FICHERO_DE_ENTORNO` apunta a
`../../.env.local`, o sea a la **raíz del repositorio**, y ahí no hay nada. El
motor es un paquete del *workspace* con su propia raíz en `motor/`, que es donde
una persona razonable pone el `.env.local` del motor — y donde lo puso Antonio.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **doce** pruebas de
`renovar-feed.spec.ts`, con la juez 12 —la del lector de entorno— la primera de
la lista:

```
$ node --test src/renovar-feed.spec.ts
  ✔ ⭐ 12 · .env.local rellena lo que falta, respeta lo que hay, y no devuelve valores (2.7195ms)
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

⚠️ **Y la razón de que pase es exacta y se ve en dos líneas.** La juez 12 llama
siempre con una ruta explícita:

```
$ grep -n "cargarEntornoLocal(" src/renovar-feed.spec.ts
395:      const puestas = cargarEntornoLocal(ruta);
403:      assert.deepEqual(cargarEntornoLocal(join(dir, 'no-existe')), []);
```

Las dos pasan un directorio temporal que la propia prueba acaba de crear.
**Nunca la llama sin argumento**, así que el valor por defecto —lo único que se
usa en producción— no lo ejerce nadie. La juez compra que el *parser* funciona;
lo que no compra es que el fichero que el motor va a abrir sea el que existe.

**Cómo se cazó:** la prueba real del encargo. Ninguna prueba de la suite podía
cazarlo, porque ninguna miraba la ruta por defecto — y la suite es de red cero,
así que tampoco habría llegado nunca al NAP para notarlo.

**Causa raíz:** escribí una ruta por defecto **sin preguntarme dónde la pondría
quien tiene que ponerla**. Y la juez que cubría el lector la escribí igual de
cómoda: pasándole una ruta explícita a un temporal, que es lo fácil de montar.
Probar la función con un parámetro **no prueba el valor por defecto**, y el valor
por defecto era lo único que producción iba a usar.

**Arreglo aplicado:** `FICHEROS_DE_ENTORNO` pasa a ser **una lista de dos** —
`motor/.env.local` primero, la raíz del repositorio después— y
`cargarEntornoLocal` las recorre en orden, con lo ya puesto mandando siempre.
Se miran las dos porque **las dos convenciones son razonables**: elegir una sola
es volver a apostar a que quien ponga la clave adivine cuál elegimos.

**Juez nueva, la 13**, que sí pregunta por el valor por defecto: compra que el
primero de la lista es el del motor y el segundo el de la raíz, y que con dos
ficheros el primero manda y el segundo completa. Con el código viejo se pone
roja.

Comprobado en vivo después: `motor: .env.local aporta 2 variable(s):
NAP_API_KEY, DESPLAZAME_REGEN_TOKEN` — los **nombres**, nunca los valores.

**Commit:** `de5bcba`

**Ley que sale de aquí:** **un valor por defecto que producción usa necesita una
juez que lo llame SIN argumento.** Una prueba que siempre pasa la ruta, el
puerto o el fichero por parámetro está probando el mecanismo y dejando el
*default* —que es la parte que nadie vuelve a mirar— sin vigilar. Si un
parámetro tiene valor por defecto, ese valor es código, y el código sin juez es
una apuesta.

**Traza:** `motor/src/renovar-feed.ts` (`FICHERO_DE_ENTORNO`, y
`cargarEntornoLocal` que lo usa por defecto) · `motor/src/renovar-feed.spec.ts`
(la juez 12, que solo llama con ruta explícita) · `motor/src/servidor.ts` (donde
se llama sin argumento al arrancar, que es el uso de verdad).

---

## [2026-08-30] ✅ CERRADA — Corregí un `oneway` que estaba BIEN: Siresa quedó invertida, y hoy la calle SOLO se puede recorrer en el sentido que el terreno prohíbe

**Categoría:** dato escrito a mano sobre un testimonio que no era del terreno

**Síntoma:** el 29/08 metí en `SENTIDOS_CORREGIDOS` la Calle Monasterio de
Siresa (`way 24433275`) con `correccion: '-1'` — o sea, **al revés del dibujo de
OSM**—, a raíz de que Antonio mirara la ruta `COLOSO 2 → LEOPOLDO ROMEO 27` en
bici y viera que «subía la calle al revés». Hoy, 30/08, Antonio precisa la
dirección exacta: **Monasterio de Siresa es de sentido único HACIA el Doctor
Iranzo; no se entra desde el Doctor Iranzo.** Ese es exactamente el
`oneway=yes` que OSM ya traía. **La corrección invirtió un dato que estaba
bien**, y el motor ha estado un día entero con la calle del revés.

**Lo que el motor hace ahora mismo con esa calle**, medido punta a punta sobre
la red de la rueda —el `way` va dibujado de oeste (`-0.866521, 41.647517`) a
este (`-0.861679, 41.647264`), y es el extremo **este** el que da al Doctor
Iranzo, a 185 m—:

```
$ node --test src/sonda-siresa.spec.ts
SIRESA: aristas 10 sentido -1,-1,-1,-1,-1,-1,-1,-1,-1,-1
SIRESA A->B (dibujo, hacia Iranzo): SIN RUTA
SIRESA B->A (contra el dibujo, DESDE Iranzo): 414.1 m | trozos por Siresa: 11 (424.0 m)
```

Las dos líneas dicen lo mismo desde los dos lados: **el único sentido en el que
el motor deja recorrer Siresa es el que el terreno prohíbe**, y el sentido
verdadero —hacia Iranzo— ni siquiera tiene ruta.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **cinco** pruebas de
`motor/src/sentidos.spec.ts`, con la corrección invertida puesta y aplicada:

```
$ cd motor && node --test src/sentidos.spec.ts
▶ ⭐ LOS SENTIDOS: la corrección de Siresa y el banco de testigos
  ✔ ⭐ el juez de Siresa: la ruta COLOSO→ROMEO ya no la recorre hacia Iranzo (11.9624ms)
  ✔ ⭐ el deshielo: § 1.21 sigue diciendo lo que decía cuando se corrigió (64.1966ms)
  ✔ ⚠️ TESTIGO A · siete calles que MU1 dice de un sentido y la bici remonta hoy (17.2727ms)
  ✔ ⚠️ TESTIGO B · dos calles que MU1 dice de doble sentido y la bici rodea hoy (3.1296ms)
  ✔ ⚠️ el punto ciego: 16.504 aristas de sentido único donde una inversión podría esconderse (6.6179ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

⚠️ **Y la que más duele es la primera, que la exigí yo.** «El juez de Siresa»
compra dos cosas: que las diez aristas valen `-1`, y que la ruta del caso **no
pisa la calle**. Las dos son ciertas hoy y las dos son **el invariante
equivocado**: la primera afirma como correcto justo el valor que está mal, y la
segunda mira una ruta que —medido— **no pasa por Siresa ni antes ni después de
la corrección** (`trozos por Siresa: 0` en la ida y en la vuelta). Un juez que
vigila una calle por la que la ruta que examina no pasa no puede ponerse rojo
nunca: **compraba el resultado, no la causa**.

**Cómo se cazó:** no lo cazó ninguna prueba ni ninguna sonda — lo cazó Antonio
volviendo a la calle y **diciendo la dirección**, que es el dato que el 29 no se
llegó a preguntar. La sonda-Cygnus tampoco podía: `doble_sent` de MU1 dice **si**
hay sentido único, no **cuál**, y ésta es precisamente una de las 1.185 vías del
punto ciego que la propia prueba nº5 documenta.

**Causa raíz:** **el testimonio que se codificó no era el del terreno.** Antonio
dijo el 29 que la ruta «subía la calle al revés»; yo escribí una fila de sentido
a partir de eso. Pero una queja dice **que algo está mal**, no **hacia dónde va
la calle**, y entre las dos frases hay un dato que nadie llegó a decir. Lo
rellené con lo que parecía, y salió al revés — la ruta de la queja bajaba Siresa
hacia Iranzo, que es lo legal, y lo que le pasaba era otra cosa.

Y la juez que escribí para defender la fila heredó el mismo defecto: la escribí
mirando **el resultado que quería ver** —que la ruta del caso dejara de pisar la
calle— en vez del hecho que había que garantizar, que es en qué dirección se
puede recorrer. Por eso podía estar verde con la calle del revés.

**Arreglo aplicado:** la fila **fuera**, y la tabla se queda **vacía y viva** —
las tres cerraduras, el deshielo y el log de arranque siguen enteros, probados
ahora con una fila de mentira, porque lo que hace falta garantizar es que la
próxima corrección nazca con su caducidad puesta. [CycleStreets] la *repair
table* se **poda** cuando el testimonio que la sostenía cae. El log de arranque
sabe decir el cero:

```
motor:   y 0 aristas por CORRECCIÓN verificada: la tabla está VACÍA
         (el mecanismo sigue puesto; hoy no hay ninguna calle mirada por el ojo)
```

Las jueces se rehicieron contra **la calle**, no contra la tabla, y miran
**`t.g`** —la geometría en el orden en que se anduvo—: bajar Siresa hacia Iranzo
son 414 m con sus 10 aristas; desde Iranzo hay que rodear 602 m **sin pisar ni
un metro** de ella. Las siete expectativas nuevas muerden una a una, y volver a
meter la fila invertida pone las tres jueces en rojo.

⭐ **Y el cuadre que cierra el círculo.** Al retirar la fila, el patín del caso
sube +2 m, y esos 2 m se explican arista a arista: sale el rodeo por Silvestre
Pérez (131,2 m) + Doctor Iranzo (74,7 m) = **205,900 m**, y entra Monasterio de
Siresa (**130,1 m**, aristas 3062/3063/3064) + Guadalupe (78,0 m) = **208,100 m**,
con 0,000 de las comunes. Esos **130,1 m son exactamente los que la juez de ayer
llamaba «130,1 m a contramano»** en su propio comentario: lo que el 29 se
diagnosticó como el error era el comportamiento correcto, y la corrección lo
quitó. Hoy vuelve.

**Commit:** `84a6454`

**Ley que sale de aquí:** **antes de escribir una fila de sentido se le pregunta
al ojo la dirección exacta de la calle — no se deduce de la queja.** Una queja
prueba que algo va mal; no dice hacia dónde va la calle, y ese hueco no se
rellena con lo probable. Y su mitad gemela, que es la que dejó el fallo vivo un
día entero: **un guardián de sentido compra la DIRECCIÓN en la que se puede
andar, nunca el resultado que se esperaba ver.** «La ruta ya no pisa esa calle»
es un resultado, y encima medido sobre una ruta que —comprobado— no la pisaba ni
antes ni después: un juez así no puede ponerse rojo nunca.

**Traza:** `motor/src/sentidos-corregidos.ts` (la fila del `way 24433275`) ·
`motor/src/sentidos.spec.ts` (el juez que compraba el invariante equivocado) ·
`motor/src/red-rueda.ts` (donde `sentidoCorregidoDe` se aplica al construir
`rueda.sentido`).

---

## [2026-08-30] ✅ CERRADA — El aviso que hace legales los hitos sin número no lo vigila NADIE: borrarlo de la pantalla deja las 175 pruebas en verde

**Categoría:** guardián que no existe sobre una regla firmada

**Síntoma:** Antonio ve en ruta viva `COLOSO 2 → LEOPOLDO ROMEO 27` en BiZi con
los dos hitos **pelados** —«Coge una bici en la estación Tauromaquia», sin «N
bicis disponibles a las HH:MM»— y reporta que **tampoco ve el aviso** de
«disponibilidad no verificada», que es lo único que hace legales unos hitos sin
número [plan D-G, firmado el 28/08].

**Lo primero, el diagnóstico, y no es lo que parecía.** La API de la sede está
contestando **`200 OK` con `Content-Length: 0`** — cuerpo vacío—, medido tres
veces seguidas y también sin `?rows`:

```
$ curl -s -o /dev/null -w "http=%{http_code} bytes=%{size_download}\n" \
    "https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/estacion-bicicleta.json?rows=300"
http=200 bytes=0
http=200 bytes=0
http=200 bytes=0
```

Dos horas antes devolvía **247.955 bytes**. Así que **el motor hizo lo correcto**
—el `json()` sobre un cuerpo vacío lanza, `disponibilidadDeBiZi` devuelve `null`,
el D-G salta— **y el aviso SÍ viaja en la respuesta y SÍ se pinta en pantalla**,
comprobado por CDP sobre la página servida. **No hay regresión.**

**El fallo es otro y es más callado: nada vigila que ese aviso se pinte.** Hasta
las casillas 5 y 6 (30/08), `avisos` no vacío implicaba `pasos` vacío — un
trayecto tenía ruta o tenía explicación, nunca las dos—. Desde el remate del
aparcabicis y el modo BiZi **conviven**: la ruta sale y el aviso la matiza. Las
tres pruebas que tocan avisos siguen siendo las de antes, las del caso sin ruta.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **175** pruebas de la
interfaz, con el aviso del motor **restringido a los trayectos sin pasos** — que
es exactamente el estado en el que los hitos de BiZi saldrían sin número y sin
una sola palabra que lo explicara:

```
$ cd app && npx ng test --watch=false
# con `@if (r.trayecto.pasos.length === 0) { @for (aviso of r.trayecto.avisos) … }`
 Test Files  11 passed (11)
      Tests  175 passed (175)
```

Y borrando el bloque ENTERO sí caen tres —«el aviso del motor se enseña en ámbar,
**y no se lista ningún paso**», el bus y el coche—: las tres compran el caso en el
que **no hay ruta**. Ninguna compra el que sí la hay.

**Cómo se cazó:** el ojo de Antonio sobre la ruta viva, y después la mutación
exacta. Reproducir el síntoma llevó a que el sistema estaba bien; mutar el
guardián enseñó que el sistema estaba bien **por casualidad**.

⚠️ **Y un dato mío que hay que corregir de paso:** la sonda de Chrome con la que
escribí el checkpoint de las casillas 5-6 buscaba los avisos por
`.aviso, .pasos__aviso, .ruta__aviso`, y la clase de verdad es **`.aviso-ruta`**.
Así que cuando aquel checkpoint decía que las rutas de bici, patín y BiZi salían
«sin AVISO», **no es que no los hubiera: es que el instrumento no podía verlos**.

**Causa raíz:** el guardián se escribió cuando la regla que vigilaba era otra.
Las tres pruebas de aviso nacieron entre el 20 y el 30/08, cuando un `Trayecto`
con `avisos` **no podía tener pasos**: eran mutuamente excluyentes, así que
comprobar «hay aviso» y «no hay ningún paso» en la misma prueba era comprobar lo
mismo dos veces. El 30/08 las casillas 5 y 6 rompieron esa exclusión —el remate
sin aparcabicis y el plan D-G del BiZi devuelven **ruta y aviso a la vez**— y
ninguna prueba se enteró, porque ninguna se puso roja: la regla vieja seguía
siendo cierta en sus casos. **Un guardián no falla cuando el mundo cambia
debajo; simplemente deja de cubrirlo.**

**Arreglo aplicado:** una juez en `app/src/app/buscador.spec.ts` —«⭐ el aviso se
enseña TAMBIÉN cuando la ruta sale»— con los **dos** casos de la clase nueva, que
son el mismo hueco: el D-G del BiZi con sus hitos pelados, y la bici sin
aparcabicis cerca. Sus dos fixtures llevan la respuesta **real** del 30/08, no
una inventada. La contraprueba es la misma mutación que abrió esta entrada
—envolver el bloque de avisos en `@if (pasos.length === 0)`—, y ahora **pone la
juez roja**: 175 de 176.

⚠️ **El código de pantalla no se ha tocado, y es a propósito**: hacía lo correcto.
Lo que faltaba era la prueba. Un arreglo que hubiera movido la plantilla habría
tapado el hallazgo en vez de cerrarlo.

De paso, y porque es de la misma tarde: el `200` con cuerpo vacío queda nombrado
donde se recoge (`motor/src/bizi.ts`) y en la ficha de la fuente
(`THIRD-PARTY-NOTICES.md` § 1.23).

**Commit:** `c452a8e`

**Ley que sale de aquí:** **cuando una regla del contrato se ensancha, hay que ir
a buscar a los guardianes que se apoyaban en la regla estrecha** — no van a
avisar, porque siguen pasando. Aquí la regla vieja era «avisos y pasos son
excluyentes» y no estaba escrita en ninguna parte: vivía en la forma de tres
pruebas, en el `@else` de una plantilla y en la cabeza de quien las escribió. El
día que dejó de ser cierta, lo único que lo habría delatado es preguntarle a cada
guardián **qué compra hoy**, y esa pregunta no se hace sola.

**Traza:** `app/src/app/buscador.html` (el `@for` de `r.trayecto.avisos` dentro
del `@if (resultado(); as r)`) · `app/src/app/buscador.spec.ts` (las tres pruebas
de aviso, todas con `pasos: []`) · `motor/src/viaje-bizi.ts` (el aviso del D-G) ·
`motor/src/bizi.ts` (`disponibilidadDeBiZi`, el `catch` que devuelve `null`).

---

## [2026-08-27] ✅ CERRADA — La dirección nombra una calle que no es la suya, y el emparejador casa con la homónima de la ciudad a 7,6 km

**Categoría:** falso positivo de geocodificación por topónimo parcial

**Síntoma:** el `Colegios.549` **C.E.I.P. Andrés Oliván** está en **San Juan de
Mozarrifar** y su coordenada municipal `[-0.8426853752732937,
41.716620571592415]` cae **a 11 m de «CALLE DOCTOR PALOMAR ---SJN 22»**, su
puerta. Pero su dirección publicada dice **«C/ Doctor Alejandro Palomar, 21»**, y
ese nombre **no es el de esa calle**: es el de otra, en la ciudad, a 7,6 km. El
emparejador casa con la única que encuentra y el sitio acaba en
`[-0.872152, 41.651282]`.

**No es el fallo de la nº13 ni lo arregla su cierre**, y por eso va aparte: allí
el rescate movía puntos que estaban en su calle; aquí el punto está en su calle y
**la calle con la que se casa es otra**. Las dos claves del índice son distintas
—`doctor palomar` y `doctor alejandro palomar`—, así que no hay homónimo que
desambiguar: la geo-desambiguación del 27/08 no lo ve.

**⭐ Qué dio verde mientras el fallo estaba vivo:** las **273** pruebas del motor,
con el arreglo de la nº13 dentro y este caso encabezando la lista de rescates:

```
$ cd motor && npm run probar
  ✔ ⭐ LAS 17 RESCATADAS, una a una y con sus metros de desvío (1.0764ms)
  ✔ ⭐ LA IDA Y VUELTA: ninguna rescatada estaba ya en SU PROPIA calle (43.0994ms)
ℹ tests 273
ℹ pass 273
ℹ fail 0
```

La lista de las 17 lleva `['Colegios.549', 7666, 'distancia']` **en primera
línea** y la prueba pasa: enumerar 7.666 metros no es lo mismo que ponerlos en
duda. Y el guardián de la ida y vuelta también da verde, porque mide lo que le
toca —si el punto estaba en la vía CON LA QUE CASÓ— y en esa vía no estaba.

**Cómo se cazó:** ojo humano sobre la tabla de rescates del cierre de la nº13:
7.666 m siguen sin explicarse aunque la regla nueva los declare correctos.

**Causa raíz:** el emparejador solo generaba candidatas por **clave exacta**, y
con una clave única no había nada que desambiguar: la geo-desambiguación de la
nº13 solo entraba en juego cuando dos vías se llamaban igual. Aquí las dos claves
son distintas —`doctor palomar` y `doctor alejandro palomar`—, así que **la única
candidata era la equivocada** y la puerta por la que habría entrado la correcta
estaba cerrada. El punto correcto tenía una puerta a 11 m y el emparejador ni la
miró, porque nunca llegó a considerarla.

**Arreglo aplicado:** dos piezas en `motor/src/gacetero.ts`, y ninguna es
doctrina nueva — son la de la nº13 extendida.

1. **Candidatas por subsecuencia de palabras** (`esSubsecuencia`): un nombre del
   callejero que quepa **en orden y con palabras enteras** dentro del escrito
   también es candidato. `[doctor, palomar]` cabe en `[doctor, alejandro,
   palomar]`. Con dos condiciones que la hacen segura: **palabras enteras**, así
   que «mina» no cabe en «taormina» —el fantasma de la tanda 1 no vuelve—, y
   **mínimo dos palabras**, porque un nombre de una sola cabría dentro de medio
   callejero. Y un índice nuevo, `nombresPorPrimeraPalabra`, para no recorrer los
   3.359 nombres por dirección: la carga sube de 24 a 37 ms.
2. **La guarda de cercanía cubre TODAS las candidatas**, lleguen por clave exacta
   o por subsecuencia. Entre las que la superan gana la clave exacta; entre
   varias subsecuencias, la más cercana.

⚠️ **Y hay un escalón declarado que no es un olvido: si NINGUNA candidata supera
la guarda, se cae a la clave exacta única.** Es lo que protege el desvío del
datum — las cuatro farmacias corridas 236 m están a 53-236 m de su propia vía, y
sin ese escalón dejarían de casar y de rescatarse, que es justo lo que la
validación espacial existe para hacer. La guarda decide **entre** candidatas; no
es un veto sobre lo que el dato afirma por su nombre.

**Resultado:** el `Colegios.549` vuelve a `[-0.8426853752732937,
41.716620571592415]` y **deja de rescatarse** — su vía real tiene una puerta a
11 m—. Los rescates bajan de 17 a **16**, los cuatro del datum siguen, y
`Farmacias.8855` —el caso que esta entrada dejó medido en rojo— **no se mueve**.

**Commit:** `6f1fd08`

**Ley que sale de aquí:** **una guarda que tapa un fallo no es una prueba de que
no lo haya.** La contraprueba lo enseñó en el sitio: mutando `esSubsecuencia`
para que comparase trozos de letras en vez de palabras —el fantasma entero de la
tanda 1— **las 277 pruebas seguían verdes**, porque la guarda de cercanía
descartaba después las candidatas absurdas y el resultado final no se movía. La
regla estaba rota y el sistema daba el mismo resultado. Una regla que solo se
verifica **por su efecto** deja de estar verificada en cuanto otra cosa la
protege: hay que poder probarla **sola**, y por eso `esSubsecuencia` se exporta.

**Traza:** `motor/src/gacetero.ts` (`portalDeLaDireccion`, `esSubsecuencia`,
`nombresPorPrimeraPalabra`, `viasPorNombre`) · `motor/src/trayecto.spec.ts` — el
testigo `⚠️ EL ANDRÉS OLIVÁN SIGUE ATERRIZANDO EN LA CIUDAD` **se cayó solo**, que
era para lo que estaba escrito, y en su sitio está su reverso verde: `⭐ EL ANDRÉS
OLIVÁN llega a SAN JUAN DE MOZARRIFAR, su barrio`.

## [2026-08-27] ✅ CERRADA — El rescate por callejero mueve coordenadas que ya estaban BIEN puestas, y una se va 7,7 km

**Categoría:** un arreglo que empeora lo que arregla

**Síntoma:** al entrar los colegios (tanda 4), el motor rescata **29** sitios. El
mayor: `Colegios.549` **C.E.I.P. Andrés Oliván**, movido **7.666 m**. Su
coordenada municipal `[-0.84269, 41.71662]` estaba **a 11 m de «CALLE DOCTOR
PALOMAR ---SJN 22»** —su portal de verdad, en San Juan de Mozarrifar— y el
rescate lo lleva a «CALLE DOCTOR ALEJANDRO PALOMAR 21», la calle homónima de la
ciudad. La ida y vuelta sobre los 29: **22 tenían su coordenada municipal a
≤50 m de un portal real** y aun así se movieron; **10 la tenían a ≤10 m**. No es
de hoy: de los 9 rescates que ya vivían en producción desde el 23-24/08,
**7 movían un punto que ya estaba a ≤50 m de un portal** (5 farmacias, 2 centros
de salud).

**⭐ Qué dio verde mientras el fallo estaba vivo:** el guardián
`⭐ LAS NUEVE RESCATADAS, una a una y con sus metros de desvío`
(`motor/src/sitios.spec.ts:670`), que enumera los nueve rescates con su código,
sus metros y su motivo — y ninguna de sus líneas pregunta si el sitio al que se
va es mejor que aquel del que viene. Ejecutado sobre el estado anterior, con los
siete rescates malos dentro:

```
$ cd motor && npm run probar
  ✔ ⭐ una coordenada a más de 50 m de su propia puerta, RESCATADA al portal (0.148ms)
  ✔ ⭐ y NADIE MÁS se mueve: los otros 371 conservan su coordenada (4.1587ms)
  ✔ ⭐ NINGUNA BIBLIOTECA se mueve: recinto, como los hospitales (4.1192ms)
  ✔ ⭐ NINGÚN HOSPITAL se mueve: la partición firmada, vigilada (4.9429ms)
ℹ tests 263
ℹ suites 33
ℹ pass 263
ℹ fail 0
```

Y el motor lo declaraba en el arranque como un logro, no como un aviso:
`motor: 9 rescatados por callejero (coordenada a mas de 50 m de la puerta que su propia direccion declara)`.

**Cómo se cazó:** instrumento — la ida y vuelta de la tanda 3 (bibliotecas)
aplicada esta vez a los colegios, comparando cada coordenada municipal contra el
portal más cercano A ELLA. Lo delató el tamaño: 7.666 m no se explican.

**Causa raíz:** el rescate medía **una sola distancia**: del punto publicado al
**número** que la dirección declara. Y esa medida no distingue las dos cosas que
hay que distinguir — un punto que está en otra parte de la ciudad y un punto que
está en su propia calle pero no en el portal que dice. El segundo no es un error:
es el caso Miguel Servet a escala de portal, y el dato lo trae a montones porque
un colegio es un recinto con una fachada larga y su punto cae donde cae. Al no
medir la vía entera, **el 76 % de los rescates (22 de 29) movían coordenadas
buenas**.

**Arreglo aplicado:** dos piezas en `motor/src/gacetero.ts`.

1. **La precondición del rescate** (`validar`): antes de mover nada se mide
   `metrosALaVia` —la distancia del punto a **cualquier** portal de la vía con la
   que ha casado—; si hay una puerta a ≤50 m, el punto ya está en su calle y se
   declara **sana**. El umbral no se toca: es el mismo 50 m firmado.
2. **La geo-desambiguación** (`portalDeLaDireccion`): ante varias vías homónimas
   —hay **125 nombres** con dos o más— gana la que tenga un portal más cerca del
   punto, en vez de descartar el caso. Con **guarda**: si la ganadora tampoco
   está a ≤50 m, no se elige la menos mala, no se elige ninguna.

⚠️ **La guarda no estaba en el plan y la pidió la medición.** Sin ella, la
desambiguación sola **empeoraba**: de 29 rescates subía a 34 y de 22 falsos a 25,
porque casaba direcciones que antes se descartaban y elegía vías que seguían
estando lejísimos —una a 12.639 m—. Medido con el motor real, apagando cada
pieza:

```
                                       rescates   de ellos con la coordenada ya en su sitio
HOY (ninguna de las dos) ..............   29        22
solo la DESAMBIGUACIÓN sin guarda .....   34        25     ← peor
solo la PRECONDICIÓN ..................   17        10
LAS DOS, con guarda ...................   17        10
```

**Commit:** `5ddc841`

**⚠️ Y el caso que abrió esta entrada NO lo arregla esta entrada.** El
`Colegios.549` sigue aterrizando en la ciudad, por una causa distinta que tiene
entrada propia: **la nº14**. Aquí se cierra lo que aquí se midió — que el rescate
movía coordenadas buenas—, y eso sí está arreglado: **0 rescatados tienen hoy una
puerta de su propia vía a ≤50 m**, y la prueba
`⭐ LA IDA Y VUELTA: ninguna rescatada estaba ya en SU PROPIA calle` lo vigila.

**Ley que sale de aquí:** un guardián que enumera lo que un proceso HACE no
vigila que lo que hace esté BIEN. La lista de los nueve rescates estaba
completa, ordenada y al byte, y las nueve podrían haber sido disparates: para
que un arreglo automático esté vigilado hay que medir **la ida y la vuelta** —a
qué distancia estaba el punto de origen de un portal real—, no solo cuánto se ha
movido.

**Ley que sale del CIERRE (2026-08-27), añadida sin borrar la de arriba:** medir
la ida y la vuelta no basta con **medirla bien**: hay que medir **lo que
corresponde**. La primera versión del guardián exigía que ningún rescatado
hubiera tenido *algún* portal a ≤50 m, y esa cifra **no puede ser cero** — las
cuatro farmacias del datum estaban desplazadas 236 m y aun así tenían un portal
ajeno a 13 m. Lo que separa un rescate bueno de uno malo no es que hubiera una
puerta cerca, sino que hubiera **una puerta de su propia calle**.

**Traza:** `motor/src/gacetero.ts` (`portalDeLaDireccion`, `validar`,
`metrosALaVia`, `laMasCercana`) · `motor/src/sitios.ts` (`cargarSitios`, el
bloque de `rescatados`) · `motor/src/sitios.spec.ts:670`.

## [2026-08-25] ✅ CERRADA (reabierta y vuelta a cerrar el 31/08) — El `tsc` con el que llevo tres checkpoints declarando «la interfaz compila limpia» no compila NI UN fichero

**Categoría:** instrumento que daba verde sin mirar nada

---

> ### 🔁 REABIERTA el 2026-08-31 — el mismo síntoma, y el arreglo estaba puesto
>
> Al meter `'montado'` en el contrato, `app/src/app/mapa.ts` **deja de compilar**
> a propósito: son dos sitios exhaustivos, el `Record` del vestido y el hito de
> `marcarHito`. Lancé mi comprobación de siempre y salió verde. **Otra vez.**
>
> ```
> $ cd app && npx tsc --noEmit -p tsconfig.json
> (codigo 0)
> $ npx tsc --noEmit -p tsconfig.json --listFiles | grep -c "src/app"
> 0
>
> $ npm run comprobar-tipos
>   MAL  tsconfig.spec.json: 356 ficheros mirados, y con errores:
> src/app/mapa.ts(103,7): error TS2741: Property 'montado' is missing in type …
> src/app/mapa.ts(299,49): error TS2345: Argument of type '"coge" | "aparca" | "sube" | "baja"' …
> ROJO: ver arriba.
> ```
>
> ⚠️ **Y lo que la reabre no es que el arreglo fallara: el arreglo funciona.**
> `app/scripts/comprobar-tipos.mjs` y su guion existen, miran 356 ficheros y
> cazan los dos errores en cuanto se les llama. Lo que falló es que **yo no lo
> llamé**: escribí `npx tsc --noEmit -p tsconfig.json` de memoria, que es
> literalmente la frase que esta entrada ya tenía escrita —«una costumbre sin
> guion del que tirar acaba siendo una costumbre distinta cada día»— y que yo
> he vuelto a hacer **con el guion ya escrito y a mano**.
>
> **⭐ Qué dio verde mientras el fallo estaba vivo (esta vez):** mis propios
> checkpoints. En esta sesión he declarado «tipos limpios en los dos lados» en
> las casillas 2, 3a y en el arranque de la 3b, y en todas ellas la comprobación
> de la interfaz fue el comando que mira **cero ficheros**. Los del motor sí
> valían —`npm run comprobar-tipos` está en su `package.json` desde siempre—;
> los de la interfaz no comprobaban nada.
>
> **Lo que esto añade a la entrada:** un arreglo que hay que acordarse de usar
> no es un arreglo del todo. El guion cierra el agujero **cuando se ejecuta**, y
> nada obliga a ejecutarlo.
>
> **Arreglo de la reapertura (31/08):** `comprobar-tipos` y `probar` en el
> `package.json` de la **raíz**, llamando a los dos espacios de trabajo. Se
> acabó elegir: hay un comando, no dos parecidos.
>
> ```
> $ npm run comprobar-tipos          # desde la raíz
>   OK   tsconfig.app.json    limpio · 290 ficheros mirados
>   OK   tsconfig.spec.json   limpio · 353 ficheros mirados
> VERDE: la interfaz compila, y consta cuántos ficheros se han mirado.
> ```

---

**Síntoma:** al meter la cuarta clase de sitio (`biblioteca`) en el contrato, el
diseño exige que la interfaz **deje de compilar** hasta darle su icono, su color
y su anclaje — son tres `Record<Clase, …>`. Lancé el comprobador de siempre,
`npx tsc --noEmit -p tsconfig.json` desde `app/`, y salió **en verde**. El mismo
código, con `tsconfig.app.json`, devuelve **tres errores**.

**⭐ Qué dio verde mientras el fallo estaba vivo:** el propio comprobador, con la
app rota a propósito:

```
$ npx tsc --noEmit -p tsconfig.json
codigo de salida: 0

$ npx tsc --noEmit -p tsconfig.app.json
src/app/iconos.ts(157,7): error TS2741: Property 'biblioteca' is missing in type '{ farmacia: string; 'centro-salud': string; hospital: string; }' but required in type 'Readonly<Record<TipoDeSitio, string>>'.
src/app/iconos.ts(182,7): error TS2741: Property 'biblioteca' is missing in type '{ via: {…}; farmacia: {…}; 'centro-salud': {…}; hospital: {…}; }' but required in type 'Readonly<Record<Clase, {…}>>'.
src/app/mapa.ts(55,7): error TS2741: Property 'biblioteca' is missing in type '{ via: [number, number]; farmacia: [number, number]; 'centro-salud': [number, number]; hospital: [number, number]; }' but required in type 'Readonly<Record<Clase, PointTuple>>'.
codigo de salida: 2
```

Y el recuento de lo que mira cada uno, que es lo que lo cierra:

```
$ npx tsc --noEmit -p tsconfig.json     --listFiles | wc -l  →   0
$ npx tsc --noEmit -p tsconfig.app.json --listFiles | wc -l  → 293
```

**Cómo se cazó:** instrumento — la app tenía que estar rota y salió verde. El
verde fue la señal, no el error.

**Causa raíz:** dos capas, y la de abajo es la que importa.

La de arriba: `app/tsconfig.json` es un **fichero solución** —`files: []` más
`references`—, el patrón con el que Angular reparte la aplicación y las pruebas
en `tsconfig.app.json` y `tsconfig.spec.json`. Compilar el solución no compila
ninguno de los dos: TypeScript solo sigue las `references` con `--build`, y
`--noEmit -p` no lo es. Sin ficheros de entrada no hay nada que comprobar, y
salir con código 0 es su comportamiento correcto.

La de abajo, que es la que dejó pasar el fallo tres checkpoints: **el comando
no vivía en ningún sitio**. El motor tenía su `comprobar-tipos` en el
`package.json` y la interfaz no tenía ninguno, así que cada vez lo escribí de
memoria — y de memoria salió el nombre del fichero que se ve en el árbol, no el
que compila. Una costumbre sin guion del que tirar acaba siendo una costumbre
distinta cada día.

**Arreglo aplicado:** `app/scripts/comprobar-tipos.mjs` (nuevo) y el guion
`comprobar-tipos` en `app/package.json`, al lado del de arranque. Compila **los
dos proyectos que tienen ficheros dentro** y, antes de mirar los errores, le
pide a cada uno el **censo** con `--listFiles`: lo imprime y **se pone rojo si
sale cero**, que es la ley de esta entrada hecha código. `tsconfig.json` se
queda fuera de la lista a propósito y con el motivo escrito.

```
comprobar-tipos · la interfaz, con censo

  OK   tsconfig.app.json    limpio · 290 ficheros mirados
  OK   tsconfig.spec.json   limpio · 353 ficheros mirados

VERDE: la interfaz compila, y consta cuántos ficheros se han mirado.
```

Y se le hizo la contraprueba, una a una: apuntándolo a `tsconfig.json` sale
**código 2** («censo de 0 ficheros — no está compilando NADA»), y con un error
de tipos de verdad sale **código 1** con los errores y el censo delante.

⚠️ **Y el guion estrenó su propia trampa al escribirlo**: la primera versión
llamaba al compilador con `spawnSync('npx.cmd', …)` sin shell, que en Windows
revienta con **EINVAL** y devuelve la salida vacía. El censo salió 0 y el guion
se puso ROJO — hizo lo correcto por el motivo equivocado. Ahora llama al
`bin/tsc` de TypeScript con este mismo Node y **comprueba antes que el proceso
se ha podido ejecutar** (código 3). Un silencio con pinta de verde otra vez, y
otra vez lo delató pedir la cifra.

**Commit:** ~~`b15f198` (esta entrada, en caliente) y el `fix(app): el tsc que no
miraba nada` que la cierra, donde va este cierre.~~ (el del 25/08)

**Commit:** `5464e6a` — el de la reapertura del 31/08

**Ley que sale de aquí:** ⭐ **un arreglo que hay que acordarse de usar no es
un arreglo del todo.** El guion existía, funcionaba y cazaba los dos errores en
cuanto se le llamaba — y aun así el fallo volvió, porque entre el guion y yo
había una decisión: **cuál de los dos comandos escribo**. Mientras haya dos
sitios donde comprobar los tipos, escribir el bueno depende de la memoria, y la
memoria es lo que ya falló el 25/08.

El arreglo del 31/08 es quitar la decisión: **un solo `npm run comprobar-tipos`
en la raíz del repositorio**, que llama a los dos espacios de trabajo. Ya no hay
un comando bueno y otro malo que se parezcan: hay uno. Y su hermano `npm run
probar`, por lo mismo.

⚠️ Corolario, y es el que vale para lo que venga: **cuando un fallo se arregla
con "acuérdate de usar X", el arreglo no ha terminado.** Termina cuando usar X
es el único camino, o cuando no usarlo se pone rojo solo.

> La del 25/08, que sigue siendo verdad y no bastó:
>
> **un comando que termina en silencio no es un verde
> hasta que se le ha visto contar lo que ha mirado.** La bitácora ya lo decía de
> las pruebas —«una ejecución sin salida NO es un verde»— y aquí sale de otra
> puerta: un compilador con cero ficheros de entrada también termina en silencio y
> con código 0. El comprobador se comprueba pidiéndole el censo de lo que compila
> (`--listFiles`), y esa cifra se declara igual que se declara una muestra.
> 
> **Y una segunda, del cierre:** **una costumbre de comprobación necesita un guion
> del que tirar.** Lo que se teclea de memoria cada vez acaba tecleándose distinto,
> y el día que sale mal no hay nada que revisar porque no hay nada escrito. El
> comando vive en `package.json` o no vive.

**Traza:** `app/tsconfig.json` (fichero solución: `files: []` + `references`) ·
`app/tsconfig.app.json` · los checkpoints del 24 y 25/08, donde escribí «tsc
limpio en los dos» apoyándome en este comando.

**Nota:** el arreglo ya había comenzado al abrir esta entrada — el `tsc` bueno ya
estaba lanzado cuando se vio lo que pasaba.


## [2026-08-23] ✅ CERRADA — El aviso «no trae un origen y un destino» lo daba un motor arrancado 36 minutos antes del commit que lo arreglaba: el código estaba bien, y las 298 pruebas también

**Categoría:** guardián que existía, cubría el caso exacto, y nadie invocó

**Síntoma:** con la app en la mano, elegir una farmacia como ORIGEN devolvía «La
petición no trae un origen y un destino con su vía y su portal». Reproducido contra
el proceso que estaba contestando, con códigos reales del propio motor:

```
$ curl -s -X POST http://localhost:3000/api/ruta -d '{"origen":{"sitio":"Farmacias.8691"},"destino":{"via":"8065","portal":"Portales.93310"},"modo":"andando"}'
origen-sitio         metros 0 pasos 0 avisos ['La petición no trae un origen y un destino con su vía y su portal.']
destino-sitio        metros 5076 pasos 22 avisos []
```

Lo delatado por el segundo renglón: ese motor acepta el sitio en el destino y no en
el origen, que es **exactamente** `leerPeticion` en el commit `ffe9167` (`origen =
punto('origen')`), no en el de hoy. El código del árbol no tiene ese fallo.

**⭐ Qué dio verde mientras el fallo estaba vivo:** **todo**. Las dos suites enteras,
ejecutadas con el aviso vivo en la pantalla de Antonio y antes de tocar nada:

```
$ cd motor && node --test "src/**/*.spec.ts"
ℹ tests 198
ℹ pass 198
ℹ fail 0

$ cd app && npx ng test --watch=false
 Test Files  8 passed (8)
      Tests  100 passed (100)
```

Y el cuerpo que la pantalla manda de verdad, sacado del `POST` con el formulario
conducido a mano (farmacia en el origen, dirección en el destino):

```
CUERPO>>> {"origen":{"sitio":"Farmacias.8691"},"destino":{"via":"5140","portal":"Portales.5140a"},"modo":"andando"}
```

Es el cuerpo correcto: `leerPeticion` de hoy lo acepta. **Ninguna de las 298 pruebas
cruza ese cuerpo con ese lector**, así que las 100 de la pantalla habrían seguido en
verde con el origen roto de verdad.

El que NO daba verde es el guardián del arranque, que cubre este caso desde el
16/08 y **no se invocó**. Corrido ahora, en rojo a la primera:

```
$ npm run comprobar-arranque -- motor
  MAL  el servidor arrancó ANTES de que cambiara src\trayecto.spec.ts: sirve configuración vieja
       src\trayecto.spec.ts tocado a las 2026-08-23T16:31:06.081Z · PID 23004 arrancó a las 2026-08-23T16:25:27.664Z
ROJO  (código 4)
```

**Cómo se cazó:** usuario. Antonio, con la app delante. El diagnóstico —que era el
proceso y no el código— salió de cotejar la hora de arranque del PID 23004
(18:25:27) con la del commit `3f6847c` (19:01:12).

**Causa raíz:** dos, encajadas. **(1) El caso**: Node ejecuta el TypeScript
directamente y no recarga nada, así que el motor que arrancó a las 18:25:27 siguió
sirviendo `leerPeticion` de `ffe9167` después de que `3f6847c` (19:01:12) la
cambiara. No hubo fallo de código: hubo un proceso de hace 36 minutos contestando
con cara de actual. **(2) El fondo**, que es lo que hacía el caso invisible: el
lector de la petición vivía dentro de `trayecto.ts`, que necesita el grafo, los
portales y el callejero. Importarlo desde la pantalla arrastraba `node:fs`, así que
**no se podía escribir la prueba que cruza las dos piezas** — y lo que no se puede
probar, no se prueba. El hueco no era un olvido: era una consecuencia de dónde
estaba puesta la función.

**Arreglo aplicado:** tres capas. **(1) El caso**: se mató el PID 23004, se confirmó
el puerto libre (`curl → 000`) y se arrancó de nuevo (PID 25056). Verificado por
identidad, no por estado — `npm run comprobar-arranque -- motor` en VERDE, y las tres
combinaciones contestando lo que dicen J8 y J9: `origen-sitio 5076 m / 21 pasos` ·
`destino-sitio 5076 m / 22 pasos` · `sitio-sitio 2729 m / 11 pasos`, avisos vacíos.
**(2) El fondo**: `leerPeticion` sale de `motor/src/trayecto.ts` a
`motor/src/peticion.ts`, que no importa nada más que el contrato. `servidor.ts` y
`trayecto.spec.ts` lo importan de su sitio nuevo; no queda reexportación de paso.
**(3) La juez que faltaba**: `app/src/app/peticion-de-punta-a-punta.spec.ts` conduce
el formulario a mano en las cuatro combinaciones, saca el cuerpo del `POST` tal como
sale al cable —pasado por `JSON.stringify`, para que un `undefined` se vea
desaparecer— y se lo da a leer a `leerPeticion`. **La de verdad, importada, no una
copia.** Vista en rojo devolviendo `leerPeticion` a su versión de `ffe9167`: 2 rojas
(`expected null to deeply equal {…}`), que es este fallo exacto reproducido; y
mandando la presentación en vez del código desde la app: 5 rojas.

**Commit:** `dbabafb` (`test(app): la juez de punta a punta — el cuerpo real contra
el lector real`). La captura de esta entrada es anterior al arreglo.

**Ley que sale de aquí:** dos, y las dos son de cobertura, no de código.
**(1)** Las pruebas del motor prueban el motor y las de la pantalla prueban la
pantalla; **entre las dos queda el cable, y ahí no vigila nadie**. Una petición que
sale bien formada de la pantalla y un lector que la sabe leer pueden estar los dos
en verde sin haberse visto nunca: hace falta una prueba que coja **el cuerpo real
del `POST`** y se lo dé a **la función real del motor**.
**(2)** Un guardián que hay que acordarse de invocar no es cobertura, es
documentación. Este existía, cubría el caso y estaba rojo mientras se buscaba el
fallo en el sitio equivocado. **Antes de dar por roto el código porque la pantalla
falla, se corre el guardián del arranque** — cuesta 3 segundos y aquí habría
contestado a la primera pregunta.

*Añadido al cerrar (2026-08-23):* la ley (1) pedía una prueba que cruzara el cable, y
al ir a escribirla apareció **por qué no existía**: no se podía. El lector estaba
dentro del fichero que carga el grafo, y desde la pantalla eso arrastra `node:fs`.
De ahí una tercera: **una función que valida lo que llega de fuera no debe vivir con
las que leen del disco.** Si la única pieza que las dos mitades comparten no se puede
importar desde las dos, la costura no es que esté mal vigilada — es que no se puede
vigilar. Y la ley (2) se cobró sola: el guardián existía y estaba rojo mientras se
buscaba el fallo en la app.

**Traza:** `motor/src/trayecto.ts` (`leerPeticion`) · `app/src/app/buscador.ts`
(`extremoDe`) · proceso `node src/servidor.ts` PID 23004, arrancado 2026-08-23
18:25:27 · guardián `app/scripts/comprobar-arranque.mjs` (perfil `motor`) ·
referencia cruzada: entrada del 2026-08-16 («El `200` de `localhost:4200` lo daba un
servidor muerto»), que es este mismo fallo en la otra pieza y de la que salió el
guardián.

---

## [2026-08-23] ✅ CERRADA — El medidor de la tercera condición de odin cuenta las ramas del cruce sin descontar las dos de la ruta, y el disparo sale inflado

**Categoría:** instrumento que cuenta de más porque no excluye lo suyo
**Síntoma:** para decidir el alcance de los combines de odin se midió cuántas
veces dispararía cada condición sobre 387 rutas reales. La tercera —«ninguna
otra rama del cruce se llama igual»— se implementó en el medidor del scratchpad
como `ramasConEseNucleo(nodo) <= 2`, dando por hecho que las dos que sobran son
la de llegada y la de salida. **No siempre son dos, y no siempre son esas.** En
el nodo 47040 de Zaragoza salen TRES ramas de Avenida Alcalde Gómez Laguna: la
de llegada es genérica, así que las dos con nombre son la que se sigue (59781)
y **otra rama distinta de la misma avenida** (58466). El medidor contó 2 y dijo
«no hay otra»; hay otra, y por eso seguir ahí no es obvio. La cifra que se
publicó —1.350 disparos de la tercera condición sobre 1.627 «Continúa», y las
que de ella se derivaron: 123 casos limpios, 1.216 nombres perdidos, 4 casos
mentirosos— **está medida sobre ese filtro y ya está escrita en un comentario
de `motor/src/pasos.ts`**.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la contraprueba del
instrumento, que se escribió justamente para no repetir la nº9. Ejecutada antes
de tocar nada:

```
$ node scratchpad/contra2.ts contra
rutas=387  reproducen pasos Y METROS: 387
CONTRAPRUEBA 2 OK
```

387 de 387 con los metros al decimal. Y el medidor imprimía su cifra sin que
nada la contradijera:

```
$ node scratchpad/medir-seguro.ts
(c) el continue que HEREDA nombre  : 132
      VETADOS (cruce o escaleras)   : 9
      LIMPIOS, entran               : 123
```

**Cómo se cazó:** test — la juez `⭐ (c) el «Continúa» que se absorbe puede ser
LARGO` se escribió con la cuenta a mano (24 − 1 = 23 pasos) sobre un disparo que
el medidor declaraba, y salió ROJA contra el motor ya implementado: `24 !== 23`.
El motor tenía razón y la expectativa venía de un insumo falso.
**Causa raíz:** el medidor descontaba las ramas **por cantidad** (`<= 2`) en
vez de **por identidad**. Un cruce no tiene siempre dos ramas con nombre, ni
las que tiene son forzosamente las de la ruta: la de llegada puede ser un
genérico —una acera, un paso— y entonces las dos con nombre son la que se sigue
y una tercera que el filtro daba por contada. Excluir por índice de arista es
la única forma de saber cuáles son las suyas.

Y hubo un segundo defecto que solo se vio al re-medir con el filtro bueno:
**los tres medidores no preguntaban lo mismo.** `medir-reglas.ts` y `dano-c.ts`
comparaban el núcleo de la maniobra **anterior**; `medir-seguro.ts`, el de la
**actual**. Por eso la cifra de la tercera condición apenas se movió al
arreglar —1.350 → 1.351— mientras la que de verdad importaba, la de la
herencia, caía de **123 a 87**: el error grande no estaba donde parecía.

**Arreglo aplicado:** el filtro correcto se escribió en el motor desde el
principio —`encrucijadaDe` en `motor/src/pasos.ts` excluye `aristaQueLlega` y
`aristaQueSigue` por índice—, así que el código nunca llegó a llevar la lógica
mala: lo que llevaba eran **las cifras** medidas con ella, en el comentario de
`CONTINUE_CORTO_M` y en el de la regla D. Re-medido todo con el filtro por
identidad y un solo criterio, y corregidas: 1.216 → **1.099** nombres que la
regla ancha perdería, 254 → **237** en tramos de ≥600 m, «4 de 123» → **«2 de
89»** absorciones que la cota evita. Y la ruta que destapó el caso —BIEL 55 C32
→ CERDEÑA 4— se quedó en la spec como **guardián del veto**, no como anécdota:
`⭐ (c③) y NO se absorbe cuando otra rama del cruce se llama IGUAL`.

**Commit:** `0f01130` (esta entrada, en caliente) y `0225b4b` (el arreglo y
las cifras corregidas).
**Ley que sale de aquí:** **una contraprueba solo vale para lo que atraviesa.**
La de aquí comparaba la réplica contra el motor y salía 387/387, pero el
cálculo del cruce **no pasaba por el motor**: era código que solo existía en el
medidor, y por eso ningún 387/387 podía hablar de él. Antes de fiarse de una
contraprueba hay que preguntarle **qué piezas toca**, no cuántos casos pasa.

Y una segunda, hermana de la nº9: **una cifra escrita en un comentario del
código antes de que un guardián la muerda es una afirmación sin prueba.** Aquí
las cifras entraron al fichero el mismo día que se midieron y sobrevivieron a
un `tsc` limpio y a 165 tests en verde, porque ningún test las miraba. Lo único
que las tocó fue volver a medirlas.

**Traza:** el medidor `medir-reglas.ts` / `medir-seguro.ts` / `dano-c.ts` del
scratchpad, función `nucleosDelNodo`; la contraprueba `contra2.ts`; y la cifra
ya publicada en el comentario de la regla D en `motor/src/pasos.ts`.

**Nota:** el arreglo ya había comenzado al abrir esta entrada — la regla D está
escrita y en verde en dos de sus tres juez; lo que está mal es la cifra que la
justifica en su comentario y la juez que salió del insumo falso.

---

## [2026-08-21] ✅ CERRADA — La simulación del coste divide metros de geometría entre un `metros` que ya era coste, y el desvío de la céntrica sale 18 veces mayor

**Categoría:** instrumento de medición con dos magnitudes en el mismo campo
**Síntoma:** para simular el coste por prioridad sin tocar `motor/src/ruta.ts`,
el script `sim.mjs` del scratchpad sustituye el campo `m` de cada arista por su
coste —`m / (VEL × prioridad)`— y deja que el Dijkstra existente lo minimice.
El camino que sale es correcto; **el recuento de metros no**. Los trozos de
enganche traen metros de geometría verdaderos, y la línea que los reescala
divide entre `ar.metros`, que en esa red **ya es coste**:
`const suyos = tr.metros === ar.metros ? real : (tr.metros / (ar.metros || 1)) * real;`
La ruta céntrica se reportó en **366 m (+24 sobre 342)**. Los metros verdaderos
son **343,217 (+1,300)**: el desvío declarado salió **18 veces el real**. Y sobre
esa cifra falsa recomendé **cambiar la expectativa del guardián de la ruta
céntrica** — el rojo se iba a limpiar moviendo lo que el guardián espera.
**⭐ Qué dio verde mientras el fallo estaba vivo:** el propio `sim.mjs`, que no
falla, no avisa y no deja ningún hueco: imprime las tres columnas cuadradas y
creíbles, con A y B correctas —esas dos no sustituyen `m`— y solo C mentida.
Ejecutado con el fallo vivo, antes de tocar nada:

```
$ node --max-old-space-size=8192 <scratchpad>/sim.mjs
ALFONSO I 10 → P.º INDEPENDENCIA 3 (la céntrica)
  A · hoy (metros)              342 m · cycleway     0 m (0.0%)
     footway 202 · pedestrian 74 · living_street 54 · tertiary 13
  B · sin cycleway (metros)     342 m · cycleway     0 m (0.0%)
     footway 202 · pedestrian 74 · living_street 54 · tertiary 13
  C · sin cycleway + prior.     366 m · cycleway     0 m (0.0%)
     footway 262 · pedestrian 74 · living_street 30
```

**Cómo se cazó:** usuario — Antonio rehizo la aritmética de la fórmula sobre el
desglose que le reporté (13 m tertiary + 24 m living_street sueltos, 60 m
footway cogidos) y le salió Δ = +15,6: un Dijkstra que minimice ese coste **no**
elegiría el camino nuevo. La cuenta no cuadraba porque los tres sumandos eran
falsos.
**Causa raíz:** la simulación guardó el **coste dentro del campo llamado
`metros`** (`AristaUtil.metros`, que viene de `AristaCruda.m`) para poder
reutilizar el Dijkstra sin tocarlo. Un campo, dos magnitudes, y ningún sitio
donde se notara. De ahí salieron **dos defectos, no uno**:

1. **El recuento.** `(tr.metros / ar.metros) * real` divide metros de geometría
   entre segundos. Sobre el camino de `prioridad` da **365,561 m** donde los
   verdaderos son **343,217**. El desvío declarado fue `365,561 - 341,917 =
   23,644` frente a `1,300` reales: **×18,2** — el «18 veces» del síntoma
   cuadra sin redondeo.
2. **El peso en el montículo**, que no llegué a ver al capturar. `puertasDe`
   valoraba los trozos de enganche con `metrosHastaElEnganche` —geometría, o
   sea metros— mientras las aristas enteras iban en segundos: un desajuste de
   **×VEL×prioridad = ×1,667** en los dos extremos de cada ruta. En la céntrica
   **no cambió el camino elegido**, porque los dos candidatos salían por las
   MISMAS dos puertas y el sesgo se restaba solo. Eso no lo exonera: cuando las
   cuatro combinaciones salen por puertas distintas, ese ×1,667 sí decide.

**Arreglo aplicado:** la implementación de verdad mantiene las dos magnitudes
separadas y en su unidad, en `motor/src/ruta.ts`: `Cuaderno` gana `metros:
Float64Array` junto a `coste`, con el motivo escrito al lado; `Puerta` gana
`coste` y se valora **con la misma fórmula que las aristas enteras** (`puertasDe`
recibe el criterio), que es el arreglo directo del ×1,667; `Ruta.coste` se
declara en segundos y `Ruta.metros` sigue siendo metros; y `red.costeAndando`
(`motor/src/red.ts`) precalcula el coste por arista una vez al arrancar en vez
de dividir en cada relajación. Comprobado por dos caminos independientes: el
coste que el Dijkstra acumula en la céntrica y el que sale de refacturar sus
trozos por fuera dan **205,930 s** los dos. `sim.mjs` no volvió a usarse para
medir nada.
**Commit:** `635131f` — *feat(motor): el coste por prioridad - la formula de
osmand*.
**Ley que sale de aquí:** **una expectativa de guardián no se mueve con una
cifra que no se ha cuadrado a mano contra su fórmula.** Y la que la precede:
cuando un instrumento reutiliza un campo para guardar otra magnitud, **toda**
lectura de ese campo queda sospechosa — no solo la que se cambió.

*Añadida al cerrar (2026-08-21):* **que el resultado saliera bien no exonera al
instrumento.** El ×1,667 no cambió el camino de la céntrica de pura suerte —los
dos candidatos compartían puertas—, y esa suerte es justo lo que habría dejado
el defecto vivo si solo se hubiera mirado si el camino «parecía razonable». Un
instrumento con dos unidades dentro se repara aunque su respuesta coincida con
la buena. Y una tercera, del método: **el coste se guarda en segundos, no en
«metros equivalentes»**; tener una unidad de verdad es lo que hace que mezclarla
se note.
**Traza:** `<scratchpad>/sim.mjs` (`conCoste`, y la línea de `suyos` dentro de
`corre`); lo medido eran `motor/src/ruta.ts` (`calcularRuta`,
`trozoDelEnganche`, `trozoEntero`) y `motor/src/red.ts` (`cargarRed`, el campo
`metros` de `AristaUtil`).


## [2026-08-20] ✅ CERRADA — Un número romano pegado a un paréntesis deja de ser un número romano: `(GP-F II)` se escribe `(Gp-f Ii)`

**Categoría:** regla aplicada al token equivocado
**Síntoma:** barriendo la función de presentación sobre los 3.358 nombres del
censo municipal, `GRUPO ALFÉREZ ROJAS (GP-F II)` sale como
**`Grupo Alférez Rojas (Gp-f Ii)`**. El `II` es un número romano y la regla dice
que los romanos van en mayúsculas — pero el token que se examina es `II)`, con
el paréntesis dentro, y `II)` no valida como romano. La regla no falla: se le
está preguntando por una cosa que no es la palabra.
**⭐ Qué dio verde mientras el fallo estaba vivo:** la prueba
`⭐ los ROMANOS se quedan en mayúsculas` (`motor/src/pasos.spec.ts`), que
enumera los once romanos del censo —I, II, III, IV, V, VI, X, XII, XIII, XXII,
XXIII— y los comprueba uno a uno. **Todos van rodeados de espacios.** Ejecutada
con el fallo vivo, antes de tocar nada:

```
$ node --test --test-name-pattern "los ROMANOS se quedan" "src/pasos.spec.ts"
  ✔ ⭐ los ROMANOS se quedan en mayúsculas (1.7221ms)
✔ ⭐ LA PRESENTACIÓN — el nombre administrativo se lee como se escribe (2.5241ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Verde. Y con ella las 129 del motor y las 81 de la pantalla.
**Cómo se cazó:** instrumento — la barrida de la función sobre los 3.358
nombres reales que el checkpoint del encargo exige. Ninguna prueba la habría
cazado: todas usan nombres escritos a mano, y a nadie se le ocurrió pegar un
romano a un signo.
**Causa raíz:** la función troceaba el nombre con `split(' ')` y trataba cada
trozo como si fuera una palabra. Pero **un trozo separado por espacios no es
una palabra**: el dato real le pega paréntesis (`II)`), corchetes
(`[CASETAS]`), guiones (`GP-F`) y **puntos sin espacio** (`NTRA.SRA.DEL`). Las
tres reglas —romano, partícula, capitalización— se estaban aplicando a una
cadena que incluía los signos, así que ninguna reconocía la palabra que tenía
delante. La regla de romanos fue la que se notó porque devuelve el token entero
en mayúsculas; las otras dos fallaban en silencio (`Ntra.sra.del`).
**Arreglo aplicado:** `comoSePresenta` (`motor/src/pasos.ts`) trocea ahora en
**palabras de verdad** — `token.split(/([^\p{L}\p{N}]+)/u)`, que devuelve
alternando palabra y separador y conserva los separadores tal cual—. El
marcador de núcleo rural (`---CST`) sigue saliendo antes, entero, porque es un
código y no una palabra. Dos pruebas nuevas con el token SUCIO: `⭐ un romano
PEGADO A UN SIGNO sigue siendo un romano` y `⭐ el PUNTO separa palabras dentro
del token, como el espacio`, las dos nacidas en rojo con la salida exacta del
fallo (`'Grupo Alférez Rojas (Gp-f Ii)'` y `'Calle Ntra.sra.del Agua'`).
Verificado además barriendo los 3.358 nombres: **0 núcleos movidos, 0 palabras
perdidas**.
**Commit:** `63ba4ac`
**Ley que sale de aquí:** cuando una regla se aplica **por token**, la prueba
tiene que incluir un token **sucio** — con el signo, el paréntesis o el punto
pegados—, porque el dato real los trae y el banco escrito a mano no. Es
hermana de la ley de la nº7: allí la prueba enumeraba textos aceptables sin
atarlos a su condición; aquí enumera casos limpios sin atarlos a la forma en
que el dato los escribe.

Y una segunda, que sale del cierre: **«separado por espacios» no es «palabra».**
Antes de aplicar una regla lingüística a un trozo de texto, hay que decidir
dónde acaba la palabra — y el dato administrativo pega signos, puntos y guiones
donde le conviene. Aquí solo se notó una de las tres reglas rotas; las otras dos
fallaban sin ruido.
**Traza:** `motor/src/pasos.ts` (`comoSePresenta`, el `split(' ')` que trocea
por espacios y nada más) · `motor/src/pasos.spec.ts` (`⭐ los ROMANOS se quedan
en mayúsculas`) · `motor/data/2026-08-20_idezar_wfs_urbanismo-vias_ejes.json`
(`GRUPO ALFÉREZ ROJAS (GP-F II)`, código 25780).

---

## [2026-08-20] ✅ CERRADA — Al peatón se le decía «anda por la calzada» donde anda por un carril bici: 1.270 m de una verdad falsa publicada en pantalla

**Categoría:** dato traducido mal
**Síntoma:** Antonio generó CALLE EL COLOSO 2 → CALLE PADRE ARRUPE 1 en la
pantalla y leyó «Gira a la derecha hacia **la calzada** · 1.270 m». Su pie dice
que ese tramo es MARQUÉS DE LA CADENA / AVENIDA DE LA ACADEMIA GENERAL MILITAR,
y que se anda por un carril bici **en acera**. Medido: ese paso son tres *ways*
—`354344721`, `475888308`, `475881583`—, los tres `h=cycleway`, los tres sin
nombre en OSM. El motor no se equivoca de camino: se equivoca de PALABRA. No es
un hueco de información —«no sé cómo se llama»— sino una afirmación falsa: le
dice a alguien que va por la calzada de una avenida.
**⭐ Qué dio verde mientras el fallo estaba vivo:** la prueba
`EL INTERIOR habla OSM cuando hay nombre, y por TIPO cuando no`
(`motor/src/pasos.spec.ts`), que **enumera «la calzada» como respuesta
aceptable** y comprueba que no quede ningún paso sin clasificar. Ejecutada con
el fallo vivo, antes de tocar nada:

```
$ node --test --test-name-pattern "EL INTERIOR habla OSM" "src/pasos.spec.ts"
  ✔ EL INTERIOR habla OSM cuando hay nombre, y por TIPO cuando no (28.5333ms)
✔ Los pasos de una ruta real (572.4154ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Verde. Y con ella las 60 del motor y las 81 de la pantalla, las dos guardias, y
el build de producción. Ningún instrumento del repositorio distinguía «la
calzada» dicha de una calzada de «la calzada» dicha de un carril bici.
**Cómo se cazó:** ojo humano — Antonio, mirando la pantalla, reconoció por dónde
pasa la ruta y supo que la palabra no era esa. Ningún instrumento lo habría
cazado: la prueba que cubría la zona tenía «la calzada» en su lista de
respuestas buenas.
**Causa raíz:** la tabla `POR_TIPO` traducía **el perfil propio del grafo**
(`p`), y ese perfil no distingue: `eje-de-calzada` le cae a **46.643 aristas**
que son calzada de verdad, carril bici, camino de tierra y vial de servicio,
todo junto — **4.671 de las 4.675 `cycleway` lo llevan**. El tipo real sí
estaba en el dato, en `h`, pero **`AristaUtil` no lo subía a la red**: al
escribir los pasos, `h` no estaba a la vista. Se tradujo lo único que había, y
lo único que había era ambiguo.
**Arreglo aplicado:** la tabla pasa a **dos niveles declarados**
(`motor/src/pasos.ts`): `POR_PERFIL` con los cuatro perfiles que distinguen más
que OSM —acera y paso de peatones son los dos `highway=footway`—, y
`POR_HIGHWAY` con **los 27 valores de `highway` del grafo traducidos uno a
uno**, ninguno sin traducción. La entrada `nombreGenerico(perfil, highway)`
elige nivel. Y `red.ts` gana `tipoDeWay`, un `Map w → h`: va por *way* y no por
arista porque **`h` es constante dentro de un way** —verificado: 0 de 98.774
discrepan—, así son 47.758 entradas en vez de 93.503 punteros. Medido con el
recolector forzado a los dos lados: **+1,7 MB**, la red pasa de 11,1 a 12,9 MB.
**Commit:** `d9021e6`
**Ley que sale de aquí:** una prueba que comprueba que un texto **está en una
lista cerrada de textos aceptables** no comprueba que el texto sea VERDAD. La
lista dice qué se puede decir; no dice cuándo se puede decir cada cosa. Donde
haya un vocabulario cerrado, la prueba tiene que atar cada palabra a la
condición que la hace cierta —`cycleway` → «el carril bici»—, no limitarse a
aceptar el conjunto.

Y una segunda, que sale del cierre y no se veía al capturar: **una etiqueta que
agrupa no puede usarse para redactar.** El perfil del exportador sirve para
filtrar y para pintar —para eso se hizo—, pero en cuanto su valor se convierte
en una palabra que alguien lee, cada valor tiene que corresponder a **una sola**
cosa del mundo. Antes de traducir un campo a lenguaje, hay que contar cuántas
cosas distintas caben dentro de cada uno de sus valores.

**Efecto lateral del arreglo, y es correcto:** dos tramos que se fundían en uno
porque el nombre falso los hacía parecer la misma cosa —117 m de `service` y
23 m de `track`, los dos «la calzada»— dejan de fundirse. La ruta larga pasa de
13 pasos a 14. La fusión por nombre estaba heredando la mentira.
**Traza:** `motor/src/pasos.ts` (`POR_TIPO`, `nombreDe`) ·
`motor/src/red.ts` (`AristaUtil`, que no lleva `h`) ·
`motor/src/pasos.spec.ts` («EL INTERIOR habla OSM cuando hay nombre, y por TIPO
cuando no») · `app/data/grafo-visor.js` (4.671 de 4.675 `cycleway` con
`p=eje-de-calzada`).

---

## [2026-08-20] ✅ CERRADA — La ruta llegaba al destino por el extremo contrario de la última calle: un salto de 604,7 m que la prueba de los extremos no veía

**Categoría:** geometría reconstruida
**Síntoma:** la geometría de `POST /api/ruta` (todavía sin endpoint, en
`calcularRuta`) traía un salto de **604,7 m** entre dos puntos consecutivos,
justo antes del final. Medido sobre la ruta CALLE PEDRO LAPUYADE 3 → CAMINO DE
EN MEDIO 120: de sus 79 trozos, **78 pegan con el siguiente y uno no** — el
último. Se llega al nodo 14341, que es el `desde` de la arista 13698, y el
trozo final arranca en el vértice 7 de esa arista, a 604,7 m de allí.

**⭐ Qué dio verde mientras el fallo estaba vivo:** la prueba
`la geometría EMPIEZA en la puerta de origen y ACABA en la de destino`, que es
la única que miraba la geometría de punta a punta. Ejecutada con el fallo vivo,
antes de tocar nada:

```
$ node --test --test-name-pattern="EMPIEZA en la puerta" "src/ruta.spec.ts"
  ✔ la geometría EMPIEZA en la puerta de origen y ACABA en la de destino (18.7284ms)
✔ La ruta (560.6794ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

También daban verde `ida y vuelta miden lo mismo` y las dos pruebas ⭐ del
trivial y las cuatro combinaciones, y los dos guiones de medida del naíf
imprimieron metros de aspecto normal en todos los casos.

**Cómo se cazó:** test — una prueba hermana escrita el mismo día, que en vez de
mirar los extremos recorre la línea punto a punto y exige que ningún salto
pase de 500 m.
**Causa raíz:** una negación de más. `haciaElFinal` dice **por qué extremo de
su arista está una puerta**, no en qué sentido se anda por ella. Para el trozo
final se pasaba `!mejorLlegada.haciaElFinal`, y eso pide el trozo del extremo
CONTRARIO al que se acaba de llegar. Que estuviera invertido no se notaba en el
resultado visible porque el otro parámetro, `saliendo: false`, le da la vuelta a
la lista: el trozo terminaba en la proyección correcta viniendo del lado que no
era. Los metros tampoco lo delataban — salen del Dijkstra, no de la geometría—,
así que el único sitio donde el fallo asomaba era la línea del mapa.
**Arreglo aplicado:** `motor/src/ruta.ts`, en `calcularRuta`: se quita la
negación y se pasa `mejorLlegada.haciaElFinal` tal cual. Un carácter. Va con un
comentario de seis líneas al lado, porque es un sitio donde volver a poner la
negación parece lo correcto.
**Commit:** `917528f`
**Ley que sale de aquí:** una geometría no se comprueba por sus extremos. Los
extremos son lo único que sigue estando bien cuando el interior está del revés
— y son justo lo que apetece comprobar, porque es fácil. Si una prueba mira
una línea, que la recorra.
**Y una segunda, que salió al cerrar:** cuando el total lo calcula un camino y
la geometría lo dibuja otro, son dos verdades que hay que cotejar. Aquí los
metros venían del Dijkstra y la línea de la reconstrucción, y ninguna prueba
los comparaba: la que lo hace ahora —los trozos suman lo que dice el total—
vive dentro de la misma prueba que recorre la línea.
**Traza:** `motor/src/ruta.ts`, `calcularRuta` y `trozoDelEnganche`;
`motor/src/ruta.spec.ts`.

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
