/**
 * ⭐ EL PATRÓN OPERATIVO: la ruta de hoy, con su traza reconstruida.
 *
 * El diff (`desvios.ts`) dice **por qué postes pasa hoy** la línea. Aquí se
 * convierte esa lista en un `PatronBus` que la búsqueda pueda usar igual que
 * los del feed: con su secuencia, sus saltos, su geometría y sus segundos.
 *
 * ── ⭐ CÓMO SE RECONSTRUYE UN SALTO QUE EL FEED NO TIENE ────────────────────
 *
 * Es el patrón documentado de la comunidad GTFS [gtfs.org, *producing data*;
 * el mapper de Friburgo; `bus-router` / `gtfs-shape-router` con OSRM entre
 * paradas; `pfaedle`, SIGSPATIAL 2018]: **para cada par de paradas consecutivas,
 * el camino mínimo sobre el grafo vial, y luego concatenar**. Donde el grafo no
 * conecta, **recta** — y aquí la recta se **cuenta y se marca**, nunca es
 * silenciosa [OTP #2987].
 *
 * ⭐ **Y DESDE EL 3/09 SE RUTEA SOBRE LA RED DEL COCHE** (punto 12, casilla 3).
 *
 * El pendiente estaba escrito aquí desde el 31/08: *«el grafo vial que hay en
 * casa es el de la RUEDA»*, que incluye **carriles bici y sendas que un autobús
 * no puede usar**. El del coche llegó con el punto 12, y es calzada.
 *
 * Medido el 3/09 sobre **399 pares de paradas consecutivas** de la red real,
 * ruteados con las dos: **147 tramos** llevaban el autobús a más de 10 m de
 * cualquier calzada con la rueda —el peor, **174 m** fuera, en la N6 entre
 * `Ctra. Castellón / Pol. Ind. San Valero` y `Ctra. Castellón / Cementerio`, que
 * además daba **2.132 m** contra los 1.429 del coche—. Con la red del coche
 * esos tramos caen a cero.
 *
 * ⚠️ **Y TIENE UN PRECIO, medido y declarado: el casco.** La red del coche
 *    trae los sentidos únicos **del coche**, y un autobús no los tiene todos —
 *    hay carril bus y contrasentidos que le pertenecen—. En el mismo barrido, el
 *    salto `Plaza De España → Coso N.º 126` (líneas 21, 32 y 35) pasa de **693 m
 *    con la rueda a 2.055 con el coche**, y `Plaza San Miguel → Coso N.º 55` de
 *    511 a 2.167: el coche tiene que rodear lo que el autobús baja de frente.
 *
 *    Ninguna de las dos redes es la del autobús. La que haría falta es calzada
 *    **más** carriles bus y sus contrasentidos, y ese dato no está en casa. Se
 *    elige la del coche porque el error que quita —meter un autobús por una
 *    senda— es de clase peor que el que deja —rodear una manzana del casco—, y
 *    porque el que deja **se ve en el mapa** y el otro no. Queda escrito para
 *    quien traiga el dato que falta.
 *
 * Lo del asfalto de verdad son las trazas del feed, y esas se conservan
 * intactas donde existen: esto solo reconstruye los saltos que el feed NO
 * tiene.
 *
 * ── El tiempo, que la doctrina no da ────────────────────────────────────────
 *
 * [PROPIO, declarado] los trabajos de arriba reconstruyen **la geometría**, no
 * el horario. Para los segundos de un salto nuevo se usa la **velocidad
 * comercial media del propio patrón oficial** —sus metros entre sus segundos—,
 * que es lo que ese autobús tarda de verdad en esa parte de la ciudad, con sus
 * semáforos y sus paradas. No una velocidad de manual.
 */
