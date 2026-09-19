import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { rutas } from './rutas';

describe('App — la cáscara, su página y el comodín', () => {
  let http: HttpTestingController;
  let peticiones: string[];
  const fetchDeVerdad = globalThis.fetch;

  beforeEach(async () => {
    // Se finge `fetch` —que es con lo que se pedían las capas, no con
    // HttpClient— y se cuenta cada llamada sin contestar ninguna. Lo que se
    // mide es CUÁNTAS se piden al montar la página, no qué traen.
    peticiones = [];
    globalThis.fetch = ((url: string) => {
      peticiones.push(String(url));
      return new Promise<Response>(() => {});
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

  /** Monta la cáscara y navega, que es como se llega a cualquier página. */
  async function ir(camino: string) {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    await router.navigate([camino]);
    await fixture.whenStable();
    return { fixture, router, raiz: fixture.nativeElement as HTMLElement };
  }

  /**
   * ⚠️ Los radios del selector se descuentan desde el 30/08: al pasar los modos
   * de `<button>` a grupo de radios entraron seis `<input>` que no son campos
   * del formulario. Lo que esta juez vigila —que la raíz sirve el buscador con
   * sus cuatro campos— no ha cambiado; el filtro solo dice cuáles son campos.
   */
  it('la ruta raíz sigue sirviendo el buscador, con sus cuatro campos', async () => {
    const { raiz } = await ir('/');

    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    const nombres = Array.from(raiz.querySelectorAll<HTMLInputElement>('input'))
      .filter((i) => i.type !== 'radio')
      .map((i) => i.name);
    expect(nombres).toEqual(['calleOrigen', 'portalOrigen', 'calleDestino', 'portalDestino']);
  });

  it('una dirección que no existe cae en el buscador, no en una pantalla en blanco', async () => {
    const { raiz } = await ir('/loquesea');
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
  });

  /**
   * ⭐ RE-FIRMADA EL 19/09, Y MORDIÓ ANTES — `expected null not to be null`.
   *
   * ═══════════════════════════════════════════════════════════════════════
   *  **Decía**: *«`/visor` ya no existe, y cae en el buscador como cualquier
   *  otra»*. Nació el 22/08, cuando el visor se retiró de la app, y tenía
   *  razón durante veintiocho días.
   *
   *  **Lo que cambió** es la letra, no el código: Antonio firmó el 19/09 la
   *  vuelta del visor como intranet (alcance B, acceso solo-local). Así que
   *  `/visor` **vuelve a existir** — en la construcción local, que es la que
   *  corren estas pruebas. Enrojeció en cuanto la ruta entró, que es
   *  exactamente lo que se le pedía a esta jueza.
   *
   *  **Lo que sigue vigilando, y por qué NO se borra:** que la ruta esté
   *  ENCHUFADA. Un `loadComponent` mal escrito, un `RUTAS_DE_INTRANET` que
   *  no se derrame en la lista, un comodín colocado por encima — cualquiera
   *  de esas tres deja `/visor` cayendo en el buscador otra vez, y sin esta
   *  jueza se descubriría abriendo el navegador.
   *
   *  ⚠️ **Y su mitad de producción no se ha perdido**: vive en
   *     `rutas-intranet.spec.ts`, que monta la app con el fichero VACÍO —el
   *     que `fileReplacements` pone en producción— y comprueba que ahí
   *     `/visor` y `/panel` sí caen en el buscador.
   * ═══════════════════════════════════════════════════════════════════════
   */
  it('⭐ /visor existe otra vez, y en local monta el visor de capas', async () => {
    const { raiz } = await ir('/visor');
    expect(raiz.querySelector('app-visor')).not.toBeNull();
  });

  /**
   * ⭐ Y LA PORTADA NO LO MONTA, que es la otra mitad del molde.
   *
   * El mismo par que guardan `/identidad` y `/creditos`. Aquí importa MÁS que
   * en ninguna: si alguien cambiara el `loadComponent` del visor por un
   * `component`, `Visor` se importaría de forma estática, se llevaría a
   * `MapaDeCapas` y al servicio `Capas` al paquete de la portada, y las dos
   * juezas de «cero peticiones» seguirían en verde —el código empaquetado no
   * se pide por `fetch`—. Ésta es la que lo vería.
   */
  it('⭐ la portada NO monta el visor de capas', async () => {
    const { raiz } = await ir('/');
    expect(raiz.querySelector('app-visor')).toBeNull();
  });

  /**
   * ⭐ LO QUE LA RAÍZ **NO** SE BAJA.
   *
   * Esta prueba vigilaba lo contrario: que las diecisiete capas de
   * verificación —portales, grafo, carriles, postes, trazados, paradas,
   * aparcabicis, aparcamotos, regulado, zonas, reservas y las seis del BiZi—
   * no se volvieran a pedir al ir al visor y volver. **El visor se retiró de la
   * app el 22/08** y se reserva para la intranet (punto 14 del plan), así que
   * lo que vigilaba ya no existe.
   *
   * Su reverso sí existe, y es más importante: **abrir la raíz no baja ni un
   * byte de `app/data/`**. Eran 40,70 MB en 17 peticiones, el 99,1 % de todo lo
   * que descargaba la página. Se cuenta a cero y no «a pocas»: cualquier
   * número distinto de cero significa que algo volvió a colgarse del andamio.
   */
  it('⭐ abrir la raíz NO pide ni un byte de /data/', async () => {
    // ⚠️ RE-APUNTADA EL 19/09: decía `/datos/`, y esa carpeta ya no existe.
    //    El visor de agosto pedía de `/datos/`; al volver como intranet se
    //    resolvió la discrepancia con el resto de la app —que pide de `data/`
    //    desde el 2/09, por la ZBE— a UN SOLO nombre, `data`. Una jueza que
    //    filtra por una carpeta que nadie usa está verde por vacía.
    await ir('/');
    const datos = peticiones.filter((u) => u.includes('/data/'));
    expect(datos).toEqual([]);
  });

  /**
   * ⭐ Y CERO peticiones, no «cero de `/datos/`».
   *
   * El 23/08 nació `/panel`, que lee el manifiesto de frescura. Es un fichero
   * pequeño —unos 20 KB— y por eso mismo es la clase de cosa que se cuela en la
   * portada sin que nadie lo note: no se ve en el cronómetro, pero rompe la
   * regla igual. La ley del 22/08 no dice «poco»: dice **nada**.
   *
   * Se cuenta el total, no un patrón concreto, para que la próxima cosa que se
   * quiera colgar de la raíz tampoco pueda hacerlo en silencio.
   */
  it('⭐ abrir la raíz no pide NADA por `fetch`: ni datos, ni el manifiesto', async () => {
    await ir('/');
    expect(peticiones).toEqual([]);
  });

  /**
   * ⭐ (iv) EL GUARDIÁN, AHORA CON /identidad DELANTE (9/09, punto 15).
   *
   * La página de identidad visual nació con tokens, tablas, sondas y una letra
   * propia. Es exactamente la clase de cosa que engorda la portada sin que
   * nadie lo note — igual que el panel en su día—, y por eso entra con
   * `loadComponent`.
   *
   * ⚠️ Lo que se compra aquí es **el invariante, no el tamaño**: que la raíz
   *    NO la monte. Si alguien cambiara `loadComponent` por `component`, la
   *    juez de arriba —cero peticiones— seguiría en verde, porque el código
   *    empaquetado no se pide por `fetch`. Esta es la que lo vería.
   *
   *    Que la portada no ENGORDE es otra cosa, y no se puede pedir aquí: los
   *    tokens viven en el CSS global a propósito, así que la portada pesa más
   *    y va a seguir pesando más conforme el sistema crezca. Eso se **mide y
   *    se canta** en `e2e/identidad.mjs`, contra el censo del dist anterior.
   */
  it('⭐ la portada NO monta la página de identidad', async () => {
    const { raiz } = await ir('/');
    expect(raiz.querySelector('app-identidad')).toBeNull();
  });

  it('⭐ y /identidad sí la monta, que es su sitio', async () => {
    // El contraste, otra vez: si esto NO montara nada, la prueba de arriba
    // estaría pasando porque la página está rota, no porque la raíz sea limpia.
    const { raiz } = await ir('/identidad');
    expect(raiz.querySelector('app-identidad')).not.toBeNull();
  });

  it('⭐ y entrar en /identidad tampoco pide nada por `fetch`', async () => {
    // No lee ningún manifiesto ni ningún dato: los colores los saca del CSS
    // que ya viene en el paquete. Si algún día pidiera algo, que se vea.
    await ir('/identidad');
    expect(peticiones).toEqual([]);
  });

  /**
   * ⭐ (e) Y AHORA TAMBIÉN /creditos (10/09, remate 2 de la tanda 3).
   *
   * La página de créditos y fuentes nació el 10/09 para sacar del pie los
   * cuatro titulares y sus fórmulas, dejando en la franja sólo lo que la
   * política de teselas de OSM obliga a tener sobre el mapa. Entra por la misma
   * puerta que `/panel` y `/identidad`: `loadComponent`.
   *
   * ⚠️ Y aquí el invariante importa MÁS que en las otras dos, porque ésta sí
   *    lleva un enlace desde la portada. Un enlace no es una importación —el
   *    `href` no arrastra el componente—, pero es la clase de cosa que invita a
   *    «pues lo importo y ya». Esta juez es la que lo vería.
   */
  it('⭐ la portada NO monta la página de créditos', async () => {
    const { raiz } = await ir('/');
    expect(raiz.querySelector('app-creditos')).toBeNull();
  });

  it('⭐ y /creditos sí la monta, que es su sitio', async () => {
    // El mismo contraste que arriba: si esto no montara nada, la juez anterior
    // pasaría porque la página está rota, no porque la raíz sea limpia.
    const { raiz } = await ir('/creditos');
    expect(raiz.querySelector('app-creditos')).not.toBeNull();
  });

  it('⭐ y entrar en /creditos tampoco pide nada por `fetch`', async () => {
    // Es prosa y enlaces: no lee manifiestos, ni datos, ni nada de nadie.
    await ir('/creditos');
    expect(peticiones).toEqual([]);
  });

  /**
   * ⭐ Y LA PORTADA LLEVA HASTA ELLA, que es la mitad que el resto no pide.
   *
   * `/panel` y `/identidad` se llegan escribiendo la URL a propósito. Ésta no
   * puede: [RD 1495/2011] pide el aviso legal accesible **de forma permanente,
   * fácil y directa**. Un aviso al que sólo se llega de memoria no lo está.
   *
   * ⚠️ **ESTA JUEZ DECÍA «UNO SOLO» Y MORDIÓ EL 11/09**, con un `expected 2 to
   *    be 1`. Y tenía razón en morder: había cambiado la letra, no la ley.
   *
   *    En móvil la franja del pie desaparece —ese borde lo ocupa la barra de
   *    pestañas—, así que la puerta al aviso legal se muda al final del scroll
   *    del formulario. Son **dos puertas en el DOM y UNA pintada**: cada una se
   *    apaga con `display: none` en el ancho de la otra. Lo que la ley pide es
   *    que haya acceso permanente, fácil y directo, y lo hay en los dos anchos.
   *
   *    Lo que se compra aquí es el DOM, que es lo que jsdom puede ver: que
   *    están las dos y cada una en su sitio. Que solo una se PINTE se mide en
   *    Chrome, que es donde hay media queries — `e2e/esqueleto.mjs`.
   */
  it('⭐ la portada tiene DOS puertas a /creditos: la del pie y la de móvil', async () => {
    const { raiz } = await ir('/');
    const pie = raiz.querySelector('footer.creditos');
    expect(pie).not.toBeNull();
    expect(pie?.querySelector('a[href="/creditos"]')).not.toBeNull();

    // La de móvil, al final del formulario y dentro de él.
    const puerta = raiz.querySelector('.puerta-creditos a[href="/creditos"]');
    expect(puerta).not.toBeNull();
    expect(puerta?.closest('form.buscador')).not.toBeNull();

    // Y ninguna más: dos, y las dos declaradas.
    expect(raiz.querySelectorAll('a[href="/creditos"]').length).toBe(2);
  });

  /**
   * ⭐ RE-APUNTADA EL 19/09: `/panel` sigue aquí, pero **ya no es público**.
   *
   * El panel de frescura se mudó a la intranet con la firma de Antonio, y su
   * ruta vive ahora en `rutas-intranet.ts`. Lo que esta jueza comprueba no
   * cambia —que al entrar se pide el manifiesto, una vez— pero **su sitio sí**:
   * en producción esta ruta no existe, así que lo que se está midiendo es la
   * construcción LOCAL, que es la única donde el panel se abre.
   *
   * Sigue siendo el contraste de la jueza de «cero peticiones»: si esto NO
   * pidiera nada, aquélla estaría pasando por la razón equivocada —porque el
   * panel no funciona, no porque la raíz sea limpia—.
   */
  it('⭐ y el manifiesto se pide al entrar en /panel, que en local es su sitio', async () => {
    await ir('/panel');
    expect(peticiones.filter((u) => u.includes('datapackage.json')).length).toBe(1);
  });

  /**
   * ⭐ Y EL VISOR SÍ BAJA DATO, que es justo a lo que viene.
   *
   * El tercero del molde de rutas perezosas, y aquí **al revés que en
   * `/identidad` y `/creditos`**: a aquéllas se les exige no pedir nada; a
   * ésta se le exige pedir. Son los 17 ficheros de `app/data/` que pintan las
   * catorce capas — 40,72 MiB que **por eso mismo** no pueden colgar de la
   * portada, y por eso esta página no viaja a producción.
   *
   * Se cuenta que son 17 y que todas salen de `/data/`: si alguien añadiera
   * una capa nueva sin ficha, o cambiara la carpeta, se vería aquí.
   */
  it('⭐ y entrar en /visor sí pide sus 17 ficheros de datos', async () => {
    await ir('/visor');
    expect(peticiones.length).toBe(17);
    expect(peticiones.every((u) => u.startsWith('/data/'))).toBe(true);
  });
});
