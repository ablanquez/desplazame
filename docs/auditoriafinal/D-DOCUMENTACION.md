# AUDITORÍA DE CIERRE · BLOQUE D — DOCUMENTACIÓN

> **Qué es:** la sexta y última pieza de la Fase 7. Gobernada por
> `00-MARCO-AUDITORIA-DE-CIERRE.md` §4·D. Va **la última a propósito**: contrasta contra el
> estado final de todo lo demás.
>
> **Fecha:** 2026-09-24 · **Commit auditado:** `53ae338`
>
> ⚠️ **REGISTRO HISTÓRICO FECHADO — NO SE REESCRIBE.**
>
> **LA REGLA DEL BLOQUE:** *un documento no se audita leyéndolo — se audita **CONTRASTÁNDOLO***.
> Aquí **ninguna cifra se ha heredado como criterio**: cada contraste lleva su comando.
>
> **R1:** solo lectura del repositorio real. El clon limpio se montó **fuera** del repo, en el
> scratchpad, y **se ha borrado al acabar** (379 MB): `rm -rf` verificado con `ls` →
> *No such file or directory*. Árbol del repo real limpio; procesos parados.

---

## 1 · EL CENSO Y LA COBERTURA (R2)

### El censo: 18 documentos, ~1,43 MB

| Documento | Líneas | Bytes |
|---|---:|---:|
| `PLAN-DESPLAZAME.md` | 5.761 | 373.797 |
| `docs/BITACORA.md` | 5.794 | 337.744 |
| `THIRD-PARTY-NOTICES.md` | 3.408 | 262.369 |
| `DESPLAZAME-ESTADO.md` | 2.179 | 138.064 |
| `README.md` | 1.261 | 108.470 |
| `datapackage.json` | 1.671 | 84.513 |
| `DISENO-DESPLAZAME.md` | 505 | 51.389 |
| `docs/CENSO-PRE-DESPLIEGUE.md` | 386 | 20.743 |
| `app/README.md` · `motor/README.md` | 192 · 84 | 7.294 · 3.883 |
| `docs/INVESTIGACION-EQUIPAMIENTOS.md` · `docs/MIGRACION-CITAS-RGC-2026.md` | 238 · 218 | 11.228 · 10.966 |
| `intranet/` ×4 + `PROCEDENCIA.md` | 528 | 28.742 |
| `CLAUDE.md` | 93 | 4.084 |
| **`docs/auditoriafinal/` ×6** | — | — |

(27 ficheros `.md` en total contando los seis informes de esta auditoría.)

### Cobertura de afirmaciones, por documento

| Documento | Comprobables abordadas | Contrastadas con comando | No contrastadas |
|---|---|---|---|
| `README.md` (quick-start y escaparate) | **21** | **21** | — |
| `motor/README.md` | 3 | 3 | — |
| `app/README.md` | 2 | 2 | — |
| Todos los `.md` (rutas de fichero citadas) | **146 distintas** (432 apariciones) | **146** | — |
| Fuentes (comentarios que citan una jueza) | **41 ficheros, 124 citas** | **41** | — |
| `docs/BITACORA.md` (integridad histórica) | 28 cabeceras × 118 commits | **todas** | contenido interno de cada entrada |
| `PLAN` · `ESTADO` · `DISEÑO` · `THIRD-PARTY` | cifras repetidas del presupuesto y de pruebas | **las grepeadas** | el resto de su cuerpo |

### Lo que NO se contrastó — **NO CONSTA**

1. **El cuerpo de `PLAN` (5.761 líneas), `BITACORA` (5.794) y `THIRD-PARTY-NOTICES` (3.408)
   afirmación por afirmación.** Son **974 kB** de los 1,43 MB del censo: contrastar cada frase
   excede cualquier presupuesto razonable. Se contrastó **lo que se repite entre documentos**
   (que es donde nacen las incoherencias) y **lo verificable por estructura** (rutas, enlaces,
   cabeceras fechadas). Del resto: `NO CONSTA`.
