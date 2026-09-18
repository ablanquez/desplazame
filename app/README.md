# Desplazame

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

⚠️ **Aquí no se llama a `ng build` a pelo.** Desde el 18/09 la orden es:

```bash
npm run construir --workspace desplazame
```

`ng build` **vacía la carpeta de salida antes de construir** —lo dice la
documentación de Angular—, y aquí `app/dist/` está versionado y el `git push`
**es** el despliegue: una build que se cae a mitad deja el `dist` a medias y eso
es un 404 en producción. Así que construye
[`scripts/construir.mjs`](scripts/construir.mjs): a un temporal hermano, y solo
publica —por renombrado— si la build salió entera. Una build fallida **no toca
ni un byte** del `dist` anterior. Lo que publica lleva su marca `.build-ok`.

Antes de commitear el `dist`, la comprobación previa:

```bash
npm run comprobar-dist --workspace desplazame
```

Se niega si el `dist` no lleva marca, si el bundle no cuadra con ella, o si hay
restos de un swap a medias. La misma comprobación la corre sola la jueza
`src/app/construir.spec.ts` en cada batería de unidad.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## ⭐ El `dist/` está VERSIONADO, y es un apaño fechado (8/09/2026)

`app/dist/` **entra en el repositorio**. No es lo normal y no se queda para
siempre: es lo que hace que la app llegue al servidor hasta que el panel pueda
construirla él.

### La medición que lo exige

Medido por SSH en el servidor el 8/09. El CLI de Angular 22.1 **se niega en
seco**:

> *«requires a minimum Node.js version of v22.22.3 or v24.15.0»*

y el panel de Hostinger ofrece **22.18.0 y 24.6.0** —las dos medidas ahí
mismo—. Ninguna llega. Así que **el build no puede correr en el panel**, y lo
que se despliega tiene que ir ya construido.

### Por qué así y no de otra forma

Es el camino que la propia documentación de Angular describe
[angular.dev/tools/cli/deployment, literal]: *«ng build genera los artefactos en
dist/… **copia este directorio al servidor** y configura el servidor para
servirlo»*. Aquí el transporte es el `git push`, porque el push **es** el
despliegue.

### Lo que pesa, medido

```
dist entero : 13 ficheros · 583.727 bytes
solo browser: 11 ficheros · 565.236 bytes   ← la raíz que el motor sirve
el mayor    : browser/main-<hash>.js · 324.130 bytes
```

⚠️ **Los nombres llevan hash** (`outputHashing: all`), así que **cada build
   cambia los ficheros y el anterior queda como basura**. Antes había que borrar
   `app/dist` a mano al reconstruir; **desde el 18/09 no**: el guardián construye
   a un temporal y **sustituye la carpeta entera** por renombrado, así que no
   quedan restos de la build anterior ni hay un momento en que el `dist` esté a
   medias por un fallo.

### Cuándo se revisa

Cuando el panel de Hostinger ofrezca **Node ≥ 22.22.3 o ≥ 24.15.0**. Ese día:
`ng build` vuelve al panel, `app/dist/` vuelve al `.gitignore` —a `/dist`, donde
estaba— y esta sección se borra. Mientras tanto, sigue aquí con su fecha.

⚠️ **El `dist/` del MOTOR no se versiona**: ese sí lo construye el panel
   (`tsc`, que no exige nada raro). Solo viaja el de la app.
