import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Sitio, Trayecto, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';
import {
  CAMINO_CHINCHETA,
  CAMINO_CRUZ,
  COLOR_DESTINO,
  COLOR_ORIGEN,
  COLOR_SITIO,
} from './iconos';

/**
 * ⭐ LOS ICONOS DE CAPA en las tres casas donde se ven.
 *
 * 1. **Las sugerencias** del autocompletar, a la izquierda de cada línea.
 * 2. **Los marcadores del mapa**, en los dos extremos de la ruta.
 * 3. **El itinerario**, en las líneas de salida y de llegada.
 *
 * Lo que se vigila no es que «haya un dibujo»: es que el dibujo **diga la
 * verdad**. Una chincheta donde hay una farmacia, o el azul del origen en el
 * destino, es peor que no pintar nada — un icono se cree sin leerlo.
 *
 * Por eso las pruebas miran las cuatro cosas que un icono puede mentir por
 * separado: el `data-icono` que declara la capa, el `data-papel`, el `fill` y
 * **el camino del dibujo**. Los cuatro salen de sitios distintos del código, y
 * cualquiera de ellos puede desmentir a los otros tres sin que se note: la
 * forma se añadió el 23/08 al descubrir que `caminoDeCapa` podía devolver
 * siempre la chincheta con las pruebas en verde.
 */

const BURGOS: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

const PORTALES_BURGOS: readonly Portal[] = [{ codigo: 'Portales.5140a', numero: '2' }];

const FARMACIA: Sitio = {
  codigo: 'Farmacias.8691',
  presentacion: 'Farmacia · Avda. de Navarra, 65',
  categoria: 'Farmacia',
};

