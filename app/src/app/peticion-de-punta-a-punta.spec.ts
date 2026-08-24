import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Sitio, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';
// ⭐ EL CONTRATO REAL, no uno simulado: se importa la MISMA función que el
// servidor llama en cada `POST /api/ruta`.
import { leerPeticion } from '../../../motor/src/peticion';

/**
 * ⭐ LA JUEZ QUE FALTABA: el formulario contra el lector del motor.
 *
 * Las cien pruebas de esta pantalla comprobaban el formulario por dentro
 * —qué casilla se apaga, qué cruza el ⇅, qué códigos monta `extremoDe`— y las
 * del motor comprobaban el motor por dentro. **Entre las dos quedaba un hueco
 * del tamaño exacto del fallo**: nadie cogía el cuerpo que sale de la pantalla
 * y se lo daba a leer al motor de verdad. Con el origen roto, las 100 seguían
 * verdes (bitácora nº11).
 *
 * Por eso aquí no hay un doble del motor ni una copia de sus reglas: se
 * importa `leerPeticion` de `motor/src/peticion.ts`. Si el motor endurece lo
 * que acepta, esta prueba se pone roja sin que nadie la toque — que es
 * justamente lo que no pasó.
 *
 * Se vigila el cuerpo que sale del `POST`, **no lo que devuelve el motor**:
 * calcular una ruta necesita el grafo entero y eso es trabajo del motor, con
 * sus nueve juez. Lo que aquí no se sabía es si la petición era legible.
 */

const BURGOS: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

const PORTALES_BURGOS: readonly Portal[] = [{ codigo: 'Portales.5140a', numero: '2' }];

const FARMACIA: Sitio = {
  codigo: 'Farmacias.8691',
  presentacion: 'Farmacia · Avda. de Navarra, 65',
  categoria: 'Farmacia',
  tipo: 'farmacia',
};

const OTRA_FARMACIA: Sitio = {
  codigo: 'Farmacias.8844',
  presentacion: 'Farmacia · Pº de la Mina, 5',
  categoria: 'Farmacia',
  tipo: 'farmacia',
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

describe('⭐ DE PUNTA A PUNTA: lo que manda la pantalla, leído por el motor', () => {
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<Buscador>>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    raiz = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    for (const r of http.match((q) => q.url.startsWith('/api/'))) r.flush([]);
    http.verify();
  });

  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  async function contestar(vias: readonly Via[], sitios: readonly Sitio[]): Promise<void> {
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush(vias);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush(sitios);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  function pulsar(campo: string, capa: string): void {
    raiz
      .querySelector<HTMLElement>(`[data-campo="${campo}"] .sugerencia[data-capa="${capa}"]`)!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
  }

  async function drenarEco(): Promise<void> {
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([]);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([]);
    fixture.detectChanges();
  }


  /**
   * ⭐ Pone el TIPO de un campo, que desde el 24/08 hay que decirlo antes de
   * buscar un sitio: el desplegable filtra el cajetín a una sola categoría y
   * la búsqueda mezclada murió (decisión de Antonio, firmada). Sin esto, el
   * campo pide vías y no llega a preguntar por sitios.
   */
  async function ponerTipo(campo: string, tipo: string): Promise<void> {
    const cual = campo.replace('calle', '');
    const select = raiz.querySelector<HTMLSelectElement>(`select[name="tipo${cual}"]`)!;
    select.value = tipo;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  async function elegirSitioEn(campo: string, sitio: Sitio): Promise<void> {
    await ponerTipo(campo, sitio.tipo);
    await teclear(campo, 'navarra');
    await contestar([], [sitio]);
    pulsar(campo, 'sitio');
    await drenarEco();
  }

  async function elegirDireccionEn(campo: string, portal: string): Promise<void> {
    await teclear(campo, 'burgos');
    await contestar([BURGOS], []);
    pulsar(campo, 'via');
    await drenarEco();
    for (const r of http.match(`/api/portales?via=${BURGOS.codigo}`)) r.flush(PORTALES_BURGOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    const casilla = campoDe(raiz, portal);
    casilla.value = '2';
    casilla.dispatchEvent(new Event('input'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    casilla
      .closest('app-selector-portal')!
      .querySelector<HTMLElement>('.portal')!
      .dispatchEvent(new MouseEvent('mousedown'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  /**
   * Pulsa «Generar» y devuelve **el cuerpo tal cual sale al cable**.
   *
   * Pasa por `JSON.parse(JSON.stringify(...))` a propósito: lo que el motor
   * recibe es texto, no el objeto de la pantalla. Un `undefined` en un campo
   * desaparece por el camino, y esa diferencia es la que hay que ver aquí.
   */
  function loQueSeMandaAlMotor(): unknown {
    const boton = raiz.querySelector<HTMLButtonElement>('.generar')!;
    expect(boton.disabled).toBe(false);
    boton.click();
    fixture.detectChanges();
    const peticion = http.expectOne('/api/ruta');
    const cuerpo: unknown = JSON.parse(JSON.stringify(peticion.request.body));
    peticion.flush({ modo: 'andando', metros: 0, segundos: 0, pasos: [], geometria: [] });
    fixture.detectChanges();
    return cuerpo;
  }

  it('⭐ SITIO EN EL ORIGEN: el motor lo lee', async () => {
    await elegirSitioEn('calleOrigen', FARMACIA);
    await elegirDireccionEn('calleDestino', 'portalDestino');

    const cuerpo = loQueSeMandaAlMotor();
    // Se enseña el cuerpo en el mensaje: si esto se rompe, lo primero que hace
    // falta saber es qué se estaba mandando.
    expect(leerPeticion(cuerpo), `el motor no supo leer: ${JSON.stringify(cuerpo)}`).toEqual({
      origen: { sitio: 'Farmacias.8691' },
      destino: { via: '5140', portal: 'Portales.5140a' },
      modo: 'andando',
    });
  });

  it('SITIO EN EL DESTINO: el motor lo lee', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirSitioEn('calleDestino', FARMACIA);

    const cuerpo = loQueSeMandaAlMotor();
    expect(leerPeticion(cuerpo), `el motor no supo leer: ${JSON.stringify(cuerpo)}`).toEqual({
      origen: { via: '5140', portal: 'Portales.5140a' },
      destino: { sitio: 'Farmacias.8691' },
      modo: 'andando',
    });
  });

  it('SITIO → SITIO: el motor lo lee', async () => {
    await elegirSitioEn('calleOrigen', FARMACIA);
    await elegirSitioEn('calleDestino', OTRA_FARMACIA);

    const cuerpo = loQueSeMandaAlMotor();
    expect(leerPeticion(cuerpo), `el motor no supo leer: ${JSON.stringify(cuerpo)}`).toEqual({
      origen: { sitio: 'Farmacias.8691' },
      destino: { sitio: 'Farmacias.8844' },
      modo: 'andando',
    });
  });

  it('DIRECCIÓN → DIRECCIÓN sigue leyéndose (que la simetría no rompa lo viejo)', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    const cuerpo = loQueSeMandaAlMotor();
    expect(leerPeticion(cuerpo), `el motor no supo leer: ${JSON.stringify(cuerpo)}`).toEqual({
      origen: { via: '5140', portal: 'Portales.5140a' },
      destino: { via: '5140', portal: 'Portales.5140a' },
      modo: 'andando',
    });
  });
});
