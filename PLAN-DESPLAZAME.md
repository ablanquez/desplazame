# PLAN — 004 Desplázame (reinicio)

Estado a 20/08/2026 (noche), publicado en `cb01522`. Se tacha lo hecho y lo
nuevo se añade en su punto.

Reglas que cruzan todo el plan:
- **Commits atómicos**, rutas escritas una a una, formato `tipo(ámbito): descripción`.
  Push solo cuando Antonio lo diga.
- **Del punto 2 en adelante, nada está hecho hasta verse funcionar en Chrome.**
- La bitácora la escribe la skill `escribir-bitacora` cuando aparece un fallo
  real, antes de arreglarlo. Nadie la escribe a mano.
- `DESPLAZAME-ESTADO.md` lo escribe solo la conversación de estrategia.
- El repo es **público desde el primer commit**: nada entra sin licencia clara
  y sin revisar qué se está subiendo.
- **Todo encargo que CREA algo nuevo relee lo que la portada afirma sobre su
  ausencia, antes de cerrar** — ley de la bitácora nº1 (16/08): el alcance
  protege el fichero de que lo editen, no de que envejezca.

## 1 — Cimientos

- [x] Carpeta `F:\01_PROYECTOS\004_DESPLAZAME` creada, VS Code dentro
- [x] Historial viejo a salvo: tag `archivo/v1-motor` + rama
      `archivo/motor-vanilla`, verificados en GitHub (14/08)
- [x] `CLAUDE.md` en la raíz (PARTE A del taller + PARTE B con el stack
      cerrado: Angular 22 + Node/TS + Leaflet, 16/08)
- [x] `git init`, identidad `ablanquez` verificada antes del primer commit
- [x] `.gitignore` antes del primer commit
- [x] `docs/BITACORA.md` creada vacía · `DESPLAZAME-ESTADO.md` v0 colocado
- [x] Primer commit `c2fc70d` + estado y bitácora en `d4558b2`
- [x] Remoto conectado y `main` sustituida con `--force` — el archivo del
      viejo verificado intacto en `49e1105` antes y después (16/08)
- [x] Licencia DECIDIDA: Apache 2.0 (código) + ODbL (OSM) + Ley 37/2007
      (municipal) — el modelo de la casa
- [x] LICENSE y README generados por Claude Code partiendo de Linaje y
      ZetaBus (`6b43700`, `1f2498d`). El copyright vive en el README, como
      en la casa; el LICENSE lleva el apéndice sin rellenar, como en la casa
- [x] Push de los cinco commits (`5188ba5` en origin/main, 16/08)
- [x] Verificado por Antonio en GitHub con sus ojos: portada con README y
      licencia detectada. **PUNTO 1 CERRADO**

## 2 — La pantalla antes que nada

- [x] Proyecto Angular 22 creado en `app/` (`baccc36`): standalone, sin
      router, CSS plano, sin SSR, zoneless. 200 comprobado con contraprueba
      (404 y puerto muerto) y **visto por Antonio en Chrome** (16/08)
- [x] `THIRD-PARTY-NOTICES.md` nacido en la raíz (`299770d`, 121 líneas):
      15 directas miradas una a una, 497 transitivas apuntadas al lock, y
      las tres no-MIT declaradas (MPL-2.0, CC-BY-4.0 con su atribución,
      BlueOak) — todas de desarrollo, ninguna viaja al navegador
- [x] Badge de TypeScript corregido a la rama real, 6 (`726cb51`)
- [x] Decidido con la doc ([DOC]): `app/.vscode/` SE QUEDA versionado — el
      CLI lo genera a propósito y su .gitignore no lo excluye
- [x] README: el párrafo de «Estado» corregido (`7976623`) — decía tres
      cosas falsas desde `baccc36`, cada afirmación nueva verificada contra
      el repo de hoy. **Y estrenó la bitácora** (`2742033`): la skill disparó
      sola al encontrar el verde mentiroso (git limpio + el HECHO del encargo
      cumplido *por no tocar el fichero*). Entrada nº1, 🔴 ABIERTA
- [x] README: `THIRD-PARTY-NOTICES.md` enlazado desde «Licencia y créditos»
      con el patrón de ZetaBus, recortado a lo que hoy es cierto
- [x] Entrada nº1 de la bitácora CERRADA en frío (`c3c301f`): causa raíz,
      arreglo y commit rellenos con git, estrella y ley intactas, y la nota
      de cierre declarando que NO se creó ningún instrumento — la vigilancia
      del README sigue siendo humana
- [x] Estructura declarada con la doc ([DOC] guía de estilo oficial): un
      solo componente `App` — se parte cuando una zona tenga estado propio
      (el mapa, punto 3)
- [x] Formulario de cuatro campos, template-driven con `FormsModule`
      ([DOC] guía oficial de forms; Signal Forms descartado con motivo).
      Cero dependencias nuevas, comprobado contra el lock (`aab68c8`)
- [x] Cuatro botones excluyentes con Andando activo por defecto, y la
      exclusividad probada con contraprueba (`aab68c8`)
- [x] Hueco del mapa rotulado «llega en el punto 3» y lista de pasos vacía
      (`456dbe7`)
- [x] «Generar ruta»: bloqueado hasta los cuatro campos, y la respuesta
      falsa marcada como ⚠️ DATOS DE PRUEBA en banda y en el texto de cada
      paso (`54dab4a`). README releído por la regla transversal (`7590b67`)
      e `index.html` a idioma `es` con la tilde (`dbd4755`)
- [x] Commit atómico por pieza — cinco commits
- [x] **CICLO ENTERO VISTO POR ANTONIO EN CHROME** (16/08): campos, bloqueo,
      exclusividad, banda de prueba y los tres pasos. **PUNTO 2 CERRADO**

## 3 — El mapa vivo

- [x] Leaflet 1.9.4 + `@types/leaflet` (las únicas dependencias nuevas,
      autorizadas), mapa centrado en Zaragoza en componente propio —
      la frontera declarada en el punto 2, cumplida (`0c19450`).
      Inicialización con `afterNextRender` [DOC], CommonJS declarado [DOC]
- [x] Atribución «© colaboradores de OpenStreetMap» escrita a mano — el
      ejemplo oficial de Leaflet NO lleva «contributors» y copiarlo sería
      incumplir la ODbL (hallazgo del ejecutor) — **y con guardián**: una
      prueba se pone roja si alguien quita la palabra
- [x] Polilínea falsa al generar, una sola (no se acumulan), ligada al
      aviso de DATOS DE PRUEBA. Notices al día: §1 reescrito porque OSM ya
      es obligación VIVA (teselas en ejecución), 17 declaradas / 500 en el
      árbol (`1c43c14`), README releído por la regla transversal (`9685e6a`)
- [x] **Visto por Antonio en Chrome** (16/08). **PUNTO 3 CERRADO**
- [x] El badge de Leaflet dejó de ser promesa solo, al instalarse
- [x] **Guardia de arranque nacida del fallo nº2** (`c3263a0`, cerrada en
      `103ecae`): `comprobar-arranque.mjs` verifica identidad, no estado —
      quién escucha, si arrancó después de tocar la configuración, y el
      hash de build cuando existe. Vista en ROJO tres veces con condiciones
      reales; probando sus rojos se cazó y arregló un defecto del propio
      guardián (exit 127 de libuv pisando el código de salida). Decidida
      con la doc y la doctrina del taller, no por gusto

## 4 — Los datos entran

Cada pieza entra **solo con autorización expresa de Antonio**, una a una,
desde `004_DESPLAZAME-OLD` hacia `data/`. Se lee, no se edita a mano.

- [x] Carpeta decidida: `app/data/` — lo decidió Angular, no el gusto (la
      raíz de trabajo es `app/` y rechaza assets de fuera). El motor del
      punto 5 lee de disco igual
- [x] Notices ampliado: la ficha completa de los portales en §1.2 (fuente
      WFS IDEZar, Ley 37/2007, atribución cumplida, fecha, sha256) y el
      encabezado corregido — «lo único de terceros son las npm» era falso
      desde hoy (`a35ffc9`)
- [x] **Los 46k portales dentro y VISTOS por Antonio** (16/08): 46.150
      exactos, sha256 idéntico origen/copia (y coincide con el que la
      procedencia declaraba), campos revisados sin dato personal, tal cual
      sin limpiar (`a3822f5`). Pintados en canvas por capa [DOC] con casilla
      de apagado y la atribución municipal colgada de la capa (`c8da500`).
      README releído (`387529f`). La cifra caducada de vías salió de
      CLAUDE.md — el número lo medirá el motor (`ca1aaba`)
- [x] **El grafo dentro y VISTO por Antonio** (17/08): 98.774 aristas /
      68.649 nodos / 378.222 vértices, exactos. Copiado byte a byte desde
      `tools/grafo-visor.js` de la OLD (no estaba en data/): un `.js` de una
      línea que se pide con fetch como texto y NUNCA se ejecuta (`f4f049c`).
      Trae tres partes, declaradas en la ficha (`b84545d`): el grafo (se
      pinta), la AUDITORÍA del enganche portal→arista (distancia y
      veredictos — el enganche en sí, id de arista y proyección, viajaba
      en un `enlaces.json` que NO está versionado en ninguna parte: el
      punto 7 construye la proyección por su cuenta, corregido 20/08),
      la auditoría del viejo (viaja porque el fichero es
      indivisible sin editar). Pintado como UNA multi-polilínea en canvas
      [DOC tipos de Leaflet] (`7b8fdd6`): 116 ms, arrastre fluido, la red
      calcando la tesela. README releído (`f7c6bcf`)
- [x] **Entrada nº3 de la bitácora, capturada y cerrada por el camino**
      (`a9f05b5` → `2f0db56`): el sha256 del árbol de trabajo NO era el que
      recibía quien clona — git metía un CRLF al checkout. Arreglo:
      `.gitattributes` con `app/data/** -text` + renormalize, verificado
      SOBRE UN CLON (`6a9cffa`). Ley: la integridad se acredita en el clon,
      no en el disco propio — y un aviso repetido asumido como ruido es un
      fallo esperando el fichero adecuado
- [x] **Los carriles bici dentro y VISTOS por Antonio** (17/08): 733 rasgos
      / 2.120 tramos / 333,5 km del MU2 de movilidad (WFS IDEZar, capa viva),
      elegido con el catálogo oficial delante [DOC] frente a la instantánea
      congelada `carril_bizi_20250127`, que se queda en la OLD. Integridad
      sobre CLON (ley nº3), ficha con Ley 37/2007, los 7 «En Construcción» y
      el «No Municipal» declarados, y la clasificación calzada/acera/senda/
      calmado que usará el punto 9 (`bed5dc9`, `17a7a9b`, `ee2a809`,
      `2f7bdc8`). Pintados en magenta legible sobre el grafo, 15 ms.
      ⚠️ La cifra «49.972 aristas que ruedan» QUEDA RETIRADA: era una
      derivada del procesamiento del proyecto viejo, no un dato — la
      reproducirá el motor si cruza carriles contra grafo, no una copia.
      Y la atribución municipal ahora cuelga de TODAS las capas municipales,
      no solo de la primera — el hueco se cortó antes de existir
- [x] **Los postes de bus dentro y VISTOS por Antonio** (17/08): 944 postes
      del MU3 municipal (WFS IDEZar, Ley 37/2007), integridad sobre clon
      (`773a135`), ficha con LOS DOS CENSOS declarados —944 el inventario
      municipal, ~934 lo que el operador anunciaba (GTFS+barrido de
      ZetaBus)— y el `NO CONSTA` de `exploracion/` honesto (`7ed0f44`).
      Pintados con forma propia (radio 4 + aro blanco) y en rojo tras
      corrección de color a ojo de Antonio: el cian inicial se confundía
      con el azul de los portales (`e153b00`, `3af28c4`). README con la
      dependencia en la portada: «no se sabe aún qué líneas pasan por cada
      poste» (`78fffae`).
      ⚠️ **SIN LÍNEAS, y no es recorte: no existen como fichero.** La
      cifra heredada «44 rutas / 74 sentidos» era del feed GTFS de ZetaBus
      — QUEDA RETIRADA como criterio de esta pieza (van dos derivadas).
      Las líneas por poste llegarán con el GTFS (pieza pendiente de este
      punto 4) o el barrido del punto 10; el puente es el `stop_code` PA…
- [x] **El GTFS dentro y VISTO por Antonio** (17/08): el ZIP del NAP
      (ficha 1176, 6,9 MB) tal cual, con el hash cuadrando por TRES puntas
      (cabeceras de la descarga · origen · clon) (`e5091e8`). Licencia
      MITRAMS resuelta con el precedente de ZetaBus: redistribución
      permitida, atribución «Powered by MITRAMS» colgada de las capas
      (`e2493db`). shapes.txt y stops.txt extraídos y verificados POR
      MIEMBRO — extraer no es editar (`bef1dae`, `f8ea5d1`). Los 87
      trazados de bus en violeta (`ec5beaa`), README releído (`95a9b7c`).
      Re-verificado el reconocimiento heredado: 984 stops · 53 rutas ·
      34.427 trips · 89/27.603 shapes sin huérfanos ✓ — y la caducidad
      quedó en UNA vía, no dos: el feed se contradice (servicio real hasta
      el 27/12; vale el 05/10 del publicador, la conservadora — y el
      27/12 quedó VERIFICADO contra el dato el 22/08: los calendarios
      del 28-31/12 son huérfanos sin viajes).
      ⭐ Misterio resuelto: 45 rutas CON viajes = 44 bus + tranvía — ahí
      estaban las «44 líneas» de ZetaBus. Las 8 sin ningún viaje (CEM, CE,
      LAN, EM1, EM2, V1, ES3, V4 — cementerio, estadio, sustitución del
      tranvía) están declaradas y apagadas: sin viajes no hay trazado, no
      se pintan solas
- [x] **El tranvía completo y VISTO por Antonio** (17/08), cubierto por el
      GTFS — las capas municipales de tranvía existen en el catálogo pero
      nadie las descargó nunca (ni la OLD): quedan como opción futura si
      hicieran falta. Recorrido en negro grueso distinguido de los buses a
      petición de Antonio (`d3262b1`: 2 de 89 por shape_id `210_*`,
      acromático fuera del círculo de tono) y las 50 paradas con casilla
      propia siguiendo la lógica del bus —trazados y paradas separados—
      decidida por Antonio (`c344bbe`, `cc79570`). Los stop_code son 25
      pares `NN01`/`NN02` con tres saltos (`1311/1312`, `2322`, `2422`):
      mina anotada para quien derive sentidos del sufijo en el punto 10
- [x] **Las estaciones BiZi dentro y VISTAS por Antonio** (17/08): 276
      exactas — la primera cifra heredada que cae clavada. La capa
      municipal MU1 en sus SEIS páginas tal cual (unirlas habría sido
      fabricar un fichero que nadie publicó; la app las une al leer), hash
      por página sobre clon (`51d47dd`). La API viva de zaragoza.es
      descartada por regla —el dato vivo es del punto 10— y fichada con su
      contradicción interna documentada (`821cb32`). Pintadas en el color
      corporativo #54A097 decidido por Antonio; si algún día choca, se
      ajusta la forma, no el tono: es marca (`da29696`). README releído,
      y de paso el ejecutor cazó su propio error propagado: la cuenta de
      datos de la portada iba una atrás desde el GTFS (`956e6a3`,
      `df8ac0d`). 5.520 anclajes totales, dato para el punto 9
- [x] **Los aparcabicis dentro y VISTOS por Antonio** (17/08): 2.158
      soportes, 14.544 anclajes — **la primera descarga propia del
      proyecto** (`movilidad:MU2_aparcabicis`, WFS IDEZar, la capa que la
      OLD nunca miró), con procedencia generada por nosotros: URL exacto y
      cabeceras guardadas (`ba2b203`, `eae90b1`). Pintados en amarillo con
      aro OSCURO y radio menor — el círculo de tono estaba lleno y se
      resolvió por dos dimensiones (`982dee8`). README reescrito agrupando
      por procedencia, cuenta verificable leyendo (`476a2bb`)
- [x] **Y la norma nueva de la casa** (`12e0221`), decidida con GitHub y
      OWASP delante: las cabeceras de descargas propias se guardan SIN
      Set-Cookie — el token se filtró ANTES del primer push, declarando la
      omisión para que se vea que se filtró y no que faltaba. Cero tokens
      en el repo, dist/ incluido
- [x] Cada capa que entró se PINTÓ y se vio — las nueve, con el mapa
      fluido y ~34 MB de dato encima. **PUNTO 4 CERRADO** (17/08): siete
      conjuntos de datos, 14 ficheros en `app/data/`, cada uno con ficha,
      huella sobre clon y atribución colgada de su capa

## 5 — El motor mínimo

- [x] **Estructura del motor DECIDIDA con la doc delante y APROBADA por
      Antonio** (17/08, informe sin tocar un fichero): workspaces npm con
      raíz única (`tipos/` + `motor/` + `app/`), tipos como paquete
      `@desplazame/tipos` sin build consumido con `import type` — el
      contrato es UN fichero enlazado por symlink, no una copia, y por eso
      el front no compila si cambia [DOC npm + descarte de project refs y
      `paths` con la doc de TS]. Proxy `proxy.conf.json` con `/api/**`
      (doble asterisco OBLIGATORIO en el builder Vite — caso real del
      rastreador de Angular, cambio no documentado que falla en silencio),
      motor en el 3000. `motor/` fuera de la raíz web en cualquier
      despliegue. Conflicto del symlink de CLAUDE.md detectado y aplazado
      al punto 14 con su decisión preliminar: `public_html` apuntará a lo
      CONSTRUIDO, nunca a `app/` literal
- [x] **La prueba del symlink PASÓ** (17/08): `ng build` atraviesa el
      symlink del workspace sin `preserveSymlinks`, y el rojo que compra
      todo — `TS2305` con un tipo inexistente: el módulo resuelve de
      verdad, no cae a `any` en silencio. Tres rojos vistos, fichero de
      juguete retirado
- [x] **El contrato vivo**: `@desplazame/tipos` con `Modo`, `Vertice`,
      `Paso`, `Aviso`, `Trayecto`, `Salud` — derivados de la pantalla y de
      CLAUDE.md, con los NO CONSTA escritos (¿detalle formateado o
      metros/segundos? ¿gravedad del aviso? ¿totales?) y la regla en
      cabecera: el contrato crece cuando el motor lo pide (`ea66676`,
      commits de tipos). El lockfile mudado a la raíz: 0 versiones
      declaradas movidas, 502 paquetes, notices recalculado (`5e59abf`).
      `@types/node` 26.2.0 dentro, la pre-autorizada
- [x] **El esqueleto del motor arrancando y VISTO por Antonio** (17/08):
      `node:http` en el 3000, `/api/salud` tipado contra el contrato
      (`27d2d73`), proxy `/api/**` comprobado — mismo pid por las dos
      puertas, 4200 y 3000 (`720917f`) — y la pantalla del punto 4
      intacta. ⭐ El motor corre TypeScript SIN COMPILAR (Node 24 borra
      tipos al ejecutar): cero build, cero empaquetador — y una atadura
      nueva al Node del panel de Hostinger. La guardia aprendió el motor
      con perfil propio y sus tres rojos vistos, contrato incluido
      (`e64e57c`)
- [x] **El grafo en memoria, medido y vigilado** (17/08): cargado UNA vez
      antes de `listen()` — el puerto no abre hasta que el grafo está, a
      propósito, para que la guardia no pueda dar verde a un motor a medio
      cargar (`efb4dd9`). Cifras REALES: ~190 ms de arranque (~500 en
      frío), parse ~150 ms — el «6,5 s» heredado era CONSTRUIR, no cargar,
      y no se compara. Recuentos exactos contra el punto 4 (98.774 /
      68.649 / 378.222). ⚠️ **196 MB de RSS** — dato para el punto 14: la
      memoria del plan de Hostinger es NO CONSTA y esto sube su urgencia.
      La salud declara el grafo que lleva (`cb6eda4`, el front sigue
      compilando) y la guardia lo EXIGE con dos rojos vistos: el motor
      sin grafo (el «verde del esqueleto», rechazado) y el impostor con
      OTRO grafo, cazado por recuentos (`d2516ac`). Y un hueco
      autodetectado: las fuentes vigiladas se leen ahora del directorio,
      no de una lista escrita a mano — la entrada nº2, aprendida
- [x] **Decidido qué portales mandan (17/08), y no era «cuál» sino el
      reparto** — cada censo con su trabajo:
      · resolver y autocompletar → CALLEJERO (nombres) + MUNICIPAL
        (portales): el municipal no trae ni un nombre de calle, el
        autocompletar era imposible sin la tabla código↔nombre
      · saltar al grafo (punto 7) → ENGANCHADO (portal → arista +
        distancia): regenerarlo sería rehacer trabajo de motor ya hecho
      · los 124 sin enganche → resuelven normal; en el punto 7 devuelven
        `Aviso` honesto en vez de fallar en silencio
      Verificación informativa para el 7: el casado por `portalId` entre
      los dos censos — si no casan por id, el salto será por coordenada
- [x] **El callejero dentro** (17/08): fichero limpio hermano de los
      portales (mismo lote de mayo, sha256 triple: procedencia, origen y
      clon), 3.359 vías (`0733021`). El cruce, IMPECABLE: cero portales
      huérfanos, y el `numPortales` declarado cuadra en las 3.359 sin una
      excepción (`5c4a0d4`). La suciedad declarada: la ABOGACíA (sin
      portales, no se sugiere) y 256 vías con marcadores `---CST`/`---PÑF`
      que viajan tal cual — 231 de ellas sugeribles. Y el descarte con
      dato: el otro candidato era geometría de calles, no la tabla
- [x] **`GET /api/vias` sugiriendo, VISTO por Antonio en Chrome por el
      proxy** (17/08): ⭐ **LA CIFRA REAL POR FIN — N = 3.359 vías, M =
      2.731 sugeribles (la que se publica), 628 sin portal que no se
      ofrecen** (`9fa9bd1`). Y la 2.661 de la memoria vieja: MUERTA — no
      cuadra con nada medible, y ya no existe en ningún fichero del repo
      (grep vacío). Normalización NFD escrita a mano por los dos lados
      (coincide al 100% con el `nombrePublicoNorm` del origen), subcadena
      con prefijos primero, tope 10, vacíos bien formados — Antonio vio
      el `q=colon` sin tilde casando las COLÓN y la COLONIA, y el
      `---CST` saliendo tal cual. La guardia exige el callejero con dos
      rojos nuevos vistos (tocado-tras-arrancar con curl dando 200 en ese
      instante · arrancado-sin-callejero) y vigila los TRES ficheros de
      datos (`8eccc9d`). Contrato crecido sin romper el front
      (`323c7c4`), README diciendo la verdad nueva (`b7a3347`).
      Motor: 223 MB de RSS (+27) — el punto 14 acumula
- [x] **El autocompletar en el formulario, VISTO por Antonio paso a paso**
      (17-18/08): `httpResource` de Angular 22 [DOC, no experimental] +
      espera de 200 ms propia, componente `AutocompletarVia`. Las
      sugerencias se muestran «LIMPIO [NÚCLEO]» — corchetes decididos por
      Antonio porque los paréntesis ya son del dato (15 vías los traen;
      HERRERÍN es trampa pura). El núcleo sale de `barrioRuralLabel`; el
      motor corta el sufijo en UN sitio. Cinco correcciones EN EL FICHERO
      («están mal y punto», decisión de Antonio): 2 CRT→CST y 3 MRL
      completadas, huella nueva sobre clon, ficha con su tabla
      (`2aa8b76`, `9ef52ce`). El duplicado `Modo`/`Vertice` MUERTO: la
      pantalla importa del contrato (`a90061a`). Motor apagado → aviso
      ámbar digno. 24 pruebas (18+6) con contraprueba
- [x] **Entrada nº4 de la bitácora, capturada y CERRADA** (`98c1633` →
      `a26d859`): escribir sin elegir desbloqueaba «Generar» — cazado por
      el ojo de Antonio en la primera sesión de uso real, con 18 verdes y
      dos pruebas EXIGIENDO el fallo (rellenaban por atajo). Arreglo:
      opción B por usabilidad [DOC WAI-ARIA/NNG] — borrador conservado y
      marcado, generar bloqueado hasta elegir, editar tras elegir
      invalida (`5624507`, `776598a`). Ley: la validación mira el CÓDIGO,
      nunca el texto; y un instrumento que entra por el mismo camino que
      el código valida solo puede darle la razón — la prueba entra por
      donde entra la persona
- [x] **El portal se ELIGE, no se escribe — VISTO por Antonio paso a paso**
      (18/08, los seis pasos): el motor carga los 46.150 enteros (99 ms,
      RSS 223→248; y el callejero baja a 7 ms — el fichero se lee UNA
      vez) y `GET /api/portales?via=` los sirve en orden natural:
      `sortNumber` municipal + desempate con `Intl.Collator` numérico
      [DOC], demostrado BARAJANDO porque el censo ya venía ordenado y una
      demo sin barajar habría dado verde con el comparador roto
      (`3be31f5`). Combobox con filtrado [DOC ARIA] que se abre al entrar
      sin escribir (mediana: 9 portales), tope 50 = percentil 95, «y N
      más — escribe para acotar» (`60ef29e`). Deshabilitado sin vía ·
      reset al cambiarla · fija por CÓDIGO · «Generar» exige los cuatro
      códigos. `numero` es string (9.572 no son números puros: 9-11, 1DP,
      71 TV C2; 117 sin número caen al final por convención municipal).
      35 pruebas con contraprueba; `FormsModule` fuera y el bundle baja
      393→353 kB (`cfab981`, `a4cdae4`, `2f0d76a`). La decisión fina
      heredada murió: de una lista real no se elige lo que no existe
- [x] **Entrada nº5 de la bitácora, capturada y CERRADA** (`7360469` →
      `eff8c80`): el README juró «ningún dato integrado» durante 2 días y
      13 commits con ocho dentro — y el verde lo daba LA PROPIA REGLA de
      releída, cumplida trece veces sobre el párrafo de «Estado» mientras
      «Licencia y créditos» envejecía. Cronología al minuto con git: la
      frase era falsa desde el commit que escribió la primera atribución
      (`a35ffc9`). Arreglo con rectificación visible (`c0f449c`). Ley: una
      regla de releída vale lo que su ALCANCE; al releer, la unidad es el
      documento, y la pregunta es «¿qué afirma este fichero que hoy sea
      mentira?». Las CINCO entradas de la bitácora están cerradas
- [x] **El destino de los andamios, DECIDIDO** (18/08): se quedan como
      están — el mapa de verificación los necesita y es la herramienta de
      esta fase. Cero código hoy; la retirada ENTERA tiene su casilla
      nueva en el punto 7, para que no se olvide
- [x] **EL VISOR, hecho y VISTO por Antonio en cinco pasos** (18/08):
      `/visor` con el mapa a ventana casi completa y las nueve capas —
      rinde fluido con portales y grafo encendidos, y el F5 sobre /visor
      recarga bien en `ng serve` (`693551e`). El router configurado
      mínimo [DOC]: `provideRouter`, tres rutas (raíz = Buscador ·
      /visor · `**` → raíz), `router-outlet` en la cáscara (`d5623a7`).
      SIN duplicar pintado: las nueve capas se mudan a un SERVICIO
      singleton (`providedIn:'root'` [DOC]) y el mapa lo lee — una capa
      nueva se toca en 2 ficheros, no en 4 (`ef6ccc5`); el alto del
      lienzo es parámetro (22rem / 100%). Los 34 MB NO se re-descargan
      al navegar: MEDIDO con contador de fetch — 13 peticiones en
      buscador, 13 tras ir y volver (contraprueba: 26 falla). 47 pruebas
      (35+12), dos tandas nacidas en rojo de verdad. README: dos páginas
      declaradas, «se irá con el andamio» (`f97b341`)
- [x] **El router SE QUEDA** — el visor le dio el uso; la revisión que
      decía «si no se usa, fuera» queda respondida por la puerta buena
- [x] **Los aparcamotos dentro y VISTOS por Antonio en el visor** (18/08):
      descarga propia nº2 (`MU2_motos` GeoJSON, `srsName` funcionó — la
      trampa del wgs84 es de la API), recuento previo clavado (2.146 /
      11.715), cabeceras sin Set-Cookie, huella `8a0b4727…` sobre clon,
      recuentos con comando (`3590056`). Ficha §1.10 con TODO: la
      discrepancia entera (32 solo-WFS de la tanda 2024 — 30/33 de los
      `Poligono` lo confirman, medido · 1 solo-API · 7 posiciones ·
      plazas exactas), el tercer número de la serie (8.644), la fecha
      imposible `0203` tal cual, los 6 sin nombre = los 2 códigos
      huérfanos, y la primera descarga que llegó GZIP (64.811 comprimidos
      vs 625.297 reales — dicho para que nadie crea que falta dato)
      (`8a5e11c`, `6a1d713`). Capa en las dos páginas vía el servicio (2
      ficheros justos), marcador final por decisión de Antonio: DISCO
      verde oliva relleno, aro blanco, radio 4 — el hueco-cian se
      descartó: son capas de verificación con caducidad, basta
      distinguirlas (`6ade170`, `eea1111`). Antonio validó el par
      motos/bicis a simple vista y que los puntos caen donde hay
      aparcamotos de verdad. README a ocho datos / diez capas / nueve
      conjuntos (`3b8994f`). 48 pruebas
