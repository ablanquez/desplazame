import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mapa, type Vertice } from './mapa';
import type { TramoDelViaje } from '@desplazame/tipos';

/** Anfitrión de prueba: permite cambiar el trazado como lo hace App. */
@Component({
  imports: [Mapa],
  template: `<app-mapa [trazado]="trazado()" [tramos]="tramos()" />`,
})
class Anfitrion {
  readonly trazado = signal<readonly Vertice[]>([]);
  readonly tramos = signal<readonly TramoDelViaje[]>([]);
}

const TRAMO: readonly Vertice[] = [
  [41.6561, -0.8773],
  [41.6516, -0.879],
  [41.6425, -0.8865],
];

/** El tramo único de una ruta a pie de las de siempre: cubre los tres vértices. */
const A_PIE: readonly TramoDelViaje[] = [
  { comoSeVa: 'andando', desde: 0, hasta: 2, metros: 120, segundos: 86, hito: null },
];

/**
 * ⭐ Un viaje de TRES tramos con sus dos hitos, con la forma que el motor
 * devuelve en BiZi: andar hasta la estación, pedalear, andar el resto.
 */
const EN_BIZI: readonly TramoDelViaje[] = [
  { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 127, segundos: 91, hito: 'coge' },
  { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 4513, segundos: 813, hito: 'aparca' },
  { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 160, segundos: 116, hito: null },
];

/** Y el de DOS del remate: rodar hasta el aparcabicis y andar el resto. */
const CON_REMATE: readonly TramoDelViaje[] = [
  { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 4535, segundos: 933, hito: 'aparca' },
  { comoSeVa: 'andando', desde: 1, hasta: 2, metros: 52, segundos: 37, hito: null },
];

const CUATRO: readonly Vertice[] = [
  [41.6661, -0.8773],
  [41.6826, -0.8712],
  [41.6476, -0.8641],
  [41.6461, -0.8673],
];

/** Las líneas pintadas, con el `stroke-dasharray` que Leaflet les pone. */
function lineas(raiz: HTMLElement): { discontinua: boolean }[] {
  return Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive')).map((p) => {
    const trazo = p.getAttribute('stroke-dasharray');
    return { discontinua: trazo !== null && trazo !== '' && trazo !== 'none' };
  });
}

