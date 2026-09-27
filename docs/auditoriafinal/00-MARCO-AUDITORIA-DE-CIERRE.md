# AUDITORÍA DE CIERRE — 004 Desplázame · EL MARCO

> **Qué es este documento:** el marco que gobierna la Fase 7 de Desplázame (la auditoría de
> cierre y el reposo). Es TRASLADO de la Parte 4 de GUIA-BUENAS-PRACTICAS.md (el método
> estrenado y verificado en ZetaBus), instanciado sobre esta casa. **No se sale de aquí**: si
> durante la auditoría aparece algo que este marco no cubre, se PARA y se parlamenta con
> Antonio — no se improvisa método.
>
> **Qué NO es:** una auditoría de fase o de tanda (aquéllas miran un cambio concreto); ésta
> barre el proyecto ENTERO cuando ya funciona. El PLAN está completo (16 puntos, 183/183
> casillas, f07614a) — esta es la fase que separa «funciona» de «está cerrado».

---

## 1 · LAS TRES REGLAS QUE GOBIERNAN (de la guía, literales)

**R1 · SOLO LECTURA. El diagnóstico se separa de la ejecución.**
La auditoría no arregla nada: produce un mapa de hallazgos priorizado; los arreglos vienen
después, en tandas, **decidiendo Antonio qué entra**. La única escritura permitida es el
propio informe. *(Si se manda «arréglalo» sin auditoría previa, el ejecutor arreglará lo que
él crea que está mal.)*

**R2 · ⭐⭐ LA AUDITORÍA TAMBIÉN PUEDE MENTIR — declara tu cobertura.**
Todo informe empieza declarando: cuántas piezas hay en total · cuántas se revisaron ·
**cuáles NO y por qué**. Donde no haya certeza: **NO CONSTA**. Un «todo correcto» sin decir
qué se miró no dice nada.

**R3 · POR BLOQUES, no de una pasada.**
Cada bloque va a fondo, por separado; lo que encuentra uno afina el siguiente.

**Y las normas de esta casa siguen vigentes durante toda la fase:** Regla Cero (doctrina antes
de cada encargo — aquí la doctrina ES este marco) · el régimen del peaje (las tandas de
arreglo corren lo proporcional; la batería entera, al push del lote) · bitácora ante verde
mentiroso · cambio visible = decisión explícita de Antonio.

---

## 2 · EL ORDEN (verificado en la práctica de ZetaBus)

**A código → C tests → B interfaz → E operación → F experiencia → D documentación.**

F y D van al final A PROPÓSITO: las tandas de arreglo cambian lo que el usuario ve (F) y lo
que los documentos afirman (D) — auditarlos antes sería mirar algo que va a cambiar. D el
último de todos: contrasta contra el estado final de TODO lo demás.

| Bloque | Qué audita | Pregunta | Instrumento principal |
|---|---|---|---|
| **A** | Código | ¿Está limpio, vivo y coherente? | grep sistemático + lectura dirigida |
| **C** | Tests y guardianes | ¿Prueban lo que dicen probar? | **MUTACIÓN** |
| **B** | Interfaz y textos | ¿Se entiende, se ve y dice la verdad? | **ABRIR las páginas** + validador |
| **E** | Operación y datos | ¿Se ejecuta y despliega sin sorpresas? | **simular el clon limpio** |
| **F** | Experiencia completa | ¿Un usuario nuevo se apaña? | **USAR el producto** + lista de sesgos |
| **D** | Documentación | ¿Los documentos dicen lo que el código hace? | **CONTRASTAR afirmaciones** |

**El ciclo completo de la fase:** los 6 informes → las tandas de arreglo (decide Antonio
sobre los mapas) → **la séptima pieza** (la verificación del auditor) → el cierre (push +
tag + release + CHANGELOG + badge) → los escáneres externos con evidencia versionada → el
reposo con la memoria escrita.

---

## 3 · EL PUNTO DE PARTIDA DE DESPLÁZAME (los hechos, de los papeles)

- **Commit de arranque de la auditoría:** el vigente al abrir cada bloque (se fija en la
  cabecera de su informe). Producción hoy: `f07614a`.
- **La casa:** app Angular (interfaz, 775 de unidad, 25 ficheros) + motor Node (662, 82
  suites) + `@desplazame/tipos` (305+382 ficheros en el censo de tipos) · las DIEZ suites
  e2e con arnés propio (esqueleto 69 · identidad 136 · pintura 1.229 [+P35] · créditos 33 ·
  dos-filas 21 · moto 20 · yego 30 · pantalla 9 · próximo-bus 15 · bizi-y-resumen 18) ·
  guardián de build (`construir`/`comprobar-dist`) · cron de datos (`mantener-datos`, 54
  conjuntos, schtasks con recuperación) · la intranet solo-local (visor + panel,
  `fileReplacements`, jueza no-viaja) · presupuesto: initial 548,68 kB / 142,33 transferido,
  rayas 560/1077 y 6/12, build sin avisos.
- **Producción:** desplazame.antonioblanquez.es (Hostinger, auto-deploy en push).
- **Vigilancias vivas que la auditoría hereda (no las re-descubre: las CONOCE):** la L9
  intermitente [rojo armado falta/sobra] · la cuarentena del perfil 9790 [imborrable,
  censada] · los dos PAROs del RGC [arcén-izquierdo · Título VI↔Ordenanza — declarados en
  código] · los 3 ⊘ de yego [censados por motivo] · la huella grafo-visor [NO CONSTA] · la
  mesa y colas del ESTADO (deuda declarada — el bloque que la toque la contrasta, no la
  duplica).

