/**
 * LA TABLA DEL PEATÓN: por dónde puede andar.
 *
 * Dos capas, y están separadas porque así las separan los dos motores leídos:
 * **quién puede entrar** en una arista es una pregunta, y **cuánto le cuesta**
 * entre lo permitido es otra. [DOC Valhalla] resuelve el acceso al construir el
 * grafo (`graph.lua`) y el coste al rutear (`pedestriancost.cc`); [DOC OSRM]
 * hace lo mismo con su lista blanca y su tabla de velocidades en `foot.lua`.
 * Aquí vive la primera capa.
 *
 * **La fuente es una sola y no se mezcla.** El acceso se calca de la columna
 * `pedestrian` de `graph.lua` de Valhalla (master), sin ajustes, porque esa
 * columna ya coincide con lo que dice la ley española — y donde coinciden dos
 * fuentes, se cita a las dos y no se inventa una tercera.
 *
 * ── Y de segunda capa no hay, a propósito ───────────────────────────────────
 *
 * **Entre lo permitido, el camino es el más corto en metros.** Aquí vivió del
 * 21 al 22/08 una capa de coste por prioridad calcada de [DOC OSMAnd
 * `routing.xml`] —acera ×1,2, calzada ×0,9—, y **se retiró**: en las rutas
 * vivas cobraba hasta **+502 m y seis minutos** por rodear un corredor por cuya
 * avenida también se anda, por su acera. La decisión es de Antonio, 22/08, con
 * las rutas delante.
 *
 * Lo que queda **es el defecto documentado de los dos motores de referencia**,
 * no un hueco: [DOC Valhalla `pedestriancost.cc`] trae `walkway_factor` a
 * **1,0**, «neutral», y [DOC OSRM `foot.lua`] no pondera por tipo. El
 * `«salvo cuando ésta no exista»` del [LEY RGC art. 121.1] lo resuelve
 * entonces la primera capa y solo ella: la acera se anda porque está y porque
 * es la más corta, y la calzada sigue abierta para cuando no la hay.
 *
 * **Y no queda tabla neutra ni bandera apagada**: la capa se fue entera, con su
 * `Criterio`, su `shortest` de contraste y el coste precalculado de la red. Una
 * tabla a 1,0 sería exactamente el «declarado y nunca cableado» que la guía
 * prohíbe. Si algún día vuelve, vuelve con su medición delante.
 *
 * ── Por qué el carril bici es la única prohibición ──────────────────────────
 *
 * Porque las tres fuentes dicen lo mismo:
 *
 * - [DOC Valhalla `graph.lua`] `cycleway` lleva `pedestrian_forward = false`.
 * - [DOC OSRM `foot.lua`] `cycleway` **no aparece** en la tabla `speeds`, y lo
 *   que no tiene velocidad no se anda.
 * - [ORD Zaragoza, Ordenanza de Circulación, art. 25] el carril bici no es
 *   zona peatonal: el peatón no transita por él.
 *
 * Y el resto de la calzada NO se cierra, aunque el peatón sea ahí el último en
 * la fila:
 *
 * - [LEY RGC art. 121.1, literal] *«Los peatones transitarán por la zona
 *   peatonal, salvo cuando ésta no exista o no sea practicable, en cuyo caso
 *   podrán hacerlo por el arcén o, en su defecto, por la calzada»*.
 *
 * Ese **«salvo cuando ésta no exista»** es condicional, y un condicional **no
 * se resuelve cerrando la puerta**: si la calzada se cerrase aquí, media ciudad
 * se quedaría sin ruta el día que le falte un metro de acera dibujada. Así que
 * lo que esta capa hace con él es **dejar la calzada transitable**, que es lo
 * que el artículo permite cuando la zona peatonal no existe o no es
 * practicable.
 *
 * **Y ahí se acaba: no hay una segunda capa que ponga la calzada detrás de la
 * acera.** Entre lo permitido decide el **mínimo de distancia**, y nada más —
 * la lápida de arriba cuenta qué fue la capa de coste que lo hacía, qué costó
 * medido y por qué se retiró el 22/08. En la práctica la acera se anda porque
 * está y porque es la más corta; la calzada queda abierta para cuando no la
 * hay, que es exactamente el caso que el artículo contempla.
 *
 * ── El precio, medido antes de aceptarlo ────────────────────────────────────
 *
 * Cerrar el carril bici parte el grafo: de 1 componente pasa a 21, y **20
 * portales que hoy resuelven dejan de resolver** (20 de 45.569 útiles, el
 * **0,044 %**). Están en seis parcelas —un fondo de saco en Calle de Sabiñán,
 * el vial de servicio de Ramón Menéndez Pidal, dos de Vía Ibérica, una acera de
 * 34 m en Camino Bárboles y otra de 25 m en Vía Hispanidad—, y en las seis
 * **el único enlace con el resto de la ciudad estaba cartografiado como carril
 * bici**. Es un hueco de cartografía de OSM, no una regla nuestra.
 *
 * **No se les abre una excepción**, y el motivo es que no existe: ninguna de
 * las fuentes leídas —`graph.lua`, `foot.lua`, `routing.xml`, el RGC, la
 * Ordenanza— contiene la regla «reabrir la vía prohibida si es el único
 * enlace». Implementarla sería inventar doctrina. Reciben el mismo Aviso
 * literal que los 581 portales sin arista cerca —el patrón
 * `minimum_reachability` de Valhalla—, que dice la verdad: no hay forma de ir
 * andando por las calles que conocemos.
 */

