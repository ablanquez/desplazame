/**
 * LA DOCTRINA DE LA RUEDA: por dónde puede ir, a qué velocidad y qué prefiere.
 *
 * Es a la bici, al patín y a la BiZi lo que `andando.ts` es al peatón, y está
 * partida en las **mismas dos capas** por la misma razón: [DOC Valhalla]
 * resuelve el acceso al construir el grafo (`graph.lua`) y el coste al rutear
 * (`bicyclecost.cc`); [DOC OSRM] hace lo mismo con su lista blanca y su tabla
 * de velocidades en `bicycle.lua`. **Quién puede entrar** es una pregunta, y
 * **cuánto le cuesta entre lo permitido** es otra.
 *
 * Aquí viven las dos, y ninguna es nuestra: la primera es el articulado de la
 * Ordenanza —las tres tablas de la casilla 2, fila a fila con su artículo—, y
 * la segunda es el precedente documentado de los dos motores de referencia.
 *
 * ── La diferencia con el peatón, que no es de grado ─────────────────────────
 *
 * El peatón minimiza METROS entre lo permitido. La rueda **minimiza TIEMPO**, y
 * eso no es un capricho de simetría: sin tiempo no hay techo legal —un límite
 * de 10 km/h no cambiaría ni un metro del recorrido— ni preferencia por el
 * carril bici, que es multiplicar un tiempo. La bici usa preferencia y no
 * mínimo-de-distancia puro; es **el reverso declarado del peatón**, cuya capa
 * de prioridad se retiró el 22/08 con las rutas delante.
 *
 * ── Las tres tablas, y por qué son tres ─────────────────────────────────────
 *
 * Porque difieren POR LEY. La bici va por cualquier calzada [art. 50.5.d]; el
 * VMP va **obligatoriamente** por vía ciclista [art. 56.2.c] y solo baja a la
 * calzada en una **lista cerrada** de casos [art. 56.3]; y la BiZi es la tabla
 * de la bici más el contrato del servicio, cuyo ámbito es **estrictamente
 * municipal**. Fusionarlas obligaría a recortarle al ciclista o a mentirle al
 * patinetero.
 *
 * La fuente de todas las citas de este fichero es la **Ordenanza de Movilidad
 * Urbana de Zaragoza** (Pleno 25/07/2024, BOP nº 192 de 21/08/2024, en vigor
 * desde el 11/09/2024), leída del BOP y del PDF de la sede — comparados al
 * carácter en los diez pasajes que gobiernan: 10 de 10 idénticos.
 */

import type { Modo } from '@desplazame/tipos';

/**
 * Los tres modos que ruedan. Es un subconjunto de `Modo`, no un tipo paralelo:
 * lo que viaja por el contrato sigue siendo `Modo`, y esto solo dice cuáles de
 * ellos atiende este fichero.
 */
export type ModoDeRueda = 'bici' | 'patin' | 'bizi';

/** Si un modo del contrato lo atiende la rueda. */
export function esDeLaRueda(modo: Modo): modo is ModoDeRueda {
  return modo === 'bici' || modo === 'patin' || modo === 'bizi';
}

/**
 * ⭐ LAS VELOCIDADES DE CRUCERO, en km/h. **Firmadas el 29/08**, y cada una
 * con su procedencia, que no es la misma en las tres:
 *
 * - **bici 18** — [DOC Valhalla, perfil de bicicleta] es el defecto de su tipo
 *   `Hybrid/City`, que es además *«The default type is Hybrid»*. No es una
 *   medida nuestra: es el defecto de la doctrina.
 * - **bizi 20** — [PROPIO, firmado] no hay perfil de pedaleo asistido en
 *   NINGÚN motor leído (Valhalla, OSRM, OSMAnd): NO CONSTA. Se sitúa entre el
 *   18 urbano de arriba y el corte legal de la asistencia a 25 km/h
 *   [UE 168/2013 · RD 970/2020 · EN 15194], que es el techo por el que un
 *   pedelec deja de empujar.
 * - **patín 18** — [PROPIO, firmado] tampoco hay perfil de VMP en ningún
 *   motor. Se le da la misma que a la bici porque es la única cifra medida que
 *   hay para un vehículo de esa clase en ciudad.
 *
 * **Son de CRUCERO, no de promesa**: el techo legal de la vía las recorta
 * donde la vía habla, y nadie ha cronometrado a nadie pedaleando por Zaragoza.
 * No entran cuestas —la elevación está declarada FUERA, con el precedente de
 * OSRM, que publica su perfil de bici sin mencionarla—, ni semáforos, ni el
 * rato de sacar la bici del portal.
 */