2. **Las 41 fichas de datos del `THIRD-PARTY-NOTICES`** contra sus fuentes vivas: se
   re-verificó **una muestra de dos ELI** (abajo), no las 41.
3. **El contenido interno de cada entrada de la bitácora** a lo largo de su historia: se
   verificó que **ninguna cabecera fechada desapareció nunca**, no que ni una palabra interior
   cambiara.
4. **`npm run comprobar-arranque`**: el propio README declara que **son solo de Windows** (leen
   el PID con `netstat` y la hora con PowerShell) — deuda ya declarada; **se cita, no se
   estrena**, y no se ejecutó en el clon.
5. **Las diez suites e2e en el clon limpio**: piden Chrome y motor sirviendo; el bloque C ya las
   audita. No se repiten aquí.

### Deudas declaradas, **citadas y no re-descubiertas**

El **README temas/mapa pendiente**, el **KML en la nevera** y los **binarios solo-Windows** están
en la mesa del ESTADO. Se citan como lo que son —deuda conocida— y **no se cuentan como
hallazgos de este bloque**.

---

## 2 · ⭐ EL QUICK-START EN CLON LIMPIO — **PASÓ**

Clonado desde GitHub tal y como manda el README, **fuera del repo**, en un directorio con **otro
nombre**, sin claves y sin saber nada que el papel no diga.

| Paso del README | Comando | Resultado |
|---|---|---|
| 1 | `git clone https://github.com/ablanquez/desplazame.git` | ✅ salida 0 · cae en `78821ff` (= `origin/main`) |
| 2 | `npm install` (en la RAÍZ) | ✅ salida 0, **16 s** · con avisos (ver D-4) |
| 3 | `cd motor && npm start` | ✅ `/api/salud` → **200** |
| 4 | `cd app && npm start` | ✅ `:4200` → **200** |
| 5 | Las **cuatro páginas** de su tabla | ✅ las cuatro, y **cada una rinde su propio componente** |
| 6 | `npm run comprobar-tipos` (en la RAÍZ) | ✅ **VERDE** · 305 y 382 ficheros |

**La promesa más delicada del README, cumplida al pie de la letra.** Dice: *«no hace falta
ninguna clave para arrancar […] un clon limpio levanta el bus y el tranvía sin pedirle nada a
nadie […] Sin ellas el motor arranca igual **y lo dice**: sirve la semilla»*. En el clon, sin
ningún `.env.local`:

```
motor: sin .env.local (o sin nada nuevo que aportar); manda el entorno
motor: feed GTFS SEMILLA del repo — 20260623_AUZSA_Y_TRANVIA · 6883311 bytes
```

Y **rutea de verdad**: `POST /api/ruta` en bus devolvió **11 pasos, 56,3 min**, sin una sola
clave. Las tres partes de la promesa —arranca, lo dice, sirve la semilla— **verificadas**.

Y las afirmaciones de la tabla de páginas, contrastadas en el navegador del clon:

```
/            <app-buscador>  h1 «Desplázame»
/panel       <app-panel>     h1 «Frescura de los datos»
/identidad   <app-identidad> h1 «Identidad visual»
/creditos    <app-creditos>  h1 «Créditos y fuentes»
MARCADAS al abrir: NINGUNA ✓   ·   «Generar ruta» deshabilitado: true
puerta a créditos desde el pie: ["/creditos", …]
```

Tres afirmaciones más del README, verificadas de paso: **«al abrir no hay ningún modo
marcado»** ✓, **«`/creditos` es la única con puerta, desde la franja del pie»** ✓ (que es como
cumple el RD 1495/2011), y que el resto cae en el comodín ✓.

⚠️ **Y una que parecía un fallo y no lo es:** `comprobar-tipos` imprimió **305 y 382**, mientras
el README enseña **296 y 364**. No es un dato desfasado: el propio README lo dice dos líneas
después — *«(Salida del 14/09 […] el censo crece con cada fichero, y por eso se copia de una
ejecución y no se razona)»*. **Es una foto fechada y declarada como tal.** Se reporta como
ejemplo de «verificar antes de corregir», no como defecto.

