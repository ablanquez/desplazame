import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ASOMA_EL_RIBETE,
  BORDE_DE_LA_ZONA,
  Mapa,
  RELLENO_DE_LA_ZONA,
  ribeteDe,
  ROJO_DE_LA_ZONA,
  TINTA_DEL_RELLENO,
  type Anillo,
  type Vertice,
} from './mapa';
import { AA_GRAFICO, contraste, deHex, luminancia, PLANO_MAS_CLARO, PLANO_MAS_OSCURO, TIERRA_OSM } from './contraste';
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync } from 'node:fs';

/** `process` es de Node y tampoco está tipado aquí. Solo se usa `cwd()`. */
declare const process: { cwd(): string };

/** Las 53 líneas del cocinado que sirve el motor. Ver `chip.spec.ts`. */
const LINEAS_DEL_FEED: readonly { readonly corto: string; readonly color: string }[] = JSON.parse(
  readFileSync(
    ((): string => {
      const suyo = '/app/data/nap_gtfs-ficha1176.cocinado.json';
      let d = process.cwd().replaceAll('\\', '/');
      for (let i = 0; i < 6; i++) {
        if (existsSync(d + suyo)) {
          return d + suyo;
        }
        d = d.slice(0, d.lastIndexOf('/'));
      }
      throw new Error('no encuentro el cocinado subiendo desde ' + process.cwd());
    })(),
    'utf-8',
  ),
).lineas;
import type { TramoDelViaje } from '@desplazame/tipos';

/** Anfitrión de prueba: permite cambiar el trazado como lo hace App. */
@Component({
  imports: [Mapa],
  template: `<app-mapa [trazado]="trazado()" [tramos]="tramos()" [zona]="zona()" />`,
})
class Anfitrion {
  readonly trazado = signal<readonly Vertice[]>([]);
  readonly tramos = signal<readonly TramoDelViaje[]>([]);
  readonly zona = signal<readonly Anillo[]>([]);
}

/** El polígono de la fase 1, leído del MISMO fichero que marca las aristas. */
function laFase1(): readonly Anillo[] {
  const capa = JSON.parse(
    readFileSync(
      ((): string => {
        const suyo = '/app/data/2026-09-02_wfs_movilidad-MU1_ZBE.json';
        let d = process.cwd().replaceAll('\\', '/');
        for (let i = 0; i < 6; i++) {
          if (existsSync(d + suyo)) {
            return d + suyo;
          }
          d = d.slice(0, d.lastIndexOf('/'));
        }
        throw new Error('no encuentro la capa de la ZBE');
      })(),
      'utf-8',
    ),
  ) as {
    features: { properties: Record<string, string>; geometry: { coordinates: number[][][][] } }[];
  };
  const fase1 = capa.features.find((f) => f.properties['fase'] === 'FASE 1')!;
  // El WFS da `[lon, lat]`; el mapa quiere `[lat, lon]`, como el contrato.
  return fase1.geometry.coordinates.flatMap((poli) =>
    poli.map((anillo) => anillo.map(([lon, lat]) => [lat, lon] as Vertice)),
  );
}

