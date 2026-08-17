import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Via } from '@desplazame/tipos';
import { AutocompletarVia } from './autocompletar-via';

/** Anfitrión: como lo usa la pantalla, con su doble sentido y su salida. */
@Component({
  imports: [AutocompletarVia],
  template: `<app-autocompletar-via
    campo="calleOrigen"
    etiqueta="Calle"
    [(texto)]="texto"
    (seleccion)="elegida.set($event)"
  />`,
})
class Anfitrion {
  readonly texto = signal('');
  readonly elegida = signal<Via | null>(null);
}

const BURGOS_CASETAS: Via = {
  codigo: '5150',
  nombre: 'CALLE BURGOS ---CST',
  limpio: 'CALLE BURGOS',
  nucleo: 'CASETAS',
  tipo: 'CL',
  portales: 34,
};

const BURGOS_CIUDAD: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

describe('AutocompletarVia', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anfitrion],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  /**
   * Escribe en el campo y espera a que pase la espera del componente.
   *
   * Dos cosas aprendidas peleándose con esto, y las dos van escritas:
   * 1. Con temporizadores falsos NO vale: congelan también el planificador de
   *    Angular y `whenStable()` no resuelve nunca.
   * 2. Aquí NO se puede llamar a `whenStable()` al final: si hay una petición
   *    en vuelo, espera a que se resuelva — y quien la resuelve es la propia
   *    prueba, con `flush()`, que todavía no ha ocurrido. Abrazo mortal.
   *    Por eso se empuja con `detectChanges()` y el `whenStable()` va DESPUÉS
   *    del `flush()`, en cada prueba.
   */
  async function escribir(fixture: any, valor: string): Promise<void> {
    const campo = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  it('con menos de dos letras NO pregunta al motor', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'b');
    http.expectNone(() => true);
  });

  it('pinta las sugerencias como «NOMBRE (NÚCLEO)», y sin coletilla si no hay núcleo', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');

    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    const textos = Array.from(raiz.querySelectorAll('.sugerencia__nombre')).map((n) =>
      n.textContent?.trim(),
    );
    expect(textos).toEqual(['CALLE BURGOS', 'CALLE BURGOS (CASETAS)']);
  });

  it('elegir una sugerencia fija el CÓDIGO y cierra el desplegable', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    const segunda = raiz.querySelectorAll<HTMLElement>('.sugerencia')[1];
    segunda.dispatchEvent(new MouseEvent('mousedown'));
    await fixture.whenStable();

    expect(fixture.componentInstance.elegida()?.codigo).toBe('5150');
    expect(fixture.componentInstance.texto()).toBe('CALLE BURGOS (CASETAS)');
    expect(raiz.querySelector('.sugerencias')).toBeNull();
  });

  it('sin resultados lo DICE, no desaparece en silencio', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'zzzzqx');
    http.expectOne('/api/vias?q=zzzzqx').flush([]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.sugerencias__aviso')?.textContent).toContain('Sin resultados');
  });

  it('si el motor no contesta, lo dice en vez de callarse', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http
      .expectOne('/api/vias?q=burgos')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.sugerencias__aviso--mal')?.textContent).toContain(
      'No se pudo preguntar al motor',
    );
  });
});
