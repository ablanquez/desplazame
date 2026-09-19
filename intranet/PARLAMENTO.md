# El parlamento de la intranet

El PLAN lo dejó dicho y en blanco: *«Alcance, acceso (¿protegido?, ¿solo
local?) y qué más contiene la intranet: `NO CONSTA` — se parlamenta al
llegar»*. Hemos llegado. Esto es lo que hace falta para decidir.

**Nada de aquí se ejecuta sin firma.** La fase 1 recupera, inventaría y
pregunta; la fase 2 arranca cuando Antonio conteste las dos preguntas.

> ⚠️ **Un cabo de numeración, para que nadie persiga un punto que no existe.**
> El commit del borrado, el comentario de `rutas.ts` y el encargo dicen **punto
> 14**; el PLAN de hoy lo tiene como **`## 16 — Intranet`**. Es el mismo bloque:
> el documento se renumeró por el camino. Manda el título, no el número.

---

## PREGUNTA 1 — El alcance: ¿qué vive en la intranet?

Lo que ya está decidido y no se pregunta: **el visor de capas se muda ahí**
(decisión del 22/08). Lo que sí se pregunta es si va solo.

### Opción A · Solo el visor: las catorce capas y la morada

Lo mínimo que cierra el punto. El inventario está en `INVENTARIO.md`: las 14
capas, sus 17 ficheros —**todos siguen en el repo con su ficha**, 40,72 MiB— y
la morada, que **aguanta intacta el censo re-firmado ayer** (los mismos 2.860
tramos y las mismas 19 zonas, +5 plazas).

**Precio:** trasplantar 712 líneas de pinceles a un componente nuevo, entrar
`capas.ts` con sus 677 líneas y **la prosa corregida** (siete cifras de agosto
que el censo nuevo ha dejado mintiendo), y recuperar 17 guardianes que ya
existen —10 de `capas.spec` + 7 de `visor.spec`— más los 3 del molde de rutas
perezosas. Trozo perezoso estimado **≈ 26,5 kB**; **portada: 0 bytes**.

### Opción B · El visor **y el panel de frescura**

El PLAN ya lo apalabró: el panel *«instrumento ahora, mudanza a la intranet
después»*, y `rutas.ts` lo repite en el código — *«es pública, y dónde acaba
viviendo se decide en la intranet»*. Esta es esa decisión.

**Precio:** el trozo del panel son **9.406 bytes** que ya están fuera de la
portada, así que mudarlo **no cambia el peso de nada**: solo cambia quién puede
verlo. El trabajo es re-apuntar sus guardianes.

⚠️ **Y tiene un coste que depende de la pregunta 2:** si la intranet acaba
siendo *solo-local*, el panel de frescura deja de poder consultarse desde fuera
de la máquina de Antonio. Hoy se mira escribiendo `/panel` en producción desde
cualquier sitio. *(Matiz medido: como `app/dist` va versionado y el push es el
despliegue, el manifiesto local y el de producción son el mismo fichero después
de cada push — así que se perdería la comodidad, no la verdad.)*

### Opción C · El visor, el panel **y la página de identidad**

`/identidad` nació con la misma frase en `rutas.ts` que el panel: *«el sitio
donde el ojo comprueba no puede ser el producto»*. Por esa frase, es inquilina
natural de la intranet.

**Precio:** su trozo son **20.263 bytes**, también ya fuera de la portada.
Mismo caso que el panel: no cambia el peso, cambia quién la ve.

⚠️ **`/creditos` NO entra en ninguna opción, y no es negociable.** [RD
1495/2011] exige el aviso legal *«accesible de forma permanente, fácil y
directa»*, y tiene su propio guardián en `app.spec.ts` vigilando que la portada
lleve hasta él. Meterlo en la intranet sería romper eso.

---

## PREGUNTA 2 — El acceso: ¿quién puede entrar?

### ⚠️ Antes de las opciones: un hecho que las condiciona todas

El encargo pedía verificar, no suponer, la consecuencia de arquitectura del
acceso. Verificada contra el motor, y sale **más fuerte** que la hipótesis
(`motor/src/servidor.ts:1139`, escrito el 8/09 con el despliegue delante):

> ⚠️ **«Y aquí no hay Apache que ayude.** En Hostinger el `.htaccess` de
> `public_html` enruta TODO a la app de Node, así que los estáticos no los sirve
> el servidor web: los sirve esto. **No es una comodidad, es la única puerta que
> hay.»**

Es decir: **Apache no sirve ni un fichero de esta aplicación.** La hipótesis era
que proteger por directorio obligaría a servir el visor como carpeta propia; la
realidad es anterior — una carpeta propia **la seguiría sirviendo Node**.

### Opción 1 · Protegido en producción

**Doctrina:** Hostinger documenta dos vías — la herramienta propia de hPanel
(*Avanzado → Password Protect Directories*) y el `.htaccess`/`.htpasswd` de
Apache (`AuthType Basic` + `AuthUserFile` + `Require valid-user`), con el aviso
de la documentación de Apache de que **el `.htpasswd` va FUERA de
`public_html`**, porque dentro se puede descargar.