---

## 3 · HALLAZGOS

### 🟠 D-1 · Las pruebas de unidad no se pueden correr en un clon limpio, y el README no dice cómo

| | |
|---|---|
| **Documento y sitio** | `README.md` §«Cómo arrancarlo en local» / §«Comprobar…» — la ausencia · `motor/src/renovar-feed.spec.ts:443` · `motor/src/servidor.spec.ts:263` |
| **Gravedad** | 🟠 |
| **Coste** | Acotado |

**Lo que se hizo:** en el clon limpio, `npm run probar` desde la raíz.

```
=== TIPOS salida 0 ===
ℹ tests 662 · pass 660 · fail 2
=== PROBAR salida 1 ===
```

**Las dos rojas, con su causa medida y distinta cada una:**

**(a) Un candado a la carpeta del autor.** `renovar-feed.spec.ts:443`:

```js
assert.match(comoBarras[1]!, /004_DESPLAZAME\/\.env\.local$/, 'y el segundo el de la raíz');
```

La aserción exige que la raíz del proyecto **se llame `004_DESPLAZAME`**. En el clon —que se
llamaba `desplazame`, como el propio README manda clonar— falla. La línea de arriba, hermana
suya, **sí** es portable (`/\/motor\/\.env\.local$/`): una de las dos se escribió mirando la
pantalla de quien la escribía.

**(b) Una prueba con un prerrequisito que nadie declara.** `servidor.spec.ts:263` necesita
`motor/dist/servidor.js` y muere con `ERR_MODULE_NOT_FOUND`. Ese fichero lo produce `npm run
build`, y **`motor/dist/` está en el `.gitignore` (línea 7)**: un clon nunca lo trae. El paso
existe y está documentado… **en otro documento**: `motor/README.md:18` (`npm run build
--workspace @desplazame/motor  # tsc → motor/dist`). El README de la raíz **no lo menciona**.

**Por qué importa, y por qué es 🟠 y no 🔴:** siguiendo el README **al pie de la letra** nadie
tropieza con esto — **el README no manda correr las pruebas de unidad en ningún sitio**
(comprobado: `grep -n "npm run probar\|npm test" README.md` no devuelve ninguna instrucción de
ejecución). Ése es justamente el problema: los papeles presumen de **662 + 775 pruebas** y **no
hay un solo sitio que diga cómo correrlas**; quien pruebe lo obvio —`npm run probar`, que la
raíz expone— se lleva dos rojos que **no son suyos**.

**Opciones, con su coste y lo que rompe — sin elegir:**

| | Qué | Coste | Qué rompe |
|---|---|---|---|
| 1 | Hacer portable la aserción (comparar contra la raíz calculada, no contra un nombre) | Trivial | Nada. Sigue comprobando lo mismo |
| 2 | Que `servidor.spec.ts` construya el puente si falta, o se salte **diciéndolo** (`skip` honesto) | Acotado | Un `skip` es visible; hoy es un rojo |
| 3 | Añadir al quick-start el bloque de pruebas con su `npm run build` previo | Trivial | Nada; es escribir |
| 4 | Las tres | Acotado | — |

---

### 🔵 D-2 · Un enlace interno roto, y es de esta misma auditoría

| | |
|---|---|
| **Documento y línea** | `docs/MIGRACION-CITAS-RGC-2026.md:47` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

De **146 rutas de fichero distintas** citadas en los 27 `.md` (432 apariciones), **una sola no
existe**: `tipos/index.ts`. La real es **`tipos/src/index.ts`**, que es como la citan los otros
dos sitios del repositorio.

**Y la escribí yo**, ayer, en el informe de la migración del RGC. Queda dicho: **el auditor
también mete enlaces rotos**, y por eso el contraste se hace con comando y no leyendo.