/**
 * ⭐ Quién puede entrar, por tipo real de vía (`h`, la etiqueta `highway`).
 *
 * **Están los 27 valores que el grafo trae y ni uno más**, y hay una prueba que
 * lo vigila por los dos lados: que ninguno del dato se quede sin fila, y que
 * ninguna fila se quede sin dato detrás. Una tabla con un hueco es una arista
 * que desaparece de la red sin que nadie lo haya decidido.
 */
export const ACCESO_ANDANDO: Readonly<Record<string, boolean>> = {
  // ── Lo peatonal: donde el peatón va por ley ──────────────────────────────
  // [LEY RGC art. 121.1] «transitarán por la zona peatonal».
  // [DOC Valhalla graph.lua] pedestrian_forward = true.
  footway: true,
  pedestrian: true,
  path: true,
  steps: true,
  corridor: true,
  // Calle de convivencia: el peatón tiene prioridad sobre el coche, así que
  // entra por la puerta de lo peatonal aunque pasen vehículos.
  living_street: true,

  // ── La calzada: SÍ, y el «salvo» lo resuelve el coste ────────────────────
  // [LEY RGC art. 121.1] «…o, en su defecto, por la calzada».
  // [DOC Valhalla graph.lua] toda la jerarquía viaria lleva la columna
  // pedestrian a true; el peatón no queda encerrado por falta de acera.
  motorway: true,
  trunk: true,
  primary: true,
  secondary: true,
  tertiary: true,
  unclassified: true,
  residential: true,
  service: true,
  busway: true,
  motorway_link: true,
  trunk_link: true,
  primary_link: true,
  secondary_link: true,
  tertiary_link: true,
  // Camino: 7.254 aristas y 2.156,7 km del subgrafo útil, casi todo rural.
  track: true,

  // ── Lo que hoy no rutea, y se declara igual ──────────────────────────────
  // Llevan `a=0` y el filtro de la red las quita antes de mirar esta tabla, así
  // que su valor no se ejerce nunca. Van escritas porque la tabla se comprueba
  // contra el censo del grafo, y un hueco aquí sería un hueco silencioso.
  construction: true,
  proposed: true,
  raceway: true,
  services: true,
  rest_area: true,

  // ── La única prohibición ─────────────────────────────────────────────────
  // Ver la cabecera: Valhalla, OSRM y la Ordenanza dicen lo mismo.
  cycleway: false,
};

/**
 * Si el peatón puede andar por una vía de este tipo.
 *
 * **Lo que no está en la tabla, no pasa.** Es el lado seguro a propósito: un
 * valor de `h` nuevo que apareciera en el dato entraría hoy en la red sin que
 * nadie hubiera decidido que se puede andar por él. Dejándolo fuera se nota
 * —la red encoge— y se puede contar; dejándolo entrar, no se nota nunca.
 */
export function puedeAndar(highway: string): boolean {
  return ACCESO_ANDANDO[highway] === true;
}

