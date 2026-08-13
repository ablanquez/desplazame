# TANDA DE ARREGLO 10 — LA BATERÍA DICE DESDE DÓNDE

**Qué arregla:** que el veredicto de la batería dependiera del intérprete de
órdenes desde el que se lanzara. **Qué mide antes de arreglar:** cuántos
guardianes más tienen la misma enfermedad.

⛔ **No se toca la lógica de ningún guardián: solo su capacidad de ejecutarse y de
declarar dónde se ejecutó.** ⛔ No se toca `src/grafo.js` ni `src/ruta.js`.

⚠️ **Nota sobre el nombre del fichero:** los dos anteriores se llaman
`H1-ARREGLO-8-…` y `H1-ARREGLO-9-…` porque reabrían H1. **Éste no reabre H1**:
toca el instrumento con el que se cierran todas las tandas, de cualquier hito.
Por eso va sin prefijo de hito. *Se dice para que nadie lea la ausencia como un
descuido.*

---

## 1 · ⭐⭐⭐ ¿CUÁNTOS GUARDIANES DEPENDEN DEL ENTORNO?

### 1.1 · Cómo se ha averiguado — ⛔ y esto es la mitad de la respuesta

Se ha hecho **de las dos maneras, y las dos se declaran**, porque *un `grep` que
busca lo que ya sospechas confirma, no mide*:

| | qué es | qué puede contestar | qué NO puede |
|---|---|---|---|
| **A · barrido por patrón** | `grep` de `child_process`, `spawnSync`, `execSync`, `execFile…` sobre `src/` | dónde está escrito el riesgo | si esa línea **se ejecuta**, cuántas veces, y **si el binario está** |
| ⭐ **B · instrumentación** | un `--require` que engancha `spawn`/`spawnSync`/`exec`/`execSync`/`execFile*`/`fork` y anota **cada lanzamiento real**, propagado a los hijos por `NODE_OPTIONS` | **qué se lanza de verdad**, cuántas veces y **con qué error** | lo que no se ejecutó en esa pasada |

⭐ **Positivo de control del espía, antes de creerle un número:** contra tres
llamadas conocidas anota las tres, y **distingue la que no existe**
(`ENOENT`) de las que sí.

⭐⭐ **Y el control que hace falta para que la medida valga: instrumentar no
cambió la salida.** La batería instrumentada y la batería limpia, desde el mismo
intérprete, dan **`diff` VACÍO sobre las 114 líneas.** *Si el instrumento hubiera
movido lo medido, no estaría midiendo la batería: estaría midiendo otra cosa.*

### 1.2 · ⭐⭐ La medida — 178 lanzamientos reales

Instrumentando `node src/probar-paradas.js --todo` **desde PowerShell**, que es
donde el fallo se ve:

```
   anotaciones totales                          178
     lanzan el PROPIO node (process.execPath)    95   ✅ portátil: no es un binario del entorno
     lanzan un BINARIO AJENO                     83   ⚠️ y son solo DOS scripts

   scripts que lanzan ALGÚN proceso               8
     …de ellos, con binario AJENO                 2   ⇒ 2 de 8, y 2 de los 64 ejecutables
```

| guardián | binario | veces | ¿está en PowerShell? |
|---|---|---|---|
| `probar-hook.js` | **`git`** | **82** | ✅ sí — `C:\Program Files\Git\cmd\git.exe` |
| `auditoria-guardianes.js` | **`bash`** | **1** | ⛔ **NO — `ENOENT`** |

⇒ ⭐ **La respuesta a «¿cuántos?» es DOS, y la frontera no es la que parecía.**
No es *«Git Bash sí y PowerShell no»*: es que **`git` está en el PATH del sistema
y `usr\bin` de Git no lo está**. Medido:

```
   binario   desde PowerShell                   desde Git Bash
   git       C:\Program Files\Git\cmd\git.exe   /mingw64/bin/git
   bash      NO ESTÁ                            /usr/bin/bash
   grep      NO ESTÁ                            /usr/bin/grep
   wc        NO ESTÁ                            /usr/bin/wc
```

⭐ **Y esta vez el patrón y la instrumentación coincidieron:** el `grep` no se
dejó ninguno. **Pero eso solo se sabe porque se midió** — y la instrumentación
añadió tres cosas que el patrón no podía dar: **cuál falla aquí**, **cuántas
veces corre cada uno** (82 contra 1) y **que las otras 95 llamadas son a
`process.execPath`**, que no es una dependencia del entorno.