export const VELOCIDAD_KMH: Readonly<Record<ModoDeRueda, number>> = {
  bici: 18,
  bizi: 20,
  patin: 18,
};

/**
 * ⭐ La velocidad de quien CRUZA CON EL VEHÍCULO EN LA MANO: **5 km/h**.
 *
 * No es una cuarta velocidad de la rueda: es la del peatón, porque quien
 * empuja **es** peatón. Es la misma cifra y la misma cita que `trayecto.ts`
 * usa para el modo andando —velocidad de manual, no medida—, y va aquí escrita
 * para que un paso de peatones no se cruce a 18 km/h.
 *
 * [LEY RGC art. 121.2, vigente hoy] *«El que… empuje o arrastre un vehículo de
 * reducidas dimensiones que no sea de motor…»* queda dentro del capítulo del
 * peatón. ⚠️ **Esta cita caduca el 01/10/2026**: el RD 518/2026 reescribe el
 * 121 entero y lleva el caso al art. 122.2.a.
 */
export const VELOCIDAD_EMPUJANDO_KMH = 5;

/**
 * ⭐ TABLA DE ACCESO DE LA BICI, por tipo real de vía (`h`, la `highway` de
 * OSM). **Están los 27 valores que el grafo trae y ni uno más**, igual que en
 * `andando.ts` y vigilada igual por los dos lados: que ninguno del dato se
 * quede sin fila, y que ninguna fila se quede sin dato detrás.
 */
