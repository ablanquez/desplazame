# Censo pre-despliegue — bloque A (parcial)

> **Fecha:** 2026-09-08 · **Alcance:** bloque A del método de auditoría de la
> casa [GUIA-BUENAS-PRACTICAS v3.0], **solo lectura**. Ni una línea de código
> tocada: la única escritura de esta tanda es este fichero.
>
> **NO entra hoy:** la auditoría completa (bloques C · B · E · F · D), que queda
> para el cierre tras la estética. Esto es un **registro histórico**: se lee con
> su fecha delante, y lo que diga envejecerá.

---

## 0 · La cobertura de este informe, declarada

| | |
|---|---|
| Fuentes de `motor/src`, `app/src` y `tipos` (`.ts` · `.html` · `.css`) | **129** |
| De ellas, de producción (sin `.spec.ts`) | **77** |
| Ficheros leídos por el clasificador (incluye `.mjs` y `.json`) | **189 de 189** |
| Exports no triviales censados y clasificados | **705** |
| Fichas de datos del `THIRD-PARTY-NOTICES.md` | 41 (3.207 líneas) |
| Paquetes con dependencias declaradas | `motor` 1+1 · `app` 9+8 · raíz y `tipos` 0 |

**Lo que NO se ha mirado, y por qué:**

* **El interior de `app/e2e/*.mjs`** (8 ficheros, 103 kB): se ha leído su
  cabecera y su forma de arrancar, no su contenido. No hacía falta para
  clasificarlos y no cabía hoy.
* **El `THIRD-PARTY-NOTICES.md` entero**: se ha buscado en él, no se ha
  auditado. Eso es bloque F.
* **Los ficheros de `app/data/` y `motor/data/`**: fuera de alcance por la carta.
* **El CSS más allá de los colores**: no se han mirado reglas, solo literales.
* **Los bloques C · B · E · F · D**: no entran hoy, por encargo.

**Los límites del método, dichos:** el clasificador de exports mide *«¿alguien
más nombra esta palabra?»* sobre el texto de los ficheros. Cuenta **de más**
—una cita en un comentario vale— y nunca de menos: **lo que sale huérfano lo
está de verdad**, y lo que sale vivo puede no estarlo. Cuatro casos del motor y
uno de la app salieron «solo-build» por coincidir con una palabra suelta dentro
de un `.json` de datos (`Voto`, `Tiempos`, `Viaje`, `Etiquetas`, `Papel`): esos
**son huérfanos**, y así se cuentan más abajo.

---

## 1 · La herramienta, elegida con su documentación delante

**knip 6.34.0**, ejecutado sin instalarlo (`npx knip`, que es la invocación
literal de su guía de inicio). Su documentación declara que informa de *«unused
dependencies, exports and files»* y que soporta monorepos y workspaces de
serie, que es exactamente esta forma de repositorio. **No se ha añadido ninguna
dependencia**: `npx` resuelve en su propia caché y `package.json` no cambia.

⚠️ **`ts-prune`: NO CONSTA.** El encargo lo da por obsoleto remitiendo a knip;
`npm view ts-prune` no devolvió ningún campo de deprecación al consultarlo hoy.
No se ha verificado por otra vía y no se afirma.

⚠️ **Y knip se equivoca en un sitio, en la dirección que la guía avisa.** Marca
los **8 ficheros de `app/e2e/` como no usados**. No lo están: son el arnés de
Chrome de la casa —`abrirChrome` en `medir.mjs`, que lanza
`chrome.exe --remote-debugging-port` por CDP, **sin ninguna dependencia**— y su
propia cabecera declara que *«se lanzan a mano … No entran en `npm run probar`
… porque necesitan un Chrome y una red viva»*. Nadie los importa **a propósito**.
Son evidencia y herramienta viva, no basura. Ninguna herramienta que mire
importaciones puede ver eso; hay que abrir el fichero, y por eso se abrió.

---

## 2 · Bloque A(a) — el código muerto, las cinco formas

