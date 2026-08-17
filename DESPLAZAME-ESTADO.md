# DESPLÁZAME — ESTADO

**Escritor único: la conversación de estrategia.** Nadie más escribe aquí.
El ejecutor reporta descubrimientos; no toca este fichero.

---

## ESTADO ACTUAL — 16 de agosto de 2026

**El proyecto acaba de reiniciarse desde cero.** La versión anterior (un motor
de rutas sin interfaz) está archivada en la rama `archivo/motor-vanilla` y el
tag `archivo/v1-motor` (commit `49e1105`), verificados en GitHub el 14/08.
De ella no se hereda ni código ni documentación: solo las decisiones que
viajen escritas en los encargos, y los datos que Antonio autorice pieza a
pieza.

**Dónde estamos: punto 2 en curso — la pantalla existe.** El punto 1 se
cerró el 16/08 (repo público, `main` sustituida, archivo del viejo intacto,
LICENSE y README con el modelo de la casa, verificado por Antonio en GitHub).
Ese mismo día: **la app Angular 22 arrancó en `app/` y Antonio la vio en
Chrome** — el esqueleto del CLI (standalone, sin router, CSS plano, sin SSR,
zoneless), con 200 comprobado por contraprueba. `THIRD-PARTY-NOTICES.md`
nació con las dependencias npm, y el badge de TypeScript se corrigió a la
rama real (6). Node se actualizó a 24.19.0 tras un paro correcto del
ejecutor: la 24.14.1 no cumplía el rango de Angular 22.

**La bitácora se estrenó el 16/08 y la skill disparó sola.** Al ir a
arreglar el README, el ejecutor encontró el verde mentiroso (git limpio y el
HECHO del encargo de `baccc36` cumplido *por no tocar el fichero*) y escribió
la entrada nº1 ANTES de arreglar, con su ley: *el alcance protege el fichero
de que lo editen, no de que envejezca.* La ley entró como regla transversal
del plan, y la entrada nº1 quedó ✅ CERRADA en frío (`c3c301f`) con la causa
raíz buena: *el verde no fue un descuido del método, fue el método
funcionando como estaba escrito.*

**Sin push desde `5188ba5`:** ocho commits en local — `01eb312` · `baccc36` ·
`299770d` · `726cb51` · `2742033` · `7976623` · `b6aba72` · `c3c301f`.

**PUNTO 2 CERRADO (16/08): la pantalla funciona y Antonio vio el ciclo
entero en Chrome** — cuatro campos con bloqueo del botón, modos excluyentes,
hueco del mapa rotulado, y la respuesta falsa marcada como ⚠️ DATOS DE
PRUEBA. Un componente `App` (se parte cuando una zona tenga estado propio),
formulario template-driven, cero dependencias nuevas. Nueve pruebas en
`app.spec.ts` con contraprueba hecha — **primer instrumento del proyecto**,
sin nadie que lo ejecute en automático (`NO CONSTA` CI). Cinco commits más
la releída del README por la regla transversal.

**PUNTO 3 CERRADO (16/08): el mapa vive y Antonio lo vio en Chrome** —
Zaragoza en Leaflet+OSM (componente propio, la frontera declarada en el
punto 2), la atribución con «colaboradores» escrita a mano porque el ejemplo
oficial de Leaflet no la lleva, **y con guardián en prueba**. La polilínea
falsa cierra el circuito entero. Y del punto salió la **entrada nº2 de la
bitácora** (el `200` de tres checkpoints lo daba un servidor muerto), cerrada
con una guardia determinista decidida con la doc: `comprobar-arranque.mjs`,
que verifica identidad y no estado, vista en rojo tres veces — y cuyos rojos
cazaron un defecto del propio guardián antes de fiarse de él.

**Sin push desde `5188ba5`: dieciséis commits en local** (del `01eb312` al
`103ecae`).

**Punto 4 en curso: la primera pieza dentro y vista (16/08).** Los 46.150
portales del Ayuntamiento (WFS IDEZar, mayo 2026) entraron tal cual, con
sha256 idéntico en origen, copia y procedencia declarada, campos revisados
sin dato personal, ficha completa en el notices, y pintados en canvas con
casilla de apagado — la atribución municipal cuelga de la capa y solo se
enseña cuando el dato se muestra. Antonio lo vio todo en Chrome. Y una
cifra mía caducada salió de CLAUDE.md (las «2.661 vías» venían del proyecto
viejo; el dato real da 2.731 códigos hoy): el número lo medirá el motor en
el punto 5 — decidido con la doc oficial: el CLAUDE.md lleva convenciones,
no mediciones (`ca1aaba`).

