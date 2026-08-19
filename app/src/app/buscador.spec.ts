import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, PortalCercano, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';

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

function botonInvertir(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.invertir')!;
}

function botonUbicacion(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.ubicacion')!;
}

/** El aviso ámbar de la ubicación, si lo hay. */
function avisoUbicacion(raiz: HTMLElement): string | null {
  return raiz.querySelector('.aviso-ubicacion')?.textContent?.trim() ?? null;
}

/** El `<input>` de un campo, por su nombre. */
function campoDe(raiz: HTMLElement, nombre: string): HTMLInputElement {
  return raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
}

/** Lo que se lee en un campo. */
function valor(raiz: HTMLElement, nombre: string): string {
  return campoDe(raiz, nombre).value;
}

const BURGOS: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

const GOYA: Via = {
  codigo: '1900',
  nombre: 'AVENIDA GOYA',
  limpio: 'AVENIDA GOYA',
  nucleo: null,
  tipo: 'AV',
  portales: 120,
};

/** Los portales que sirve el motor fingido para cada una. */
const PORTALES_BURGOS: readonly Portal[] = [
  { codigo: 'Portales.5140a', numero: '2' },
  { codigo: 'Portales.5140b', numero: '4' },
];

const PORTALES_GOYA: readonly Portal[] = [
  { codigo: 'Portales.1900a', numero: '45' },
  { codigo: 'Portales.1900b', numero: '47' },
];

/** Cómo se ve una vía en la lista: igual que la pinta el autocompletar. */
function comoSeVe(via: Via): string {
  return via.nucleo ? `${via.limpio} [${via.nucleo}]` : via.limpio;
}

/**
 * Elige una calle **por el gesto de una persona**: escribe, espera a que el
 * campo pregunte al motor, y pulsa la sugerencia.
 *
 * El atajo —escribir el texto y ya— es justamente lo que estas pruebas hacían
 * antes, y por eso el fallo de la entrada nº4 de la bitácora vivió con las 18
 * en verde. Rellenar por el atajo no cubre el campo: lo fija.
 */
async function elegirCalle(
  fixture: any,
  http: HttpTestingController,
  nombre: string,
  escrito: string,
  via: Via,
  portales: readonly Portal[],
): Promise<void> {
  const raiz = fixture.nativeElement as HTMLElement;
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.value = escrito;
  campo.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  // La espera del componente antes de preguntar. Sin temporizadores falsos:
  // congelan el planificador de Angular (ver `autocompletar-via.spec.ts`).
  await new Promise((sigue) => setTimeout(sigue, 300));
  fixture.detectChanges();

  http.expectOne(`/api/vias?q=${encodeURIComponent(escrito)}`).flush([via]);
  await fixture.whenStable();

  // Hay DOS autocompletar en la pantalla: se pulsa la sugerencia del que toca.
  //
  // Y OJO con no poner un `whenStable()` aquí: elegir la calle despierta al
  // selector de portales, que pide los suyos al instante. `whenStable()`
  // esperaría esa petición, y quien la resuelve es esta misma función unas
  // líneas más abajo. Abrazo mortal — el mismo de `autocompletar-via.spec.ts`,
  // que ha vuelto a morder en cuanto ha habido dos peticiones encadenadas.
  const suyo = campo.closest('app-autocompletar-via')!;
  suyo.querySelector<HTMLElement>('.sugerencia')!.dispatchEvent(new MouseEvent('mousedown'));
  fixture.detectChanges();

  // EL ECO. Elegir cambia el texto del campo, y ese cambio vuelve a disparar la
  // consulta 200 ms después aunque el campo ya esté resuelto y no haya nada que
  // buscar. Es comportamiento de HOY, ajeno al fallo que arregla este encargo:
  // queda REPORTADO, no tocado. Se drena aquí para que `verify()` no lo cuente
  // como una petición perdida.
  await new Promise((sigue) => setTimeout(sigue, 250));
  fixture.detectChanges();
  for (const eco of http.match(`/api/vias?q=${encodeURIComponent(comoSeVe(via))}`)) {
    eco.flush([via]);
  }

  // Y fijar la calle despierta a SU selector de portales, que pide los suyos.
  http.expectOne(`/api/portales?via=${via.codigo}`).flush(portales);
  await fixture.whenStable();
}

