import { Injectable, signal, type Signal } from '@angular/core';
import type { Vertice } from '@desplazame/tipos';

/**
 * ANDAMIO DE VERIFICACIÓN. El navegador se baja los 46.150 portales enteros
 * (10,3 MB) solo para poder verlos sembrados en el mapa. En el punto 6 esto se
 * retira: el motor los tendrá en memoria y el navegador pedirá `/api/vias`, no
 * el fichero. La correa que lo sirve es la entrada `data` de `angular.json`.
 */
const PORTALES = '/datos/2026-05-13_zgzradar_callejero-portales-zaragoza.json';

/** Un portal, tal y como viene en el fichero municipal. */
interface PortalCrudo {
  readonly coordLat: number;
  readonly coordLon: number;
}

/**
 * ANDAMIO DE VERIFICACIÓN, como el de los portales. El fichero del grafo es un
 * `.js` de una sola línea (`window.GRAFO = {…};`) que se copió tal cual del
 * archivo: se pide como TEXTO y se le quita el prefijo en memoria. **Nunca se
 * carga como script.** En el punto 6 esto se retira: el grafo vivirá en el
 * motor y el navegador no se lo bajará.
 */
const GRAFO = '/datos/grafo-visor.js';
const GRAFO_PREFIJO = 'window.GRAFO = ';

/** Una arista: `g` son sus vértices, y vienen en [lon, lat]. */
interface AristaCruda {
  readonly g: readonly (readonly [number, number])[];
}

/**
 * ANDAMIO DE VERIFICACIÓN, como los otros dos. GeoJSON del WFS municipal: cada
 * rasgo es un MultiLineString, así que un rasgo puede traer varios tramos.
 * También en [lon, lat].
 */
const CARRILES = '/datos/2026-08-04_wfs_movilidad-MU2_carriles_bici.json';

interface CarrilCrudo {
  readonly geometry: { readonly coordinates: readonly (readonly (readonly [number, number])[])[] };
}

/**
 * ANDAMIO DE VERIFICACIÓN. GeoJSON del WFS municipal: cada rasgo es un Point.
 * También en [lon, lat]. **No trae las líneas que pasan por cada poste**: ese
 * dato no existe todavía en el repositorio (ver THIRD-PARTY-NOTICES § 1.5).
 */
const POSTES = '/datos/2026-08-10_wfs_movilidad-MU3_paradas_bus_unicas.json';

interface PosteCrudo {
  readonly geometry: { readonly coordinates: readonly [number, number] };
}

/**
 * ANDAMIO DE VERIFICACIÓN. `shapes.txt` extraído del ZIP del GTFS, tal cual:
 * CSV con `shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,...`. Aquí se
 * agrupa por trazado y se ordena por secuencia, que es lo mínimo para pintarlo.
 * El ZIP entero está en el repositorio; el navegador no lo abre —no hay
 * dependencia para eso— y por eso se sirve este miembro extraído.
 */
const TRAZADOS = '/datos/2026-08-10_nap_gtfs-ficha1176_shapes.txt';

/** Los trazados del tranvía (`route_id` 210). Comprobado: casan 2 de los 89. */
const ID_TRANVIA = /^210_/;

/**
 * ANDAMIO DE VERIFICACIÓN. `stops.txt` extraído del ZIP, tal cual. De sus 984
 * paradas solo se pintan las **50 del tranvía**: las que NO llevan `stop_code`
 * `PA…`. Las 934 de bus no se pintan desde aquí — los postes de bus salen del
 * censo municipal (§ 1.5 del notices), que es el que manda para eso.
 */
const PARADAS = '/datos/2026-08-10_nap_gtfs-ficha1176_stops.txt';
const CODIGO_BUS = /^PA/i;

/**
 * ANDAMIO DE VERIFICACIÓN. Las 276 estaciones BiZi vienen **repartidas en seis
 * páginas** porque así las sirvió el WFS, de 50 en 50, y así se copiaron: unir
 * los ficheros en disco sería derivar un fichero que nadie publicó. Se juntan
 * aquí, al leerlos.
 */
