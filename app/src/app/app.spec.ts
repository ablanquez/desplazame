import { TestBed } from '@angular/core/testing';
import { App } from './app';

/** Devuelve los botones de modo que están marcados como activos. */
function modosActivos(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLButtonElement>('.modo--activo')).map(
    (b) => b.textContent?.trim() ?? '',
  );
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
});
