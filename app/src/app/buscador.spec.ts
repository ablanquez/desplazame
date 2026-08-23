import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type {
  Giro,
  ParteDelPaso,
  Paso,
  Portal,
  PortalCercano,
  Trayecto,
  Via,
} from '@desplazame/tipos';
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

// ── EL MOTOR DE RUTAS, FINGIDO Y DICHO ──────────────────────────────────────
//
// Aquí no hay motor: hay `HttpTestingController`, el mismo con el que ya se
// fingen las vías y los portales. Lo que estas pruebas miran es lo que la
// PANTALLA hace — qué pide, y qué enseña con lo que le contestan—; que el
// cálculo sea correcto lo prueban las 44 del motor, y el juez último es el ojo
// de Antonio sobre el mapa.

/**
 * Un trayecto con LA FORMA de uno real.
 *
 * Los cuatro pasos, sus giros y sus metros están calcados de una respuesta de
 * verdad de `POST /api/ruta` —CALLE ALFONSO I 10 → PASEO INDEPENDENCIA 3, 342 m
 * en cuatro pasos—, con los nombres cambiados a las dos vías que finge esta
 * prueba. La geometría va recortada a tres vértices: la de verdad trae 40 y lo
 * que se comprueba aquí es que llegue al mapa, no cuántos son.
 */
/**
 * Arma un paso como lo arma el motor: el texto se DERIVA de las partes, nunca
 * se escribe aparte. Si se escribiera aparte, estas pruebas podrían pasar con
 * un texto y unas partes que no cuadran, que es justo lo que el contrato
 * promete que no ocurre.
 */
function paso(giro: Giro, metros: number, ...partes: ParteDelPaso[]): Paso {
  return { giro, metros, partes, texto: partes.map((parte) => parte.texto).join('') };
}
const accion = (texto: string): ParteDelPaso => ({ papel: 'accion', texto });
const via = (texto: string): ParteDelPaso => ({ papel: 'via', texto });
const llano = (texto: string): ParteDelPaso => ({ papel: 'texto', texto });

const TRAYECTO: Trayecto = {
  modo: 'andando',
  pasos: [
    paso(
      'salida',
      91,
      accion('Sal de'),
      llano(' '),
      via('Calle Burgos 2'),
      llano(' y dirígete hacia el suroeste'),
      llano(' por '),
      via('Calle de Burgos'),
    ),
    // Un tramo narrado por su tipo: «la acera» NO se marca como vía.
    paso('izquierda', 150, accion('Gira a la izquierda'), llano(' hacia '), llano('la acera')),
    paso(
      'ligera-derecha',
      96,
      accion('Gira ligeramente a la derecha'),
      llano(' hacia '),
      via('Avenida de Goya'),
    ),
    paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6561, -0.8773],
    [41.6516, -0.879],
    [41.6425, -0.8865],
  ],
  avisos: [],
  metros: 342,
  segundos: 246,
};

/**
 * Lo que contesta el motor cuando la dirección está en una isla del grafo. El
 * texto es el suyo, literal: son las 581 puertas de las catorce vías aisladas.
 */
const SIN_RUTA: Trayecto = {
  modo: 'andando',
  pasos: [],
  geometria: [],
  avisos: [
    {
      texto:
        'URBANIZACIÓN PEÑA ZORONGO 5 no tiene ninguna calle andable cerca en ' +
        'nuestro mapa: desde ahí no podemos calcular una ruta.',
    },
  ],
  metros: 0,
  segundos: 0,
};

/** Y lo que contesta a un modo que todavía no atiende. También literal. */
const MODO_SIN_ATENDER: Trayecto = {
  modo: 'coche',
  pasos: [],
  geometria: [],
  avisos: [{ texto: 'Todavía no calculamos rutas en modo «coche». Solo andando.' }],
  metros: 0,
  segundos: 0,
};

/** Los diez giros del contrato, en el orden en que están declarados. */
const LOS_DIEZ_GIROS: readonly Giro[] = [
  'salida',
  'recto',
  'ligera-derecha',
  'derecha',
  'cerrada-derecha',
  'media-vuelta',
  'cerrada-izquierda',
  'izquierda',
  'ligera-izquierda',
  'llegada',
];

/** Un trayecto de mentira que usa LOS DIEZ giros, uno por paso. */
const TRAYECTO_DE_LOS_DIEZ: Trayecto = {
  ...TRAYECTO,
  pasos: LOS_DIEZ_GIROS.map((giro): Paso =>
    paso(giro, 10, accion('paso'), llano(' de '), via(giro)),
  ),
};

/** Rellena los cuatro campos por el camino de una persona, y deja listo el botón. */
async function direccionEntera(fixture: any, http: HttpTestingController): Promise<void> {
  await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
  await elegirPortal(fixture, 'portalOrigen', '2');
  await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
  await elegirPortal(fixture, 'portalDestino', '45');
  await fixture.whenStable();
}

/**
 * Los pasos que se leen en pantalla, cada uno con su flecha y sus metros.
 *
 * Las tres piezas se juntan con un espacio AQUÍ, y no lo hay en el DOM: quien
 * las separa en pantalla es el `gap` de la caja flexible, no un carácter. Leer
 * el `textContent` del `<li>` daría «↰Gira a la izquierda150 m», que es lo que
 * hay, y no dice nada de si se ve bien.
 */