---

## 4 · LOS SEIS CHECKLISTS (de la guía, completos)

### BLOQUE A · CÓDIGO

**Entra:** todo el código ejecutable (fuente de app y motor, scripts, configuración con
lógica, declaración de dependencias). **No entra:** tests (C), textos/HTML de usuario (B),
documentación (D), logs y variables de entorno (E) — **se declara, no se omite en silencio**.

- **Código muerto, en cinco formas:** cruzar CADA export no trivial contra búsqueda real
  [cuatro clases: producción · solo-tests · solo-build · huérfano] · ⭐ «declarado y nunca
  cableado» [constantes, flags, opciones ignoradas, tipos por adelantado sin consumidor] ·
  inalcanzable · ficheros huérfanos · dependencias declaradas-no-usadas **y usadas-sin-
  declarar** [transitivas: el peor caso] · descartar convenciones del framework antes de
  declarar muerto [uso dinámico posible → NO CONSTA] · un huérfano puede ser evidencia
  conservada y un módulo muerto un CABO documentado [decisión de producto, no descuido].
- **La copia a mano (fuente única):** todo valor que aparezca dos veces sale de UNA
  constante [buscar la copia reteclada junto a un import que ya trae la buena] · un test de
  «este valor es UNO» solo vale si ata TODAS las copias · la duplicación DELIBERADA con nota
  cruzada se reporta como «no es defecto».
- **Tipos que no mienten:** cero `any` ni supresiones sin justificar · ⭐ datos de TERCEROS
  validados en runtime con guardas, nunca `as` y a consumir · incertidumbre en el tipo, no
  con opcionales que siempre están · aserciones sobre dato PROPIO reportadas con su
  mitigación.
- **Fallo cerrado:** ante fallo, estado honesto — cazar cada `?? 0`, `|| []`, `?? ''`
  [¿vacío de verdad o fallo enmascarado?] · `catch` que no relanza ni degrada = sospechoso ·
  promesas sin flotantes · el sobre agregado que sale `ok` con todo caído = latente.
- **Fechas/zonas:** un solo sitio resuelve el día civil; prohibido
  `toISOString().slice(0,10)` como «hoy»; la incoherencia entre ficheros es la señal ·
  edades con reloj monótono · casos de borde con test [medianoche, DST, fin de año,
  bisiesto].
- **Seguridad estructural:** cada inyección de HTML inventariada con su escape · entradas
  validadas en frontera, el valor absurdo cae cerrado SIN preguntar a la fuente · cero
  secretos en fuente; nada de servidor al bundle.
- **Estructura (con contrapeso) y rendimiento:** lo repetido sin extraer — **y dónde agrupar
  sería PEOR** [componentes grandes pero cohesivos se dejan] · N+1, imports que arrastran
  librerías, trabajo repetido por render.
- **Meta:** cobertura declarada (R2) · los barridos automáticos cruzados A MANO · y se
  entrega **«lo que está bien y por qué merece repetirse»**.

### BLOQUE C · TESTS Y GUARDIANES

**La regla:** ⭐⭐⭐ *un test verde no prueba nada por estar verde.* Se audita **ROMPIENDO**
(mutación), no solo leyendo. Las mutaciones se restauran (árbol limpio verificado).

- **La prueba de un test es su rojo:** mutar los de garantía crítica [romper lo protegido,
  exigir el rojo, restaurar] con veredicto **CAZADO · ESCAPADO · NO PROBADA** · los leídos
  sin mutar → NO CONSTA explícito («no se ha visto su rojo») · mejor aún: contraprueba
  incorporada.
- **Tests que no prueban nada:** logs sin aserción · barridos que escriben JSON que nadie
  agrega · topes `≤` que cumple el vacío · asserts dentro de `if` sin guarda ·
  `expect(true)` · `expect(CONSTANTE)` en vez del cableado.
- **Guardianes:** ⭐ ¿la fuente única ata TODAS las copias o compara resultados? [mutarlo con
  una copia CORRECTA, no solo divergente] · ¿cumple la promesa de su cabecera? [mutarlo] ·
  ¿cada comentario que cita un test apunta a uno que EXISTE y comprueba ESO? · ¿contra qué
  CONJUNTO comprueba? ¿sanity anti-vacío? ¿límites declarados? · los de grep de fuente se
  reportan como «protegen la forma, no el comportamiento».
- **Dependencia de entorno:** ⭐ artefactos/red/hora a nivel de módulo → skipIf a la vista o
  aislamiento [un skipped honesto > un rojo por entorno > un verde prestado] · e2e contra
  tercero real cuando un doble daría el mismo verde = flake sin probar de más · candados
  sobre dato real exacto = falso rojo en cada actualización.
- **Config de test:** ¿qué corre por defecto? ¿hay tests que no ejecuta nadie? ¿reintentos o
  timeouts ocultan un build viejo?
- **En esta casa, además:** las murallas de modos [sha], las juezas del canon del 5b, la
  jueza-censo de ⊘, la de perfiles/cuarentena, la del no-viaja, los relojes con m.esperar
  [las otras SIETE suites duermen: la cola lo declara — el bloque lo contrasta] — todos
  candidatos naturales a mutación.
