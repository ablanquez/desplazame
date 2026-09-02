# DESPLÁZAME — ESTADO

**Escritor único: la conversación de estrategia.** Nadie más escribe aquí.
El ejecutor reporta descubrimientos; no toca este fichero.

---

## ESTADO ACTUAL — 1 de septiembre de 2026

**⭐ PUNTOS 1-11 CERRADOS (el 11, el 2/09: LA BOTONERA DE LA DEMO —
la bici en dos filas [Privada|Pública BiZi] con sus tres rutas, los
botones «Bicis ahora / Anclajes ahora», el resumen único de avisos y
el minuto una sola vez; el ojo: «la botonera la veo bien así». El 10, el 1/09: EL BUS Y EL TRANVÍA
ENTEROS — el feed del NAP con su cron probado, la red cocinada en
patrones, RAPTOR con los pesos de OTP, la ruta operativa de hoy con
los desvíos reconstruidos, la consulta viva a Avanza y el botón
«Próximo bus», la pantalla con colores de línea, chips y ribetes por
WCAG; 28 bitácoras; el ojo: «funciona perfecto». El 9, el 30/08: la rueda ENTERA — seis
modos en pantalla, bici/patín/BiZi ruteando por sus tablas con
empuje, selector de ruta, aparcabicis a ≤500 m firmados, BiZi vivo
estación a estación, pintado por tramos con el azul #2563eb, y LA
DEMO confirmada por el ojo: «las rutas, de puta madre»; de fondo
queda SOLO la fase 2 de sentidos — la mesa de decisiones se VACIÓ el
mismo 30/08). La demo andando está ENTERA: real, legal (art. 121.1 +
tabla de acceso), mínima en metros (el ojo de Antonio), ligera (0,22
MB en frío, eran 41) y bien narrada (los combines de odin). Y LA
RUEDA, del cierre: red propia de 92.684 aristas (58.914 rodando +
33.770 empujando) con sentido demostrado, tres modos por sus tablas
con artículo, el defecto legal del art. 50 RGC, y la muralla del
peatón intacta al byte (sha256 de sus 391 rutas). EL
PUNTO 8 CERRADO con la poda de demo firmada: SIETE categorías de sitios (farmacias · centros de salud ·
hospitales · bibliotecas · colegios e institutos · guarderías ·
universidades — 820 sitios, 802 buscables), TODA calle sugerible
(3.350: 2.731 con portal + 619 por punto medio — el Puente de Piedra
se escribe), el buscador por tipos completo con siglas e iconos, el
foco en las dos capas, y las bitácoras cerradas (29/29 al 1/09).**

Lo que existe y funciona, todo visto por el ojo de Antonio (inventario
levantado el 18/08, des-caducado del 21/08 al 1/09):

- **La pantalla** (el buscador, en la raíz): formulario donde TODO se
  elige — calles con autocompletar contra el motor («LIMPIO [NÚCLEO]»,
  corchetes), portal de lista real en orden natural, borrador marcado si
  se sale sin elegir, «Generar ruta» exigiendo códigos resueltos. CADA
  CAMPO: [📍 ubicación][tipo ▾][cajetín][nº] — el tipo (Dirección
  primera + Bibliotecas · Centros de Salud · Colegios e Institutos ·
  Farmacias · Guarderías · Hospitales · Universidades, alfabético
  calculado) filtra el cajetín a UNA capa [Pelias layers hecho
  interfaz], con las siglas buscables (conSiglasEnteras: «ceip
  moliner» encuentra — el troceador las partía en letras) y las
  PALABRAS VACÍAS sin poder de veto en vías (30/08: «rodrigo
  rebolledo» encuentra la calle con su «de» — copia indexada sin
  de·del·la·las·los·el·y, camino que solo añade); cada opción con su icono dentro [Customizable
  Select, texto siempre + aria-hidden; degrada a texto sin soporte] y
  la chincheta de Dirección por campo (verde origen · roja destino);
  el nº existe solo con Dirección [GOV.UK revelado condicional]; «Mi
  ubicación» en ambos (al usarla, el tipo salta a Dirección); el ⇅
  cruza tipo+texto+nº. TODA calle se sugiere [Pelias]: las 619 sin
  portal por su punto medio (mitad del recorrido), sin casilla de Nº
  [revelado]; el FOCO también en las vías (la Calle Mayor de
  Garrapinillos primera desde Garrapinillos [TriMet]).
  Búsqueda por palabras, orden con foco al otro extremo, regla B e
  iconos por categoría (cruz verde · cruz azul · H azul · libro
  morado · lápiz-manzana, chupete y birrete en mostaza #614800 ·
  chincheta).
  Modos (30/08; en DOS FILAS desde el 2/09): CINCO familias —
  [Andando] [Bus / Tranvía] [Bici] [Patín (VMP)] [Coche] — y al
  elegir [Bici] se revela «¿Qué bici?» [Privada | Pública BiZi]
  (Privada por defecto) [GOV.UK revelado condicional]; radiogrupos
  nativos (name propio por fila, parada única de tab, flechas,
  exclusión); el estado es UNO (familia = computed de modo); desde el
  31/08 BUS/TRANVÍA llama al motor — solo coche avisa sin preguntar. EL BUS EN PANTALLA
  (31/08): tramos a pie ámbar · cada tramo montado en EL COLOR DE
  SU LÍNEA con su traza real · chips [29] con número y color ·
  postes 🚌/🚏 · «Sube a la línea X en el poste Y — N paradas —
  próximo en M min (dato de las HH:MM)» o su frecuencia teórica ·
  transbordo en el mismo poste como UN paso ⇄ · el desvío en dos
  niveles (el hecho siempre; «detalles» con botón accesible) · el
  indicador de espera si Avanza tarda >1 s · cada poste con SU
  NÚMERO («poste 33 · Av. Academia…») · el botón «PRÓXIMO BUS» junto
  a cada subida/transbordo de bus (región de estado accesible, cada
  pulsación pregunta a Avanza) · los chips heredados de ZetaBus
  (blanco con contorno; búhos en azul noche) · RIBETE bajo toda
  línea montada y bajo el a-pie y la bici, por WCAG 1.4.11. «¿Qué ruta prefieres?» (30/08): Rápida · Equilibrada
  (defecto) · Tranquila, SOLO en bici/BiZi [revelado GOV.UK;
  doctrina CycleStreets] — Generar trae las tres en paralelo y el
  radio repinta sin nueva petición. LA RUTA POR TRAMOS (30/08
  tarde): a-pie ámbar discontinuo · rodando AZUL #2563eb sólido ·
  el empuje ámbar en mitad del azul · hitos 🚲/🅿 en el dato; los
  privados rematan en aparcabicis (tope 500 m andando) y BiZi va
  estación↔estación con números y hora vivos (o el aviso D-G si la
  API calla). ⇅ invertir y «Mi
  ubicación» dentro (punto 6). Y «Generar ruta» devuelve la RUTA REAL —
  pintada, con los pasos escritos y las negritas por partes: la
  respuesta falsa murió sin rastro (`2013c04`). DOS páginas y sin
  barra: el buscador (la raíz) y **/panel** (el panel de frescura,
  por URL, lazy 7,43 kB — 39 filas desde las descargas de la rueda,
  las dos nuevas en gris NO CONSTA); el comodín
  cubre cualquier otra ruta, /visor incluida.
- **El peso** (22/08): la raíz en frío baja **0,22 MB en 3
  peticiones** — antes 41,07 MB en 20 (cifra FIJADA con comando; los
  ~34 y ~42 que corrían por los papeles eran herencias). El visor y
  sus catorce capas: RETIRADOS de la app, reservados para la
  **Intranet (punto 16)**; recuperables de git (`6327e45^`, escrito en
  el plan). Los DATOS siguen en el repo con sus fichas — lo que murió
  es su publicación al navegador.
- **El motor**: workspaces npm, contrato en `@desplazame/tipos`,
  TypeScript SIN compilar, carga antes de `listen()` (grafo 98.774
  aristas ~190 ms · callejero 3.359 vías · 46.150 portales), 412 MB de
  RSS observados el 22/08 al arrancar (eran ~248 en el punto 5;
  anotado para el punto 14). Endpoints vivos, NUEVE (el séptimo del
  31/08: `POST /api/renovar-feed`, el del cron — token Bearer en
  cabecera, 503/401/409/202, single-flight de trabajo de fondo; el
  octavo del 1/09: `GET /api/poste-vivo?poste&linea`, el del botón
  «Próximo bus» — idempotente, no-store, single-flight, 400 si se
  pregunta mal, mudo con motivo al log; el noveno del 2/09: `GET
  /api/estacion-viva?estacion&pide=bicis|anclajes`, el de los botones
  de BiZi — mismo régimen; y `POST /api/ruta` acepta `modo=bus` desde
  la 3b):
  `/api/salud` · `/api/vias?q=` (con `foco`) · `/api/portales?via=` ·
  `/api/portal-cercano` · `/api/sitios?q=` (foco y `capa` opcionales) ·
  `POST /api/ruta` (sitio o vía-sin-portal en cualquiera de los dos
  extremos; `modo` opcional bici·patin·bizi y `ruta` opcional
  rapida·equilibrada·tranquila desde el 30/08; la respuesta viaja EN
  TRAMOS — TramoDelViaje con comoSeVa/desde/hasta/hito sobre la
  geometría única). ⭐ N = 3.359 · sugeribles 3.350 (2.731 con portal
  + 619 por punto medio).
- **Los datos**: TREINTA Y UN conjuntos descargados / veintitrés
  fichas (la §1.23, nueva el 30/08: LA DISPONIBILIDAD VIVA de BiZi —
  la primera fuente del proyecto que no se copia, se CONSULTA; §1.8
  corregido en consecuencia) — los
  nombres OSM en `motor/data/` sin viajar al navegador (§1.14), LA
  RUEDA del punto 9 (§1.21 Overpass ampliada sin filtro de nombre:
  oneway 65,2 %/maxspeed 41,7 % de la calzada urbana, 11,3 MB ·
  §1.22 MU1_jerarquia_viaria: limite_vel en 3.644 tramos, enganche
  2.049/2.049 — manifiesto a 39, las dos filas en gris NO CONSTA),
  los ejes (§1.15) y las SIETE categorías de sitios del punto 8:
  farmacias (§1.16, 313/310), centros de salud (§1.17, 56/56),
  hospitales (§1.18, 17/15), bibliotecas (§1.19, 35+223: 77/75) y
  las TRES de educación (§1.20 TRIPLE: once ficheros → colegios e
  institutos 264/254 · guarderías 64/64 · universidades 29/28, con
  cada decisión de reparto citada) — manifiesto a 39 resources con
  validador contraprobado;
  cada uno con ficha, huella sobre clon y atribución. CINCO
  descargas propias (aparcabicis, aparcamotos, regulado, zonas, PMR),
  todas con la norma Set-Cookie. El callejero lleva 5 correcciones
  declaradas («están mal y punto»).
- **La bitácora: 14 entradas, las 14 cerradas con ley** (la nº14 el 27/08: el testigo se cayó solo, que era para lo que estaba escrito). Las guardias
  (interfaz y motor) con rojos vistos, exigiendo las tres cargas.
- **La carta y el README al día con la doc delante**: CLAUDE.md dice el
  motor real y apunta en vez de listar; el README tiene «Cómo arrancarlo
  en local» PROBADO en clon limpio, los endpoints leídos de `servidor.ts`,
  los documentos
  del método enlazados, y la frase de cierre veraz.

**Publicado hasta `9346fcb`** (push del 30/08 noche: el punto 9
entero, la casilla 0 del 10 con sus nueve firmas y el NAP
comprobado). **En local, sin publicar: EL PUNTO 10 ENTERO, los papeles públicos y
la decisión sobre Avanza**
(31/08 y 1/09 — el censo, el cron, la cocina, el viaje, los pesos de
OTP, los desvíos, la pantalla, los contrastes, el vivo a petición,
las bitácoras nº17-28 y los papeles; más de sesenta commits). El
push es de Antonio.

**LAS CASILLAS 2-4 DEL 11 (2/09, un solo encargo corto).** BiZi gana
sus botones «Bicis ahora / Anclajes ahora» (GET /api/estacion-viva,
patrón Próximo-bus calcado; «ausente» nunca se traduce a «0 bicis»
[GTFS-RT]); el resumen ÚNICO de avisos [GOV.UK]: una caja, una línea
por aviso enlazando al paso con la MISMA regla que pinta la nota,
invertida; el minuto vivo UNA sola vez (la región; la frase dice
frecuencia). Decisión del ojo: en BiZi la cifra va en frase Y región,
cada una con su hora. La contraprueba cazó una zona sin vigilar y un
fixture que violaba el contrato (se arregló el fixture). 485 motor ·
246 interfaz. Visto por el ojo: «yo lo veo bien así».

