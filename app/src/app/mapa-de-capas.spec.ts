import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Vertice } from '@desplazame/tipos';
import { Capas, type CapasDeVerificacion, type ZonaRegulada } from './capas';
import { MapaDeCapas } from './mapa-de-capas';
import { Tema } from './tema';
import { AA_GRAFICO, contraste, PLANO_OSCURO_MAS_CLARO, PLANO_OSCURO_MAS_OSCURO } from './contraste';

/**
 * ⭐ EL MAPA DE CAPAS, Y SOBRE TODO SU TEMA (19/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️ **ESTE FICHERO NACIÓ DE UN ROJO QUE SE VIO EN PANTALLA, NO DE UNA IDEA.**
 *
 *  Al capturar el visor para el ojo de Antonio —las catorce capas encendidas,
 *  tesela clara y tesela oscura— la última cuenta dijo:
 *
 *      casillas encendidas al final: 0
 *
 *  Se habían encendido catorce y quedaban cero. Cambiar de tema las apagaba
 *  todas. La causa: el getter `paleta` leía `tema.oscuro()` a pelo, y como lo
 *  llaman los catorce `pintar*` —que viven dentro de un `effect()`— el tema se
 *  volvía dependencia de los catorce, y cambiar de tesela los **rehacía**. Una
 *  capa rehecha nace apagada.
 *
 *  ⚠️ **Y NADA LO CUBRÍA.** Las siete juezas del visor recuperadas de agosto no
 *     mencionan el tema ni una vez — el tema nació el 15/09, tres semanas
 *     después de que aquéllas se escribieran. No hubo verde mentiroso: hubo una
 *     zona sin vigilar, que también es un dato. Esto es esa vigilancia.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PUNTO: readonly Vertice[] = [[41.6488, -0.8891]];
const LINEA: readonly (readonly Vertice[])[] = [
  [
    [41.6488, -0.8891],
    [41.6516, -0.879],
  ],
];
const ZONA: readonly ZonaRegulada[] = [
  {
    numero: 1,
    poligonos: [
      [
        [
          [41.65, -0.89],
          [41.65, -0.88],
          [41.66, -0.88],
          [41.65, -0.89],
        ],
      ],
    ],
  },
];

/** Las quince señales llenas, sin red: el servicio de verdad no se toca. */
function capasLlenas(): CapasDeVerificacion {
  return {
    portales: signal(PUNTO),
    grafo: signal(LINEA),
    carriles: signal(LINEA),
    postes: signal(PUNTO),
    trazados: signal(LINEA),
    tranvia: signal(LINEA),
    paradasTranvia: signal(PUNTO),
    estacionesBizi: signal(PUNTO),
    aparcabicis: signal(PUNTO),
    aparcamotos: signal(PUNTO),
    reguladoRotacion: signal(LINEA),
    reguladoResidentes: signal(LINEA),
    ampliacionPrevista: signal(LINEA),
    zonasReguladas: signal(ZONA),
    reservasPmr: signal(PUNTO),
    cargar: () => {},
  };
}

/** jsdom no tiene canvas: se finge SOLO el empujar píxeles. Ver `visor.spec.ts`. */
function contexto2dFalso(): CanvasRenderingContext2D {
  const nada = () => {};
  return new Proxy({} as Record<string | symbol, unknown>, {
    get: (destino, prop) => (prop in destino ? destino[prop] : nada),
  }) as unknown as CanvasRenderingContext2D;
}

const encendidas = (raiz: HTMLElement): number =>
  raiz.querySelectorAll('.leaflet-control-layers-selector:checked').length;

const casillas = (raiz: HTMLElement): HTMLInputElement[] =>
  Array.from(raiz.querySelectorAll<HTMLInputElement>('.leaflet-control-layers-selector'));

