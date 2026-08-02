# Reglas permanentes de sesión — DESPLÁZAME (004)

Esto no es documentación del proyecto: son las reglas de trabajo de este repositorio.
Se leen antes de tocar nada.

---

## Tono

- Español, informal, cero ñapas.
- Si algo no se sabe, se dice `NO CONSTA` con una línea de por qué. **Nunca se rellena con lo que
  parece razonable.**
- Toda afirmación va con su comando o su evidencia al lado. Una afirmación sin evidencia no es un
  hallazgo: es una opinión.

## Commits

- **Atómicos.** Un commit, una cosa.
- **Conventional Commits con ámbito**, asunto en español: `feat(motor): …`, `fix(grafo): …`,
  `docs: …`, `chore: …`.
- Identidad: `ablanquez`. **CERO coautoría** — no se añade `Co-Authored-By` a ningún commit,
  nunca, ni de personas ni de herramientas.
- **Push solo cuando Antonio lo diga.** Nunca por iniciativa propia.

## ⛔ Prohibido `git add -A` y `git add .`

Rutas explícitas, fichero a fichero. Siempre.

No es manía: en 001 un `git add -A` reportó *"98 ficheros, nada sensible"* mientras notas internas
viajaban a un repositorio público. Y en 003, un commit con rutas mal acotadas se llevó 1.401
líneas del documento de estado. Es la ley que más caro ha salido en este portfolio.

Antes de commitear se lee `git status` y se añade lo que se quiere añadir, mirándolo.

## ⛔ `DESPLAZAME-ESTADO.md` tiene UN SOLO ESCRITOR

Ese documento lo escribe **la conversación de estrategia**, no el ejecutor. Claude Code **no lo
crea, no lo edita y no lo borra**, ni siquiera un esqueleto vacío.

Si al trabajar se descubre algo que lo contradice, **se reporta hacia arriba** — se dice en el
chat, y decide Antonio. No se corrige por cuenta propia.

## `docs/BITACORA.md`

- La escribe el ejecutor, **EN CALIENTE**, durante el trabajo. No al final.
- **Una entrada por fallo.** No se fusionan, no se suavizan. Agrupar es borrar.
- El campo ⭐ —*qué se probó y DIO VERDE mientras el fallo estaba vivo*— se captura **al descubrir
  el fallo, antes de arreglarlo**. Es el dato perecedero: si se deja para después, se pierde.
- Hay un hook que rechaza cualquier `fix:` sin entrada nueva. Se instala con:
  ```
  git config core.hooksPath .githooks
  ```

## Los informes de `docs/` son registro histórico

`RECONOCIMIENTO-*.md` e `INVENTARIO-*.md` **se añaden, no se reescriben**. Documentan lo que se
supo en una fecha concreta. Si algo resulta estar mal, se corrige **en un documento nuevo** que
diga qué corrige y por qué — no borrando el anterior.

La única excepción ya ejecutada: la generalización de rutas locales antes de publicar el
repositorio, declarada con una nota al pie en cada fichero afectado.

## Verificación

Cuatro reglas que este proyecto ha aprendido a base de que le mintiera el instrumento:

1. **Configurar no es comprobar.** Después de configurar algo, se lee el resultado real.
2. **Todo "cero" se demuestra con un positivo de control.** Antes de afirmar "no hay X", se busca
   algo que sí está y se enseña que el buscador lo encuentra. Un cero es indistinguible de una
   búsqueda rota.
3. **Un guardián no está hecho hasta que se ha visto su rojo.** Un hook cuyo rechazo nadie ha
   provocado es una promesa, no una red.
4. **Los ficheros de configuración se prueban, no se leen.** Un patrón mal escrito en un
   `.gitignore` no falla: simplemente no coincide con nada.

## Alcance

- El motor de rutas es **código propio**. Nada de OSRM, Valhalla ni GraphHopper.
- **Fuera de la v1:** el tiempo real (posiciones de vehículos, llegadas en vivo, bicis
  disponibles).
- 004 es **independiente de 003**. Se copian **datos** y **decisiones**; nunca **maquinaria**.