**LA BICI EN DOS FILAS (2/09 — punto 11, casilla 1).** [Bici] revela
[Privada|Pública BiZi] + las tres rutas [GOV.UK revelado condicional];
el estado sigue siendo UNO (familia = computed de modo, no señal);
values del contrato bici|bizi; motor y contrato intactos (muralla).
240 interfaz (+10) · 18 jueces en Chrome. El «agujero» del guardián
de la raíz (1/09) corregido: no existe — HttpClient sale por fetch.

**LOS PAPELES PÚBLICOS AL DÍA Y LA DECISIÓN SOBRE AVANZA (1/09,
noche).** README y notices con el punto 10 dentro (cinco modos; la API
de hoy con sus ocho rutas; el bus medido: p50 750 ms de los que 36 son
motor; el hueco del Pilar CORREGIDO: del 10 al 18/10 sin ninguna fila,
el tranvía vuelve el 19). La sonda legal cazó que el aviso legal de
Avanza PROHÍBE la extracción/reutilización (sui generis; ZetaBus lo
fichaba como «sin términos»); la fuente municipal del transporte
(sede, Ley 37/2007) da llegadas pero peores (dos coches, texto libre,
sin tranvía, 400 intermitentes) y su recorrido es el GTFS de 2013 sin
desvíos. DECISIÓN DE ANTONIO: «es un dato público de un servicio
público y esto es una demo — se atribuye y para adelante». Hecho: la
línea de créditos en el pie (Avanza · NAP/MITRAMS —cuya atribución
llevaba diez días sin cumplirse— · Ayuntamiento · OSM), las fichas
§1.24 (llegadas) y §1.25 (ruta operativa) con la decisión y el aviso
transcrito, §1.26 la fuente municipal fichada y no usada, 27 fichas.
⚠️ Lección mía: convertí una línea de créditos en un encargo con
sonda y contraprueba — megalomanía en versión pulido; Antonio lo
dijo con razón. 470 motor · 230 interfaz · 29 bitácoras.

**EL PARLAMENTO DE LA DEMO (1/09, tras cerrar el 10) → PUNTOS 11 y 13
NUEVOS, RENUMERACIÓN.** Antonio: «esto va a ser una DEMO» — la
botonera se reorganiza en modo + calificador [la taxonomía de OTP:
bike/bike-rental/car-to-park…; GBFS form factors]: Bici → [Privada]
[Pública BiZi] + las tres rutas (solo pantalla: los caminos ya
existen) con los botones de disponibilidad a petición (bicis al
coger, anclajes al dejar — el patrón «Próximo bus»); Coche → tipo de
parking [Regulado] [Discapacitado] [Gratuito] (car-to-park; tres
capas de dato a sondar — «gratuito» probablemente derivación, NO
CONSTA); Moto → [Privada] [Pública YeGo] (nuevo modo; rueda por la
red del coche; YeGo = ciclomotor compartido, GBFS moped? a sondar).
Regla de la demo (nº1 del reinicio): la botonera enseña lo que
existe. EL PLAN SE RENUMERA: 11 la botonera · 12 coche (era 11) · 13
moto (nuevo) · 14 despliegue (era 12) · 15 estética (era 13) · 16
intranet (era 14) — todas las referencias cruzadas movidas.

**EL CIERRE DEL 10 (1/09, la tarde).** Tres bugs del ojo, cerrados:
el refresco de desvíos perdía lo detectado (setInterval = TTL; los
veredictos caducaban entre leer y aplicar — medido con reloj falso;
el log daba verde contando la fuente, no lo aplicado; ahora aplica
lo que acaba de leer, periodo TTL/2, «detectados N · aplicados M»)
· el poste mudo era el tope en una racha lenta de Avanza (medido:
mediana 4.000 ms, luego 0/24) → el mudo con motivo al log · el
número de poste en toda la narración [stop_code]. Y EL VIVO A
PETICIÓN: el Generar consulta solo el primer poste; GET
/api/poste-vivo; el botón «Próximo bus» con región role=status,
aria-busy, nunca disabled, cada pulsación pregunta de nuevo [WCAG
4.1.3; MDN]; medido: «cada 11 min» → «próximo en 6 min». Bitácora
nº28 (:empty{display:none} sacaba la región viva del árbol). El
ojo: «funciona perfecto» → EL PUNTO 10 CERRADO. Pulidos post-cierre
fichados: el resumen único de avisos [GOV.UK], el minuto doble en la
primera subida, el botón a petición para BiZi. 470 motor · 217
interfaz · 28/28 bitácoras.

**LOS CONTRASTES POR DOCTRINA (1/09).** Sonda en ZetaBus primero: la
vía del cálculo negro/blanco la RETIRÓ ZetaBus (rompía la marca —
identificación consistente); su regla, heredada con cita: diurna =
color de línea intacto + número blanco + contorno (la técnica WCAG
del contorno como primer plano) · búho /^N/i = azul noche #1C1A42 +
número en el color de la línea. 53/53 chips ≥4,5:1 medidos en el
PÍXEL (eran 27 por debajo; denominador corregido: 53, no 45). Ribete
bajo la polilínea por WCAG 1.4.11 (sin precedente en ZetaBus, que no
pinta trazas): negro por cuenta; el route_color no cambia. Bitácora
nº25: el contorno de 0,7 px de ZetaBus no pintaba ni un píxel a
nuestros 13,6 px — 2 px con suavizado en gris. El instrumento: medir
en el píxel, nunca en getComputedStyle (opacity 0.18 → 21:1 falso).
Avanza YA ERA paralelo; los 8,4 s son el presupuesto de reintento de
ZetaBus sobre un poste mudo — dentro de NN/g 10 s, se queda. 446
motor · 208 interfaz · 25 bitácoras, 0 abiertas.

**LA CASILLA 4 DEL 10 — LA PANTALLA DEL BUS (31/08 tarde; destilada
el 1/09 tras la auditoría de Antonio).** Las trazas por salto
cocinadas proyectando cada parada sobre la shape [OTP hop
geometries; Google: «su mejor posición a lo largo de la traza»]:
48.307 puntos, 1.277 km, cero paradas a >100 m, cero rectas;
proyección MONÓTONA por programación dinámica (31/170 patrones
saltaban atrás con el vecino más cercano); la shape se elige por
ajuste, no por nombre (210|0|10: 4.222 m vs 14). El caso del ojo
gana 816 m de asfalto real. Montado en route_color, chip, 🚌/🚏, el
aviso medido [GTFS-RT], el indicador [NN/g]. DOS FALLOS reales: el
cocinado sin formato (servía el de ayer con 421 verdes →
FORMATO_DEL_COCINADO) y la juez que guardaba una red sin peatón en
producción (0 transbordos con 423 verdes; cazado por pid≠pid →
RedDeBus.conPeaton). 423 motor · 188 interfaz.

**LA TARDE-NOCHE DEL 31/08 — los pesos de OTP, los desvíos y los
pulidos: EL MODO BUS RUTEA BIEN («va mejor», el ojo).** LOS PESOS:
la queja del ojo destapó (nº19) que RAPTOR subía en la primera
parada marcada — correcto con horas, falso con costes — y que mis
pesos eran anti-doctrina: walkReluctance 1 (OTP: 2/4), boardCost 0
(OTP: 600), el vehículo único ABSOLUTO (OTP literal: «no optimizamos
por menos transbordos: absurdos»), el veto 500/800 a cuchillo (OTP2:
el límite de acceso es de RENDIMIENTO). Arreglado por doctrina:
subida reconsiderada · walkReluctance 4 · boardCost 600 · coste
total entre rondas · veto fuera (topes de rendimiento 30 min/40
candidatos) · Avanza 4.000+300 [ZetaBus]. El caso del ojo:
51,8→43→41,3→35,9 min (con la 44 el 1/09). Las «firmas» 3 y 6
RETIRADA/REFORMULADA; 4 degradada a planeamiento — NO HAY FIRMAS,
HAY DOCTRINA (palabra de Antonio). LOS DESVÍOS (casilla 3c): Antonio
frenó mi encargo — ZetaBus ya lo resuelve: se lee LA RUTA OPERATIVA
DE HOY (get_stops_list + nonce) y se resta del GTFS (fuera ·
provisionales · umbral 50 % · la real MANDA · auto-apagado · caché
1 h separada); la traza de los saltos nuevos RECONSTRUIDA ruteando
entre postes sobre la red de la rueda [Freiburg/pfaedle/gtfs.org];
hoy 11 líneas desviadas, 19 patrones rehechos, 71 saltos ruteados,
0 rectas; el caso del ojo BAJA EN UNA PARADA PROVISIONAL.
erasableSyntaxOnly activado. LOS PULIDOS: transbordo mismo poste =
UN paso [GTFS transfers.txt] · frecuencias teóricas [GTFS headway]
en vez de esperas (H/2 sigue en el total) · el aviso solo junto a SU
línea (nº22 reabierta y cerrada de verdad — la regla del sitio
SOBRABA) · paradas por vehículo [num_stops] sobre el patrón
operativo · el desvío en dos niveles con botón accesible [GOV.UK
progressive disclosure] — y la bitácora nº24 (tres jueces en verde
con la lista a la vista: preguntaban por el atributo hidden, no por
lo que se ve — la ley de Linaje en vivo). PENDIENTE POR DOCTRINA:
los contrastes del feed (27 chips <4,5:1 · 23 líneas <3:1 — WCAG) ·
paralelizar Avanza (8,3 s peor) · NO CONSTA el 1203. 24 bitácoras,
0 abiertas. 445 motor · 195 interfaz.

**LA CASILLA 3b DEL 10 — EL VIAJE EN BUS/TRANVÍA (31/08 tarde): EL
MODO BUS EXISTE.** RAPTOR en su estructura sobre la red cocinada
[rondas = vehículos; OTP2 acceso→transporte→salida], sin casar
horas: orden lexicográfico por las firmas (⭐ la firma 6 la impone la
RONDA, no el comparador), espera E[W]=H/2 [Dial/Clerq/Wirasinghe]
con «~», F + 120 s, radios 500/800 por el peatón, tope 3 rondas. El
caso del ojo: 478 m → LÍNEA 29 → 886 m, 51,8 min, sumas exactas.
Los pares medidos para el ojo: la firma 6 cuesta 0,9 min en un par;
⚠️ la firma 3 cuesta 10,1 min en Asín y Palacios→La Fragua (el
número queda en la juez). Contrato: 'montado' con línea + hitos
sube/baja (la geometría son los postes; la traza es de la 4). LA
CONSULTA VIVA [firma 7]: Avanza medida (text/html que es JSON; los
fixtures son bytes medidos), single-flight, tope 3 s + D-G, CUATRO
ESTADOS (llega → los minutos sustituyen al ~H/2 del primer vehículo
y entran en el total · ausente → aviso doble sitio · mudo → D-G ·
sinFuente el tranvía); las dos pruebas reales cayeron una en cada
rama (la 29 ausente; la 53 «próximo en 4 min», 757 s). El botón Bus
ya llama al motor (gris provisional hasta la 4). ⚠️⚠️ La bitácora
del 25/08 REABIERTA: la comprobación de tipos de la interfaz no
miraba nada — «tipos limpios en los dos lados» de las casillas 2 y
3a ERA FALSO en la pantalla; un solo `npm run comprobar-tipos` en
la raíz; ley: un arreglo que hay que acordarse de usar no es un
arreglo del todo. Validado con doctrina para la 4: el aviso
«ausente» debe decir lo medido [GTFS-RT: ausente = sin información,
no sin servicio] · indicador de espera obligatorio [NN/g >1 s].
415 motor · 183 interfaz.

**LA CASILLA 3a DEL 10 — LA COCINA DE LA RED DE BUS (31/08).** La
unidad es el TRIP PATTERN [OTP: trips de una ruta, misma dirección,
misma secuencia — implícitos en GTFS, los deriva el consumidor], no
el «trip de más paradas» de ZetaBus (válido para pintar, no para
rutear). Cocinado en streaming (65 MB de montón): 984 paradas · 170
patrones (26 de 45 líneas con refuerzos; 8 zombis a 0) · 3.362
saltos con típico=mediana y máximo · servicio por patrón (Alternate)
· 10.588 transbordos a pie a ≤500 m POR EL PEATÓN (⭐ solo el 66 % de
los pares en recta sobreviven andando) · 1.272 KB gitignored, 4,3 s
(7 ms el segundo arranque); recocinar() ya cocina y hace swap de
referencia. La 39: 8 patrones, 45 min típicos vs 58,6 del peor.
Partidor RFC 4180 por las comillas de stops.txt. Sin rojo-primero
en el módulo de datos (declarado; la contraprueba mordió y apretó
una juez). 395 motor · 181 interfaz [⚠️ misma corrección: tipos de interfaz sin comprobar aquí; ver la 3b].

