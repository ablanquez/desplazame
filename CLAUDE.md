# CLAUDE.md — 004 Desplázame

## PARTE A — Método (igual en todos los proyectos)

### Antes de arreglar

- Antes de tocar el código que falla, busca qué instrumento lo cubría: el
  test, el contador, la vista, el guardián. Ábrelo y míralo.
- Si algo daba verde con el fallo vivo, eso es el hallazgo — más que el fallo.
- Si nada lo cubría, dilo: una zona sin vigilar también es un dato.

### Verde

- Un verde no se deduce: se ejecuta y se mira. Si no se puede ejecutar, di
  cómo lo comprobaste.
- Verde a la primera es sospecha, no celebración. Haz la contraprueba sobre
  la prueba (cambia el valor esperado y mira que falle); nunca rompas el
  código real para ver el rojo.

### Cuando falta un dato

- `NO CONSTA`. No se infiere, no se rellena con lo probable.

### Al terminar

- Commits atómicos con las rutas escritas una a una.
- Lo que descubras que cambie el estado del proyecto se reporta, no se
  escribe: el documento de estado lo lleva otra conversación.

### Idioma

- Español: código, commits y bitácora.

## PARTE B — Este proyecto

### Qué es

Buscador de rutas para moverse por Zaragoza. Se escribe de dónde a dónde, se
elige un modo de transporte, y devuelve la ruta en el mapa y los pasos
escritos.

Una sola pantalla: formulario de cuatro campos (calle y portal de origen,
calle y portal de destino), cuatro botones de modo excluyentes (andando,
autobús/tranvía, bici, coche), mapa con la ruta, y las indicaciones paso a
paso debajo.

### Stack

- **Frontend:** Angular 22 con componentes standalone (sin NgModules).
  Mapa con Leaflet sobre OpenStreetMap. Build con Angular CLI.
- **Motor:** Node + TypeScript ejecutado **sin compilar** — Node borra los tipos
  al ejecutar, así que no hay build. Servidor mínimo (`node:http`; Fastify solo
  si el mínimo estorba).
- **Tipos compartidos:** un paquete común al motor y a la interfaz
  (`@desplazame/tipos`), también sin build. **El contrato crece cuando el motor
  lo pide**, no antes. Si el motor cambia la forma de la respuesta, el front no
  compila. Eso es a propósito.
- **Endpoints:** la API va bajo `/api`, y su forma la fija el contrato de
  `@desplazame/tipos` — si cambia, el front no compila. **Cuáles hay no se
  escribe aquí**: los vivos los declara el motor en `motor/src/servidor.ts`, y
  los previstos, el plan (`PLAN-DESPLAZAME.md`, puntos 6, 7 y 10). Una lista en la
  carta se queda corta cada vez que el motor crece; el puntero no.
- **Idioma:** TypeScript de punta a punta.
- **Despliegue:** Hostinger, plan Node. Symlink `public_html → app`.

### Lo que NO se toca

- **El código del proyecto viejo** (carpeta archivada): ni se copia ni se
  consulta para "ver cómo se hacía". Es un reinicio, no una migración. Las
  decisiones que sigan vigentes llegarán dentro de los encargos, no leyendo
  documentación vieja.
- **Los ficheros de datos** (portales, grafo, paradas, carriles bici, en
  `app/data/`): se leen, no se editan a mano. O se regeneran con su script, o
  entran de fuera. Y del proyecto viejo solo entra el dato que Antonio
  autorice, pieza a pieza.

### Lo que ya se decidió y no se rediscute

- **Se ve en Chrome desde el minuto uno.** Existe una pantalla que se abre en
  el navegador antes de que exista nada más, y cada avance se comprueba
  mirándola. Nada cuenta como hecho sin verse funcionar. La estética va
  después; primero que funcione.
- **Angular es la elección, y es firme.** El resto del portafolio ya cubre
  PHP vanilla, Vue, Next/React y Astro: Angular es el hueco, y es el stack
  dominante en empresa mediana y grande en España.
- **Node es requisito, no preferencia.** El grafo (68.649 nodos) se carga una
  sola vez al arrancar y vive en memoria entre peticiones. Eso lo impone el
  dato.
- **Alcance corto.** El producto es el de arriba y nada más. Si aparece una
  mejora, un matiz o una medición que no cabe en esa pantalla, se dice y se
  espera respuesta — no entra por iniciativa propia.
- **Bitácora y estado empiezan en cero.** No se hereda documentación del
  intento anterior.