- **Y lo que está bien, para repetir:** la contraprueba incorporada · sanity anti-vacío ·
  fallo cerrado probado · el instrumento que se prueba a sí mismo · declarar el techo.

### BLOQUE B · INTERFAZ Y TEXTOS

**Método:** las páginas se **ABREN** a los anchos reales y se **MIRAN** (no se lee la
plantilla); el marcado se sirve y se valida; el píxel se mide en el navegador. Se declara
**contra qué se validó** y por qué equivale a producción.

- **Cobertura:** TODAS las plantillas de página, no una · **las páginas «internas»
  alcanzables cuentan como superficie pública y se auditan** [robots es una petición, no una
  valla] — [en esta casa: la portada/Buscador con sus tres pestañas móviles, /identidad,
  /creditos; la intranet /visor y /panel NO viaja a producción — se audita en local como
  herramienta interna y se declara así] · a los
  anchos que el proyecto declara + el suelo de reflow 320 · lo no provocado → NO CONSTA ·
  verificar la premisa del encargo antes de obedecerla.
- **Estados (el bloque dentro del bloque):** para cada pantalla: vacío / error / cargando /
  degradado / rancio — provocados con el fingimiento del proyecto · ¿«no hay nada» ≠ «no lo
  sé»? · mensajes sin jerga ni URLs internas · la pantalla de error de último recurso TIENE
  que poder abrirse [si no hay forma de dispararla → NO CONSTA y ese hecho ES el hallazgo].
- **Texto:** glosario [un concepto, un nombre] · `<title>` Y `<meta description>` propios
  por página · ningún rótulo afirma un tiempo que el dato no respalda.
- **Accesibilidad que un escáner no ve:** aria-label solo en roles que admiten nombre ·
  zonas táctiles contra el listón elegido A PROPÓSITO [aquí: la vara-casa 44 con sus actas] ·
  reflow 320 sin scroll horizontal · nada truncado · prefers-reduced-motion · foco visible ·
  role=status para cambios automáticos · contenido crítico SIN JS, página a página.
- **HTML estándar:** validador oficial en todas las plantillas · un h1 visible por página ·
  jerarquía sin saltos · landmarks reales · y verificar lo DESCARTADO [lo que parece errata
  puede ser fórmula legal obligatoria — en esta casa: la atribución ODbL, el RD 1495/2011,
  las citas del RGC].

### BLOQUE E · OPERACIÓN Y DATOS

**La regla:** *el entorno de trabajo miente.* Se audita **simulando el clon limpio** — y se
declara qué se EJECUTÓ, qué se simuló (y cómo) y qué no (y por qué). ⚠️ Nunca se imprime el
contenido de los secretos.

- ⭐ **Simular el clon limpio:** borrar el artefacto generado más barato y reproducir la
  cadena · ⭐ **el mapa del build** con dependencias directas E indirectas y la demostración
  de que el orden las satisface · ⭐ el fail-safe distingue «dependencia caída» de «error
  interno» y de «configuración a medias».
- **Cada variable de entorno falla ruidosamente** [probado vaciándola, no leído] · los
  endpoints que disparan trabajo caro fallan CERRADOS [ramas baratas en vivo; las caras con
  dobles que apuntan — y en vivo declaradas NO CONSTA].
- **Los procesos de esta casa, nombrados:** el cron de datos [¿falla en silencio? el ajuste
  de pasadas perdidas del 21/09; el parte en %TEMP%; el «dónde se mira» verificado] · el
  guardián de build [swap, respaldo, .build-ok] · la re-firma del censo [canon snapshot] ·
  el arnés y sus perfiles [censo + cuarentena] · MOTOR_LOG como rutina de batería · el
  auto-deploy de Hostinger [git pull; que no pise lo local] · todo paso manual del
  despliegue, escrito en el repo.
- **El panel lee el ARTEFACTO, no el recibo** [el `generadoEn` de finalización — en esta
  casa: el panel de frescura contra el datapackage] · **escritura atómica en respaldos ·
  curados protegidos del cron · derivados declarados · huérfanos: ¿basura o evidencia?** · scripts de build deterministas e idempotentes
  [probado ×2] · logs de producción: ¿ruido, fugas, permiten entender qué pasó?

### BLOQUE F · LA EXPERIENCIA COMPLETA

**El único bloque que no se hace leyendo código: se hace USANDO el producto.** Navegador
real, cada pantalla capturada y mirada COMO IMAGEN, a los anchos del caso real [el móvil de
pie en la calle + escritorio]. El recorrido principal con DATOS REALES; los raros,
provocados. Y **contexto limpio de verdad**: proceso nuevo, sin historial, la entrada
directa sin pasar por la home.

- **Primer contacto:** ¿en 5 segundos se entiende QUÉ es y a qué ámbito aplica, sin scroll?
  [se juzga por la imagen, no por el árbol].
- **El caso del 90%:** una ruta de un portal a otro — ¿sin ayuda, en cuántos toques, dónde
  se duda?