Las otras cinco que el barrido señaló **no son defectos**: `app/src/app/intruso-temporal.css`
(un fichero transitorio **citado en la bitácora**, que es un registro de lo que pasó, no un
puntero vivo), tres informes de esta auditoría **aún por escribir** que el tablero del marco
anuncia (uno de ellos, éste), y `scripts/construir.mjs` en `app/README.md`, que es **correcta en
relativo** y solo fallaba en mi comprobador absoluto.

---

### 🔵 D-3 · El escaparate no enseña el producto

| | |
|---|---|
| **Documento y sitio** | `README.md:7-12` |
| **Gravedad** | 🔵 |
| **Coste** | Acotado |

El README tiene **seis referencias de imagen y las seis son insignias de `shields.io`**
(licencia, Angular, TypeScript, Leaflet, estado, producción). **No hay ni una captura del
producto**: `grep` de `](…png|jpg|svg)` no devuelve ningún fichero local.

Las insignias, contrastadas una a una contra la fuente: **Angular 22** ✓ (`@angular/core:
^22.1.0`), **TypeScript 6** ✓ (`typescript: ~6.0.2`), **producción en línea** ✓ (HTTP 200 hoy).

**Por qué importa.** El marco pregunta por *«capturas de la versión actual»*, y esto **es
portfolio**: quien abre el repositorio antes que el sitio no ve nada de lo que se ha construido
—el resultado con sus insignias de línea, el panel de frescura, `/identidad`—. Se junta con el
**F-2** (desde el sitio no se llega al código): hoy **los dos extremos están desconectados en
los dos sentidos**.

⚠️ **Marcado como decisión de producto**: qué se enseña y cuántas capturas, lo decide Antonio.

---

### 🔵 D-4 · `npm install` avisa de scripts no ejecutados, y el README no lo menciona

| | |
|---|---|
| **Documento y sitio** | `README.md`, paso 2 del quick-start |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

En el clon limpio, `npm install` sale **0** pero imprime:

```
npm warn allow-scripts  esbuild@0.28.2 (postinstall: node install.js)
npm warn allow-scripts  lmdb@3.5.6 · @parcel/watcher@2.6.0 · msgpackr-extract@3.0.4
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review…
```

**No rompe nada** —se demostró: `ng serve`, que usa esbuild, compiló y sirvió las cuatro
páginas—, pero quien clona ve cuatro avisos rojos con la palabra `esbuild` y **no tiene dónde
comprobar si debe preocuparse**. Una línea del README lo cierra.

---

### 🔵 D-5 · La insignia dice Apache 2.0 y el manifiesto no declara licencia

| | |
|---|---|
| **Documento y sitio** | `README.md:7` y `:1140` vs `package.json` |
| **Gravedad** | 🔵 |
| **Coste** | Trivial |

El `LICENSE` existe y el README lo enlaza dos veces, pero **`package.json` no tiene campo
`license`**. Los dos documentos del mismo hecho no dicen lo mismo: uno lo afirma y el otro
calla.

---

## 4 · REPORTADO POR COMPLETITUD — **NO es defecto**

| Qué | Por qué no es defecto |
|---|---|
| `comprobar-tipos` da **305/382** y el README enseña **296/364** | **El propio README lo declara**: *«Salida del 14/09 […] el censo crece con cada fichero»*. Foto fechada, no dato desfasado |
| `app/data/…` y el `datapackage`: el manifiesto no declara los `_cabeceras.txt` | Ya es **E-4**; no se duplica |
| `/identidad` no se enlaza desde ningún sitio | El README **lo declara deliberado**: *«A las otras dos se llega escribiendo su dirección, a propósito: el panel y la identidad son sitios donde el ojo comprueba, y ese sitio no es el producto»*. ⚠️ **Esto acota el F-1**: la mitad «no se llega» **está documentada y es una decisión**; la mitad «no se sale» (0 enlaces en la página) **no la cubre ningún documento** |
| `comprobar-arranque`, solo Windows | Deuda declarada en el ESTADO **y en el propio README** (*«Las dos son solo de Windows»*). Citada, no estrenada |
| `intruso-temporal.css` citado en la bitácora | Un registro histórico nombra lo que existió entonces. Es su trabajo |
| Los `.md` del tablero que aún no existen | El tablero del marco es el **documento vivo** que anuncia las piezas; uno de los tres se resuelve con este informe |

