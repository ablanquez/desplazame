import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Via } from '@desplazame/tipos';
import { AutocompletarVia } from './autocompletar-via';

/**
 * Anfitrión: como lo usa la pantalla, con sus dos sentidos.
 *
 * `seleccion` va atado en la forma larga —`[seleccion]` más
 * `(seleccionChange)`— porque es como lo ata el padre de verdad, y ahí no es
 * un capricho: le hace falta saber quién escribió. El porqué entero está en
 * `alElegirVia`, en `buscador.ts`.
 */
@Component({
  imports: [AutocompletarVia],
  template: `<app-autocompletar-via
    campo="calleOrigen"
    etiqueta="Calle"
    papel="origen"
    [(texto)]="texto"
    [seleccion]="elegida()"
    (seleccionChange)="elegida.set($event)"
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

  function entrada(fixture: any): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector('input')!;
  }

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
    const campo = entrada(fixture);
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  /**
   * Sale del campo, que es el gesto del fallo: Tab o click fuera. Espera algo
   * más que el margen de 150 ms que el componente se da para que un click
   * sobre una sugerencia llegue a contar.
   */
  async function salir(fixture: any): Promise<void> {
    entrada(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
  }

  /** Vuelve al campo. */
  function entrar(fixture: any): void {
    entrada(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  it('con menos de dos letras NO pregunta al motor', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'b');
    http.expectNone(() => true);
  });

  it('pinta las sugerencias como «NOMBRE [NÚCLEO]», y sin coletilla si no hay núcleo', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');

    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    const textos = Array.from(raiz.querySelectorAll('.sugerencia__nombre')).map((n) =>
      n.textContent?.trim(),
    );
    expect(textos).toEqual(['CALLE BURGOS', 'CALLE BURGOS [CASETAS]']);
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
    expect(fixture.componentInstance.texto()).toBe('CALLE BURGOS [CASETAS]');
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

  // ── El fallo de la entrada nº4 de la bitácora ─────────────────────────────
  // Escribir no es elegir. Estas cinco cubren los dos estados que el campo no
  // distinguía, y el gesto que lo destapó: salir sin haber tocado la lista.

  it('salir sin elegir CONSERVA lo escrito y lo marca como no válido', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    await salir(fixture);

    // No se borra lo que escribió el usuario: se conserva como borrador.
    expect(entrada(fixture).value).toBe('burgos');
    expect(fixture.componentInstance.texto()).toBe('burgos');
    // Pero no hay vía elegida, y se ve que no la hay.
    const raiz = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.elegida()).toBeNull();
    expect(entrada(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(raiz.querySelector('.campo__borrador')?.textContent).toContain('de la lista');
  });

  it('volver al campo con borrador REABRE el desplegable con lo escrito', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    await salir(fixture);
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.sugerencias')).toBeNull();

    entrar(fixture);

    // Un toque y resuelto: las sugerencias de lo escrito, sin volver a teclear.
    expect(raiz.querySelectorAll('.sugerencia').length).toBe(2);
  });

  it('elegir después de un borrador LIMPIA la marca', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    await salir(fixture);
    expect(entrada(fixture).getAttribute('aria-invalid')).toBe('true');

    entrar(fixture);
    const raiz = fixture.nativeElement as HTMLElement;
    raiz.querySelectorAll<HTMLElement>('.sugerencia')[0].dispatchEvent(new MouseEvent('mousedown'));
    await fixture.whenStable();

    expect(fixture.componentInstance.elegida()?.codigo).toBe('5140');
    expect(entrada(fixture).getAttribute('aria-invalid')).toBeNull();
    expect(raiz.querySelector('.campo__borrador')).toBeNull();
  });

  it('borrar el texto del borrador LIMPIA la marca: campo vacío normal', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    await salir(fixture);
    expect(entrada(fixture).getAttribute('aria-invalid')).toBe('true');

    await escribir(fixture, '');

    const raiz = fixture.nativeElement as HTMLElement;
    expect(entrada(fixture).getAttribute('aria-invalid')).toBeNull();
    expect(raiz.querySelector('.campo__borrador')).toBeNull();
  });

  it('EDITAR después de haber elegido tira el código: vuelve a borrador', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await escribir(fixture, 'burgos');
    http.expectOne('/api/vias?q=burgos').flush([BURGOS_CIUDAD, BURGOS_CASETAS]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    raiz.querySelectorAll<HTMLElement>('.sugerencia')[1].dispatchEvent(new MouseEvent('mousedown'));
    await fixture.whenStable();
    expect(fixture.componentInstance.elegida()?.codigo).toBe('5150');

    // El texto ya no corresponde a la vía elegida: el código deja de valer.
    await escribir(fixture, 'CALLE BURGO');
    http.expectOne('/api/vias?q=CALLE%20BURGO').flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.elegida()).toBeNull();

    await salir(fixture);
    expect(entrada(fixture).getAttribute('aria-invalid')).toBe('true');
  });
});
