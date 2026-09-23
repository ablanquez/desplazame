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
| Bloque A · código | `docs/auditoriafinal/A-CODIGO.md` | — | — | PENDIENTE |
| Bloque C · tests | `docs/auditoriafinal/C-TESTS.md` | — | — | PENDIENTE |
| Bloque B · interfaz | `docs/auditoriafinal/B-INTERFAZ.md` | — | — | PENDIENTE |
| Bloque E · operación | `docs/auditoriafinal/E-OPERACION.md` | — | — | PENDIENTE |
| Bloque F · experiencia | `docs/auditoriafinal/F-EXPERIENCIA.md` | — | — | PENDIENTE |
| Bloque D · documentación | `docs/auditoriafinal/D-DOCUMENTACION.md` | — | — | PENDIENTE |
| Tandas de arreglo | (las decide Antonio sobre los mapas) | — | — | — |
| Verificación del auditor | `docs/auditoriafinal/VERIFICACION.md` | — | — | — |
| Escáneres externos | `docs/auditoriafinal/EXTERNA.md` + capturas | — | — | — |
| Cierre: tag + release + CHANGELOG + badge | — | — | — | — |
| El reposo: papeles al día, cabos declarados | — | — | — | — |

**Gobierno de la fase:** cada bloque = UN encargo de solo-lectura al ejecutor [R1], con este
marco como doctrina; los informes son registros fechados que no se reescriben; las tandas de
arreglo las decide Antonio sobre los mapas y corren bajo el régimen del peaje; los hallazgos
que sean decisión de producto llegan con opciones y sin decidir.
