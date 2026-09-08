import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { rutas } from './rutas';
import { estadoDe, esViva, filaDelFeedServido, type Recurso } from './panel';

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

describe('⭐ LAS VIVAS — se consultan, no se copian', () => {
  const viva: Recurso = {
    name: 'ruta-operativa',
    path: 'https://zaragoza.avanzagrupo.com/lineas-y-horarios/',
    title: 'La ruta operativa de hoy',
    cadencia: 'TTL 1 h · refresco cada 30 min',
    cadenciaFuente: 'TTL_DESVIOS_MS en motor/src/desvios.ts',
  };

  /**
   * ⭐ UNA FUENTE VIVA NO SE MIDE CON EL SEMÁFORO DE UN FICHERO.
   *
   * [Data Package v1] el `path` «puede ser una URL http completamente
   * cualificada»: los recursos remotos son de primera clase. Pero un recurso
   * remoto **no tiene copia que envejezca**, así que preguntarle «¿cuántos días
   * tiene tu descarga?» no significa nada. Lo que sí significa es **cada cuánto
   * se pregunta**, y eso es lo que se enseña.
   */
  it('⭐ una fuente remota sale gris informativo, con su cadencia y su fuente', () => {
    expect(esViva(viva)).toBe(true);
    const e = estadoDe(viva, new Date('2026-09-08T00:00:00Z'));
    expect(e.color).toBe('gris');
    expect(e.texto).toContain('TTL 1 h');
    expect(e.regla).toBeTruthy();
    expect(e.fuente).toBe('TTL_DESVIOS_MS en motor/src/desvios.ts');
    // ⚠️ Y NO dice «NO CONSTA»: constar, consta — lo que no hay es fichero.
    expect(e.texto).not.toContain('NO CONSTA');
  });

  it('⭐ y un conjunto de fichero sigue sin ser viva', () => {
    expect(esViva({ name: 'x', path: 'app/data/x.json', title: 'X' })).toBe(false);
  });

  /**
   * ⭐ LO QUE SE LE PREGUNTA AL MOTOR TAMBIÉN ES VIVO.
   *
   * Lo que define a una viva no es de quién es la fuente, es que **no hay copia
   * que envejezca**: ni descarga que fechar, ni huella que enseñar.
   */
  it('⭐ una fila que se le pregunta al motor cuenta como viva', () => {
    expect(esViva({ name: 'feed-servido', path: '/api/salud', title: 'X' })).toBe(true);
  });
});

describe('⭐ LA FILA VIVA DEL FEED — la que el manifiesto no puede decir', () => {
  /**
   * ⭐ LOS TRES ESTADOS, CADA UNO CON SU COLOR.
   *
   * ⚠️ Esta fila existe porque había **dos verdades**: el manifiesto declara la
   *    caducidad de la SEMILLA del repositorio y el motor sirve el VIVO, que el
   *    cron renueva. Tras una renovación el panel habría seguido enseñando la
   *    fecha vieja, con 200 y sin ruido. Esta fila sale de `/api/salud`, o sea
   *    del zip que de verdad se está sirviendo.
   */
  it('⭐ vigente es verde, aviso es ámbar y caducado es rojo', () => {
    const verde = filaDelFeedServido({ sello: '20260623_AUZSA', vence: '20261005', estado: 'vigente' });
    expect(verde.e.color).toBe('verde');
    expect(verde.r.title).toContain('sirviendo');
    expect(verde.e.texto).toContain('05/10/2026');

    expect(filaDelFeedServido({ sello: 'x', vence: '20261005', estado: 'aviso' }).e.color).toBe('ambar');
    expect(filaDelFeedServido({ sello: 'x', vence: '20261005', estado: 'caducado' }).e.color).toBe('rojo');
  });

  it('⭐ y dice de qué feed habla, con su sello', () => {
    const f = filaDelFeedServido({ sello: '20260623_AUZSA_Y_TRANVIA', vence: '20261005', estado: 'vigente' });
    expect(f.r.modified).toBe('20260623_AUZSA_Y_TRANVIA');
    // Sin fichero: es una fuente viva, y no finge tener huella.
    expect(f.r.hash).toBeUndefined();
    expect(f.r.bytes).toBeUndefined();
  });
});

describe('⭐ LA PÁGINA /panel', () => {
  let http: HttpTestingController;
  let peticiones: string[];
  const fetchDeVerdad = globalThis.fetch;

  beforeEach(async () => {
    peticiones = [];
    globalThis.fetch = ((url: string) => {
      peticiones.push(String(url));
      // ⭐ El panel pide DOS cosas: el manifiesto (estático) y la salud del
      //    motor (viva). El doble contesta a cada uno lo suyo.
      if (String(url).includes('/api/salud')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              feed: { sello: '20260623_AUZSA_Y_TRANVIA', vence: '20261005', estado: 'aviso' },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        );
      }
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
    const filas = Array.from(raiz.querySelectorAll('tbody tr'));
    // ⚠️ Se busca la fila POR SU TÍTULO y no por su posición: desde que existe
    //    la fila viva del feed, el índice 0 ya no es «el conjunto uno», y una
    //    juez que dependa del orden se rompe cada vez que la tabla crece.
    const suya = filas.find((f) => (f.textContent ?? '').includes('El conjunto uno'))!;
    expect(filas.length).toBe(3);
    expect(suya).toBeTruthy();
    expect(suya.textContent).toContain('El conjunto uno');
    expect(suya.textContent).toContain('2026-08-20');
  });

  it('⭐ el que no tiene regla sale GRIS y con NO CONSTA a la vista', async () => {
    const { raiz } = await ir('/panel');
    const sinRegla = Array.from(raiz.querySelectorAll('tbody tr')).find((f) =>
      (f.textContent ?? '').includes('El conjunto uno'),
    )!;
    expect(sinRegla.querySelector('.panel__estado--gris')).not.toBeNull();
    expect(sinRegla.textContent).toContain('NO CONSTA');
  });

  /**
   * ⭐ LA FILA VIVA DEL FEED SE PINTA, y sale del MOTOR.
   *
   * ⚠️ Es la mitad que cierra las dos verdades: el manifiesto declara la
   *    caducidad de la semilla y el motor sirve el vivo. Si esta fila no
   *    estuviera, tras una renovación del cron el panel enseñaría la fecha
   *    vieja con 200 y sin ruido.
   */
  it('⭐ pregunta al motor por el feed servido y lo pinta como fila viva', async () => {
    const { raiz } = await ir('/panel');
    expect(peticiones.filter((u) => u.includes('/api/salud')).length).toBe(1);

    const texto = (raiz.textContent ?? '').replace(/\s+/g, ' ');
    expect(texto).toContain('sirviendo AHORA');
    expect(texto).toContain('20260623_AUZSA_Y_TRANVIA');
    // El doble dice «aviso», así que la fila tiene que salir ámbar.
    const ambar = Array.from(raiz.querySelectorAll('.panel__estado--ambar')).map(
      (e) => (e.textContent ?? '').trim(),
    );
    expect(ambar.some((t) => t.includes('05/10/2026'))).toBe(true);
  });

  it('⭐ el que tiene regla la enseña CON SU FUENTE, no solo el color', async () => {
    const { raiz } = await ir('/panel');
    // Por título, no por posición: ver la juez de la fila viva.
    const conRegla = Array.from(raiz.querySelectorAll('tbody tr')).find((f) =>
      (f.textContent ?? '').includes('El conjunto dos'),
    )!;
    expect(conRegla.textContent).toContain('feed_end_date=20261005');
  });
});
