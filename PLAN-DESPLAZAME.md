# PLAN — 004 Desplázame (reinicio)

Estado a 16/08/2026 (tarde). Se tacha lo hecho y lo nuevo se añade en su punto.

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
      pinta), el enganche portal→arista (se conserva para el motor del
      punto 7), la auditoría del viejo (viaja porque el fichero es
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
      el 27/12; vale el 05/10 del publicador, la conservadora).
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

**ENCARGO A — el dato de nombres (autorizado por Antonio el 20/08 al
fijar el formato Google):**
- [ ] El fichero de nombres OSM entra al repo: la respuesta Overpass de
      la rama archivada (`2026-08-02_…_nombres.json`, 5 MB, 19.897 ways
      con `name`) — ficha completa con: el desfase de UN DÍA con el
      grafo (02/08 vs 03/08) declarado, la cobertura medida (16.994 de
      47.758 ways del grafo → 40,8% de aristas, 37% de km — y que ese
      40% es el TECHO real de OSM: el resto son aceras y pasos sin
      nombre, no un fichero cojo), y el 19,4% de portales cuya vía OSM
      DISCORDA del callejero (auditoría `cv`), declarado con la regla:
      el interior habla OSM, los extremos hablan municipal

**ENCARGO B — el motor:**
- [ ] **La proyección portal→arista, construida aquí** (el enganche se
      perdió): sobre el subgrafo a=1 ∧ c=0, patrón Loki — proyección
      perpendicular, punto DENTRO de la arista, conector
      portal→proyección en la geometría, `node_snap_tolerance` declarada
- [ ] **Las 4 combinaciones extremo-extremo** [DOC — el naïf produce
      retrocesos de una manzana] y **el caso trivial** de misma arista
      con trato propio [DOC Valhalla]
- [ ] **«Sin camino» es un resultado**: islas → `Aviso` honesto; los 124
      sin enganche → `Aviso`
- [ ] **Dijkstra unidireccional con montículo binario, MEDIDO** (la doc
      respalda que basta: el peatonal usa jerarquía local; el
      bidireccional es para grafos continentales)
- [ ] `POST /api/ruta` — el contrato crece con lo que la respuesta pida:
      geometría con conectores, pasos al formato Google (cardinal
      inicial · giro clasificado por `turn.cc` · «hacia X» con nombre
      OSM o por tipo con `p` · metros del tramo · lado del destino por
      producto vectorial), metros totales, duración DERIVADA (5,0 km/h,
      dicha como derivada — D-G) y `Aviso`
**ENCARGO C — la pantalla:**
- [ ] La ruta se pinta en el mapa (con sus conectores) y los pasos salen
      escritos con el formato de la captura: flecha + «Gira … hacia …» +
      metros por tramo + «El destino está a la …»
- [ ] La respuesta falsa del punto 2 SE RETIRA (ya no hace falta el
      andamio)
- [ ] Probada con trayectos que Antonio conoce a pie — el juez es su
      ojo. Entre ellos, los casos de la doctrina: uno trivial (misma
      calle), uno con islas, uno céntrico largo
- [ ] **Se retiran los andamios de carga del mapa de verificación**
      (decidido el 18/08 en el punto 5): el navegador deja de bajarse los
      ~34 MB (grafo 22,8 + portales 10,3 + carriles + shapes + stops +
      BiZi + aparcabicis), sale la entrada `datos` de `angular.json`, y el
      mapa de capas se replantea — las casillas eran verificación de la
      fase de datos, no producto (dicho por Antonio el 17/08). Qué
      visualización queda en la demo lo decide Antonio entonces

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
- [ ] Qué categorías entran: decide Antonio pieza a pieza (patrón del
      punto 4: autorización, ficha, verificación)
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

## 9 — Modo BICI / PATINETE *(en grueso)*

Carriles y continuidad ciclable sobre el mismo esqueleto del 7. La rueda
pequeña comparte red (bici, patinete, BiZi — este último solo-bici).

- [ ] **Verificar la ordenanza de Zaragoza sobre VMP antes de etiquetar
      tramos** (apuntado el 18/08): bici y patinete no van idénticos en
      toda vía (acera-bici, zonas peatonales, edades). Si hay diferencias
      que afecten a la ruta: decidir si el modo se desdobla o basta el
      aviso honesto (patrón D-G, componer sin prometer)

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
      imprecisión menor del notices §1.6 (dice 31/12; el servicio real
      usado llega al 27/12, el 31 es de huérfanos) se corrige en la misma
      pasada que toque ese fichero

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

## 13 — Estética *(en grueso)*

La capa visual que haga falta. La última, a propósito.

- [ ] Color de marca del proyecto — hoy `NO CONSTA`; los badges del README
      llevan el gris neutro de la casa hasta que se decida. *Surgió en el
      checkpoint del 16/08.*
