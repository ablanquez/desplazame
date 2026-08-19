import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Via } from '@desplazame/tipos';
import { SelectorPortal } from './selector-portal';

/**
 * Anfitrión: como lo usa la pantalla — le pasa la vía y guarda lo demás.
 *
 * Desde el punto 6 el estado del campo lo guarda el padre: el texto, el portal
 * elegido y si ya se salió. Aquí es un anfitrión PELADO, sin más reglas que
 * las ataduras — a propósito, para que lo que midan estas pruebas sea el campo
 * y no el anfitrión.
 */
@Component({
  imports: [SelectorPortal],
  template: `<app-selector-portal
    campo="portalOrigen"
    etiqueta="Portal"
    [via]="via()"
    [(texto)]="texto"
    [(seleccion)]="elegido"
    [(tocado)]="tocado"
  />`,
})
class Anfitrion {
  readonly via = signal<Via | null>(null);
  readonly texto = signal('');
  readonly elegido = signal<Portal | null>(null);
  readonly tocado = signal(false);
}

const ADRIANO: Via = {
  codigo: '160',
  nombre: 'CALLE ADRIANO VI',
  limpio: 'CALLE ADRIANO VI',
  nucleo: null,
  tipo: 'CL',
  portales: 16,
};

const MARIA_AGUSTIN: Via = {
  codigo: '340',
  nombre: 'PASEO MARÍA AGUSTÍN',
  limpio: 'PASEO MARÍA AGUSTÍN',
  nucleo: null,
  tipo: 'PS',
  portales: 76,
};

/** Los primeros de la vía 160, tal y como los sirve el motor de verdad. */
const PORTALES_160: readonly Portal[] = [
  { codigo: 'Portales.114332', numero: '1' },
  { codigo: 'Portales.112872', numero: '1DP' },
  { codigo: 'Portales.114333', numero: '3' },
  { codigo: 'Portales.114334', numero: '4' },
  { codigo: 'Portales.114335', numero: '10' },
];

const PORTALES_340: readonly Portal[] = [
  { codigo: 'Portales.900001', numero: '22A' },
  { codigo: 'Portales.900002', numero: '22B' },
];

