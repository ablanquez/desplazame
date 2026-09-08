# DISEÑO-DESPLAZAME · Documento anexo de diseño

**v1.0 · 8/09/2026.** Fruto de la investigación profunda del 8/09 (decenas de fuentes; doctrina primaria priorizada: W3C/WCAG 2.2, WAI-ARIA APG, Nielsen Norman Group, Material Design 3, documentación oficial de Figma, MDN, OSMF, CARTO, Radix). **Escritor único: la conversación de estrategia** (como PLAN y ESTADO). Este documento guía el punto 15 (estética) de Desplázame **y es reutilizable para futuros diseños de la casa**: las fuentes y los porqués importan tanto como las conclusiones. Las decisiones aquí propuestas son PROPUESTAS con doctrina hasta que Antonio las vale; lo ya decidido por Antonio (layout, bloques, separador de dos posiciones, sin scroll global, claro+oscuro) va marcado como DECIDIDO.

---

# Documento-guía de diseño · "Desplázame" — Rutas multimodales urbanas de Zaragoza

**Las tres decisiones más importantes que la doctrina sostiene: (1) color de marca azul —no verde, para no colisionar con YeGo—, (2) layout sin scroll global con `100dvh` y bottom sheet de dos estados en móvil / separador de dos posiciones en escritorio, y (3) usar Figma Make como especificación visual + tokens DTCG, no como código, porque genera React/Tailwind mientras la app es Angular.**

## Resumen de alcance
Organizado por los 8 bloques (A–H) y 37 puntos. Cada punto ofrece (1) doctrina/hallazgos con fuentes y (2) recomendación concreta para Desplázame. Al final: resumen ejecutivo con decisiones clave y sección "para el brief de Figma Make".

---

# BLOQUE A · IDENTIDAD VISUAL

## 1. Color de marca
**Doctrina.** El azul es el color más consistentemente asociado a confianza, fiabilidad y profesionalidad, tanto en la literatura de branding como en investigación académica de percepción (los productos "funcionales" —los que satisfacen necesidades prácticas— encajan mejor con colores funcionales: gris, negro, azul y verde; los "sensorial-sociales" con rojo, amarillo, rosa, púrpura). En el sector transporte, el verde comunica ecología/sostenibilidad y el azul/marrón fiabilidad y servicio. Reglas prácticas de branding: 60-30-10 y paleta limitada a 3-5 colores.
**Colisiones locales en Zaragoza a evitar:** el verde está ocupado por **YeGo** (motosharing) y por la connotación general de "bici pública"; **BiZi** es el servicio municipal de bici; el bus y el tranvía los opera **Avanza**. El color de traza de cada modo no debe chocar con el color de marca del operador ni con los semánticos (rojo=error, ámbar=aviso, verde=éxito).
**Recomendación Desplázame:** **primario azul** (confianza + neutralidad respecto a operadores). Reservar el verde para "andando/eco" y para el semántico de éxito. Los colores de operador se muestran en *badges* con contenedor neutro (ver punto 34). No usar verde como color de marca global, para no colisionar con YeGo ni sugerir vínculo con la bici pública.

## 2. Paleta completa y escalas
**Doctrina.** Metodología de escala de 12 pasos tipo Radix Colors, donde cada paso tiene un rol de UI fijo: **1-2 fondos, 3-5 componentes interactivos, 6-8 bordes/separadores** (6 = borde sutil no interactivo; 7 = borde de componente interactivo; 8 = borde fuerte / focus ring), **9-10 fondos sólidos** (9 = color de marca puro, mayor croma), **11-12 texto** (11 bajo contraste, 12 alto contraste). Radix garantiza que los pasos 11 y 12 alcanzan Lc 60 y Lc 90 (APCA) sobre un fondo paso 2 de la misma escala. Cada escala se entrega con variantes clara, oscura y alfa. (Tailwind usa una convención análoga 50-950.)
**Recomendación:** construir escalas de 12 pasos para primario (azul), gris neutro y semánticos (success/warning/error/info). Mantener el ámbar de avisos actual como escala coherente: fondo cálido claro `#fff4e5`, texto/borde `#b45309`, texto sobre cálido `#7c3d00`. Definir tokens semánticos que apunten a un paso concreto de cada escala (p. ej. `warning-bg → amber-2`, `warning-text → amber-11`), nunca a hex sueltos, para que el modo oscuro (punto 37) sea un cambio de modo, no de código.

