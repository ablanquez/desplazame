import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, PortalCercano, Sitio, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';

/**
 * ⭐ EL BUSCADOR POR TIPOS (Antonio, 24/08).
 *
 * Cada campo pasa a ser cuatro piezas: `[📍] [tipo ▾] [cajetín] [nº]`. El
 * desplegable **filtra** el cajetín a una sola categoría, el nº **solo existe**
 * con Dirección, y «Mi ubicación» vive en los dos lados.
 *
 * Lo que aquí se vigila es lo que puede mentir sin que se note:
 *
 * 1. **La pureza del filtro.** Una lista que dice «Farmacias» y trae una calle
 *    es peor que no filtrar: se elige sin leer. [DOC Pelias] `layers` acota la
 *    búsqueda, y aquí la acota de verdad — se comprueba que la petición lleva
 *    la capa Y que la otra ni se pide.
 * 2. **La ausencia del nº.** Con un sitio el número no se apaga: NO EXISTE
 *    [GOV.UK: conditional reveal]. Un campo apagado sigue estando, y un campo
 *    que está invita a rellenarlo.
 * 3. **Que el ⇅ cruza el tipo.** Si cruzara el texto y no el tipo, el otro
 *    lado quedaría con una farmacia escrita bajo la etiqueta «Dirección».
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
  tipo: 'farmacia',
};

const HOSPITAL: Sitio = {
  codigo: 'Hospitales.9040',
  presentacion: 'Hospital Universitario Miguel Servet · Avda. Isabel La Católica, 3',
  categoria: 'Hospital',
  tipo: 'hospital',
};

const CERCANO: PortalCercano = {
  via: BURGOS,
  portal: PORTALES_BURGOS[0]!,
  metros: 12,
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

/**
 * La geolocalización, FINGIDA Y DICHA — igual que en `buscador.spec.ts`.
 *
 * jsdom no trae la API: `navigator.geolocation` es `undefined`. Aquí no se
 * prueba el GPS —el juez de eso es el portátil de Antonio—; se prueba que se le
 * PIDE y qué se hace con lo que contesta. Los umbrales son los del punto 6 y no
 * se tocan: precisión ≤ 100 m y ≤ 150 m al portal.
 */
function fingirGeolocalizacion(lat: number, lon: number, precision: number): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (exito: PositionCallback) => {
        exito({
          coords: { latitude: lat, longitude: lon, accuracy: precision },
          timestamp: 0,
        } as unknown as GeolocationPosition);
      },
    },
  });
}

