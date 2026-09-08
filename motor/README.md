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
- **Las jueces no se emiten** (`tsconfig.build.json` excluye los `*.spec.ts`), y
  se siguen comprobando igual con `npm run comprobar-tipos`.
