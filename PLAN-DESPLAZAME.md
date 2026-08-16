# PLAN — 004 Desplázame (reinicio)

Estado a 16/08/2026. Se tacha lo hecho. Los puntos 7 en adelante están en
grueso a propósito: se detallan cuando les llegue el turno, no antes.

Reglas que cruzan todo el plan:
- **Commits atómicos**, rutas escritas una a una. Push solo cuando Antonio lo diga.
- **Del punto 2 en adelante, nada está hecho hasta verse funcionar en Chrome.**
- La bitácora la escribe la skill `escribir-bitacora` cuando aparece un fallo
  real, antes de arreglarlo. Nadie la escribe a mano.
- `DESPLAZAME-ESTADO.md` lo escribe solo la conversación de estrategia.
- El repo es **público desde el primer commit**: nada entra sin licencia clara
  y sin revisar qué se está subiendo.

## 1 — Cimientos

- [x] Carpeta `F:\01_PROYECTOS\004_DESPLAZAME` creada, VS Code dentro
- [x] Historial viejo a salvo: tag `archivo/v1-motor` + rama
      `archivo/motor-vanilla`, verificados en GitHub (14/08)
- [x] `CLAUDE.md` en la raíz (PARTE A del taller + PARTE B con el stack
      cerrado: Angular 22 + Node/TS + Leaflet, 16/08)
- [ ] `git init` en la carpeta nueva, identidad verificada antes del primer
      commit: `ablanquez` / `278133158+ablanquez@users.noreply.github.com`
- [ ] `.gitignore` desde el minuto uno: `node_modules/`, `dist/`, artefactos
      de build. Revisado ANTES del primer commit, no después
- [ ] `LICENSE` Apache 2.0 (código) + declaración ODbL para los datos
      derivados de OSM y Ley 37/2007 para el dato municipal — en el README
      desde el commit 1, no "cuando toque"
- [ ] `README.md` honesto: qué es, en construcción, sin prometer nada que no
      exista todavía
- [ ] `docs/BITACORA.md` creada VACÍA (solo el título) — es donde escribirá
      la skill
- [ ] `DESPLAZAME-ESTADO.md` v0 a cero, escrito por la conversación de
      estrategia — corto: identidad, stack, este plan referenciado, y nada más
- [ ] Primer commit atómico con lo anterior. NO PUSH todavía
- [ ] Conectar el remoto y decidir el mecanismo para que la `main` nueva
      sustituya a la vieja (la vieja queda en `archivo/`). **Lo ejecuta
      Antonio con bloque preparado y verificación en GitHub con sus ojos**

## 2 — La pantalla antes que nada

- [ ] Proyecto Angular 22 creado (standalone, sin NgModules), `ng serve`
      levantando y **visto en Chrome**
- [ ] Estructura de carpetas mínima acordada antes de escribir componentes
      (una vista, sin router de páginas)
- [ ] Formulario de cuatro campos: calle y portal de origen, calle y portal
      de destino. Sin lógica detrás todavía
- [ ] Cuatro botones de modo **excluyentes**: andando · bus/tranvía · bici ·
      coche. Se ve cuál está activo
- [ ] Hueco del mapa y hueco de la lista de pasos, presentes en pantalla
- [ ] Botón «generar ruta» que pinta una respuesta FALSA fija (tres pasos
      inventados) en la lista — **el ciclo entero se ve funcionar en Chrome
      antes de que exista ningún dato real**
- [ ] Commit atómico por cada pieza que se vea funcionar

## 3 — El mapa vivo

- [ ] Leaflet + OSM dentro de la pantalla, centrado en Zaragoza
- [ ] Atribución de OpenStreetMap visible y correcta (obligación ODbL, no
      cortesía)
- [ ] La respuesta falsa del punto 2 pinta una polilínea inventada en el
      mapa — el circuito formulario → pasos → mapa cerrado con datos falsos
- [ ] Visto en Chrome en el tamaño de ventana que usará la gente, no solo
      maximizado

## 4 — Los datos entran

Cada pieza entra **solo con autorización expresa de Antonio**, una a una,
desde `004_DESPLAZAME-OLD` hacia `data/`. Se lee, no se edita a mano.

- [ ] Decidir formato y carpeta (`data/`) y dejarlo escrito en el estado
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