- **La entrada directa** [enlace compartido]: ¿se sabe dónde se está? ¿hay salida?
- **Los estados raros:** ¿me quedo tirado? ¿vacío/desconocido llega EN PALABRAS? ¿cada error
  tranquiliza y da salida? [en esta casa: el motor caído, el dato rancio, el destino fuera
  de área de YeGo, el viaje BiZi sin hitos].
- **La honestidad:** ¿se percibe o solo está? ¿proporcionada en el flujo, profunda aparte?
  ¿se declara el límite de la propia certeza?
- **El evaluador** [esto ES portfolio]: ¿hay puente del sitio al código y al autor? ¿la
  página que más impresionaría es alcanzable sin conocer su URL?
- **La escala:** las listas sin techo, en su caso extremo.
- **«No se rompe» ≠ «está aprovechado»:** ¿cada página usa un ancho adecuado a su CONTENIDO?
- ⭐ **La lista de sesgos como salida del informe** [obligatoria]: cada momento en que se usó
  conocimiento previo, anotado y revisado — cuando algo resulte «obvio»: ¿buen diseño, o
  que ya lo sabías? · declarar los huecos [lo que el dato vivo no dejó ver].
- **Lo que exige la mano de Antonio** [se declara NO CONSTA en el informe del ejecutor y se
  cubre en sesión aparte guiada]: el lector de pantalla real [NVDA — la deuda de la mesa] ·
  el teléfono físico [pin/prompt real · teclado · safe-area].

### BLOQUE D · DOCUMENTACIÓN

**La regla:** ⭐⭐⭐ *un documento no se audita leyéndolo — se audita CONTRASTÁNDOLO* [cada
afirmación comprobable, contra el código, los datos o el producto]. Va EL ÚLTIMO.

- ⭐ **EL QUICK-START, EN CLON LIMPIO** [donde vivía el único 🔴 de producto de ZetaBus]:
  cada comando de instalación/arranque/test seguido al pie de la letra desde cero.
- **Coherencia entre documentos:** cifras repetidas grepeadas y cruzadas — entre sí y contra
  la fuente [en esta casa: README, PLAN, ESTADO, DISEÑO, THIRD-PARTY-NOTICES, los datapackage].
- **Comentarios:** rancios · aspiracionales · porqués que describen mecanismos inexistentes ·
  TODO/FIXME fósiles · **promesas de guardianes que no existen**.
- **Enlaces:** internos, externos, punteros incompletos · gemelos desincronizados · el
  guardián de enlaces: ¿contra qué conjunto y con qué techo declarado?
- **Viva vs histórica:** ningún registro fechado reescrito [verificado en git] · ningún
  puntero vivo apoyado en foto vieja · los append-only congelados lo dicen [aquí: las
  crónicas ⚰️ del PLAN, la BITACORA, las actas].
- **El escaparate:** ¿describe el proyecto como es HOY? ¿capturas de la versión actual? ¿la
  demo enlazada funciona?
- **Verificar antes de corregir:** un «dato desfasado» puede ser el mismo número con otro
  sentido.

---

## 5 · CÓMO SE ENTREGA CADA BLOQUE (formato obligatorio)

Un fichero por bloque en **`docs/auditoriafinal/`** del repo [nombrado por BLOQUE, no por
fase — deliberado: no continúa la serie de auditorías de fase]:

1. **Cabecera:** qué es, fecha, **commit auditado**, y la declaración de **registro
   histórico fechado que no se reescribe** [si el código cambia después, se escribe otro].
2. **Declaración de cobertura** [R2]: total / revisado / NO revisado y por qué. En el C: la
   tabla de mutaciones con sus tres resultados. En el E: ejecutado / simulado / no simulado.
3. **Tabla de hallazgos:** categoría · ubicación exacta [fichero:línea] · qué es · **por qué
   importa** · gravedad [🔴 rompe o miente · 🟠 deuda real · 🔵 cosmético] · coste [trivial /
   acotado / tanda propia] · **si es decisión de producto, marcado** — el auditor no la
   toma. Y un apartado «reportado por completitud (NO es defecto)» para lo deliberado.
4. **Lo que está bien y por qué merece repetirse.**
5. **Recomendación de orden:** qué arreglar primero **y qué NO tocar**.
6. **Para el checklist maestro:** las comprobaciones que valdrían en CUALQUIER proyecto,
   en genérico [alimenta la guía].

⭐ **Cuando un hallazgo es una decisión con opciones**, el informe trae **las opciones CON su
coste y lo que rompe cada una** — y no decide.

## 6 · LA SÉPTIMA PIEZA — LA VERIFICACIÓN DEL AUDITOR

Tras las tandas de arreglo, **una pasada de verificación con su propio informe**: cada
hallazgo, cerrado o deliberadamente dejado, con **evidencia RE-CORRIDA sobre el árbol
actual** [el grep que vuelve vacío AHORA, no «lo cambié en el commit X»]. En su estreno cazó
un subconteo del informe original — sin esta pieza, las imprecisiones del auditor se quedan
como verdad.

## 7 · EL PROTOCOLO DE ESCÁNERES EXTERNOS