## 3. Tipografía
**Doctrina.** `font-variant-numeric: tabular-nums` (feature OpenType `tnum`) fija el ancho de cada dígito para que horas de paso y cuentas atrás no "salten" horizontalmente al actualizarse; MDN documenta que la propiedad es **Baseline desde enero de 2020** y recomienda la propiedad de alto nivel frente a `font-feature-settings:"tnum"`. Requisito clave: el font debe contener glifos `tnum` o la propiedad no hace nada. **Inter** fue creada por Rasmus Andersson "para mejorar la legibilidad en pantalla del texto de interfaz, especialmente a tamaños pequeños" e incluye tabular figures y slashed-zero (rsms.me/inter). **IBM Plex Sans**, **Roboto**, **Source Sans 3** (la fuente que MDN usa en sus ejemplos de `font-variant-numeric`) y **Lato** también soportan `tnum`. Todas gratuitas en Google Fonts bajo SIL OFL.
**Recomendación:** **Inter** como fuente principal (UI + números de paso). Aplicar `font-variant-numeric: tabular-nums` en todo elemento con horas/tiempos que se actualicen y `slashed-zero` para códigos de línea/parada (desambiguar 0/O). Escala tipográfica modular; pesos 400/500/600. En modo oscuro, subir un peso (400→500) para compensar el adelgazamiento óptico documentado sobre fondos oscuros.

## 4. Diseño de logo
**Doctrina.** En logos de movilidad el color aporta significado (verde=eco, azul=fiabilidad). Versiones habituales: **completo** (símbolo+logotipo), **reducido** (símbolo), **favicon** y **app icon**. Legibilidad a tamaños pequeños: símbolo simple, reconocible a 16px. Para briefar a una IA generativa: la documentación oficial de Figma advierte que "el modelo no es capaz de procesar colores exactos a partir de una imagen", por lo que hay que dar hex explícitos y combinar prompt de texto + imagen de referencia + valores concretos.
**Recomendación:** símbolo geométrico simple que evoque "ruta/movimiento" (p. ej. traza + pin), en azul primario; producir SVG en versiones completo/reducido/favicon/app-icon. Al briefar la IA, describir el *outcome* (marca de confianza para movilidad urbana) y aportar hex exactos, no adjetivos.

## 5. Iconografía
**Doctrina.** **Material Symbols**: licencia **Apache 2.0**; +2.500 glifos; cobertura de movilidad muy amplia y verificada: `directions_walk`, `pedal_bike`, `directions_bike`, `electric_bike`, `electric_scooter`, `bike_scooter`, `directions_bus`, `tram`, `directions_car`, `two_wheeler`. **Lucide**: licencia **ISC**, ~1.800 iconos, cobertura de transporte parcial. **Phosphor**: **MIT**, ~1.248 iconos × 6 pesos, buena cobertura. Ninguna exige atribución visible en la UI (solo conservar el texto de licencia en el código). **Emojis como iconos de producto — desaconsejado:** NN/g documenta que atraen la atención pero reducen la percepción de profesionalidad/credibilidad; el renderizado es inconsistente entre plataformas (ACM CSCW 2018, Miller Hillberg et al.); y provocan problemas de lector de pantalla (estudio de Deque: solo 17 de 91 símbolos se anunciaban de forma fiable en JAWS/NVDA/VoiceOver; el lector lee el nombre Unicode, no tu significado). NN/g además sostiene que "los iconos necesitan etiqueta de texto".
**Recomendación:** **Material Symbols** como set único (mejor cobertura de los 8 modos y licencia Apache 2.0). **No usar emojis** como iconos de producto; `aria-hidden` si alguna vez se usan decorativamente. Cada icono de modo con etiqueta de texto. Mapeo propuesto: andando `directions_walk`; bici propia `pedal_bike`; patín/VMP `electric_scooter`; BiZi `directions_bike`; bus/tranvía `directions_bus`/`tram`; coche `directions_car`; moto propia `two_wheeler`; YeGo `two_wheeler` diferenciado por color/badge.