**LA CASILLA 2 DEL 10 — EL CRON DE RENOVACIÓN (31/08), validada
contra la literatura.** El fetch detecta por fechaActualizacion sin
bajar [GTFS Best Practices: If-Modified-Since sobre la ubicación
estable] y baja por downloadLink [la ruta NO obsoleta del OpenAPI
del NAP]; guardas y reglas de fallo calcadas de ZetaBus; endpoint
POST /api/renovar-feed con Bearer en cabecera (503/401/409/202);
umbral 7/30 [validador]; EL RELEVO semilla/vivo (el ejecutor cazó
que «pisar» la semilla rompía el datapackage y sus dos guardianes,
preguntó, y el relevo cumple las tres doctrinas); .env.local
gitignored antes de existir. LA PRUEBA REAL con la clave de Antonio
cazó DOS fallos invisibles para la suite sin red — bitácoras nº17
(el lector miraba en la raíz; la juez nunca ejercía el defecto) y
nº18 (downloadLink es TEXTO PLANO, un enlace firmado de S3; el
fixture había inventado JSON): las leyes «un defecto que producción
usa necesita una juez sin argumento» y «el esquema dice el tipo, no
la codificación: se mide contra el servidor y el fixture copia la
medición». El NAP en vivo: el sha del descargado = el de la semilla
(sigue la build del 30/6); el log dice «vivo (relevó a la semilla)
· 35 días → VIGENTE». ⚰️ Las fechas del NAP son cobertura;
feed_end_date es la garantía [referencia GTFS] — manda el
feed_info. Cabo a la 3: el zip nuevo entra al siguiente arranque.
385 motor · 181 interfaz [⚠️ corrección del 31/08 tarde: los tipos de la INTERFAZ no se comprobaron aquí — el guion tecleado de memoria no miraba src/app; ver la 3b] · 18/18 bitácoras cerradas.

**EL PUNTO 10 ARRANCA — la casilla 0 completa y el censo del feed
(noche del 30/08 → 31/08).** NUEVE FIRMAS de Antonio antes de una
línea de código (transbordos siempre · vehículo único ABSOLUTO ·
buses al empate · radios 500 bus/800 tranvía [El-Geneidy/FHWA] ·
colores de línea de ZetaBus · la comprobación EN VIVO al poste como
BiZi [firma 7 v2: la v1 la codifiqué mal con mi lectura — corregida
con su palabra] · el pintado BiZi extendido · transbordo a pie 500 m
+ 120 s [OTP]) + el calendario verificado (método Alternate de la
referencia) + el NAP comprobado en vivo (sin feed nuevo desde el
30/6; el 05/10 = víspera del Pilar, palabra de Antonio). EL CENSO
(medición pura, ficha en scratchpad): ⭐ el descuadre 984-944 CUADRA
EXACTO (+50 tranvía −11 +1) · ⭐ route_type 704/900 extendidos (la
trampa del 3 desactivada) · colores 53/53 · Alternate PURO (ni un
exception_type 2) · ⭐ ZetaBus tiene EL MISMO feed byte a byte y
regaló la tabla de modos, el streaming, el viaje canónico y las
cicatrices de la API de Avanza · 185 MB/0,5 s materializar (se
cocina de noche) · ⚠️⚠️ EL FEED NO LLEGA AL PILAR: bus hasta el
05/10, cero viajes del 10/10 en adelante — el cron de la casilla 2
es CAMINO CRÍTICO (y el NAP exige login: ¿cómo renueva ZetaBus?).

**LA SONDA DE LA SEÑALIZACIÓN — la candidata muere con honores
(30/08, último acto).** MU2_señalizacion_vertical: 40.863 señales
Point con 13 campos y NINGUNO de orientación/rumbo/sentido — sin
saber hacia dónde mira la señal, ni un codigo perfecto daría la
dirección: DESCARTADA como capa-de-sentidos POR DISEÑO. Los otros
clavos: enganche a vía por texto sucio con formato propio
(«PUENTE DE CLAVERIA· GRP.  CN» — coincidencia de subcadenas, no
unión); tipo=cartel 25/25, codigo/grupo vacíos EN LA MUESTRA
(⚠️ sesgada: 25 contiguos del oeste — lo de la capa entera NO
CONSTA); las fotos por señal (imagen_url) son otro servicio y ojo
humano, no dato. La horizontal: 644.596 geometrías con color y
fecha, cero semántica. Confesión del ejecutor: su primera
comprobación de enganche fue contra el fichero equivocado (el de
portales no lleva nombres — el control «EL COLOSO» también dio
falso y lo destapó), rehecha contra el de vías. ⇒ EL ATAJO REAL de
la fase 2 sigue siendo el ya fichado: las SHAPES del GTFS (89
trazas direccionales cerrando al 100 %) — la fase 2 queda como
goteo del ojo + el cruce de shapes cuando el 10 arranque.

**EL AVISO TAMBIÉN JUNTO A LOS HITOS (30/08, tras el cierre;
doctrina GOV.UK del doble sitio).** Con el D-G activo, los dos
hitos de BiZi ganan la nota AL LADO (⚠ + la frase ENTERA del
banner — el ejecutor frenó ante mi ejemplo corto y la doctrina le
dio la razón: [DfE, Don't literal: «no tengas mensajes distintos en
el resumen y junto al campo»; GOV.UK: el mismo texto en ambos]); el
banner se queda (es el resumen del patrón); API viva = cero ámbar
(verificado INTERCEPTANDO la respuesta en Chrome — la sede seguía
caída y el caso bueno se vio con los ojos, no por deducción).
Contrastes medidos 7,65/8,32/4,62 (AA pide 4,5); el ⚠ además del
color, aria-hidden. Confesiones: una propiedad CSS muerta con
comentario mentiroso (vista en la captura — fuera) · el aviso se
reconoce por su TEXTO (Aviso={texto}) — fragilidad declarada en el
código para cuando el contrato dé categorías. 181 interfaz.

**SINGLE-FLIGHT EN LA DISPONIBILIDAD BiZi (30/08, tras el cierre;
firmado por Antonio como optimización).** El trío de la precarga
disparaba TRES consultas idénticas al Ayuntamiento por Generar
[forkJoin, suscritas a la vez — la situación exacta del patrón] →
request coalescing/single-flight [la doctrina con nombre: fusionar
las concurrentes idénticas en UNA ejecución; canónico en Go
singleflight; deduplica SOLO lo en vuelo — no es caché]: una
variable enVuelo (no mapa: la consulta no lleva parámetros), la
referencia SE SUELTA al resolver. Recuentos: 3→1 por Generar ·
6→2 en dos Generar (la frescura VIVE — su juez re-corrida) · 3→1
con la sede caída (el D-G compartido, comprobado en vivo con la
API aún vacía). ⭐ El regalo no pedido: las tres rutas hablan del
MISMO momento (antes cada una traía su foto y la sede podía
cambiar entre la primera y la tercera). La caza conceptual de la
contraprueba: no-soltar-la-referencia ES la caché eterna (misma
mutación, dos escrituras — la juez de la frescura caza ambas).
⚠️ Un zombi ajeno servía con código viejo al arrancar (EADDRINUSE,
pid sin log) — visto, liberado, pid==pid del segundo intento. 372
motor · 176 interfaz.

**LAS PALABRAS VACÍAS DEL BUSCADOR (30/08 al cierre; cazado por el
ojo de Antonio, VERIFICADO por él tras rearrancar el motor).**
«rodrigo rebolledo» no encontraba «CALLE RODRIGO DE REBOLLEDO»: el
diagnóstico medido — `buscar` casaba vías por SUBCADENA CONTIGUA de
la consulta entera (nunca hubo troceo en palabras en el callejero;
el «por palabras» del punto 8 era del tubo de SITIOS y allí
funciona; la suite decía «subcadena» — nada mintió: MEJORA, sin
bitácora). El tamaño del mal: 1.076 vías con partícula en medio,
673 ESCONDIDAS. El arreglo [mecanismo Pelias StopWordClassifier;
lista PROPIO: de·del·la·las·los·el·y]: se indexa una copia sin
vacías y se compara por los DOS caminos — solo AÑADE (lo de ayer
casa igual), los nombres se PINTAN enteros, y la guarda del núcleo
vacío («de» sigue dando sus diez). Confesiones del ejecutor: su
juez de la guarda nacía floja (la contraprueba la destapó —
apretada) y una contraprueba pedida NO muerde y lo dice (las dos
puertas se cubren mutuamente; la juez queda escrita para el día en
que alguien estreche el casado). 369 motor · 176 interfaz · la
suite del 8 al completo 44/44 + comprobado a mano (ceip moliner ·
ies goya). ⚠️ El tropiezo del despliegue: el motor en marcha era el
VIEJO — el ojo probó, «sigue sin funcionar», y era el proceso, no
el código (la lección del zombi, versión usuario: rearrancar el
motor tras un fix de motor).

**LAS DOS SONDAS DE LA SESERA DE ANTONIO (30/08 al cierre).** ¿Hay
shapes del bus? ¿hay capa ZBE? — SÍ y SÍ, medido: el GTFS del repo
trae shapes.txt CERRANDO por los dos lados (89 trazas/27.603
puntos; el 100 % de los 34.427 trips con traza; cero huérfanas;
frontera pasada; ⚠️ shape_dist_traveled columna VACÍA · ⚠️ 8 rutas
sin viaje en el feed) → al punto 10; y la ZBE municipal es capa de
DOS polígonos (FASE 1/FASE 2, el centro; solo geom+fase — vigencia,
vehículos y excepciones son LETRA LEGAL del 11, no dato; CRS trampa
viva) → al punto 12. Cero descargas; lectura pura.

**LAS CASILLAS 5-6, EL PINTADO Y LA REVERSIÓN DE SIRESA (30/08
tarde).** LOS PRIVADOS Y BiZi [OTP BICYCLE_PARK/vehicle-parking +
modo alquiler + GBFS station_status]: el remate al aparcabicis
(1.914 entrantes de §1.9, tope 500 m [PROPIO con números en mesa],
⭐ patín 83→98/200) · BiZi en tres tramos con consulta VIVA por
Generar, hitos «Coge/Deja… N a las HH:MM» [last_reported], estación
llena/vacía saltada, aviso 30 min, y el D-G VIVIDO (la API municipal
horas en 200-cuerpo-VACÍO — bitácora nº15: nada vigilaba el aviso
conviviendo con pasos; ley: al ensanchar una regla, busca a los
guardianes de la estrecha) · los carriles CON nombre (herencia sobre
la red de la rueda: 579/652; la regla del vestido vigilada tras
cazarla la contraprueba). EL PINTADO [OTP legs + OSRM mode + Leaflet
dashArray/divIcon + WCAG 1.4.1]: PARA de libro del ejecutor (el
contrato no decía dónde cortar ni qué se empuja — los pasos van
redondeados: derivar erraba 6,9 m) → `tramos` en el contrato
(desde/hasta/hito; índices que cierran, sumas exactas, la juez
tautológica cazada); a-pie ámbar discontinuo de siempre · rodando
SÓLIDO AZUL #2563eb [firmado; elegido midiendo: peor caso 3,45:1 vs
2,45 del ámbar] · el empuje sale ámbar en mitad del azul SIN
programarlo · hitos 🚲/🅿 clavados al dato (encima del símbolo de
OSM). LA REVERSIÓN (bitácora nº16): Antonio precisó — Siresa es
ÚNICO HACIA Doctor Iranzo, OSM estaba BIEN: mi fila del 29 codificó
la queja, no la dirección (la juez compraba el -1 como bueno Y
vigilaba una ruta que no pisa Siresa); tabla vacía y viva, cuadre
+2,200 m/+0,4400 s = 5,000 m/s. LEY: al ojo se le pregunta LA
DIRECCIÓN; el guardián compra la dirección andable, no el resultado
esperado. LA SONDA de movilidad: 43 capas; IML Viales 2025 = AFOROS
por sentido (ficha oficial — a la NEVERA para el Tranquila real);
⭐ candidata a capa-de-direcciones: MU2_señalizacion_vertical (la
señal física es la fuente legal), sin sondar. 364 motor · 176
interfaz.