La batería ajena como checklist repetible, **con la regla de lectura: mediciones de
laboratorio, no certificados** [miden la FORMA, no el FONDO — una app que inventara los
datos sacaría las mismas notas]. En Desplázame: producción lleva viva desde el 8/09, así que
la pasada se hace **como parte del cierre y se repite tras las tandas de arreglo como
regresión**. La batería: PageSpeed/Lighthouse [móvil Y escritorio; las métricas concretas valen más que
la nota; un punto de diferencia es ruido de medición — y dos pasadas del mismo motor el
mismo día pueden dar números distintos] · securityheaders · SSL Labs [en TODOS los nodos
del CDN; suele ser mérito del hosting: se anota, no se cuelga la medalla] · validador W3C
**en varias páginas, una por plantilla** [y re-validar tras arreglar con datos reales] ·
Rich results / validator.schema.org [si hay datos estructurados — solo los que Google
dibuja de verdad] · axe/WAVE [comparten motor con Lighthouse; la WAVE web revienta con
X-Frame-Options y pinta nota igual]. **La evidencia se versiona:** capturas + documento de
verificación externa fechado, **enlazado desde el escaparate**.

## 8 · LO QUE EL ESTRENO ENSEÑÓ (para dimensionar ESTE cierre)

**Rentable, repetir siempre:** la mutación [destapó los dos 🔴 de C en ZetaBus] · contrastar
la documentación [~55 afirmaciones → 15 hallazgos, incluido el único 🔴 de producto] ·
simular el clon limpio · la lista de sesgos · la verificación del auditor · auditar con
datos reales cuando se puede.
**Ruido, evitar o acotar:** los barridos masivos sin limpiarse a sí mismos [106 de 108
hallazgos eran del instrumento — agrupar por causa y re-correr lo sospechoso] · los candados
sobre datos reales exactos · medir mejor una comparación que no decide nada.
**El hueco honesto de ZetaBus, a cubrir aquí:** los tiempos por bloque NO se registraron —
**en Desplázame se apuntan las horas por bloque** [cualitativo de allí: A y C llevan el
gordo; D tiene la mejor relación hallazgo/esfuerzo; F es corto en piezas pero exige el
contexto limpio de verdad].

---

## 9 · EL TABLERO (se actualiza aquí; este marco es el único documento vivo de la carpeta)

| Pieza | Informe | Commit auditado | Fecha | Estado |
|---|---|---|---|---|
| Bloque A · código | `docs/auditoriafinal/A-CODIGO.md` | `78821ff` | 2026-09-23 | **ENTREGADO** |
| Bloque C · tests | `docs/auditoriafinal/C-TESTS.md` | `2c4ebb5` | 2026-09-23 | **ENTREGADO** |
| Bloque B · interfaz | `docs/auditoriafinal/B-INTERFAZ.md` | `2c5735d` | 2026-09-24 | **ENTREGADO** |
| Bloque E · operación | `docs/auditoriafinal/E-OPERACION.md` | `4fd65cc` | 2026-09-24 | **ENTREGADO** |
| Bloque F · experiencia | `docs/auditoriafinal/F-EXPERIENCIA.md` | `037e546` | 2026-09-24 | **ENTREGADO** |
| Bloque D · documentación | `docs/auditoriafinal/D-DOCUMENTACION.md` | `53ae338` | 2026-09-24 | **ENTREGADO** |
| Tandas de arreglo | §10 de este marco | — | 2026-09-24/25 | ⚰️ LAS CUATRO + el racimo + B-6 |
| Verificación del auditor | `docs/auditoriafinal/VERIFICACION.md` | 035f855 | 2026-09-25 | ⚰️ ENTREGADA [56 piezas: 51 verificadas · 5 no-verificables legítimos · 3 discrepancias, las tres de cifra: B-6/B-7 sin dictado (dictados después: B-6 ⚰️ hecho en c98fe63 con los 3 targets a 44, los 9 al censo y la P30·bis; B-7 SE DECLARA a la cola) · «cinco importadores» eran cuatro · «17 citas» eran veinte] |
| Escáneres externos | `docs/auditoriafinal/EXTERNA.md` + `externa/` (22 ficheros) | `8aa418a` en producción | 2026-09-27 | **ENTREGADOS** — Lighthouse a11y 100 ×6 · SSL Labs A en 4 nodos · axe 0/1/1 · 4 NO CONSTA [securityheaders, W3C pintado, WAVE, la regla del desafío] · 3 hallazgos que la nota escondía |
| Cierre: tag + release + CHANGELOG + badge | — | — | — | — |
| El reposo: papeles al día, cabos declarados | — | — | — | — |

## 10 · LA MESA DE DECISIONES (24/09 — los seis mapas entregados; decide Antonio)

**EL VEREDICTO DEL HUSO (24/09, el minuto de Antonio por SSH):** 🔴 CONFIRMADO.
El banner del servidor de-fra-web2061: «09:43 UTC» con Madrid en las 11:43; y en las
variables de entorno del panel NO EXISTE `TZ` (solo los dos secretos conocidos). Producción
decide la hora en UTC: dos horas atrás todo el día, y de 00:00 a 02:00 de Madrid sirve el
calendario GTFS del día anterior. [El `node` del PATH de SSH no existe — irrelevante: Node
hereda el huso del sistema salvo `TZ`, y no hay `TZ`.]
**MITIGACIÓN APLICADA (24/09, mano de Antonio):** `TZ=Europe/Madrid` añadida y aplicada en
las variables de entorno del panel de Hostinger. Su efecto NO es verificable desde fuera
[el hallazgo del E: cinco vías descartadas] — queda pendiente de la jueza de la T1; el
arreglo de código de la T1 sigue en pie entero [la variable es el cinturón, no la fuente única].