### 2.1 · Las cuatro clases de cada export, motor y app por separado

| | total | producción | solo-tests | solo-build | **huérfano** |
|---|---:|---:|---:|---:|---:|
| **motor** | 588 | 302 | 148 | 0 | **138** |
| **app** | 81 | 28 | 35 | 1 | **17** |
| **tipos** | 36 | 26 | 0 | 0 | **10** |
| **total** | **705** | **356** | **183** | **1** | **165** |

*(los «solo-build» de la tabla del clasificador se han recolocado según la nota
de cobertura: queda uno de verdad, `contrasteRgb`, que usa el arnés de e2e)*

**Lectura:** **el 26 % de los exports no lo usa nadie**, ni la producción ni las
jueces. Y **183 exports (26 %) existen solo para que las jueces puedan mirar
dentro** — eso no es código muerto, es superficie de prueba, y es una decisión
legítima que conviene saber que se ha tomado.

⚠️ **Discrepancia con knip, declarada:** knip cuenta **121** (93 exports + 28
tipos) y este clasificador **165**. La diferencia son, sobre todo, los **10 de
`tipos/src/index.ts`**: para knip son la API pública de un paquete y no los
toca; aquí se miden por uso real, y **nadie los usa**. El resto de la diferencia
no se ha desglosado uno a uno: **NO CONSTA**.

### 2.2 · «Declarado y nunca cableado»

Los huérfanos de la app son casi todos de este tipo, y se agrupan solos:

* **`app/src/app/iconos.ts` — 6 constantes de color y 2 funciones** que nadie
  llama: `COLOR_BIBLIOTECA`, `COLOR_COLEGIO`, `COLOR_GUARDERIA`,
  `COLOR_UNIVERSIDAD`, `COLOR_HOSPITAL`, `COLOR_CENTRO_SALUD`, `colorDeCapa`,
  `encimaDe`. knip además detecta que **cuatro son alias del mismo valor**
  (`MORADO|COLOR_BIBLIOTECA`, `MOSTAZA|COLOR_COLEGIO|COLOR_GUARDERIA|COLOR_UNIVERSIDAD`,
  `AZUL|COLOR_HOSPITAL|COLOR_CENTRO_SALUD`, `VERDE|COLOR_ORIGEN|COLOR_SITIO`):
  una capa de nombres semánticos **construida entera y no enchufada nunca**.
* **`app/src/app/buscador.ts`** — `MIENTRAS_SE_PREGUNTA`,
  `MIENTRAS_SE_PREGUNTA_AL_AYUNTAMIENTO`, `enDosNiveles`, `EnDosNiveles`.
* **`app/src/app/contraste.ts`** — `deCss`, `Rgb`; y `app/src/app/panel.ts` — `Fila`.

En el motor el patrón es el mismo, en constantes de configuración exportadas
que solo se usan dentro de su fichero: `ESPERA_MS` y `BACKOFF_MS` de
`distintivo.ts`, `URL_POSTE` de `avanza.ts`, `URL_AJAX` · `URL_NONCE` ·
`CAMPO_NONCE` · `TTL_NONCE_MS` de `recorrido.ts`, `URL_FLOTA` · `URL_ZONAS` ·
`ESPERA_MS` · `BACKOFF_MS` · `REINTENTOS` de `yego.ts`, y así.

**No son un bug.** Exportar una constante la hace *citable* desde una juez, y
media casa está escrita así. Lo que dice la cifra es que **se exporta por
costumbre, no por necesidad**, y que la línea entre «API del módulo» y «detalle
interno» hoy no está trazada.

### 2.3 · Inalcanzable

**NO CONSTA.** No se ha buscado código inalcanzable (ramas muertas tras un
`return`, condiciones imposibles): `tsc` no lo reporta con la configuración de
la casa y no se ha corrido ninguna herramienta que lo haga.

### 2.4 · Ficheros huérfanos

* **`app/e2e/` — 8 ficheros.** Mirados antes de juzgar: **evidencia conservada
  y herramienta viva**, no basura. Ver § 1.