**La segunda pieza dentro y vista (17/08): el grafo.** 98.774 aristas
copiadas byte a byte desde la OLD (un `.js` de una línea que se lee como
texto, nunca se ejecuta), con sus tres partes declaradas en la ficha: el
grafo que se pinta, el enganche portal→arista que el motor querrá, y la
auditoría del viejo que viaja por indivisible. Pintado como una sola
multi-polilínea en canvas: 116 ms y arrastre fluido con todo encendido —
la red calca la tesela, cosa que el proyecto viejo jamás llegó a ver. Y por
el camino, **entrada nº3 de la bitácora**: el sha256 declarado era el del
disco propio, no el del clon — git metía un CRLF al checkout. Arreglada con
`.gitattributes` (`app/data/** -text`) y verificada sobre un clon recién
hecho. Su ley: la integridad se acredita en el clon; y su corolario: un
aviso repetido asumido como ruido es un fallo esperando el fichero adecuado
(el «LF will be replaced» llevaba saliendo desde el primer commit y se
despachó como normal — también aquí, en la estrategia).

**La tercera pieza dentro y vista (17/08): los carriles bici.** 733 rasgos
/ 2.120 tramos / 333,5 km del MU2 de movilidad — elegido con el catálogo
oficial del Ayuntamiento delante frente a la instantánea congelada de enero
2025, que se queda en la OLD. Integridad sobre clon, ficha con los avisos
honestos del dato (7 «En Construcción», 1 «No Municipal», doble
capitalización de «Senda ciclable» que viene del origen y no se corrige), y
pintados en magenta legible: 15 ms. Dos jugadas del encargo que valen
método: la guardia cazó en rojo a un servidor huérfano ANTES del checkpoint,
y la atribución municipal pasó a colgar de todas las capas municipales antes
de que el hueco existiera. **Y una corrección de herencia: la cifra «49.972
aristas que ruedan» queda retirada** — era una derivada del procesamiento
viejo, no un dato; la reproducirá el motor si le hace falta.

**La cuarta pieza dentro y vista (17/08): los postes de bus.** 944 postes
del MU3 municipal — y el paro previo del ejecutor dejó tres verdades en su
sitio: el dato es municipal (no del barrido de Avanza, como asumía mi
encargo), las líneas por poste NO existen como fichero en la OLD (viven en
el GTFS y en el barrido del punto 8, con el `stop_code` PA… como puente
verificado contra ZetaBus), y los «~934 / 44 rutas / 74 sentidos» heredados
eran el censo y las derivadas de ZetaBus — **van dos cifras derivadas
retiradas** (49.972 y 44/74), mismo patrón cazado dos veces. La ficha
declara los dos censos como legítimos y el `NO CONSTA` de por qué la OLD
tenía este dato en `exploracion/` sin adoptar. Color corregido a ojo de
Antonio: el cian se confundía con el azul de los portales; ahora rojo, con
el círculo de tono como criterio.

**La quinta pieza dentro y vista (17/08): el GTFS — y el tranvía completo
con ella.** El ZIP del NAP entró tal cual (hash por tres puntas: cabeceras
de la propia descarga, origen y clon), con la licencia MITRAMS resuelta
contra el precedente de ZetaBus y la divergencia declarada: la OLD y
ZetaBus lo gitignoreaban por frescura; aquí entra como instantánea
autorizada con caducidad 05/10 en destacado. shapes.txt y stops.txt
extraídos y verificados por miembro. Los 87 trazados de bus en violeta; el
tranvía en negro (recorrido grueso + 50 paradas con casilla propia, la
lógica de bus aplicada por decisión de Antonio). El control del mapa tiene
siete capas. ⭐ Dos misterios resueltos: las «44 líneas» de ZetaBus son
las 45 rutas CON viajes (44 bus + tranvía) — el feed declara 53 pero 8
especiales van apagadas (cementerio, estadio, sustitución del tranvía) —
y la caducidad «por dos vías» era por una: el feed se contradice (servicio
real hasta el 27/12). **Y una decisión nueva de Antonio, D-MAPA-DE-HOY:**
el mapa pintará la red operativa del día, no el catálogo — se construye en
el punto 8 con el cron; queda en el plan con sus casillas.