**EL EMPUJE Y EL SELECTOR DE RUTA (30/08 mediodía), los dos VISTOS.**
EL EMPUJE (adelantado POR ORDEN de Antonio; el encargo auditado
antes de mandar — la juez vacía de protección-especial quitada [H4],
la narración citada [OSRM mode «pushing bike» por paso]): la red de
la rueda gana 33.770 aristas peatonales EMPUJANDO a 5 (factor el
máximo de la tabla — solo gana por tiempo); el caso COLOSO→ROMEO en
patín 5.741→4.551 (45 m en la mano ahorran 1.190; iguala a la bici),
patín 51→83/200 y su red 1.988→721 trozos; la bici también mejora
(4.805→4.551, visto). Tres arreglos midiendo (la puerta separada de
lo transitable tras caer 45,7 % de enganches en la acera del portal
· el factor-máximo tras medir que la preferencia compraba el empuje
· jueces ancladas al way al crecer la red). El rótulo «a 5 km/h»
QUITADO en rueda. ⚠️ Cabo declarado sin tocar: el reloj reportado va
SIN el factor del montículo (159↓/18↑ en 282) — qué se reporta es
parlamento. EL SELECTOR DE RUTA (de la pregunta de Antonio
«¿amateur o pro?»; doctrina CycleStreets con su API oficial:
balanced recomendado defecto · fastest confiado · quietest amable;
la precarga de los tres tipos del patrón del planificador): «¿Qué
ruta prefieres?» solo en bici/BiZi, Generar trae LAS TRES y el radio
repinta sin petición (3/0 contadas); FIRMAS: Tranquila = tabla al
cuadrado [PROPIO] · el patín SIEMPRE fuerte [56.2.c — ley, no
gusto]: COLOSO→ROMEO 4.551→4.832 comprando carril (Avda. de Madrid
a CERO tráfico), 909 mejor que pre-empuje. El factor del empuje
derivado por calibrado (la regla entendida). Honestidades en jueces
(hostilidad no se minimiza · el rótulo redondea igual 1.554 y
1.565). 342 motor · 167 interfaz. Cuatro commits. Y EL OJO cazó el
fleco para la 5: los carriles narran «el carril bici» SIN nombre
(la herencia de §1.15 vive en la red del peatón).

**LA CASILLA 4 — EL SELECTOR A SEIS (30/08 mañana), hecho y VISTO.**
El control viejo parecía grupo y no lo era (aria-pressed, tabs
sueltos, flechas muertas); seis supera el techo del segmentado (2-5
[Primer]) → GRUPO DE RADIOS NATIVO: name compartido = parada única +
flechas + exclusión SIN JavaScript, vestido idéntico. Anchos por CDP
con medidor contraprobado (recorte inyectado: cantó 3) · teclado por
CDP real (jsdom no implementa radiogroup) · la juez estrella nacida
en rojo contra el fallo vivo (el patinetero solo tenía el botón de
la bici). Bus/coche avisan sin preguntar al motor (el mensaje viejo
mentía con el motor caído — aceptado). La comparación del ojo
(COLOSO→ROMEO): el patín +900 m por Camino de las Torres >30 — LA
LEY dibujada (cruza solo por el paso, en la mano); de ahí nace la
casilla 6-bis EL EMPUJE [doctrina: la tabla de acceso escribe el
empujar-como-peatón · OSRM walking_speed=4 · OTP modo SCOOTER
andar+rodar+andar · 121.2] para después de BiZi. Y dos vicios de
pantalla a la 5: el rótulo «a 5 km/h» miente en rueda · el cruce
debe narrarse «en la mano». 161 interfaz · 332 motor. Dos commits.

**LA AUDITORÍA DE SENTIDOS — el ojo, la sonda y el banco (29/08
tarde).** El ojo de Antonio cazó a la bici subiendo Monasterio de
Siresa a contramano; el diagnóstico demostró que el motor obedecía
AL DATO (79/79 a favor del tag) y que el dato está mal — la clase
que ningún detector automático ve [QA wiki: el oneway invertido es
topológicamente limpio]. Con la regla de Antonio («de nada sirve
ñapear sin referencia de qué estaba mal»), EL SISTEMA: (1) Siresa
corregida con mecanismo [9090 + CycleStreets]: sentidos-corregidos.ts
con tres cerraduras (si §1.21 sana, el motor no arranca), el log
declarando, la ruta viva sin pisarla, y el GUARDIÁN DEL DESHIELO;
(2) la SONDA-CYGNUS [Telenav: conflación gubernamental×OSM para
VERIFICAR] doble_sent×oneway: A1 71 vías/8,5 km · A2 182 · B2 25/
1,8 km · B1 156 apartadas CON MEDIDA (avenidas de doble calzada,
rumbo >120° — la 1ª sonda contaba el ruido, 98,8 % de los metros) ·
⚠️ punto ciego cuantificado: 1.185 vías/300 km donde ambas dicen
«único» (la clase Siresa — ojo o GTFS); la lista de 434 espera EL
OJO; (3) el BANCO: nueve testigos ⚠️ en verde documentando la
conducta mala de HOY (Santiago Guallar: 15,5 m que cuestan 554 de
rodeo), escritos para caerse en fase 2 — el acta. El runner
reincidió («fail 0» con 58 sin pasar — leer pass). Muralla al byte.
El diagnóstico previo dejó además: 203 calles con pedestrian y
residential bajo el mismo nombre (peatonalizaciones a medias en
OSM; señal candidata: paving_stones 30,2 km) y el zombi reincidente
(pid==pid ya de serie). 332 motor. Dos commits.

**LA CASILLA 3 — EL COSTE DE LA RUEDA (29/08).** La demostración
previa: el orden de vértices es el de OSM (112 rotondas antihorario/
0 · 22.999 ways encadenados sin inversión — sin ella, 984 km a
contramano sin rojo). Red de la rueda APARTE (la rejilla no se
filtra): 58.914 aristas/4.625 km. Sentido (oneway · -1 · rotonda
implícita 1.390 · contraflujo, 10 de 18 cerrados por ley [50.6]) ·
techo municipal-manda · preferencia al carril [factores OSRM]. ⭐ El
DEFECTO del art. 50 RGC [RD 970/2020]: 30 a un-carril-por-sentido —
7.227 [PROPIO-por-tipo declarado]; carril_vh descartado con
contraejemplo (semántica NO CONSTA); el patín 35→51/200. ONCE jueces
(preferencia +1,9 % · contraflujo 63/716 · ida≠vuelta · 20/18 exacto
· el sha256-muralla de las 391 rutas del peatón IDÉNTICO a HEAD).
Contraprueba 12 mutaciones — la rotonda implícita NO mordía (juez 8
nacida del hueco); cero pruebas del peatón tocadas. Confesiones: el
comentario que decía 0 y el dato dijo 1 (Valle de Zuriza) · ⚠️ midió
contra un MOTOR ZOMBI (EADDRINUSE — cazado; desde entonces
pid-del-log==pid-que-contesta). carril_bus NO cierra la vía · juez 4
a mejor con lupa (pacificada = carriles Y techo, por arista).
Commits: cuatro del ejecutor. 327 motor · 154 interfaz.

**PUNTO 9 EN MARCHA — la casilla 1 y las dos descargas (28/08).**
El CENSO: cycleway 191,5 km; oneway confirmado ausente; ⭐ §1.14
traía el juego de etiquetas entero (se descargó «para nombres» y
Overpass devolvió las 260); ⭐ fuente nueva MU1_jerarquia_viaria;
carriles §1.5 en DOS MUNDOS (Calmado 8 %/Senda 3 % no son cycleway —
134 km son el Anillo y calzada compartida); aparcabicis 14.544
anclajes (la cifra del encargo era de otra ficha — recontada y
corregida); BiZi: API viva NO-GBFS que casa 276/276, estadoEstacion
roto en el 100 % (se usa estado); Valhalla 18/OSRM 15 citados,
NINGÚN motor con perfil de asistido; elevación NO CONSTA medido. LAS
DOS DESCARGAS [CycleStreets + reparto de fuentes — autorizadas POR
DOCTRINA, la regla nueva]: §1.21 (65.223 ways, 99,9 % del grafo con
entrada; oneway 39→65 %; no pisa §1.14: 7 ways solo viven allí) y
§1.22 (2.049/2.049; ≤30 = 498,8 km/1.603 vías; 141 U+FFFD confinados;
licencia NO CONSTA dicha). LA FOTO: sentido 65/35 · velocidad
combinada 68/32 · ⚠️ discrepancia 17,5 % donde ambas hablan. Siete
guardianes sin usar el dato; dos confesiones (el «fail 0» con 7 sin
pasar — el runner cancela; la prueba del CRS nacida floja,
reformulada mutando); manifiesto 39 con dos grises honestos. Motor
313 · app 154. Commits `4ca53e0` `f843ea2`.

**EL CIERRE DEL PUNTO 8 (27/08).** Cuatro piezas y la poda. La nº14
CERRADA: subsecuencia de palabras con LA GUARDA QUE CRECE [la nº13
extendida] y el ESCALÓN DEL DATUM cazado por el ejecutor en el
encargo (la guarda es desempate, no veto — sin él las 4 del datum
dejaban de rescatarse); el Andrés Oliván en su barrio, el testigo
caído solo, 16 rescates; y la mutación que desnudó al guardián del
fantasma (la guarda tapaba el desastre: 277 verdes con la regla
rota) — LEY: «una regla verificada solo por su efecto deja de estar
verificada en cuanto otra cosa la protege». EL FOCO EN LAS VÍAS
[Pelias autocomplete; el caso TriMet idéntico]: Garrapinillos
primera desde Garrapinillos, la vía medida por su portal más cercano
(la Autovía de Logroño desmiente al centroide), y nace
callejero.spec.ts. LAS VÍAS SIN PORTAL [«toda calle indexada»; sin
número → el centroide; punto medio = MITAD DEL RECORRIDO]: 619/628
dentro (9 fuera con dos motivos separados), cruce POR CÓDIGO 1:1,
contrato INTACTO ({via:X, portal:X}), el Puente de Piedra a factor
1,06 de la recta. ⚠️ El cambio pasó invisible por 438 pruebas (17
jueces en rojo a posteriori) y el emparejador casi se rompe sin
rojo (filtro como precaución declarada; el «bajan a 15» escrito sin
medir, medido, falso, corregido). LA GLORIETA 15912: se escribe
pero NO con el nombre de la ficha (ejes vs callejero — falso
conocido declarado) y la excepción del gacetero derivada del dato.
LA PODA DE DEMO firmada: hostelería y municipales chicas FUERA con
motivo (siete categorías demuestran el tubo; la octava no enseña
nada) — a la nevera con sus flecos. servidor.ts sin spec → al punto
12. 306+154 pruebas. Commits `6f1fd08` `11564ba` `6f127f9`
`4a4d3ab` `ace1bc7`.

**TANDA 4 — EDUCACIÓN, con la nº13 cerrada y la nº14 abierta
(25-27/08).** Tres etiquetas desde la familia municipal (43
categorías, 738 ids = 738 nombres — dos sondas), con la taxonomía
OSM firmada [school ~6-18 en UN elemento · kindergarten ·
university] y cinco firmas con doctrina: el 660 FUERA (sus 29
exclusivos tienen tag propio: music_school/language_school/adultos) ·
facultades solo Universidades · infantiles sueltas a Guarderías, el
8592 a Colegios · de la 64 solo los C.E.E. RESULTADO: 264 · 64 · 29
(cero solapes id a id; 820 sitios, 802 buscables). Ficha §1.20
triple · manifiesto 37 con validador contraprobado (5/5) · el
Last-Modified DEMOSTRADO suelo del servidor (16 categorías con la
fecha clavada) · la re-descarga no repite en 7/11 (solo el orden del
array type — declarado). Siglas buscables («ceip moliner» no
encontraba nada: el troceador partía C.E.I.P. en letras). Iconos:
lápiz-manzana [Maki] · CHUPETE [PROPIO firmado, hueco real en la
doctrina] · birrete [Maki], en mostaza #614800 (8,62/7,51 — el par
del azul al centésimo). ⭐ BITÁCORA nº13 (CERRADA `5ddc841`): el
rescate MOVÍA coordenadas que ya estaban bien (el Andrés Oliván de
San Juan de Mozarrifar arrastrado 7,6 km a la homónima de la ciudad;
22/29 de hoy y 7/9 de producción) — lo que daba verde: el guardián
que ENUMERABA («enumerar lo que un proceso hace no vigila que esté
bien»); arreglo a doctrina [geo-similitud manda sobre nombres +
location bias]: desambiguación por cercanía CON GUARDA (medida antes
de creída: sola empeoraba) + precondición de VÍA ENTERA. 29→17
rescates, los 4 del datum siguen, 0 falsos POR CONSTRUCCIÓN (la vara:
puerta de SU PROPIA calle — en barrio denso siempre hay puerta ajena
cerca). Ley del cierre: «medir la ida y la vuelta no basta con
medirla bien: hay que medir lo que corresponde». ⚠️ nº14 ABIERTA: el
Andrés Oliván NO se arregla (dos claves distintas, no hay homónimo);
la puerta de la subsecuencia MEDIDA (devuelve al 549 pero mete un
rescate malo — doctrina nueva, parlamento pendiente) y el testigo
escrito para caerse solo. Los SEIS C.E.E. (los 3 que la salida del
660 dejó fuera — moraleja: las firmas nombran CRITERIOS, no listas
de ids). 273+148 pruebas · contraprueba 6/6 · las dieciséis jueces
al byte con razón comprobable · visto por Antonio en vivo («todo
correcto»). Commits `2a20ae0`→`1d4d956`.