* **Ningún otro.** `motor/src` y `app/src` no tienen ficheros que nadie importe.

### 2.5 · Dependencias

| clase | hallazgo |
|---|---|
| **Declarada y no usada** | **`@angular/forms`** (`app/package.json`) — ni un `FormsModule`, ni un `ReactiveFormsModule`, ni un solo import en `app/src`. La pantalla usa `[value]` + `(input)` a mano. |
| **Declarada y no usada** | **`prettier`** (devDep de `app`) — no lo invoca ningún script de ningún `package.json`. |
| **Usada sin declarar** | **Ninguna dependencia npm.** knip no reporta «unlisted dependencies». |
| **Binarios sin declarar** | `netstat` y `findstr` (en `app/scripts/comprobar-arranque.mjs`) y `tsc` (en `motor/package.json`). Los dos primeros **atan el arranque a Windows**; el tercero viene por transitiva de Angular. |

---

## 3 · Bloque A(b) — la copia a mano, con recuentos

### 3.1 · La tabla

| qué | distintos | repetido en más de un fichero | dónde duele |
|---|---:|---:|---|
| **Frases de cara al usuario** | 660 | **7** (y solo **1** es prosa de verdad) | `«disponibilidad no verificada.»` ×3 |
| **Iconos de texto en pantalla** | 18 | **5** | la tabla de hitos, en dos casas |
| **Colores hex** | 63 | **14** | la paleta del mapa, en dos casas |
| **URLs** | 24 | **2** | Avanza y OSM |
| **Nombres de constante en mayúsculas** | 263 | **13** | `ESPERA_MS` en **6** ficheros |

### 3.2 · Las frases: **no hay caso para un gestor de mensajes**

660 cadenas distintas de prosa en el código de producción y **siete** repetidas
entre ficheros. De esas siete, cinco son expresiones de plantilla
(`i === activo()`, `marcado() ? 'true' : null`) y una es un fragmento de
sintaxis (`as const, texto:`): ruido del método, no mensajes. **Prosa de cara al
usuario repetida entre ficheros: una**, `«disponibilidad no verificada.»`, en
`estacion-viva.ts`, `poste-vivo.ts` y `viaje-bizi.ts` — más
`«${AVISO_ZBE_SIN_RUTA}. …»`, que **ya sale de una constante compartida**.

La fuente única **ya existe donde importa**, y no es un gestor: es el reparto de
la casa. El motor redacta el texto y la pantalla lo pinta sin reescribirlo; los
avisos viajan dentro del contrato. Un catálogo de mensajes hoy movería 660
cadenas de sitio para resolver **un** duplicado.

> **Respuesta: NO.** Y la doctrina lo dice mejor que la cifra: una fuente única
> **sin guardián de su salida no está terminada** (L43). Montar el gestor sería
> añadir una pieza que hay que vigilar para arreglar una repetición que se
> arregla con una constante.

### 3.3 · Los iconos: **hay caso, y es pequeño y concreto**

Dos tablas de hitos, en dos ficheros, con los **mismos cuatro glifos**:

| | `app/src/app/buscador.ts` (la lista de pasos) | `app/src/app/mapa.ts` (`GLIFO`) |
|---|---|---|
| entradas | **12** (8 flechas de giro + 4 hitos) | **4** |
| coincidentes | `🚲` `🅿` `🚌` `🚏` | los mismos cuatro |

La copia **está declarada**: el comentario de `mapa.ts` dice *«Mismos caracteres
que la lista de pasos, por lo mismo de siempre: quien lee "🚌 Sube a la 39…"
busca esa marca en el plano»*. Es la copia vigilada como decisión (L30), y está
razonada.

⚠️ **Pero no está vigilada.** Medido: las jueces fijan los glifos **por
separado en cada casa** —`buscador.spec.ts` compra `🚲` y `🅿`;
`mapa.spec.ts` compra los cuatro— y **ninguna compara las dos tablas**.
Consecuencia exacta: cambiar `sube: '🚌'` en `buscador.ts` **no rompe ni una
juez**, y el plano y la lista se separarían en silencio. Eso es justo lo que L43
prohíbe.