---

## 5 · LO QUE ESTÁ BIEN, Y POR QUÉ MERECE REPETIRSE

1. **El quick-start funciona en un clon limpio de verdad** —otro nombre de carpeta, sin claves,
   sin caché—, y su promesa más comprometida (arrancar sin secretos) **se cumple literalmente,
   incluido el «y lo dice»**. Ahí vivía el único 🔴 de producto de ZetaBus; aquí no hay ninguno.
2. **⭐ Las 124 citas a juezas apuntan a ficheros que existen: 41 de 41, cero rotas.** Un
   comentario que dice *«lo vigila `tal.spec.ts`»* y no miente es lo que convierte los
   comentarios en documentación fiable. (Que la jueza compre **eso** es otra pregunta: la
   respondió el bloque C mutando, y encontró dos casos —C-3 y C-5— donde la promesa era más
   ancha que la prueba.)
3. **145 de 146 rutas de fichero citadas existen.** Con 432 apariciones repartidas en 27
   documentos, eso es mantenimiento real, no suerte.
4. **Ningún registro fechado se ha reescrito jamás, y está verificado en git:** 118 commits
   tocan la bitácora, hoy tiene **28 cabeceras fechadas**, y en **cero** de esos 118 commits
   desapareció una. El append-only no es una intención: es un hecho medible.
5. **El documento que se corrige a sí mismo en voz alta.** El README está lleno de
   *«⚠️ Aquí ponía X, y dejó de ser verdad el 9/09»*. No borra lo viejo: lo tacha **diciendo
   cuándo dejó de valer**. Es la razón de que sus cifras envejezcan sin mentir.
6. **Las cifras que podrían mentir llevan su fecha pegada.** *«Salida del 14/09»*, *«medido hoy
   sobre 200 peticiones: p50 750 ms»*, *«30/08, sonda de scratchpad por CDP»*. Una cifra con
   fecha es una cifra que se puede contrastar; sin fecha, solo se puede creer.
7. **Las fórmulas legales están donde deben y dicen lo que deben** —la atribución ODbL literal
   con la palabra «colaboradores», el RD 1495/2011 citado como razón de la puerta del pie—, y el
   producto las cumple (bloque F lo vio en pantalla). **Se comprobaron contra su fuente antes de
   tocarlas**: ninguna es errata.
8. **Los ELI del RGC siguen vivos.** Muestra re-verificada hoy: `…/rd/2003/11/21/1428/con` →
   **200** y `…/l/2007/11/16/37/con` → **200**. Es la ventaja que el bloque del RGC compró:
   enlaces permanentes que no caducan.
9. **`intranet/` documenta un cabo entero** —procedencia con sha1, inventario, diagnóstico y el
   parlamento pendiente— en vez de dejar un `TODO`.

---

## 6 · RECOMENDACIÓN DE ORDEN — y qué NO tocar

1. **D-1**, y de sus cuatro opciones la (1) primero: **el candado a `004_DESPLAZAME` es trivial
   y hace verde un clon en cualquier máquina**. Lo demás de D-1 es escribir.
2. **D-2**: un carácter. Y lo arreglo yo cuando se me autorice, que el error es mío.
3. **D-5**: una línea en `package.json`.
4. **D-4**: una línea en el README.
5. **D-3**: **parlamento** — cuántas capturas y de qué, es producto. Conviene **junto con F-2**:
   son el mismo puente visto desde los dos lados.

### ⛔ Qué NO tocar

- **Las cifras fechadas del README no se «actualizan».** *«Salida del 14/09»* con 296/364 es
  correcta **porque lleva su fecha**. Sustituirlas por las de hoy sin fecha sería empeorarlas.
