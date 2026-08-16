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

**Dónde estamos: punto 1 del plan (cimientos), en curso.**
Repo iniciado en `main`, identidad `ablanquez` verificada, primer commit
`c2fc70d` con `.gitignore`, `CLAUDE.md` y `PLAN-DESPLAZAME.md`. Bitácora
vacía en `docs/` y este fichero, colocados.

**Lo siguiente:** primer encargo a Claude Code — generar LICENSE y README con
el modelo de la casa. Después, conectar el remoto y sustituir la `main` vieja
(operación de Antonio, con verificación en GitHub con sus ojos).

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

**Licencias — DECIDIDO el 16/08, ficheros pendientes de generar:** código
Apache 2.0 · datos ODbL (OSM) y Ley 37/2007 (Ayuntamiento). El mismo modelo
que Linaje, ZetaBus y el Desplázame viejo. **LICENSE y README los genera
Claude Code en su primer encargo**, partiendo de cómo están en el resto de
proyectos.

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
- El mecanismo exacto para que la `main` nueva sustituya a la vieja en GitHub:
  pendiente de ejecutar (punto 1).
- El **plazo del GTFS (05/10/2026)** afecta al punto 8; el barrido nocturno
  de Avanza no depende de él.