**Publicado hasta `acfefaa`; veinte commits en local** (hasta `cc79570`).

**Lo siguiente:** las dos piezas que quedan del punto 4 — BiZi (estaciones
en la OLD: `MU1_estaciones_bici` + API) y aparcabicis (fuente: el catálogo
municipal, descarga nueva). Cada una con autorización de Antonio.

---

## 1 · Identidad

**Qué es:** buscador de rutas para moverse por Zaragoza. Cuatro campos (calle
y portal de origen, calle y portal de destino), cuatro modos excluyentes
(andando · bus/tranvía · bici · coche), la ruta en el mapa y los pasos
escritos. **Una sola pantalla. No es multimodal: se elige un modo.**

**Qué NO es:** no promete tiempos totales inventados. Para bus y tranvía rige
la decisión `G` heredada del 14/08: **componer sin prometer** — el transporte
participa como camino, no como coste; la lista se ordena por transbordos y a
igualdad por metros a pie, diciéndolo en la propia lista.

**Repositorio:** `github.com/ablanquez/desplazame` (público) ·
local `F:\01_PROYECTOS\004_DESPLAZAME` · la versión vieja en
`F:\01_PROYECTOS\004_DESPLAZAME-OLD` (solo como almacén de datos a autorizar).

**Licencias — DECIDIDO y MATERIALIZADO el 16/08:** código Apache 2.0 · datos
ODbL (OSM) y Ley 37/2007 (Ayuntamiento). El mismo modelo que Linaje, ZetaBus
y el Desplázame viejo. LICENSE es el texto oficial byte a byte (verificado
con `diff` contra ZetaBus); **el copyright vive en el README** (© 2026), como
en la casa, y el apéndice del LICENSE queda sin rellenar, como en la casa.
La atribución «© **colaboradores** de OpenStreetMap» va declarada por
adelantado en el README — es obligación de la ODbL, no cortesía.

## 2 · Stack (cerrado el 16/08, firme)

- **Frontend:** Angular 22, componentes standalone, sin NgModules. Leaflet +
  OpenStreetMap. Build con Angular CLI.
- **Motor:** Node + TypeScript, servidor mínimo (`node:http`; Fastify solo si
  el mínimo estorba). El grafo se carga una vez al arrancar y vive en memoria.
- **Tipos compartidos** entre motor e interfaz: `Paso`, `Trayecto`, `Modo`,
  `Aviso`. Si el motor cambia la respuesta, el front no compila — a propósito.
- **Endpoints:** `GET /api/vias` · `POST /api/ruta` · `POST /api/regenerar`
  (barrido nocturno de paradas, patrón ZetaBus, cron 02:00).
- **Despliegue:** Hostinger plan Node, symlink `public_html → app`.
- **Por qué Angular:** es el hueco del portafolio (001 PHP · 002 Vue ·
  003 Next/React · 005 Astro) y el stack dominante en empresa en España.
- **Por qué Node:** lo impone el grafo (68.649 nodos en memoria entre
  peticiones), no la preferencia.

## 3 · Las reglas del reinicio

1. **Visualización desde el minuto uno.** Existe una pantalla en Chrome antes
   que nada, y cada avance se comprueba mirándola. Nada cuenta como hecho sin
   verse funcionar. La estética, la última.
2. **Estado y bitácora a cero.** Este fichero y `docs/BITACORA.md` no heredan
   nada de las 5.112 líneas del intento anterior. La bitácora la escribe la
   skill `escribir-bitacora` cuando aparece un fallo real, antes de arreglarlo.
3. **Alcance corto.** El producto es el de §1 y nada más. Ninguna mejora,
   matiz o medición entra por iniciativa propia — se dice y se espera
   respuesta. *(El intento anterior murió de esto, y la ambición la metían
   los encargos, no Antonio.)*
4. **Commits atómicos**, rutas una a una, push solo cuando Antonio lo diga.
5. **Los datos entran pieza a pieza con autorización expresa**, a `data/`,
   se leen y no se editan a mano.

## 4 · El plan

Vive en `PLAN-DESPLAZAME.md` (raíz del repo), con casillas que se tachan.
Once puntos: 1 cimientos · 2 la pantalla · 3 el mapa · 4 los datos · 5 el
motor mínimo · 6 primera ruta andando (ahí existe la demo) · 7 bici ·
8 bus/tranvía · 9 coche · 10 despliegue · 11 estética.

