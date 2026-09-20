import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Vertice } from '@desplazame/tipos';
import { Capas, type CapasDeVerificacion, type ZonaRegulada } from './capas';
import { Visor } from './visor';

const PUNTO: readonly Vertice[] = [[41.6488, -0.8891]];
const LINEA: readonly (readonly Vertice[])[] = [
  [
    [41.6488, -0.8891],
    [41.6516, -0.879],
  ],
];

/** Una zona de mentira: un triangulito con su número. */
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

/**
 * Capas de mentira, con una pizca de dato en cada una. No hace falta más: lo
 * que se comprueba es que el visor las enseña TODAS, no cuántos puntos tiene
 * cada una. Y sin red: el servicio de verdad no se toca.
 */
function capasLlenas(): CapasDeVerificacion {
  const recordadas = signal<ReadonlySet<string>>(new Set());
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
    // ⭐ El estado del instrumento (20/09, H2): las encendidas viven en el
    //    servicio, así que el doble también las lleva — y con una señal de
    //    verdad, porque el mapa las lee y las escribe.
    encendidas: recordadas.asReadonly(),
    recordar: (claves) => recordadas.set(new Set(claves)),
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

/** Cuántas casillas del control están marcadas, o sea, cuántas capas se ven. */
function capasEncendidas(raiz: HTMLElement): number {
  return raiz.querySelectorAll('.leaflet-control-layers-selector:checked').length;
}

/** Las casillas del control, que es por donde una persona enciende una capa. */
function casillasDelControl(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('.leaflet-control-layers-selector'));
}

/** Qué capas están encendidas ahora mismo, por el rótulo que lleva cada una. */
function nombresEncendidos(raiz: HTMLElement): string[] {
  return casillasDelControl(raiz)
    .filter((c) => c.checked)
    .map((c) => c.closest('label')?.textContent?.trim() ?? '');
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

  it('el control lista las catorce capas', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(capasDelControl(raiz).length).toBe(14);
  });

  it('las catorce son las catorce, cada una con su nombre', async () => {
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
      '¿Ampliación? zonas sin activar',
      'Zonas reguladas',
      'Reservas PMR',
    ]);
  });

  it('cada capa dice cuántas trae, que es de lo que sirve verificar', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(capasDelControl(raiz)).toContain('Portales (1)');
  });

  /**
   * Ninguna arranca encendida. Con catorce capas superpuestas el mapa de partida
   * era ilegible, y verificar es mirar una cosa cada vez: se encienden a mano.
   */
  it('las catorce están en el control y ninguna encendida', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(capasDelControl(raiz).length).toBe(14);
    expect(capasEncendidas(raiz)).toBe(0);
  });

  /**
   * Las manchas de zona van en su PROPIO panel, por debajo de los bordillos. Sin
   * esto, encender las zonas después del regulado taparía justo lo que se quiere
   * comparar — y el orden lo decide quien pulsa las casillas, no el código.
   * [DOC] Leaflet: `overlayPane` va a zIndex 400; 350 queda por debajo.
   */
  it('las manchas tienen su panel, y va por debajo del de los bordillos', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const manchas = raiz.querySelector<HTMLElement>('.leaflet-manchas-pane');
    expect(manchas).not.toBeNull();
    expect(Number(manchas!.style.zIndex)).toBeLessThan(400);
  });

  /**
   * ⭐ H1 · EL CONMUTADOR DE TEMA, EN LA PÁGINA (20/09, el ojo de Antonio).
   *
   * Nació en rojo: el visor montaba cabecera y mapa y **nada más**, así que el
   * tema solo se cambiaba yendo a la portada y volviendo — y volver costaba las
   * capas encendidas (la jueza de abajo). No es una copia del interruptor: es
   * la MISMA pieza de la casa (§35), importada, con su `role="switch"` y su
   * nombre estable.
   */
  it('⭐ el conmutador de tema está EN la página, y no en la portada', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const boton = raiz.querySelector('[role="switch"][aria-label="Modo oscuro"]');
    expect(boton).not.toBeNull();
    expect(boton!.tagName).toBe('BUTTON');
  });

  /**
   * ⭐ H2 · LO ENCENDIDO SOBREVIVE A SALIR Y VOLVER (20/09, el ojo de Antonio).
   *
   * Nació en rojo: `expected [] to equal [ 'Carriles bici (1)', … ]`.
   *
   * ⚠️ **`destroy()` NO es un apaño de prueba: es lo que hace el router.**
   *    Medido en Chrome antes de escribir esto — con un centinela sembrado en
   *    `window`, ir a la portada y volver **no recarga el documento** (el
   *    centinela sigue vivo) y aun así el visor nace de cero: lo que se
   *    destruye y se vuelve a crear es el COMPONENTE, que es exactamente lo
   *    que hace esta jueza. [DOC Angular] el `RouterOutlet` «emits a
   *    deactivate event when a component is destroyed».
   *
   *    Y el servicio es el mismo antes y después, que es de lo que vive el
   *    arreglo: `providedIn: 'root'`, una sola instancia para toda la app.
   */
  it('⭐ las capas encendidas sobreviven a salir de la página y volver', async () => {
    const primera = TestBed.createComponent(Visor);
    await primera.whenStable();
    const raiz1 = primera.nativeElement as HTMLElement;

    // Cuatro, como las cuatro del flujo de Antonio.
    const cajas = casillasDelControl(raiz1);
    for (const i of [2, 5, 10, 13]) cajas[i].click();
    await primera.whenStable();
    const antes = nombresEncendidos(raiz1);
    expect(antes.length).toBe(4);

    // Salir de la página: el router destruye el componente.
    primera.destroy();

    // Y volver: otro componente, el MISMO servicio.
    const segunda = TestBed.createComponent(Visor);
    await segunda.whenStable();
    const raiz2 = segunda.nativeElement as HTMLElement;

    expect(nombresEncendidos(raiz2)).toEqual(antes);
  });

  it('el visor no dibuja ningún trayecto: no es lo que viene a verificar', async () => {
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });
});
