import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { rutas } from './rutas';

/** Los textos de los enlaces de la barra, en orden. */
function enlaces(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLAnchorElement>('.navegacion__enlace')).map(
    (a) => a.textContent?.trim() ?? '',
  );
}

/** Cuál está marcado como la página en la que estás. */
function enlaceActivo(raiz: HTMLElement): string | null {
  const a = raiz.querySelector<HTMLAnchorElement>('.navegacion__enlace--activo');
  return a ? (a.textContent?.trim() ?? '') : null;
}

describe('App — la cáscara y sus dos rutas', () => {
  let http: HttpTestingController;
  let peticiones: string[];
  const fetchDeVerdad = globalThis.fetch;

  beforeEach(async () => {
    // Las capas se piden con `fetch`, no con HttpClient. Aquí se cuenta cada
    // llamada y no se contesta ninguna: lo que se mide es CUÁNTAS se piden al
    // navegar, no qué traen.
    peticiones = [];
    globalThis.fetch = ((url: string) => {
      peticiones.push(String(url));
      return new Promise<Response>(() => {});
    }) as typeof globalThis.fetch;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(rutas),
        provideLocationMocks(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    globalThis.fetch = fetchDeVerdad;
    http.verify();
  });

  /** Monta la cáscara y navega, que es como se llega a cualquier página. */
  async function ir(camino: string) {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    await router.navigate([camino]);
    await fixture.whenStable();
    return { fixture, router, raiz: fixture.nativeElement as HTMLElement };
  }

  it('la barra lleva a las dos páginas', async () => {
    const { raiz } = await ir('/');
    expect(enlaces(raiz)).toEqual(['Buscador', 'Visor de capas']);
  });

  it('la ruta raíz sigue sirviendo el buscador, con sus cuatro campos', async () => {
    const { raiz } = await ir('/');

    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    const nombres = Array.from(raiz.querySelectorAll<HTMLInputElement>('input')).map((i) => i.name);
    expect(nombres).toEqual(['calleOrigen', 'portalOrigen', 'calleDestino', 'portalDestino']);
  });

  it('la ruta /visor sirve el visor', async () => {
    const { raiz } = await ir('/visor');

    expect(raiz.querySelector('app-visor')).not.toBeNull();
    expect(raiz.querySelector('.visor__cabecera h1')?.textContent).toContain('Visor de capas');
    expect(raiz.querySelector('app-buscador')).toBeNull();
  });

  it('la navegación va y vuelve', async () => {
    const { fixture, router, raiz } = await ir('/');
    expect(raiz.querySelector('app-buscador')).not.toBeNull();

    await router.navigate(['/visor']);
    await fixture.whenStable();
    expect(raiz.querySelector('app-visor')).not.toBeNull();
    expect(raiz.querySelector('app-buscador')).toBeNull();

    await router.navigate(['/']);
    await fixture.whenStable();
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    expect(raiz.querySelector('app-visor')).toBeNull();
  });

  it('la barra marca la página en la que estás', async () => {
    const { fixture, router, raiz } = await ir('/');
    expect(enlaceActivo(raiz)).toBe('Buscador');

    await router.navigate(['/visor']);
    await fixture.whenStable();
    expect(enlaceActivo(raiz)).toBe('Visor de capas');
  });

  it('una dirección que no existe cae en el buscador, no en una pantalla en blanco', async () => {
    const { raiz } = await ir('/loquesea');
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
  });

  /**
   * LO QUE PAGA LA SEGUNDA PÁGINA. El `RouterOutlet` destruye el componente al
   * salir de su ruta y lo vuelve a crear al volver, así que si las capas se
   * cargaran desde el componente, cada ida y vuelta se bajaría todo otra vez.
   * Las dieciséis peticiones son: portales, grafo, carriles, postes, trazados,
   * paradas, aparcabicis, aparcamotos, regulado, zonas y las SEIS del BiZi. El número
   * sube con cada capa nueva, y que haya que tocarlo aquí es la señal de que
   * esta prueba sigue contando de verdad.
   */
  it('ir al visor y volver NO vuelve a pedir las capas', async () => {
    const { fixture, router } = await ir('/');
    expect(peticiones.length).toBe(16);

    await router.navigate(['/visor']);
    await fixture.whenStable();
    await router.navigate(['/']);
    await fixture.whenStable();

    expect(peticiones.length).toBe(16);
  });
});