## 6. Tono visual y referentes
**Doctrina.** Citymapper es la referencia multimodal: combina todos los modos urbanos con tiempos en tiempo real y coloca los avisos de disrupción/desvíos como protagonistas. Patrones estándar del sector (Transit, Moovit, Google/Apple Maps, y operadores europeos TfL/SBB/Renfe/EMT/TMB): planificador origen-destino, resumen por opción con duración/coste, tiempos reales por línea y uso del color de línea oficial como código de identificación.
**Recomendación:** adoptar los patrones consolidados (chips/tabs por modo, tarjetas de resultado con duración/coste/espera, avisos de servicio destacados). El rasgo diferencial —"honestidad del dato" (edad del dato, degradación honesta)— se apoya directamente en la heurística de visibilidad de estado (punto 7) y en los estados de primera clase (punto 24).

---

# BLOQUE B · USABILIDAD Y PATRONES DE INTERACCIÓN

## 7. Heurísticas de Nielsen aplicadas a planificadores de ruta
**Doctrina.** Las 10 heurísticas de Nielsen (NN/g). **#1 Visibilidad del estado del sistema:** "el diseño debe mantener siempre informados a los usuarios sobre lo que ocurre, mediante feedback apropiado en un tiempo razonable" (NN/g ejemplifica con el letrero del metro que indica minutos hasta el próximo tren). **#2 Correspondencia con el mundo real** (lenguaje del usuario, sin jerga). **#5 Prevención de errores.** **#6 Reconocimiento mejor que recuerdo.** **#9 Reconocer, diagnosticar y recuperarse de errores** (mensajes sin jerga, accionables).
**Recomendación:** la "honestidad del dato" *es* visibilidad de estado: mostrar la edad del dato, `aria-busy` durante el cálculo y mensajes de error honestos ("La DGT no ha contestado. Vuelve a intentarlo."). Reconocimiento sobre recuerdo: chips de modo siempre visibles y autocompletado de direcciones.

## 8. Patrones de planificadores de ruta
**Doctrina.** Entrada origen/destino con dos campos, botón de **intercambio (swap)** y acción **"mi ubicación"**; selección de modo con tabs / segmented control / **chips**; resultados como **lista de pasos + línea de tiempo + resumen** (duración/distancia/coste); comparación entre modos.
**Recomendación:** dos campos apilados con botón swap entre ellos; chip "mi ubicación"; fila de chips para los 8 modos; tarjetas de resultado con resumen (duración, coste, espera) y detalle expandible a pasos/timeline. Permitir comparar modos de un vistazo.

## 9. Bloques abatibles
**Doctrina.** Material 3 define tres tipos de bottom sheet: **standard** (coexiste con el contenido), **modal** (bloquea, con scrim) y **expanding**. Estados: `COLLAPSED / HALF_EXPANDED / EXPANDED / HIDDEN`; el *drag handle* tiene mínimo 48dp. `skipPartiallyExpanded = true` deja solo dos estados estables, evitando el intermedio ambiguo. En escritorio, el **separador de dos posiciones** (columna abierta ↔ cerrada, sin arrastre libre) es el patrón de panel lateral colapsable tipo Google Maps.
**Recomendación (LAYOUT DECIDIDO por Antonio; aquí el CÓMO):** móvil → bottom sheet con **dos estados estables** (colapsado peek / expandido), sin arrastre libre; drag handle ≥48dp. Escritorio → separador de dos posiciones (panel izquierdo abierto/cerrado). Abatir automáticamente el buscador al obtener resultados; el usuario lo reabre a mano.