**TANDA 3 (bibliotecas) + los remates del buscador + LA nº12
(25/08).** Bibliotecas por el tubo con DOS paradas de costura: el
catálogo tenía TRES categorías (Antonio eligió 35+223, la 4
«Archivos» fuera con motivo; ficha §1.19 compuesta, filas 25-26) y el
dato desmintió al encargo («sitio chico»): las 8 que la validación
movería estaban BIEN — cuartos en recintos — Antonio firmó RECINTO (0
rescates, el precedente del Miguel Servet). 77 · 75 al índice. El
`modified` con su tercer caso: la 223 comparte Last-Modified AL
SEGUNDO con hospitales (el redeploy, con dos testigos). Icono: libro
abierto [SVG de carto y Maki leídos — la convención es el glifo] en
morado de cultura #6a1b9a (el marrón de carto descartado CON LA
MEDIDA: 6,75:1 < listón 7:1). El contrato-muralla: la interfaz no
compiló hasta dar a la clase su dibujo/color/anclaje. ⭐ BITÁCORA nº12
(abierta en caliente, cerrada con arreglo): el «tsc limpio» de tres
checkpoints miraba CERO ficheros (tsconfig.json = fichero solución) —
cazado porque la app tenía que estar rota y salió verde; arreglo:
comprobar-tipos con CENSO (290+353) y guardián anti-censo-cero; LEY:
«un comando que termina en silencio no es un verde hasta que se le ha
visto contar lo que ha mirado». Tres instrumentos, el mismo fallo con
tres caras. Y los remates de Antonio: el desplegable ORDENADO
(Dirección primera + alfabético calculado, guardián de la regla; dos
mutaciones que hoy no muerden, declaradas) e ICONOS DENTRO del
desplegable [Customizable Select; regla de oro WebKit; @supports 5/0;
jsdom = el caso degradado en cada ejecución] con la chincheta por
campo (verde/roja) y el guardián de la colisión (mismo fill, distinto
d). Motor 463 sitios · 456 buscables · cuatro categorías. 263+144
pruebas. Commits `aae90f6` `fc40cb2` `b15f198` `22ed779` `b45eaae`
`656f005` `f624b31`.

**EL 9090 DE VUELTA — la corrección manual de Antonio (24/08,
tarde).** El centro de salud de Portugal volvió al índice: Antonio
confirmó la coordenada (Google Maps) y el callejero la respaldó solo
(a 9 m del portal 11 de Domingo Miral, la calle del registro). Nació
el mecanismo de correcciones manuales de sitios (correcciones.ts,
patrón del callejero: fuente/fecha/motivo, aplicada ANTES de validar,
tres candados que revientan el arranque si el origen cambia, si los
cheques fallan o si no se declara). 381 en el índice · 0 inválidas ·
la lista de confirmación manual VACÍA — el ciclo completo del método
de Kenia: la lista corta se miró sobre el terreno y volvió
confirmada. J14 (6.000 m, coherentes con 5.229 en recta) · 257+136
pruebas · contraprueba 9/9 (el medidor ciego al throw-en-carga,
cazado mirando la salida: 125 rojas). README en su cuarta pasada.
Commits `3f631fa` `71b4c39` `d766e15`.

**LA VALIDACIÓN ESPACIAL con rescate por callejero (24/08, tarde).**
La regla de entorno de Antonio, con la casuística LOCALIZADA en la
literatura (las listas sanitarias oficiales con coordenadas sin
verificar = nuestro mal; el arreglo de los inventarios sanitarios:
re-geocodificar contra gacetero + confirmación manual local). Dos
cheques [doctrina QA]: frontera (bbox de los 46.150 portales +250 m)
y distancia (>50 m, SOLO chicos — hospitales fuera POR FIRMA: el
Miguel Servet cae a 1 m de Gonzalo Calamita 4, OTRA de sus cinco
puertas — cerrado por conocimiento local; J10 al byte). Umbral
FIRMADO DOS VECES (la segunda con la distribución real: los 50 cortan
un continuo, no un escalón — la premisa del «vacío» murió y se dijo).
10 rotas de 386: 9 rescatadas al portal del callejero (los 4 del
datum con el vector a la millonésima; el 20445 pasa de 401 m a 0 a su
propia puerta) · 1 fuera (el 9090 de PORTUGAL, s/n irrescatable — ese
centro NO se puede elegir; en lista manual de Antonio). El
emparejador exige unicidad también en número (la 8881 sana se habría
roto — cazada antes). Contraprueba 14/14 con un guardián-en-vacío
destapado. 250+136 pruebas. README saneado en tres pasadas (sitios al
buscador por tipos · la API a seis · la cabecera del 📍). Commits
`4c4cae6` `51eec72` `efa7081` `bfe0e36`.

