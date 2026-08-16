# Bitácora de fallos

> El registro crudo de los fallos reales, escrito EN CALIENTE.
> No es un changelog ni una guía. Cuenta EL CASO: qué pasó, qué dio verde
> mientras pasaba, y cómo se cazó.
>
> Campo estrella (⭐): se captura al DESCUBRIR el fallo, antes de
> arreglarlo. Es el dato perecedero.
>
> Una entrada por fallo. No se fusionan.
> `NO CONSTA` = lo busqué y no está. `⏳ PENDIENTE` = aún no ha ocurrido.
>
> Orden cronológico inverso: lo más reciente, arriba.

---

## [2026-08-16] 🔴 ABIERTA — El `200` de `localhost:4200` lo daba un servidor muerto: contestaba el proceso anterior con la configuración vieja

**Categoría:** instrumento que no identifica lo que mide

**Síntoma:** tras añadir el CSS de Leaflet a `angular.json`, reinicié el servidor. El
nuevo **murió al arrancar** (`Port 4200 is already in use`, código 127) porque el anterior
seguía vivo: `TaskStop` mató el envoltorio y no al `ng serve` hijo. `curl` siguió
devolviendo **200** — lo contestaba el proceso viejo, PID 14536, con la configuración
anterior. Es el mismo `200` que llevo usando tres encargos como condición de HECHO.

**⭐ Qué dio verde mientras el fallo estaba vivo:** el `curl` de siempre. Ejecutado con el
servidor nuevo ya muerto y el viejo respondiendo:

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/
200

$ curl -s http://localhost:4200/styles.css | grep -c leaflet
0                          <- el servidor NO tiene el CSS de Leaflet

$ grep -c leaflet angular.json
2                          <- pero el fichero en disco SÍ lo declara

$ netstat -ano | grep ":4200"
  TCP    [::1]:4200    [::]:0    LISTENING    14536
```

Y el arranque que había fallado, en su propio registro:

```
> ng serve
An unhandled exception occurred: Port 4200 is already in use.
[exited with code 127]
```

**Cómo se cazó:** casualidad. El aviso automático de que la tarea de fondo había muerto
llegó **después** de que yo diera el `200` por bueno. Sin ese aviso, el checkpoint habría
dicho «200 comprobado» con un servidor de hace media hora.

**Causa raíz:** ⏳ PENDIENTE

**Arreglo aplicado:** ⏳ PENDIENTE

**Commit:** ⏳ PENDIENTE

**Ley que sale de aquí:** un `200` en un puerto fijo dice que **alguien** contesta, no
**quién**. No prueba que conteste el código de ahora. Todo arranque que se dé por bueno
tiene que comprobar además **una marca propia de la versión que se acaba de construir**
—un fichero, una cadena, un recurso nuevo— y no solo el código de estado. Y matar un
servidor no es matar su envoltorio: se confirma que el puerto queda libre.

**Traza:** `app/angular.json` (`styles`, `allowedCommonJsDependencies`) · proceso `ng
serve` PID 14536 · detectado durante el punto 3 (mapa).

---

## [2026-08-16] ✅ CERRADA — Crear `app/` dejó falso el párrafo de «Estado» del README, y vivió tres commits en un repo público

**Categoría:** documentación que caduca en silencio

**Síntoma:** el blockquote de «Estado» (`README.md` 19-21) afirma «no hay nada que
instalar ni nada que abrir en el navegador» y «lo que hay es el método de trabajo, el
plan y estos dos ficheros de licencia». Desde `baccc36` existe `app/` con 497 paquetes
instalados, arranca con `npm start` y responde en `http://localhost:4200`. Tres
afirmaciones falsas en la portada pública, vivas durante `baccc36`, `299770d` y
`726cb51`.

**⭐ Qué dio verde mientras el fallo estaba vivo:** git, preguntado por el fichero que
mentía. Ejecutado antes de tocar nada, con las tres frases falsas dentro:

```
$ git status -sb -- README.md
## main

$ git log --oneline -1 -- README.md
726cb51 docs(readme): badge de typescript a la version real

$ git diff --stat HEAD -- README.md
(sin salida)
```

Y el criterio de HECHO del encargo que introdujo el fallo —«árbol limpio, y NADA fuera
de este alcance tocado»— se cumplió entero: en el checkpoint de `baccc36` se reportó
`## main` con árbol limpio y los 22 ficheros de `app/` comprobados con 200. Todo verde.

**Cómo se cazó:** ojo humano — la costura §6 de un encargo posterior («si ves cualquier
otro dato falso, repórtalo»). No lo cazó ningún instrumento: no hay CI (`.github/` no
existe), ni hooks activos (solo `.sample`), ni pruebas, ni enlace comprobado. Nada
vigila el README.

**Causa raíz:** `git status` compara un fichero contra su última versión commiteada, y
nada más. Detecta **ediciones**; no puede detectar **afirmaciones que dejaron de ser
ciertas**, porque la verdad del README no dependía del README sino del resto del repo —
de que `app/` no existiera. Ningún instrumento ata lo que un documento afirma a los
hechos que describe. Y encima el alcance del encargo prohibía tocar el README, así que
«nada fuera del alcance tocado» convirtió el fichero caduco en criterio cumplido: el
verde no fue un descuido del método, fue el método funcionando como estaba escrito.

**Arreglo aplicado:** `README.md`, blockquote de «Estado» (hoy líneas 19-25): las tres
afirmaciones falsas se sustituyen por lo que sí es verificable contra el repo —no hay
formulario, ni motor, ni mapa; lo único que hay es el esqueleto del CLI en `app/`, que
arranca en local—, comprobado antes de escribirlo (sin `<form>`/`<input>`/`FormsModule`
en `app/src/`, sin `leaflet` instalado, `localhost:4200 → 200`). El titular «Estado: hoy
no hay aplicación» se mantiene. Y en el mismo commit, línea 77-78, el enlace a
`THIRD-PARTY-NOTICES.md` en «Licencia y créditos». Total: +10 −3, un solo fichero.

**Commit:** `7976623` (`docs(readme): el estado dice la verdad de hoy y enlaza los
notices`, 2026-08-16) — la captura de esta entrada es `2742033`, anterior al arreglo.

**Ley que sale de aquí:** añadir una pieza puede falsear un documento que el encargo
prohíbe tocar. El alcance protege el fichero de que lo editen, no de que envejezca. Todo
encargo que crea algo nuevo (`app/`, un endpoint, un dato) tiene que releer lo que la
portada afirma sobre su ausencia — antes de cerrar, no dos commits después.

*Añadido al cerrar (2026-08-16):* la ley ya no vive solo aquí — es regla transversal del
plan (`PLAN-DESPLAZAME.md` 14-16, commit `b6aba72`). Pero **el arreglo no creó ningún
instrumento**: sigue sin haber CI, hook ni prueba que mire el README. La vigilancia es
humana, así que este fallo puede repetirse; lo único que cambia es que ahora hay una
regla escrita a la que señalar cuando pase.

**Traza:** `README.md` 19-21 · introducido en `baccc36` (`chore(app): esqueleto angular
22 en app/`) · detectado en `726cb51`.