import type { Vertice } from '@desplazame/tipos';
import type { ParadaBus, PatronBus, RedDeBus, SaltoBus } from './red-bus.ts';
import { nombrarPoste, posteDeCodigo } from './avanza.ts';
import type { ParadaDelDiff, Veredicto } from './desvios.ts';
import { rectaEntre } from './trazas.ts';
import { enganchar, type Rejilla } from './proyeccion.ts';
import { geometriaDe, type Cuaderno } from './ruta.ts';
import { admiteComoPuerta, calcularRutaRodando } from './rodando.ts';
import type { RedDeLaRueda } from './red-rueda.ts';
import { laRedDeCoche, type RedDeCocheServida } from './coche.ts';
import { calcularRutaEnCoche } from './viaje-coche.ts';
import type { Motor } from './trayecto.ts';
import { coordenadaDelPoste } from './avanza.ts';
import { claveDe, refrescarDesvios, type CuentasDeDesvios } from './desvios.ts';

/** Un camino entre dos puntos sobre el grafo vial, o `null` si no conecta. */
export type RodarEntre = (
  aLon: number,
  aLat: number,
  bLon: number,
  bLat: number,
) => { readonly geometria: readonly Vertice[]; readonly metros: number } | null;

/**
 * ⭐ El `RodarEntre` de casa, sobre la red de la rueda.
 *
 * `tipo: 'rapida'` a propósito: el calibrado que prefiere el carril bici es una
 * política **para quien pedalea**, y aquí lo que se quiere es el camino más
 * corto que respete los sentidos. Un autobús no elige por comodidad ciclista.
 */
export function rodarConLaRueda(
  red: RedDeLaRueda,
  rejilla: Rejilla,
  cuaderno: Cuaderno,
): RodarEntre {
  const admitida = (arista: number): boolean => admiteComoPuerta(red, arista, 'bici');
  return (aLon, aLat, bLon, bLat) => {
    const eo = enganchar(red, rejilla, aLon, aLat, admitida);
    const ed = enganchar(red, rejilla, bLon, bLat, admitida);
    if (!eo || !ed) {
      return null;
    }
    const r = calcularRutaRodando(
      red,
      cuaderno,
      'bici',
      eo,
      [aLon, aLat],
      ed,
      [bLon, bLat],
      'rapida',
    );
    if (!r) {
      return null;
    }
    return {
      geometria: geometriaDe(r).map(([lon, lat]) => [lat, lon] as Vertice),
      metros: r.metros,
    };
  };
}

/**
 * ⭐ EL MISMO OFICIO, CON LA RED DEL COCHE (3/09). Ver la cabecera.
 *
 * No hay filtro de puerta que poner: en la red del coche **todo lo que hay es
 * calzada**, que es justamente lo que se quería. Y no se le pasa ningún veto:
 * la Zona de Bajas Emisiones no alcanza al transporte público, y ponérsela sería
 * inventarle una restricción al autobús.
 */
export function rodarConElCoche(servida: RedDeCocheServida): RodarEntre {
  return (aLon, aLat, bLon, bLat) => {
    const eo = enganchar(servida.comoRed, servida.rejilla, aLon, aLat);
    const ed = enganchar(servida.comoRed, servida.rejilla, bLon, bLat);
    if (!eo || !ed) {
      return null;
    }
    const r = calcularRutaEnCoche(servida, eo, [aLon, aLat], ed, [bLon, bLat]);
    if (!r) {
      return null;
    }
    return {
      geometria: geometriaDe(r).map(([lon, lat]) => [lat, lon] as Vertice),
      metros: r.metros,
    };
  };
}

/**
 * ⭐ LA VELOCIDAD COMERCIAL de un patrón: sus metros entre sus segundos.
 *
 * Con semáforos, paradas y tráfico dentro, que es lo que la hace útil. `null`
 * si el patrón no tiene de dónde sacarla — y entonces no se inventa ninguna.
 */
export function velocidadComercial(patron: PatronBus): number | null {
  let metros = 0;
  let segundos = 0;
  for (const s of patron.saltos) {
    metros += s.metros;
    segundos += s.tipico;
  }
  return segundos > 0 && metros > 0 ? metros / segundos : null;
}

/** Cuánto se ha reconstruido, y cuánto ha caído a recta. */
export interface CuentasDelOperativo {
  readonly patrones: number;
  readonly saltosNuevos: number;
  readonly reconstruidos: number;
  readonly rectas: number;
  readonly provisionales: number;
  readonly sinCoordenada: number;
}

