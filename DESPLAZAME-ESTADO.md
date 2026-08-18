# DESPLÁZAME — ESTADO

**Escritor único: la conversación de estrategia.** Nadie más escribe aquí.
El ejecutor reporta descubrimientos; no toca este fichero.

---

## ESTADO ACTUAL — 18 de agosto de 2026

**Dónde estamos: punto 5 (el motor mínimo), con el núcleo hecho y una
cola de capas y visor por delante.** Los puntos 1-4 están cerrados y
publicados. Lo que existe y funciona hoy:

- **La pantalla** (puntos 2 y 5): formulario donde TODO se elige, nada se
  escribe a ciegas — las calles con autocompletar contra el motor
  («LIMPIO [NÚCLEO]», corchetes porque los paréntesis son del dato), el
  portal de una lista con los portales reales de la vía en orden natural,
  borrador marcado si se sale sin elegir, y «Generar ruta» exigiendo los
  CUATRO códigos. 35 pruebas. La respuesta de generar sigue siendo el
  andamio ⚠️ DATOS DE PRUEBA (muere en el punto 6).
- **El mapa de verificación** (puntos 3-4): Leaflet+OSM con NUEVE capas
  apagables (portales, grafo, carriles, postes de bus, trazados de bus,
  tranvía ×2, BiZi, aparcabicis), ~34 MB, fluido. Microscópico dentro del
  formulario — su casa nueva será el VISOR (primera casilla pendiente).
- **El motor** (punto 5): workspaces npm (`tipos/`+`motor/`+`app/`),
  contrato vivo en `@desplazame/tipos` (11 tipos), `node:http` en el 3000
  tras el proxy `/api/**`. TypeScript SIN compilar (Node borra tipos).
  Carga ANTES de abrir el puerto: grafo (98.774 aristas, ~190 ms),
  callejero (3.359 vías, 7 ms — el fichero de portales se lee UNA vez) y
  los 46.150 portales enteros (99 ms). RSS ~248 MB — el punto 10 acumula.
  Endpoints vivos: `/api/salud` (declara todo lo que lleva) · `/api/vias`
  (sugiere solo lo cumplible) · `/api/portales?via=` (orden natural:
  sortNumber + Intl.Collator numérico).
- **⭐ Las cifras reales, medidas:** N = 3.359 vías · M = 2.731 sugeribles
  (la publicada) · 628 sin portal no se ofrecen · 46.150 portales · el
  callejero lleva CINCO correcciones propias en el fichero (2 CRT→CST +
  3 MRL completadas — «están mal y punto»; huella `5f5df76a…`).
- **La bitácora: 5 entradas, las 5 cerradas**, cada una con ley. **Dos
  guardias** (interfaz y motor) con rojos vistos; la del motor exige
  grafo + callejero + portales cargados y vigila los ficheros que lee.
- **La carta (CLAUDE.md) al día** con la doc oficial delante: el motor
  real (sin build), convención con puntero en vez de listas que caducan,
  `app/data/` correcto.

**Publicado hasta `169da6a` (cierre del punto 4). En local: el punto 5
entero** (de `ea66676` a `9eabbb6`: estructura, grafo en memoria,
callejero y `/api/vias`, autocompletar, selector de portales, entradas
nº4 y nº5, carta al día, y el plan con las tandas del 18/08).

**Lo siguiente (punto 5), en el orden de Antonio:**
1. **EL VISOR** — página nueva con el mapa a ventana casi completa y el
   control de capas entero; el router se queda (el visor le da el uso).
2. Las CUATRO capas nuevas, verificadas ya en grande: **aparcamotos** →
   **regulado en superficie** → **13 zonas reguladas** → **reservas PMR**.
3. La etiqueta del modo: **«Bici / patinete»** (solo presentación).
4. **El README** con endpoints y cifras medidas — y el punto 5 cerrado.

---

## 1 · Identidad

**Qué es:** buscador de rutas para moverse por Zaragoza. Cuatro campos
(calle y portal de origen y destino — todo elegido, nada tecleado a
ciegas), cuatro modos excluyentes (andando · bus/tranvía · bici/patinete
· coche), la ruta en el mapa y los pasos escritos. **Una sola pantalla de
búsqueda** (más el visor de capas como página de verificación). No es
multimodal: se elige un modo.

