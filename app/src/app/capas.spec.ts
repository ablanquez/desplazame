import { TestBed } from '@angular/core/testing';
import { Capas } from './capas';

/**
 * Un GeoJSON de mentira con una muestra de cada caso que el cargador tiene que
 * saber separar. Coordenadas en [lon, lat], como las sirve el WFS.
 */
const MUESTRA = {
  type: 'FeatureCollection',
  features: [
    // Se cobran hoy, y van a la capa del regulado.
    tramo('ESRO', 8, -0.88, 41.65),
    tramo('ESRE', 5, -0.89, 41.66),
    // LIBRE con zona SIN polígono: va a la vista de cotejo, y solo ahí.
    tramo('LIBRE', 25, -0.9, 41.67),
    tramo('LIBRE', 47, -0.92, 41.69),
    // Los tres siguientes no van a ninguna parte: LIBRE con zona que SÍ tiene
    // polígono, LIBRE sin zona, y sin clasificar.
    tramo('LIBRE', 5, -0.93, 41.7),
    tramo('LIBRE', 0, -0.94, 41.71),
    tramo(null, null, -0.91, 41.68),
  ],
};

function tramo(tipo: string | null, zona: number | null, lon: number, lat: number) {
  return {
    type: 'Feature',
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [
          [lon, lat],
          [lon + 0.001, lat + 0.001],
        ],
      ],
    },
    properties: { tipo_actual: tipo, zona_reguladora: zona },
  };
}

describe('Capas — el regulado se filtra por tipo_actual', () => {
  const fetchDeVerdad = globalThis.fetch;
  let pedidas: string[];

  beforeEach(() => {
    pedidas = [];
    globalThis.fetch = ((url: string) => {
      const u = String(url);
      pedidas.push(u);
      // Solo se contesta al fichero del regulado; las demás capas se quedan
      // colgadas a propósito, que aquí no pintan nada.
      if (!u.includes('MU1_estacionamientos_calle')) {
        return new Promise<Response>(() => {});
      }
      return Promise.resolve(
        new Response(JSON.stringify(MUESTRA), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }) as typeof globalThis.fetch;
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    globalThis.fetch = fetchDeVerdad;
  });

  /** Deja correr las promesas del cargador, que no pasan por el planificador. */
  async function cargar(): Promise<Capas> {
    const capas = TestBed.inject(Capas);
    capas.cargar();
    await new Promise((sigue) => setTimeout(sigue, 0));
    return capas;
  }

  it('se queda con el ESRO y con el ESRE', async () => {
    const capas = await cargar();
    expect(capas.reguladoRotacion().length).toBe(1);
    expect(capas.reguladoResidentes().length).toBe(1);
  });

  /**
   * LA DECISIÓN DE LA CAPA DEL REGULADO. De los 7.391 tramos del censo, 6.204
   * son LIBRE y 28 no traen clasificación: **no son regulado y no se pintan**.
   * Si algún día alguien los cuela, esta prueba se pone roja antes de que
   * aparezcan en el mapa pintados como si se pagara por ellos.
   */
  it('ni el LIBRE ni el sin clasificar entran en el regulado', async () => {
    const capas = await cargar();
    expect(capas.reguladoRotacion().length + capas.reguladoResidentes().length).toBe(2);
  });

  /**
   * LA DECISIÓN DE LA VISTA DE COTEJO. Solo entran los LIBRE cuya zona existe y
   * **no tiene polígono publicado**. Los tres que quedan fuera son los tres
   * errores que se pueden cometer aquí: colar un LIBRE de una zona que sí tiene
   * polígono (la 5), colar los de zona 0 —que es «sin zona», no una zona— y
   * colar los que ni siquiera están clasificados.
   */
  it('la vista de cotejo se queda solo con los LIBRE de zona sin polígono', async () => {
    const capas = await cargar();
    expect(capas.ampliacionPrevista().length).toBe(2);
  });

  it('lo que se cobra hoy y lo que solo se cotea no se mezclan', async () => {
    const capas = await cargar();
    const regulado = [...capas.reguladoRotacion(), ...capas.reguladoResidentes()];
    const cotejo = capas.ampliacionPrevista();
    const comoTexto = (t: readonly (readonly (readonly number[])[])[]) =>
      t.map((v) => JSON.stringify(v));
    expect(comoTexto(regulado).filter((r) => comoTexto(cotejo).includes(r))).toEqual([]);
  });

  it('convierte a [lat, lon], que es como pinta Leaflet', async () => {
    const capas = await cargar();
    expect(capas.reguladoRotacion()[0][0]).toEqual([41.65, -0.88]);
  });

  it('pedir dos veces no vuelve a bajarse nada', async () => {
    const capas = await cargar();
    const primera = pedidas.length;
    capas.cargar();
    await new Promise((sigue) => setTimeout(sigue, 0));
    expect(pedidas.length).toBe(primera);
  });
});
