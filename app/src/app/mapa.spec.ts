import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mapa, type Vertice } from './mapa';

/** Anfitrión de prueba: permite cambiar el trazado como lo hace App. */
@Component({
  imports: [Mapa],
  template: `<app-mapa [trazado]="trazado()" />`,
})
class Anfitrion {
  readonly trazado = signal<readonly Vertice[]>([]);
}

const TRAMO: readonly Vertice[] = [
  [41.6561, -0.8773],
  [41.6516, -0.879],
  [41.6425, -0.8865],
];

describe('Mapa', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
  });

  it('pinta la atribución de OpenStreetMap con la palabra «colaboradores»', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const atribucion = raiz.querySelector('.leaflet-control-attribution');
    expect(atribucion?.textContent).toContain('colaboradores de OpenStreetMap');
  });

  it('la atribución enlaza a la página de copyright de OpenStreetMap', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const enlace = raiz.querySelector<HTMLAnchorElement>(
      '.leaflet-control-attribution a[href*="openstreetmap.org/copyright"]',
    );
    expect(enlace).not.toBeNull();
  });

  it('sin trazado no hay línea', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });

  it('con trazado hay una línea, y regenerar no las acumula', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(TRAMO);
    await fixture.whenStable();
    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);

    // Segunda generación: la anterior tiene que desaparecer, no sumarse.
    fixture.componentInstance.trazado.set([...TRAMO]);
    await fixture.whenStable();
    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);
  });
});