export const ACCESO_RODANDO: Readonly<Record<string, boolean>> = {
  // ── La infraestructura ciclista: su sitio ────────────────────────────────
  // [ORD art. 50.5.a y 54.2] Es la vía de la bici, con prioridad de paso.
  cycleway: true,

  // ── La calzada: TODA, y por el carril derecho ────────────────────────────
  // [ORD art. 50.5.d] la bici circula por la calzada; [50.9] por la parte
  // central del carril. La Ordenanza no excluye ninguna categoría de calzada
  // urbana, y por eso aquí no se excluye tampoco.
  residential: true,
  unclassified: true,
  tertiary: true,
  secondary: true,
  primary: true,
  service: true,
  primary_link: true,
  secondary_link: true,
  tertiary_link: true,
  // [ORD art. 23.c] Calle residencial: 20 km/h y prioridad peatonal. Se rueda.
  living_street: true,
  // [ORD art. 15.2.c.i] Camino rural: límite 30 km/h «salvo que se establezca
  // otro mediante señalización». 7.254 aristas y 2.156,7 km del subgrafo útil.
  track: true,
  // ⭐ HUECO H6, CERRADO POR DOCTRINA: ni la Ordenanza ni MU1 nombran el
  // `path`. Se resuelve por **el defecto legal por tipo de vía** de la tabla
  // de acceso de la wiki de *routing* de OSM, que da la bici permitida en
  // `path` — la misma tabla que codifican los motores («yes = permitido salvo
  // etiqueta en contra»).
  path: true,

  // ── Lo peatonal: NO, y es la prohibición dura ────────────────────────────
  // [ORD art. 50.6, literal] «prohibido circular por las aceras, vías o zonas
  // peatonales». Sin matices y sin excepción de horario.
  //
  // ⚠️ La excepción de los menores de 12 años [art. 50.7] NO se implementa: la
  // petición no dice quién va montado y no se le va a preguntar la edad a
  // nadie. La ruta que se contesta es la del adulto, que es la restrictiva.
  footway: false,
  pedestrian: false,
  steps: false,
  corridor: false,

  // ── El carril bus: NO ────────────────────────────────────────────────────
  // ⭐ HUECO H3, CERRADO POR DOCTRINA, y la Ordenanza **se contradice**:
  // [art. 50.6] «Tampoco podrán circular por carriles ni plataformas
  // reservadas para el transporte público», y [art. 67.1] dice que el carril
  // bus «también lo podrán utilizar… bicicletas, VMP». La bisagra es el
  // [art. 16.3-4]: hace falta estudio técnico y **resolución expresa
  // señalizada**, que no está publicada. Manda el defecto: prohibido. El
  // mecanismo del autorizado sería el tag `cycleway=share_busway`, y sin dato
  // no hay tag.
  //
  // ⚠️ Esta fila cierra el `h=busway` —la vía que ES un carril bus— y son **0
  // aristas** del subgrafo útil. El carril bus que sí tenemos localizado
  // —`carril_bus=1` en 36 tramos y 15,3 km de MU1— **NO se cierra, y es a
  // propósito**: ese campo dice que la vía TIENE un carril reservado, no que
  // la vía SEA el carril. Nuestro grafo lleva una arista por calzada, no una
  // por carril, así que cerrarla prohibiría la avenida entera cuando la
  // Ordenanza solo prohíbe uno de sus carriles — y la bici sí puede ir por los
  // otros. La prohibición del 50.6 es de un carril que no modelamos: se
  // declara, se cuenta en el arranque, y no se aplica.
  busway: false,

  // ── Lo que la red ya quitó, declarado igual ──────────────────────────────
  // Llevan `a=0` y el filtro entra antes que esta tabla, así que su valor no
  // se ejerce nunca. Van escritas porque la tabla se comprueba contra el censo
  // del grafo, y un hueco aquí sería un hueco silencioso. Todas a `false`, que
  // es el lado seguro: por una obra o un circuito no se rueda.
  motorway: false,
  trunk: false,
  motorway_link: false,
  trunk_link: false,
  construction: false,
  proposed: false,
  raceway: false,
  services: false,
  rest_area: false,
};

/**
 * ⭐ El perfil propio del exportador (`p`) que VETA aunque `h` diga que sí.
 *
 * Una sola entrada, y hace falta que sea explícita: la fila «`p=acera` → NO»
 * es una fila de la tabla con su artículo [ORD art. 50.6], y si viviera solo
 * dentro de `h=footway` bastaría con que una acera apareciera cartografiada
 * como `residential` para que la bici se subiera a ella sin que nadie hubiera
 * decidido nada.
 *
 * ⭐ **Y no es una fila de adorno: hoy quita UNA arista que `h` habría dejado
 * pasar.** Al escribir esto se dio por hecho que serían cero —las 16.816
 * aceras del subgrafo útil son `footway` o `pedestrian`, las dos ya cerradas—
 * y el arranque contestó **1**: la arista `i=95393` del *way* 1459676263,
 * 26,8 m de la **Calle del Valle de Zuriza**, que el exportador marcó
 * `p=acera` y OSM etiquetó `h=residential`. Sin esta fila, la bici se subiría
 * a ella.
 *
 * Por eso el arranque la cuenta aparte: es una cifra pequeña que solo se ve si
 * se mira, y el día que suba será que el dato trajo más aceras con tipo de
 * calzada.
 */
export const PERFILES_VETADOS: ReadonlySet<string> = new Set(['acera']);

/**
 * ⭐ El perfil que se cruza **CON EL VEHÍCULO EN LA MANO**, y por eso pasa
 * aunque su `h` sea `footway`.
 *
 * [ORD art. 54.4, literal] *«…deberán cruzar con la bicicleta o VMP en la
 * mano, excepto cuando dicho paso dé continuidad a dos tramos de vías
 * ciclistas»*. La celda de la casilla 2 dice **condición**, y una condición se
 * codifica cumpliéndola: se cruza, pero al paso de quien empuja, que son
 * 5 km/h y no 18.
 *
 * La excepción se evalúa sobre el dato y no se supone: un paso «da continuidad
 * a dos tramos de vías ciclistas» cuando sus DOS extremos tocan una arista
 * `h=cycleway`. Los que la cumplen se ruedan; los demás se empujan, y las dos
 * cifras salen en el log de arranque.
 */
