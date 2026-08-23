import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Sitio, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';

/**
 * ⭐ LOS SITIOS EN LA PANTALLA: destinos y orígenes con nombre.
 *
 * Cuatro cosas se vigilan aquí:
 *
 * 1. Que **los dos campos** ofrecen sitios además de calles, y que las dos
 *    capas se distinguen sin tener que leer el texto.
 * 2. Que al elegir un sitio **la casilla de portal de ese lado se apaga** — la
 *    regla del portal condicional (19/08): un sitio trae su propia coordenada,
 *    así que pedirle un portal sería pedirle un dato que no tiene.
 * 3. Que el **⇅ cruza el sitio** como cruza todo lo demás, en todas sus
 *    combinaciones.
 * 4. Que lo que viaja son **códigos**, nunca la presentación.
 *
 * ⚠️ **La simetría es del 23/08 y corrigió lo de la víspera.** El sitio nació
 * solo en el destino y duró un día: el ⇅ intercambia los dos lados enteros
 * desde el punto 6, así que un origen que no admitiera sitios lo dejaba
 * teniendo que decidir qué tirar. Dos campos que se intercambian tienen que
 * aceptar lo mismo.
 *
 * ⚠️ Y aquí no se usa `whenStable()` mientras haya una petición sin contestar:
 * esperaría a quien la resuelve unas líneas más abajo. Es el abrazo mortal que
 * `buscador.spec.ts` documenta. Lo que hace falta tras un `flush` es **ceder el
 * turno** —`setTimeout(0)`—, porque `httpResource` publica en una microtarea.
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
};

const OTRA_FARMACIA: Sitio = {
  codigo: 'Farmacias.8844',
  presentacion: 'Farmacia · Pº de la Mina, 5',
  categoria: 'Farmacia',
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

describe('⭐ LOS SITIOS en los dos extremos', () => {
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
    http.verify();
  });

  /** Teclea y espera a que salte la consulta, sin resolver nada todavía. */
  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  /** Contesta a las dos capas y deja la lista pintada. */
  async function contestar(vias: readonly Via[], sitios: readonly Sitio[]): Promise<void> {
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush(vias);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush(sitios);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  /** Las opciones del desplegable de un campo, con la capa de cada una. */
  function opciones(campo: string): { texto: string; capa: string }[] {
    const lista = raiz.querySelectorAll<HTMLElement>(`[data-campo="${campo}"] .sugerencia`);
    return Array.from(lista).map((li) => ({
      texto: li.textContent?.trim() ?? '',
      capa: li.getAttribute('data-capa') ?? '',
    }));
  }

  function pulsar(campo: string, capa: string): void {
    raiz
      .querySelector<HTMLElement>(`[data-campo="${campo}"] .sugerencia[data-capa="${capa}"]`)!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
  }

  /** Drena el eco: cambiar el texto al elegir vuelve a disparar la consulta. */
  async function drenarEco(): Promise<void> {
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([]);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([]);
    fixture.detectChanges();
  }

  /** Elige un sitio en el campo que se le diga. */
  async function elegirSitioEn(campo: string, sitio: Sitio = FARMACIA): Promise<void> {
    await teclear(campo, 'navarra');
    await contestar([], [sitio]);
    pulsar(campo, 'sitio');
    await drenarEco();
  }

  /** Rellena un lado con la dirección entera, por el camino de siempre. */
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
    casilla.closest('app-selector-portal')!
      .querySelector<HTMLElement>('.portal')!
      .dispatchEvent(new MouseEvent('mousedown'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  const invertir = (): void => {
    raiz.querySelector<HTMLButtonElement>('.invertir')!.click();
    fixture.detectChanges();
  };

  const generar = (): HTMLButtonElement => raiz.querySelector<HTMLButtonElement>('.generar')!;

  /** Drena lo que quede de las capas, para que `verify()` no lo cuente. */
  function drenarTodo(): void {
    for (const r of http.match((q) => q.url.startsWith('/api/'))) r.flush([]);
  }

  // ── LA CAPA ────────────────────────────────────────────────────────────────

  it('⭐ LOS DOS campos piden la capa de sitios', async () => {
    // Era la prueba de la asimetría —«el destino sí y el origen no»— y la
    // corrección del 23/08 la derogó: ahora se exige lo contrario, que los dos
    // pregunten. El motivo está en la cabecera.
    await teclear('calleDestino', 'navarra');
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(1);
    await contestar([], [FARMACIA]);
    await drenarEco();

    await teclear('calleOrigen', 'navarra');
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(1);
    await contestar([], [FARMACIA]);
    await drenarEco();
  });

  it('⭐ las dos capas se ven, y se distinguen por un atributo', async () => {
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);

    const o = opciones('calleDestino');
    expect(o.length).toBe(2);
    // La capa NO se deduce del texto: va escrita.
    expect(o.map((x) => x.capa).sort()).toEqual(['sitio', 'via']);
    expect(o.find((x) => x.capa === 'sitio')!.texto).toContain('Farmacia · Avda. de Navarra, 65');
    expect(o.find((x) => x.capa === 'via')!.texto).toContain('CALLE BURGOS');
    await drenarEco();
  });

  // ── EL PORTAL CONDICIONAL, EN LOS DOS LADOS ────────────────────────────────

  it('⭐ un sitio en el DESTINO apaga su casilla de portal', async () => {
    await elegirSitioEn('calleDestino');
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(true);
    expect(campoDe(raiz, 'calleDestino').value).toBe('Farmacia · Avda. de Navarra, 65');
  });

  it('⭐ y un sitio en el ORIGEN apaga la suya, igual', async () => {
    await elegirSitioEn('calleOrigen');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(true);
    expect(campoDe(raiz, 'calleOrigen').value).toBe('Farmacia · Avda. de Navarra, 65');
  });

  it('⭐ y lo APAGA el sitio, no la falta de vía: se comprueba estando encendida', async () => {
    // ⚠️ La prueba de arriba pasaba por la razón equivocada, y lo destapó la
    // contraprueba: sin vía elegida la casilla ya está apagada, así que
    // comprobar que está apagada tras poner un sitio no dice nada. Aquí se
    // rellena la dirección PRIMERO —la casilla queda encendida— y solo entonces
    // se elige el sitio: si se apaga, es por el sitio.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(false);

    await elegirSitioEn('calleOrigen');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(true);
    drenarTodo();
  });

  it('⭐ y elegir una CALLE apaga el sitio que hubiera: no se quedan los dos', async () => {
    // Son las dos maneras de decir a dónde y no pueden estar puestas a la vez.
    // Si el sitio sobreviviera a elegir una calle, «Generar» mandaría el sitio
    // viejo mientras la pantalla enseña la calle nueva.
    await elegirSitioEn('calleOrigen');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(true);

    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    // La casilla vuelve a encenderse: ya no hay sitio que la apague.
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(false);
    expect(campoDe(raiz, 'calleOrigen').value).toBe('CALLE BURGOS');

    // Y lo que viaja es la dirección, no el sitio de antes.
    await elegirSitioEn('calleDestino');
    generar().click();
    fixture.detectChanges();
    const ruta = http.expectOne('/api/ruta');
    expect(ruta.request.body.origen).toEqual({ via: '5140', portal: 'Portales.5140a' });
    ruta.flush({ modo: 'andando', pasos: [], geometria: [], avisos: [], metros: 0, segundos: 0 });
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    drenarTodo();
  });

  it('⭐ elegir un sitio DEJA LIMPIO el portal que hubiera escrito', async () => {
    // La costura del encargo: ¿qué pasa con el portal escrito? Se limpia — y
    // lo hace el camino del teclado, no una línea que hable del sitio: para
    // ver la lista hay que teclear, teclear suelta la vía, y soltar la vía
    // limpia su portal. Medido: antes «2», después «».
    //
    // Importa que quede fijado: si sobreviviera, al invertir cruzaría un
    // portal huérfano al otro lado.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    expect(campoDe(raiz, 'portalOrigen').value).toBe('2');
    await elegirSitioEn('calleOrigen');
    expect(campoDe(raiz, 'portalOrigen').value).toBe('');
    drenarTodo();
  });

  it('⭐ tras elegir un sitio, TECLEAR otra cosa lo suelta: nada queda fijado a escondidas', async () => {
    // El caso que ninguna prueba miraba: se elige un sitio, y luego se sigue
    // escribiendo sin elegir nada. Si el sitio sobreviviera al tecleo, la
    // pantalla enseñaría un texto y «Generar» mandaría OTRA COSA — la ruta
    // saldría bien, pero a un sitio que no es el que se lee. Es el fallo de la
    // entrada nº4 con el disfraz nuevo.
    await elegirSitioEn('calleOrigen');
    await elegirSitioEn('calleDestino');
    expect(generar().disabled).toBe(false);

    // Y ahora se teclea encima del origen, sin elegir.
    await teclear('calleOrigen', 'otra cosa que no existe');
    await contestar([], []);
    expect(campoDe(raiz, 'calleOrigen').value).toBe('otra cosa que no existe');
    // El sitio se ha soltado: el botón se apaga en vez de mandar el viejo.
    expect(generar().disabled).toBe(true);
    await drenarEco();
  });

  // ── EL ⇅, SUS COMBINACIONES ────────────────────────────────────────────────

  it('⭐ ⇅ sitio→vacío: el sitio cruza y el otro lado queda vacío', async () => {
    await elegirSitioEn('calleOrigen');
    invertir();
    expect(campoDe(raiz, 'calleDestino').value).toBe('Farmacia · Avda. de Navarra, 65');
    expect(campoDe(raiz, 'calleOrigen').value).toBe('');
    // La casilla apagada viaja con su lado: ahora es la del destino.
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(true);
  });

  it('⭐ ⇅ sitio↔dirección: se cruzan, y cada casilla queda como toca', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirSitioEn('calleDestino');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(false);
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(true);

    invertir();

    // El sitio está ahora en el origen y la dirección en el destino, y las dos
    // casillas se han cambiado el estado con ellos.
    expect(campoDe(raiz, 'calleOrigen').value).toBe('Farmacia · Avda. de Navarra, 65');
    expect(campoDe(raiz, 'calleDestino').value).toBe('CALLE BURGOS');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(true);
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(false);
    expect(campoDe(raiz, 'portalDestino').value).toBe('2');
    // Y sigue pudiéndose generar: invertir no rompe una ruta que ya valía.
    expect(generar().disabled).toBe(false);
    drenarTodo();
  });

  it('⭐ ⇅ sitio↔sitio: los dos cruzan y ninguna casilla se enciende', async () => {
    await elegirSitioEn('calleOrigen', FARMACIA);
    await elegirSitioEn('calleDestino', OTRA_FARMACIA);
    invertir();
    expect(campoDe(raiz, 'calleOrigen').value).toBe('Farmacia · Pº de la Mina, 5');
    expect(campoDe(raiz, 'calleDestino').value).toBe('Farmacia · Avda. de Navarra, 65');
    expect(campoDe(raiz, 'portalOrigen').disabled).toBe(true);
    expect(campoDe(raiz, 'portalDestino').disabled).toBe(true);
    expect(generar().disabled).toBe(false);
  });

  it('⭐ ⇅ un BORRADOR cruza como borrador, sin inventarse un sitio', async () => {
    // Texto escrito que no corresponde a nada: cruza siendo texto. Inventarle
    // un sitio «porque ya estaba escrito» sería el fallo de la nº4 con otro
    // disfraz.
    await teclear('calleOrigen', 'farmacia que no existe');
    await contestar([], []);
    invertir();
    expect(campoDe(raiz, 'calleDestino').value).toBe('farmacia que no existe');
    expect(campoDe(raiz, 'calleOrigen').value).toBe('');
    expect(generar().disabled).toBe(true);
    await drenarEco();
  });

  // ── LO QUE VIAJA ───────────────────────────────────────────────────────────

  it('⭐ dirección → sitio manda la pareja y el código', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirSitioEn('calleDestino');
    expect(generar().disabled).toBe(false);
    generar().click();
    fixture.detectChanges();
    const ruta = http.expectOne('/api/ruta');
    expect(ruta.request.body.origen).toEqual({ via: '5140', portal: 'Portales.5140a' });
    expect(ruta.request.body.destino).toEqual({ sitio: 'Farmacias.8691' });
    ruta.flush({ modo: 'andando', pasos: [], geometria: [], avisos: [], metros: 0, segundos: 0 });
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    drenarTodo();
  });

  it('⭐ y sitio → sitio manda los DOS códigos, nunca la presentación', async () => {
    await elegirSitioEn('calleOrigen', FARMACIA);
    await elegirSitioEn('calleDestino', OTRA_FARMACIA);
    expect(generar().disabled).toBe(false);
    generar().click();
    fixture.detectChanges();
    const ruta = http.expectOne('/api/ruta');
    expect(ruta.request.body.origen).toEqual({ sitio: 'Farmacias.8691' });
    expect(ruta.request.body.destino).toEqual({ sitio: 'Farmacias.8844' });
    ruta.flush({ modo: 'andando', pasos: [], geometria: [], avisos: [], metros: 0, segundos: 0 });
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    drenarTodo();
  });
});