const BIZI = [0, 50, 100, 150, 200, 250].map(
  (p) => `/datos/2026-08-02_wfs_bizi_pag${p}.json`,
);

/** ANDAMIO DE VERIFICACIÓN. Los 2.158 aparcabicis, descarga propia del WFS. */
const APARCABICIS = '/datos/2026-08-17_wfs_movilidad-MU2_aparcabicis.json';

/**
 * ANDAMIO DE VERIFICACIÓN. Los 2.146 aparcamotos, segunda descarga propia. Solo
 * se leen las coordenadas: el `Numero_plazas` y el enganche al callejero
 * (`Codigo_calle` + `Portal`) viajan en el fichero y **todavía no los usa
 * nadie** — ver THIRD-PARTY-NOTICES § 1.10.
 */
const APARCAMOTOS = '/datos/2026-08-18_wfs_movilidad-MU2_motos.json';

/**
 * ANDAMIO DE VERIFICACIÓN. El estacionamiento regulado en superficie, tercera
 * descarga propia: 7.391 tramos de bordillo (MultiLineString).
 *
 * **De los 7.391 solo se pintan 1.159.** El campo que manda es `tipo_actual`:
 * `ESRO` es rotación —la zona azul— y `ESRE` residentes; los 6.204 `LIBRE` y
 * los 28 sin clasificar **no se pintan**, porque no son regulado. Viajan en el
 * fichero, que se copió entero y tal cual.
 *
 * ⚠️ **`zona_reguladora` NO dice si está regulado**: es un perímetro
 * geográfico, y **5.049 tramos LIBRES lo llevan**. Filtrar por ahí pintaría de
 * pago 5.049 bordillos gratuitos. Ver THIRD-PARTY-NOTICES § 1.11.
 */
const REGULADO = '/datos/2026-08-18_wfs_movilidad-MU1_estacionamientos_calle.json';

/** Un tramo de bordillo. Solo se miran su clase y su número de zona. */
interface TramoCrudo {
  readonly geometry: {
    readonly coordinates: readonly (readonly (readonly [number, number])[])[];
  };
  readonly properties: {
    readonly tipo_actual: string | null;
    readonly zona_reguladora: number | null;
  };
}

/**
 * Las 13 zonas que el Ayuntamiento publica como polígono
 * (`movilidad:MU1_zonas_reguladas`), medido: son exactamente 1..13, sin huecos.
 * Y son exactamente las que tienen tramos de pago — 1.157 de los 1.159.
 */
const ZONAS_CON_POLIGONO = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

/**
 * ANDAMIO DE VERIFICACIÓN. Los 13 perímetros de zona regulada, cuarta descarga
 * propia. Son el contexto del regulado: dentro de qué mancha vive cada bordillo
 * de pago. Ver THIRD-PARTY-NOTICES § 1.12.
 */
const ZONAS = '/datos/2026-08-18_wfs_movilidad-MU1_zonas_reguladas.json';

/**
 * ANDAMIO DE VERIFICACIÓN. El censo de reservas de espacio, quinta descarga
 * propia: 2.636 puntos de los que **solo se pintan las 1.226 PMR**. El resto
 * —carga y descarga, taxi, sanitarias…— viaja en el fichero sin pintarse.
 *
 * ⚠️ **El campo que manda es `TIPO`, no `SUBTIPO`.** 1.384 registros llevan
 * `SUBTIPO: 'PMR general'`, pero **158 de ellos son reservas RETIRADAS o
 * DENEGADAS**: plazas que se quitaron o que nunca se concedieron. Filtrar por
 * `SUBTIPO` mandaría a alguien con tarjeta PMR a 158 plazas que no existen.
 * Ver THIRD-PARTY-NOTICES § 1.13.
 */
const RESERVAS = '/datos/2026-08-18_wfs_movilidad-MU1_reservas.json';

/** El único `TIPO` que se pinta. */
const TIPO_PMR = '14_PMR';

/** Una reserva. `TIPO` es lo único que se mira de ella. */
interface ReservaCruda {
  readonly geometry: { readonly coordinates: readonly [number, number] };
  readonly properties: { readonly TIPO: string | null };
}