function pasosEnPantalla(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).map((p) =>
    Array.from(p.querySelectorAll<HTMLElement>('span'))
      .map((s) => s.textContent?.trim() ?? '')
      // Los huecos NO cuentan. Un `<span>` sin texto —la columna del icono de
      // capa, que solo se llena en las dos puntas— metía un espacio de más al
      // unir, y esto compara LO QUE SE LEE. Lo que se lee no cambió.
      .filter((t) => t !== '')
      .join(' ')
      .trim(),
  );
}

/** Las flechas, solo las flechas. */
function flechasEnPantalla(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.paso__flecha')).map(
    (f) => f.textContent?.trim() ?? '',
  );
}

/** Los avisos ámbar del resultado, si los hay. */
function avisosDeRuta(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.aviso-ruta')).map(
    (a) => a.textContent?.trim() ?? '',
  );
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
  // ⭐ Desde el 23/08 el DESTINO pide también la capa de sitios. Se drena aquí
  // vacía: estas pruebas miran las calles, y una capa sin contestar deja la
  // aplicación inestable para siempre (`whenStable()` no vuelve). El origen no
  // la pide, así que `match` no encuentra nada y no pasa nada.
  for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
    cap.flush([]);
  }
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
  for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
    cap.flush([]);
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
    // ⭐ La capa de SITIOS se drena antes de verificar, y solo ella.
    //
    // Desde el 23/08 los DOS campos de calle ofrecen también sitios, así que
    // cualquier prueba que teclee en uno dispara una petición que a ella no le
    // importa. Estas pruebas son de calles y portales; que la capa de sitios
    // pida lo que debe lo vigilan las de `destino-sitio.spec.ts`.
    //
    // Se drena **solo** `/api/sitios`: si una de estas dejara una petición de
    // vías o de portales sin contestar, `verify()` sigue protestando, que es
    // justo para lo que está.
    for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
      cap.flush([]);
    }
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

  // ── LA RUTA DE VERDAD ─────────────────────────────────────────────────────
  //
  // Estas ocho sustituyen a las dos que fijaban la respuesta inventada del
  // punto 2. No es que se hayan borrado dos pruebas: es que lo que fijaban
  // —«genera los tres pasos de prueba», «el modo elegido se muestra»— ya no
  // existe, y lo que hay en su sitio es una llamada al motor. El ajuste se dice
  // aquí para que no parezca que la cobertura se ha encogido.

  /**
   * ⭐ LO PRIMERO, Y LO QUE MÁS IMPORTA: se piden los CUATRO CÓDIGOS.
   *
   * Es la ley de la entrada nº4 llegando al final del tubo. El formulario lleva
   * desde el punto 4 negándose a desbloquear con texto; si la petición
   * mandara los nombres, todo aquel cuidado no habría servido de nada.
   */
  it('«Generar» pide la ruta al motor con los cuatro códigos y el modo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    expect(botonGenerar(raiz).disabled).toBe(false);

    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticion = http.expectOne('/api/ruta');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      origen: { via: '5140', portal: 'Portales.5140a' },
      destino: { via: '1900', portal: 'Portales.1900a' },
      modo: 'andando',
    });

    peticion.flush(TRAYECTO);
    await fixture.whenStable();
  });

  it('los pasos del motor se listan con su flecha y sus metros', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(pasosEnPantalla(raiz)).toEqual([
      '◉ Sal de Calle Burgos 2 y dirígete hacia el suroeste por Calle de Burgos 91 m',
      '↰ Gira a la izquierda hacia la acera 150 m',
      '↗ Gira ligeramente a la derecha hacia Avenida de Goya 96 m',
      '⚑ Avenida Goya 45 está a la izquierda',
    ]);
    // El paso de llegada no abre tramo: 0 metros no se escriben.
    expect(pasosEnPantalla(raiz)[3]).not.toContain('0 m');
    expect(raiz.querySelector('.pasos__vacio')).toBeNull();
  });

  it('⭐ pone en NEGRITA la acción y el nombre de la vía, y nada más', async () => {
    // Es el formato de la captura de Google: lo que hay que hacer y por dónde,
    // destacados; el pegamento de la frase, no.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const negritas = (k: number): string[] =>
      Array.from(
        raiz.querySelectorAll<HTMLElement>('.paso')[k]!.querySelectorAll('strong'),
      ).map((f) => f.textContent ?? '');

    expect(negritas(0)).toEqual(['Sal de', 'Calle Burgos 2', 'Calle de Burgos']);
    expect(negritas(2)).toEqual(['Gira ligeramente a la derecha', 'Avenida de Goya']);
    expect(negritas(3)).toEqual(['Avenida Goya 45']);
  });

  it('⭐ un tramo que se narra por su TIPO no se pone en negrita', async () => {
    // «la acera» no es un nombre de calle, y destacarla lo haría parecer uno.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const segundo = raiz.querySelectorAll<HTMLElement>('.paso')[1]!;
    expect(Array.from(segundo.querySelectorAll<HTMLElement>('strong')).map((f) => f.textContent)).toEqual([
      'Gira a la izquierda',
    ]);
    // Y el texto entero se sigue leyendo igual.
    expect(segundo.querySelector('.paso__texto')!.textContent).toBe(
      'Gira a la izquierda hacia la acera',
    );
  });

  it('⭐ el texto que se lee es EXACTAMENTE la unión de las partes', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const pintados = Array.from(
      raiz.querySelectorAll<HTMLElement>('.paso__texto'),
    ).map((t) => t.textContent);
    expect(pintados).toEqual(TRAYECTO.pasos.map((p) => p.texto));
  });

  /**
   * Los diez giros del contrato tienen flecha, y son diez flechas DISTINTAS.
   *
   * La segunda mitad es la que de verdad vigila: un mapeo con dos giros
   * apuntando al mismo glifo se lee igual de bien y miente igual de bien.
   */
  it('los diez giros del contrato tienen su flecha, y ninguna se repite', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO_DE_LOS_DIEZ);
    await fixture.whenStable();

    const flechas = flechasEnPantalla(raiz);
    expect(flechas.length).toBe(10);
    expect(flechas.every((f) => f !== '')).toBe(true);
    expect(new Set(flechas).size).toBe(10);
  });

  it('la cabecera dice de dónde a dónde, cuánto, y el tiempo COMO DERIVADO', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelector('.ruta__origen')?.textContent).toContain('CALLE BURGOS 2');
    expect(raiz.querySelector('.ruta__destino')?.textContent).toContain('AVENIDA GOYA 45');
    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('342 m');

    // 246 s son 4,1 min. Y lo que NO puede faltar es de dónde sale ese número:
    // no está medido, es una división. Si algún día se enseña como una promesa
    // —«4 min»— esta prueba se pone roja.
    const duracion = raiz.querySelector('.ruta__duracion')?.textContent ?? '';
    expect(duracion).toContain('4 min');
    expect(duracion).toContain('5 km/h');
  });

  it('la geometría del motor llega al mapa, y regenerar retira la anterior', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);

    // Segunda generación: una línea, no dos.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);

    // Y una que NO trae geometría —una isla— deja el mapa limpio, no con la
    // línea de la ruta anterior colgada debajo de un aviso que dice que no hay.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(SIN_RUTA);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });

  it('mientras se genera, el botón lo dice y no se deja repulsar', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    expect(botonGenerar(raiz).disabled).toBe(true);
    expect(botonGenerar(raiz).textContent).toContain('Generando');

    // Y repulsarlo no manda una segunda petición.
    botonGenerar(raiz).click();
    fixture.detectChanges();

    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(false);
    expect(botonGenerar(raiz).textContent).toContain('Generar ruta');
  });

  it('el aviso del motor se enseña en ámbar, y no se lista ningún paso', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(SIN_RUTA);
    await fixture.whenStable();

    expect(avisosDeRuta(raiz)[0]).toContain('PEÑA ZORONGO');
    expect(avisosDeRuta(raiz)[0]).toContain('no tiene ninguna calle andable cerca');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
    expect(raiz.querySelector('.ruta__metros')).toBeNull();
  });

  /**
   * El modo que se enseña es EL QUE CONTESTA EL MOTOR, no el que está pulsado.
   * Los tres modos que faltan no dan ruta, y el motor lo dice con todas las
   * letras: la pantalla enseña ese aviso tal cual, sin traducirlo ni suavizarlo.
   */
  it('un modo que el motor no atiende enseña SU aviso, no una ruta a pie', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelectorAll<HTMLButtonElement>('.modo')[3].click(); // Coche
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticion = http.expectOne('/api/ruta');
    expect((peticion.request.body as { modo: string }).modo).toBe('coche');
    peticion.flush(MODO_SIN_ATENDER);
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Coche');
    expect(avisosDeRuta(raiz)[0]).toContain('Todavía no calculamos rutas en modo «coche»');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
  });

  it('si el motor no contesta, la ruta lo dice en ámbar y no pinta nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    http
      .expectOne('/api/ruta')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    await fixture.whenStable();

    expect(avisosDeRuta(raiz)[0]).toContain('No se pudo preguntar al motor');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
    expect(botonGenerar(raiz).disabled).toBe(false);
    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });

  /**
   * ⭐ EL ENTIERRO. La respuesta inventada del punto 2 no puede volver por la
   * puerta de atrás: ni su aviso, ni sus frases, ni su trazado.
   */
  it('no queda rastro de la respuesta inventada: ni aviso, ni frases, ni trazado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelector('.aviso-prueba')).toBeNull();
    const todo = raiz.textContent ?? '';
    expect(todo).not.toContain('DATOS DE PRUEBA');
    expect(todo).not.toContain('parada de prueba');
    expect(todo).not.toContain('línea de prueba');
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
    // Desde el 23/08 el origen pide también la capa de sitios: sin drenarla,
    // `whenStable()` no vuelve. Se contesta vacía porque esta prueba mira el
    // borrador de una CALLE.
    for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
      cap.flush([]);
    }
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