/** El polígono pintado, si lo hay. */
function zonaPintada(raiz: HTMLElement): SVGPathElement | null {
  return raiz.querySelector<SVGPathElement>('.leaflet-zbe-pane path');
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

/**
 * ⭐ EL CASO DEL OJO EN BUS: andar, montar en la 29, andar.
 *
 * Los colores son los del feed, no nuestros: la **29** publica `route_color`
 * `F5C100` y `route_text_color` `000000`. Ver `lineaDelViaje` en el motor.
 */
const LINEA_29 = {
  id: '29',
  corto: '29',
  largo: 'Camino de Las Torres - San Gregorio',
  color: 'F5C100',
  colorTexto: '000000',
  modo: 'bus' as const,
};
const LINEA_TRA = {
  id: 'TRA',
  corto: 'TRA',
  largo: 'Tranvía',
  color: '00CC00',
  colorTexto: 'FFFFFF',
  modo: 'tram' as const,
};

const EN_BUS: readonly TramoDelViaje[] = [
  { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 478, segundos: 344, hito: 'sube' },
  { comoSeVa: 'montado', desde: 1, hasta: 2, metros: 4956, segundos: 2124, hito: 'baja', linea: LINEA_29 },
  { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 886, segundos: 638, hito: null },
];

/** Y uno CON TRANSBORDO: bus, paseo corto, tranvía. Cinco tramos. */
const CON_TRANSBORDO: readonly TramoDelViaje[] = [
  { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 300, segundos: 216, hito: 'sube' },
  { comoSeVa: 'montado', desde: 1, hasta: 2, metros: 2100, segundos: 900, hito: 'baja', linea: LINEA_29 },
  { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 180, segundos: 250, hito: 'sube' },
  { comoSeVa: 'montado', desde: 3, hasta: 4, metros: 3200, segundos: 800, hito: 'baja', linea: LINEA_TRA },
  { comoSeVa: 'andando', desde: 4, hasta: 5, metros: 90, segundos: 65, hito: null },
];

const SEIS: readonly Vertice[] = [
  [41.6661, -0.8773],
  [41.6826, -0.8712],
  [41.6476, -0.8641],
  [41.6461, -0.8673],
  [41.6401, -0.8703],
  [41.6388, -0.8721],
];

const CUATRO: readonly Vertice[] = [
  [41.6661, -0.8773],
  [41.6826, -0.8712],
  [41.6476, -0.8641],
  [41.6461, -0.8673],
];

/**
 * ⭐ SOLO LAS LÍNEAS DE ENCIMA: **una por tramo**.
 *
 * ⚠️ Desde el 1/09 cada tramo se pinta con DOS polilíneas —su ribete debajo y su
 * color encima—, así que contar `path.leaflet-interactive` ya no cuenta tramos.
 * Las jueces que hablan de tramos usan esto; las que hablan del ribete miran los
 * trazos crudos, que para eso están. El casing de cada línea es el trazo
 * inmediatamente anterior.
 */
function encima(raiz: HTMLElement): SVGPathElement[] {
  return Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive')).filter(
    (_, i) => i % 2 === 1,
  );
}

/** Las líneas pintadas, con el `stroke-dasharray` que Leaflet les pone. */
function lineas(raiz: HTMLElement): { discontinua: boolean }[] {
  return encima(raiz).map((p) => {
    const trazo = p.getAttribute('stroke-dasharray');
    return { discontinua: trazo !== null && trazo !== '' && trazo !== 'none' };
  });
}