/** Elige un portal de la lista del campo que toca, como lo haría una persona. */
async function elegirPortal(
  fixture: any,
  nombre: string,
  numero: string,
): Promise<void> {
  const raiz = fixture.nativeElement as HTMLElement;
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.dispatchEvent(new Event('focus'));
  fixture.detectChanges();

  const suyo = campo.closest('app-selector-portal')!;
  const opcion = Array.from(suyo.querySelectorAll<HTMLElement>('.portal')).find(
    (o) => o.textContent?.trim() === numero,
  );
  if (!opcion) {
    throw new Error(`no está el portal ${numero} en ${nombre}`);
  }
  opcion.dispatchEvent(new MouseEvent('mousedown'));
  await fixture.whenStable();
}

/**
 * Drena lo que dispara mover los campos POR CÓDIGO, sin teclado de por medio.
 *
 * Son dos cosas, las dos comportamiento de hoy y ninguna del encargo:
 *  1. cambiar la vía de un campo despierta a su selector de portales, que pide
 *     los de la vía nueva — al instante;
 *  2. EL ECO: cambiar el texto de una calle vuelve a disparar la consulta 200 ms
 *     después aunque el campo ya esté resuelto. Está reportado desde el punto 4
 *     y sigue sin tocarse.
 *
 * Se drena para que `verify()` no las cuente como peticiones perdidas.
 */
async function drenar(fixture: any, http: HttpTestingController): Promise<void> {
  await new Promise((sigue) => setTimeout(sigue, 250));
  fixture.detectChanges();
  for (const pendiente of http.match(() => true)) {
    pendiente.flush([]);
  }
  await fixture.whenStable();
}

// La geolocalizacion, FINGIDA Y DICHA.
//
// jsdom NO trae la Geolocation API: `navigator.geolocation` es `undefined`.
// Asi que aqui no se prueba el GPS —eso no se puede probar desde una prueba, y
// el juez es el portatil de Antonio—. Lo que si es real, y es lo que miran
// estas pruebas, es que se le PIDE al navegador y que se hace con cada una de
// las respuestas que la doc dice que puede dar.

/** Lo que hara el `getCurrentPosition` fingido en la prueba que toque. */
let respondeGeo: (exito: PositionCallback, fallo: PositionErrorCallback) => void;

/** Las opciones con las que se le llamo, para poder mirarlas. */
let opcionesGeo: PositionOptions | undefined;

function fingirGeolocalizacion(): void {
  respondeGeo = () => {
    throw new Error('la prueba no ha dicho que contesta la geolocalizacion');
  };
  opcionesGeo = undefined;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (
        exito: PositionCallback,
        fallo: PositionErrorCallback,
        opciones?: PositionOptions,
      ) => {
        opcionesGeo = opciones;
        respondeGeo(exito, fallo);
      },
    },
  });
}

/** Una posicion como la que da el navegador, con su radio de confianza. */
function posicion(lat: number, lon: number, precision: number): GeolocationPosition {
  return {
    coords: { latitude: lat, longitude: lon, accuracy: precision },
    timestamp: 0,
  } as unknown as GeolocationPosition;
}

/** [DOC MDN] Los tres codigos de `GeolocationPositionError`. */
function falloGeo(codigo: number): GeolocationPositionError {
  return { code: codigo, message: '' } as GeolocationPositionError;
}

/** El punto del Pilar. */
const PILAR: readonly [number, number] = [41.6564, -0.8779];