/** Una zona tal y como viene: MultiPolygon y su número. */
interface ZonaCruda {
  readonly geometry: {
    readonly coordinates: readonly (readonly (readonly (readonly [number, number])[])[])[];
  };
  readonly properties: { readonly NUMERO_ZONA: number };
}

/**
 * Una zona ya lista para pintar. Lleva el número porque es lo que se rotula: un
 * perímetro sin número no dice nada, y el número es justo lo que hay que cruzar
 * con el `zona_reguladora` de los tramos.
 *
 * No vive en `@desplazame/tipos` a propósito: el motor no sirve zonas, y el
 * contrato crece cuando el motor lo pide. Esto es andamio, como todo el resto
 * de este fichero.
 */
export interface ZonaRegulada {
  readonly numero: number;
  /** MultiPolygon: lista de polígonos, cada uno con su anillo exterior y sus huecos. */
  readonly poligonos: readonly (readonly (readonly Vertice[])[])[];
}

/**
 * Lo que el mapa necesita saber de las capas de verificación, y nada más: catorce
 * señales de solo lectura y la orden de cargarlas. Está escrito aparte del
 * servicio para que una prueba pueda darle al mapa unas capas de mentira sin
 * levantar la descarga entera.
 */
export interface CapasDeVerificacion {
  readonly portales: Signal<readonly Vertice[]>;
  readonly grafo: Signal<readonly (readonly Vertice[])[]>;
  readonly carriles: Signal<readonly (readonly Vertice[])[]>;
  readonly postes: Signal<readonly Vertice[]>;
  readonly trazados: Signal<readonly (readonly Vertice[])[]>;
  readonly tranvia: Signal<readonly (readonly Vertice[])[]>;
  readonly paradasTranvia: Signal<readonly Vertice[]>;
  readonly estacionesBizi: Signal<readonly Vertice[]>;
  readonly aparcabicis: Signal<readonly Vertice[]>;
  readonly aparcamotos: Signal<readonly Vertice[]>;
  readonly reguladoRotacion: Signal<readonly (readonly Vertice[])[]>;
  readonly reguladoResidentes: Signal<readonly (readonly Vertice[])[]>;
  readonly ampliacionPrevista: Signal<readonly (readonly Vertice[])[]>;
  readonly zonasReguladas: Signal<readonly ZonaRegulada[]>;
  readonly reservasPmr: Signal<readonly Vertice[]>;
  cargar(): void;
}

/**
 * Las catorce capas de verificación, cargadas UNA vez para toda la aplicación.
 *
 * Vivían en el componente de la pantalla, que era el único que las pintaba.
 * Con dos páginas —el buscador y el visor— eso ya no vale: [DOC] el
 * `RouterOutlet` destruye el componente de la ruta al salir de ella —«a router
 * outlet emits an activate event when a new component is instantiated,
 * deactivate event when a component is destroyed»— y lo vuelve a crear al
 * volver, así que la descarga de 34 MB se repetiría en cada ida y vuelta.
 *
 * Un servicio con [DOC] `providedIn: 'root'` —«Singleton Instance: Creates a
 * single, shared instance for the entire application»— no lo repite: la
 * instancia es la misma antes y después de navegar, y con ella las señales ya
 * llenas.
 *
 * [PROPIO] La descarga NO se lanza en el constructor sino en `cargar()`, que es
 * idempotente. Dos razones: quien pide el dato es la PÁGINA, no el mapa —el
 * mapa solo pinta lo que haya—, y así una prueba puede montar el mapa sin que
 * se dispare ni una petición de red.
 *
 * Todo esto es andamio, y se va entero en el punto 6 con lo que sostiene.
 */
@Injectable({ providedIn: 'root' })
export class Capas implements CapasDeVerificacion {
  /** Los portales, una vez descargados. Vacío mientras tanto. */
  private readonly _portales = signal<readonly Vertice[]>([]);
  readonly portales = this._portales.asReadonly();

