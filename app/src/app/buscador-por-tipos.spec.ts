import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, PortalCercano, Sitio, Via } from '@desplazame/tipos';
import { COLOR_DESTINO, COLOR_ORIGEN } from './iconos';
import { Buscador } from './buscador';

/**
 * ⭐ EL BUSCADOR POR TIPOS (Antonio, 24/08).
 *
 * Cada campo pasa a ser cuatro piezas: `[📍] [tipo ▾] [cajetín] [nº]`. El
 * desplegable **filtra** el cajetín a una sola categoría, el nº **solo existe**
 * con Dirección, y «Mi ubicación» vive en los dos lados.
 *
 * Lo que aquí se vigila es lo que puede mentir sin que se note:
 *
 * 1. **La pureza del filtro.** Una lista que dice «Farmacias» y trae una calle
 *    es peor que no filtrar: se elige sin leer. [DOC Pelias] `layers` acota la
 *    búsqueda, y aquí la acota de verdad — se comprueba que la petición lleva
 *    la capa Y que la otra ni se pide.
 * 2. **La ausencia del nº.** Con un sitio el número no se apaga: NO EXISTE
 *    [GOV.UK: conditional reveal]. Un campo apagado sigue estando, y un campo
 *    que está invita a rellenarlo.
 * 3. **Que el ⇅ cruza el tipo.** Si cruzara el texto y no el tipo, el otro
 *    lado quedaría con una farmacia escrita bajo la etiqueta «Dirección».
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

const HOSPITAL: Sitio = {
  codigo: 'Hospitales.9040',
  presentacion: 'Hospital Universitario Miguel Servet · Avda. Isabel La Católica, 3',
  categoria: 'Hospital',
  tipo: 'hospital',
};

const CERCANO: PortalCercano = {
  via: BURGOS,
  portal: PORTALES_BURGOS[0]!,
  metros: 12,
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

/**
 * La geolocalización, FINGIDA Y DICHA — igual que en `buscador.spec.ts`.
 *
 * jsdom no trae la API: `navigator.geolocation` es `undefined`. Aquí no se
 * prueba el GPS —el juez de eso es el portátil de Antonio—; se prueba que se le
 * PIDE y qué se hace con lo que contesta. Los umbrales son los del punto 6 y no
 * se tocan: precisión ≤ 100 m y ≤ 150 m al portal.
 */
function fingirGeolocalizacion(lat: number, lon: number, precision: number): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (exito: PositionCallback) => {
        exito({
          coords: { latitude: lat, longitude: lon, accuracy: precision },
          timestamp: 0,
        } as unknown as GeolocationPosition);
      },
    },
  });
}