describe('⭐ EL BUSCADOR POR TIPOS', () => {
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
    // A 12 m de precisión: dentro de los 100 m que exige el punto 6.
    fingirGeolocalizacion(41.6488, -0.8891, 12);
  });

  afterEach(() => {
    for (const r of http.match(() => true)) {
      if (!r.cancelled) r.flush([]);
    }
    http.verify();
  });

  /** El desplegable de tipo de un lado. */
  const tipoDe = (lado: 'Origen' | 'Destino'): HTMLSelectElement =>
    raiz.querySelector<HTMLSelectElement>(`select[name="tipo${lado}"]`)!;

  /** Cambia el tipo como lo haría una persona. */
  async function elegirTipo(lado: 'Origen' | 'Destino', valor: string): Promise<void> {
    const select = tipoDe(lado);
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  /** Las peticiones que hay abiertas ahora mismo, por su URL. */
  const abiertas = (): string[] =>
    http.match(() => true).map((r) => r.request.urlWithParams);

  function drenar(): void {
    for (const r of http.match(() => true)) {
      if (!r.cancelled) r.flush([]);
    }
    fixture.detectChanges();
  }

  // ── EL DESPLEGABLE ─────────────────────────────────────────────────────────

  it('⭐ los DOS campos traen su desplegable, con las cuatro opciones', () => {
    for (const lado of ['Origen', 'Destino'] as const) {
      const select = tipoDe(lado);
      expect(select, `falta el desplegable de ${lado}`).not.toBeNull();
      expect(Array.from(select.options).map((o) => o.value)).toEqual([
        'via',
        'farmacia',
        'hospital',
        'centro-salud',
      ]);
    }
  });

  it('⭐ por defecto, DIRECCIÓN [PROPIO]: al abrir se comporta como siempre', () => {
    // La decisión declarada: abrir la pantalla no cambia lo que hacía ayer.
    expect(tipoDe('Origen').value).toBe('via');
    expect(tipoDe('Destino').value).toBe('via');
  });

  // ── LA PUREZA DEL FILTRO ───────────────────────────────────────────────────

  it('⭐ con DIRECCIÓN se piden vías y NO se pide la capa de sitios', async () => {
    await teclear('calleDestino', 'far');

    const urls = abiertas();
    expect(urls.filter((u) => u.startsWith('/api/vias')).length).toBe(1);
    expect(urls.filter((u) => u.startsWith('/api/sitios')).length).toBe(0);
    drenar();
  });

  it('⭐ con FARMACIAS se pide la capa CON su filtro, y NO se piden vías', async () => {
    await elegirTipo('Destino', 'farmacia');
    await teclear('calleDestino', 'navarra');

    const urls = abiertas();
    expect(urls.filter((u) => u.startsWith('/api/vias')).length).toBe(0);
    const sitios = urls.filter((u) => u.startsWith('/api/sitios'));
    expect(sitios.length).toBe(1);
    expect(sitios[0]).toContain('capa=farmacia');
    drenar();
  });

  it('⭐ y cada categoría manda LA SUYA', async () => {
    for (const [valor, lado, campo] of [
      ['hospital', 'Origen', 'calleOrigen'],
      ['centro-salud', 'Destino', 'calleDestino'],
    ] as const) {
      await elegirTipo(lado, valor);
      await teclear(campo, 'salud');
      expect(abiertas().find((u) => u.startsWith('/api/sitios'))).toContain(`capa=${valor}`);
      drenar();
    }
  });

  it('⭐ la lista filtrada trae SOLO iconos de su tipo', async () => {
    await elegirTipo('Destino', 'hospital');
    await teclear('calleDestino', 'miguel');
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([HOSPITAL]);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    const iconos = Array.from(
      raiz.querySelectorAll<SVGElement>('[data-campo="calleDestino"] .sugerencia svg[data-icono]'),
    ).map((s) => s.getAttribute('data-icono'));
    expect(iconos).toEqual(['hospital']);
    drenar();
  });

  // ── CAMBIAR DE TIPO LIMPIA ─────────────────────────────────────────────────

  it('⭐ cambiar de tipo LIMPIA el cajetín y lo que hubiera resuelto', async () => {
    // Cambiar de carril es empezar la pregunta. Sin esto quedaría una farmacia
    // resuelta bajo la etiqueta «Dirección», que es una mentira que además
    // desbloquearía «Generar».
    await elegirTipo('Destino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([FARMACIA]);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    raiz
      .querySelector<HTMLElement>('[data-campo="calleDestino"] .sugerencia')!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
    drenar();
    expect(campoDe(raiz, 'calleDestino').value).toBe(FARMACIA.presentacion);

    await elegirTipo('Destino', 'via');
    expect(campoDe(raiz, 'calleDestino').value).toBe('');
    // Y no queda nada resuelto por debajo: «Generar» sigue bloqueado.
    expect(raiz.querySelector<HTMLButtonElement>('.generar')!.disabled).toBe(true);
    drenar();
  });

  // ── EL Nº, POR REVELADO CONDICIONAL ────────────────────────────────────────

  it('⭐ el nº EXISTE con Dirección y NO EXISTE con un sitio [GOV.UK]', async () => {
    // Ausencia por estructura, no apagado: un campo deshabilitado sigue en la
    // página, ocupa sitio y se lee como «esto habría que rellenarlo».
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    expect(raiz.querySelectorAll('app-selector-portal').length).toBe(2);

    await elegirTipo('Destino', 'farmacia');
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    // Y el componente entero se ha ido, no solo su `input`: es ausencia por
    // estructura, que es lo que pide el patrón.
    expect(raiz.querySelectorAll('app-selector-portal').length).toBe(1);

    // Y vuelve al volver a Dirección.
    await elegirTipo('Destino', 'via');
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    drenar();
  });

  it('el nº de un lado no depende del otro', async () => {
    await elegirTipo('Origen', 'hospital');
    expect(raiz.querySelector('input[name="portalOrigen"]')).toBeNull();
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    drenar();
  });

  // ── MI UBICACIÓN, EN LOS DOS ───────────────────────────────────────────────

  it('⭐ «Mi ubicación» está en los DOS campos', () => {
    expect(raiz.querySelectorAll('.ubicacion').length).toBe(2);
  });

  it('⭐ y en el DESTINO rellena vía y portal, como en el origen', async () => {
    const boton = raiz.querySelectorAll<HTMLButtonElement>('.ubicacion')[1]!;
    boton.click();
    fixture.detectChanges();

    http.expectOne((r) => r.url.startsWith('/api/portal-cercano')).flush(CERCANO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    expect(campoDe(raiz, 'calleDestino').value).toBe('CALLE BURGOS');
    expect(campoDe(raiz, 'portalDestino').value).toBe('2');
    drenar();
  });

  it('⭐ y pone el tipo en DIRECCIÓN: una ubicación ES una dirección', async () => {
    await elegirTipo('Destino', 'farmacia');
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();

    raiz.querySelectorAll<HTMLButtonElement>('.ubicacion')[1]!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url.startsWith('/api/portal-cercano')).flush(CERCANO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    expect(tipoDe('Destino').value).toBe('via');
    expect(campoDe(raiz, 'portalDestino').value).toBe('2');
    drenar();
  });

  // ── EL ⇅ CRUZA EL TIPO ─────────────────────────────────────────────────────

  it('⭐ el ⇅ cruza el TIPO, no solo el texto', async () => {
    await elegirTipo('Origen', 'hospital');
    drenar();

    raiz.querySelector<HTMLButtonElement>('.invertir')!.click();
    fixture.detectChanges();

    expect(tipoDe('Origen').value).toBe('via');
    expect(tipoDe('Destino').value).toBe('hospital');
    // Y el nº se muda con él: aparece donde ahora hay Dirección y desaparece
    // donde ahora hay un sitio.
    expect(raiz.querySelector('input[name="portalOrigen"]')).not.toBeNull();
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    drenar();
  });
});