  /** Las aristas del grafo, una vez descargadas. Vacío mientras tanto. */
  private readonly _grafo = signal<readonly (readonly Vertice[])[]>([]);
  readonly grafo = this._grafo.asReadonly();

  /** Los tramos de carril bici, una vez descargados. */
  private readonly _carriles = signal<readonly (readonly Vertice[])[]>([]);
  readonly carriles = this._carriles.asReadonly();

  /** Los postes de autobús, una vez descargados. */
  private readonly _postes = signal<readonly Vertice[]>([]);
  readonly postes = this._postes.asReadonly();

  /** Los trazados de línea de BUS del GTFS, una vez descargados. */
  private readonly _trazados = signal<readonly (readonly Vertice[])[]>([]);
  readonly trazados = this._trazados.asReadonly();

  /** Los trazados del TRANVÍA: otra red, otra agencia, capa aparte. */
  private readonly _tranvia = signal<readonly (readonly Vertice[])[]>([]);
  readonly tranvia = this._tranvia.asReadonly();

  /** Las paradas del tranvía, del mismo GTFS. */
  private readonly _paradasTranvia = signal<readonly Vertice[]>([]);
  readonly paradasTranvia = this._paradasTranvia.asReadonly();

  /** Las estaciones BiZi, unidas de sus seis páginas. */
  private readonly _estacionesBizi = signal<readonly Vertice[]>([]);
  readonly estacionesBizi = this._estacionesBizi.asReadonly();

  /** Los aparcabicis. */
  private readonly _aparcabicis = signal<readonly Vertice[]>([]);
  readonly aparcabicis = this._aparcabicis.asReadonly();

  /** Los aparcamotos. */
  private readonly _aparcamotos = signal<readonly Vertice[]>([]);
  readonly aparcamotos = this._aparcamotos.asReadonly();

  /** Los tramos ESRO: estacionamiento regulado de ROTACIÓN, la zona azul. */
  private readonly _reguladoRotacion = signal<readonly (readonly Vertice[])[]>([]);
  readonly reguladoRotacion = this._reguladoRotacion.asReadonly();

  /** Los tramos ESRE: estacionamiento regulado de RESIDENTES. */
  private readonly _reguladoResidentes = signal<readonly (readonly Vertice[])[]>([]);
  readonly reguladoResidentes = this._reguladoResidentes.asReadonly();

  /**
   * ⚠️ **VISTA DE COTEJO, HIPÓTESIS, TEMPORAL.** No es dato nuevo: son otros
   * tramos del MISMO fichero del regulado — los 2.860 `LIBRE` cuyo número de
   * zona **no tiene polígono publicado** (19 zonas: 14, 15, 16, 18, 21, 22, 25,
   * 26, 27, 29, 32, 33, 34, 37, 39, 40, 43, 46 y 47), con 21.268 plazas.
   *
   * Por qué existe: esos 19 números **no cobran ni uno solo de sus tramos**,
   * mientras que las 13 zonas con polígono se llevan 1.157 de los 1.159 de
   * pago. Esa separación limpia es la forma que tendría la ampliación de zona
   * azul/naranja que el Ayuntamiento prepara — **pero es una lectura nuestra:
   * el WFS no dice nada**. Se pinta para poder cotejarla contra los planos de
   * la ampliación que tiene Antonio.
   *
   * **Se retira o se consolida cuando el cotejo diga.** No es producto ni
   * pretende serlo.
   */
  private readonly _ampliacionPrevista = signal<readonly (readonly Vertice[])[]>([]);
  readonly ampliacionPrevista = this._ampliacionPrevista.asReadonly();

  /** Los 13 perímetros de zona regulada, con su número. */
  private readonly _zonasReguladas = signal<readonly ZonaRegulada[]>([]);
  readonly zonasReguladas = this._zonasReguladas.asReadonly();

  /**
   * Las 1.226 reservas PMR **en vigor**. Las retiradas y las denegadas se
   * quedan fuera: esto es accesibilidad, y una plaza que no existe no es un
   * error de pintado, es un viaje en balde para quien menos puede permitírselo.
   */
  private readonly _reservasPmr = signal<readonly Vertice[]>([]);
  readonly reservasPmr = this._reservasPmr.asReadonly();