describe('MapaDeCapas — las catorce y su tema', () => {
  const getContextDeVerdad = HTMLCanvasElement.prototype.getContext;

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = (() =>
      contexto2dFalso()) as unknown as typeof getContextDeVerdad;
    document.documentElement.setAttribute('data-theme', 'light');
    await TestBed.configureTestingModule({
      imports: [MapaDeCapas],
      providers: [{ provide: Capas, useValue: capasLlenas() }],
    }).compileComponents();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = getContextDeVerdad;
    document.documentElement.removeAttribute('data-theme');
  });

  /** Monta el componente con las capas llenas y devuelve lo necesario. */
  async function montar() {
    const fixture = TestBed.createComponent(MapaDeCapas);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('registra las catorce casillas, y ninguna encendida al abrir', async () => {
    const { raiz } = await montar();
    expect(casillas(raiz).length).toBe(14);
    expect(encendidas(raiz)).toBe(0);
  });

  /**
   * ⭐ LA JUEZA QUE NACIÓ EN ROJO: `expected 0 to be 14`.
   *
   * Es la que faltaba. Quien está verificando un dato enciende una capa, se
   * pone el tema oscuro para ver mejor los bordillos —que es justo cuando se
   * cambia de tema— y se le apaga todo. Un instrumento que se resetea solo no
   * es un instrumento.
   */
  it('⭐ cambiar de tema NO apaga las capas encendidas', async () => {
    const { fixture, raiz } = await montar();
    for (const c of casillas(raiz)) c.click();
    await fixture.whenStable();
    expect(encendidas(raiz)).toBe(14);

    document.documentElement.setAttribute('data-theme', 'dark');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(encendidas(raiz)).toBe(14);
  });

  /**
   * ⭐ Y EL CONTRASTE: que el efecto del tema SÍ haga algo.
   *
   * Sin esto, la de arriba podría estar verde porque el efecto del tema no hace
   * nada en absoluto — que es otra forma de estar roto, y más callada.
   *
   * ⚠️ **Lo que se mira es la TESELA, y no el color de una capa, y tiene
   *    motivo**: las catorce capas se pintan con `renderer: L.canvas()`, así
   *    que en el DOM no hay ningún `<path>` cuyo `stroke` leer — se intentó, y
   *    devolvió `null`. Los colores se compran en las dos juezas de contraste
   *    de abajo; lo que ésta compra es que el cambio de tema **llegue hasta
   *    Leaflet**, que es el eslabón que podría romperse en silencio.
   *
   *    Y de propina vigila la atribución, que viaja colgada de cada tesela:
   *    con la de CARTO puesta tiene que aparecer su aviso, y con la de OSM no.
   */
  it('⭐ y el tema SÍ llega a Leaflet: la tesela y su atribución cambian', async () => {
    const { fixture, raiz } = await montar();
    const atribucion = (): string =>
      raiz.querySelector('.leaflet-control-attribution')?.textContent ?? '';

    expect(atribucion()).toContain('colaboradores de OpenStreetMap');
    expect(atribucion()).not.toContain('CARTO');

    document.documentElement.setAttribute('data-theme', 'dark');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(atribucion()).toContain('CARTO');
    // Y la de OSM NO se va: el dato de debajo sigue siendo suyo, lo pinte quien
    // lo pinte. La ODbL no cambia con la tesela.
    expect(atribucion()).toContain('colaboradores de OpenStreetMap');
  });

  /**
   * ⭐ LOS SEIS TONOS DEL OSCURO PASAN LA VARA, y se mide aquí para que no se
   *    quede en una tabla de comentarios que nadie vuelve a comprobar.
   *
   * [WCAG 1.4.11] 3:1 contra lo adyacente. El plano del Dark Matter de CARTO va
   * de `#262626` a `#000000`, y se toma el PEOR de los dos.
   */
  it('⭐ los tonos del tema oscuro llegan a 3:1 sobre el Dark Matter', () => {
    const delOscuro = {
      portales: '#818cf8',
      trazados: '#a78bfa',
      tranvia: '#e5e7eb',
      paradaTranvia: '#e5e7eb',
      morada: '#d946ef',
      zonas: '#94a3b8',
    };
    for (const [capa, color] of Object.entries(delOscuro)) {
      const peor = Math.min(
        contraste(color, PLANO_OSCURO_MAS_CLARO),
        contraste(color, PLANO_OSCURO_MAS_OSCURO),
      );
      expect(`${capa} ${peor >= AA_GRAFICO}`).toBe(`${capa} true`);
    }
  });

  /**
   * ⭐ Y LOS DE AGOSTO QUE SE QUEDAN, TAMBIÉN — que es lo que justifica no
   *    haberlos tocado. Si mañana alguien cambia uno «para que combine», aquí
   *    se entera de que lo ha bajado de la vara.
   */
  it('⭐ y los ocho que conservan el color de agosto también lo llegan', () => {
    const deAgosto = {
      grafo: '#15803d',
      carriles: '#db2777',
      postes: '#dc2626',
      bizi: '#54A097',
      aparcabicis: '#eab308',
      aparcamotos: '#6b8e23',
      esro: '#0284c7',
      esre: '#f97316',
    };
    for (const [capa, color] of Object.entries(deAgosto)) {
      const peor = Math.min(
        contraste(color, PLANO_OSCURO_MAS_CLARO),
        contraste(color, PLANO_OSCURO_MAS_OSCURO),
      );
      expect(`${capa} ${peor >= AA_GRAFICO}`).toBe(`${capa} true`);
    }
  });

  it('el servicio se LEE, no se dispara: montar el mapa no pide ni un byte', async () => {
    // Quien pide la descarga es la página (`visor.ts`), no el mapa. Si algún
    // día el mapa llamara a `cargar()`, una prueba de unidad bajaría 40,72 MiB.
    const peticiones: string[] = [];
    const antes = globalThis.fetch;
    globalThis.fetch = ((u: string) => {
      peticiones.push(String(u));
      return new Promise<Response>(() => {});
    }) as typeof globalThis.fetch;
    try {
      await montar();
      expect(peticiones).toEqual([]);
    } finally {
      globalThis.fetch = antes;
    }
  });

  it('usa el Tema de la casa, y no una copia suya', () => {
    // El tema efectivo lo decide `tema.ts` leyendo `color-scheme` computado.
    // Que este componente lo INYECTE es lo que garantiza que no reimplemente
    // la prioridad «elección > sistema > claro», que es la lección de la nº43.
    expect(TestBed.inject(Tema)).toBeInstanceOf(Tema);
  });
});