/** Los iconos de hito que hay sobre el mapa, por su glifo. */
function hitos(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll('.hito')).map((h) => (h.textContent ?? '').trim());
}

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
  /**
   * Mientras hubo UNA pantalla, el mapa nacía con la aplicación y moría con
   * ella: no desmontarlo no costaba nada. Con el router deja de ser así — el
   * `RouterOutlet` destruye el componente cada vez que se sale de su ruta—, y
   * un mapa que nadie desmonta se queda con sus escuchas de `window` y con sus
   * 46.150 marcadores dentro. [DOC] Leaflet: «remove(): Destroys the map and
   * clears all related event listeners», y al hacerlo suelta el contenedor.
   */
  /**
   * ⭐ JUEZ 3 — EL ANDANDO PURO CONSERVA EXACTAMENTE EL VESTIDO DE HOY.
   *
   * Es la no-regresión, y es la que decidió el vestido de todo lo demás: la
   * línea de siempre **ya era discontinua**, así que si el a-pie se hubiera
   * quedado con el discontinuo «nuevo» y el rodando con otro color, el andando
   * puro habría cambiado sin que nadie lo pidiera. Lo que distingue al rodando
   * es el **sólido**; el a-pie no se toca.
   */
  it('⭐ 3 · el andando puro pinta UNA línea y sigue siendo discontinua', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set(A_PIE);
    await fixture.whenStable();

    const pintadas = lineas(raiz);
    expect(pintadas.length).toBe(1);
    expect(pintadas[0]!.discontinua).toBe(true);
    // Y ni un icono de hito: andando no se aparca ni se coge nada.
    expect(hitos(raiz).length).toBe(0);
  });

  /**
   * ⭐ JUEZ 1 — LA BiZi PINTA TRES LÍNEAS Y DOS ICONOS.
   *
   * Dos discontinuas —los dos paseos, **con el mismo vestido**, que es lo que
   * se pidió— y una sólida en medio, la del pedaleo. Y los dos hitos: la
   * bicicleta donde se coge y la P donde se deja.
   */
  it('⭐ 1 · la BiZi pinta tres tramos (dos a pie iguales) y sus dos hitos', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(CUATRO);
    fixture.componentInstance.tramos.set(EN_BIZI);
    await fixture.whenStable();

    const pintadas = lineas(raiz);
    expect(pintadas.length).toBe(3);
    expect(pintadas.map((l) => l.discontinua)).toEqual([true, false, true]);
    expect(hitos(raiz)).toEqual(['🚲', '🅿']);
  });

  /**
   * ⭐ JUEZ 2 — LA BICI CON REMATE PINTA DOS TRAMOS Y UN ICONO.
   *
   * Sólido el que se rueda, discontinuo el paseo corto del final, y una sola P
   * en el aparcabicis. La bici propia no se coge en ninguna parte: si saliera
   * un 🚲, sería que el pintado se lo ha inventado.
   */
  it('⭐ 2 · la bici con remate pinta dos tramos y una sola P', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set(CON_REMATE);
    await fixture.whenStable();

    const pintadas = lineas(raiz);
    expect(pintadas.length).toBe(2);
    expect(pintadas.map((l) => l.discontinua)).toEqual([false, true]);
    expect(hitos(raiz)).toEqual(['🅿']);
  });

  /**
   * ⭐ JUEZ 4 — LOS ESTILOS DIFIEREN DOS VECES: por trazo **y** por color.
   *
   * [WCAG 1.4.1, *Use of Color*] el color no puede ser el único medio para
   * transmitir información. Aquí se cumple **por partida doble**: el color
   * separa, y el trazo separa también y por su cuenta. Un daltónico que no
   * distinga el ámbar del azul sigue viendo un discontinuo y un sólido; una
   * impresión en blanco y negro, igual. Quítese cualquiera de los dos y el
   * otro basta — que es lo que la pauta pide de verdad.
   *
   * ⚠️ **Y aquí es donde los dos vestidos están clavados al píxel**, por valor
   * exacto y no por «son distintos». Es lo que hace que mover cualquiera de
   * los dos —el azul del rodando o, sobre todo, el ámbar del a-pie— ponga algo
   * rojo. El `#2563eb` es el azul medio firmado por Antonio el 30/08; el
   * `#b45309` con `10 8` es el vestido de siempre del que anda, que **no se
   * toca**.
   */
  it('⭐ 4 · a pie y rodando difieren en color Y en trazo, con los dos valores clavados', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(CUATRO);
    fixture.componentInstance.tramos.set(EN_BIZI);
    await fixture.whenStable();

    const trazos = Array.from(
      raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'),
    ).map((p) => ({
      color: p.getAttribute('stroke'),
      dash: p.getAttribute('stroke-dasharray'),
    }));
    // ⭐ EL A-PIE, AL PÍXEL: el ámbar de siempre y su discontinuo. Los dos
    // paseos del viaje llevan EXACTAMENTE el mismo vestido, que es el pedido
    // literal, y es el mismo que tenía la línea única antes de que existieran
    // los tramos. Si esto se mueve, el andando puro ha cambiado.
    for (const i of [0, 2]) {
      expect(trazos[i]!.color).toBe('#b45309');
      expect(trazos[i]!.dash).toBe('10 8');
    }

    // ⭐ Y EL RODANDO: el azul medio, sólido. `null` es «sin dashArray», que en
    // Leaflet es la línea continua — no vale un dasharray vacío disfrazado.
    expect(trazos[1]!.color).toBe('#2563eb');
    expect(trazos[1]!.dash).toBe(null);

    // Las dos separaciones, cada una por su cuenta: si mañana alguien igualara
    // los colores, el trazo seguiría distinguiendo, y al revés.
    expect(trazos[0]!.color).not.toBe(trazos[1]!.color);
    expect(trazos[0]!.dash).not.toBe(trazos[1]!.dash);
  });

  /**
   * ⭐ JUEZ 2 bis — EL ICONO SIGUE A `tramo.hasta`, y no está puesto a ojo.
   *
   * Es la razón de ser de todo el crecimiento del contrato: el hito va en el
   * vértice que el motor señala —el que cae **a 0,0 m** de la estación—, no en
   * uno aproximado.
   *
   * ⚠️ **La primera versión de esta juez miraba `style.transform` y no
   * probaba nada**: en jsdom Leaflet coloca los marcadores con `left`/`top`,
   * así que los dos transforms salían vacíos y el `Set` daba 1. Peor aún,
   * comparar dos posiciones cualesquiera tampoco demostraba que siguieran al
   * índice. Lo que sí lo demuestra es **mover el índice y ver que el icono se
   * mueve con él**: se pinta el mismo viaje con el hito en otro vértice y las
   * dos posiciones tienen que ser distintas.
   */
  it('⭐ 2 bis · el icono se posa donde dice tramo.hasta, y se mueve con él', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const donde = (): string[] =>
      Array.from(raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon'))
        .filter((m) => m.querySelector('.hito') !== null)
        .map((m) => `${m.style.left}|${m.style.top}`);

    fixture.componentInstance.trazado.set(CUATRO);
    fixture.componentInstance.tramos.set(EN_BIZI);
    await fixture.whenStable();
    const antes = donde();
    expect(antes.length).toBe(2);
    // Los dos hitos están en sitios distintos, y colocados de verdad.
    expect(new Set(antes).size).toBe(2);
    expect(antes.every((p) => p !== '|')).toBe(true);

    // ⭐ Y ahora el mismo viaje con el primer hito un vértice más allá: si el
    // icono estuviera puesto por su cuenta —en el primer vértice, o en la
    // mitad de la línea— esta posición no cambiaría.
    fixture.componentInstance.tramos.set([
      { comoSeVa: 'andando', desde: 0, hasta: 2, metros: 127, segundos: 91, hito: 'coge' },
      { comoSeVa: 'rodando', desde: 2, hasta: 3, metros: 4513, segundos: 813, hito: 'aparca' },
    ]);
    await fixture.whenStable();
    const despues = donde();
    expect(despues.length).toBe(2);
    expect(despues[0]).not.toBe(antes[0]);
  });

  it('al destruirse el componente, Leaflet suelta su contenedor', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const lienzo = (fixture.nativeElement as HTMLElement).querySelector(
      '.lienzo',
    ) as HTMLElement & { _leaflet_id?: number };

    expect(lienzo._leaflet_id).toBeDefined();

    fixture.destroy();

    expect(lienzo._leaflet_id).toBeUndefined();
  });
});