  /** Si ya se pidió. La segunda página no vuelve a bajarse los 34 MB. */
  private pedido = false;

  /**
   * Lanza la descarga de las nueve capas, una sola vez en toda la vida de la
   * aplicación. Llamarlo de nuevo —al entrar en la otra página, o al volver a
   * ésta— no hace nada.
   */
  cargar(): void {
    if (this.pedido) {
      return;
    }
    this.pedido = true;
    this.cargarPortales();
    this.cargarGrafo();
    this.cargarCarriles();
    this.cargarPostes();
    this.cargarTrazados();
    this.cargarParadasTranvia();
    this.cargarBizi();
    this.cargarAparcabicis();
    this.cargarAparcamotos();
    this.cargarRegulado();
    this.cargarZonas();
    this.cargarReservasPmr();
  }

  private async cargarReservasPmr(): Promise<void> {
    try {
      const respuesta = await fetch(RESERVAS);
      if (!respuesta.ok) {
        console.error(`reservas PMR: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly ReservaCruda[] };
      this._reservasPmr.set(
        crudo.features
          .filter((rasgo) => rasgo.properties.TIPO === TIPO_PMR)
          .map((rasgo) => {
            const [lon, lat] = rasgo.geometry.coordinates;
            return [lat, lon] as Vertice;
          }),
      );
    } catch (e) {
      console.error('reservas PMR: no se pudieron cargar', e);
    }
  }

  private async cargarZonas(): Promise<void> {
    try {
      const respuesta = await fetch(ZONAS);
      if (!respuesta.ok) {
        console.error(`zonas reguladas: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly ZonaCruda[] };
      this._zonasReguladas.set(
        crudo.features
          .map((rasgo) => ({
            numero: rasgo.properties.NUMERO_ZONA,
            poligonos: rasgo.geometry.coordinates.map((pol) =>
              pol.map((anillo) => anillo.map(([lon, lat]) => [lat, lon] as Vertice)),
            ),
          }))
          // El WFS las sirve en el orden de su `fid`, que no es el del número.
          // Se ordenan para que el control y el ojo las lean de 1 a 13.
          .sort((a, b) => a.numero - b.numero),
      );
    } catch (e) {
      console.error('zonas reguladas: no se pudieron cargar', e);
    }
  }

  /**
   * Parte los tramos en las DOS clases que se pintan y tira el resto. El corte
   * se hace por `tipo_actual` y solo por ahí: es el único campo que dice si un
   * bordillo es de pago.
   */
  private async cargarRegulado(): Promise<void> {
    try {
      const respuesta = await fetch(REGULADO);
      if (!respuesta.ok) {
        console.error(`regulado: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly TramoCrudo[] };
      const rotacion: Vertice[][] = [];
      const residentes: Vertice[][] = [];
      const ampliacion: Vertice[][] = [];
      for (const rasgo of crudo.features) {
        const destino = this.dondeVa(rasgo, rotacion, residentes, ampliacion);
        if (!destino) {
          continue;
        }
        for (const tramo of rasgo.geometry.coordinates) {
          destino.push(tramo.map(([lon, lat]) => [lat, lon] as Vertice));
        }
      }
      this._reguladoRotacion.set(rotacion);
      this._reguladoResidentes.set(residentes);
      this._ampliacionPrevista.set(ampliacion);
    } catch (e) {
      console.error('regulado: no se pudo cargar', e);
    }
  }

  /**
   * A cuál de las tres listas va un tramo, o a ninguna. El corte de lo que se
   * COBRA HOY se hace solo por `tipo_actual`; `zona_reguladora` únicamente
   * entra para la vista de cotejo, y sobre tramos que ya se sabe que son LIBRE.
   */
  private dondeVa(
    rasgo: TramoCrudo,
    rotacion: Vertice[][],
    residentes: Vertice[][],
    ampliacion: Vertice[][],
  ): Vertice[][] | null {
    const { tipo_actual: tipo, zona_reguladora: zona } = rasgo.properties;
    if (tipo === 'ESRO') {
      return rotacion;
    }
    if (tipo === 'ESRE') {
      return residentes;
    }
    if (tipo === 'LIBRE' && zona !== null && zona !== 0 && !ZONAS_CON_POLIGONO.has(zona)) {
      return ampliacion;
    }
    return null;
  }

  private async cargarAparcamotos(): Promise<void> {
    try {
      const respuesta = await fetch(APARCAMOTOS);
      if (!respuesta.ok) {
        console.error(`aparcamotos: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
      this._aparcamotos.set(
        crudo.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return [lat, lon] as Vertice;
        }),
      );
    } catch (e) {
      console.error('aparcamotos: no se pudieron cargar', e);
    }
  }

  private async cargarAparcabicis(): Promise<void> {
    try {
      const respuesta = await fetch(APARCABICIS);
      if (!respuesta.ok) {
        console.error(`aparcabicis: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
      this._aparcabicis.set(
        crudo.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return [lat, lon] as Vertice;
        }),
      );
    } catch (e) {
      console.error('aparcabicis: no se pudieron cargar', e);
    }
  }

  private async cargarBizi(): Promise<void> {
    try {
      const paginas = await Promise.all(
        BIZI.map(async (url) => {
          const respuesta = await fetch(url);
          if (!respuesta.ok) {
            throw new Error(`${url} respondió ${respuesta.status}`);
          }
          return (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
        }),
      );
      this._estacionesBizi.set(
        paginas.flatMap((p) =>
          p.features.map((f) => {
            const [lon, lat] = f.geometry.coordinates;
            return [lat, lon] as Vertice;
          }),
        ),
      );
    } catch (e) {
      console.error('estaciones BiZi: no se pudieron cargar', e);
    }
  }

  private async cargarParadasTranvia(): Promise<void> {
    try {
      const respuesta = await fetch(PARADAS);
      if (!respuesta.ok) {
        console.error(`paradas de tranvía: el servidor respondió ${respuesta.status}`);
        return;
      }
      const lineas = (await respuesta.text()).split(/\r?\n/);
      const cabecera = this.campos(lineas[0]);
      const iCod = cabecera.indexOf('stop_code');
      const iLat = cabecera.indexOf('stop_lat');
      const iLon = cabecera.indexOf('stop_lon');
      if (iCod < 0 || iLat < 0 || iLon < 0) {
        console.error('paradas de tranvía: stops.txt no trae las columnas esperadas');
        return;
      }

      const paradas: Vertice[] = [];
      for (const linea of lineas.slice(1)) {
        if (!linea) continue;
        const c = this.campos(linea);
        if (CODIGO_BUS.test(c[iCod])) continue;
        paradas.push([Number(c[iLat]), Number(c[iLon])]);
      }
      this._paradasTranvia.set(paradas);
    } catch (e) {
      console.error('paradas de tranvía: no se pudieron cargar', e);
    }
  }

  /** Parte una línea CSV respetando las comillas: los nombres traen comas. */
  private campos(linea: string): string[] {
    const salida: string[] = [];
    let actual = '';
    let entreComillas = false;
    for (const c of linea) {
      if (c === '"') {
        entreComillas = !entreComillas;
      } else if (c === ',' && !entreComillas) {
        salida.push(actual);
        actual = '';
      } else {
        actual += c;
      }
    }
    salida.push(actual);
    return salida;
  }

  private async cargarTrazados(): Promise<void> {
    try {
      const respuesta = await fetch(TRAZADOS);
      if (!respuesta.ok) {
        console.error(`trazados: el servidor respondió ${respuesta.status}`);
        return;
      }
      const lineas = (await respuesta.text()).split(/\r?\n/);
      const cabecera = lineas[0].split(',');
      const iId = cabecera.indexOf('shape_id');
      const iLat = cabecera.indexOf('shape_pt_lat');
      const iLon = cabecera.indexOf('shape_pt_lon');
      const iSeq = cabecera.indexOf('shape_pt_sequence');
      if (iId < 0 || iLat < 0 || iLon < 0 || iSeq < 0) {
        console.error('trazados: shapes.txt no trae las columnas esperadas');
        return;
      }

      const porTrazado = new Map<string, { orden: number; punto: Vertice }[]>();
      for (const linea of lineas.slice(1)) {
        if (!linea) continue;
        const c = linea.split(',');
        const puntos = porTrazado.get(c[iId]) ?? [];
        puntos.push({ orden: Number(c[iSeq]), punto: [Number(c[iLat]), Number(c[iLon])] });
        porTrazado.set(c[iId], puntos);
      }

      // El tranvía es otra red y otra agencia: se separa para verlo como lo
      // que es. Son sus 2 trazados (`210_I`, `210_V`) frente a los 87 de bus,
      // que se llaman `Route_N` — el patrón del nombre los distingue sin
      // necesidad de `trips`. Esto NO distingue líneas de bus entre sí: eso
      // sigue siendo del motor.
      const ordenados = (puntos: { orden: number; punto: Vertice }[]) =>
        puntos.sort((a, b) => a.orden - b.orden).map((p) => p.punto);

      const bus: Vertice[][] = [];
      const tranvia: Vertice[][] = [];
      for (const [id, puntos] of porTrazado) {
        (ID_TRANVIA.test(id) ? tranvia : bus).push(ordenados(puntos));
      }
      this._trazados.set(bus);
      this._tranvia.set(tranvia);
    } catch (e) {
      console.error('trazados: no se pudieron cargar', e);
    }
  }

  private async cargarPostes(): Promise<void> {
    try {
      const respuesta = await fetch(POSTES);
      if (!respuesta.ok) {
        console.error(`postes: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly PosteCrudo[] };
      this._postes.set(
        crudo.features.map((f) => {
          const [lon, lat] = f.geometry.coordinates;
          return [lat, lon] as Vertice;
        }),
      );
    } catch (e) {
      console.error('postes: no se pudieron cargar', e);
    }
  }

  /** Aplana los MultiLineString a tramos sueltos, que es lo que se pinta. */
  private async cargarCarriles(): Promise<void> {
    try {
      const respuesta = await fetch(CARRILES);
      if (!respuesta.ok) {
        console.error(`carriles: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudo = (await respuesta.json()) as { readonly features: readonly CarrilCrudo[] };
      this._carriles.set(
        crudo.features.flatMap((f) =>
          f.geometry.coordinates.map((tramo) => tramo.map(([lon, lat]) => [lat, lon] as Vertice)),
        ),
      );
    } catch (e) {
      console.error('carriles: no se pudieron cargar', e);
    }
  }

  /**
   * Pide el grafo como texto, le quita el prefijo de asignación y se queda
   * SOLO con las aristas: el enganche portal→arista y la auditoría que
   * también viajan en el fichero ni se leen ni se pintan.
   */
  private async cargarGrafo(): Promise<void> {
    try {
      const respuesta = await fetch(GRAFO);
      if (!respuesta.ok) {
        console.error(`grafo: el servidor respondió ${respuesta.status}`);
        return;
      }
      const texto = await respuesta.text();
      if (!texto.startsWith(GRAFO_PREFIJO)) {
        console.error('grafo: el fichero no empieza por el prefijo esperado');
        return;
      }
      const crudo = JSON.parse(texto.slice(GRAFO_PREFIJO.length).replace(/;\s*$/, '')) as {
        readonly aristas: readonly AristaCruda[];
      };
      this._grafo.set(
        crudo.aristas.map((a) => a.g.map(([lon, lat]) => [lat, lon] as Vertice)),
      );
    } catch (e) {
      console.error('grafo: no se pudo cargar', e);
    }
  }

  private async cargarPortales(): Promise<void> {
    try {
      const respuesta = await fetch(PORTALES);
      if (!respuesta.ok) {
        console.error(`portales: el servidor respondió ${respuesta.status}`);
        return;
      }
      const crudos = (await respuesta.json()) as readonly PortalCrudo[];
      this._portales.set(crudos.map((p) => [p.coordLat, p.coordLon] as Vertice));
    } catch (e) {
      console.error('portales: no se pudieron cargar', e);
    }
  }
}