/** La misma cuenta mientras se llena. Sale a `CuentasDelOperativo` de una pieza. */
type Contando = { -readonly [K in keyof CuentasDelOperativo]: CuentasDelOperativo[K] };

const vacias = (): Contando => ({
  patrones: 0,
  saltosNuevos: 0,
  reconstruidos: 0,
  rectas: 0,
  provisionales: 0,
  sinCoordenada: 0,
});

/** El id que se le da a una parada que solo existe en Avanza. */
export const idDeProvisional = (poste: number): string => `AVZ${poste}`;

/**
 * ⭐ EL PATRÓN OPERATIVO de un sentido desviado.
 *
 * Los saltos que **ya existían** en el feed conservan su traza y su típico —son
 * el asfalto de verdad—; los **nuevos** se reconstruyen. Devuelve `null` si la
 * secuencia de hoy se queda en menos de dos paradas con coordenada.
 */
export function patronOperativo(
  patron: PatronBus,
  real: readonly ParadaDelDiff[],
  /** Poste → parada, con las provisionales ya dentro. */
  porPoste: ReadonlyMap<number, ParadaBus>,
  rodar: RodarEntre,
): { readonly patron: PatronBus; readonly cuentas: CuentasDelOperativo } | null {
  const paradas: string[] = [];
  const puntos: ParadaBus[] = [];
  let sinCoordenada = 0;
  for (const p of real) {
    const suya = porPoste.get(p.poste);
    if (!suya) {
      sinCoordenada++;
      continue;
    }
    paradas.push(suya.id);
    puntos.push(suya);
  }
  if (paradas.length < 2) {
    return null;
  }

  // Los saltos que el feed ya tenía, por el par de paradas que unen.
  const yaEran = new Map<string, SaltoBus>();
  for (let k = 0; k + 1 < patron.paradas.length; k++) {
    yaEran.set(`${patron.paradas[k]}>${patron.paradas[k + 1]}`, patron.saltos[k]!);
  }
  const velocidad = velocidadComercial(patron);
  const cuentas: Contando = { ...vacias(), sinCoordenada };
  const saltos: SaltoBus[] = [];

  for (let k = 0; k + 1 < paradas.length; k++) {
    const heredado = yaEran.get(`${paradas[k]}>${paradas[k + 1]}`);
    if (heredado) {
      // ⭐ El asfalto de verdad se conserva: este tramo no ha cambiado.
      saltos.push(heredado);
      continue;
    }
    cuentas.saltosNuevos++;
    const a = puntos[k]!;
    const b = puntos[k + 1]!;
    const camino = rodar(a.lon, a.lat, b.lon, b.lat);
    const trozo = camino
      ? { geometria: camino.geometria, metros: camino.metros, recta: false }
      : { ...rectaEntre([a.lat, a.lon], [b.lat, b.lon]), recta: true };
    if (trozo.recta) {
      cuentas.rectas++;
    } else {
      cuentas.reconstruidos++;
    }
    // ⚠️ El tiempo NO sale de la doctrina: sale de la velocidad comercial de
    // este mismo patrón. Sin ella —un patrón sin metros ni segundos— se cae a
    // la velocidad media del resto y, si tampoco la hay, no se inventa: 0.
    const tipico = velocidad ? Math.round(trozo.metros / velocidad) : 0;
    saltos.push({
      tipico,
      maximo: tipico,
      traza: [...trozo.geometria],
      metros: trozo.metros,
      recta: trozo.recta,
    });
  }

  cuentas.patrones = 1;
  return {
    patron: {
      ...patron,
      // ⚠️ El id cambia: es OTRO patrón [OTP2: recorrido real distinto =
      // TripPattern nuevo]. Si conservara el del feed, cualquier cosa que los
      // compare por id creería que son el mismo.
      id: `${patron.id}#hoy`,
      paradas,
      saltos,
    },
    cuentas,
  };
}

