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
      punto 6), la auditoría del viejo (viaja porque el fichero es
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
      calmado que usará el punto 7 (`bed5dc9`, `17a7a9b`, `ee2a809`,
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
      punto 4) o el barrido del punto 8; el puente es el `stop_code` PA…
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
      mina anotada para quien derive sentidos del sufijo en el punto 8
- [x] **Las estaciones BiZi dentro y VISTAS por Antonio** (17/08): 276
      exactas — la primera cifra heredada que cae clavada. La capa
      municipal MU1 en sus SEIS páginas tal cual (unirlas habría sido
      fabricar un fichero que nadie publicó; la app las une al leer), hash
      por página sobre clon (`51d47dd`). La API viva de zaragoza.es
      descartada por regla —el dato vivo es del punto 8— y fichada con su
      contradicción interna documentada (`821cb32`). Pintadas en el color
      corporativo #54A097 decidido por Antonio; si algún día choca, se
      ajusta la forma, no el tono: es marca (`da29696`). README releído,
      y de paso el ejecutor cazó su propio error propagado: la cuenta de
      datos de la portada iba una atrás desde el GTFS (`956e6a3`,
      `df8ac0d`). 5.520 anclajes totales, dato para el punto 7
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
      al punto 10 con su decisión preliminar: `public_html` apuntará a lo
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
      68.649 / 378.222). ⚠️ **196 MB de RSS** — dato para el punto 10: la
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
      · saltar al grafo (punto 6) → ENGANCHADO (portal → arista +
        distancia): regenerarlo sería rehacer trabajo de motor ya hecho
      · los 124 sin enganche → resuelven normal; en el punto 6 devuelven
        `Aviso` honesto en vez de fallar en silencio
      Verificación informativa para el 6: el casado por `portalId` entre
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
      Motor: 223 MB de RSS (+27) — el punto 10 acumula
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
- [ ] **El portal se ELIGE, no se escribe** (decidido por Antonio, 18/08 —
      transversal a los cuatro modos, y se hace AQUÍ con la zanja
      abierta: el formulario está recién trabajado y volver en el punto 6
      sería abrir la misma calle dos veces): al fijar la vía, el campo de
      portal ofrece los portales REALES de esa vía — el motor carga los
      46.150 enteros (la carga compartida que el estado ya anotaba) y un
      endpoint nuevo los sirve por vía. Elegir fija el portal como elegir
      fija la vía: mismo patrón, misma validación por código. La decisión
      fina heredada (el portal que no existe → ¿el más cercano con
      paridad?) deja de existir como problema: de una lista real no se
      elige lo que no existe
- [ ] **El destino de los andamios de carga (~34 MB), decidido aquí**:
      qué dato pasa a servirlo el motor y qué sigue bajándose el navegador
      para el mapa de verificación (que es de esta fase, no producto — lo
      dejó dicho Antonio). La retirada final es del punto 6
- [ ] **Revisar `@angular/router`**: instalado sin usar desde `ng new` (el
      CLI lo mete en su conjunto estándar aunque pases `--routing=false`).
      Si aquí sigue sin hacer falta, fuera
- [ ] **El README se amplía aquí** con los endpoints y las cifras que el
      motor MIDA (vías reales, nodos cargados, tiempo de arranque) —
      cuando existan de verdad, no antes

## 6 — Primera ruta: ANDANDO (aquí ya existe la demo)

- [ ] `POST /api/ruta` de portal a portal, modo andando
- [ ] La ruta se pinta en el mapa y los pasos salen escritos
- [ ] Probada con trayectos que Antonio conoce a pie — el juez es su ojo
      sobre el mapa, no un contador
- [ ] La respuesta falsa del punto 2 se retira (ya no hace falta el andamio)

## 7 — Modo BICI *(en grueso)*

Carriles y continuidad ciclable sobre el mismo esqueleto del 6.

## 8 — Modo BUS/TRANVÍA *(en grueso)*

Paradas, líneas y la decisión `G`: componer sin prometer, sin total
inventado. Barrido nocturno `POST /api/regenerar` (patrón ZetaBus, cron
02:00). Se detalla cuando el 6 y el 7 estén vistos funcionar.

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

## 9 — Modo COCHE *(en grueso)*

La red viaria. El último de los cuatro.

## 10 — Despliegue *(en grueso)*

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

## 11 — Estética *(en grueso)*

La capa visual que haga falta. La última, a propósito.

- [ ] Color de marca del proyecto — hoy `NO CONSTA`; los badges del README
      llevan el gris neutro de la casa hasta que se decida. *Surgió en el
      checkpoint del 16/08.*
