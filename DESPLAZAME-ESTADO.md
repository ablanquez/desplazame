# DESPLÁZAME — ESTADO

**Escritor único: la conversación de estrategia.** Nadie más escribe aquí.
El ejecutor reporta descubrimientos; no toca este fichero.

---

## ESTADO ACTUAL — 17 de agosto de 2026 (tarde)

**Dónde estamos: punto 5 (el motor mínimo), a dos casillas de cerrarse.**
Los puntos 1-4 están cerrados y publicados. Lo que existe y funciona hoy:

- **La pantalla** (punto 2): formulario de cuatro campos, cuatro modos
  excluyentes, respuesta falsa marcada como ⚠️ DATOS DE PRUEBA. 13 pruebas.
- **El mapa de verificación** (puntos 3-4): Leaflet+OSM con NUEVE capas
  apagables — portales, grafo, carriles, postes de bus, trazados de bus,
  tranvía (trazado y paradas), BiZi, aparcabicis. ~34 MB de dato, fluido.
  Las casillas son verificación de la fase de datos, NO producto.
- **Siete conjuntos de datos + el callejero** en `app/data/` (14+ ficheros,
  cada uno con ficha en el notices, huella verificada sobre CLON y
  atribución colgada de su capa).
- **El motor** (punto 5, en construcción): workspaces npm (`tipos/` +
  `motor/` + `app/`), contrato vivo en `@desplazame/tipos`, `node:http` en
  el 3000 tras el proxy `/api/**`. Corre TypeScript SIN COMPILAR (Node 24
  borra tipos). Carga al arrancar el grafo (98.774 aristas, ~190 ms) y el
  callejero+portales (60 ms) ANTES de abrir el puerto. 223 MB de RSS.
  `GET /api/salud` declara lo que lleva; `GET /api/vias` sugiere.
- **⭐ La cifra real de vías, medida y publicada: N = 3.359 del callejero,
  M = 2.731 sugeribles** (solo vías con portal — no se sugiere lo que el
  punto 6 no puede cumplir). La «2.661» de la memoria vieja está muerta.
- **La bitácora**: 3 entradas, las 3 cerradas con ley. **Dos guardias**
  (interfaz y motor) con rojos vistos, exigiendo grafo y callejero
  cargados y vigilando los tres ficheros de datos del motor.

**Publicado hasta `169da6a` (cierre del punto 4). En local: los commits
del punto 5** (estructura, grafo en memoria, callejero y `/api/vias`, más
los docs).

**El autocompletar está hecho y visto (18/08).** La pantalla consume al
motor (`httpResource` + 200 ms), las sugerencias van «LIMPIO [NÚCLEO]»
(corchetes: los paréntesis ya son del dato), el duplicado `Modo`/`Vertice`
murió, y el callejero lleva CINCO correcciones propias en el fichero
(2 CRT→CST + 3 MRL completadas — «están mal y punto»; huella
`5f5df76a…`, ficha con tabla). Por el camino, la **entrada nº4** de la
bitácora: escribir sin elegir desbloqueaba «Generar» — cazada por el ojo
de Antonio tras un checkpoint aceptado con 24 verdes; cerrada con la
opción B (borrador marcado, generar bloqueado) y su ley: la validación
mira el código, y la prueba entra por donde entra la persona. Las cuatro
entradas de la bitácora están cerradas.

**El selector de portales, hecho y visto (18/08, los seis pasos).** Los
46.150 enteros en el motor (99 ms; el callejero baja a 7 ms porque el
fichero se lee una vez; RSS 223→248 — el punto 10 acumula), servidos por
vía en orden natural (sortNumber municipal + Intl.Collator numérico,
demostrado BARAJANDO: el censo venía ordenado y sin barajar el comparador
roto habría dado verde). Combobox que se abre al entrar (mediana 9
portales), tope 50 = percentil 95. Deshabilitado sin vía, reset al
cambiarla, todo por código: «Generar» exige los cuatro. `FormsModule`
fuera: el bundle baja 393→353 kB. El formulario entero se rellena ya
contra el motor — la zanja quedó cerrada de una vez.