> **Respuesta: no un gestor — un guardián.** Una juez de tres líneas que compre
> que los cuatro hitos comunes coinciden entre las dos tablas cierra el agujero
> entero. Unificar las tablas también valdría, pero es más código para el mismo
> resultado, y rompe la razón por la que `mapa.ts` tiene solo cuatro.

### 3.4 · Los colores y las constantes reteclados

* **`#b45309`** —el naranja de la casa— aparece **en 6 ficheros**: tres CSS,
  `iconos.ts`, `mapa.css` y `mapa.ts`. Los CSS no pueden leer una constante de
  TypeScript, así que parte del reteclado es estructural; entre `iconos.ts` y
  `mapa.ts` no lo es.
* **La paleta del teselado duplicada**: `#f2efe9`, `#aad3df`, `#d1c6bd`,
  `#c7c7b4`, `#fbd6a4`, `#f9b29c`, `#978685` están **en `contraste.ts` y en
  `mapa.ts`**. Siete colores, dos copias. Aquí sí hay una fuente única posible
  y barata.
* **`ESPERA_MS` se declara en 6 ficheros** (`avanza`, `bizi`, `distintivo`,
  `renovar-feed`, `yego` y `autocompletar-via`) con valores propios, y
  `BACKOFF_MS` en 3. **No es un duplicado: es el mismo nombre para políticas
  distintas.** Riesgo bajo, coste de lectura alto — quien lee un `ESPERA_MS` no
  sabe de cuál habla sin mirar el fichero.
* `RADIO_TIERRA_M` (`cercano.ts` / `proyeccion.ts`), `CELDA_M` y
  `ANCHO_REJILLA` (`ejes.ts` / `proyeccion.ts`), `VELOCIDAD_KMH`
  (`red-coche.ts` / `rueda.ts`): **estos sí son magnitudes físicas que deberían
  tener un solo sitio**, o declarar por qué no.

---

## 4 · Bloque A(c) — las deudas nombradas, verificadas una a una

### 4.1 · `operaEl` duplicado — **NO SE CONFIRMA**

Buscado por definición, por llamantes y por historia:

* **Una sola definición**, `motor/src/red-bus.ts:774`.
* **Llamantes de producción: 2** — `desvios.ts:342` y `viaje-bus.ts` (líneas
  1319 y 1501).
* **Sí está en pruebas**, al contrario de lo que decía la deuda: `red-bus.spec.ts`
  la usa **5 veces** y `viaje-bus.spec.ts` una.
* `git log -S "function operaEl"` devuelve **un solo commit**, el de origen.

Lo más parecido a una segunda copia es **la intersección escrita a mano dentro
de `ventanaDe`** (`viaje-bus.ts:258`): `new Set(red.porFecha[fecha] ?? [])`
cruzado con los servicios del patrón. **No es un duplicado que unificar**: ahí
no se quiere un booleano, se recorre `porServicio` con los datos de cada
servicio. Es el mismo predicado dicho dos veces, con razón. (`festivo.ts:114`
también lee `porFecha`, pero para otra pregunta: el tipo de día.)

> **Veredicto: la deuda, tal y como está enunciada, no existe hoy.** Si hubo una
> segunda copia, se fue antes del 8/09. Queda como cosmética la intersección de
> `ventanaDe`, si algún día se quiere nombrar.

### 4.2 · `viajeEnBus` sin puerta de desvíos — **SIGUE, y su alcance es UNO**

`viaje-bus.ts:1529` — la firma no admite desvíos y llama a
`prepararViajeEnBus(…, undefined, ahora)`: le pasa `undefined` **a propósito y
sin manera de cambiarlo**.

* **Consumidores de producción: 1.** `trayecto.ts:377`, la rama del bus de
  `calcularTrayecto` — **la puerta síncrona**, la que usan las jueces del peatón
  y de la rueda. La de producción para bus es `calcularTrayectoVivo`, que va por
  `prepararViajeEnBus` **con** desvíos.