## 10. Jerarquía de información en el itinerario
**Doctrina.** Combinar visibilidad de estado con diseño minimalista (heurística #8). Citymapper coloca los avisos de disrupción como protagonistas del itinerario.
**Recomendación:** timeline vertical de pasos con icono de modo + tiempos tabulares; transbordos marcados visualmente; avisos (desvío, dato no disponible) en un contenedor de aviso ámbar con **icono + texto**, insertado en el punto del itinerario afectado, sin romper la lectura secuencial.

## 11. Formularios de búsqueda
**Doctrina.** Patrón WAI-ARIA **combobox** (APG del W3C): `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls` apuntando al listbox y `aria-activedescendant` para que **el foco del DOM permanezca en el input** mientras las flechas navegan la lista. La variante "list autocomplete with manual selection" no autoselecciona. Estados vacío/cargando/error; mensajes honestos y accionables (heurística #9).
**Recomendación:** combobox accesible según APG; **debounce ~300 ms**; live region "polite" para anunciar el número de sugerencias/resultados; mensajes de error honestos y accionables.

## 12. El mapa
**Doctrina.** Convención de color de traza por modo; marcadores; polígonos de zona (ZBE, áreas de servicio). Controles táctiles: mínimo **24×24 CSS px** (WCAG 2.5.8 AA), recomendado **44×44** (Apple HIG) / **48×48dp** (Material). Los controles y objetos gráficos requieren contraste **3:1** frente a colores adyacentes (WCAG 1.4.11).
**Recomendación:** trazas con color por modo evitando colisión con semánticos; controles de mapa ≥44px; ZBE como polígono de relleno translúcido con borde ≥3:1; marcadores con contraste suficiente sobre teselas claras **y** oscuras (punto 33).

---

# BLOQUE C · ACCESIBILIDAD (WCAG 2.2)

## 13. Contraste AA/AAA
**Doctrina.** **1.4.3 (AA):** 4.5:1 para texto normal, 3:1 para texto grande (≥24px, o ≥18.5px en negrita). **1.4.6 (AAA):** 7:1 y 4.5:1. **1.4.11 (AA):** 3:1 para componentes de UI y objetos gráficos. El texto sobre imagen/mapa se mide contra los píxeles reales tras cada carácter; la solución habitual es un *plate*/scrim sólido. (WebAIM: el bajo contraste es el fallo WCAG más común, ~80% de las home del top millón.)
**Recomendación:** objetivo **AA** en toda la UI y **AAA** en el texto de datos crítico (horas de paso). Ningún texto de UI directamente sobre teselas: siempre en tarjeta/contenedor sólido.

## 14. Objetivos táctiles, foco y teclado
**Doctrina.** **WCAG 2.5.8 (AA):** 24×24 CSS px mínimo, o 24px de separación entre objetivos pequeños. Apple HIG: 44×44pt; Material: 48×48dp. La AAA (2.5.5) exige 44×44 sin la excepción de espaciado. Foco visible (**2.4.7**) y los nuevos criterios de WCAG 2.2 sobre foco (2.4.11-13). Navegación por teclado completa.
**Recomendación:** controles primarios **44×44**; mínimo absoluto 24×24 con separación; focus ring visible (paso 8 de escala, ≥3:1); orden de tabulación lógico buscador → resultados → mapa.

## 15. Patrones ARIA relevantes
**Doctrina.** Live regions para resultados y estados de carga; `aria-busy`; combobox (APG); acordeones/disclosure; `role="alert"` para avisos. Principio APG: "No ARIA es mejor que mal ARIA" (maximizar HTML semántico).
**Recomendación:** live region `polite` para "X rutas encontradas"; `aria-busy` durante el cálculo (ya en uso); `role="alert"` (assertive) para fallos de fuente (DGT); patrón disclosure para los paneles abatibles.

## 16. El color nunca como único canal
**Doctrina.** WCAG **1.4.1 Uso del color**: la información no debe transmitirse solo por color.
**Recomendación:** cada aviso con **icono + texto** además de color; los colores de línea siempre acompañados del nombre/número de línea; estados de éxito/error con icono distintivo.

## 17. Texto
**Doctrina.** **1.4.12 Text spacing** (line-height ≥1.5 sin pérdida); **1.4.10 Reflow** (sin scroll en dos direcciones a 320px de ancho equivalente); **1.4.4** zoom hasta 200% sin pérdida. Ancho de línea legible ~66 caracteres.
**Recomendación:** line-height 1.5 en cuerpo; reflow verificado a 320px; tamaños en `rem`; no bloquear el zoom (sin `maximum-scale=1`).

---

# BLOQUE D · RESPONSIVE Y LAYOUT

## 18. Breakpoints
**Doctrina.** Definir **por contenido, no por dispositivo**: el breakpoint es el ancho al que el layout deja de funcionar.
**Recomendación:** tres rangos (móvil <768, tablet 768-1024, PC >1024) **ajustados al punto donde el layout de 2 columnas con mapa deja de tener sentido**. El ancho mínimo utilizable del mapa manda el breakpoint de 2 columnas; documentar el criterio, no solo el número.

## 19. Viewport encajado sin scroll global (DECIDIDO por Antonio; aquí el CÓMO)
**Doctrina.** `100vh` en móvil se calcula contra el **viewport grande** (barras retraídas) y desborda al cargar. Unidades nuevas: **`svh`** = viewport pequeño (estable), **`lvh`** = grande, **`dvh`** = dinámico (recalcula en vivo; puede causar jank en layouts complejos). Soporte Baseline desde 2022 (Chrome 108+, Safari 15.4+, Firefox 101+). Las tres unidades **no** se ven afectadas por el teclado virtual (encoge el visual viewport, no el layout viewport). iOS: respetar `env(safe-area-inset-*)`.
**Recomendación:** contenedor raíz con `height: 100dvh` (fallback `100vh`; si se prefiere estabilidad sin reflow, `100svh`); **scroll interno en cada bloque** (`overflow:auto`), nunca en `body`/`html`. `env(safe-area-inset-*)` en móvil. Probar explícitamente con el teclado virtual abierto sobre el buscador.

## 20. Orden y prioridad en móvil (ORDEN DECIDIDO por Antonio)
**Doctrina.** En apps de mapas móviles, el resultado sube/cubre parcialmente el mapa al obtenerse (bottom sheet a expandido).
**Recomendación:** móvil en columna **buscador → mapa → resultados**; al calcular, el bottom sheet de resultados sube a expandido cubriendo parte del mapa y el buscador se colapsa; el usuario puede volver a colapsar los resultados.

## 21. Densidad de información
**Doctrina.** Material 3 contempla densidad aplicable (compact/comfortable) según dispositivo y complejidad.
**Recomendación:** densidad **comfortable** en móvil (targets grandes, más aire); **compact** opcional en PC para más rutas simultáneas. Tokens de espaciado que cambien por breakpoint.

---

# BLOQUE E · RENDIMIENTO PERCIBIDO Y ESTADOS

## 22. Estados de carga
**Doctrina.** Los tres umbrales de Jakob Nielsen (NN/g): **0,1 s** sensación de respuesta instantánea; **1,0 s** límite para que el flujo de pensamiento permanezca ininterrumpido; **10 s** límite de atención — "cualquier cosa más lenta que 10 segundos necesita un indicador de porcentaje completado". NN/g sobre skeletons: para <10s sirven skeleton o spinner; el **skeleton** es mejor en carga de estructura (reduce carga cognitiva) y el **spinner** para un módulo único. Por debajo de ~300 ms no mostrar indicador (el flash molesta); si aparece, mantenerlo ≥400 ms. Un spinner que dura >4 s debe sustituirse por barra o mensaje de progreso.
**Recomendación:** con latencias reales **0,4–8 s** por modo: <0,4 s nada; spinner inline en el botón para cálculos cortos; **skeleton de tarjetas de ruta** para cálculos de 1–8 s (imitando la forma real de la tarjeta); para los modos más lentos, **mensaje de progreso honesto**. Nunca pantalla en blanco.

## 23. Frescura/edad del dato
**Doctrina.** Timestamps relativos ("hace 1 min") frente a absolutos ("15:32"); materializa la heurística #1. El relativo es más legible para "recencia"; el absoluto, cuando importa la hora exacta.
**Recomendación:** **relativo** para recencia ("hace menos de 1 min"), actualizándolo en vivo; **absoluto** cuando importa la hora de paso concreta ("dato de las 15:32"). Esta doble presentación es la expresión visible de la "honestidad del dato".

## 24. Estados degradados/vacíos como estados de primera clase
**Doctrina.** *Graceful degradation*: empty states y error states son estados **diseñados**, no excepciones. Heurística #9: errores accionables, sin jerga.
**Recomendación:** diseñar explícitamente el **estado vacío** (sin ruta), el **error por fuente** ("La DGT no ha contestado. Vuelve a intentarlo." + reintentar + "elige tu distintivo a mano") y el **dato caducado**. Degradación por modo: si YeGo no responde, el resto de modos siguen con un aviso puntual en su tarjeta, no un fallo global.

---

# BLOQUE F · EL ENCARGO A FIGMA MAKE

## 25. Documentación oficial de Figma Make
**Doctrina.** Figma Make traduce lenguaje natural en UI y prototipos funcionales editables (corre sobre un modelo Claude). Mejores prácticas oficiales (figma.com/code-docs, "How to write great prompts"): **"Sé claro y directo"** —específico sobre el resultado final—; **"Usa ejemplos"** —imágenes ayudan, PERO "el modelo no es capaz de procesar colores exactos a partir de una imagen"—; **"No incluyas información sensible"**. Figma recomienda **empezar con un primer prompt detallado y luego iterar**; describir *outcomes*, no características. Limitación reportada por la comunidad: tiende a fundir todo en un único `app.tsx`.
**Recomendación:** brief detallado desde el inicio con **hex exactos**, capturas de la app real como referencia y restricciones (AA, targets 44px). Pedir explícitamente separación de archivos y que incluya ARIA, focus visible y contraste 4.5:1.

## 26. Design tokens
**Doctrina.** El **W3C Design Tokens Community Group** publicó la primera versión estable de la especificación (**2025.10**) el **28 de octubre de 2025** ("the first stable version of the Design Tokens Specification"), respaldada por Adobe, Amazon, Google, Microsoft, Meta, Salesforce, Shopify, Figma y muchas otras. Un token tiene `$value` y `$type`, y puede referenciar a otro por *path* (el semántico `button-primary-bg` apunta a `color-blue-600`). Soporta theming (claro/oscuro sin duplicar archivos) y espacios de color modernos. **Figma Variables** permite colores/espaciado/tipografía como variables con **modos claro/oscuro nativos**. Style Dictionary traduce a CSS custom properties.
**Recomendación:** definir tokens en **formato DTCG**, con capa **primitiva** (escalas de 12 pasos) + capa **semántica** (alias por rol). Modelarlos como **Figma Variables** con modos claro/oscuro y exportarlos a **CSS custom properties** consumidas por Angular.

## 27. El flujo Make → GitHub → código
**Doctrina.** Figma Make genera típicamente **React + Tailwind** (TSX). La app de Desplázame es **Angular**. Casar código React generado con una app Angular no es directo (paradigmas de componentes distintos).
**Recomendación (LA DECISIÓN GORDA DEL 15):** usar Figma Make como **especificación visual de alta fidelidad + fuente de tokens**, NO como código de producción. Extraer los tokens (DTCG / CSS variables) y traducir los componentes a Angular a mano. Esto evita deuda técnica por mezclar frameworks y preserva la arquitectura existente (y sus 295 jueces de interfaz).

## 28. Qué entregar como input al brief
**Doctrina.** Ejemplos concretos, hex explícitos, referencia por nombre de estilo **+** valores concretos, y describir a quién sirve la interfaz y qué debe lograr (el modelo usa el objetivo para decidir jerarquía y componentes).
**Recomendación:** entregar capturas de los **3 breakpoints**, textos reales (incluidos los mensajes de error honestos), la lista de 8 modos con su icono, la paleta con hex, los requisitos de layout y los de accesibilidad. (Detalle en la sección "para el brief".)

---

# BLOQUE G · LEGAL Y MARCA

## 29. Uso de colores/marcas de terceros
**Doctrina.** Representar marcas de operadores (verde YeGo, BiZi, colores de línea) es práctica común en apps de transporte; el límite del *trade dress* es no inducir a confusión sobre el origen ni sugerir patrocinio/afiliación oficial.
**Recomendación:** usar el color del operador **solo como código identificativo** dentro de un badge/contenedor neutro con el nombre del operador; dejar claro (footer/acerca de) que **Desplázame es un demo independiente de portfolio**, no una app oficial.

## 30. Atribuciones obligatorias
**Doctrina.** **OSM/ODbL** (OSMF *Licence/Attribution Guidelines* y *Legal FAQ*): crédito "**© OpenStreetMap contributors**", enlazando "OpenStreetMap" a `openstreetmap.org/copyright`; debe quedar claro que los datos están bajo la **Open Database License**; el texto legible (recomiendan seguir WCAG); en mapas interactivos, la atribución en una esquina cumple; se puede permitir ocultarla **tras** haberla visto, pero **no** ocultarla automáticamente; se puede omitir "contributors" si el espacio es limitado. **CARTO** (si se usan teselas Dark Matter/Positron): docs.carto.com — API key gratuita hasta un límite razonable de **5 millones de teselas/mes**; "la atribución debe permanecer visible. CARTO y OpenStreetMap deben acreditarse en cada mapa" (los raster requieren key y están en retirada; se recomiendan los vectoriales).
**Recomendación:** control de atribución Leaflet **siempre visible** con "© OpenStreetMap contributors" enlazado; si se usa CARTO en oscuro, añadir "© CARTO" y gestionar la API key. En una esquina, discreta pero con contraste legible; no eliminarla por diseño.

---

# BLOQUE H · MODO CLARO / MODO OSCURO

## 31. Diseñar doble paleta (no invertir)
**Doctrina.** Material 3 expresa la **elevación en oscuro mediante overlay tonal** (las superficies se aclaran y colorean más a mayor elevación); base recomendada **#121212**; el texto se gradúa por opacidad (87% alto énfasis, 60% medio, 38% deshabilitado). Apple HIG admite negro puro, pero Material recomienda gris muy oscuro. Doctrina común: **no invertir** la paleta clara.
**Recomendación:** dos paletas decididas a mano; en oscuro, superficies que **aclaran con la elevación** (el bottom sheet de resultados algo más claro que el fondo); fondo base gris muy oscuro, no negro puro.

## 32. Contraste en ambos modos y trampas del oscuro
**Doctrina.** **Halation:** el texto blanco puro sobre negro puro "vibra" y puede dejar *ghosting*, especialmente con astigmatismo (~30% de la población); usar texto **off-white** (#E0E0E0–#F5F5F5) sobre **casi-negro** (#121212–#1A1A1A). **Desaturar** los acentos ~10-20% en oscuro. Un color que pasa 4.5:1 en claro puede caer a 2.3:1 en oscuro (re-verificar). Fallo común: gris medio #6B7280 sobre #121212 falla 4.5:1.
**Recomendación:** texto off-white sobre #121212; **verificar el contraste de cada par sobre su superficie real**; azul primario desaturado y aclarado para oscuro; evitar bloques blancos puros dentro del layout oscuro.

## 33. Mapas en modo oscuro
**Doctrina.** Teselas oscuras para Leaflet/OSM: **CARTO Dark Matter** (requiere API key gratuita y atribución CARTO + OSM). Alternativa: mantener el mapa claro dentro de una UI oscura (lo hacen varias apps de referencia para no perder legibilidad de datos superpuestos).
**Recomendación:** decisión abierta para Antonio — coherencia visual (CARTO Dark Matter, con key y atribución) vs. simplicidad legal/operativa (OSM claro con overlay sutil). Verificar contraste de trazas y marcadores sobre la tesela elegida. ⚠️ Nota de casa: la paleta del teselado actual está MEDIDA (contraste.ts con sus jueces) — cualquier cambio de tesela re-mide.

## 34. Legibilidad de colores de terceros sobre claro y oscuro
**Doctrina.** Técnica de **contenedores neutros / badges con fondo propio**: el color de línea u operador se aloja en un contenedor con su propio fondo, manteniendo contraste independientemente del tema.
**Recomendación:** cada color de operador/línea dentro de un **badge con su propio fondo y texto ≥4.5:1**, igual en claro y oscuro; nunca color de línea como texto suelto sobre el fondo del tema.

## 35. Conmutación de tema
**Doctrina.** `prefers-color-scheme` detecta la preferencia del SO (MDN). Mejor práctica: tema claro **por defecto sin media query** (fallback), sobreescribir con `@media (prefers-color-scheme: dark)` **redefiniendo custom properties en `:root`**, y override manual con atributo `data-theme` persistido (localStorage) que gana sobre el media query.
**Recomendación:** **sistema por defecto + interruptor manual persistido**; toggle con `aria-label`; custom properties en `:root` (claro), `@media dark` (auto) y `[data-theme="dark"]` (override).

## 36. Logo y favicon claro/oscuro
**Doctrina.** Un favicon **SVG** puede responder a `prefers-color-scheme` mediante un `<style>` embebido con la media query (MDN).
**Recomendación:** favicon SVG con media query interna; versiones del logo para fondo claro y oscuro (evitando blanco puro en oscuro).

## 37. Tokens con pares claro/oscuro
**Doctrina.** Figma Variables admite **modos de variable** (claro/oscuro) sobre los mismos nombres de token; DTCG 2025.10 soporta theming sin duplicar archivos; exportable a CSS custom properties.
**Recomendación:** cada token semántico con valor en claro **y** oscuro bajo el **mismo nombre**; exportar a `:root` y `[data-theme="dark"]` + fallback `@media (prefers-color-scheme: dark)`.

---

# RESUMEN EJECUTIVO — DECISIONES CLAVE
1. **Color de marca: azul primario** (confianza + neutralidad entre operadores). Verde reservado a "andando/eco" y al éxito semántico; **evitar verde global** (colisión YeGo/bici pública).
2. **Escalas de 12 pasos** tipo Radix + **tokens semánticos DTCG**; conservar el ámbar de avisos existente (#b45309 / #fff4e5 / #7c3d00).
3. **Tipografía Inter** con `font-variant-numeric: tabular-nums` y `slashed-zero` para horas de paso y códigos.
4. **Iconos Material Symbols** (Apache 2.0, cobertura verificada de los 8 modos); **nunca emojis**; icono + texto siempre.
5. **Bottom sheet de 2 estados** en móvil y **separador de 2 posiciones** en escritorio; **sin scroll global** (`100dvh`/`100svh` con fallback, scroll interno por bloque; `safe-area-insets`).
6. **Accesibilidad AA** transversal (targets 44px, contraste 4.5:1, combobox APG, live regions, color nunca único canal, reflow 320px, zoom 200%).
7. **Estados honestos**: skeleton de tarjetas para 1–8 s, mensaje de progreso para modos lentos (>4 s), edad del dato relativa + absoluta, error states accionables y degradación por modo.
8. **Doble tema decidido a mano (no invertir)**: off-white sobre #121212, acentos desaturados, elevación por overlay tonal, badges neutros; **sistema + override persistido**.
9. **Figma Make como especificación + tokens DTCG, no código** (genera React/Tailwind; la app es Angular): extraer tokens y traducir a Angular a mano.
10. **Atribución OSM siempre visible**; **CARTO Dark Matter opcional** en oscuro (API key gratuita hasta 5M teselas/mes + atribución CARTO+OSM).

# PARA EL BRIEF DE FIGMA MAKE (esencial)
- **Producto y usuario.** App web de rutas multimodales de Zaragoza; usuarios que comparan 8 modos (andando, bici propia, patín/VMP, BiZi, bus/tranvía Avanza, coche, moto propia, YeGo). Valor diferencial: **honestidad del dato** en tiempo real. *(Describir el outcome, no solo la apariencia.)*
- **Layout (DECIDIDO por Antonio; indicar CÓMO ejecutarlo).** Responsive PC/tablet/móvil por contenido; 3 bloques (buscador, mapa, resultados); **móvil** en columna buscador→mapa→resultados con bloques abatibles (bottom sheet de 2 estados); **tablet/PC** dos columnas con **mapa a la derecha** y buscador+rutas a la izquierda, **separador de 2 posiciones** (abierto↔cerrado, sin arrastre) para mapa a pantalla completa; **sin scroll global** (`100dvh`, scroll interno por bloque, safe-areas); **modo claro y oscuro completos**.
- **Identidad.** Primario azul (hex exactos — el modelo no extrae color de imágenes); ámbar de avisos #b45309 / #fff4e5 / #7c3d00; **Inter** con números tabulares; iconografía estilo **Material Symbols**; mapear los 8 modos a sus iconos.
- **Accesibilidad (explícita en el prompt).** AA; targets ≥44px; contraste ≥4.5:1 (3:1 componentes/gráficos); focus visible; **ARIA combobox** en el autocompletado; **live regions** y `aria-busy`; color nunca como único canal.
- **Estados a diseñar.** Vacío, cargando (skeleton + mensaje de progreso para modos lentos), **error honesto por fuente** (las frases reales de la app), dato caducado, y la **edad del dato** (relativa + absoluta).
- **Entregables de input.** Capturas de los 3 breakpoints; textos reales; paleta con hex; lista modo→icono; requisitos de layout y accesibilidad.
- **Restricciones al modelo.** Pedir **separación de archivos**; dar **hex explícitos**; **no** incluir datos sensibles/API keys; el resultado se trata como **especificación visual + tokens DTCG**, no como código Angular final.

---

## Nota de fiabilidad de fuentes
Los umbrales de respuesta (0,1/1/10 s) y las heurísticas provienen de fuentes primarias de NN/g; los criterios WCAG, del W3C/WAI; los patrones de bottom sheet y elevación, de Material Design 3; las prácticas de prompting y variables, de la documentación oficial de Figma; la atribución, de OSMF y CARTO. Algunos datos de apoyo (cifras de conversión de skeletons, porcentajes de legibilidad en oscuro) proceden de fuentes secundarias y son orientativos, no doctrina verificada. Los **nombres exactos de iconos** en Lucide y Phosphor deben confirmarse en sus catálogos antes de fijar mapeos (los de Material Symbols sí se verificaron). La opción CARTO implica API key y límite de uso, a validar según el volumen del demo.