/** El resultado de aplicar la capa de desvíos sobre la red cocinada. */
export interface RedConDesvios {
  readonly red: RedDeBus;
  /**
   * ⭐ Los postes por los que hoy **no se pasa**. La búsqueda no admite subir
   * ni bajar en ellos [OTP2: parada suprimida = `SKIPPED`].
   */
  readonly suprimidas: ReadonlySet<string>;
  /** Qué líneas van desviadas, para el aviso. */
  readonly desviadas: readonly {
    readonly linea: string;
    readonly direccion: string;
    readonly fuera: readonly string[];
    readonly hacia: readonly string[];
  }[];
  readonly cuentas: CuentasDelOperativo;
}

/**
 * ⭐ APLICA LO OBSERVADO sobre la red cocinada y devuelve **otra red**.
 *
 * La cocinada no se toca: se compone una encima. Así el día que el desvío se
 * apague —o que la observación caduque— basta con dejar de aplicarla.
 *
 * `veredictoDe` devuelve lo que se sepa de un sentido, o `null`. **No sale a la
 * red**: quien la trae es el refresco, y quien busca una ruta nunca espera.
 */
/** El nombre de una parada del diff, con su número de poste delante. */
function nombreConNumero(suya: ParadaBus | undefined, del: ParadaDelDiff): string {
  return suya ? nombrarPoste(suya.codigo, suya.nombre) : `${del.poste} · ${del.nombre}`;
}

export function aplicarDesvios(
  red: RedDeBus,
  veredictoDe: (linea: string, direccion: string) => Veredicto | null,
  /**
   * ⭐ La coordenada de los postes que el GTFS no conoce, del `marcadorParada`
   * de su feed de llegadas [técnica de ZetaBus]. **El nombre no viene de aquí**:
   * lo pone el propio `get_stops_list`, que es quien lo sabe hoy.
   *
   * ⚠️ Un poste provisional **sin coordenada se cae** del patrón y se cuenta:
   * regla B de la casa, *sin coordenada no existe*. Mejor un recorrido con un
   * hueco declarado que un punto inventado.
   */
  provisionales: ReadonlyMap<number, { readonly lat: number; readonly lon: number }>,
  rodar: RodarEntre,
): RedConDesvios {
  const porPoste = new Map<number, ParadaBus>();
  for (const p of red.paradas) {
    const poste = posteDeCodigo(p.codigo);
    if (poste !== null) {
      porPoste.set(poste, p);
    }
  }
  const usadas = new Map<number, ParadaBus>();
  const suprimidas = new Set<string>();
  const desviadas: RedConDesvios['desviadas'][number][] = [];
  const cuentas = vacias();
  const patrones: PatronBus[] = [];

  for (const patron of red.patrones) {
    const corto = red.lineas.find((l) => l.id === patron.linea)?.corto ?? patron.linea;
    const v = patron.modo === 'bus' ? veredictoDe(corto, patron.direccion) : null;
    if (!v || v.tipo !== 'comparado' || !v.hayDesvio) {
      // Sin desvío, o sin saberlo: el patrón del feed, tal cual.
      patrones.push(patron);
      continue;
    }
    // ⭐ Las suprimidas lo son para TODOS los patrones de esa línea y sentido:
    // si el autobús no pasa por la calle, no pasa para ningún refuerzo.
    for (const p of v.fuera) {
      const suya = porPoste.get(p.poste);
      if (suya) {
        suprimidas.add(suya.id);
      }
    }
    if (!patron.principal) {
      // Un refuerzo tiene otra secuencia: no se le puede pegar la de hoy. Se
      // queda como está y solo hereda las supresiones.
      patrones.push(patron);
      continue;
    }
    // Las provisionales entran en el mapa con la coordenada que se sepa y el
    // nombre que Avanza les da hoy — el GTFS no las conoce.
    for (const p of v.hacia) {
      if (porPoste.has(p.poste)) {
        continue;
      }
      const donde = provisionales.get(p.poste);
      if (!donde) {
        continue;
      }
      const nueva: ParadaBus = {
        id: idDeProvisional(p.poste),
        codigo: `PA${String(p.poste).padStart(5, '0')}`,
        nombre: p.nombre,
        lat: donde.lat,
        lon: donde.lon,
        modos: ['bus'],
      };
      porPoste.set(p.poste, nueva);
      usadas.set(p.poste, nueva);
    }
    const hecho = patronOperativo(patron, v.real, porPoste, rodar);
    if (!hecho) {
      patrones.push(patron);
      continue;
    }
    patrones.push(hecho.patron);
    cuentas.patrones += hecho.cuentas.patrones;
    cuentas.saltosNuevos += hecho.cuentas.saltosNuevos;
    cuentas.reconstruidos += hecho.cuentas.reconstruidos;
    cuentas.rectas += hecho.cuentas.rectas;
    cuentas.sinCoordenada += hecho.cuentas.sinCoordenada;
    desviadas.push({
      linea: corto,
      direccion: patron.direccion,
      // ⭐ CON SU NÚMERO [referencia GTFS, `stop_code`: el de la señal]. Aquí
      //    importa más que en ningún sitio: quien lee «no para en …» está
      //    decidiendo si SU poste es uno de ésos, y comparar «Av. San Juan De La
      //    Peña N.º 181» con «N.º 187» a ojo es pedirle un trabajo que el número
      //    del cartel resuelve de un vistazo. Ver `nombrarPoste`.
      //
      // ⚠️ El poste que Avanza nombra y el feed no conoce se queda con el
      //    nombre de Avanza y su número, que es el que la fuente ya trae.
      fuera: v.fuera.map((p) => nombreConNumero(porPoste.get(p.poste), p)),
      hacia: v.hacia.map((p) => nombreConNumero(porPoste.get(p.poste), p)),
    });
  }

  cuentas.provisionales = usadas.size;
  return {
    red: { ...red, paradas: [...red.paradas, ...usadas.values()], patrones },
    suprimidas,
    desviadas,
    cuentas,
  };
}