**La entrada nº5, capturada y cerrada (18/08).** El README juró «ningún
dato integrado» durante 2 días y 13 commits — y el verde lo daba la
propia regla de releída, cumplida trece veces sobre «Estado» mientras
«Licencia y créditos» envejecía. Ley nueva: una regla de releída vale lo
que su alcance; la unidad es el documento entero. Rectificación visible
en el README, cinco de cinco entradas cerradas. Y la releída entera del
documento destapó un género nuevo: dos líneas del Stack («build con tsc o
esbuild» · los cuatro tipos) son copia FIEL de CLAUDE.md — el README no
mintió: reflejó una carta que la realidad desmintió. Decisión de Antonio
pendiente: actualizar CLAUDE.md y el README detrás, o declarar que la
carta describe el plan.

**La carta al día (18/08), con la doc oficial delante.** CLAUDE.md dice ya
el motor real (sin build, contrato que crece — `d919930`) y guarda
convención con puntero en vez de listas que caducan: los endpoints vivos
los declara el motor, los previstos el plan; `data/` corregido a
`app/data/` (`041e432`); el README detrás (`7590fe4`). Punteros
comprobados: los dos destinos sostienen su mitad. La línea del Despliegue
(symlink) se queda tal cual: su corrección YA tiene casilla en el punto
10 — los raíles la llevaban.

**Lo siguiente (punto 5):** el destino de los andamios, la revisión del
router, y la casilla del README (endpoints y cifras medidas) — y el
punto 5 queda cerrado.

---

## 1 · Identidad

**Qué es:** buscador de rutas para moverse por Zaragoza. Cuatro campos
(calle y portal de origen, calle y portal de destino), cuatro modos
excluyentes (andando · bus/tranvía · bici · coche), la ruta en el mapa y
los pasos escritos. **Una sola pantalla. No es multimodal: se elige un
modo.**

**Qué NO es:** no promete tiempos totales inventados. Para bus y tranvía
rige la decisión `G` heredada del 14/08: **componer sin prometer** — el
transporte participa como camino, no como coste; la lista se ordena por
transbordos y a igualdad por metros a pie, diciéndolo en la propia lista.

**Repositorio:** `github.com/ablanquez/desplazame` (público) ·
local `F:\01_PROYECTOS\004_DESPLAZAME` · la versión vieja en
`F:\01_PROYECTOS\004_DESPLAZAME-OLD` (solo almacén de datos a autorizar:
se copia DE ahí, no se lee nunca DESDE ahí).

**Licencias — decididas y materializadas:** código Apache 2.0 · datos
ODbL (OSM), Ley 37/2007 (Ayuntamiento) y licencia MITMS (GTFS del NAP,
«Powered by MITRAMS»). El copyright vive en el README (© 2026), como en
la casa. Atribuciones colgadas de sus capas.

## 2 · Stack (cerrado el 16/08, firme)

- **Frontend:** Angular 22, componentes standalone, sin NgModules.
  Leaflet + OpenStreetMap. Build con Angular CLI.
- **Motor:** Node + TypeScript ejecutado SIN compilar (Node 24 borra
  tipos), servidor mínimo `node:http`. El grafo se carga una vez al
  arrancar y vive en memoria.
- **Workspaces npm** de raíz única: `tipos/` + `motor/` + `app/`, lockfile
  único en la raíz.
- **Tipos compartidos** (`@desplazame/tipos`, sin build): `Modo`,
  `Vertice`, `Paso`, `Aviso`, `Trayecto`, `Salud`, `Via`. El contrato es
  UN fichero por symlink — si el motor cambia la respuesta, el front no
  compila, a propósito. Crece cuando el motor lo pide, no antes.
- **Endpoints:** `GET /api/salud` · `GET /api/vias` · `POST /api/ruta`
  (por hacer) · `POST /api/regenerar` (punto 8, patrón ZetaBus, cron
  02:00). Proxy de desarrollo `/api/**` → 3000.
- **Despliegue:** Hostinger plan Node. `public_html` apuntará a lo
  CONSTRUIDO, nunca a `app/` literal (precisado en el punto 10 con el
  panel delante).
- **Por qué Angular:** el hueco del portafolio (001 PHP · 002 Vue ·
  003 Next/React · 005 Astro) y el stack dominante en empresa en España.
- **Por qué Node:** lo impone el grafo en memoria, no la preferencia.

## 3 · Las reglas del reinicio

1. **Visualización desde el minuto uno.** Cada avance se comprueba
   mirándolo. Nada cuenta como hecho sin verse funcionar. La estética, la
   última.
