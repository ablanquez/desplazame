import { TestBed } from '@angular/core/testing';
import { Capas } from './capas';

/**
 * Un GeoJSON de mentira con **una de cada**: los dos tipos que se pintan y los
 * dos que no. Coordenadas en [lon, lat], como las sirve el WFS.
 */
const CUATRO_TRAMOS = {
  type: 'FeatureCollection',
  features: [
    tramo('ESRO', -0.88, 41.65),
    tramo('ESRE', -0.89, 41.66),
    // Los dos siguientes NO se pintan: no son regulado.
    tramo('LIBRE', -0.9, 41.67),
    tramo(null, -0.91, 41.68),
  ],
};

function tramo(tipo: string | null, lon: number, lat: number) {
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
    properties: { tipo_actual: tipo },
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
        new Response(JSON.stringify(CUATRO_TRAMOS), {
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
   * LA DECISIÓN DE ESTA PIEZA. De los 7.391 tramos del censo, 6.204 son LIBRE y
   * 28 no traen clasificación: **no son regulado y no se pintan**. Si algún día
   * alguien los cuela, esta prueba se pone roja antes de que aparezcan en el
   * mapa pintados como si se pagara por ellos.
   */
  it('el LIBRE y el sin clasificar NO entran en ninguna de las dos', async () => {
    const capas = await cargar();
    expect(capas.reguladoRotacion().length + capas.reguladoResidentes().length).toBe(2);
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