/** Lo que contestaria el motor para ese punto. */
const CERCA: PortalCercano = {
  via: BURGOS,
  portal: { codigo: 'Portales.5140a', numero: '2' },
  metros: 42,
};

describe('Buscador', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fingirGeolocalizacion();
  });

  afterEach(() => {
    http.verify();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(Buscador);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pinta el nombre del proyecto', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('h1')?.textContent).toContain('Desplázame');
  });

  it('tiene los cuatro campos: calle y portal de origen y de destino', async () => {
    const fixture = TestBed.createComponent(Buscador);
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
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const botones = raiz.querySelectorAll<HTMLButtonElement>('.modo');
    expect(botones.length).toBe(4);
    expect(modosActivos(raiz)).toEqual(['Andando']);
  });

  it('los modos son excluyentes: elegir uno apaga el anterior', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const botones = raiz.querySelectorAll<HTMLButtonElement>('.modo');

    botones[2].click(); // Bici
    await fixture.whenStable();

    expect(modosActivos(raiz)).toEqual(['Bici / Patinete']);
    expect(botones[0].getAttribute('aria-pressed')).toBe('false');
    expect(botones[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('con campos vacíos el botón está bloqueado y no pinta nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(botonGenerar(raiz).disabled).toBe(true);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__lista')).toBeNull();
    expect(raiz.querySelector('.pasos__vacio')).not.toBeNull();
  });

  /**
   * EL FALLO DE LA ENTRADA Nº4. Este cuerpo es, letra por letra, el de la
   * prueba que daba verde con el fallo vivo — con la expectativa al revés:
   * escribir texto en las dos calles NO es haberlas elegido.
   */
  it('escribir las calles sin elegirlas de la lista NO desbloquea «Generar»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    escribir(raiz, 'calleDestino', 'Avenida de Goya');
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__lista')).toBeNull();
    expect(raiz.querySelector('.pasos__vacio')).not.toBeNull();
  });

  /**
   * Y el portal ya ni siquiera se deja teclear: sin vía fijada el campo está
   * deshabilitado, así que el camino por el que se colaba un `99999` está
   * cerrado de raíz, no vigilado.
   */
  it('sin calle elegida, los dos campos de portal están deshabilitados', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    await fixture.whenStable();

    for (const nombre of ['portalOrigen', 'portalDestino']) {
      const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
      expect(campo.disabled).toBe(true);
      expect(campo.placeholder).toBe('Elige antes la calle');
    }
  });

  it('con la calle elegida pero SIN portal, «Generar» sigue bloqueado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await fixture.whenStable();

    // Las dos vías tienen código; ningún portal lo tiene. Faltan dos de cuatro.
    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  /**
   * Cambiar la calle después de haber elegido portal vuelve a bloquear: el
   * portal de la calle vieja no vale para la nueva.
   */
  it('cambiar una calle tira su portal y vuelve a bloquear «Generar»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();
    expect(botonGenerar(raiz).disabled).toBe(false);

    // Se cambia la calle de origen por otra: su portal deja de valer.
    await elegirCalle(fixture, http, 'calleOrigen', 'goya', GOYA, PORTALES_GOYA);
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);
    expect(raiz.querySelector<HTMLInputElement>('input[name="portalOrigen"]')!.value).toBe('');
  });

  it('con tres de los cuatro códigos, el botón sigue bloqueado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  it('con las dos calles ELEGIDAS y los dos portales genera los tres pasos de prueba', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(false);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelectorAll('.pasos__lista li').length).toBe(3);
    expect(raiz.querySelector('.aviso-prueba')?.textContent).toContain('DATOS DE PRUEBA');
    expect(raiz.querySelector('.pasos__vacio')).toBeNull();
  });

  it('el modo elegido es el que se muestra en el resultado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelectorAll<HTMLButtonElement>('.modo')[3].click(); // Coche
    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Coche');
  });

  // ── ⇅ INVERTIR ────────────────────────────────────────────────────────────

  it('⇅ invertir intercambia los cuatro campos, CÓDIGOS incluidos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();
    expect(botonGenerar(raiz).disabled).toBe(false);

    botonInvertir(raiz).click();
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('AVENIDA GOYA');
    expect(valor(raiz, 'portalOrigen')).toBe('45');
    expect(valor(raiz, 'calleDestino')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalDestino')).toBe('2');

    // Y con ellos los CÓDIGOS: «Generar» sigue desbloqueado.
    //
    // Aquí es donde se ve por qué la regla «cambiar de calle tira el portal»
    // tuvo que subir al padre. Si siguiera dentro del selector de portal, la
    // vía nueva de cada lado dispararía el tirón y los dos portales acabarían
    // vacíos: invertir se deshacía a sí mismo.
    expect(botonGenerar(raiz).disabled).toBe(false);

    await drenar(fixture, http);
  });

  it('⇅ invertir con un lado a medias: el borrador viaja tal cual', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Origen a medias: escrito, no elegido, y salido del campo — borrador.
    escribir(raiz, 'calleOrigen', 'burgos');
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
    http.expectOne('/api/vias?q=burgos').flush([BURGOS]);
    await fixture.whenStable();
    campoDe(raiz, 'calleOrigen').dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    expect(campoDe(raiz, 'calleOrigen').getAttribute('aria-invalid')).toBe('true');

    // Destino entero.
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();

    botonInvertir(raiz).click();
    fixture.detectChanges();

    // El borrador ha cruzado, y cruza MARCADO: el estado a medias viaja entero.
    expect(valor(raiz, 'calleDestino')).toBe('burgos');
    expect(campoDe(raiz, 'calleDestino').getAttribute('aria-invalid')).toBe('true');

    // Y el lado bueno llega limpio al otro extremo.
    expect(valor(raiz, 'calleOrigen')).toBe('AVENIDA GOYA');
    expect(campoDe(raiz, 'calleOrigen').getAttribute('aria-invalid')).toBeNull();
    expect(valor(raiz, 'portalOrigen')).toBe('45');

    // Sigue faltando media dirección, así que sigue bloqueado.
    expect(botonGenerar(raiz).disabled).toBe(true);

    await drenar(fixture, http);
  });

  // ── MI UBICACIÓN ──────────────────────────────────────────────────────────

  it('«Mi ubicación» rellena calle y portal POR CÓDIGO, como si se hubieran elegido', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // El destino se pone a mano, para que solo falte el origen.
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, 'portalDestino', '45');
    await fixture.whenStable();
    expect(botonGenerar(raiz).disabled).toBe(true);

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    // Mientras se espera al motor, el botón no se deja pulsar otra vez.
    expect(botonUbicacion(raiz).disabled).toBe(true);

    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalOrigen')).toBe('2');
    expect(avisoUbicacion(raiz)).toBeNull();
    expect(botonUbicacion(raiz).disabled).toBe(false);

    // Y lo que prueba que hay CÓDIGO detrás y no solo texto: el botón se
    // desbloquea. Con el texto puesto y el código vacío seguiría bloqueado —
    // que es exactamente el fallo de la entrada nº4.
    expect(botonGenerar(raiz).disabled).toBe(false);

    await drenar(fixture, http);
  });

  it('pide la posición con las TRES opciones declaradas', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);

    expect(opcionesGeo).toEqual({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    await drenar(fixture, http);
  });

  it('con la precisión mala NI PREGUNTA al motor, y dice cuántos metros son', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // 1.200 m de radio: un posicionamiento por IP, no un GPS.
    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 1200));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('1200 metros');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    // El umbral se mira ANTES de preguntar: no se molesta al motor en balde.
    http.expectNone(() => true);
  });

  it('con el portal demasiado lejos NO toca los campos y dice a cuántos está', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    // 676 m es lo que mide Puerto Venecia, que está DENTRO de Zaragoza. Por eso
    // el mensaje NO puede decir «no estás en Zaragoza»: lo estaría diciendo
    // estando en Zaragoza. Habla de la distancia, que es lo que sí sabemos.
    http
      .expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`)
      .flush({ ...CERCA, metros: 676 } satisfies PortalCercano);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('676 metros');
    expect(avisoUbicacion(raiz)).not.toContain('Zaragoza');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(valor(raiz, 'portalOrigen')).toBe('');
    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  it('los TRES fallos de la API tienen su mensaje, y ninguno toca los campos', async () => {
    const esperados: ReadonlyArray<readonly [number, string]> = [
      [1, 'Sin permiso de ubicación'],
      [2, 'no ha podido averiguar dónde estás'],
      [3, 'Se ha tardado demasiado'],
    ];

    for (const [codigo, trozo] of esperados) {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      respondeGeo = (_exito, fallo) => fallo(falloGeo(codigo));
      botonUbicacion(raiz).click();
      fixture.detectChanges();

      expect(avisoUbicacion(raiz)).toContain(trozo);
      expect(valor(raiz, 'calleOrigen')).toBe('');
      expect(botonUbicacion(raiz).disabled).toBe(false);
      http.expectNone(() => true);
    }
  });

  it('un aviso viejo se borra al volver a pulsar: no se queda mintiendo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (_exito, fallo) => fallo(falloGeo(3));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    expect(avisoUbicacion(raiz)).toContain('Se ha tardado demasiado');

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toBeNull();
    expect(valor(raiz, 'calleOrigen')).toBe('CALLE BURGOS');

    await drenar(fixture, http);
  });

  it('lo que rellena «Mi ubicación» se puede INVERTIR: así se pone como destino', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    botonInvertir(raiz).click();
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(valor(raiz, 'calleDestino')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalDestino')).toBe('2');

    await drenar(fixture, http);
  });

  // Las tres ramas que no salen de la API sino del camino: sin contexto
  // seguro, con el motor caído, y con el motor diciendo que no sabe. No están
  // en los cinco mensajes que se aprobaron, pero existen, y un botón que no
  // hace nada y no dice por qué es peor que no tener botón.

  it('sin la API de geolocalización lo DICE, y dice que hace falta https', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    botonUbicacion(raiz).click();
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('conexión segura (https)');
    expect(botonUbicacion(raiz).disabled).toBe(false);
    http.expectNone(() => true);
  });

  /**
   * La que más se parece a un navegador de verdad.
   *
   * El GPS NO contesta dentro del click: tarda. Y cuando contesta, lo hace
   * desde una devolución de llamada que no es un evento de Angular. Aquí eso
   * se finge con un temporizador, y **a propósito no se llama a
   * `detectChanges()` en ningún momento**: si el aviso aparece, es porque
   * escribir la señal ya pide el repintado por su cuenta. Esta aplicación no
   * lleva zone.js —no hay `polyfills` en `angular.json`—, así que eso no se
   * puede dar por hecho: o se mira, o no consta.
   */
  it('la respuesta que llega TARDE repinta igual, sin empujar la pantalla a mano', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (_exito, fallo) => {
      setTimeout(() => fallo(falloGeo(1)), 0);
    };
    botonUbicacion(raiz).click();

    await new Promise((sigue) => setTimeout(sigue, 30));
    await fixture.whenStable();

    expect(avisoUbicacion(raiz)).toContain('Sin permiso de ubicación');
    http.expectNone(() => true);
  });

  it('si el motor no contesta, lo dice igual que los demás campos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    http
      .expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('No se pudo preguntar al motor');
    expect(botonUbicacion(raiz).disabled).toBe(false);
    expect(valor(raiz, 'calleOrigen')).toBe('');
  });

  it('si el motor contesta que NO SABE, no se rellena media dirección', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(null);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('No hemos podido situarte');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(botonGenerar(raiz).disabled).toBe(true);
  });
});