**Qué NO es:** no promete tiempos totales inventados. Para bus y tranvía
rige la decisión `G` (14/08): **componer sin prometer**.

**Repositorio:** `github.com/ablanquez/desplazame` (público) ·
local `F:\01_PROYECTOS\004_DESPLAZAME` · la OLD en
`F:\01_PROYECTOS\004_DESPLAZAME-OLD` (solo almacén: se copia DE ahí,
no se lee nunca DESDE ahí).

**Licencias:** código Apache 2.0 · datos ODbL (OSM), Ley 37/2007
(Ayuntamiento) y MITMS (GTFS del NAP, «Powered by MITRAMS»). Copyright
en el README (© 2026). Atribuciones colgadas de sus capas.

## 2 · Stack (cerrado el 16/08, firme)

- **Frontend:** Angular 22 standalone, sin NgModules. Leaflet + OSM.
  `@angular/router` SE QUEDA (el visor le da uso).
- **Motor:** Node + TypeScript ejecutado SIN compilar (Node borra tipos;
  no hay build — hecho de despliegue: ata el punto 10). `node:http`.
  Todo cargado en memoria antes de `listen()`.
- **Workspaces npm** de raíz única: `tipos/` + `motor/` + `app/`,
  lockfile único.
- **Tipos compartidos** (`@desplazame/tipos`, sin build): el contrato es
  UN fichero por symlink — si el motor cambia la respuesta, el front no
  compila, a propósito. Crece cuando el motor lo pide.
- **Endpoints:** bajo `/api`; los vivos los declara el motor
  (`motor/src/servidor.ts`), los previstos el plan (puntos 6 y 8). Proxy
  de desarrollo `/api/**` → 3000 (doble asterisco obligatorio en Vite).
- **Despliegue:** Hostinger plan Node. `public_html` apuntará a lo
  CONSTRUIDO, nunca a `app/` literal (se precisa en el punto 10).
- **Por qué Angular / por qué Node:** hueco del portafolio y stack de
  empresa · el grafo en memoria lo impone.

## 3 · Las reglas del reinicio

1. **Visualización desde el minuto uno.** Nada cuenta sin verse
   funcionar. La estética, la última.
2. **Estado y bitácora a cero.** La bitácora la escribe la skill
   `escribir-bitacora` ante fallo real, antes de arreglar.
3. **Alcance corto.** Nada entra por iniciativa propia. Documentación y
   plan son los raíles; lo que surja se encaja en el plan o no se hace.
4. **Commits atómicos** `tipo(ámbito): descripción`, push solo cuando
   Antonio lo diga.
5. **Los datos entran pieza a pieza con autorización expresa**, tal cual;
   integridad sobre CLON (ley nº3). Correcciones en el fichero solo
   cuando Antonio dice «está mal y punto», con huella nueva y tabla en
   la ficha.
6. **Ninguna cifra del proyecto viejo (ni de memoria) se hereda como
   criterio**: el dato manda.

## 4 · El plan

Vive en `PLAN-DESPLAZAME.md`, con casillas. Puntos: 1-4 CERRADOS · 5 el
motor mínimo (en curso: visor → 4 capas → etiqueta → README) · 6 primera
ruta andando · **6B destinos con nombre (nuevo, EN CONSTRUCCIÓN)** ·
7 bici/patinete · 8 bus/tranvía · 9 coche · 10 despliegue · 11 estética.
Los puntos 6, 8, 9 y 10 llevan cargado lo aplazado. La investigación de
datos abiertos vive en `docs/INVESTIGACION-EQUIPAMIENTOS.md`.

## 5 · Decisiones

Heredadas del intento anterior: **D-G** (componer sin prometer) · las
paradas se regeneran, no se copian (barrido punto 8) · velocidad a pie
5,0 km/h.

