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
      al punto 12 con su decisión preliminar: `public_html` apuntará a lo
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
      68.649 / 378.222). ⚠️ **196 MB de RSS** — dato para el punto 12: la
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
      Motor: 223 MB de RSS (+27) — el punto 12 acumula
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
      para la Intranet (punto 14)** — decisión de Antonio del 22/08: será
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
visor→Intranet (punto 14).
      La doctrina existe: en Valhalla la narración (odin) es fase
      propia que colapsa la lista de maniobras a una lista concisa
      [docs oficiales], y el modelo de maniobra trae
      `pedestrian_crossing_` de serie [maneuver.h leído] — el cruce
      peatonal es maniobra de tratamiento aparte, no un giro más.
      Encargo futuro: leer cómo odin decide qué colapsa y calcarlo;
      hasta entonces los 25 pasos son la verdad y NO se tocan

## 8 — Destinos con nombre: «de la calle X al hospital Y» *(nuevo, 18/08 — EN CONSTRUCCIÓN: Antonio irá añadiendo)*

El destino puede ser un SITIO además de calle+portal: se está en un
portal y se quiere ir al Hospital Miguel Servet, a una farmacia, a un
centro cívico. Va después del 7 porque REUTILIZA sus dos piezas: el
autocompletar (elegir-fija-código, mismo componente que calles y
portales) y el enganche coordenada→grafo que el 7 construye para los
portales — un sitio es una coordenada más entrando al mismo tubo.

- [ ] Fuente investigada (18/08, informe en
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
- [ ] **⚖️ PARLAMENTO ABIERTO — qué categorías entran (tanda 1)**:
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
- [ ] Decisión de presentación pendiente: 268/313 farmacias llevan
      nombre del titular (dato registral público; republicarlo es lícito
      pero es decisión consciente — la salida fácil: «Farmacia» +
      dirección al mostrar, sin editar el dato)
- [ ] El destino en el formulario: un tipo de destino nuevo (sitio) con
      el autocompletar existente; el contrato crece con el tipo del sitio
- [ ] El motor: cargar las categorías autorizadas, sugerirlas, y
      resolver sitio → coordenada → enganche al grafo (el del punto 7)
- [ ] **La regla del portal condicional** (parlamentada el 19/08): la
      casilla de portal se DESACTIVA y «Generar» no lo exige cuando el
      destino elegido no tiene portales — porque trae su propia
      coordenada (un hospital no tiene portal). La regla nace AQUÍ, con
      su primer caso real: construirla antes dejaría elegir destinos sin
      punto, cosa que ningún geocodificador permite
- [ ] **(Opcional, autorización pendiente) Las 628 vías sin portal,
      elegibles**: exige la pieza de TRAZADOS
      (`wfs_urbanismo-Vias`, ~3,4 MB MultiLineString, localizada en la
      investigación) y el patrón estándar [DOC Nominatim]: calle sin
      número → geometría → CENTROIDE como punto → enganche a la red.
      Sin la geometría no puede resolverlo ni el estándar — el requisito
      es el dato
- [ ] *(hueco para lo que Antonio vaya añadiendo)*

## 9 — Modo BICI/PATÍN PRIVADO y Modo BiZi *(re-escrito el 28/08
con lo aprendido en el 7 y el 8; parlamentado con Antonio)*

Dos productos distintos sobre el mismo esqueleto: la bici PROPIA va
puerta a puerta y remata en un aparcabicis; el servicio BiZi va
ESTACIÓN A ESTACIÓN en tres tramos y es solo-bici. Antonio firmó
(28/08) el selector a CINCO modos y la prioridad al carril bici. Lo
vigente del grueso del 21/08 se conserva dentro de sus casillas; lo
que el punto 7 dejó caducado (la penalización por pesos de OSRM
contra la decisión de mínimo-de-distancia) se re-parlamenta en la
casilla 3 con las cifras delante, no se hereda a ciegas.

