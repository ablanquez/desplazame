# DISEÑO-DESPLAZAME · Documento anexo de diseño

**v1.4 · 18/09/2026** (v1.0 del 8/09; v1.1: ⭐ enmienda §20 — pestañas en móvil, 11/09; v1.2: ⭐ §38 — las cinco líneas, 14/09; v1.3: §35 ampliado — el mapa acompaña al tema, 15/09; v1.4: ⭐ §39 — el sistema de iconos, escrito por el ejecutor desde el censo del 17/09 y firmado verbatim el 18/09, con el gradN25 como pendiente-con-precio y las divergencias del §5 resueltas). Fruto de la investigación profunda del 8/09 (decenas de fuentes; doctrina primaria priorizada: W3C/WCAG 2.2, WAI-ARIA APG, Nielsen Norman Group, Material Design 3, documentación oficial de Figma, MDN, OSMF, CARTO, Radix). **Escritor único: la conversación de estrategia** (como PLAN y ESTADO). Este documento guía el punto 15 (estética) de Desplázame **y es reutilizable para futuros diseños de la casa**: las fuentes y los porqués importan tanto como las conclusiones. Las decisiones aquí propuestas son PROPUESTAS con doctrina hasta que Antonio las vale; lo ya decidido por Antonio (layout, bloques, separador de dos posiciones, sin scroll global, claro+oscuro) va marcado como DECIDIDO.

---

# Documento-guía de diseño · "Desplázame" — Rutas multimodales urbanas de Zaragoza

**Las tres decisiones más importantes que la doctrina sostiene: (1) color de marca azul —no verde, para no colisionar con YeGo—, (2) layout sin scroll global con `100dvh` y bottom sheet de dos estados en móvil [⭐ móvil ENMENDADO el 11/09 a PESTAÑAS — ver §20] / separador de dos posiciones en escritorio, y (3) usar Figma Make como especificación visual + tokens DTCG, no como código, porque genera React/Tailwind mientras la app es Angular.**

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
> ⭐ **La mitad móvil quedó ENMENDADA el 11/09** (redecisión de Antonio): pestañas con barra inferior — la letra entera, en la enmienda del §20. La doctrina M3 del sheet de arriba se conserva como referencia de la casa. El escritorio sigue vigente tal cual.

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

> **⭐ ENMIENDA (11/09/2026, REDECIDIDO por Antonio).** El bottom
> sheet se construyó (tanda 3 del calco, medidas [M3]) y Antonio,
> con la maqueta de Make y la app en producción lado a lado en
> móvil, REDECIDIÓ: **el móvil son LAS PESTAÑAS de la maqueta**
> — tres pantallas (Buscador · Ruta · Mapa) con barra de
> navegación inferior (h-64, iconos+etiqueta, safe-area con
> viewport-fit=cover [MDN]), el mapa SIEMPRE montado y tapado
> por opacidad/z (el patrón de App.tsx de la referencia), la
> fila de chips con scroll-x + snap y auto-centrado del elegido,
> y la coreografía generar→Ruta / limpiar→Buscador. El cuarto
> hueco de la barra («Tema», cycleTheme en el calco) entra
> cableado con la tanda del conmutador — un botón inerte viola
> los estados honestos. La hoja y sus medidas M3 quedan
> retiradas en móvil (sus juezas mordieron y se retiraron con
> acta). La atribución OSM en móvil vive en el control nativo de
> Leaflet dentro de la pestaña Mapa (política de teselas
> satisfecha: visible siempre que el mapa lo es) y el enlace
> «Créditos» al final del scroll del Buscador. El escritorio
> (§20 no le aplicaba) sigue con su acordeón y separador. La
> crónica de construcción, en la casilla 4 del PLAN.

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
**Recomendación:** dos paletas decididas a mano; en oscuro, superficies que **aclaran con la elevación** (las superficies elevadas —cabeceras, tarjetas, barra— algo más claras que el fondo; el ejemplo original decía «el bottom sheet», enmendado a pestañas en el §20); fondo base gris muy oscuro, no negro puro.

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
**El mapa acompaña al tema (ratificado con fuentes el 15/09, tras la duda de Antonio).** El basemap sigue la piel de la app: Google Maps trae Night Mode oficial y su app conmuta el mapa de noche contra el deslumbre; Mapbox Dark existe «para interfaces night-mode»; MapTiler manda cambiar la variante «para adecuarse a la piel de tu app, que no deslumbre»; ArcGIS trae Navigation Night; CARTO Dark Matter nació para datos legibles sobre fondo apagado. El mapa claro bajo tema oscuro es el anti-patrón («una tele brillante en una habitación a oscuras») — medido en casa: luminancia 0,705 contra 0,013 de la tarjeta. Ejecutado en la tanda 6 · parte 2: Dark Matter con key en oscuro, la capa atada a `data-theme`, atribución por capa.
**Recomendación:** **sistema por defecto + interruptor manual persistido**; toggle con `aria-label`; custom properties en `:root` (claro), `@media dark` (auto) y `[data-theme="dark"]` (override).