## 5 · Decisiones heredadas del intento anterior

Solo estas viajan; el resto se quedó archivado.

- **D-G (14/08):** componer sin prometer. Bus y tranvía sin total inventado;
  orden por transbordos y a igualdad metros a pie, declarado en la lista.
- **Las paradas se regeneran, no se copian:** el barrido nocturno contra
  Avanza (patrón ZetaBus, `POST /api/regenerar`, cron 02:00) es el método;
  su salida caduca cada noche. Límite conocido y heredado: los desvíos de
  ruta se detectan; las paradas suprimidas, no.
- **La velocidad a pie es la estándar (5,0 km/h)**, la de OSRM/Valhalla, para
  que los tiempos sean comparables. No se recalibra con caminatas.

Y las tomadas en este reinicio (16/08):

- **`app/.vscode/` se queda versionado** [DOC]: el CLI lo genera a propósito
  y su `.gitignore` no lo excluye — Angular lo concibe compartido.
- **`@angular/router` se queda hasta el punto 5** [DOC el hecho, PROPIO la
  espera]: es el conjunto estándar del CLI, no viaja al bundle si no se
  importa, y quitarlo el primer día sería desviarse del esqueleto oficial
  sin ganancia.

## 6 · Cabos abiertos

- La capa de **aparcabicis no existe** en ningún sitio: habrá que traerla de
  fuente cuando le toque (punto 4 del plan).
- **Para el taller** (donde vive la skill, no aquí): el cierre en la misma
  sesión no ocurrió solo esta vez — hizo falta encargo de cierre en frío. Y
  la imprecisión que la releída cazó: la entrada dice «tres commits» y el
  fallo vivió cuatro (el commit de la propia bitácora va antes del arreglo).
  Decisión de Antonio: se deja tal cual — la entrada era exacta al capturar
  y las cerradas no se retocan.
- **La portada volverá a caducar cuando el punto 5 cree el motor** («no hay
  motor» dejará de ser cierto). No hay guardián que vigile el README y
  `NO CONSTA` que haga falta uno: hoy lo cubren la regla transversal del
  plan y la costura §6 de cada encargo. Si algún día se quiere un
  instrumento, lo decide Antonio.
- README y notices se apuntan mutuamente (datos ↔ dependencias). Correcto
  hoy; fácil que en la próxima ampliación uno describa al otro de oídas
  (aviso del ejecutor, 16/08).
- **Dos andamios nuevos con caducidad en el punto 5**, comentados en el
  código: el navegador se baja los 10,3 MB de portales enteros solo para
  pintarlos, y la entrada `datos` de `angular.json` que los sirve. Si el
  punto 5 llega y no se retiran, nada lo detecta — misma forma que
  `RUTA_DE_PRUEBA`.
- **El dato de portales caduca**: el callejero municipal se refresca
  mensualmente y el fichero es de mayo 2026. Los 46.150 son de ESTE
  fichero; regenerarlo dará otra huella. Cuándo refrescar lo decide
  Antonio.
- **`app/data/` queda dentro de la raíz web de producción** (symlink
  `public_html → app`). Hoy indiferente (dato público y reutilizable); si
  en el punto 5 no se quiere descargable en directo, es un `git mv` y
  quitar la entrada de `angular.json` — decisión para entonces.
- **La cifra de vías real está por medir**: 2.731 códigos en los portales,
  3.359 vías en el callejero completo según la procedencia (habrá vías sin
  portal). El motor la medirá en el punto 5 y ahí se publicará.
- **Dos versiones de los portales conviven en el repo, a propósito**: los
  municipales (Ley 37/2007) y los enganchados al grafo (ODbL, con distancia
  de enganche). Cuando el motor resuelva direcciones habrá que decidir cuál
  manda — decisión del punto 6.
- **124 portales no enganchan a ninguna arista** (46.026 de 46.150 sí).
  Son los que no tendrán por dónde salir cuando el motor calcule.
- **El grafo tiene 170 componentes** (el mayor: 65.707 nodos; ~2.942 nodos
  en 169 islas). Visible en el mapa; el motor decidirá qué hace con las
  islas.
