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

**Dónde estamos: punto 1 del plan (cimientos), a falta de dos casillas.**
Repo iniciado en `main`, identidad `ablanquez` verificada. Remoto conectado y
`main` sustituida con `--force` el 16/08 — el archivo del viejo verificado
intacto en `49e1105` antes y después. LICENSE y README generados por Claude
Code en su primer encargo (Extra effort), partiendo de Linaje y ZetaBus:
commits `6b43700` y `1f2498d`, atómicos, árbol limpio.
Cuatro commits en local: `c2fc70d` · `d4558b2` · `6b43700` · `1f2498d`.

**Lo siguiente:** push de los commits pendientes (decisión de Antonio) y su
verificación en GitHub con sus ojos. Con eso el punto 1 se cierra y empieza
el punto 2: la pantalla.

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

## 6 · Cabos abiertos

- La capa de **aparcabicis no existe** en ningún sitio: habrá que traerla de
  fuente cuando le toque (punto 4 del plan).
- `THIRD-PARTY-NOTICES.md` no existe todavía — el modelo de la casa son TRES
  ficheros, no dos (hallazgo del ejecutor, 16/08). Nace en el punto 2 con la
  primera dependencia npm y se amplía en el 4 con las fuentes de datos.
- El color de marca del proyecto: `NO CONSTA`. Los badges del README llevan
  el gris neutro de la casa hasta que Antonio lo decida (punto 11).
- El **plazo del GTFS (05/10/2026)** afecta al punto 8; el barrido nocturno
  de Avanza no depende de él.
