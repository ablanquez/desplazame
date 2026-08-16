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
del plan. La entrada sigue 🔴 ABIERTA: el cierre (pieza B) queda pendiente.

**Sin push desde `5188ba5`:** seis commits en local — `01eb312` · `baccc36` ·
`299770d` · `726cb51` · `2742033` (bitácora) · `7976623` (README corregido).

**Lo siguiente (punto 2, segunda parte):** cerrar la entrada nº1, y después
el formulario, los botones y la respuesta falsa que cierra el ciclo en
Chrome.

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
- **La entrada nº1 de la bitácora sigue ABIERTA** con el arreglo ya hecho:
  el cierre en la misma sesión no ocurrió solo. Cierre en frío pendiente —
  y el dato va al taller, que es donde vive la skill.
- **La portada volverá a caducar cuando el punto 5 cree el motor** («no hay
  motor» dejará de ser cierto). No hay guardián que vigile el README y
  `NO CONSTA` que haga falta uno: hoy lo cubren la regla transversal del
  plan y la costura §6 de cada encargo. Si algún día se quiere un
  instrumento, lo decide Antonio.
- README y notices se apuntan mutuamente (datos ↔ dependencias). Correcto
  hoy; fácil que en la próxima ampliación uno describa al otro de oídas
  (aviso del ejecutor, 16/08).
- **El badge de Leaflet es promesa, no realidad** (Leaflet no está
  instalado). Decisión de Antonio: quitarlo ya o dejarlo hasta el punto 3,
  donde se vuelve cierto.
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