**Los 38 hallazgos de los seis informes, agrupados para dictado. Estados posibles por
pieza: TANDA · SE DECLARA (no se toca, con acta) · NEVERA. Nada se toca sin dictado.**

| Grupo | Piezas | Dictado de Antonio |
|---|---|---|
| G1 · EL HUSO [🔴 A-1+C-1, confirmado] | el arreglo [4 opciones del A] + la red [3 opciones del C] | TANDA [T1] — FIRMADO por Antonio y ⚰️ HECHO el 24/09 |
| G2 · fuente única y poda | A-2 [frase disponibilidad ×3 + includes] · A-3 [tipos sin declarar] · A-4 [muerta ×4] · A-5 [TIPOS_CON_FACTOR] · los 🔵 del A [2 muertas · 74 exports · dos «día» · aserción floja · ⚖️ buscador.ts 3.771 líneas: reportado PARA QUE NO SE PARTA — pide un «se declara» explícito] · D-2 [enlace roto] | ⚰️ HECHA 24/09 [T2]; buscador.ts FIRMADO no-se-parte; A-8 SE DECLARA sin código [la letra: no es el caso prohibido — corrige el dictado inicial de tanda] |
| G3 · tests y guardianes | C-2 [«TODO VERDE» prematuro ×4] · C-3 [jueces del empuje] · C-4 [m.esperar mata la suite] · ⚖️ C-5 [suites sin script — DECISIÓN] · 🔵 los cinco grep-de-fuente [«forma, no comportamiento» — candidatos a se-declara] · 🔵 la lección de la M1a | ⚰️ HECHOS 24/09 [T3]; los grep y la M1a: SE DECLARAN |
| G4 · interfaz y textos | B-1 [title/description] · B-2 [main/footer] · ⚖️ B-3 [noscript mudo — DECISIÓN, 4 opciones] · B-4 [errores en jerga] · B-5 [letra del panel] · 🔵 [táctiles fuera de censo · reduced-motion 2/11] | ⚰️ HECHOS 24/09 [T3]; B-3 por dictado 1+2 [pantalla disparable, 5 juezas] |
| G5 · experiencia [casi todo producto] | ⚖️ F-1 [/identidad isla: el «no se llega» está documentado deliberado (D); el «no se sale» no] · ⚖️ F-2 [sin puente al código/autor — esto es portfolio] · ⚖️ F-3 [/creditos→/panel sirve la portada; la frase cumple la Ley 37/2007 — 4 opciones] · F-4 [YeGo sin salida] · F-5 [una letra no sugiere] | ⚰️ HECHOS 24/09 [T3]: F-1 [ambas mitades; README:724-728 al día] · F-2 · F-3 op.1 [por RUTAS_DE_INTRANET existente] · F-4 [premisa verificada antes: lo escrito se conserva] · F-5 |
| G6 · operación y papeles | E-1 [PORT='' → puerto aleatorio mudo] · E-2 [fail-safe no nombra lo apagado] · ⚖️ E-3 [auto-deploy sin documentar] · E-4 [22 _cabeceras.txt fuera del manifiesto] · ⚖️ D-1 [2 rojas en clon + cómo-correr-las-pruebas sin sitio — 4 opciones] · 🔵 D-3 [README sin captura] · D-4 [aviso npm install] · D-5 [licencia en package.json] | ⚰️ HECHOS 24/09 [T4]; E-3 por dictado [docs/DESPLIEGUE.md] · D-1 op.4 las tres |

**EL CICLO, donde está (25/09 tarde):** los seis informes ⚰️ · las cuatro tandas ⚰️ · el racimo ⚰️ · B-6 ⚰️ [c98fe63; B-7 SE DECLARA a la cola] · la séptima ⚰️ · **EL PEAJE PAGADO: 10/10, 1.704 veredictos, 0 rojos** [pintura entera vista — la deuda de la T3 saldada; la P30·bis por corrida: /creditos 9 con fila y deuda 0, /identidad 0 bajo la vara; unidad 673+784; tsc ×2; no-viaja también sobre el dist real; comprobar-dist main-GXEANU6U.js sha dbb905c8…; 0 escapadas; dist del lote en c0594bc]. EL PUSH: ⚰️ HECHO el 26/09 [78821ff..8aa418a, 412 objetos] — con HALLAZGO: el webhook NO disparó; desplegó el botón Redistribuir. EL 7.3 DE ANTONIO: ⚰️ CERRADO por SSH el 26/09 [.env.local no existe NI DEBE — releases hbuilds/ + claves en panel, fuera del ciclo; y el log de producción cantando la T1: «huso del proceso Europe/Madrid — el entorno ya traía la misma» + «puerto 3000 (defecto)»]. DESPLIEGUE.md al día en 6b3c56f [7.1/7.2/7.5 parciales medidos · 7.4 sigue NO CONSTA · el aviso del webhook como REGLA en §8 paso 5 · 13 NO CONSTA restantes]. LO QUE QUEDA: escáneres → cierre [tag·release·CHANGELOG·badge] → reposo. Las sesiones de mano [NVDA · teléfono], cuando Antonio quiera.

**LA PROPUESTA DE TANDAS del estratega (a firmar o cambiar por Antonio):**