* **Consumidores de pruebas: 4** en `festivo.spec.ts`.

> **Veredicto: deuda real, riesgo bajo hoy y creciente.** No muerde en
> producción porque `/api/ruta` no pasa por ahí. Muerde el día que alguien sirva
> bus por la puerta síncrona — y entonces no habrá aviso: **la regla que lo
> impide es la REGLA DE CASA escrita en la cabecera de dos specs, y depende de
> que alguien la lea**. Es exactamente lo que la juez 4 de `hueco-de-capas.spec.ts`
> compra hoy: que la asimetría existe.

### 4.3 · El gemelo de `continuando` — **SIGUE, con su medida del 7/09**

`continuando` (`viaje-coche.ts`) exige una transición legal desde `viniendoDe`.
Con el hilo del reconstruido es correcto; con la arista que se le **lee** al feed
—que sale de una proyección a 25 m— **no**: medido el 7/09 sobre las 1.841
costuras, **522 (28 %)** no son ninguna de las dos caras del enganche de la
parada ni enlazan con ellas. La búsqueda se queda sin salidas, se afloja al
fondo de saco, y **el encadenado no restringe nada en esas 522**.

* **Es el gemelo exacto del defecto que la nº33 ya arregló** en `rematando`
  (allí eran 68 de 200, el 34 %).
* **Efecto medido:** de 70 costuras que arrancaban dando media vuelta, quedan
  **65**. El arreglo del 7/09 quitó cinco; las otras 65 son sobre todo avenidas
  de doble calzada, donde volver no usa la gemela sino la otra calzada.
* **Código sin tocar** desde entonces: `continuando` es compartido con todo el
  coche, y aflojar ahí la contigüidad relajaría los vetos de giro del
  reconstruido, que sí los necesita.

> **Veredicto: deuda real, con riesgo acotado y conocido.** No empeora nada: es
> restricción que no llega a aplicarse. Su coste es que `fondosDeSaco` cuenta
> 527 medias vueltas que casi nunca son un callejón, o sea que **el contador que
> vigila el veto está lleno de ruido**.

### 4.4 · `servidor.ts` sin spec — **SIGUE, y ahora se puede medir cuánto**

* **`servidor.ts` tiene CERO exports.** No hay nada importable, así que **no hay
  nada judiciable**: cualquier juez tendría que arrancar el proceso.
* Arranca al importarse (`servidor.listen(PUERTO…)`) y **`PUERTO = 3000` está
  fijo**, sin variable de entorno: no se puede levantar una segunda instancia
  para probarla al lado de la que esté corriendo.
* Lo que sí es judiciable ya se bajó de capa el 7/09: `atenderYEscribir` vive en
  `distintivo.ts` justamente para poder comprarlo.

> **Veredicto: zona sin vigilar, y la más grande del repositorio.** Todo el
> enrutado, los códigos de estado, las cabeceras `no-store` y el orden del
> arranque están sin una sola juez. Abrirla cuesta dos cosas pequeñas: sacar el
> `PUERTO` a una variable de entorno y separar el manejador del `listen`.

### 4.5 · El saco del `THIRD-PARTY-NOTICES.md`, «la tabla de las SEIS» — **NO CONSTA**

Buscado en `THIRD-PARTY-NOTICES.md` (3.207 líneas) y en `docs/` por `SEIS`,
`seis`, `saco`, `pendiente` y `PENDIENTE`. Lo único que aparece con «seis» son
**las seis páginas del WFS de la BiZi** (§ 1, ficha de estaciones) y **los seis
colegios de Educación Especial que entran** (§ 1.x). Ninguna tabla de deudas ni
ningún «saco». **No se afirma que no exista: se afirma que con esas palabras no
está.** Hace falta que Antonio diga de qué tabla habla.

---

## 5 · Los hallazgos agrupados por causa