// ── LO QUE SE SIRVE ──────────────────────────────────────────────────────────

/**
 * ⭐ LA RED QUE SE ESTÁ SIRVIENDO, con los desvíos de hoy encima.
 *
 * ⚠️ **Quien busca una ruta nunca espera a esto.** Lo compone el refresco de
 * fondo; la búsqueda solo lee lo que haya. Si no hay nada —el motor acaba de
 * arrancar, la fuente está caída— se usa la red del feed y no se avisa de
 * ningún desvío: **no saber no es no haberlo**, y por eso el aviso solo se
 * escribe cuando el diff dice `comparado`.
 */
let servida: RedConDesvios | null = null;

export function servirOperativa(compuesta: RedConDesvios | null): void {
  servida = compuesta;
}

export function laOperativa(): RedConDesvios | null {
  return servida;
}

/**
 * ⭐ EL AVISO DEL DESVÍO, con sus nombres. Uno por línea y sentido desviados.
 *
 * Se escribe entero aquí y viaja en el `Trayecto`: la pantalla lo enseña arriba
 * y al lado del hito que toca, sin recomponer nada [GOV.UK, doble sitio].
 */
export function avisoDeDesvio(d: RedConDesvios['desviadas'][number]): string {
  const partes: string[] = [`La línea ${d.linea} va hoy desviada`];
  if (d.fuera.length > 0) {
    partes.push(`no para en ${d.fuera.join(', ')}`);
  }
  if (d.hacia.length > 0) {
    partes.push(`para provisionalmente en ${d.hacia.join(', ')}`);
  }
  return partes.join(': ').replace(/: (no para)/, ': $1') + '.';
}

/**
 * ⭐ EL REFRESCO ENTERO: pregunta, compone y sirve.
 *
 * Es lo que corre al arrancar y cada hora. ⚠️ **Nadie lo espera**: la búsqueda
 * lee lo que haya servido, y mientras no haya nada usa la red del feed.
 */
/**
 * ⭐ EL RESUMEN DEL REFRESCO, en UNA línea y con las DOS cuentas.
 *
 * ⚠️ **Esto es media entrada de bitácora.** El log decía «23 desviados» en una
 * línea y «4 patrones rehechos» en la siguiente, y las dos eran ciertas: la
 * primera cuenta lo que la FUENTE contestó y la segunda lo que se APLICÓ. Con
 * palabras distintas y en renglones distintos, 19 desvíos perdidos no producían
 * ni una señal — había que leer dos líneas, saber que deberían parecerse y
 * restar de cabeza.
 *
 * Ahora van juntas, con la misma palabra, y **si no cuadran se dice**.
 */