- [x] **El regulado dentro y VISTO por Antonio** (18/08): descarga propia
      nº3 (7.391 tramos / 55.572 plazas, hits previo clavado, gzip
      declarado 367 KB→3,2 MB, huella `f45f394b…` sobre clon,
      `5788a21`). Pintado SOLO el pago: ESRO azul medio `#0284c7` + ESRE
      naranja `#f97316` (colores de Antonio; el naranja se separa de la
      ruta por tono+trazo+grosor), LIBRE sin pintar, casilla ÚNICA
      «Regulado ESRO+ESRE (1.159)» por decisión de Antonio (`cbb547f`).
      Antonio verificó: pago solo en la almendra, nada en barrios. Ficha
      §1.11 con la trampa MEDIDA (el 5.104 eran 5.049 — 55 nulos
      contados de más, corrección honesta del ejecutor), `distrito` peor
      de lo investigado (31 valores para 10 distritos, con erratas
      CASCO HISTÓRICI/INIVERSIDAD), y la cifra de SU fuente (`913eb15`,
      `781bd0c`). Prueba nueva que vigila el filtro: un LIBRE colándose
      como pago es el error caro. 52 pruebas
- [x] **El cruce zonas↔tramos, medido a petición de Antonio** (18/08):
      los 13 polígonos publicados son EXACTAMENTE las 13 zonas que
      cobran (99,83% del pago resuelve); 19 zonas numeradas sin polígono
      son 100% LIBRE — 2.860 tramos / 21.268 plazas (cifras con comando;
      la consulta había sumado mal a mano: 2.859/21.130/20). Solo 2
      tramos de pago raros, con perfil de dato roto (zona 65 en San
      Vicente Mártir · un ESRE vacío con portal "NUL"). Ficha §1.11
      reescrita con el cruce
- [x] **La vista de cotejo de la posible ampliación** (pedida por
      Antonio, 18/08): capa 12 «¿Ampliación? zonas sin activar (2.860)»
      — morado `#a21caf` discontinuo (una hipótesis se dibuja con línea
      de puntos), misma data del regulado (cero descargas), comentario
      de retirada-o-consolidación (`c02bdf6`). ANTONIO COTEJÓ CON SUS
      PLANOS: son las nuevas zonas de pago previstas — y sus planos
      traen MÁS zonas que el dato no enseña (pendiente de detallar).
      Contexto de contrato (Heraldo 14/07/2026): activación de golpe en
      verano 2027, ~15.000 nuevas hasta 21.745 totales (recurso Tacpa
      pendiente) — el 21.268 del censo vs 15.000 del contrato: ~6.300
      plazas zonificadas que esta fase no activaría. DECISIÓN de
      Antonio: la capa queda INTERNA de momento (pública en el repo como
      prueba, sin uso de producto ni noticia en la ficha)
- [x] **Todas las capas DESMARCADAS por defecto en las dos páginas**
      (decisión de Antonio, 18/08): se encienden a mano; medido que
      apagar no ahorra descarga (vive en `cargar()` de la página), solo
      dibujo — hacer la descarga perezosa queda dicho como opción para
      antes del 7, no hecho (`90c9124`). 55 pruebas
- [x] **Las 13 zonas dentro y VISTAS por Antonio** (18/08): descarga
      propia nº4 (la más pequeña: 27 KB, gzip), hits clavado, huella
      `db6fba88…` sobre clon (`cf19bd5`). Cinco campos (la consulta solo
      vio dos por el propertyName — `fid` era nuevo) y DOS defectos
      encontrados midiendo: la Zona 11 rota en tres sitios (nombre "11",
      TAMAÑO y PERIMETRO a cero — pero geometría VÁLIDA: hexágono de
      ~235.000 m² calculado, y no es zona menor: 492 tramos) y
      TAMAÑO/PERIMETRO mal en 3 de 13 (la 6 corta un 15%, la 13 menos de
      la mitad — el cálculo propio acierta <0,15% en las otras diez, por
      eso se sabe). El fid no ordena: se ordena por NUMERO_ZONA al
      cargar, con prueba. Manchas pizarra acromática al 8% con rótulo
      numérico, EN PANEL PROPIO zIndex 350 [DOC] — garantiza el bordillo
      SOBRE la mancha pulse quien pulse en el orden que sea (`1ce9489`).
      Ficha §1.12 con el cruce fino (99,83%) y §1.11/§1.13 des-caducadas
      (`230d793`). Antonio verificó: las trece clavadas, la 11 en sitio
      sensato, y NADA de pago fuera de su perímetro. 58 pruebas
      (`9c9265a`)
- [x] **Las reservas PMR dentro y VISTAS por Antonio** (18/08): descarga
      propia nº5 (2.636 reservas / 746 KB, hits clavado, huella
      `8aaf80c1…`, CUARENTENA antes de entrar: el barrido de dato
      personal se hizo fuera del repo y salió limpio — los 10
      «tratamientos» eran calles tipo DON JUAN DE ARAGÓN) (`4581200`).
      El WFS desglosa 16 tipos (la API solo dejaba ver 2) — y LA TRAMPA
      DE LA PIEZA, cazada midiendo: 158 plazas RETIRADAS o DENEGADAS
      siguen diciendo «PMR general» en SUBTIPO — filtrar por SUBTIPO es
      mandar a alguien con tarjeta a una plaza que no existe. MANDA
      TIPO === '14_PMR': 1.226 / 1.447 — y por primera vez en la tanda
      las dos puertas municipales coinciden AL DÍGITO con la API. Los 5
      `10_E.S.PMR` mixtos quedan sin pintar (decisión declarada:
      preserva la coincidencia; en el dato viajan). Discos rosa #ec4899
      por DFA (decisión de Antonio; se separa del carril por tono y
      forma — validado a ojo). Prueba del filtro CON la trampa dentro
      (3 de 4 dicen «PMR general», solo 1 en vigor). Ficha §1.13 con
      todo; HORARIO con 7 grafías de PERMANENTE declaradas. 60 pruebas
      (`14d88f4`, `26b72a8`, `7ee75be`). ⚠️ Dato para la mesa:
      app/data/ pesa ya 42 MB y el navegador se lo baja entero con las
      capas apagadas — el andamio decidido, pero la cifra creció
- [x] **La etiqueta del modo, VISTA: «Bici / Patinete»** (18/08) — y de
      rebote «Bus / Tranvía», por coherencia de la misma decisión:
      mayúscula tras la barra por peso visual (decisión de Antonio,
      consciente de la norma; comentada en el código para que no parezca
      despiste). Se descartó «VMP»: el botón habla el idioma de quien lo
      pulsa. Fuente única `modos[]` — botón y línea de resultado cambian
      juntos; `Modo = 'bici'` intacto en contrato y motor (grep limpio).
      En el README va en minúscula: allí es prosa (`e7ff5c4`, `79ef5b1`
      y el commit de bus-tranvía). 60 pruebas
- [x] **El README completo, con la doc de GitHub delante** (18/08):
      «Cómo arrancarlo en local» PROBADO en clon limpio (install de raíz
      23 s, build 2,7 s, el motor del clon cargando los mismos números —
      solo murió por EADDRINUSE contra el motor vivo, que es la prueba
      de que funciona), con la advertencia honesta del `engines` sin
      declarar («probado con 24.19.0», no «hace falta 24» — no se midió
      el mínimo). Los tres endpoints leídos de `servidor.ts`, los
      documentos del método enlazados (plan, bitácora, investigación,
      notices), la frase de cierre POR FIN veraz, y la releída final
      cazando dos cifras falsas corregidas en encargo mínimo: los
      carriles eran 2.120 tramos (733 son rasgos) y los paréntesis 38
      vías, no 15 (`f3bd4a6`, `d56af44`). La línea de Hostinger se
      queda: su casilla es del 10
- [x] **⭐ PUNTO 5 CERRADO (18/08).** El motor mínimo existe, sugiere y
      sirve; el formulario entero se rellena contra él; el visor enseña
      las catorce capas; la bitácora lleva cinco entradas cerradas con
      ley; y todo lo visto, visto por el ojo de Antonio

## 6 — Mi ubicación e invertir (parlamentado el 19/08, antes de la ruta)

Dos piezas de formulario decididas por Antonio, pasadas por el tamiz de
la documentación (MDN Geolocation API):

- [x] **El estado de los cuatro campos SUBIÓ AL PADRE** (19/08, el
      requisito que la costura destapó): no había puerta — `elegir()` era
      protected, y rellenar el texto desde fuera era la entrada nº4 con
      otro disfraz. Resuelto CON LA DOC de Angular delante: `model()` es
      el patrón documentado para esto («custom form controls… receive a
      value AND update it»), atadura desazucarada legítima para
      distinguir «lo cambió el usuario» de «lo escribí yo» (la asimetría
      verificada con sonda: el padre escribe sin emitir), y la regla
      «cambiar de calle tira el portal» subida al padre — solo en el
      camino del usuario, nunca en invertir ni en mi-ubicación
      (`c198617`). De rebote CIERRA el hueco latente del model externo
      que el estado arrastraba desde el autocompletar
- [x] **⇅ INVERTIR, visto** (19/08): los cuatro códigos y textos cruzan,
      cada lado con su estado tal cual — Antonio vio cruzar hasta el
      borrador ámbar (`71a7f9d`)
- [x] **«MI UBICACIÓN», visto — con la demostración en vivo del umbral**
      (19/08): `GET /api/portal-cercano` (haversine sobre 46.150,
      **1,35 ms de mediana medidos** — no se optimiza nada), el contrato
      con `PortalCercano` (Via y Portal enteros para entrar por el mismo
      camino), umbrales MEDIDOS: precisión ≤100 m [DOC MDN: accuracy al
      95%; wifi 20-100 m vs IP kilómetros] y distancia ≤150 m (la
      distribución del censo: p95 32 m, el peor urbano real 100 m —
      Expo; y el hallazgo: NO existe corte que separe Zaragoza de fuera,
      el Polígono PLAZA queda más lejos que Utebo). El mensaje
      «no estás en Zaragoza» se DESCARTÓ por infalsable — se lo diríamos
      a alguien en Movera; en su lugar, la verdad: «el portal más
      cercano está a N metros». CINCO mensajes aprobados + tres ramas
      propias (sin HTTPS, motor caído, motor null — un botón mudo es
      peor que no tener botón). Opciones declaradas [DOC]: maximumAge 0
      escrito aunque sea el defecto, timeout 10000 porque Infinity no es
      un botón, enableHighAccuracy true. ⭐ LA PRUEBA DE FUEGO: el
      sobremesa de Antonio dio accuracy 5000 m (posicionamiento IP) y el
      botón se negó con el mensaje exacto y el número real dentro — el
      umbral rechazando en vivo lo que debía; el camino del éxito
      espera un móvil con GPS (`ca414fd`, `dc03ad8`, `0ccf0a9`)
- [x] **73 pruebas** (60+13, diez nacidas en rojo y tres a posteriori
      compensadas con contraprueba — dicho, no escondido), incluida la
      del repintado sin empujón (esta app no lleva zone.js: el DOM se
      repinta solo tras el GPS tardío, verificado — `b92bf5d`). La
      contraprueba conjunta no valía (un rojo arrastra a los de detrás
      por el drenaje): se repitió una a una. README al día (`cfb1724`) y
      dos comentarios del código des-caducados (la cifra 38/32 y el
      punto 7 — `fe91aca`)
- [x] **⭐ PUNTO 6 CERRADO (19/08).**

## 7 — Primera ruta: ANDANDO (aquí ya existe la demo)

*Hitos ampliados el 19/08 con la doctrina de Valhalla/OSRM delante, y
COMPLETADOS el 20/08 tras la consulta al grafo y la investigación
documental de los tres frentes que destapó. OBJETIVO DE FORMATO decidido
por Antonio (20/08): los pasos escritos siguen el formato de Google Maps
— «Dirígete hacia X · Gira a la derecha hacia Av. Y · 450 m · flechas ·
El destino está a la izquierda». Se ejecuta en TRES encargos: A el dato
de nombres · B el motor · C la pantalla.*

**Lo que la consulta al grafo dejó medido (19/08):** cero nombres de
vía en las 98.774 aristas (ni código cruzable) · el campo `p` clasifica
el tipo (eje-de-calzada 47,2% · peatonal · acera · paso-de-peatones ·
escaleras) · `m` metros precalculados y verificados · `w` id de way OSM
(47.758 distintos) · nodos reconstruibles por coincidencia de
coordenada (68.639/68.649; 10 NO CONSTA) · subgrafo útil a=1 ∧ c=0 =
93.503 aristas · el `enlaces.json` del enganche SE PERDIÓ (el grafo
lleva la auditoría, no el enganche: ni arista ni proyección) — la
proyección se construye aquí.