### Causa 1 — **Se exporta por costumbre, no por necesidad**
165 huérfanos, 183 solo-tests, la capa de alias de color de `iconos.ts` montada
entera y nunca enchufada. No hay una línea trazada entre «API del módulo» y
«detalle interno», y `export` es el valor por defecto de todo.
**Muerde en producción: no. Deuda: sí, de lectura.**

### Causa 2 — **La copia vigilada existe; el guardián, no**
La tabla de hitos en dos casas, la paleta del teselado en dos ficheros. Las dos
copias están **declaradas y razonadas**, que es la mitad buena de la doctrina.
Lo que falta es la otra mitad: nadie compra que sigan coincidiendo.
**Muerde en producción: puede — en silencio.**

### Causa 3 — **Restricciones que se aflojan solas y contadores que lo tapan**
El gemelo de `continuando`: 522 de 1.841 costuras sin restringir, y un
`fondosDeSaco` que las cuenta todas iguales, callejón o no.
**Muerde en producción: no hoy. Deuda: sí.**

### Causa 4 — **Puertas que dependen de que alguien lea una regla**
`viajeEnBus` sin desvíos; la REGLA DE CASA escrita en la cabecera de dos specs.
**Muerde en producción: no hoy. Deuda: sí, y crece sola.**

### Causa 5 — **Lo que no tiene forma de ser probado**
`servidor.ts` con cero exports y el puerto fijo. La única zona grande del
repositorio sin ninguna juez.
**Muerde en producción: si pasa algo, nadie se entera antes que el usuario.**

### Causa 6 — **Peso muerto declarado**
`@angular/forms` y `prettier` en `app/package.json`; `netstat` y `findstr`
atando el arranque a Windows.
**Muerde en producción: no. Cosmética, salvo lo de Windows.**

---

## 6 · Las tandas que propongo — **para que Antonio decida**

### Tanda 1 · Antes del 14 (barato, y quita ruido del despliegue)
1. **La juez de los cuatro glifos** — tres líneas, cierra la causa 2 en su mitad
   peligrosa.
2. **Quitar `@angular/forms` y `prettier`** de `app/package.json` — dos líneas,
   y el bundle deja de arrastrar lo que no usa.
3. **La paleta del teselado a un solo sitio** entre `contraste.ts` y `mapa.ts`.

### Tanda 2 · Antes del 14 si hay hueco (una tarde)
4. **`PUERTO` a variable de entorno y el manejador separado del `listen`** — no
   escribe ninguna juez, pero **hace posibles todas las de la causa 5**. Es el
   mismo movimiento que el 7/09 hizo posible la juez del cuelgue.

### Tanda 3 · Al cierre, tras la estética
5. **La poda de los 165 huérfanos**, por ficheros y con las jueces delante.
6. **El gemelo de `continuando`** — decisión de diseño, no limpieza.
7. **La puerta de desvíos de `viajeEnBus`** — o cerrarla, o escribir la juez que
   compre la asimetría desde el otro lado.
8. **Los binarios de Windows** del comprobador de arranque, si el despliegue en
   Hostinger los va a necesitar.

### Lo que NO propongo
* **Un gestor de mensajes.** Un duplicado de prosa en 660 cadenas no lo paga.
* **Unificar las dos tablas de iconos.** El guardián cuesta menos y conserva la
  razón por la que `mapa.ts` tiene cuatro entradas y no doce.

---

## 7 · Una corrección que sale de este censo

En el checkpoint del 7/09 (entrada nº38) escribí que **no había automatización
de navegador en este entorno**. **Es falso.** `app/e2e/` tiene un arnés de Chrome
propio y sin dependencias —`abrirChrome` en `medir.mjs`, por CDP contra
`chrome.exe`— con ocho ficheros de jueces que miden el píxel. La prueba real que
allí declaré `NO CONSTA` **se puede hacer**, con el motor en 3000 y la pantalla
en 4200. Lo que sigue siendo cierto es lo otro: el motor que estaba vivo llevaba
el código de antes del arreglo, y reiniciarlo no me tocaba a mí.