**TANDA 2 (sanidad) + EL BUSCADOR POR TIPOS (24/08).** Centros de
salud (56) y hospitales (17, 15 al índice) por el tubo: fichas
§1.17-1.18, filas 23-24, iconos FIRMADOS por Antonio (H blanca en
cuadrado azul [señal S-23] · cruz azul [[PROPIO]: la roja vetada por
Ginebra —osm-carto tiene el #3408 por evocarla—, la verde ocupada];
un azul #0d47a1, contraste 8,63:1, separados POR FORMA [#2787]). El
`modified` como jurisprudencia: centros declarado (coincide al
segundo), hospitales omitido (13 meses de desfase). Los títulos SE
LEEN (institucionales, 0 patrones de persona). ⭐ El RECINTO GRANDE
[#536] medido: no aparece por el conector (la API publica punto de
DIRECCIÓN, no centroide; mediana 5 m) pero SÍ como TEXTO ENGAÑOSO:
J10 Coloso→Miguel Servet llega por Gonzalo Calamita (enganche
legítimo) y la llegada dice «Avda. Isabel la Católica, 3» — esa
puerta queda a 169 m al otro lado del bloque. PARLAMENTO FICHADO con
la idea de Antonio (enganchar por la DIRECCIÓN cruzada con nuestro
callejero; los s/n a mano; P1/P2 sin responder). J11 CS Actur Norte:
limpia. Hallazgos: coordenada en PORTUGAL (id 9090, 610 km — B no lo
caza: regla de ENTORNO fichada, decisión de Antonio) · 781 más ancha
que su nombre · un git checkout en bucle revirtió mapa.ts (cazado;
contraprueba con copias propias). — Y por la mañana, parlamentado y
HECHO el mismo día: **EL BUSCADOR POR TIPOS** (mejora de Antonio):
[📍][tipo▾][cajetín][nº] en ambos campos [GOV.UK Select + revelado
condicional · Pelias layers como parámetro `capa`], la mezclada
MUERTA (firmada, juez derogada con motivo), el nº que SE MUDA al
invertir, ubicación en destino (salta a Dirección, declarado), y el
fallo parido y muerto dentro del encargo (la petición fantasma del
⇅, 200 ms) SIN bitácora: nada dio verde con él vivo. Antonio en
vivo: «de momento no veo taras». 219+136 pruebas · las once juez +
la del cable al byte. Commits `7074a20` `eb9b237` `81a2c14` `37d4f65`
(sanidad) · `a6e28ca` `98d6b0a` (buscador).

**FARMACIAS: el tubo de sitios ENTERO (23/08, tarde-noche) — cuatro
encargos, tres bitácoras de método y la primera categoría del punto 8
viva.** El buscador acepta sitios en AMBOS extremos (J7 ida · J8
inversa · J9 sitio→sitio, las nueve juez al byte), busca POR PALABRAS
[Pelias], ordena A DOCTRINA [lingüística · foco al otro extremo ·
alfabético [PROPIO] — antes NO había orden: posiciones del fichero
municipal], y señala con ICONOS a doctrina [osm.org verde/rojo · cruz
europea · forma además de color #2787] en sugerencias, mapa e
itinerario (cabecera Y pasos — el guardián que solo miraba la
cabecera, corregido: «dos instrumentos mal apuntados no son dos
comprobaciones»). Regla B de Antonio: sin coordenada no existe (3
fuera, contadas). El titular jamás se lee (guardián contra el crudo).
**Bitácora nº11** — el «origen-sitio roto» era un motor arrancado 36
minutos antes del commit; el guardián que lo sabía (comprobar-arranque)
estaba en rojo y nadie lo invocó — ley: «un guardián que hay que
acordarse de invocar es documentación, no cobertura»; de ahí la juez
del CABLE (el cuerpo real contra el lector real, leerPeticion a
peticion.ts). MISMO-PUNTO firmado: doctrina (Valhalla calcula las
triviales; salida+llegada a 0 m es odin) — sin regla nueva. Hallazgo
municipal fichado: 4 farmacias desplazadas 236 m con EL MISMO VECTOR
(Δlat −0,00187/Δlon −0,00135 — huele a datum, causa NO CONSTA):
20443 · 20444 · 20445 · 8671, rutas de hasta 401 m a su propia
puerta. La protanopia del mapa ABIERTA (dos chinchetas solo por
color; bandera a cuadros → punto 15). Foco a las vías: hallazgo
anotado SIN hacer. 211+123 pruebas. Commits `1bf560f` `ffe9167`
`a13b6eb` (B) · `3f6847c` `4cd0fcb` `cc0aade` (simetría) · `dbabafb`
`892d9f1` `99cfa88` `f48c89c` (remate 2) · `64ba7a7` `207e81e`
`16cc9c1` (remate 3).

**El panel de frescura CONSTRUIDO (23/08, tarde) — las piezas 1 y 2
del adelanto del punto 16.** `datapackage.json` en la raíz (Frictionless
+ términos DCAT): 21 resources, huellas 21/21 casando, campos solo
donde constan (modified 7 · descargadoEl 17 · caducaEl 3),
accrualPeriodicity en URI del vocabulario europeo. VERIFICADO POR DOS
VÍAS: el validador del ejecutor (contraprueba de 8 mutaciones) y la
validación INDEPENDIENTE del estratega contra el perfil oficial (0
errores, recuento de afirmaciones cuadrado). Hallazgo: el timeStamp
del WFS es hora de composición de GeoServer, no fecha del dato —
modified omitido en los 10 del WFS. La pestaña /panel (lazy, 7,43 kB):
0 rojos · 0 ámbar · 4 verdes con fuente · 17 grises honestos — el del
callejero con regla citada y gris igualmente (no consta cuándo se
descargó la copia; la deducción posible quedó dicha y no hecha). La
raíz en frío: 6 peticiones · 459 KB · cero datos — guardián del 22/08
endurecido (cuenta peticiones totales). El manifiesto duplicado
(raíz + app/public/, Angular no publica fuera del workspace) con
guardián byte a byte. Contraprueba 9/9 (la novena endureció su propia
prueba del borde). 86+179 pruebas. Commits `133a3a9` · `9e5bd35` ·
`4186f2f`. Antonio lo vio en vivo; el diseño «no es ahora».

**Punto 8 ABIERTO y el panel de frescura parlamentado (23/08,
tarde).** El 8 arrancó por doctrina [Nominatim: geocodificar y enrutar
son dos oficios; centroide + #536 + entradas 2025] y dos sondas de
solo lectura cerraron la foto de hostelería. ⭐ La pieza gorda la cazó
ANTONIO EN VIVO (DevTools): el Registro de Licencias tiene servicio
REST abierto NO catalogado — 42.303 locales, 5.372 «otros cafés y
bares» (673.2), coordenadas siempre, y codVia/codPortal = LOS NUESTROS
(97,8 % de cruce por código); cero datos personales; peros: `estado`
sin descifrar (no se bautiza), sin rótulos de local, tope de descarga
raro. El resto de la foto: OSM 2.167 con nombre al 98 % (la única
fuente que cumple nombre+coordenada+vivo) · restaurante.json 1.537
con 39 % de coordenadas y frescura contradicha · veladores 712
huérfanos · Aragón sin coordenadas y ficha NO CONSTA con causa. El
barrido completo de las 251 categorías confirmó: la API municipal NO
tiene censo de hostelería. Y de la idea de Antonio para la intranet
nació EL PANEL DE FRESCURA, adelantado al presente (plan, punto 16):
manifiesto (formato de la verdad) + pestaña pública con semáforo
[D1 y D2 firmadas: color solo con fuente; gris NO CONSTA con cadencia
observada] + el cron educado al punto 14 [GET condicional, MDN].
Parlamento del 8 ABIERTO en la tanda 1 y la hostelería.

**⭐ PUNTO 7 CERRADO (23/08) — la narración de cruces, última
casilla, HECHA: los combines de odin calcados de fuente.** Tres reglas
(unnamed straight · same-base · continue obvio 0,6 km con herencia de
nombre), los vetos, y una cota [PROPIO] declarada. Sobre 387 rutas:
−116 pasos (9.348→9.232), genéricos −7,9 %, 80 rutas bajan y CERO
suben, geometrías idénticas al byte. Las seis juez intactas — y como
en ellas ninguna regla disparaba, el rojo se compró con TRES juez
nuevas donde sí muerden (33→31 · 20→18 · 32→31) más la del veto
(Biel). La MITAD ANCHA de odin, FUERA y firmada por Antonio: nuestro
«Continúa» no es su kContinue (0/1.511 repiten calle) y habría
borrado 1.099 nombres — lápida con cifras en el código. El zigzag
A→B→A declarado sin regla: problema abierto del ecosistema (listas
OSM, #4657), geometría real. **Bitácora nº10** (el medidor de cruces
contaba ramas sin descontar las de la ruta; publicó cifras infladas
que un comentario ya llevaba; la juez de Biel lo cazó en rojo con el
motor teniendo razón) — ley: «una contraprueba solo vale para lo que
atraviesa»; 10 entradas, 10 cerradas. 19 guardianes nuevos, 15/15,
179/179 motor. Dos flecos parlamentados: la frase caducada del 121.1
en andando.ts reescrita (`a83441a`) y los porcentajes sin
procedimiento FUERA del README (`ab87224`) — NORMA: al README solo
cifras con comando y muestra declarados. Commits del día: `0f01130` ·
`0225b4b` · `d6d176e` · `0a90eb5` · `a83441a` · `ab87224`. Hallazgo
sin dueño aún: dos cifras históricas del README no reproducían —
resuelto quitándolas (decisión B de Antonio).

**Punto 7 — fuera el visor y los andamios (22/08, tarde): la app
queda en 0,22 MB.** Parlamentado: el visor NO muere — se RESERVA para
la Intranet, **punto 16 nuevo del plan** (con el hash de recuperación
escrito: `6327e45`). El andamio no vivía en el visor: lo disparaba EL
BUSCADOR en su constructor (hallazgo del PARA) — fuera de ahí, la raíz
en frío pasa de 41,07 MB/20 peticiones a **0,22/3**, cero bytes de
`app/data/`. Borradas 1.173 líneas (capas, visor, los 14 pinceles de
mapa.ts —1.001→154—, la barra: una página no navega); la atribución
OSM SE QUEDA (ODbL). Guardianes: 21 retirados · 1 INVERTIDO nacido en
rojo (la raíz pide CERO a /datos/) · 1 nacido (F5 en /visor → comodín
→ buscador). Cabo muerto por gravedad: los `_cabeceras.txt` (404 al
irse la entrada de angular.json, sin tocarlos). Y dos hallazgos
reportados sin tocar el plan [escritor único]: el puntero de la
imprecisión era §1.7, no §1.6; y el «31/12» del GTFS eran calendarios
HUÉRFANOS — 196 service_id sin ningún viaje, el servicio real acaba el
27/12 (verificado contra el dato, no copiado). La demo, intacta por el
proxy: Arrupe 6.371 m · 13 pasos. Docs: el visor en PASADO y con
destino. Commits `6327e45` + `1deaa86` · 64/64 interfaz (eran 84) ·
160/160 motor.

**Punto 7 — mínimo de distancia (22/08, tarde): la prioridad
RETIRADA por el ojo de Antonio.** El paso 3 del ritmo se cumplió con
las rutas vivas en el 4200: Arrupe pagaba +502 m (+6 min) rodeando el
corredor central por la prioridad de OSMAnd — cuando por la avenida
también se anda, por su acera. Decisión: mínimo de distancia entre lo
PERMITIDO — el defecto documentado de Valhalla (walkway_factor 1,0
neutral) y OSRM (sin factores). La capa se fue entera (nueve piezas,
no a ×1,0) y `shortest` con ella; `andando.ts` 226→147 líneas con
lápida en cabecera (qué fue, qué costó medido, y que volver exige
medición nueva). La tabla de ACCESO intacta CON PRUEBA: diff cero
contra HEAD y la red clavada en 89.047 — el carril bici sigue cerrado.
8 guardianes de vuelta + el noveno: en verde con el comentario
mintiendo («Arrupe ya no pisa el paseo»), cazado releyendo [L62]. Las
seis juez al metro con la B (2.487 · 6.371 · 4.517 · 342 · 0 · Aviso),
cycleway 0 en todas. Rojo visto (céntrica a 4 contra el motor viejo),
contraprueba 8/8. README: la retirada CONTADA, no callada (el ×1,2
solo vive en el párrafo que la cuenta); cifras re-medidas (vía
peatonal 37,4 % · latencia p50 22 · 22,7 pasos). Commits `7d2ffcb` +
`1067c6f`. Antonio: «ahora ya carga las rutas bien». RSS del motor
observado al arrancar: 412 MB (anotado para el punto 14).

**Punto 7, casilla 3 HECHA (21/08, tarde) — el motor andando cumple
la tabla que la documentación dictó.** Seis commits
(`2796232`→`52a55ff`, ahead 12): el ACCESO (`andando.ts`, 27 tipos
citados fila a fila; la red andable pasa de 93.503 a **89.047**
aristas, `cerradas` publicado en salud) y el COSTE (metros÷prioridad,
OSMAnd; `shortest` como contraste interno). Las juez: **0 m de
cycleway en las cinco**, máximo +7,9 % (Arrupe, que sube a 94,7 % de
vía peatonal; la céntrica al 100 % por +1,3 m). Los 20 portales
solo-cycleway caen con el Aviso (0,044 %, hueco de OSM). **Bitácora
nº9** — la simulación medía en dos unidades y el desvío declarado
salió ×18,2 — capturada en caliente y cerrada con segundo defecto
hallado al releer (el ×1,667 de las puertas) y ley nueva: «que el
resultado saliera bien no exonera al instrumento». Los 8 guardianes
de forma movidos con la cuenta entera versionada en su comentario
[GUIA: la evidencia se versiona] y contraprueba 8/8; el del colapso
ahora vigila la RAZÓN (8,4, suelo 5), no un número muerto. Latencia
re-medida y atribuida: p50 15→23 ms — es la respuesta (25,9 pasos,
~16 kB), no el Dijkstra (9,1→10,2 ms). 160/160 · 84/84 · tsc y build
limpios. Pasos de Arrupe 13→25: la narración de cruces queda en el
plan como casilla propia con doctrina localizada (odin colapsa;
`pedestrian_crossing` de serie). Sin push: el último publicado sigue
siendo `cb01522`.

**Punto 7, casilla 2 del acceso/coste RESUELTA POR DOCUMENTACIÓN
(21/08, mediodía) — sin parlamento: la doctrina decidió sola.** La
regla del peatón resultó ser el **art. 121.1 del RGC, literal**: la
zona peatonal OBLIGA donde existe; donde no («no exista o no sea
practicable»), arcén o calzada — la excepción que salva el campo la
trae la LEY. El carril bici, prohibido al peatón por TRIPLE fuente
(graph.lua de Valhalla: pedestrian_forward=false · foot.lua de OSRM:
sin velocidad · Ordenanza de Zaragoza art. 25: «únicamente por
ciclistas»). El matiz acera-bici (prioridad peatonal, 20 km/h en la
nueva Ordenanza) casa con la clasificación calzada/acera/senda/calmado
que la capa municipal de carriles YA trae. La bici quedó cerrada de
rebote: jamás acera (Ordenanza + 121.5 RGC), y el que empuja es peatón
— lo que disuelve la discrepancia OSRM/Valhalla. El mecanismo de
«no existe acera» tiene dos implementaciones documentadas (cierre por
tag [sin nuestro dato] · prioridad por tipo [OSMAnd, solo con `h`]) y
se elige en la casilla 3 con las rutas juez delante. ⚠️ Dos
caducidades vivas: el **RGC reformado (RD 518/2026) entra en vigor el
01-10-2026** — mismo principio, las citas migran al texto nuevo — y la
versión exacta de la ordenanza municipal que rige hoy es NO CONSTA
(TSJA + Nueva Ordenanza de Movilidad; se verifica en el punto 9).
Tabla completa con fuente por fila: en el plan, casilla 2.

**Punto 7, casilla 1 del acceso/coste HECHA (21/08) — el censo del
grafo, solo lectura, cero ficheros tocados.** ⭐ El hallazgo: cada
arista lleva DOS etiquetas — `p` (6 valores gordos) y **`h`, que es la
etiqueta `highway` de OSM**, ya cargada en memoria y ya usada para
narrar (es de donde sale «el carril bici»: cadena de cinco eslabones
con fichero y línea). `p` solo NO traduce la doctrina (mete 4.452
carriles bici, 7.254 track y 12.574 residential en el mismo saco
eje-de-calzada); **`h` sí: la tabla de la casilla 2 se calca sobre `h`
fila a fila.** Descubrimientos al censo: sexto valor de `p` no
catalogado (`eje-con-acera-declarada`, 2.385 útiles / 96,5 km) · `a`
NO es acceso peatonal, es filtro de red (quita autopistas/enlaces/
obras; deja dentro TODA la calzada urbana: 41.716 aristas de
eje-de-calzada, el 71,3 % de los km útiles) · ⚠️ carencia sin arreglo
con lo que hay: NINGÚN campo de acceso en la arista (foot/access/
oneway/surface — nada): la doctrina de tipos es aplicable, sus
overrides de OSM no. El antes, retratado: cycleway = 3,3 % de los km
útiles y las rutas juez lo pisan al 87,3 % (Coloso→Zuriza) y 64,7 %
(L. Romeo→Coloso); la céntrica, cero; **y el 77,9 % de los carriles
bici tienen acera propia a ≤25 m** (la ciudad ~75-80 %, el track
2,6 % — la regla absoluta dejaría al campo sin camino, por eso la
doctrina la hace condicional). Totales cuadrando en todas las tablas;
la alineación no-única de la ruta 3 declarada (4 m de 4.464, ningún
`h` cambia).

**Punto 7, pieza C HECHA (20/08) — EXISTE LA DEMO.** La pantalla pinta
la ruta real, lista los pasos con flechas y negritas (partes
estructuradas accion/via), y la respuesta falsa murió sin rastro. Seis
remates nacidos del ojo de Antonio sobre SUS rutas, todos con doctrina
citada: colapso de maniobras [OSRM 105 m] · tipo real (carril bici ≠
calzada — bitácora nº7: una lista de textos aceptables no comprueba
verdad) · HERENCIA POR VECINDAD de los ejes municipales §1.15
[Valhalla #5587 + Voronoi + confianza]: 40%→77,1% aristas nombradas,
cruce 225 ms, disputa 3%→genérico · un solo nombre por calle [núcleo +
canónico municipal, Karlsruhe] con la regla ancha (plazas absorbidas
como los motores; plaza-hito y rotondas = mejora futura declarada) ·
presentación IGN/RAE/OSM con negritas — bitácora nº8 (token sucio) ·
«para seguir por» [Valhalla stay-on]. 153+84 pruebas. 8 bitácoras, 8
cerradas. Queda del punto 7: retirar los andamios de carga (decisión
de Antonio sobre qué visualización queda) y el PUSH (sin publicar
desde b027199). Parlamento aparte anotado: el coste es solo metros —
elegir carril bici vs acera es accidente, no decisión.

**Punto 7, pieza B HECHA (20/08) — el motor calcula rutas de verdad.**
`POST /api/ruta` vivo: proyección construida (p50 5,5 m, contrastada
con la auditoría vieja al medio metro), Dijkstra 0,6 ms p50, las 4
combinaciones y el trivial con su rojo del naïf medido (10 m → 689 m el
peor), Peña Zorongo investigado (isla c=39 — 581 sin ruta con Aviso
honesto, el radio no se sube), pasos formato Google con fusión de
micro-pasos (umbral 25 m del valle del histograma; la céntrica 11→4
pasos, se lee como la captura; los «hacia la calzada» se quedan [DOC:
práctica Valhalla; coserlo del callejero no lo hace ningún motor]).
Bitácora nº6 con ley («una geometría no se comprueba por sus
extremos»). 117 pruebas. Falta la pieza C: pintar, listar los pasos, y
retirar la respuesta falsa.

**Punto 7, pieza A HECHA (20/08):** los nombres OSM promovidos de la
rama archivada a `motor/data/` (doble huella idéntica, nueve recuentos
casando, ficha §1.14 con el desfase fino de 17 h 44 min y la regla de
reparto interior-OSM/extremos-municipal) — y la contraprueba que evitó
la bitácora nº3 antes de nacer: la regla `-text` ampliada a
`motor/data/**` en el mismo commit. Quedan B (motor) y C (pantalla).

**El punto 7, cerrada su preparación (20/08):** la consulta al grafo
midió lo que hay (cero nombres en aristas · `p` clasifica el tipo · `m`
verificado · el `enlaces.json` del enganche PERDIDO — la proyección se
construye) y la investigación documental resolvió los tres frentes: lo
innombrado habla POR TIPO (el `p` es el dato de Valhalla), extremos
municipales / interior OSM (el 19,4% discordante declarado), umbrales
de giro LEÍDOS de `turn.cc`, snapping al patrón Loki con las islas
fuera. FORMATO DECIDIDO por Antonio: el de Google Maps (cardinal +
giros + «hacia X» + metros + lado del destino; rotondas fuera, mejora
futura). El plan lo estructura en TRES encargos: A el fichero de
nombres OSM (autorizado) · B el motor (`/api/ruta`) · C la pantalla
(pintado + pasos, y la respuesta falsa se retira).

**⭐ PUNTO 6 CERRADO (19/08).** El estado de los cuatro campos subió al
padre con la doc de Angular delante (`model()` + atadura desazucarada —
y cerró el hueco latente del model externo), ⇅ invertir cruza estados a
medias incluidos, y «Mi ubicación» rellena por código vía
`/api/portal-cercano` (1,35 ms medidos) con umbrales medidos (≤100 m de
accuracy [DOC MDN] · ≤150 m al portal — y el hallazgo: no existe corte
que separe Zaragoza de fuera, así que el mensaje dice la verdad medible:
«el portal más cercano está a N metros»). Ocho mensajes dignos en total.
La prueba de fuego fue el sobremesa de Antonio: accuracy 5000 m (IP) →
el botón se negó con el número real dentro — el umbral funcionando en
vivo; el camino del éxito espera un móvil con GPS. 73 pruebas; el
repintado sin zone.js verificado sin empujón.

**Lo siguiente:** (1) **las SONDAS del 12 y del 13** (ESRO · PMR ·
«gratuito» · aparcamiento de motos · YeGo) — solo lectura, un encargo;
con ellas delante se decide qué botones puede prometer el coche y si
la moto es viable; (2)
las SONDAS del 12 y del 13 (ESRO · PMR · gratuito · parking de motos
· YeGo) antes de prometer botones; (3) el push de la tanda del
31/08-1/09 cuando Antonio lo nombre; (4) de fondo: el feed del Pilar
(el cron lo coge solo cuando Avanza lo suba), el cron en el panel de
Hostinger al desplegar (punto 14), el RGC nuevo el 1/10 (migrar
citas). EN LA NEVERA: LA FASE 2 DE SENTIDOS (mantenimiento del dato
a goteo — la lista de 434 candidatas y el atajo de las shapes del bus;
fuera del punto 9 por orden de Antonio el 1/09) ·
con motivo de demo: hostelería-OSM (2.167) · municipales chicas
(cívicos 25 · museos 25 · mercados 46 · teatros 11 · turismo ·
juntas · OMIC) · la ficha de Aragón · el `estado` del registro. En
la nevera del taller: las leyes de la nº12-nº14 para la guía v2.2.

---

## 1 · Identidad

**Qué es:** buscador de rutas para moverse por Zaragoza. Cuatro campos
(calle y portal de origen y destino — todo elegido), seis modos
excluyentes (andando · bus/tranvía · bici privada · patín VMP · BiZi ·
coche), la ruta en el mapa y los pasos escritos. **Una sola pantalla de búsqueda** (el
visor de verificación se retiró el 22/08: reservado para la Intranet,
punto 16). No es multimodal.

**Qué NO es:** no promete tiempos totales inventados. Para bus y tranvía
rige D-G (14/08): componer sin prometer.

**Repositorio:** `github.com/ablanquez/desplazame` (público) · local
`F:\01_PROYECTOS\004_DESPLAZAME` · la OLD solo como almacén (se copia DE
ahí, nunca se lee DESDE ahí).

**Licencias:** código Apache 2.0 · datos ODbL (OSM), Ley 37/2007
(Ayuntamiento), MITMS (GTFS NAP). Copyright en el README. Atribuciones
colgadas de sus capas.

## 2 · Stack (firme)

- **Frontend:** Angular 22 standalone · Leaflet + OSM · router mínimo
  (una ruta + comodín — /visor cae al comodín desde el 22/08).
- **Motor:** Node + TS SIN compilar (no hay build — hecho de despliegue,
  ata el punto 14) · `node:http` · todo en memoria antes de `listen()`.
- **Workspaces** de raíz única (`tipos/`+`motor/`+`app/`), lockfile
  único · **contrato** por symlink: si el motor cambia, el front no
  compila, a propósito; crece cuando el motor lo pide.
- **Endpoints:** bajo `/api`; los vivos los declara el motor, los
  previstos el plan (6 y 8). Proxy dev `/api/**` → 3000.
- **Despliegue:** Hostinger plan Node — TODO en NO CONSTA hasta el
  punto 14 (versión Node, memoria, proceso persistente, index.html en
  rutas desconocidas, symlink a lo construido).

## 3 · Las reglas del reinicio

1. Visualización desde el minuto uno; nada cuenta sin verse funcionar.
2. Bitácora ante fallo real, con la skill, antes de arreglar.
3. Alcance corto; documentación y plan son los raíles — lo que surja se
   encaja en el plan o no se hace.
4. Commits atómicos; push solo cuando Antonio lo diga.
5. Datos pieza a pieza con autorización, tal cual, integridad sobre
   CLON; correcciones solo con «está mal y punto», declaradas con huella
   nueva.
6. Ninguna cifra heredada (del viejo o de memoria) como criterio: el
   dato manda, medido con comando.

## 4 · El plan

`PLAN-DESPLAZAME.md`, renumerado a enteros el 19/08 (fuera el «6B»):
**1-8 CERRADOS** (el 7 el 23/08; el 8 el 27/08: siete categorías,
toda calle sugerible, el buscador por tipos completo, la validación
espacial con sus cuatro bitácoras cerradas, y la poda de demo
firmada — hostelería y municipales a la nevera con motivo) ·
11 CERRADO el 2/09 (las cinco casillas — la botonera de la demo: dos
filas, BiZi a petición, resumen único, minuto una vez; ver el plan) ·
10 CERRADO el 1/09 (casillas 0-5 y los pulidos — el bus entero: cron
+ cocina + RAPTOR con pesos OTP + desvíos operativos + vivo a
petición + pantalla WCAG; ver el plan) · 9 CERRADO el 30/08 (casillas
0-7 — el COSTE DE LA RUEDA:
red aparte con sentido demostrado [112 rotondas antihorario/0 ·
22.999 encadenados], once jueces con cifras, la muralla sha256 del
peatón, el patín 51/200 con el defecto del art. 50 RGC [RD 970/2020:
30 un carril por sentido], carril_vh descartado con contraejemplo,
pid-del-log==pid-que-contesta tras el susto del motor zombi; queda: ⚰️ el
selector a seis, el empuje, el selector de ruta, LOS PRIVADOS CON
SU APARCABICIS, BiZi ENTERO y el pintado por tramos HECHOS
[casillas 4-6 y sus bis, 30/08] — del 9 queda LA DEMO) ·
10 bus/tranvía · 11 coche (cargado: parkings, parquímetros, las tres
cuentas) · 12 despliegue (cargado) · 13 estética · **14 Intranet
(nuevo el 22/08, reservado para el final: el visor vive ahí)**. La investigación de
datos abiertos vive en `docs/INVESTIGACION-EQUIPAMIENTOS.md`.

## 5 · Decisiones

**Heredadas:** D-G (componer sin prometer) · paradas se regeneran
(punto 10) · velocidad a pie 5,0 km/h.

**Del reinicio (16-17/08):** `app/.vscode/` versionado · GTFS como
instantánea con caducidad · D-MAPA-DE-HOY (punto 10) · reparto de censos
(callejero+municipal resuelven · enganchado salta al grafo · 124 sin
enganche → Aviso) · solo se sugiere lo cumplible · norma Set-Cookie ·
color BiZi es marca · correo del feed tal cual · el puerto no abre hasta
que el grafo está.

**Del 18/08:** «LIMPIO [NÚCLEO]» con corchetes · borrador marcado, no
borrado (opción B [DOC]) · correcciones en fichero con «está mal y
punto» · el portal se elige, y en el punto 5 (zanja abierta) · el visor
primero y el router se queda · aparcamotos fuente WFS · regulado ESRO
azul `#0284c7` / ESRE naranja `#f97316`, casilla única, solo el pago ·
zonas en panel propio zIndex 350 · PMR rosa `#ec4899` por DFA, manda
TIPO no SUBTIPO, los 5 E.S.PMR mixtos sin pintar · la vista de cotejo
queda interna (pública como prueba, sin producto ni ficha de la
noticia) · todas las capas desmarcadas por defecto · etiquetas «Bici /
Patinete» y «Bus / Tranvía» (mayúscula por peso visual; VMP descartado)
· toda ficha declara la cifra DE SU fuente.

## 6 · Cabos abiertos

**Punto 7 (CERRADO el 23/08 — cabos que le sobreviven):** los **581** portales sin proyección →
`Aviso` honesto con nombre (460 son URBANIZACIÓN PEÑA ZORONGO, la
componente 39: el radio NO se sube) — sustituyen a los 124 del censo
viejo · ⚰️ los 628 con vía sin portal: HECHOS el 27/08 en
el cierre del 8 (619 por punto medio · 9 fuera con motivo; 3 de los
619 no enganchan y reciben el Aviso, que era su destino de casilla) · 170 componentes del grafo (169 islas) ·
`Via.nombre` crudo viaja sin usarse (no re-verificado hoy) · ⚰️ la retirada de los andamios: HECHA el
22/08 (la perezosa quedó anotada en el punto 16) · rotondas y plaza-hito, declaradas MEJORA FUTURA
(sin etiqueta en el grafo) · la arista NO trae campos de acceso OSM
(foot/access/oneway/surface): los overrides de la doctrina no son
aplicables con el dato que hay — se trabaja con la tabla de tipos
pelada o se decide traer el dato (casilla 2) · el sexto valor de `p`
(`eje-con-acera-declarada`) existe y el estado ya lo cataloga · ⚰️ `enlaces.json` de la OLD: cabo MUERTO —
se perdió, y el punto 7 construyó la proyección por su cuenta · la
plaza dicha de dos maneras en pasos seguidos («Plaza del Emperador
Carlos V» → «Plaza Emperador Carlos», visto el 22/08 en la ruta C
retirada): quedó FUERA del encargo de narración del 23/08 — no es de
los combines, huele al NOMBRE ÚNICO (núcleos que no casan por la «V»).
Si reproduce en rutas vivas: NO CONSTA. Cabo vivo, sin dueño.

**Punto 8 (CERRADO 27/08):** tandas 1-4 + el buscador por tipos +
la validación espacial + el foco en las dos capas + las vías sin
portal; la nº14 cerrada (⚰️ el testigo caído solo) · la poda de demo
FIRMADA (hostelería y municipales a la nevera con motivo — con la
ficha de Aragón y el `estado` del registro como flecos suyos) · lo
declarado que queda de él: el Last-Modified suelo-del-servidor (la
jurisprudencia lo neutraliza) · la re-descarga que no repite en type
(§1.20) · la 15912 con dos nombres (falso conocido, §1.15) · dos mutaciones del orden del
desplegable que hoy no muerden (id/etiqueta y tabla de códigos
empatan con las cuatro de hoy — despertarán con una categoría de
inicial dispar o con Á/Ñ) · ⚰️ el Miguel Servet: CERRADO el 24/08 (otra puerta de
cinco, conocimiento local — P1/P2 murieron sin objeto) · ⚰️ la regla
de entorno: HECHA (frontera + distancia + rescate; los 4 del datum
RESCATADOS — causa del vector sigue NO CONSTA pero ya no daña) ·
⚰️ el 9090: DE VUELTA (24/08, corrección manual de Antonio —
mecanismo de correcciones.ts con tres candados; la lista manual,
VACÍA) · la 781 más
ancha que su nombre (respetada, y ya buscable con provecho: el
Inocencio Jiménez sale por «navarra») · ⚰️ el foco a las VÍAS: HECHO
el 27/08 en el cierre (el patrón de Pelias/TriMet; Garrapinillos
primera desde Garrapinillos, los corchetes se quedan) ·
`estado` del registro de licencias SIN DESCIFRAR (0/1/2/3,
sin catálogo; quizá el visor de Urbanismo lo enseñe — otra caza de
DevTools si hace falta) · el tope de descarga desigual del registro
(100 vs 10 filas según consulta; totalCount siempre honesto) · la
ficha de Aragón NO CONSTA (robots + 401; Antonio puede pegarla) ·
recuentos de la API movidos desde el 18/08 (50/43/33/15; WFS 187;
1543 con endpoint 404).

**Punto 9 (casillas 0-3 + auditoría fase 1 HECHAS; LA RUEDA
RUTEA):** ⚠️ LA FASE 2 espera el ojo de Antonio (la lista de 434:
A1 la bici remonta hoy 71 vías · B2 rodea de más 25 — cada
confirmada: fila+testigo cayéndose+deshielo; y el arreglo aguas
arriba en osm.org cuando quiera) · el punto ciego de la sonda
(1.185 vías «único» en ambas — la clase Siresa: ojo o las shapes
del GTFS, anotado en el 10) · las 203 calles a medio cartografiar
(pedestrian+residential mismo nombre; señal paving_stones fichada) ·
⚰️ las casillas 4, 5, 6, 6-bis, 6-tris y 6-quater HECHAS (30/08:
el selector a seis · el empuje · el selector de ruta · el remate
del aparcabicis · BiZi entero con disponibilidad viva · el pintado
por tramos con el azul #2563eb) — ⚰️ LA DEMO (7) CONFIRMADA
por el ojo el 30/08 — EL PUNTO 9 CERRADO — ⚰️ la fase 2 de sentidos SALE del punto (1/09,
Antonio: «tiene que estar cerrado»): mantenimiento del dato a goteo →
NEVERA · LA MESA
de decisiones de Antonio: ⚰️ el tope de 500 m FIRMADO el 30/08
(«hay muchos desperdigados por la ciudad») · ⚰️ FUNDIR las
consultas: HECHO el 30/08 (single-flight — 3→1 por Generar, la
frescura intacta, las tres rutas del mismo momento) · ⚰️ LA
COLOCACIÓN del aviso: HECHA el 30/08 (la nota junto a cada hito,
texto idéntico al banner [GOV.UK doble sitio]) · la colocación del aviso ámbar (lejos
de los hitos) · ⚰️ MU2_señalizacion_vertical SONDADA Y DESCARTADA el 30/08
(13 campos, ninguno de orientación — sin hacia-dónde-mira no hay
sentido; el atajo real de la fase 2: las shapes del GTFS) · ⚠️ la API municipal de BiZi es CAPRICHOSA
(200 con cuerpo vacío durante horas el 30/08 — el D-G lo cubre) ·
⚰️ IML Viales 2025 a la NEVERA (aforos oficiales por sentido:
materia prima del Tranquila real [CycleStreets/busyness]) · ⚠️ EL DESAJUSTE DEL RELOJ declarado y sin tocar: el
montículo minimiza tiempo×factor y el reloj reportado va sin factor
(159↓/18↑ en 282) — qué se reporta es parlamento pendiente · a la
casilla 5: LOS CARRILES SIN NOMBRE (ojo de Antonio en ruta viva —
la herencia §1.15 apuntada a la red de la rueda) + velocidad por
modo en el rótulo + el «en la mano» fino ·
el RGC nuevo el 01/10 (las citas del 121/122 migran: las tablas y el
paso-empujando) · los carriles bici narran «el carril bici» sin
nombre municipal (herencia cruzada sobre la red del peatón — a la
casilla 5 con los combines) · /api/salud no publica la red de la
rueda (el log sí) · doble_sent sin uso (no dice hacia dónde) · los
bicycle=no de OSM (29 aristas) fuera del alcance de la 3 · la
pacificada derivada por arista puede abrir tramos que mi agregado
por vía cerraba (más fina y más veraz — decisión del ejecutor,
declarada) · lanes no descuenta carriles reservados (cuenta de más →
empuja al 50 → cierra al patín: el lado seguro, declarado) ·
unclassified sin defecto a propósito (las hay de dos carriles) ·
12.709 aristas siguen a oscuras de techo (la verdad) · ⚰️ EL PARLAMENTO 2-3 CERRADO (29/08,
las cuatro sillas con doctrina): en el 17,5 % manda el MUNICIPAL
(la fuente por arista declarada) · «carril bici» = h=cycleway
(Calmado y Senda fuera de la prioridad) · velocidades 18/20/18
(BiZi y patín [PROPIO firmados]; corte legal de asistencia 25
[UE 168/2013 · RD 970/2020 · EN 15194]) · elevación FUERA
[precedente OSRM] · ⚠️ estadoEstacion de BiZi roto en
las 276 (falso conocido; se usa estado) · la longitud_total
unidireccional que mide el doble (1,99, NO CONSTA) · 141 U+FFFD en
MU1 (confinados; codigo intacto) · la ficha §1.14 corta en su «Qué
es» (dice nombres, trae 260 etiquetas) · la doble capitalización
«Senda ciclable/Ciclable» · el contraflujo con candado (18 reales) ·
la API viva de BiZi vive aquí (mudada del 10; NO es GBFS).

**Punto 10 (⭐ CERRADO el 1/09 — la demo confirmada: «funciona
perfecto»; pulidos post-cierre fichados: el resumen único de avisos
[GOV.UK error summary], el minuto doble de la primera subida, el
botón a petición para BiZi; el cron en el panel de Hostinger al
desplegar):** ⚰️ CONTRASTES HECHOS el 1/09 (53/53 chips y todas las líneas
≥ AA, medidos en el píxel; chip y búho heredados de ZetaBus; ribete
por WCAG) · ⚰️ Avanza ya era paralelo; el peor caso (8,4 s) es el
presupuesto de reintento de ZetaBus sobre un poste mudo — se queda
[NN/g 10 s] · NO CONSTA por qué el poste 1203 no anuncia · 16/45 líneas sin
servicio entre semana en agosto (calendario del feed, dato) · ⚰️
la «firma 3» retirada por doctrina (los 10,1 min eran de la
búsqueda rota) ·
⚠️ EL FEED NO LLEGA AL PILAR (bus hasta el 05/10, cero del 10/10 en
adelante) — ⚰️ EL CRON YA EXISTE y está probado contra el NAP real
(la clave de Antonio en .env.local; el panel de Hostinger se
configura al desplegar) · ⚰️ el zip nuevo ya entra en caliente
(recocinar() con swap de referencia, 3a) · mejora: guardar los avisos del NAP en el
registro · ⚰️ la caducidad ya no es duda sino
medida · líneas por poste (sin guardián) · ⚰️ shapes.txt VERIFICADO el 30/08 (89 trazas cerrando al 100 %
con los trips — la traza del bus calle-a-calle que Antonio preguntó,
y las trazas direccionales para la fase 2 de sentidos) · ⚠️
shape_dist_traveled vacía · ⚠️ 8 rutas de routes.txt sin viaje · ⚰️
la API viva de Bizi: MUDADA al punto 9 (28/08).

**Punto 11 (⭐ CERRADO el 2/09 — la demo confirmada: «la botonera la
veo bien así»):** la regla queda viva para los que vienen: la
botonera enseña lo que existe; [Moto] entra con el 13 y la fila de
parking con el 12.

**Punto 12 (COCHE — era el 11; con tipos de parking desde el 1/09):**
sondas antes que botones: ESRO (regulado) · PMR (discapacitado) ·
«gratuito» = derivación, NO CONSTA · ⚰️ la ZBE VERIFICADA el 30/08 (dos polígonos FASE 1/
FASE 2, solo geom+fase — la letra legal de vigencia/vehículos/
excepciones pendiente aquí; descarga al repo cuando el punto
arranque) · hereda la capa de sentidos Y sus correcciones (Siresa
gratis) · exigirá las RELATIONS de giro [car.lua: obligatorias, con
except=bicycle a parlamentar para la rueda] + penalizaciones 7,5/20/
2 + descarga de relations · la cobertura de sentidos re-evaluada con
vara de coche (su 35 % a oscuras son contramanos potenciales) ·
parkings públicos (dos fuentes cojas) · parquímetros reevaluables ·
las tres cuentas municipales que no cuadran.

**Punto 13 (MOTO, nuevo el 1/09; depende del 12):** sondas: capa de
aparcamiento de motos (¿existe?) · YeGo (¿GBFS moped? ¿TTL 1 h?
¿licencia?) · la letra legal de la moto (carril bus, ZBE, zonas 30).

**Punto 14 (DESPLIEGUE — era el 12; todo NO CONSTA, y creció):** ⚠️ servidor.ts SIN SPEC (el
único fichero del motor sin pruebas — quitar el foco del endpoint
deja 460 verdes; visible desde el 27/08, su casa es la integración
de este punto) · versión Node del panel (el
README ya advierte del `engines` sin declarar — candidato a declararlo
aquí) · memoria (412 MB observados el 22/08 al arrancar; eran ~248 en el
punto 5) · proceso persistente · index.html en rutas desconocidas (en
dev el comodín ya cubre; en Hostinger, NO CONSTA) · symlink a lo
construido · guardias solo-Windows si hicieran falta allí.

**Punto 15:** color de marca (`NO CONSTA`) · el title (la pestaña dice
«Desplázame» a secas) · capturas del README si se quieren · la
protanopia del MAPA (dos chinchetas solo por color) con la bandera a
cuadros como salida documentada [#2787 de osm.org, cycle.travel] —
anotado el 23/08, ABIERTO.

**Las normas de circulación (contexto vivo):** el RGC reformado por
RD 518/2026 entra en vigor el **01-10-2026** (arts. 121 y 122
reescritos) — desde octubre las citas del proyecto apuntan al texto
nuevo · ⚰️ la duda de la ordenanza: RESUELTA el 28/08 en la casilla
0 del punto 9 (rige la Nueva Ordenanza de Movilidad desde el
11/09/2024, BOP 21/08/2024 — el NO CONSTA del 21/08 murió).

**La ampliación del regulado (contexto vivo):** activación prevista de
golpe en verano 2027 (~15.000 plazas nuevas hasta 21.745; recurso Tacpa
pendiente — Heraldo 14/07/2026). El regulado y las zonas caducarán DE
GOLPE; los planos de Antonio traen zonas que el dato no enseña
(pendiente de detallar si algún día toca). La vista de cotejo morada —
retirada con el visor el 22/08 — es la herramienta: se recupera de git
(`6327e45^`) cuando la Intranet (punto 16) llegue, o cuando 2027 lo
pida.

**Método y vigilancia:** nada vigila el README (nº1 y nº5 lo avalan; lo
cubren la regla transversal — la unidad es el documento — y la costura
§6) · 731 pruebas (485 motor + 246 interfaz; e2e aparte, a mano) sin CI · la muralla-sha256 del peatón (391 rutas) · pid-del-log==pid-que-contesta · comprobar-tipos con censo (290+353 ficheros) · guardias manuales y solo-Windows (declarado ya
en el README) · `GRAFO_ESPERADO` a mano · el hueco latente del model
externo quedó CERRADO con el refactor del punto 6 (el padre es el dueño;
todo entra por `elegir()`) — cabo nuevo a cambio: `SelectorPortal` ya no
lleva dentro la regla de tirar el portal, y si se montara en otro sitio
el portal se quedaría pegado (comentado y fijado con prueba doble) · el
eco de los 200 ms · datos municipales
caducan (callejero mensual; regulado de golpe) · npm 11 bloquea scripts
de 4 paquetes (no rompe el build, comprobado en clon) · TS rama 6 · ⚰️ los
`_cabeceras.txt`: muertos el 22/08 con la entrada de angular.json ·
`nombrePublicoNorm` existe y no se usa · el tranvía municipal nunca
descargado (opción futura).