- [ ] **0 · LA LEY HOY, verificada y no supuesta:** qué versión de la
      ordenanza municipal rige (TSJA + Nueva Ordenanza de Movilidad —
      el NO CONSTA del 21/08 se resuelve aquí) · la letra fina de VMP
      (edades, velocidades, por dónde puede ir el patinete) · y el
      RELOJ: el RGC reformado (RD 518/2026) entra en vigor el
      01-10-2026 — las citas del 121/121.5 migran al texto nuevo. Lo
      ya leído en grueso que se re-verifica contra la versión
      vigente: bici JAMÁS acera ni zona peatonal [Ordenanza + 121.5
      RGC] · quien EMPUJA es peatón [FAQ municipal + Convención de
      Viena art. 20.5] · acera-bici y plataforma a cota de acera
      [20 km/h, la clasificación municipal]
- [ ] **1 · EL CENSO del dato, solo lectura (el patrón del arranque
      del 7):** el grafo (la etiqueta `h` para tipos ciclables ·
      ⚠️ ONEWAY AUSENTE — la arista no trae sentidos y la bici en
      calzada los debe: qué se hace sin ellos, medido y a la mesa) ·
      la capa municipal calzada/acera/senda/calmado (el dato del
      acera-bici) · los APARCABICIS (5.520 anclajes, descargados el
      18/08) · las ESTACIONES BiZi (nunca descargadas: fuente,
      licencia, ficha — y su API viva de disponibilidad, que SE MUDA
      aquí desde el punto 10) · la velocidad de bici con fuente (el
      5,0 km/h es del peatón) · la PENDIENTE: los motores de bici
      usan elevación y NO CONSTA de dato de elevación — declarado y
      fuera, sin disimulo
- [ ] **2 · LA TABLA de acceso por modo, fila a fila con fuente**
      (el patrón de la casilla 2 del 7): bici (jamás acera · carril
      bici · calzada según ley) y PATINETE con lo que la casilla 0
      diga — si difieren en algo que afecte a la ruta, se ve aquí y
      se decide (desdoble o aviso honesto [D-G])
- [ ] **3 · EL COSTE con PRIORIDAD AL CARRIL BICI [firma de Antonio,
      28/08]:** la doctrina de costing bici de los motores
      (Valhalla/OSRM prefieren cycleway — el REVERSO del peatón),
      parlamentada con las cifras de nuestra red delante. Ojo
      declarado: el grueso viejo traía la penalización por pesos de
      OSRM (primary 0.5 · secondary 0.65 · tertiary 0.8) y el punto
      7 retiró las prioridades del peatón por mínimo-de-distancia —
      si la bici hereda pesos o no ES el parlamento, con doctrina y
      firma, no una herencia
- [ ] **4 · EL SELECTOR a CINCO modos [firma de Antonio, 28/08]:**
      Andando · Bus/Tranvía · Bici/Patín privado · BiZi · Coche —
      dos productos, dos entradas (excluyentes antes de pedir la
      ruta; BiZi no exige tener vehículo y es solo-bici). Sustituye
      la etiqueta «Bici / Patinete» del 18/08. El formulario y el ⇅,
      intactos
- [ ] **5 · EL MODO PRIVADO:** ruta puerta a puerta por su tabla y
      su coste + el remate del APARCABICIS más cercano al destino
      (el patrón portal-cercano sobre los 5.520) · la narración
      verificada (¿los combines del 7 valen en calzada con giros y
      sentidos?) · sus jueces en rojo primero
- [ ] **6 · EL MODO BiZi:** TRES tramos — andando → estación de
      origen CON BICIS · pedaleando (solo-bici, su tabla) →
      estación de destino CON ANCLAJES · andando → el destino
      [el patrón bike-share de los planificadores (OTP y compañía),
      verificado con doctrina en su encargo] · la disponibilidad en
      vivo por la API de BiZi, con D-G si la API calla (componer
      sin prometer) · sus jueces
