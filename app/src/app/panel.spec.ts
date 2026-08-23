import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { rutas } from './rutas';
import { estadoDe, type Recurso } from './panel';

/**
 * ⭐ EL PANEL DE FRESCURA — que cada conjunto se sepa fresco o caduco.
 *
 * Dos cosas se vigilan aquí y son distintas:
 *
 * 1. **El semáforo**, que es una función pura y se prueba con fechas
 *    inventadas — así se puede comprobar el borde exacto de cada regla sin
 *    depender de qué día sea hoy.
 * 2. **La página**, que monta la ruta y pinta la tabla.
 *
 * Y una tercera que vive en `app.spec.ts` y es la más importante: que la raíz
 * en frío **siga sin pedir un solo byte de datos**. El manifiesto se baja al
 * entrar en `/panel` y en ningún otro momento.
 */
describe('⭐ EL SEMÁFORO — solo hay color donde hay regla con fuente', () => {
  const base: Recurso = { name: 'x', path: 'a/b.json', title: 'X', bytes: 1, hash: 'sha256:00' };
  /**
   * ⚠️ **Las doce del mediodía, y no la medianoche.** Con `HOY` a las 00:00:00
   * los bordes no se pueden probar: el instante en que empieza un día y el
   * instante en que otro acaba caen en el mismo sitio, así que mover el umbral
   * de `T23:59:59Z` a `T00:00:00Z` no cambiaba ningún resultado y la prueba del
   * borde pasaba igual estando el código bien o mal. Lo cazó la contraprueba —
   * la prueba seguía verde con el umbral mutado— y por eso la hora está aquí
   * escrita y explicada: a mediodía, cada borde cae de un lado.
   */
  const HOY = new Date('2026-08-23T12:00:00Z');

  it('sin regla ninguna: GRIS, y dice NO CONSTA', () => {
    // El gris no es un fallo del panel: es la verdad sobre ese conjunto, y la
    // lista de deberes. Ninguna caducidad se inventa.
    const e = estadoDe(base, HOY);
    expect(e.color).toBe('gris');
    expect(e.texto).toBe('NO CONSTA');
  });

  it('⭐ una fecha de caducidad ya pasada: ROJO', () => {
    const e = estadoDe({ ...base, caducaEl: '2026-08-22', caducidadFuente: 'el publicador' }, HOY);
    expect(e.color).toBe('rojo');
  });

  it('⭐ y justo el día que caduca todavía NO es rojo', () => {
    // El borde exacto: «caduca el 5 de octubre» incluye el 5 de octubre.
    expect(estadoDe({ ...base, caducaEl: '2026-08-23', caducidadFuente: 'x' }, HOY).color).toBe('verde');
    expect(estadoDe({ ...base, caducaEl: '2026-08-22', caducidadFuente: 'x' }, HOY).color).toBe('rojo');
  });

  it('⭐ periodicidad mensual y una descarga de hace más de un mes: ÁMBAR', () => {
    const mes = { accrualPeriodicity: MENSUAL, periodicidadFuente: 'el Ayuntamiento' };
    expect(estadoDe({ ...base, ...mes, descargadoEl: '2026-07-22T00:00:00Z' }, HOY).color).toBe('ambar');
    expect(estadoDe({ ...base, ...mes, descargadoEl: '2026-08-01T00:00:00Z' }, HOY).color).toBe('verde');
  });

  it('⭐ el borde del mes, a la hora', () => {
    const mes = { accrualPeriodicity: MENSUAL, periodicidadFuente: 'x' };
    // Un mes justo desde la descarga: el límite cae seis horas por delante de
    // «ahora», así que todavía es verde. Seis horas antes, ya ha pasado.
    expect(estadoDe({ ...base, ...mes, descargadoEl: '2026-07-23T18:00:00Z' }, HOY).color).toBe('verde');
    expect(estadoDe({ ...base, ...mes, descargadoEl: '2026-07-23T06:00:00Z' }, HOY).color).toBe('ambar');
  });

  it('periodicidad SIN fecha de descarga: gris, porque no hay nada que contar', () => {
    const e = estadoDe({ ...base, accrualPeriodicity: MENSUAL, periodicidadFuente: 'x' }, HOY);
    expect(e.color).toBe('gris');
  });

  it('⭐ la caducidad manda sobre la periodicidad: lo caducado es rojo', () => {
    const e = estadoDe(
      {
        ...base,
        caducaEl: '2026-08-01',
        caducidadFuente: 'x',
        accrualPeriodicity: MENSUAL,
        periodicidadFuente: 'x',
        descargadoEl: '2026-08-22T00:00:00Z',
      },
      HOY,
    );
    expect(e.color).toBe('rojo');
  });
});

const MENSUAL = 'http://publications.europa.eu/resource/authority/frequency/MONTHLY';

describe('⭐ LA PÁGINA /panel', () => {
  let http: HttpTestingController;
  let peticiones: string[];
  const fetchDeVerdad = globalThis.fetch;

  beforeEach(async () => {
    peticiones = [];
    globalThis.fetch = ((url: string) => {
      peticiones.push(String(url));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            name: 'desplazame-datos',
            profile: 'data-package',
            resources: [
              {
                name: 'uno',
                path: 'app/data/uno.json',
                title: 'El conjunto uno',
                bytes: 10,
                hash: 'sha256:aa',
                descargadoEl: '2026-08-20T00:00:00Z',
              },
              {
                name: 'dos',
                path: 'app/data/dos.zip',
                title: 'El conjunto dos',
                bytes: 20,
                hash: 'sha256:bb',
                descargadoEl: '2026-08-10T09:44:51Z',
                caducaEl: '2026-10-05',
                caducidadFuente: 'feed_info.txt: feed_end_date=20261005',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
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

  async function ir(camino: string) {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    await router.navigate([camino]);
    await fixture.whenStable();
    await fixture.whenStable();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('⭐ /panel existe y no cae en el comodín', async () => {
    const { raiz } = await ir('/panel');
    expect(raiz.querySelector('app-panel')).not.toBeNull();
    expect(raiz.querySelector('app-buscador')).toBeNull();
  });

  it('⭐ pide el manifiesto, y una sola vez', async () => {
    await ir('/panel');
    const suyas = peticiones.filter((u) => u.includes('datapackage.json'));
    expect(suyas.length).toBe(1);
  });

  it('⭐ pinta una fila por conjunto, con su título y su fecha de descarga', async () => {
    const { raiz } = await ir('/panel');
    const filas = raiz.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
    expect(filas[0]!.textContent).toContain('El conjunto uno');
    expect(filas[0]!.textContent).toContain('2026-08-20');
  });

  it('⭐ el que no tiene regla sale GRIS y con NO CONSTA a la vista', async () => {
    const { raiz } = await ir('/panel');
    const primera = raiz.querySelectorAll('tbody tr')[0]!;
    expect(primera.querySelector('.panel__estado--gris')).not.toBeNull();
    expect(primera.textContent).toContain('NO CONSTA');
  });

  it('⭐ el que tiene regla la enseña CON SU FUENTE, no solo el color', async () => {
    const { raiz } = await ir('/panel');
    const segunda = raiz.querySelectorAll('tbody tr')[1]!;
    expect(segunda.textContent).toContain('feed_end_date=20261005');
  });
});