/** El vestido completo de cada línea pintada: color y trazo. */
function vestidos(raiz: HTMLElement): { color: string | null; dash: string | null }[] {
  return encima(raiz).map((p) => ({
    color: p.getAttribute('stroke'),
    dash: p.getAttribute('stroke-dasharray'),
  }));
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
  it('⭐ 5 · el andando puro: DOS líneas ahora, y la de arriba igual que ayer', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set(A_PIE);
    await fixture.whenStable();

    // ⚠️ LA NO-REGRESIÓN, ACTUALIZADA A PROPÓSITO (1/09). Aquí se compraba que
    // el andando puro pintaba **una** línea; ahora son dos, y lo que cambia es
    // SOLO que se le ha puesto un casing debajo. La de arriba —color, grosor y
    // trazo— es la misma que llevaba desde el punto 7, y eso es lo que esta juez
    // sigue vigilando: las dos son discontinuas, y la de encima es el ámbar de
    // siempre a grosor 5 con su `10 8`.
    const crudos = Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'));
    expect(crudos.length).toBe(2);
    // ⭐ LAS DOS SON DISCONTINUAS: el casing hereda el patrón, y por eso los
    //    huecos siguen siendo huecos. Un casing sólido los rellenaría.
    for (const p of crudos) {
      expect(p.getAttribute('stroke-dasharray')).toBe('10 8');
    }

    const arriba = crudos[1]!;
    expect(arriba.getAttribute('stroke')).toBe('#b45309');
    expect(arriba.getAttribute('stroke-width')).toBe('5');
    expect(arriba.getAttribute('stroke-dasharray')).toBe('10 8');

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
   * ⭐ JUEZ 6 — EL CASO DEL OJO EN BUS: ámbar, la 29 en SU color, ámbar.
   *
   * El tramo montado **no tiene color propio**: lleva el que la línea publica
   * en `route_color`, y por eso la tabla `VESTIDO` no puede decidirlo. La 29 es
   * `#F5C100` y sale sólida; los dos paseos siguen siendo el ámbar discontinuo
   * de siempre, que **no se toca**.
   *
   * Y los dos hitos del poste: 🚌 donde se sube y 🚏 donde se baja.
   *
   * ⚠️ **Y desde el 1/09 la 29 va con RIBETE debajo**, porque su amarillo da
   * 1,46:1 sobre la tierra de OSM y la WCAG 1.4.11 pide 3. Así que los trazos
   * son cuatro y no tres: el ribete negro va **antes** que su línea, que es lo
   * que lo pone debajo. Lo que esta juez compra no cambia — el montado sigue
   * llevando el color del feed y los paseos siguen intactos—; lo que cambia es
   * que ahora también se mira quién va debajo. Ver `ribeteDe` en `mapa.ts`.
   */
  it('⭐ 6 · el bus pinta ámbar, el ribete, la línea en SU color del feed, y ámbar', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(CUATRO);
    fixture.componentInstance.tramos.set(EN_BUS);
    await fixture.whenStable();

    const trazos = vestidos(raiz);
    expect(trazos.length).toBe(3);
    // Los dos paseos: el vestido de siempre, al píxel.
    for (const i of [0, 2]) {
      expect(trazos[i]!.color).toBe('#b45309');
      expect(trazos[i]!.dash).toBe('10 8');
    }
    // ⭐ Y el montado, con el color DEL FEED y sólido.
    expect(trazos[1]!.color).toBe('#F5C100');
    expect(trazos[1]!.dash).toBe(null);
    // Que no es ni el ámbar del a-pie ni el azul de la rueda.
    expect(trazos[1]!.color).not.toBe('#b45309');
    expect(trazos[1]!.color).not.toBe('#2563eb');
    // ⭐ Y los TRES ribetes debajo, uno por tramo, todos negros por cálculo.
    const todos = Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'));
    expect(todos.length).toBe(6);
    expect(todos.filter((_, i) => i % 2 === 0).map((p) => p.getAttribute('stroke'))).toEqual([
      '#000000',
      '#000000',
      '#000000',
    ]);

    expect(hitos(raiz)).toEqual(['🚌', '🚏']);
  });

  /**
   * ⭐ JUEZ 7 — CON TRANSBORDO, DOS COLORES DE LÍNEA y el poste del cambio.
   *
   * Dos vehículos, dos colores distintos —cada uno el suyo—, y **tres** 🚌: el
   * de subir al primero, el de subir al segundo (que es el poste del cambio) y
   * los dos 🚏 de bajarse. Si el pintado usara un color por modo en vez de por
   * línea, los dos montados saldrían iguales y esta juez lo vería.
   */
  it('⭐ 7 · con transbordo se pintan DOS colores de línea y el poste del cambio', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(SEIS);
    fixture.componentInstance.tramos.set(CON_TRANSBORDO);
    await fixture.whenStable();

    // ⚠️ SIETE trazos, no cinco: las DOS líneas de este viaje son flojas sobre
    // la tierra —la 29 a 1,46:1 y el tranvía a 1,90:1— y cada una lleva su
    // ribete delante. Los dos colores de línea siguen siendo distintos, que es
    // lo que esta juez viene a comprar.
    const trazos = vestidos(raiz);
    expect(trazos.length).toBe(5);
    expect(trazos.map((t) => t.dash)).toEqual(['10 8', null, '10 8', null, '10 8']);
    expect(trazos[1]!.color).toBe('#F5C100');
    expect(trazos[3]!.color).toBe('#00CC00');
    // ⭐ Los DOS colores de línea son distintos entre sí: cada vehículo el suyo.
    expect(trazos[1]!.color).not.toBe(trazos[3]!.color);
    // El paseo del transbordo lleva el mismo ámbar que los otros dos.
    expect(trazos[2]!.color).toBe('#b45309');
    // Y los cinco ribetes, uno por tramo, cada uno con el trazo de su línea.
    const todos = Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'));
    expect(todos.length).toBe(10);
    for (let i = 0; i < todos.length; i += 2) {
      expect(todos[i]!.getAttribute('stroke')).toBe('#000000');
      expect(todos[i]!.getAttribute('stroke-dasharray')).toBe(
        todos[i + 1]!.getAttribute('stroke-dasharray'),
      );
    }

    // 🚌 al subir a cada uno —el segundo es el poste del cambio— y 🚏 al bajar.
    expect(hitos(raiz)).toEqual(['🚌', '🚏', '🚌', '🚏']);
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

    // ⚠️ `encima` porque desde el 1/09 cada tramo son DOS trazos: su ribete y
    // su color. Lo que esta juez compra —el vestido de cada modo— vive arriba.
    const trazos = encima(raiz).map((p) => ({
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

  /**
   * ⭐ JUEZ 3 — EL RIBETE: la 29 y la N7 no llegan solas, y con él sí.
   *
   * [WCAG 1.4.11 AA] 3:1 para un gráfico que transporta información. Los dos
   * casos son amarillos del feed, que es donde peor se porta la regla:
   *
   *     29  #F5C100 sobre la tierra de OSM (#f2efe9) → 1,46:1
   *     N7  #FFEB3D                                  → 1,06:1
   *
   * Con el ribete negro debajo, lo que se mide ya no es la línea contra el
   * plano: es el **ribete** contra el plano y la **línea** contra el ribete.
   */
  it('⭐ 3 · la 29 y la N7 no llegan a 3:1 solas; con su ribete, sí', () => {
    for (const color of ['F5C100', 'FFEB3D']) {
      expect(contraste(color, TIERRA_OSM), color).toBeLessThan(AA_GRAFICO);
      const ribete = ribeteDe(color);
      // El halo contra el plano, y la línea contra el halo. Las dos ≥ 3:1.
      expect(contraste(ribete, TIERRA_OSM), color + ' · ribete sobre la tierra').toBeGreaterThanOrEqual(AA_GRAFICO);
      expect(contraste(color, ribete), color + ' · línea sobre su ribete').toBeGreaterThanOrEqual(AA_GRAFICO);
    }
  });

  it('⭐ 3b · el tono del ribete SE CALCULA: sobre un plano claro gana el negro', () => {
    expect(ribeteDe('F5C100')).toBe('000000');
    expect(ribeteDe('27A737')).toBe('000000');
  });

  /**
   * ⭐ JUEZ 2 y 3 — **LAS 53, TODAS CON RIBETE**, y cada una legible sobre el suyo.
   *
   * ⚠️ Hasta esta mañana el ribete solo se ponía si la línea no llegaba a 3:1
   * **contra la tierra**, y eso dejaba **30 de las 53 sin él**. Lo cazó el ojo de
   * Antonio: *«la 21 sin reborde»*. Y tenía razón por partida doble.
   *
   *   1. La 21 es `#978685` y da **3,02:1 contra la tierra**: pasaba el filtro
   *      por **dos centésimas**.
   *   2. Y el filtro estaba mal planteado. [WCAG 1.4.11 · W3C *Understanding
   *      Non-text Contrast*] los 3:1 son contra los colores **adyacentes**, y una
   *      traza de bus cruza el plano entero. Censado el teselado real de un viaje
   *      de la 21 (259.072 píxeles de lienzo), la tierra es solo el **17,5 %**, y
   *      contra **10 de los 14 colores más extendidos** la 21 NO llega:
   *
   *          #f9b29c (la primaria naranja) → 1,96:1
   *          #c7c7b4 (zona industrial)     → 2,02:1
   *          #d1c6bd (4,4 % del plano)     → 2,07:1
   *          #fbd6a4 (la secundaria)       → 2,52:1
   *
   * ⇒ Medir contra un solo fondo no cumple el criterio. El ribete sí: garantiza
   *   el 3:1 contra **cualquier** vecino, porque el vecino pasa a ser él.
   */
  it('⭐ 2+3 · las 53 líneas del feed llevan ribete, y se leen sobre él', () => {
    /** Lo que un color se separa del plano, en su caso más desfavorable. */
    const sobreElPlano = (c: string): number =>
      Math.min(contraste(c, PLANO_MAS_CLARO), contraste(c, PLANO_MAS_OSCURO));

    for (const l of LINEAS_DEL_FEED) {
      const ribete = ribeteDe(l.color);
      expect(ribete, l.corto).toBeTruthy();
      // 1 · La línea se separa de su vecino inmediato, que es el ribete.
      expect(contraste(l.color, ribete), l.corto + ' sobre su ribete').toBeGreaterThanOrEqual(AA_GRAFICO);
      // 2 · Y el par se separa del plano entero: lo aporta el que pueda.
      expect(
        Math.max(sobreElPlano(ribete), sobreElPlano(l.color)),
        l.corto + ' · el par sobre el plano',
      ).toBeGreaterThanOrEqual(AA_GRAFICO);
    }
  });

  /**
   * ⭐ LAS DIECIOCHO OSCURAS SE RIBETEAN EN BLANCO, y por eso el tono se calcula.
   *
   * ⚠️ La Ci2 es `#702283`, de luminancia 0,062: contra un ribete negro da
   * **2,25:1** y la forma de la línea se perdería dentro de su propio halo. Se
   * ve sola sobre el plano claro —9,35:1 contra el blanco—, así que lo que le
   * hace falta no es separarse del plano: es un perfil CLARO que la dibuje.
   *
   * ⚠️ Y son **18, no 9**. Nueve no llegan a 3:1 contra el negro y no hay
   * discusión; las otras nueve —el azul `#0052CC` que comparten ocho servicios
   * especiales, y la 35— **sí llegan** (3,08:1 y 3,28:1) pero **ganan más en
   * blanco** (6,82:1 y 6,41:1), y el par sigue separándose del plano por la
   * propia línea (3,86:1 y 3,62:1). El criterio no es «¿llega con negro?»: es
   * cuál de los dos perfila mejor, que es lo que se maximiza.
   */
  it('⭐ 3c · las dieciocho líneas oscuras llevan ribete BLANCO; el resto, negro', () => {
    const enBlanco = LINEAS_DEL_FEED.filter((l) => ribeteDe(l.color) === 'FFFFFF').map((l) => l.corto);
    expect(enBlanco.sort()).toEqual([
      '34', '35', '40', '52', '55', '57', '60',
      'CE', 'CEM', 'Ci2', 'Ci3', 'Ci4', 'EM1', 'EM2', 'ES3', 'LAN', 'V1', 'V4',
    ]);
    // Y ninguna de las 18 pasa de 0,12 de luminancia: son oscuras de verdad.
    for (const l of LINEAS_DEL_FEED.filter((x) => ribeteDe(x.color) === 'FFFFFF')) {
      expect(luminancia(deHex(l.color)), l.corto).toBeLessThan(0.12);
    }
    expect(contraste('702283', '000000')).toBeLessThan(AA_GRAFICO);
    expect(contraste('702283', 'FFFFFF')).toBeGreaterThanOrEqual(AA_GRAFICO);
    // Y las claras siguen en negro: la 29, la 44, el tranvía.
    for (const c of ['F5C100', '27A737', '00CC00', '978685']) {
      expect(ribeteDe(c), c).toBe('000000');
    }
  });

  /**
   * ⭐ Y LA 21, LA QUE LO DESTAPÓ: pasaba por dos centésimas y no llega contra la
   * carretera que pisa. Va aparte porque es el caso, no un color más.
   */
  it('⭐ 2b · la 21 pasaba contra la tierra por 0,02 y no llega contra la calzada', () => {
    const l21 = LINEAS_DEL_FEED.find((l) => l.corto === '21')!;
    expect(l21.color.toUpperCase()).toBe('978685');
    expect(contraste(l21.color, TIERRA_OSM)).toBeGreaterThanOrEqual(AA_GRAFICO);
    expect(contraste(l21.color, TIERRA_OSM)).toBeLessThan(3.1);
    // La secundaria amarilla y la primaria naranja, censadas del teselado.
    expect(contraste(l21.color, 'fbd6a4')).toBeLessThan(AA_GRAFICO);
    expect(contraste(l21.color, 'f9b29c')).toBeLessThan(AA_GRAFICO);
    // Con ribete deja de depender de por dónde pase.
    expect(contraste(l21.color, ribeteDe(l21.color))).toBeGreaterThanOrEqual(AA_GRAFICO);
  });

  /**
   * ⭐ JUEZ 6 — LOS DEMÁS MODOS, AL BYTE. El ámbar del a-pie y el azul de la
   * rueda **ya pasan** —4,38:1 y 4,50:1, medidos cuando se eligieron—, así que
   * no llevan ribete: no se engorda lo que no hace falta engordar.
   */
  /**
   * ⭐ JUEZ 1 y 4 — A PIE Y EN BICI **TAMBIÉN LLEVAN RIBETE**, y el ámbar no cambia.
   *
   * ═══════════════════════════════════════════════════════════════════════════
   *  ⛔ Aquí se compraba lo contrario, y duró medio día: que el ámbar y el azul
   *    «ya llegaban» y por eso iban sin ribete. Llegaban **contra la tierra**
   *    —4,38:1 y 4,50:1—, que es exactamente el error que dejó a la 21 sin el
   *    suyo. Contra el peor color del plano, la primaria naranja `#f9b29c`:
   *
   *        ámbar #b45309 → 2,84:1     azul #2563eb → 2,92:1
   *
   *    [WCAG 1.4.11] los 3:1 son contra los colores **adyacentes**, y por esos
   *    dos naranjas pasa media ciudad.
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * ⚠️ **Lo que NO cambia: el color ni el trazo.** El ámbar es color de la casa
   * desde el punto 7 y el `10 8` es la identidad del a-pie [WCAG 1.4.1: el color
   * nunca solo]. Se añade una capa debajo y nada más.
   */
  it('⭐ 1+4 · a pie y en bici llevan ribete, y su color no se toca', async () => {
    for (const [comoSeVa, color] of [
      ['andando', '#b45309'],
      ['rodando', '#2563eb'],
    ] as const) {
      const fixture = TestBed.createComponent(Anfitrion);
      await fixture.whenStable();
      fixture.componentInstance.trazado.set(TRAMO);
      fixture.componentInstance.tramos.set([
        { comoSeVa, desde: 0, hasta: 2, metros: 400, segundos: 300, hito: null },
      ]);
      await fixture.whenStable();
      const trazos = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('path.leaflet-interactive'),
      );
      expect(trazos.length, comoSeVa).toBe(2);
      // ⭐ El ribete debajo, y la línea con SU color encima, sin tocar.
      expect(trazos[0]!.getAttribute('stroke'), comoSeVa).toBe('#000000');
      expect(trazos[1]!.getAttribute('stroke'), comoSeVa).toBe(color);
      // ⭐ Y las dos condiciones de la regla, sobre el peor color del plano.
      const suyo = color.slice(1);
      expect(contraste(suyo, PLANO_MAS_OSCURO)).toBeLessThan(AA_GRAFICO);
      expect(contraste(suyo, '000000')).toBeGreaterThanOrEqual(AA_GRAFICO);
      expect(
        Math.min(contraste('000000', PLANO_MAS_CLARO), contraste('000000', PLANO_MAS_OSCURO)),
      ).toBeGreaterThanOrEqual(AA_GRAFICO);
    }
  });

  /**
   * ⭐ JUEZ 2 — EL CASING DEL A-PIE ES **DISCONTINUO**, con el mismo patrón.
   *
   * ⚠️ Esto es lo que impide el arreglo fácil. Un casing sólido debajo de un
   * trazo discontinuo **rellena los huecos** y el a-pie deja de distinguirse del
   * que va en vehículo: la línea entera pasaría a leerse como sólida con
   * salpicaduras ámbar encima. [WCAG 1.4.1] el trazo es el segundo canal del
   * a-pie, y es el que sobrevive a un daltonismo o a una impresión en gris —
   * perderlo para ganar contraste sería cambiar un criterio por otro.
   *
   * Así que las tres propiedades del trazo se copian: `dashArray`, `dashOffset`
   * y `lineCap`. Lo único que cambia entre las dos capas es el color y el grosor.
   */
  it('⭐ 2 · el casing del a-pie comparte dashArray, dashOffset y lineCap', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set(A_PIE);
    await fixture.whenStable();
    const trazos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGPathElement>('path.leaflet-interactive'),
    );
    expect(trazos.length).toBe(2);
    const [casing, linea] = trazos;

    for (const atributo of ['stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap']) {
      expect(casing!.getAttribute(atributo), atributo).toBe(linea!.getAttribute(atributo));
    }
    // Y el patrón es el de siempre, no uno nuevo.
    expect(linea!.getAttribute('stroke-dasharray')).toBe('10 8');
    // ⭐ Y el remate es RECTO, no redondeado: con `round` cada guión del casing
    //    crece 4,5 px por lado —media anchura— y se come un hueco que mide 8.
    //    Medido en el píxel: 24 % de hueco con `round`, 56 % con `butt`.
    expect(linea!.getAttribute('stroke-linecap')).toBe('butt');
    // El casing es más ancho: por eso asoma.
    expect(Number(casing!.getAttribute('stroke-width'))).toBe(
      Number(linea!.getAttribute('stroke-width')) + 2 * ASOMA_EL_RIBETE,
    );
  });

  /**
   * ⭐ Y EL COLOR DE LA LÍNEA NO CAMBIA: el ribete es una polilínea APARTE, más
   * ancha y debajo. Se compra mirando lo que Leaflet pinta.
   */
  it('⭐ 4 · con ribete se pintan DOS polilíneas, y la de arriba conserva el color', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set([
      {
        comoSeVa: 'montado',
        desde: 0,
        hasta: 2,
        metros: 2000,
        segundos: 400,
        hito: 'baja',
        linea: { id: '29', corto: '29', largo: 'La 29', color: 'F5C100', colorTexto: '000000', modo: 'bus' },
      },
    ]);
    await fixture.whenStable();

    const trazos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('path.leaflet-interactive'),
    ).map((p) => ({ color: p.getAttribute('stroke'), grosor: Number(p.getAttribute('stroke-width')) }));

    expect(trazos.length).toBe(2);
    // El ribete va primero (debajo) y es más ancho por 2 px a cada lado.
    expect(trazos[0]!.color?.toUpperCase()).toBe('#000000');
    expect(trazos[1]!.color?.toUpperCase()).toBe('#F5C100');
    expect(trazos[0]!.grosor).toBe(trazos[1]!.grosor + 2 * ASOMA_EL_RIBETE);
  });

  it('⭐ 2c · una línea que llega contra la tierra TAMBIÉN lleva su ribete', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    fixture.componentInstance.trazado.set(TRAMO);
    fixture.componentInstance.tramos.set([
      {
        comoSeVa: 'montado',
        desde: 0,
        hasta: 2,
        metros: 2000,
        segundos: 400,
        hito: 'baja',
        linea: { id: '31', corto: '31', largo: 'La 31', color: 'D1221D', colorTexto: 'FFFFFF', modo: 'bus' },
      },
    ]);
    await fixture.whenStable();
    const trazos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('path.leaflet-interactive'),
    );
    // La 31 (#D1221D) da 4,62:1 contra la tierra y aun así lleva ribete: la
    // uniformidad no es un capricho, es que el plano no es solo tierra.
    expect(contraste('D1221D', TIERRA_OSM)).toBeGreaterThanOrEqual(AA_GRAFICO);
    expect(trazos.length).toBe(2);
    expect(trazos[0]!.getAttribute('stroke')?.toUpperCase()).toBe('#000000');
    expect(trazos[1]!.getAttribute('stroke')?.toUpperCase()).toBe('#D1221D');
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

  /**
   * ⭐ JUEZ 1 — EL POLÍGONO SE PINTA CUANDO SE LE DA, y no cuando no.
   *
   * [Patrón de serie: TomTom «Mostrar en mapa → LEZ»] la zona se dibuja para
   * que se vea dónde está. Aquí el mapa no decide cuándo: **lo decide quien lo
   * usa** —solo en coche—, y el mapa pinta lo que le den. Es la misma ley que
   * el resto de esta pantalla: el componente no adivina.
   */
  it('⭐ 1 · el polígono se pinta solo cuando se le pasa la zona', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Sin zona, ni un polígono.
    expect(zonaPintada(raiz)).toBeNull();

    fixture.componentInstance.zona.set(laFase1());
    fixture.detectChanges();
    await fixture.whenStable();

    const poligono = zonaPintada(raiz);
    expect(poligono).not.toBeNull();
    // ⚠️ **No intercepta el ratón**: es un fondo, no un control. Sin esto se
    //    come los clics del mapa que hay debajo.
    expect(poligono!.classList.contains('leaflet-interactive')).toBe(false);
    expect(poligono!.getAttribute('stroke')).toBe(`#${BORDE_DE_LA_ZONA}`);
    expect(poligono!.getAttribute('fill')).toBe(`#${TINTA_DEL_RELLENO}`);
    expect(Number(poligono!.getAttribute('fill-opacity'))).toBeCloseTo(RELLENO_DE_LA_ZONA, 3);

    // Y al quitarla, se va.
    fixture.componentInstance.zona.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(zonaPintada(raiz)).toBeNull();
  });

  /**
   * ⭐ JUEZ 2 — LA TRAZA DENTRO DE LA ZONA VA EN ROJO; la de fuera, en azul.
   *
   * Y el corte **no lo calcula el mapa**: viene en `TramoDelViaje.zbe`, que lo
   * pone el motor a partir de la marca de la arista. Ver el contrato.
   */
  it('⭐ 2 · el tramo dentro de la zona se pinta de rojo y el resto de azul', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.trazado.set(SEIS);
    fixture.componentInstance.tramos.set([
      { comoSeVa: 'rodando', desde: 0, hasta: 2, metros: 100, segundos: 10, hito: null, zbe: false },
      { comoSeVa: 'rodando', desde: 2, hasta: 4, metros: 100, segundos: 10, hito: null, zbe: true },
      { comoSeVa: 'rodando', desde: 4, hasta: 5, metros: 100, segundos: 10, hito: null, zbe: false },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(vestidos(raiz).map((v) => v.color)).toEqual([
      '#2563eb',
      `#${ROJO_DE_LA_ZONA}`,
      '#2563eb',
    ]);
    // Y ninguno es discontinuo: se conduce todo, dentro y fuera.
    expect(vestidos(raiz).every((v) => v.dash === null || v.dash === '')).toBe(true);

    // El mismo viaje sin pisar la zona: un solo color.
    fixture.componentInstance.tramos.set([
      { comoSeVa: 'rodando', desde: 0, hasta: 5, metros: 300, segundos: 30, hito: null, zbe: false },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(vestidos(raiz).map((v) => v.color)).toEqual(['#2563eb']);
  });

  /**
   * ⭐ JUEZ 8 — LOS TONOS, MEDIDOS CON EL INSTRUMENTO [WCAG 1.4.11, 1/09].
   *
   * ⚠️ **Y lo primero que se mide es que el rojo NO BASTA.** Contra el azul de
   *    la rueda da **1,07:1**: son el mismo peso visual, y quien no distinga
   *    rojo de azul no ve ninguna diferencia entre los dos trazos. Por eso el
   *    color **no va solo** [WCAG 1.4.1] y la zona se dice tres veces: el
   *    polígono la dibuja, el aviso la nombra, y el corte la parte.
   */
  it('⭐ 8 · los tonos de la zona, medidos', async () => {
    /**
     * ⚠️ **Y LO PRIMERO, QUE EL ROJO LLEVE SU RIBETE PINTADO.** Medir el tono
     *    y no mirar el dibujo dejaba un hueco: quitarle el casing al rojo
     *    pasaba esta juez entera —medido, contraprueba del encargo— y solo se
     *    caía de rebote en la juez del color, porque se descuadraba el par
     *    ribete/línea. Aquí se compra el par.
     */
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.trazado.set(SEIS);
    fixture.componentInstance.tramos.set([
      { comoSeVa: 'rodando', desde: 0, hasta: 2, metros: 100, segundos: 10, hito: null, zbe: false },
      { comoSeVa: 'rodando', desde: 2, hasta: 5, metros: 100, segundos: 10, hito: null, zbe: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const trazos = Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'));
    expect(trazos.length).toBe(4);  // dos tramos × (ribete + línea)
    expect(trazos[2]!.getAttribute('stroke')).toBe(`#${ribeteDe(ROJO_DE_LA_ZONA)}`);
    expect(trazos[3]!.getAttribute('stroke')).toBe(`#${ROJO_DE_LA_ZONA}`);
    expect(Number(trazos[2]!.getAttribute('stroke-width'))).toBe(
      Number(trazos[3]!.getAttribute('stroke-width')) + 2 * ASOMA_EL_RIBETE,
    );

    // El rojo pesa lo mismo que el azul y que el ámbar: es de la misma familia.
    expect(luminancia(deHex(ROJO_DE_LA_ZONA))).toBeCloseTo(0.1609, 3);
    expect(contraste(ROJO_DE_LA_ZONA, '2563eb')).toBeLessThan(1.1);

    // ⭐ El BORDE del polígono sí llega a 3:1 contra el peor color del plano, y
    //    por eso no necesita ribete: es el único trazo de esta pantalla que se
    //    dibuja sin uno.
    expect(contraste(BORDE_DE_LA_ZONA, PLANO_MAS_OSCURO)).toBeGreaterThanOrEqual(AA_GRAFICO);
    expect(contraste(BORDE_DE_LA_ZONA, TIERRA_OSM)).toBeGreaterThanOrEqual(AA_GRAFICO);

    // Y el relleno es un TINTE: apenas se separa de la tierra —1,12:1— para no
    // competir con las trazas que van encima.
    const mezcla = (tinta: string, alfa: number, fondo: string): string => {
      const t = deHex(tinta);
      const f = deHex(fondo);
      const dos = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
      return (
        dos(t.r * alfa + f.r * (1 - alfa)) +
        dos(t.g * alfa + f.g * (1 - alfa)) +
        dos(t.b * alfa + f.b * (1 - alfa))
      );
    };
    const sobreTierra = mezcla(TINTA_DEL_RELLENO, RELLENO_DE_LA_ZONA, TIERRA_OSM);
    expect(contraste(sobreTierra, TIERRA_OSM)).toBeLessThan(1.2);

    // ⭐ Y LO QUE IMPORTA: las trazas siguen leyéndose ENCIMA del relleno.
    for (const traza of ['2563eb', 'b45309', ROJO_DE_LA_ZONA]) {
      expect(contraste(traza, sobreTierra)).toBeGreaterThanOrEqual(AA_GRAFICO);
    }
    // Sobre el peor color del plano no llegan —ni llegaban antes—, y para eso
    // está el ribete, que se comprueba en su propia juez.
    expect(contraste(ROJO_DE_LA_ZONA, mezcla(TINTA_DEL_RELLENO, RELLENO_DE_LA_ZONA, PLANO_MAS_CLARO)))
      .toBeGreaterThanOrEqual(AA_GRAFICO);
    expect(ribeteDe(ROJO_DE_LA_ZONA)).toBeTruthy();
  });
});