- **Los `⚠️ Aquí ponía…` no se limpian.** Son el mecanismo que hace que el documento envejezca
  sin mentir.
- **La bitácora no se reordena, ni se fusionan entradas, ni se «mejora» un campo estrella.**
- **`intranet/` y sus cuatro documentos se quedan**: son el punto conocido al que vuelve la
  fase 2.
- **Las fórmulas legales no se reescriben por estilo** (ODbL, RD 1495/2011, las citas del RGC):
  son literales obligados y están verificadas contra su fuente.

---

## 7 · PARA EL CHECKLIST MAESTRO (en genérico)

1. **⭐ El quick-start se audita clonando de verdad, en un directorio con OTRO NOMBRE.** El
   nombre de la carpeta del autor se cuela en los tests más veces de lo que parece, y solo un
   clon con otro nombre lo destapa.
2. **Ejecutar también el comando obvio que el documento NO menciona** (`npm test`, `npm run
   probar`). Si falla, el hallazgo es doble: la prueba falla **y** el documento no dice cómo
   correrla.
3. **Cruzar los prerrequisitos entre documentos**: un paso que el README del subproyecto conoce
   y el README raíz omite es un fallo del conjunto, no de ninguno de los dos.
4. **Verificar que cada ruta de fichero citada existe, con un barrido sobre todos los `.md`** —y
   después clasificar a mano: relativo vs absoluto, registro histórico vs puntero vivo, pieza
   anunciada vs enlace roto. Aquí el barrido dio 6 y **solo 1 era real**.
5. **Verificar que cada comentario que promete un guardián nombra un fichero que existe.** Es
   barato y separa la documentación fiable de la aspiracional. (Que el guardián compre lo que el
   comentario dice es el bloque de mutación, no éste.)
6. **Probar el append-only en git, no en la intención**: contar las cabeceras fechadas en cada
   commit del historial y comprobar que **nunca desaparece ninguna**.
7. **Una cifra con fecha no está desfasada: está fechada.** Antes de «corregir» un número,
   buscar si el documento declara cuándo se midió — y si no lo declara, **ese** es el hallazgo.
8. **Leer las insignias como afirmaciones** y contrastarlas contra el manifiesto: versión,
   licencia, estado. Son lo primero que se ve y lo último que se revisa.
9. **Un producto de portfolio necesita el puente en los dos sentidos**: del sitio al código
   (bloque F) y del código al sitio (capturas en el README). Auditarlos por separado hace perder
   que es **el mismo hallazgo**.

---

## 8 · LAS HORAS DE ESTE BLOQUE

| Tramo | Reloj |
|---|---|
| Censo de documentos y lectura del quick-start | 11:20 → 11:23 |
| El clon limpio: clonar, instalar, arrancar los dos procesos, las cuatro páginas | 11:23 → 11:26 |
| Contrastes: rutas citadas, promesas de guardianes, git append-only, cifras, insignias, legales | 11:26 → 11:30 |
| Pruebas en el clon (de fondo) y análisis de las dos rojas | en paralelo |
| Redacción del informe y borrado del clon | 11:30 → cierre |
| **Total del bloque D** | **≈ 50 min** de reloj de pared |

**Cualitativo, y confirma lo que el estreno de ZetaBus decía:** **D tiene la mejor relación
hallazgo/esfuerzo** de los seis, pero **solo si se contrasta con comando**. Leer 1,43 MB de
documentación habría costado un día y no habría encontrado ni el candado a `004_DESPLAZAME` ni
el prerrequisito sin declarar: los dos salieron de **ejecutar**, no de leer. Y la parte barata
—rutas citadas, promesas de guardianes, cabeceras fechadas en git— son tres barridos de un
minuto cada uno que cubren 146 + 124 + 28×118 comprobaciones. **Lo caro fue el clon** (379 MB,
y hay que acordarse de borrarlo).