describe('⭐ EL BUSCADOR POR TIPOS', () => {
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
    // A 12 m de precisión: dentro de los 100 m que exige el punto 6.
    fingirGeolocalizacion(41.6488, -0.8891, 12);
  });

  afterEach(() => {
    for (const r of http.match(() => true)) {
      if (!r.cancelled) r.flush([]);
    }
    http.verify();
  });

  /** El desplegable de tipo de un lado. */
  const tipoDe = (lado: 'Origen' | 'Destino'): HTMLSelectElement =>
    raiz.querySelector<HTMLSelectElement>(`select[name="tipo${lado}"]`)!;

  /** Cambia el tipo como lo haría una persona. */
  async function elegirTipo(lado: 'Origen' | 'Destino', valor: string): Promise<void> {
    const select = tipoDe(lado);
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  /** Las peticiones que hay abiertas ahora mismo, por su URL. */
  const abiertas = (): string[] =>
    http.match(() => true).map((r) => r.request.urlWithParams);

  function drenar(): void {
    for (const r of http.match(() => true)) {
      if (!r.cancelled) r.flush([]);
    }
    fixture.detectChanges();
  }

  // ── EL DESPLEGABLE ─────────────────────────────────────────────────────────

  it('⭐ los DOS campos traen su desplegable, ordenado y con sus cinco opciones', () => {
    // ⚠️ Eran CUATRO hasta el 25/08 y ahora son cinco: entran las bibliotecas.
    //
    // ⭐ Y desde el 25/08 van ORDENADAS: «Dirección» primera —es el defecto y
    // es de otra clase que las demás, que son categorías de sitio [GOV.UK: el
    // ejemplo canónico del `Select` es un filtro con su defecto marcado]— y el
    // resto **alfabético por su etiqueta** [PROPIO]. Antes salían en el orden
    // en que fueron llegando al proyecto, que no significa nada para quien mira
    // la lista.
    // Esta prueba existe para que una categoría nueva no se quede a medias — el
    // día que esté en el motor y no aquí, el buscador la tendría y nadie
    // podría pedirla.
    //
    // Se afirman las dos cosas, y son dos decisiones distintas: **el valor** lo
    // fija el contrato del motor (`TipoDeSitio`) y **la etiqueta** la escribe
    // quien hace la pantalla. Una lista que dijera «Bibliotecas» y mandara
    // `farmacia` pasaría una comprobación de solo etiquetas.
    for (const lado of ['Origen', 'Destino'] as const) {
      const select = tipoDe(lado);
      expect(select, `falta el desplegable de ${lado}`).not.toBeNull();
      const opciones = Array.from(select.options).map((o) => [o.value, o.textContent?.trim()]);
      expect(opciones).toEqual([
        ['via', 'Dirección'],
        ['biblioteca', 'Bibliotecas'],
        ['centro-salud', 'Centros de Salud'],
        ['farmacia', 'Farmacias'],
        ['hospital', 'Hospitales'],
      ]);

      // ⭐ Y el orden no es una lista escrita a mano: es **la regla**. Se
      // comprueba contra ella, no contra la copia de arriba — si mañana entra
      // una quinta categoría y alguien la pega al final, esto se pone rojo
      // aunque la lista literal se haya actualizado.
      const [primera, ...resto] = opciones;
      expect(primera).toEqual(['via', 'Dirección']);
      const etiquetas = resto.map(([, etiqueta]) => etiqueta as string);
      expect(etiquetas).toEqual([...etiquetas].sort((a, b) => a.localeCompare(b, 'es')));
      // Y el que viene puesto al abrir sigue siendo Dirección, que es lo que
      // busca casi todo el mundo [GOV.UK: el ejemplo canónico del `Select`].
      expect(select.value).toBe('via');
    }
  });

  it('⭐ por defecto, DIRECCIÓN [PROPIO]: al abrir se comporta como siempre', () => {
    // La decisión declarada: abrir la pantalla no cambia lo que hacía ayer.
    expect(tipoDe('Origen').value).toBe('via');
    expect(tipoDe('Destino').value).toBe('via');
  });

  // ── LA PUREZA DEL FILTRO ───────────────────────────────────────────────────

  it('⭐ con DIRECCIÓN se piden vías y NO se pide la capa de sitios', async () => {
    await teclear('calleDestino', 'far');

    const urls = abiertas();
    expect(urls.filter((u) => u.startsWith('/api/vias')).length).toBe(1);
    expect(urls.filter((u) => u.startsWith('/api/sitios')).length).toBe(0);
    drenar();
  });

  it('⭐ con FARMACIAS se pide la capa CON su filtro, y NO se piden vías', async () => {
    await elegirTipo('Destino', 'farmacia');
    await teclear('calleDestino', 'navarra');

    const urls = abiertas();
    expect(urls.filter((u) => u.startsWith('/api/vias')).length).toBe(0);
    const sitios = urls.filter((u) => u.startsWith('/api/sitios'));
    expect(sitios.length).toBe(1);
    expect(sitios[0]).toContain('capa=farmacia');
    drenar();
  });

  it('⭐ y cada categoría manda LA SUYA', async () => {
    for (const [valor, lado, campo] of [
      ['hospital', 'Origen', 'calleOrigen'],
      ['centro-salud', 'Destino', 'calleDestino'],
    ] as const) {
      await elegirTipo(lado, valor);
      await teclear(campo, 'salud');
      expect(abiertas().find((u) => u.startsWith('/api/sitios'))).toContain(`capa=${valor}`);
      drenar();
    }
  });

  it('⭐ la lista filtrada trae SOLO iconos de su tipo', async () => {
    await elegirTipo('Destino', 'hospital');
    await teclear('calleDestino', 'miguel');
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([HOSPITAL]);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    const iconos = Array.from(
      raiz.querySelectorAll<SVGElement>('[data-campo="calleDestino"] .sugerencia svg[data-icono]'),
    ).map((s) => s.getAttribute('data-icono'));
    expect(iconos).toEqual(['hospital']);
    drenar();
  });

  // ── LOS ICONOS DENTRO DE LAS OPCIONES ──────────────────────────────────────
  //
  // [MDN · Customizable select elements] Un `select` con `appearance:
  // base-select` deja meter contenido dentro de sus `option`, así que el icono
  // de cada clase entra donde de verdad se elige y no solo donde ya se ha
  // elegido. Sin librerías, sin `div` haciéndose pasar por un desplegable: es
  // el `select` nativo, con más cosas dentro.
  //
  // ⚠️ Estas pruebas corren en jsdom, que **no soporta `base-select`**. Eso las
  // hace más útiles de lo que parece: comprueban el DOM —que es lo que
  // sobrevive en cualquier navegador— y de paso miran el caso degradado, que es
  // el que ve quien no tenga soporte.

  it('⭐ cada opción lleva EL ICONO de su clase, dentro de la opción', () => {
    for (const lado of ['Origen', 'Destino'] as const) {
      const iconos = Array.from(
        tipoDe(lado).querySelectorAll<SVGElement>('option svg[data-icono]'),
      ).map((svg) => svg.getAttribute('data-icono'));
      expect(iconos, `los iconos del desplegable de ${lado}`).toEqual([
        'via',
        'biblioteca',
        'centro-salud',
        'farmacia',
        'hospital',
      ]);
    }
  });

  it('⭐ LA CHINCHETA cambia de color según el campo: verde origen, rojo destino', () => {
    // [osm.org] Es la convención ya firmada de la casa, y aquí gana su tercer
    // sitio: el desplegable dice de qué color va a salir eso en el mapa ANTES
    // de elegirlo. Los iconos de sitio, en cambio, son los mismos en los dos
    // campos: una farmacia es verde vaya donde vaya.
    const dePapel = (lado: 'Origen' | 'Destino', clase: string) =>
      tipoDe(lado)
        .querySelector(`option svg[data-icono="${clase}"] path`)!
        .getAttribute('fill');

    expect(dePapel('Origen', 'via')).toBe(COLOR_ORIGEN);
    expect(dePapel('Destino', 'via')).toBe(COLOR_DESTINO);
    expect(dePapel('Origen', 'via')).not.toBe(dePapel('Destino', 'via'));

    // Y las cuatro clases de sitio, idénticas en los dos campos.
    for (const clase of ['biblioteca', 'centro-salud', 'farmacia', 'hospital']) {
      expect(dePapel('Origen', clase), clase).toBe(dePapel('Destino', clase));
    }

    // ⭐ Y el precio de esa convención, vigilado: en el desplegable del ORIGEN
    // la chincheta y la cruz de farmacia salen **del mismo verde**. Es a
    // sabiendas —son dos convenciones que aterrizan en el mismo color— y lo
    // que las separa es la FORMA, que es el segundo diferenciador que pide
    // [osm.org#2787]. Si algún día los dos caminos coincidieran, en ese
    // desplegable habría dos opciones indistinguibles.
    const forma = (lado: 'Origen' | 'Destino', clase: string) =>
      tipoDe(lado).querySelector(`option svg[data-icono="${clase}"] path`)!.getAttribute('d');
    expect(dePapel('Origen', 'via')).toBe(dePapel('Origen', 'farmacia'));
    expect(forma('Origen', 'via')).not.toBe(forma('Origen', 'farmacia'));
  });

  it('⭐ LA REGLA DE ORO: cada opción conserva su texto, y el icono no se anuncia', () => {
    // [WebKit, sobre el select personalizable] la opción **conserva su texto**:
    // el icono se suma, no sustituye. Es lo que hace que esto siga funcionando
    // en un navegador sin soporte —que pinta el select clásico y solo lee el
    // texto— y lo que evita que un lector de pantalla anuncie la misma cosa
    // dos veces: el SVG va `aria-hidden`.
    for (const lado of ['Origen', 'Destino'] as const) {
      const opciones = Array.from(tipoDe(lado).options);
      // ⭐ `textContent` es EXACTAMENTE lo que enseña un select clásico: si el
      // icono se hubiera comido la etiqueta, esto saldría vacío.
      expect(opciones.map((o) => o.textContent?.trim())).toEqual([
        'Dirección',
        'Bibliotecas',
        'Centros de Salud',
        'Farmacias',
        'Hospitales',
      ]);
      for (const o of opciones) {
        expect(o.querySelector('svg')?.getAttribute('aria-hidden'), o.value).toBe('true');
      }
    }
  });

  // ── LA CAPA NUEVA, HASTA EL MOTOR ──────────────────────────────────────────

  it('⭐ y la capa nueva llega al motor con su nombre', async () => {
    // El desplegable no vale de nada si el filtro no viaja. `capa=biblioteca`
    // es el nombre que el contrato le da, no una etiqueta traducida.
    await elegirTipo('Destino', 'biblioteca');
    await teclear('calleDestino', 'cubit');
    const pedidas = http.match((q) => q.url.startsWith('/api/sitios'));
    expect(pedidas.length).toBe(1);
    expect(pedidas[0]!.request.url).toContain('capa=biblioteca');
    // Y no se piden vías: una lista es de una sola clase.
    expect(http.match((q) => q.url.startsWith('/api/vias')).length).toBe(0);
    for (const r of pedidas) r.flush([]);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    drenar();
  });

  // ── CAMBIAR DE TIPO LIMPIA ─────────────────────────────────────────────────

  it('⭐ cambiar de tipo LIMPIA el cajetín y lo que hubiera resuelto', async () => {
    // Cambiar de carril es empezar la pregunta. Sin esto quedaría una farmacia
    // resuelta bajo la etiqueta «Dirección», que es una mentira que además
    // desbloquearía «Generar».
    await elegirTipo('Destino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([FARMACIA]);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    raiz
      .querySelector<HTMLElement>('[data-campo="calleDestino"] .sugerencia')!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
    drenar();
    expect(campoDe(raiz, 'calleDestino').value).toBe(FARMACIA.presentacion);

    await elegirTipo('Destino', 'via');
    expect(campoDe(raiz, 'calleDestino').value).toBe('');
    // Y no queda nada resuelto por debajo: «Generar» sigue bloqueado.
    expect(raiz.querySelector<HTMLButtonElement>('.generar')!.disabled).toBe(true);
    drenar();
  });

  // ── EL Nº, POR REVELADO CONDICIONAL ────────────────────────────────────────

  it('⭐ el nº EXISTE con Dirección y NO EXISTE con un sitio [GOV.UK]', async () => {
    // Ausencia por estructura, no apagado: un campo deshabilitado sigue en la
    // página, ocupa sitio y se lee como «esto habría que rellenarlo».
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    expect(raiz.querySelectorAll('app-selector-portal').length).toBe(2);

    await elegirTipo('Destino', 'farmacia');
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    // Y el componente entero se ha ido, no solo su `input`: es ausencia por
    // estructura, que es lo que pide el patrón.
    expect(raiz.querySelectorAll('app-selector-portal').length).toBe(1);

    // Y vuelve al volver a Dirección.
    await elegirTipo('Destino', 'via');
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    drenar();
  });

  it('el nº de un lado no depende del otro', async () => {
    await elegirTipo('Origen', 'hospital');
    expect(raiz.querySelector('input[name="portalOrigen"]')).toBeNull();
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
    drenar();
  });

  // ── MI UBICACIÓN, EN LOS DOS ───────────────────────────────────────────────

  it('⭐ «Mi ubicación» está en los DOS campos', () => {
    expect(raiz.querySelectorAll('.ubicacion').length).toBe(2);
  });

  it('⭐ y en el DESTINO rellena vía y portal, como en el origen', async () => {
    const boton = raiz.querySelectorAll<HTMLButtonElement>('.ubicacion')[1]!;
    boton.click();
    fixture.detectChanges();

    http.expectOne((r) => r.url.startsWith('/api/portal-cercano')).flush(CERCANO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    expect(campoDe(raiz, 'calleDestino').value).toBe('CALLE BURGOS');
    expect(campoDe(raiz, 'portalDestino').value).toBe('2');
    drenar();
  });

  it('⭐ y pone el tipo en DIRECCIÓN: una ubicación ES una dirección', async () => {
    await elegirTipo('Destino', 'farmacia');
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();

    raiz.querySelectorAll<HTMLButtonElement>('.ubicacion')[1]!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url.startsWith('/api/portal-cercano')).flush(CERCANO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    expect(tipoDe('Destino').value).toBe('via');
    expect(campoDe(raiz, 'portalDestino').value).toBe('2');
    drenar();
  });

  // ── EL ⇅ CRUZA EL TIPO ─────────────────────────────────────────────────────

  it('⭐ el ⇅ cruza el TIPO, no solo el texto', async () => {
    await elegirTipo('Origen', 'hospital');
    drenar();

    raiz.querySelector<HTMLButtonElement>('.invertir')!.click();
    fixture.detectChanges();

    expect(tipoDe('Origen').value).toBe('via');
    expect(tipoDe('Destino').value).toBe('hospital');
    // Y el nº se muda con él: aparece donde ahora hay Dirección y desaparece
    // donde ahora hay un sitio.
    expect(raiz.querySelector('input[name="portalOrigen"]')).not.toBeNull();
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    drenar();
  });
});