### 1.3 · ⛔⛔ Los dos NO son el mismo caso — y el segundo es PEOR

Se ha medido, no razonado: `probar-hook.js` ejecutado **con un PATH sin `git`**.

```
   EXIT 1   ·   15 FALLOS   ·   y lo que dicen:
      · el hook: «VERDE · `fix:` CON la entrada en el mismo commit» esperaba acepta y salió rechazo
      · el hook: «VERDE · `git commit --amend` (falso positivo nº1)» esperaba acepta y salió rechazo
      · el hook: «VERDE · un commit que NO es `fix:` y no lleva entrada» esperaba acepta y salió rechazo
```

⇒ ⛔⛔ **No sale en verde en silencio —eso sería lo peor— pero ACUSA A QUIEN NO
ES.** Sin `git`, este guardián publica **quince fallos contra el hook
`commit-msg`**, que está perfectamente bien. *El mensaje de un guardián es una
afirmación sobre la causa*, y ésta es falsa.

| | `auditoria-guardianes.js` | `probar-hook.js` |
|---|---|---|
| binario | `bash` | `git` |
| ¿falta aquí? | **sí, y por eso mordió** | no |
| qué dice al faltar | ⭐ *«no puedo verificar mi censo»* — **verdad** | ⛔ *«el hook rechaza lo que debía aceptar»* ×15 — **falso** |
| clase | **A1 · declara la causa correcta** | **A2 · declara una causa falsa** |

⛔ **Y aquí se para, como manda el encargo:** se arregla **uno** —el que muerde
hoy y el que es la batería— y **el otro se cuenta, se clasifica y se reporta.**
Arreglar una familia es otra tanda y la decide Antonio.

### 1.4 · ⚠️ El punto ciego del espía, acotado y no escondido

**21 de las 178 llamadas pisan `NODE_OPTIONS`** —`probar-modelo-obligatorio.js`
18 y `numeros-congelados.js` 3— porque precargan su propio testigo de mutación.
**A sus nietos el espía no llega.**

⭐ Pero el agujero está **acotado, y se enseña**: las 21 lanzan `node` con
**scripts de `src/` que el barrido ya midió directamente** (`ruta.js`,
`modelo.js`, `exportar*.js`, `numeros-congelados.js`, `calle-pegada.js`,
`parques.js`, `puerta.js`, `donde-falta.js`, `nombrar-aceras.js`, `paso-de-cebra.js`,
`rutas-antonio.js`) más tres `node -e`. ⇒ **Lo que no se ve por ahí se ve por el
otro lado.** No es un cero demostrado: es un agujero medido y tapado por
solapamiento.

### 1.5 · Las otras clases de dependencia del entorno, contadas y NO arregladas

| clase | dónde | veredicto |
|---|---|---|
| **B · el propio Node** | 95 llamadas a `process.execPath` | ✅ portátil por construcción |
| **C · temporales y separadores** | `os.tmpdir()` + `.split(path.sep).join('/')` en 9 ficheros | ✅ ya escritas de forma portátil |
| **D · ICU / locale** | `numeros-congelados.js:307` usa `toLocaleString('es-ES', …)` | ⚠️ esta máquina trae **ICU completo 78.2** y `es-ES` soportado. **En un Node con `small-icu` el separador de millares cambiaría** y ese script imprimiría otros números. **No cambia el veredicto de la batería** —solo su propia salida— y **NO se toca** |
| **E · la codificación de la captura** | no está en `src/`: está en cómo se redirige | ⛔ **es el otro medio problema**, y se resuelve en §3 |
---

## 2 · LOS DOS ARREGLOS — cada uno nace rojo y se enseña en rojo

### 2.1 · `auditoria-guardianes.js` — el que decía la verdad

**⛔ ANTES, desde PowerShell, con el código de aquel commit** *(batería base,
17:44:57 → 18:05:09)*:

```
   línea 30    auditoria-guardianes.js   código 1   2 de 1  declara  ⛔ DECLARA 2 Y SE ESPERABAN 1
   línea 114   ⇒ ⛔ HAY UN CAMINO POR EL QUE UN FALLO SIGUE SALIENDO EN 0.
```

y el mismo commit desde Git Bash *(18:26:45 → 18:45:31)*, **`exit 0`**. El `diff`
entre las dos capturas base cabe entero aquí:

```
   30c30
   <    auditoria-guardianes.js   código 1       2 de 1  declara    ⛔ DECLARA 2 Y SE ESPERABAN 1
   ---
   >    auditoria-guardianes.js   código 1       1 de 1  declara    ✅
   114c114
   <    ⇒ ⛔ HAY UN CAMINO POR EL QUE UN FALLO SIGUE SALIENDO EN 0.
   ---
   >    ⇒ ✅ UN FALLO DETECTADO YA NO PUEDE TERMINAR EN VERDE.
```

**El arreglo:** **dos contadores en vez de uno**, y el nuevo no lanza nada.

| testigo | qué es | cuándo |
|---|---|---|
| `bash` · `grep -o \| wc -l` | ⭐ **AJENO** — programa escrito por otra gente | **cuando el entorno lo tiene**. No se retira: es el fuerte |
| recuento literal sobre el texto crudo | propio, `indexOf`, **sin `split('\n')` ni expresiones regulares** — justo las dos piezas del extractor que podrían fallar | **siempre** |

⚠️ **Y lo que se pierde al portarlo, escrito en el código y no escondido:** el
portátil **es independiente del EXTRACTOR** —que es lo que pide la ley de los dos
testigos— pero **no es independiente ni del autor ni del intérprete**. Es un
testigo más débil que `grep`, y por eso `grep` se queda.

⛔ **Lo que NO se ha hecho, porque sería peor que el rojo:** dar el censo por bueno
cuando no se puede contar. Si el portátil devolviera 0, esto sigue en rojo
—`A·exige(nBytes > 0, …)`—.

**✅ DESPUÉS, el mismo commit desde los dos entornos:**

```
   GIT BASH                                        POWERSHELL
   el extractor encuentra                329       el extractor encuentra                329
   `bash` · grep -o | wc -l              329       `bash` · grep -o | wc -l   ⚠️ NO CONSTA
   recuento literal                      329       recuento literal                      329
   ⭐ ¿cuadran los 2 contadores? ✅ sí              ⭐ ¿cuadran los 1 contadores? ✅ sí
   ⛔ 1 FALLO(S) DETECTADO(S)                      ⛔ 1 FALLO(S) DETECTADO(S)
```

⭐ **Mismo veredicto, y el que no tiene el testigo ajeno LO DICE.** No se calla la
pérdida: publica `NO CONSTA` y cuántos contadores le quedan.

**⭐⭐ Y la provocación, porque un contador que nadie ha visto equivocarse es una
promesa:** se le planta un directorio de mentira con **4 llamadas de verdad**, **4
cosas que se le parecen y no lo son** (`B.exige(`, `A.exigencia(`, `A.exige` con
el paréntesis en la línea siguiente, y una en un comentario sin paréntesis) y
**una en un fichero que no es `.js`**. Cuenta **4**. ✅

⚠️ Detalle que parece menor y no lo es: las tres agujas del contador van
**concatenadas** (`'A.exige' + '('`). Escritas de una pieza, el propio fichero
contendría tres llamadas de mentira y **los tres contadores las contarían** —
cuadrarían igual, pero el censo publicaría tres comprobaciones que no existen.

### 2.2 · `probar-hook.js` — el que mentía

**⛔ ANTES, con `git` fuera del PATH y el código de hoy:** medido, no razonado.

```
   EXIT 1   ·   ⛔ 13 FALLO(S) DETECTADO(S)

   ⛔ FALLO · el hook no se ejecuta en el repositorio de prueba: los siete casos serían falsos   ← ⭐ VERDAD
   ⛔ FALLO · el hook: «VERDE · `fix:` CON la entrada en el mismo commit» esperaba acepta y salió rechazo
   ⛔ FALLO · el hook: «VERDE · `git commit --amend` (falso positivo nº1)» esperaba acepta y salió rechazo
   ⛔ FALLO · el hook: «VERDE · un commit que NO es `fix:` y no lleva entrada» esperaba acepta y salió rechazo
   … (12 en total de esta clase)                                                                ← ⛔ MENTIRA
```

⛔⛔ **Doce acusaciones falsas contra un hook `commit-msg` que está perfecto.**

