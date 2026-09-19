# Diagnóstico de encaje: el código de agosto contra la app de hoy

La app cambió entera desde el 22/08. Esto es qué del código recuperado sigue
casando, qué choca, y **qué pesaría** — con cifras, no con impresiones.

## Resumen en una línea

De las 2.174 líneas recuperadas: **1.173 casan sin tocar una coma**, **712
chocan de frente** —los pinceles— y **289 se tiran**, que son el resto del
`mapa.ts` de agosto, un fichero que ya siguió su vida sin ellas. Y los 712 no
chocan por lo que hacen, sino por **dónde viven**. Ahí está todo el problema de
esta fase.

## a) Lo que CASA, y por qué

| fichero | líneas | por qué casa |
|---|---:|---|
| `capas.ts` | 677 | Solo importa `Injectable`/`signal`/`Signal` de Angular y `type Vertice` de `@desplazame/tipos`. **`Vertice` sigue existiendo igual** (`tipos/src/index.ts:162`, `readonly [number, number]`). No toca el mapa, ni el tema, ni el motor. |
| `capas.spec.ts` | 221 | Sus diez juezas montan rasgos de mentira, no leen ficheros: el censo re-firmado **no las mueve**. |
| `visor.ts` · `.html` · `.css` | 85 | `<app-mapa [alto]="alto" />` sigue compilando: el `Mapa` de hoy conserva el selector `app-mapa` y la entrada `alto = input('22rem')`, **mismo nombre y sigue siendo opcional**. |
| `visor.spec.ts` | 190 | Casa como código; lo que vigila depende de los pinceles. Ver abajo. |

⚠️ **Casan como código, no como prosa.** Las cifras escritas en los comentarios
de `capas.ts` son de agosto y el censo se re-firmó ayer: 7.391→7.424,
1.159→1.177, 2.636→2.656, 1.226→1.236. Están listadas una a una en
`INVENTARIO.md`. Entran en fase 2 **con esas cifras corregidas**, o el fichero
miente desde el primer día.

## b) Lo que CHOCA: los 712 pinceles

`mapa.ts` de agosto tenía 1.001 líneas; el de hoy tiene **1.019**. Parece lo
mismo y no lo es:

    git diff 6327e45^:app/src/app/mapa.ts HEAD:app/src/app/mapa.ts
    → 872 insertions(+), 854 deletions(-)

Es prácticamente otro fichero. Lo que el mapa de hoy tiene y el de agosto no:

- el servicio `Tema` y el cambio de tesela claro/oscuro (`ponerTesela`),
- el sistema de iconos (`SIMBOLOS`, `REJILLA`, `SIMBOLO_DEL_HITO`),
- cinco entradas nuevas —`tramos`, `zona`, `area`, `capaOrigen`, `capaDestino`—
  y los hitos del viaje (`marcarHito`),
- una caché de pintado (`pintado?: { datos, oscuro }`).

Los catorce pinceles se escribieron contra un mapa que no tenía nada de eso.
**No hay merge que valga**: es un trasplante a mano, pincel a pincel, y cada uno
tiene que aprender a repintarse cuando el tema cambia — hoy los colores van
escritos a pelo (`#0284c7`, `#a21caf`, …) y el mapa de hoy repinta al cambiar de
tesela.

## c) ⚠️ EL HALLAZGO QUE MANDA: los pinceles no pueden volver a `mapa.ts`

Esto no es una opinión de estilo. Es una cadena de importaciones:

    rutas.ts → Buscador (ruta '', EAGER) → buscador.ts:32 `import { Mapa } from './mapa'`

`Mapa` viaja en el paquete de la portada **porque el buscador lo importa**. Y el
`Mapa` de agosto hacía `private readonly capas = inject(Capas)` en su línea 96.

Consecuencia, medida contra la cadena real y no supuesta:

> Si los 712 pinceles vuelven dentro de `mapa.ts`, **se van a `main.js` con el
> servicio `Capas` detrás**, y la ruta `/visor` perezosa **no ahorra ni un
> byte**. La carga perezosa no sirve de nada si el peso está en un fichero que
> la portada ya importa.

Lo que sí funciona es lo que ya hace el resto de la casa: **un componente
aparte** —un `MapaDeCapas`, o `Mapa` como pieza y las capas encima— que **solo**
importe la ruta perezosa. Entonces el trozo se separa de verdad. No es una
preferencia: es la única forma en que el presupuesto no se entera.

## d) El presupuesto, con cifras

Lo construido hoy (`app/dist/desplazame/browser`, `main-R3WSVEHT.js`):

| pieza | bytes | kB |
|---|---:|---:|
| `main-R3WSVEHT.js` | 516.106 | 516,11 |
| `styles-OW6DOYWH.css` | 37.584 | 37,58 |
| **portada (initial)** | **553.690** | **553,69** |
| presupuesto `maximumWarning` | | 520,00 |
| **rebasado por** | | **33,69** |