/** Un trayecto de mentira con geometría: lo que hace falta para los marcadores. */
const TRAYECTO: Trayecto = {
  modo: 'andando',
  metros: 120,
  segundos: 86,
  avisos: [],
  geometria: [
    [41.6561, -0.8773],
    [41.6516, -0.879],
    [41.6425, -0.8865],
  ],
  pasos: [
    {
      giro: 'salida',
      texto: 'Sal de aquí y ve hacia el este',
      partes: [{ papel: 'texto', texto: 'Sal de aquí y ve hacia el este' }],
      metros: 120,
    },
    {
      giro: 'llegada',
      texto: 'Has llegado',
      partes: [{ papel: 'texto', texto: 'Has llegado' }],
      metros: 0,
    },
  ],
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

describe('⭐ LOS ICONOS de capa, en las tres casas', () => {
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<Buscador>>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    raiz = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    for (const r of http.match((q) => q.url.startsWith('/api/'))) r.flush([]);
    http.verify();
  });

  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  async function contestar(vias: readonly Via[], sitios: readonly Sitio[]): Promise<void> {
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush(vias);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush(sitios);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  function pulsar(campo: string, capa: string): void {
    raiz
      .querySelector<HTMLElement>(`[data-campo="${campo}"] .sugerencia[data-capa="${capa}"]`)!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
  }

  async function drenarEco(): Promise<void> {
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([]);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([]);
    fixture.detectChanges();
  }

  async function elegirSitioEn(campo: string): Promise<void> {
    await teclear(campo, 'navarra');
    await contestar([], [FARMACIA]);
    pulsar(campo, 'sitio');
    await drenarEco();
  }

  async function elegirDireccionEn(campo: string, portal: string): Promise<void> {
    await teclear(campo, 'burgos');
    await contestar([BURGOS], []);
    pulsar(campo, 'via');
    await drenarEco();
    for (const r of http.match(`/api/portales?via=${BURGOS.codigo}`)) r.flush(PORTALES_BURGOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    const casilla = campoDe(raiz, portal);
    casilla.value = '2';
    casilla.dispatchEvent(new Event('input'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    casilla
      .closest('app-selector-portal')!
      .querySelector<HTMLElement>('.portal')!
      .dispatchEvent(new MouseEvent('mousedown'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  /** Los iconos de un desplegable, en orden, con lo que dicen. */
  function iconosDe(campo: string): { icono: string; papel: string; color: string }[] {
    const lista = raiz.querySelectorAll<SVGElement>(
      `[data-campo="${campo}"] .sugerencia svg[data-icono]`,
    );
    return Array.from(lista).map((svg) => ({
      icono: svg.getAttribute('data-icono') ?? '',
      papel: svg.getAttribute('data-papel') ?? '',
      color: svg.querySelector('path')?.getAttribute('fill') ?? '',
    }));
  }

  // ── CASA 1: LAS SUGERENCIAS ────────────────────────────────────────────────

  it('⭐ cada sugerencia lleva su icono: chincheta la calle, cruz el sitio', async () => {
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);

    expect(iconosDe('calleDestino')).toEqual([
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
      { icono: 'sitio', papel: 'destino', color: COLOR_SITIO },
    ]);
  });

  it('el icono va A LA IZQUIERDA del nombre, no detrás', async () => {
    // El sitio en la línea es la mitad del encargo: un icono detrás del texto
    // se lee DESPUÉS, y entonces no ahorra la lectura que venía a ahorrar.
    // Es orden del DOM, que es lo único que una prueba sin pintar puede ver.
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);

    const linea = raiz.querySelector<HTMLElement>('[data-campo="calleDestino"] .sugerencia')!;
    const hijos = Array.from(linea.children).map((e) => e.tagName.toLowerCase());
    expect(hijos[0]).toBe('app-icono-capa');
    expect(hijos.indexOf('app-icono-capa')).toBeLessThan(
      hijos.findIndex((t) => t === 'span'),
    );
  });

  it('⭐ la chincheta del campo de ORIGEN es azul, la del DESTINO magenta', async () => {
    await teclear('calleOrigen', 'burgos');
    await contestar([BURGOS], []);
    expect(iconosDe('calleOrigen')).toEqual([
      { icono: 'via', papel: 'origen', color: COLOR_ORIGEN },
    ]);
    await drenarEco();

    await teclear('calleDestino', 'burgos');
    await contestar([BURGOS], []);
    expect(iconosDe('calleDestino')).toEqual([
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('la cruz de farmacia es VERDE en los dos campos: el papel no la cambia', async () => {
    await teclear('calleOrigen', 'navarra');
    await contestar([], [FARMACIA]);
    const enOrigen = iconosDe('calleOrigen');
    await drenarEco();

    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);
    const enDestino = iconosDe('calleDestino');

    expect(enOrigen.map((i) => i.color)).toEqual([COLOR_SITIO]);
    expect(enDestino.map((i) => i.color)).toEqual([COLOR_SITIO]);
  });

  // ── CASA 2: LOS MARCADORES DEL MAPA ────────────────────────────────────────

  /** Genera la ruta con los dos lados ya puestos y devuelve los marcadores. */
  async function generarYMirarElMapa(): Promise<
    { icono: string; papel: string; color: string }[]
  > {
    raiz.querySelector<HTMLButtonElement>('.generar')!.click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    const marcas = raiz.querySelectorAll<SVGElement>('.leaflet-marker-icon svg[data-icono]');
    return Array.from(marcas).map((svg) => ({
      icono: svg.getAttribute('data-icono') ?? '',
      papel: svg.getAttribute('data-papel') ?? '',
      color: svg.querySelector('path')?.getAttribute('fill') ?? '',
    }));
  }

  it('⭐ el mapa pone DOS marcadores, uno por extremo, con su color', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'via', papel: 'origen', color: COLOR_ORIGEN },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('⭐ con una farmacia en el origen, el marcador es la cruz verde', async () => {
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'sitio', papel: 'origen', color: COLOR_SITIO },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('regenerar no acumula marcadores', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect((await generarYMirarElMapa()).length).toBe(2);
    expect((await generarYMirarElMapa()).length).toBe(2);
  });

  // ── CASA 3: EL ITINERARIO ──────────────────────────────────────────────────

  it('⭐ las líneas de salida y llegada llevan el icono de su extremo', async () => {
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const salida = raiz.querySelector<SVGElement>('.ruta__origen svg[data-icono]');
    const llegada = raiz.querySelector<SVGElement>('.ruta__destino svg[data-icono]');

    expect(salida?.getAttribute('data-icono')).toBe('sitio');
    expect(salida?.querySelector('path')?.getAttribute('fill')).toBe(COLOR_SITIO);
    expect(llegada?.getAttribute('data-icono')).toBe('via');
    expect(llegada?.querySelector('path')?.getAttribute('fill')).toBe(COLOR_DESTINO);
  });

  it('⭐ la FORMA corresponde a la capa, no solo el color', async () => {
    // Sin esto, `caminoDeCapa` podía devolver siempre la chincheta y las
    // pruebas seguían verdes: miraban `data-icono` y el `fill`, que salen de
    // otro sitio. Un dibujo que no corresponde a lo que el atributo declara es
    // exactamente lo que nadie iba a ver.
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);

    const caminos = Array.from(
      raiz.querySelectorAll<SVGElement>('[data-campo="calleDestino"] .sugerencia svg'),
    ).map((svg) => [svg.getAttribute('data-icono'), svg.querySelector('path')?.getAttribute('d')]);

    expect(caminos).toEqual([
      ['via', CAMINO_CHINCHETA],
      ['sitio', CAMINO_CRUZ],
    ]);
  });

  it('⭐ la chincheta agarra por la PUNTA y la cruz por el centro', async () => {
    // El anclaje es lo único del marcador que se equivoca en silencio: una
    // chincheta centrada deja el punto real 16 px por encima de donde se ve la
    // punta. Leaflet lo aplica como margen negativo del elemento.
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const marcas = raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
    const margen = (e: HTMLElement) => `${e.style.marginLeft} ${e.style.marginTop}`;

    expect(marcas.length).toBe(2);
    // La cruz del origen: centrada, [16, 16].
    expect(margen(marcas[0]!)).toBe('-16px -16px');
    // La chincheta del destino: por la punta, [16, 32].
    expect(margen(marcas[1]!)).toBe('-16px -32px');
  });

  it('el itinerario NO pierde su flecha: el icono se suma, no sustituye', async () => {
    // La flecha dice el PAPEL —de dónde se sale, dónde se llega— y el icono
    // dice la CLASE. Con dos farmacias las dos cruces son iguales, así que sin
    // la flecha no quedaría nada que dijera cuál es cuál.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    expect(raiz.querySelector('.ruta__origen .ruta__marca')?.textContent?.trim()).toBe('◉');
    expect(raiz.querySelector('.ruta__destino .ruta__marca')?.textContent?.trim()).toBe('⚑');
  });
});
