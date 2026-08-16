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
- [ ] **Push de los dos commits de LICENSE y README** — decisión de Antonio
- [ ] Verificación de Antonio en GitHub con sus ojos: portada con README
      pintado y licencia detectada

## 2 — La pantalla antes que nada

- [ ] Proyecto Angular 22 creado (standalone, sin NgModules), `ng serve`
      levantando y **visto en Chrome**
- [ ] **`THIRD-PARTY-NOTICES.md` nace aquí** — con Angular entra el primer
      paquete npm, y el modelo de la casa es de tres ficheros (LICENSE +
      README + notices con tabla por fuente). *Surgió en el checkpoint del
      16/08: hoy no hay ni una dependencia; el día que entre la primera, el
      hueco se nota.*
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
- [ ] Atribución de OpenStreetMap visible y correcta: «© colaboradores de
      OpenStreetMap» con enlace — la palabra «colaboradores» no es opcional
      (obligación ODbL; ZetaBus pagó saltárselo)
- [ ] La respuesta falsa del punto 2 pinta una polilínea inventada en el
      mapa — el circuito formulario → pasos → mapa cerrado con datos falsos
- [ ] Visto en Chrome en el tamaño de ventana que usará la gente, no solo
      maximizado

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