2. **Estado y bitácora a cero.** La bitácora la escribe la skill
   `escribir-bitacora` ante fallo real, antes de arreglar.
3. **Alcance corto.** El producto es el de §1 y nada más; nada entra por
   iniciativa propia. *(El intento anterior murió de esto.)*
4. **Commits atómicos** `tipo(ámbito): descripción`, push solo cuando
   Antonio lo diga.
5. **Los datos entran pieza a pieza con autorización expresa**, tal cual,
   se leen y no se editan; integridad acreditada sobre un CLON (ley nº3).
6. **Ninguna cifra del proyecto viejo se hereda como criterio**: se
   contrasta contra lo que el ejecutor mida, y el dato manda. *(Cuatro
   derivadas cazadas por este camino; solo las 276 de BiZi cayeron
   clavadas.)*

## 4 · El plan

Vive en `PLAN-DESPLAZAME.md` (raíz), con casillas que se tachan. Once
puntos: 1-4 CERRADOS · 5 el motor mínimo (en curso) · 6 primera ruta
andando (ahí existe la demo) · 7 bici · 8 bus/tranvía · 9 coche ·
10 despliegue · 11 estética. Los puntos 8 y 10 ya llevan cargado lo
aplazado desde el 4 y el 5.

## 5 · Decisiones

Heredadas del intento anterior (solo estas viajan):

- **D-G (14/08):** componer sin prometer. Bus y tranvía sin total
  inventado; orden por transbordos y a igualdad metros a pie, declarado.
- **Las paradas se regeneran, no se copian:** barrido nocturno contra
  Avanza (punto 8). Límite heredado: los desvíos se detectan; las paradas
  suprimidas, no.
- **Velocidad a pie estándar (5,0 km/h)**, la de OSRM/Valhalla.

Tomadas en este reinicio:

- **`app/.vscode/` versionado** [DOC] · **`@angular/router` se queda hasta
  la revisión del punto 5** [DOC+PROPIO].
- **El ZIP del GTFS se commitea** como instantánea con caducidad declarada
  (05/10), divergiendo de la OLD/ZetaBus con motivo (17/08).
- **D-MAPA-DE-HOY (17/08):** el mapa pintará la red operativa DEL DÍA, no
  el catálogo — se construye en el punto 8 con el cron.
- **Reparto de censos (17/08):** callejero+municipal resuelven y
  autocompletan · el enganchado salta al grafo (punto 6) · los 124 sin
  enganche resuelven normal y tendrán `Aviso` honesto.
- **Solo se sugiere lo cumplible (17/08):** `/api/vias` ofrece únicamente
  vías con portal (M=2.731), declarando N y M.
- **Norma Set-Cookie (17/08):** las cabeceras de descargas propias se
  guardan SIN identificadores de sesión, filtrado declarado — decidido
  con GitHub y OWASP delante, antes del primer push del dato.
