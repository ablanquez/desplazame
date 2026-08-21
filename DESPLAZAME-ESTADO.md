# DESPLÁZAME — ESTADO

**Escritor único: la conversación de estrategia.** Nadie más escribe aquí.
El ejecutor reporta descubrimientos; no toca este fichero.

---

## ESTADO ACTUAL — 21 de agosto de 2026 (mañana)

**⭐ PUNTOS 1-6 CERRADOS Y EL 7 EN PIE: la demo calcula, pinta y narra
rutas andando, y está PUBLICADA (`b027199..cb01522`, 20/08 noche). Del
punto 7 solo queda la retirada de los andamios de carga.**

Lo que existe y funciona, todo visto por el ojo de Antonio (inventario
levantado el 18/08 y des-caducado el 21):

- **La pantalla** (el buscador, en la raíz): formulario donde TODO se
  elige — calles con autocompletar contra el motor («LIMPIO [NÚCLEO]»,
  corchetes), portal de lista real en orden natural, borrador marcado si
  se sale sin elegir, «Generar ruta» exigiendo los cuatro CÓDIGOS.
  Modos: Andando · Bus / Tranvía · Bici / Patinete · Coche (mayúscula
  tras la barra: peso visual, decisión de Antonio). ⇅ invertir y «Mi
  ubicación» dentro (punto 6). Y «Generar ruta» devuelve la RUTA REAL —
  pintada, con los pasos escritos y las negritas por partes: la
  respuesta falsa murió sin rastro (`2013c04`).
- **El visor** (`/visor`): el mapa a ventana casi completa con las
  CATORCE capas apagables — portales, grafo, carriles, postes bus,
  trazados bus, tranvía ×2, BiZi, aparcabicis, aparcamotos, regulado
  ESRO+ESRE, zonas, PMR, y la vista de cotejo de la ampliación. TODAS
  desmarcadas por defecto. Router mínimo [DOC]; los 42 MB no se
  re-descargan al navegar (medido).
- **El motor**: workspaces npm, contrato en `@desplazame/tipos`,
  TypeScript SIN compilar, carga antes de `listen()` (grafo 98.774
  aristas ~190 ms · callejero 3.359 vías · 46.150 portales), ~248 MB de
  RSS (medido en el punto 5; el 7 sumó +344 ms de arranque y +11,1 MB de
  heap — el RSS NO se ha vuelto a medir). Endpoints vivos, CINCO:
  `/api/salud` · `/api/vias?q=` · `/api/portales?via=` ·
  `/api/portal-cercano` · `POST /api/ruta`. ⭐ N = 3.359 · M = 2.731 (la publicada).
- **Los datos**: TRECE conjuntos / catorce fichas — el decimotercero, los
  nombres OSM, vive en `motor/data/` y NO viaja al navegador (§1.14);
  cada uno con ficha, huella sobre clon y atribución. CINCO
  descargas propias (aparcabicis, aparcamotos, regulado, zonas, PMR),
  todas con la norma Set-Cookie. El callejero lleva 5 correcciones
  declaradas («están mal y punto»).
- **La bitácora: 8 entradas, las 8 cerradas con ley.** Las guardias
  (interfaz y motor) con rojos vistos, exigiendo las tres cargas.
- **La carta y el README al día con la doc delante**: CLAUDE.md dice el
  motor real y apunta en vez de listar; el README tiene «Cómo arrancarlo
  en local» PROBADO en clon limpio, los endpoints leídos de `servidor.ts`,
  los documentos
  del método enlazados, y la frase de cierre veraz.

**Publicado hasta `cb01522`** — push del 20/08 por la noche
(`b027199..cb01522`, 242 objetos), y `main` emparejada con `origin/main`
por fin. **En local no queda nada sin publicar.**

**⭐ PUNTO 6 CERRADO (19/08).** El estado de los cuatro campos subió al
padre con la doc de Angular delante (`model()` + atadura desazucarada —
y cerró el hueco latente del model externo), ⇅ invertir cruza estados a
medias incluidos, y «Mi ubicación» rellena por código vía
`/api/portal-cercano` (1,35 ms medidos) con umbrales medidos (≤100 m de
accuracy [DOC MDN] · ≤150 m al portal — y el hallazgo: no existe corte
que separe Zaragoza de fuera, así que el mensaje dice la verdad medible:
«el portal más cercano está a N metros»). Ocho mensajes dignos en total.
La prueba de fuego fue el sobremesa de Antonio: accuracy 5000 m (IP) →
el botón se negó con el número real dentro — el umbral funcionando en
vivo; el camino del éxito espera un móvil con GPS. 73 pruebas; el
repintado sin zone.js verificado sin empujón.