**Lo que la doctrina resolvió (20/08):** lo innombrado habla POR TIPO
(Valhalla: «onto the walkway/crosswalk»; nuestro `p` es ese dato — el
60% sin nombre dice «cruza el paso de peatones», «sube las escaleras») ·
los arranques con cardinal («Walk southwest» → «Dirígete hacia el
sur») · nombrar la acera por su calle paralela es issue ABIERTO en el
propio Valhalla (#5587): no se intenta · los extremos hablan con el
nombre MUNICIPAL (lo que el usuario eligió) y el interior con el de la
red (OSM), cada fuente en su tramo — el 19,4% discordante solo afecta
al interior y va declarado · los umbrales de giro son los de
`valhalla/baldr/turn.cc`, LEÍDOS de la fuente: 0-10 recto · 11-44
ligera dcha · 45-135 dcha · 136-159 cerrada dcha · 160-200 media
vuelta · 201-224 cerrada izq · 225-315 izq · 316-349 ligera izq ·
350-359 recto · el snapping al patrón Loki: candidatas en radio,
coordenada proyectada devuelta, `node_snap_tolerance` 5 m (proyección
pegada a un cruce → al nodo), y las islas fuera al estilo
`minimum_reachability` (candidato en isla → se descarta y se sigue
buscando; preferir c=0, solo a=1) · rotondas: SIN etiqueta en el grafo
— quedan fuera, mejora futura declarada.

**ENCARGO A — el dato de nombres — HECHO (20/08):**
- [x] El fichero de nombres OSM, PROMOVIDO tal cual de la rama archivada
      (copia por `git cat-file`, doble huella `ddd22f7d…` idéntica en
      rama y destino, 5.023.094 bytes, 19.897 ways) a `motor/data/` —
      decisión declarada: los pasos los redacta el motor, y `app/data/`
      publica al navegador todo lo que pisa (`5e4a791`). ⭐ La
      contraprueba que evitó la bitácora nº3 ANTES de ocurrir: la regla
      `-text` del `.gitattributes` solo cubría `app/data/**` — sin
      ampliarla, el clon habría reescrito los saltos (5.276.472 bytes,
      otra huella, medido en clon desechable); la regla ampliada viaja
      en el mismo commit. Los NUEVE recuentos de cobertura remedidos y
      casando (16.994/47.758 ways · 40.316/98.774 aristas 40,8% · 2.404
      km · 37.397/93.503 en el subgrafo útil). Ficha §1.14 (`558030d`):
      el desfase medido fino (17 h 44 min, no «un día»; su riesgo
      residual se manifiesta como arista-sin-nombre, caso que el 60% ya
      obliga a tratar), el techo de OSM desglosado por highway, el 19,4%
      discordante con la REGLA DE REPARTO escrita como norma (interior
      OSM · extremos municipal), y el barrido de dato personal (15 ways
      con tags de contacto, todos institucionales/comerciales, ninguna
      persona). README a trece conjuntos / catorce fichas con el dato
      declarado como lo que es: en el árbol, sin usar, primera pieza de
      las rutas (`b5c25d9`)

**ENCARGO B — el motor — HECHO (20/08), con remate de fusión:**
- [x] **El índice del grafo**: adyacencia por coordenada sobre el
      subgrafo útil (93.503 aristas · 65.697 nodos — los 10 de desajuste
      viven en c=0, fijados por prueba), rejilla espacial 51 ms, cruce
      w→nombre cargado. Arranque +344 ms, heap +11,1 MB (la primera
      medida de 89 MB era mentira del ámbito de medición — corregida)
- [x] **La proyección, construida y CONTRASTADA**: p50 5,5 m contra los
      5,3 m de la auditoría vieja — dos cálculos independientes
      coincidiendo en medio metro. node_snap 5 m [DOC] disparando en el
      8,6%. ⭐ La costura de los >50 m investigada ANTES de seguir: los
      581 sin proyección (vs 124 viejos) NO son bug — 460 son
      URBANIZACIÓN PEÑA ZORONGO, un barrio entero en la componente 39
      (isla): sus calles existen a 9 m pero engancharlas daría rutas
      mentirosas. El radio NO se sube; el Aviso con nombre es el
      resultado honesto [minimum_reachability, DOC Loki]
- [x] **⭐ El rojo del naïf, MEDIDO antes del trato**: el trivial naïf
      anda un 51% de más (peor caso: 10 m reales → 689 m, dos puertas de
      la misma calle a vuelta de manzana — ese par fija la prueba); las
      4 combinaciones ganan en el 64,2% de pares. Dijkstra: p50 0,6 ms
      uso real, 26 ms el peor aleatorio de 33 km — nada que optimizar
- [x] `POST /api/ruta` VIVO: geometría de puerta a puerta con
      conectores, pasos formato Google, metros, duración derivada,
      Avisos. Cinco endpoints en el motor
- [x] **La fusión de micro-pasos** (remate con doctrina: el colapso de
      OSRM en cruces segregados «donde los humanos perciben una
      maniobra» + el ángulo COMBINADO de la doctrina clásica): umbral
      25 m salido del VALLE del histograma (6.443 pasos medidos — el
      53% de los intermedios eran ruido de cruce), cinco reglas
      declaradas, y las dos salvaguardas demostradas en rutas reales:
      el giro que se volvió MÁS giro al fundir («bruscamente» — el
      combinado dijo la verdad que los trozos escondían) y la chicane
      que CONSERVÓ su «ligeramente». La céntrica: 11 → 4 pasos, ya se
      lee como la captura (`8be4b4d`). Los «hacia la calzada» del
      polígono SE QUEDAN [DOC: es la práctica de Valhalla — por tipo;
      Google enseña «Unnamed Road»; coser el callejero municipal no lo
      hace ningún motor, issue abierto #5587]
- [x] **Bitácora nº6, con ley nueva**: la prueba que miraba la geometría
      «por sus extremos» dio verde con un tramo INVERTIDO dentro (salto
      de 604,7 m) — escrita con el verde delante, antes de arreglar.
      Ley: una geometría no se comprueba por sus extremos. 117 pruebas
      (44 motor + 73 pantalla)
**ENCARGO C — la pantalla — HECHO (20/08), con seis remates a ojo de
Antonio:**
- [x] La ruta real pintada (fitBounds, conectores, la anterior se
      retira al regenerar) y los pasos con flecha Unicode por giro
      (Record cerrado — un giro nuevo no compila), HttpClient.post
      [DOC: httpResource es reactivo; una acción de botón no], estados
      generando/éxito/ámbar (`d2ff3cf`)
- [x] La respuesta falsa MUERTA sin rastro (grep limpio de
      RUTA_DE_PRUEBA y «DATOS DE PRUEBA»), README enterrado el «no
      busca rutas» (`2013c04`)
- [x] Probada por el ojo de Antonio en Chrome con SUS rutas — y sus
      defectos parieron los remates:
      · colapso de maniobras [fuente OSRM leída: NAME_SEGMENT_CUTOFF
        105 m, haveSameName vacío≠vacío] (`96c164f`)
      · lo mudo por su TIPO real (cycleway→«el carril bici» — bitácora
        nº7: la lista cerrada de textos aceptables no comprueba verdad)
        (`d9021e6`)
      · HERENCIA POR VECINDAD de ejes municipales [Valhalla #5587 +
        Voronoi arXiv + confianza OSRM]: §1.15, cruce 225 ms, 40%→77,1%
        de aristas nombradas, disputa 3% → genérico (`0612938`…)
      · un solo nombre por calle [núcleo OSRM decompose + canónico
        municipal, Karlsruhe] y la regla ancha de los 105 m — plazas
        absorbidas como los motores hoy; plaza-hito y rotondas quedan
        declaradas MEJORA FUTURA (`46fcb22`, `faafe5c`)
      · presentación IGN/RAE/OSM: caso mixto, romanos, sin abreviar,
        artículos propios por señal OSM, partículas completas, y las
        NEGRITAS por partes estructuradas (accion/via — el contrato
        manda papeles, la pantalla pone la etiqueta) — bitácora nº8
        (el romano pegado a un paréntesis; un token sucio en cada
        prueba de tokens) (`63ba4ac`, `ee9ab60`)
      · «para seguir por» cuando el giro no cambia de calle [Valhalla
        stay-on, solo con nombre] (`b9375a7`)
      Bitácora: 8 entradas, 8 cerradas. 153 motor + 84 interfaz
- [x] **HECHA (22/08) — Se retiran los andamios de carga y la pestaña del visor**
      (decidido el 18/08 en el punto 5; PARLAMENTADO el 22/08): el
      navegador deja de bajarse los ~34 MB (grafo 22,8 + portales 10,3 +
      carriles + shapes + stops + BiZi + aparcabicis), sale la entrada
      `datos` de `angular.json`, y la página del visor sale del router —
      las casillas eran verificación de la fase de datos, no producto
      (dicho por Antonio el 17/08). ⭐ **El visor NO muere: SE RESERVA
      para la Intranet (punto 16)** — decisión de Antonio del 22/08: será
      herramienta interna al final del proyecto. Los DATOS se quedan en
      el repo con sus fichas (materia de los puntos 9/10/11); lo que
      sale es su publicación al navegador. RESULTADO (commits `6327e45`
      + `1deaa86`): la raíz en frío pasa de **41,07 MB en 20 peticiones
      a 0,22 MB en 3** — cero bytes de `app/data/` (las 17 URLs, 404) y
      `main.js` adelgaza solo (0,36→0,21 MB al irse 1.173 líneas).
      Borrado: capas.ts+spec (898) · visor (275) · los pinceles de
      mapa.ts (847; 1.001→154 líneas) · la barra de navegación entera
      (una página no navega) y 3 atribuciones que solo alimentaban
      capas — la de OSM SE QUEDA (ODbL, el mapa base sigue siendo
      suyo). Guardianes: 21 retirados con lo suyo · 1 INVERTIDO nacido
      en rojo (la raíz pide CERO a /datos/) · 1 nacido (F5 en /visor
      cae al comodín, 200 · 451 bytes). Los _cabeceras.txt murieron
      solos con la entrada de angular.json (404, sin tocarlos). La
      demo, intacta por el proxy: Arrupe 6.371 m · 13 pasos. 64/64
      interfaz (eran 84) · 160/160 motor

**El acceso y el coste por modo** *(parlamentado el 21/08 con la doctrina
delante: tabla de acceso de Valhalla [wiki OSM] · `foot.lua` y
`bicycle.lua` de OSRM leídos de fuente · `pedestriancost.cc` de Valhalla
leído de fuente)*. Lo que el motor hace hoy es el modo `shortest` de
Valhalla — solo metros; documentado, pero NO el defecto de ningún motor.
Consecuencia vista por Antonio: el peatón pisa el carril bici (prohibido
al peatón en AMBOS motores) y compite con el eje de calzada. REGLA DE
ANTONIO (21/08): andando = acera (y peatonal, pasos, escaleras) — nunca
carril bici; bici = carril bici y/o calzada. La doctrina es de DOS capas:
acceso por tipo (quién entra en la arista) + coste entre lo permitido
(callejón ×2 · garaje ×5 · rotonda ×2 · escaleras +30 s · cruce +0-15 s;
la acera NEUTRA por defecto — el «se favorece» es de la doc deprecated).
Y la calzada peatonal se cierra donde su acera existe dibujada aparte
(`sidewalk=separate` / `foot=use_sidepath` en OSRM; en Valhalla es el
issue #4657, ABIERTO). Tres pasos que no se saltan:

- [x] **1 · Medición de solo lectura — HECHA (21/08)**, git limpio
      antes y después, totales cuadrando. ⭐ Cada arista lleva `h` (la
      etiqueta `highway` de OSM), cargada y en uso para narrar: **la
      tabla de la casilla 2 se escribe sobre `h`, no sobre `p`** (`p`
      mete cycleway, track y residential en el mismo saco). `a` es
      filtro de red, no de acceso: la calzada urbana entera está
      dentro (71,3 % de los km útiles). Sexto valor de `p` aflorado
      (`eje-con-acera-declarada`). ⚠️ Ningún campo de acceso OSM en la
      arista (foot/access/oneway/surface): la doctrina de tipos
      aplica; sus overrides, no. El antes: cycleway = 3,3 % de los km
      y las juez lo pisan al 87,3 % y 64,7 % (la céntrica, cero); el
      77,9 % de los carriles bici con acera propia a ≤25 m (track:
      2,6 % — el campo no tiene acera). Detalle entero en el
      checkpoint de la sesión del 21/08
- [x] **2 · La tabla ANDANDO, RESUELTA POR DOCUMENTACIÓN (21/08)** —
      sin parlamento: se agotó la doctrina hasta que la doctrina
      decidió sola. Fuentes leídas: `graph.lua` de Valhalla (master,
      2.489 líneas) · `foot.lua` de OSRM · `pedestriancost.cc` ·
      `routing.xml` de OSMAnd (perfil peatonal completo) · **art.
      121 RGC (RD 1428/2003), texto literal** · Ordenanza de
      Circulación de Peatones y Ciclistas de Zaragoza (art. 25) y la
      noticia municipal de la nueva Ordenanza de Movilidad. La tabla,
      sobre `h`, con su fuente por fila:
      · footway (acera/peatonal/pasos) · pedestrian · path → **SÍ, es
        LA vía del peatón** [art. 121.1 RGC: la zona peatonal OBLIGA
        donde existe · los 3 motores]
      · steps → SÍ con castigo [3 motores; Valhalla +30 s fijos]
      · corridor → SÍ [graph.lua: pedestrian true, bike false]
      · living_street → SÍ [3 motores; Valhalla uso 0,6]
      · **cycleway → NO** [graph.lua: pedestrian_forward=false ·
        foot.lua: sin velocidad = sin arista · Ordenanza Zaragoza
        art. 25: los carriles bici «únicamente por ciclistas» ·
        y el 121.1 obliga a la acera, que existe en el 77,9% de
        nuestros carriles]. El matiz ACERA-BICI (plataforma a cota
        de acera, prioridad peatonal, 20 km/h en la nueva Ordenanza)
        se resuelve con la clasificación calzada/acera/senda/calmado
        que la capa municipal de carriles YA trae (punto 4 → 9)
      · calzada (residential · tertiary · secondary · primary ·
        unclassified · service · track · *_link) → **SÍ CONDICIONAL**
        [art. 121.1 LITERAL: «salvo cuando ésta no exista o no sea
        practicable» → arcén o, en su defecto, calzada] — la excepción
        que salva el campo (track: 2,6% con acera) la trae la LEY,
        no un criterio nuestro
      · motorway/trunk → no existen en el subgrafo (a=0 los quitó)
      **El mecanismo de «no existe zona peatonal»** tiene dos
      implementaciones documentadas: cierre por tag [OSRM
      sidewalk=separate/use_sidepath — exige dato que NO tenemos] y
      prioridad por tipo [OSMAnd routing.xml, leído: footway ×1,2 ·
      residential ×1,1 · cycleway ×1,0 · grandes ×0,9 · trunk ×0,7,
      coste = distancia/(velocidad×prioridad) — funciona solo con `h`,
      que tenemos]. La elección de mecanismo se hace en la casilla 3
      CON las rutas juez como contraste, no antes.
      ⚠️ CADUCIDADES declaradas: el RGC reformado (RD 518/2026,
      usuarios vulnerables) ENTRA EN VIGOR EL 01-10-2026 — mismo
      principio (122.1: sin zona peatonal practicable → arcén
      izquierdo o calzada), las citas apuntan al texto reformado desde
      octubre · la Ordenanza vigente arrastra artículos anulados por
      el TSJA y hay Nueva Ordenanza de Movilidad en camino — qué
      versión rige hoy al detalle: NO CONSTA, se verifica en el 9
- [x] **3 · Construcción en el motor — HECHA (21/08, tarde)**, en
      seis commits (`2796232`→`52a55ff`). Las DOS capas de la
      doctrina: ACCESO (`andando.ts`, los 27 tipos con su cita fila a
      fila — la red andable queda en 89.047 aristas, `cerradas` en
      `/api/salud`) y COSTE (`metros ÷ prioridad`, la fórmula de
      OSMAnd con el `shortest` conservado como contraste interno). El
      rojo que compraba, comprado: las juez con **0 m de cycleway** —
      Zuriza +88,7 m (24,5→40,4 % de vía peatonal) · Arrupe +502 m
      (44,1→**94,7 %**) · Leopoldo +91,8 m (37,8→74,2 %) · la céntrica
      +1,3 m y al **100 %** soltando toda la calzada [art. 121.1 en
      acto] · máximo +7,9 %, dentro del tope 33 % de la relación
      1,2/0,9. Los 20 portales cuyo único enlace era un cycleway caen
      con el Aviso honesto (0,044 %; hueco de OSM declarado en
      comentario — ninguna doctrina trae la regla «reabrir si es el
      único enlace»). Los 8 guardianes de forma movidos con su cuenta
      ENTERA versionada en el comentario [GUIA: la evidencia se
      versiona · L59 · L62] y contraprueba 8/8. **Bitácora nº9**
      (capturada en caliente, cerrada con dos defectos y ley nueva:
      «que el resultado saliera bien no exonera al instrumento»).
      Latencia re-medida y ATRIBUIDA: p50 15→23 ms — no es el
      Dijkstra (9,1→10,2 ms), es la respuesta más gorda (25,9 pasos ·
      ~16 kB). README y notices al día en su commit
- [x] **La prioridad RETIRADA — mínimo de distancia (22/08)**, decisión
      de Antonio con las rutas en la mano (paso 3 del ritmo): Arrupe
      pagaba +502 m y +6 min rodeando el corredor central, cuando por
      la avenida también se anda — por su acera. Se queda el defecto
      documentado de Valhalla (`walkway_factor 1,0` «neutral»,
      pedestriancost.cc) y OSRM (foot.lua sin factores): coste =
      metros entre lo PERMITIDO. La capa se fue ENTERA, no a ×1,0
      (nueve piezas — el «declarado y nunca cableado» de la GUIA), y
      `shortest` con ella (sin coste no distingue nada). `andando.ts`
      226→147 líneas con LÁPIDA en cabecera: qué fue la capa, qué
      costó medido, y que volver a ponerla exige medición nueva. La
      tabla de ACCESO intacta con prueba (diff contra HEAD: cero
      diferencias; la red sigue en 89.047). 8 guardianes de vuelta
      (el del colapso solo cambió números: la RAZÓN aguantó) + el
      noveno: uno en VERDE con el comentario mintiendo («Arrupe ya no
      pisa el paseo» — hoy lo pisa), cazado releyendo lo que el verde
      no obliga a releer [L62]. Las seis juez clavadas a la B de ayer
      (2.487 · 6.371 · 4.517 · 342 · 0 · Aviso), cycleway 0 en todas.
      Commits `7d2ffcb` + `1067c6f` (el README cuenta la retirada, no
      la calla)
- [x] **La narración de los cruces — HECHA (23/08): los combines de
      odin calcados** (`0225b4b`→`ab87224`). Doctrina leída de fuente
      (maneuversbuilder.cc 4.100 líneas · narrativebuilder.cc 4.958):
      tres reglas calcadas — unnamed straight · same-base straight ·
      continue obvio (umbral 0,6 km, constante leída) con la mitad que
      HEREDA nombre — más los vetos (tipo real, escaleras, cruce con
      fraseo propio, destino) y una cota [PROPIO] declarada (0,6 km al
      genérico que desaparece; sin ella 2 de 89 mienten). Resultado
      sobre 387 rutas: 9.348→9.232 pasos (−116, cuadrado regla a
      regla), genéricos −7,9 %, 80 rutas bajan, CERO suben, geometrías
      idénticas al byte (sha256). ⛔ La MITAD ANCHA de odin (absorber
      perdiendo nombre) queda FUERA, FIRMADA por Antonio: nuestro
      «Continúa» no es el kContinue de Valhalla (0 de 1.511 repiten
      calle — semántica distinta, medida); habría borrado 1.099
      nombres (Cataluña 2.971 m, San Juan de la Peña 1.203). Lápida
      con cifras en el código: reabrirla exige medición que las
      desmienta. El multi-cue verbal (13 s): declarado no implementado
      (capa de voz). Bitácora nº10 (el medidor contaba ramas sin
      descontar las de la ruta; cazado por la juez de Biel en rojo con
      el motor teniendo razón) — ley: «una contraprueba solo vale para
      lo que atraviesa». 19 guardianes nuevos, 15/15 contraprueba,
      179/179. El ZIGZAG A→B→A no se toca: problema abierto del
      ecosistema entero (listas OSM 2015/2020, #4657) — geometría
      real, sin regla que calcar; se declaró y se queda. Dos flecos
      parlamentados y cerrados: la frase caducada del 121.1 en
      andando.ts (`a83441a`) y los porcentajes sin procedimiento fuera
      del README (`ab87224`) — NORMA NUEVA: al README solo cifras con
      comando y muestra declarados.

**⭐ PUNTO 7 CERRADO ENTERO (23/08).** La demo andando: real, legal
(art. 121.1 + tabla de acceso), mínima en metros (decisión del ojo,
22/08), ligera (0,22 MB) y bien narrada (odin). Las bitácoras nº6-10
son suyas. Lo aplazado con casilla propia: acera-bici (punto 9),
narración fina de plaza-hito y rotondas (mejora futura declarada),
visor→Intranet (punto 16).
      La doctrina existe: en Valhalla la narración (odin) es fase
      propia que colapsa la lista de maniobras a una lista concisa
      [docs oficiales], y el modelo de maniobra trae
      `pedestrian_crossing_` de serie [maneuver.h leído] — el cruce
      peatonal es maniobra de tratamiento aparte, no un giro más.
      Encargo futuro: leer cómo odin decide qué colapsa y calcarlo;
      hasta entonces los 25 pasos son la verdad y NO se tocan

## 8 — Destinos con nombre: «de la calle X al hospital Y» — **⭐ CERRADO
el 27/08** *(nació el 18/08; las casillas de planificación de abajo
quedaron sin tachar al escribir el cierre como bloque aparte — se
tacharon el 1/09 con su destino real; nada pendiente)*

El destino puede ser un SITIO además de calle+portal: se está en un
portal y se quiere ir al Hospital Miguel Servet, a una farmacia, a un
centro cívico. Va después del 7 porque REUTILIZA sus dos piezas: el
autocompletar (elegir-fija-código, mismo componente que calles y
portales) y el enganche coordenada→grafo que el 7 construye para los
portales — un sitio es una coordenada más entrando al mismo tubo.

- [x] ⚰️ HECHA (fichas del notices; ver el cierre) · Fuente investigada (18/08, informe en
      `docs/INVESTIGACION-EQUIPAMIENTOS.md`): la API de equipamientos de
      zaragoza.es — ~250 categorías en 19 familias (313 farmacias, 17
      hospitales, 56 centros de salud, 75 bibliotecas, 25 centros
      cívicos, 46 mercados…), Ley 37/2007, coordenadas SOLO con
      `srsname=wgs84` (el parámetro en mayúsculas o EPSG se ignora en
      silencio)
- [x] **La doctrina del geocodificador, leída (23/08)**: geocodificar
      (nombre → sitio → PUNTO) y enrutar (punto → ruta) son DOS oficios
      [Nominatim, blog de entradas 2025]; nuestro tubo del 7 es la
      mitad router, este punto construye la mitad geocodificador. El
      punto del sitio es el CENTROIDE por defecto, y su fallo está
      documentado [Nominatim #536, 2016]: en sitios GRANDES el enganche
      del centroide puede acabar lejos de toda entrada — la solución
      moderna son las ENTRADAS (`entrance=*`, Nominatim las sirve desde
      2025). Consecuencia: categorías de sitio chico van por el tubo
      tal cual; las de recinto (hospitales, 17) verifican DÓNDE cae el
      enganche, con las entradas OSM como arreglo si alguno cae mal. Y
      el sitio es CAPA propia en la búsqueda (Nominatim separa
      address/poi): tipo nuevo, no mezclado en silencio con calles
- [x] **Las dos sondas de hostelería (23/08, solo lectura, cero
      descargas)** — la foto completa para decidir:
      · API equipamientos: BARRIDO COMPLETO de las 251 categorías — NO
        existe censo de hostelería (lo del 18/08, ahora agotado, no
        muestreado). Y recuentos movidos vs 18/08: Comercio Menor 50,
        Educación 43, Cultura 33, SS 15; WFS 187 capas; 1543 Panaderías
        en el menú con endpoint 404
      · ⭐ Registro de Licencias — servicio REST abierto NO CATALOGADO,
        cazado EN VIVO por Antonio (DevTools, 23/08):
        `/sede/servicio/registro-licencia.json|.geojson` + `/calle` +
        `/zona-saturada`. 42.303 locales · contador puro con rows=0
        (37 bytes) · consultas compuestas VERIFICADAS por aritmética de
        conjuntos (;=AND ,=OR, cuadre exacto) · hostelería: agr. 67 =
        5.773 (⭐ 673.2 «otros cafés y bares» = 5.372) · agr. 68 = 146
        · coordenadas WGS84 SIEMPRE · **codVia/codPortal = LOS
        NUESTROS** (14860=Paseo Independencia ✓; 489/500 vías casan,
        97,8 % — el cruce va por CÓDIGO, jamás por nombre: hay nombres
        distintos con igual código) · zona-saturada: 15 polígonos que
        cruzan (campo al 100 %) · CERO datos personales (20 claves,
        sin titular/NIF) · ⚠️ PEROS: `estado` (0/1/2/3; el 1 = 31.446)
        SIN DESCIFRAR — no se bautiza, y sin él no se distingue
        abierto de cerrado · NO trae NOMBRES de local (es censo de
        actividad, no de rótulos: nadie busca «Casa Pepe» ahí) · tope
        de descarga raro (algunas consultas 100 filas, otras 10;
        start pagina y totalCount siempre honesto)
      · restaurante.json (catálogo 285): 1.537 (1.534 ids, 3 dupes) ·
        title/tenedores/capacidad/tel 84 % · ⚠️ solo 39 % con
        coordenada · frescura CONTRADICHA (ficha: 24/10/2019 mensual ·
        dato: lastUpdated hasta 2026-07-28) — dos números, sin elegir
      · veladores MU2: 712 · 100 % Point · NOMBRE_LOCAL 99,7 % · pero
        HUÉRFANOS (sin id/licencia/catastro que los ate a nada) ·
        mojibake real de origen (NÂº) — el del registro era falso
        (terminal), corregido por el propio ejecutor
      · OSM Overpass (municipio): 2.167 · 100 % coordenadas · name
        98 % — restaurant 882 · cafe 529 · pub 322 · bar 245 ·
        fast_food 189 · licencia ODbL YA integrada · vivo a diario
      · Aragón cafeterías-y-restaurantes: fichero de Antonio
        anatomizado (3,49 MB · 3.376 · Zaragoza-capital 1.466 · vivo a
        jul-2026 · SIN COORDENADAS → exigiría geocodificar direcciones
        de 25 años · datos personales: 2.999 tel, 788 email, cif) ·
        ficha oficial NO CONSTA con causa (robots prohíbe /ckan/api ·
        401 · cáscara JS) — Antonio puede pegar licencia/frecuencia de
        su navegador y muere el NO CONSTA
- [x] ⚰️ RESUELTO el 27/08 con la PODA firmada por Antonio (las categorías que entran son las del cierre; el resto, fuera) · **⚖️ PARLAMENTO — qué categorías entran (tanda 1)**:
      decide Antonio pieza a pieza (patrón del punto 4: autorización,
      ficha, verificación). Sobre la mesa: las municipales chicas con
      nombre+coordenada (farmacias 313 · hospitales 17 · centros de
      salud 56 · bibliotecas 75 · centros cívicos 25 · mercados 46 ·
      museos 25…) · y la HOSTELERÍA: ¿entra ya, en tanda 2, o no? —
      si entra, la fuente con nombre+coordenada es OSM (el registro de
      licencias no trae rótulos: vale como contexto/censo, no como
      buscable). El tubo se construye UNA vez con la primera
      categoría; cada una después es coste marginal (autorización +
      ficha + sus rarezas)
**⭐ EL BUSCADOR POR TIPOS — HECHO (24/08, `a6e28ca` + `98d6b0a`;
visto por Antonio en vivo: «de momento no veo taras»).** Mejora de
Antonio al buscador, parlamentada y ejecutada el mismo día. La forma
de cada campo, ORIGEN y DESTINO por igual:

```
   [📍 ubicación] [ tipo ▾ ] [ cajetín de búsqueda ] [ nº ]
                    Dirección · Farmacias · Hospitales ·
                    Centros de Salud · (las que vengan)
```

- [x] **El desplegable de TIPO** [GOV.UK Select como filtro; defecto
      «Dirección» [PROPIO]]: el cajetín sugiere SOLO la categoría
      elegida — el filtro llega al motor como parámetro `capa` de
      /api/sitios [Pelias: layers], capa desconocida se ignora. La
      PUREZA medida por las dos caras: «navarra» capa=farmacia → solo
      farmacias; y en pantalla, con Dirección la capa de sitios NI SE
      PIDE (0 peticiones) y viceversa. La mezclada MURIÓ (firmada):
      su juez vieja, derogada CON MOTIVO ESCRITO en el spec y
      sustituida por «una lista nunca mezcla capas». Al cambiar de
      tipo, el campo SE LIMPIA (cambiar de carril es empezar la
      pregunta)
- [x] **El Nº por revelado condicional** [GOV.UK: un solo campo,
      presente o ausente del DOM — el ARIA extra no hizo falta, es la
      forma que el patrón recomienda]: Dirección lo enseña, los
      sitios ni lo pintan. Las cuatro juez del apagado viejo,
      derogadas con motivo: la absorbe la AUSENCIA. Y al invertir, el
      nº ya no se apaga: SE MUDA con su valor («BURGOS 2» cruza
      entero)
- [x] **«Mi ubicación» en LOS DOS campos**: mismo botón y varas del
      punto 6 [MDN]. Al usarlo, el tipo salta a Dirección (declarado:
      una ubicación ES una dirección — y es lo que hace aparecer la
      casilla donde el portal resuelto se ve)
- [x] **El ⇅ cruza tipo + texto + nº** — tabla completa verificada
      (Dirección↔sitio · sitio↔sitio · borradores como texto ·
      vacíos): ninguna combinación deja botones muertos. La
      incoherencia del sábado, muerta de raíz. ⭐ Y el fallo que el
      propio encargo parió, cazado en caliente SIN bitácora (nada dio
      verde con él vivo — nació y murió dentro): al invertir, el
      texto viejo bajo la capa nueva salía al cable
      («/api/vias?q=Farmacia · …», 200 ms de petición fantasma) — la
      consulta solo sale ahora si sigue siendo lo escrito; seis
      pruebas esperándolo se pusieron verdes de golpe
- [x] Lo heredado, intacto: orden/foco, regla B, iconos (ahora la
      lista entera es de un tipo y el icono lo confirma). El contrato
      del motor SIN TOCAR (al motor le sigue llegando vía+portal o
      sitio). 219 motor + 136 interfaz; las once juez + la del cable
      al byte; contraprueba entera mordiendo (el defecto a Farmacias
      tira 49 pruebas · el nº-nunca, 44: el formulario descansa sobre
      esas dos leyes y está MEDIDO)

- [x] **⭐ EL PUNTO 8, CERRADO (27/08, `6f1fd08`→`ace1bc7`).** El
      remate en cuatro piezas, todas a doctrina, y la poda de demo
      firmada por Antonio («no nos vamos a estancar poniendo
      categorías como si esto fuese el cuento de nunca acabar»):
      (1) LA nº14 CERRADA — candidatas por SUBSECUENCIA de palabras
      con LA GUARDA QUE CRECE [la geo-similitud de la nº13 extendida
      a todas las candidatas], y el ESCALÓN DEL DATUM que el ejecutor
      cazó en el encargo (la guarda es DESEMPATE entre candidatas, no
      veto sobre lo que el dato afirma: sin él, las 4 del datum
      dejaban de rescatarse — 24 pruebas lo sostienen). El Andrés
      Oliván EN SU BARRIO (el testigo se cayó solo, que era para lo
      que estaba escrito), el 8855 protegido, 16 rescates. Y la
      mutación que desnudó un guardián: el fantasma mutado a trozos
      dejaba 277 verdes porque LA GUARDA TAPABA EL DESASTRE —
      esSubsecuencia exportada con prueba propia y los tres casos
      históricos. LEY: «una guarda que tapa un fallo no es una prueba
      de que no lo haya — una regla verificada solo por su efecto
      deja de estar verificada en cuanto otra cosa la protege».
      (2) EL FOCO EN LAS VÍAS [Pelias autocomplete: el foco
      promociona lo cercano SIN dejar de mostrar lo lejano; el caso
      TriMet/Portland idéntico al nuestro: «direcciones ambiguas
      entre pueblos, ordenadas por cercanía al foco»]: /api/vias gana
      foco opcional, la Calle Mayor de Garrapinillos PRIMERA desde
      Garrapinillos y la del centro décima (el tope corta, el foco
      solo ordena — declarado); la vía se mide por su PORTAL MÁS
      CERCANO al foco, no por centroide (la Autovía de Logroño: 34
      portales en 17 km — el medio miente). Dos guardianes desnudados
      por la contraprueba (el if que nunca entraba; la medida sin
      vigilante) y nace callejero.spec.ts (buscar() vivía sin una
      prueba). (3) LAS VÍAS SIN PORTAL DENTRO [Pelias: «toda calle
      indexada y recuperable»; el árbol de decisión: sin número → el
      centroide de la calle; «máximo un resultado por calle»]: 619 de
      628 por su PUNTO MEDIO (la lectura precisa del «centroide»: la
      MITAD DEL RECORRIDO, siempre sobre la línea — la media de
      vértices pesa donde el dibujante puso puntos y el centro del
      rectángulo cae fuera en una vía en L), 9 fuera con dos motivos
      separados (la glorieta huérfana del desfase 13/05-20/08, ya en
      §1.15, re-medida: un huérfano por dirección · 8 DISEMINADO con
      multilínea vacía); el cruce POR CÓDIGO (1:1 en las 3.359); el
      contrato INTACTO ({via:X, portal:X} — el punto de la vía se
      identifica con la vía); el Puente de Piedra ruteable (factor
      1,06 contra la recta — se juzga la coherencia, no el número).
      ⚠️ El cambio pasó INVISIBLE por 438 pruebas (nada vigilaba qué
      significaba sugeribles — 17 jueces comprados en rojo a
      posteriori) y el emparejador CASI se rompe sin ponerse rojo (44
      nombres nuevos chocaban con claves de los rescates del datum —
      filtro como precaución declarada; y la confesión: «bajan a 15»
      escrito sin medir, medido, falso, corregido). (4) LA GLORIETA
      15912 [fe de erratas §1.15]: SÍ se escribe pero NO con el
      nombre de la ficha — los dos ficheros la nombran distinto
      (ejes: «ÓSCAR LAÍNEZ HERNÁNDEZ» · callejero, el que se
      escribe: «LAÍNEZ HERNÁNDEZ, ÓSCAR») — falso-conocido-declarado
      [el precedente del ---CRT], y la excepción del gacetero («solo
      una vía no empieza por su tipo») DERIVADA del dato entero.
      LA PODA DE DEMO, declarada con motivo: hostelería-OSM (2.167) y
      las municipales chicas (cívicos 25 · museos 25 · mercados 46 ·
      teatros 11 · turismo · juntas · OMIC) quedan FUERA — siete
      categorías demuestran todo lo que el tubo tenía que demostrar
      (composición, validación, siglas, iconos a doctrina); la octava
      no enseña nada nuevo. A la nevera sin remordimiento, con sus
      flecos (la ficha de Aragón · el `estado` del registro de
      licencias). Y el cabo de servidor.ts SIN SPEC (el único fichero
      del motor sin pruebas — visible desde el foco a las vías) pasa
      al PUNTO 12, su casa natural. SALDO DEL PUNTO: siete categorías
      · 820 sitios · 802 buscables · 3.350 vías sugeribles (2.731 con
      portal + 619 por punto medio) · 14 bitácoras cerradas · 306
      motor + 154 interfaz.

- [x] **TANDA 4 — EDUCACIÓN, HECHA (25-27/08, `2a20ae0`→`1d4d956`)**:
      TRES etiquetas nuevas desde la familia municipal de 43
      categorías, con la partición de la taxonomía OSM [Education
      features: school ~6-18 con varios niveles en UN elemento ·
      kindergarten · university] FIRMADA por Antonio tras DOS sondas
      (738 ids = 738 nombres verificado con mutación; el único
      colapso, un espacio final del dato municipal) y un parlamento
      de CINCO firmas con doctrina línea a línea: el 660 «Centros
      Educativos» FUERA (cero aporte escolar exclusivo; sus 29
      exclusivos son conservatorios/EOI/adultos con tag OSM propio
      [music_school · language_school · education=centre]) · las 13
      facultades SOLO en Universidades [university = campus
      terciario] · las escuelas infantiles sueltas a Guarderías
      [kindergarten; preschool obsoletado a su favor] y el 8592
      (colegio completo) a Colegios [un elemento por colegio] · de
      la 64 «especial» solo los C.E.E. [los colegios de necesidades
      especiales son school] — los 10 sociosanitarios fuera con
      motivo. RESULTADO: Colegios e Institutos 264 (514 brutas → 234
      duplicados digeridos por la partición; los 62 mixtos dentro
      sin partirse) · Guarderías 64 · Universidades 29 — CERO
      solapes id a id, 802 códigos únicos en el índice de 820
      sitios. Ficha §1.20 TRIPLE (once ficheros → tres etiquetas,
      cada decisión con su cita) · manifiesto a 37 resources con el
      VALIDADOR contraprobado (5 roturas plantadas, 5 cazadas). ⭐ El
      Last-Modified compartido DEMOSTRADO como suelo del servidor
      con las 43 categorías (26/26 posteriores coinciden al segundo;
      13/14 anteriores devuelven LA MISMA fecha 25/04/2025): no era
      la 3ª vez, era la 16ª — 9 ficheros declaran modified, 2 lo
      omiten. ⚠️ La re-descarga idéntica FALLA en 7/11 (solo baila el
      orden de las URLs del array type; mismos ids y valores —
      declarado en ficha: la promesa de §1.19 aquí no vale). Títulos:
      0 personas físicas en 354 (las 6 con coma son empresas de FP
      dual; la verificación con las 75 siglas — la lección de
      Cáritas). ⭐ Las SIGLAS obligaron a tocar el buscador: «ceip
      moliner» no encontraba nada (el troceador partía C.E.I.P. en
      letras) — lo buscable lleva ahora las dos formas
      (conSiglasEnteras); volcados en vivo por etiqueta y con sigla.
      ⭐ Y LAS PALABRAS VACÍAS (30/08, del ojo de Antonio, verificado
      por él): «rodrigo rebolledo» no encontraba «RODRIGO DE
      REBOLLEDO» — el callejero casaba por SUBCADENA CONTIGUA (el
      «por palabras» era solo del tubo de sitios; la suite decía
      «subcadena»: mejora, no bitácora). 1.076 vías con partícula en
      medio, 673 escondidas. El arreglo [Pelias StopWordClassifier;
      lista PROPIO de·del·la·las·los·el·y]: copia indexada sin
      vacías, camino que SOLO AÑADE (el literal intacto), la guarda
      del núcleo vacío («de» sigue dando sus diez), los nombres se
      pintan enteros. La confesión con oficio: una contraprueba
      pedida NO muerde (las dos puertas se cubren) y la juez queda
      escrita para cuando alguien estreche el casado. 369 motor ·
      suite del 8 al completo.
      ICONOS: lápiz-y-manzana [Maki school, SVG leído] · CHUPETE
      [PROPIO firmado — hueco real: ni carto ni Maki ni Temaki traen
      guardería] · birrete [Maki college] — los tres en MOSTAZA
      OSCURO #614800 firmado (8,62/7,51 — el mismo par que el azul
      sanitario al centésimo; el mostaza vivo no pasa el listón),
      trazados a mano (la manzana torcida de la 2ª pasada: un path
      partido en medio de un número — cada subcamino en una sola
      cadena desde entonces); el desplegable ensanchado a 13 rem CON
      MEDIDA. Validación espacial: colegios/guarderías chicos ·
      universidades RECINTO [la partición firmada]. ⭐ BITÁCORA nº13
      (abierta en caliente, CERRADA `5ddc841`): el rescate por
      callejero MOVÍA COORDENADAS QUE YA ESTABAN BIEN — el CEIP
      Andrés Oliván (San Juan de Mozarrifar) arrastrado 7,6 km a la
      calle homónima de la ciudad; 22 de 29 rescatados tenían su
      punto a ≤50 m de un portal real, y 7 de los 9 EN PRODUCCIÓN
      desde el 23-24 eran del mismo tipo. Lo que daba verde: el
      guardián que ENUMERABA los rescates al byte — «enumerar lo que
      un proceso hace no vigila que lo que hace esté bien». EL
      ARREGLO a doctrina [false positive del homónimo sin contexto
      administrativo; la geo-similitud MANDA sobre la similitud de
      nombres; location bias]: (1) desambiguación por cercanía ante
      vías homónimas CON GUARDA (medida antes de creída: sola
      empeoraba — 34/25; si la ganadora no tiene puerta a ≤50 m no
      se elige ninguna) + (2) precondición de VÍA ENTERA (solo se
      rescata lo que está a >50 m de CUALQUIER portal de su vía
      desambiguada). 29 rescates → 17; los 4 del datum SIGUEN
      rescatados (236 m de su vía); la métrica del encargo era
      incumplible y se afinó con honradez (en barrio denso siempre
      hay puerta AJENA cerca — la vara es la puerta de SU PROPIA
      calle: 0 falsos POR CONSTRUCCIÓN). Ley del cierre: «medir la
      ida y la vuelta no basta con medirla bien: hay que medir lo
      que corresponde». ⚠️ BITÁCORA nº14 ABIERTA: el Andrés Oliván
      NO se arregla — «doctor palomar» y «doctor alejandro palomar»
      son DOS CLAVES distintas (no hay homónimo que desambiguar); la
      puerta de la SUBSECUENCIA está MEDIDA (lo devuelve a su barrio
      pero mete un rescate malo: la guarda tendría que crecer —
      doctrina nueva, parlamento pendiente) y un TESTIGO lo vigila
      («EL ANDRÉS OLIVÁN SIGUE ATERRIZANDO EN LA CIUDAD», escrito
      para caerse solo el día del arreglo). Los SEIS C.E.E. dentro
      (los 3 de la firma + los 3 que la salida del 660 dejó fuera
      por accidente — moraleja en ficha: «una lista de ids deja de
      valer si otra decisión de la misma mesa cambia de dónde
      vienen»; las firmas nombran CRITERIOS, no listas). 273 motor +
      148 interfaz · contraprueba 6/6 (quitar la guarda o la
      precondición: 10 rojas cada una; los C.E.E.: 16) · las
      dieciséis jueces al byte con la razón comprobable (ningún
      sitio juez en las listas de rescate) · README al día de las
      dos tandas [ley nº5] · el panel a 37 filas.

- [x] **TANDA 3 — BIBLIOTECAS, HECHA (25/08, `aae90f6`→`22ed779`)**,
      con DOS paradas de costura que valieron la tanda: (1) el
      catálogo tenía TRES categorías de biblioteca — Antonio eligió
      35+223 (77 registros, 35∩223=0 verificado, 0 duplicados; la 4
      «Archivos» FUERA con motivo: son archivos y hemerotecas, no
      préstamo) — la ficha §1.19 declara la composición con los dos
      ids, DOS filas del manifiesto (25-26, cada fichero su huella);
      (2) el dato DESMINTIÓ la tabla de respaldo del encargo
      («bibliotecas = sitio chico»): las 8 que la validación movería
      estaban BIEN puestas — cuartos dentro de recintos (CITA,
      cívicos) — Antonio firmó RECINTO (frontera sí, distancia no; 0
      rescates; el precedente del Miguel Servet). Recuentos: 77 · 75
      al índice (2 sin coordenada, regla B). El `modified` con su
      TERCER caso y subida de nivel: la 223 comparte Last-Modified AL
      SEGUNDO con hospitales — una fecha que dos categorías comparten
      no describe a ninguna (la sospecha del redeploy, con dos
      testigos). Títulos institucionales verificados (el contador
      acusó a «Cáritas» por una tilde que le faltaba AL CONTADOR —
      corregido y anotado). ICONO: libro abierto [fuente primaria:
      los SVG de osm-carto y Maki leídos por el estratega — la
      convención es el glifo, no el fichero] · color de CULTURA
      #6a1b9a (9,39:1 / 8,18:1) — el marrón de carto DESCARTADO CON
      LA MEDIDA (6,75:1 sobre el beige, bajo el listón ≥7:1 [PROPIO];
      mínimo documentado 3:1 [WCAG 1.4.11]). El contrato hizo de
      muralla: la interfaz NO COMPILÓ hasta dar a la clase nueva
      dibujo, color y anclaje. Motor 463 sitios · 456 buscables ·
      cuatro categorías. ⭐ BITÁCORA nº12 (ABIERTA en caliente,
      CERRADA con arreglo `b45eaae`): el «tsc limpio» de TRES
      checkpoints salía de un comando que miraba CERO ficheros
      (tsconfig.json es fichero solución: files:[] + references →
      código 0 sin trabajo) — cazado porque la app TENÍA que estar
      rota y salió verde; el arreglo: comprobar-tipos con CENSO
      declarado (290+353 ficheros) y guardián que protesta si el
      censo es 0, contraprobado por los dos lados (y su propia trampa
      de Windows —spawnSync sin shell → EINVAL → censo 0— cazada y
      contada dentro). LEY nueva: «un comando que termina en
      silencio no es un verde hasta que se le ha visto contar lo que
      ha mirado» + «una costumbre de comprobación necesita un guion
      del que tirar». Tres instrumentos, el mismo fallo con tres
      caras (el tsc · el medidor ciego al throw · el vitest bajo
      subprocess). Y LOS REMATES del buscador (25/08, `656f005` ·
      `f624b31`, decisiones de Antonio): el desplegable ORDENADO
      (Dirección primera [GOV.UK select con defecto] + resto
      alfabético CALCULADO [localeCompare-es [PROPIO]] — el guardián
      vigila LA REGLA, no la copia; dos mutaciones que hoy no muerden
      DECLARADAS con su coincidencia: id vs etiqueta y tabla de
      códigos empatan con las cuatro de hoy) e ICONOS DENTRO del
      desplegable [Customizable Select, MDN: los option admiten
      contenido; regla de oro de WebKit: texto siempre + aria-hidden;
      mejora progresiva: todo en @supports, 5 dentro / 0 fuera —
      jsdom no lo soporta, así que las 144 pruebas SON el caso
      degradado] con la chincheta POR CAMPO (verde origen · roja
      destino [osm.org]) y guardián nuevo de la colisión firmada
      (chincheta y cruz de farmacia en el mismo verde: mismo fill,
      distinto d [#2787]). 263 motor + 144 interfaz.

- [x] **LA VALIDACIÓN ESPACIAL con rescate por callejero — HECHA
      (24/08, `4c4cae6`→`bfe0e36`)**, la regla de entorno de Antonio
      con doctrina de casuística localizada [el problema documentado
      idéntico en las listas sanitarias oficiales de Kenia («sin
      proceso de verificación de coordenadas»); la solución = la
      dictada por Antonio: re-geocodificar contra gacetero
      autoritativo (el método del inventario panafricano de
      hospitales, Lancet GH) + confirmación manual local (el método
      de la base de Kenia) — nuestro gacetero es el callejero].
      DOS CHEQUES [doctrina QA]: FRONTERA (el bbox de los 46.150
      portales + 250 m de margen = RADIO_MAXIMO, guardián de los
      46.150 dentro) y DISTANCIA (>50 m al portal de su propia
      dirección, SOLO chicos — los hospitales fuera POR FIRMA: el
      Miguel Servet a 1 m de Gonzalo Calamita 4 es OTRA PUERTA de
      sus cinco, cerrado por conocimiento local de Antonio; su J10
      al byte como guardián de no-cambio). ⭐ UMBRAL 50 m FIRMADO DOS
      VECES: la segunda con la distribución real delante — el «vacío
      hasta 236» de la premisa NO existe con el emparejador completo
      (casos en 24-45 bajo la raya y 52-110 encima: los 50 cortan un
      CONTINUO), dicho por el ejecutor y re-firmado por Antonio.
      RESULTADO: 10 rotas de 386 — 1 frontera (id 9090, PORTUGAL) +
      9 distancia en dos grupos (5 en OTRA calle, los 4 del datum con
      el vector clavado a la millonésima; 4 en su calle a otro
      número) → 9 RESCATADAS al portal del callejero (log de arranque
      como acta, uno a uno, sin titular) · 1 FUERA (el 9090: frontera
      + s/n irrescatable — consecuencia dicha: ese centro NO se puede
      elegir; en lista de confirmación manual de Antonio). El
      antes/después del datum: Farmacias.20445 a su propia puerta,
      401 m → 0 m. El emparejador exige unicidad TAMBIÉN en el número
      (la 8881 sana con 23 portales en su dirección se habría
      «rescatado» rota — cazada ANTES de escribir la regla). Medido y
      NO hecho: relajar artículos daría +16 emparejadas y CERO rotas
      nuevas. Contraprueba 14/14 (la única que no mordía destapó al
      guardián del ambiguo vigilando en vacío — reapuntado a
      C/ Madrid 1) · sin git checkout en el bucle (copias con
      huella). 250 motor + 136 interfaz. Y el README saneado en TRES
      pasadas (`51eec72` · `efa7081` · `bfe0e36`): la sección de
      sitios al buscador por tipos, la API a SEIS rutas (la tabla no
      traía /api/sitios), y la frase de la cabecera del 📍 — el
      ejemplo nuevo salió del motor y de paso enseña la 781 ancha
      funcionando (el C. de Especialidades Inocencio Jiménez,
      buscable por «navarra»). ⭐ Y EL CICLO CERRADO (24/08 tarde,
      `3f631fa`→`d766e15`): el 9090 VOLVIÓ — Antonio confirmó la
      coordenada sobre el terreno (Google Maps; el callejero la
      respaldó solo: cae a 9 m del portal 11 de Domingo Miral, la
      calle que el registro declara) → mecanismo de CORRECCIONES
      MANUALES de sitios (correcciones.ts, patrón del callejero:
      declarada con fuente/fecha/motivo, aplicada ANTES de validar,
      con TRES candados que revientan el arranque — atada a la
      coordenada municipal que corrige, obligada a pasar los dos
      cheques, y declarada en el log). 381 en el índice · 0
      inválidas · la lista de confirmación manual VACÍA: volvió
      confirmada [el ciclo completo del método de Kenia]. J14
      (Coloso→9090: 6.000 m coherentes con 5.229 en recta) · 257
      motor · contraprueba 9/9 (el medidor ciego al throw-en-carga,
      cazado: las dos mutaciones gordas tiran 125 rojas) · el README
      al día en la cuarta pasada (`d766e15`)

- [x] **TANDA 2 — CENTROS DE SALUD Y HOSPITALES, HECHA (24/08,
      `7074a20`→`37d4f65`)**: categorías 781 (56, todos con
      coordenada) y 780 (17, 15 al índice — 2 clínicas sin coordenada
      NI calle, regla B). Fichas §1.17-1.18, filas 23-24 del
      manifiesto (24 resources, schema oficial 0 errores). El
      criterio del `modified` como JURISPRUDENCIA: centros SÍ
      (Last-Modified = lastUpdated al segundo) · hospitales OMITIDO
      (13 meses de diferencia — una cabecera que no describe al
      dato). Los títulos SE LEEN (institucionales: «Miguel Servet» es
      nombre de edificio, no titular — verificado: 0 patrones de
      persona; la tabla FUENTES dice quién lee su título categoría a
      categoría). ICONOS FIRMADOS: H blanca en cuadrado azul
      [señal S-23 / convención universal] · cruz azul [[PROPIO]
      firmado: cruz sanitaria + azul médico; la roja VETADA por
      Ginebra — el propio osm-carto tiene el issue #3408 por evocarla
      — y la verde ocupada por farmacia]; un solo azul #0d47a1
      (contraste medido 8,63:1), separados POR FORMA [#2787].
      ⭐ EL RECINTO GRANDE [#536], medido: NO aparece por el conector
      (mediana 5 m — la API municipal publica punto de DIRECCIÓN, no
      centroide: el trabajo que a Nominatim le falta, el Ayuntamiento
      lo trae hecho) — pero SÍ por otro lado: J10 Coloso→Miguel
      Servet (6.348 m · 12 pasos) llega por Gonzalo Calamita (bordea
      el recinto, enganche legítimo a 2 m) y el texto dice «Avda.
      Isabel la Católica, 3» — la puerta que ese texto nombra queda a
      169 m al otro lado del bloque: correcto como rótulo, ENGAÑOSO
      como indicación. PARLAMENTO FICHADO (la idea de Antonio:
      enganchar por la DIRECCIÓN cruzada con nuestro callejero; los
      s/n a mano con su dato — P1 y P2 pendientes de responder). J11
      Coloso→CS Actur Norte (1.822 m · 7 pasos): limpia. Hallazgos:
      ⚠️ coordenada en PORTUGAL (id 9090, «CS Fernando El Católico»,
      610 km — la regla B no lo caza: coordenada tiene, sentido no;
      NO filtrado: regla de entorno = decisión de Antonio, fichada) ·
      la categoría 781 más ancha que su nombre (especialidades,
      consultorios, CMAPA — se respeta la clasificación municipal) ·
      un git checkout en bucle de contraprueba revirtió mapa.ts
      (detectado en git status; la contraprueba restaura ahora con
      copias propias). 215+127 pruebas; las nueve juez viejas al
      byte + J10 `d47b0ea0` · J11 `b104cb55`

- [x] **FARMACIAS — LA PRIMERA CATEGORÍA, HECHA ENTERA (23/08)**, en
      cuatro encargos (B + tres remates; commits `1bf560f`→`16cc9c1`):
      el TUBO DE SITIOS completo. Descarga con ritual (313 · 310 con
      coordenada · ficha §1.16 · fila 22 del manifiesto en las dos
      copias, con `modified` DEFENDIDO contra el precedente del WFS:
      el Last-Modified coincide con el lastUpdated interno, no con la
      descarga) · sitios en AMBOS extremos con el ⇅ cruzándolo todo
      (el borrador cruza siendo texto) · regla B de Antonio: SIN
      COORDENADA NO EXISTE (3 fuera del índice, contadas en el log) ·
      presentación «Farmacia + dirección», el titular no se lee
      (guardián contra el título crudo) · búsqueda POR PALABRAS
      [Pelias multi-match: cada palabra recorta, el orden no manda] ·
      ORDEN a doctrina [Pelias: lingüística primero · foco al otro
      extremo cuando está resuelto (focus.point) · desempate
      alfabético [PROPIO] — antes NO HABÍA orden: posiciones del
      fichero municipal con corte previo] · ICONOS a doctrina en las
      tres casas [osm.org: VERDE origen · ROJO destino · cruz verde
      europea de farmacia · forma además de color #2787 — la
      protanopia del mapa queda ABIERTA, dicha, con la bandera a
      cuadros anotada para el 13] · regla del portal condicional por
      estructura (el apagado explícito era código muerto: fuera) ·
      JUECES J7/J8/J9 (ida, inversa, sitio→sitio) + la juez del CABLE
      (el cuerpo real del formulario contra el lector real del motor,
      leerPeticion importada — nació de la bitácora nº11) · MISMO
      PUNTO resuelto por doctrina y FIRMADO (23/08): los motores
      calculan las rutas triviales [Valhalla: algoritmo dedicado,
      «super trivial» reparado en #3299] y salida+llegada a 0 m es la
      narración canónica de odin — SIN regla nueva. **Bitácora nº11**
      (el aviso lo daba un motor de hace 36 minutos; el guardián que
      lo sabía —comprobar-arranque, rojo— nadie lo invocó): «un
      guardián que hay que acordarse de invocar es documentación, no
      cobertura» + la ley del cable + la de la pieza compartida
      importable. 211 motor + 123 interfaz; las nueve juez al byte
- [x] ⚰️ RESUELTA («Farmacia + dirección», sin el titular — ver el cierre) · Decisión de presentación: 268/313 farmacias llevan
      nombre del titular (dato registral público; republicarlo es lícito
      pero es decisión consciente — la salida fácil: «Farmacia» +
      dirección al mostrar, sin editar el dato)
- [x] ⚰️ HECHA (el buscador por tipos con siglas e iconos) · El destino en el formulario: un tipo de destino nuevo (sitio) con
      el autocompletar existente; el contrato crece con el tipo del sitio
- [x] ⚰️ HECHA (/api/sitios y el enganche al grafo) · El motor: cargar las categorías autorizadas, sugerirlas, y
      resolver sitio → coordenada → enganche al grafo (el del punto 7)
- [x] ⚰️ HECHA (la casilla de portal se desactiva con sitio o vía sin portal) · **La regla del portal condicional** (parlamentada el 19/08): la
      casilla de portal se DESACTIVA y «Generar» no lo exige cuando el
      destino elegido no tiene portales — porque trae su propia
      coordenada (un hospital no tiene portal). La regla nace AQUÍ, con
      su primer caso real: construirla antes dejaría elegir destinos sin
      punto, cosa que ningún geocodificador permite
- [x] ⚰️ HECHA por otra vía (las vías sin portal entran por PUNTO MEDIO: 619 sugeribles — ver el cierre; la pieza de trazados no hizo falta) · **Las 628 vías sin portal,
      elegibles**: exige la pieza de TRAZADOS
      (`wfs_urbanismo-Vias`, ~3,4 MB MultiLineString, localizada en la
      investigación) y el patrón estándar [DOC Nominatim]: calle sin
      número → geometría → CENTROIDE como punto → enganche a la red.
      Sin la geometría no puede resolverlo ni el estándar — el requisito
      es el dato
- [x] ⚰️ El hueco se cerró con la poda del 27/08; lo que Antonio añadió después fueron las palabras vacías del buscador (30/08), ya dentro.

## 9 — Modo BICI/PATÍN PRIVADO y Modo BiZi — **⭐ CERRADO el
30/08** *(re-escrito el 28/08 con lo aprendido en el 7 y el 8;
parlamentado con Antonio; casillas 0-7 con sus bis en tres días de
tanda 28-30/08; la demo confirmada por el ojo; de fondo queda solo
la fase 2 [3-tris])*

TRES productos distintos sobre el mismo esqueleto — la casilla 0
demostró que sus tablas de acceso difieren POR LEY O POR CONTRATO,
así que se separan (fusionar obligaría a mentirle a alguien): la
bici PROPIA va puerta a puerta por cualquier calzada y remata en
aparcabicis; el PATÍN (VMP) solo puede pisar calzadas ≤30 km/h; el
servicio BiZi va ESTACIÓN A ESTACIÓN en tres tramos, es solo-bici y
lleva contrato encima (30 min incluidos · 2 h tope · término
municipal · eléctricas · 16+). Antonio firmó (28/08): el SELECTOR A
SEIS modos, la prioridad al carril bici, y el AVISO honesto de los
30 minutos [D-G]. Lo que el punto 7 dejó caducado (la penalización
por pesos de OSRM contra mínimo-de-distancia) se re-parlamenta en
la casilla 3 con las cifras delante, no se hereda a ciegas.

- [x] **0 · LA LEY HOY — RESUELTA (28/08, investigación del
      estratega con fuentes):** rige la **Nueva Ordenanza de
      Movilidad de Zaragoza, en vigor desde el 11/09/2024** (texto en
      el BOP del 21/08/2024; agrupa las ordenanzas dispersas — el NO
      CONSTA del 21/08 muere: la vieja del TSJA quedó sustituida).
      LA LETRA que afecta a la ruta: los VMP van obligatoriamente
      por carril bici/vías ciclistas y, como novedad, por calles de
      más de un carril con límite ≤30 km/h (carril derecho, no el
      reservado a transporte público) [web oficial de la Ordenanza];
      la bici por CUALQUIER calzada (preferente carril derecho,
      centro del carril) — ⇒ **bici y patinete NO comparten tabla**.
      Lo personal (no afecta a la ruta, se declara y ya): casco
      obligatorio en VMP · edad mínima 16 · seguro RC (BiZi exento).
      FINURAS de narración fichadas: en pasos de peatones SIN paso
      ciclista se cruza CON EL VEHÍCULO EN LA MANO (salvo
      continuidad ciclista, donde se rueda cediendo prioridad) · en
      zonas de especial protección peatonal, toda bicicleta
      prohibida. BiZi (normas y tarifas del servicio nuevo, fuentes
      oficiales): tabla de circulación = la de la bici (acera
      prohibida incluso con la estación EN la acera: a mano hasta la
      calzada) + ámbito ESTRICTAMENTE municipal (nuestra frontera,
      reutilizable) + **tramo incluido 30 MINUTOS** (después: 0,50 €
      la segunda media hora, 5 €/30 min pasada la hora) + tope 2 h +
      pedaleo asistido (2.500 bicis, 276 estaciones desplegadas) +
      prohibido a menores de 16. Sigue vigente del grueso: jamás
      acera [Ordenanza + 121.5 RGC] · quien EMPUJA es peatón [FAQ +
      Viena 20.5] · acera-bici a cota de acera [clasificación
      municipal]. EL RELOJ: el RGC reformado (RD 518/2026) entra en
      vigor el 01-10-2026 — las citas migran. Queda para la casilla
      2: los ARTÍCULOS exactos del BOP para la tabla fila a fila
- [x] **1 · EL CENSO — HECHO (28/08)** y seguido de LAS DOS
      DESCARGAS autorizadas POR DOCTRINA (la regla nueva de Antonio:
      la doctrina autoriza; su firma, solo para los huecos):
      · EL GRAFO: cycleway 4.675/191,5 km; los 27 h contados; ONEWAY
        confirmado ausente (9 campos barridos; el candidato d
        descartado por estadística). ⭐ HALLAZGO: §1.14 traía el
        juego de etiquetas ENTERO (oneway 9.875 · maxspeed 7.895 ·
        oneway:bicycle 20) — cruce por w ya usado por el motor.
      · ⭐ FUENTE NUEVA: MU1_jerarquia_viaria (WFS IDEZar, 3.644
        tramos: limite_vel/doble_sent/pacificada/plataforma).
      · CARRILES §1.5: casan por código 255/255 pero por geometría
        DOS MUNDOS — unidireccional-acera 100 %/bidireccionales
        88-97 % SON cycleway; Calmado 8 % y Senda 3 % NO (134 km son
        tertiary/track/path: el Anillo y calzada compartida);
        longitud_total de unidireccionales mide EL DOBLE (1,99, NO
        CONSTA el porqué). Senda ciclable/Ciclable: la mayúscula.
      · APARCABICIS §1.9: 2.158 puntos/14.544 anclajes (la cifra
        «5.520» del encargo era de OTRA ficha — §1.8 BiZi; el
        ejecutor recontó y corrigió), frontera 2.158/2.158.
      · BiZi: inventario YA en repo (§1.8, 276/5.520); API viva
        sondada — NO es GBFS (formato sede, sin clave, fresca al
        minuto, casa 276/276, bicisDisponibles/anclajesDisponibles);
        ⚠️ estadoEstacion ROTO en las 276 («no-operativa» el 100 %)
        — se usa `estado`, falso conocido.
      · VELOCIDADES citadas: Valhalla Hybrid 18 km/h defecto · OSRM
        15; ⚠️ NINGÚN motor tiene perfil de pedaleo asistido (NO
        CONSTA — la velocidad BiZi será [PROPIO]).
      · ELEVACIÓN: NO CONSTA en casa (vértices 2D, 34 capas sin
        cota); Valhalla usa servicio aparte (Skadi/use_hills) —
        candidata a fuera declarada.
      **LAS DOS DESCARGAS (28/08, `4ca53e0` `f843ea2`):**
      · §1.21 Overpass AMPLIADA (sin filtro name; out count previo
        65.223 = 3,3×, no desproporcionado; 11,3 MB; bbox del
        grafo): ways con entrada 35,6 %→99,9 %; oneway calzada
        urbana 39,2 %→65,2 % (1.030 km); maxspeed 37,6 %→41,7 %; la
        ganancia en lo SIN nombre (service 6→55 %); track sigue 0 %
        (2.156 km rurales sin etiquetar). NO pisa §1.14 MEDIDO: 30
        ways ya no existen, 7 siguen en el grafo (Plaza Salamero…) —
        dos fotos, las dos necesarias, guardián. Re-descarga: 1 byte
        (el reloj del corte).
      · §1.22 MU1_jerarquia (CRS verificado EN GRADOS sobre lo
        descargado; enganche 2.049/2.049 — la costura pedía ≥95 %):
        ≤30 → 2.584 tramos/498,8 km/1.603 vías · >30 → 659 · =0 →
        400 (395 peatonales); el 39 errata declarada; ⚠️ 141 rasgos
        con U+FFFD EN LOS BYTES (confinado a tramo/calle_2024;
        codigo intacto — no toca lo usado); licencia: la capa no
        declara (régimen Ley 37/2007 CON el NO CONSTA dicho).
        Re-descarga: 4 bytes (timeStamp WFS).
      · LA FOTO FINAL (calzada útil urbana 34.462/1.874 km): SENTIDO
        65,2 % aristas/55,0 % km, a oscuras 34,8/45,0 · VELOCIDAD
        combinadas 68,4/50,5, a oscuras 31,6/49,5 (con track todo
        cae ~10 puntos). ⚠️ DISCREPANCIA 17,5 % donde ambas hablan
        (2.283/13.057; primary con OSM 50 vs Ayto 30) — material del
        parlamento.
      · GUARDIANES: datos-de-la-rueda.spec.ts, 7 pruebas SIN
        importar módulos del motor (nada lo lee aún — fabricar un
        lector sería usarlo); contraprueba 7/7 tras DOS confesiones:
        el runner dio «fail 0» con 7 sin pasar (before() lanza y las
        CANCELA — la familia de la nº12) y la del CRS nació floja
        (aflojó la aserción en vez de mutar el dato; reformulada
        mutando el vértice a UTM, muerde). El contraflujo con
        candado propio (18 reales: Armas, Cádiz, Postigo del Ebro).
        El -1 no se aplasta (8).
      ⚠️ LA CORRECCIÓN DE SIRESA, REVERTIDA EL 30/08 (bitácora
      nº16): Antonio precisó la verdad del terreno — sentido ÚNICO
      HACIA el Doctor Iranzo — y el oneway original de OSM
      COINCIDÍA: mi fila del 29 codificó la QUEJA, no la
      dirección, e invirtió un sentido sano (del 29 al 30, el
      sentido verdadero no tenía ni ruta y el prohibido era el
      único posible — medido). La juez que exigí compraba el
      invariante equivocado DOS veces (afirmaba el -1 como
      correcto, y vigilaba una ruta que no pisa Siresa: trozos=0
      antes y después). LA LEY en dos mitades: al ojo se le
      pregunta LA DIRECCIÓN exacta, no se deduce de la queja · un
      guardián de sentido compra la dirección andable, nunca el
      resultado esperado. La tabla queda VACÍA Y VIVA (mecanismo,
      cerraduras y deshielo probados con fila de mentira); el
      cuadre al milímetro (+2,200 m ÷ +0,4400 s = 5,000 m/s, el
      crucero del patín clavado); re-meter la fila invertida =
      rojo. Y LA SONDA de movilidad que salió del mismo hilo: 43
      capas en el servicio; IML Viales 2025 RESUELTA con ficha
      oficial (= intensidad media laboral, AFOROS por sentido de
      circulación — no es la capa de sentidos; a la NEVERA como
      materia prima del calibrado Tranquila [CycleStreets puntúa
      por busyness]); ⚰️ MU2_señalizacion_vertical SONDADA
      el 30/08 y DESCARTADA como capa-de-sentidos POR DISEÑO:
      40.863 señales con 13 campos y NINGUNO de orientación (sin
      hacia-dónde-mira, ni un código perfecto daría la dirección);
      enganche a vía por texto sucio; las fotos por señal son otro
      servicio y ojo humano. La horizontal (644.596): geometría con
      color, cero semántica. EL ATAJO REAL de la fase 2: las shapes
      del GTFS (verificadas el mismo día — 89 trazas direccionales
      al 100 %), cuando el punto 10 arranque.
      · Manifiesto 39 resources; el panel pinta las dos filas en
        gris NO CONSTA (sin periodicidad citable — aplicar la del
        callejero sería citar política de otra capa). Ley nº3 sobre
        clon autocrlf=true. Motor 313 · app 154.
      · Por descubrimiento: §1.21 desplazó numeración («El resto del
        dato» → §1.23, borrada sin querer y recuperada); la ficha
        §1.14 se queda corta en su «Qué es» (dice «nombres», trae
        260 etiquetas) — vista, no tocada, dicha
- [x] **2 · LAS TRES TABLAS — HECHAS (29/08) contra el ARTICULADO**
      (el BOPZ nº192 del 21/08/2024 y el PDF de la sede bajados los
      DOS y comparados al carácter en los diez pasajes que gobiernan:
      10/10 idénticos; 116 artículos). ⚠️ DOS re-verificaciones que
      CORRIGEN la casilla 0 — el texto manda: (a) el patín NO es
      «solo ≤30»: el art. 56 es JERARQUÍA (56.2.c: obligatoriamente
      por vía ciclista) + LISTA CERRADA subsidiaria (56.3: ciclo-
      carriles · vías pacificadas/zona 30 · zonas 20 y residenciales
      · y SOLO para multicarril el «≤30» — 56.3.d exige más de un
      carril); la suerte: MU1 trae LAS CATEGORÍAS (pacificada 2.575
      tr/497,1 km · calle_z30 · plataforma · residencia ·
      carril_vh>1∧limite_vel≤30 = 178 tr/46,4 km); (b) la ordenanza
      SE CONTRADICE en el carril bus (50.6 prohíbe · 67.1 permite ·
      la bisagra del 16 exige resolución señalizada NO publicada:
      MU1 dice dónde hay carril bus — 36 tr/15,3 km — nadie dice
      cuáles autorizados → NO CONSTA). LAS TABLAS: BICI 18 filas
      (cycleway 50.5.a/54.2 con prioridad de paso · toda calzada SÍ
      por el carril derecho-centro 50.5.d/50.9 · living_street a 20
      [23.c] · track rural SÍ [15.2.c.i] · aceras/peatonales NO
      [50.6] · pasos en la mano salvo continuidad [54.4] · zonas
      verdes ≥3 m ⚠️ sin dato de ancho · especial protección [47]
      NO ⚠️ sin dato de dónde · motorway/trunk [PROPIO: fuera por
      construcción, a=0]) · PATÍN montada SOBRE MU1 (la lista
      cerrada campo a campo; >30 NO seco 659 tr; 16 años [56.2.a],
      la excepción de menores de la bici no aplica) · BiZi = LA DE
      BICI SIN UNA CELDA DISTINTA (verificado contra las normas del
      servicio) + ⭐ EL ÁMBITO MUNICIPAL ES RESTRICCIÓN DE VÍA
      (prohibido iniciar/finalizar/circular fuera — nuestra frontera
      de la validación espacial, reutilizada). LOS SEIS HUECOS
      CERRADOS POR DOCTRINA [las tablas de acceso-por-defecto legal
      por vehículo×vía de la wiki de routing — «yes = permitido
      salvo etiqueta en contra», codificadas por los motores (ORS
      las trabaja; GraphHopper prefiere lo explícito)]: H1 track y
      H2 los 5,2 km del patín → NO por lista cerrada (el defecto
      fuera de lo enumerado es no; las tablas codifican la regla
      escrita, no analogías) · H3 carril bus → NO por defecto (el
      tag cycleway=share_busway es el mecanismo del autorizado, y
      sin dato no hay tag) · H4 especial protección → limitación
      DECLARADA (sin dato de dónde: cero capas, cero rutas) · H5
      ancho zonas verdes → declarado no-modelable (width en 610 de
      65.223) · H6 path → el defecto legal español por tipo de vía
      de la tabla OSM. DOS MATICES: «empujando se es peatón» se
      sostiene POR EL RGC (121.2 — la ordenanza no lo dice; su 43
      define peatón a secas) ⚠️ y el RD 518/2026 lo migra al
      122.2.a EL 01/10 (las citas RGC de estas tablas caducan esa
      fecha) · la ordenanza da DOS velocidades al carril
      (25 «segregación física» 50.1 · 30 «protegidos» 54.2.b —
      verificado en los dos textos: NO CONSTA si son categorías
      distintas; ambos coinciden en acera-bici 20)
- [x] **3 · EL COSTE DE LA RUEDA — HECHO (29/08, cuatro commits del
      ejecutor) + EL DEFECTO LEGAL DEL ART. 50 RGC.** LA DEMOSTRACIÓN
      PREVIA que el PARA exigía: el orden de vértices del grafo ES el
      de OSM — 112 rotondas antihorario/0 horario · 22.999 ways
      partidos encadenando cabeza-cola sin una inversión (sin esto,
      984 km a contramano sin rojo). LA RED DE LA RUEDA APARTE
      (58.914 aristas · 4.625 km · +478 ms): la rejilla no se filtra
      — el portal habría enganchado a la acera; dos redes, dos
      verdades. El SENTIDO con cuatro orígenes (22.867 oneway · 27
      al revés · 1.390 rotonda implícita [junction=roundabout, la
      implicación documentada] · 13 contraflujo) · TECHO legal
      municipal-manda (34.014 · 2.007 OSM) · PREFERENCIA al carril
      [factores OSRM unsafe como respaldo] en 8.147 con tráfico.
      ⭐ EL DEFECTO DEL ART. 50 RGC [RD 970/2020, BOE: 20 plataforma
      única · 30 UN carril por sentido · 50 dos o más; la señal
      manda, el defecto rellena — la práctica de aplicar el defecto
      legal donde no hay señal]: 125+2.234+598 por dato + 7.227
      [PROPIO-por-tipo: residential/living_street/service = un
      carril; unclassified FUERA a propósito — las hay de dos] ·
      quedan 12.709 a oscuras (la verdad). carril_vh DESCARTADO con
      contraejemplo (105 tramos incompatibles con toda lectura —
      semántica NO CONSTA); los carriles, de lanes (que no descuenta
      reservados: cuenta DE MÁS y empuja al 50 — se equivoca hacia
      el lado que CIERRA al patín, declarado). EL PATÍN: 35/200 →
      51/200 (164→243 sobre mil); su red 1.988 trozos, el mayor
      45,4 %. ONCE JUECES con cifras (la preferencia paga +1,9 % y
      compra 1.101 m de carril · contraflujo 63 vs 716 · ida 1.559/
      vuelta 2.017 · el patín rodea la Avda. de Madrid · BiZi ni
      engancha fuera · 20/18 exacto · Espronceda a 10 · la rotonda
      al revés 548 vs 26 · el Camino del Saso por DEFECTO_POR_TIPO ·
      la señal >30 veda 5.544 · LA MURALLA: sha256 de las 391 rutas
      del peatón —geometría a 7 decimales y 9.346 pasos— IDÉNTICO a
      HEAD, dentro de la suite). La juez 4 cambió A MEJOR con lupa
      (la Avda. de Madrid no es uniforme: pacificada = un carril Y
      ≤30, y ahora se saben los carriles por tramo — la derivación
      por arista es más fina que mi agregado por vía, decisión
      declarada). CONTRAPRUEBA 8+4 mutaciones — la de la rotonda NO
      mordía (implicación puesta y sin vigilar: 1.390 aristas
      abriéndose en silencio → juez 8, el patrón de la nº14) · cero
      pruebas del peatón afectadas en las doce. DOS confesiones de
      instrumento: el comentario «el veto p=acera no quita nada» y
      el dato dijo 1 (Valle de Zuriza — reescrito con el caso) · ⚠️
      MIDIÓ CONTRA UN MOTOR VIEJO (EADDRINUSE, zombi en el 3000: 35/
      200 otra vez y cero rutas nuevas — cazado, y desde entonces
      cada medida lleva pid-del-log == pid-que-contesta). Decisiones
      declaradas: carril_bus NO cierra la vía (el campo dice que
      TIENE carril reservado, no que lo SEA) · 10 de los 18
      contraflujos en calle peatonal: manda la ley sobre el tag
      [50.6], quedan 8 · MU1 heterogéneo al más restrictivo · pasos
      empujando a 5 salvo 14 con continuidad evaluada en topología.
      Flecos declarados: el botón viejo «Bici/Patinete» manda bici y
      YA devuelve ruta (un patinete recibe ruta de bici — URGE la
      casilla 4) · los carriles narran «el carril bici» sin nombre
      hasta la 5 · /api/salud no publica la red nueva · doble_sent
      sin uso · bicycle=no de OSM (29) fuera del alcance. 327 motor
      · 154 interfaz. **EL PARLAMENTO PREVIO (29/08, cuatro
      sillas):**
      (1) EN EL 17,5 % DE DISCREPANCIA MANDA EL MUNICIPAL [maxspeed
      de OSM se define como el límite LEGAL; el emisor del límite
      urbano es el Ayuntamiento y MU1 es su registro; la
      investigación trata la exactitud de OSM como suposición
      declarada; los consumidores completan OSM con conocimiento
      legal] — limite_vel donde hable, OSM rellena, la fuente por
      arista declarada. (2) «CARRIL BICI» PARA LA PRIORIDAD =
      h=cycleway, la infraestructura dedicada [Valhalla: preferencia
      por cycleways, favorecidos por defecto frente a calzadas] — el
      Calmado es calzada sin bonus y la Senda camino modulado por
      superficie; la capa §1.5 sirve al acera-bici y la narración,
      no a la prioridad. (3) VELOCIDADES firmadas: privada 18
      [Valhalla Hybrid/City, doctrina] · BiZi 20 [PROPIO firmado —
      entre el 18 urbano y el corte legal de asistencia a 25
      [UE 168/2013 · RD 970/2020 · EN 15194]] · patín 18 [PROPIO
      firmado — sin perfil VMP en ningún motor, medido].
      (4) ELEVACIÓN FUERA declarada [OSRM publica su perfil de bici
      sin mencionar elevación: precedente de motor]. QUEDA para el
      encargo del coste: el mecanismo concreto de la preferencia
      (cuánto favorece el cycleway), diseñado contra la doctrina y
      medido en nuestra red — la bici usa preferencia, no
      mínimo-de-distancia puro [doctrina Valhalla; el reverso del
      peatón, declarado]
- [x] **3-bis · LA AUDITORÍA DE SENTIDOS — FASE 1 HECHA (29/08, dos
      commits)**, nacida del OJO DE ANTONIO sobre una ruta (la bici
      subía Monasterio de Siresa a contramano — way 24433275, OSM lo
      declara al revés de la calle real; el diagnóstico previo
      demostró que NO había fallo del motor: 79/79 sentidos a favor
      DEL DATO, y el dato estaba mal — la clase de error que ningún
      detector automático caza [QA wiki: un oneway invertido es
      topológicamente limpio; verifica el local]). EL SISTEMA, no el
      parche [Antonio: «de nada sirve ñapear Siresa sin referencia
      de qué estaba mal y qué arregló la corrección entera»]:
      (1) SIRESA CORREGIDA con mecanismo: sentidos-corregidos.ts
      [el 9090 + la tabla de reparaciones de CycleStreets] — una
      fila (yes→-1, fuente: conocimiento local 29/08), TRES
      cerraduras (si §1.21 sana o el way muere, el motor NO
      ARRANCA), el log declarando way+motivo, la ruta viva (COLOSO→
      ROMEO ya sin pisar Siresa: 10 pasos) y EL GUARDIÁN DEL
      DESHIELO (lee §1.21: el día que una re-descarga traiga el way
      arreglado en OSM, rojo avisando de jubilar la corrección).
      (2) LA SONDA-CYGNUS [Telenav: conflación del dato
      gubernamental contra OSM, resultado para VERIFICAR — nunca a
      ciegas; la clase de error con nombre: TrafficFlowDirection,
      67.000 detectados/6 % falsos positivos] — doble_sent municipal
      × oneway OSM sobre las 1.758 vías que se hablan: A1 71 vías/
      8,5 km (MU1 único, OSM calla — la bici las remonta hoy) · A2
      182 mixtas · B2 25/1,8 km (OSM único, MU1 doble — rodeos de
      más) · B1 156 APARTADAS con medida (avenidas de doble calzada:
      rumbo >120° entre ways = modelado legítimo, el 98,8 % de los
      metros de la clase eran ruido — la confesión: la primera sonda
      los contaba) · ⚠️ EL PUNTO CIEGO CUANTIFICADO: 1.185 vías/
      299,8 km donde ambas dicen «único» y la sonda no ve el LADO —
      la clase Siresa vive ahí (solo ojo o las trazas GTFS del 10).
      LA LISTA (434 filas, scratchpad) espera EL OJO DE ANTONIO: ni
      un candidato corregido sin verificar. (3) EL BANCO DE
      REFERENCIA [el patrón del testigo del Andrés Oliván]: nueve
      testigos ⚠️ EN VERDE documentando la conducta mala de HOY con
      su ida y su vuelta medidas («Santiago Guallar: 15,5 m de calle
      que cuestan un rodeo de 554,2») — escritos PARA CAERSE cuando
      Antonio confirme y la fase 2 corrija: el acta de qué estaba
      mal y qué lo arregló. La contraprueba 4/4 (la cerradura del
      deshielo tira 58) — ⚠️ y el runner reincidió en el «fail 0»
      con 58 sin pasar [la familia de la nº12: leer pass, no fail].
      La muralla del peatón al byte. 332 motor.
- [x] ⚰️ FUERA DEL PUNTO (1/09, por orden de Antonio: «tiene que estar cerrado»): la fase 2 no es casilla del 9 — es MANTENIMIENTO DEL DATO a goteo, fichado en la NEVERA del estado (la lista de 434 y el atajo de las shapes del bus). · **3-tris · FASE 2:** las
      correcciones EN TANDA contra la lista verificada — cada una
      con su fila fuente-y-fecha, su testigo del banco cayéndose
      (rojo→reescrito a la conducta buena) y su deshielo. Y aguas
      arriba: los arreglos en osm.org que Antonio quiera (el flujo
      canónico [Telenav/HOT: detectar → verificar → editar OSM]) —
      la re-descarga futura los trae y los deshielos jubilan
      correcciones.

- [x] **4 · EL SELECTOR A SEIS — HECHO (30/08, dos commits) y VISTO
      por el ojo de Antonio.** El hallazgo semántico que obligaba a
      migrar: el control viejo PARECÍA grupo (fieldset+legend) pero
      no lo era — aria-pressed dice «pulsado», no «uno de un
      conjunto»; cada botón su parada de tab, flechas muertas. Y
      SEIS supera el techo documentado del control segmentado (2-5
      con etiqueta [Primer/Gravity]) → GRUPO DE RADIOS NATIVO
      [radiogroup de referencia; rango 2-7]: seis label+input
      type=radio con name compartido — parada única, flechas y
      exclusión LAS DA EL NAVEGADOR, cero JavaScript; el vestido
      visual, idéntico. Etiquetas: Andando · Bus / Tranvía · Bici
      privada · Patín (VMP) [la señal de la calle — sustituye al
      «Patinete» del botón fusionado del 18/08] · BiZi · Coche.
      ANCHOS medidos por CDP en Chrome real (una fila hasta 760 px;
      dobla solo por el flex-wrap ya puesto; NADA truncado ni a 320
      [«do not truncate»]) con el MEDIDOR CONTRAPROBADO (recorte
      inyectado a la página viva: cantó 3; quitado: 0). El TECLADO
      probado por CDP con eventos reales (jsdom no implementa las
      flechas de un radiogroup): tab único, flechas recorren y
      seleccionan, da la vuelta. La juez estrella NACIÓ en rojo
      contra el fallo vivo («no hay ninguna opción que se lea Patín
      (VMP)») — el patinetero solo tenía el botón de la bici. Diez
      jueces + contraprueba 5/5 (el defecto sostiene 38). La juez 4
      desde el tubo con pid verificado: bici 1.565 m pisando 110 de
      la Avda. de Madrid · patín 1.972 y cero. ⚠️ BUS Y COCHE
      cambian de conducta CON MEDIDA (visto y aceptado): la pantalla
      avisa sin preguntar al motor — el mensaje viejo MENTÍA con el
      motor caído («no se pudo preguntar» cuando el coche no
      depende del motor) y el aviso del motor enumera palabras
      internas; reversible en dos líneas si algún día toca. La
      confesión: un git checkout sobre fichero sin commitear se
      llevó la implementación a mitad de contraprueba — recuperada
      de copia, contado. README al día en commit docs: aparte [la
      atomicidad]. 161 interfaz · motor intacto 332
- [x] **5 · LOS MODOS PRIVADOS — HECHA (30/08, con la 6 en un
      encargo doble [doctrina OTP BICYCLE_PARK/vehicle-parking:
      «dejar la bicicleta y andar hasta el destino», con capacidad
      y filtro de disponibilidad]).** EL REMATE: bici y patín van
      en TRES tramos — rodando hasta el aparcabicis más cercano al
      DESTINO (portal-cercano sobre los 1.914 ENTRANTES de §1.9:
      Abierto+Vigilado; Cerrado FUERA por semántica NO CONSTA
      [lado seguro]; 12.117 anclajes) · hito «Aparca en el
      aparcabicis de [calle] — N anclajes» (dato estático: SIN
      prometer hueco) · andando al destino por el motor del
      peatón. ⚠️ TOPE de 500 m andando [PROPIO del ejecutor, con
      números a la mesa: sin tope, p99 = 5,6 km y máximo «anda
      11,6 km»; con 500 el 86,3 % de portales rematan y el resto
      va a-la-puerta con aviso — Antonio puede mover la constante]
      · ⭐ el patín pasó de 83 a 98/200 (el remate le quita la
      exigencia de puerta rodable en destino). LOS NOMBRES: la
      herencia §1.15 corre sobre la red de la rueda (652 ways
      mudos → 579 heredan; los que callan: disputa 33/cobertura
      29/sin eje 11), el name OSM propio manda, y el vestido «el
      carril bici de X» [PROPIO] con su regla vigilada (solo si el
      tramo entero es carril — la juez nació de la contraprueba:
      quitarla dejaba 346 verdes cambiando 125/200 narraciones).
      EL RÓTULO: «pedaleando a 18/20 km/h de crucero». El caso del
      ojo: bici 4.587 m (4.535 + 52 a pie al aparcabicis de
      Monasterio de la Rábida — 5 anclajes); patín 4.867 al mismo
      soporte
- [x] **6 · EL MODO BiZi — HECHA (30/08).** TRES tramos [OTP modo
      alquiler: andar+pedalear+andar] — a la estación de ORIGEN más
      cercana CON bicisDisponibles>0 e IN_SERVICE · pedaleando a 20
      · a la de DESTINO CON anclajesDisponibles>0 (la llena/vacía
      SE SALTA [el filtro de disponibilidad de OTP]) · andando al
      destino. LA CONSULTA VIVA EN CADA Generar [GBFS:
      station_status es feed DINÁMICO; el mapeo declarado:
      bicisDisponibles≡num_bikes_available ·
      anclajesDisponibles≡num_docks_available · estado≡renting;
      estadoEstacion ROTO no se usa — y su lector probado con la
      contradicción real dentro]. LOS HITOS con dato y hora de ESA
      estación [GBFS last_reported]: «Coge una bici en la estación
      X — N bicis disponibles a las HH:MM» / «Deja la bici en la
      estación Y — M anclajes libres a las HH:MM». API caída → D-G
      completo: hitos SIN número ni hora + AVISO «disponibilidad no
      verificada» (⚠️ vivido el mismo 30/08: la API municipal
      contestó 200 con CUERPO VACÍO horas seguidas — el D-G saltó
      bien; la bitácora nº15 nació de que NADA vigilaba que el
      aviso se pinte conviviendo con pasos [la regla vieja:
      avisos ⇒ sin ruta; la ley: cuando una regla del contrato se
      ENSANCHA, ve a buscar a los guardianes apoyados en la
      estrecha — no van a avisar]; ⚠️ y la sonda del checkpoint 5-6
      buscaba los avisos por clases que no existían: el
      instrumento no podía verlos, dicho en la entrada). El aviso
      de los 30 min DENTRO. La estación 276 (mantenimiento) llega
      SIN campos → se lee con comprobación, no ?? 0 (cero ≠ no se
      sabe). ⚠️ En BiZi el trío precargado dispara TRES consultas
      al Ayuntamiento por Generar — la salida limpia (fundir las
      en-vuelo, que NO es cachear) espera decisión de Antonio ·
      ⚠️ el aviso ámbar queda lejos de los hitos (quince pasos) —
      colocación, si Antonio quiere casilla. BiZi del caso: 4.774 m
      (127 a pie + 4.545 pedaleando + 160 a pie; Tauromaquia →
      Mrio. Siresa: Dr. Iranzo)
- [x] **6-bis · EL EMPUJE — HECHO (30/08, ADELANTADO POR ORDEN DE
      ANTONIO; dos commits; auditado antes de mandar: la juez vacía
      de zonas de protección QUITADA [H4: sin dato no se vigila] y
      la narración CITADA).** DOCTRINA completa: la tabla canónica
      de acceso [«el acceso se concede en toda situación a quien
      empuja»] · OSRM bicycle walking_speed=4 · el tramo empujado
      como PASO PROPIO [OSRM: campo mode por paso, «pushing bike»,
      con suite de «todos los empujes y cambios de modo»; el
      despliegue de Copenhague lo enseña] · OTP modo SCOOTER
      (andar+rodar+andar) · 121.2 RGC · 5,0 km/h coherencia de casa
      declarada (OSRM usa 4). LO HECHO: la red de la rueda gana
      33.770 aristas/1.016 km peatonales en modo EMPUJANDO (a 5,
      factor el MÁXIMO de la tabla — derivado por calibrado 1/2/4,
      no fijo: solo puede ganar por tiempo); protección especial NO
      modelada (H4 declarado). EL CASO DE ANTONIO: patín COLOSO→
      ROMEO 5.741→4.551 m (45 m en la mano ahorran 1.190; iguala a
      la bici — «la barrera no era el vehículo, era no poder
      bajarse»); patín 51→83/200, su red 1.988→721 trozos (el mayor
      45→70 %). La bici TAMBIÉN mejora (4.805→4.551 por el mismo
      cruce legal — visto por Antonio). Cinco jueces + 2-bis el
      INVARIANTE (282 rutas: el coste del montículo no sube en
      ninguna) + contraprueba 5/5. TRES arreglos vistos midiendo:
      el enganche caía en la acera del portal (45,7 % — la puerta
      separada de lo transitable, admiteComoPuerta) · con factor 1
      el empuje lo compraba la preferencia, no el tiempo (medido: 9
      s peor — de ahí el factor-máximo) · 6 jueces pinchaban índice
      de arista y la red creció (anclados al way). El rótulo «a 5
      km/h» QUITADO en rueda (no mentir; el fino a la 5).
      Confesión: los reconstructores de tramos se comieron el dato
      nuevo en silencio ×3 — «los tipos primero» (lección del
      ejecutor, aplicada en el encargo siguiente). ⚠️ DESAJUSTE
      DECLARADO Y NO TOCADO (cabo): el montículo minimiza
      tiempo×factor y la respuesta reporta el reloj SIN factor — la
      ruta ganadora puede no ser la más rápida del reloj (159↓/18↑
      en 282); arreglarlo es decidir QUÉ se reporta (parlamento
      pendiente). 337 motor · 162 interfaz

- [x] **6-tris · EL SELECTOR DE RUTA — HECHO (30/08, dos commits,
      VISTO por Antonio; nacido de su pregunta «¿amateur o pro?»).**
      DOCTRINA CycleStreets (el planificador de referencia), API
      oficial: los tres tipos [balanced «recomendado como DEFECTO —
      práctica, equilibra velocidad y agrado» · fastest «vías con
      más tráfico, ciclista confiado» · quietest «más agradable, a
      menudo menos directa»; shortest DESACONSEJADO — avala el
      coste-por-tiempo]; la mecánica del tranquila [puntuación
      INVERSA a la clasificación: primary «muy hostil» — nuestra
      tabla de factores ES esa escala]; el dial en el motor
      [Valhalla use_roads 0-1, defecto 0,5 = lo de hoy]; la
      PRECARGA de los tres tipos del mismo viaje [el patrón del
      planificador: saltar entre ellos sin replanificar]. FIRMAS de
      Antonio (30/08): Tranquila = la tabla AL CUADRADO (4,0/2,37/
      1,56/cycleway 1) [PROPIO] · el PATÍN SIN selector, SIEMPRE el
      fuerte [56.2.c: vía ciclista obligatoria — no es gusto, es
      ley]. Rápida = factor 1. /api/ruta con `ruta` opcional;
      «¿Qué ruta prefieres?» solo en bici/BiZi [revelado GOV.UK];
      Generar trae LAS TRES en paralelo y el radio repinta SIN
      petición (contadas: 3 al generar, 0 al saltar). Las tres del
      par juez: Rápida 2.986 m/0 carril («el confiado», literal) ·
      Equilibrada 3.049/1.304 · Tranquila 3.048/1.339. El PATÍN
      recalibrado por la firma: COLOSO→ROMEO 4.551→4.832 (compra
      287 de carril, hostilidad 510→191; la Avda. de Madrid a CERO
      tráfico) — sigue 909 mejor que pre-empuje. El factor del
      empuje DERIVADO por calibrado (1/2/4 — la regla «el máximo»
      entendida, no copiada). Honestidades escritas: la hostilidad
      de Equilibrada > Rápida en un par (ninguna minimiza
      hostilidad — en la juez para dentro de un mes) · el rótulo
      redondea 1.554 y 1.565 a «1,6 km» los dos · dos tropiezos de
      instrumento declarados (la métrica que medía otra cosa; el
      http.match que consume). comprobar-tipos PRIMERO, cumplido.
      342 motor · 167 interfaz

- [x] **6-quater · EL PINTADO POR TRAMOS Y LOS HITOS — HECHO
      (30/08, con un PARA de libro en medio).** El ejecutor PARÓ
      sin escribir una línea: el pintado exigía tres cosas que la
      respuesta no decía (dónde acaba cada tramo — no derivable:
      los metros de los pasos van redondeados y la derivación
      erraba hasta 6,9 m; cuál de los 212 vértices es el hito; qué
      trozos se empujan — solo vivía en el texto, y parsear la
      frase está prohibido por contrato). LA SOLUCIÓN [el modelo de
      la referencia: los itinerarios son LEGS tipados por modo
      (OTP legs{mode}) y el empujado es paso propio (OSRM mode
      «pushing bike»)]: el contrato gana `tramos`
      (TramoDelViaje{comoSeVa·desde·hasta·metros·segundos·hito} —
      el campo hito nació de necesidad demostrada: dos costuras
      idénticas por comoSeVa) sobre la geometría única; los
      índices CIERRAN y las cifras SUMAN el total (la juez
      tautológica cazada por su contraprueba: el total salía de
      sumar redondeados — rehecha, 969≠970 muerde). EL VESTIDO
      [Leaflet dashArray + L.divIcon con iconAnchor; WCAG 1.4.1
      verificado: el color no puede ser lo ÚNICO]: a-pie = el
      ámbar discontinuo DE SIEMPRE (el andando puro, intacto al
      píxel — su juez de no-regresión) · rodando = SÓLIDO, y desde
      la tarde AZUL #2563eb [PROPIO firmado por Antonio: azul
      medio — elegido MIDIENDO: misma luminancia que el ámbar
      (0,153 vs 0,159), peor contraste 3,45:1 contra el 2,45 del
      ámbar] · el empuje sale ámbar discontinuo EN MITAD del azul
      sin programarlo aparte (la BiZi real pinta CINCO líneas, no
      tres — el empuje partido). LOS HITOS 🚲/🅿 en
      geometria[tramo.hasta] — el vértice a 0,0 m del dato (⭐ el
      icono cae ENCIMA del símbolo de estación que OSM dibuja:
      confirmación externa). Confesiones: el conector de la puerta
      quedaba fuera de todos los tramos (cazado por el comprobante
      de invariantes) · la juez del transform vacío en jsdom
      (Leaflet coloca por left/top) rehecha a mover-el-índice ·
      Leaflet RECORTA la geometría al viewport (el d del path mide
      lo dibujado, no la ruta — leído bien, no como fallo). WCAG
      por partida doble: color Y trazo separan cada uno por su
      cuenta. 364 motor · 176 interfaz

- [x] **7 · LA DEMO — VISTA Y CONFIRMADA por Antonio (30/08).** El
      ojo pasó por los tres modos de la rueda con casos reales y sus
      vueltas: bici con su remate de aparcabicis · patín con su
      calibrado fuerte y el empuje cruzando en la mano · BiZi con
      sus estaciones, sus números vivos y su D-G con la API caída ·
      el selector de ruta saltando entre las tres precargadas · el
      pintado por tramos con el azul y los hitos · el buscador con
      las vacías. Veredictos literales: «las rutas, de puta madre» ·
      «funciona muy bien» · «lo armé y ya vi que funciona». ⚰️ Y EL
      TOPE DE 500 m FIRMADO por Antonio (30/08): «me parece correcto
      porque hay muchos desperdigados por la ciudad» — deja de ser
      [PROPIO del ejecutor] y pasa a decisión de producto.

      **⭐ CON ESTO, EL PUNTO 9 QUEDA CERRADO** (las casillas 0-7
      con sus bis; quedan como trabajo de fondo la FASE 2 de
      sentidos y dos decisiones menores de la mesa: la colocación
      del aviso · la sonda de la señalización vertical. ⚰️ FUNDIR
      LAS CONSULTAS: HECHO el mismo 30/08 [request coalescing /
      single-flight, el patrón con nombre: las concurrentes
      idénticas comparten UNA ejecución y la referencia se suelta
      al resolver — no es caché]: 3→1 visitas al Ayuntamiento por
      Generar, 6→2 en dos Generar (la frescura firmada intacta,
      su juez re-corrida), el D-G compartido comprobado con la
      sede aún caída, y el regalo no pedido: las tres rutas del
      trío hablan del MISMO momento).

## 10 — Modo BUS/TRANVÍA — **⭐ CERRADO el 1/09/2026** *(arrancó la
noche del 30/08 con nueve reglas y el calendario verificado; el
censo, el cron, la cocina, el viaje, los desvíos, la pantalla y los
pulidos en tres días; la demo confirmada por el ojo el 1/09:
«funciona perfecto»)*

*(Anotado el 29/08, de la auditoría de sentidos:)* las SHAPES del
GTFS son trazas direccionales reales (el bus recorre la calle en su
sentido) — cruzarlas contra el oneway de OSM caza los INVERTIDOS
clase-Siresa en toda calle con línea [el método ImproveOSM: la
direccionalidad de las trazas, umbral ~90 %; el punto ciego de la
sonda-Cygnus: 1.185 vías donde ambas fuentes dicen «único» sin poder
comparar el lado].

*(⭐ EL NAP COMPROBADO EN VIVO el 30/08 por la noche, del mosqueo de
Antonio con el 05/10:)* la ficha pública del Transporte urbano de
Zaragoza dice **«Actualizado el 30/6/2026»** — NO hay feed nuevo:
lo servido sigue siendo la build que bajamos el 10/08. El NAP
declara el rango 16/9/2025–27/12/2026 (la foto del calendario
completo), y nuestro 05/10 es el feed_info DE DENTRO: hasta cuándo
el editor GARANTIZA la información — lo de después existe pero
viaja sin garantía. La conservadora era correcta; el cron de la
casilla 2 vigilará ese «Actualizado el». ⭐ Y EL PORQUÉ, del
conocimiento local de Antonio (30/08): la semana del 5 de octubre
empiezan LAS FIESTAS DEL PILAR — horarios y rutas cambian por
fiestas durante casi dos semanas, así que Avanza garantiza hasta la
víspera y lo esperable es UN FEED NUEVO con los servicios del Pilar
justo antes. Consecuencias: el cron tendrá cambio real que cazar en
semanas (estreno con sentido), y la D-MAPA-DE-HOY firmada el 17/08
luce exactamente ahí (los especiales de fiestas activados se
pintan; lo suspendido, no). Regalos de la ficha para
el censo: paradas declaradas 984 (vs 944 postes MU3 — el descuadre
de 40 con número antes de empezar) · declara incluir TARIFAS y
accesibilidad (a verificar en el zip) · 1 aviso de validación
(agency_url) · la ficha vive en el detalle 975 del NAP y nuestro
fichero se llama ficha1176 — el porqué NO CONSTA, apuntado.

*(⭐ VERIFICADO el 30/08 con sonda de solo lectura sobre el feed del
repo:)* **shapes.txt ESTÁ y cierra por los dos lados** — 89 trazas ·
27.603 puntos (66-1.176 por traza) · el 100 % de los 34.427 trips
con su shape_id · cero huérfanas y cero referencias rotas · frontera
pasada (el bbox es la ciudad y su comarca). La pregunta de Antonio
(«¿hay capa con la traza del bus calle a calle?») tiene el SÍ: la
traza es la polilínea; el «calle a calle» con nombres sale de
cruzarla contra el callejero — trabajo de este punto. ⚠️ Dos
verrugas fichadas: shape_dist_traveled viene como columna VACÍA en
los 27.603 (que la columna esté no es que el dato esté) · 8 rutas de
routes.txt sin ni un viaje en el feed (53 rutas, 45 route_id en
trips — por mirar aquí).

**⚠️ ESTADO DE LAS REGLAS AL 31/08 — «NO HAY FIRMAS, HAY DOCTRINA»
(palabra de Antonio, repetida con razón): las nueve de abajo se
escribieron el 30/08 como «firmas»; el 31/08 la literatura las
revisó una a una:** 1 transbordos siempre → vigente · 2 vehículo
único → REFORMULADA: no absoluto («no optimizamos por menos
transbordos: absurdos» [OTP]) sino boardCost 600 por subida · 3
buses al empate → RETIRADA (la doctrina no trae número para
penalizar el tranvía; su ejemplo va al revés, RAIL 0,85) · 4 radios
500/800 → DEGRADADOS a estándar de planeamiento (el límite de
acceso es de RENDIMIENTO [OTP2, «ponerlo alto»]; decide
walkReluctance 4) · 5 colores de ZetaBus → vigente · 6 = la 2 · 7
comprobación en vivo → vigente (v2) · 8 pintado BiZi extendido →
vigente · 9 transbordo 500 m + 120 s → vigente. Lo que sigue es el
texto original, conservado como historia.

**⭐ REGLAS DE PRODUCTO (30/08, al cierre del 9 — el texto original):**
1. TRANSBORDOS SIEMPRE POSIBLES entre bus y tranvía (el
   planificador completo, no el directo-solo).
2. PRIORIDAD AL VEHÍCULO ÚNICO: si se puede llegar con un solo
   medio, ese gana.
3. A IGUAL NÚMERO DE VEHÍCULOS, LOS BUSES GANAN: 1 bus + 1 tranvía
   pierde contra 2 buses.
4. LOS RADIOS DE BÚSQUEDA DE POSTE (firmados el 30/08 con la
   doctrina delante): **500 m al BUS · 800 m al TRANVÍA** — dentro
   de la horquilla documentada [la regla de la industria 400/800:
   El-Geneidy «bus y rail rules of thumb»; FHWA: 400-800 m
   «generalmente aceptable»; y el matiz doctrinal «la gente anda
   MÁS hacia el servicio más rápido» = más radio al tranvía]; los
   500 del bus son la palabra de Antonio («5-6 minutos andando») y
   la simetría de casa con el aparcabicis. Aplicados como allí:
   radio de BÚSQUEDA con aviso honesto si no hay poste, no
   frontera a cuchillo [la propia doctrina: mediana real 294 m,
   p85 por encima de 400 — es radio razonable, no prohibición].
5. LOS COLORES DE LÍNEA, DE ZETABUS (anotado el 30/08 de la sesera
   de Antonio): cada línea de bus tiene SU color oficial, y ese
   color viste la traza pintada en el mapa Y el chip de la línea
   en la narración/pantalla. La fuente es EL PROYECTO ZETABUS de
   Antonio («está todo al milímetro») — cuando este punto arranque
   se le pregunta a ZetaBus cómo lo resuelve (¿route_color del
   GTFS, tabla propia, la API de Avanza?) y se HEREDA su solución,
   no se reinventa. Encaje: el GTFS estándar trae route_color/
   route_text_color por ruta [a verificar en NUESTRO feed en el
   censo — que la columna esté no es que el dato esté] y el
   pintado por tramos del 9 (el tramo de bus, del color de SU
   línea; contraste medido como el azul). ⚠️ Cheque de casa: el
   color NO puede ser lo único que identifique — el chip lleva el
   NÚMERO [1.4.1].
El encaje doctrinal a verificar en la casilla 0: el algoritmo de
referencia optimiza por rondas=nº de vehículos de forma nativa
[RAPTOR/OTP2 — verificar con fuente antes del encargo]; el
desempate por composición = penalización de transbordo por par de
modos. ⚰️ EL PARLAMENTO DE LA CASILLA 0, RESUELTO LA MISMA NOCHE (30/08,
firmas 6-8 de Antonio):
6. LA PRIORIDAD ES ABSOLUTA: evitar transbordos SIEMPRE gana a
   hacerlos — sin límite de minutos (la jerarquía estricta, como
   la ley del patín).
7. LA COMPROBACIÓN ES EN VIVO, COMO BiZi (v2 del 31/08 — la v1 la
   codifiqué MAL: escribí «contra el horario, sin API» cuando
   Antonio dijo LITERALMENTE «como hicimos con las estaciones
   Bizi»; la ley de codificar la palabra, no la lectura): en cada
   Generar se pregunta AL POSTE VIVO de Avanza si la línea le está
   dando servicio ahora — si dice que no o calla, EL AVISO honesto
   y listo (el patrón BiZi entero: consulta viva por petición +
   single-flight + D-G sin inventar). Los horarios GTFS siguen
   siendo la materia prima DE LA RED (qué postes sirve cada línea
   y en qué orden) y DE LOS MINUTOS del tramo montado — cocinados
   por el cron nocturno, nunca los 47 MB en caliente; la
   advertencia, en cambio, sale del VIVO. La cosecha de ZetaBus
   pasa a crítica: el endpoint de Avanza y sus cicatrices
   (parse-poste.ts: HTML pegado, filas ×4, el contador de control
   por triple canal) son el manual de esa consulta.
8. EL PINTADO = EL PATRÓN BiZi EXTENDIDO: andando en su ámbar
   discontinuo · el POSTE de subida pintado · el tramo montado en
   EL COLOR DE SU LÍNEA [firma 5] · el poste de bajada · si sigue
   andando, ámbar; si sigue en otro bus/tranvía en ese mismo
   poste, LA LÍNEA NUEVA con SU color — y así sucesivamente.
Y EL TRANSBORDO A PIE, con la doctrina mirada la misma noche: el
parámetro existe con nombre y SIN número universal
[maxTransferWalkDistance de OTP: «la distancia máxima que el
usuario anda en tramos de transbordo», defecto ILIMITADO; el andar
por tramo en OTP2, defecto blando 2.000 m; la interfaz de
referencia capa el acceso en 1.207 m]; lo que SÍ es canónico es el
TIEMPO: 120 s de mínimo global entre bajar y subir [OTP, además
del andar]; y capar corto está documentado como fuente de absurdos
[«tramos de transporte inútiles para evitar andar»] — refuerza el
radio-con-aviso de la casa. ⚰️ Y FIRMADO
por Antonio la misma noche (firma 9): transbordo entre postes
distintos con radio de búsqueda de 500 m [PROPIO firmado: el paseo
razonable único de la casa — aparcabicis, bus, transbordo] + los
120 s mínimos entre bajar y subir [OTP, citado]. CON ESTO, LA
CASILLA 0 QUEDA SIN PARLAMENTOS PENDIENTES: nueve firmas. ⚰️ Y LA
VERIFICACIÓN DEL CALENDARIO, HECHA LA MISMA NOCHE contra la
referencia GTFS: nuestro feed usa EL MÉTODO «ALTERNATE» DOCUMENTADO
[la referencia, literal: «omitir calendar.txt y especificar CADA
fecha de servicio en calendar_dates.txt — permite variación
considerable y acomoda servicio sin horarios semanales normales;
el service_id es un ID propio»] — coherente con una ciudad donde
el Pilar rompe la semana normal. Consecuencia para el motor: «¿qué
opera hoy?» es búsqueda DIRECTA por fecha (los trips cuyo
service_id tiene fila hoy con exception_type=1), sin lógica
semanal; los 196 huérfanos = service_id con fechas sin viajes.
⚠️ Cabo para el censo: contar los exception_type del fichero
ENTERO (en el método alternativo puro no debería haber ningún 2
—servicio quitado—, pero que la columna esté no es que el dato sea
el esperado). LA CASILLA 0 ESTÁ COMPLETA.

**⭐ CASILLA 1 · EL CENSO DEL FEED — HECHO (noche del 30/08, validado
por Antonio el 31/08; medición pura, cero código, ficha en
scratchpad/CENSO-DEL-FEED.md).** LO MEDIDO:
- El inventario: 8 ficheros · stop_times 870.717 filas · ningún
  fare_* ni calendar.txt · columnas presentes-pero-VACÍAS
  declaradas (route_desc/url, shape_dist_traveled ×2,
  stop_headsign, stop_desc/zone_id/stop_url/parent_station,
  block_id) · parciales: location_type 50/984, trip_headsign
  29.320/34.427 · ausentes: wheelchair_* (accesibilidad: nada).
- ROUTES: ⭐ route_type es 704 (52) y 900 (1) — tipos EXTENDIDOS:
  quien filtre por el clásico 3 no encuentra NI UN autobús (la
  tabla de modos de ZetaBus: 0,900→tram · 704→bus) · colores
  53/53 con dato (la firma 5 se sostiene; 46 distintos; texto solo
  000000/FFFFFF) · las 8 zombis con nombre: CEM, CE, LAN
  (Cementerio/Lanzadera), EM1/EM2 (Estadio Modular), V1/V4
  (Valdespartera), ES3 (Parking Norte).
- STOPS: 984 = el NAP · cero duplicados · cero fuera de marco · ⭐
  la guarda del tranvía CONFIRMADA por el dato: los 50 con
  location_type='0' son EXACTAMENTE los 50 de stop_code numérico
  (la L1); los 934 restantes PA+5 dígitos · cero estaciones (=1).
- ⭐ EL CRUCE A TRES PATAS CUADRA EXACTO: +50 tranvía (el MU3 es
  solo-bus) − 11 postes que el MU3 tiene y el feed NO sirve + 1
  (PA01320 Expo/Etopía, feed sí, MU3 no) = +40 = 984−944. Los 11:
  seis del eje Parque de Atracciones/Duque de Alba (hecho medido:
  es el eje que sirven CEM/CE/LAN, tres de las zombis — el
  porqué NO CONSTA), PA01183, y cuatro de Ramón y Cajal/Conde
  Aranda/Madre Ráfols.
- LA TERCERA PATA, ZETABUS: ⭐ tiene EL MISMO FEED byte a byte
  (sha256 5c96992c…) · conoce 9 postes vivos de Avanza que el GTFS
  no trae (6 de los 11 solo-MU3 + 3 que solo existen para Avanza:
  PA00736, PA01283, PA08138) · la COSECHA (nada copiado, rutas
  citadas): src/sources/gtfs-nap/adapter.ts (el modo es TABLA no
  if; fallback de color con dos grises distintos: «existe sin
  color» ≠ «no existe») · los 47 MB en STREAMING sin materializar,
  dos pasadas, el viaje canónico de cada (línea, sentido) = el de
  MÁS paradas («los cortos son refuerzos») · las zombis se llaman
  zombis · la API de Avanza: gps.avanzabus.com/…/
  fRefrescaEmpresaExternos (poste.ts), parse-poste.ts con las
  cicatrices (HTML no regex; «039VADORREY» pegado; el mismo hecho
  por TRES canales = contador de control gratis), horario.ts (HTML
  malformado, filas ×4).
- STOP_TIMES: 15.661 llegadas ≥24:00:00 (los búhos, máx 27:35:40)
  · orden sano · el tranvía con stop_sequence no correlativa pero
  creciente (lo único que la referencia pide) · LA MEDIDA de
  memoria: parsear entero 496 ms · 185 MB heap · 322 MB rss (Node
  24.19) — medido, no diseñado; ⚰️ el parlamento se disuelve: se
  cocina de noche, en caliente kilobytes.
- CALENDAR_DATES: ⭐ exception_type = {1: 27.161}, NI UN 2 —
  Alternate PURO (el cabo muerto) · 457 fechas · 1.458 service_id
  · 196 huérfanos confirmados · cero referencias rotas.
- ⚠️⚠️ EL HALLAZGO GORDO — EL FEED NO LLEGA AL PILAR: bus hasta el
  05/10 (7.217 viajes ese día) · solo tranvía del 06 al 09/10
  (1.500 viajes FUERA de la vigencia que el propio feed declara) ·
  del 10/10 en adelante CERO · el 12/10 (Pilar) CERO. La
  renovación del feed no es buena práctica: es LA CONDICIÓN de que
  el modo bus exista en octubre → la casilla 2 (el cron) es CAMINO
  CRÍTICO. Y pregunta abierta para ella: el NAP exige login para
  descargar — ¿cómo renueva ZetaBus su feed?
- FEED_INFO/AGENCY: 20260623→20261005 · version
  20260623_AUZSA_Y_TRANVIA · es · Europe/Madrid · el aviso del NAP
  reproducido (http://zaragoza.avanzagrupo.com NO conecta; con
  https sí) · ⚠️ la web del tranvía redirige a http://127.0.0.1/.
- TARIFAS: la contradicción declarada — el NAP dice «incluye
  tarifas» y el zip no trae fare_*; sí agency_fare_url en las dos
  (200). Cuál llama tarifas el NAP: NO CONSTA. Accesibilidad: ni
  campos ni ficheros ni enlace.
- TRAZAS↔PARADAS: ninguna >100 m en tres trips (máx 16/11/41 m) —
  la best practice del validador, cumplida.

**⭐ CASILLA 2 · EL CRON DE RENOVACIÓN — HECHA (31/08, cinco commits;
VALIDADA contra la literatura, no contra la firma).** LA DOCTRINA
que la sostiene, pieza a pieza: detección por fechaActualizacion
sin bajar [GTFS Best Practices: la ubicación estable en
iteraciones + el patrón If-Modified-Since; el NAP no da hash] ·
descarga por /api/Fichero/downloadLink/{id} [la ruta no obsoleta
del OpenAPI del NAP; download/{id} está DEPRECATED — la de ZetaBus]
· guardas y reglas de fallo CALCADAS de ZetaBus (PK · ≥1 MB · 60 s ·
escritura atómica · clave ausente = fallo cerrado · 401/403 sin
tapar · NAP caído con zip = sigue diciendo la edad) · endpoint POST
/api/renovar-feed con token Bearer en CABECERA, 503/401/409/202 [el
README de ZetaBus: nunca en URL] · umbral ≤7 días aviso / 30 ideal
[validador canónico] · EL RELEVO semilla/vivo [la síntesis firmada:
la semilla fechada sigue en repo y el clon arranca; el vivo
(gitignored) prevalece; el datapackage y sus dos guardianes siguen
verdes — el ejecutor cazó que «pisar» rompía el manifiesto y
preguntó] · .env.local (gitignored ANTES de existir) + lector
propio que devuelve nombres, nunca valores; la clave del NAP de
Antonio (la de ZetaBus), jamás en repo/URL/log. LA PRUEBA REAL
contra el NAP (31/08, con la clave puesta por Antonio): ⭐ cazó DOS
FALLOS que la suite sin red no podía ver — bitácora nº17 (el lector
miraba en la raíz y la clave está en motor/: trece verdes porque la
juez llamaba con ruta explícita y nunca ejercía el defecto) y nº18
(downloadLink devuelve TEXTO PLANO —un enlace firmado de S3— y el
fixture lo había inventado como JSON: «leí el esquema y después
inventé la codificación»). LAS LEYES: un valor por defecto que
producción usa necesita una juez que lo llame SIN argumento · el
esquema dice el tipo, no la codificación — la forma de una
respuesta ajena se MIDE una vez contra el servidor y el fixture
copia la medición · corolario: una suite sin red no puede
descubrir que un fixture miente. EL RESULTADO REAL: GetList del
1176 = 2026-06-30T13:20:04 · 6.883.311 · 34.427/53/984 (cuadra con
el censo al número) · primera pasada «renovado» (sin registro no
hay con qué comparar — incondicional, como manda HTTP), segunda
«sin-cambios» · el sha256 del descargado = EL DE LA SEMILLA
(5c96992c…): el NAP sigue en la build del 30/6 · el log ya dice
«feed GTFS vivo (relevó a la semilla) · 35 día(s) → VIGENTE». ⚰️
NO CONSTA muerto con la referencia: las fechas del NAP (16/9/25→
27/12/26) son COBERTURA del calendario; feed_end_date es la
GARANTÍA [«información completa y fiable en el periodo»] — manda
el feed_info, el reloj del 05/10 es el correcto. Registro pequeño
junto al vivo (zip primero, registro después). recocinar() nació
VACÍO y declarado (⚰️ ya cocina desde la 3a). ⚰️ El cabo del zip
nuevo, RESUELTO en la 3a: recocinar() cocina y hace swap de
referencia en caliente [PROPIO declarado; la alternativa documentada
era reiniciar, patrón OTP/ZetaBus]. ⚠️ Mejora fichada: el
registro no guarda los avisos del NAP (el GetList los trae). Para
el panel de Hostinger al desplegar: POST …/api/renovar-feed,
Authorization: Bearer <DESPLAZAME_REGEN_TOKEN>, ≥15 min, horario a
criterio (ZetaBus 0 2 * * *). 385 motor · 181 interfaz [⚠️ corrección del 31/08 tarde: los tipos de la INTERFAZ no se comprobaron aquí — el guion tecleado de memoria no miraba src/app; ver la 3b] · 18
bitácoras, 0 abiertas.

**⭐ CASILLA 3a · LA COCINA DE LA RED DE BUS — HECHA (31/08, dos
commits; validada contra la literatura).** LA UNIDAD ES EL TRIP
PATTERN [OTP: «grupo de trips de una ruta, misma dirección, misma
secuencia de paradas»; en GTFS son implícitos y los deriva el
consumidor por la secuencia ordenada de stop_id] — NO el «trip de
más paradas» de ZetaBus (válido para pintar, no para rutear: los
refuerzos y cortos son patrones legítimos). LO COCINADO (streaming,
stop_times NO se materializa: 65 MB de montón frente a 185): 984
paradas · 53 líneas (8 zombis con 0 patrones: CEM CE LAN EM1 EM2 V1
ES3 V4) · 170 PATRONES (2-19 por línea, media 3,8; 26 de 45 líneas
con refuerzos) · 3.362 SALTOS con running time TÍPICO = mediana y
MÁXIMO sobre sus trips [PROPIO declarado; los búhos >24:00:00
restan bien] · SERVICIO por patrón con operaEl(fecha) [Alternate] ·
10.588 TRANSBORDOS F (5.294 pares × 2) a ≤500 m POR EL MOTOR DEL
PEATÓN [firma 9 + RAPTOR foot-paths]: ⭐ de 7.992 pares en recta
solo 5.294 (66 %) sobreviven andando — el río, las vías y las
manzanas; los 18 a 0 m son andenes de tranvía legítimos · líneas
con color 53/53 · tabla de modos 704→bus/900→tram que PARA ante lo
desconocido. El cocinado: 1.272 KB en app/data/…cocinado.json
(gitignored, se regenera; 4,3 s con el peatón, 7 ms el segundo
arranque); recocinar() ya cocina y sustituye la referencia (recibe
la cocina montada desde el servidor porque el peatón lo tiene él —
si nadie se la pone, lo dice y no sirve media red). EL CASO 39: 8
patrones, principales 22 y 30 paradas (647/631 viajes), 45,0 min
típicos vs 58,6 del peor viaje; la perla 59|0|1: típico 0 s, máximo
1.800 — media hora parado en un viaje de seis (la mediana
trabajando). Determinista (mismo sha en dos pasadas). Honestidades:
SIN rojo-primero en un módulo de datos contra stubs (declarado — la
contraprueba fue la que mordió: cazó la juez 3 floja «≥» y la
apretó con lo medido) · la mutación exception_type=2 NO PUEDE
MORDER (el feed no tiene ningún 2 — dicho, no disfrazado; la guarda
queda) · las comillas de stops.txt (934/984) cazadas por un volcado
antes de que hubiera prueba → partidor RFC 4180 + red que revienta
si los campos no cuadran (sin bitácora: nada dio verde) · dos
commits y no tres (la cocina es una pasada; separar habría
commiteado un estado que nunca existió). 395 motor · 181 interfaz [⚠️ misma corrección: tipos de interfaz sin comprobar aquí; ver la 3b].

**⭐ CASILLA 3b · EL VIAJE EN BUS/TRANVÍA — HECHA (31/08, siete
commits en dos encargos; validada contra la literatura).** LA
BÚSQUEDA es RAPTOR en su estructura [rondas = vehículos; cada
patrón una vez por ronda; fase de transbordos; OTP2: acceso →
transporte → salida] sobre la red cocinada y solo patrones que
operaEl(hoy); la variante SIN casar horas, declarada: coste = andar
+ Σ(espera + saltos típicos) + F (metros a 5 km/h + 120 s [OTP]);
orden LEXICOGRÁFICO por las firmas (menos vehículos → menos
tranvías → menos tiempo), tope 3 rondas [PROPIO]. ⭐ HALLAZGO: la
firma 6 no la impone el comparador, LA IMPONE LA RONDA (se devuelve
la primera que llega — el «menos transbordos» nativo de RAPTOR); el
comparador solo hace falta para la firma 3. LA ESPERA: E[W]=H/2 [la
suposición canónica: Dial 1967 · Clerq 1972 · Wirasinghe 1980; se
degrada con intervalos >10-12 min — por eso es estimación y viaja
con «~»], H del patrón HOY. EL CASO DEL OJO: COLOSO→ROMEO en bus =
478 m a pie → LÍNEA 29 (#F5C100) 4.956 m → 886 m a pie · 6.320 m ·
51,8 min · sumas exactas · pid==pid. LOS PARES DE LAS FIRMAS,
MEDIDOS para que Antonio los vea: firma 6 en Av. de América→Madre
Teresa: 1 vehículo 40,3 min gana a 2 vehículos 39,4 (cuesta 0,9
min) · ⚠️ firma 3 en Asín y Palacios→La Fragua: bus+bus 63,9 min
gana a bus+tranvía 53,8 — LA FIRMA CUESTA 10,1 MIN ahí; el número
queda en la juez para discutirla algún día. EL CONTRATO: comoSeVa
'montado' con su línea (id·nombre·color·texto·modo) y los hitos
sube/baja. ⚠️ La geometría del tramo montado son LOS POSTES, no la
traza (el shape_id está cocinado; sus puntos son dato de pintado —
casilla 4). LA CONSULTA VIVA [firma 7]: Avanza MEDIDA antes de
codificar (POST fRefrescaEmpresaExternos: text/html que en realidad
es JSON; maquinas indexado con title «053 4937» y tablatiempos —
los fixtures son los bytes medidos [ley nº18]; la cicatriz
«053MIRALBUENO» comprobada; el contador de control por dos canales)
· single-flight por poste · en cada Generar, nunca cacheada · tope
3 s + D-G · ⭐ CUATRO ESTADOS, no dos: llega (sus minutos SUSTITUYEN
al ~H/2 del PRIMER vehículo y entran en el total — «próximo en N
min (dato de las HH:MM)») · ausente (contestó y esa línea no está →
aviso en doble sitio, manda el horario) · mudo (no contestó → D-G
«disponibilidad no verificada») · sinFuente (el tranvía: Avanza no
lo cubre → nada que avisar) — confundir ausente con mudo convierte
un fallo de red en «esa línea no pasa». LAS DOS PRUEBAS REALES
salieron una en cada rama sin buscarlas: la 29 ausente a las 13:43
(ruta entera + aviso) · la 53 en Emperador Carlos V «próximo en 4
min» (757 s con el vivo, 785 con la estimación). Solo el PRIMER
vehículo lleva el vivo («próximo en 3 min» a un poste al que llegas
en 40 es un número cierto sobre un bus que no cogerás). El botón
BUS ya llama al motor (la juez del «todavía no» llevaba escrito su
vencimiento; la regla nº1: nada cuenta sin verse; gris provisional
hasta la 4). Confesiones: el último «transbordo» de RAPTOR salía
como tal sin llevar a vehículo (fundido con la salida, cazado en el
caso del ojo) · el banner de arranque mentía (ahora sale de
MODOS_ATENDIDOS; sin bitácora: nada lo vigilaba) · las jueces del
motor nacieron rojas por «export no existe», no por conducta (la
contraprueba es quien muerde: 11 mutaciones, todas rojas, una juez
apretada). ⚠️⚠️ BITÁCORA DEL 25/08 REABIERTA Y CERRADA: la
comprobación de tipos de la interfaz que el ejecutor tecleaba de
memoria NO MIRABA NADA (cero ficheros de src/app) — el «tipos
limpios en los dos lados» de las casillas 2 y 3a ERA FALSO en el
lado de la pantalla; ahora un solo `npm run comprobar-tipos` en la
raíz. LA LEY: un arreglo que hay que acordarse de usar no es un
arreglo del todo. ⚰️ Doctrina pendiente para la 4 (validada aquí):
el texto del aviso «ausente» debe decir lo MEDIDO, no lo inferido
[GTFS-Realtime: entidad ausente = sin información en tiempo real,
NO sin servicio] → «Avanza no anuncia ningún próximo de la línea X
en este poste ahora mismo» · el Generar en bus tarda ~2 s
variables → INDICADOR de espera obligatorio [NN/g: >1 s, indicar
que se trabaja; más aún si el tiempo es variable]. 415 motor · 183
interfaz.

**⭐ CASILLA 4 · LA PANTALLA DEL BUS — HECHA (31/08 tarde, seis
commits; NO destilada hasta el 1/09 — la auditoría de Antonio la
cazó: «¿solo has rellenado y patadón?»).** LAS TRAZAS POR SALTO
cocinadas [OTP TripPattern: la geometría del patrón = concatenación
de hop geometries; sin shape_dist_traveled (0/27.603), cada parada se
PROYECTA sobre la traza y se corta entre proyecciones — Google
Transit Partners: «casar la parada con su mejor posición a lo largo
de la traza»]: el cocinado 1.476 → 2.672 KB (+81 %), +137 ms
(+3,3 %), 48.307 puntos, 1.277 km de asfalto; 3.532 proyecciones,
mediana 5,4 m · p95 10,3 · peor 40,9 · CERO a >100 m [la best
practice del validador] · cero rectas de reserva · cero patrones
sin traza. ⭐ LA MONOTONÍA NO ES TEÓRICA: con el vecino más cercano
31 de 170 patrones mandaban alguna parada al paso de vuelta (la 117
saltaba 42 km atrás) → programación dinámica con mínimo de prefijo.
⭐ LA FORMA SE ELIGE POR CÓMO LE QUEDA, no por su nombre: 210|0|10
cita dos shapes; con 210_I su peor parada cae a 4.222 m, con 210_V a
14 — coger formas[0] metía 42 paradas por encima del límite. EL CASO
DEL OJO: 6.320 → 7.137 m, el montado gana 816 m (la cuerda cortaba
esquinas por encima de las manzanas), 335 vértices, sumas exactas.
LA PANTALLA: montado sólido en route_color · chip [29] (12,51:1
entonces, en la leyenda y en el paso) · 🚌/🚏 en postes · el aviso
«ausente» con el texto MEDIDO [GTFS-RT] en doble sitio · el
INDICADOR de espera [NN/g >1 s] (salió en el par con transbordo,
no en el del ojo que contestó <1 s). Reportado sin inventar: 27
chips <4,5:1 y 23 líneas <3:1 (colores del feed) → resuelto el 1/09.
⚠️ DOS FALLOS REALES, grabados y cerrados: (a) el cocinado del
disco NO DECÍA SU FORMATO — al ganar los saltos su traza, el
arranque siguió sirviendo el fichero de ayer (sin traza) con 421
jueces en verde (todas llaman a cocinar(); el producto arranca por
cocinarYServir()) → FORMATO_DEL_COCINADO; (b) el arreglo del (a)
trajo el (b): la juez que lo cubría guardaba en el fichero de
PRODUCCIÓN una red sin peatón → el motor arrancó sirviendo 0
transbordos de 10.588 con 423 jueces en verde; lo cazó pid del log ≠
pid que contesta → RedDeBus.conPeaton («este fichero está completo»,
no solo «sé leerlo») y la escritura de la juez a un temporal.
Confesión del ejecutor: sus primeras cifras salieron de un proceso
sin log; todo re-medido con pid==pid; dos contrapruebas lanzadas a
la vez sobre los mismos ficheros, repetida en serie. 423 motor ·
188 interfaz.

**⭐ LOS PESOS DE OTP — el enrutado corregido por doctrina (31/08
tarde, tras la queja del ojo: «se me va a coger el bus a tomar por
culo… busca doctrina que algo estás cagando»).** EL DIAGNÓSTICO
medido antes de tocar: (bitácora nº19) RAPTOR se subía en la
primera parada marcada del patrón — correcto con etiquetas de HORA
(subir antes nunca empeora), FALSO con etiquetas de COSTE (subir
antes cuesta más rodar): el poste PA00033 a 60 m andando perdía
contra Ramazzini a 478 m pese a ganar por 6,5 min incluso con peso
1; estrella: la juez del caso del ojo compraba Ramazzini (esperado
copiado del motor — ley nº16). La 44: su poste a 530 m andando
(fuera del veto 500 por 30 m) y HOY no circula (calendario de
verano: 16 de 45 líneas sin servicio el 31/08 — 21 23 33 39 44 Ci*
N* — dato del feed, no del código). Avanza «mudo» falso: el tope 3 s
corto (latencias medidas hasta 2.838 ms; ZetaBus usa 4.000 +
reintento 300). EL ARREGLO: la subida se RECONSIDERA a lo largo del
patrón (mínimo corrido de coste[k]+espera−acumulado[k], la regla de
«coger un vehículo anterior» de RAPTOR traducida a costes) ·
walkReluctance 4,0 [OTP2 actual; OTP1 2,0] · walkBoardCost 600
[OTP: «evita transbordos innecesarios»] · waitReluctance 1,0 ·
transferSlack 120 · tranvía 1,0 (preferencia RETIRADA; el par de
Asín y Palacios re-medido elige bus+bus por el paseo final 0 vs 353
m, no por el modo — los 10,1 min «de firma» eran de la búsqueda
rota) · el COSTE TOTAL decide entre rondas (lexicográfico FUERA) ·
el veto 500/800 FUERA [OTP2: límite de acceso = rendimiento, defecto
4 h] → topes de rendimiento declarados: 30 min andando + 40
candidatos por cercanía (con 2.500 m el centro daba 438 y 1,6 s) ·
Avanza 4.000 ms + 1 reintento 300. EL CASO DEL OJO en cuatro
paradas: 51,8 min (lo que veía) → 43,0 (subida reconsiderada: sube
a 60 m) → 41,3 (pesos) → 35,9 con la 44 directa el 1/09 (hoy 31,
sin la 44: 43,8 subiendo en la puerta). El par de la antigua firma
6: 1 vehículo 40,3 min gana a 2 con 39,4 (pesa 3.020 vs 4.107 — «el
segundo entra si ahorra >600»). Los pesos ELIGEN; el reloj que se
contesta es el real. Coste medido: motor 31 ms de mediana; el
Generar en bus 2.990 ms mediana · 8.374 peor (dos postes en fila
india → ⚠️ paralelizar, anotado). NO CONSTA por qué el poste 1203 no
anuncia nada y el 33, dos paradas después del mismo patrón, anuncia
dos coches. 426 motor · 188 interfaz.

**⭐ CASILLA 3c · LOS DESVÍOS — LA RUTA OPERATIVA DE HOY MANDA
(31/08; validado por el ojo: «probado y funciona bien»).** Antonio
frenó mi primer encargo (GTFS-RT alerts, página de alteraciones):
«en ZetaBus tenemos el itinerario alternativo». LA SONDA en ZetaBus
(solo lectura, rutas citadas): ⭐ NO HAY FUENTE DE DESVÍOS — se lee
LA RUTA OPERATIVA DE HOY (POST zaragoza.avanzagrupo.com/wp-admin/
admin-ajax.php action=get_stops_list selectLinea selectSentido -1/-2
+ nonce re-scrapeado de /lineas-y-horarios/, 403 sin él, memo 30
min; HTML de <option> sin <select>; recorrido.ts) y se RESTA del
GTFS (desvios.ts): fuera (en GTFS y no hoy) · provisionales (hoy y no
en GTFS, con el nombre de Avanza) · sentido→direction_id por SOLAPE
medido (91-93 %) · UMBRAL_ABSURDO >50 % → indeterminado («preferimos
decir NO LO SÉ a tachar 30 paradas») · la ruta real MANDA siempre
que se pueda leer (el fallo más grave de ZetaBus escrito: «le decía
a alguien que su bus para en una calle CORTADA. No petaba. Pintaba»)
· caché 1 h SEPARADA de la de llegadas · se AUTO-APAGA (diff vacío)
· asimetría declarada: detecta desvíos de RUTA, no supresiones de
parada en prosa (el poste 744). Los 9 postes solo-Avanza con
coordenada del marcadorParada (data/postes-solo-barrido-
coordenadas.json). Sin GTFS-RT en el NAP para Zaragoza (medido).
LA TRAZA DE LOS SALTOS NUEVOS se RECONSTRUYE ruteando entre postes
consecutivos sobre la red de la rueda y concatenando [el patrón
documentado: Freiburg GTFS-mapper (A* entre paradas consecutivas +
concatenar, recta donde no conecta) · pfaedle (SIGSPATIAL 2018) ·
bus-router/gtfs-shape-router (OSRM entre paradas) — todos en
gtfs.org/producing-data]; tiempo = metros ÷ velocidad comercial del
patrón [PROPIO: la doctrina da geometría, no horario]; la red de la
rueda como grafo vial hasta el punto 12 (declarado). EL RESULTADO
HOY: 48 sentidos · 11 líneas desviadas (22 28 29 30 32 34 35 38 40
41 52), 19 patrones rehechos · 71 saltos nuevos TODOS ruteados (0
rectas de reserva) · 8 provisionales · 1 sin coordenada (se cae,
regla B) · 27 s de precalentado. La 29 dir 1: fuera [433 1293 745],
provisionales [654 1285] — y el 1203 NO está suprimido (sigue NO
CONSTA). El caso del ojo: 29 + 22, BAJA EN UNA PARADA PROVISIONAL
(Asalto / Centro de Historias) — la operativa manda de verdad. Sin
parser copiable (cero deps): contador independiente de <option> +
rechazo de <optgroup>. ⚠️ erasableSyntaxOnly activado en los dos
tsconfig (un readonly en parámetro de constructor: tsc aprobaba,
Node no cargaba — sin verde que mintiera, se vio a la primera).
Bitácora nº22 (el aviso de la 35 pegado a la subida de la 31):
cerrada PARCIAL aquí, reabierta en los pulidos. 439 motor · 190
interfaz.

**⭐ LOS PULIDOS DE LA NARRACIÓN DEL BUS (31/08 noche, cuatro
tandas, validadas «lo veo chachi» / «va mejor»).** (1) TRANSBORDO EN
EL MISMO POSTE = UN paso «En el poste X, transborda de la línea A a
la B — frecuencia teórica de la B: cada N min» con dos chips [GTFS
transfers.txt: el transbordo es elemento de primera clase entre
rutas en una parada; misma parada from=to]; con paseo se queda baja
· andar · sube; 9 pasos donde había 11, el tramo de 0 m fuera, los
120 s mudados al vehículo siguiente, el total idéntico al segundo.
(2) SUBIDAS SUCESIVAS: «frecuencia teórica: cada H min» [GTFS
frequencies/headway] en vez de «~N min de espera»; la primera lleva
el vivo; H/2 sigue en el total [Dial/Clerq/Wirasinghe], y la
convención alternativa (Google: cabecera entera como peor caso)
citada en el código, NO aplicada. (3) nº22 REABIERTA Y CERRADA DE
VERDAD: la causa no era el orden de las reglas — la regla del SITIO
SOBRABA para un desvío (un desvío explica UNA línea); nace
lineaDelHito (primera via en sube, última en transborda); LEY:
cambiar el orden de dos reglas no arregla que una sobre — la
pregunta es «¿esta regla puede acertar por casualidad?». (4) LAS
PARADAS POR VEHÍCULO con la convención num_stops [Google Directions:
incluye llegada, no salida; A→B→C→D = 3; es propiedad del PASO de
transporte → sube y transborda llevan cada uno la de SU vehículo]
sobre el patrón OPERATIVO (la 35 dice 17 hoy porque va desviada).
(5) EL DESVÍO EN DOS NIVELES: el hecho «⚠ La línea 35 va hoy
desviada» SIEMPRE visible + botón «detalles» [GOV.UK progressive
disclosure; límites: «no ocultar lo importante», «solo cuando el
detalle beneficie a pocos»; botón con aria-expanded/aria-controls,
foco medido, NO tooltip]; una plantilla para los dos sitios; el
banner de 114 → 36 px cerrado. ⭐ BITÁCORA nº24: tres jueces en
verde con la lista A LA VISTA — preguntaban cuerpo.hidden===true
(cierto) y el CSS .detalles__cuerpo{display:block} pisaba a
[hidden]; lo delató la sonda (114 px cerrado = 114 abierto); LEY: una
prueba que pregunta por el ATRIBUTO no compra lo que se VE (la de
Linaje, en vivo); el instrumento y el defecto nacieron del mismo
malentendido. El corte del aviso va por marca, no por el primer «:»
(hay un poste «Av: Cañones De Zaragoza», 1/984). NO CONSTA el
contorno de :focus-visible por CDP (el foco entra, medido). 24
bitácoras, 0 abiertas. 445 motor · 195 interfaz.
**⭐ LOS CONTRASTES POR DOCTRINA — HECHOS (1/09, siete commits;
sonda en ZetaBus PRIMERO, arreglo después).** Los denominadores
corregidos: son 53 líneas (27 chips <4,5:1 obedeciendo al feed, la
33 a 1,72:1). LA SONDA (ZetaBus, rutas citadas): la vía «negro o
blanco por luminancia» (textoLegible) la RETIRÓ ZetaBus con razón
escrita («la 29 en negro entre 30 blancas parecía un error» — la
identificación consistente); su regla vigente: diurna = color de
línea INTACTO + número BLANCO + contorno negro (la técnica que WCAG
reconoce: el contorno cuenta como primer plano al medir) · BÚHO
(/^N/i, grupos.ts) = fondo azul noche #1C1A42 (medido en la web de
Avanza) + número EN EL COLOR de la línea («el color es identidad, la
inversión es categoría; sin gastar un color»); contraste.ts con la
fórmula WCAG linealizada (cuatro escrituras); ZetaBus NO pinta
polilíneas → el ribete sin precedente, por WCAG 1.4.11. EL ARREGLO:
chip diurno y búho heredados con cita → 53/53 ≥4,5:1 (peor búho N4
4,70) · ribete = segunda polilínea debajo, más ancha, en el tono que
gana por cuenta (negro 18,3:1 sobre la tierra; la línea ≥3:1 contra
su ribete) — el ámbar (4,38) y el azul (4,50) ya llegaban y quedan
al byte sin ribete · el route_color no cambia en ninguna de las 53.
⭐ BITÁCORA nº25 (cazada por el instrumento recién heredado): el
contorno de 0,7 px de ZetaBus NO PINTABA NI UN PÍXEL negro a
nuestros 13,6 px (text-stroke centra el trazo, el relleno tapa la
mitad, el subpíxel lo tiñe: la 44 a 3,15:1 con la clase puesta) —
la juez compraba la clase; a 13,6 px hacen falta 2 px con
suavizado en escala de grises (ampliado ×8, las cifras conservan la
forma). EL INSTRUMENTO: medir en el PÍXEL de la captura, no en el
CSS (getComputedStyle ignora opacity: un texto a 0.18 daba 21:1 y
mide 1,54 — la juez 0 de la suite); y el medir.ts heredado traía su
caso ciego (moda contra el más lejano falla con halo — ahora mide
relleno contra halo). AVANZA: ⚠️ YA ERA PARALELO desde el 31/08
(Promise.all) — faltaba la juez del reloj (dos postes = 326 ms); los
8,4 s peor caso NO son serialización: son el presupuesto 4.000 + 300
+ 4.000 de UN poste que no contesta [los números de producción de
ZetaBus; dentro del límite de 10 s de NN/g; con indicador] → SE
QUEDA: bajarlo a ojo sería invent. app/e2e/ no entra en npm run
probar (Chrome y motor vivos; a mano). 446 motor · 208 interfaz · 25
bitácoras, 0 abiertas. ⚠️ Siguen: 16/45 líneas sin servicio entre
semana en agosto (dato) · 1203 NO CONSTA.

**⭐ CASILLA 5 · LA DEMO — CONFIRMADA por el ojo (1/09): «funciona
perfecto»**, tras dos días de casos reales de Antonio en localhost
(COLOSO→ROMEO, COLOSO→Grande Covián, COLOSO→Oviedo 5,
COLOSO→Compromiso de Caspe, Conde de Aranda→Leopoldo Romeo,
Arcosur→Montañana) que cazaron seis fallos por el camino — todos
cerrados con bitácora.

**⭐ EL CIERRE DEL PUNTO 10 (1/09, la tarde): tres bugs cazados por el
ojo y cerrados, y el vivo a petición.** (1) EL REFRESCO QUE PERDÍA
DESVÍOS (bitácora): la 22 subía en Plaza de España estando
suprimida; el diagnóstico descartó fuente, identidad (ids exactos
17390/17391 suprimidos), dirección (solape 85/93 %) y alcance (la
22 no tiene refuerzos) — era ESTADO DEL PROCESO: setInterval con el
MISMO valor que el TTL de la caché; el segundo pase servía
veredictos a segundos de caducar y al aplicar ya eran null (medido
con reloj falso: 64 vivos a los 5 s, 0 a los 11); estrella: el log
daba verde «23 desviados» dos veces mientras se aplicaban 4 — la
cuenta impresa era la de la fuente, no la de lo aplicado. Arreglo:
el refresco APLICA lo que acaba de leer (sin segunda lectura),
periodo = TTL/2, y el log dice «detectados N · aplicados M» y grita
si no cuadran; LEY: una juez que no cubre la línea que se cambió no
es una juez de ese cambio (la contraprueba lo destapó: las tres
jueces pasaban los veredictos a mano). (2) EL POSTE MUDO con Avanza
en línea: diagnóstico medido — el tope, siempre el tope: una racha
de Avanza con la mediana en 4.000 ms (5/10 fallos), veinte minutos
después 0/24 con dos topes alternados; no es el poste, ni la
concurrencia, ni el parseo; NO CONSTA por qué Avanza tuvo la racha.
→ el mudo lleva MOTIVO al log (tope · red · http · parseo ·
contador, con ms) [ZetaBus cuenta timeouts aparte]; el aviso al
usuario idéntico. (3) EL NÚMERO DE POSTE en toda la narración
[stop_code: «el número que el viajero ve en la señal», referencia
GTFS]: bus PA00033 → 33, tranvía su código tal cual (sin PA
inventado); en subida, transbordo, bajada, avisos y listas del
desvío. (4) EL VIVO A PETICIÓN: el Generar consulta SOLO el primer
poste de subida (los demás solo fabricaban avisos de un minuto que
nunca se iba a decir; la juez 23 jubilada con su tema, escrito) ·
GET /api/poste-vivo?poste&linea (idempotente, no-store, single-
flight, 400 si se pregunta mal, mudo si el poste no existe) · el
botón «Próximo bus» junto a cada subida y transbordo de bus (no en
tranvía): región role=status creada al pintar el paso [WCAG 4.1.3],
aria-busy durante la carga, el botón enfocable e interceptando
clics en vuelo (nunca disabled), cada pulsación vuelve a preguntar;
medido en vivo: «cada 11 min» → pulsar → «próximo en 6 min» en 1,9
s. Bitácora nº28: `:empty{display:none}` sacaba la región viva del
árbol de accesibilidad (2 status vacía, 3 con texto — la juez
querySelector la encontraba igual; jsdom no aplica el CSS: las dos
jueces nuevas viven donde hay píxeles). Decisión declarada:
aria-busy durante la carga ⇒ el lector oye el resultado, no el
arranque. El ojo: «funciona perfecto». 470 motor · 217 interfaz ·
28 bitácoras, 0 abiertas.
**LA DECISIÓN SOBRE AVANZA (1/09, noche; Antonio):** su aviso legal
prohíbe la extracción y reutilización (medido y transcrito en §1.24-
1.25 del notices); la fuente municipal (sede, Ley 37/2007) no sustituye
ni las llegadas (peores) ni la ruta operativa (GTFS de 2013 sin
desvíos) — fichada en §1.26, no usada. «Es un dato público de un
servicio público y esto es una demo: se atribuye y para adelante.»
Hecho: la línea de créditos en el pie (Avanza · NAP/MITRAMS ·
Ayuntamiento · OSM) y las fichas. El hueco del Pilar, corregido: 10-18
de octubre sin ninguna fila; el tranvía vuelve el 19.

**PULIDOS POST-CIERRE, fichados con su doctrina (no bloquean):** ·
el RESUMEN ÚNICO arriba [GOV.UK error summary: UNA caja que lista
todo, enlazando a cada paso; hoy hay una caja por aviso — el patrón
mal copiado] · la primera subida dice el minuto DOS veces (la frase
del paso y la región; al refrescar la frase se queda vieja) —
fundir cambia la narración del sube · «Ojalá lo hubiéramos hecho
con BiZi» (Antonio): el mismo botón a petición para la
disponibilidad de estaciones · el peor Generar sigue en 8,4 s si
Avanza va lenta en el primer poste (presupuesto de ZetaBus; dentro
de NN/g). NO CONSTA: el 1203 sin anunciar; las rachas de Avanza; 16
líneas sin servicio entre semana en agosto (dato).

*(La regla del apoyo en ZetaBus —precedente propio en producción,
solo lectura, se cita como lo que es y donde discrepe del feed se
investiga— quedó fichada el 30/08 y EJECUTADA en las casillas 1 y 2:
la cosecha está arriba.)*

*(Este párrafo decía «lo que queda: casillas 3-5»; al 1/09 todas
están hechas y el punto cerrado — queda como historia. La decisión
`G` se cumplió: componer sin prometer, sin total inventado.)*

Dejado aquí desde el punto 4, para cuando toque:

- [x] ⚰️ HECHA (operaEl(fecha) sobre el cocinado + la ruta operativa de hoy — la 3a y la 3c) · **D-MAPA-DE-HOY (decidida por Antonio el 17/08):**
      el mapa pinta la red operativa DEL DÍA, no el catálogo — el cron
      nocturno recalcula qué líneas tienen viajes hoy (cruce trips +
      calendar_dates contra la fecha) y el pintado sigue a ese cálculo.
      Un búho en martes no se pinta; una especial activada, sí
- [x] ⚰️ HECHA (casilla 2: feed_end_date y días hasta caducidad en el log de arranque; el registro del fetch) · **La comprobación de la fecha viva**: el cron mide en cada feed
      hasta cuándo llega el servicio REAL (hoy: 27/12, con el feed
      declarando 05/10 — se contradice) y lo reporta; la caducidad deja
      de vigilarse a mano
- [x] ⚰️ HECHO (el censo a tres patas: +50 tranvía −11 +1 = 40 exacto; la guarda del tranvía confirmada por el dato) · **El cruce líneas↔postes** (routes+trips+stop_times contra los 944
      del MU3): la dependencia anotada en tres sitios sin guardián.
      El puente es el stop_code PA… — que MIENTE sobre el tranvía (los 50
      numéricos): el cruce lleva la guarda o pierde el tranvía en silencio
- [x] ⚰️ HECHO (las 8 zombis con 0 patrones, declaradas; el motor solo rutea patrones que operan hoy) · **Un listado ingenuo de líneas ofrecería 8 que no llevan a ninguna
      parte**: las operativas son 45 (44 bus + tranvía), las 8 especiales
      están declaradas sin viajes. El buscador lista lo que opera
- [x] ⚰️ HECHO (los patrones se derivan por SECUENCIA de paradas, nunca por sufijo — la 3a) · **Los sentidos del tranvía NO se derivan del sufijo a ciegas**:
      tres saltos conocidos en los stop_code (`1311/1312`, `2322`, `2422`)
- [x] ⚰️ Nota histórica, ya sin tarea (el puntero del notices se corrigió el 22/08; los 196 huérfanos quedaron confirmados por el censo) · Al retirar los andamios de carga (~35,6 MB en el navegador), la
      imprecisión menor del notices — que vivía en §1.7 (GTFS), no en
      §1.6 como fichaba este plan: puntero corregido el 22/08 — quedó
      CORREGIDA en `1deaa86`, verificada contra el dato y no copiada:
      196 service_id huérfanos (sin ningún trip); el 28, 29, 30 y
      31/12 son UNA línea huérfana cada uno — el 31/12 ni siquiera era
      servicio. La conservadora (05/10) no cambia

## 11 — LA BOTONERA DE LA DEMO — **⭐ CERRADO el 2/09/2026** *(nació
del parlamento del 1/09 al cerrar el 10 — «esto va a ser una DEMO»;
cinco casillas en un día y medio; el ojo: «la botonera la veo bien
así»)*

LA IDEA DE ANTONIO, y su encaje doctrinal: la botonera se reorganiza
en modo + calificador — exactamente la taxonomía de la referencia
[OTP RoutingModes: modo base con calificadores RENT/PARK — bike ·
bike-to-park · bike-rental · scooter-rental · car · car-to-park ·
car-rental; GBFS 2.2: form factors bicicleta / patinete / MOPED /
coche]. El «Privada / Pública» es el calificador; los «tipos de
parking» son el -to-park. La segunda fila se revela al elegir el
modo [GOV.UK: radios con contenido revelado condicionalmente — el
mismo patrón de «¿Qué ruta prefieres?»].

```
CÓMO   [Andando] [Bus / Tranvía] [Bici] [Patín VMP] [Moto] [Coche]

Bici  → [Privada] [Pública BiZi]      + [Rápida] [Equilibrada] [Tranquila]
Moto  → [Privada] [Pública YeGo]                       (punto 13)
Coche → Tipo de parking: [Regulado] [Discapacitado] [Gratuito]   (punto 12)
```

REGLA DE LA DEMO (la nº1 del reinicio: nada cuenta sin verse): la
botonera enseña LO QUE EXISTE; un grupo nuevo aparece cuando su
motor llega, no antes — un «todavía no» en una demo es un cartel de
obra. Hoy existen: Andando · Bus/Tranvía · Bici (privada y BiZi) ·
Patín. La regla aplica a los grupos NUEVOS: [Moto] entra con el punto
13 y la fila de parking del coche con el 12; el botón [Coche] ya
existía con su aviso desde antes de la regla (decisión del 30/08) y
se queda hasta que el 12 lo llene.

- [x] **0 · EL PARLAMENTO — hecho (1/09).** Lo de arriba.
- [x] **⭐ 1 · LA BICI EN DOS FILAS — HECHA (2/09).** [Bici] revela
      «¿Qué bici?» [Privada|Pública BiZi] (Privada por defecto) + las
      tres rutas; cinco familias arriba. La decisión que lo sostiene:
      EL ESTADO SIGUE SIENDO UNO — modo es lo que viaja, familia es un
      computed derivado (dos señales = la puerta a que el botón y el
      modo dejen de coincidir sin rojo). Los value son los del
      contrato (bici|bizi), sin tabla de traducción. Cero cambios en
      motor/contrato (muralla: el cuerpo sigue destino,modo,origen).
      10 jueces jsdom + 18 Chrome + 5 contrapruebas; una juez del
      ejecutor estaba equivocada (quería memoria al salir y volver —
      el computed hace bien en no tenerla) y quedó reescrita. De
      propina: el «agujero» del guardián de la raíz reportado el 1/09
      NO existe (HttpClient sale por fetch; el matiz real: en jsdom
      quien caza es http.verify(), no el contador — escrito).
      *(el encargo fue corto y salió corto — la regla nueva funcionando)*
      · **1 · LA BICI EN DOS FILAS (el texto original):** [Bici] despliega
      [Privada] [Pública BiZi] y, debajo, las tres rutas. El motor NO
      se toca: `modo=bici|bizi` y `ruta=` ya existen (los BOTONES
      cambian, los CAMINOS no). Radiogrupos nativos como el selector
      del 9 (teclado, exclusión, name compartido); el foco y el
      estado anunciados; el andando/bus/patín intactos al byte.
- [x] **⭐ 2 · LOS BOTONES DE BiZi — HECHOS (2/09).** «Bicis ahora» al
      coger · «Anclajes ahora» al dejar; GET /api/estacion-viva
      (?estacion&pide=bicis|anclajes), calcado de poste-vivo, apoyado
      en el single-flight que disponibilidadDeBiZi() ya llevaba; los
      estados con su hora; ⭐ «ausente» NO se traduce a «0 bicis»
      [GTFS-RT: sin información ≠ sin bicis], con juez. 15 jueces
      motor + 20 en Chrome contra sede y Avanza vivas. La contraprueba
      cazó una zona sin vigilar (los hitos con fixture a mano: nadie
      compraba estación y pregunta del trayecto real — juez nueva) y
      un fixture que violaba el contrato (Trayecto sin avisos; se
      arregló el fixture, no se toleró en el computed). DECISIÓN DEL
      OJO (2/09): la cifra se dice en la frase Y en la región — cada
      una con su hora; se queda así. · **(el texto original) LOS
      BOTONES DE DISPONIBILIDAD DE BiZi** (la palabra de
      Antonio: «el mismo botón que el bus — enganches o bicicletas
      según lo que necesitemos»): en el hito de COGER, «Bicis ahora»
      (bicisDisponibles); en el de DEJAR, «Anclajes ahora»
      (anclajesDisponibles); cada pulsación vuelve a consultar el
      station_status [GBFS; una llamada para toda la red, como el
      Generar] con el patrón del «Próximo bus»: región role=status
      creada al pintar, aria-busy, botón nunca disabled, indicador
      >1 s [WCAG 4.1.3 · MDN · NN/g], D-G si el Ayuntamiento calla. El
      Generar sigue trayendo el dato de salida; el botón lo refresca.
      El endpoint: GET de solo lectura, no-store, single-flight.
- [x] **⭐ 3 · EL RESUMEN ÚNICO — HECHO (2/09).** UNA caja role=status
      «Avisos de este viaje:», una línea por aviso que ENLAZA al paso
      (el foco se mueve, no solo la página); a qué paso lleva lo
      decide la MISMA regla que pinta la nota, invertida (dos reglas
      = enlace a un paso y nota en otro); sin disparador de detalles
      arriba (el detalle vive en el hito); el aviso sin hito (coche)
      sale sin enlace. · **(el texto original) EL RESUMEN ÚNICO DE
      AVISOS** (pulido post-cierre del 10,
      fichado con doctrina): arriba UNA caja que lista todos los
      avisos del viaje enlazando a su paso [GOV.UK error summary: un
      solo resumen, mensajes junto a lo que explican] — hoy hay una
      caja por aviso, el patrón mal copiado.
- [x] **⭐ 4 · EL MINUTO UNA SOLA VEZ — HECHO (2/09).** El minuto vivo
      solo en la región (única voz que se refresca); la frase del paso
      dice la FRECUENCIA — no son el mismo dato (cada cuánto pasa vs
      cuándo viene) y el reloj del viaje sigue usando el vivo. ·
      **(el texto original) EL MINUTO DOBLE de la primera subida:** la frase del paso
      y la región dicen lo mismo; al refrescar la frase se queda
      vieja. Una sola fuente de verdad en pantalla (fundir cambia la
      narración del `sube` y su juez).
- [x] **⭐ 5 · LA DEMO — CONFIRMADA por el ojo (2/09): «la botonera la
      veo bien así»** (la bici en dos filas con sus rutas, los botones
      de BiZi con la cifra doble por decisión suya, el resumen único y
      el minuto una vez, vistos en localhost).

## 12 — Modo COCHE *(en grueso; parlamentado el 1/09: con TIPOS DE PARKING)*

*(Anotado el 29/08 — ⚰️ CUMPLIDO el 2/09 en la casilla 1a, con un
matiz que el censo impuso: el coche NO heredó el grafo del peatón —
sin ids de nodo solo aplicaba el 68,3 % de las restricciones — sino
que cocina sobre el VIARIO RODABLE descargado con geometría e ids
[la doctrina de OSRM: construir desde las ways], decidido por
Antonio con la medición delante: 96,6 % aplicables. El resto del
párrafo original, cumplido tal cual: relations obligatorias,
penalizaciones de car.lua copiadas con URL, transiciones
arista-a-arista.)*

*(⭐ VERIFICADO el 30/08, de la pregunta de Antonio por la ZBE —
sonda completa en scratchpad, cero descargas:)* **la capa municipal
EXISTE y es limpia**: MU1_ZBE_Zona_Bajas_Emisiones (WFS movilidad,
Ley 37/2007, keyword zbe_2025) — DOS rasgos MultiPolygon, fase=
«FASE 1» (33 vértices, ~1.318×869 m) y «FASE 2» (59, ~1.957×1.360 m),
el centro de la ciudad; la trampa del CRS viva (DefaultCRS 25830;
con srsName=4326 entrega lon,lat). ⚠️ SOLO trae geom y fase: ni
vigencia, ni distintivos, ni clases de vehículo, ni horarios, ni
excepciones — NO CONSTA en el dato. Qué fase rige y a quién alcanza
es LETRA LEGAL de este punto (la ordenanza ZBE, contra el articulado
como se hizo con la de movilidad), no se deduce de que un bbox sea
mayor que otro. El polígono veta/penaliza cuando el modo coche
exista; la descarga al repo, con su ficha, cuando este punto
arranque.

Dejado aquí el 18/08 (investigación de estacionamiento):

- [x] **⭐ Parkings públicos — SONDADO A FONDO (2/09, catálogo 55) y
      con la decisión encaminada.** LO MEDIDO: el directorio son 41
      puntos con coordenada, nombre y horario (Ley 37/2007) pero ⛔
      SELLADO EN 2013, sin plazas, sin tarifa, sin capacidad y SIN
      CAMPO DE TIPO — y la lista mezcla de todo (dicho por Antonio:
      «parkings de pago públicos con parkings de hotel, de centros
      comerciales y demás»): 8 concesiones municipales (ids 1-8, las
      de Indigo/ex-VINCI — y El Carmen y San Ignacio repetidos en el
      bloque 100: los 10 de Indigo están), 2 disuasorios del tranvía,
      ~15 de rotación céntricos, centros comerciales/súpers, 3
      hoteles, un colegio y el Quirón. ⛔ LA OCUPACIÓN «VINCI» está
      MUERTA desde 17/11/2020 (121 bytes idénticos en 6 lecturas/70
      min; 5 de 41; value sin unidad ni capacidad con que
      interpretarlo; la ficha declara «cada segundo» — la periodicidad
      del catálogo es una intención, no un dato, como la del ESRO).
      Los agregadores comerciales (Parclick/Onepark) traen precios DE
      RESERVA y cero ocupación — plataformas privadas sin licencia:
      como mucho, ENLACE saliente. ⇒ LA REGLA SI ENTRA (pantalla,
      casilla 3): entra por LISTA DE INCLUSIÓN DECLARADA por Antonio
      (la poda del 8, aplicada aquí) — el dato no distingue,
      distinguimos nosotros por lista escrita con su porqué; solo
      «dónde y a qué hora abre», nunca plazas ni precio. Se decide
      con la demo delante.
- [ ] **Parquímetros: NO entran hoy** (312, solo-API, sellados en 2015 y
      con la ampliación de zonas en puerta — entrarían caducados). Se
      reevalúa si el Ayuntamiento los refresca
- [ ] Aviso heredado de la investigación: la serie estadística mensual
      oficial NO cuadra con las capas geográficas (Libre: 31.676 vs
      49.222; Motos: 8.644, tercer número). Toda ficha declara la cifra
      DE SU fuente, nunca «las plazas de Zaragoza»

La red viaria. El último de los cuatro.

**⭐ PARLAMENTADO EL 1/09 (Antonio): el coche lleva TIPO DE PARKING.**

```
Coche → Tipo de parking: [Regulado] [Discapacitado] [Gratuito]
```

El encaje: `car-to-park` [OTP: conducir hasta el aparcamiento y
andar el resto — el mismo remate que el aparcabicis del 9]. Los tres
son CAPAS DE DATO y ninguna se promete sin sonda:
- [x] **⭐ 0 · LAS SONDAS de parking — HECHAS (2/09; 44 fixtures;
      fichas §1.10-1.13 re-medidas).** REGULADO ✅: 1.159 tramos
      ESRO/ESRE con geometría y plazas (WFS MU1_estacionamientos_
      calle: ESRO 664 · ESRE 495) + 13 zonas; ⚠️ SIN tarifa ni
      horario en ningún campo («aquí se paga», no cuánto ni cuándo);
      ⚠️ zona_reguladora ≠ regulado (5.049 tramos LIBRE la traen >0 —
      es la zona administrativa); ⛔ la ocupación publicada, muerta
      desde 06/2023 con frecuencia declarada «Instantaneo»; la
      ampliación de zonas NO está (WFS idéntico al 18/08). ·
      DISCAPACITADO ✅ (el mejor dato): 1.226 plazas PMR con
      coordenada, 0 sin ella, DOS fuentes que cuadran; ⚠️ el horario
      en 104 escrituras («PERMANENTE»/«0-24»…) — normalizar. ·
      GRATUITO: ⛔ no existe como dato (barridos los 438 conjuntos) —
      ⭐ DECISIÓN DE ANTONIO (2/09): «donde no hay regulado hay
      gratuito» → gratuito = el complemento: los 6.204 tramos LIBRE
      (49.222 plazas) del censo de calzada; los 28 tramos con tipo
      nulo, fuera de los dos montones y declarados; la palabra en
      pantalla se ve en la demo. · ⚠️ QUEDA DE ESTA CASILLA: la letra
      legal de la ZBE (qué fase rige, a quién alcanza) contra la
      ordenanza — no entró en las cinco sondas.
- [x] **⭐ 1a · LA RED DEL COCHE — COCINADA (2/09, tres commits).**
      LA BASE, decidida por Antonio con el censo delante: el viario
      rodable de Overpass con geometría e ids (25.242 ways · 174.893
      vértices · 138.553 nodos · 19,96 MB al repo con ficha) — el
      grafo del peatón no trae ids y solo casaba el 68,3 % de
      restricciones; por id casan el 96,6 %. EL CENSO de Zaragoza:
      1.283 restricciones (only_straight_on 580 · no_left 317 ·
      no_u_turn 221 · no_right 89 · only_right 52 · only_left 18 ·
      no_straight 6) · ⭐ NI UNA no_entry/no_exit (las que OSRM
      ignora: aquí no existen — decisión que no hay que tomar) · 11
      con via-way (contadas, no aplicadas) · 16 con except (solo 3
      motorcar) · 2 condicionales (aplicadas como incondicionales,
      conservador declarado). LA COCINA (177 ms · 13.959 KB ·
      determinista): 23.922 ways rodables → 57.390 aristas dirigidas
      · 14.407 de sentido único (8 con oneway=-1) · 1.214
      restricciones APLICADAS → 1.378 transiciones vetadas · 200
      aristas dentro de la ZBE marcadas · TODO lo que pesa copiado
      de car.lua con URL (tabla speeds 16 filas · default 10 ·
      turn_penalty 7,5 · turn_bias 1,075 · u_turn 20 con su
      limitación escrita · sigmoide literal · semáforo 2 s de
      lib/obstacles.lua): los vetos son dato y van al cocinado; las
      penalizaciones son fórmula. ⭐ EL HALLAZGO: el traffic_signals
      de OSM está DONDE ESTÁ EL POSTE, no en el cruce (1.298 de
      1.360 en nodo interior) — partiendo solo por cruces los 2 s no
      se cobrarían nunca: el semáforo también parte la vía (lo cazó
      la juez 6 en rojo con «26 casados»). LA ZBE: los 2 polígonos
      al repo con ficha; las aristas marcadas; el AVISO (no veto: la
      app no sabe la etiqueta del usuario) con la letra oficial
      medida [FAQ de la sede: L-V 8:00-20:00, sanciones desde el
      12/12/2025, B/C/ECO/CERO libres sin registro] queda para la
      1b. 13 jueces con ids reales (no_left 1211840 Asalto→Heroísmo
      · only 545214 Ctra. Logroño · except=bicycle 1243522 César
      Augusto — la juez 3 ENDURECIDA por la contraprueba: ahora
      nombra Calle Morería y el contador exacto) · 498 motor · 31
      fichas en el notices. Honestidades: el redondeo de semáforos
      corregido antes de reportar (7 vs 6 decimales); la juez del
      cierre del notices reescrita para comprar «cierra la lista»,
      no un número.
- [x] **⭐ 1b · EL VIAJE EN COCHE — HECHO (2/09, seis commits): EL
      COCHE RUTEA.** Sin campo nuevo en el tramo (el contrato ya
      separa por Trayecto.modo; «quien va montado no elige el camino,
      lo elige la línea» — el conductor elige); lo que sí entró en
      tipos fue Aviso.paso?: number, elegido por Antonio de tres
      opciones: el aviso dice a qué paso pertenece — general para
      todos, opcional, mata el reparto por cadenas (la lección de la
      nº22). LA BÚSQUEDA por TRANSICIONES arista-a-arista [el modelo
      edge-based que las restricciones exigen], y el dato lo
      justifica: de 200 pares al azar, 86 CAMBIAN de ruta por los
      giros vetados (rodeo medio 194 m, el peor 6.949) — un Dijkstra
      por nodos daría verde y estaría mal en el 43 %. EL AVISO ZBE
      con la letra oficial [FAQ de la sede] y paso: entra en «gira a
      la derecha hacia Calle San Blas» (el caso real); doble sitio.
      12 jueces (la no_left 1211840 rodea 1.644 vs 1.225 · el
      oneway:bicycle=no way 23134100: la bici sí, el coche no · las
      penalizaciones cobran, no cierran · inalcanzable se contesta) ·
      dos jueces endurecidas por su contraprueba (iban a
      viajeEnCoche a pelo; ahora por calcularTrayecto, la puerta de
      verdad). ⭐ BITÁCORA nº30, cazada midiendo los bordes: dos
      portales colgando del MISMO cruce (672 nodos así) daban 635 m
      para ir a 45, o «no hay forma» — el peatón lo tenía vigilado
      desde el 24/08 y su juez solo miraba andando; arreglado con la
      8bis (las aristas se buscan por way+cruce, nunca por índice).
      ⚠️ DATO, no motor: 2 cruces de Zaragoza que OSM cierra del todo
      (4 relations tapan las 4 salidas) — Doctor Iranzo × Leopoldo
      Romeo es uno: LEOPOLDO ROMEO 27 no tiene ruta en coche; NO
      CONSTA si es error de mapeo (a la nevera: corregirlo en OSM
      como vecino). MEDIDAS: p50 26 ms · p95 ~55 · 98,15 % de
      portales con ida y vuelta · 97,9/98,2 % de alcance · rss 537
      MB con las cuatro redes · 14.511 ways con nombre (57,5 %). La
      muralla de los cinco modos IDÉNTICA al byte (sha 631d50bc…). El
      ejecutor mató un motor zombi en el 3000 con código de cuatro
      commits atrás (pid==pid trabajando). 511 motor · 246 interfaz ·
      30 bitácoras, 0 abiertas.
- [x] **⭐ 2 · EL REMATE AL PARKING y la ZBE SELECCIONABLE — HECHA
      (3/09, tres commits): EL COCHE APARCA POR TIPO Y LA ZBE SE
      PREGUNTA.** El contrato ya tenía la forma (hito 'aparca' — dejar
      el coche y dejar la bici son el mismo suceso para quien pinta;
      la cláusula PARA no llegó a dispararse); crecen dos parámetros
      opcionales: aparcamiento (regulado·discapacitado·gratuito) y
      puedeEntrarEnLaZbe (el primer booleano del contrato — un
      'false' de texto no cuela). LOS TRES MONTONES del dato que
      llevaba tres semanas sin usarse [§1.11/§1.13]: 1.159 ESRO/ESRE ·
      6.204 LIBRE [la regla de Antonio] · 1.226 PMR; los 28 nulos en
      NINGUNO con juez por ids («leer ese silencio como gratuito
      sería inventarse 226 plazas»). LA ELECCIÓN POR COSTE [car-to-
      park de OTP; conducir + andar×4], candidatos acotados a 40 por
      rendimiento — y MEDIDO que no sobran: con 5, el ganador cambia
      en 32 de 58 viajes del gratuito (recortar = el radio a cuchillo
      por la puerta de atrás). EL CASO TRIPLE al mismo destino:
      regulado aparca a 140 m andando · PMR a 74 · gratuito a 509 —
      el trade-off a la vista. LA ZBE con su reloj [FAQ]: entra (aviso
      informativo) · rodea («esta ruta se ha buscado sin entrar») ·
      domingo a las 10 no aplica (aviso del reloj) · portal de dentro
      = respuesta honesta sin ruta. LA NARRACIÓN sin inventar: «zona
      regulada (ESRE)» sin tarifa ni franja (el dato no las trae) ·
      la PMR con su horario literal · «estacionamiento sin
      regulación» (la palabra del gratuito se afina en la demo).
      ⚠️ UN AVISO QUE MENTÍA, cazado midiendo (zona sin vigilar, no
      instrumento — sin bitácora, como el banner del 31/08): con el
      veto, el aviso de rodeo salía en 178/178 rutas incluidas las
      que ni se acercan al casco → el texto pasó a «se ha buscado sin
      entrar» (lo que consta; afirmar rodeo pediría una segunda
      búsqueda) y la juez 4-quater compra el caso que lo destapó.
      Perlas: los DOS VETOS no son independientes (para aparcar
      dentro hay que pisar dentro — la 4-ter no puede morder;
      redundancia declarada como intención) · el parking RESCATA
      portales (195/200 con ruta vs 189: bolsillos que OSM cierra al
      coche con bordillo al lado) · el coste del remate medido: 324
      de 332 ms son los 40 Dijkstras del peatón (si algún día pesa:
      búsqueda peatonal multi-destino, anotado). p50 26-262 ms por
      tipo · 527 motor · 246 interfaz (sin cambio) · muralla de los
      SEIS modos idéntica (sha aed16b24…) · 30 bitácoras.
      **⭐ PARLAMENTO del 3/09 (Antonio + la ordenanza delante): las
      EXCEPCIONES de la ZBE.** La ordenanza (Anexo 2 + el trámite
      municipal) contempla autorizaciones para vehículos sin
      distintivo: residentes · plaza de garaje propia · PMR · DUM ·
      comercios · 8 accesos/mes · ⭐ «acceso a APARCAMIENTOS PÚBLICOS
      conectados dentro de la ZBE» (con registro). La pregunta
      binaria sigue siendo la correcta (solo el usuario sabe si le
      aplica una excepción — modelarlas sería inventar su situación);
      lo que crece es EL TEXTO del aviso cuando no puede y el destino
      queda dentro: nombrar la puerta que la ordenanza abre, con
      fuente. → El CRUCE se hizo esa misma tarde (abajo) y el resto
      bajó a las casillas 2-bis y 3.
- [x] **⭐ EL CRUCE parkings-55 ∩ ZBE — HECHO (3/09, solo lectura, con
      el dentroDeLaZbe del motor, no una copia):** DENTRO DE FASE 1
      (restringen HOY): 4 — Puerta Cinegia (105) · César Augusto (3)
      · Plaza del Pilar-Juzgados (1) · Ayuntamiento (2). SOLO EN FASE
      2 (libres hasta 2030): 7 — Plaza de Toros (103) · Sanclemente
      (112) · El Carmen (113) · Santo Domingo (118) · Hotel Reino de
      Aragón (119) · Corte Inglés Independencia (122) · Salamero (4).
      FUERA: 30. La Fase 2 contiene entera a la 1 (0 anomalías).
      Contrapruebas mordidas (coordenadas cambiadas, polígono corrido
      1 km, y el bbox como método malo: se traga 8). ⭐ CONFIRMADO
      leyendo red-coche.ts (no supuesto): las 200 aristas del
      cocinado se marcaron SOLO con fase='FASE 1' — la vigente; con
      Fase 2 serían 884 (4,4×, medido y guardado para 2030). Las 4 de
      diferencia 200/204 del recuento: las gemelas de longitud par
      (punto medio calculado una vez sobre la ida) — nada que
      arreglar. ⚠️ NO CONSTA en el repo la excepción del
      «aparcamiento público conectado»: la capa ZBE no trae
      excepciones y la ordenanza descargada remite fuera — la fuente
      (trámite 42155) hay que traerla CON FICHA (→ 2-bis).
- [x] **⭐ 2-bis · EL REMATE AL PARKING PÚBLICO DE LA ZBE — HECHO
      (3/09, siete commits): un destino dentro ya no es «sin ruta».**
      parkings-zbe.json cocinado al repo (41 con banderas F1/F2, sha
      9d71d1e2…, determinista; ficha §1.31: el cruce ES NUESTRO con
      fecha, el mismo punto-en-polígono del motor) · la ficha §1.32
      del trámite 42155 con LOS 14 CASOS TRANSCRITOS tal cual,
      erratas incluidas («quitanieves¿») — la nº8 sostiene el remate:
      «vehículos que accedan a estacionamientos públicos con sistema
      de control de acceso conectado» · EL REMATE: no+dentro+franja →
      conducir sin pisar la zona hasta el mejor POR COSTE de los 4 de
      Fase 1 y andar (el caso: Pilar-Juzgados, 4.538+296 m, aviso con
      paso 10/17; con sí: 3.386 m al byte de la casilla 2) · EL CÓMO
      es EL PESTILLO: no veto ni penalización — transición dentro→
      fuera prohibida (todo camino o no entra o entra una vez y
      termina dentro; «estar dentro» se lee de la arista recorrida,
      sin duplicar el estado del Dijkstra), con UNA excepción medida:
      salir PARA rematar (bitácora nº31: Puerta Cinegia engancha a
      58,6 m FUERA, a una arista a la que solo se llega desde dentro
      — sin la excepción desaparecía del reparto EN SILENCIO con 27
      jueces en verde y el motor daba un parking peor; lo cazó un
      barrido cuyo recuento de ganadores tenía tres nombres donde
      debía haber cuatro). MEDIDO sobre 122 portales del casco: 0
      travesías · el coste ≠ la recta en 17 · ganan los cuatro (CA 52
      · PC 30 · PJ 25 · Ayto 15). ⭐ PERLA para la guía: EL POLÍGONO Y
      LA ARISTA MARCADA NO SON LA MISMA PREGUNTA (45/122 rutas
      «entran dos veces» en la geometría sin pisar dos veces la zona
      marcada — una juez sobre el polígono compraría suerte del
      caso). La contraprueba «sin pestillo» NO MORDÍA (la juez le
      pasaba el pestillo desde el spec — no veía dónde el motor lo
      pone; endurecida con los sellos de la respuesta entera: 28/128
      rutas atravesaban con 27 jueces en verde). El README y el log
      de arranque corregidos en dos commits no encargados y
      declarados (afirmaban el «sin ruta» que acababa de dejar de ser
      verdad); el guardián de las fichas pilló el 31→33 (tarde — se
      corrió la suite de app al final con trabajo solo de motor:
      dato para el método). Lo que NO se promete, escrito: ni que el
      parking siga abierto (2013) ni el «control conectado» (campo
      que el dato no trae) — el aviso cuenta la norma y manda al
      registro. El ORIGEN dentro sigue sin remate (de ahí no se sale
      sin pisar). 533 motor · 246 interfaz · 33 fichas · 31
      bitácoras, 0 abiertas.
- [x] **⭐ 3 · LA PANTALLA DEL COCHE — HECHA (3/09, cuatro commits).**
      [Coche] revela DOS preguntas (radios, nada preseleccionado
      [GOV.UK: en preguntas no se preinfluye]): «¿Dónde quieres
      aparcar?» y «¿Distintivo ambiental?» [CERO][ECO][C][B][Sin
      etiqueta][No lo sé] — CERO/ECO/C/B ⇒ true · Sin ⇒ false · No lo
      sé ⇒ se omite (la conducta informativa); las dos se omiten si
      no se tocan (el viaje de la 1b sigue existiendo). ⭐ Aviso.paso
      PAGANDO: la nota del remate cuelga del paso 10 («gira hacia
      Echegaray») — un paso sin nombre al que el reparto por texto
      jamás habría llegado. El aviso POSITIVO solo con etiqueta buena
      Y ruta que pisa. El hito 🅿 y el andando en ámbar discontinuo.
      6 de 7 jueces nacieron en rojo; contrapruebas una a una (una
      mutación rehecha porque no compilaba y el grep no veía errores
      — cazado). ⭐ EL ENLACE DGT MEDIDO ANTES DE ESCRIBIRLO: la URL
      «de manual» da 200 con «Page Not Found»; la buena es
      /vehiculos/informacion-de-vehiculos/distintivo-ambiental/
      (134.338 B, «por internet, sin identificación previa»). ⚠️ EL
      HALLAZGO DE LAS TRAZAS (d), medido sobre 399 pares: por la red
      del coche CERO tramos con el bus a >10 m de calzada (antes 147,
      peor 174 m por sendas — el error grave, invisible), pero el bus
      usa carril bus y contrasentidos que el coche no: en el casco se
      pinta rodeo (693 m reales → 2.055 en Plaza España→Coso 126) —
      el error menor, visible y honesto. Decisión del ejecutor
      respaldada: se queda por la red del coche; la solución de
      verdad es una red con carriles bus, escrita en la cabecera del
      módulo y comprada por la juez 9. README corregido en commit
      declarado (afirmaba el corte de pantalla). 534 motor · 252
      interfaz · sin bitácora (nada dio verde con fallo vivo).
- [x] **⭐ 3-bis · EL REPLANTEO DEL OJO — HECHO (3/09, ocho commits +
      la sonda B): el polígono, la traza roja, la autorización y LA
      MATRÍCULA EN CASA.** LA SONDA B primero (solo lectura): el
      fichero de la DGT existe («Microdatos de Distintivo Ambiental»,
      CC BY 4.0, diario ~09:03, ventana de 5 días) pero pesa 605 MB/
      día (37,8 M matrículas) y NO trae marca/modelo; la consulta de
      la sede es un GET limpio (sin captcha ni sesión, 0,45-1 s,
      solo la etiqueta; aviso legal: reproducción fiel + cita, la
      consulta automatizada NO CONSTA); ⚠️ el blanco del fichero NO
      es «sin distintivo» (····BGP en blanco y la sede dice B) · el
      MODELO no existe en fuente pública — Autodoc lo enseña porque
      paga TecAlliance, cuyo pie PROHÍBE expresamente copiar la base
      («acciones legales») → el modelo se cae con su porqué; Antonio:
      «solo nos hace falta la matrícula, no hay mayor problema» →
      LA CONSULTA EN VIVO, en casa. LO CONSTRUIDO: (a) el polígono de
      Fase 1 pintado en modo coche ANTES de generar (interactive:
      false, bajo las trazas); (b) TramoDelViaje.zbe?: boolean
      (elegido por Antonio contra un comoSeVa nuevo: ir por la zona
      no es OTRA manera de ir — se conduce igual, cambia dónde; los
      cinco modos viejos al byte) → la traza ROJA #d32f2f con ribete
      donde zbe, azul fuera; (c) la pregunta de la autorización
      revelada solo con [Sin etiqueta] (los 14 casos §1.32; Sí ⇒
      entra con su aviso; No ⇒ el remate); (d) GET /api/distintivo
      ?matricula= — valida los TRES formatos DGT, no-store, single-
      flight, tope+reintento, LA MATRÍCULA NI SE GUARDA NI VA AL LOG
      (juez 7 con grep sobre salida real); la pantalla marca el radio
      sola («Distintivo C — Fuente: DGT, hora»), con sinDistintivo
      marca [Sin etiqueta], con noExiste/mudo no toca nada; el enlace
      «Consulta tu etiqueta en la DGT» RETIRADO después (140c1d2:
      redundante con la consulta en casa; su juez retirada con el
      porqué escrito; la atribución «Fuente: DGT» se queda — la exige
      su aviso legal). ⭐ BITÁCORA nº32: el motor no sabía leer la
      respuesta BUENA de la sede (la frase del éxito vive en OTRO div
      que los avisos) — cuatro jueces verdes porque los fixtures
      tenían el texto medido y LA ESTRUCTURA COMPUESTA por el
      ejecutor; lo cazó pid==pid contra la sede real. LEY: un fixture
      de fuente ajena SE COPIA ENTERO, no se compone — medir el texto
      y no el HTML es medir la mitad. La contraprueba endureció dos
      jueces flojas (la del corte compraba CUÁNTAS rachas, no DÓNDE —
      173 m de rojo de más habrían colado; la del ribete medía
      constantes, no el dibujo). LOS TONOS medidos: rojo 4,34 tierra
      · borde 3,66 peor-del-plano (el único sin ribete, llega solo) ·
      relleno al 8 % = tinte 1,12 que conserva 4,03/3,88 encima · ⛔
      rojo vs azul 1,07:1 → por eso la zona se dice TRES VECES
      (polígono + aviso + corte) [WCAG 1.4.1 de verdad]. La capa ZBE
      servida como asset único para que mapa y motor corten por el
      MISMO fichero (descubrimiento declarado, angular.json). 541
      motor · 258 interfaz · 32 bitácoras, 0 abiertas.
- [ ] **4 · LA DEMO por el ojo.**

## 13 — Modo MOTO *(nuevo, parlamentado el 1/09; DEPENDE del 12: la
moto rueda por la red del coche)*

```
Moto → [Privada] [Pública YeGo]
```

LA DOCTRINA de partida: la moto privada es vehículo a motor — la red,
los sentidos y los giros del coche (RGC); su remate es el
aparcamiento de motos a pie de calle (el patrón aparcabicis /
car-to-park). La pública es alquiler compartido de ciclomotor
eléctrico [GBFS 2.2: form_factor MOPED; OTP: el calificador RENT] —
YeGo, en Zaragoza (palabra de Antonio), con dato que se actualiza
una vez por hora (palabra de Antonio: qué publica y en qué forma, NO
CONSTA hasta la sonda).

- [x] **⭐ 0 · LAS SONDAS — HECHAS (2/09) salvo la letra legal.** (a)
      APARCAMOTOS ✅: 2.146 con coordenada y 11.715 plazas (WFS
      MU2_motos; la sede dice 2.115 — 31 de diferencia, ⚠️ elegir
      cuál manda como se hizo con los postes; ⭐ la sede se movió
      ayer). · (b) YeGo ✅ EL DATO / ⛔ LA LICENCIA: tiene GBFS 2.3
      OFICIAL (services.rideyego.com/gbfs/2-3/zaragoza/es/gbfs) no
      registrado en systems.csv — 147 motos free-floating con
      posición, batería y autonomía, form_factor moped, ttl 240
      (cadencia real medida ~4,2 min), 0,31 €/min, geofencing, CERO
      campos personales; ⚠️ el «hora a hora» de la web es un fichero
      de folleto en S3 (dice 200 motos, trae 129); ⛔ sin license_url
      en el feed NI aviso legal en la web (sus términos de usuario no
      dicen nada de reutilización) → la decisión de fuente, de
      Antonio, cuando el 13 arranque. · ⭐ De propina: BiZi tiene GBFS
      v3.0 oficial (ttl 1, las mismas 276 estaciones) — fichado, no
      se usa hoy. · (c) ⚠️ QUEDA: la letra legal de la moto (carril
      bus, ZBE, zonas 30) contra el articulado.
- [ ] **1 · LA MOTO PRIVADA sobre la red del coche** (hereda el 12):
      su tabla legal con artículo, el remate en aparcamoto ≤ X m
      (el patrón del aparcabicis, X con doctrina), la narración.
- [ ] **2 · YeGo:** el patrón BiZi (estación/vehículo de origen con
      disponibilidad → pedaleo/rodadura → destino) con la frescura
      que el feed dé y el aviso honesto de su edad; el botón de
      disponibilidad a petición.
- [ ] **3 · LA PANTALLA:** el grupo [Moto] aparece en la botonera
      cuando esto exista (regla de la demo del 11).
- [ ] **4 · LA DEMO por el ojo.**

## 14 — Despliegue *(en grueso)*

Hostinger plan Node (slot 2), dominio, cron. Público y usable.

Dejado aquí desde el punto 5 (17/08):

- [ ] **El symlink se precisa con el panel delante**: `public_html` apunta
      a lo CONSTRUIDO (`app/dist/...`), NUNCA a `app/` literal — que
      expondría fuentes, `node_modules` y `app/data/` entero. La frase de
      CLAUDE.md era préstamo a brocha gorda del patrón ZetaBus; se corrige
      ahí cuando se ejecute esto
- [ ] Los NO CONSTA del panel de Hostinger, por resolver ANTES de
      desplegar: qué versión de Node ofrece (Angular 22 exige `^22.22.3 ||
      ^24.15.0 || >=26`) · cómo arranca un proceso Node persistente (el
      grafo vive en memoria: proceso vivo, no CGI) · si permite DOS
      procesos o el motor sirve también los estáticos
- [ ] **El mantenimiento de datos (el cron educado) — doctrina leída
      el 23/08, se ejecuta aquí**: la cadencia es POR CONJUNTO y con
      fuente (la declara el manifiesto del panel de frescura, punto
      14-adelantado — una verdad, dos usos: color y planificación).
      El patrón es el **GET CONDICIONAL** [MDN]: preguntar con
      If-None-Match (ETag) / If-Modified-Since (Last-Modified) y solo
      bajar si el servidor no contesta 304 — verificar QUÉ validadores
      emiten nuestras fuentes reales (zaragoza.es, IGN, NAP: NO
      CONSTA hasta medir). Reintentos con espera creciente; lo que
      casi nunca cambia se vigila menos. La frescura se comprueba
      sobre la HUELLA del dato, no sobre el «job OK» [ley nº10].
      Precedente vivo de la casa: el cron de ZetaBus (02:00);
      Hostinger: mínimo 15 min

## 15 — Estética *(en grueso)*

La capa visual que haga falta. La última, a propósito.

- [ ] Color de marca del proyecto — hoy `NO CONSTA`; los badges del README
      llevan el gris neutro de la casa hasta que se decida. *Surgió en el
      checkpoint del 16/08.*

## 16 — Intranet *(reservado para el final — nace el 22/08)*

Punto grande, sin desarrollar. Decisión de Antonio (22/08, al retirar
los andamios): **el visor de capas se muda aquí** — deja de ser página
pública de la app y se reconstruye al final como herramienta interna.

- [ ] **El visor de capas, reconstruido como intranet**: las catorce
      capas de verificación y la vista de cotejo de la ampliación del
      regulado (la morada — le tocará trabajar en 2027, cuando la
      ampliación se active). El código retirado el 22/08 vive en la
      historia de git; los datos siguen en el repo con sus fichas. La
      carga perezosa (bajar cada capa al marcarla) quedó dicha como
      opción el 18/08 y encaja aquí. ⭐ CÓMO RECUPERARLO (la doctrina:
      la gente no busca commits sueltos — vuelve a un punto conocido;
      este es el punto conocido): el borrado es `6327e45`; el estado
      anterior completo vive en su padre —
      `git show 6327e45^:app/src/app/capas.ts` (677 líneas) · ídem
      `visor.ts/.html/.css/.spec.ts` · `capas.spec.ts` · y el mapa.ts
      de entonces (1.001 líneas, los 14 pinceles en 261-972)
- [ ] Alcance, acceso (¿protegido?, ¿solo local?) y qué más contiene la
      intranet: `NO CONSTA` — se parlamenta al llegar

**⭐ ADELANTADO AL PRESENTE (parlamentado el 23/08): el panel de
frescura de los datos.** Idea de Antonio: cada conjunto cargado
necesita mantenimiento, y hace falta VER de un vistazo de cuándo es la
última descarga y de cuándo dice ser el dato según el propio fichero.
Mismo movimiento que el visor en su día — instrumento ahora, mudanza a
la intranet después — con la lección aprendida: NACE SIN TOCAR LA
PORTADA. Doctrina detrás: data observability / freshness (dos relojes:
generado vs disponible · umbral por conjunto, nunca universal ·
cadencia declarada o APRENDIDA del comportamiento · el color es
decisión con dueño).

- [x] **1 · El MANIFIESTO — HECHO (23/08, `133a3a9`)**:
      `datapackage.json` en la raíz, 21 resources (entran los ejes de
      vía; fuera los 5 _cabeceras.txt — recibos, no datos: 21 de 26
      ficheros, declarado). Estándar VERIFICADO POR DOS VÍAS: el
      ejecutor contra el schema oficial (8 mutaciones al validador, 8
      rojos) y el estratega con validación INDEPENDIENTE (perfil
      data-package del paquete de referencia, 0 errores; recuento de
      todas las cifras del checkpoint: cuadran). Huellas sha256
      recalculadas: 21/21 casan con las fichas. accrualPeriodicity en
      URI del vocabulario europeo (…/frequency/MONTHLY), como DCAT
      manda. Campos: modified 7 · descargadoEl 17 · caducaEl 3 —
      lo que no consta SE OMITE. ⭐ Hallazgo: el timeStamp de los
      GeoJSON del WFS es la hora en que GeoServer compone la
      respuesta (coincide al segundo con la descarga), NO la fecha
      del dato — guardado como descargadoEl, modified omitido.
      ⚠️ El manifiesto vive DUPLICADO (raíz canónica + app/public/
      porque Angular no publica fuera del workspace) con guardián
      byte a byte: la duplicación no desaparece, deja de ser
      silenciosa
- [x] **2 · La PESTAÑA — HECHA (23/08, `9e5bd35`)**: /panel por URL,
      lazy chunk de 7,43 kB, D1 y D2 aplicadas. La tabla con la regla
      Y SU CITA debajo de cada fila; contadores arriba. Semáforo:
      0 rojos · 0 ámbar · 4 verdes CON fuente (GTFS ×3 «vale hasta el
      05-10, 44 d» · ejes «la copia tiene 3 días») · 17 GRISES
      honestos — ⭐ el del callejero es el elocuente: regla mensual
      CITADA y aun así gris, porque no consta cuándo se descargó esa
      copia (vino del proyecto anterior): «hay contra qué medir,
      falta con qué». La deducción posible (mayo + mensual → hay
      versión más nueva) quedó DICHA y NO HECHA: esa regla no está
      firmada. La portada ni se enteró — raíz en frío: 6 peticiones ·
      459 KB · CERO de datos/manifiesto — y el guardián del 22/08
      ENDURECIDO: ahora cuenta el total de peticiones, no solo
      /datos/. F5 en /panel: 200 → comodín no; página propia.
      Contraprueba 9/9 — la novena cazó su propia prueba floja (el
      borde de caducidad a medianoche no mordía; endurecida a
      mediodía con el porqué escrito). 86 interfaz · 179 motor ·
      Antonio lo VIO en vivo («el tema diseño no es ahora») y el
      estándar quedó verificado independientemente antes de este
      destilado
- [ ] 3 · El mantenimiento que re-descarga NO va aquí: vive en el
      punto 14 (el cron educado), leyendo este mismo manifiesto