- **El color de BiZi es marca** (#54A097): si choca, se ajusta forma, no
  tono. · **El correo del feed GTFS viaja tal cual**: redistribución fiel
  de dato oficial público.
- **El puerto del motor no abre hasta que el grafo está** — la guardia no
  puede dar verde a un motor a medio cargar.
- **«LIMPIO [NÚCLEO]» con corchetes (18/08):** los paréntesis ya son del
  dato (15 vías los traen; HERRERÍN es trampa) — dos signos, dos
  significados. · **Correcciones EN EL FICHERO cuando el dato está mal
  (17-18/08):** cinco aplicadas al callejero, con huella nueva y tabla en
  la ficha — el notices ya no dice «tal cual» de ese fichero. ·
  **Borrador marcado, no borrado (opción B, 18/08):** al salir sin
  elegir, el texto se conserva marcado y «Generar» sigue bloqueado
  [DOC usabilidad]. · **El portal se elegirá de lista, y en el punto 5** — con la
  zanja del formulario abierta, no reabriéndola en el 6 (18/08).

## 6 · Cabos abiertos

**Para el punto 5 (lo que queda):**
- La frase de cierre del «Estado» del README («el repositorio es esto:
  el método, el plan, las licencias y una pantalla con andamio») se ha
  quedado corta — hay motor y ocho datos. Se ajusta en la casilla del
  README de este punto (endpoints y cifras medidas), no en encargo
  suelto.
- El destino de los andamios de carga (~34 MB al navegador + la entrada
  `datos` de `angular.json` + `RUTA_DE_PRUEBA`): qué pasa al motor y qué
  sigue para el mapa de verificación. Retirada final en el punto 6;
  comentado en el código, nada lo vigila.
- `@angular/router` sin usar: la revisión pendiente.
- **Hueco latente del componente** (reportado con sonda, no vivo): si
  alguien escribe el texto del campo desde FUERA (`calleOrigen.set(…)`),
  el código fijado sobrevive y no se marca. Hoy nadie lo hace; taparlo
  pide decidir si el componente vigila su `model` — decisión de Antonio
  si algún día un tercero escribe ahí.
- **El eco**: elegir una sugerencia dispara una consulta más al motor
  200 ms después (el texto cambió). Inofensivo y nombrado en el helper
  de pruebas; si molesta, es ajuste fino de otro día.
- El campo `nombre` crudo viaja al navegador y no se pinta (se mantiene
  por ser el dato; el punto 6 dirá si lo usa).

**Para el punto 6:**
- Los 124 portales sin enganche → `Aviso` honesto, no fallo en silencio.
- Los 628 con vía pero sin portal: quien escriba una a mano no tendrá
  sugerencia — candidato a `Aviso`.
- El grafo tiene 170 componentes (169 islas, ~2.942 nodos): el motor
  decide qué hace con ellas.
- La carga de portales se comparte cuando `/api/ruta` los pida enteros
  (hoy `callejero.ts` solo guarda recuentos).

**Para el punto 7:** la doble capitalización «Senda ciclable/Ciclable»
del origen — quien agrupe por `tipo_carri` sin normalizar contará dos
categorías donde hay una.

**Para el punto 8:** las líneas por poste no existen aún en el repo (la
dependencia está escrita en tres sitios y ninguno es guardián) · la
caducidad del GTFS (05/10; servicio real hasta 27/12) sin vigilante hasta
que el cron mida la fecha viva · `enlaces.json` de la OLD referencia
aristas por índice de ESTE grafo: si se regenera, caducan en silencio ·
la API viva de Bizi (disponibilidad) sería de aquí, con sus condiciones
por resolver.

**Para el punto 10 (el panel de Hostinger, todo NO CONSTA):** versión de
Node (exige `^22.22.3 || ^24.15.0 || >=26` Y ejecutar TS sin compilar) ·
memoria del plan (el motor ya pide 223 MB de RSS, y el punto 6 subirá) ·
arranque de proceso persistente · si permite dos procesos o el motor
sirve también estáticos.

**Para el punto 11:** el color de marca del proyecto (`NO CONSTA`; badges
en gris neutro de la casa).

**Método y vigilancia (sin punto asignado):**
- Nada vigila el README: lo cubren la regla transversal y la costura §6.
  Ha caducado en silencio una vez (entrada nº1) y se cazó dos veces más
  por releída. README y notices se apuntan mutuamente: fácil que uno
  describa al otro de oídas en la próxima ampliación.
- Las 13 pruebas de `app` no las ejecuta nadie en automático (sin CI) ·
  las guardias son de invocación manual y solo-Windows · su verde dice
  «no caducado», no «recién arrancado» (falso negativo declarado) · la
  guardia vive en `app/scripts/` y ya vigila a dos procesos: con un
  tercero se le queda pequeño el sitio · `GRAFO_ESPERADO` está escrito a
  mano: si el grafo se regenera, roja hasta actualizarlo (intencionado).
- Los datos municipales caducan (refresco mensual del callejero; los
  ficheros son de mayo-agosto): cuándo refrescar lo decide Antonio.
- npm 11 bloquea los scripts de instalación de cuatro paquetes (esbuild,
  lmdb, msgpackr-extract, @parcel/watcher) — sin estorbar; por si un
  build falla ahí. · La memoria del motor es la foto del arranque: bajo
  carga, `NO CONSTA`. · TypeScript va en rama 6 (salto de mayor). · Del
  notices: qué acaba en el bundle y las licencias de las ~500 transitivas
  siguen en `NO CONSTA` declarado. · `nombrePublicoNorm` del origen
  existe y coincide con nuestra normalización; no se usa.
- El tranvía municipal (`MU3_lineas_tranvia`, `MU3_paradas_tranvia`)
  existe en el catálogo y nadie lo ha descargado nunca: opción futura.