| Tanda | Contenido propuesto | Estado |
|---|---|---|
| T1 · el huso | arreglo op.3 + red op.1 | ⚰️ HECHA 24/09 [3 commits 6cc6f61·231efa3·7986e9b, 12 ficheros solo motor/src: las cuatro por reloj.ts (relojDeZaragoza · fechaGtfsEnZaragoza, paseo de días por Date.UTC) · TZ desde huso-del-proceso.ts importado primero, con la doc de Node citada (changelog TZ: v13.0.0 POSIX · v16.2.0 Windows; engines>=22 cubre ambos) y el arranque IMPRIME el huso resuelto — la 1ª línea del log de Hostinger confirmará la variable al desplegar · la jueza hijo-UTC con juez-0: nació 5/6 roja y quedó 11/11 · 4 actas (instantes naive new Date(...) → UTC con Z y la pared al lado) · elDiaAntes verificado NEUTRAL corriéndolo en Madrid/UTC/Tokio × 6 fechas · unidad 668/668 · tipos limpios · e2e al peaje] |
| T2 · fuente única y poda | G2 entero | ⚰️ HECHA 24/09 [7 commits hasta el último de la tanda, 43 ficheros: A-2 la frase MUDADA AL CONTRATO — una definición, tipos/src/index.ts:48, cinco importadores, y la decisión de fondo DECLARADA: @desplazame/tipos pasa a emitir un valor (type: module + exports, cabecera reescrita); 2 actas anti-tautología donde las juezas siguen tecleando la frase A PROPÓSITO · A-3 en dependencies · A-4+A-6 las tres muertas fuera · A-5 cableada con contraprueba roja→restaurada · A-7: 89 exports retirados (el censo del informe decía 74: REHECHO por import real, dos veces; avisoDelRelojDeLaZbe VUELVE — lo consume el hijo de huso.spec por import(argv) y la jueza 9 de la T1 lo cazó EN ROJO al podarlo) · A-8 declarada y MEDIDA [3 husos × mismo instante: TZ no mueve ni el nombre del fichero ni el corte — la T1 no cambió registro.ts ni podía; el efecto del informe sigue, y es el deliberado] · D-2 + barrido: 7 citas arregladas línea-exacta en MIGRACION-CITAS-RGC-2026.md [terreno del D-2]; las 4 de intranet/ [PARLAMENTO·DIAGNOSTICO: registros fechados de parlamento resuelto] REVERTIDAS byte a byte (8a39bd4) y su deriva ANOTADA para la séptima junto a las 17 del CENSO congelado [en cuerpos de commit]; el falso-positivo «64,1 kB» esquivado · motor 669/669 · app 775/775 · tsc limpio ×2 (y cazó una guarda Partial del A-10)] |
| T3 · tests + interfaz + experiencia | las 14 piezas | ⚰️ HECHA 24/09 [5 commits 6150c57·1b6a36c·ce0f7f0·bc3f134·a9e1105: C-2 en las 4 con el parche exitCode fuera · C-3 juez-0 [5 km/h + la relación] con contraprueba 5→6 roja · C-4 la ley del 22/09 a moto/yego/pintura [acta en ayudante ×29 bloques] · C-5 npm run bateria + diez alias · B-1 rótulos firmados · B-2 con DOS desviaciones declaradas [panel: section→main, 0 px movidos, footer genérico declarado; identidad/visor sin footer: no hay cierre que envolver] · B-3 pantalla disparable [solo app-root vacío] · B-4 el firmado · B-5 Inter · F-1/2/3/4/5 · motor 670/670 · app 780/780 · 7 suites corridas: 6 verdes y pintura con TRES rojas RESUELTAS [su hover cazado por pintura.spec — el guardián funcionó; P31 rojo-falso estructural: identificaba paradas por clase y 6 hermanos parecían racha — medido 5→0, arreglado en a9e1105; hacía falta un 4º hermano para verlo] · actas P14 + unidad-del-error + censo de iconos 18→19 · la re-tirada COMPLETA de pintura: ⚰️ VISTA EN VERDE en el peaje del 25/09] |
| T4 · operación y papeles | G6 + B-4-bis + [::1] + nota MOTOR_LOG | ⚰️ HECHA 24/09 [5 commits 69ef35e·0ab6eae·b552f2f·dc73953·39fde99, 15 ficheros: E-1 PORT='' → 3000 DICHO [«puerto 3000 (defecto)» tras enganchar la consola; 3 ramas en unidad, y la inversa: listen(0) es legal — por eso era mudo] · E-2 la capacidad apagada NOMBRADA [elTokenSirve extraído: una condición, dos consumidores; el texto se compone de las constantes — si el mínimo sube, el aviso no puede mentir; solo habla apagada: la simétrica queda ofrecida] · E-4 campo ficherosQueNoSonRecursos en el manifiesto [el sitio de casa para lo que el estándar calla; dos copias, sha idéntico, jueza byte-a-byte contenta] · E-3 docs/DESPLIEGUE.md 236 líneas, 18 citas comprobadas — HALLAZGO: el cron de datos NO es del hosting, es schtasks EN LA MÁQUINA DE ANTONIO [03:30, StartWhenAvailable] · los 5 NO CONSTA del panel con su comprobación exacta [⭐ 7.3: si el deploy pisa lo no-versionado — mirar .env.local tras el próximo despliegue; si desaparece, 🔴] · D-1 las tres [candado portable MEDIDO en carpeta ajena 13/13; skip honesto ELEGIDO con razón: el build es barato (1,6 s) pero una prueba que se construye su prerrequisito no vuelve a avisar — verde prestado; bloque de pruebas en el quick-start] · [::1] corregido con «Aquí ponía» [netstat medido: [::1] sí, 127.0.0.1 ECONNREFUSED] · D-3 docs/img/portada.png 1440×900, 724 KiB, con el pie del F-1/F-2 dentro · D-4 una línea · D-5 license ×3 coherentes · B-4-bis los dos textos por la fórmula [poste-vivo provocado bloqueando la ruta: role=status, técnica a la consola] · BITÁCORA 71: la juez 3 tautológica [✔ con puerto 0 — calculaba lo esperado con la fórmula vigilada; LEY: el valor esperado SE ESCRIBE, no se calcula; campo estrella medido en worktree de 0d70748] · FUERA DE LISTA declarado: DESPLIEGUE.md al índice del README + 39fde99 [defecto suyo de la C-5: la batería pasaba 2 argumentos a suites que piden 3 — cazado verificando la (j), re-corrido verde 51,4 s] · actas: juez 3 · juez 5 [⚠️ mide el dist EMITIDO] · juez 13 · buscador.spec + patrón MUDO · motor 673/673 · app 780/780 ×2 · tsc ×2 · contrapruebas 4/4 rojas→sha idéntico] |
| REPORTADOS por la T3 | B-4-bis [poste vivo · ubicación] · el [::1] del README · la nota MOTOR_LOG | ⚰️ RESUELTOS EN LA T4 [los tres] |
| REPORTADOS por la T4 — dictados el 25/09 | la juez 5 [compra el dist emitido]: SE DECLARA [límite del instrumento, acta ya puesta] · la rama de /api/poste-vivo sin guardián: SE DECLARA a la cola [la rama habla bien, medida; su jueza e2e es tanda propia] · la batería sin jueza: SE DECLARA a la cola [misma clase; su primer defecto ya cazado y arreglado] · los dos sitios de jerga: ⚰️ HECHOS [micro-pieza 1] · el 7.3: ⚰️ CERRADO por SSH 26/09 · NUEVO 26/09 — el webhook del deploy NO dispara [Redistribuir manual; regla en DESPLIEGUE.md §8.5]: SE DECLARA a la cola hasta entender por qué |
| EL RACIMO de micro-piezas [25/09, tras la T4 — cada una destapada por el checkpoint de la anterior] | 1 [70fc580]: la jerga de autocompletar y selector-portal por la fórmula [«No se pudo preguntar al motor. ¿Está arrancado?» fuera; técnica al log con effect; 2 actas] — y su checkpoint destapa la rama muda de sitios · 2 [920cbff]: el PARO ejemplar primero [«sitios» no es palabra de la interfaz; LAS CAPAS SE EXCLUYEN — no existe el fallo parcial; y el defecto real era PEOR: leer un recurso en error LANZA y reventaba la detección de cambios] → opción A firmada con la forma «la lista de [etiqueta]» [las 7 frases del catálogo real, fuente única buscador.ts:2976-2987, input obligatorio; el borde del error-que-sobrevive MEDIDO: no existe] · 3 [b1e91a9]: el «Buscando…» pasa a la CARGA DE LA CAPA ACTIVA [no un OR ciego]; el repaso de la cadena declara la ASIMETRÍA de las dos ramas de error [se comportan bien hoy, medido; forma asimétrica: declarada, no tocada] y destapa el teclado muerto · 4 [1a1c9ef]: lista() lee value() solo con hasValue() [el ?? [] nunca corría: el lanzamiento era anterior]; la jueza compra Escape en LAS DOS capas; simetría medida: las dos mataban el teclado DESDE SIEMPRE · 5 [035c687]: el hermano selector-portal, misma línea, premisa del orden de ramas COMPROBADA [aviso antes que vacía], y EL CIERRE DE CLASE sobre toda la app: 3 recursos, 3 lecturas de value(), las 3 guardadas — no queda ninguna sin guarda · app 784/784 [+4 juezas del racimo] · tsc limpio ×2 en las cinco | ⚰️ HECHO — la clase cerrada |
| HALLAZGO NUEVO de la T2 · contrasteRgb ×2 | implementado en app/src/app/contraste.ts Y app/e2e/medir.mjs, con nota cruzada admitida en el segundo [«la misma fórmula que src/app/contraste.ts»] | Por la letra del §4·A [«duplicación DELIBERADA con nota cruzada se reporta como no-es-defecto»]: SE DECLARA — salvo dictado contrario de Antonio |
| Sesiones de mano de Antonio | NVDA y teléfono físico [instrucciones en el §7 del F] | PENDIENTE |

*Este cuadro se actualiza con cada dictado y cada tanda cerrada; los informes de bloque no
se tocan.*

**Gobierno de la fase:** cada bloque = UN encargo de solo-lectura al ejecutor [R1], con este
marco como doctrina; los informes son registros fechados que no se reescriben; las tandas de
arreglo las decide Antonio sobre los mapas y corren bajo el régimen del peaje; los hallazgos
que sean decisión de producto llegan con opciones y sin decidir.
