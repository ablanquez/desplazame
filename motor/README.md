# El motor

Servidor de rutas sobre `node:http`. **Cero dependencias** en producción: lo único
que se instala es `@types/node`, y solo para comprobar y compilar.

## Desarrollo

```bash
npm start --workspace @desplazame/motor    # node src/servidor.ts — sin compilar
```

Node ejecuta el TypeScript **borrando los tipos**, así que en local no hay build:
se edita un `.ts` y se reinicia. Es la forma de trabajar de siempre y no cambia.

## Producción

```bash
npm run build --workspace @desplazame/motor    # tsc → motor/dist
node motor/dist/servidor.js                    # el entry, JavaScript de verdad
```

⭐ **El build existe porque el panel de Hostinger EXIGE un Entry file `.js`, `.mjs`
o `.cjs`** —está en su documentación de *Build Settings*—, y `src/servidor.ts` no
lo es. `dist/` es JavaScript plano: no necesita que Node sepa borrar tipos.

⭐ **Y el Entry file del panel es `motor/arranque.cjs`, no `motor/dist/servidor.js`.**
Su lanzador (`lsnode`) carga el entry con `require()`, y este motor es ESM con
*top-level await* a conciencia —`await cocinarYServir(…)`: la red de bus cocinada
**antes** de escuchar, para no contestar «no hay red» a quien llegue primero—.
`require()` no puede con eso y muere con `ERR_REQUIRE_ASYNC_MODULE`, que fue el
segundo 503 del 8/09. `arranque.cjs` es el puente de una línea que el propio
error de Node dicta: `import('./dist/servidor.js')`.

El puerto sale del entorno: **`PORT`, y 3000 si no está** [12factor, *port
binding*]. En Hostinger lo pone el panel; en local no hace falta tocar nada.

```bash
PORT=3005 node motor/dist/servidor.js
```

⚠️ **`dist/` está en `.gitignore` y se regenera**: no se edita a mano, no se
versiona, y lo que valga se arregla en `src/`.

## Lo que hay que saber antes de desplegar

- **Node ≥ 22**, declarado en `engines`. Es el que el panel trae por defecto.
- **Los datos NO se copian a `dist/`**. El motor los lee de `app/data/` y
  `motor/data/` por rutas relativas al módulo, y `dist/` está a la misma
  profundidad que `src/`, así que las mismas rutas valen desde los dos sitios —
  comprobado arrancando desde `dist` el 8/09, no deducido. Al desplegar tiene que
  subir **el repositorio entero**, no solo `motor/dist/`.
- **El build es autosuficiente**, y está medido en un árbol limpio (8/09): sin
  `node_modules`, sin `.env.local`, sin el feed vivo y sin el cocinado del bus,
  `npm ci` tarda **36 s** y `npm run build` **3 s** —el panel da 15 min por
  fase—. `dist` queda en **1,6 MB** (915.260 bytes de `.js`, el resto mapas).
  El motor arranca en **9 s** cocinando la red de bus desde la semilla.

- **Las jueces no se emiten** (`tsconfig.build.json` excluye los `*.spec.ts`), y
  se siguen comprobando igual con `npm run comprobar-tipos`.

## El log

El motor escribe en `stdout` **y además** en `motor/logs/AAAA-MM-DD.log`, con la
hora —en UTC, como todo lo que imprime— y el nivel delante de cada línea:
`I` nota, `W` aviso, `E` error.

```bash
tail -f motor/logs/$(date -u +%F).log
```

Uno por día, y los de más de **14** se borran solos al arrancar.

⚠️ **El nombre del fichero es un día UTC, y el nombre no lo dice.**
`2026-09-08.log` sale de `toISOString()`, así que en Zaragoza las líneas de
00:00 a 02:00 del día 9 caen en el fichero llamado `08`. No se renombra a
propósito: **las líneas de dentro sí llevan la `Z` explícita** —medido el 8/09,
todas— y el arranque anuncia la ruta entera, así que el dato está. Meter la
zona en el nombre costaría más de lo que aclara. La carpeta está
en `.gitignore`: es un testigo de lo que pasó en esta máquina, no un dato del
proyecto.

⚠️ **El fichero no releva a `stdout`**: el panel de Hostinger enseña los logs
del proceso y esa ventana sigue haciendo falta. Y **el registro no puede tumbar
al motor**: si el disco falla, se pierde la línea y se sigue.