- **`enlaces.json` de la OLD referencia aristas por índice de ESTE fichero
  exacto**: si el grafo se regenera algún día, esos índices caducan en
  silencio. Pendiente de tener presente cuando entren las paradas.
- **Los andamios de carga ya son ~34 MB** (10,3 portales + 22,8 grafo +
  0,8 carriles) que el navegador se baja solo para verlos. Caducidad en el
  punto 6, comentada en el código; nada lo vigila.
- **La doble capitalización del origen** («Senda ciclable» 58 + «Senda
  Ciclable» 1) viaja tal cual: quien agrupe por `tipo_carri` sin normalizar
  contará dos categorías donde hay una. Aviso para el punto 7.
- **Quedan piezas de bici en la OLD fuera de autorización**: estaciones
  Bizi (`MU1_estaciones_bici`) y una API de Bizi con ficheros de
  exploración. Entrarán con su pieza.
- **La dependencia «líneas por poste» está escrita en tres sitios**
  (notices §1.5, README, comentario en `app.ts`) **y ninguno es un
  guardián**: si el punto 8 llega y las líneas siguen sin estar, nada se
  pone rojo (aviso del ejecutor, 17/08).
- **Tres cifras heredadas del proyecto viejo han resultado derivadas, no
  datos**: 49.972 aristas ciclables, 44 rutas, 74 sentidos. Regla que
  sale del patrón: ninguna cifra del proyecto viejo se hereda como
  criterio — se contrasta contra lo que el ejecutor mida, y el dato manda.
  (Las «44» quedaron después explicadas: son las rutas operativas del
  GTFS.)
- **El correo de contacto del feed** (`feed_info.txt`, contacto
  profesional del operador) viaja dentro del ZIP tal cual — decidido por
  Antonio: es redistribución fiel de un dato oficial público.
- **La caducidad del GTFS (05/10) no tiene guardián** hasta el punto 8,
  donde el cron medirá la fecha viva en cada feed. Hasta entonces vive en
  el notices en destacado y en nadie más.
- **El andamio tiene caducidad escrita pero no vigilada**: `RUTA_DE_PRUEBA`
  en `app.ts` lleva el comentario de que se retira en el punto 6, y si ese
  día no se retira, nada lo detecta — la forma exacta del fallo nº1,
  señalada antes de que pase (aviso del ejecutor). La casilla de retirarla
  ya existe en el punto 6 del plan.
- **Las nueve pruebas de `app.spec.ts` no las ejecuta nadie en automático**:
  no hay CI. `NO CONSTA` que haga falta hoy; si algún día se quiere, lo
  decide Antonio.
- **La guardia de arranque es de invocación manual**: nada la llama solo
  (ni `npm start` ni CI — engancharla quedó fuera del alcance a propósito).
  Es la misma forma que la ley de la entrada nº1: la regla existe, el
  disparador no. `NO CONSTA` que haga falta engancharla; lo decide Antonio.
- **La guardia es solo-Windows** (netstat + Get-Process), y lo declara su
  cabecera. Si algún día hace falta en Hostinger, es otra pieza.
- **El verde de la guardia dice «no caducado», no «recién arrancado»**:
  si se reinicia sin tocar la configuración, un servidor con recarga en
  caliente pasa en verde — correctamente (falso negativo declarado).
- `@angular/router` instalado sin usar (lo mete el CLI aunque pases
  `--routing=false`). Revisión en el punto 5: si sigue sin usarse, fuera.
- **TypeScript va en rama 6** (6.0.3), no en la 5: salto de mayor que
  arrastra Angular 22. Anotado por si aparece en un error raro.
- `THIRD-PARTY-NOTICES.md` se amplía en el punto 4 con las fuentes de datos
  (fecha de descarga incluida). Sus dos `NO CONSTA` declarados: qué acaba en
  el bundle (no hay build de producción) y las licencias de las 497
  transitivas (leídas del lock, no de sus LICENSE).
- El color de marca del proyecto: `NO CONSTA`. Los badges del README llevan
  el gris neutro de la casa hasta que Antonio lo decida (punto 11).
- El Node del hosting: `NO CONSTA` qué versión ofrece Hostinger. Angular 22
  exige `^22.22.3 || ^24.15.0 || >=26`. Lo mira Antonio en el panel antes
  del punto 10 — mejor hoy que en el despliegue.
- El **plazo del GTFS (05/10/2026)** afecta al punto 8; el barrido nocturno
  de Avanza no depende de él.