- [ ] **7 · LA DEMO de los dos modos, vista por el ojo de Antonio**

## 10 — Modo BUS/TRANVÍA *(en grueso)*

Paradas, líneas y la decisión `G`: componer sin prometer, sin total
inventado. Barrido nocturno `POST /api/regenerar` (patrón ZetaBus, cron
02:00). Se detalla cuando el 7 y el 9 estén vistos funcionar.

Dejado aquí desde el punto 4, para cuando toque:

- [ ] **D-MAPA-DE-HOY (decidida por Antonio el 17/08, se construye aquí):**
      el mapa pinta la red operativa DEL DÍA, no el catálogo — el cron
      nocturno recalcula qué líneas tienen viajes hoy (cruce trips +
      calendar_dates contra la fecha) y el pintado sigue a ese cálculo.
      Un búho en martes no se pinta; una especial activada, sí
- [ ] **La comprobación de la fecha viva**: el cron mide en cada feed
      hasta cuándo llega el servicio REAL (hoy: 27/12, con el feed
      declarando 05/10 — se contradice) y lo reporta; la caducidad deja
      de vigilarse a mano
- [ ] **El cruce líneas↔postes** (routes+trips+stop_times contra los 944
      del MU3): la dependencia anotada en tres sitios sin guardián.
      El puente es el stop_code PA… — que MIENTE sobre el tranvía (los 50
      numéricos): el cruce lleva la guarda o pierde el tranvía en silencio
- [ ] **Un listado ingenuo de líneas ofrecería 8 que no llevan a ninguna
      parte**: las operativas son 45 (44 bus + tranvía), las 8 especiales
      están declaradas sin viajes. El buscador lista lo que opera
- [ ] **Los sentidos del tranvía NO se derivan del sufijo a ciegas**:
      tres saltos conocidos en los stop_code (`1311/1312`, `2322`, `2422`)
- [ ] Al retirar los andamios de carga (~35,6 MB en el navegador), la
      imprecisión menor del notices — que vivía en §1.7 (GTFS), no en
      §1.6 como fichaba este plan: puntero corregido el 22/08 — quedó
      CORREGIDA en `1deaa86`, verificada contra el dato y no copiada:
      196 service_id huérfanos (sin ningún trip); el 28, 29, 30 y
      31/12 son UNA línea huérfana cada uno — el 31/12 ni siquiera era
      servicio. La conservadora (05/10) no cambia

## 11 — Modo COCHE *(en grueso)*

Dejado aquí el 18/08 (investigación de estacionamiento):

- [ ] **Parkings públicos, si entran, es aquí** («aparca en el parking
      X», patrón aparcamotos/moto). Las dos fuentes conocidas y ninguna
      redonda: los 104 «Público» de `MU1_parking` (censo de garajes/vados
      — 7.129 privados que NO se pintan; varios públicos sin calle) vs
      los 41 de la API con nombre y horario pero sellados en 2013. Se
      decide con la demo delante
- [ ] **Parquímetros: NO entran hoy** (312, solo-API, sellados en 2015 y
      con la ampliación de zonas en puerta — entrarían caducados). Se
      reevalúa si el Ayuntamiento los refresca
- [ ] Aviso heredado de la investigación: la serie estadística mensual
      oficial NO cuadra con las capas geográficas (Libre: 31.676 vs
      49.222; Motos: 8.644, tercer número). Toda ficha declara la cifra
      DE SU fuente, nunca «las plazas de Zaragoza»

La red viaria. El último de los cuatro.

## 12 — Despliegue *(en grueso)*

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

## 13 — Estética *(en grueso)*

La capa visual que haga falta. La última, a propósito.

- [ ] Color de marca del proyecto — hoy `NO CONSTA`; los badges del README
      llevan el gris neutro de la casa hasta que se decida. *Surgió en el
      checkpoint del 16/08.*

## 14 — Intranet *(reservado para el final — nace el 22/08)*

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
      punto 12 (el cron educado), leyendo este mismo manifiesto
