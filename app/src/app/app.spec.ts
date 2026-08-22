import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { rutas } from './rutas';

describe('App — la cáscara, su página y el comodín', () => {
  let http: HttpTestingController;
  let peticiones: string[];
  const fetchDeVerdad = globalThis.fetch;

  beforeEach(async () => {
    // Se finge `fetch` —que es con lo que se pedían las capas, no con
    // HttpClient— y se cuenta cada llamada sin contestar ninguna. Lo que se
    // mide es CUÁNTAS se piden al montar la página, no qué traen.
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

  it('la ruta raíz sigue sirviendo el buscador, con sus cuatro campos', async () => {
    const { raiz } = await ir('/');

    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    const nombres = Array.from(raiz.querySelectorAll<HTMLInputElement>('input')).map((i) => i.name);
    expect(nombres).toEqual(['calleOrigen', 'portalOrigen', 'calleDestino', 'portalDestino']);
  });

  it('una dirección que no existe cae en el buscador, no en una pantalla en blanco', async () => {
    const { raiz } = await ir('/loquesea');
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
  });

  /**
   * ⭐ Y `/visor` es desde el 22/08 una de esas direcciones que no existen.
   *
   * Era la segunda página, el instrumento con el que se verificaba cada dato
   * que entraba; se retiró de la app y **se reserva para la intranet, punto 14
   * del plan**. Quien la tenga en un marcador o le dé a F5 no se encuentra una
   * pantalla en blanco ni un 404: cae en el buscador, por el mismo comodín que
   * cubre cualquier otra. Esto se comprueba aquí y no solo a mano porque un
   * comodín que dejara de cubrirla no se notaría hasta que alguien lo probara.
   */
  it('⭐ /visor ya no existe, y cae en el buscador como cualquier otra', async () => {
    const { raiz } = await ir('/visor');
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
  });

  /**
   * ⭐ LO QUE LA RAÍZ **NO** SE BAJA.
   *
   * Esta prueba vigilaba lo contrario: que las diecisiete capas de
   * verificación —portales, grafo, carriles, postes, trazados, paradas,
   * aparcabicis, aparcamotos, regulado, zonas, reservas y las seis del BiZi—
   * no se volvieran a pedir al ir al visor y volver. **El visor se retiró de la
   * app el 22/08** y se reserva para la intranet (punto 14 del plan), así que
   * lo que vigilaba ya no existe.
   *
   * Su reverso sí existe, y es más importante: **abrir la raíz no baja ni un
   * byte de `app/data/`**. Eran 40,70 MB en 17 peticiones, el 99,1 % de todo lo
   * que descargaba la página. Se cuenta a cero y no «a pocas»: cualquier
   * número distinto de cero significa que algo volvió a colgarse del andamio.
   */
  it('⭐ abrir la raíz NO pide ni un byte de /datos/', async () => {
    await ir('/');
    const datos = peticiones.filter((u) => u.includes('/datos/'));
    expect(datos).toEqual([]);
  });
});