## 36. Logo y favicon claro/oscuro
**Doctrina.** Un favicon **SVG** puede responder a `prefers-color-scheme` mediante un `<style>` embebido con la media query (MDN).
**Recomendación:** favicon SVG con media query interna; versiones del logo para fondo claro y oscuro (evitando blanco puro en oscuro).

## 37. Tokens con pares claro/oscuro
**Doctrina.** Figma Variables admite **modos de variable** (claro/oscuro) sobre los mismos nombres de token; DTCG 2025.10 soporta theming sin duplicar archivos; exportable a CSS custom properties.
**Recomendación:** cada token semántico con valor en claro **y** oscuro bajo el **mismo nombre**; exportar a `:root` y `[data-theme="dark"]` + fallback `@media (prefers-color-scheme: dark)`.

## 38. ⭐ Los pasos con acción viva: CINCO líneas (DECIDIDO por Antonio, 14/09; ejecutado en `2f51ce6`)
**La espec, dictada con capturas delante.** Todo paso con acción viva (bus: sube · transborda; BiZi: coge · deja; tranvía: sin botón) se pinta en cinco líneas fijas, una plantilla común:
- **L1** — chip(s) de línea + acción. La marca «⚠ desviada»/«festivo» pegada al chip de **su** línea (GTFS-RT `informed_entity` con `route_id` afecta a esa ruta; ley de casa nº22). El transbordo: un paso con **dos** chips (GTFS `transfers.txt`, firmado 31/08), separados **en el texto** (`&ngsp;` — ley de la nº52).
- **L2** — la ficha de contorno del poste/estación (§ fase C) + el nombre del lugar.
- **L3** — los datos estáticos, **solo de campos del contrato**, nunca de leer la frase: bus «N paradas · cada M min» (num_stops/headway son campos del paso en los planificadores de referencia — transit_details de Google Directions); BiZi «N bicis/anclajes a las HH:MM» (GBFS). Sin campo, sin L3.
- **L4** — el botón vivo + su región `role=status`.
- **L5** — **la región misma**, vestida de advertencia cuando su contenido es un no-pude-leer: una voz por dato, la del **último intento** (NN/g: el error visible mientras el error existe; heurística #1; precedente nº37). Solo `mudo` viste de advertencia; `ausente` se dice como dato (GTFS-RT).
**Doctrina del layout:** el solape/apretujón es fallo WCAG 1.4.12/F104 (el bloque que no crece con el contenido); receta: líneas propias que crecen en vertical. Material 3: fuera del list item de 1/2/3 líneas se construye el item propio, un rol de contenido por línea. Vara del aire entre cajas vecinas del paso: **4,3 px** (precedente nº52). La batería de anchos incluye 1920×1080/DPR 1/zoom 100 (la pantalla real de Antonio: 32", ~69 PPI — donde 1 px de aire es visualmente cero).

## 39. ⭐ El sistema de iconos (firmado el 18/09/2026, desde el censo del 17/09)

> Escrito desde el censo del 17/09 y rematado el 18/09, no desde la memoria.
> Todas las cifras salen de contar el directorio y de medir lo pintado en
> Chrome. **El §39 registra LO CONSTRUIDO**: lo que aquí no está, no existe.

**Doctrina.** [Material Symbols, doc oficial de Google/M3] la familia tiene
**cuatro ejes** —relleno (`FILL`), peso (`wght`), grado (`GRAD`) y tamaño óptico
(`opsz`)—. Los iconos de sistema van a **24 dp**, y a **20 dp** en escritorio
denso. **Solo las instancias de 20 y 24 están alineadas a la retícula**: para
cualquier otro tamaño se usa el eje óptico, **no el escalado a pelo**. A 24 dp el
peso mínimo legible es **200** (los extremos del eje están desaconsejados), se
usa **un solo peso por tema de interfaz**, emparejado con el peso del texto, y el
**grado** ajusta el grosor sin cambiar el tamaño —lo que Material recomienda
sobre fondos oscuros—. Verificado contra el repositorio el 17/09: de `route` hay
**168 ficheros** en `materialsymbolsoutlined`, con `opsz` en 20/24/40/48, `wght`
de 100 a 700, `GRAD` en N25/0/200 y `FILL` en 0/1.

[W3C · WAI Images Tutorial, árbol de decisión] un icono es **funcional** cuando
está dentro de un botón o enlace —y entonces su nombre accesible dice **la
acción**, no el dibujo: «imprimir esta página», nunca «impresora»—;
**informativo** cuando aporta información que el texto no da; y **decorativo**
cuando viaja al lado de un texto que ya dice lo mismo —y entonces se oculta, o
mejor se pinta desde CSS—. Y su consejo responsive: si la etiqueta de texto cae
en pantallas estrechas, el icono debe seguir entendiéndose y conservar su
descripción.

### 39.1 · La familia, y sus CUATRO catálogos

El §5 firma **Material Symbols como set único**. Eso vale para **la interfaz**, y
el censo encontró que la app tiene de hecho **cuatro catálogos**, tres de ellos
legítimos y uno ajeno:

| | Qué es | Cuántos | Dónde vive | Licencia |
|---|---|---|---|---|
| **A** | Material Symbols *outlined* | **30 símbolos en 31 ficheros** | `app/simbolos/` + tabla en `simbolos.ts` | Apache 2.0 |
| **B** | Las formas de **capa** (qué clase de sitio es un extremo) | **8 formas** | `iconos.ts`, dibujadas a mano | propias / calcadas |
| **C** | Lo que pinta **Leaflet solo** | 1 banderita + su lienzo | dentro de Leaflet | BSD-2-Clause |
| **D** | **La marca** — el símbolo de Desplázame | 1 símbolo en 4 ficheros | `app/marca/` | **obra propia** |

**El catálogo B es una excepción declarada, no un descuido.** Seis de sus ocho
formas calcan una convención que ya existe —la chincheta de los mapas, la cruz
verde de farmacia, la señal **S-23** del hospital, el libro de osm-carto, el
lápiz de `school` y el birrete de `college` de Maki— y **dos están firmadas como
PROPIAS** porque la doctrina no daba ninguna: el chupete de la guardería y la
cruz azul del centro de salud (la roja es emblema protegido por los Convenios de
Ginebra; la verde ya es la farmacia). Material no cubre esa taxonomía, y el
porqué entero está en la cabecera de `iconos.ts`.

**La marca es el catálogo D y NO entra en `app/simbolos/`** (18/09): el §5 firma
Material Symbols como familia única **para la interfaz**, y un logotipo no se
toma prestado de una familia de iconos de sistema —no dice «esto hace tal cosa»,
dice «esto es Desplázame»—. Mezclarlos habría roto el censo de `app/simbolos/`
contra el repositorio de Google, que es lo que le da valor. Es **obra propia**:
no necesita ficha en el NOTICES, que es el inventario de lo ajeno.

**Regla propuesta:** Material Symbols para **todo lo que sea acción, modo,
maniobra o control**. El catálogo B se congela: **no crece** sin que la clase
nueva se busque antes en osm-carto, Maki y Temaki y se declare el hueco.

### 39.2 · Ejes y tamaños — **FIRME desde el 18/09**

**La regla, en cuatro líneas:**

1. **Un solo peso en toda la app**: `wght400 · GRAD0 · FILL0`. Lo que cambia
   entre ficheros es **solo el eje óptico**, y lo dice el sufijo del nombre.
2. **Los tamaños de sistema son 20 y 24.** Fuera de ellos manda el eje óptico:
   **la instancia igual o la inmediatamente menor** (`trazadoPara`).
3. **Por debajo de 20 px el suelo es `opsz20`**, porque el eje no baja más.
4. **El catálogo guarda de cada símbolo la instancia que de verdad se pinta**, no
   una de referencia y luego un escalado. El nombre del fichero lo dice.

**Aplicado el 18/09.** El censo contó a qué tamaño se pinta cada símbolo y el
catálogo se puso en consecuencia:

| se pinta a | cuántos | guarda |
|---|---|---|
| 14, 16, 18 y 20 px | **24** | `opsz20` |
| 24 px | 5 | la de por defecto, sin sufijo |
| 48 px | 1 (`cloud_off`) | `opsz48` |
| **24 y 48 a la vez** | 1 (`route`) | las dos — el único que necesita dos |

**31 ficheros para 30 símbolos.** Precio del barrido, medido antes de hacerlo:
**+492 caracteres de trazado (≈ 0,48 kB)**, de 5.930 a 6.422.

**Y no son el mismo dibujo a otra escala**, que es la razón de todo esto: el
trazado de `route` mide 594 caracteres a 24 y 741 a 48; el de `directions_bus`,
856 a 24 y 643 a 20.

> **⛔ EL GRADO EN OSCURO — MEDIDO Y NO APLICADO (18/09).**
>
> La regla oficial es explícita: **el grado por defecto de un icono claro sobre
> fondo oscuro es −25**; el de un icono oscuro sobre claro, 0. En tema oscuro
> **todos** nuestros iconos son claros sobre oscuro, así que la regla pide
> `gradN25` para todos.
>
> **Se midió antes de tocar nada, y por eso no se tocó:**
>
> | | ficheros | trazado en bruto | transferido (gzip) |
> |---|---|---|---|
> | el barrido a `opsz20` | 24 | +492 car · **+0,48 kB** | ~+0,2 kB |
> | el `gradN25` | **31 más** | +12.519 car · **+12,23 kB** | **+5,26 kB** |
>
> **Veinticinco veces el precio del opsz20**, sobre un paquete que ya va 33 kB
> por encima de su aviso — y sin contar el mecanismo: `trazadoPara` tendría que
> ganar una dimensión de tema, y con ella los tres sitios que pintan (el
> componente, `svgDeCapa` y el hito del plano). Queda **declarado y a la cola**,
> con la comparación pintada para que se decida mirándola.
>
> ⚠️ Y el `wght` **no se toca**: «un peso consistente por tema de UI» sigue en
> pie. El §3 subió el TEXTO de 400 a 500 en oscuro por su propia fuente firmada;
> el icono tiene la suya, y la suya dice grado, no peso. **Cada pieza con su
> fuente.**

### 39.3 · El mapa acción → icono

**Los seis modos** (chips de «Cómo»), cada uno con su etiqueta de texto [§5]:

| Modo | Icono | §5 proponía |
|---|---|---|
| Andando | `directions_walk` | igual |
| Bus / Tranvía | `directions_bus` | `directions_bus`/`tram` — **`tram` no se usa**: una sola familia para los dos, y el texto los nombra |
| Bici | `pedal_bike` | igual |
| Patín (VMP) | `electric_scooter` | igual |
| Moto | `two_wheeler` | igual |
| Coche | `directions_car` | igual |

**Las dos submodalidades no tienen icono propio, y diverge del §5:** BiZi vive
dentro de Bici y YeGo dentro de Moto, en la segunda fila, que es un grupo de
radios **con etiqueta de texto** («Privada» / «Pública BiZi»). El §5 proponía
`directions_bike` para BiZi y un `two_wheeler` «diferenciado por color/badge»
para YeGo; ninguno de los dos se ha construido, y **`directions_bike` no está en
el catálogo**. **RESUELTO ASÍ (18/09): el §39 registra lo construido, y los tres mapeos del §5
que no han nacido quedan como *manda-cuando-haya-necesidad*.** Es el precedente
de casa —se crece cuando algo lo pide—, y aquí nada lo pide: la segunda fila
distingue **por texto**, y el propio §5 exige etiqueta de texto en cada modo.
Donde el texto ya distingue, un segundo dibujo añade ruido, no información.
`directions_bike` y `tram` **no se bajan** hasta que haga falta.

**Las quince maniobras del contrato** (`Record<Giro, …>` exhaustivo — el compilador
no deja que falte ninguna):

`salida` → `trip_origin` · `recto` → `straight` · `ligera-derecha` →
`turn_slight_right` · `derecha` → `turn_right` · `cerrada-derecha` →
`turn_sharp_right` · `media-vuelta` → `u_turn_left` · `cerrada-izquierda` →
`turn_sharp_left` · `izquierda` → `turn_left` · `ligera-izquierda` →
`turn_slight_left` · `coge` → `pedal_bike` · `aparca` → `local_parking` · `sube`
→ `directions_bus` · `baja` → `directions_walk` · `transborda` →
`transfer_within_a_station` · `llegada` → `flag`

⚠️ **«Deja» no es un hueco: es `aparca`.** El contrato lo dice con todas las
letras —*«Se deja: la bici propia en el aparcabicis, la BiZi en su anclaje»*—, y
por eso «Deja la bici» y «Aparca» comparten la P del aparcamiento.
⚠️ `u_turn_left` sirve para las dos manos: el set oficial solo trae la izquierda
y el contrato no distingue lado en la media vuelta.
⚠️ Tres maniobras **reusan** iconos de modo (`coge`, `sube`, `baja`): no se baja
un dibujo que ya se tiene.

**Los cuatro hitos del plano** repiten los de la lista, y eso es la regla: quien
lee «Sube a la 39» busca **ese mismo dibujo** sobre el mapa. Hay jueza que
compara las dos tablas.

**Los controles y estados de la interfaz:**

| Acción / estado | Icono | Tamaño |
|---|---|---|
| Pestaña Buscador · Ruta · Mapa | `search` · `route` · `map` | 24 |
| Modo oscuro (interruptor) | `light_mode` / `dark_mode` | 24 |
| Mi ubicación | `my_location` | 20 |
| Invertir origen y destino | `swap_vert` | 20 |
| Esperando a la DGT | `hourglass_empty` | 16 |
| Aviso | `warning` | 16 · 14 |
| Seguir / volver | `arrow_forward` · `arrow_back` | 16 |
| Vacío del resultado | `route` | **48 (`opsz48`)** |
| Error del resultado | `cloud_off` | **48 (`opsz48`)** |

**Las ocho clases de sitio** (catálogo B): `via` → chincheta · `farmacia` → cruz
verde · `centro-salud` → cruz azul · `hospital` → cuadrado con H · `biblioteca` →
libro · `colegio` → lápiz y manzana · `guarderia` → chupete · `universidad` →
birrete. El color dice la **familia** y la forma dice **qué es**: cuatro colores
para ocho formas, a propósito.

**Huecos declarados (NO CONSTA):** ninguna acción del producto se queda sin
icono. Los dos únicos candidatos que el §5 nombraba y no existen en el catálogo
son **`directions_bike`** (BiZi) y **`tram`** (tranvía), y los dos están sin bajar
a propósito, no por olvido — ver arriba. **No se dibuja nada propio para
sustituirlos.**

### 39.4 · El triaje del W3C, por icono

**En esta app, todos los iconos son DECORATIVOS**, y no por comodidad: el §5
manda que **cada icono lleve su etiqueta de texto al lado**, así que el nombre
siempre lo pone el texto o el `aria-label` del control, y el dibujo se oculta
para no decirlo dos veces.

**Regla propuesta:**

- **Funcional** (dentro de un botón o enlace): el icono va `aria-hidden` y **el
  control lleva el nombre de la ACCIÓN**. Ejemplo vivo: el interruptor de tema
  —`aria-label="Modo oscuro"`, estado por `aria-checked`, y el icono callado—.
- **Informativo**: hoy **no hay ninguno**. Si aparece, lleva `<title>` y se
  declara aquí.
- **Decorativo**: `aria-hidden="true"` y `focusable="false"`. Es el caso de los
  ciento y pico iconos de la app.

**Medido sobre lo pintado el 17/09**, con una ruta de bus en pantalla: **26 `<svg>`
visibles · 25 decorativos y ocultos · 1 suelto**, y el suelto es el lienzo
vectorial de Leaflet —no es un icono y no es nuestro—. Quién los oculta:
`svg.simbolo` ×15 (el componente), `svg.icono-capa` ×4, dos `<svg>` sin clase
—los marcadores que `svgDeCapa` compone para Leaflet—, `span.hito` ×3 y la
banderita de la atribución ×1.

⚠️ **Y la primera medición de esto estuvo MAL, en el lado que asusta.** La sonda
miraba el `aria-hidden` del propio `<svg>` y daba **nueve** iconos «sin nombre y
sin ocultar»; `aria-hidden` en un **ancestro** también oculta, y los marcadores
de hito lo llevan en el `<span>` que los envuelve. Corregida la sonda, quedan
cero. Lo que se mide es el árbol, no el atributo.

⚠️ **Y el consejo responsive del W3C ya está cubierto**: en la barra de móvil el
icono y su etiqueta viajan juntos y la etiqueta no se cae en ningún ancho —lo
vigila `esqueleto.mjs`—; en los chips de modo la etiqueta se encoge pero no
desaparece.

### 39.5 · Quién lo vigila

`sistema-de-iconos.spec.ts`, que cuenta el directorio y no una lista escrita a
mano: el catálogo cuadra en las dos direcciones, cada fichero tiene su sha256 en
`PROCEDENCIA.md`, **el sufijo de cada símbolo casa con el fichero que hay en
disco**, ningún símbolo queda huérfano, **solo CUATRO ficheros pueden
escribir un `<svg>`** —el cuarto es `marca.ts`, y entró declarado porque la
jueza se puso roja al verlo— —`simbolos.ts`, `iconos.ts` y `mapa.ts`, los dos últimos
porque Leaflet quiere HTML en crudo—, ninguno copia un trazado a pelo, los quince
giros y los cuatro hitos están dentro del catálogo, y **el censo de tamaños va
clavado con su cifra** para que la deuda del eje óptico no crezca callada.

### 39.6 · La marca (18/09)

El **candidato B**, elegido por Antonio con las tres tallas y los dos temas
delante: la gota sobre la traza, rejilla 32, trazo 4 —2 px reales a 16—, y el
hueco como **calado de verdad** (`fill-rule="evenodd"`), no un disco del color
del fondo. Cuatro ficheros en `app/marca/`: `simbolo.svg` (reducido),
`completo.svg`, `favicon.svg` y `app-icon.svg`.

⚠️ **El favicon sigue al SISTEMA, no al conmutador**, y no es un fallo: se pinta
en la pestaña, **fuera del documento**, así que no hereda el `data-theme`. Lo
único que puede leer es `prefers-color-scheme` desde un `<style>` embebido
[§36 · MDN], y es lo que lee. Declarado en vez de fingido.

⚠️ **El `app-icon` se produce y NO se cablea**: hoy no hay
`manifest.webmanifest`. Va a la cola, con jueza que fija el estado para que
cablearlo sea una decisión y no un descuido.

---

# RESUMEN EJECUTIVO — DECISIONES CLAVE
1. **Color de marca: azul primario** (confianza + neutralidad entre operadores). Verde reservado a "andando/eco" y al éxito semántico; **evitar verde global** (colisión YeGo/bici pública).
2. **Escalas de 12 pasos** tipo Radix + **tokens semánticos DTCG**; conservar el ámbar de avisos existente (#b45309 / #fff4e5 / #7c3d00).
3. **Tipografía Inter** con `font-variant-numeric: tabular-nums` y `slashed-zero` para horas de paso y códigos.
4. **Iconos Material Symbols** (Apache 2.0, cobertura verificada de los 8 modos); **nunca emojis**; icono + texto siempre.
5. **Bottom sheet de 2 estados** en móvil [⭐ ENMENDADO el 11/09: PESTAÑAS con barra inferior — §20] y **separador de 2 posiciones** en escritorio; **sin scroll global** (`100dvh`/`100svh` con fallback, scroll interno por bloque; `safe-area-insets`).
6. **Accesibilidad AA** transversal (targets 44px, contraste 4.5:1, combobox APG, live regions, color nunca único canal, reflow 320px, zoom 200%).
7. **Estados honestos**: skeleton de tarjetas para 1–8 s, mensaje de progreso para modos lentos (>4 s), edad del dato relativa + absoluta, error states accionables y degradación por modo.
8. **Doble tema decidido a mano (no invertir)**: off-white sobre #121212, acentos desaturados, elevación por overlay tonal, badges neutros; **sistema + override persistido**.
9. **Figma Make como especificación + tokens DTCG, no código** (genera React/Tailwind; la app es Angular): extraer tokens y traducir a Angular a mano.
10. **Atribución OSM siempre visible**; **CARTO Dark Matter opcional** en oscuro (API key gratuita hasta 5M teselas/mes + atribución CARTO+OSM).

# PARA EL BRIEF DE FIGMA MAKE (esencial)
- **Producto y usuario.** App web de rutas multimodales de Zaragoza; usuarios que comparan 8 modos (andando, bici propia, patín/VMP, BiZi, bus/tranvía Avanza, coche, moto propia, YeGo). Valor diferencial: **honestidad del dato** en tiempo real. *(Describir el outcome, no solo la apariencia.)*
- **Layout (DECIDIDO por Antonio; indicar CÓMO ejecutarlo).** *[Sección histórica: alimentó el brief del 8/09 tal cual; el móvil quedó después enmendado a pestañas — §20.]* Responsive PC/tablet/móvil por contenido; 3 bloques (buscador, mapa, resultados); **móvil** en columna buscador→mapa→resultados con bloques abatibles (bottom sheet de 2 estados); **tablet/PC** dos columnas con **mapa a la derecha** y buscador+rutas a la izquierda, **separador de 2 posiciones** (abierto↔cerrado, sin arrastre) para mapa a pantalla completa; **sin scroll global** (`100dvh`, scroll interno por bloque, safe-areas); **modo claro y oscuro completos**.
- **Identidad.** Primario azul (hex exactos — el modelo no extrae color de imágenes); ámbar de avisos #b45309 / #fff4e5 / #7c3d00; **Inter** con números tabulares; iconografía estilo **Material Symbols**; mapear los 8 modos a sus iconos.
- **Accesibilidad (explícita en el prompt).** AA; targets ≥44px; contraste ≥4.5:1 (3:1 componentes/gráficos); focus visible; **ARIA combobox** en el autocompletado; **live regions** y `aria-busy`; color nunca como único canal.
- **Estados a diseñar.** Vacío, cargando (skeleton + mensaje de progreso para modos lentos), **error honesto por fuente** (las frases reales de la app), dato caducado, y la **edad del dato** (relativa + absoluta).
- **Entregables de input.** Capturas de los 3 breakpoints; textos reales; paleta con hex; lista modo→icono; requisitos de layout y accesibilidad.
- **Restricciones al modelo.** Pedir **separación de archivos**; dar **hex explícitos**; **no** incluir datos sensibles/API keys; el resultado se trata como **especificación visual + tokens DTCG**, no como código Angular final.

---

## Nota de fiabilidad de fuentes
Los umbrales de respuesta (0,1/1/10 s) y las heurísticas provienen de fuentes primarias de NN/g; los criterios WCAG, del W3C/WAI; los patrones de bottom sheet y elevación, de Material Design 3; las prácticas de prompting y variables, de la documentación oficial de Figma; la atribución, de OSMF y CARTO. Algunos datos de apoyo (cifras de conversión de skeletons, porcentajes de legibilidad en oscuro) proceden de fuentes secundarias y son orientativos, no doctrina verificada. Los **nombres exactos de iconos** en Lucide y Phosphor deben confirmarse en sus catálogos antes de fijar mapeos (los de Material Symbols sí se verificaron). La opción CARTO implica API key y límite de uso, a validar según el volumen del demo.
