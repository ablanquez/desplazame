import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Via } from '@desplazame/tipos';
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

describe('Buscador', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
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
});