describe('SelectorPortal', () => {
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

  function entrar(fixture: any): void {
    entrada(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  /** Escribe para filtrar. Aquí NO hay espera: el filtrado es local. */
  function escribir(fixture: any, valor: string): void {
    const campo = entrada(fixture);
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function salir(fixture: any): Promise<void> {
    entrada(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
  }

  function numeros(fixture: any): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.portal'),
    ).map((n) => n.textContent?.trim() ?? '');
  }

  /** Fija la vía y sirve sus portales, que es como arranca todo lo demás. */
  async function fijarVia(
    fixture: any,
    via: Via,
    portales: readonly Portal[],
  ): Promise<void> {
    fixture.componentInstance.via.set(via);
    // Se empuja con `detectChanges()` y el `whenStable()` va DESPUÉS del
    // `flush()`. Al revés se espera a la petición que esta misma función tiene
    // que resolver: el abrazo mortal que ya está escrito en
    // `autocompletar-via.spec.ts`, y que ha vuelto a morder aquí.
    fixture.detectChanges();
    http.expectOne(`/api/portales?via=${via.codigo}`).flush(portales);
    await fixture.whenStable();
  }

  it('SIN vía el campo está deshabilitado y NO molesta al motor', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();

    expect(entrada(fixture).disabled).toBe(true);
    expect(entrada(fixture).placeholder).toBe('Elige antes la calle');
    // Sin vía no hay nada que preguntar: el motor no se entera de este campo.
    http.expectNone(() => true);
  });

  it('al fijar la vía se puebla con SUS portales y se habilita', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await fijarVia(fixture, ADRIANO, PORTALES_160);

    expect(entrada(fixture).disabled).toBe(false);

    entrar(fixture);
    // En el orden en que los da el motor: quien ordena es él, no la pantalla.
    expect(numeros(fixture)).toEqual(['1', '1DP', '3', '4', '10']);
  });

  it('elegir fija el portal por su CÓDIGO, no por lo que se lee', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await fijarVia(fixture, ADRIANO, PORTALES_160);
    entrar(fixture);

    const raiz = fixture.nativeElement as HTMLElement;
    // El «1DP», que es justo el que un campo de texto libre no sabría escribir.
    raiz.querySelectorAll<HTMLElement>('.portal')[1].dispatchEvent(new MouseEvent('mousedown'));
    await fixture.whenStable();

    expect(fixture.componentInstance.elegido()?.codigo).toBe('Portales.112872');
    expect(entrada(fixture).value).toBe('1DP');
    expect(raiz.querySelector('.portales')).toBeNull();
  });

  /**
   * La regla «cambiar de calle TIRA el portal» —el 1 de ADRIANO VI no es el 1
   * de MARÍA AGUSTÍN— **ya no vive aquí**: subió al padre en el punto 6,
   * porque el padre es el único que distingue «el usuario ha cambiado de
   * calle» de «he invertido origen y destino», y en el segundo caso el portal
   * es justo lo que se está moviendo. La cubre `buscador.spec.ts`, en «cambiar
   * una calle tira su portal y vuelve a bloquear Generar».
   *
   * Lo que esta prueba fija es el reparto: el campo pide los portales de la
   * calle nueva y despinta la fila resaltada, pero **NO tira lo elegido**. Si
   * alguien devuelve esa regla aquí dentro, esta prueba se pone roja — y la de
   * invertir, en el padre, también.
   */
  it('cambiar de calle pide los de la NUEVA y despinta, pero tirar el portal es del padre', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await fijarVia(fixture, ADRIANO, PORTALES_160);
    entrar(fixture);

    const raiz = fixture.nativeElement as HTMLElement;
    raiz.querySelectorAll<HTMLElement>('.portal')[0].dispatchEvent(new MouseEvent('mousedown'));
    await fixture.whenStable();
    expect(fixture.componentInstance.elegido()?.codigo).toBe('Portales.114332');

    await fijarVia(fixture, MARIA_AGUSTIN, PORTALES_340);

    // Lo elegido sigue puesto: quien lo tira es el padre, no el campo.
    expect(fixture.componentInstance.elegido()?.codigo).toBe('Portales.114332');
    expect(entrada(fixture).value).toBe('1');

    // Y OJO con la otra cara de haber subido la regla: el texto viejo se queda
    // haciendo de FILTRO sobre la lista nueva, y ningún portal de MARÍA
    // AGUSTÍN contiene un «1». Por eso `alElegirVia` limpia el texto además de
    // tirar el código — si limpiara solo el código, el campo se veria vacio de
    // opciones sin que se entienda por qué.
    entrar(fixture);
    expect(numeros(fixture)).toEqual([]);

    // Limpiando el texto como lo limpia el padre, salen los de la calle nueva.
    fixture.componentInstance.texto.set('');
    fixture.detectChanges();
    expect(numeros(fixture)).toEqual(['22A', '22B']);
    expect(raiz.querySelector('.portal--activo')).toBeNull();
  });

  it('escribir FILTRA la lista, y encuentra los números con letra', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await fijarVia(fixture, ADRIANO, PORTALES_160);
    entrar(fixture);

    escribir(fixture, '1');
    // Subcadena: el 1, el 1DP y el 10 — no solo los que empiezan por 1.
    expect(numeros(fixture)).toEqual(['1', '1DP', '10']);

    escribir(fixture, 'dp');
    expect(numeros(fixture)).toEqual(['1DP']);
  });

  it('salir sin elegir deja BORRADOR marcado, y no cuenta como elegido', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    await fijarVia(fixture, ADRIANO, PORTALES_160);
    entrar(fixture);
    escribir(fixture, '99');

    await salir(fixture);

    const raiz = fixture.nativeElement as HTMLElement;
    expect(entrada(fixture).value).toBe('99');
    expect(fixture.componentInstance.elegido()).toBeNull();
    expect(entrada(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(raiz.querySelector('.campo__borrador')?.textContent).toContain('de la lista');
  });

  it('con más de 50 recorta y DICE cuántos se deja', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    // 60 portales: por encima del tope de 50.
    const muchos: Portal[] = Array.from({ length: 60 }, (_, i) => ({
      codigo: `Portales.${i}`,
      numero: String(i + 1),
    }));
    await fijarVia(fixture, { ...ADRIANO, portales: 60 }, muchos);
    entrar(fixture);

    expect(numeros(fixture).length).toBe(50);
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.portales__aviso')?.textContent).toContain('y 10 más');
  });

  it('si el motor no contesta, lo dice en vez de callarse', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    fixture.componentInstance.via.set(ADRIANO);
    fixture.detectChanges();
    http
      .expectOne('/api/portales?via=160')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    await fixture.whenStable();

    entrar(fixture);
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.portales__aviso--mal')?.textContent).toContain(
      'No se pudo preguntar al motor',
    );
  });
});
