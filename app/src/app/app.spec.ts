import { TestBed } from '@angular/core/testing';
import { App } from './app';

/** Devuelve los botones de modo que están marcados como activos. */
function modosActivos(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLButtonElement>('.modo--activo')).map(
    (b) => b.textContent?.trim() ?? '',
  );
}

/** Escribe en un campo como lo haría una persona: valor + evento de entrada. */
function escribir(raiz: HTMLElement, nombre: string, valor: string): void {
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

function botonGenerar(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.generar')!;
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pinta el nombre del proyecto', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('h1')?.textContent).toContain('Desplázame');
  });

  it('tiene los cuatro campos: calle y portal de origen y de destino', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(raiz.querySelectorAll<HTMLInputElement>('input')).map(
      (i) => i.name,
    );
    expect(nombres).toEqual([
      'calleOrigen',
      'portalOrigen',
      'calleDestino',
      'portalDestino',
    ]);
  });

  it('tiene los cuatro modos, con andando activo por defecto', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const botones = raiz.querySelectorAll<HTMLButtonElement>('.modo');
    expect(botones.length).toBe(4);
    expect(modosActivos(raiz)).toEqual(['Andando']);
  });

  it('los modos son excluyentes: elegir uno apaga el anterior', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const botones = raiz.querySelectorAll<HTMLButtonElement>('.modo');

    botones[2].click(); // Bici
    await fixture.whenStable();

    expect(modosActivos(raiz)).toEqual(['Bici']);
    expect(botones[0].getAttribute('aria-pressed')).toBe('false');
    expect(botones[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('con campos vacíos el botón está bloqueado y no pinta nada', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(botonGenerar(raiz).disabled).toBe(true);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__lista')).toBeNull();
    expect(raiz.querySelector('.pasos__vacio')).not.toBeNull();
  });

  it('con tres de los cuatro campos, el botón sigue bloqueado', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    escribir(raiz, 'portalOrigen', '12');
    escribir(raiz, 'calleDestino', 'Avenida de Goya');
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  it('con los cuatro campos genera los tres pasos de prueba, marcados como prueba', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    escribir(raiz, 'portalOrigen', '12');
    escribir(raiz, 'calleDestino', 'Avenida de Goya');
    escribir(raiz, 'portalDestino', '45');
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(false);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelectorAll('.pasos__lista li').length).toBe(3);
    expect(raiz.querySelector('.aviso-prueba')?.textContent).toContain('DATOS DE PRUEBA');
    expect(raiz.querySelector('.pasos__vacio')).toBeNull();
  });

  it('el modo elegido es el que se muestra en el resultado', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelectorAll<HTMLButtonElement>('.modo')[3].click(); // Coche
    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    escribir(raiz, 'portalOrigen', '12');
    escribir(raiz, 'calleDestino', 'Avenida de Goya');
    escribir(raiz, 'portalDestino', '45');
    await fixture.whenStable();

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Coche');
  });
});
