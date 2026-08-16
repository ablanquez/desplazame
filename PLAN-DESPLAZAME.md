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

- [ ] Decidir formato y carpeta (`data/`) y dejarlo escrito en el estado
- [ ] **`THIRD-PARTY-NOTICES.md` se amplía aquí** con la tabla de fuentes de
      datos (OSM/ODbL, municipal/Ley 37/2007), fecha de descarga incluida
- [ ] Los 46k portales
- [ ] La continuidad peatonal y ciclable (el grafo: 68.649 nodos / 98.774
      aristas)
- [ ] Los carriles bici (49.972 aristas)
- [ ] Postes de bus + líneas que pasan (934 postes, 44 rutas, 74 sentidos)
- [ ] Líneas y su orden (del GTFS)
- [ ] Postes y recorrido del tranvía (50 paradas, 1 línea, 2 sentidos)
- [ ] Estaciones BiZi (276)
- [ ] Aparcabicis — **esta capa NO existe: hay que traerla de fuente** (se
      detalla cuando le toque)
- [ ] Cada capa que entre se PINTA en el mapa para verla — entrar sin verse
      no cuenta como entrar

## 5 — El motor mínimo

- [ ] Paquete de tipos compartidos: `Paso`, `Trayecto`, `Modo`, `Aviso` —
      antes que el servidor, porque es el contrato
- [ ] Servidor Node + TS mínimo (`node:http`), arranca y responde
- [ ] El grafo se carga UNA vez al arrancar y vive en memoria (medir cuánto
      tarda y dejarlo escrito)
- [ ] `GET /api/vias` — autocompletado sobre las 2.661 vías
- [ ] El formulario real consume `/api/vias` — **autocompletar visto
      funcionar en Chrome**
- [ ] **Revisar `@angular/router`**: instalado sin usar desde `ng new` (el
      CLI lo mete en su conjunto estándar aunque pases `--routing=false`).
      Si aquí sigue sin hacer falta, fuera
- [ ] **El README se amplía aquí** con los endpoints y las cifras (2.661
      vías, 68.649 nodos) — cuando existan de verdad, no antes. *Quedaron
      fuera a propósito en el checkpoint del 16/08.*

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

## 9 — Modo COCHE *(en grueso)*

La red viaria. El último de los cuatro.

## 10 — Despliegue *(en grueso)*

Hostinger plan Node (slot 2), dominio, symlink `public_html → app`, cron.
Público y usable.

## 11 — Estética *(en grueso)*

La capa visual que haga falta. La última, a propósito.

- [ ] Color de marca del proyecto — hoy `NO CONSTA`; los badges del README
      llevan el gris neutro de la casa hasta que se decida. *Surgió en el
      checkpoint del 16/08.*
