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

## [2026-08-16] 🔴 ABIERTA — Crear `app/` dejó falso el párrafo de «Estado» del README, y vivió tres commits en un repo público

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

**Causa raíz:** ⏳ PENDIENTE

**Arreglo aplicado:** ⏳ PENDIENTE

**Commit:** ⏳ PENDIENTE

**Ley que sale de aquí:** añadir una pieza puede falsear un documento que el encargo
prohíbe tocar. El alcance protege el fichero de que lo editen, no de que envejezca. Todo
encargo que crea algo nuevo (`app/`, un endpoint, un dato) tiene que releer lo que la
portada afirma sobre su ausencia — antes de cerrar, no dos commits después.

**Traza:** `README.md` 19-21 · introducido en `baccc36` (`chore(app): esqueleto angular
22 en app/`) · detectado en `726cb51`.
