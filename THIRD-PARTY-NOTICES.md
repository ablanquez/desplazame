# Avisos de terceros

La licencia Apache 2.0 cubre **el código** de Desplázame. **No cubre lo ajeno**, que conserva sus
propias condiciones. Aquí está, una por una, con lo que sabemos y lo que no.

> ℹ️ **Estado a 16/08/2026.** El proyecto está en construcción. Hoy lo único de terceros que hay
> en él son las dependencias npm que ha traído Angular. Este documento nace con ellas y crece
> cuando entre lo demás.

---

## 1 · Datos de terceros — hoy, **ninguno**

**No hay ni un fichero de datos ajenos en este repositorio.** Ni cartografía, ni callejero, ni
portales, ni paradas. Todavía no hay nada que atribuir.

Las dos licencias de datos que regirán cuando los haya —**ODbL 1.0** para lo derivado de
OpenStreetMap y la **Ley 37/2007** para el dato municipal del Ayuntamiento de Zaragoza— están
declaradas por adelantado en el [README](README.md#licencia-y-créditos). El día que entre el
primer fichero, su ficha completa viene aquí: qué es, de dónde sale, qué permite y qué obliga.

---

## 2 · Software

### 2.1 · Dependencias declaradas como de ejecución

Las que van en `dependencies` de [`app/package.json`](app/package.json).

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `@angular/core` | 22.1.2 | MIT | El framework |
| `@angular/common` | 22.1.2 | MIT | Lo común del framework (directivas, `HttpClient`) |
| `@angular/compiler` | 22.1.2 | MIT | Compilador de plantillas |
| `@angular/forms` | 22.1.2 | MIT | Los formularios — el de cuatro campos irá aquí |
| `@angular/platform-browser` | 22.1.2 | MIT | Arrancar la aplicación en el navegador |
| `@angular/router` | 22.1.2 | MIT | ⚠️ **Instalado y sin usar** — ver la nota de abajo |
| `rxjs` | 7.8.2 | **Apache-2.0** | Flujos asíncronos; `HttpClient` los devuelve |
| `tslib` | 2.8.1 | **0BSD** | Ayudantes que emite TypeScript al compilar |

> ⚠️ **`@angular/router` está declarado aunque la aplicación no tiene router.** Se creó con
> `--routing=false` y no hay fichero de rutas ni `provideRouter` en ninguna parte —comprobado—,
> pero el CLI lo instala igual en su conjunto estándar. Se deja como lo dejó el CLI y se dice
> aquí, en vez de quitarlo por iniciativa propia. Desplázame es **una sola vista**: si sigue sin
> usarse, sobra.

> **Lo que esta tabla NO dice:** cuál de estos paquetes acaba realmente dentro del JavaScript que
> descarga el navegador. Eso lo decide el *build*, no el `package.json`, y **no está medido**:
> **NO CONSTA**. Hoy no hay ni build de producción que mirar.

### 2.2 · Dependencias de desarrollo

No se distribuyen: no viajan al navegador. Se listan igualmente, porque en la casa ya se ha
pagado el precio de una tabla incompleta.

| Paquete | Versión | Licencia | Para qué |
|---|---|---|---|
| `@angular/cli` | 22.1.4 | MIT | La herramienta: `ng serve`, `ng build`, `ng generate` |
| `@angular/build` | 22.1.4 | MIT | El constructor (esbuild + Vite por debajo) |
| `@angular/compiler-cli` | 22.1.2 | MIT | Compilación anticipada (AOT) |
| `typescript` | 6.0.3 | **Apache-2.0** | El lenguaje |
| `vitest` | 4.1.10 | MIT | El corredor de pruebas que eligió el CLI |
| `jsdom` | 28.1.0 | MIT | DOM de mentira para que Vitest pueda correr pruebas |
| `prettier` | 3.9.6 | MIT | Formateo |

### 2.3 · El árbol transitivo — existe, y no se lista aquí

Las **15 declaradas** de arriba arrastran, con todo lo suyo, **497 paquetes** instalados.
Enumerarlos aquí sería una tabla que nadie lee y que caduca en la primera actualización.

**Dónde mirarlos, que es lo que importa:** [`app/package-lock.json`](app/package-lock.json), que
está versionado precisamente para eso — cada entrada trae su versión, su origen y su licencia.

```bash
cd app && npm ls --depth=0     # las 15 declaradas
cd app && npm ls --all         # el árbol entero
```

**El reparto de licencias del árbol completo, leído del `package-lock.json` el 16/08/2026:**

| Licencia | Paquetes |
|---|---|
| MIT | 426 |
| ISC | 25 |
| BSD-2-Clause | 12 |
| **MPL-2.0** | 12 |
| Apache-2.0 | 10 |
| BSD-3-Clause | 6 |
| MIT-0 | 2 |
| **CC-BY-4.0** | 1 |
| BlueOak-1.0.0 | 1 |
| CC0-1.0 | 1 |
| 0BSD | 1 |
| **Total** | **497** |

### 2.4 · Las tres que no son MIT ni BSD

De las 497, tres familias no son la licencia permisiva de siempre. **Las tres son de desarrollo:
ninguna viaja al navegador.**

| Paquete | Licencia | Qué tiene de distinto |
|---|---|---|
| **`lightningcss`** 1.33.0 y sus **11 binarios** por plataforma | **MPL-2.0** | *Copyleft débil, por fichero.* Obliga a publicar las modificaciones **de sus propios ficheros**; no contamina el código que lo usa ni lo que produce. Es el minificador de CSS de `@angular/build`: **procesa** nuestro CSS, no se mezcla con él |
| **`caniuse-lite`** 1.0.30001809 | **CC-BY-4.0** | Es **datos**, no código: la tabla de compatibilidad de navegadores que usa browserslist. CC-BY **exige atribución** — y esta línea es la atribución |
| **`lru-cache`** 11.5.2 | **BlueOak-1.0.0** | Permisiva y aprobada por la OSI. Solo es infrecuente |

### 2.5 · Resumen de compatibilidad

**Las 15 dependencias declaradas son MIT, Apache-2.0 o 0BSD**: permisivas, sin copyleft, y
compatibles con la Apache 2.0 de este proyecto sin ninguna condición añadida. **No hay ninguna
sorpresa entre ellas.**

En el árbol transitivo aparecen tres licencias menos habituales (§ 2.4). Ninguna bloquea nada:
la única con copyleft —MPL-2.0— es débil, por fichero, y está en una herramienta de *build* que
no se redistribuye. La única que obliga a algo —CC-BY-4.0— obliga a atribuir, y queda atribuida
arriba.

> **Y lo que este documento no garantiza:** el reparto de licencias de § 2.3 sale del campo
> `license` que cada paquete declara en el `package-lock.json`. **No se ha abierto el `LICENSE` de
> los 497 para comprobar que dicen la verdad**, y un paquete puede declarar mal. Las **15
> declaradas sí** se han mirado una a una. Del resto: **NO CONSTA**.