export const PERFIL_DE_CRUCE = 'paso-de-peatones';

/**
 * Si la rueda puede entrar en una arista **por su tipo**. Es la tabla de la
 * BICI: el patín añade la suya encima y la BiZi la frontera, pero ninguno de
 * los dos abre lo que aquí se cierra.
 *
 * **Lo que no está en la tabla, no pasa** — el mismo lado seguro que
 * `andando.ts`: un `h` nuevo que apareciera en el dato entraría hoy sin que
 * nadie hubiera decidido que se puede rodar por él. Dejándolo fuera, la red
 * encoge y se puede contar; dejándolo entrar, no se nota nunca.
 */
export function puedeRodar(highway: string, perfil: string): boolean {
  if (perfil === PERFIL_DE_CRUCE) {
    return true;
  }
  if (PERFILES_VETADOS.has(perfil)) {
    return false;
  }
  return ACCESO_RODANDO[highway] === true;
}

/**
 * ⭐ EL FACTOR DE PREFERENCIA AL CARRIL BICI, y de dónde salen sus números.
 *
 * El mecanismo es de [DOC Valhalla]: *preferencia por cycleways o vías con
 * carril bici*, con los cycleways **favorecidos por defecto** frente a las
 * calzadas. Aquí se implementa como un **multiplicador sobre el coste-tiempo
 * de lo que NO es cycleway**, que es la forma en que un motor expresa
 * «prefiero esto» sin mentir sobre los metros: la respuesta sigue diciendo los
 * metros que son, y lo que se dobla es lo que pesa en el montículo.
 *
 * Los VALORES **no se inventan**: son el precedente documentado de
 * [DOC OSRM `bicycle.lua`], cuya `unsafe_highway_list` puntúa las vías con
 * tráfico —`primary` 0,5 · `secondary` 0,65 · `tertiary` 0,8, y sus `_link`
 * con el mismo valor— como una tasa aplicada a la velocidad. Un factor que
 * multiplica el tiempo es el inverso de uno que multiplica la velocidad, así
 * que aquí van como **1/0,5 · 1/0,65 · 1/0,8**.
 *
 * ⭐ **Lo que no está en la lista NO se penaliza**, y eso también es de OSRM:
 * su lista nombra solo las vías con tráfico. La consecuencia, dicha en voz
 * alta antes de que nadie la descubra mirando una ruta: el carril bici se
 * prefiere **frente a la avenida** —el doble de coste en una `primary`— y es
 * **neutro frente a la calle residencial, el `service`, la `living_street` y
 * el camino**. Preferir el carril sobre una calle de barrio no lo dice ninguna
 * de las dos fuentes, y no se añade.
 */
export const FACTOR_DE_TRAFICO: Readonly<Record<string, number>> = {
  primary: 1 / 0.5,
  primary_link: 1 / 0.5,
  secondary: 1 / 0.65,
  secondary_link: 1 / 0.65,
  tertiary: 1 / 0.8,
  tertiary_link: 1 / 0.8,
};

/** El multiplicador de tiempo de una vía. 1 en todo lo que no lleva tráfico. */
export function factorDe(highway: string): number {
  return FACTOR_DE_TRAFICO[highway] ?? 1;
}