⚠️⚠️ **Y lo peor no es que fallara: es que YA LO SABÍA.** El primero de los trece
—la palanca— dispara bien y dice literalmente *«los siete casos serían falsos»*.
**Seis líneas más abajo ejecuta los siete casos y publica sus doce fallos.** La
refutación estaba impresa **encima** de las acusaciones, en la misma ejecución.

**El arreglo: TRES ESTADOS, NO DOS.** Antes de nada, `git --version`. Si no se
puede ejecutar: se declara **un fallo verdadero** y ⛔ **no se ejecuta ni un
caso**.

```
   ✅ DESPUÉS, con `git` fuera del PATH:

   `git --version`                     ⛔ NO SE PUEDE EJECUTAR — ENOENT
   ⛔ FALLO · no se puede ejecutar `git` en este entorno: este guardián NO PUEDE
              comprobar el hook. Los siete casos NO se ejecutan, porque sus
              veredictos acusarían al hook de un fallo que es del entorno
   ⛔⛔ NO SE EJECUTA NINGÚN CASO
   ⛔ 1 FALLO(S) DETECTADO(S)          EXIT 1
```

⇒ **De 13 fallos (12 falsos) a 1 verdadero. Y sigue en rojo: no absuelve.**

**⭐ Y el uno que acompaña al cero: ¿sigue sabiendo acusar CUANDO TOCA?** Con `git`
disponible, contra tres hooks distintos:

| hook puesto | casos que el guardián denunciaría | |
|---|---|---|
| ⭐ **el REAL, intacto** *(positivo de control)* | **0 de 7** | ✅ |
| saboteado · **acepta todo** *(deja de vigilar)* | **2 de 7** | ✅ los dos ROJO |
| saboteado · **rechaza todo** *(vigila de más)* | **5 de 7** | ✅ los cinco VERDE |

⛔ **El arreglo no le ha quitado los dientes: le ha quitado la lengua cuando no
tiene ojos.**

**✅ Y el mismo commit desde los dos entornos, con `git` presente:**

```
   GIT BASH     `git --version` ✅ git version 2.51.2.windows.1 · 7 de 7 · exit 0
   POWERSHELL   `git --version` ✅ git version 2.51.2.windows.1 · 7 de 7 · exit 0
```
## 3 · ⭐⭐⭐ DÓNDE VIVE LA DECLARACIÓN DE ENTORNO, Y QUÉ ROMPE

La batería tiene ahora un bloque `⚑ ENTORNO` que dice sistema, versión de Node,
arquitectura, ICU, intérprete y **qué binarios externos existen aquí**.

**Y sale por `stderr`, no por `stdout`. El argumento, que es lo que hay que
juzgar y no la decisión:**

⛔ **La salida de esta batería es el ARTEFACTO que se compara con `diff` antes y
después de cada tanda, y ese `diff` está ahí para detectar cambios en el
REPOSITORIO.** Si dentro de las 114 líneas va la versión de Node o el nombre del
intérprete, **ningún `diff` entre dos máquinas puede volver a salir vacío** y la
contraprueba de cierre deja de servir para lo único que sirve.

⇒ ⭐ **Lo que depende del repositorio va por stdout y se compara. Lo que depende
de la máquina va por stderr y se lee.**

⭐⭐ **Y no es una invención de esta tanda: es la puerta que este proyecto ya se
había puesto**, en `src/ruta.js:77-78`, para el sello del grafo —

> *«todo grafo construido se DECLARA por stderr, siempre, sin escotilla. Va por
> stderr y no por stdout para no ensuciar el JSON del motor.»*

— aplicada al instrumento con el que se cierran las tandas en vez de al motor. Y
allí hay además un guardián (`src/auditoria-grafo.js`) que comprueba que nadie se
salte esa puerta.

**Qué rompe esta decisión, dicho antes de que nadie lo descubra:** por stderr, el
entorno **no entra en una captura hecha con `>`**. Una captura suelta seguiría sin
decir de dónde viene. ⇒ Por eso va con su remedio:

### `--capturar <fichero>` — el artefacto y su entorno, a la vez

```
node src/probar-paradas.js --todo --capturar salida.txt
   → salida.txt          las 114 líneas comparables, UTF-8 SIN BOM, saltos \n
   → salida.txt.entorno  el bloque ⚑ ENTORNO de esa misma ejecución
```