El `maximumError` está en 1 MB, así que no rompe la construcción — **avisa**. Y
ya avisa hoy, antes de tocar nada.

### La perezosa, medida contra los tres precedentes vivos

Las tres rutas perezosas que ya existen, con su trozo en el dist de hoy:

| ruta | fuente (`.ts`+`.html`+`.css`) | su trozo | razón |
|---|---:|---:|---:|
| `/panel` | 21.691 B | `chunk-Ljmpcjen.js` **9.406 B** | 0,434 |
| `/identidad` | 38.334 B | `chunk-DSsXC09M.js` **20.263 B** | 0,529 |
| `/creditos` | 10.529 B | `chunk-6Ax5xY64.js` **6.266 B** | 0,595 |

El trozo del panel confirmado en 9.406 bytes, que es la vara que pedía el
encargo. Razón media fuente→trozo: **0,519** (horquilla 0,434–0,595).

Lo que habría que recolocar en el visor: `capas.ts` 26.337 + `visor.*` 2.713 +
los pinceles 261-972 de `mapa.ts` 22.030 = **51.080 bytes de fuente**.

> **Estimación del trozo perezoso del visor: ≈ 26,5 kB** (horquilla 22,2–30,4).

⚠️ Es una **estimación por regla de tres sobre tres precedentes**, no una
medida: no se ha construido nada, porque construirlo exigiría integrarlo y eso
es fase 2. La cifra que sí está medida es la de los tres trozos de arriba.

Bien colocado —componente aparte, ruta perezosa— **la portada no se entera: 0
bytes**. Mal colocado —dentro de `mapa.ts`— la portada pasa de 553,69 kB a
**≈ 580 kB**, 60 por encima del aviso.

## e) El dato: 40,72 MiB, y aquí está la factura escondida

El visor pide **17 ficheros** y **los 17 siguen en `app/data/` con su ficha**:
40,72 MiB, de los cuales el grafo son 22,82 y los portales 10,33.

Para que el navegador los alcance hacen falta dos cosas que hoy no están:

1. **La correa de `angular.json`.** El commit del borrado quitó la entrada
   `data → datos`. Hoy queda una sola, y sirve **un solo fichero**:
   `{"glob": "2026-09-02_wfs_movilidad-MU1_ZBE.json", "input": "data", "output": "data"}`.
   ⚠️ Y fíjese en la carpeta: hoy es `data`, y el código viejo pide `/datos/`.
2. **Un motor que los sirva** — o que viajen en el dist.

⚠️ **Y aquí está el precio que no se ve:** `app/dist` **va versionado** (21
ficheros en git) y **el push es el despliegue**. Publicar los 17 ficheros
metería **40,72 MiB en el dist de cada construcción**, versionados, y en
Hostinger por cada push. Los datos ya están en git una vez (en `app/data`, 60
ficheros); esto los pondría **una segunda vez** y en cada build.

Esa es la factura de servir el visor desde producción, y no se paga en el
paquete de JavaScript: se paga en el repositorio y en el despliegue.

## f) El acceso: la consecuencia de arquitectura, VERIFICADA

El encargo pedía no dar por buena la consecuencia, sino verificarla contra cómo
sirve el motor. Verificada — y **sale más fuerte de lo que decía la hipótesis**.

El motor lo lleva escrito desde el 8/09, con la letra de Angular delante
(`motor/src/servidor.ts:1139`):

> ⚠️ **«Y aquí no hay Apache que ayude.** En Hostinger el `.htaccess` de
> `public_html` enruta TODO a la app de Node, así que los estáticos no los sirve
> el servidor web: los sirve esto. **No es una comodidad, es la única puerta que
> hay.»**

La hipótesis del encargo era que proteger por directorio obliga a servir el
visor como carpeta propia. La realidad es anterior a eso: **Apache no sirve ni
un fichero de esta app**. Todo —`index.html`, `main.js`, las teselas, `/api/`—
entra por `servirDeLaApp`, que resuelve la ruta contra el dist y devuelve el
`index.html` de respaldo para cualquier ruta que no sea un fichero. Una carpeta
propia para `/visor` **seguiría sirviéndola Node**, no Apache.

⚠️ **Lo que NO consta, y solo se puede medir en el servidor:** si una directiva
`AuthType Basic` + `Require valid-user` puesta en el `.htaccess` de
`public_html` —o por la herramienta de hPanel, que escribe una— la aplica
Apache en su fase de autorización **antes** de pasarle la petición a Node. En
Apache la fase de auth va antes que el handler, así que **podría** funcionar;
pero el `.htaccess` de ese directorio lo gestiona el propio panel de Hostinger,
la herramienta protege **directorios del disco** y `/visor` no es uno, y no se
ha probado en el servidor de verdad. **No se supone: se prueba o no consta.**

Consecuencia para el parlamento: la opción «protegido en producción» **no es una
casilla que se marca**, es una prueba que hay que hacer en el servidor, y quien
la puede hacer es Antonio.