De este reinicio (16-17/08): `app/.vscode/` versionado [DOC] · el ZIP
del GTFS como instantánea con caducidad declarada · **D-MAPA-DE-HOY**
(la red operativa del día, punto 8) · reparto de censos (callejero+
municipal resuelven · enganchado salta al grafo · 124 sin enganche →
Aviso) · solo se sugiere lo cumplible (M=2.731) · norma Set-Cookie ·
el color de BiZi es marca · el correo del feed viaja tal cual · el
puerto del motor no abre hasta que el grafo está.

Del 18/08: **«LIMPIO [NÚCLEO]» con corchetes** (los paréntesis son del
dato) · **borrador marcado, no borrado** (opción B, usabilidad [DOC]) ·
**correcciones en el fichero cuando el dato está mal** (cinco en el
callejero) · **el portal se elige de lista, y en el punto 5** (la zanja
abierta) · **aparcamotos: fuente WFS** (32 altas que la API no volcó;
la discrepancia entera a la ficha) · **regulado + zonas + PMR entran**
(PMR es accesibilidad, no extra) · **parquímetros y parkings públicos NO
hoy** (2015/2013; parkings al punto 9) · **etiqueta «Bici / patinete»**
(el contrato no se renombra) · **el visor primero, y el router se
queda** · toda ficha declara la cifra DE SU fuente (las tres cuentas
municipales no cuadran entre sí).

## 6 · Cabos abiertos

**Punto 5 (la cola, en orden):** visor+router · aparcamotos · regulado ·
zonas · PMR · etiqueta · README (incluida su frase de cierre envejecida,
reportada por el ejecutor).

**Punto 6:** los 124 portales sin enganche → `Aviso` · los 628 con vía
sin portal → candidato a `Aviso` · 170 componentes del grafo (169
islas) · `Via.nombre` crudo viaja al navegador sin usarse (el 6 dirá si
lo usa) · la retirada de los andamios (~34 MB) tiene su casilla allí.

**Punto 6B:** en construcción — Antonio irá añadiendo. La cuestión del
dato personal de farmacias (titulares) tiene su salida apuntada.

**Punto 7:** la ordenanza VMP antes de etiquetar tramos (casilla en el
plan) · la doble capitalización «Senda ciclable/Ciclable» del origen.

**Punto 8:** líneas por poste (escritas en tres sitios, ningún guardián)
· caducidad GTFS (05/10; servicio real 27/12) sin vigilante hasta el
cron · `enlaces.json` referencia aristas por índice de ESTE grafo · API
viva de Bizi.

**Punto 9:** parkings públicos con sus dos fuentes cojas · parquímetros
reevaluables · el aviso de las tres cuentas municipales.

**Punto 10 (panel de Hostinger, todo NO CONSTA):** versión de Node
(exige `^22.22.3 || ^24.15.0 || >=26` Y ejecutar TS sin compilar) ·
memoria del plan (el motor pide ~248 MB y subirá) · proceso persistente
· dos procesos o estáticos desde el motor.

**Punto 11:** el color de marca (`NO CONSTA`; badges en gris).

**Método y vigilancia:**
- Nada vigila el README (dos entradas de bitácora lo avalan: nº1 y nº5);
  lo cubren la regla transversal — con su ley: la unidad es el documento
  entero — y la costura §6.
- 35 pruebas sin CI · guardias manuales y solo-Windows · su verde dice
  «no caducado», no «recién arrancado» · la guardia vive en
  `app/scripts/` y vigila a dos — con un tercero se queda pequeña ·
  `GRAFO_ESPERADO` a mano (si el grafo se regenera, roja hasta
  actualizar).
- Hueco latente del autocompletar (sonda, no vivo): escribir el texto
  desde fuera del componente conserva el código sin marcar · el eco:
  elegir dispara una consulta más a los 200 ms (inofensivo, nombrado).
- Los datos municipales caducan (callejero mensual; el regulado caducará
  DE GOLPE con la ampliación de zonas) — cuándo refrescar, Antonio.
- npm 11 bloquea scripts de 4 paquetes (esbuild, lmdb, msgpackr-extract,
  @parcel/watcher) · TypeScript rama 6 · del notices: bundle y licencias
  de transitivas en `NO CONSTA` declarado · `nombrePublicoNorm` existe y
  coincide; no se usa.
- El tranvía municipal (`MU3_lineas/paradas_tranvia`): nunca descargado,
  opción futura.