⭐ **Y esto arregla de paso el otro motivo por el que dos capturas del mismo
commit no se podían comparar:** la redirección de PowerShell le pone **BOM** al
fichero y la de Bash no, así que **un `diff` entre una captura de cada intérprete
no podía salir vacío ni aunque el contenido fuese idéntico** — el comparador ni
siquiera podía comparar. Escribiendo el fichero desde Node, la codificación deja
de depender del intérprete.

⚠️ **Lo que NO cambia, y va dicho:** las 114 líneas siguen siendo 114. El bloque
de entorno no está dentro. Cualquier captura anterior sigue siendo comparable con
cualquier captura nueva **hecha del mismo modo**.

---

## 4 · ⭐⭐ QUÉ VALE UN «DIFF VACÍO»

**En una línea:**

> ⭐⭐⭐ **Un `diff` vacío demuestra que la SEGUNDA ejecución coincide con la
> primera. No demuestra que ninguna de las dos sea correcta, ni que la primera
> midiera lo que decía, ni que la comparación fuera posible.**

**Lo que demuestra:** que entre las dos ejecuciones **nada del repositorio movió
la salida**. Eso es exactamente para lo que se puso, y para eso sirve.

**Lo que NO demuestra, con el caso de ayer al lado:**

| | |
|---|---|
| que la salida sea correcta | ⛔ **el 13/08 salió vacío entre dos ejecuciones que declaraban un fallo que no existía**: reproducible y equivocada a la vez |
| que las dos capturas sean comparables | ⛔ con BOM de por medio **no puede salir vacío nunca**, y eso se lee como «hay cambios» |
| que el veredicto sea el mismo | ⛔ **dos rojos idénticos también dan diff vacío** |
| que la batería haya mirado algo | ⛔ una batería que dejara de comprobar daría el mismo vacío que una que comprueba |

### ⛔ PROPUESTA, NO IMPOSICIÓN — cambiar el rito de cierre lo decide Antonio

Que el `diff` vacío del cierre vaya acompañado de **cuatro cosas**, ninguna cara:

1. **El código de salida de las dos**, escrito. *Un diff vacío entre dos rojos es
   un diff vacío.*
2. **El entorno de las dos** —ahora existe el fichero— y si son el mismo. *Si no
   lo son, el vacío vale MÁS, no menos: significa que el resultado no depende de
   la máquina.*
3. **El número de líneas de las dos.** Una captura truncada a la mitad también
   puede coincidir consigo misma.
4. ⭐⭐ **Un positivo de control del propio comparador.** *Un guardián no está
   hecho hasta que se ha visto su rojo* — y el `diff` de cierre es un guardián al
   que **nadie le ha provocado nunca una diferencia**. Basta enseñar UNA
   comparación que salga NO vacía en la misma sesión.

⭐ **Y en esta tanda ese control sale gratis y en el sitio exacto:** la
comparación entre la captura de PowerShell y la de Git Bash **da diferencia antes
del arreglo y vacío después**. La misma comparación que demuestra que el arreglo
funciona demuestra que el comparador no está ciego.
---

## 5 · LAS BATERÍAS — cuatro, y desde los dos entornos

```
   BASE     PowerShell   17:44:57 → 18:05:09   ⛔ exit 1   114 líneas
   BASE     Git Bash     18:26:45 → 18:45:31   ✅ exit 0   114 líneas
                         ⇒ diff entre las dos: 2 LÍNEAS (§2.1). Mismo commit.

   CIERRE   Git Bash     18:50:53 → 19:09:20   ✅ exit 0   114 líneas
   CIERRE   PowerShell   19:09:52 → 19:28:41   ✅ exit 0   114 líneas
```

**Las tres comparaciones, y cada una contesta una cosa distinta:**

| comparación | resultado | qué demuestra |
|---|---|---|
| base Bash **vs** cierre Bash | ✅ **DIFF VACÍO** sobre 114 líneas | el arreglo **no movió nada** de lo que la batería vigila |
| ⭐⭐⭐ cierre PowerShell **vs** cierre Git Bash | ✅ **DIFF VACÍO** sobre 114 líneas | **el mismo commit da el mismo veredicto en los dos entornos.** Es la prueba de la tanda |
| ⭐ base PowerShell **vs** base Git Bash | ⛔ **2 líneas de diferencia** | **el positivo de control del propio comparador**: el `diff` SABE ver una diferencia cuando la hay |