**Precio:**
- ⚠️ **`NO CONSTA` si funciona aquí**, y es el punto que decide. En Apache la
  fase de autorización va antes que el handler, así que una directiva en el
  `.htaccess` de `public_html` **podría** aplicarse antes de pasarle la petición
  a Node. Pero ese `.htaccess` lo gestiona el panel de Hostinger, la herramienta
  protege **directorios del disco** y `/visor` no es un directorio. **Solo se
  puede saber probándolo en el servidor de verdad**, y eso es tu mano.
- **40,72 MiB en el `dist` versionado, en cada construcción.** Los datos ya
  están en git una vez (`app/data`, 60 ficheros); publicarlos los pondría una
  segunda vez, y en cada push, que es el despliegue.
- Un `.htaccess` a mano en un directorio que gestiona el panel es la clase de
  cosa que un redespliegue pisa sin avisar.

### Opción 2 · Solo-local

**Doctrina:** lo que no viaja en el `dist` desplegado no tiene superficie
pública. Cero ficheros expuestos, cero credenciales que gestionar, cero
configuración de servidor que un redespliegue pueda pisar.

**Precio:**
- **0 bytes en producción y 0 MiB de datos publicados.** El despliegue no se
  entera de que la intranet existe.
- No es gratis de construir: que «no viaje» tiene que ser **de verdad y
  comprobable** — una configuración de construcción aparte y un guardián que
  verifique que el `dist` de producción **no lleva el trozo del visor**. Eso
  encaja bien con el guardián de build que ya existe (`app/scripts/construir.mjs`).
- **El coste real es de uso:** en 2027, cuando la morada tenga que trabajar
  contra los planos de la ampliación, será en tu máquina con el motor levantado,
  o no será.

### Opción 3 · Público sin proteger

**Qué expone de más — medido, no supuesto:**

- **De dato, nada.** El repositorio `ablanquez/desplazame` es **público** en
  GitHub y bajo Apache 2.0: los 17 ficheros que el visor pinta ya están
  publicados ahí, enteros. Un visor público no revelaría ni un byte nuevo.
- ⚠️ **Pero sí expone una cosa, y no es dato: la morada.** La capa 13 es *«una
  lectura NUESTRA: el WFS no dice nada»* — una hipótesis sobre dónde va a
  ampliarse la zona azul. Tenerla en un comentario de un repositorio y pintarla
  en un mapa público, en un dominio con tu nombre y bajo el rótulo «¿Ampliación?
  zonas sin activar», **no son el mismo acto**. Quien la vea la leerá como
  información, no como conjetura.
- **Y expone ancho de banda:** 40,72 MiB por visita, servidos por el motor de
  Node en un plan compartido, sin nada que limite quién los pide.

---

## LA RECOMENDACIÓN DEL EJECUTOR

*Marcada como mía: es criterio, no doctrina, y se descarta sin explicaciones.*

**Alcance: la B** — el visor y el panel de frescura. El visor porque ya está
decidido; el panel porque el PLAN y el propio `rutas.ts` lo dejaron apalabrado y
mantenerlo público solo porque nunca se decidió es dejar que la inercia decida.
**`/identidad` la dejaría fuera de momento**: es la referencia del sistema
visual, se usa mirándola mientras se escribe interfaz, y esconderla detrás de un
acceso estorba más de lo que protege. Si acaba molestando que sea pública,
mudarla después cuesta lo mismo que mudarla ahora.

**Acceso: la 2, solo-local** — y con una razón que no es la seguridad:

> Esta herramienta tiene **un solo usuario**, y ese usuario tiene el repositorio
> en su disco. Pagar 40,72 MiB en cada despliegue, más una prueba en el servidor
> que puede salir que no, más un `.htaccess` que un redespliegue puede pisar,
> **para servirle una página a la persona que ya tiene los ficheros delante**,
> es comprar un problema de producción para resolver uno que no existe.

Y hay un premio de propina: «no viaja en el dist» es un **invariante
comprobable**, del mismo tipo que los que ya vigilan esta casa —*la portada no
baja ni un byte de datos*—, mientras que «está protegido en producción» solo se
puede comprobar yendo a mirar.

⭐ **Y si la 2 no vale, hay una cuarta puerta que la verificación ha abierto, y
la digo porque el encargo mandaba verificar y esto es lo que salió:** como **el
motor es la única puerta que hay**, el control de acceso puede vivir **en el
motor**, no en Apache. Un vistazo en `servirDeLaApp` a las rutas de la intranet,
con el secreto en el panel de Hostinger —donde ya viven `.env.local` y
`DESPLAZAME_REGEN_TOKEN`, precedente de la casa—. Se prueba en local, no depende
de que Hostinger permita nada, ningún redespliegue lo pisa, y es código nuestro
con sus guardianes. Sigue costando los 40,72 MiB si además se publica el dato;
no los cuesta si la intranet solo sirve la página y el dato se queda fuera.

---

## Lo que hace falta de tu parte

1. **Alcance:** ¿A, B o C? (¿Se muda el panel de frescura? ¿Y la identidad?)
2. **Acceso:** ¿1, 2, o la cuarta puerta? Y si es la 1, hace falta **probar en
   el servidor** si la protección de hPanel llega a alcanzar una ruta que sirve
   Node — eso `NO CONSTA` y no se puede medir desde aquí.
3. **La morada, 2027:** si el acceso acaba siendo público, decidir si esa capa
   entra igualmente o se queda fuera hasta que el cotejo la confirme.

Con esas respuestas, la fase 2 tiene la letra que le falta.