**Punto 7, casilla 2 del acceso/coste RESUELTA POR DOCUMENTACIÓN
(21/08, mediodía) — sin parlamento: la doctrina decidió sola.** La
regla del peatón resultó ser el **art. 121.1 del RGC, literal**: la
zona peatonal OBLIGA donde existe; donde no («no exista o no sea
practicable»), arcén o calzada — la excepción que salva el campo la
trae la LEY. El carril bici, prohibido al peatón por TRIPLE fuente
(graph.lua de Valhalla: pedestrian_forward=false · foot.lua de OSRM:
sin velocidad · Ordenanza de Zaragoza art. 25: «únicamente por
ciclistas»). El matiz acera-bici (prioridad peatonal, 20 km/h en la
nueva Ordenanza) casa con la clasificación calzada/acera/senda/calmado
que la capa municipal de carriles YA trae. La bici quedó cerrada de
rebote: jamás acera (Ordenanza + 121.5 RGC), y el que empuja es peatón
— lo que disuelve la discrepancia OSRM/Valhalla. El mecanismo de
«no existe acera» tiene dos implementaciones documentadas (cierre por
tag [sin nuestro dato] · prioridad por tipo [OSMAnd, solo con `h`]) y
se elige en la casilla 3 con las rutas juez delante. ⚠️ Dos
caducidades vivas: el **RGC reformado (RD 518/2026) entra en vigor el
01-10-2026** — mismo principio, las citas migran al texto nuevo — y la
versión exacta de la ordenanza municipal que rige hoy es NO CONSTA
(TSJA + Nueva Ordenanza de Movilidad; se verifica en el punto 9).
Tabla completa con fuente por fila: en el plan, casilla 2.

**Punto 7, casilla 1 del acceso/coste HECHA (21/08) — el censo del
grafo, solo lectura, cero ficheros tocados.** ⭐ El hallazgo: cada
arista lleva DOS etiquetas — `p` (6 valores gordos) y **`h`, que es la
etiqueta `highway` de OSM**, ya cargada en memoria y ya usada para
narrar (es de donde sale «el carril bici»: cadena de cinco eslabones
con fichero y línea). `p` solo NO traduce la doctrina (mete 4.452
carriles bici, 7.254 track y 12.574 residential en el mismo saco
eje-de-calzada); **`h` sí: la tabla de la casilla 2 se calca sobre `h`
fila a fila.** Descubrimientos al censo: sexto valor de `p` no
catalogado (`eje-con-acera-declarada`, 2.385 útiles / 96,5 km) · `a`
NO es acceso peatonal, es filtro de red (quita autopistas/enlaces/
obras; deja dentro TODA la calzada urbana: 41.716 aristas de
eje-de-calzada, el 71,3 % de los km útiles) · ⚠️ carencia sin arreglo
con lo que hay: NINGÚN campo de acceso en la arista (foot/access/
oneway/surface — nada): la doctrina de tipos es aplicable, sus
overrides de OSM no. El antes, retratado: cycleway = 3,3 % de los km
útiles y las rutas juez lo pisan al 87,3 % (Coloso→Zuriza) y 64,7 %
(L. Romeo→Coloso); la céntrica, cero; **y el 77,9 % de los carriles
bici tienen acera propia a ≤25 m** (la ciudad ~75-80 %, el track
2,6 % — la regla absoluta dejaría al campo sin camino, por eso la
doctrina la hace condicional). Totales cuadrando en todas las tablas;
la alineación no-única de la ruta 3 declarada (4 m de 4.464, ningún
`h` cambia).

