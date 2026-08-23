import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Sitio, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';

/**
 * ⭐ EL DESTINO CON NOMBRE: el sitio como capa del autocompletar.
 *
 * Tres cosas se vigilan, y son las tres del encargo:
 *
 * 1. Que el destino ofrece **sitios además de vías**, y que se distinguen sin
 *    tener que leer el texto.
 * 2. Que al elegir un sitio **la casilla de portal se apaga** — la regla del
 *    portal condicional (19/08): un sitio trae su propia coordenada, así que
 *    pedirle un portal sería pedirle un dato que no tiene.
 * 3. Que la petición manda `{ sitio }` y **no** una pareja vía+portal
 *    inventada.
 *
 * El ORIGEN no cambia, y también se vigila: sigue pidiendo una sola capa.
 *
 * ⚠️ Aquí no se usa `whenStable()` mientras haya una petición sin contestar:
 * esperaría a que la resolviera alguien que es esta misma función unas líneas
 * más abajo. Es el abrazo mortal que `buscador.spec.ts` ya tiene documentado.
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

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

describe('⭐ EL DESTINO puede ser un SITIO', () => {
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
    http.verify();
  });

  /** Teclea y espera a que salte la consulta, sin resolver nada todavía. */
  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  /**
   * Contesta a las dos capas y deja la lista pintada. El `whenStable()` de
   * aquí es seguro: en este punto ya no queda ninguna petición sin resolver,
   * que es lo que provocaría el abrazo mortal.
   */
  async function contestar(vias: readonly Via[], sitios: readonly Sitio[]): Promise<void> {
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush(vias);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush(sitios);
    // ⚠️ Un TICK del bucle de eventos, no `whenStable()`. `httpResource`
    // publica su valor en una microtarea, así que un `detectChanges()` síncrono
    // justo después del `flush` todavía no lo ve y la lista sale vacía. Y
    // `whenStable()` tampoco vale: aquí no queda ninguna petición viva —se ha
    // comprobado— pero se queda esperando de todos modos. Ceder el turno es lo
    // que hace falta, y es lo único que hace falta.
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  /** Las opciones del desplegable de un campo, con la capa de cada una. */
  function opciones(campo: string): { texto: string; capa: string }[] {
    const lista = raiz.querySelectorAll<HTMLElement>(`[data-campo="${campo}"] .sugerencia`);
    return Array.from(lista).map((li) => ({
      texto: li.textContent?.trim() ?? '',
      capa: li.getAttribute('data-capa') ?? '',
    }));
  }

  /** Pulsa una opción del desplegable. */
  function pulsar(campo: string, capa: string): void {
    raiz
      .querySelector<HTMLElement>(`[data-campo="${campo}"] .sugerencia[data-capa="${capa}"]`)!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
  }

  /** Drena el eco: cambiar el texto al elegir vuelve a disparar la consulta. */
  async function drenarEco(): Promise<void> {
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([]);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([]);
    fixture.detectChanges();
  }

  it('⭐ el DESTINO pide también los sitios, y el ORIGEN no', async () => {
    await teclear('calleDestino', 'navarra');
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(1);
    await contestar([], [FARMACIA]);

    await teclear('calleOrigen', 'navarra');
    // El origen no ofrece sitios: no pregunta por ellos.
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(0);
    await contestar([], []);
    await drenarEco();
  });

  it('⭐ las dos capas se ven, y se distinguen por un atributo', async () => {
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);

    const o = opciones('calleDestino');
    expect(o.length).toBe(2);
    // La capa NO se deduce del texto: va escrita.
    expect(o.map((x) => x.capa).sort()).toEqual(['sitio', 'via']);
    expect(o.find((x) => x.capa === 'sitio')!.texto).toContain('Farmacia · Avda. de Navarra, 65');
    expect(o.find((x) => x.capa === 'via')!.texto).toContain('CALLE BURGOS');
    await drenarEco();
  });

  it('⭐ al elegir un SITIO, la casilla de portal se DESACTIVA', async () => {
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);
    // Antes de elegir, la casilla está como estaba: apagada porque no hay vía.
    pulsar('calleDestino', 'sitio');

    // La regla del portal condicional: el sitio trae su coordenada.
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(true);
    expect(campoDe(raiz, 'calleDestino').value).toBe('Farmacia · Avda. de Navarra, 65');
    await drenarEco();
  });

  it('⭐ y «Generar» deja de exigir el portal del destino', async () => {
    // El origen, completo por el camino de siempre.
    await teclear('calleOrigen', 'burgos');
    await contestar([BURGOS], []);
    pulsar('calleOrigen', 'via');
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([BURGOS]);
    http.expectOne(`/api/portales?via=${BURGOS.codigo}`).flush(PORTALES_BURGOS);
    await fixture.whenStable();

    const portalOrigen = campoDe(raiz, 'portalOrigen');
    portalOrigen.value = '2';
    portalOrigen.dispatchEvent(new Event('input'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    raiz
      .querySelector<HTMLElement>('app-selector-portal .portal')!
      .dispatchEvent(new MouseEvent('mousedown'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    // El destino, por el camino nuevo.
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);
    pulsar('calleDestino', 'sitio');
    await drenarEco();

    const generar = raiz.querySelector<HTMLButtonElement>('.generar')!;
    expect(generar.disabled).toBe(false);

    // Y lo que viaja es el CÓDIGO DEL SITIO, no una pareja inventada.
    generar.click();
    fixture.detectChanges();
    const ruta = http.expectOne('/api/ruta');
    expect(ruta.request.body.destino).toEqual({ sitio: 'Farmacias.8691' });
    expect(ruta.request.body.origen).toEqual({ via: '5140', portal: 'Portales.5140a' });
    ruta.flush({ modo: 'andando', pasos: [], geometria: [], avisos: [], metros: 0, segundos: 0 });
    await fixture.whenStable();
  });
});