export function resumenDelRefresco(cuentas: CuentasDeDesvios, aplicados: number): string {
  const base =
    `ruta operativa de hoy — ${cuentas.sentidos} sentidos · ` +
    `${cuentas.desviados} detectados · ${aplicados} aplicados · ` +
    `${cuentas.indeterminados} sin saber · ${Math.round(cuentas.ms / 1000)} s`;
  const perdidos = cuentas.desviados - aplicados;
  return perdidos === 0
    ? base
    : `${base} · ⚠ ${perdidos} DETECTADOS Y NO APLICADOS: hay viajes que pueden subir donde el bus hoy no para`;
}

export async function refrescarYServir(
  motor: Motor,
  red: RedDeBus,
  fecha: string,
  pedir: typeof fetch = fetch,
  pausaMs = 250,
  /** ⚠️ Se acepta para poder PROBARLO: sin reloj falso no hay forma de montar
   *     el caso de los dos pases seguidos, que es donde vivía el fallo. */
  ahora: () => number = Date.now,
): Promise<{ readonly deLaFuente: CuentasDeDesvios; readonly deLaRed: CuentasDelOperativo }> {
  const deLaFuente = await refrescarDesvios(red, fecha, pedir, pausaMs, ahora);

  // Las coordenadas de los postes que el GTFS no conoce, del `marcadorParada`
  // de su feed de llegadas [técnica de ZetaBus]. Una petición por poste nuevo,
  // y solo por los nuevos: los que el feed ya tiene no se preguntan.
  const conocidos = new Set(
    red.paradas.map((p) => posteDeCodigo(p.codigo)).filter((x): x is number => x !== null),
  );
  // ⚠️ Y los postes nuevos salen de **lo que este pase leyó**, por lo mismo: si
  //    se pidieran a la caché, un pase largo se quedaría sin provisionales y los
  //    patrones desviados no se podrían rehacer.
  const nuevos = new Set<number>();
  for (const v of deLaFuente.leido.values()) {
    if (v.tipo !== 'comparado') {
      continue;
    }
    for (const p of v.hacia) {
      if (!conocidos.has(p.poste)) {
        nuevos.add(p.poste);
      }
    }
  }
  const donde = new Map<number, { readonly lat: number; readonly lon: number }>();
  for (const poste of nuevos) {
    const coord = await coordenadaDelPoste(poste, pedir);
    if (coord) {
      donde.set(poste, coord);
    }
    if (pausaMs > 0) {
      await new Promise((sigue) => setTimeout(sigue, pausaMs));
    }
  }

  // ⭐ POR CALZADA, no por donde puede una bici. Ver la cabecera: el pendiente
  //    del 31/08 y lo que cuesta cumplirlo.
  const rodar = rodarConElCoche(laRedDeCoche());
  // ⭐ SE APLICA LO QUE ESTE PASE ACABA DE LEER, no lo que la caché tenga ahora.
  //
  // ⚠️ Aquí ponía `desvioServido(linea, direccion)`, o sea: se volvía a preguntar
  //    a la capa **después** de un pase que tarda de 17 a 36 segundos. Y la capa
  //    caduca — con un TTL que además era el mismo que el periodo del refresco—,
  //    así que los veredictos servidos de caché al principio del pase, que
  //    conservan su `cuando` viejo, morían en el camino. Medido con reloj falso:
  //    64 detectados, 0 visitas nuevas a la fuente y **0 vivos a los 11 s**.
  //    En producción eso fueron 23 desviados y 4 aplicados. Ver la entrada del
  //    1/09 en `docs/BITACORA.md`.
  const compuesta = aplicarDesvios(
    red,
    (linea, direccion) => deLaFuente.leido.get(claveDe(linea, direccion)) ?? null,
    donde,
    rodar,
  );
  servirOperativa(compuesta);
  return { deLaFuente, deLaRed: compuesta.cuentas };
}
