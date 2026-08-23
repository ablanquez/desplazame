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