/**
 * ⭐ EL DEFECTO LEGAL NACIONAL: el art. 50 del RGC, por atributos de la vía.
 *
 * [LEY RGC art. 50, redacción del RD 970/2020, en vigor desde el 11/05/2021]
 * fija el límite genérico en vías urbanas **sin necesidad de señal**:
 *
 * - **20 km/h** en vías de **plataforma única** de calzada y acera;
 * - **30 km/h** en vías de **un único carril por sentido** de circulación;
 * - **50 km/h** en vías de **dos o más carriles por sentido**.
 *
 * Y el propio artículo aclara que *«no se considerarán carriles los reservados
 * para circulación, uso exclusivo o preferente»* de determinados vehículos.
 *
 * ── Por qué esto entra, y por qué no pisa a nadie ───────────────────────────
 *
 * Un límite genérico **rige sin que haya señal**: la señal es la excepción, no
 * la regla. Nuestro dato expreso —`limite_vel` municipal y `maxspeed` de OSM—
 * **es exactamente la señal**, así que sigue mandando donde exista: el defecto
 * solo llena el hueco. Es la práctica que codifica
 * [DOC osm-legal-default-speeds]: aplicar el defecto legal del país donde no
 * hay ni señal ni etiqueta.
 *
 * ── Y por qué le importa al patín y no a la bici ────────────────────────────
 *
 * El art. 15.2.a.ii de la Ordenanza define **vía pacificada** con esta misma
 * regla —*«un carril de circulación por sentido y… limitación genérica de
 * velocidad de 30 km/h»*—, y el art. 56.3.b abre las vías pacificadas al VMP.
 * Así que una calle de barrio sin señal **es pacificada por ley**, aunque MU1
 * no la haya fichado, y el patín puede circular por ella.
 *
 * A la bici no le cambia el acceso —ya iba por toda la calzada— y **tampoco le
 * cambia el reloj**: los tres defectos son 20, 30 y 50, y su crucero es 18
 * (20 la BiZi), así que `min(velocidad, techo)` da lo mismo con defecto o sin
 * él. Es un techo que existe, es correcto, y no mueve un segundo.
 */
export const DEFECTO_PLATAFORMA_KMH = 20;
export const DEFECTO_UN_CARRIL_KMH = 30;
export const DEFECTO_VARIOS_CARRILES_KMH = 50;

/**
 * ⭐ Los tipos que se cuentan como **un carril por sentido** cuando el dato no
 * dice cuántos hay. **[PROPIO-por-tipo]**, y declarado como tal.
 *
 * No es una lectura del artículo: el artículo habla de carriles, no de tipos.
 * Es la inferencia mínima que hace falta para que el defecto llegue a la calle
 * de barrio, y se apoya en la definición de los propios tipos de OSM —
 * `residential` es la calle de acceso a viviendas, `living_street` la calle de
 * convivencia y `service` el vial de servicio o el acceso a un aparcamiento—,
 * ninguno de los cuales es una vía de dos calzadas.
 *
 * **Alcanza a 7.227 aristas** de las 58.914 de la red (12,3 %), medido, y solo
 * donde no hay ni límite expreso ni `lanes` de OSM. Va contado aparte en el
 * arranque para que ese número se pueda mirar: es la capa menos apoyada de las
 * tres y la única que no sale de un dato de la vía.
 *
 * `unclassified` **NO está**, a propósito: es la carretera menor, y las hay de
 * dos carriles por sentido. Se queda a oscuras, que es la verdad.
 */
export const UN_CARRIL_POR_TIPO: ReadonlySet<string> = new Set([
  'residential',
  'living_street',
  'service',
]);

/**
 * Cuántos carriles por sentido declara OSM, o `0` si NO CONSTA.
 *
 * `lanes` en OSM cuenta **todos** los carriles de la vía, en los dos sentidos,
 * salvo que sea de sentido único. De ahí la división.
 *
 * ⚠️ Y una diferencia con el artículo que se declara y no se disimula: el
 * RGC **descuenta los carriles reservados** y `lanes` de OSM **los incluye**.
 * No se descuentan aquí porque el dato de `lanes:bus` no está en la etiqueta
 * de la mayoría; el efecto es contar de más, que empuja hacia el 50 — y el 50
 * es el lado que **cierra** la vía al patín. Se equivoca hacia el lado seguro.
 */
export function carrilesPorSentidoDeOsm(lanes: string | undefined, oneway: boolean): number {
  if (lanes === undefined || !/^\d+$/.test(lanes)) {
    return 0;
  }
  const n = Number(lanes);
  if (n <= 0) {
    return 0;
  }
  return oneway ? n : Math.max(1, Math.round(n / 2));
}
