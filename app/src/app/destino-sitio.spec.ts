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
    // ⭐ La capa de sitios se drena antes de verificar, y SOLO ella.
    //
    // Desde el foco (23/08) resolver un lado despierta al otro: su código pasa
    // a ser el foco de las sugerencias del contrario, la URL del recurso
    // cambia y se vuelve a pedir sin que nadie teclee [Pelias focus.point]. Es
    // lo que se quería —elegir el origen reordena la lista del destino— y deja
    // una petición al final de casi cada prueba de este fichero.
    //
    // Las CANCELADAS se saltan: el ⇅ mueve los dos lados de golpe y el recurso
    // aborta la anterior al recalcular la URL. Contestar una cancelada revienta.
    //
    // Solo `/api/sitios`: una de vías o de portales sin contestar tiene que
    // seguir haciendo protestar a `verify()`, que es para lo que está.
    for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
      if (!cap.cancelled) {
        cap.flush([]);
      }
    }
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
    // Las canceladas se saltan: cambiar el foco mientras hay una en vuelo la
    // aborta, y contestar a una abortada revienta. `match()` las sigue dando.
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) {
      if (!r.cancelled) r.flush(vias);
    }
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) {
      if (!r.cancelled) r.flush(sitios);
    }
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
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) {
      if (!r.cancelled) r.flush([]);
    }
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) {
      if (!r.cancelled) r.flush([]);
    }
    fixture.detectChanges();
  }

  /** Elige un sitio en el campo que se le diga. */

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

  async function elegirSitioEn(campo: string, sitio: Sitio = FARMACIA): Promise<void> {
    await ponerTipo(campo, 'farmacia');
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

  // ── EL FOCO ────────────────────────────────────────────────────────────────
  //
  // ⭐ [DOC Pelias] `focus.point` *«will prioritize results closer to the focus
  // point»*. Aquí el foco de un campo es EL OTRO EXTREMO, y viaja como CÓDIGO:
  // la pantalla no conoce coordenadas —el contrato le da códigos— y quien sabe
  // convertir uno en el otro es el motor.

  /**
   * La consulta de sitios que pidió ESTE texto.
   *
   * Se busca por la `q` y no por «la última», que fue el primer intento y era
   * mentira: los dos campos piden a la vez —al elegir, el texto del otro
   * cambia y su eco sale detrás—, así que «la última» era la del campo que no
   * se estaba mirando.
   */
  function consultaDeSitiosCon(texto: string): string {
    const suyas = http.match(
      (r) => r.url.startsWith('/api/sitios') && r.url.includes(`q=${encodeURIComponent(texto)}`),
    );
    return suyas.length > 0 ? suyas[suyas.length - 1]!.request.urlWithParams : '(ninguna)';
  }

  it('⭐ EL FOCO VIAJA: con el origen resuelto, el destino lo manda', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');

    expect(consultaDeSitiosCon('navarra')).toContain('foco=Portales.5140a');
    await contestar([], []);
  });

  it('⭐ y un SITIO en el origen enfoca igual, por su código', async () => {
    await elegirSitioEn('calleOrigen');
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');

    expect(consultaDeSitiosCon('navarra')).toContain('foco=Farmacias.8691');
    await contestar([], []);
  });

  it('⭐ SIN el otro lado resuelto NO hay foco: no se inventa un punto', async () => {
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');

    expect(consultaDeSitiosCon('navarra')).not.toContain('foco=');
    await contestar([], []);
  });

  it('⭐ MEDIO LADO no es un punto: calle sin portal no enfoca', async () => {
    // Es la parte que se equivoca sola. Una calle elegida ya tiene código, y
    // sería fácil mandarlo; pero una calle entera no es un sitio desde el que
    // medir —Avenida de Navarra tiene más de un kilómetro—, así que hasta que
    // no hay portal no hay foco.
    await teclear('calleOrigen', 'burgos');
    await contestar([BURGOS], []);
    pulsar('calleOrigen', 'via');
    await drenarEco();
    for (const r of http.match(`/api/portales?via=${BURGOS.codigo}`)) r.flush(PORTALES_BURGOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    expect(consultaDeSitiosCon('navarra')).not.toContain('foco=');
    await contestar([], []);
  });

  it('⭐ EL FOCO CRUZA CON EL ⇅, porque sale del lado y no del campo', async () => {
    // El ⇅ intercambia los lados enteros, así que el que enfocaba pasa a estar
    // enfocado. No hay una línea que hable de ello: `focoDe` pregunta al lado.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    invertir();
    // El ⇅ lleva la vía al otro lado, y allí despierta a SU selector de
    // portales, que pide los suyos. No es cosa del foco: pasa desde el punto 6.
    for (const r of http.match(`/api/portales?via=${BURGOS.codigo}`)) r.flush(PORTALES_BURGOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    await ponerTipo('calleOrigen', 'farmacia');
    await teclear('calleOrigen', 'navarra');

    expect(consultaDeSitiosCon('navarra')).toContain('foco=Portales.5140a');
    await contestar([], []);
  });

  it('⭐ LOS DOS campos piden la capa de sitios', async () => {
    // Era la prueba de la asimetría —«el destino sí y el origen no»— y la
    // corrección del 23/08 la derogó: ahora se exige lo contrario, que los dos
    // pregunten. El motivo está en la cabecera.
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(1);
    await contestar([], [FARMACIA]);
    await drenarEco();

    await ponerTipo('calleOrigen', 'farmacia');
    await teclear('calleOrigen', 'navarra');
    expect(http.match((q) => q.url.startsWith('/api/sitios')).length).toBe(1);
    await contestar([], [FARMACIA]);
    await drenarEco();
  });

  it('⭐ una lista NUNCA mezcla capas: la mezclada murió el 24/08', async () => {
    // ⚠️ Esta prueba EXIGÍA LO CONTRARIO hasta el 24/08: que en la misma lista
    // se vieran una calle y una farmacia, distinguidas por su `data-capa`. El
    // buscador por tipos la deroga, y fue decisión de Antonio tomada a
    // sabiendas: el desplegable elige una categoría y el cajetín deja de
    // mezclar [DOC Pelias: `layers`].
    //
    // El atributo sigue —lo usan los iconos y estas pruebas— pero ahora todas
    // las líneas de una lista traen el mismo valor. Se comprueba en las dos
    // direcciones, porque el fallo puede ser por cualquiera de las dos: una
    // calle colada bajo «Farmacias», o una farmacia bajo «Dirección».
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);
    let o = opciones('calleDestino');
    expect(o.length).toBe(1);
    expect(o[0]!.capa).toBe('sitio');
    await drenarEco();

    await ponerTipo('calleDestino', 'via');
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], [FARMACIA]);
    o = opciones('calleDestino');
    expect(o.length).toBe(1);
    expect(o[0]!.capa).toBe('via');
    await drenarEco();
  });

  // ── EL PORTAL CONDICIONAL, ABSORBIDO POR EL REVELADO ───────────────────────
  //
  // ⚠️ Aquí había CUATRO pruebas de la regla del portal condicional (19/08):
  // que un sitio APAGA la casilla de número, en los dos lados, y que la deja
  // limpia. Las cuatro las deroga el revelado condicional del 24/08 [GOV.UK]:
  // con un sitio **la casilla ya no existe**, así que no hay nada que apagar ni
  // nada que limpiar. Su sucesora vive en `buscador-por-tipos.spec.ts` y exige
  // lo que ahora es verdad — la ausencia por estructura.
  //
  // Lo que NO se pierde es la pregunta de fondo, que sigue teniendo respuesta:
  // ¿lo que viaja es lo que se lee? Eso es la prueba de abajo.

  it('⭐ tras un sitio, volver a Dirección manda la DIRECCIÓN y no el sitio viejo', async () => {
    // Era la mitad valiosa de «elegir una calle apaga el sitio»: ya no se puede
    // tener las dos cosas puestas —el campo está en un carril o en el otro—,
    // pero sí se puede cambiar de carril, y lo que viaje tiene que ser lo
    // último que se ve, no lo primero que se eligió.
    await elegirSitioEn('calleOrigen');
    expect(campoDe(raiz, 'calleOrigen').value).toBe('Farmacia · Avda. de Navarra, 65');

    await ponerTipo('calleOrigen', 'via');
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    expect(campoDe(raiz, 'calleOrigen').value).toBe('CALLE BURGOS');

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
    // ⚠️ Decía «la casilla APAGADA viaja con su lado». Con el revelado
     // condicional (24/08) no hay casilla apagada que viajar: **la casilla no
     // está**. Lo que se comprueba ahora es que se ha ido del lado donde está
     // el sitio y ha vuelto al lado que quedó en Dirección.
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    expect(raiz.querySelector('input[name="portalOrigen"]')).not.toBeNull();
  });

  it('⭐ ⇅ sitio↔dirección: se cruzan, y cada casilla queda como toca', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirSitioEn('calleDestino');
    expect(campoDe(raiz, 'portalOrigen').value).toBe('2');
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();

    invertir();

    // El sitio está ahora en el origen y la dirección en el destino, y las dos
    // casillas se han cambiado el estado con ellos.
    expect(campoDe(raiz, 'calleOrigen').value).toBe('Farmacia · Avda. de Navarra, 65');
    expect(campoDe(raiz, 'calleDestino').value).toBe('CALLE BURGOS');
    // La casilla se MUDA con su lado: desaparece de donde ahora hay un sitio
    // y aparece donde ahora hay una dirección, con su número dentro.
    expect(raiz.querySelector('input[name="portalOrigen"]')).toBeNull();
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
    // Con sitio en los dos lados no hay ninguna casilla de número en la
    // pantalla: ni apagada ni encendida, ninguna.
    expect(raiz.querySelectorAll('app-selector-portal').length).toBe(0);
    expect(generar().disabled).toBe(false);
  });

  it('⭐ ⇅ un BORRADOR cruza como borrador, sin inventarse un sitio', async () => {
    // Texto escrito que no corresponde a nada: cruza siendo texto. Inventarle
    // un sitio «porque ya estaba escrito» sería el fallo de la nº4 con otro
    // disfraz.
    // Se escribe con el campo en «Farmacias», que es donde alguien escribiría
    // el nombre de una: el borrador es un nombre que no casa con nada.
    await ponerTipo('calleOrigen', 'farmacia');
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