**Punto 7, pieza C HECHA (20/08) — EXISTE LA DEMO.** La pantalla pinta
la ruta real, lista los pasos con flechas y negritas (partes
estructuradas accion/via), y la respuesta falsa murió sin rastro. Seis
remates nacidos del ojo de Antonio sobre SUS rutas, todos con doctrina
citada: colapso de maniobras [OSRM 105 m] · tipo real (carril bici ≠
calzada — bitácora nº7: una lista de textos aceptables no comprueba
verdad) · HERENCIA POR VECINDAD de los ejes municipales §1.15
[Valhalla #5587 + Voronoi + confianza]: 40%→77,1% aristas nombradas,
cruce 225 ms, disputa 3%→genérico · un solo nombre por calle [núcleo +
canónico municipal, Karlsruhe] con la regla ancha (plazas absorbidas
como los motores; plaza-hito y rotondas = mejora futura declarada) ·
presentación IGN/RAE/OSM con negritas — bitácora nº8 (token sucio) ·
«para seguir por» [Valhalla stay-on]. 153+84 pruebas. 8 bitácoras, 8
cerradas. Queda del punto 7: retirar los andamios de carga (decisión
de Antonio sobre qué visualización queda) y el PUSH (sin publicar
desde b027199). Parlamento aparte anotado: el coste es solo metros —
elegir carril bici vs acera es accidente, no decisión.

**Punto 7, pieza B HECHA (20/08) — el motor calcula rutas de verdad.**
`POST /api/ruta` vivo: proyección construida (p50 5,5 m, contrastada
con la auditoría vieja al medio metro), Dijkstra 0,6 ms p50, las 4
combinaciones y el trivial con su rojo del naïf medido (10 m → 689 m el
peor), Peña Zorongo investigado (isla c=39 — 581 sin ruta con Aviso
honesto, el radio no se sube), pasos formato Google con fusión de
micro-pasos (umbral 25 m del valle del histograma; la céntrica 11→4
pasos, se lee como la captura; los «hacia la calzada» se quedan [DOC:
práctica Valhalla; coserlo del callejero no lo hace ningún motor]).
Bitácora nº6 con ley («una geometría no se comprueba por sus
extremos»). 117 pruebas. Falta la pieza C: pintar, listar los pasos, y
retirar la respuesta falsa.

**Punto 7, pieza A HECHA (20/08):** los nombres OSM promovidos de la
rama archivada a `motor/data/` (doble huella idéntica, nueve recuentos
casando, ficha §1.14 con el desfase fino de 17 h 44 min y la regla de
reparto interior-OSM/extremos-municipal) — y la contraprueba que evitó
la bitácora nº3 antes de nacer: la regla `-text` ampliada a
`motor/data/**` en el mismo commit. Quedan B (motor) y C (pantalla).

**El punto 7, cerrada su preparación (20/08):** la consulta al grafo
midió lo que hay (cero nombres en aristas · `p` clasifica el tipo · `m`
verificado · el `enlaces.json` del enganche PERDIDO — la proyección se
construye) y la investigación documental resolvió los tres frentes: lo
innombrado habla POR TIPO (el `p` es el dato de Valhalla), extremos
municipales / interior OSM (el 19,4% discordante declarado), umbrales
de giro LEÍDOS de `turn.cc`, snapping al patrón Loki con las islas
fuera. FORMATO DECIDIDO por Antonio: el de Google Maps (cardinal +
giros + «hacia X» + metros + lado del destino; rotondas fuera, mejora
futura). El plan lo estructura en TRES encargos: A el fichero de
nombres OSM (autorizado) · B el motor (`/api/ruta`) · C la pantalla
(pintado + pasos, y la respuesta falsa se retira).

**Lo siguiente:** DOS decisiones de Antonio pendientes — (1) la retirada
de los andamios de carga del mapa (~34 MB al navegador — y qué
visualización queda en la demo); (2) el acceso/coste
andando — casillas 1 (medición) y 2 (tabla, resuelta por
documentación) HECHAS; queda la casilla 3: llevar la tabla al motor,
eligiendo el mecanismo documentado con las rutas juez como contraste. La tercera —el push— se ejecutó el 20/08 por la
noche. Con las dos, el punto 7 se cierra y el 8 (destinos con nombre)
espera detrás, en construcción.

---

## 1 · Identidad

**Qué es:** buscador de rutas para moverse por Zaragoza. Cuatro campos
(calle y portal de origen y destino — todo elegido), cuatro modos
excluyentes (andando · bus/tranvía · bici/patinete · coche), la ruta en
el mapa y los pasos escritos. **Una sola pantalla de búsqueda** (más el
visor como herramienta de verificación con caducidad). No es multimodal.

**Qué NO es:** no promete tiempos totales inventados. Para bus y tranvía
rige D-G (14/08): componer sin prometer.

**Repositorio:** `github.com/ablanquez/desplazame` (público) · local
`F:\01_PROYECTOS\004_DESPLAZAME` · la OLD solo como almacén (se copia DE
ahí, nunca se lee DESDE ahí).

**Licencias:** código Apache 2.0 · datos ODbL (OSM), Ley 37/2007
(Ayuntamiento), MITMS (GTFS NAP). Copyright en el README. Atribuciones
colgadas de sus capas.

## 2 · Stack (firme)

- **Frontend:** Angular 22 standalone · Leaflet + OSM · router mínimo
  (dos rutas + comodín).
- **Motor:** Node + TS SIN compilar (no hay build — hecho de despliegue,
  ata el punto 12) · `node:http` · todo en memoria antes de `listen()`.
- **Workspaces** de raíz única (`tipos/`+`motor/`+`app/`), lockfile
  único · **contrato** por symlink: si el motor cambia, el front no
  compila, a propósito; crece cuando el motor lo pide.
- **Endpoints:** bajo `/api`; los vivos los declara el motor, los
  previstos el plan (6 y 8). Proxy dev `/api/**` → 3000.
- **Despliegue:** Hostinger plan Node — TODO en NO CONSTA hasta el
  punto 12 (versión Node, memoria, proceso persistente, index.html en
  rutas desconocidas, symlink a lo construido).

## 3 · Las reglas del reinicio

1. Visualización desde el minuto uno; nada cuenta sin verse funcionar.
2. Bitácora ante fallo real, con la skill, antes de arreglar.
3. Alcance corto; documentación y plan son los raíles — lo que surja se
   encaja en el plan o no se hace.
4. Commits atómicos; push solo cuando Antonio lo diga.
5. Datos pieza a pieza con autorización, tal cual, integridad sobre
   CLON; correcciones solo con «está mal y punto», declaradas con huella
   nueva.
6. Ninguna cifra heredada (del viejo o de memoria) como criterio: el
   dato manda, medido con comando.

## 4 · El plan

`PLAN-DESPLAZAME.md`, renumerado a enteros el 19/08 (fuera el «6B»):
**1-6 CERRADOS** · 7 primera ruta andando (LA DEMO EXISTE: piezas A, B
y C hechas y publicadas; queda la casilla de los andamios) ·
8 destinos con nombre
(EN CONSTRUCCIÓN; ganó la regla del portal condicional y la opción de
las 628 con trazados) · 9 bici/patinete (ordenanza VMP) ·
10 bus/tranvía · 11 coche (cargado: parkings, parquímetros, las tres
cuentas) · 12 despliegue (cargado) · 13 estética. La investigación de
datos abiertos vive en `docs/INVESTIGACION-EQUIPAMIENTOS.md`.

## 5 · Decisiones

**Heredadas:** D-G (componer sin prometer) · paradas se regeneran
(punto 10) · velocidad a pie 5,0 km/h.

**Del reinicio (16-17/08):** `app/.vscode/` versionado · GTFS como
instantánea con caducidad · D-MAPA-DE-HOY (punto 10) · reparto de censos
(callejero+municipal resuelven · enganchado salta al grafo · 124 sin
enganche → Aviso) · solo se sugiere lo cumplible · norma Set-Cookie ·
color BiZi es marca · correo del feed tal cual · el puerto no abre hasta
que el grafo está.

**Del 18/08:** «LIMPIO [NÚCLEO]» con corchetes · borrador marcado, no
borrado (opción B [DOC]) · correcciones en fichero con «está mal y
punto» · el portal se elige, y en el punto 5 (zanja abierta) · el visor
primero y el router se queda · aparcamotos fuente WFS · regulado ESRO
azul `#0284c7` / ESRE naranja `#f97316`, casilla única, solo el pago ·
zonas en panel propio zIndex 350 · PMR rosa `#ec4899` por DFA, manda
TIPO no SUBTIPO, los 5 E.S.PMR mixtos sin pintar · la vista de cotejo
queda interna (pública como prueba, sin producto ni ficha de la
noticia) · todas las capas desmarcadas por defecto · etiquetas «Bici /
Patinete» y «Bus / Tranvía» (mayúscula por peso visual; VMP descartado)
· toda ficha declara la cifra DE SU fuente.

## 6 · Cabos abiertos

**Punto 7 (lo que sigue vivo):** los **581** portales sin proyección →
`Aviso` honesto con nombre (460 son URBANIZACIÓN PEÑA ZORONGO, la
componente 39: el radio NO se sube) — sustituyen a los 124 del censo
viejo · los 628 con vía sin portal → candidato a `Aviso`, y su casilla
vive en el punto 8 · 170 componentes del grafo (169 islas) ·
`Via.nombre` crudo viaja sin usarse (no re-verificado hoy) · la retirada
de los andamios tiene su casilla (42 MB ya; la descarga perezosa quedó
dicha como opción) · rotondas y plaza-hito, declaradas MEJORA FUTURA
(sin etiqueta en el grafo) · la arista NO trae campos de acceso OSM
(foot/access/oneway/surface): los overrides de la doctrina no son
aplicables con el dato que hay — se trabaja con la tabla de tipos
pelada o se decide traer el dato (casilla 2) · el sexto valor de `p`
(`eje-con-acera-declarada`) existe y el estado ya lo cataloga · ⚰️ `enlaces.json` de la OLD: cabo MUERTO —
se perdió, y el punto 7 construyó la proyección por su cuenta.

**Punto 8:** en construcción — el dato personal de farmacias tiene su
salida apuntada («Farmacia» + dirección).

**Punto 9:** la ordenanza VMP antes de etiquetar tramos · la doble
capitalización «Senda ciclable/Ciclable».

**Punto 10:** líneas por poste (sin guardián) · caducidad GTFS (05/10;
servicio 27/12) sin vigilante hasta el cron · la API viva de Bizi.

**Punto 11:** parkings públicos (dos fuentes cojas) · parquímetros
reevaluables · las tres cuentas municipales que no cuadran.

**Punto 12 (todo NO CONSTA, y creció):** versión Node del panel (el
README ya advierte del `engines` sin declarar — candidato a declararlo
aquí) · memoria (~248 MB y el 7 subirá) · proceso persistente ·
index.html en rutas desconocidas (F5 en /visor) · symlink a lo
construido · guardias solo-Windows si hicieran falta allí.

**Punto 13:** color de marca (`NO CONSTA`) · title por ruta (la pestaña
dice «Desplázame» en las dos páginas) · capturas del README si se
quieren.

**Las normas de circulación (contexto vivo, 21/08):** el RGC
reformado por RD 518/2026 entra en vigor el **01-10-2026** (arts. 121
y 122 reescritos, mismo principio para el peatón) — desde octubre las
citas del proyecto apuntan al texto nuevo · la ordenanza municipal
vigente arrastra artículos anulados por el TSJA y hay Nueva Ordenanza
de Movilidad en camino: qué versión rige hoy, NO CONSTA (se verifica
en el punto 9).

**La ampliación del regulado (contexto vivo):** activación prevista de
golpe en verano 2027 (~15.000 plazas nuevas hasta 21.745; recurso Tacpa
pendiente — Heraldo 14/07/2026). El regulado y las zonas caducarán DE
GOLPE; los planos de Antonio traen zonas que el dato no enseña
(pendiente de detallar si algún día toca). La vista de cotejo morada es
la herramienta.

**Método y vigilancia:** nada vigila el README (nº1 y nº5 lo avalan; lo
cubren la regla transversal — la unidad es el documento — y la costura
§6) · 60 pruebas sin CI · guardias manuales y solo-Windows (declarado ya
en el README) · `GRAFO_ESPERADO` a mano · el hueco latente del model
externo quedó CERRADO con el refactor del punto 6 (el padre es el dueño;
todo entra por `elegir()`) — cabo nuevo a cambio: `SelectorPortal` ya no
lleva dentro la regla de tirar el portal, y si se montara en otro sitio
el portal se quedaría pegado (comentado y fijado con prueba doble) · el
eco de los 200 ms · datos municipales
caducan (callejero mensual; regulado de golpe) · npm 11 bloquea scripts
de 4 paquetes (no rompe el build, comprobado en clon) · TS rama 6 · los
`_cabeceras.txt` se sirven en `/datos/` (inofensivo, anotado) ·
`nombrePublicoNorm` existe y no se usa · el tranvía municipal nunca
descargado (opción futura).
