import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Vertice } from '@desplazame/tipos';
import { Capas, type CapasDeVerificacion } from './capas';
import { Visor } from './visor';

const PUNTO: readonly Vertice[] = [[41.6488, -0.8891]];
const LINEA: readonly (readonly Vertice[])[] = [
  [
    [41.6488, -0.8891],
    [41.6516, -0.879],
  ],
];

/**
 * Capas de mentira, con una pizca de dato en cada una. No hace falta más: lo
 * que se comprueba es que el visor las enseña TODAS, no cuántos puntos tiene
 * cada una. Y sin red: el servicio de verdad no se toca.
 */
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
    cargar: () => {},
  };
}

/**
 * Un contexto 2D de mentira, y hace falta: **jsdom no tiene canvas**, así que
 * `getContext('2d')` devuelve null y el renderizador de Leaflet revienta en
 * cuanto hay una capa que pintar —`Cannot read properties of null (reading
 * 'translate')`—, abortando el pintado de las demás. Ocho de las nueve capas
 * van por canvas, así que sin esto no hay control que mirar.
 *
 * Se finge SOLO el empujar píxeles: Leaflet, el mapa, las capas y el control
 * son los de verdad, y lo que se comprueba es su DOM. El apoderado devuelve una
 * función vacía para cualquier método —`moveTo` y `lineTo` los llama por índice
 * y una lista cerrada se quedaría corta— y guarda lo que le asignen.
 */
function contexto2dFalso(): CanvasRenderingContext2D {
  const nada = () => {};
  return new Proxy({} as Record<string | symbol, unknown>, {
    get: (destino, prop) => (prop in destino ? destino[prop] : nada),
  }) as unknown as CanvasRenderingContext2D;
}

/** Los nombres que el control de capas de Leaflet tiene puestos ahora mismo. */
function capasDelControl(raiz: HTMLElement): string[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>('.leaflet-control-layers-overlays label'),
  ).map((l) => l.textContent?.trim() ?? '');
}

describe('Visor', () => {
  const getContextDeVerdad = HTMLCanvasElement.prototype.getContext;

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = (() =>
      contexto2dFalso()) as unknown as typeof getContextDeVerdad;
    await TestBed.configureTestingModule({
      imports: [Visor],
      providers: [{ provide: Capas, useValue: capasLlenas() }],
    }).compileComponents();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = getContextDeVerdad;
  });

  it('el mapa llena la caja, en vez de medir las 22 rem del formulario', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const lienzo = raiz.querySelector<HTMLElement>('.lienzo')!;
    expect(lienzo.style.height).toBe('100%');
  });

  it('el control lista las once capas', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(capasDelControl(raiz).length).toBe(11);
  });

  it('las once son las once, cada una con su nombre', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const nombres = capasDelControl(raiz).map((n) => n.replace(/\s*\(.*\)$/, ''));
    expect(nombres).toEqual([
      'Portales',
      'Grafo peatonal/ciclable',
      'Carriles bici',
      'Postes de bus',
      'Trazados de bus',
      'Tranvía',
      'Paradas de tranvía',
      'Estaciones BiZi',
      'Aparcabicis',
      'Aparcamotos',
      'Regulado ESRO+ESRE',
    ]);
  });

  it('cada capa dice cuántas trae, que es de lo que sirve verificar', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(capasDelControl(raiz)).toContain('Portales (1)');
  });

  it('el visor no dibuja ningún trayecto: no es lo que viene a verificar', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });
});