⭐⭐ **Ese tercer renglón es el que faltaba en el rito de cierre**, y aquí sale
gratis: *un guardián no está hecho hasta que se ha visto su rojo*, y el `diff` de
cierre es un guardián al que **nadie le había provocado nunca una diferencia**.
Las mismas dos capturas que enseñan el fallo enseñan que el comparador funciona.

**Y el BOM, medido en los tres primeros bytes de cada captura:**

```
   base PowerShell   (redirección `>`)          ef bb bf     ⛔ BOM
   cierre PowerShell (`--capturar`)             3d 3d 3d     ✅ «===», sin BOM
```

⇒ **Antes, un `diff` entre una captura de PowerShell y una de Bash no podía salir
vacío ni siendo idénticas.** Ahora las dos capturas del cierre son **byte a byte
la misma**, hechas desde intérpretes distintos.

**Los dos entornos, declarados por las propias capturas:**

```
   ⚑ ENTORNO · shell=C:\Program Files\Git\bin\bash.exe
   ⚑ ENTORNO · binarios externos:  bash=GNU bash, version 5.2.37(1)-release  |  git=git version 2.51.2.windows.1

   ⚑ ENTORNO · shell=C:\Windows\system32\cmd.exe
   ⚑ ENTORNO · binarios externos:  bash=NO ESTÁ                              |  git=git version 2.51.2.windows.1
```

⭐ **Y aquí el `diff` vacío vale MÁS, no menos:** las dos capturas coinciden
**aunque los entornos NO coincidan**. Eso es exactamente lo que ayer no se podía
decir.
---

## 6 · ⚠️ QUÉ ENTORNO **NO** SE HA PROBADO

⛔ **Una máquina sin Git Bash instalado.** Aquí `bash` no está *en el PATH de
PowerShell*, pero **existe en el disco**. La pregunta *«¿daría el mismo veredicto
una máquina donde Git Bash no esté instalado?»* — ⭐ **la respuesta razonada es
que sí, y la razón es de diseño, no de suerte**: el contador portátil no lanza
nada, y `probar-hook.js` declara su incapacidad en vez de acusar. ⚠️ **Pero
razonado no es medido, y no se ha medido.**

⛔ **Un Linux o un macOS.** Todo lo de aquí es Windows 10 con Git for Windows.
⛔ **Un CI.** Que es, exactamente, donde el fallo de ayer habría vivido para
siempre sin que nadie lo viera — y donde `git` puede no estar.
⛔ **Un Node con `small-icu`**, donde `numeros-congelados.js` imprimiría otros
separadores de millar. Se ha contado (§1.5) y **no se ha tocado**.
⚠️ **Un `PATH` sin `git` PERO con `bash`** se ha probado, y al revés no: no hay
forma cómoda en esta máquina de tener `bash` sin tener `git`.
⚠️ Y **no se ha probado ningún tercer intérprete** —`cmd.exe`, `pwsh` 7— aunque el
bloque `⚑ ENTORNO` los distinguiría si alguien los usara.

---

## 7 · LO QUE ESTA TANDA REPORTA HACIA ARRIBA

1. ⭐⭐⭐ **La ley 163 queda cerrada por los dos lados**, que era el motivo de
   ampliar el alcance: el que decía la verdad ya no depende de `bash`, y el que
   mentía ya no miente. **El mismo commit da el mismo veredicto desde los dos
   entornos.**
2. ⛔ **No ha aparecido un tercero.** De **64 ejecutables**, los que lanzan un
   binario ajeno eran **2**, y son los dos arreglados. Las otras **95** llamadas
   son a `process.execPath`. *Medido instrumentando, no buscando.*
3. ⚠️ **`numeros-congelados.js` depende del ICU** (`toLocaleString('es-ES', …)`).
   **No cambia el veredicto de la batería** —solo su propia salida— y **no se ha
   tocado**. Queda contado. (§1.5)
4. ⭐⭐ **PROPUESTA sobre el rito de cierre, que decide Antonio:** que el `diff`
   vacío vaya con cuatro acompañantes —códigos de salida, entornos, número de
   líneas y **un positivo de control del propio comparador**—. (§4)
5. ⚠️ **El nombre del fichero rompe la serie** `H1-ARREGLO-8/9`: éste no reabre
   H1. Se dice para que la ausencia del prefijo no se lea como un descuido.
6. ⚠️ **El punto ciego del espía** —21 llamadas que pisan `NODE_OPTIONS`— está
   **acotado por solapamiento, no cerrado.** (§1.4)
